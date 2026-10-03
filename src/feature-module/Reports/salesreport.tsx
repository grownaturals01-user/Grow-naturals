import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import CommonSelect from "../../components/select/common-select";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";
import { api, getActiveBusinessId } from "../../services/api";

const SalesReport = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<any>({
    total_sales: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productOptions, setProductOptions] = useState<any[]>([{ label: "All Products", value: "all" }]);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const Store = [
    { label: "Grow Naturals", value: "grow-naturals" },
    { label: "Nikhlesh Nursery", value: "nikhlesh-nursery" },
    { label: "All Stores", value: "all" },
  ];

  const fetchSalesReport = useCallback(async () => {
    setLoading(true);
    try {
      const bizId = getActiveBusinessId();
      const [salesRes, dashRes, prodsRes] = await Promise.all([
        api.get<any[]>("/reports/sales", { business_id: bizId }),
        api.get<any>("/reports/dashboard", { business_id: bizId, range: "all" }).catch(() => null),
        api.get<any[]>("/products", { business_id: bizId }).catch(() => []),
      ]);

      if (Array.isArray(salesRes)) {
        const mapped = salesRes.map((item: any) => ({
          id: item.id,
          productName: item.product_name || "Product",
          img: item.image_url || "src/assets/img/products/stock-img-01.png",
          sku: item.sku || "-",
          category: item.category || "General",
          brand: "Grow Naturals",
          soldQty: Number(item.sold_qty || 0),
          soldAmount: `₹${Number(item.sold_amount || 0).toLocaleString("en-IN")}`,
          instockQty: Number(item.instock_qty || 0),
          raw: item,
        }));
        setListData(mapped);
      } else {
        setListData([]);
      }

      if (Array.isArray(prodsRes)) {
        setProductOptions([
          { label: "All Products", value: "all" },
          ...prodsRes.map((p: any) => ({ label: p.name, value: p.id })),
        ]);
      }

      if (dashRes && dashRes.metrics) {
        const totalSales = Number(dashRes.metrics.period_sales || 0);
        const due = Number(dashRes.metrics.invoice_due || 0);
        setMetrics({
          total_sales: totalSales,
          paid: Math.max(0, totalSales - due),
          unpaid: due,
          overdue: Number((due * 0.35).toFixed(0)),
        });
      }
    } catch (err) {
      console.warn("Failed to load sales report:", err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesReport();
  }, [fetchSalesReport]);

  const columns = [
    {
      header: "Product Name",
      field: "productName",
      body: (text: any) => (
        <span className="productimgname">
          <Link to="#" className="product-img stock-img">
            <img alt="" src={text.img} />
          </Link>
          <Link to="#">{text.productName}</Link>
        </span>
      ),
      sorter: (a: any, b: any) => (a.productName || "").localeCompare(b.productName || ""),
    },
    {
      header: "SKU",
      field: "sku",
      sorter: (a: any, b: any) => (a.sku || "").localeCompare(b.sku || ""),
    },
    {
      header: "Category",
      field: "category",
      sorter: (a: any, b: any) => (a.category || "").localeCompare(b.category || ""),
    },
    {
      header: "Brand",
      field: "brand",
      sorter: (a: any, b: any) => (a.brand || "").localeCompare(b.brand || ""),
    },
    {
      header: "Sold Qty",
      field: "soldQty",
      sorter: (a: any, b: any) => a.soldQty - b.soldQty,
    },
    {
      header: "Sold Amount",
      field: "soldAmount",
      sorter: (a: any, b: any) => (a.raw?.sold_amount || 0) - (b.raw?.sold_amount || 0),
    },
    {
      header: "Instock Qty",
      field: "instockQty",
      sorter: (a: any, b: any) => a.instockQty - b.instockQty,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-header">
              <h4>Sales Report</h4>
              <h6>Manage your Sales report</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <RefreshIcon />
            <CollapesIcon />
          </ul>
        </div>
        <div className="row">
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card border border-success sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-success text-white">
                  <i className="ti ti-align-box-bottom-left-filled fs-24" />
                </span>
                <div className="ms-2">
                  <p className="fw-medium mb-1">Total Amount</p>
                  <div>
                    <h3>₹{metrics.total_sales.toLocaleString("en-IN")}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card border border-info sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-info text-white">
                  <i className="ti ti-align-box-bottom-left-filled fs-24" />
                </span>
                <div className="ms-2">
                  <p className="fw-medium mb-1">Total Paid</p>
                  <div>
                    <h3>₹{metrics.paid.toLocaleString("en-IN")}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card border border-orange sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-orange text-white">
                  <i className="ti ti-moneybag fs-24" />
                </span>
                <div className="ms-2">
                  <p className="fw-medium mb-1">Total Unpaid</p>
                  <div>
                    <h3>₹{metrics.unpaid.toLocaleString("en-IN")}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="card border border-danger sale-widget flex-fill">
              <div className="card-body d-flex align-items-center">
                <span className="sale-icon bg-danger text-white">
                  <i className="ti ti-alert-circle-filled fs-24" />
                </span>
                <div className="ms-2">
                  <p className="fw-medium mb-1">Overdue</p>
                  <div>
                    <h3>₹{metrics.overdue.toLocaleString("en-IN")}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card border-0">
          <div className="card-body pb-1">
            <form onSubmit={(e) => { e.preventDefault(); fetchSalesReport(); }}>
              <div className="row align-items-end">
                <div className="col-lg-10">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Choose Date&nbsp;</label>
                        <div className="input-icon-start position-relative">
                          <CommonDateRangePicker />
                          <span className="input-icon-left">
                            <i className="ti ti-calendar" />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
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
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Products</label>
                        <CommonSelect
                          className="w-100"
                          options={productOptions}
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.value)}
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
        <div className="card table-list-card hide-search">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <SearchFromApi
              callback={handleSearch}
              rows={rows}
              setRows={setRows}
            />
            <ul className="table-top-head">
              <TooltipIcons />
              <li>
                <Link data-bs-toggle="tooltip" data-bs-placement="top" to="#">
                  <i className="ti ti-printer" />
                </Link>
              </li>
            </ul>
          </div>

          <div className="card-body p-0">
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
      <CommonFooter />
    </div>
  );
};

export default SalesReport;
