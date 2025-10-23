import { Router } from "express";
import { z } from "zod";
import {
  createLinkToken,
  exchangePublicToken,
  syncAccounts,
  syncTransactions,
  getAllAccounts,
} from "../services/plaid";
import { getDb } from "../services/database";

const router = Router();

// Validation schemas
const exchangeTokenSchema = z.object({
  public_token: z.string().min(1, "public_token is required"),
});

const syncAccountsSchema = z.object({
  plaid_item_id: z.string().uuid("plaid_item_id must be a valid UUID"),
});

/**
 * POST /api/plaid/link-token
 * Create a link token for Plaid Link initialization
 */
router.post("/link-token", async (_req, res) => {
  try {
    const linkToken = await createLinkToken();
    res.json({
      link_token: linkToken,
      expiration: "30 minutes",
    });
  } catch (error) {
    console.error("Error creating link token:", error);

    if (error instanceof Error) {
      // Check if it's a Plaid API error
      if ("response" in error && typeof error.response === "object") {
        return res.status(503).json({
          error: "Failed to create link token",
          message:
            "Plaid service is currently unavailable. Please try again later.",
        });
      }
    }

    res.status(500).json({
      error: "Failed to create link token",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * POST /api/plaid/exchange-token
 * Exchange a public token for an access token
 */
router.post("/exchange-token", async (req, res) => {
  try {
    // Validate input
    const validationResult = exchangeTokenSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validationResult.error.errors,
      });
    }

    const { public_token } = validationResult.data;

    // Exchange token and store item
    const plaidItem = await exchangePublicToken(public_token);

    // Sync accounts immediately after exchange
    const accounts = await syncAccounts(plaidItem.id);

    res.status(201).json({
      item_id: plaidItem.item_id,
      plaid_item_id: plaidItem.id,
      institution_name: plaidItem.institution_name,
      accounts_synced: accounts.length,
    });
  } catch (error) {
    console.error("Error exchanging public token:", error);

    if (error instanceof Error) {
      // Handle specific Plaid errors
      if ("response" in error) {
        const plaidError = error as any;
        if (plaidError.response?.data?.error_code === "INVALID_PUBLIC_TOKEN") {
          return res.status(400).json({
            error: "Invalid public token",
            message:
              "The public token is invalid or expired. Please try connecting again.",
          });
        }
      }

      if (error.message.includes("PLAID_ENCRYPTION_KEY")) {
        return res.status(500).json({
          error: "Server configuration error",
          message: "Encryption key not configured. Please contact support.",
        });
      }
    }

    res.status(500).json({
      error: "Failed to exchange token",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * POST /api/plaid/accounts
 * Sync accounts from Plaid for a specific item
 */
router.post("/accounts", async (req, res) => {
  try {
    // Validate input
    const validationResult = syncAccountsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validationResult.error.errors,
      });
    }

    const { plaid_item_id } = validationResult.data;

    // Sync accounts
    const accounts = await syncAccounts(plaid_item_id);

    res.json({
      success: true,
      accounts_synced: accounts.length,
      accounts,
    });
  } catch (error) {
    console.error("Error syncing accounts:", error);

    if (error instanceof Error && error.message === "PlaidItem not found") {
      return res.status(404).json({
        error: "PlaidItem not found",
        message: "The specified Plaid item does not exist.",
      });
    }

    res.status(500).json({
      error: "Failed to sync accounts",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * GET /api/accounts
 * Get all accounts from the database
 */
router.get("/all-accounts", async (_req, res) => {
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
 * GET /api/plaid/sync-status
 * Get sync status for all Plaid items
 */
router.get("/sync-status", async (_req, res) => {
  try {
    const db = getDb();
    await db.read();

    const syncStatus = db.data.plaid_items.map((item: any) => ({
      plaid_item_id: item.id,
      institution_name: item.institution_name,
      last_sync: item.last_sync,
      should_sync:
        !item.last_sync ||
        Date.now() - new Date(item.last_sync).getTime() > 5 * 60 * 1000, // 5 minutes
    }));

    res.json({ items: syncStatus });
  } catch (error) {
    console.error("Error fetching sync status:", error);
    res.status(500).json({
      error: "Failed to fetch sync status",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * POST /api/plaid/sync-transactions
 * Sync transactions from Plaid for a specific item
 */
router.post("/sync-transactions", async (req, res) => {
  try {
    // Validate input
    const validationResult = syncAccountsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validationResult.error.errors,
      });
    }

    const { plaid_item_id } = validationResult.data;

    // Check if we synced recently (within last 5 minutes)
    const db = getDb();
    await db.read();
    const plaidItem = db.data.plaid_items.find(
      (item: any) => item.id === plaid_item_id
    );

    if (plaidItem?.last_sync) {
      const timeSinceLastSync =
        Date.now() - new Date(plaidItem.last_sync).getTime();
      const fiveMinutes = 5 * 60 * 1000;

      if (timeSinceLastSync < fiveMinutes) {
        return res.json({
          success: true,
          message: "Synced recently, skipping",
          transactions_added: 0,
          transactions_modified: 0,
          transactions_removed: 0,
          last_sync: plaidItem.last_sync,
        });
      }
    }

    // Sync transactions
    const result = await syncTransactions(plaid_item_id);

    res.json({
      success: true,
      transactions_added: result.added,
      transactions_modified: result.modified,
      transactions_removed: result.removed,
    });
  } catch (error) {
    console.error("Error syncing transactions:", error);

    if (error instanceof Error && error.message === "PlaidItem not found") {
      return res.status(404).json({
        error: "PlaidItem not found",
        message: "The specified Plaid item does not exist.",
      });
    }

    res.status(500).json({
      error: "Failed to sync transactions",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

export default router;
