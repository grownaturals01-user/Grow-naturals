import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import SearchFromApi from "../../components/data-table/search";
import DeleteModal from "../../components/delete-modal";
import { qrCodeImage, stockImg01 } from "../../utils/imagepath";
import CommonSelect from "../../components/select/common-select";
import CommonDatePicker from "../../components/date-picker/common-date-picker";
import { Editor } from "primereact/editor";
import { api, getActiveBusinessId } from "../../services/api";

const PurchaseReturns = () => {
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<any>({ label: "Received", value: "Received" });
  const [date, setDate] = useState<Date | null>(new Date());
  const [text, setText] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [selectedProductItem, setSelectedProductItem] = useState<any>(null);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnItems, setReturnItems] = useState<any[]>([]);

  // Edit / Delete states
  const [editingReturn, setEditingReturn] = useState<any>(null);
  const [editStatus, setEditStatus] = useState<any>({ label: "Received", value: "Received" });
  const [editNotes, setEditNotes] = useState("");
  const [deleteReturnId, setDeleteReturnId] = useState<string | null>(null);

  const activeBusiness = getActiveBusinessId();

  const fetchReturns = useCallback(async () => {
    try {
      const data = await api.get('/purchase-returns', { business_id: activeBusiness });
      const mapped = (Array.isArray(data) ? data : []).map((r: any) => ({
        id: r.id,
        img: r.items?.[0]?.image_url || stockImg01,
        date: r.return_date ? new Date(r.return_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        supplier: r.supplier_name,
        reference: r.reference_no,
        status: r.status || 'Received',
        grandTotal: `₹${Number(r.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        paid: `₹${Number(r.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        due: '₹0.00',
        paymentStatus: 'Paid',
        raw: r
      }));
      setReturnsList(mapped);
    } catch (err) {
      console.error("Failed to fetch purchase returns:", err);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchReturns();
    // Load suppliers and products for dropdown
    api.get('/suppliers', { business_id: activeBusiness }).then((res) => {
      setSuppliers(Array.isArray(res) ? res : []);
    }).catch(() => {});

    api.get('/products', { business_id: activeBusiness }).then((res) => {
      setProducts(Array.isArray(res) ? res : []);
    }).catch(() => {});
  }, [fetchReturns, activeBusiness]);

  const supplierOptions = suppliers.map((s: any) => ({
    label: s.name,
    value: s.id,
  }));

  const productOptions = products.map((p: any) => ({
    label: `${p.name} (Stock: ${p.stock_quantity}) - ₹${p.cost_price || p.sale_price}`,
    value: p.id,
    product: p
  }));

  const statusOptions = [
    { label: "Received", value: "Received" },
    { label: "Pending", value: "Pending" },
    { label: "Cancelled", value: "Cancelled" },
  ];

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const handleAddItemToReturn = () => {
    if (!selectedProductItem) return;
    const p = selectedProductItem.product;
    const existingIndex = returnItems.findIndex((it) => it.product_id === p.id);
    if (existingIndex >= 0) {
      const updated = [...returnItems];
      updated[existingIndex].quantity += returnQty;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setReturnItems(updated);
    } else {
      setReturnItems([
        ...returnItems,
        {
          product_id: p.id,
          product_name: p.name,
          quantity: returnQty,
          unit_price: Number(p.cost_price || p.sale_price || 0),
          total: returnQty * Number(p.cost_price || p.sale_price || 0),
          image_url: p.image_url || stockImg01
        }
      ]);
    }
    setReturnQty(1);
    setSelectedProductItem(null);
  };

  const handleRemoveItem = (index: number) => {
    setReturnItems(returnItems.filter((_, idx) => idx !== index));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (returnItems.length === 0) {
      alert("Please add at least one product to return");
      return;
    }
    const supName = selectedSupplier?.label || 'Supplier';
    const supId = selectedSupplier?.value || null;

    try {
      await api.post('/purchase-returns', {
        business_id: activeBusiness,
        supplier_id: supId,
        supplier_name: supName,
        reference_no: referenceNo || `PRET-${Date.now().toString().slice(-6)}`,
        return_date: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: selectedStatus?.value || 'Received',
        notes: text,
        items: returnItems
      });

      // Reset form
      setReturnItems([]);
      setReferenceNo("");
      setText("");
      fetchReturns();

      const closeBtn = document.querySelector('#add-sales-new .close') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to create purchase return');
    }
  };

  const handleStartEdit = (row: any) => {
    const r = row.raw;
    setEditingReturn(r);
    setEditStatus(statusOptions.find((o) => o.value === r.status) || { label: r.status, value: r.status });
    setEditNotes(r.notes || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReturn) return;
    try {
      await api.put(`/purchase-returns/${editingReturn.id}`, {
        status: editStatus?.value || editStatus?.label || 'Received',
        notes: editNotes
      });
      setEditingReturn(null);
      fetchReturns();
      const closeBtn = document.querySelector('#edit-sales-new .close') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to update return');
    }
  };

  const handleDelete = async () => {
    if (!deleteReturnId) return;
    try {
      await api.delete(`/purchase-returns/${deleteReturnId}`);
      setDeleteReturnId(null);
      fetchReturns();
      const closeBtn = document.querySelector('#delete-modal [data-bs-dismiss="modal"]') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to delete return');
    }
  };

  const filteredReturns = returnsList.filter((item) => {
    if (!searchQuery) return true;
    return (
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reference.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const columns = [
    {
      header: "Product Image",
      field: "img",
      body: (row: any) => (
        <Link to="#" className="avatar avatar-md me-2">
          <img src={row?.img} alt="product" />
        </Link>
      ),
    },
    {
      header: "Date",
      field: "date",
    },
    {
      header: "Supplier Name",
      field: "supplier",
    },
    {
      header: "Reference",
      field: "reference",
    },
    {
      header: "Status",
      field: "status",
      body: (row: any) => (
        <span
          className={`badges status-badge fs-10 p-1 px-2 rounded-1 ${
            row?.status === "Pending"
              ? "badge-pending"
              : row?.status === "Cancelled"
                ? "bg-danger"
                : "bg-success"
          }`}
        >
          {row?.status}
        </span>
      ),
    },
    {
      header: "Total",
      field: "grandTotal",
    },
    {
      header: "Paid",
      field: "paid",
    },
    {
      header: "Due",
      field: "due",
    },
    {
      header: "Payment Status",
      field: "paymentStatus",
      body: (row: any) => (
        <span className="p-1 pe-2 rounded-1 fs-10 text-success bg-success-transparent">
          <i className="ti ti-point-filled me-1 fs-11" /> {row?.paymentStatus}
        </span>
      ),
    },
    {
      header: "Actions",
      field: "actions",
      key: "actions",
      body: (row: any) => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <Link
              to="#"
              className="me-2 p-2"
              data-bs-toggle="modal"
              data-bs-target="#edit-sales-new"
              onClick={() => handleStartEdit(row)}
            >
              <i className="ti ti-edit" />
            </Link>
            <Link
              data-bs-toggle="modal"
              data-bs-target="#delete-modal"
              className="p-2"
              to="#"
              onClick={() => setDeleteReturnId(row.id)}
            >
              <i className="ti ti-trash" />
            </Link>
          </div>
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
                <h4>Purchase Returns List</h4>
                <h6>Manage your Purchase Returns</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-sales-new"
              >
                <i className="ti ti-circle-plus me-1" />
                Add Purchase Return
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
                    Status
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Received
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Pending
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
                  data={filteredReturns}
                  totalRecords={filteredReturns.length}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
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

      {/* Add popup */}
      <div className="modal fade" id="add-sales-new">
        <div className="modal-dialog add-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Purchase Return</h4>
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
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-4 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Supplier Name<span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        filter={false}
                        className="w-100"
                        options={supplierOptions}
                        value={selectedSupplier}
                        onChange={(opt: any) => setSelectedSupplier(opt)}
                        placeholder="Select Supplier"
                      />
                    </div>
                  </div>
                  <div className="col-lg-4 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Date<span className="text-danger ms-1">*</span>
                      </label>
                      <div className="input-groupicon calender-input">
                        <i className="info-img feather icon-calendar" />
                        <CommonDatePicker
                          appendTo={"self"}
                          value={date}
                          onChange={setDate}
                          className="w-100"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-sm-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Reference No
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. PRET-001"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-8 col-sm-8 col-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Select Product to Return<span className="text-danger ms-1">*</span>
                      </label>
                      <CommonSelect
                        filter={true}
                        className="w-100"
                        options={productOptions}
                        value={selectedProductItem}
                        onChange={(opt: any) => setSelectedProductItem(opt)}
                        placeholder="Choose product from catalogue"
                      />
                    </div>
                  </div>
                  <div className="col-lg-2 col-sm-2 col-6">
                    <div className="mb-3">
                      <label className="form-label">Qty</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={returnQty}
                        onChange={(e) => setReturnQty(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>
                  </div>
                  <div className="col-lg-2 col-sm-2 col-6 d-flex align-items-end mb-3">
                    <button
                      type="button"
                      className="btn btn-secondary w-100"
                      onClick={handleAddItemToReturn}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Return Items Table */}
                <div className="modal-body-table mt-2 mb-3">
                  <div className="table-responsive no-pagination">
                    <table className="table datanew bg-light-9 p-3">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-3 text-muted">
                              No items selected yet. Select a product and click "+ Add".
                            </td>
                          </tr>
                        ) : (
                          returnItems.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.product_name}</td>
                              <td>{item.quantity}</td>
                              <td>₹{Number(item.unit_price).toFixed(2)}</td>
                              <td>₹{Number(item.total).toFixed(2)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveItem(idx)}
                                >
                                  <i className="ti ti-trash" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="row">
                  <div className="col-lg-6 col-12">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        filter={false}
                        className="w-100"
                        options={statusOptions}
                        value={selectedStatus}
                        onChange={(opt: any) => setSelectedStatus(opt)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Reason for return, damaged packaging, supplier agreement, etc."
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
                  Submit Return
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add popup */}

      {/* Edit popup */}
      <div className="modal fade" id="edit-sales-new">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Edit Purchase Return</h4>
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
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <CommonSelect
                    filter={false}
                    className="w-100"
                    options={statusOptions}
                    value={editStatus}
                    onChange={(opt: any) => setEditStatus(opt)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit popup */}

      <DeleteModal onConfirm={handleDelete} />
    </div>
  );
};

export default PurchaseReturns;
