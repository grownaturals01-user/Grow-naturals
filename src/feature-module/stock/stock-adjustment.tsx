import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import DeleteModal from "../../components/delete-modal";
import CommonSelect from "../../components/select/common-select";
import TableTopHead from "../../components/table-top-head";
import CommonFooter from "../../components/footer/commonFooter";
import { stockImg02, user04 } from "../../utils/imagepath";
import { api, getActiveBusinessId } from "../../services/api";

const StockAdjustment = () => {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // Form states for Add Adjustment
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [adjustmentType, setAdjustmentType] = useState<any>({ label: "Addition (+)", value: "addition" });
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustNotes, setAdjustNotes] = useState<string>("");

  // View notes modal
  const [activeNotes, setActiveNotes] = useState<string>("");
  const [deleteAdjustmentId, setDeleteAdjustmentId] = useState<string | null>(null);

  const activeBusiness = getActiveBusinessId();

  const fetchAdjustments = useCallback(async () => {
    try {
      const data = await api.get('/stock-adjustments', { business_id: activeBusiness });
      const mapped = (Array.isArray(data) ? data : []).map((adj: any) => ({
        id: adj.id,
        warehouse: adj.business_id === 'nikhlesh-nursery' ? 'Nikhlesh Nursery Main Yard' : 'Grow Naturals Central Depot',
        store: adj.business_name || (adj.business_id === 'nikhlesh-nursery' ? 'Nikhlesh Nursery' : 'Grow Naturals'),
        product: {
          name: adj.product_name || 'Product',
          sku: adj.product_sku || '',
          image: adj.product_image || stockImg02,
        },
        date: adj.created_at ? new Date(adj.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        person: {
          name: adj.user_name || 'Store Manager',
          image: user04,
        },
        qty: adj.quantity_change > 0 ? `+${adj.quantity_change}` : `${adj.quantity_change}`,
        notes: adj.notes || '',
        raw: adj,
      }));
      setAdjustments(mapped);
    } catch (err) {
      console.error("Failed to fetch stock adjustments:", err);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchAdjustments();

    // Fetch products
    api.get('/products', { business_id: activeBusiness }).then((res) => {
      setProducts(Array.isArray(res) ? res : []);
    }).catch(() => {});

    // Fetch warehouses
    api.get('/warehouses', { business_id: activeBusiness }).then((res) => {
      setWarehouses(Array.isArray(res) ? res : []);
    }).catch(() => {});
  }, [fetchAdjustments, activeBusiness]);

  const productOptions = products.map((p: any) => ({
    label: `${p.name} (Cur. Stock: ${p.stock_quantity})`,
    value: p.id,
    product: p,
  }));

  const warehouseOptions = warehouses.length > 0
    ? warehouses.map((w: any) => ({ label: w.name, value: w.id }))
    : [
        { label: "Grow Naturals Central Depot", value: "wh-gn-central" },
        { label: "Nikhlesh Nursery Main Yard", value: "wh-nn-yard" },
      ];

  const typeOptions = [
    { label: "Addition (+)", value: "addition" },
    { label: "Subtraction (-)", value: "subtraction" },
  ];

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert("Please select a product");
      return;
    }
    if (!adjustQty || adjustQty <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    try {
      await api.post('/stock-adjustments', {
        business_id: activeBusiness,
        product_id: selectedProduct.value,
        quantity: adjustQty,
        adjustment_type: adjustmentType?.value || 'addition',
        notes: adjustNotes || (adjustmentType?.value === 'addition' ? `Stock inward adjustment (+${adjustQty})` : `Damage / shrinkage write-off (-${adjustQty})`),
      });

      setSelectedProduct(null);
      setAdjustQty(1);
      setAdjustNotes("");
      fetchAdjustments();

      const closeBtn = document.querySelector('#add-stock-adjustment .close') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || "Failed to create stock adjustment");
    }
  };

  const handleDelete = async () => {
    if (!deleteAdjustmentId) return;
    try {
      await api.delete(`/stock-adjustments/${deleteAdjustmentId}`);
      setDeleteAdjustmentId(null);
      fetchAdjustments();
      const closeBtn = document.querySelector('#delete-modal [data-bs-dismiss="modal"]') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to revert stock adjustment');
    }
  };

  const filteredAdjustments = adjustments.filter((item) => {
    if (!searchQuery) return true;
    return (
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.store.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const columns = [
    { header: "Warehouse", field: "warehouse", key: "warehouse" },
    { header: "Store", field: "store", key: "store" },
    {
      header: "Product",
      field: "product",
      key: "product",
      body: (data: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2">
            <img src={data?.product?.image} alt="product" />
          </Link>
          <Link to="#">{data?.product?.name}</Link>
        </div>
      ),
    },
    { header: "Date", field: "date", key: "date" },
    {
      header: "Person",
      field: "person",
      key: "person",
      body: (data: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2">
            <img src={data?.person?.image} alt="user" />
          </Link>
          <Link to="#">{data?.person?.name}</Link>
        </div>
      ),
    },
    {
      header: "Qty",
      field: "qty",
      key: "qty",
      body: (data: any) => (
        <span className={`fw-bold ${String(data?.qty).startsWith('+') ? 'text-success' : 'text-danger'}`}>
          {data?.qty}
        </span>
      ),
    },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: any) => (
        <div className="d-flex align-items-center edit-delete-action">
          <Link
            className="me-2 border rounded d-flex align-items-center p-2"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#view-notes"
            onClick={() => setActiveNotes(row.notes || "No notes provided for this adjustment.")}
          >
            <i className="feather icon-file-text" />
          </Link>
          <Link
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            className="p-2 border rounded d-flex align-items-center"
            to="#"
            onClick={() => setDeleteAdjustmentId(row.id)}
          >
            <i className="feather icon-trash-2" />
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
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Stock Adjustment</h4>
                <h6>Manage your stock adjustments</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-stock-adjustment"
              >
                <i className="ti ti-circle-plus me-1" />
                Add Adjustment
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
                    Warehouse
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Grow Naturals Central Depot
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Nikhlesh Nursery Main Yard
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={filteredAdjustments}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={filteredAdjustments.length}
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

      {/* Add Adjustment */}
      <div className="modal fade" id="add-stock-adjustment">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Adjustment</h4>
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
            <form onSubmit={handleAddAdjustment}>
              <div className="modal-body">
                <div className="search-form mb-3">
                  <label className="form-label">
                    Product<span className="text-danger ms-1">*</span>
                  </label>
                  <CommonSelect
                    className="w-100"
                    options={productOptions}
                    value={selectedProduct}
                    onChange={(e: any) => setSelectedProduct(e)}
                    placeholder="Select Product"
                    filter={true}
                  />
                </div>
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Adjustment Type<span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={typeOptions}
                        value={adjustmentType}
                        onChange={(e: any) => setAdjustmentType(e)}
                        placeholder="Select Type"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Quantity<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Warehouse<span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={warehouseOptions}
                        value={selectedWarehouse || warehouseOptions[0]}
                        onChange={(e: any) => setSelectedWarehouse(e)}
                        placeholder="Select Warehouse"
                        filter={false}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-lg-12">
                  <div>
                    <label className="form-label">
                      Notes<span className="text-danger ms-1">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={adjustNotes}
                      onChange={(e) => setAdjustNotes(e.target.value)}
                      placeholder="Audit note: e.g. Count verification, damaged stock disposal, supplier bonus item"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Adjustment */}

      {/* View Notes */}
      <div className="modal fade" id="view-notes">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Adjustment Notes & Audit</h4>
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
            <div className="modal-body">
              <p className="text-dark fs-14 mb-0">{activeNotes}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* /View Notes */}

      <DeleteModal onConfirm={handleDelete} />
    </div>
  );
};

export default StockAdjustment;
