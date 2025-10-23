import { Router } from "express";
import { z } from "zod";
import { getDb } from "../services/database";
import type { Budget } from "../services/database";
import { randomUUID } from "crypto";

const router = Router();

// Validation schemas
const createBudgetSchema = z.object({
  category_id: z.string().min(1, "category_id is required").nullable(),
  amount: z
    .number()
    .positive("amount must be positive")
    .max(10000000, "amount must be less than 10,000,000"),
  period: z.enum(["daily", "weekly", "monthly", "yearly"]),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "start_date must be in YYYY-MM-DD format"),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "end_date must be in YYYY-MM-DD format")
    .nullable()
    .optional(),
});

const updateBudgetSchema = z.object({
  amount: z
    .number()
    .positive("amount must be positive")
    .max(10000000)
    .optional(),
  period: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "start_date must be in YYYY-MM-DD format")
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "end_date must be in YYYY-MM-DD format")
    .nullable()
    .optional(),
  category_id: z.never().optional(), // Prevent category changes
});

// Helper function to check date overlap
function checkDateOverlap(
  start1: string,
  end1: string | null,
  start2: string,
  end2: string | null
): boolean {
  const s1 = new Date(start1);
  const e1 = end1 ? new Date(end1) : new Date();
  const s2 = new Date(start2);
  const e2 = end2 ? new Date(end2) : new Date();

  return s1 <= e2 && e1 >= s2;
}

/**
 * GET /api/budgets
 * Get all budgets
 */
router.get("/", async (_req, res) => {
  try {
    const db = getDb();
    await db.read();

    const budgets = db.data.budgets;

    res.json({ budgets });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({
      error: "Failed to fetch budgets",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * GET /api/budgets/:id
 * Get a single budget by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.read();

    const budget = db.data.budgets.find((b) => b.id === id);
    if (!budget) {
      return res.status(404).json({
        error: "Budget not found",
      });
    }

    res.json({ budget });
  } catch (error) {
    console.error("Error fetching budget:", error);
    res.status(500).json({
      error: "Failed to fetch budget",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * POST /api/budgets
 * Create a new budget
 */
router.post("/", async (req, res) => {
  try {
    // Validate input
    const validationResult = createBudgetSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validationResult.error.errors,
      });
    }

    const { category_id, amount, period, start_date, end_date } =
      validationResult.data;

    const db = getDb();
    await db.read();

    // Validate: if category_id is null, end_date must not be null
    if (category_id === null && !end_date) {
      return res.status(400).json({
        error: "Validation failed",
        message: "end_date is required for all-categories budgets",
      });
    }

    // Verify category exists (if not all-categories budget)
    if (category_id !== null) {
      const category = db.data.categories.find((c) => c.id === category_id);
      if (!category) {
        return res.status(404).json({
          error: "Category not found",
        });
      }

      // Check for duplicate budget (same category_id and period)
      const existingBudget = db.data.budgets.find(
        (b) => b.category_id === category_id && b.period === period
      );
      if (existingBudget) {
        return res.status(409).json({
          error: "Duplicate budget",
          message: `A ${period} budget already exists for ${category.name}. Please edit the existing budget instead.`,
        });
      }
    } else {
      // Check for overlapping all-categories budgets
      const overlappingBudget = db.data.budgets.find((b) => {
        if (b.category_id !== null) return false; // Only check all-categories budgets
        return checkDateOverlap(
          start_date,
          end_date!,
          b.start_date,
          b.end_date
        );
      });

      if (overlappingBudget) {
        return res.status(409).json({
          error: "Overlapping budget",
          message: `An all-categories budget already exists for overlapping dates (${overlappingBudget.start_date} to ${overlappingBudget.end_date})`,
        });
      }
    }

    // Create new budget
    const newBudget: Budget = {
      id: randomUUID(),
      category_id,
      amount,
      period,
      start_date,
      end_date: end_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.data.budgets.push(newBudget);
    await db.write();

    res.status(201).json({
      success: true,
      budget: newBudget,
    });
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({
      error: "Failed to create budget",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * PATCH /api/budgets/:id
 * Update an existing budget
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const validationResult = updateBudgetSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validationResult.error.errors,
      });
    }

    // Check if category_id is in the request (not allowed)
    if ("category_id" in req.body) {
      return res.status(400).json({
        error: "Invalid operation",
        message:
          "Cannot change budget category. Delete and create a new budget instead.",
      });
    }

    const db = getDb();
    await db.read();

    const budgetIndex = db.data.budgets.findIndex((b) => b.id === id);
    if (budgetIndex === -1) {
      return res.status(404).json({
        error: "Budget not found",
      });
    }

    const existingBudget = db.data.budgets[budgetIndex];
    const updates = validationResult.data;

    // Update budget fields
    db.data.budgets[budgetIndex] = {
      ...existingBudget,
      ...(updates.amount !== undefined && { amount: updates.amount }),
      ...(updates.period !== undefined && { period: updates.period }),
      ...(updates.start_date !== undefined && {
        start_date: updates.start_date,
      }),
      ...(updates.end_date !== undefined && { end_date: updates.end_date }),
      updated_at: new Date().toISOString(),
    };

    await db.write();

    res.json({
      success: true,
      budget: db.data.budgets[budgetIndex],
    });
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({
      error: "Failed to update budget",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * DELETE /api/budgets/:id
 * Delete a budget
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.read();

    const budgetIndex = db.data.budgets.findIndex((b) => b.id === id);
    if (budgetIndex === -1) {
      return res.status(404).json({
        error: "Budget not found",
      });
    }

    db.data.budgets.splice(budgetIndex, 1);
    await db.write();

    res.json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting budget:", error);
    res.status(500).json({
      error: "Failed to delete budget",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * GET /api/budgets/:id/progress
 * Get budget progress (spending vs budget amount)
 */
router.get("/:id/progress", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.read();

    const budget = db.data.budgets.find((b) => b.id === id);
    if (!budget) {
      return res.status(404).json({
        error: "Budget not found",
      });
    }

    // Calculate spending for this budget
    let transactions;
    if (budget.category_id === null) {
      // All-categories budget: sum all transactions
      transactions = db.data.transactions.filter((t) => t.amount > 0); // Only expenses
    } else {
      // Category-specific budget
      transactions = db.data.transactions.filter(
        (t) => t.category_id === budget.category_id && t.amount > 0
      );
    }

    // Filter by date range
    let relevantTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date);
      const startDate = new Date(budget.start_date);
      const endDate = budget.end_date ? new Date(budget.end_date) : new Date();
      return txDate >= startDate && txDate <= endDate;
    });

    const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;

    res.json({
      budget,
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
      over_budget: spent > budget.amount,
    });
  } catch (error) {
    console.error("Error calculating budget progress:", error);
    res.status(500).json({
      error: "Failed to calculate budget progress",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

export default router;
