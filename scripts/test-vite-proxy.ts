async function testViteProxy() {
  try {
    const res = await fetch('http://localhost:5173/api/health');
    console.log('Vite proxy /api/health status:', res.status);
    const text = await res.text();
    console.log('Vite proxy /api/health response:', text);

    const loginRes = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    console.log('Vite proxy /api/auth/login status:', loginRes.status);
    const loginText = await loginRes.text();
    console.log('Vite proxy /api/auth/login response:', loginText);
  } catch (err: any) {
    console.error('Test error:', err.message);
  }
}

testViteProxy();
