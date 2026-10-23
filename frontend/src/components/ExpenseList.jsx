import React, { useState } from 'react';
import { deleteExpense } from '../api';

const CATEGORY_STYLES = {
  food: { label: 'Food', color: 'badge-food', icon: '🍔' },
  travel: { label: 'Travel', color: 'badge-travel', icon: '✈️' },
  bills: { label: 'Bills', color: 'badge-bills', icon: '📄' },
  other: { label: 'Other', color: 'badge-other', icon: '🏷️' },
};

export default function ExpenseList({
  expenses,
  totalCount,
  totalAmount,
  categoryFilter,
  onCategoryFilterChange,
  page,
  limit,
  onPageChange,
  isLoading,
  error,
  onRetry,
  onExpenseDeleted,
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handleDelete = async (id, title) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(id);
    setDeleteError('');
    try {
      await deleteExpense(id);
      if (onExpenseDeleted) {
        onExpenseDeleted(id);
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete expense.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val || 0);
  };

  return (
    <div className="card list-card">
      {/* Header & Controls */}
      <div className="list-top-bar">
        <div>
          <h2 className="card-title">Expense Records</h2>
          <p className="card-subtitle">
            Showing page {page} of {totalPages} ({totalCount} total {totalCount === 1 ? 'item' : 'items'})
          </p>
        </div>

        {/* Filter Controls */}
        <div className="filter-controls">
          <label htmlFor="filter-category" className="filter-label">
            Filter:
          </label>
          <select
            id="filter-category"
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="food">Food</option>
            <option value="travel">Travel</option>
            <option value="bills">Bills</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Delete error feedback */}
      {deleteError && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">{deleteError}</div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="state-container error-state">
          <p className="state-icon">⚠️</p>
          <p className="state-title">Failed to load expenses</p>
          <p className="state-desc">{error}</p>
          <button className="btn btn-secondary" onClick={onRetry}>
            Try Again
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="state-container loading-state">
          <div className="spinner"></div>
          <p className="state-desc">Loading expenses...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && expenses.length === 0 && (
        <div className="state-container empty-state">
          <p className="state-icon">📊</p>
          <p className="state-title">No expenses found</p>
          <p className="state-desc">
            {categoryFilter
              ? `No expenses found in category "${categoryFilter}". Try selecting "All Categories" or add a new expense above.`
              : 'You have not added any expenses yet. Start tracking your budget today!'}
          </p>
          {categoryFilter && (
            <button className="btn btn-secondary" onClick={() => onCategoryFilterChange('')}>
              Clear Filter
            </button>
          )}
        </div>
      )}

      {/* Expense Table */}
      {!isLoading && !error && expenses.length > 0 && (
        <div className="table-responsive">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th className="text-right">Amount</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => {
                const categoryConfig = CATEGORY_STYLES[exp.category] || {
                  label: exp.category,
                  color: 'badge-other',
                  icon: '🏷️',
                };
                return (
                  <tr key={exp.id}>
                    <td className="cell-date">{exp.date}</td>
                    <td className="cell-title font-medium">{exp.title}</td>
                    <td className="cell-category">
                      <span className={`badge ${categoryConfig.color}`}>
                        <span className="badge-icon">{categoryConfig.icon}</span>
                        {categoryConfig.label}
                      </span>
                    </td>
                    <td className="cell-amount text-right font-semibold">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="cell-actions text-center">
                      <button
                        className="btn-delete"
                        title="Delete expense"
                        disabled={deletingId === exp.id}
                        onClick={() => handleDelete(exp.id, exp.title)}
                      >
                        {deletingId === exp.id ? (
                          <span className="spinner-xs"></span>
                        ) : (
                          '✕'
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && !error && totalCount > 0 && (
        <div className="pagination-bar">
          <button
            className="btn btn-secondary btn-pagination"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <button
            className="btn btn-secondary btn-pagination"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
