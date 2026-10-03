import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import CollapesIcon from "../../components/tooltip-content/collapes";
import RefreshIcon from "../../components/tooltip-content/refresh";
import { all_routes } from "../../routes/all_routes";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import CommonSelect from "../../components/select/common-select";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";
import { api, getActiveBusinessId } from "../../services/api";

const TaxReport = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const fetchTaxReport = useCallback(async () => {
    setLoading(true);
    try {
      const bizId = getActiveBusinessId();
      const res = await api.get<any[]>("/reports/tax", { business_id: bizId });
      if (Array.isArray(res)) {
        const mapped = res.map((inv: any) => ({
          Reference: inv.invoice_number,
          Supplier: inv.customer_name || "Walk-in Customer",
          Date: inv.created_at ? new Date(inv.created_at).toLocaleDateString("en-IN") : "-",
          Store: "Grow Naturals",
          Amount: `₹${Number(inv.total_amount || 0).toLocaleString("en-IN")}`,
          Payment_Method: "Cash",
          Discount: "₹0",
          Tax_Amount: `₹${Number(inv.total_tax || 0).toLocaleString("en-IN")}`,
          raw: inv,
        }));
        setListData(mapped);
      } else {
        setListData([]);
      }
    } catch (err) {
      console.warn("Failed to load tax report:", err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxReport();
  }, [fetchTaxReport]);

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
      header: "Customer / Supplier",
      field: "Supplier",
      sorter: (a: any, b: any) => (a.Supplier || "").localeCompare(b.Supplier || ""),
    },

    {
      header: "Date",
      field: "Date",
      sorter: (a: any, b: any) => (a.Date || "").localeCompare(b.Date || ""),
    },
    {
      header: "Store",
      field: "Store",
      sorter: (a: any, b: any) => (a.Store || "").localeCompare(b.Store || ""),
    },
    {
      header: "Amount",
      field: "Amount",
      sorter: (a: any, b: any) => (a.raw?.total_amount || 0) - (b.raw?.total_amount || 0),
    },
    {
      header: "Payment Method",
      field: "Payment_Method",
      sorter: (a: any, b: any) => (a.Payment_Method || "").localeCompare(b.Payment_Method || ""),
    },
    {
      header: "Discount",
      field: "Discount",
      sorter: (a: any, b: any) => (a.Discount || "").localeCompare(b.Discount || ""),
    },
    {
      header: "Tax Amount",
      field: "Tax_Amount",
      sorter: (a: any, b: any) => (a.raw?.total_tax || 0) - (b.raw?.total_tax || 0),
    },
  ];

  const Store = [
    { value: "All", label: "All Stores" },
    { value: "grow-naturals", label: "Grow Naturals" },
    { value: "nikhlesh-nursery", label: "Nikhlesh Nursery" },
  ];
  const Supplier = [
    { value: "All", label: "All" },
    { value: "Walk-in Customer", label: "Walk-in Customer" },
  ];
  const Payment_Method = [
    { value: "All", label: "All" },
    { value: "Cash", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "Card", label: "Card" },
  ];

  const route = all_routes;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="table-tab">
          <ul className="nav nav-pills">
            <li className="nav-item">
              <Link className="nav-link active" to={route.taxreport}>
                Purchase tax
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={route.saletaxreport}>
                Sales Tax
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Tax Report</h4>
                <h6>View Reports of Sales and Purchase Tax</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon />
              <CollapesIcon />
            </ul>
          </div>
          <div className="card border-0">
            <div className="card-body pb-1">
              <form onSubmit={(e) => { e.preventDefault(); fetchTaxReport(); }}>
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
                          <label className="form-label">Store</label>
                          <CommonSelect
                            className="w-100"
                            options={Store}
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Supplier / Customer</label>
                          <CommonSelect
                            className="w-100"
                            options={Supplier}
                            value={selectedSupplier}
                            onChange={(e) => setSelectedSupplier(e.value)}
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
                            options={Payment_Method}
                            value={selectedPaymentMethod}
                            onChange={(e) => setSelectedPaymentMethod(e.value)}
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
            <div className="card-body">
              <div className="table-responsive custome-search">
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
      <CommonFooter />
    </div>
  );
};

export default TaxReport;
