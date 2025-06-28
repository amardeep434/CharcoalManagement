import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  hotelId: integer("hotel_id").notNull().references(() => hotels.id),
  date: timestamp("date", { mode: "date" }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  ratePerTon: decimal("rate_per_ton", { precision: 10, scale: 2 }).notNull(),
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

// Insert schemas
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

// Types
export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Extended types for API responses
export type SaleWithHotel = Sale & {
  hotel: Hotel;
  payments: Payment[];
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

export type DashboardStats = {
  totalSales: number;
  pendingPayments: number;
  activeHotels: number;
  monthlyCharcoal: number;
  overdueInvoices: number;
};

// Excel import schema
export const excelImportSchema = z.object({
  hotelName: z.string().min(1, "Hotel name is required"),
  date: z.string().min(1, "Date is required"),
  quantity: z.number().positive("Quantity must be positive"),
  ratePerTon: z.number().positive("Rate per ton must be positive"),
  totalAmount: z.number().positive("Total amount must be positive"),
  paymentStatus: z.enum(["paid", "pending", "partial"]).optional(),
  paymentDate: z.string().optional(),
  paymentAmount: z.number().optional(),
  notes: z.string().optional(),
});

export type ExcelImportRow = z.infer<typeof excelImportSchema>;
