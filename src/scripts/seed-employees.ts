import { db } from "../lib/db";
import { employees } from "../lib/db/schema";

// 员工数据（基于 docs/employee.png）
const employeesData = [
  {
    name: "Celine (Chiong Moi Len)",
    employeeCode: 2,
    departmentEnum: "HR Department" as const,
  },
  {
    name: "Candice (Tee Boh Chu)",
    employeeCode: 42,
    departmentEnum: "Account Department" as const,
  },
  {
    name: "Eve (Lim Hui Wen)",
    employeeCode: 21,
    departmentEnum: "Marketing Department" as const,
  },
  {
    name: "Calysta (Chan Shi Lin)",
    employeeCode: 39,
    departmentEnum: "Marketing Department" as const,
  },
  {
    name: "Aloysius (Chan Woei Lih)",
    employeeCode: 15,
    departmentEnum: "Tech Department" as const,
  },
  {
    name: "Lucas (Zhao Zihui)",
    employeeCode: 20,
    departmentEnum: "Tech Department" as const,
  },
  {
    name: "Andy (Zhang Andi)",
    employeeCode: 18,
    departmentEnum: "Tech Department" as const,
  },
  {
    name: "James (Yip Seng Kong)",
    employeeCode: 7,
    departmentEnum: "Knowledge Management" as const,
  },
];

async function seedEmployees() {
  try {
    console.log("🌱 开始填充员工数据...");

    // 批量插入员工数据
    const result = await db.insert(employees).values(employeesData).returning();

    console.log(`✅ 成功插入 ${result.length} 名员工:`);
    result.forEach((employee) => {
      console.log(
        `  - ${employee.name} (${employee.employeeCode}) - ${employee.departmentEnum}`,
      );
    });

    console.log("🎉 员工数据填充完成！");
  } catch (error) {
    console.error("❌ 填充员工数据失败:", error);
    throw error;
  }
}

// 执行种子脚本
if (require.main === module) {
  seedEmployees()
    .then(() => {
      console.log("脚本执行完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("脚本执行失败:", error);
      process.exit(1);
    });
}
