import React, { useState } from 'react';
import { createExpense } from '../api';

const CATEGORIES = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'travel', label: 'Travel & Commute' },
  { value: 'bills', label: 'Bills & Utilities' },
  { value: 'other', label: 'Other' },
];

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ExpenseForm({ onExpenseAdded }) {
  const today = getTodayString();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(today);

  const [clientErrors, setClientErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const errors = {};

    // Title validation
    if (!title || !title.trim()) {
      errors.title = 'Title is required';
    } else if (title.trim().length > 100) {
      errors.title = 'Title cannot exceed 100 characters';
    }

    // Amount validation
    if (amount === '' || amount === null || amount === undefined) {
      errors.amount = 'Amount is required';
    } else {
      const trimmedAmount = String(amount).trim();
      if (!/^\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
        errors.amount = 'Amount must be a positive number with up to 2 decimal places';
      } else {
        const num = parseFloat(trimmedAmount);
        if (isNaN(num) || num <= 0) {
          errors.amount = 'Amount must be greater than 0';
        }
      }
    }

    // Category validation
    if (!category || !CATEGORIES.some((c) => c.value === category)) {
      errors.category = 'Please select a valid category';
    }

    // Date validation
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.date = 'Date must be in YYYY-MM-DD format';
      } else if (date > today) {
        errors.date = 'Date cannot be in the future';
      }
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        amount: parseFloat(parseFloat(amount).toFixed(2)),
        category,
        date: date || today,
      };

      const created = await createExpense(payload);
      setSuccessMessage(`Expense "${created.title}" added successfully!`);
      // Reset form
      setTitle('');
      setAmount('');
      setCategory('food');
      setDate(today);
      setClientErrors({});

      if (onExpenseAdded) {
        onExpenseAdded(created);
      }

      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err) {
      setServerError(err.message || 'An error occurred while saving the expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card form-card">
      <div className="card-header">
        <h2 className="card-title">Add New Expense</h2>
        <span className="card-badge">Quick Entry</span>
      </div>

      {serverError && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <strong>Server Error:</strong> {serverError}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert">
          <span className="alert-icon">✓</span>
          <div className="alert-content">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Team Lunch, Uber ride"
              maxLength={100}
              value={title}
              disabled={isSubmitting}
              onChange={(e) => {
                setTitle(e.target.value);
                if (clientErrors.title) {
                  setClientErrors((prev) => ({ ...prev, title: null }));
                }
              }}
              className={clientErrors.title ? 'input-error' : ''}
            />
            <div className="field-meta">
              {clientErrors.title ? (
                <span className="error-text">{clientErrors.title}</span>
              ) : (
                <span className="hint-text">{title.length}/100 characters</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="amount">
              Amount ($) <span className="required">*</span>
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              disabled={isSubmitting}
              onChange={(e) => {
                setAmount(e.target.value);
                if (clientErrors.amount) {
                  setClientErrors((prev) => ({ ...prev, amount: null }));
                }
              }}
              className={clientErrors.amount ? 'input-error' : ''}
            />
            {clientErrors.amount && <span className="error-text">{clientErrors.amount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category">
              Category <span className="required">*</span>
            </label>
            <select
              id="category"
              value={category}
              disabled={isSubmitting}
              onChange={(e) => {
                setCategory(e.target.value);
                if (clientErrors.category) {
                  setClientErrors((prev) => ({ ...prev, category: null }));
                }
              }}
              className={clientErrors.category ? 'input-error' : ''}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {clientErrors.category && <span className="error-text">{clientErrors.category}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="date">
              Date <span className="optional">(defaults to today)</span>
            </label>
            <input
              id="date"
              type="date"
              max={today}
              value={date}
              disabled={isSubmitting}
              onChange={(e) => {
                setDate(e.target.value);
                if (clientErrors.date) {
                  setClientErrors((prev) => ({ ...prev, date: null }));
                }
              }}
              className={clientErrors.date ? 'input-error' : ''}
            />
            {clientErrors.date && <span className="error-text">{clientErrors.date}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-sm" aria-hidden="true"></span>
                Saving Expense...
              </>
            ) : (
              '+ Add Expense'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
