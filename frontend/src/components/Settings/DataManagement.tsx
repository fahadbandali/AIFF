import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Database, ValidateResponse } from "../../lib/api";

export default function DataManagement() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidateResponse | null>(null);
  const [importData, setImportData] = useState<Database | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      await api.data.export();
    },
    onSuccess: () => {
      alert("✅ Data exported successfully!");
    },
    onError: (error: Error) => {
      alert(`❌ Export failed: ${error.message}`);
    },
  });

  // Import mutation (always uses "replace" strategy)
  const importMutation = useMutation({
    mutationFn: async (data: Database) => {
      return await api.data.import({ data, strategy: "replace" });
    },
    onSuccess: () => {
      // Invalidate all queries to refresh dashboard
      queryClient.invalidateQueries();
      setShowConfirmModal(false);
      setSelectedFile(null);
      setImportData(null);
      setValidationResult(null);
      alert("✅ Data imported successfully! Dashboard will refresh.");
    },
    onError: (error: Error) => {
      alert(`❌ Import failed: ${error.message}`);
    },
  });

  // Validate mutation
  const validateMutation = useMutation({
    mutationFn: async (data: Database) => {
      return await api.data.validate(data);
    },
    onSuccess: (result) => {
      setValidationResult(result);
      if (result.valid) {
        setValidationErrors([]);
        setShowConfirmModal(true);
      } else {
        // Extract and display validation errors on the page
        const errorLines = result.message?.split("\n") || ["Unknown error"];
        // Skip the first line which is usually the summary
        const errors = errorLines.slice(1).filter((line) => line.trim());
        setValidationErrors(errors);
      }
    },
    onError: (error: Error) => {
      // Display error message with proper formatting
      const errorLines = error.message.split("\n");
      const errors = errorLines.filter((line) => line.trim());
      setValidationErrors(errors);
      setValidationResult(null);
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setValidationResult(null);
    setImportData(null);
    setValidationErrors([]);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setImportData(data);
    } catch (error) {
      setValidationErrors([
        "Invalid JSON file. Please select a valid backup file.",
      ]);
      setSelectedFile(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/json") {
      handleFileSelect(file);
    } else {
      alert("❌ Please drop a JSON file.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleValidateAndImport = () => {
    if (importData) {
      validateMutation.mutate(importData);
    }
  };

  const handleConfirmImport = () => {
    if (importData) {
      importMutation.mutate(importData);
    }
  };

  const handleCancelImport = () => {
    setShowConfirmModal(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-base-content opacity-70">
          Export and import your financial data for backup and portability
        </p>
      </div>

      {/* Export Section */}
      <div className="card bg-base-200 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Export Data</h2>
          <p className="text-base-content opacity-70 mb-4">
            Download a complete backup of your financial data in JSON format.
            This includes all accounts, transactions, categories, budgets,
            goals, and connected bank information.
          </p>
          <div className="alert alert-warning mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm">
              <strong>Note:</strong> Plaid access tokens remain encrypted in the
              export file. To import on a different machine, you must have the
              same encryption key.
            </span>
          </div>
          <button
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="btn btn-primary btn-lg"
          >
            {exportMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Exporting...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Import Data</h2>
          <p className="text-base-content opacity-70 mb-4">
            Import a previously exported backup file to restore your data.
          </p>

          {/* File Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-4">
                <div className="text-green-600 text-5xl">✓</div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {validationResult?.valid && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 font-medium mb-2">
                      ✓ File validated successfully
                    </p>
                    {validationResult.counts && (
                      <div className="text-xs text-green-700 space-y-1">
                        <p>Accounts: {validationResult.counts.accounts}</p>
                        <p>
                          Transactions: {validationResult.counts.transactions}
                        </p>
                        <p>Categories: {validationResult.counts.categories}</p>
                        <p>Budgets: {validationResult.counts.budgets}</p>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setImportData(null);
                    setValidationResult(null);
                    setValidationErrors([]);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-gray-400 text-5xl">📁</div>
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    Drop your backup file here
                  </p>
                  <p className="text-sm text-gray-500">or</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Browse Files
                </button>
                <p className="text-xs text-gray-500">
                  Accepts .json files up to 50MB
                </p>
              </div>
            )}
          </div>

          {/* Import Section */}
          {selectedFile && (
            <div className="mt-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Import Mode:</strong> This will completely replace all
                  existing data with the imported data. Make sure you have a
                  backup of your current data before proceeding.
                </p>
              </div>

              {/* Validation Errors Display */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-red-600 text-xl flex-shrink-0">❌</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 mb-2">
                        Validation Failed ({validationErrors.length} error
                        {validationErrors.length === 1 ? "" : "s"})
                      </h3>
                      <div className="max-h-60 overflow-y-auto">
                        <ul className="space-y-1">
                          {validationErrors.map((error, index) => (
                            <li
                              key={index}
                              className="text-sm text-red-800 font-mono bg-red-100 px-3 py-2 rounded"
                            >
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-sm text-red-700 mt-3">
                        Please fix these issues in your import file and try
                        again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleValidateAndImport}
                disabled={validateMutation.isPending || !importData}
                className="btn btn-success btn-lg w-full"
              >
                {validateMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Validating...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Validate & Import Data
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Import
            </h3>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                ⚠️ Warning: This will replace all existing data
              </p>
              <p className="text-xs text-red-700">
                Your current data will be permanently replaced with the imported
                data. This action cannot be undone. Make sure you have a backup
                of your current data before proceeding.
              </p>
            </div>

            {validationResult?.counts && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Import Preview:
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• {validationResult.counts.accounts} accounts</p>
                  <p>• {validationResult.counts.transactions} transactions</p>
                  <p>• {validationResult.counts.categories} categories</p>
                  <p>• {validationResult.counts.budgets} budgets</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelImport}
                disabled={importMutation.isPending}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {importMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Importing...
                  </span>
                ) : (
                  "Confirm Import"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
