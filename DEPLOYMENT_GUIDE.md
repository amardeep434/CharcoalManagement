# CharcoalBiz Deployment Guide

This guide provides complete instructions for deploying CharcoalBiz outside of Replit on any server or cloud platform.

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+ / macOS 10.15+
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Minimum 10GB free space
- **Network**: Internet connection for package downloads

### Required Software Stack

#### 1. Node.js & npm
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
sudo dnf module install nodejs:20/common

# macOS (with Homebrew)
brew install node@20

# Windows
# Download from https://nodejs.org/en/download/
```

#### 2. PostgreSQL Database
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo dnf install postgresql postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# macOS (with Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### 3. Git (for cloning the repository)
```bash
# Ubuntu/Debian
sudo apt install git

# CentOS/RHEL
sudo dnf install git

# macOS
# Git comes pre-installed or install via Xcode Command Line Tools
xcode-select --install

# Windows
# Download from https://git-scm.com/download/win
```

## Database Setup

### 1. Create Database and User
```sql
-- Connect to PostgreSQL as postgres user
sudo -u postgres psql

-- Create database
CREATE DATABASE charcoalbiz;

-- Create user
CREATE USER charcoalbiz_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE charcoalbiz TO charcoalbiz_user;

-- Connect to the new database
\c charcoalbiz

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO charcoalbiz_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO charcoalbiz_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO charcoalbiz_user;

-- Exit
\q
```

### 2. Run Database Migration
```bash
# Run the database setup script
psql -U charcoalbiz_user -d charcoalbiz -f database_setup.sql
```

## Application Deployment

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd charcoalbiz
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```bash
# Database Configuration
DATABASE_URL=postgresql://charcoalbiz_user:your_secure_password_here@localhost:5432/charcoalbiz
PGHOST=localhost
PGPORT=5432
PGUSER=charcoalbiz_user
PGPASSWORD=your_secure_password_here
PGDATABASE=charcoalbiz

# Application Configuration
NODE_ENV=production
PORT=5000

# Session Configuration
SESSION_SECRET=your_very_secure_session_secret_here_minimum_32_characters

# Optional: CORS Configuration
ALLOWED_ORIGINS=http://localhost:5000,https://yourdomain.com
```

### 4. Build the Application
```bash
# Build for production
npm run build
```

### 5. Database Migration
```bash
# Push database schema
npm run db:push
```

## Production Deployment Options

### Option 1: Direct Node.js Server

#### Start the Application
```bash
# Production mode
npm start

# Or with PM2 for process management
npm install -g pm2
pm2 start npm --name "charcoalbiz" -- start
pm2 save
pm2 startup
```

#### Configure Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Docker Deployment

#### Create Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

#### Create docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://charcoalbiz_user:password@db:5432/charcoalbiz
      - NODE_ENV=production
      - SESSION_SECRET=your_session_secret_here
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=charcoalbiz
      - POSTGRES_USER=charcoalbiz_user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database_setup.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

#### Deploy with Docker
```bash
docker-compose up -d
```

### Option 3: Cloud Platform Deployment

#### Heroku
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Create app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your_session_secret

# Deploy
git push heroku main

# Run database migration
heroku run npm run db:push
```

#### DigitalOcean App Platform
1. Connect your Git repository
2. Configure build and run commands:
   - Build: `npm run build`
   - Run: `npm start`
3. Add PostgreSQL database addon
4. Set environment variables in the dashboard

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add PostgreSQL database through Vercel dashboard
# Configure environment variables
```

## SSL/HTTPS Configuration

### With Nginx and Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Maintenance

### 1. Log Management
```bash
# View application logs with PM2
pm2 logs charcoalbiz

# Or with Docker
docker-compose logs -f app
```

### 2. Database Backup
```bash
# Create backup
pg_dump -U charcoalbiz_user -h localhost charcoalbiz > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -U charcoalbiz_user -h localhost charcoalbiz < backup_file.sql
```

### 3. Application Updates
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild application
npm run build

# Restart application
pm2 restart charcoalbiz
# Or with Docker
docker-compose down && docker-compose up -d
```

## Security Considerations

### 1. Firewall Configuration
```bash
# Ubuntu/Debian with UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Database Security
- Change default PostgreSQL passwords
- Restrict database access to application server only
- Enable SSL for database connections in production
- Regular security updates

### 3. Application Security
- Use strong session secrets (minimum 32 characters)
- Enable HTTPS in production
- Regular dependency updates: `npm audit && npm audit fix`
- Implement rate limiting if needed

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database credentials in `.env` file
- Ensure user has proper permissions

#### Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000
# Kill process if needed
sudo kill -9 <PID>
```

#### Permission Errors
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Getting Help
- Check application logs for error details
- Verify all environment variables are set correctly
- Ensure all prerequisites are installed and running
- Check firewall and network configuration

## Default Credentials

**Important**: Change these immediately after deployment!

- **Username**: admin
- **Password**: admin123
- **Email**: admin@charcoalbiz.com

## Performance Optimization

### Database Optimization
- Regular VACUUM and ANALYZE operations
- Proper indexing (already included in schema)
- Connection pooling configuration

### Application Optimization
- Enable gzip compression in Nginx
- Set up CDN for static assets
- Configure proper caching headers
- Monitor memory usage and optimize as needed

This deployment guide provides everything needed to successfully migrate and run CharcoalBiz outside of Replit on any modern server infrastructure.