import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { dbStorage as storage } from "./storage";
import { 
  insertCompanySchema, insertSupplierSchema, insertHotelSchema, insertSaleSchema, insertPaymentSchema, 
  insertPurchaseSchema, insertPurchasePaymentSchema, excelImportSchema, purchaseImportSchema, insertUserSchema,
  type ExcelImportRow, type PurchaseImportRow 
} from "@shared/schema";
import { isAuthenticated, requireRole, requirePermission, auditLog } from "./replitAuth";
import multer from "multer";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";
import { pool } from "./db";

// Extend Request type to include file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ storage: multer.memoryStorage() });
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Use memory session store for reliability
  const sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000, // prune expired entries every 24h
  });

  // Session-based authentication setup with memory store
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'charcoal-biz-secret-key',
    resave: false,
    saveUninitialized: false, // Don't create session until needed
    rolling: true, // Reset expiry on activity
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      httpOnly: false, // Allow JavaScript access for debugging
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // Better compatibility for development
      domain: undefined, // Don't restrict domain for development
      path: '/' // Ensure cookie is available for all paths
    },
    name: 'connect.sid' // Use default session cookie name
  }));

  // Use the imported authentication middleware with Authorization header support
  const requireAuth = isAuthenticated;

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Store user in session AND generate auth token
      (req.session as any).userId = user.id;
      console.log('Login - Session ID after setting userId:', req.sessionID);
      console.log('Login - Session after setting userId:', req.session);
      console.log('Login - userId set to:', user.id);
      
      // Generate simple auth token as fallback
      const authToken = Buffer.from(`${user.id}:${req.sessionID}:${Date.now()}`).toString('base64');
      (req.session as any).authToken = authToken;
      
      // Explicitly save session to ensure it's written to the database
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            reject(err);
          } else {
            console.log('Session saved successfully');
            resolve();
          }
        });
      });
      
      // Log the login
      await storage.createAuditLog({
        userId: user.id.toString(),
        action: 'LOGIN',
        tableName: 'users',
        recordId: user.id,
        newValues: null,
        oldValues: null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ 
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        authToken: authToken
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    (req.session as any).destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({ 
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions
      });
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', requireAuth, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      })));
    } catch (error) {
      console.error("Users fetch error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', requireAuth, async (req, res) => {
    try {
      // Extract password and validate the rest  
      const { password, ...userData } = req.body;
      
      // Validate password
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Validate other user data (without passwordHash)
      const userSchema = z.object({
        username: z.string().min(1),
        email: z.string().email().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        role: z.string().default("viewer"),
        isActive: z.boolean().default(true),
        companyAccess: z.any().optional(),
        permissions: z.any().optional(),
      });
      
      const validatedData = userSchema.parse(userData);
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        ...validatedData,
        passwordHash: hashedPassword
      });

      // Log the creation
      await storage.createAuditLog({
        userId: ((req.session as any).userId).toString(),
        action: 'CREATE',
        tableName: 'users',
        recordId: user.id,
        newValues: { username: user.username, role: user.role },
        oldValues: null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      });
    } catch (error) {
      console.error("User creation error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updateData: any = { ...req.body };
      
      // Hash password if provided
      if (updateData.password) {
        updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
        delete updateData.password;
      }
      
      const user = await storage.updateUser(userId, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log the update
      await storage.createAuditLog({
        userId: ((req.session as any).userId).toString(),
        action: 'UPDATE',
        tableName: 'users',
        recordId: user.id,
        newValues: { username: user.username, role: user.role, isActive: user.isActive },
        oldValues: null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      });
    } catch (error) {
      console.error("User update error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting the admin user
      if (user.username === 'admin') {
        return res.status(400).json({ message: "Cannot delete admin user" });
      }

      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log the deletion
      await storage.createAuditLog({
        userId: ((req.session as any).userId).toString(),
        action: 'DELETE',
        tableName: 'users',
        recordId: userId,
        newValues: null,
        oldValues: { username: user.username, role: user.role },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("User deletion error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Audit log routes
  app.get('/api/audit-logs', requireAuth, async (req, res) => {
    try {
      const { userId, tableName, limit } = req.query;
      const logs = await storage.getAuditLogs({
        userId: userId ? parseInt(userId as string) : undefined,
        tableName: tableName as string,
        limit: limit ? parseInt(limit as string) : 50
      });
      res.json(logs);
    } catch (error) {
      console.error("Audit logs fetch error:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Company routes
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      
      // Check for duplicate code
      const existingCompany = await storage.getCompanyByCode(companyData.code);
      if (existingCompany) {
        return res.status(400).json({ message: "Company code already exists" });
      }

      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid company data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.get("/api/companies-with-stats", async (req, res) => {
    try {
      const companies = await storage.getCompaniesWithStats();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies with stats" });
    }
  });

  // Supplier routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      
      // Check for duplicate code
      const existingSupplier = await storage.getSupplierByCode(supplierData.code);
      if (existingSupplier) {
        return res.status(400).json({ message: "Supplier code already exists" });
      }

      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.get("/api/suppliers-with-stats", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliersWithStats();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers with stats" });
    }
  });

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
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const sales = await storage.getSalesWithHotels(companyId);
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

  // Purchase routes
  app.get("/api/purchases", async (req, res) => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const purchases = await storage.getPurchasesWithSuppliers(companyId);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get("/api/purchases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const purchase = await storage.getPurchase(id);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase" });
    }
  });

  app.post("/api/purchases", async (req, res) => {
    try {
      const purchaseData = insertPurchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase(purchaseData);
      res.status(201).json(purchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  app.get("/api/purchases/supplier/:supplierId", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.supplierId);
      const purchases = await storage.getPurchasesBySupplier(supplierId);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchases for supplier" });
    }
  });

  // Purchase Payment routes
  app.get("/api/purchase-payments", async (req, res) => {
    try {
      const payments = await storage.getPurchasePayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase payments" });
    }
  });

  app.get("/api/purchase-payments/purchase/:purchaseId", async (req, res) => {
    try {
      const purchaseId = parseInt(req.params.purchaseId);
      const payments = await storage.getPurchasePaymentsByPurchase(purchaseId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments for purchase" });
    }
  });

  app.post("/api/purchase-payments", async (req, res) => {
    try {
      const paymentData = insertPurchasePaymentSchema.parse(req.body);
      const payment = await storage.createPurchasePayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const stats = await storage.getDashboardStats(companyId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/recent-sales", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const sales = await storage.getRecentSales(limit, companyId);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent sales" });
    }
  });

  app.get("/api/dashboard/recent-purchases", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      const purchases = await storage.getRecentPurchases(limit, companyId);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent purchases" });
    }
  });

  // Excel import route
  app.post("/api/import/excel", upload.single("file"), async (req: MulterRequest, res) => {
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
            companyName: row["Company Name"] || row.companyName || "Default Charcoal Business",
            hotelName: row["Hotel Name"] || row.hotelName,
            date: row["Date"] || row.date,
            quantity: Number(row["Quantity"] || row.quantity),
            ratePerKg: Number(row["Rate Per Kg"] || row.ratePerKg || row["Rate"]),
            totalAmount: Number(row["Total Amount"] || row.totalAmount || row["Amount"]),
            paymentStatus: row["Payment Status"] || row.paymentStatus,
            paymentDate: row["Payment Date"] || row.paymentDate,
            paymentAmount: row["Payment Amount"] ? Number(row["Payment Amount"]) : undefined,
            notes: row["Notes"] || row.notes,
          };

          const validatedRow = excelImportSchema.parse(importRow);

          // Find or create company
          let company = await storage.getCompanyByName(validatedRow.companyName);
          if (!company) {
            const companyCode = validatedRow.companyName
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "")
              .substring(0, 6);
            
            company = await storage.createCompany({
              name: validatedRow.companyName,
              code: companyCode + Date.now().toString().slice(-3),
              isActive: true,
            });
          }

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
            companyId: company.id,
            hotelId: hotel.id,
            date: new Date(validatedRow.date),
            quantity: Number(validatedRow.quantity),
            ratePerKg: Number(validatedRow.ratePerKg),
            totalAmount: Number(validatedRow.totalAmount),
            notes: validatedRow.notes || null,
          });
          importResults.newSales++;

          // Create payment if provided
          if (validatedRow.paymentDate && validatedRow.paymentAmount) {
            await storage.createPayment({
              saleId: sale.id,
              amount: validatedRow.paymentAmount,
              paymentDate: new Date(validatedRow.paymentDate),
              notes: `Imported from Excel`,
            });
            importResults.newPayments++;
          } else if (validatedRow.paymentStatus === "paid") {
            await storage.createPayment({
              saleId: sale.id,
              amount: validatedRow.totalAmount,
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
        "Quantity (kg)": sale.quantity,
        "Rate Per Kg": sale.ratePerKg,
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
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
      
      const hotel = await storage.getHotel(hotelId);
      const sales = await storage.getSalesByHotel(hotelId);
      
      // Filter sales by company if specified
      const filteredSales = companyId 
        ? sales.filter(sale => sale.companyId === companyId)
        : sales;

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      const statement = {
        hotel,
        sales: filteredSales,
        summary: {
          totalSales: filteredSales.length,
          totalAmount: filteredSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0),
          totalPaid: filteredSales.reduce((sum, sale) => sum + sale.paidAmount, 0),
          totalPending: filteredSales.reduce((sum, sale) => sum + sale.pendingAmount, 0),
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
