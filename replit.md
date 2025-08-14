# CharcoalBiz - Sales Management System

## Overview
CharcoalBiz is a full-stack sales management application designed for charcoal businesses. Its purpose is to track sales, manage hotel customers, process payments, and generate statements. Key capabilities include a comprehensive dashboard with real-time analytics and robust data import/export functionality, supporting multi-company operations. The vision is to provide a comprehensive tool for charcoal businesses to efficiently manage their sales and customer relationships.

## User Preferences
Preferred communication style: Simple, everyday language.
Preferred measurement units: Kilograms (kg) for all charcoal quantities.
Database policy: Never switch to in-memory storage, local storage, or any temporary storage solutions when database or app is not working - always fix the actual database connection problem unless explicitly asked to use alternative storage.

## System Architecture
CharcoalBiz follows a clear separation of concerns with a full-stack architecture.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS custom properties
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **UI/UX Decisions**: Mobile-responsive design with collapsible navigation, consistent icon system (lucide-react), and accessible UI primitives. Color schemes and design approaches are managed via Tailwind CSS and Radix UI.

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **File Processing**: Multer for Excel file uploads
- **Session Management**: Express sessions with PostgreSQL store
- **System Design Choices**:
    - **Database Schema**: Includes tables for Companies, Suppliers, Hotels, Sales, Payments, Purchases, and Purchase Payments, all with foreign key constraints.
    - **API Structure**: Comprehensive CRUD operations for all entities (Companies, Suppliers, Hotels, Sales, Payments, Purchases, Purchase Payments), Dashboard analytics, and Import/Export functionality supporting multi-company operations.
    - **Authentication System**: Session-based authentication with bcrypt for password hashing, user roles (admin, manager, operator, viewer), and an audit logging system.
    - **Company Management**: Full frontend interface for CRUD operations on company entities, including validation and status management.
    - **Automated Migration System**: Drizzle Kit is used for schema migrations with an automated system that watches schema files, generates SQL, and integrates with Git hooks to ensure current migrations without manual intervention. This system automatically includes production features like performance indexes and security configurations.
    - **Production Readiness**: Focus on security (secure cookies, HTTP headers, input validation), performance (connection pooling, indexes, compression, query optimization), monitoring (structured logging, health checks), and reliability (graceful error handling, connection recovery).

### Data Flow
- **Sales Process**: User input via modal forms, Zod validation, API interaction for record creation, real-time UI updates via React Query.
- **Payment Processing**: Payments linked to sales, status calculation based on amounts, real-time UI updates.
- **Data Import**: Excel file upload via drag-and-drop, server-side validation and processing, batch record creation, and error reporting.
- **Company Management**: Complete frontend interface with search, filtering, CRUD operations via modal forms, real-time statistics display, and responsive design implementation.

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon Database.
- **drizzle-orm**: Type-safe ORM for PostgreSQL.
- **@tanstack/react-query**: Server state management and caching.
- **react-hook-form**: Form handling.
- **zod**: Runtime schema validation.
- **date-fns**: Date manipulation.
- **multer**: File upload middleware.
- **@radix-ui/***: Accessible UI primitives.
- **lucide-react**: Icon system.
- **tailwindcss**: Utility-first CSS framework.
- **class-variance-authority**: Type-safe variant handling.
- **tsx**: TypeScript execution for development.
- **esbuild**: JavaScript bundler for production.

## Company Management Interface

Today's implementation includes a complete frontend interface for company administration:

### Frontend Pages and Components
- **Companies Page** (`/companies`): Full-featured listing with company statistics, search functionality, and responsive design
- **New Company Modal**: Comprehensive form with React Hook Form and Zod validation for creating companies
- **Edit Company Modal**: Pre-populated editing interface with status toggle and form validation
- **Navigation Integration**: Added to sidebar menu between Suppliers and Statements sections

### Key Features Implemented
- **Search and Filtering**: Multi-field search across company name, code, contact person, and email
- **Company Statistics**: Real-time display of sales totals, purchase amounts, and pending payments per company
- **Form Validation**: Zod schema validation with proper TypeScript handling of nullable fields
- **CRUD Operations**: Complete create, read, update, delete functionality with confirmation dialogs
- **Status Management**: Active/inactive toggle with visual status indicators and badges
- **Real-time Updates**: TanStack Query integration for immediate UI updates after operations
- **Error Handling**: Comprehensive toast notifications for success and error states
- **Responsive Design**: Mobile and desktop optimized interface with proper loading states

### Technical Implementation
- **Modal Components**: Reusable dialog components for create and edit operations
- **Form Components**: React Hook Form integration with proper field validation and error display
- **API Integration**: Full CRUD operations connecting to existing backend company endpoints
- **State Management**: React Query cache management with query invalidation for optimal performance
- **TypeScript Integration**: Proper handling of `InsertCompany` and `Company` types with nullable field support

### Company Data Fields
- **Required Fields**: Company name and unique company code with validation
- **Optional Fields**: Contact person, phone number, email address, physical address, tax ID/GST number
- **Status Field**: Active/inactive toggle with visual indicators and business logic
- **Statistics Display**: Integrated sales, purchase, and financial data per company
- **Validation Rules**: Email format validation, required field enforcement, and unique code constraints

This completes the company management functionality with a production-ready interface that connects to the existing backend APIs and provides comprehensive business administration capabilities.

## Recent Changes and Updates
- August 14, 2025: Resolved database connectivity issues by provisioning fresh Neon Database endpoint
- August 14, 2025: Verified complete application functionality with PostgreSQL database and authentication system
- August 14, 2025: Implemented complete company management frontend interface with advanced features including search, statistics, modal forms, validation, navigation integration, and responsive design connecting to existing backend APIs

## Company Management System

The application includes a complete company management interface implemented to provide full administrative control over business entities:

### Frontend Interface
- **Companies Page**: Full-featured company listing with search, filtering, and pagination
- **Create Company Modal**: Comprehensive form for adding new companies with validation
- **Edit Company Modal**: Complete editing interface for updating company information
- **Delete Functionality**: Safe company deletion with confirmation dialogs
- **Status Management**: Toggle company active/inactive status with visual indicators

### Key Features
- **Form Validation**: Zod schema validation for all company data fields
- **Type Safety**: Full TypeScript integration with proper null handling for optional fields
- **Real-time Updates**: TanStack Query integration for immediate UI updates after operations
- **Error Handling**: Comprehensive error states and user feedback via toast notifications
- **Navigation Integration**: Company management accessible via sidebar navigation

### Technical Implementation
- **Modal Components**: Reusable modal dialogs for create/edit operations
- **Form Components**: React Hook Form integration with proper field validation
- **API Integration**: Full CRUD operations connecting to existing backend endpoints
- **State Management**: React Query cache management for optimal performance

### Company Data Fields
- **Required Fields**: Company name and unique company code
- **Optional Fields**: Contact person, phone, email, address, tax ID/GST number
- **Status Field**: Active/inactive toggle with visual status indicators
- **Validation**: Email format validation, required field validation, unique code enforcement

This completes the company management functionality that was previously available only through backend APIs, now providing a full user interface for business administration.

## Authentication System

The application includes a comprehensive authentication system:
- Session-based authentication using express-session
- Password hashing with bcryptjs
- Default admin account: username 'admin', password 'admin123'
- User roles: admin, manager, operator, viewer with hierarchical permissions
- Comprehensive audit trail tracking all user actions
- Protected routes requiring authentication
- User information display in sidebar with logout functionality

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

## Recent Changes
- June 28, 2025: Initial setup with multi-company architecture, suppliers, purchase tracking, and PostgreSQL integration
- June 29, 2025: Migrated from Replit Agent to standard environment, added company selection to sales forms
- June 30, 2025: Implemented session-based authentication, role-based access control, audit logging, updated units to kilograms
- July 2, 2025: Fixed authentication conflicts (bcrypt→bcryptjs), comprehensive user management, audit logs interface, logout functionality, CORS configuration, mobile-responsive design, database migration SQL, deployment documentation
- July 3, 2025: Implemented automated migration file synchronization system with schema watching and SQL generation
- July 4, 2025: Completed production readiness improvements with enterprise-grade security, performance optimization, and monitoring capabilities
- August 14, 2025: Resolved database connectivity issues, verified full application functionality
- August 14, 2025: Completed company management frontend interface with full CRUD operations, modal forms, TypeScript integration, form validation, and navigation integration