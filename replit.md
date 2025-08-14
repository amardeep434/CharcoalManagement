# CharcoalBiz - Sales Management System

## Overview
CharcoalBiz is a full-stack sales management application designed for charcoal businesses. Its purpose is to track sales, manage hotel customers, process payments, and generate statements. Key capabilities include a comprehensive dashboard with real-time analytics and robust data import/export functionality, supporting multi-company operations. The vision is to provide a comprehensive tool for charcoal businesses to efficiently manage their sales and customer relationships.

## User Preferences
Preferred communication style: Simple, everyday language.
Preferred measurement units: Kilograms (kg) for all charcoal quantities.
Database policy: Never switch to in-memory storage, local storage, or any temporary storage solutions when database or app is not working - always fix the actual database connection problem unless explicitly asked to use alternative storage.

## System Architecture
CharcoalBiz follows a clear separation of concerns with a full-stack architecture, focusing on performance, security, and scalability.

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for building.
- **UI/UX**: Radix UI components with shadcn/ui styling and Tailwind CSS. Mobile-responsive design with collapsible navigation, consistent icon system (lucide-react), and accessible UI primitives.
- **State Management**: TanStack Query (React Query) for server state.
- **Form Handling**: React Hook Form with Zod validation.
- **Routing**: Wouter.

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API, written in TypeScript (ES modules).
- **Database**: PostgreSQL with Drizzle ORM.
- **File Processing**: Multer for Excel file uploads with AI-powered pattern analysis (`server/import-analyzer.ts`).
- **Session Management**: Express sessions with PostgreSQL store.
- **System Design Choices**:
    - **Database Schema**: Comprehensive tables for Companies, Suppliers, Hotels, Sales, Payments, Purchases, and Purchase Payments, all with foreign key constraints.
    - **API Structure**: CRUD operations for all entities, Dashboard analytics, and enhanced Import/Export functionality with intelligent pattern detection and admin-only access controls for multi-company operations.
    - **Authentication System**: Session-based with bcrypt for password hashing, user roles (admin, manager, operator, viewer), and an audit logging system. Protected routes enforce authentication and role-based access.
    - **Company Management**: Full frontend interface for CRUD operations on company entities, including validation and status management, search, filtering, and real-time statistics.
    - **Automated Migration System**: Drizzle Kit for schema migrations, automatically generating SQL and integrating with Git hooks to ensure current migrations, including production features like performance indexes and security configurations.
    - **Production Readiness**: Focus on security (secure cookies, HTTP headers, input validation), performance (connection pooling, indexes, compression, query optimization), monitoring (structured logging, health checks), and reliability (graceful error handling, connection recovery).

### Data Flow
- **Sales & Payment Processing**: User input via modal forms, Zod validation, API interaction for record creation, real-time UI updates via React Query. Payments are linked to sales, with status calculated based on amounts.
- **Data Import**: Enhanced CSV/Excel import system with AI-powered pattern detection, multi-sheet analysis, intelligent column mapping, comprehensive validation, admin-only access control, and a guided 4-step workflow (Upload → Analyze → Preview → Confirm → Results). Includes confidence scoring for pattern detection and estimated database changes preview.

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL connection.
- **drizzle-orm**: Type-safe ORM for PostgreSQL.
- **@tanstack/react-query**: Server state management.
- **react-hook-form**: Form handling.
- **zod**: Runtime schema validation.
- **date-fns**: Date manipulation.
- **multer**: File upload middleware.
- **@radix-ui/***: Accessible UI primitives.
- **lucide-react**: Icon system.
- **tailwindcss**: Utility-first CSS framework.
- **class-variance-authority**: Type-safe variant handling.
- **tsx**: TypeScript execution (development).
- **esbuild**: JavaScript bundler (production).
- **xlsx**: Excel file processing for advanced import analysis.