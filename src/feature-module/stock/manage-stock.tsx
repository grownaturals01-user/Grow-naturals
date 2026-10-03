import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import DeleteModal from "../../components/delete-modal";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import TableTopHead from "../../components/table-top-head";
import { stockImg02 } from "../../utils/imagepath";
import CommonSelect from "../../components/select/common-select";
import CommonFooter from "../../components/footer/commonFooter";
import { api, getActiveBusinessId } from "../../services/api";

const ManageStock = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add stock state
  const [addSelectedProduct, setAddSelectedProduct] = useState("");
  const [addQty, setAddQty] = useState(1);

  // Edit stock state
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editQty, setEditQty] = useState(0);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = getActiveBusinessId();
      const [prodRes, whRes] = await Promise.all([
        api.get<any[]>("/products", { business_id: businessId }),
        api.get<any[]>("/warehouses", { business_id: businessId })
      ]);

      if (Array.isArray(whRes)) setWarehouses(whRes);

      if (Array.isArray(prodRes)) {
        setProducts(prodRes);
        const mapped = prodRes.map((p: any) => ({
          id: p.id,
          warehouse: p.business_name ? `${p.business_name} Depot` : "Central Warehouse",
          store: p.business_name ? `${p.business_name} Retail` : "Main Store",
          product: {
            name: p.name,
            image: p.image_url || stockImg02,
          },
          date: p.updated_at ? new Date(p.updated_at).toLocaleDateString("en-IN") : "-",
          person: {
            name: "Inventory Manager",
            image: stockImg02,
          },
          qty: p.stock_quantity || 0,
          raw: p,
        }));
        setListData(mapped);
      } else {
        setListData([]);
      }
    } catch (err) {
      console.warn("Failed to load stock data:", err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleEditClick = (row: any) => {
    const raw = row.raw || row;
    setEditingItem(raw);
    setEditQty(raw.stock_quantity || 0);
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!addSelectedProduct) return;
      const target = products.find((p) => p.id === addSelectedProduct);
      if (!target) return;
      const newStock = Number(target.stock_quantity || 0) + Number(addQty);

      await api.put(`/products/${addSelectedProduct}`, {
        stock_quantity: newStock,
      });

      const modalEl = document.getElementById("add-stock");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      setAddQty(1);
      await fetchStock();
    } catch (err) {
      console.error("Failed to add stock:", err);
    }
  };

  const handleEditStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await api.put(`/products/${editingItem.id}`, {
        stock_quantity: Number(editQty),
      });

      const modalEl = document.getElementById("edit-stock");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      await fetchStock();
    } catch (err) {
      console.error("Failed to update stock:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/products/${deleteId}`);
      setDeleteId(null);
      await fetchStock();
    } catch (err) {
      console.error("Failed to delete stock item:", err);
    }
  };

  const productOptions = [
    { label: "Select Product", value: "" },
    ...products.map((p: any) => ({
      label: `${p.name} (Current: ${p.stock_quantity || 0})`,
      value: p.id,
    })),
  ];

  const warehouseOptions = [
    { label: "Select Warehouse", value: "" },
    ...warehouses.map((w: any) => ({ label: w.name, value: w.id })),
  ];

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
            <img src={data?.product?.image || stockImg02} alt="product" />
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
            <img src={data?.person?.image || stockImg02} alt="person" />
          </Link>
          <Link to="#">{data?.person?.name || "Inventory Manager"}</Link>
        </div>
      ),
    },
    { header: "Qty", field: "qty", key: "qty" },
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
            data-bs-target="#edit-stock"
            onClick={() => handleEditClick(row)}
          >
            <i className="feather icon-edit" />
          </Link>
          <Link
            className="p-2 border rounded d-flex align-items-center"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            onClick={() => setDeleteId(row.id)}
          >
            <i className="feather icon-trash-2" />
          </Link>
        </div>
      ),
    },
  ];

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const filteredStock = listData.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.product.name.toLowerCase().includes(q) && !item.warehouse.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Manage Stock</h4>
                <h6>Manage your stock</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-stock"
              >
                <i className="ti ti-circle-plus me-1" />
                Add Stock
              </Link>
            </div>
          </div>
          {/* /product list */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi
                callback={handleSearch}
                rows={rows}
                setRows={setRows}
              />
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={filteredStock}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={filteredStock.length}
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

      {/* Add Stock Modal */}
      <div className="modal fade" id="add-stock">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Stock</h4>
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
            <form onSubmit={handleAddStock}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Warehouse <span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={warehouseOptions}
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.value)}
                        placeholder="Select Warehouse"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Product <span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={productOptions}
                        value={addSelectedProduct}
                        onChange={(e) => setAddSelectedProduct(e.value)}
                        placeholder="Select Product"
                        filter={true}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Quantity to Add <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={addQty}
                        onChange={(e) => setAddQty(Number(e.target.value))}
                        min="1"
                        required
                      />
                    </div>
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
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Stock Modal */}
      <div className="modal fade" id="edit-stock">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Edit Stock: {editingItem?.name}</h4>
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
            <form onSubmit={handleEditStock}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Product Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingItem?.name || ""}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Stock Quantity <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={editQty}
                        onChange={(e) => setEditQty(Number(e.target.value))}
                        min="0"
                        required
                      />
                    </div>
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
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <DeleteModal onConfirm={handleDelete} />
    </>
  );
};

export default ManageStock;
