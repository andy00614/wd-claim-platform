import { sql } from "drizzle-orm";
import { integer, serial, pgTable, varchar, timestamp, pgEnum, uuid, numeric, text } from "drizzle-orm/pg-core";

export const departmentEnum = pgEnum('department', [
  'Director',
  'HR Department',
  'Account Department',
  'Marketing Department',
  'Tech Department',
  'Knowledge Management'
]);

export const employeeRoleEnum = pgEnum('employee_role', ['employee', 'admin']);


export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 60 }).notNull(),
  employeeCode: integer('employee_code').notNull().unique(),
  departmentEnum: departmentEnum('department').notNull(),
  role: employeeRoleEnum('role').notNull().default('employee'),
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


export const itemType = pgTable('item_type', {
  id: serial('id').primaryKey(),
  itemNo: varchar('item_no', { length: 10 }).notNull().unique(), // 这是 Item No (A1, A2, B1, etc.)
  xeroCode: varchar('xero_code', { length: 10 }).notNull().unique(), // 这是 Xero Code (420, 439, 449, etc.)
  name: varchar('name').notNull(),  // 这是 GL Code Description
  no: varchar('no', { length: 10 }).notNull().unique(), // 保持原样
  remark: varchar('remark', { length: 200 }),
})

export const currency = pgTable('currency', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  code: varchar('code', { length: 10 }).notNull().unique(),
})

export const claimStatusEnum = pgEnum('claim_status', ['draft', 'submitted', 'approved', 'rejected'])


export const claims = pgTable('claims', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
  status: claimStatusEnum('status').notNull().default('draft'),
  totalAmount: numeric('total_amount').notNull(),
  adminNotes: text('admin_notes'),
})

export const claimItems = pgTable('claim_items', {
  id: serial('id').primaryKey(),
  claimId: integer('claim_id').references(() => claims.id).notNull(),
  date: timestamp('date').notNull(),
  type: integer('type').references(() => itemType.id).notNull(),
  note: varchar('note'),
  evidenceNo: varchar('evidence_no'),
  details: varchar('details'),
  currencyId: integer('currency_id').references(() => currency.id).notNull(),
  amount: numeric('amount').notNull(),
  rate: numeric('rate').notNull(),
  sgdAmount: numeric('sgd_amount').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
})

export const attachment = pgTable('attachments', {
  id: serial('id').primaryKey(),
  claimId: integer('claim_id').references(() => claims.id),
  claimItemId: integer('claim_item_id').references(() => claimItems.id),
  fileName: varchar('file_name').notNull(),
  url: varchar('url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
  fileSize: numeric('file_size').notNull(),
  fileType: varchar('file_type', { length: 20 }).notNull(),
})
