import { db } from "./db";
import { companies } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  try {
    console.log("🔧 Attempting to seed database...");
    
    // Test database connection first
    await db.execute(sql`SELECT 1`);
    console.log("✓ Database connection established");
    
    // Check if default company exists
    const existingCompanies = await db.select().from(companies);
    
    if (existingCompanies.length === 0) {
      // Create default company
      await db.insert(companies).values({
        name: "Default Charcoal Business",
        code: "DEFAULT001",
        contactPerson: null,
        phone: null,
        email: null,
        address: null,
        taxId: null,
        isActive: true,
      });
      
      console.log("✓ Default company created");
    } else {
      console.log("✓ Default company already exists");
    }
    
    console.log("✓ Database seeded successfully");
  } catch (error) {
    console.error("Failed to seed database:", error.message);
    console.log("⚠️  Application will continue without seeding");
    // Don't throw error to prevent app crash
  }
}