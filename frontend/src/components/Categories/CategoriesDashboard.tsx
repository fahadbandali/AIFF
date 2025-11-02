import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import TransactionsByCategoryView from "./TransactionsByCategoryView";

interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
  icon?: string;
  color?: string;
  budgetCount?: number;
}

interface CategoryFormData {
  name: string;
  parent_id?: string | null;
  color: string;
  icon: string;
}

const commonEmojis = [
  "📁",
  "🛒",
  "🏠",
  "🚗",
  "💰",
  "🍔",
  "⚡",
  "🎮",
  "💊",
  "📱",
  "✈️",
  "🎓",
];

const CategoriesDashboard: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // Form data
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    parent_id: null,
    color: "#3B82F6",
    icon: "📁",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.categories.getAll();
      setCategories(response.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      parent_id: null,
      color: "#3B82F6",
      icon: "📁",
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      parent_id: category.parent_id || null,
      color: category.color || "#3B82F6",
      icon: category.icon || "📁",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateCategory = async () => {
    try {
      const response = await api.categories.create(formData);
      setCategories([...categories, response.category]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;

    try {
      const response = await api.categories.put(selectedCategory.id, {
        name: formData.name,
        color: formData.color,
        icon: formData.icon,
      });
      setCategories(
        categories.map((c) =>
          c.id === selectedCategory.id ? response.category : c
        )
      );
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      await api.categories.delete(selectedCategory.id);
      setCategories(categories.filter((c) => c.id !== selectedCategory.id));
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/60">Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="alert alert-error shadow-lg">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Error loading categories</h3>
              <div className="text-sm">{error}</div>
            </div>
          </div>
          <button className="btn btn-sm" onClick={fetchCategories}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Categories
          </h1>
          <p className="text-base-content/60 mt-2">
            Organize your budget with custom categories
          </p>
        </div>
        <button
          className="btn btn-primary gap-2 shadow-lg"
          onClick={openCreateDialog}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body items-center text-center py-16">
            <div className="text-7xl mb-6 opacity-50">📂</div>
            <h3 className="text-2xl font-bold mb-2">No categories yet</h3>
            <p className="text-base-content/60 mb-6 max-w-md">
              Create your first category to start organizing your budgets and
              tracking your spending
            </p>
            <button
              className="btn btn-primary btn-lg gap-2"
              onClick={openCreateDialog}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Your First Category
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="stats shadow mb-6 w-full">
            <div className="stat">
              <div className="stat-title">Total Categories</div>
              <div className="stat-value text-primary">{categories.length}</div>
              <div className="stat-desc">Active budget categories</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-200 border border-base-300 hover:border-primary/50"
              >
                <div className="card-body p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="text-4xl flex-shrink-0 p-2 rounded-lg"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        {category.icon || "📁"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-lg truncate">
                          {category.name}
                        </h2>
                        {category.budgetCount !== undefined && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="badge badge-sm badge-ghost gap-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                              {category.budgetCount}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="dropdown dropdown-end">
                      <label
                        tabIndex={0}
                        className="btn btn-ghost btn-sm btn-circle"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </label>
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300"
                      >
                        <li>
                          <a
                            onClick={() => openEditDialog(category)}
                            className="gap-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </a>
                        </li>
                        <li>
                          <a
                            className="text-error gap-2"
                            onClick={() => openDeleteDialog(category)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {category.color && (
                    <div className="mt-3 pt-3 border-t border-base-300">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full shadow-sm border-2 border-base-100"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-xs text-base-content/50 font-mono">
                          {category.color}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-8">
        <TransactionsByCategoryView categories={categories} />
      </div>

      {/* Create Category Dialog */}
      {isCreateDialogOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-2xl mb-6 flex items-center gap-2">
              <span className="text-3xl">✨</span>
              Create New Category
            </h3>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Category Name
                  </span>
                  <span className="label-text-alt text-error">
                    {formData.name.trim() ? "" : "Required"}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Groceries, Rent, Entertainment"
                  className="input input-bordered focus:input-primary"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  autoFocus
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Icon</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Choose or type emoji"
                    className="input input-bordered focus:input-primary flex-1"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    maxLength={2}
                  />
                  <div className="text-4xl p-2 bg-base-200 rounded-lg flex items-center justify-center w-16">
                    {formData.icon}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      className={`btn btn-sm ${
                        formData.icon === emoji ? "btn-primary" : "btn-ghost"
                      }`}
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Color</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    className="w-20 h-12 rounded-lg cursor-pointer border-2 border-base-300"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    className="input input-bordered focus:input-primary flex-1 font-mono"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Parent Category
                  </span>
                  <span className="label-text-alt">Optional</span>
                </label>
                <select
                  className="select select-bordered focus:select-primary"
                  value={formData.parent_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parent_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">None - This is a main category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="divider my-2"></div>

              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <p className="text-sm font-semibold mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="text-3xl p-2 rounded-lg"
                      style={{ backgroundColor: `${formData.color}20` }}
                    >
                      {formData.icon}
                    </div>
                    <div>
                      <p className="font-bold">
                        {formData.name || "Category Name"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: formData.color }}
                        ></div>
                        <span className="text-xs opacity-60 font-mono">
                          {formData.color}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-action mt-6">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary gap-2"
                onClick={handleCreateCategory}
                disabled={!formData.name.trim()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Create Category
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => setIsCreateDialogOpen(false)}
          ></div>
        </div>
      )}

      {/* Edit Category Dialog */}
      {isEditDialogOpen && selectedCategory && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-2xl mb-6 flex items-center gap-2">
              <span className="text-3xl">✏️</span>
              Edit Category
            </h3>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Category Name
                  </span>
                  <span className="label-text-alt text-error">
                    {formData.name.trim() ? "" : "Required"}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Groceries, Rent, Entertainment"
                  className="input input-bordered focus:input-primary"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  autoFocus
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Icon</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Choose or type emoji"
                    className="input input-bordered focus:input-primary flex-1"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    maxLength={2}
                  />
                  <div className="text-4xl p-2 bg-base-200 rounded-lg flex items-center justify-center w-16">
                    {formData.icon}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      className={`btn btn-sm ${
                        formData.icon === emoji ? "btn-primary" : "btn-ghost"
                      }`}
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Color</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    className="w-20 h-12 rounded-lg cursor-pointer border-2 border-base-300"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    className="input input-bordered focus:input-primary flex-1 font-mono"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="divider my-2"></div>

              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <p className="text-sm font-semibold mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="text-3xl p-2 rounded-lg"
                      style={{ backgroundColor: `${formData.color}20` }}
                    >
                      {formData.icon}
                    </div>
                    <div>
                      <p className="font-bold">
                        {formData.name || "Category Name"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: formData.color }}
                        ></div>
                        <span className="text-xs opacity-60 font-mono">
                          {formData.color}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-action mt-6">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCategory(null);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary gap-2"
                onClick={handleUpdateCategory}
                disabled={!formData.name.trim()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Changes
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedCategory(null);
            }}
          ></div>
        </div>
      )}

      {/* Delete Category Dialog */}
      {isDeleteDialogOpen && selectedCategory && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="font-bold text-2xl mb-2">Delete Category?</h3>
              <p className="text-base-content/70 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-bold text-primary">
                  "{selectedCategory.name}"
                </span>
                ?
                <br />
                This action cannot be undone.
              </p>
            </div>

            {selectedCategory.budgetCount &&
              selectedCategory.budgetCount > 0 && (
                <div className="alert alert-warning shadow-lg mb-4">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-current flex-shrink-0 h-6 w-6"
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
                    <div>
                      <h3 className="font-bold">Warning</h3>
                      <div className="text-sm">
                        This category has {selectedCategory.budgetCount}{" "}
                        associated budget
                        {selectedCategory.budgetCount > 1 ? "s" : ""}.
                      </div>
                    </div>
                  </div>
                </div>
              )}

            <div className="modal-action justify-center">
              <button
                className="btn btn-ghost btn-lg"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedCategory(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-error btn-lg gap-2"
                onClick={handleDeleteCategory}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Category
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => {
              setIsDeleteDialogOpen(false);
              setSelectedCategory(null);
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default CategoriesDashboard;
