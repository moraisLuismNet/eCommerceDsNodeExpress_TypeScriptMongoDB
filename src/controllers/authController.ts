import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import userService from '../services/userService';
import { UserPayload } from '../middleware/authMiddleware'; 
import { IUser } from '../models/User';

// Types
type LoginCredentials = {
  userEmail: string;
  password: string;
};

type RegisterData = LoginCredentials & {
  role?: 'Admin' | 'User';
};

interface AuthRequest<T = any> extends Request {
  body: T;
  user?: UserPayload;
}

export const register = async (
  req: AuthRequest<RegisterData>,
  res: Response
): Promise<Response> => {
  const { userEmail, password, role = 'User' } = req.body;

  if (!userEmail || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(userEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  try {
    const existingUser = await userService.findUserByEmail(userEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    const newUser = await userService.createUser({
      userEmail,
      password,
      role
    });

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    const jwtSecret = process.env.JWT_KEY;
    if (!jwtSecret) {
      throw new Error('Server configuration error: JWT_KEY not set');
    }

    const payload = {
      id: newUser._id,
      userEmail: newUser.userEmail,
      role: newUser.role
    };

    const token = jwt.sign(
      payload,
      jwtSecret,
      {
        expiresIn: '24h',
      }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        userEmail: newUser.userEmail,
        role: newUser.role
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const login = async (
  req: AuthRequest<LoginCredentials>,
  res: Response
): Promise<Response> => {
  const { userEmail, password } = req.body;

  if (!userEmail || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    const user = await userService.findUserByEmail(userEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const jwtSecret = process.env.JWT_KEY;
    if (!jwtSecret) {
        throw new Error('Server configuration error: JWT_KEY not set');
    }

    const payload = {
      id: user._id,
      userEmail: user.userEmail,
      role: user.role,
    };

    const token = jwt.sign(
        payload,
        jwtSecret,
        {
          expiresIn: '24h',
        }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        userEmail: user.userEmail,
        role: user.role,
        cartId: user.cartId
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({
      success: false,
      message: 'Error during login',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const logout = (_req: Request, res: Response): Response => {
    res.clearCookie('token');
    return res.json({
      success: true,
      message: 'Logout successful'
    });
};

export const getMe = (req: AuthRequest, res: Response): Response => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
  // The user payload from the token is attached by the auth middleware
  return res.json({
    success: true,
    data: req.user
  });
};

export default {
  register,
  login,
  logout,
  getMe
};