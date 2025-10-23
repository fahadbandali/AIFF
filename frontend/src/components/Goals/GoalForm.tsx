import { useState, useEffect } from "react";
import { Goal, api, ApiError } from "../../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface GoalFormProps {
  goal?: Goal | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GoalForm({ goal, onClose, onSuccess }: GoalFormProps) {
  const isEditing = !!goal;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    target_date: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    target_amount?: string;
    target_date?: string;
  }>({});

  // Pre-fill form when editing
  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount.toString(),
        target_date: goal.target_date,
      });
    }
  }, [goal]);

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      target_amount: number;
      target_date: string;
    }) => api.goals.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      name?: string;
      target_amount?: number;
      target_date?: string;
    }) => api.goals.update(goal!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({
        queryKey: ["goalEstimates"],
      });
      onSuccess();
    },
  });

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Goal name is required";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Goal name must be 100 characters or less";
    }

    // Validate target amount
    const amount = parseFloat(formData.target_amount);
    if (!formData.target_amount || isNaN(amount)) {
      newErrors.target_amount = "Target amount is required";
    } else if (amount < 1) {
      newErrors.target_amount = "Target amount must be at least $1";
    } else if (!/^\d+(\.\d{0,2})?$/.test(formData.target_amount)) {
      newErrors.target_amount = "Amount can have at most 2 decimal places";
    }

    // Validate target date
    if (!formData.target_date) {
      newErrors.target_date = "Target date is required";
    } else {
      const targetDate = new Date(formData.target_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (targetDate < today) {
        newErrors.target_date = "Target date must be in the future";
      }

      const fiftyYearsFromNow = new Date();
      fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
      if (targetDate > fiftyYearsFromNow) {
        newErrors.target_date = "Target date must be within 50 years";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data = {
      name: formData.name.trim(),
      target_amount: parseFloat(formData.target_amount),
      target_date: formData.target_date,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setErrors({ name: "A goal with this name already exists" });
        } else {
          setErrors({
            name: error.message || "An error occurred while saving the goal",
          });
        }
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-6">
          {isEditing ? "Edit Goal" : "Create New Goal"}
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Goal Name */}
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text font-semibold">Goal Name *</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Emergency Fund, New Car, Vacation"
              className={`input input-bordered w-full ${
                errors.name ? "input-error" : ""
              }`}
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={isLoading}
            />
            {errors.name && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.name}</span>
              </label>
            )}
          </div>

          {/* Target Amount */}
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text font-semibold">Target Amount *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="10000"
                className={`input input-bordered w-full pl-7 ${
                  errors.target_amount ? "input-error" : ""
                }`}
                value={formData.target_amount}
                onChange={(e) => handleChange("target_amount", e.target.value)}
                disabled={isLoading}
              />
            </div>
            {errors.target_amount && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.target_amount}
                </span>
              </label>
            )}
          </div>

          {/* Target Date */}
          <div className="form-control w-full mb-6">
            <label className="label">
              <span className="label-text font-semibold">Target Date *</span>
            </label>
            <input
              type="date"
              className={`input input-bordered w-full ${
                errors.target_date ? "input-error" : ""
              }`}
              value={formData.target_date}
              onChange={(e) => handleChange("target_date", e.target.value)}
              disabled={isLoading}
            />
            {errors.target_date && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.target_date}
                </span>
              </label>
            )}
          </div>

          {/* Current Amount Display (only when editing) */}
          {isEditing && goal && (
            <div className="alert alert-info mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>
                Current saved amount: $
                {goal.current_amount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                . Use "Add Contribution" to update this.
              </span>
            </div>
          )}

          {/* Form Actions */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Goal"
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </div>
  );
}
