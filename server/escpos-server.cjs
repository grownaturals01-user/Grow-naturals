/**
 * GrowNaturals ESC/POS Thermal Printer Bridge Server (Port 3333)
 * Listens on http://localhost:3333/print and prints receipts directly to USB Thermal Printers (80mm).
 */

const http = require('http');

let escpos;
let USB;
try {
  escpos = require('escpos');
  escpos.USB = require('escpos-usb');
  USB = escpos.USB;
} catch (e) {
  // escpos is optional for systems using browser thermal printing
}

function printReceipt(bill, callback) {
  if (!USB) {
    console.log('[ESC/POS Bridge Mock] Printing Bill #' + (bill.billNo || bill.invoice_number));
    return callback(null, { status: 'mock_printed' });
  }

  try {
    const device = new USB();
    const printer = new escpos.Printer(device);

    device.open(function (error) {
      if (error) {
        console.error('[ESC/POS] Device open error:', error);
        return callback(error);
      }

      const shopName = bill.shopName || bill.business_name || 'GROW NATURALS';
      const isTaxable = (bill.business_id || '').includes('grow-naturals') || (bill.gstin && bill.gstin.length > 0);

      printer
        .align('ct')
        .style('b')
        .size(2, 2)
        .text(shopName)
        .size(1, 1)
        .style('normal');

      if (bill.address) printer.text(bill.address);
      if (bill.phone) printer.text(`Phone: ${bill.phone}`);
      if (isTaxable && bill.gstin) printer.style('b').text(`GSTIN: ${bill.gstin}`).style('normal');

      printer
        .text('------------------------------------------------')
        .align('lt')
        .text(`Bill No : ${bill.billNo || bill.invoice_number || 'GN-1001'}`)
        .text(`Date    : ${bill.date || new Date().toLocaleString()}`)
        .text(`Customer: ${bill.customer || bill.customer_name || 'Walk-in Customer'}`);

      if (bill.cashier) printer.text(`Cashier : ${bill.cashier}`);

      printer
        .text('------------------------------------------------')
        .style('b')
        .text('ITEM                    QTY     PRICE     TOTAL')
        .style('normal')
        .text('------------------------------------------------');

      (bill.items || []).forEach((item) => {
        const name = (item.name || item.product_name || 'Item').slice(0, 20).padEnd(20);
        const qty = String(item.qty || item.quantity || 1).padStart(5);
        const price = Number(item.price || item.unit_price || 0).toFixed(2).padStart(9);
        const amount = Number(item.amount || item.total || 0).toFixed(2).padStart(10);
        printer.text(`${name} ${qty} ${price} ${amount}`);
      });

      printer
        .text('------------------------------------------------')
        .align('rt')
        .text(`Subtotal : Rs. ${Number(bill.subtotal || 0).toFixed(2)}`);

      if (bill.discount && Number(bill.discount) > 0) {
        printer.text(`Discount : -Rs. ${Number(bill.discount).toFixed(2)}`);
      }

      if (isTaxable) {
        if (bill.tax_amount && Number(bill.tax_amount) > 0) {
          printer.text(`GST Tax  : Rs. ${Number(bill.tax_amount).toFixed(2)}`);
        }
      } else {
        printer.text(`GST Tax  : Rs. 0.00 (Non-Taxable)`);
      }

      printer
        .text('------------------------------------------------')
        .style('b')
        .size(2, 2)
        .text(`TOTAL : Rs. ${Number(bill.total || bill.total_amount || 0).toFixed(2)}`)
        .size(1, 1)
        .style('normal')
        .align('lt')
        .text(`Payment: ${bill.paymentMethod || bill.payment_method || 'Cash'}`)
        .text('------------------------------------------------')
        .align('ct')
        .text(bill.footerMessage || bill.business_footer || 'Thank you! Plants bring life to spaces.')
        .feed(3)
        .cut()
        .close(() => {
          callback(null, { status: 'success' });
        });
    });
  } catch (err) {
    callback(err);
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ready', port: 3333 }));
  }

  if (req.method === 'POST' && req.url === '/print') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const bill = JSON.parse(body);
        printReceipt(bill, (err, result) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: err.message }));
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, result }));
        });
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = 3333;
server.listen(PORT, () => {
  console.log(`[ESC/POS Bridge Server] Running on http://localhost:${PORT}`);
});
