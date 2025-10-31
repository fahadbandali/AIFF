import { Router } from "express";
import { z } from "zod";
import { getDb } from "../services/database";

const router = Router();

// Validation schemas
const tagTransactionSchema = z.object({
  category_id: z.string().min(1, "category_id is required"),
});

// Validation schemas
const patchTransactionSchema = z.object({
  category_id: z.string().min(1, "category_id is required").optional(),
  name: z.string().optional(),
});

const querySchema = z.object({
  account_id: z.string().optional(),
  category_id: z.string().optional(),
  is_tagged: z
    .string()
    .optional()
    .transform((val) => (val ? val === "true" : undefined)),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0)),
});

/**
 * GET /api/transactions
 * Get all transactions with optional filtering and pagination
 */
router.get("/", async (req, res) => {
  try {
    const validationResult = querySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: validationResult.error.errors,
      });
    }

    const {
      account_id,
      category_id,
      is_tagged,
      start_date,
      end_date,
      limit,
      offset,
    } = validationResult.data;

    const db = getDb();
    await db.read();

    let transactions = [...db.data.transactions];

    // Apply filters
    if (account_id) {
      transactions = transactions.filter((t) => t.account_id === account_id);
    }
    if (category_id) {
      transactions = transactions.filter((t) => t.category_id === category_id);
    }

    if (is_tagged !== undefined) {
      transactions = transactions.filter((t) => t.is_tagged === is_tagged);
    }
    if (start_date) {
      transactions = transactions.filter((t) => t.date >= start_date);
    }
    if (end_date) {
      transactions = transactions.filter((t) => t.date <= end_date);
    }

    // Sort by date (newest first)
    transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate total before pagination
    const total = transactions.length;

    // Apply pagination
    if (offset !== undefined) {
      transactions = transactions.slice(offset);
    }
    if (limit !== undefined) {
      transactions = transactions.slice(0, limit);
    }

    res.json({
      transactions,
      total,
      limit: limit || total,
      offset: offset || 0,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      error: "Failed to fetch transactions",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * GET /api/transactions/:id
 * Get a single transaction by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.read();

    const transaction = db.data.transactions.find((t) => t.id === id);
    if (!transaction) {
      return res.status(404).json({
        error: "Transaction not found",
      });
    }

    res.json({ transaction });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({
      error: "Failed to fetch transaction",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * PATCH /api/transactions/:id/tag
 * Update transaction category and mark as tagged
 */
router.patch("/:id/tag", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const validationResult = tagTransactionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validationResult.error.errors,
      });
    }

    const { category_id } = validationResult.data;

    const db = getDb();
    await db.read();

    // Verify category exists
    const category = db.data.categories.find((c) => c.id === category_id);
    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    // Find and update transaction
    const transaction = db.data.transactions.find((t) => t.id === id);
    if (!transaction) {
      console.log(`Transaction ${id} not found in database`);
      return res.status(404).json({
        error: "Transaction not found",
      });
    }

    transaction.category_id = category_id;
    transaction.is_tagged = true;
    transaction.updated_at = new Date().toISOString();

    await db.write();

    res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Error tagging transaction:", error);
    res.status(500).json({
      error: "Failed to tag transaction",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * PATCH /api/transactions/:id
 * Update transaction category and mark as tagged
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const validationResult = await patchTransactionSchema.safeParseAsync(
      req.body
    );
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validationResult.error.errors,
      });
    }

    const { category_id, name } = validationResult.data;

    const db = getDb();
    await db.read();

    // Find and update transaction
    const transaction = db.data.transactions.find((t) => t.id === id);
    if (!transaction) {
      console.log(`Transaction ${id} not found in database`);
      return res.status(404).json({
        error: "Transaction not found",
      });
    }

    if (category_id) {
      // Verify category exists
      const category = db.data.categories.find((c) => c.id === category_id);
      if (!category) {
        return res.status(404).json({
          error: "Category not found",
        });
      }

      transaction.category_id = category_id;
      transaction.is_tagged = transaction.category_id !== "cat-uncategorized";
    }

    if (name) {
      transaction.name = name;
    }

    transaction.updated_at = new Date().toISOString();

    await db.write();

    res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Error tagging transaction:", error);
    res.status(500).json({
      error: "Failed to tag transaction",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * GET /api/transactions/stats/cash-flow
 * Get cash flow statistics (income vs expenses) for a date range
 */
router.get("/stats/cash-flow", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const db = getDb();
    await db.read();

    let transactions = [...db.data.transactions];

    // Apply date filters
    if (start_date && typeof start_date === "string") {
      transactions = transactions.filter((t) => t.date >= start_date);
    }
    if (end_date && typeof end_date === "string") {
      transactions = transactions.filter((t) => t.date <= end_date);
    }

    // Calculate income (negative amounts) and expenses (positive amounts)
    const income = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      income,
      expenses,
      net: income - expenses,
      transaction_count: transactions.length,
    });
  } catch (error) {
    console.error("Error calculating cash flow:", error);
    res.status(500).json({
      error: "Failed to calculate cash flow",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

export default router;
