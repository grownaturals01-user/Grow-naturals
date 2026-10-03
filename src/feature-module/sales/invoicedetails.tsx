import { useEffect, useState } from "react";
import CommonFooter from "../../components/footer/commonFooter";
import { all_routes } from "../../routes/all_routes";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { logo, logoWhite, pdf, qrCodeImage, sign } from "../../utils/imagepath";
import { api, getActiveBusinessId } from "../../services/api";

function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  }

  const integerPart = Math.floor(num);
  return `${inWords(integerPart)} Rupees Only`;
}

const Invoicedetails = () => {
  const route = all_routes;
  const [searchParams] = useSearchParams();
  const params = useParams();
  const idFromUrl = searchParams.get('id') || params.id;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const activeBusiness = getActiveBusinessId();

  useEffect(() => {
    async function loadInvoice() {
      try {
        setLoading(true);
        if (idFromUrl) {
          const data = await api.get(`/invoices/${idFromUrl}`);
          setInvoice(data);
        } else {
          // Fallback to most recent invoice
          const list = await api.get('/invoices', { business_id: activeBusiness });
          if (Array.isArray(list) && list.length > 0) {
            const latestId = list[0].id;
            const data = await api.get(`/invoices/${latestId}`);
            setInvoice(data);
          }
        }
      } catch (err) {
        console.error("Failed to load invoice details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [idFromUrl, activeBusiness]);

  const items = invoice?.items || [];
  const subTotal = Number(invoice?.subtotal || invoice?.total_amount || 0);
  const discount = Number(invoice?.discount_amount || 0);
  const tax = Number(invoice?.tax_amount || 0);
  const grandTotal = Number(invoice?.total_amount || 0);
  const isPaid = (invoice?.payment_status || 'paid').toLowerCase() === 'paid';

  const isNursery = invoice?.business_id === 'nikhlesh-nursery';
  const businessName = isNursery ? "Nikhlesh Nursery" : "Grow Naturals";
  const businessAddress = isNursery
    ? "Survey 18, Kanakapura Main Road, Bengaluru, Karnataka 560062"
    : "No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020";
  const businessPhone = isNursery ? "+91 98450 11223" : "+91 98220 12345";
  const businessEmail = isNursery ? "sales@nikhleshnursery.com" : "billing@grownaturals.in";

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Invoice Details</h4>
              </div>
            </div>
            <ul className="table-top-head">
              <li>
                <Link
                  to="#"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title="Pdf"
                  onClick={() => window.print()}
                >
                  <img src={pdf} alt="img" />
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title="Print"
                  onClick={() => window.print()}
                >
                  <i className="feather icon-printer feather-rotate-ccw" />
                </Link>
              </li>
              <li>
                <Link
                  to="#"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title="Collapse"
                  id="collapse-header"
                >
                  <i className="feather icon-chevron-up feather-chevron-up" />
                </Link>
              </li>
            </ul>
            <div className="page-btn">
              <Link to={route.invoice} className="btn btn-primary">
                <i className="feather icon-arrow-left me-2" />
                Back to Invoices
              </Link>
            </div>
          </div>
          {/* Invoices */}
          <div className="card">
            <div className="card-body">
              <div className="row justify-content-between align-items-center border-bottom mb-3">
                <div className="col-md-6">
                  <div className="invoice-logo mb-2">
                    <Link className="logo logo-normal" to="#">
                      <img src={logo} width="130" className="img-fluid" alt="logo" />
                    </Link>
                    <Link className="logo logo-white" to="#">
                      <img src={logoWhite} width="130" className="img-fluid" alt="logo" />
                    </Link>
                  </div>
                  <p>{businessAddress}</p>
                </div>
                <div className="col-md-6">
                  <div className="text-end mb-3">
                    <h5 className="text-gray mb-1">
                      Invoice No <span className="text-primary">#{invoice?.invoice_number || 'INV0001'}</span>
                    </h5>
                    <p className="mb-1 fw-medium">
                      Created Date :{" "}
                      <span className="text-dark">
                        {invoice?.created_at
                          ? new Date(invoice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'N/A'}
                      </span>{" "}
                    </p>
                    <p className="fw-medium">
                      Payment Mode :{" "}
                      <span className="text-dark text-capitalize">{invoice?.payment_method || 'Cash'}</span>{" "}
                    </p>
                  </div>
                </div>
              </div>
              <div className="row border-bottom mb-3">
                <div className="col-md-5">
                  <p className="text-dark mb-2 fw-semibold">From</p>
                  <div>
                    <h4 className="mb-1">{businessName}</h4>
                    <p className="mb-1">{businessAddress}</p>
                    <p className="mb-1">
                      Email : <span className="text-dark">{businessEmail}</span>
                    </p>
                    <p>
                      Phone : <span className="text-dark">{businessPhone}</span>
                    </p>
                  </div>
                </div>
                <div className="col-md-5">
                  <p className="text-dark mb-2 fw-semibold">To</p>
                  <div>
                    <h4 className="mb-1">{invoice?.customer_name || 'Walk-in Customer'}</h4>
                    <p className="mb-1">{invoice?.customer_address || 'Madurai, Tamil Nadu'}</p>
                    <p className="mb-1">
                      Email :{" "}
                      <span className="text-dark">{invoice?.customer_email || 'customer@example.com'}</span>
                    </p>
                    <p>
                      Phone : <span className="text-dark">{invoice?.customer_phone || '+91 98000 00000'}</span>
                    </p>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="mb-3">
                    <p className="text-title mb-2 fw-medium">Payment Status </p>
                    <span className={`fs-10 px-1 rounded text-white ${isPaid ? 'bg-success' : 'bg-warning'}`}>
                      <i className="ti ti-point-filled " />
                      {invoice?.payment_status || 'Paid'}
                    </span>
                    <div className="mt-3">
                      <img
                        src={qrCodeImage}
                        className="img-fluid"
                        alt="QR"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="fw-medium">
                  Invoice For :{" "}
                  <span className="text-dark fw-medium">
                    Botanical Products, Greenery & Nursery Supplies
                  </span>
                </p>
                <div className="table-responsive mb-3">
                  <table className="table">
                    <thead className="thead-light">
                      <tr>
                        <th>Job Description</th>
                        <th className="text-end">Qty</th>
                        <th className="text-end">Cost</th>
                        <th className="text-end">Discount</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            {loading ? "Loading invoice items..." : "No invoice line items"}
                          </td>
                        </tr>
                      ) : (
                        items.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td>
                              <h6>{item.product_name}</h6>
                              {item.sku && <small className="text-muted">SKU: {item.sku}</small>}
                            </td>
                            <td className="text-end">{item.quantity}</td>
                            <td className="text-end">₹{Number(item.unit_price).toFixed(2)}</td>
                            <td className="text-end">₹{Number(item.discount || 0).toFixed(2)}</td>
                            <td className="text-end fw-semibold">₹{Number(item.total).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="row border-bottom mb-3">
                <div className="col-md-5 ms-auto mb-3">
                  <div className="d-flex justify-content-between align-items-center border-bottom mb-2 pe-3">
                    <p className="mb-0">Sub Total</p>
                    <p className="text-dark fw-medium mb-2">₹{subTotal.toFixed(2)}</p>
                  </div>
                  {discount > 0 && (
                    <div className="d-flex justify-content-between align-items-center border-bottom mb-2 pe-3">
                      <p className="mb-0">Discount</p>
                      <p className="text-danger fw-medium mb-2">-₹{discount.toFixed(2)}</p>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="d-flex justify-content-between align-items-center mb-2 pe-3">
                      <p className="mb-0">GST / Tax</p>
                      <p className="text-dark fw-medium mb-2">₹{tax.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center mb-2 pe-3">
                    <h5>Total Amount</h5>
                    <h5>₹{grandTotal.toFixed(2)}</h5>
                  </div>
                  <p className="fs-12">
                    Amount in Words : {numberToWords(grandTotal)}
                  </p>
                </div>
              </div>
              <div className="row align-items-center border-bottom mb-3">
                <div className="col-md-7">
                  <div>
                    <div className="mb-3">
                      <h6 className="mb-1">Terms and Conditions</h6>
                      <p>
                        Please pay within 15 days from the date of invoice,
                        overdue interest @ 14% will be charged on delayed
                        payments.
                      </p>
                    </div>
                    <div className="mb-3">
                      <h6 className="mb-1">Notes</h6>
                      <p>{invoice?.notes || "Please quote invoice number when remitting funds."}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="text-end">
                    <img
                      src={sign}
                      className="img-fluid"
                      alt="sign"
                    />
                  </div>
                  <div className="text-end mb-3">
                    <h6 className="fs-14 fw-medium pe-3">Store Manager</h6>
                    <p>Authorized Signatory</p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="mb-3">
                  <div className="invoice-logo">
                    <Link className="logo logo-normal" to="#">
                      <img src={logo} width="130" className="img-fluid" alt="logo" />
                    </Link>
                    <Link className="logo logo-white" to="#">
                      <img src={logoWhite} width="130" className="img-fluid" alt="logo" />
                    </Link>
                  </div>
                </div>
                <p className="text-dark mb-1">
                  Payment Made Via bank transfer / UPI / Cash in the name of {businessName}
                </p>
                <div className="d-flex justify-content-center align-items-center">
                  <p className="fs-12 mb-0 me-3">
                    Bank Name : <span className="text-dark">HDFC Bank</span>
                  </p>
                  <p className="fs-12 mb-0 me-3">
                    Account Number :{" "}
                    <span className="text-dark">45366287987</span>
                  </p>
                  <p className="fs-12">
                    IFSC : <span className="text-dark">HDFC0018159</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* /Invoices */}
          <div className="d-flex justify-content-center align-items-center mb-4">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-primary d-flex justify-content-center align-items-center me-2"
            >
              <i className="ti ti-printer me-2" />
              Print Invoice
            </button>
            <Link
              to={route.pos}
              className="btn btn-secondary d-flex justify-content-center align-items-center border"
            >
              <i className="ti ti-shopping-cart me-2" />
              Create POS Order
            </Link>
          </div>
        </div>
        <CommonFooter />
      </div>
    </div>
  );
};

export default Invoicedetails;
