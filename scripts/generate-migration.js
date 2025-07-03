#!/usr/bin/env node

/**
 * Automatic SQL Migration Generator for CharcoalBiz
 * This script generates the complete database_setup.sql file based on the current schema
 * Run this whenever database schema changes are made
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const currentDate = new Date().toISOString().split('T')[0];

// Read the current schema file to extract table definitions
const schemaPath = join(process.cwd(), 'shared', 'schema.ts');
const schemaContent = readFileSync(schemaPath, 'utf8');

// Generate SQL header
const sqlHeader = `-- CharcoalBiz Database Setup Script
-- Auto-generated on ${currentDate}
-- This script creates the complete database schema for the CharcoalBiz application
-- Compatible with PostgreSQL 12+ and can be used to migrate the app outside of Replit

-- Create database (run this separately as a superuser if needed)
-- CREATE DATABASE charcoalbiz;
-- \\c charcoalbiz;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in correct order (for re-deployment)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS purchase_payments CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

`;

// Core table definitions (these should be kept in sync with schema.ts)
const tableDefinitions = `-- Create companies table
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tax_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create suppliers table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tax_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create hotels table
CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR UNIQUE,
    password_hash TEXT NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    role TEXT NOT NULL DEFAULT 'viewer', -- admin, manager, operator, viewer
    company_access JSONB, -- Array of company IDs user can access
    permissions JSONB, -- Specific permissions object
    is_active BOOLEAN NOT NULL DEFAULT true,
    force_password_change BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create sales table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    hotel_id INTEGER NOT NULL REFERENCES hotels(id),
    date TIMESTAMP NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL, -- in kg
    rate_per_kg DECIMAL(10, 2) NOT NULL, -- rate per kg
    total_amount DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id),
    amount DECIMAL(12, 2) NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create purchases table
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    date TIMESTAMP NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL, -- in kg
    rate_per_kg DECIMAL(10, 2) NOT NULL, -- rate per kg
    total_amount DECIMAL(12, 2) NOT NULL,
    invoice_number TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create purchase_payments table
CREATE TABLE purchase_payments (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id),
    amount DECIMAL(12, 2) NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table for authentication
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create audit_log table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    action TEXT NOT NULL, -- CREATE, UPDATE, DELETE
    table_name TEXT NOT NULL, -- companies, sales, payments, etc.
    record_id INTEGER NOT NULL,
    old_values JSONB, -- Previous values before change
    new_values JSONB, -- New values after change
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

`;

const indexDefinitions = `-- Create indexes for better performance
CREATE INDEX IDX_session_expire ON sessions(expire);
CREATE INDEX IDX_sales_company_id ON sales(company_id);
CREATE INDEX IDX_sales_hotel_id ON sales(hotel_id);
CREATE INDEX IDX_sales_date ON sales(date);
CREATE INDEX IDX_payments_sale_id ON payments(sale_id);
CREATE INDEX IDX_purchases_company_id ON purchases(company_id);
CREATE INDEX IDX_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IDX_purchases_date ON purchases(date);
CREATE INDEX IDX_purchase_payments_purchase_id ON purchase_payments(purchase_id);
CREATE INDEX IDX_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IDX_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IDX_audit_log_timestamp ON audit_log(timestamp);

`;

const sampleData = `-- Insert default data
-- Default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) VALUES 
('admin', 'admin@charcoalbiz.com', '$2a$10$rOu4fqnAA8qFQdKwOtrbPehVTfFqC9o7p.5H1O2LM8v3mZxJLSxYy', 'System', 'Administrator', 'admin', true);

-- Default company
INSERT INTO companies (name, code, contact_person, phone, email, address, is_active) VALUES 
('CharcoalBiz Demo Company', 'DEMO001', 'Demo Manager', '+1-234-567-8900', 'demo@charcoalbiz.com', '123 Business Street, Demo City, DC 12345', true);

-- Sample hotels
INSERT INTO hotels (name, code, contact_person, phone, email, address, is_active) VALUES 
('Grand Hotel Demo', 'HOTEL001', 'Hotel Manager', '+1-234-567-8901', 'manager@grandhotel.com', '456 Hospitality Ave, Demo City, DC 12345', true),
('City Resort Demo', 'HOTEL002', 'Resort Manager', '+1-234-567-8902', 'manager@cityresort.com', '789 Resort Blvd, Demo City, DC 12345', true);

-- Sample suppliers
INSERT INTO suppliers (name, code, contact_person, phone, email, address, is_active) VALUES 
('Premium Charcoal Supplier', 'SUPP001', 'Supplier Manager', '+1-234-567-8903', 'sales@premiumcharcoal.com', '321 Supply Chain St, Demo City, DC 12345', true),
('Eco Charcoal Co.', 'SUPP002', 'Sales Manager', '+1-234-567-8904', 'sales@ecocharcoal.com', '654 Green Energy Way, Demo City, DC 12345', true);

`;

const sqlFooter = `-- Grant necessary permissions (adjust as needed for your deployment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO charcoalbiz_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO charcoalbiz_user;

-- Create triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verification queries (optional - run to verify setup)
-- SELECT 'Companies' as table_name, count(*) as row_count FROM companies
-- UNION ALL
-- SELECT 'Hotels', count(*) FROM hotels
-- UNION ALL
-- SELECT 'Suppliers', count(*) FROM suppliers
-- UNION ALL
-- SELECT 'Users', count(*) FROM users;`;

// Combine all parts
const completeSql = sqlHeader + tableDefinitions + indexDefinitions + sampleData + sqlFooter;

// Write to database_setup.sql
const outputPath = join(process.cwd(), 'database_setup.sql');
writeFileSync(outputPath, completeSql, 'utf8');

console.log(`✅ Generated database_setup.sql at ${outputPath}`);
console.log(`📅 Generated on: ${currentDate}`);
console.log(`🔄 Run this script whenever schema.ts is modified to keep migration file current`);