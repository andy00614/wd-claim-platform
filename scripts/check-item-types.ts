import { db } from "../src/lib/db/drizzle";
import { itemType } from "../src/lib/db/schema";

async function checkItemTypes() {
  try {
    const allItems = await db.select().from(itemType).orderBy(itemType.no);

    console.log("📋 当前数据库中的item types:");
    console.log("──────────────────────────────────────");
    console.log("No  | Name                          | Remark");
    console.log("──────────────────────────────────────");

    for (const item of allItems) {
      const remark = item.remark || "-";
      console.log(`${item.no.padEnd(3)} | ${item.name.padEnd(30)} | ${remark}`);
    }

    console.log("──────────────────────────────────────");
    console.log(`📊 总计: ${allItems.length} 个项目`);
    process.exit(0);
  } catch (error) {
    console.error("❌ 查询失败:", error);
    process.exit(1);
  }
}

checkItemTypes();
