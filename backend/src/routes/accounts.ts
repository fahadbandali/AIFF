import { Router } from "express";
import { getAllAccounts } from "../services/plaid";

const router = Router();

/**
 * GET /api/accounts
 * Get all accounts from the database with institution information
 */
router.get("/", async (_req, res) => {
  try {
    const accounts = await getAllAccounts();
    res.json({ accounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({
      error: "Failed to fetch accounts",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

export default router;
