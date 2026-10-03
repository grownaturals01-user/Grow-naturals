import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import EditLowStock from "../../core/modals/inventory/editlowstock";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import CommonFooter from "../../components/footer/commonFooter";
import {
  stockImg01,
  stockImg02,
  stockImg03,
  stockImg04,
  stockImg05,
} from "../../utils/imagepath";
import PrimeDataTable from "../../components/data-table";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";

const placeholderImages = [
  stockImg01,
  stockImg02,
  stockImg03,
  stockImg04,
  stockImg05,
];

// Interface for low stock data item
interface LowStockItem {
  id: string;
  warehouse: string;
  store: string;
  product: string;
  category: string;
  sku: string;
  qty: string;
  qtyalert: string;
  img: string;
  raw?: any;
}

const LowStock: React.FC = () => {
  const [listData, setListData] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchLowStock = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = getActiveBusinessId();
      const res = await api.get<any[]>("/products", { business_id: businessId });
      if (Array.isArray(res)) {
        const mapped: LowStockItem[] = res.map((p: any, idx: number) => ({
          id: p.id,
          warehouse: p.business_name ? `${p.business_name} Depot` : "Main Warehouse",
          store: p.business_name || (businessId === 'nikhlesh-nursery' ? "Nikhlesh Nursery" : "Grow Naturals"),
          product: p.name,
          category: p.category_name || "General",
          sku: p.sku || `SKU-${p.id.slice(-4).toUpperCase()}`,
          qty: String(p.stock_quantity ?? 0),
          qtyalert: String(p.low_stock_threshold ?? 10),
          img: p.image_url || placeholderImages[idx % placeholderImages.length],
          raw: p,
        }));
        setListData(mapped);
      } else {
        setListData([]);
      }
    } catch (err) {
      console.warn("Failed to load low stock:", err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/products/${deleteId}`);
      setDeleteId(null);
      await fetchLowStock();
      const closeBtn = document.querySelector('#delete-modal [data-bs-dismiss="modal"]') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err) {
      console.error("Failed to delete low stock item:", err);
    }
  };

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  // Filter low stock (stock <= threshold) vs out of stock (stock <= 0)
  const lowStockOnly = listData.filter((p) => {
    const q = Number(p.qty);
    const th = Number(p.qtyalert);
    return q <= th;
  });

  const outOfStockOnly = listData.filter((p) => {
    return Number(p.qty) <= 0;
  });

  // If no items are strictly low, show all products sorted ascending by stock quantity
  const activeLowStockList = (lowStockOnly.length > 0 ? lowStockOnly : [...listData].sort((a, b) => Number(a.qty) - Number(b.qty))).filter((item) => {
    if (!searchQuery) return true;
    return (
      item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activeOutOfStockList = (outOfStockOnly.length > 0 ? outOfStockOnly : listData.filter(i => Number(i.qty) <= 0)).filter((item) => {
    if (!searchQuery) return true;
    return (
      item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const columns = [
    {
      header: "Warehouse",
      field: "warehouse",
      key: "warehouse",
      sortable: true,
      style: { width: "15%" },
    },
    {
      header: "Store",
      field: "store",
      key: "store",
      sortable: true,
    },
    {
      header: "Product",
      field: "product",
      key: "product",
      sortable: true,
      body: (data: LowStockItem) => (
        <span className="productimgname">
          <Link to="#" className="product-img stock-img">
            <img alt="" src={data.img} />
          </Link>
          {data.product}
        </span>
      ),
    },
    {
      header: "Category",
      field: "category",
      key: "category",
      sortable: true,
    },
    {
      header: "SKU",
      field: "sku",
      key: "sku",
      sortable: true,
    },
    {
      header: "Qty",
      field: "qty",
      key: "qty",
      sortable: true,
      body: (data: LowStockItem) => (
        <span className={`fw-bold ${Number(data.qty) <= 0 ? 'text-danger' : 'text-warning'}`}>
          {data.qty}
        </span>
      ),
    },
    {
      header: "Qty Alert",
      field: "qtyalert",
      key: "qtyalert",
      sortable: true,
    },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: any) => (
        <div className="edit-delete-action d-flex align-items-center">
          <Link
            className="me-2 p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-stock"
          >
            <i className="feather icon-edit"></i>
          </Link>
          <Link
            className="p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            onClick={() => setDeleteId(row.id)}
          >
            <i className="feather icon-trash-2"></i>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="page-title me-auto">
              <h4 className="fw-bold">Low Stocks</h4>
              <h6>Manage your low stocks</h6>
            </div>
            <ul className="table-top-head low-stock-top-head">
              <TooltipIcons />
              <li onClick={() => fetchLowStock()}>
                <RefreshIcon />
              </li>
              <CollapesIcon />
              <li>
                <Link
                  to="#"
                  className="btn btn-secondary w-auto shadow-none"
                  data-bs-toggle="modal"
                  data-bs-target="#send-email"
                >
                  <i className="feather icon-mail feather-mail me-1" />
                  Send Email
                </Link>
              </li>
            </ul>
          </div>
          <div className="table-tab">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
              <ul
                className="nav nav-pills low-stock-tab d-flex me-2 mb-0"
                id="pills-tab"
                role="tablist"
              >
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link active"
                    id="pills-home-tab"
                    data-bs-toggle="pill"
                    data-bs-target="#pills-home"
                    type="button"
                    role="tab"
                    aria-controls="pills-home"
                    aria-selected="true"
                  >
                    Low Stocks ({activeLowStockList.length})
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link"
                    id="pills-profile-tab"
                    data-bs-toggle="pill"
                    data-bs-target="#pills-profile"
                    type="button"
                    role="tab"
                    aria-controls="pills-profile"
                    aria-selected="false"
                  >
                    Out of Stocks ({activeOutOfStockList.length})
                  </button>
                </li>
              </ul>
              <div className="notify d-flex bg-white p-1 px-2 border rounded">
                <div className="status-toggle text-gray d-flex justify-content-between align-items-center">
                  <input
                    type="checkbox"
                    id="user2"
                    className="check"
                    defaultChecked
                  />
                  <label htmlFor="user2" className="checktoggle me-2">
                    checkbox
                  </label>
                  Notify
                </div>
              </div>
            </div>
            <div className="tab-content" id="pills-tabContent">
              <div
                className="tab-pane fade show active"
                id="pills-home"
                role="tabpanel"
                aria-labelledby="pills-home-tab"
              >
                {/* /product list */}
                <div className="card table-list-card">
                  <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                    <SearchFromApi
                      callback={handleSearch}
                      rows={rows}
                      setRows={setRows}
                    />
                    <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                      <div className="dropdown me-2">
                        <Link
                          to="#"
                          className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                          data-bs-toggle="dropdown"
                        >
                          Status
                        </Link>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              Low Stock Alert
                            </Link>
                          </li>
                          <li>
                            <Link to="#" className="dropdown-item rounded-1">
                              Reorder Required
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <PrimeDataTable
                        column={columns}
                        data={activeLowStockList}
                        rows={rows}
                        setRows={setRows}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalRecords={activeLowStockList.length}
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
              <div
                className="tab-pane fade"
                id="pills-profile"
                role="tabpanel"
                aria-labelledby="pills-profile-tab"
              >
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
                    <div className="table-responsive">
                      <PrimeDataTable
                        column={columns}
                        data={activeOutOfStockList}
                        rows={rows}
                        setRows={setRows}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalRecords={activeOutOfStockList.length}
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
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Send Mail */}
      <div className="modal fade" id="send-email">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="success-email-send modal-body .custom-modal-body text-center">
              <span className="rounded-circle d-inline-flex p-2 bg-success-transparent mb-2">
                <i className="ti ti-checks fs-24 text-success" />
              </span>
              <h4 className="fs-20 fw-semibold">Success</h4>
              <p>Email Sent Successfully</p>
              <Link
                to="#"
                className="btn btn-primary p-1 px-2 fs-13 fw-normal"
                data-bs-dismiss="modal"
              >
                Close
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* /Send Mail */}

      <EditLowStock />
      <DeleteModal onConfirm={handleDelete} />
    </div>
  );
};

export default LowStock;
