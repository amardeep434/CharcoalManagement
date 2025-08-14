# CharcoalBiz - Sales Management System

## Overview
CharcoalBiz is a full-stack sales management application for charcoal businesses, designed to track sales, manage hotel customers, process payments, and generate statements. It features a comprehensive dashboard with real-time analytics and robust data import/export functionality, supporting multi-company operations. The vision is to provide a comprehensive tool for efficient sales and customer relationship management.

## User Preferences
Preferred communication style: Simple, everyday language.
Preferred measurement units: Kilograms (kg) for all charcoal quantities.
Database policy: Never switch to in-memory storage, local storage, or any temporary storage solutions when database or app is not working - always fix the actual database connection problem unless explicitly asked to use alternative storage.

## System Architecture
CharcoalBiz utilizes a full-stack architecture with a clear separation of concerns.

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for building.
- **Routing**: Wouter.
- **UI Framework**: Radix UI components styled with shadcn/ui.
- **Styling**: Tailwind CSS with CSS custom properties.
- **State Management**: TanStack Query (React Query) for server state.
- **Form Handling**: React Hook Form with Zod validation.
- **UI/UX Decisions**: Mobile-responsive design with collapsible navigation, consistent icon system (lucide-react), and accessible UI primitives. Color schemes and design approaches are managed via Tailwind CSS and Radix UI.

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API.
- **Language**: TypeScript with ES modules.
- **Database**: PostgreSQL with Drizzle ORM.
- **File Processing**: Multer for Excel file uploads.
- **Session Management**: Express sessions with PostgreSQL store.
- **System Design Choices**:
    - **Database Schema**: Includes tables for Companies, Suppliers, Hotels, Sales, Payments, Purchases, and Purchase Payments, all with foreign key constraints.
    - **API Structure**: Comprehensive CRUD operations for all entities, Dashboard analytics, and Import/Export functionality supporting multi-company operations.
    - **Authentication System**: Session-based authentication with bcrypt for password hashing, user roles (admin, manager, operator, viewer), and an audit logging system. Default admin account: username 'admin', password 'admin123'.
    - **Company Management**: Full frontend interface for CRUD operations on company entities, including validation and status management.
    - **Automated Migration System**: Drizzle Kit for schema migrations with an automated system that watches schema files, generates SQL, and integrates with Git hooks.
    - **Production Readiness**: Focus on security (secure cookies, HTTP headers, input validation), performance (connection pooling, indexes, compression, query optimization), monitoring (structured logging, health checks), and reliability (graceful error handling, connection recovery).

### Data Flow
- **Sales Process**: User input via modal forms, Zod validation, API interaction, real-time UI updates.
- **Payment Processing**: Payments linked to sales, status calculation, real-time UI updates.
- **Data Import**: Excel file upload via drag-and-drop, server-side validation and processing, batch record creation, and error reporting. Enhanced with AI-powered pattern detection, multi-sheet analysis, intelligent column mapping, and a 4-step guided workflow (Upload → Analyze → Preview → Confirm → Results). Import functionality is restricted to admin users.

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL connection.
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