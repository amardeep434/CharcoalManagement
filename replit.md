# CharcoalBiz - Sales Management System

## Overview
CharcoalBiz is a full-stack sales management application for charcoal businesses. Its core purpose is to track sales, manage hotel customers, process payments, and generate statements. It features a comprehensive dashboard with real-time analytics and robust data import/export functionality, supporting multi-company operations. The vision is to provide a comprehensive tool for charcoal businesses to efficiently manage sales and customer relationships, offering significant market potential for improved operational efficiency.

## User Preferences
Preferred communication style: Simple, everyday language.
Preferred measurement units: Kilograms (kg) for all charcoal quantities.
Database policy: Never switch to in-memory storage, local storage, or any temporary storage solutions when database or app is not working - always fix the actual database connection problem unless explicitly asked to use alternative storage.

## System Architecture
CharcoalBiz utilizes a full-stack architecture with a clear separation of concerns.

### Frontend Architecture
- **Frameworks**: React 18 with TypeScript, Vite, Wouter for routing.
- **UI/UX**: Radix UI components, shadcn/ui styling, Tailwind CSS for styling, lucide-react for icons. Mobile-responsive design with collapsible navigation and accessible UI primitives.
- **State Management**: TanStack Query (React Query) for server state.
- **Form Handling**: React Hook Form with Zod validation.

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API, TypeScript with ES modules.
- **Database**: PostgreSQL with Drizzle ORM.
- **File Processing**: Multer for Excel file uploads with sophisticated pattern analysis (`server/import-analyzer.ts`).
- **Session Management**: Express sessions with PostgreSQL store.
- **System Design Choices**:
    - **Database Schema**: Comprehensive schema including Companies, Suppliers, Hotels, Sales, Payments, Purchases, and Purchase Payments, all with foreign key constraints.
    - **API Structure**: Full CRUD operations for all entities, Dashboard analytics, and enhanced Import/Export with intelligent pattern detection and admin-only access controls.
    - **Authentication System**: Session-based authentication, bcrypt for password hashing, user roles (admin, manager, operator, viewer), and an audit logging system.
    - **Company Management**: Full frontend interface for CRUD operations, validation, and status management.
    - **Automated Migration System**: Drizzle Kit for schema migrations, automatically generating SQL and integrating with Git hooks for current migrations including production features.
    - **Production Readiness**: Emphasis on security (secure cookies, HTTP headers, input validation), performance (connection pooling, indexes, compression, query optimization), monitoring (structured logging, health checks), and reliability (graceful error handling).

### Data Flow
- **Sales & Payments**: User input via forms, Zod validation, API interaction for record creation, real-time UI updates.
- **Data Import**: Enhanced CSV/Excel import system with AI-powered pattern detection, multi-sheet analysis, intelligent column mapping, comprehensive validation, admin-only access, and a guided 4-step workflow (Upload → Analyze → Preview → Confirm → Results).
- **Company Management**: Frontend interface with search, filtering, CRUD operations via modal forms, real-time statistics, and responsive design.

### Authentication System
- Session-based authentication (`express-session`).
- Password hashing with `bcryptjs`.
- User roles: admin, manager, operator, viewer with hierarchical permissions.
- Audit trail for user actions.
- Protected routes and user information display with logout.

### Production Readiness Features
- **Security**: httpOnly, secure, SameSite cookie configuration; HTTP security headers (XSS, CSRF); CORS configuration; request validation; production-safe error responses; admin-only access for imports; role-based access control.
- **Performance**: Database connection pooling, performance indexes on frequently queried columns, Gzip compression, query optimization.
- **Monitoring & Observability**: Structured logging, `/health` endpoint, error tracking, request correlation, database monitoring.

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
- **tsx**: TypeScript execution (development).
- **esbuild**: JavaScript bundler (production).
- **xlsx**: Excel file processing.
```