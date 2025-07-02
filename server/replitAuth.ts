import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
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
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Role-based authorization middleware
export const requireRole = (role: string) => {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
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