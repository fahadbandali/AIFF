import { Router } from "express";
import { z } from "zod";
import { getDb } from "../services/database";
import type { Category } from "../services/database";
import { randomUUID } from "crypto";

const router = Router();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, "name is required"),
  parent_id: z.string().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "color must be a valid hex color"),
  icon: z.string().min(1, "icon is required"),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, "name is required").optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "color must be a valid hex color")
    .optional(),
  icon: z.string().min(1, "icon is required").optional(),
});

/**
 * GET /api/categories
 * Get all categories
 */
router.get("/", async (_req, res) => {
  try {
    const db = getDb();
    await db.read();

    const categories = db.data.categories;

    res.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      error: "Failed to fetch categories",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * GET /api/categories/:id
 * Get a single category by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.read();

    const category = db.data.categories.find((c) => c.id === id);
    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    res.json({ category });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      error: "Failed to fetch category",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * PUT /api/categories/:id
 * Update a category by ID
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validationResult = updateCategorySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validationResult.error.errors,
      });
    }
    const { name, color, icon } = validationResult.data;
    const db = getDb();
    await db.read();

    const category = db.data.categories.find((c) => c.id === id);
    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    if (name) {
      category.name = name;
    }
    if (color) {
      category.color = color;
    }
    if (icon) {
      category.icon = icon;
    }

    category.updated_at = new Date().toISOString();

    await db.write();

    res.json({
      success: true,
      category: category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      error: "Failed to update category",
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/categories
 * Create a new category (user-defined)
 */
router.post("/", async (req, res) => {
  try {
    // Validate input
    const validationResult = createCategorySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validationResult.error.errors,
      });
    }

    const { name, parent_id, color, icon } = validationResult.data;

    const db = getDb();
    await db.read();

    // Verify parent category exists if parent_id is provided
    if (parent_id) {
      const parentCategory = db.data.categories.find((c) => c.id === parent_id);
      if (!parentCategory) {
        return res.status(404).json({
          error: "Parent category not found",
        });
      }
    }

    // Create new category
    const newCategory: Category = {
      id: randomUUID(),
      name,
      parent_id: parent_id || null,
      color,
      icon,
      is_system: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.data.categories.push(newCategory);
    await db.write();

    res.status(201).json({
      success: true,
      category: newCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      error: "Failed to create category",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * DELETE /api/categories/:id
 * Delete a category
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.read();

    const categoryIndex = db.data.categories.findIndex((c) => c.id === id);
    if (categoryIndex === -1) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    db.data.categories.splice(categoryIndex, 1);
    await db.write();

    res.json({
      success: true,
      message: "Category deleted successfully",
    });

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      error: "Failed to delete category",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

/**
 * fetch all the transactions for a category
 */
router.get("/:category_id/transactions", async (req, res) => {
  try {
    const { category_id } = req.params;
    const db = getDb();
    await db.read();

    const transactions = db.data.transactions.filter(
      (t) => t.category_id === category_id
    );

    res.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions for category:", error);
    res.status(500).json({
      error: "Failed to fetch transactions for category",
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
});

export default router;
