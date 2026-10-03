import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import DeleteModal from "../../components/delete-modal";
import CommonSelect from "../../components/select/common-select";
import TableTopHead from "../../components/table-top-head";
import CommonFooter from "../../components/footer/commonFooter";
import { api, getActiveBusinessId } from "../../services/api";

const StockTransfer = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedWarehouseFrom, setSelectedWarehouseFrom] = useState("");
  const [selectedWarehouseTo, setSelectedWarehouseTo] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form fields for adding stock transfer
  const [selectedProduct, setSelectedProduct] = useState("");
  const [transferQty, setTransferQty] = useState(1);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const fetchDependencies = useCallback(async () => {
    try {
      const [whRes, prodRes] = await Promise.all([
        api.get<any[]>("/warehouses"),
        api.get<any[]>("/products")
      ]);
      if (Array.isArray(whRes)) setWarehouses(whRes);
      if (Array.isArray(prodRes)) setProducts(prodRes);
    } catch (err) {
      console.warn("Failed to load warehouses/products:", err);
    }
  }, []);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = getActiveBusinessId();
      const res = await api.get<any[]>("/warehouse/transactions", { business_id: businessId });
      if (Array.isArray(res)) {
        const mapped = res.map((tx: any) => ({
          id: tx.id,
          fromWarehouse: tx.business_name ? `${tx.business_name} Depot` : "Main Warehouse",
          toWarehouse: tx.type === "transfer_to_shop" ? "Retail Shop Floor" : tx.buyer_name || "Internal Distribution",
          noOfProducts: 1,
          quantityTransferred: tx.quantity || 0,
          refNumber: tx.reference_no || (tx.id ? tx.id.slice(-6).toUpperCase() : "TR-001"),
          date: tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString("en-IN") : "-",
          productName: tx.product_name || "Product",
          raw: tx,
        }));
        setListData(mapped);
      } else {
        setListData([]);
      }
    } catch (err) {
      console.warn("Failed to load stock transfers:", err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDependencies();
    fetchTransfers();
  }, [fetchDependencies, fetchTransfers]);

  const handleAddTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedProduct) return;
      const businessId = getActiveBusinessId();
      await api.post("/warehouse/transactions", {
        business_id: businessId,
        product_id: selectedProduct,
        type: "transfer_to_shop",
        quantity: Number(transferQty) || 1,
        reference_no: referenceNumber || `TR-${Date.now().toString().slice(-5)}`,
        notes: notes || "Stock transfer from warehouse",
      });

      const modalEl = document.getElementById("add-stock-transfer");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      setReferenceNumber("");
      setNotes("");
      setTransferQty(1);
      await fetchTransfers();
    } catch (err) {
      console.error("Failed to add transfer:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/warehouse/transactions/${deleteId}`);
      setDeleteId(null);
      await fetchTransfers();
    } catch (err) {
      console.error("Failed to delete stock transfer:", err);
    }
  };

  const warehouseFromOptions = [
    { label: "Select Warehouse", value: "" },
    ...warehouses.map((w: any) => ({ label: w.name, value: w.id })),
  ];

  const warehouseToOptions = [
    { label: "Select Destination", value: "" },
    { label: "Retail Shop Floor", value: "shop" },
    { label: "Nursery Display Yard", value: "yard" },
    ...warehouses.map((w: any) => ({ label: w.name, value: w.id })),
  ];

  const productOptions = [
    { label: "Select Product", value: "" },
    ...products.map((p: any) => ({ label: `${p.name} (Stock: ${p.stock_quantity || 0})`, value: p.id })),
  ];

  const columns = [
    { header: "From Warehouse", field: "fromWarehouse", key: "fromWarehouse" },
    { header: "To Warehouse", field: "toWarehouse", key: "toWarehouse" },
    { header: "No of Products", field: "noOfProducts", key: "noOfProducts" },
    {
      header: "Quantity Transfered",
      field: "quantityTransferred",
      key: "quantityTransferred",
    },
    { header: "Ref Number", field: "refNumber", key: "refNumber" },
    { header: "Date", field: "date", key: "date" },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: any) => (
        <div className="edit-delete-action d-flex align-items-center justify-content-center">
          <Link
            className="me-2 p-2 d-flex align-items-center justify-content-between border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-stock-transfer"
          >
            <i className="feather icon-edit" />
          </Link>
          <Link
            className="p-2 d-flex align-items-center justify-content-between border rounded"
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

  const filteredTransfers = listData.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !item.fromWarehouse.toLowerCase().includes(q) &&
        !item.toWarehouse.toLowerCase().includes(q) &&
        !item.refNumber.toLowerCase().includes(q) &&
        !item.productName.toLowerCase().includes(q)
      ) {
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
                <h4>Stock Transfer</h4>
                <h6>Manage your stock transfer</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-stock-transfer"
              >
                <i className="ti ti-circle-plus me-1" />
                Add New
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
              <PrimeDataTable
                column={columns}
                data={filteredTransfers}
                rows={rows}
                setRows={setRows}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalRecords={filteredTransfers.length}
                searchQuery={searchQuery}
                selectionMode="checkbox"
                selection={selectedProducts}
                onSelectionChange={(e: any) => setSelectedProducts(e.value)}
              />
            </div>
          </div>
          {/* /product list */}
        </div>
        <CommonFooter />
      </div>

      {/* Add Stock Transfer Modal */}
      <div className="modal fade" id="add-stock-transfer">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Transfer</h4>
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
            <form onSubmit={handleAddTransfer}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Warehouse From{" "}
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={warehouseFromOptions}
                        value={selectedWarehouseFrom}
                        onChange={(e) => setSelectedWarehouseFrom(e.value)}
                        placeholder="Warehouse From"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Warehouse To <span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={warehouseToOptions}
                        value={selectedWarehouseTo}
                        onChange={(e) => setSelectedWarehouseTo(e.value)}
                        placeholder="Warehouse To"
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
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.value)}
                        placeholder="Select Product to Transfer"
                        filter={true}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Transfer Quantity <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={transferQty}
                        onChange={(e) => setTransferQty(Number(e.target.value))}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Reference Number
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="e.g. TR-1001"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="search-form mb-0">
                      <label className="form-label">
                        Notes
                      </label>
                      <textarea
                        className="form-control"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Transfer reason or dispatch notes"
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
                  Create Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Stock */}

      <DeleteModal onConfirm={handleDelete} />
    </>
  );
};

export default StockTransfer;
