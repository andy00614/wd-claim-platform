import { sql } from "drizzle-orm";
import { integer, serial, pgTable, varchar, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";

export const departmentEnum = pgEnum('department', [
  'Director',
  'HR Department',
  'Account Department',
  'Marketing Department',
  'Tech Department',
  'Knowledge Management'
]);


export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 60 }).notNull(),
  employeeCode: integer('employee_code').notNull().unique(),
  departmentEnum: departmentEnum('department').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
})

export const userEmployeeBind = pgTable('user_employee_bindings', {
  id: serial('id').primaryKey(),
  // id uuid not null references auth.users on delete cascade, todo不会写
  userId: uuid('user_id').notNull().unique(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date())
})