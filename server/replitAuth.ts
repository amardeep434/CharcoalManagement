import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { dbStorage as storage } from "./storage-db";

// Secure session secret generation
function generateSessionSecret(): string {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  
  // In production, this should be set via environment variable
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable must be set in production');
  }
  
  // Development fallback with warning
  console.warn('WARNING: Using generated session secret. Set SESSION_SECRET environment variable for production.');
  return 'dev-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Temporarily use memory store due to database connection issues
  // TODO: Re-enable PostgreSQL session store once database is working
  console.warn('⚠️  Using memory session store - sessions will not persist across restarts');
  
  return session({
    secret: generateSessionSecret(),
    // Using default memory store temporarily
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for username/password authentication
  passport.use(new LocalStrategy(
    async (username: string, password: string, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        if (!user.isActive) {
          return done(null, false, { message: 'Account is disabled' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        // Update last login
        await storage.updateUserLastLogin(user.id);

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Login route
  app.post("/api/login", passport.authenticate('local'), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Get current user route
  app.get("/api/auth/user", isAuthenticated, (req, res) => {
    res.json(req.user);
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  console.log('RequireAuth - Session ID:', req.sessionID);
  console.log('RequireAuth - Session:', req.session);
  console.log('RequireAuth - Cookie header:', req.headers.cookie);

  let userId = (req.session as any)?.userId;
  console.log('RequireAuth - Initial userId:', userId, 'type:', typeof userId);
  
  // If no session userId, check for authorization header as fallback
  if (!userId) {
    console.log('RequireAuth - No userId, checking authorization header...');
    const authHeader = req.headers.authorization;
    console.log('RequireAuth - Auth header check:', { 
      hasAuthHeader: !!authHeader, 
      authHeader: authHeader?.substring(0, 20) + '...' 
    });
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('RequireAuth - Processing token:', token.substring(0, 20) + '...');
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [tokenUserId, sessionId, timestamp] = decoded.split(':');
        console.log('RequireAuth - Token decoded:', { tokenUserId, sessionId, timestamp });
        
        // Simple validation - token should be recent (within 24 hours)
        const tokenTime = parseInt(timestamp);
        const now = Date.now();
        console.log('RequireAuth - Token validation:', { tokenTime, now, diff: now - tokenTime });
        if (now - tokenTime < 24 * 60 * 60 * 1000) {
          userId = parseInt(tokenUserId);
          console.log('RequireAuth - Using token auth, userId:', userId);
          // Store userId in session for future requests
          (req.session as any).userId = userId;
          req.session.save((err) => {
            if (err) console.error('Session save error:', err);
          });
        } else {
          console.log('RequireAuth - Token expired');
        }
      } catch (error) {
        console.log('RequireAuth - Token decode error:', error);
      }
    } else {
      console.log('RequireAuth - No valid Bearer token found');
    }
  }

  if (!userId) {
    console.log('RequireAuth - No userId found in session or token');
    return res.status(401).json({ message: "Authentication required" });
  }

  console.log('RequireAuth - Success, userId:', userId);
  (req as any).userId = userId;
  next();
};

// Role-based authorization middleware
export const requireRole = (role: string) => {
  return async (req: any, res: any, next: any) => {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    // Role hierarchy: admin > manager > operator > viewer
    const roleHierarchy = ['viewer', 'operator', 'manager', 'admin'];
    const requiredRoleIndex = roleHierarchy.indexOf(role);
    const userRoleIndex = roleHierarchy.indexOf(user.role);

    if (userRoleIndex < requiredRoleIndex) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    req.currentUser = user;
    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (resource: string, action: string) => {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    const permissions = user.permissions as any;
    if (!permissions || !permissions[resource] || !permissions[resource][action]) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    req.currentUser = user;
    next();
  };
};

// Audit logging middleware
export const auditLog = (tableName: string, action: string) => {
  return async (req: any, res: any, next: any) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      // Log the action after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        if (userId) {
          storage.createAuditLog({
            userId: userId.toString(),
            action,
            tableName,
            recordId: req.params.id ? parseInt(req.params.id) : 0,
            oldValues: req.oldValues || null,
            newValues: req.body || null,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
          }).catch(console.error);
        }
      }
      return originalSend.call(this, data);
    };
    
    next();
  };
};