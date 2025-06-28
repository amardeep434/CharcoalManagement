import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHotelSchema, insertSaleSchema, insertPaymentSchema, excelImportSchema, type ExcelImportRow } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Hotels routes
  app.get("/api/hotels", async (req, res) => {
    try {
      const hotels = await storage.getHotels();
      res.json(hotels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotels" });
    }
  });

  app.get("/api/hotels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const hotel = await storage.getHotel(id);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      res.json(hotel);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotel" });
    }
  });

  app.post("/api/hotels", async (req, res) => {
    try {
      const hotelData = insertHotelSchema.parse(req.body);
      
      // Check for duplicate code
      const existingHotel = await storage.getHotelByCode(hotelData.code);
      if (existingHotel) {
        return res.status(400).json({ message: "Hotel code already exists" });
      }

      const hotel = await storage.createHotel(hotelData);
      res.status(201).json(hotel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid hotel data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create hotel" });
    }
  });

  app.get("/api/hotels-with-stats", async (req, res) => {
    try {
      const hotels = await storage.getHotelsWithStats();
      res.json(hotels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotels with stats" });
    }
  });

  // Sales routes
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getSalesWithHotels();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await storage.getSale(id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const saleData = insertSaleSchema.parse(req.body);
      const sale = await storage.createSale(saleData);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.get("/api/sales/hotel/:hotelId", async (req, res) => {
    try {
      const hotelId = parseInt(req.params.hotelId);
      const sales = await storage.getSalesByHotel(hotelId);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales for hotel" });
    }
  });

  // Payments routes
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.get("/api/payments/sale/:saleId", async (req, res) => {
    try {
      const saleId = parseInt(req.params.saleId);
      const payments = await storage.getPaymentsBySale(saleId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments for sale" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/recent-sales", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const sales = await storage.getRecentSales(limit);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent sales" });
    }
  });

  // Excel import route
  app.post("/api/import/excel", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const XLSX = await import("xlsx");
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const importResults = {
        success: 0,
        errors: [] as { row: number; error: string }[],
        newHotels: 0,
        newSales: 0,
        newPayments: 0,
      };

      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i] as any;
          
          // Map Excel columns to our schema
          const importRow: ExcelImportRow = {
            hotelName: row["Hotel Name"] || row.hotelName,
            date: row["Date"] || row.date,
            quantity: Number(row["Quantity"] || row.quantity),
            ratePerTon: Number(row["Rate Per Ton"] || row.ratePerTon || row["Rate"]),
            totalAmount: Number(row["Total Amount"] || row.totalAmount || row["Amount"]),
            paymentStatus: row["Payment Status"] || row.paymentStatus,
            paymentDate: row["Payment Date"] || row.paymentDate,
            paymentAmount: row["Payment Amount"] ? Number(row["Payment Amount"]) : undefined,
            notes: row["Notes"] || row.notes,
          };

          const validatedRow = excelImportSchema.parse(importRow);

          // Find or create hotel
          let hotel = await storage.getHotelByName(validatedRow.hotelName);
          if (!hotel) {
            const hotelCode = validatedRow.hotelName
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "")
              .substring(0, 6);
            
            hotel = await storage.createHotel({
              name: validatedRow.hotelName,
              code: hotelCode + Date.now().toString().slice(-3),
              isActive: true,
            });
            importResults.newHotels++;
          }

          // Create sale
          const sale = await storage.createSale({
            hotelId: hotel.id,
            date: new Date(validatedRow.date),
            quantity: validatedRow.quantity.toString(),
            ratePerTon: validatedRow.ratePerTon.toString(),
            totalAmount: validatedRow.totalAmount.toString(),
            notes: validatedRow.notes,
          });
          importResults.newSales++;

          // Create payment if provided
          if (validatedRow.paymentDate && validatedRow.paymentAmount) {
            await storage.createPayment({
              saleId: sale.id,
              amount: validatedRow.paymentAmount.toString(),
              paymentDate: new Date(validatedRow.paymentDate),
              notes: `Imported from Excel`,
            });
            importResults.newPayments++;
          } else if (validatedRow.paymentStatus === "paid") {
            await storage.createPayment({
              saleId: sale.id,
              amount: validatedRow.totalAmount.toString(),
              paymentDate: new Date(validatedRow.date),
              notes: `Imported from Excel - Full payment`,
            });
            importResults.newPayments++;
          }

          importResults.success++;
        } catch (error) {
          importResults.errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      res.json(importResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to process Excel file" });
    }
  });

  // Export routes
  app.get("/api/export/sales", async (req, res) => {
    try {
      const sales = await storage.getSalesWithHotels();
      
      const exportData = sales.map(sale => ({
        "Hotel Name": sale.hotel.name,
        "Hotel Code": sale.hotel.code,
        "Date": sale.date.toISOString().split('T')[0],
        "Quantity (tons)": sale.quantity,
        "Rate Per Ton": sale.ratePerTon,
        "Total Amount": sale.totalAmount,
        "Payment Status": sale.paymentStatus,
        "Paid Amount": sale.paidAmount,
        "Pending Amount": sale.pendingAmount,
        "Notes": sale.notes || "",
      }));

      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export sales data" });
    }
  });

  app.get("/api/export/statement/:hotelId", async (req, res) => {
    try {
      const hotelId = parseInt(req.params.hotelId);
      const hotel = await storage.getHotel(hotelId);
      const sales = await storage.getSalesByHotel(hotelId);

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      const statement = {
        hotel,
        sales,
        summary: {
          totalSales: sales.length,
          totalAmount: sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0),
          totalPaid: sales.reduce((sum, sale) => sum + sale.paidAmount, 0),
          totalPending: sales.reduce((sum, sale) => sum + sale.pendingAmount, 0),
        },
        generatedAt: new Date(),
      };

      res.json(statement);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate statement" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
