import { desc, eq } from "drizzle-orm";
import { db } from "../src/lib/db/drizzle";
import {
  attachment,
  claimItems,
  claims,
  employees,
} from "../src/lib/db/schema";

async function checkClaimsData() {
  try {
    console.log("📊 报销单数据统计");
    console.log("═".repeat(60));

    // 获取基本统计
    const allClaims = await db.select().from(claims);
    const allItems = await db.select().from(claimItems);
    const allAttachments = await db.select().from(attachment);

    console.log("📈 总体统计：");
    console.log(`  - 报销申请总数：${allClaims.length}`);
    console.log(`  - 报销项目总数：${allItems.length}`);
    console.log(`  - 附件总数：${allAttachments.length}`);
    console.log("");

    // 按状态分组统计
    const statusStats = allClaims.reduce(
      (acc, claim) => {
        acc[claim.status] = (acc[claim.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log("📋 按状态分组：");
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} 个`);
    });
    console.log("");

    // 计算总金额
    const totalAmount = allClaims.reduce((sum, claim) => {
      return sum + parseFloat(claim.totalAmount.toString());
    }, 0);

    console.log("💰 金额统计：");
    console.log(`  - 总申请金额：SGD ${totalAmount.toFixed(2)}`);
    console.log("");

    // 显示最近的申请
    console.log("🕐 最近的申请：");
    const recentClaims = await db
      .select({
        id: claims.id,
        status: claims.status,
        totalAmount: claims.totalAmount,
        createdAt: claims.createdAt,
        employeeName: employees.name,
      })
      .from(claims)
      .leftJoin(employees, eq(claims.employeeId, employees.id))
      .orderBy(desc(claims.createdAt))
      .limit(10);

    if (recentClaims.length > 0) {
      console.log("ID   | 状态       | 金额      | 员工     | 创建时间");
      console.log("─".repeat(60));
      recentClaims.forEach((claim) => {
        const date = claim.createdAt
          ? new Date(claim.createdAt).toLocaleDateString()
          : "N/A";
        console.log(
          `${claim.id.toString().padEnd(4)} | ${claim.status.padEnd(10)} | SGD ${parseFloat(claim.totalAmount.toString()).toFixed(2).padEnd(6)} | ${(claim.employeeName || "Unknown").padEnd(8)} | ${date}`,
        );
      });
    } else {
      console.log("  暂无申请记录");
    }

    console.log("");
    console.log("✅ 数据检查完成");
  } catch (error) {
    console.error("❌ 检查失败:", error);
    process.exit(1);
  }
}

checkClaimsData();
