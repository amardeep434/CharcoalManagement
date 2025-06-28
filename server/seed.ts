import { db } from "./db";
import { companies } from "@shared/schema";

export async function seedDatabase() {
  try {
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
    }
    
    console.log("✓ Database seeded successfully");
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}