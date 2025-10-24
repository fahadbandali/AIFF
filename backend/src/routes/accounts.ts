import { Router } from "express";
import { getAllAccounts } from "../services/plaid";
import { deleteAccount } from "../services/database";

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

/**
 * DELETE /api/accounts/:id
 * Delete an account by ID
 * Note: Always cascade deletes all related transactions
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        error: "Invalid account ID",
      });
    }

    // Always cascade delete related transactions
    const deleted = await deleteAccount(id, true);

    if (!deleted) {
      return res.status(404).json({
        error: "Account not found",
        message: `No account found with ID: ${id}`,
      });
    }

    res.json({
      success: true,
      message: "Account and all related transactions deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      error: "Failed to delete account",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

export default router;
