import { hotels, sales, payments, type Hotel, type Sale, type Payment, type InsertHotel, type InsertSale, type InsertPayment, type SaleWithHotel, type HotelWithStats, type DashboardStats } from "@shared/schema";

export interface IStorage {
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
  getSales(): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  getSalesWithHotels(): Promise<SaleWithHotel[]>;
  getSalesByHotel(hotelId: number): Promise<SaleWithHotel[]>;
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

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  getRecentSales(limit?: number): Promise<SaleWithHotel[]>;
}

export class MemStorage implements IStorage {
  private hotels: Map<number, Hotel>;
  private sales: Map<number, Sale>;
  private payments: Map<number, Payment>;
  private currentHotelId: number;
  private currentSaleId: number;
  private currentPaymentId: number;

  constructor() {
    this.hotels = new Map();
    this.sales = new Map();
    this.payments = new Map();
    this.currentHotelId = 1;
    this.currentSaleId = 1;
    this.currentPaymentId = 1;
  }

  // Hotels
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
    const hotel: Hotel = { ...insertHotel, id };
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

  // Sales
  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  async getSale(id: number): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async getSalesWithHotels(): Promise<SaleWithHotel[]> {
    const salesList = Array.from(this.sales.values());
    const paymentsList = Array.from(this.payments.values());

    return salesList.map(sale => {
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

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.currentSaleId++;
    const sale: Sale = { 
      ...insertSale, 
      id,
      createdAt: new Date(),
    };
    this.sales.set(id, sale);
    return sale;
  }

  async updateSale(id: number, saleUpdate: Partial<InsertSale>): Promise<Sale | undefined> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;
    
    const updatedSale = { ...sale, ...saleUpdate };
    this.sales.set(id, updatedSale);
    return updatedSale;
  }

  async deleteSale(id: number): Promise<boolean> {
    return this.sales.delete(id);
  }

  // Payments
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
      createdAt: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: number, paymentUpdate: Partial<InsertPayment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...paymentUpdate };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async deletePayment(id: number): Promise<boolean> {
    return this.payments.delete(id);
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const salesList = Array.from(this.sales.values());
    const paymentsList = Array.from(this.payments.values());
    const hotelsList = Array.from(this.hotels.values());

    const totalSales = salesList.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    
    const totalPaid = salesList.reduce((sum, sale) => {
      const salePayments = paymentsList.filter(payment => payment.saleId === sale.id);
      return sum + salePayments.reduce((paySum, payment) => paySum + Number(payment.amount), 0);
    }, 0);
    
    const pendingPayments = totalSales - totalPaid;
    const activeHotels = hotelsList.filter(hotel => hotel.isActive).length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyCharcoal = salesList
      .filter(sale => sale.date.getMonth() === currentMonth && sale.date.getFullYear() === currentYear)
      .reduce((sum, sale) => sum + Number(sale.quantity), 0);

    const overdueInvoices = salesList.filter(sale => {
      const salePayments = paymentsList.filter(payment => payment.saleId === sale.id);
      const paidAmount = salePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const isPending = paidAmount < Number(sale.totalAmount);
      const daysSinceSale = Math.floor((Date.now() - sale.date.getTime()) / (1000 * 60 * 60 * 24));
      return isPending && daysSinceSale > 30;
    }).length;

    return {
      totalSales,
      pendingPayments,
      activeHotels,
      monthlyCharcoal,
      overdueInvoices,
    };
  }

  async getRecentSales(limit: number = 10): Promise<SaleWithHotel[]> {
    const salesWithHotels = await this.getSalesWithHotels();
    return salesWithHotels.slice(0, limit);
  }
}

export const storage = new MemStorage();
