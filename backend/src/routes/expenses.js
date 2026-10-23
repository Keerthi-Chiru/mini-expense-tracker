const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

const VALID_CATEGORIES = ['food', 'travel', 'bills', 'other'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEX = /^\d{4}-\d{2}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const localToday = `${year}-${month}-${day}`;
  const utcToday = now.toISOString().split('T')[0];
  return localToday > utcToday ? localToday : utcToday;
}

function isValidDateString(dateStr) {
  if (!DATE_REGEX.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

// POST /expenses
router.post('/', async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    // Validate title: required, string, max 100 chars
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 100) {
      return res.status(400).json({ error: 'Title must not exceed 100 characters' });
    }

    // Validate amount: number > 0, at most 2 decimal places
    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ error: 'Amount is required' });
    }
    const amountStr = String(amount).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(amountStr)) {
      return res.status(400).json({ error: 'Amount must be a positive number with at most 2 decimal places' });
    }
    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Validate category: one of food, travel, bills, other
    if (!category || typeof category !== 'string' || !VALID_CATEGORIES.includes(category.toLowerCase())) {
      return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
    const cleanCategory = category.toLowerCase();

    // Validate date: optional, defaults to today, cannot be in future
    const maxDate = getTodayString();
    let finalDate = maxDate;

    if (date !== undefined && date !== null && String(date).trim() !== '') {
      const dateStr = String(date).trim();
      if (!isValidDateString(dateStr)) {
        return res.status(400).json({ error: 'Date must be a valid date in YYYY-MM-DD format' });
      }
      if (dateStr > maxDate) {
        return res.status(400).json({ error: 'Date cannot be in the future' });
      }
      finalDate = dateStr;
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          title: trimmedTitle,
          amount: parsedAmount,
          category: cleanCategory,
          date: finalDate,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to create expense' });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('Server error in POST /expenses:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /expenses/summary (Priority 3)
router.get('/summary', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month || !MONTH_REGEX.test(String(month).trim())) {
      return res.status(400).json({ error: 'Query parameter "month" is required in YYYY-MM format (e.g. 2026-10)' });
    }

    const targetMonth = String(month).trim();
    const { data, error } = await supabase.rpc('get_monthly_summary', {
      target_month: targetMonth,
    });

    if (error) {
      console.error('Supabase summary RPC error:', error);
      return res.status(500).json({ error: 'Failed to fetch monthly summary' });
    }

    const summary = (data || []).map((row) => ({
      category: row.category,
      total_amount: parseFloat(Number(row.total_amount).toFixed(2)),
    }));

    const overallTotal = summary.reduce((sum, item) => sum + item.total_amount, 0);

    return res.json({
      month: targetMonth,
      summary,
      total_amount: parseFloat(overallTotal.toFixed(2)),
    });
  } catch (err) {
    console.error('Server error in GET /expenses/summary:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /expenses
router.get('/', async (req, res) => {
  try {
    const { category, from, to, page = '1', limit = '10' } = req.query;

    let filterCategory = null;
    if (category && String(category).trim() !== '') {
      const cat = String(category).trim().toLowerCase();
      if (!VALID_CATEGORIES.includes(cat)) {
        return res.status(400).json({ error: `Invalid category filter. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
      }
      filterCategory = cat;
    }

    let filterFrom = null;
    if (from && String(from).trim() !== '') {
      const fromStr = String(from).trim();
      if (!isValidDateString(fromStr)) {
        return res.status(400).json({ error: 'Parameter "from" must be a valid date in YYYY-MM-DD format' });
      }
      filterFrom = fromStr;
    }

    let filterTo = null;
    if (to && String(to).trim() !== '') {
      const toStr = String(to).trim();
      if (!isValidDateString(toStr)) {
        return res.status(400).json({ error: 'Parameter "to" must be a valid date in YYYY-MM-DD format' });
      }
      filterTo = toStr;
    }

    if (filterFrom && filterTo && filterFrom > filterTo) {
      return res.status(400).json({ error: 'Date "from" cannot be after date "to"' });
    }

    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Parameter "page" must be a positive integer greater than or equal to 1' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Parameter "limit" must be an integer between 1 and 100' });
    }

    const offset = (pageNum - 1) * limitNum;

    // Get aggregated count and total_amount across ALL matching expenses
    const { data: totalsData, error: totalsError } = await supabase.rpc('get_expenses_totals', {
      filter_category: filterCategory,
      filter_from: filterFrom,
      filter_to: filterTo,
    });

    if (totalsError) {
      console.error('Supabase totals RPC error:', totalsError);
      return res.status(500).json({ error: 'Failed to calculate expense totals' });
    }

    const total_count = totalsData && totalsData[0] ? parseInt(totalsData[0].total_count, 10) : 0;
    const total_amount = totalsData && totalsData[0] ? parseFloat(Number(totalsData[0].total_amount).toFixed(2)) : 0;

    // Fetch paginated items (newest first: date DESC, created_at DESC)
    let query = supabase.from('expenses').select('*');
    if (filterCategory) {
      query = query.eq('category', filterCategory);
    }
    if (filterFrom) {
      query = query.gte('date', filterFrom);
    }
    if (filterTo) {
      query = query.lte('date', filterTo);
    }

    query = query
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: items, error: itemsError } = await query;

    if (itemsError) {
      console.error('Supabase fetch items error:', itemsError);
      return res.status(500).json({ error: 'Failed to fetch expenses' });
    }

    return res.json({
      items: items || [],
      total_count,
      total_amount,
    });
  } catch (err) {
    console.error('Server error in GET /expenses:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /expenses/:id (Priority 3)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const { data, error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: 'Failed to delete expense' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    return res.json({ message: 'Expense deleted successfully', id });
  } catch (err) {
    console.error('Server error in DELETE /expenses/:id:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
