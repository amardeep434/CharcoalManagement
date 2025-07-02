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