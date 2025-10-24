import express from "express";
import { z } from "zod";
import {
  exportDatabase,
  importDatabase,
  validateDatabaseStructure,
  ImportStrategy,
} from "../services/database";

const router = express.Router();

/**
 * GET /api/data/export
 * Export entire database as JSON
 */
router.get("/export", (_req, res) => {
  try {
    const data = exportDatabase();

    // Generate filename with current date
    const date = new Date().toISOString().split("T")[0];
    const filename = `finance-backup-${date}.json`;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.json(data);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({
      error: "Failed to export database",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/data/import
 * Import database from JSON
 * Body: { data: Database, strategy: "replace" | "merge" | "append" }
 */
router.post("/import", async (req, res) => {
  try {
    // Validate request body structure
    const requestSchema = z.object({
      data: z.any(), // Will be validated by validateDatabaseStructure
      strategy: z.enum(["replace", "merge", "append"]).default("replace"),
    });

    const { data, strategy } = requestSchema.parse(req.body);

    // Validate database structure first (this will throw if invalid)
    validateDatabaseStructure(data);

    // Perform import
    await importDatabase(data, strategy as ImportStrategy);

    res.json({
      success: true,
      message: `Database imported successfully using ${strategy} strategy`,
    });
  } catch (error) {
    console.error("Import error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Invalid database structure",
        details: error.errors,
      });
    }

    // Handle custom validation errors
    if (error instanceof Error) {
      return res.status(400).json({
        error: "Import failed",
        message: error.message,
      });
    }

    // Generic error
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to import database",
    });
  }
});

/**
 * POST /api/data/validate
 * Validate database structure without importing
 * Body: { data: Database }
 */
router.post("/validate", (req, res) => {
  try {
    const requestSchema = z.object({
      data: z.any(),
    });

    const { data } = requestSchema.parse(req.body);

    // Validate structure
    const validatedData = validateDatabaseStructure(data);

    // Return validation result with counts
    res.json({
      valid: true,
      message: "Database structure is valid",
      counts: {
        accounts: validatedData.accounts.length,
        transactions: validatedData.transactions.length,
        categories: validatedData.categories.length,
        budgets: validatedData.budgets.length,
        plaid_items: validatedData.plaid_items.length,
      },
    });
  } catch (error) {
    console.error("Validation error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        valid: false,
        error: "Validation failed",
        message: "Invalid database structure",
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        valid: false,
        error: "Validation failed",
        message: error.message,
      });
    }

    res.status(500).json({
      valid: false,
      error: "Internal server error",
      message: "Failed to validate database",
    });
  }
});

export default router;
