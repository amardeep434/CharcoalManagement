import { 
  companies, suppliers, hotels, sales, payments, purchases, purchasePayments,
  type Company, type Supplier, type Hotel, type Sale, type Payment, type Purchase, type PurchasePayment,
  type InsertCompany, type InsertSupplier, type InsertHotel, type InsertSale, type InsertPayment, type InsertPurchase, type InsertPurchasePayment,
  type SaleWithHotel, type PurchaseWithSupplier, type HotelWithStats, type SupplierWithStats, type CompanyWithStats, type DashboardStats 
} from "@shared/schema";

export interface IStorage {
  // Companies
  getCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByCode(code: string): Promise<Company | undefined>;
  getCompanyByName(name: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;
  getCompaniesWithStats(): Promise<CompanyWithStats[]>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  getSupplierByCode(code: string): Promise<Supplier | undefined>;
  getSupplierByName(name: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
  getSuppliersWithStats(): Promise<SupplierWithStats[]>;

  // Hotels
  getHotels(): Promise<Hotel[]>;
  getHotel(id: number): Promise<Hotel | undefined>;
  getHotelByCode(code: string): Promise<Hotel | undefined>;
  getHotelByName(name: string): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: number, hotel: Partial<InsertHotel>): Promise<Hotel | undefined>;
  deleteHotel(id: number): Promise<boolean>;
  getHotelsWithStats(): Promise<HotelWithStats[]>;

  // Sales
  getSales(companyId?: number): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  getSalesWithHotels(companyId?: number): Promise<SaleWithHotel[]>;
  getSalesByHotel(hotelId: number): Promise<SaleWithHotel[]>;
  getSalesByCompany(companyId: number): Promise<SaleWithHotel[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  updateSale(id: number, sale: Partial<InsertSale>): Promise<Sale | undefined>;
  deleteSale(id: number): Promise<boolean>;

  // Payments
  getPayments(): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsBySale(saleId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;

  // Purchases
  getPurchases(companyId?: number): Promise<Purchase[]>;
  getPurchase(id: number): Promise<Purchase | undefined>;
  getPurchasesWithSuppliers(companyId?: number): Promise<PurchaseWithSupplier[]>;
  getPurchasesBySupplier(supplierId: number): Promise<PurchaseWithSupplier[]>;
  getPurchasesByCompany(companyId: number): Promise<PurchaseWithSupplier[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  updatePurchase(id: number, purchase: Partial<InsertPurchase>): Promise<Purchase | undefined>;
  deletePurchase(id: number): Promise<boolean>;

  // Purchase Payments
  getPurchasePayments(): Promise<PurchasePayment[]>;
  getPurchasePayment(id: number): Promise<PurchasePayment | undefined>;
  getPurchasePaymentsByPurchase(purchaseId: number): Promise<PurchasePayment[]>;
  createPurchasePayment(payment: InsertPurchasePayment): Promise<PurchasePayment>;
  updatePurchasePayment(id: number, payment: Partial<InsertPurchasePayment>): Promise<PurchasePayment | undefined>;
  deletePurchasePayment(id: number): Promise<boolean>;

  // Dashboard
  getDashboardStats(companyId?: number): Promise<DashboardStats>;
  getRecentSales(limit?: number, companyId?: number): Promise<SaleWithHotel[]>;
  getRecentPurchases(limit?: number, companyId?: number): Promise<PurchaseWithSupplier[]>;
}

export class MemStorage implements IStorage {
  private companies: Map<number, Company>;
  private suppliers: Map<number, Supplier>;
  private hotels: Map<number, Hotel>;
  private sales: Map<number, Sale>;
  private payments: Map<number, Payment>;
  private purchases: Map<number, Purchase>;
  private purchasePayments: Map<number, PurchasePayment>;
  
  private currentCompanyId: number;
  private currentSupplierId: number;
  private currentHotelId: number;
  private currentSaleId: number;
  private currentPaymentId: number;
  private currentPurchaseId: number;
  private currentPurchasePaymentId: number;

  constructor() {
    this.companies = new Map();
    this.suppliers = new Map();
    this.hotels = new Map();
    this.sales = new Map();
    this.payments = new Map();
    this.purchases = new Map();
    this.purchasePayments = new Map();
    
    this.currentCompanyId = 1;
    this.currentSupplierId = 1;
    this.currentHotelId = 1;
    this.currentSaleId = 1;
    this.currentPaymentId = 1;
    this.currentPurchaseId = 1;
    this.currentPurchasePaymentId = 1;

    // Create a default company for backward compatibility
    this.createDefaultCompany();
  }

  private createDefaultCompany() {
    const defaultCompany: Company = {
      id: 1,
      name: "Default Charcoal Business",
      code: "DEFAULT001",
      contactPerson: null,
      phone: null,
      email: null,
      address: null,
      taxId: null,
      isActive: true,
      createdAt: new Date(),
    };
    this.companies.set(1, defaultCompany);
    this.currentCompanyId = 2;
  }

  // Companies
  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values()).filter(company => company.isActive);
  }

  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompanyByCode(code: string): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(company => company.code === code);
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(company => company.name.toLowerCase() === name.toLowerCase());
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.currentCompanyId++;
    const company: Company = { 
      ...insertCompany, 
      id,
      contactPerson: insertCompany.contactPerson || null,
      phone: insertCompany.phone || null,
      email: insertCompany.email || null,
      address: insertCompany.address || null,
      taxId: insertCompany.taxId || null,
      isActive: insertCompany.isActive ?? true,
      createdAt: new Date(),
    };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: number, companyUpdate: Partial<InsertCompany>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    
    const updatedCompany = { ...company, ...companyUpdate };
    this.companies.set(id, updatedCompany);
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<boolean> {
    return this.companies.delete(id);
  }

  async getCompaniesWithStats(): Promise<CompanyWithStats[]> {
    const companiesList = Array.from(this.companies.values());
    const salesList = Array.from(this.sales.values());
    const purchasesList = Array.from(this.purchases.values());
    const paymentsList = Array.from(this.payments.values());
    const purchasePaymentsList = Array.from(this.purchasePayments.values());

    return companiesList.map(company => {
      const companySales = salesList.filter(sale => sale.companyId === company.id);
      const companyPurchases = purchasesList.filter(purchase => purchase.companyId === company.id);
      
      const totalRevenue = companySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const totalCosts = companyPurchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0);
      
      const uniqueHotels = new Set(companySales.map(sale => sale.hotelId));
      const uniqueSuppliers = new Set(companyPurchases.map(purchase => purchase.supplierId));

      return {
        ...company,
        totalSales: companySales.length,
        totalPurchases: companyPurchases.length,
        totalRevenue,
        totalCosts,
        profit: totalRevenue - totalCosts,
        activeHotels: uniqueHotels.size,
        activeSuppliers: uniqueSuppliers.size,
      };
    });
  }

  // Suppliers - Similar pattern to companies
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values()).filter(supplier => supplier.isActive);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async getSupplierByCode(code: string): Promise<Supplier | undefined> {
    return Array.from(this.suppliers.values()).find(supplier => supplier.code === code);
  }

  async getSupplierByName(name: string): Promise<Supplier | undefined> {
    return Array.from(this.suppliers.values()).find(supplier => supplier.name.toLowerCase() === name.toLowerCase());
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.currentSupplierId++;
    const supplier: Supplier = { 
      ...insertSupplier, 
      id,
      contactPerson: insertSupplier.contactPerson || null,
      phone: insertSupplier.phone || null,
      email: insertSupplier.email || null,
      address: insertSupplier.address || null,
      taxId: insertSupplier.taxId || null,
      isActive: insertSupplier.isActive ?? true,
      createdAt: new Date(),
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async updateSupplier(id: number, supplierUpdate: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;
    
    const updatedSupplier = { ...supplier, ...supplierUpdate };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  async getSuppliersWithStats(): Promise<SupplierWithStats[]> {
    const suppliersList = Array.from(this.suppliers.values());
    const purchasesList = Array.from(this.purchases.values());
    const purchasePaymentsList = Array.from(this.purchasePayments.values());

    return suppliersList.map(supplier => {
      const supplierPurchases = purchasesList.filter(purchase => purchase.supplierId === supplier.id);
      const totalAmount = supplierPurchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0);
      
      const paidAmount = supplierPurchases.reduce((sum, purchase) => {
        const purchasePayments = purchasePaymentsList.filter(payment => payment.purchaseId === purchase.id);
        return sum + purchasePayments.reduce((paySum, payment) => paySum + Number(payment.amount), 0);
      }, 0);
      
      const pendingAmount = totalAmount - paidAmount;
      const lastPurchaseDate = supplierPurchases.length > 0 
        ? new Date(Math.max(...supplierPurchases.map(purchase => purchase.date.getTime())))
        : undefined;

      return {
        ...supplier,
        totalPurchases: supplierPurchases.length,
        totalAmount,
        pendingAmount,
        lastPurchaseDate,
      };
    });
  }

  // Hotels - Keep existing logic but simplified
  async getHotels(): Promise<Hotel[]> {
    return Array.from(this.hotels.values()).filter(hotel => hotel.isActive);
  }

  async getHotel(id: number): Promise<Hotel | undefined> {
    return this.hotels.get(id);
  }

  async getHotelByCode(code: string): Promise<Hotel | undefined> {
    return Array.from(this.hotels.values()).find(hotel => hotel.code === code);
  }

  async getHotelByName(name: string): Promise<Hotel | undefined> {
    return Array.from(this.hotels.values()).find(hotel => hotel.name.toLowerCase() === name.toLowerCase());
  }

  async createHotel(insertHotel: InsertHotel): Promise<Hotel> {
    const id = this.currentHotelId++;
    const hotel: Hotel = { 
      ...insertHotel, 
      id,
      contactPerson: insertHotel.contactPerson || null,
      phone: insertHotel.phone || null,
      email: insertHotel.email || null,
      address: insertHotel.address || null,
      isActive: insertHotel.isActive ?? true,
    };
    this.hotels.set(id, hotel);
    return hotel;
  }

  async updateHotel(id: number, hotelUpdate: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const hotel = this.hotels.get(id);
    if (!hotel) return undefined;
    
    const updatedHotel = { ...hotel, ...hotelUpdate };
    this.hotels.set(id, updatedHotel);
    return updatedHotel;
  }

  async deleteHotel(id: number): Promise<boolean> {
    return this.hotels.delete(id);
  }

  async getHotelsWithStats(): Promise<HotelWithStats[]> {
    const hotelsList = Array.from(this.hotels.values());
    const salesList = Array.from(this.sales.values());
    const paymentsList = Array.from(this.payments.values());

    return hotelsList.map(hotel => {
      const hotelSales = salesList.filter(sale => sale.hotelId === hotel.id);
      const totalSales = hotelSales.length;
      const totalAmount = hotelSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      
      const paidAmount = hotelSales.reduce((sum, sale) => {
        const salePayments = paymentsList.filter(payment => payment.saleId === sale.id);
        return sum + salePayments.reduce((paySum, payment) => paySum + Number(payment.amount), 0);
      }, 0);
      
      const pendingAmount = totalAmount - paidAmount;
      const lastSaleDate = hotelSales.length > 0 
        ? new Date(Math.max(...hotelSales.map(sale => sale.date.getTime())))
        : undefined;

      return {
        ...hotel,
        totalSales,
        totalAmount,
        pendingAmount,
        lastSaleDate,
      };
    });
  }

  // Sales with multi-company support
  async getSales(companyId?: number): Promise<Sale[]> {
    const salesList = Array.from(this.sales.values());
    return companyId ? salesList.filter(sale => sale.companyId === companyId) : salesList;
  }

  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async getSalesWithHotels(companyId?: number): Promise<SaleWithHotel[]> {
    const salesList = Array.from(this.sales.values());
    const paymentsList = Array.from(this.payments.values());
    const filteredSales = companyId ? salesList.filter(sale => sale.companyId === companyId) : salesList;

    return filteredSales.map(sale => {
      const company = this.companies.get(sale.companyId);
      const hotel = this.hotels.get(sale.hotelId);
      const salePayments = paymentsList.filter(payment => payment.saleId === sale.id);
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

      return {
        ...sale,
        company: company!,
        hotel: hotel!,
        payments: salePayments,
        paidAmount,
        pendingAmount,
        paymentStatus,
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getSalesByHotel(hotelId: number): Promise<SaleWithHotel[]> {
    const allSales = await this.getSalesWithHotels();
    return allSales.filter(sale => sale.hotelId === hotelId);
  }

  async getSalesByCompany(companyId: number): Promise<SaleWithHotel[]> {
    return this.getSalesWithHotels(companyId);
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.currentSaleId++;
    const sale: Sale = { 
      ...insertSale, 
      id,
      quantity: insertSale.quantity.toString(),
      ratePerKg: insertSale.ratePerKg.toString(),
      totalAmount: insertSale.totalAmount.toString(),
      notes: insertSale.notes || null,
      createdAt: new Date(),
    };
    this.sales.set(id, sale);
    return sale;
  }

  async updateSale(id: number, saleUpdate: Partial<InsertSale>): Promise<Sale | undefined> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;
    
    const updatedSale = { 
      ...sale, 
      ...saleUpdate,
      quantity: saleUpdate.quantity ? saleUpdate.quantity.toString() : sale.quantity,
      ratePerKg: saleUpdate.ratePerKg ? saleUpdate.ratePerKg.toString() : sale.ratePerKg,
      totalAmount: saleUpdate.totalAmount ? saleUpdate.totalAmount.toString() : sale.totalAmount,
    };
    this.sales.set(id, updatedSale);
    return updatedSale;
  }

  async deleteSale(id: number): Promise<boolean> {
    return this.sales.delete(id);
  }

  // Payments - Keep existing logic
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsBySale(saleId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.saleId === saleId);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId++;
    const payment: Payment = { 
      ...insertPayment, 
      id,
      amount: insertPayment.amount.toString(),
      paymentMethod: insertPayment.paymentMethod || null,
      notes: insertPayment.notes || null,
      createdAt: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: number, paymentUpdate: Partial<InsertPayment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { 
      ...payment, 
      ...paymentUpdate,
      amount: paymentUpdate.amount ? paymentUpdate.amount.toString() : payment.amount,
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async deletePayment(id: number): Promise<boolean> {
    return this.payments.delete(id);
  }

  // Purchase methods - Similar to sales but for suppliers
  async getPurchases(companyId?: number): Promise<Purchase[]> {
    const purchasesList = Array.from(this.purchases.values());
    return companyId ? purchasesList.filter(purchase => purchase.companyId === companyId) : purchasesList;
  }

  async getPurchase(id: number): Promise<Purchase | undefined> {
    return this.purchases.get(id);
  }

  async getPurchasesWithSuppliers(companyId?: number): Promise<PurchaseWithSupplier[]> {
    const purchasesList = Array.from(this.purchases.values());
    const purchasePaymentsList = Array.from(this.purchasePayments.values());
    const filteredPurchases = companyId ? purchasesList.filter(purchase => purchase.companyId === companyId) : purchasesList;

    return filteredPurchases.map(purchase => {
      const company = this.companies.get(purchase.companyId);
      const supplier = this.suppliers.get(purchase.supplierId);
      const purchasePayments = purchasePaymentsList.filter(payment => payment.purchaseId === purchase.id);
      const paidAmount = purchasePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
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

      return {
        ...purchase,
        company: company!,
        supplier: supplier!,
        payments: purchasePayments,
        paidAmount,
        pendingAmount,
        paymentStatus,
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getPurchasesBySupplier(supplierId: number): Promise<PurchaseWithSupplier[]> {
    const allPurchases = await this.getPurchasesWithSuppliers();
    return allPurchases.filter(purchase => purchase.supplierId === supplierId);
  }

  async getPurchasesByCompany(companyId: number): Promise<PurchaseWithSupplier[]> {
    return this.getPurchasesWithSuppliers(companyId);
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const id = this.currentPurchaseId++;
    const purchase: Purchase = { 
      ...insertPurchase, 
      id,
      quantity: insertPurchase.quantity.toString(),
      ratePerKg: insertPurchase.ratePerKg.toString(),
      totalAmount: insertPurchase.totalAmount.toString(),
      invoiceNumber: insertPurchase.invoiceNumber || null,
      notes: insertPurchase.notes || null,
      createdAt: new Date(),
    };
    this.purchases.set(id, purchase);
    return purchase;
  }

  async updatePurchase(id: number, purchaseUpdate: Partial<InsertPurchase>): Promise<Purchase | undefined> {
    const purchase = this.purchases.get(id);
    if (!purchase) return undefined;
    
    const updatedPurchase = { 
      ...purchase, 
      ...purchaseUpdate,
      quantity: purchaseUpdate.quantity ? purchaseUpdate.quantity.toString() : purchase.quantity,
      ratePerKg: purchaseUpdate.ratePerKg ? purchaseUpdate.ratePerKg.toString() : purchase.ratePerKg,
      totalAmount: purchaseUpdate.totalAmount ? purchaseUpdate.totalAmount.toString() : purchase.totalAmount,
    };
    this.purchases.set(id, updatedPurchase);
    return updatedPurchase;
  }

  async deletePurchase(id: number): Promise<boolean> {
    return this.purchases.delete(id);
  }

  // Purchase Payment methods
  async getPurchasePayments(): Promise<PurchasePayment[]> {
    return Array.from(this.purchasePayments.values());
  }

  async getPurchasePayment(id: number): Promise<PurchasePayment | undefined> {
    return this.purchasePayments.get(id);
  }

  async getPurchasePaymentsByPurchase(purchaseId: number): Promise<PurchasePayment[]> {
    return Array.from(this.purchasePayments.values()).filter(payment => payment.purchaseId === purchaseId);
  }

  async createPurchasePayment(insertPayment: InsertPurchasePayment): Promise<PurchasePayment> {
    const id = this.currentPurchasePaymentId++;
    const payment: PurchasePayment = { 
      ...insertPayment, 
      id,
      amount: insertPayment.amount.toString(),
      paymentMethod: insertPayment.paymentMethod || null,
      notes: insertPayment.notes || null,
      createdAt: new Date(),
    };
    this.purchasePayments.set(id, payment);
    return payment;
  }

  async updatePurchasePayment(id: number, paymentUpdate: Partial<InsertPurchasePayment>): Promise<PurchasePayment | undefined> {
    const payment = this.purchasePayments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { 
      ...payment, 
      ...paymentUpdate,
      amount: paymentUpdate.amount ? paymentUpdate.amount.toString() : payment.amount,
    };
    this.purchasePayments.set(id, updatedPayment);
    return updatedPayment;
  }

  async deletePurchasePayment(id: number): Promise<boolean> {
    return this.purchasePayments.delete(id);
  }

  // Dashboard with comprehensive stats
  async getDashboardStats(companyId?: number): Promise<DashboardStats> {
    const salesList = Array.from(this.sales.values());
    const purchasesList = Array.from(this.purchases.values());
    const paymentsList = Array.from(this.payments.values());
    const purchasePaymentsList = Array.from(this.purchasePayments.values());
    const hotelsList = Array.from(this.hotels.values());
    const suppliersList = Array.from(this.suppliers.values());

    const filteredSales = companyId ? salesList.filter(sale => sale.companyId === companyId) : salesList;
    const filteredPurchases = companyId ? purchasesList.filter(purchase => purchase.companyId === companyId) : purchasesList;

    const totalSales = filteredSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0);
    
    const totalPaid = filteredSales.reduce((sum, sale) => {
      const salePayments = paymentsList.filter(payment => payment.saleId === sale.id);
      return sum + salePayments.reduce((paySum, payment) => paySum + Number(payment.amount), 0);
    }, 0);

    const totalPurchasePaid = filteredPurchases.reduce((sum, purchase) => {
      const purchasePayments = purchasePaymentsList.filter(payment => payment.purchaseId === purchase.id);
      return sum + purchasePayments.reduce((paySum, payment) => paySum + Number(payment.amount), 0);
    }, 0);
    
    const pendingPayments = totalSales - totalPaid;
    const pendingPurchasePayments = totalPurchases - totalPurchasePaid;
    const activeHotels = hotelsList.filter(hotel => hotel.isActive).length;
    const activeSuppliers = suppliersList.filter(supplier => supplier.isActive).length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyCharcoal = filteredSales
      .filter(sale => sale.date.getMonth() === currentMonth && sale.date.getFullYear() === currentYear)
      .reduce((sum, sale) => sum + Number(sale.quantity), 0);

    const monthlyRevenue = filteredSales
      .filter(sale => sale.date.getMonth() === currentMonth && sale.date.getFullYear() === currentYear)
      .reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

    const monthlyCosts = filteredPurchases
      .filter(purchase => purchase.date.getMonth() === currentMonth && purchase.date.getFullYear() === currentYear)
      .reduce((sum, purchase) => sum + Number(purchase.totalAmount), 0);

    const monthlyProfit = monthlyRevenue - monthlyCosts;

    const overdueInvoices = filteredSales.filter(sale => {
      const salePayments = paymentsList.filter(payment => payment.saleId === sale.id);
      const paidAmount = salePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const isPending = paidAmount < Number(sale.totalAmount);
      const daysSinceSale = Math.floor((Date.now() - sale.date.getTime()) / (1000 * 60 * 60 * 24));
      return isPending && daysSinceSale > 30;
    }).length;

    const overduePurchases = filteredPurchases.filter(purchase => {
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
}

export const storage = new MemStorage();