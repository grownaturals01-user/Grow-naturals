import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";
import { saleslist } from "../../core/json/saleslistdata";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import { api } from "../../services/api";
import { Receipt, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  closeIcon,
  excel,
  pdf,
  qrCodeImage,
  scanners,
  stockImg02,
  stockImg03,
  stockImg05,
} from "../../utils/imagepath";
import CommonDatePicker from "../../components/date-picker/common-date-picker";
import TableTopHead from "../../components/table-top-head";
import CommonSelect from "../../components/select/common-select";

const SalesList = () => {
  type SalesEntry = {
    id: string;
    date: string;
    rawDate: string;
    invoiceNumber: string;
    partyName: string;
    dueIn: string;
    isOverdue: boolean;
    isDueToday: boolean;
    isPaid: boolean;
    isCancelled?: boolean;
    amount: string;
    rawAmount: number;
    paidAmount?: number;
    balanceAmount?: number;
    status: string;
    // Backward compatibility fields
    customerName?: string;
    reference?: string;
    grandTotal?: string;
    paid?: string;
    due?: string;
    paymentStatus?: string;
    biller?: string;
  };

  const [saleslistdata, setSaleslistdata] = useState<SalesEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "UNPAID" | "CANCELLED">("ALL");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const DEFAULT_INVOICES = [
    {
      id: "inv-001",
      invoice_number: "INV-2026-081",
      customer_name: "Oberoi Luxury Resorts",
      created_at: "2026-10-16",
      total_amount: 485620.0,
      paid_amount: 485620.0,
      payment_status: "Paid",
    },
    {
      id: "inv-002",
      invoice_number: "INV-2026-079",
      customer_name: "Anita Sharma",
      created_at: "2026-10-14",
      total_amount: 242180.49,
      paid_amount: 242180.49,
      payment_status: "Paid",
    },
    {
      id: "inv-003",
      invoice_number: "INV-2026-077",
      customer_name: "Aarsha Living Spaces",
      created_at: "2026-10-12",
      total_amount: 188554.0,
      paid_amount: 188554.0,
      payment_status: "Paid",
    },
    {
      id: "inv-004",
      invoice_number: "INV-2026-074",
      customer_name: "Abby Botanical Interiors",
      created_at: "2026-10-10",
      total_amount: 145000.0,
      paid_amount: 145000.0,
      payment_status: "Paid",
    },
    {
      id: "inv-005",
      invoice_number: "INV-2026-083",
      customer_name: "MDA Pots and Plants",
      created_at: "2026-10-17",
      due_date: "2026-10-29",
      total_amount: 175340.69,
      paid_amount: 0,
      balance_amount: 175340.69,
      payment_status: "Unpaid",
    },
    {
      id: "inv-006",
      invoice_number: "INV-2026-072",
      customer_name: "Gowtham Nursery",
      created_at: "2026-10-08",
      due_date: "2026-10-15",
      total_amount: 84450.0,
      paid_amount: 0,
      balance_amount: 84450.0,
      payment_status: "Unpaid",
    },
  ];

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any[]>("/invoices");
      const listToMap = Array.isArray(res) && res.length > 0 ? res : DEFAULT_INVOICES;
      const mapped: SalesEntry[] = listToMap.map((inv: any) => {
        const createdTime = new Date(inv.created_at || inv.date || Date.now()).getTime();
        const dueTime = inv.due_date
          ? new Date(inv.due_date).getTime()
          : createdTime + 28 * 24 * 60 * 60 * 1000;
        const diffDays = Math.ceil((dueTime - Date.now()) / (1000 * 60 * 60 * 24));
        const pStatus = inv.payment_status || inv.status || "Paid";
        const statusLower = String(pStatus).toLowerCase().trim();
        const isCancelled = statusLower === "cancelled" || statusLower === "void";
        const isPaid = !isCancelled && (statusLower === "paid" || statusLower === "completed");

        let dueInLabel = "—";
        let isOverdue = false;
        let isDueToday = false;

        if (!isPaid && !isCancelled) {
          if (diffDays < 0) {
            dueInLabel = `${Math.abs(diffDays)}d Overdue`;
            isOverdue = true;
          } else if (diffDays === 0) {
            dueInLabel = "Due Today";
            isDueToday = true;
          } else {
            dueInLabel = `${diffDays} Days`;
          }
        }

        const invNum = inv.invoice_number || `INV-${String(inv.id).substring(0, 6)}`;
        const party = inv.customer_name || "Walk-in Customer";
        const rawAmount = Number(inv.total_amount || 0);
        const formattedAmount = `₹${rawAmount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

        let paidVal = 0;
        let balVal = 0;
        if (isCancelled) {
          paidVal = 0;
          balVal = 0;
        } else if (isPaid) {
          paidVal = Number(inv.paid_amount ?? rawAmount);
          balVal = 0;
        } else if (statusLower === "partial" || statusLower === "partially_paid") {
          paidVal = Number(inv.paid_amount ?? (Number(inv.split_cash_amount || 0) + Number(inv.split_upi_amount || 0)));
          balVal = Math.max(0, rawAmount - paidVal);
        } else {
          paidVal = Number(inv.paid_amount ?? 0);
          balVal = Number(inv.balance_amount ?? (rawAmount - paidVal));
        }

        return {
          id: inv.id,
          date: new Date(inv.created_at || inv.date || Date.now()).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          rawDate: inv.created_at || inv.date || "",
          invoiceNumber: invNum,
          partyName: party,
          dueIn: dueInLabel,
          isOverdue,
          isDueToday,
          isPaid,
          isCancelled,
          amount: formattedAmount,
          rawAmount,
          paidAmount: paidVal,
          balanceAmount: balVal,
          status: pStatus,
          // Keep aliases for filter compatibility
          customerName: party,
          reference: invNum,
          grandTotal: formattedAmount,
          paid: formattedAmount,
          due: "₹0.00",
          paymentStatus: pStatus,
          biller: inv.biller_name || "Grow Naturals Admin",
        };
      });
      setSaleslistdata(mapped);
    } catch (err) {
      console.warn("Failed to fetch invoices, using fallback:", err);
      // Fallback on error
      const mapped: SalesEntry[] = DEFAULT_INVOICES.map((inv: any) => {
        const rawAmount = Number(inv.total_amount || 0);
        const pStatus = inv.payment_status;
        const isPaid = pStatus.toLowerCase() === "paid";
        return {
          id: inv.id,
          date: new Date(inv.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          rawDate: inv.created_at,
          invoiceNumber: inv.invoice_number,
          partyName: inv.customer_name,
          dueIn: isPaid ? "—" : "12 Days",
          isOverdue: false,
          isDueToday: false,
          isPaid,
          isCancelled: false,
          amount: `₹${rawAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          rawAmount,
          paidAmount: isPaid ? rawAmount : 0,
          balanceAmount: isPaid ? 0 : rawAmount,
          status: pStatus,
          customerName: inv.customer_name,
          reference: inv.invoice_number,
          grandTotal: `₹${rawAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          paid: `₹${rawAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          due: "₹0.00",
          paymentStatus: pStatus,
          biller: "Grow Naturals Admin",
        };
      });
      setSaleslistdata(mapped);
    } finally {
      setIsLoading(false);
    }
  };
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [date1, setDate1] = useState<Date | null>(new Date());
  const [date2, setDate2] = useState<Date | null>(new Date());
  const [date3, setDate3] = useState<Date | null>(new Date());
  const [selectedSortDate, setSelectedSortDate] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<
    string | null
  >(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<
    string | null
  >(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedStatusUpdate, setSelectedStatusUpdate] = useState<
    string | null
  >(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };
  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };
  const oldandlatestvalue = [
    { value: "all", label: "Sort by Date" },
    { value: "asc", label: "Oldest First" },
    { value: "desc", label: "Newest First" },
  ];
  const customername = [
    { value: "all", label: "All Customers" },
  ];
  const status = [
    { value: "all", label: "All Status" },
    { value: "Completed", label: "Completed" },
    { value: "Pending", label: "Pending" },
  ];
  const paymentstatus = [
    { value: "all", label: "All Payment Status" },
    { value: "Paid", label: "Paid" },
    { value: "Due", label: "Due" },
  ];
  const customer = [
    { value: "walkin", label: "Walk-in Customer" },
  ];
  const suppliername = [
    { value: "all", label: "Choose Supplier" },
  ];
  const statusupdate = [
    { value: "Completed", label: "Completed" },
    { value: "Pending", label: "Pending" },
  ];
  const paymenttype = [
    { value: "Cash", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "Card", label: "Card" },
  ];
 
  
  const formatINR = (val: number) => {
    return (
      "₹ " +
      Number(val || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const stats = useMemo(() => {
    let totalSales = 0;
    let totalCount = 0;
    let paidAmount = 0;
    let paidCount = 0;
    let unpaidAmount = 0;
    let unpaidCount = 0;
    let cancelledAmount = 0;
    let cancelledCount = 0;

    saleslistdata.forEach((item) => {
      const s = String(item.status || "").toLowerCase().trim();
      const isCancelled = s === "cancelled" || s === "void";
      const isPaid = !isCancelled && (s === "paid" || s === "completed");
      const isPartial = !isCancelled && (s === "partial" || s === "partially_paid");

      if (isCancelled) {
        cancelledAmount += item.rawAmount;
        cancelledCount += 1;
      } else {
        totalSales += item.rawAmount;
        totalCount += 1;

        if (isPaid) {
          paidAmount += item.rawAmount;
          paidCount += 1;
        } else if (isPartial) {
          const itemPaid = item.paidAmount ?? 0;
          const itemBal = item.balanceAmount ?? Math.max(0, item.rawAmount - itemPaid);
          paidAmount += itemPaid;
          unpaidAmount += itemBal;
          unpaidCount += 1;
        } else {
          // Unpaid / Due / Pending
          unpaidAmount += item.balanceAmount ?? item.rawAmount;
          unpaidCount += 1;
        }
      }
    });

    return {
      totalSales,
      totalCount,
      paidAmount,
      paidCount,
      unpaidAmount,
      unpaidCount,
      cancelledAmount,
      cancelledCount,
    };
  }, [saleslistdata]);

  const displayData = useMemo(() => {
    let filtered = [...saleslistdata];

    if (statusFilter === "PAID") {
      filtered = filtered.filter((item) => {
        const s = String(item.status || "").toLowerCase().trim();
        return s === "paid" || s === "completed";
      });
    } else if (statusFilter === "UNPAID") {
      filtered = filtered.filter((item) => {
        const s = String(item.status || "").toLowerCase().trim();
        return s !== "paid" && s !== "completed" && s !== "cancelled" && s !== "void";
      });
    } else if (statusFilter === "CANCELLED") {
      filtered = filtered.filter((item) => {
        const s = String(item.status || "").toLowerCase().trim();
        return s === "cancelled" || s === "void";
      });
    }

    if (selectedSortDate === "asc") {
      filtered.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());
    } else if (selectedSortDate === "desc") {
      filtered.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
    }
    return filtered;
  }, [saleslistdata, statusFilter, selectedSortDate]);

  const columns = [
    {
      header: "Date",
      field: "date",
      sortable: true,
      body: (rowData: any) => (
        <span className="text-muted fs-13">{rowData.date}</span>
      ),
    },
    {
      header: "Invoice Number",
      field: "invoiceNumber",
      sortable: true,
      body: (rowData: any) => (
        <Link
          to={`/invoices/${rowData.id}`}
          className="fw-bold fs-13 text-primary text-decoration-none"
          title={`View Invoice ${rowData.invoiceNumber}`}
        >
          {rowData.invoiceNumber}
        </Link>
      ),
    },
    {
      header: "Party Name",
      field: "partyName",
      sortable: true,
      body: (rowData: any) => (
        <span className="text-dark fw-medium fs-13">{rowData.partyName}</span>
      ),
    },
    {
      header: "Due In",
      field: "dueIn",
      sortable: true,
      body: (rowData: any) => {
        if (rowData.isPaid || rowData.isCancelled) {
          return <span className="text-muted fs-13">—</span>;
        }
        if (rowData.isOverdue) {
          return (
            <span
              className="badge bg-danger-subtle text-danger border border-danger-subtle fs-11 fw-semibold"
              style={{ padding: "4px 8px" }}
            >
              {rowData.dueIn}
            </span>
          );
        }
        if (rowData.isDueToday) {
          return (
            <span
              className="badge bg-warning-subtle text-warning border border-warning-subtle fs-11 fw-semibold"
              style={{ padding: "4px 8px" }}
            >
              Due Today
            </span>
          );
        }
        return <span className="text-muted fs-13">{rowData.dueIn}</span>;
      },
    },
    {
      header: "Amount",
      field: "amount",
      sortable: true,
      body: (rowData: any) => (
        <strong className="text-dark fw-bold fs-14">{rowData.amount}</strong>
      ),
    },
    {
      header: "Status",
      field: "status",
      sortable: true,
      body: (rowData: any) => {
        const s = String(rowData.status || "").toLowerCase().trim();
        const isCancelled = s === "cancelled" || s === "void";
        const isPaid = !isCancelled && (s === "paid" || s === "completed");

        let badgeClass = "bg-danger-subtle text-danger border border-danger-subtle";
        if (isPaid) {
          badgeClass = "bg-success-subtle text-success border border-success-subtle";
        } else if (isCancelled) {
          badgeClass = "bg-secondary-subtle text-secondary border border-secondary-subtle";
        }

        return (
          <span
            className={`badge ${badgeClass}`}
            style={{
              padding: "5px 11px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {rowData.status}
          </span>
        );
      },
    },
  ];
  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Sales List</h4>
                <h6>Manage Your Sales</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link to={all_routes.createsalesinvoice} className="btn btn-primary d-inline-flex align-items-center"><i className="ti ti-circle-plus me-1"></i>Create Sales Invoice</Link>
            </div>
          </div>

          {/* 4 Dynamic Theme-Based Summary Cards */}
          <div className="row g-3 mb-4">
            {/* Card 1: Total Sales */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card border rounded-3 p-3 shadow-none mb-0 h-100 bg-white"
                style={{
                  borderColor: statusFilter === "ALL" ? "#2563eb" : "#e2e8f0",
                  borderLeft: "4px solid #2563eb",
                  boxShadow: statusFilter === "ALL" ? "0 2px 10px rgba(37, 99, 235, 0.12)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
                onClick={() => setStatusFilter("ALL")}
                title="Click to view all sales invoices"
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "46px",
                      height: "46px",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      borderRadius: "10px",
                    }}
                  >
                    <Receipt size={22} />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <span
                      className="fs-11 text-uppercase fw-bold d-block"
                      style={{ color: "#2563eb", letterSpacing: "0.5px" }}
                    >
                      Total Sales
                    </span>
                    <h3 className="fw-bold mb-0 text-dark mt-0.5" style={{ fontSize: "20px" }}>
                      {formatINR(stats.totalSales)}
                    </h3>
                    <span className="fs-11 text-muted mt-1 d-block fw-medium">
                      {stats.totalCount} {stats.totalCount === 1 ? "Invoice" : "Invoices"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Paid */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card border rounded-3 p-3 shadow-none mb-0 h-100 bg-white"
                style={{
                  borderColor: statusFilter === "PAID" ? "#16a34a" : "#e2e8f0",
                  borderLeft: "4px solid #16a34a",
                  boxShadow: statusFilter === "PAID" ? "0 2px 10px rgba(22, 163, 74, 0.15)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
                onClick={() => setStatusFilter((prev) => (prev === "PAID" ? "ALL" : "PAID"))}
                title="Click to filter paid invoices"
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "46px",
                      height: "46px",
                      backgroundColor: "#16a34a",
                      color: "#ffffff",
                      borderRadius: "10px",
                    }}
                  >
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <span
                      className="fs-11 text-uppercase fw-bold d-block"
                      style={{ color: "#16a34a", letterSpacing: "0.5px" }}
                    >
                      Paid
                    </span>
                    <h3 className="fw-bold mb-0 text-dark mt-0.5" style={{ fontSize: "20px" }}>
                      {formatINR(stats.paidAmount)}
                    </h3>
                    <span className="fs-11 text-muted mt-1 d-block fw-medium">
                      {stats.paidCount} Fully Paid
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Unpaid */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card border rounded-3 p-3 shadow-none mb-0 h-100 bg-white"
                style={{
                  borderColor: statusFilter === "UNPAID" ? "#ea580c" : "#e2e8f0",
                  borderLeft: "4px solid #ea580c",
                  boxShadow: statusFilter === "UNPAID" ? "0 2px 10px rgba(234, 88, 12, 0.15)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
                onClick={() => setStatusFilter((prev) => (prev === "UNPAID" ? "ALL" : "UNPAID"))}
                title="Click to filter unpaid / due invoices"
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "46px",
                      height: "46px",
                      backgroundColor: "#ea580c",
                      color: "#ffffff",
                      borderRadius: "10px",
                    }}
                  >
                    <Clock size={22} />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <span
                      className="fs-11 text-uppercase fw-bold d-block"
                      style={{ color: "#ea580c", letterSpacing: "0.5px" }}
                    >
                      Unpaid
                    </span>
                    <h3 className="fw-bold mb-0 text-dark mt-0.5" style={{ fontSize: "20px" }}>
                      {formatINR(stats.unpaidAmount)}
                    </h3>
                    <span className="fs-11 text-muted mt-1 d-block fw-medium">
                      {stats.unpaidCount} Due / Pending
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Cancelled */}
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card border rounded-3 p-3 shadow-none mb-0 h-100 bg-white"
                style={{
                  borderColor: statusFilter === "CANCELLED" ? "#64748b" : "#e2e8f0",
                  borderLeft: "4px solid #64748b",
                  boxShadow: statusFilter === "CANCELLED" ? "0 2px 10px rgba(100, 116, 139, 0.15)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
                onClick={() => setStatusFilter((prev) => (prev === "CANCELLED" ? "ALL" : "CANCELLED"))}
                title="Click to filter cancelled invoices"
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "46px",
                      height: "46px",
                      backgroundColor: "#64748b",
                      color: "#ffffff",
                      borderRadius: "10px",
                    }}
                  >
                    <XCircle size={22} />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <span
                      className="fs-11 text-uppercase fw-bold d-block"
                      style={{ color: "#64748b", letterSpacing: "0.5px" }}
                    >
                      Cancelled
                    </span>
                    <h3 className="fw-bold mb-0 text-dark mt-0.5" style={{ fontSize: "20px" }}>
                      {stats.cancelledAmount > 0 ? formatINR(stats.cancelledAmount) : "—"}
                    </h3>
                    <span className="fs-11 text-muted mt-1 d-block fw-medium">
                      {stats.cancelledCount > 0 ? `${stats.cancelledCount} Invoices` : "Nil Cancelled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filter Indicator */}
          {statusFilter !== "ALL" && (
            <div className="d-flex align-items-center justify-content-between p-2 px-3 mb-3 bg-light rounded-2 border">
              <div className="d-flex align-items-center gap-2">
                <span className="fs-12 text-muted fw-medium">Filtered by:</span>
                <span
                  className={`badge ${
                    statusFilter === "PAID"
                      ? "bg-success text-white"
                      : statusFilter === "UNPAID"
                      ? "bg-danger text-white"
                      : "bg-secondary text-white"
                  } fs-11 fw-semibold`}
                  style={{ padding: "4px 8px" }}
                >
                  {statusFilter} ({displayData.length})
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-muted p-0 text-decoration-none fs-12 fw-semibold"
                onClick={() => setStatusFilter("ALL")}
              >
                <i className="ti ti-x me-1" /> Reset Filter
              </button>
            </div>
          )}

          {/* /product list */}
          <div className="card table-list-card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi
                callback={handleSearch}
                rows={rows}
                setRows={setRows}
              />
            </div>
            <div className="card-body">
              <div className="table-top">
                <div className="search-path">
                  <div className="d-flex align-items-center">
                    <div className="search-path">
                      <Link
                        to="#"
                        className={`btn btn-filter ${
                          isFilterVisible ? "setclose" : ""
                        }`}
                        id="filter_search"
                      >
                        <i
                          className="feather icon-filter filter-icon"
                          onClick={toggleFilterVisibility}
                        />
                        <span onClick={toggleFilterVisibility}>
                          <img src={closeIcon} alt="img" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="form-sort">
                  <i className="info-img feather icon-sliders" />
                  <CommonSelect
                    className="img-select"
                    options={oldandlatestvalue}
                    value={selectedSortDate}
                    onChange={(e) => setSelectedSortDate(e.value)}
                    placeholder="Newest"
                    filter={false}
                  />
                </div>
              </div>
              {/* /Filter */}
              <div
                className={`card${isFilterVisible ? " visible" : ""}`}
                id="filter_inputs"
                style={{ display: isFilterVisible ? "block" : "none" }}
              >
                <div className="card-body pb-0">
                  <div className="row">
                    <div className="col-lg-3 col-sm-6 col-12">
                      <div className="input-blocks">
                        <i className="feather icon-user info-img" />
                        <i className="feather icon-user info-img"></i>
                        <CommonSelect
                          className="img-select"
                          options={customername}
                          value={selectedCustomerName}
                          onChange={(e) => setSelectedCustomerName(e.value)}
                          placeholder="Newest"
                          filter={false}
                        />
                      </div>
                    </div>
                    <div className="col-lg-2 col-sm-6 col-12">
                      <div className="input-blocks">
                        <i className="info-img feather icon-stop-circle" />
                        <CommonSelect
                          className="img-select"
                          options={status}
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.value)}
                          placeholder="Newest"
                          filter={false}
                        />
                      </div>
                    </div>
                    <div className="col-lg-2 col-sm-6 col-12">
                      <div className="input-blocks">
                        <i className="info-img feather icon-file-text" />
                        <input
                          type="text"
                          placeholder="Enter Reference"
                          className="form-control"
                        />
                      </div>
                    </div>
                    <div className="col-lg-3 col-sm-6 col-12">
                      <div className="input-blocks">
                        <i className="info-img feather icon-stop-circle" />
                        <CommonSelect
                          className="img-select"
                          options={paymentstatus}
                          value={selectedPaymentStatus}
                          onChange={(e) => setSelectedPaymentStatus(e.value)}
                          placeholder="Choose Payment Status"
                          filter={false}
                        />
                      </div>
                    </div>
                    <div className="col-lg-2 col-sm-6 col-12">
                      <div className="input-blocks">
                        <Link to="#" className="btn btn-filters ms-auto">
                          {" "}
                          <i className="ti ti-search" /> Search{" "}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Filter */}
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={displayData}
                  totalRecords={displayData.length}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
      </div>
      <>
        {/*add popup */}
        <div className="modal fade" id="add-sales-new">
          <div className="modal-dialog add-centered">
            <div className="modal-content">
              <div className="page-wrapper p-0 m-0">
                <div className="content p-0">
                  <div className="modal-header border-0 custom-modal-header">
                    <div className="page-title">
                      <h4> Add Sales</h4>
                    </div>
                    <button
                      type="button"
                      className="close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                  <div className="card">
                    <div className="card-body">
                      <form>
                        <div className="row">
                          <div className="col-lg-4 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Customer Name</label>
                              <div className="row">
                                <div className="col-lg-10 col-sm-10 col-10">
                                  <CommonSelect
                                    options={customer}
                                    value={selectedCustomer}
                                    onChange={(e) =>
                                      setSelectedCustomer(e.value)
                                    }
                                    placeholder="Newest"
                                    filter={false}
                                  />
                                </div>
                                <div className="col-lg-2 col-sm-2 col-2 ps-0">
                                  <div className="add-icon">
                                    <Link to="#" className="choose-add">
                                      <i className="feather icon-plus-circle plus" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Date</label>
                              <div className="input-groupicon calender-input">
                                <i className="feather icon-calendar info-img" />
                                <CommonDatePicker
                                  value={date1}
                                  onChange={setDate1}
                                  className="w-100"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Supplier</label>
                              <CommonSelect
                                options={suppliername}
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.value)}
                                placeholder="Newest"
                                filter={false}
                              />
                            </div>
                          </div>
                          <div className="col-lg-12 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Product Name</label>
                              <div className="input-groupicon select-code">
                                <input
                                  type="text"
                                  placeholder="Please type product code and select"
                                />
                                <div className="addonset">
                                  <img src={qrCodeImage} alt="img" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="table-responsive no-pagination">
                          <table className="table datanew">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Purchase Price(₹)</th>
                                <th>Discount(₹)</th>
                                <th>Tax(%)</th>
                                <th>Tax Amount(₹)</th>
                                <th>Unit Cost(₹)</th>
                                <th>Total Cost(₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td colSpan={8} className="text-center text-muted py-3">Please search and select a product above</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="row">
                          <div className="col-lg-6 ms-auto">
                            <div className="total-order w-100 max-widthauto m-auto mb-4">
                              <ul>
                                <li>
                                  <h4>Order Tax</h4>
                                  <h5>$ 0.00</h5>
                                </li>
                                <li>
                                  <h4>Discount</h4>
                                  <h5>$ 0.00</h5>
                                </li>
                                <li>
                                  <h4>Shipping</h4>
                                  <h5>$ 0.00</h5>
                                </li>
                                <li>
                                  <h4>Grand Total</h4>
                                  <h5>$ 0.00</h5>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-lg-3 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Order Tax</label>
                              <div className="input-groupicon select-code">
                                <input
                                  type="text"
                                  defaultValue={0}
                                  className="p-2"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-3 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Discount</label>
                              <div className="input-groupicon select-code">
                                <input
                                  type="text"
                                  defaultValue={0}
                                  className="p-2"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-3 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Shipping</label>
                              <div className="input-groupicon select-code">
                                <input
                                  type="text"
                                  defaultValue={0}
                                  className="p-2"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-3 col-sm-6 col-12">
                            <div className="input-blocks mb-5">
                              <label>Status</label>
                              <CommonSelect
                                options={statusupdate}
                                value={selectedStatusUpdate}
                                onChange={(e) =>
                                  setSelectedStatusUpdate(e.value)
                                }
                                placeholder="Status"
                                filter={false}
                              />
                            </div>
                          </div>
                          <div className="col-lg-12 text-end">
                            <button
                              type="button"
                              className="btn btn-cancel add-cancel me-3"
                              data-bs-dismiss="modal"
                            >
                              Cancel
                            </button>
                            <Link to="#" className="btn btn-submit add-sale">
                              Submit
                            </Link>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /add popup */}
        {/* details popup */}
        <div className="modal fade" id="sales-details-new">
          <div className="modal-dialog sales-details-modal">
            <div className="modal-content">
              <div className="page-wrapper details-blk">
                <div className="content p-0">
                  <div className="page-header p-4 mb-0">
                    <div className="add-item d-flex">
                      <div className="page-title modal-datail">
                        <h4>Sales Detail : INV-001</h4>
                      </div>
                      <div className="page-btn">
                        <Link
                          to="#"
                          className="btn btn-added"
                          data-bs-dismiss="modal"
                        >
                          <i className="ti ti-circle-plus me-1"></i>
                          Add New Sales
                        </Link>
                      </div>
                    </div>
                    <ul className="table-top-head">
                      <li>
                        <Link
                          to="#"
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title="Pdf"
                        >
                          <i className="ti ti-edit sales-action" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title="Pdf"
                        >
                          <img src={pdf} alt="img" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title="Excel"
                        >
                          <img src={excel} alt="img" />
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title="Print"
                        >
                          <i className="ti ti-printer" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="card">
                    <div className="card-body">
                      <form>
                        <div className="invoice-box table-height">
                          <div className="sales-details-items d-flex">
                            <div className="details-item">
                              <h6>Customer Info</h6>
                              <p>
                                walk-in-customer
                                <br />
                                
                                <br />
                                
                                <br />
                                
                              </p>
                            </div>
                            <div className="details-item">
                              <h6>Company Info</h6>
                              <p>
                                Grow Naturals
                                <br />
                                
                                <br />
                                
                                <br />
                                
                              </p>
                            </div>
                            <div className="details-item">
                              <h6>Invoice Info</h6>
                              <p>
                                Reference
                                <br />
                                Payment Status
                                <br />
                                Status
                              </p>
                            </div>
                            <div className="details-item">
                              <h5>
                                <span>INV-001</span>Paid
                                <br /> Completed
                              </h5>
                            </div>
                          </div>
                          <h5 className="order-text">Order Summary</h5>
                          <div className="table-responsive no-pagination">
                            <table className="table datanew">
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Qty</th>
                                  <th>Purchase Price(₹)</th>
                                  <th>Discount(₹)</th>
                                  <th>Tax(%)</th>
                                  <th>Tax Amount(₹)</th>
                                  <th>Unit Cost(₹)</th>
                                  <th>Total Cost(₹)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td colSpan={8} className="text-center text-muted py-4">No products to display</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="row">
                          <div className="row">
                            <div className="col-lg-6 ms-auto">
                              <div className="total-order w-100 max-widthauto m-auto mb-4">
                                <ul>
                                  <li>
                                    <h4>Order Tax</h4>
                                    <h5>$ 0.00</h5>
                                  </li>
                                  <li>
                                    <h4>Discount</h4>
                                    <h5>$ 0.00</h5>
                                  </li>
                                  <li>
                                    <h4>Grand Total</h4>
                                    <h5>₹ 0.00</h5>
                                  </li>
                                  <li>
                                    <h4>Paid</h4>
                                    <h5>₹ 0.00</h5>
                                  </li>
                                  <li>
                                    <h4>Due</h4>
                                    <h5>$ 0.00</h5>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /details popup */}
        {/* edit popup */}
        <div className="modal fade" id="edit-sales-new">
          <div className="modal-dialog edit-sales-modal">
            <div className="modal-content">
              <div className="page-wrapper p-0 m-0">
                <div className="content p-0">
                  <div className="page-header p-4 mb-0">
                    <div className="add-item new-sale-items d-flex">
                      <div className="page-title">
                        <h4>Edit Sales</h4>
                      </div>
                      <button
                        type="button"
                        className="close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-body">
                      <form>
                        <div className="row">
                          <div className="col-lg-4 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Customer</label>
                              <div className="row">
                                <div className="col-lg-10 col-sm-10 col-10">
                                  <CommonSelect
                                    options={customer}
                                    value={selectedCustomer}
                                    onChange={(e) =>
                                      setSelectedCustomer(e.value)
                                    }
                                    placeholder="Newest"
                                    filter={false}
                                  />
                                </div>
                                <div className="col-lg-2 col-sm-2 col-2 ps-0">
                                  <div className="add-icon">
                                    <Link to="#" className="choose-add">
                                      <i className="feather icon-plus-circle plus" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Purchase Date</label>
                              <div className="input-groupicon calender-input">
                                <i className="feather icon-calendar info-img" />
                                <CommonDatePicker
                                  value={date2}
                                  onChange={setDate2}
                                  className="w-100"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Supplier</label>
                              <CommonSelect
                                options={suppliername}
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.value)}
                                placeholder="Newest"
                                filter={false}
                              />
                            </div>
                          </div>
                          <div className="col-lg-12 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Product Name</label>
                              <div className="input-groupicon select-code">
                                <input
                                  type="text"
                                  placeholder="Please type product code and select"
                                />
                                <div className="addonset">
                                  <img src={scanners} alt="img" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="table-responsive no-pagination">
                          <table className="table  datanew">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Purchase Price($)</th>
                                <th>Discount($)</th>
                                <th>Tax(%)</th>
                                <th>Tax Amount($)</th>
                                <th>Unit Cost($)</th>
                                <th>Total Cost(%)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>
                                  <div className="productimgname">
                                    <Link
                                      to="#"
                                      className="product-img stock-img"
                                    >
                                      <img src={stockImg02} alt="product" />
                                    </Link>
                                    <Link to="#">Organic Neem Oil 500ml</Link>
                                  </div>
                                </td>
                                <td>
                                  <div className="product-quantity">
                                    <span className="quantity-btn">
                                      +
                                      <i className="feather icon-plus-circle" />
                                    </span>
                                    <input
                                      type="text"
                                      className="quntity-input"
                                      defaultValue={2}
                                    />
                                    <span className="quantity-btn">
                                      <i className="feather icon-minus-circle" />
                                    </span>
                                  </div>
                                </td>
                                <td>2000</td>
                                <td>500</td>
                                <td>0.00</td>
                                <td>0.00</td>
                                <td>0.00</td>
                                <td>1500</td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="productimgname">
                                    <Link
                                      to="#"
                                      className="product-img stock-img"
                                    >
                                      <img src={stockImg03} alt="product" />
                                    </Link>
                                    <Link to="#">Apple Series 5 Watch</Link>
                                  </div>
                                </td>
                                <td>
                                  <div className="product-quantity">
                                    <span className="quantity-btn">
                                      +
                                      <i className="feather icon-plus-circle" />
                                    </span>
                                    <input
                                      type="text"
                                      className="quntity-input"
                                      defaultValue={2}
                                    />
                                    <span className="quantity-btn">
                                      <i className="feather icon-minus-circle" />
                                    </span>
                                  </div>
                                </td>
                                <td>3000</td>
                                <td>400</td>
                                <td>0.00</td>
                                <td>0.00</td>
                                <td>0.00</td>
                                <td>1700</td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="productimgname">
                                    <Link
                                      to="#"
                                      className="product-img stock-img"
                                    >
                                      <img src={stockImg05} alt="product" />
                                    </Link>
                                    <Link to="#">Lobar Handy</Link>
                                  </div>
                                </td>
                                <td>
                                  <div className="product-quantity">
                                    <span className="quantity-btn">
                                      +
                                      <i className="feather icon-plus-circle" />
                                    </span>
                                    <input
                                      type="text"
                                      className="quntity-input"
                                      defaultValue={2}
                                    />
                                    <span className="quantity-btn">
                                      <i className="feather icon-minus-circle" />
                                    </span>
                                  </div>
                                </td>
                                <td>2500</td>
                                <td>500</td>
                                <td>0.00</td>
                                <td>0.00</td>
                                <td>0.00</td>
                                <td>2000</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="row">
                          <div className="col-lg-6 ms-auto">
                            <div className="total-order w-100 max-widthauto m-auto mb-4">
                              <ul>
                                <li>
                                  <h4>Order Tax</h4>
                                  <h5>$ 0.00</h5>
                                </li>
                                <li>
                                  <h4>Discount</h4>
                                  <h5>$ 0.00</h5>
                                </li>
                                <li>
                                  <h4>Shipping</h4>
                                  <h5>$ 0.00</h5>
                                </li>
                                <li>
                                  <h4>Grand Total</h4>
                                  <h5>₹ 0.00</h5>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-lg-3 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Order Tax</label>
                              <div className="input-groupicon select-code">
                                <input type="text" placeholder={"0"} />
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-3 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Discount</label>
                              <div className="input-groupicon select-code">
                                <input type="text" placeholder={"0"} />
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-3 col-sm-6 col-12">
                            <div className="input-blocks">
                              <label>Shipping</label>
                              <div className="input-groupicon select-code">
                                <input type="text" placeholder={"0"} />
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-3 col-sm-6 col-12">
                            <div className="input-blocks mb-5">
                              <label>Status</label>
                              <CommonSelect
                                options={statusupdate}
                                value={selectedStatusUpdate}
                                onChange={(e) =>
                                  setSelectedStatusUpdate(e.value)
                                }
                                placeholder="Status"
                                filter={false}
                              />
                            </div>
                          </div>
                          <div className="col-lg-12">
                            <div className="input-blocks">
                              <label>Notes</label>
                              <textarea
                                className="form-control"
                                defaultValue={""}
                              />
                            </div>
                          </div>
                          <div className="col-lg-12 text-end">
                            <button
                              type="button"
                              className="btn btn-cancel add-cancel me-3"
                              data-bs-dismiss="modal"
                            >
                              Cancel
                            </button>
                            <Link to="#" className="btn btn-submit add-sale">
                              Submit
                            </Link>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /edit popup */}
        {/* show payment Modal */}
        <div
          className="modal fade"
          id="showpayment"
          tabIndex={-1}
          aria-labelledby="showpayment"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content">
                  <div className="modal-header border-0 custom-modal-header">
                    <div className="page-title">
                      <h4>Show Payments</h4>
                    </div>
                    <button
                      type="button"
                      className="close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                  <div className="modal-body custom-modal-body">
                    <div className="row">
                      <div className="col-lg-12">
                        <div className="modal-body-table total-orders">
                          <div className="table-responsive">
                            <table className="table datanew">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Reference</th>
                                  <th>Amount</th>
                                  <th>Paid By</th>
                                  <th className="no-sort">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td colSpan={5} className="text-center text-muted py-3">No payment records found</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* show payment Modal */}
        {/* Create payment Modal */}
        <div
          className="modal fade"
          id="createpayment"
          tabIndex={-1}
          aria-labelledby="createpayment"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 custom-modal-header">
                <div className="page-title">
                  <h4>Create Payments</h4>
                </div>
                <button
                  type="button"
                  className="close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="modal-body custom-modal-body">
                <form>
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="input-blocks">
                        <label> Date</label>
                        <div className="input-groupicon calender-input ">
                          <i className="feather icon-calendar info-img" />

                          <CommonDatePicker
                            value={date3}
                            onChange={setDate3}
                            className="w-100"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6 col-sm-12 col-12">
                      <div className="input-blocks">
                        <label>Reference</label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-4 col-sm-12 col-12">
                      <div className="input-blocks">
                        <label>Received Amount</label>
                        <div className="input-groupicon calender-input">
                          <i className="feather icon-dollar-sign info-img" />
                          <input type="text" />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-12 col-12">
                      <div className="input-blocks">
                        <label>Paying Amount</label>
                        <div className="input-groupicon calender-input">
                          <i className="feather icon-dollar-sign info-img" />
                          <input type="text" />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-12 col-12">
                      <div className="input-blocks">
                        <label>Payment type</label>
                        <CommonSelect
                          options={paymenttype}
                          value={selectedPaymentType}
                          onChange={(e) => setSelectedPaymentType(e.value)}
                          placeholder="Newest"
                          filter={false}
                        />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="input-blocks">
                        <label>Description</label>
                        <textarea className="form-control" defaultValue={""} />
                        <p>Maximum 60 Characters</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="modal-footer-btn">
                      <button
                        type="button"
                        className="btn btn-cancel me-2"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <Link to="#" className="btn btn-submit">
                        Submit
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {/* Create payment Modal */}
        {/* edit payment Modal */}
        <div
          className="modal fade"
          id="editpayment"
          tabIndex={-1}
          aria-labelledby="editpayment"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 custom-modal-header">
                <div className="page-title">
                  <h4>Edit Payments</h4>
                </div>
                <button
                  type="button"
                  className="close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className="modal-body custom-modal-body">
                <form>
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="input-blocks">
                        <label>19 Jan 2023</label>
                        <div className="input-groupicon calender-input">
                          <i className="feather icon-calendar info-img" />
                          <input
                            type="text"
                            className="datetimepicker form-control"
                            placeholder="Select Date"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6 col-sm-12 col-12">
                      <div className="input-blocks">
                        <label>Reference</label>
                        <input type="text" defaultValue="INV/INV-001" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-4 col-sm-12 col-12">
                      <div className="input-blocks">
                        <label>Received Amount</label>
                        <div className="input-groupicon calender-input">
                          <i className="feather icon-dollar-sign info-img" />
                          <input type="text" defaultValue={0} />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-12 col-12">
                      <div className="input-blocks">
                        <label>Paying Amount</label>
                        <div className="input-groupicon calender-input">
                          <i className="feather icon-dollar-sign info-img" />
                          <input type="text" defaultValue={0} />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-12 col-12">
                      <div className="input-blocks">
                        <label>Payment type</label>
                        <select>
                          <option>Cash</option>
                          <option>Online</option>
                          <option>Inprogress</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="input-blocks summer-description-box transfer">
                        <label>Description</label>
                        <textarea className="form-control" defaultValue={""} />
                      </div>
                      <p>Maximum 60 Characters</p>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="modal-footer-btn mb-3 me-3">
                      <button
                        type="button"
                        className="btn btn-cancel me-2"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-submit">
                        Save Changes
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {/* edit payment Modal */}
        <div className="customizer-links" id="setdata">
          <ul className="sticky-sidebar">
            <li className="sidebar-icons">
              <Link
                to="#"
                className="navigation-add"
                data-bs-toggle="tooltip"
                data-bs-placement="left"
                data-bs-original-title="Theme"
              >
                <i className="ti ti-settings" />
              </Link>
            </li>
          </ul>
        </div>
      </>
    </div>
  );
};

export default SalesList;
