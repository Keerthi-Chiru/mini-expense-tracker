const API_BASE = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:5001' : '');

export async function fetchExpenses({ category = '', from = '', to = '', page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  params.append('page', String(page));
  params.append('limit', String(limit));

  const res = await fetch(`${API_BASE}/expenses?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch expenses');
  }
  return data;
}

export async function createExpense(expenseData) {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create expense');
  }
  return data;
}

export async function deleteExpense(id) {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete expense');
  }
  return data;
}

export async function fetchMonthlySummary(month) {
  const res = await fetch(`${API_BASE}/expenses/summary?month=${encodeURIComponent(month)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch monthly summary');
  }
  return data;
}
