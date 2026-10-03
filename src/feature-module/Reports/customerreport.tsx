import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import PrimeDataTable from "../../components/data-table";
import CommonSelect from "../../components/select/common-select";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";

const CustomerReport = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<any>(null);
  const [customerOptions, setCustomerOptions] = useState<any[]>([{ value: "all", label: "All Customers" }]);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const route = all_routes;

  const fetchCustomerReport = useCallback(async () => {
    setLoading(true);
    try {
      const bizId = getActiveBusinessId();
      const res = await api.get<any[]>("/reports/customers", { business_id: bizId });
      if (Array.isArray(res)) {
        let filtered = res;
        if (selectedCustomer && selectedCustomer.value !== "all") {
          filtered = filtered.filter((c: any) => c.id === selectedCustomer.value);
        }
        const mapped = filtered.map((c: any) => ({
          Reference: c.id ? `CUST-${c.id.toString().slice(-4).toUpperCase()}` : "CUST-001",
          Code: c.phone || "-",
          Customer: c.customer_name || "Walk-in Customer",
          image: "src/assets/img/users/user-01.jpg",
          Total_Orders: Number(c.total_orders || 0),
          Amount: `₹${Number(c.total_spent || 0).toLocaleString("en-IN")}`,
          Payment_Method: "Cash / UPI",
          Status: Number(c.total_orders || 0) > 0 ? "Completed" : "Unpaid",
          raw: c,
        }));
        setListData(mapped);
        setCustomerOptions([
          { value: "all", label: "All Customers" },
          ...res.map((c: any) => ({ value: c.id, label: c.customer_name })),
        ]);
      } else {
        setListData([]);
      }
    } catch (err) {
      console.warn("Failed to load customer report:", err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    fetchCustomerReport();
  }, [fetchCustomerReport]);

  const columns = [
    {
      header: "Reference",
      field: "Reference",
      body: (text: any) => (
        <Link to="#" className="text-orange">
          {text.Reference}
        </Link>
      ),
      sorter: (a: any, b: any) => (a.Reference || "").localeCompare(b.Reference || ""),
    },
    {
      header: "Phone / Code",
      field: "Code",
      sorter: (a: any, b: any) => (a.Code || "").localeCompare(b.Code || ""),
    },

    {
      header: "Customer",
      field: "Customer",
      body: (text: any) => (
        <>
          <div className="d-flex align-items-center">
            <Link to="#" className="avatar avatar-md">
              <img src={text.image} className="img-fluid" alt="img" />
            </Link>
            <div className="ms-2">
              <p className="text-dark mb-0">
                <Link to="#">{text.Customer}</Link>
              </p>
            </div>
          </div>
        </>
      ),
      sorter: (a: any, b: any) => (a.Customer || "").localeCompare(b.Customer || ""),
    },

    {
      header: "Total Orders",
      field: "Total_Orders",
      sorter: (a: any, b: any) => a.Total_Orders - b.Total_Orders,
    },
    {
      header: "Amount",
      field: "Amount",
      sorter: (a: any, b: any) => (a.raw?.total_spent || 0) - (b.raw?.total_spent || 0),
    },

    {
      header: "Payment Method",
      field: "Payment_Method",
      sorter: (a: any, b: any) => (a.Payment_Method || "").localeCompare(b.Payment_Method || ""),
    },
    {
      header: "Status",
      field: "Status",
      body: (text: any) => (
        <span
          className={`badge ${text.Status === "Completed" ? "badge-success" : "badge-danger"} d-inline-flex align-items-center badge-xs`}
        >
          {text.Status}
        </span>
      ),
      sorter: (a: any, b: any) => (a.Status || "").localeCompare(b.Status || ""),
    },
  ];

  const PaymentMethod = [
    { value: "All", label: "All Methods" },
    { value: "Cash", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "Card", label: "Card" },
  ];
  const PaymentStatus = [
    { value: "All", label: "All Statuses" },
    { value: "Completed", label: "Completed" },
    { value: "Unpaid", label: "Unpaid" },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="table-tab">
          <ul className="nav nav-pills">
            <li className="nav-item">
              <Link className="nav-link active" to={route.customerreport}>
                Customer Report
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={route.customerduereport}>
                Customer Due
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Customer Report</h4>
                <h6>View Reports of Customer</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon />
              <CollapesIcon />
            </ul>
          </div>
          <div className="card border-0">
            <div className="card-body pb-1">
              <form onSubmit={(e) => { e.preventDefault(); fetchCustomerReport(); }}>
                <div className="row align-items-end">
                  <div className="col-lg-10">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Choose Date</label>
                          <div className="input-icon-start position-relative">
                            <CommonDateRangePicker />
                            <span className="input-icon-left">
                              <i className="ti ti-calendar" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Customer</label>
                          <CommonSelect
                            className="w-100"
                            options={customerOptions}
                            value={selectedCustomer}
                            onChange={(e) => setSelectedCustomer(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Payment Method</label>
                          <CommonSelect
                            className="w-100"
                            options={PaymentMethod}
                            value={selectedPaymentMethod}
                            onChange={(e) => setSelectedPaymentMethod(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Payment Status</label>
                          <CommonSelect
                            className="w-100"
                            options={PaymentStatus}
                            value={selectedPaymentStatus}
                            onChange={(e) => setSelectedPaymentStatus(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-2">
                    <div className="mb-3">
                      <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                        {loading ? "Generating..." : "Generate Report"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
          {/* /product list */}
          <div className="card table-list-card no-search">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi
                callback={handleSearch}
                rows={rows}
                setRows={setRows}
              />
              <ul className="table-top-head">
                <TooltipIcons />
                <li>
                  <Link to="#"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Print"
                  >
                    <i className="ti ti-printer" />
                  </Link>
                </li>
              </ul>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={listData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={listData.length}
                  searchQuery={searchQuery}
                  selectionMode="checkbox"
                  selection={selectedProducts}
                  onSelectionChange={(e: any) => setSelectedProducts(e.value)}
                />
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
      </div>
      <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
        <p className="mb-0">2014 - {new Date().getFullYear()} © DreamsPOS. All Right Reserved</p>
        <p>
          Designed &amp; Developed By{" "}
          <Link to="#" className="text-orange">
            Dreams
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerReport;
