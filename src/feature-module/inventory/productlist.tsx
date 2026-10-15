import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Brand from "../../core/modals/inventory/brand";
import { all_routes } from "../../routes/all_routes";
import PrimeDataTable from "../../components/data-table";
import { batchService, BatchRecord } from "../../services/batchService";
import "../../styles/purchase-batch.css";
import { Plus, Package, Search, ChevronRight, Info } from "lucide-react";
import {
  expireProduct01,
  expireProduct02,
  expireProduct03,
  expireProduct04,
  stockImg02,
  stockImg03,
  stockImg04,
  stockImg05,
  stockImg06,
  user04,
  user08,
  user10,
  user13,
  user30,
  stockImg1,
  user11,
  user3,
  user2,
  user5,
  user01,
} from "../../utils/imagepath";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import { api, getActiveBusinessId } from "../../services/api";
import { useBusiness } from "../../context/BusinessContext";

const productImages = [
  stockImg1,
  stockImg06,
  stockImg02,
  stockImg03,
  stockImg04,
  stockImg05,
  expireProduct01,
  expireProduct02,
  expireProduct03,
  expireProduct04,
];

const userAvatars = [
  user30,
  user13,
  user11,
  user3,
  user2,
  user5,
  user08,
  user04,
  user01,
  user10,
];

export const fallbackProductListData: any[] = [];
export const productlistdata: any[] = [];


interface ProductItem {
  id: string | number;
  sku: string;
  product: string;
  productImage: string;
  category: string;
  brand: string;
  price: string;
  unit: string;
  qty: string;
  createdby: string;
  img: string;
  action?: string;
  raw?: any;
}

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const { businessId } = useBusiness();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  // Batch Expansion and Add Batch Modal states
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [addBatchModalOpen, setAddBatchModalOpen] = useState(false);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<ProductItem | null>(null);
  const [availableBatches, setAvailableBatches] = useState<BatchRecord[]>([]);
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const handleOpenBatchModal = (product: ProductItem) => {
    setSelectedProductForBatch(product);
    const allBatches = batchService.getBatches();
    setAvailableBatches(allBatches);
    setSelectedBatchId(allBatches[0]?.id || null);
    setBatchSearchTerm("");
    setAddBatchModalOpen(true);
  };

  const handleProceedWithBatch = () => {
    if (!selectedBatchId) {
      if (selectedProductForBatch) {
        navigate(
          `${all_routes.addproduct}?product=${encodeURIComponent(
            selectedProductForBatch.product
          )}&sku=${encodeURIComponent(selectedProductForBatch.sku)}`
        );
      } else {
        navigate(all_routes.addproduct);
      }
      setAddBatchModalOpen(false);
      return;
    }

    const chosen = availableBatches.find((b) => b.id === selectedBatchId);
    if (chosen && selectedProductForBatch) {
      navigate(
        `${all_routes.addproduct}?batchId=${chosen.id}&expensePercent=${
          chosen.expensePercent
        }&batchName=${encodeURIComponent(chosen.batchNo)}&product=${encodeURIComponent(
          selectedProductForBatch.product
        )}&sku=${encodeURIComponent(selectedProductForBatch.sku)}`
      );
    } else if (chosen) {
      navigate(
        `${all_routes.addproduct}?batchId=${chosen.id}&expensePercent=${
          chosen.expensePercent
        }&batchName=${encodeURIComponent(chosen.batchNo)}`
      );
    }
    setAddBatchModalOpen(false);
  };

  const rowExpansionTemplate = (data: ProductItem) => {
    const mappedBatches = batchService.getBatchesForProduct(data.id, data.sku, data.product);

    return (
      <div className="product-batch-subtable-container">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <h6 className="fw-bold fs-12 text-secondary text-uppercase mb-0 d-flex align-items-center gap-2">
            <Package size={15} className="text-secondary" />
            Mapped Purchase Batches for "{data.product}" ({mappedBatches.length})
          </h6>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBatchModal(data);
            }}
          >
            <Plus size={13} /> Add Batch
          </button>
        </div>

        {mappedBatches.length === 0 ? (
          <div className="p-4 text-center bg-white rounded border text-muted fs-13">
            <p className="mb-2">No purchase batches mapped to this product yet.</p>
            <button
              type="button"
              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenBatchModal(data);
              }}
            >
              <Plus size={13} /> Add Batch
            </button>
          </div>
        ) : (
          <div className="table-responsive bg-white rounded border">
            <table className="product-batch-subtable mb-0">
              <thead>
                <tr>
                  <th>Batch Name</th>
                  <th>Supplier Name</th>
                  <th className="text-center">Stock Left in Batch</th>
                  <th className="text-end">Purchase Price</th>
                  <th className="text-center">Expense %</th>
                  <th className="text-end">Actual Cost</th>
                  <th className="text-end">Selling Price</th>
                </tr>
              </thead>
              <tbody>
                {mappedBatches.map(({ batch, item }, idx) => (
                  <tr key={`${batch.id}-${item.id || idx}`}>
                    <td>
                      <span className="badge bg-light text-dark border">{batch.batchNo}</span>
                      <div className="text-muted fs-10 mt-1">{batch.purchaseDate}</div>
                    </td>
                    <td className="fw-semibold text-dark">{batch.supplierName}</td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border">
                        {item.remainingQty} units
                      </span>
                    </td>
                    <td className="text-end">
                      ₹{Number(item.purchasePrice || 0).toFixed(2)}
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-secondary border">{batch.expensePercent}%</span>
                    </td>
                    <td className="text-end fw-bold text-dark">
                      ₹
                      {Number(
                        item.actualCost ||
                          Number(item.purchasePrice || 0) +
                            (Number(item.purchasePrice || 0) * batch.expensePercent) / 100
                      ).toFixed(2)}
                    </td>
                    <td className="text-end fw-semibold text-dark">
                      ₹{Number(item.sellingPrice || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const fetchProducts = useCallback(async () => {
    try {
      const currentBiz = businessId || getActiveBusinessId();
      const res = await api.get<any[]>("/products", { business_id: currentBiz });
      if (Array.isArray(res) && res.length > 0) {
        const mapped: ProductItem[] = res.map((p: any, idx: number) => ({
          id: p.id,
          sku: p.sku || `PT00${idx + 1}`,
          product: p.name,
          productImage: p.image_url || productImages[idx % productImages.length],
          category: p.category_name || (p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : "General"),
          brand: p.brand || "Grow Naturals",
          price: `₹${Number(p.selling_price || p.sale_price || 0).toLocaleString("en-IN")}`,
          unit: p.unit || "Pc",
          qty: String(p.stock_quantity ?? 0),
          createdby: p.business_name || "Admin",
          img: userAvatars[idx % userAvatars.length],
          raw: p,
        }));
        setProducts(mapped);

        // Extract brands
        const brandSet = new Set<string>();
        mapped.forEach((item) => {
          if (item.brand) brandSet.add(item.brand);
        });
        setBrands(Array.from(brandSet));
      } else {
        setProducts([]);
        setBrands([]);
      }
    } catch (err) {
      console.warn("Failed to load products:", err);
      setProducts([]);
      setBrands([]);
    }
  }, [businessId]);

  const fetchCategories = useCallback(async () => {
    try {
      const currentBiz = businessId || getActiveBusinessId();
      const res = await api.get<any[]>("/categories", { business_id: currentBiz });
      if (Array.isArray(res) && res.length > 0) {
        setCategories(res);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.warn("Failed to load categories:", err);
      setCategories([]);
    }
  }, [businessId]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/products/${deleteId}`);
      setDeleteId(null);
      await fetchProducts();
    } catch (err: any) {
      console.error("Failed to delete product:", err);
    }
  };

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const filteredProducts = products.filter((item) => {
    if (selectedCategory && item.category !== selectedCategory) {
      return false;
    }
    if (selectedBrand && item.brand !== selectedBrand) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.product.toLowerCase().includes(q);
      const matchSku = item.sku.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      return matchName || matchSku || matchCat || matchBrand;
    }
    return true;
  });

  const route = all_routes;
  const columns = [
    {
      header: "SKU",
      field: "sku",
      key: "sku",
      sortable: true,
    },
    {
      header: "Product",
      field: "product",
      key: "product",
      sortable: true,
      body: (data: ProductItem) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2">
            <img alt="" src={data.productImage} />
          </Link>
          <Link to="#">{data.product}</Link>
        </div>
      ),
    },
    {
      header: "Category",
      field: "category",
      key: "category",
      sortable: true,
    },
    {
      header: "Brand",
      field: "brand",
      key: "brand",
      sortable: true,
    },
    {
      header: "Price",
      field: "price",
      key: "price",
      sortable: true,
    },
    {
      header: "Unit",
      field: "unit",
      key: "unit",
      sortable: true,
    },
    {
      header: "Qty",
      field: "qty",
      key: "qty",
      sortable: true,
    },
    {
      header: "Created By",
      field: "createdby",
      key: "createdby",
      sortable: true,
      body: (data: ProductItem) => (
        <span className="userimgname">
          <Link to="/profile" className="product-img">
            <img alt="" src={data.img} />
          </Link>
          <Link to="/profile">{data.createdby}</Link>
        </span>
      ),
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
            to={`${all_routes.editproduct}?id=${row.id || ""}`}
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
    {
      header: "Add Batch",
      field: "addBatch",
      key: "addBatch",
      sortable: false,
      body: (row: ProductItem) => (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenBatchModal(row);
          }}
          title="Map or select purchase batch"
        >
          <Plus size={13} /> Add Batch
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Product List</h4>
                <h6>Manage your products</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon />
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link to={route.addproduct} className="btn btn-primary">
                <i className="ti ti-circle-plus me-1"></i>
                Add Product
              </Link>
            </div>
            <div className="page-btn import">
              <Link
                to="#"
                className="btn btn-secondary color"
                data-bs-toggle="modal"
                data-bs-target="#view-notes"
              >
                <i className="feather icon-download feather me-2" />
                Import Product
              </Link>
            </div>
          </div>
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
                    {selectedCategory ? selectedCategory : "Category"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${!selectedCategory ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCategory(null);
                        }}
                      >
                        All Categories
                      </Link>
                    </li>
                    {categories.map((c) => (
                      <li key={c.id}>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${selectedCategory === c.name ? "active" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedCategory(c.name);
                          }}
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="dropdown me-2">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    {selectedBrand ? selectedBrand : "Brand"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${!selectedBrand ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedBrand(null);
                        }}
                      >
                        All Brands
                      </Link>
                    </li>
                    {brands.map((b, idx) => (
                      <li key={idx}>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${selectedBrand === b ? "active" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedBrand(b);
                          }}
                        >
                          {b}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body">
              {/* /Filter */}
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={filteredProducts}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={filteredProducts.length}
                  searchQuery={searchQuery}
                  selectionMode="checkbox"
                  selection={selectedProducts}
                  onSelectionChange={(e: any) => setSelectedProducts(e.value)}
                  expandedRows={expandedRows}
                  onRowToggle={(e: any) => setExpandedRows(e.data)}
                  rowExpansionTemplate={rowExpansionTemplate}
                  showExpander={true}
                  onRowClick={(e: any) => {
                    const rowId = e.data.id;
                    setExpandedRows((prev: any) => {
                      if (prev && prev[rowId]) {
                        const next = { ...prev };
                        delete next[rowId];
                        return next;
                      }
                      return { ...prev, [rowId]: true };
                    });
                  }}
                />
              </div>
            </div>
          </div>
          {/* /product list */}
          <Brand />
        </div>
      </div>
      <DeleteModal onConfirm={handleDelete} />

      {/* Add Batch Selection Modal */}
      {addBatchModalOpen && selectedProductForBatch && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light">
                <div>
                  <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                    <Package size={20} className="text-secondary" />
                    Select Purchase Batch for Product
                  </h5>
                  <span className="text-muted fs-12">
                    Mapping product: <strong>{selectedProductForBatch.product}</strong> ({selectedProductForBatch.sku})
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setAddBatchModalOpen(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                {availableBatches.length === 0 ? (
                  <div className="text-center py-4">
                    <Package size={42} className="text-muted mb-2 opacity-50" />
                    <h6 className="fw-bold text-muted">No Batches Exist</h6>
                    <p className="text-muted fs-13 mb-3">
                      No purchase batches have been created yet on the Purchase page.
                      You can create one now or proceed to Add Product with manual expense % entry.
                    </p>
                    <div className="d-flex justify-content-center gap-2">
                      <Link
                        to="/purchase-list"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setAddBatchModalOpen(false)}
                      >
                        Create Batch on Purchase Page
                      </Link>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={handleProceedWithBatch}
                      >
                        Proceed with Manual Entry
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white border-end-0">
                          <Search size={14} className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Search batch name, supplier, or date..."
                          value={batchSearchTerm}
                          onChange={(e) => setBatchSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="table-responsive border rounded-3">
                      <table className="table table-hover align-middle mb-0 fs-13">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "40px" }}></th>
                            <th>Batch Name</th>
                            <th>Date</th>
                            <th>Supplier</th>
                            <th className="text-center">Expense %</th>
                            <th className="text-end">Total Purchase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableBatches
                            .filter(
                              (b) =>
                                !batchSearchTerm ||
                                b.batchNo.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
                                b.supplierName.toLowerCase().includes(batchSearchTerm.toLowerCase())
                            )
                            .map((b) => (
                              <tr
                                key={b.id}
                                style={{ cursor: "pointer" }}
                                className={selectedBatchId === b.id ? "table-active" : ""}
                                onClick={() => setSelectedBatchId(b.id)}
                              >
                                <td>
                                  <input
                                    type="radio"
                                    name="selectedBatch"
                                    className="form-check-input"
                                    checked={selectedBatchId === b.id}
                                    onChange={() => setSelectedBatchId(b.id)}
                                  />
                                </td>
                                <td>
                                  <span className="pb-batch-badge">{b.batchNo}</span>
                                </td>
                                <td className="text-secondary">{b.purchaseDate}</td>
                                <td className="fw-semibold text-dark">{b.supplierName}</td>
                                <td className="text-center">
                                  <span className="pb-expense-badge">{b.expensePercent}%</span>
                                </td>
                                <td className="text-end fw-semibold">
                                  ₹{Number(b.totalPurchaseValue).toLocaleString("en-IN")}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 p-2 bg-light rounded border fs-12 text-muted d-flex align-items-center gap-2">
                      <Info size={16} className="text-secondary flex-shrink-0" />
                      <span>
                        Selecting this batch will auto-fetch its <strong>Expense %</strong> into Step 3
                        (Pricing &amp; Tax) of Add Product, with real-time actual cost &amp; selling price calculations.
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setAddBatchModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary d-inline-flex align-items-center gap-1"
                  onClick={handleProceedWithBatch}
                  disabled={availableBatches.length > 0 && !selectedBatchId}
                >
                  Proceed to Add Product <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductList;
