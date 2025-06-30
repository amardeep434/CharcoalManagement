import { pgTable, text, serial, integer, decimal, timestamp, boolean, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Companies (Multiple charcoal businesses)
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  taxId: text("tax_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Suppliers (Charcoal suppliers you purchase from)
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  taxId: text("tax_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  hotelId: integer("hotel_id").notNull().references(() => hotels.id),
  date: timestamp("date", { mode: "date" }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(), // in kg
  ratePerKg: decimal("rate_per_kg", { precision: 10, scale: 2 }).notNull(), // rate per kg
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date", { mode: "date" }).notNull(),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Purchases (Charcoal purchases from suppliers)
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  date: timestamp("date", { mode: "date" }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(), // in kg
  ratePerKg: decimal("rate_per_kg", { precision: 10, scale: 2 }).notNull(), // rate per kg
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  invoiceNumber: text("invoice_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Purchase Payments (Payments made to suppliers for purchases)
export const purchasePayments = pgTable("purchase_payments", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").notNull().references(() => purchases.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date", { mode: "date" }).notNull(),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for authentication and role management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email").unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: text("role").notNull().default("viewer"), // admin, manager, operator, viewer
  companyAccess: jsonb("company_access"), // Array of company IDs user can access
  permissions: jsonb("permissions"), // Specific permissions object
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// Audit log table for tracking all changes
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE
  tableName: text("table_name").notNull(), // companies, sales, payments, etc.
  recordId: integer("record_id").notNull(),
  oldValues: jsonb("old_values"), // Previous values before change
  newValues: jsonb("new_values"), // New values after change
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull().defaultNow(),
});

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export const insertHotelSchema = createInsertSchema(hotels).omit({
  id: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string().transform((str) => new Date(str)),
  quantity: z.number().positive(),
  ratePerTon: z.number().positive(),
  totalAmount: z.number().positive(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
}).extend({
  paymentDate: z.string().transform((str) => new Date(str)),
  amount: z.number().positive(),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string().transform((str) => new Date(str)),
  quantity: z.number().positive(),
  ratePerTon: z.number().positive(),
  totalAmount: z.number().positive(),
});

export const insertPurchasePaymentSchema = createInsertSchema(purchasePayments).omit({
  id: true,
  createdAt: true,
}).extend({
  paymentDate: z.string().transform((str) => new Date(str)),
  amount: z.number().positive(),
});

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

export type PurchasePayment = typeof purchasePayments.$inferSelect;
export type InsertPurchasePayment = z.infer<typeof insertPurchasePaymentSchema>;

// Extended types for API responses
export type SaleWithHotel = Sale & {
  company: Company;
  hotel: Hotel;
  payments: Payment[];
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: "paid" | "partial" | "pending" | "overdue";
};

export type PurchaseWithSupplier = Purchase & {
  company: Company;
  supplier: Supplier;
  payments: PurchasePayment[];
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: "paid" | "partial" | "pending" | "overdue";
};

export type HotelWithStats = Hotel & {
  totalSales: number;
  totalAmount: number;
  pendingAmount: number;
  lastSaleDate?: Date;
};

export type SupplierWithStats = Supplier & {
  totalPurchases: number;
  totalAmount: number;
  pendingAmount: number;
  lastPurchaseDate?: Date;
};

export type CompanyWithStats = Company & {
  totalSales: number;
  totalPurchases: number;
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  activeHotels: number;
  activeSuppliers: number;
};

export type DashboardStats = {
  totalSales: number;
  pendingPayments: number;
  activeHotels: number;
  monthlyCharcoal: number;
  overdueInvoices: number;
  totalPurchases: number;
  pendingPurchasePayments: number;
  activeSuppliers: number;
  monthlyProfit: number;
  overduePurchases: number;
};

// Excel import schema
export const excelImportSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  hotelName: z.string().min(1, "Hotel name is required"),
  date: z.string().min(1, "Date is required"),
  quantity: z.number().positive("Quantity must be positive"),
  ratePerKg: z.number().positive("Rate per kg must be positive"),
  totalAmount: z.number().positive("Total amount must be positive"),
  paymentStatus: z.enum(["paid", "pending", "partial"]).optional(),
  paymentDate: z.string().optional(),
  paymentAmount: z.number().optional(),
  notes: z.string().optional(),
});

export const purchaseImportSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  supplierName: z.string().min(1, "Supplier name is required"),
  date: z.string().min(1, "Date is required"),
  quantity: z.number().positive("Quantity must be positive"),
  ratePerKg: z.number().positive("Rate per kg must be positive"),
  totalAmount: z.number().positive("Total amount must be positive"),
  invoiceNumber: z.string().optional(),
  paymentStatus: z.enum(["paid", "pending", "partial"]).optional(),
  paymentDate: z.string().optional(),
  paymentAmount: z.number().optional(),
  notes: z.string().optional(),
});

export type ExcelImportRow = z.infer<typeof excelImportSchema>;
export type PurchaseImportRow = z.infer<typeof purchaseImportSchema>;

// User and authentication types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true,
});

export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// User roles enum
export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  OPERATOR: 'operator',
  VIEWER: 'viewer'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Permissions structure
export interface UserPermissions {
  companies: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  sales: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  payments: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  hotels: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  suppliers: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  purchases: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  statements: {
    generate: boolean;
    export: boolean;
  };
  audit: {
    view: boolean;
  };
  users: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}
