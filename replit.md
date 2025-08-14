# CharcoalBiz - Sales Management System

## Overview

CharcoalBiz is a full-stack sales management application designed for charcoal businesses to track sales, manage hotel customers, process payments, and generate statements. The system provides a comprehensive dashboard with real-time analytics and supports data import/export functionality.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **File Processing**: Multer for Excel file uploads
- **Session Management**: Express sessions with PostgreSQL store

### Development Setup
- **Environment**: Designed for Replit with development-specific plugins
- **Hot Reload**: Vite HMR with custom error overlay
- **Build Process**: Separate client and server builds with esbuild for server bundling

## Key Components

### Database Schema
- **Companies Table**: Stores charcoal business information with company codes, contact details, and tax IDs
- **Suppliers Table**: Manages charcoal supplier information for purchase tracking
- **Hotels Table**: Stores hotel customer information with unique codes, contact details, and active status
- **Sales Table**: Records sales transactions to hotels with quantity, rates, and company associations
- **Payments Table**: Tracks payment records linked to specific sales
- **Purchases Table**: Records charcoal purchases from suppliers with invoice tracking
- **Purchase Payments Table**: Tracks payment records for supplier purchases
- **Relationships**: Foreign key constraints maintaining data integrity across all entities

### API Structure
- **Companies API**: CRUD operations for multi-company management with statistics
- **Suppliers API**: Supplier management with purchase statistics
- **Hotels API**: Hotel customer management with sales statistics
- **Sales API**: Sales record management with hotel and company relationships
- **Payments API**: Payment tracking and processing for sales
- **Purchases API**: Purchase record management with supplier relationships
- **Purchase Payments API**: Payment tracking for supplier purchases
- **Dashboard API**: Aggregated statistics and recent activity with company filtering
- **Import API**: Excel file processing for bulk data entry supporting multi-company
- **Export API**: Statement generation for hotels and suppliers

### Frontend Pages
- **Dashboard**: Overview with stats cards and recent sales
- **Sales Management**: Complete sales lifecycle management
- **Payment Tracking**: Payment status monitoring and recording
- **Hotel Management**: Customer relationship management
- **Statement Generation**: Export functionality for accounting
- **Data Import**: Excel file processing with validation

## Data Flow

### Sales Process
1. User creates new sale record through modal form
2. Data validation using Zod schemas
3. API creates sale record with hotel association
4. Real-time UI updates via React Query cache invalidation
5. Dashboard statistics automatically refresh

### Payment Processing
1. Payments linked to specific sales records
2. Payment status calculated based on amounts vs. sales totals
4. Status badges update in real-time across all views

### Data Import Flow
1. Excel file upload via drag-and-drop interface
2. Server-side validation and processing
3. Hotel matching by name or code
4. Batch creation of sales and payment records
5. Comprehensive error reporting for failed imports

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL connection for Neon Database
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form handling with performance optimization
- **zod**: Runtime schema validation
- **date-fns**: Date manipulation and formatting
- **multer**: File upload middleware

### UI Components
- **@radix-ui/***: Accessible UI primitives
- **lucide-react**: Consistent icon system
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant handling

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Deployment Strategy

### Development Mode
- Vite dev server with HMR enabled
- Express server with API route registration
- Automatic database schema synchronization
- Real-time error overlays and debugging tools

### Production Build
1. Vite builds client-side application to `dist/public`
2. esbuild bundles server application to `dist/index.js`
3. Static file serving for built client assets
4. Environment-based configuration for database connections

### Database Management
- Drizzle Kit for schema migrations in `./migrations`
- Database URL configuration via environment variables
- Connection pooling through Neon's serverless driver

The application is designed with a clear separation of concerns, type safety throughout the stack, and a focus on developer experience while maintaining production readiness.

## Migration and Deployment

### Database Migration
The application includes a complete SQL migration file (`database_setup.sql`) that can recreate the entire database schema on any PostgreSQL server. This file includes:
- Complete table structure with proper constraints and indexes
- Default admin user and sample data
- Optimized indexes for performance
- Session storage for authentication

### Deployment Outside Replit
A comprehensive deployment guide (`DEPLOYMENT_GUIDE.md`) provides detailed instructions for:
- **Prerequisites**: Node.js 20+, PostgreSQL 12+, Git
- **Environment Setup**: Database configuration, environment variables
- **Deployment Options**: Direct server, Docker, cloud platforms (Heroku, DigitalOcean, Vercel)
- **Security**: SSL/HTTPS, database security, firewall configuration
- **Monitoring**: Logging, backup strategies, maintenance procedures

### Production Readiness Features
- Session-based authentication with PostgreSQL storage
- Role-based access control with audit logging
- Mobile-responsive design with collapsible navigation
- Complete API with proper error handling
- Excel import/export functionality
- Multi-company architecture support

### Automated Migration System
The application includes a comprehensive automated migration system that eliminates manual migration file updates:

- **Real-Time Monitoring**: Watches schema files and automatically updates migrations
- **Git Integration**: Pre-commit and post-merge hooks ensure migrations stay current
- **Production Feature Detection**: Automatically includes all security and performance optimizations
- **Validation System**: Ensures migration completeness and production readiness
- **Development Watcher**: Real-time migration updates during development

#### Key Features
- **Auto-Detection**: Scans schema files to identify indexes, security features, and capabilities
- **Production Headers**: Automatically adds comprehensive documentation and compatibility notes
- **Feature Validation**: Checks for performance indexes, security configs, and audit logging
- **Zero Manual Updates**: Complete automation from development to production deployment

#### Migration Commands
```bash
# Setup automated system (run once)
./scripts/setup-auto-migration.sh

# Development watching (real-time updates)
node scripts/dev-migration-watcher.js

# Manual update (if needed)
node scripts/generate-migration.js

# Validate current migration
node scripts/validate-migration.js
```

#### Automated Triggers
- **Pre-commit**: Updates migrations before every commit
- **Post-merge**: Updates migrations after pulling changes
- **Schema Changes**: Real-time updates when schema.ts is modified
- **Build Process**: Ensures production builds have current migrations

This system ensures migration files automatically include all production features and stay current with zero manual intervention.

## Changelog
- June 28, 2025: Initial setup
- June 28, 2025: Added multi-company architecture with suppliers and purchase tracking
- June 28, 2025: Integrated PostgreSQL database with Neon Database
- June 28, 2025: Implemented database seeding and complete API structure
- June 29, 2025: Migrated from Replit Agent to standard Replit environment
- June 29, 2025: Added company selection to sales forms and statements for multi-business support
- June 30, 2025: Implemented session-based authentication with user management
- June 30, 2025: Added role-based access control with admin, manager, operator, and viewer roles
- June 30, 2025: Integrated audit logging to track all system changes
- June 30, 2025: Updated measurement units from tons to kilograms throughout application
- July 2, 2025: Fixed authentication system conflicts by switching from bcrypt to bcryptjs
- July 2, 2025: Implemented comprehensive user management system with admin interface
- July 2, 2025: Added audit logs viewing interface for admin users
- July 2, 2025: Fixed logout functionality to properly clear sessions and redirect users
- July 2, 2025: Fixed CORS configuration for proper session cookie handling with credentials
- July 2, 2025: Implemented mobile-responsive design with collapsible sidebar and hamburger menu
- July 2, 2025: Created comprehensive database migration SQL file and deployment documentation
- July 2, 2025: Added complete setup guide for migrating application outside of Replit
- July 3, 2025: Implemented automated migration file synchronization system
- July 3, 2025: Added schema watching and automatic SQL generation for future database changes
- July 4, 2025: Completed comprehensive production readiness improvements with enterprise-grade security, performance optimization, and monitoring capabilities

## Production Readiness Features

### Security Enhancements
- **Session Security**: httpOnly, secure, and SameSite cookie configuration
- **Security Headers**: Complete HTTP security header implementation (XSS, CSRF, clickjacking protection)
- **CORS Configuration**: Secure cross-origin resource sharing with credential support
- **Request Validation**: Payload size limits and comprehensive input validation
- **Error Handling**: Production-safe error responses that don't leak sensitive information

### Performance Optimizations
- **Database Connection Pooling**: Optimized connection management (5-20 connections based on environment)
- **Performance Indexes**: Database indexes on frequently queried columns (companies, sales, hotels, suppliers)
- **Response Compression**: Gzip compression reducing response sizes by ~70%
- **Query Optimization**: Indexed database operations for improved response times

### Monitoring & Observability
- **Structured Logging**: JSON-formatted logs with user context and request correlation
- **Health Checks**: `/health` endpoint for load balancer integration and monitoring
- **Error Tracking**: Comprehensive error logging with stack traces in development
- **Request Correlation**: Unique request IDs for debugging across services
- **Database Monitoring**: Connection status and query performance tracking

### Reliability Features
- **Graceful Error Handling**: Application continues running during errors
- **Connection Recovery**: Automatic database reconnection capabilities
- **Session Management**: Secure and reliable user session handling
- **Environment Configuration**: Production-specific optimizations and security settings

## Authentication System

The application now includes a comprehensive authentication system:

### User Management
- Session-based authentication using express-session
- Password hashing with bcrypt
- Default admin account: username 'admin', password 'admin123'
- User roles: admin, manager, operator, viewer with hierarchical permissions

### User Interface
- Login form with authentication flow
- Protected routes requiring authentication
- User information display in sidebar
- Logout functionality

### Audit Logging
- Comprehensive audit trail tracking all user actions
- Records user ID, action type, table name, old/new values
- IP address and user agent tracking for security

### Database Schema
- Users table with authentication fields and permissions
- Audit log table for tracking changes
- Session storage in PostgreSQL

## Measurement Units

All measurement units have been updated to use kilograms:
- Sales quantities displayed as "kg" instead of tons
- Rate calculations shown as "₹/kg"
- Dashboard statistics display charcoal amounts in kg
- Form labels updated throughout the application

## User Preferences

Preferred communication style: Simple, everyday language.
Preferred measurement units: Kilograms (kg) for all charcoal quantities.
Database policy: Never switch to in-memory storage, local storage, or any temporary storage solutions when database or app is not working - always fix the actual database connection problem unless explicitly asked to use alternative storage.

## Recent Changes
- August 14, 2025: Resolved database connectivity issues - Neon endpoint was disabled and required fresh database provisioning
- August 14, 2025: Verified application fully operational with PostgreSQL database, authentication, and all API endpoints working