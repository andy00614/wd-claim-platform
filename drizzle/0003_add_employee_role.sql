-- 添加员工角色字段
CREATE TYPE "employee_role" AS ENUM('employee', 'admin');

ALTER TABLE "employees" ADD COLUMN "role" "employee_role" DEFAULT 'employee' NOT NULL;

-- 设置Candice为管理员
UPDATE "employees" 
SET "role" = 'admin' 
WHERE "name" = 'Candice (Tee Boh Chu)';

-- 添加claims表的备注字段（管理员使用）
ALTER TABLE "claims" ADD COLUMN "admin_notes" TEXT;