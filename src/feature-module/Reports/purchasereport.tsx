import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import CommonSelect from "../../components/select/common-select";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";
import { api, getActiveBusinessId } from "../../services/api";

const PurchaseReport = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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

  const fetchPurchaseReport = useCallback(async () => {
    setLoading(true);
    try {
      const bizId = getActiveBusinessId();
      const [purchRes, prodsRes] = await Promise.all([
        api.get<any[]>("/reports/purchases", { business_id: bizId }),
        api.get<any[]>("/products", { business_id: bizId }).catch(() => []),
      ]);

      if (Array.isArray(purchRes)) {
        const mapped = purchRes.map((item: any, idx: number) => ({
          id: item.id || `po-${idx}`,
          productName: item.product_name || "Product",
          img: item.image_url || "src/assets/img/products/stock-img-02.png",
          productAmount: `₹${Number(item.purchased_amount || 0).toLocaleString("en-IN")}`,
          productQty: Number(item.purchased_qty || 0),
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
    } catch (err) {
      console.warn("Failed to load purchase report:", err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchaseReport();
  }, [fetchPurchaseReport]);

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
      header: "Product Amount",
      field: "productAmount",
      sorter: (a: any, b: any) => (a.raw?.purchased_amount || 0) - (b.raw?.purchased_amount || 0),
    },

    {
      header: "Product Qty",
      field: "productQty",
      sorter: (a: any, b: any) => a.productQty - b.productQty,
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
            <div className="page-title">
              <h4>Purchase report</h4>
              <h6>Manage your Purchase report</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <RefreshIcon />
            <CollapesIcon />
          </ul>
        </div>
        <div className="card border-0">
          <div className="card-body pb-1">
            <form onSubmit={(e) => { e.preventDefault(); fetchPurchaseReport(); }}>
              <div className="row align-items-end">
                <div className="col-lg-10">
                  <div className="row">
                    <div className="col-md-4">
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

export default PurchaseReport;
