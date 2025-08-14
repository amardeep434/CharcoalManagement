# CharcoalBiz - Sales Management System

## Overview

CharcoalBiz is a full-stack sales management application designed for charcoal businesses. Its primary purpose is to track sales, manage hotel customers, process payments, and generate statements. Key capabilities include a comprehensive dashboard with real-time analytics, robust data import/export functionality, and support for multi-company operations. The business vision is to provide a streamlined, efficient solution for charcoal businesses to manage their sales and customer relationships, ultimately enhancing operational efficiency and market responsiveness.

## User Preferences

Preferred communication style: Simple, everyday language.
Preferred measurement units: Kilograms (kg) for all charcoal quantities.
Critical development rule: If the database is not working or the app is not working, never switch to in-memory storage, local storage, or any temporary storage solutions just to get the app working - always fix the actual database connection problem unless explicitly asked to use alternative storage.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18 and TypeScript, utilizing Vite for fast development. UI components are derived from Radix UI with shadcn/ui styling, ensuring accessibility and a consistent design. Styling is managed with Tailwind CSS, leveraging CSS custom properties for theming. The design supports mobile responsiveness with a collapsible navigation.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Vite, Wouter (routing), Radix UI/shadcn/ui, Tailwind CSS, TanStack Query (state management), React Hook Form (form handling), Zod (validation).
- **Backend**: Node.js, Express.js (REST API), TypeScript, ES modules, Multer (file uploads), Express sessions with PostgreSQL store.
- **Database Schema**: Core entities include Companies, Suppliers, Hotels, Sales, Payments, Purchases, and Purchase Payments, all with defined relationships and foreign key constraints.
- **API Structure**: Comprehensive RESTful APIs for CRUD operations across all entities (Companies, Suppliers, Hotels, Sales, Payments, Purchases, Purchase Payments), along with dedicated APIs for Dashboard analytics, and data Import/Export.
- **Development Setup**: Designed for Replit with specific plugins, Vite HMR, and separate client/server builds.
- **Production Readiness**: Includes session-based authentication, role-based access control, audit logging, production-safe error handling, performance optimizations (e.g., database connection pooling, response compression), and structured logging.
- **Automated Migration System**: Features a comprehensive automated migration system that monitors schema files, updates migrations automatically, integrates with Git hooks, and validates production readiness. This system eliminates manual migration file updates and ensures consistent database schema across environments.

### Feature Specifications
- **Dashboard**: Overview with statistics and recent activities.
- **Sales Management**: Full lifecycle management of sales, including payment tracking.
- **Hotel Management**: CRM for hotel customers.
- **Statement Generation**: Exportable statements for hotels and suppliers.
- **Data Import/Export**: Bulk data entry via Excel and statement generation.
- **Authentication**: Session-based authentication, user management, password hashing, and user roles (admin, manager, operator, viewer).
- **Audit Logging**: Comprehensive tracking of user actions, including user ID, action type, old/new values, IP, and user agent.
- **Multi-company Support**: The system is designed to manage sales for multiple charcoal businesses with distinct data.
- **Measurement Units**: All charcoal quantities and rates are standardized to kilograms (kg).

## External Dependencies

- **Database**: PostgreSQL (specifically Neon Database for serverless PostgreSQL)
- **ORM**: Drizzle ORM
- **State Management**: @tanstack/react-query
- **Form Handling**: react-hook-form
- **Validation**: zod
- **Date Manipulation**: date-fns
- **File Uploads**: multer
- **UI Primitives**: @radix-ui/*
- **Icons**: lucide-react
- **CSS Framework**: tailwindcss
- **Variant Handling**: class-variance-authority
- **TypeScript Execution**: tsx
- **Bundler**: esbuild
- **Replit-specific Enhancements**: @replit/vite-plugin-*
- **Authentication**: bcryptjs (for password hashing), express-session (for session management)