import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from '../models/User'; // Import the User model

export interface UserPayload extends JwtPayload {
  id: string;
  userEmail: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

function authMiddleware(roles: string | string[] = []): RequestHandler {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return async (
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ) => {
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided.",
      });
    }

    const jwtSecret = process.env.JWT_KEY;
    if (!jwtSecret) {
      console.error("JWT_KEY is not defined in environment variables");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as UserPayload;

      // Check if user still exists in the database
      const user = await User.findById(decoded.id);
      if (!user) {
          return res.status(401).json({ success: false, message: 'User not found.' });
      }

      // Attach user payload to request
      req.user = {
          id: (user._id as any).toString(),
          userEmail: user.userEmail,
          role: user.role,
      };

      // Check role authorization
      if (roleArray.length > 0 && !roleArray.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Insufficient permissions",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}

export default authMiddleware;