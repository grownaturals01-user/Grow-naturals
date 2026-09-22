import React, { useState } from 'react';
import type { Invoice } from '../../types';
import { printService } from '../../services/printService';
import { Printer, Check, Cpu } from 'lucide-react';
import gnLogo from '../../assets/grownaturalslogo.jpeg';

interface Receipt80mmViewProps {
  invoice: Invoice;
}

export const Receipt80mmView: React.FC<Receipt80mmViewProps> = ({ invoice }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<string | null>(null);

  const isTaxable = invoice.business_id === 'grow-naturals';

  const handleThermalPrint = async () => {
    setIsPrinting(true);
    setBridgeStatus('Sending to ESC/POS bridge...');
    try {
      const res = await printService.printThermal({
        billNo: invoice.invoice_number,
        shopName: invoice.business_name || (isTaxable ? 'GROW NATURALS' : 'NIKHLESH NURSERY'),
        tagline: isTaxable ? 'Botanical Luxury' : 'Farm & Garden Fresh',
        address: invoice.business_address,
        phone: invoice.business_phone,
        gstin: isTaxable ? invoice.business_gstin : '',
        date: new Date(invoice.created_at).toLocaleString(),
        customer: invoice.customer_name,
        cashier: invoice.cashier_name,
        items: (invoice.items || []).map(i => ({
          name: i.product_name,
          qty: i.quantity,
          price: i.unit_price,
          amount: i.total
        })),
        subtotal: invoice.subtotal,
        discount: invoice.discount_amount,
        tax: isTaxable ? invoice.tax_amount : 0,
        total: invoice.total_amount,
        paymentMethod: invoice.payment_method,
        footerMessage: invoice.business_footer
      });

      if (res.success && res.printed_via === 'escpos_bridge') {
        setBridgeStatus('Printed successfully to ESC/POS USB Printer!');
      } else {
        setBridgeStatus('Bridge not connected. Opening browser print dialog...');
        printService.printBrowser();
      }
    } catch {
      printService.printBrowser();
    } finally {
      setIsPrinting(false);
      setTimeout(() => setBridgeStatus(null), 4000);
    }
  };

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
        <button
          type="button"
          className="btn btn-sell"
          onClick={handleThermalPrint}
          disabled={isPrinting}
        >
          <Cpu size={16} />
          {isPrinting ? 'Printing...' : 'ESC/POS USB Print'}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => printService.printBrowser()}
        >
          <Printer size={16} />
          Browser 80mm Print
        </button>
      </div>

      {bridgeStatus && (
        <div className="no-print" style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
          {bridgeStatus}
        </div>
      )}

      {/* 80mm Receipt Layout */}
      <div className="receipt-preview-card thermal-receipt-print">
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <img
            src={gnLogo}
            alt="Grow Naturals"
            style={{
              width: '54px',
              height: '54px',
              objectFit: 'contain',
              borderRadius: '50%',
              margin: '0 auto 6px',
              display: 'block',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff'
            }}
          />
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {invoice.business_name || (isTaxable ? 'GROW NATURALS' : 'NIKHLESH NURSERY')}
          </div>
          <div style={{ fontSize: '11px' }}>{invoice.business_address || 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu'}</div>
          <div style={{ fontSize: '11px' }}>Ph: {invoice.business_phone}</div>
          {isTaxable && invoice.business_gstin && (
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>GSTIN: {invoice.business_gstin}</div>
          )}
        </div>

        <div className="receipt-divider" />

        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
          <div>Bill No : <strong>{invoice.invoice_number}</strong></div>
          <div>Date    : {new Date(invoice.created_at).toLocaleString()}</div>
          <div>Customer: {invoice.customer_name || 'Walk-in Customer'}</div>
          {invoice.customer_phone && <div>Phone   : {invoice.customer_phone}</div>}
          {invoice.cashier_name && <div>Cashier : {invoice.cashier_name}</div>}
        </div>

        <div className="receipt-divider" />

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px dashed #000' }}>
              <th style={{ textAlign: 'left', paddingBottom: '4px' }}>ITEM</th>
              <th style={{ textAlign: 'center', paddingBottom: '4px' }}>QTY</th>
              <th style={{ textAlign: 'right', paddingBottom: '4px' }}>PRICE</th>
              <th style={{ textAlign: 'right', paddingBottom: '4px' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, idx) => (
              <tr key={idx}>
                <td style={{ paddingTop: '4px', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.product_name}
                </td>
                <td style={{ textAlign: 'center', paddingTop: '4px' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', paddingTop: '4px' }}>{Number(item.unit_price).toFixed(2)}</td>
                <td style={{ textAlign: 'right', paddingTop: '4px', fontWeight: 'bold' }}>{Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-divider" />

        <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>Rs. {Number(invoice.subtotal).toFixed(2)}</span>
          </div>

          {Number(invoice.discount_amount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount:</span>
              <span>-Rs. {Number(invoice.discount_amount).toFixed(2)}</span>
            </div>
          )}

          {isTaxable && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>GST Tax:</span>
              <span>Rs. {Number(invoice.tax_amount || 0).toFixed(2)}</span>
            </div>
          )}

          <div className="receipt-divider" />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold' }}>
            <span>TOTAL:</span>
            <span>Rs. {Number(invoice.total_amount).toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span>Payment:</span>
            <span style={{ textTransform: 'uppercase' }}>{invoice.payment_method}</span>
          </div>
        </div>

        <div className="receipt-divider" />

        <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '6px' }}>
          {invoice.business_footer || 'Thank you! Live green, grow happy!'}
        </div>
      </div>
    </div>
  );
};
