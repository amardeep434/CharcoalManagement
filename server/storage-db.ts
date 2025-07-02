import { db } from "./db";
import { 
  companies, suppliers, hotels, sales, payments, purchases, purchasePayments, users, auditLog,
  type Company, type Supplier, type Hotel, type Sale, type Payment, type Purchase, type PurchasePayment,
  type User, type AuditLog,
  type InsertCompany, type InsertSupplier, type InsertHotel, type InsertSale, type InsertPayment, 
  type InsertPurchase, type InsertPurchasePayment, type InsertUser, type InsertAuditLog,
  type SaleWithHotel, type PurchaseWithSupplier, type HotelWithStats, type SupplierWithStats, 
  type CompanyWithStats, type DashboardStats 
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { IStorage } from "./storage-new";

export class DatabaseStorage implements IStorage {
  // Companies
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.isActive, true));
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanyByCode(code: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.code, code));
    return company || undefined;
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(sql`LOWER(${companies.name}) = LOWER(${name})`);
    return company || undefined;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: number, companyUpdate: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set(companyUpdate)
      .where(eq(companies.id, id))
      .returning();
    return company || undefined;
  }

  async deleteCompany(id: number): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getCompaniesWithStats(): Promise<CompanyWithStats[]> {
    const companiesList = await this.getCompanies();
    const result: CompanyWithStats[] = [];

    for (const company of companiesList) {
      const companySales = await db.select().from(sales).where(eq(sales.companyId, company.id));
      const companyPurchases = await db.select().from(purchases).where(eq(purchases.companyId, company.id));
      
      const totalRevenue = companySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const totalCosts = companyPurchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0);
      
      const uniqueHotels = new Set(companySales.map(sale => sale.hotelId));
      const uniqueSuppliers = new Set(companyPurchases.map(purchase => purchase.supplierId));

      result.push({
        ...company,
        totalSales: companySales.length,
        totalPurchases: companyPurchases.length,
        totalRevenue,
        totalCosts,
        profit: totalRevenue - totalCosts,
        activeHotels: uniqueHotels.size,
        activeSuppliers: uniqueSuppliers.size,
      });
    }

    return result;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.isActive, true));
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async getSupplierByCode(code: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.code, code));
    return supplier || undefined;
  }

  async getSupplierByName(name: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(sql`LOWER(${suppliers.name}) = LOWER(${name})`);
    return supplier || undefined;
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db
      .insert(suppliers)
      .values(insertSupplier)
      .returning();
    return supplier;
  }

  async updateSupplier(id: number, supplierUpdate: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db
      .update(suppliers)
      .set(supplierUpdate)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier || undefined;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return result.rowCount > 0;
  }

  async getSuppliersWithStats(): Promise<SupplierWithStats[]> {
    const suppliersList = await this.getSuppliers();
    const result: SupplierWithStats[] = [];

    for (const supplier of suppliersList) {
      const supplierPurchases = await db.select().from(purchases).where(eq(purchases.supplierId, supplier.id));
      const purchasePaymentsList = await db.select().from(purchasePayments).where(
        sql`${purchasePayments.purchaseId} IN (${sql.join(supplierPurchases.map(p => p.id), sql`, `)})`
      );
      
      const totalAmount = supplierPurchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0);
      const paidAmount = purchasePaymentsList.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const pendingAmount = totalAmount - paidAmount;
      
      const lastPurchaseDate = supplierPurchases.length > 0 
        ? new Date(Math.max(...supplierPurchases.map(purchase => purchase.date.getTime())))
        : undefined;

      result.push({
        ...supplier,
        totalPurchases: supplierPurchases.length,
        totalAmount,
        pendingAmount,
        lastPurchaseDate,
      });
    }

    return result;
  }

  // Hotels
  async getHotels(): Promise<Hotel[]> {
    return await db.select().from(hotels).where(eq(hotels.isActive, true));
  }

  async getHotel(id: number): Promise<Hotel | undefined> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id));
    return hotel || undefined;
  }

  async getHotelByCode(code: string): Promise<Hotel | undefined> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.code, code));
    return hotel || undefined;
  }

  async getHotelByName(name: string): Promise<Hotel | undefined> {
    const [hotel] = await db.select().from(hotels).where(sql`LOWER(${hotels.name}) = LOWER(${name})`);
    return hotel || undefined;
  }

  async createHotel(insertHotel: InsertHotel): Promise<Hotel> {
    const [hotel] = await db
      .insert(hotels)
      .values(insertHotel)
      .returning();
    return hotel;
  }

  async updateHotel(id: number, hotelUpdate: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const [hotel] = await db
      .update(hotels)
      .set(hotelUpdate)
      .where(eq(hotels.id, id))
      .returning();
    return hotel || undefined;
  }

  async deleteHotel(id: number): Promise<boolean> {
    const result = await db.delete(hotels).where(eq(hotels.id, id));
    return result.rowCount > 0;
  }

  async getHotelsWithStats(): Promise<HotelWithStats[]> {
    const hotelsList = await this.getHotels();
    const result: HotelWithStats[] = [];

    for (const hotel of hotelsList) {
      const hotelSales = await db.select().from(sales).where(eq(sales.hotelId, hotel.id));
      const paymentsList = await db.select().from(payments).where(
        sql`${payments.saleId} IN (${sql.join(hotelSales.map(s => s.id), sql`, `)})`
      );
      
      const totalAmount = hotelSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const paidAmount = paymentsList.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const pendingAmount = totalAmount - paidAmount;
      
      const lastSaleDate = hotelSales.length > 0 
        ? new Date(Math.max(...hotelSales.map(sale => sale.date.getTime())))
        : undefined;

      result.push({
        ...hotel,
        totalSales: hotelSales.length,
        totalAmount,
        pendingAmount,
        lastSaleDate,
      });
    }

    return result;
  }

  // Sales
  async getSales(companyId?: number): Promise<Sale[]> {
    if (companyId) {
      return await db.select().from(sales).where(eq(sales.companyId, companyId));
    }
    return await db.select().from(sales);
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale || undefined;
  }

  async getSalesWithHotels(companyId?: number): Promise<SaleWithHotel[]> {
    const salesQuery = companyId 
      ? db.select().from(sales).where(eq(sales.companyId, companyId))
      : db.select().from(sales);
    
    const salesList = await salesQuery.orderBy(desc(sales.date));
    const result: SaleWithHotel[] = [];

    for (const sale of salesList) {
      const [company] = await db.select().from(companies).where(eq(companies.id, sale.companyId));
      const [hotel] = await db.select().from(hotels).where(eq(hotels.id, sale.hotelId));
      const salePayments = await db.select().from(payments).where(eq(payments.saleId, sale.id));
      
      const paidAmount = salePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const pendingAmount = Number(sale.totalAmount) - paidAmount;
      
      let paymentStatus: "paid" | "partial" | "pending" | "overdue";
      if (paidAmount >= Number(sale.totalAmount)) {
        paymentStatus = "paid";
      } else if (paidAmount > 0) {
        paymentStatus = "partial";
      } else {
        const daysSinceSale = Math.floor((Date.now() - sale.date.getTime()) / (1000 * 60 * 60 * 24));
        paymentStatus = daysSinceSale > 30 ? "overdue" : "pending";
      }

      result.push({
        ...sale,
        company: company!,
        hotel: hotel!,
        payments: salePayments,
        paidAmount,
        pendingAmount,
        paymentStatus,
      });
    }

    return result;
  }

  async getSalesByHotel(hotelId: number): Promise<SaleWithHotel[]> {
    const allSales = await this.getSalesWithHotels();
    return allSales.filter(sale => sale.hotelId === hotelId);
  }

  async getSalesByCompany(companyId: number): Promise<SaleWithHotel[]> {
    return this.getSalesWithHotels(companyId);
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const saleData = {
      ...insertSale,
      quantity: insertSale.quantity.toString(),
      ratePerTon: insertSale.ratePerTon.toString(),
      totalAmount: insertSale.totalAmount.toString(),
    };
    const [sale] = await db
      .insert(sales)
      .values(saleData)
      .returning();
    return sale;
  }

  async updateSale(id: number, saleUpdate: Partial<InsertSale>): Promise<Sale | undefined> {
    const updateData = {
      ...saleUpdate,
      ...(saleUpdate.quantity && { quantity: saleUpdate.quantity.toString() }),
      ...(saleUpdate.ratePerTon && { ratePerTon: saleUpdate.ratePerTon.toString() }),
      ...(saleUpdate.totalAmount && { totalAmount: saleUpdate.totalAmount.toString() }),
    };
    const [sale] = await db
      .update(sales)
      .set(updateData)
      .where(eq(sales.id, id))
      .returning();
    return sale || undefined;
  }

  async deleteSale(id: number): Promise<boolean> {
    const result = await db.delete(sales).where(eq(sales.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsBySale(saleId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.saleId, saleId));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const paymentData = {
      ...insertPayment,
      amount: insertPayment.amount.toString(),
    };
    const [payment] = await db
      .insert(payments)
      .values(paymentData)
      .returning();
    return payment;
  }

  async updatePayment(id: number, paymentUpdate: Partial<InsertPayment>): Promise<Payment | undefined> {
    const updateData = {
      ...paymentUpdate,
      ...(paymentUpdate.amount && { amount: paymentUpdate.amount.toString() }),
    };
    const [payment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  async deletePayment(id: number): Promise<boolean> {
    const result = await db.delete(payments).where(eq(payments.id, id));
    return result.rowCount > 0;
  }

  // Purchases
  async getPurchases(companyId?: number): Promise<Purchase[]> {
    if (companyId) {
      return await db.select().from(purchases).where(eq(purchases.companyId, companyId));
    }
    return await db.select().from(purchases);
  }

  async getPurchase(id: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase || undefined;
  }

  async getPurchasesWithSuppliers(companyId?: number): Promise<PurchaseWithSupplier[]> {
    const purchasesQuery = companyId 
      ? db.select().from(purchases).where(eq(purchases.companyId, companyId))
      : db.select().from(purchases);
    
    const purchasesList = await purchasesQuery.orderBy(desc(purchases.date));
    const result: PurchaseWithSupplier[] = [];

    for (const purchase of purchasesList) {
      const [company] = await db.select().from(companies).where(eq(companies.id, purchase.companyId));
      const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, purchase.supplierId));
      const purchasePaymentsList = await db.select().from(purchasePayments).where(eq(purchasePayments.purchaseId, purchase.id));
      
      const paidAmount = purchasePaymentsList.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const pendingAmount = Number(purchase.totalAmount) - paidAmount;
      
      let paymentStatus: "paid" | "partial" | "pending" | "overdue";
      if (paidAmount >= Number(purchase.totalAmount)) {
        paymentStatus = "paid";
      } else if (paidAmount > 0) {
        paymentStatus = "partial";
      } else {
        const daysSincePurchase = Math.floor((Date.now() - purchase.date.getTime()) / (1000 * 60 * 60 * 24));
        paymentStatus = daysSincePurchase > 30 ? "overdue" : "pending";
      }

      result.push({
        ...purchase,
        company: company!,
        supplier: supplier!,
        payments: purchasePaymentsList,
        paidAmount,
        pendingAmount,
        paymentStatus,
      });
    }

    return result;
  }

  async getPurchasesBySupplier(supplierId: number): Promise<PurchaseWithSupplier[]> {
    const allPurchases = await this.getPurchasesWithSuppliers();
    return allPurchases.filter(purchase => purchase.supplierId === supplierId);
  }

  async getPurchasesByCompany(companyId: number): Promise<PurchaseWithSupplier[]> {
    return this.getPurchasesWithSuppliers(companyId);
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const [purchase] = await db
      .insert(purchases)
      .values(insertPurchase)
      .returning();
    return purchase;
  }

  async updatePurchase(id: number, purchaseUpdate: Partial<InsertPurchase>): Promise<Purchase | undefined> {
    const [purchase] = await db
      .update(purchases)
      .set(purchaseUpdate)
      .where(eq(purchases.id, id))
      .returning();
    return purchase || undefined;
  }

  async deletePurchase(id: number): Promise<boolean> {
    const result = await db.delete(purchases).where(eq(purchases.id, id));
    return result.rowCount > 0;
  }

  // Purchase Payments
  async getPurchasePayments(): Promise<PurchasePayment[]> {
    return await db.select().from(purchasePayments);
  }

  async getPurchasePayment(id: number): Promise<PurchasePayment | undefined> {
    const [payment] = await db.select().from(purchasePayments).where(eq(purchasePayments.id, id));
    return payment || undefined;
  }

  async getPurchasePaymentsByPurchase(purchaseId: number): Promise<PurchasePayment[]> {
    return await db.select().from(purchasePayments).where(eq(purchasePayments.purchaseId, purchaseId));
  }

  async createPurchasePayment(insertPayment: InsertPurchasePayment): Promise<PurchasePayment> {
    const [payment] = await db
      .insert(purchasePayments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePurchasePayment(id: number, paymentUpdate: Partial<InsertPurchasePayment>): Promise<PurchasePayment | undefined> {
    const [payment] = await db
      .update(purchasePayments)
      .set(paymentUpdate)
      .where(eq(purchasePayments.id, id))
      .returning();
    return payment || undefined;
  }

  async deletePurchasePayment(id: number): Promise<boolean> {
    const result = await db.delete(purchasePayments).where(eq(purchasePayments.id, id));
    return result.rowCount > 0;
  }

  // Dashboard
  async getDashboardStats(companyId?: number): Promise<DashboardStats> {
    const salesList = await this.getSales(companyId);
    const purchasesList = await this.getPurchases(companyId);
    const paymentsList = await db.select().from(payments);
    const purchasePaymentsList = await db.select().from(purchasePayments);
    const hotelsList = await db.select().from(hotels).where(eq(hotels.isActive, true));
    const suppliersList = await db.select().from(suppliers).where(eq(suppliers.isActive, true));

    const totalSales = salesList.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalPurchases = purchasesList.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0);
    
    const totalPaid = salesList.reduce((sum, sale) => {
      const salePayments = paymentsList.filter(payment => payment.saleId === sale.id);
      return sum + salePayments.reduce((paySum, payment) => paySum + Number(payment.amount), 0);
    }, 0);

    const totalPurchasePaid = purchasesList.reduce((sum, purchase) => {
      const purchasePayments = purchasePaymentsList.filter(payment => payment.purchaseId === purchase.id);
      return sum + purchasePayments.reduce((paySum, payment) => paySum + Number(payment.amount), 0);
    }, 0);
    
    const pendingPayments = totalSales - totalPaid;
    const pendingPurchasePayments = totalPurchases - totalPurchasePaid;
    const activeHotels = hotelsList.length;
    const activeSuppliers = suppliersList.length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyCharcoal = salesList
      .filter(sale => sale.date.getMonth() === currentMonth && sale.date.getFullYear() === currentYear)
      .reduce((sum, sale) => sum + Number(sale.quantity), 0);

    const monthlyRevenue = salesList
      .filter(sale => sale.date.getMonth() === currentMonth && sale.date.getFullYear() === currentYear)
      .reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

    const monthlyCosts = purchasesList
      .filter(purchase => purchase.date.getMonth() === currentMonth && purchase.date.getFullYear() === currentYear)
      .reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0);

    const monthlyProfit = monthlyRevenue - monthlyCosts;

    const overdueInvoices = salesList.filter(sale => {
      const salePayments = paymentsList.filter(payment => payment.saleId === sale.id);
      const paidAmount = salePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const isPending = paidAmount < Number(sale.totalAmount);
      const daysSinceSale = Math.floor((Date.now() - sale.date.getTime()) / (1000 * 60 * 60 * 24));
      return isPending && daysSinceSale > 30;
    }).length;

    const overduePurchases = purchasesList.filter(purchase => {
      const purchasePayments = purchasePaymentsList.filter(payment => payment.purchaseId === purchase.id);
      const paidAmount = purchasePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const isPending = paidAmount < Number(purchase.totalAmount);
      const daysSincePurchase = Math.floor((Date.now() - purchase.date.getTime()) / (1000 * 60 * 60 * 24));
      return isPending && daysSincePurchase > 30;
    }).length;

    return {
      totalSales,
      pendingPayments,
      activeHotels,
      monthlyCharcoal,
      overdueInvoices,
      totalPurchases,
      pendingPurchasePayments,
      activeSuppliers,
      monthlyProfit,
      overduePurchases,
    };
  }

  async getRecentSales(limit: number = 10, companyId?: number): Promise<SaleWithHotel[]> {
    const salesWithHotels = await this.getSalesWithHotels(companyId);
    return salesWithHotels.slice(0, limit);
  }

  async getRecentPurchases(limit: number = 10, companyId?: number): Promise<PurchaseWithSupplier[]> {
    const purchasesWithSuppliers = await this.getPurchasesWithSuppliers(companyId);
    return purchasesWithSuppliers.slice(0, limit);
  }

  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Audit Log
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLog)
      .values(insertLog)
      .returning();
    return log;
  }

  async getAuditLogs(filters?: { userId?: number; tableName?: string; limit?: number }): Promise<any[]> {
    const limit = filters?.limit || 50;
    
    const query = db.select({
      id: auditLog.id,
      userId: auditLog.userId,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      action: auditLog.action,
      tableName: auditLog.tableName,
      recordId: auditLog.recordId,
      oldValues: auditLog.oldValues,
      newValues: auditLog.newValues,
      timestamp: auditLog.timestamp,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent
    })
    .from(auditLog)
    .leftJoin(users, eq(sql`CAST(${auditLog.userId} AS INTEGER)`, users.id));
    
    if (filters?.userId && filters?.tableName) {
      return await query
        .where(and(
          eq(auditLog.userId, filters.userId.toString()),
          eq(auditLog.tableName, filters.tableName)
        ))
        .orderBy(desc(auditLog.timestamp))
        .limit(limit);
    } else if (filters?.userId) {
      return await query
        .where(eq(auditLog.userId, filters.userId.toString()))
        .orderBy(desc(auditLog.timestamp))
        .limit(limit);
    } else if (filters?.tableName) {
      return await query
        .where(eq(auditLog.tableName, filters.tableName))
        .orderBy(desc(auditLog.timestamp))
        .limit(limit);
    } else {
      return await query
        .orderBy(desc(auditLog.timestamp))
        .limit(limit);
    }
  }
}

export const dbStorage = new DatabaseStorage();