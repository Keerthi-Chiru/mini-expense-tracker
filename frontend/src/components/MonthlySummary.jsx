import React, { useState, useEffect } from 'react';
import { fetchMonthlySummary } from '../api';

const CATEGORY_NAMES = {
  food: 'Food & Dining',
  travel: 'Travel & Commute',
  bills: 'Bills & Utilities',
  other: 'Other',
};

const CATEGORY_COLORS = {
  food: '#ef4444',
  travel: '#3b82f6',
  bills: '#f59e0b',
  other: '#8b5cf6',
};

export default function MonthlySummary({ refreshKey }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchMonthlySummary(selectedMonth);
      setSummaryData(data);
    } catch (err) {
      setError(err.message || 'Failed to load summary');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [selectedMonth, refreshKey]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val || 0);
  };

  return (
    <div className="card summary-card">
      <div className="card-header summary-header">
        <div>
          <h2 className="card-title">Monthly Category Breakdown</h2>
          <p className="card-subtitle">Spending distribution across categories</p>
        </div>
        <div className="month-picker-wrapper">
          <label htmlFor="month-select" className="filter-label">
            Month:
          </label>
          <input
            id="month-select"
            type="month"
            className="filter-input-month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="state-container loading-state">
          <div className="spinner"></div>
          <p className="state-desc">Loading breakdown...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">{error}</div>
        </div>
      )}

      {!isLoading && !error && summaryData && (
        <div className="summary-body">
          <div className="summary-banner">
            <span className="summary-banner-label">Total for {summaryData.month}:</span>
            <span className="summary-banner-val">{formatCurrency(summaryData.total_amount)}</span>
          </div>

          {summaryData.summary.length === 0 ? (
            <p className="no-summary-text">No recorded expenses for this month.</p>
          ) : (
            <div className="category-bars">
              {summaryData.summary.map((item) => {
                const percentage =
                  summaryData.total_amount > 0
                    ? Math.round((item.total_amount / summaryData.total_amount) * 100)
                    : 0;
                const color = CATEGORY_COLORS[item.category] || '#64748b';
                const label = CATEGORY_NAMES[item.category] || item.category;

                return (
                  <div key={item.category} className="category-bar-row">
                    <div className="category-bar-label">
                      <span className="category-name">{label}</span>
                      <span className="category-value">
                        {formatCurrency(item.total_amount)} ({percentage}%)
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
