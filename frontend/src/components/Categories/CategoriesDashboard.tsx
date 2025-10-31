//export default function CategoriesDashboard() {
//    return <div>CategoriesDashboard</div>;

//}

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import TransactionsByCategoryView from "./TransactionsByCategoryView";

interface Category {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  budgetCount?: number;
}

const CategoriesDashboard: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
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
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{error}</span>
        <button className="btn btn-sm btn-ghost" onClick={fetchCategories}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-base-content/60 mt-1">
            Manage your budget categories
          </p>
        </div>
        <button className="btn btn-primary">
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
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-semibold mb-2">No categories yet</h3>
          <p className="text-base-content/60 mb-4">
            Create your first category to organize your budgets
          </p>
          <button className="btn btn-primary">Create Category</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{category.emoji || "📁"}</div>
                    <div>
                      <h2 className="card-title text-lg">{category.name}</h2>
                      {category.budgetCount !== undefined && (
                        <p className="text-sm text-base-content/60">
                          {category.budgetCount}{" "}
                          {category.budgetCount === 1 ? "budget" : "budgets"}
                        </p>
                      )}
                      {category.id}
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
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                    >
                      <li>
                        <a>Edit</a>
                      </li>
                      <li>
                        <a className="text-error">Delete</a>
                      </li>
                    </ul>
                  </div>
                </div>
                {category.color && (
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="text-xs text-base-content/60">
                      {category.color}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <TransactionsByCategoryView categories={categories} />
    </div>
  );
};

export default CategoriesDashboard;
