import React, { useState, useEffect, useCallback } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import MonthlySummary from './components/MonthlySummary';
import { fetchExpenses } from './api';
import './App.css';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchExpenses({
        category: categoryFilter,
        page,
        limit,
      });
      setExpenses(response.items || []);
      setTotalCount(response.total_count || 0);
      setTotalAmount(response.total_amount || 0);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError(err.message || 'Unable to connect to the expense server.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, page, limit]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses, refreshKey]);

  const handleExpenseAdded = () => {
    // When adding, jump back to page 1 to see the newest entry
    setPage(1);
    setRefreshKey((k) => k + 1);
  };

  const handleExpenseDeleted = () => {
    // If we deleted the only item on the last page > 1, step back 1 page
    if (expenses.length === 1 && page > 1) {
      setPage((p) => p - 1);
    } else {
      setRefreshKey((k) => k + 1);
    }
  };

  const handleCategoryFilterChange = (newCat) => {
    setCategoryFilter(newCat);
    setPage(1); // Reset to page 1 on filter change
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val || 0);
  };

  return (
    <div className="app-container">
      {/* Top Navigation / Brand */}
      <header className="app-header">
        <div className="brand">
          <div className="logo-icon">💰</div>
          <div>
            <h1 className="brand-title">Mini Expense Tracker</h1>
            <p className="brand-subtitle">Track, filter, and analyze your daily expenses</p>
          </div>
        </div>

        {/* Global Total Amount Metric from API */}
        <div className="hero-stat">
          <span className="stat-label">Total Filtered Amount</span>
          <span className="stat-value">{formatCurrency(totalAmount)}</span>
          <span className="stat-sub">{totalCount} total {totalCount === 1 ? 'record' : 'records'}</span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="app-main">
        <div className="form-column">
          <ExpenseForm onExpenseAdded={handleExpenseAdded} />
        </div>

        <div className="list-column">
          <ExpenseList
            expenses={expenses}
            totalCount={totalCount}
            totalAmount={totalAmount}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={handleCategoryFilterChange}
            page={page}
            limit={limit}
            onPageChange={setPage}
            isLoading={isLoading}
            error={error}
            onRetry={loadExpenses}
            onExpenseDeleted={handleExpenseDeleted}
          />
        </div>
      </main>

      {/* Monthly Summary Section (Priority 3) */}
      <section className="summary-section">
        <MonthlySummary refreshKey={refreshKey} />
      </section>
    </div>
  );
}
