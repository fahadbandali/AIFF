import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase } from "./services/database";
import { initPlaidClient } from "./services/plaid";
import { validateEncryptionKey } from "./services/encryption";
import healthRouter from "./routes/health";
import plaidRouter from "./routes/plaid";
import accountsRouter from "./routes/accounts";
import { rateLimit } from "./middleware/rateLimit";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Initialize database
await initDatabase();

// Validate encryption key and initialize Plaid client
try {
  validateEncryptionKey();
  initPlaidClient();
} catch (error) {
  console.error("❌ Initialization error:", (error as Error).message);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
  console.warn("⚠️  Continuing without Plaid (development mode only)");
}

// Routes
app.use("/api/health", healthRouter);
app.use("/api/plaid", rateLimit(10, 60000), plaidRouter);
app.use("/api/accounts", accountsRouter);

// Basic error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});
