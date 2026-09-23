const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('1. Creating test customer with credit limit of ₹5,000...');
  const custRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/customers',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Greenwoods Villa Project',
    phone: '9888776655',
    credit_limit: 5000
  });

  console.log('Customer created:', custRes.data);
  const customerId = custRes.data.id;

  console.log('\n2. Creating Delivery Challan for ₹8,000 (Exceeds ₹5,000 credit limit)...');
  const dcRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/delivery-challans',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    business_id: 'grow-naturals',
    customer_id: customerId,
    customer_name: 'Greenwoods Villa Project',
    customer_phone: '9888776655',
    items: [
      { product_name: 'Royal Palm 10ft', quantity: 4, unit_price: 2000, total: 8000 }
    ],
    paid_amount: 0
  });

  console.log('DC Creation Result:', dcRes.data);
  console.log('Approval Status:', dcRes.data.approval_status);
  console.log('Exceeded Amount:', dcRes.data.credit_exceeded_amount);
  console.log('Approval Reason:', dcRes.data.approval_reason);

  const dcId = dcRes.data.id;

  console.log('\n3. Testing Approve DC Override...');
  const approveRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/delivery-challans/${dcId}/approve`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    approved_by: 'Senior Operations Manager'
  });

  console.log('Approval Result:', approveRes.data);

  console.log('\n4. Fetching DC Detail to verify approved status...');
  const dcDetail = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/delivery-challans/${dcId}`,
    method: 'GET'
  });

  console.log('Verified DC Status:', {
    challan_number: dcDetail.data.challan_number,
    approval_status: dcDetail.data.approval_status,
    approved_by: dcDetail.data.approved_by,
    approved_at: dcDetail.data.approved_at
  });
}

run().catch(console.error);
