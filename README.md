# CharcoalBiz - Sales Management System

A comprehensive charcoal sales and billing management platform designed for enterprise-level business operations with advanced authentication and session management capabilities.

## Features

- **Multi-Company Support**: Manage multiple charcoal businesses from a single platform
- **Sales Management**: Track sales to hotels with quantity (kg), rates, and payments
- **Purchase Tracking**: Manage purchases from suppliers with invoice tracking
- **Payment Processing**: Handle both receivable and payable payments
- **Excel Import/Export**: Bulk data import and statement generation
- **User Management**: Role-based access control with audit logging
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile devices
- **Real-time Dashboard**: Analytics and recent activity overview

## Quick Start (Replit)

1. The application is pre-configured and ready to run
2. Click "Run" to start the development server
3. Default login credentials:
   - Username: `admin`
   - Password: `admin123`

## Migration Outside Replit

### Prerequisites
- Node.js 20+
- PostgreSQL 12+
- Git

### Quick Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Run database migration: `psql -U username -d database -f database_setup.sql`
5. Configure environment variables in `.env`
6. Build and start: `npm run build && npm start`

### Automated Migration System
The application automatically keeps the SQL migration file synchronized with schema changes:

```bash
# Manual migration update after schema changes
node scripts/generate-migration.js

# Watch for automatic updates during development
node scripts/watch-schema.js
```

📖 **For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

## Project Structure

```
charcoalbiz/
├── client/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   └── lib/           # Utilities and configurations
├── server/                # Node.js Express backend
│   ├── storage-db.ts      # Database operations
│   ├── routes.ts          # API endpoints
│   └── replitAuth.ts      # Authentication middleware
├── shared/                # Shared TypeScript schemas
│   └── schema.ts          # Database schema and types
├── database_setup.sql     # Complete database migration
├── DEPLOYMENT_GUIDE.md    # Detailed deployment instructions
└── replit.md             # Project documentation and architecture
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with role-based access control
- **Build Tools**: Vite, esbuild
- **Deployment**: Replit-ready, Docker-compatible

## Default Credentials

**⚠️ Change these immediately in production!**
- Username: `admin`
- Password: `admin123`
- Email: `admin@charcoalbiz.com`

## Key Measurement Units

- All charcoal quantities are measured in **kilograms (kg)**
- Rates are displayed as **₹/kg** (Indian Rupees per kilogram)
- Dashboard statistics show amounts in kg

## Documentation

- **[replit.md](./replit.md)**: Complete project architecture and development guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**: Detailed deployment instructions for various platforms
- **[database_setup.sql](./database_setup.sql)**: Complete database schema migration

## Support

For deployment assistance or technical questions:
1. Review the deployment guide for common issues
2. Check the troubleshooting section
3. Verify all prerequisites are correctly installed
4. Ensure database credentials and environment variables are properly configured

## License

This project is designed for business use in charcoal sales management and billing operations.