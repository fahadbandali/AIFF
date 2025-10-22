import { Router } from "express";
import { z } from "zod";
import {
  createLinkToken,
  exchangePublicToken,
  syncAccounts,
  getAllAccounts,
} from "../services/plaid";

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
router.post("/link-token", async (req, res) => {
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

export default router;
