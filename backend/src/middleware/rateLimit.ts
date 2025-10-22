import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(maxRequests: number = 10, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || "unknown";
    const now = Date.now();

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      Object.keys(store).forEach((key) => {
        if (store[key].resetTime < now) {
          delete store[key];
        }
      });
    }

    // Initialize or reset if window expired
    if (!store[clientId] || store[clientId].resetTime < now) {
      store[clientId] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    // Increment counter
    store[clientId].count++;

    // Check if limit exceeded
    if (store[clientId].count > maxRequests) {
      const retryAfter = Math.ceil((store[clientId].resetTime - now) / 1000);
      res.set("Retry-After", retryAfter.toString());
      return res.status(429).json({
        error: "Too many requests",
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retry_after: retryAfter,
      });
    }

    next();
  };
}
