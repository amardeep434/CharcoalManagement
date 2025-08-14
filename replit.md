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