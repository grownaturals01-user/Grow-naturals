import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import CommonSelect from "../../components/select/common-select";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";
import { api, getActiveBusinessId } from "../../services/api";

const InventoryReport = () => {
  const route = all_routes;
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, _setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  const [categoryOptions, setCategoryOptions] = useState<any[]>([
    { value: "all", label: "All Categories" },
  ]);
  const [productOptions, setProductOptions] = useState<any[]>([
    { value: "all", label: "All Products" },
  ]);

  const units = [
    { value: "PC", label: "PC" },
    { value: "KG", label: "KG" },
    { value: "BX", label: "BX" },
    { value: "L", label: "L" },
  ];

  const fetchInventoryReport = useCallback(async () => {
    setLoading(true);
    try {
      const bizId = getActiveBusinessId();
      const [invRes, catsRes, prodsRes] = await Promise.all([
        api.get<any[]>("/reports/inventory", { business_id: bizId }),
        api.get<any[]>("/categories", { business_id: bizId }).catch(() => []),
        api.get<any[]>("/products", { business_id: bizId }).catch(() => []),
      ]);

      if (Array.isArray(invRes)) {
        let filtered = invRes;
        if (selectedCategory && selectedCategory.value !== "all") {
          filtered = filtered.filter((i: any) => i.category === selectedCategory.label);
        }
        if (selectedProduct && selectedProduct.value !== "all") {
          filtered = filtered.filter((i: any) => i.id === selectedProduct.value);
        }

        const mapped = filtered.map((item: any) => ({
          id: item.id,
          productName: item.product_name,
          img: item.image_url || "src/assets/img/products/stock-img-01.png",
          sku: item.sku || "-",
          category: item.category || "General",
          brand: "Grow Naturals",
          unit: "PC",
          instockQty: Number(item.instock_qty || 0),
          raw: item,
        }));
        setListData(mapped);
      } else {
        setListData([]);
      }

      if (Array.isArray(catsRes)) {
        setCategoryOptions([
          { value: "all", label: "All Categories" },
          ...catsRes.map((c: any) => ({ value: c.id, label: c.name })),
        ]);
      }

      if (Array.isArray(prodsRes)) {
        setProductOptions([
          { value: "all", label: "All Products" },
          ...prodsRes.map((p: any) => ({ value: p.id, label: p.name })),
        ]);
      }
    } catch (err) {
      console.warn("Failed to load inventory report:", err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedProduct]);

  useEffect(() => {
    fetchInventoryReport();
  }, [fetchInventoryReport]);

  const columns = [
    {
      header: "Product Name",
      field: "productName",
      body: (text: any) => (
        <span className="productimgname">
          <Link to="#" className="product-img stock-img">
            <img alt="img" src={text.img} />
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
      header: "Unit",
      field: "unit",
      sorter: (a: any, b: any) => (a.unit || "").localeCompare(b.unit || ""),
    },

    {
      header: "Instock Qty",
      field: "instockQty",
      sorter: (a: any, b: any) => a.instockQty - b.instockQty,
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="table-tab">
            <ul className="nav nav-pills">
              <li className="nav-item">
                <Link className="nav-link active" to={route.inventoryreport}>
                  Inventory Report
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={route.stockhistory}>
                  Stock History
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={route.soldstock}>
                  Sold Stock
                </Link>
              </li>
            </ul>
          </div>

          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Inventory</h4>
                <h6>View Reports of Inventory</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon />
              <CollapesIcon />
            </ul>
          </div>
          <div className="card border-0">
            <div className="card-body pb-1">
              <form onSubmit={(e) => { e.preventDefault(); fetchInventoryReport(); }}>
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
                          <label className="form-label">Category</label>
                          <CommonSelect
                            className="w-100"
                            options={categoryOptions}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
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
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label">Units</label>
                          <CommonSelect
                            className="w-100"
                            options={units}
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.value)}
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
          <div className="card table-list-card">
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
      <CommonFooter />
    </>
  );
};

export default InventoryReport;
