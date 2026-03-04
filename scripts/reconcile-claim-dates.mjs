import fs from "node:fs/promises";
import path from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import postgres from "postgres";

const execFile = promisify(execFileCallback);
const sql = postgres(process.env.DATABASE_URL);

const claimId = Number.parseInt(process.argv[2] ?? "147", 10);
const apply = process.argv.includes("--apply");
const workDir = path.join(process.cwd(), "tmp", `claim-${claimId}-date-reconcile`);

const primaryLabels = [
  /date of issue/i,
  /invoice date/i,
  /issued on/i,
  /paid on/i,
  /payment date/i,
  /发出日期/,
  /开票日期/,
];

const fallbackLabels = [
  /date due/i,
  /billing date/i,
  /statement date/i,
];

function toYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSgDateFromIso(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

function parseDateString(raw) {
  const normalized = raw.trim();

  const zhMatch = normalized.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (zhMatch) {
    const [, year, month, day] = zhMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(`${normalized} 00:00:00 GMT+0800`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function extractDateFromLine(line) {
  const englishMatch = line.match(/[A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}/);
  if (englishMatch?.[0]) {
    const parsed = parseDateString(englishMatch[0]);
    if (parsed) {
      return { date: parsed, matchedText: englishMatch[0] };
    }
  }

  const zhMatch = line.match(/\d{4}年\d{1,2}月\d{1,2}日/);
  if (zhMatch?.[0]) {
    const parsed = parseDateString(zhMatch[0]);
    if (parsed) {
      return { date: parsed, matchedText: zhMatch[0] };
    }
  }

  return null;
}

function findDateNearLabels(lines, labels, source) {
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!labels.some((label) => label.test(line))) {
      continue;
    }

    for (let j = i; j < Math.min(lines.length, i + 12); j += 1) {
      const candidate = extractDateFromLine(lines[j]);
      if (candidate) {
        return {
          date: candidate.date,
          source,
          matchedText: `${line}\n${candidate.matchedText}`,
        };
      }
    }
  }

  return null;
}

function findDateInText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const primary = findDateNearLabels(lines, primaryLabels, "text-primary");
  if (primary) {
    return primary;
  }

  const fallback = findDateNearLabels(lines, fallbackLabels, "text-fallback");
  if (fallback) {
    return fallback;
  }

  return null;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
}

async function extractPdfText(filePath) {
  const { stdout } = await execFile("pdftotext", [filePath, "-"]);
  return stdout;
}

async function extractPdfInfo(filePath) {
  const { stdout } = await execFile("pdfinfo", [filePath]);
  return stdout;
}

function parseCreationDate(pdfInfoText) {
  const match = pdfInfoText.match(/CreationDate:\s+.+?([A-Z][a-z]{2}\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4})/);
  if (!match?.[1]) {
    return null;
  }

  const parsed = new Date(match[1]);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

async function resolveDateForAttachment(row) {
  const urlPath = new URL(row.url).pathname;
  const fileExt = path.extname(urlPath).toLowerCase();
  const localName = `${row.item_id}-${path.basename(urlPath)}`;
  const localPath = path.join(workDir, localName);

  await downloadFile(row.url, localPath);

  if (fileExt === ".pdf") {
    const [pdfText, pdfInfo] = await Promise.all([
      extractPdfText(localPath),
      extractPdfInfo(localPath),
    ]);

    const textResult = findDateInText(pdfText);
    if (textResult) {
      return {
        localPath,
        detectedDate: toYmd(textResult.date),
        source: textResult.source,
        evidence: textResult.matchedText,
      };
    }

    const creationDate = parseCreationDate(pdfInfo);
    if (creationDate) {
      return {
        localPath,
        detectedDate: toYmd(creationDate),
        source: "pdf-metadata",
        evidence: pdfInfo.split("\n").find((line) => line.startsWith("CreationDate:")) ?? "",
      };
    }

    return {
      localPath,
      detectedDate: null,
      source: "unresolved-pdf",
      evidence: "",
    };
  }

  return {
    localPath,
    detectedDate: null,
    source: "unsupported-file",
    evidence: "",
  };
}

async function main() {
  await ensureDir(workDir);

  const rows = await sql.unsafe(
    `select
      ci.id as item_id,
      ci.claim_id,
      ci.date as item_date,
      ci.details,
      a.id as attachment_id,
      a.file_name,
      a.url
    from claim_items ci
    left join attachments a on a.claim_item_id = ci.id
    where ci.claim_id = $1
    order by ci.date, ci.id, a.id`,
    [claimId],
  );

  const backupPath = path.join(workDir, "before.json");
  await fs.writeFile(backupPath, JSON.stringify(rows, null, 2));

  const results = [];
  for (const row of rows) {
    if (!row.url) {
      results.push({
        ...row,
        currentSgDate: formatSgDateFromIso(row.item_date),
        detectedDate: null,
        source: "no-attachment",
        evidence: "",
      });
      continue;
    }

    const detected = await resolveDateForAttachment(row);
    results.push({
      ...row,
      currentSgDate: formatSgDateFromIso(row.item_date),
      ...detected,
    });
  }

  const reportPath = path.join(workDir, "report.json");
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));

  const updates = results.filter(
    (row) => row.detectedDate && row.currentSgDate !== row.detectedDate,
  );
  const unresolved = results.filter((row) => !row.detectedDate);

  console.log(`claim ${claimId}`);
  console.log(`backup: ${backupPath}`);
  console.log(`report: ${reportPath}`);
  console.log(`rows: ${results.length}`);
  console.log(`updates: ${updates.length}`);
  console.log(`unresolved: ${unresolved.length}`);

  for (const row of updates) {
    console.log(
      `${row.item_id}\t${row.currentSgDate}\t=>\t${row.detectedDate}\t${row.source}\t${row.file_name}`,
    );
  }

  for (const row of unresolved) {
    console.log(
      `UNRESOLVED\t${row.item_id}\t${row.file_name ?? "no-file"}\t${row.source}\t${row.localPath ?? ""}`,
    );
  }

  if (!apply) {
    return;
  }

  for (const row of updates) {
    await sql.unsafe(
      `update claim_items set date = ($1::date)::timestamp, updated_at = now() where id = $2`,
      [row.detectedDate, row.item_id],
    );
  }

  console.log(`applied ${updates.length} updates`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
