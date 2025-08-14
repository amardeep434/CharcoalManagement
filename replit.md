# CharcoalBiz - Sales Management System

## Overview
CharcoalBiz is a full-stack sales management application for charcoal businesses, enabling tracking of sales, managing hotel customers, processing payments, and generating statements. It aims to provide a comprehensive, multi-company solution to improve operational efficiency and offer valuable business insights through a dashboard with real-time analytics and data import/export.

## User Preferences
Preferred communication style: Simple, everyday language.
Preferred measurement units: Kilograms (kg) for all charcoal quantities.
Database policy: Never switch to in-memory storage, local storage, or any temporary storage solutions when database or app is not working - always fix the actual database connection problem unless explicitly asked to use alternative storage.

## System Architecture

### Core Design Principles
The application emphasizes separation of concerns, type safety, developer experience, and production readiness, supporting a multi-company architecture.

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built with Vite.
- **Routing**: Wouter.
- **UI Framework**: Radix UI components with shadcn/ui styling.
- **Styling**: Tailwind CSS with CSS custom properties.
- **State Management**: TanStack Query (React Query).
- **Form Handling**: React Hook Form with Zod validation.
- **UI/UX Decisions**: Mobile-responsive design with collapsible navigation, consistent Header components across pages, comprehensive search, and organized filtering systems.

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API.
- **Language**: TypeScript with ES modules.
- **Database**: PostgreSQL with Drizzle ORM.
- **File Processing**: Multer for Excel file uploads.
- **Session Management**: Express sessions with PostgreSQL store.
- **Authentication**: Session-based with bcrypt password hashing, role-based access control (admin, manager, operator, viewer), and audit logging.
- **Measurement Units**: All quantities consistently use kilograms (kg).

### Database Schema
- **Entities**: Companies, Suppliers, Hotels, Sales, Payments, Purchases, Purchase Payments, Users, Audit Logs, and Sessions.
- **Relationships**: Foreign key constraints for data integrity.
- **Migration System**: Automated system for schema watching, SQL migration generation, and Git hook integration ensuring real-time updates and production readiness, including security, performance, and audit logging features.

### Key Features & Technical Implementations
- **API Structure**: Comprehensive REST APIs for all entities.
- **Frontend Pages**: Dashboard, Sales, Payments, Hotel Management, Supplier Management, Purchases, Statement Generation, Data Import, User Management, Audit Logs. All pages maintain consistent Header components, search, and filtering.
- **Data Flow**: Structured processes for sales, payments, and Excel data import with server-side validation.
- **Production Readiness**:
    - **Security**: httpOnly/secure/SameSite cookies, security headers, secure CORS, request validation, production-safe error handling.
    - **Performance**: Database connection pooling, performance indexes, response compression (Gzip), query optimization.
    - **Monitoring**: Structured logging, `/health` endpoint, error tracking, request correlation, database monitoring.
    - **Reliability**: Graceful error handling, automatic database reconnection, robust session management.
- **Authentication System**: Comprehensive user management, login/logout, protected routes, and audit logging.
- **Automated Migration System**: Ensures migration files are always up-to-date with schema changes, including production features, without manual intervention.

## External Dependencies

### Core Libraries
- `@neondatabase/serverless`: PostgreSQL connection.
- `drizzle-orm`: Type-safe ORM.
- `@tanstack/react-query`: Server state management.
- `react-hook-form`: Form handling.
- `zod`: Runtime schema validation.
- `date-fns`: Date manipulation.
- `multer`: File upload middleware.
- `bcryptjs`: Password hashing.

### UI Components
- `@radix-ui/*`: Accessible UI primitives.
- `lucide-react`: Icon system.
- `tailwindcss`: Utility-first CSS framework.
- `class-variance-authority`: Type-safe variant handling.
```