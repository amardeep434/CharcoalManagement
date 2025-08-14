# CharcoalBiz - Sales Management System

## Overview
CharcoalBiz is a full-stack sales management application designed for charcoal businesses. Its primary purpose is to enable tracking of sales, managing hotel customers, processing payments, and generating statements. Key capabilities include a comprehensive dashboard with real-time analytics and robust data import/export functionality. The vision is to provide a comprehensive, multi-company solution for charcoal businesses, improving operational efficiency and providing valuable business insights.

## User Preferences
Preferred communication style: Simple, everyday language.
Preferred measurement units: Kilograms (kg) for all charcoal quantities.
Database policy: Never switch to in-memory storage, local storage, or any temporary storage solutions when database or app is not working - always fix the actual database connection problem unless explicitly asked to use alternative storage.

## System Architecture

### Core Design Principles
The application is designed with a clear separation of concerns, type safety throughout the stack, and a focus on developer experience while maintaining production readiness. It supports a multi-company architecture.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS custom properties
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **UI/UX Decisions**: Mobile-responsive design with collapsible navigation, complete UI consistency across pages with standardized Header components, comprehensive search functionality, and organized filtering systems.

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **File Processing**: Multer for Excel file uploads
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Session-based with bcrypt password hashing, role-based access control (admin, manager, operator, viewer), and audit logging.
- **Measurement Units**: All quantities consistently use kilograms (kg).

### Database Schema
- **Entities**: Companies, Suppliers, Hotels, Sales, Payments, Purchases, Purchase Payments, Users, Audit Logs, and Sessions.
- **Relationships**: Foreign key constraints ensure data integrity.
- **Migration System**: Automated migration system that watches schema files, generates SQL migrations, and integrates with Git hooks to ensure real-time updates and production readiness. Includes comprehensive security, performance, and audit logging features.

### Key Features & Technical Implementations
- **API Structure**: Comprehensive REST APIs for all entities (Companies, Suppliers, Hotels, Sales, Payments, Purchases, Purchase Payments, Dashboard, Import, Export).
- **Frontend Pages**: Dashboard, Sales Management, Payment Tracking, Hotel Management, Supplier Management, Purchase Records, Statement Generation, Data Import, User Management, Audit Logs. All pages feature consistent Header components, comprehensive search functionality, and organized filtering systems.
- **Data Flow**: Structured processes for sales creation, payment processing, and Excel data import with server-side validation and error reporting.
- **Production Readiness**:
    - **Security**: httpOnly/secure/SameSite cookies, security headers, secure CORS, request validation, production-safe error handling.
    - **Performance**: Database connection pooling, performance indexes, response compression (Gzip), query optimization.
    - **Monitoring**: Structured logging, `/health` endpoint, error tracking, request correlation, database monitoring.
    - **Reliability**: Graceful error handling, automatic database reconnection, robust session management.

## External Dependencies

### Core Libraries
- `@neondatabase/serverless`: PostgreSQL connection for Neon Database
- `drizzle-orm`: Type-safe ORM
- `@tanstack/react-query`: Server state management
- `react-hook-form`: Form handling
- `zod`: Runtime schema validation
- `date-fns`: Date manipulation
- `multer`: File upload middleware
- `bcryptjs`: Password hashing

### UI Components
- `@radix-ui/*`: Accessible UI primitives
- `lucide-react`: Icon system
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Type-safe variant handling

### Development Tools
- `tsx`: TypeScript execution
- `esbuild`: JavaScript bundler
- `@replit/vite-plugin-*`: Replit-specific enhancements

## UI Consistency and Search Features

The application features complete UI consistency and comprehensive search functionality across all pages:

### Standardized Page Layout
- **Header Component**: All pages use consistent Header component with title, description, and action buttons
- **Search Interface**: Dedicated search cards with organized filter controls
- **Responsive Design**: Search bars and filters adapt to mobile and desktop layouts
- **Empty States**: Contextual messages that reflect active search and filter states

### Search Functionality by Page
- **Sales Records**: Search by hotel name/code with payment status filtering
- **Hotel Management**: Search by hotel name, code, or contact information
- **Supplier Management**: Search by supplier name, code, or contact person with active/inactive filtering
- **Purchase Records**: Search by supplier name, code, or invoice number with company filtering
- **User Management**: Admin interface for account management
- **Audit Logs**: System activity tracking with user and action filtering

### Search Features
- **Real-time filtering**: Instant results as you type
- **Multi-field search**: Searches across multiple relevant fields (name, code, contact info)
- **Combined filtering**: Search works alongside other filters (status, company, active/inactive)
- **Smart empty states**: Different messages based on whether filters are active
- **Consistent UI patterns**: Same search design and behavior across all pages