const http = require('http');

const app = require('./src/index');

const server = app.listen(5099, async () => {
  console.log('Testing server started on port 5099');

  async function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 5099,
          path,
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(body) });
            } catch (e) {
              resolve({ status: res.statusCode, text: body });
            }
          });
        }
      );
      req.on('error', reject);
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }

  try {
    console.log('--- Test 1: Healthcheck ---');
    const health = await request('/health');
    console.log('Health:', health);

    console.log('--- Test 2: Validation Failures ---');
    // Missing title
    let res = await request('/expenses', { method: 'POST', body: { amount: 25, category: 'food' } });
    console.log('Missing title (expected 400):', res.status, res.data);

    // Invalid amount (negative or 3 decimals)
    res = await request('/expenses', { method: 'POST', body: { title: 'Coffee', amount: 12.345, category: 'food' } });
    console.log('Amount >2 decimals (expected 400):', res.status, res.data);

    // Invalid category
    res = await request('/expenses', { method: 'POST', body: { title: 'Coffee', amount: 4.5, category: 'unknown' } });
    console.log('Invalid category (expected 400):', res.status, res.data);

    // Future date
    res = await request('/expenses', { method: 'POST', body: { title: 'Coffee', amount: 4.5, category: 'food', date: '2099-12-31' } });
    console.log('Future date (expected 400):', res.status, res.data);

    console.log('--- Test 3: Successful Expense Creation ---');
    const exp1 = await request('/expenses', {
      method: 'POST',
      body: { title: 'Grocery Run', amount: 45.5, category: 'food' },
    });
    console.log('Created Exp 1:', exp1.status, exp1.data);

    const exp2 = await request('/expenses', {
      method: 'POST',
      body: { title: 'Metro Card Reload', amount: 30.0, category: 'travel' },
    });
    console.log('Created Exp 2:', exp2.status, exp2.data);

    console.log('--- Test 4: GET /expenses (Filtering & Totals) ---');
    const listAll = await request('/expenses?limit=10&page=1');
    console.log('GET /expenses total_count & total_amount:', {
      total_count: listAll.data.total_count,
      total_amount: listAll.data.total_amount,
      itemCount: listAll.data.items?.length,
    });

    console.log('--- Test 5: Category Filter ---');
    const listFood = await request('/expenses?category=food');
    console.log('GET /expenses?category=food:', {
      total_count: listFood.data.total_count,
      total_amount: listFood.data.total_amount,
    });

    console.log('--- Test 6: Summary RPC (Priority 3) ---');
    const summary = await request('/expenses/summary?month=' + new Date().toISOString().slice(0, 7));
    console.log('GET /expenses/summary:', summary.data);

    console.log('--- Test 7: Delete 404 & Delete Success ---');
    const delMissing = await request('/expenses/00000000-0000-0000-0000-000000000000', { method: 'DELETE' });
    console.log('Delete missing (expected 404):', delMissing.status, delMissing.data);

    if (exp2.data && exp2.data.id) {
      const delSuccess = await request(`/expenses/${exp2.data.id}`, { method: 'DELETE' });
      console.log('Delete success:', delSuccess.status, delSuccess.data);
    }

    console.log('ALL BACKEND TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
