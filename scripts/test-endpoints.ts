async function testEndpoints() {
  const endpoints = [
    '/api/health',
    '/api/businesses',
    '/api/products?business_id=grow-naturals',
    '/api/categories?business_id=grow-naturals',
    '/api/reports/dashboard?business_id=grow-naturals&range=today',
    '/api/invoices?business_id=grow-naturals',
    '/api/quotations?business_id=grow-naturals',
    '/api/delivery-challans?business_id=grow-naturals',
    '/api/projects?business_id=grow-naturals',
    '/api/purchases?business_id=grow-naturals',
    '/api/expenses?business_id=grow-naturals',
    '/api/refunds?business_id=grow-naturals',
    '/api/customers',
    '/api/staff',
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:5000${ep}`);
      console.log(`${res.status} ${ep}`);
      if (!res.ok) {
        const text = await res.text();
        console.error(`  ERROR BODY: ${text}`);
      }
    } catch (err: any) {
      console.error(`  FETCH FAILED: ${ep}`, err.message);
    }
  }
}

testEndpoints();
