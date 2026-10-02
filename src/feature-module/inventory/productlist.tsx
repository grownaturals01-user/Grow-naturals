import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import { api, getActiveBusinessId } from "../../services/api";

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  type: string;
  category_name?: string;
  selling_price: number;
  cost_price: number;
  unit: string;
  stock_quantity: number;
  low_stock_threshold: number;
  barcode?: string;
  image_url?: string;
  business_name?: string;
}

const formatINR = (val: number | string) => {
  const num = Number(val) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const ProductList: React.FC = () => {
  const route = all_routes;
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const businessId = getActiveBusinessId();
    api.get<any[]>("/categories", { business_id: businessId })
      .then((res) => {
        if (Array.isArray(res)) setCategories(res);
      })
      .catch((err) => console.warn(err));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = getActiveBusinessId();
      const params: any = { business_id: businessId };
      if (categoryFilter !== "all") params.category_id = categoryFilter;
      if (typeFilter !== "all") params.type = typeFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get<any[]>("/products", params);
      if (Array.isArray(res)) {
        setProducts(res);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.warn("Failed to load products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/products/${deleteId}`);
      setDeleteId(null);
      await fetchProducts();
      const modalEl = document.getElementById("delete-product-modal");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  const columns = [
    {
      header: "Product & SKU",
      field: "name",
      key: "name",
      sortable: true,
      body: (p: ProductItem) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-md bg-light-success text-success me-2 d-flex align-items-center justify-content-center">
            <i className="ti ti-plant fs-16" />
          </div>
          <div>
            <h6 className="fw-semibold mb-0">{p.name}</h6>
            <span className="fs-12 text-muted">SKU: {p.sku || '#' + p.id.slice(0, 6)}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Category / Module",
      field: "category_name",
      key: "category_name",
      sortable: true,
      body: (p: ProductItem) => (
        <div>
          <span className="badge badge-soft-info text-capitalize fs-11 me-1">{p.type || "General"}</span>
          <span className="fs-12 text-gray-9">{p.category_name || "General Category"}</span>
        </div>
      ),
    },
    {
      header: "Selling Price",
      field: "selling_price",
      key: "selling_price",
      sortable: true,
      body: (p: ProductItem) => (
        <span className="fw-bold text-gray-9">{formatINR(p.selling_price)}</span>
      ),
    },
    {
      header: "Cost Price",
      field: "cost_price",
      key: "cost_price",
      sortable: true,
      body: (p: ProductItem) => (
        <span className="text-muted fs-13">{formatINR(p.cost_price || 0)}</span>
      ),
    },
    {
      header: "Stock Level",
      field: "stock_quantity",
      key: "stock_quantity",
      sortable: true,
      body: (p: ProductItem) => {
        const qty = Number(p.stock_quantity) || 0;
        const threshold = Number(p.low_stock_threshold) || 5;
        const isLow = qty <= threshold;
        const isOut = qty <= 0;

        return (
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold fs-14">{qty} {p.unit || 'Pcs'}</span>
            {isOut ? (
              <span className="badge badge-soft-danger fs-10">Out of Stock</span>
            ) : isLow ? (
              <span className="badge badge-soft-warning fs-10">Low Stock</span>
            ) : (
              <span className="badge badge-soft-success fs-10">In Stock</span>
            )}
          </div>
        );
      },
    },
    {
      header: "Actions",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (p: ProductItem) => (
        <div className="edit-delete-action d-flex align-items-center gap-1">
          <Link
            to={route.addproduct}
            className="btn btn-sm btn-icon btn-light"
            title="Create Similar"
          >
            <i className="feather icon-copy text-info fs-14" />
          </Link>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light"
            data-bs-toggle="modal"
            data-bs-target="#delete-product-modal"
            onClick={() => setDeleteId(p.id)}
            title="Delete"
          >
            <i className="feather icon-trash-2 text-danger fs-14" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 className="fw-bold">Product List</h4>
              <h6>Manage your live botanical inventory and supplies</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li>
              <button
                type="button"
                className="btn btn-sm btn-outline-light border"
                onClick={fetchProducts}
                title="Refresh"
              >
                <i className="ti ti-refresh" />
              </button>
            </li>
          </ul>
          <div className="page-btn">
            <Link to={route.addproduct} className="btn btn-primary d-inline-flex align-items-center">
              <i className="ti ti-circle-plus me-1" />
              Add New Product
            </Link>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <SearchFromApi callback={(val: any) => setSearchQuery(val)} rows={rows} setRows={setRows} />

            <div className="d-flex align-items-center gap-2">
              <select
                className="form-select form-select-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: "170px" }}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ width: "160px" }}
              >
                <option value="all">All Modules</option>
                <option value="plants">🪴 Plants</option>
                <option value="cactus">🌵 Cactus</option>
                <option value="pots">🏺 Pots</option>
                <option value="fertilizers">🧪 Fertilizers</option>
                <option value="flowers">🌸 Flowers</option>
              </select>
            </div>
          </div>

          <div className="card-body">
            <div className="table-responsive product-table">
              <PrimeDataTable
                column={columns}
                data={products}
                rows={rows}
                setRows={setRows}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalRecords={products.length}
                searchQuery={searchQuery}
                selectionMode="checkbox"
                selection={selectedProducts}
                onSelectionChange={(e: any) => setSelectedProducts(e.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete-product-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content text-center p-4">
            <div className="mb-3">
              <span className="avatar avatar-xl bg-danger-transparent text-danger rounded-circle">
                <i className="ti ti-trash fs-24" />
              </span>
            </div>
            <h5 className="fw-bold mb-2">Delete Product?</h5>
            <p className="text-muted fs-14 mb-4">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button type="button" className="btn btn-secondary px-4" data-bs-dismiss="modal">
                Cancel
              </button>
              <button type="button" className="btn btn-danger px-4" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
