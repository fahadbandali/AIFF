import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export default function TransactionsMasterView() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortField, setSortField] = useState<"date" | "amount" | "description">(
    "date"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    category_id: "",
    description: "",
  });
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // === FETCHING ===
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.transactions.getAll(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.getAll(),
  });

  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.accounts.getAll(),
  });

  const transactions = transactionsData?.transactions || [];
  const categories = categoriesData?.categories || [];
  const accounts = accountsData?.accounts || [];

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      category_id,
      name,
    }: {
      id: string;
      category_id?: string;
      name?: string;
    }) => api.transactions.patch(id, category_id, name),
    onSuccess: async () => {
      // Only invalidate transaction and cash flow related queries
      await queryClient.invalidateQueries({
        queryKey: ["transactions"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["cashFlowStats"],
        exact: false,
      });
    },
  });

  // ✅ Initialize filters once categories/accounts are loaded
  useEffect(() => {
    if (categories.length > 0 && selectedCategories.length === 0) {
      setSelectedCategories(categories.map((c) => c.id));
    }
  }, [categories]);

  useEffect(() => {
    if (accounts.length > 0 && selectedAccounts.length === 0) {
      setSelectedAccounts(accounts.map((a) => a.id));
    }
  }, [accounts]);

  // === FILTER + SORT ===
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        [t.id, t.merchant_name, t.name, t.amount.toString()]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((t) =>
        selectedCategories.includes(t.category_id)
      );
    }

    if (selectedAccounts.length > 0) {
      filtered = filtered.filter((t) =>
        selectedAccounts.includes(t.account_id)
      );
    }

    if (minAmount)
      filtered = filtered.filter(
        (t) => Math.abs(t.amount) >= parseFloat(minAmount)
      );
    if (maxAmount)
      filtered = filtered.filter(
        (t) => Math.abs(t.amount) <= parseFloat(maxAmount)
      );

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === "amount") {
        cmp = a.amount - b.amount;
      } else {
        cmp = (a.merchant_name || a.name).localeCompare(
          b.merchant_name || b.name
        );
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [
    transactions,
    searchQuery,
    selectedCategories,
    selectedAccounts,
    minAmount,
    maxAmount,
    sortField,
    sortDirection,
  ]);

  // === PAGINATION ===
  const totalRecords = filteredAndSortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentPageItems = filteredAndSortedTransactions.slice(
    startIndex,
    startIndex + pageSize
  );

  const goToPage = (page: number) =>
    setCurrentPage(Math.min(Math.max(1, page), totalPages));

  // === HELPERS ===
  const getCategory = (id: string) => categories.find((c) => c.id === id);
  const getAccount = (id: string) => accounts.find((a) => a.id === id);
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(n));
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setSelectedCategories(categories.map((c) => c.id));
    setSelectedAccounts(accounts.map((a) => a.id));
  };

  const handleEditClick = (t: any) => {
    setEditingTransaction(t);
    setEditForm({
      category_id: t.category_id || "",
      description: t.description || t.name || "",
    });
  };

  const handleSaveEdit = () => {
    if (editingTransaction) {
      // updateTransactionMutation.mutate({ id: editingTransaction.id, data: editForm });
      updateMutation.mutate({
        id: editingTransaction.id,
        category_id: editForm.category_id,
        name: editForm.description,
      });
      setEditingTransaction(null);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 opacity-30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {sortDirection === "asc" ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        )}
      </svg>
    );
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title mb-4">Transactions</h2>

        {/* Search + Filters Toggle */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search..."
            className="input input-bordered flex-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="button"
            className={`btn ${
              showAdvancedFilters ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setShowAdvancedFilters((s) => !s)}
          >
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="card bg-base-200 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date / Amount filters */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Start Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">End Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Min Amount</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered input-sm"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Max Amount</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered input-sm"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>

              {/* Category Filters */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-semibold">Categories</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      className={`btn btn-sm ${
                        selectedCategories.includes(cat.id)
                          ? "btn-primary"
                          : "btn-outline"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleCategory(cat.id);
                      }}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Filters */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-semibold">Accounts</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {accounts.map((acc) => (
                    <button
                      type="button"
                      key={acc.id}
                      className={`btn btn-sm ${
                        selectedAccounts.includes(acc.id)
                          ? "btn-primary"
                          : "btn-outline"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleAccount(acc.id);
                      }}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button className="btn btn-sm btn-ghost" onClick={clearFilters}>
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="text-sm text-gray-500 mb-2">
          Showing {currentPageItems.length} of{" "}
          {filteredAndSortedTransactions.length} transactions
        </div>

        {currentPageItems.length === 0 ? (
          <div className="alert alert-info">
            <span>No transactions found</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th onClick={() => handleSort("date")}>
                    <div className="flex items-end gap-1">
                      Date <SortIcon field="date" />
                    </div>
                  </th>
                  <th onClick={() => handleSort("description")}>
                    <div className="flex items-end gap-1">
                      Description <SortIcon field="description" />
                    </div>
                  </th>
                  <th>Category</th>
                  <th>Account</th>
                  <th onClick={() => handleSort("amount")}>
                    <div className="flex items-end gap-1">
                      Amount <SortIcon field="amount" />
                    </div>
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentPageItems.map((t) => {
                  const cat = getCategory(t.category_id);
                  const acc = getAccount(t.account_id);
                  return (
                    <tr key={t.id}>
                      <td>{formatDate(t.date)}</td>
                      <td>{t.merchant_name || t.name}</td>
                      <td>
                        {cat?.icon}
                        {cat?.name || "Uncategorized"}
                      </td>
                      <td>{acc?.name || "Unknown"}</td>
                      <td
                        className={t.amount < 0 ? "text-success" : "text-error"}
                      >
                        {t.amount < 0 ? "+" : "-"} {formatCurrency(t.amount)}
                      </td>
                      <td>{t.is_pending ? "Pending" : "Posted"}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleEditClick(t)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <button
                className="btn btn-xs"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                « First
              </button>
              <button
                className="btn btn-xs"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹ Prev
              </button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-xs"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next ›
              </button>
              <button
                className="btn btn-xs"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last »
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm">Rows per page:</label>
              <select
                className="select select-bordered select-xs"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingTransaction && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Edit Transaction</h3>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </div>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Category</span>
                </label>
                <select
                  className="select select-bordered"
                  value={editForm.category_id}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category_id: e.target.value })
                  }
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => setEditingTransaction(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveEdit}>
                  Save
                </button>
              </div>
            </div>
            <div
              className="modal-backdrop"
              onClick={() => setEditingTransaction(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
