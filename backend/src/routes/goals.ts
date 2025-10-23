import { Router } from "express";
import { z } from "zod";
import { getDb } from "../services/database";
import type { Goal } from "../services/database";
import { randomUUID } from "crypto";

const router = Router();

// Validation schemas
const createGoalSchema = z.object({
  name: z.string().min(1, "name is required"),
  target_amount: z.number().positive("target_amount must be positive"),
  current_amount: z
    .number()
    .min(0, "current_amount must be non-negative")
    .default(0),
  target_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "target_date must be in YYYY-MM-DD format"),
});

const updateGoalProgressSchema = z.object({
  current_amount: z.number().min(0, "current_amount must be non-negative"),
});

const updateGoalSchema = z.object({
  name: z.string().min(1, "name is required").optional(),
  target_amount: z
    .number()
    .positive("target_amount must be positive")
    .optional(),
  current_amount: z
    .number()
    .min(0, "current_amount must be non-negative")
    .optional(),
  target_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "target_date must be in YYYY-MM-DD format")
    .optional(),
});

/**
 * GET /api/goals
 * Get all goals
 */
router.get("/", async (_req, res) => {
  try {
    const db = getDb();
    await db.read();

    const goals = db.data.goals;

    return res.json({ goals });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return res.status(500).json({
      error: "Failed to fetch goals",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * GET /api/goals/:id
 * Get a single goal by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.read();

    const goal = db.data.goals.find((g) => g.id === id);
    if (!goal) {
      return res.status(404).json({
        error: "Goal not found",
      });
    }

    return res.json({ goal });
  } catch (error) {
    console.error("Error fetching goal:", error);
    return res.status(500).json({
      error: "Failed to fetch goal",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * POST /api/goals
 * Create a new goal
 */
router.post("/", async (req, res) => {
  try {
    // Validate input
    const validationResult = createGoalSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validationResult.error.errors,
      });
    }

    const { name, target_amount, current_amount, target_date } =
      validationResult.data;

    const db = getDb();
    await db.read();

    // Check for duplicate name
    const existingGoal = db.data.goals.find(
      (g) => g.name.toLowerCase() === name.toLowerCase()
    );
    if (existingGoal) {
      return res.status(409).json({
        error: "A goal with this name already exists",
      });
    }

    // Create new goal
    const newGoal: Goal = {
      id: randomUUID(),
      name,
      target_amount,
      current_amount,
      target_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.data.goals.push(newGoal);
    await db.write();

    return res.status(201).json({
      success: true,
      goal: newGoal,
    });
  } catch (error) {
    console.error("Error creating goal:", error);
    return res.status(500).json({
      error: "Failed to create goal",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * PATCH /api/goals/:id/progress
 * Update goal progress (current_amount)
 */
router.patch("/:id/progress", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const validationResult = updateGoalProgressSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validationResult.error.errors,
      });
    }

    const { current_amount } = validationResult.data;

    const db = getDb();
    await db.read();

    // Find and update goal
    const goal = db.data.goals.find((g) => g.id === id);
    if (!goal) {
      return res.status(404).json({
        error: "Goal not found",
      });
    }

    goal.current_amount = current_amount;
    goal.updated_at = new Date().toISOString();

    await db.write();

    return res.json({
      success: true,
      goal,
    });
  } catch (error) {
    console.error("Error updating goal progress:", error);
    return res.status(500).json({
      error: "Failed to update goal progress",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * PATCH /api/goals/:id
 * Update goal details
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const validationResult = updateGoalSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validationResult.error.errors,
      });
    }

    const updates = validationResult.data;

    const db = getDb();
    await db.read();

    // Find goal
    const goal = db.data.goals.find((g) => g.id === id);
    if (!goal) {
      return res.status(404).json({
        error: "Goal not found",
      });
    }

    // Check for duplicate name if name is being updated
    if (updates.name && updates.name !== goal.name) {
      const existingGoal = db.data.goals.find(
        (g) =>
          g.id !== id && g.name.toLowerCase() === updates.name!.toLowerCase()
      );
      if (existingGoal) {
        return res.status(409).json({
          error: "A goal with this name already exists",
        });
      }
    }

    // Update goal
    Object.assign(goal, updates);
    goal.updated_at = new Date().toISOString();

    await db.write();

    return res.json({
      success: true,
      goal,
    });
  } catch (error) {
    console.error("Error updating goal:", error);
    return res.status(500).json({
      error: "Failed to update goal",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * DELETE /api/goals/:id
 * Delete a goal
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.read();

    // Find goal
    const goalIndex = db.data.goals.findIndex((g) => g.id === id);
    if (goalIndex === -1) {
      return res.status(404).json({
        error: "Goal not found",
      });
    }

    // Remove goal
    db.data.goals.splice(goalIndex, 1);
    await db.write();

    return res.json({
      success: true,
      message: "Goal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return res.status(500).json({
      error: "Failed to delete goal",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * GET /api/goals/:id/estimate
 * Get estimated completion date for a goal based on current progress
 */
router.get("/:id/estimate", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.read();

    const goal = db.data.goals.find((g) => g.id === id);
    if (!goal) {
      return res.status(404).json({
        error: "Goal not found",
      });
    }

    const remaining = goal.target_amount - goal.current_amount;
    const percentage = (goal.current_amount / goal.target_amount) * 100;

    // Calculate days until target
    const now = new Date();
    const targetDate = new Date(goal.target_date);
    const daysUntilTarget = Math.ceil(
      (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate days since creation
    const createdDate = new Date(goal.created_at);
    const daysSinceCreation = Math.ceil(
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate daily progress rate
    const dailyRate =
      daysSinceCreation > 0 ? goal.current_amount / daysSinceCreation : 0;

    // Estimate completion date based on current rate
    let estimatedCompletionDate = null;
    let daysToCompletion = null;

    if (dailyRate > 0) {
      daysToCompletion = Math.ceil(remaining / dailyRate);
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + daysToCompletion);
      estimatedCompletionDate = estimatedDate.toISOString().split("T")[0];
    }

    return res.json({
      goal,
      remaining,
      percentage: Math.min(percentage, 100),
      completed: goal.current_amount >= goal.target_amount,
      days_until_target: daysUntilTarget,
      estimated_completion_date: estimatedCompletionDate,
      days_to_completion: daysToCompletion,
      on_track: daysToCompletion ? daysToCompletion <= daysUntilTarget : false,
    });
  } catch (error) {
    console.error("Error calculating goal estimate:", error);
    return res.status(500).json({
      error: "Failed to calculate goal estimate",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

export default router;
