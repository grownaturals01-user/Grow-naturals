import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import CommonDatePicker from "../../components/date-picker/common-date-picker";
import CommonSelect from "../../components/select/common-select";
import DeleteModal from "../../components/delete-modal";
import { Editor } from "primereact/editor";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";

const ExpensesList = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add modal state
  const [addExpenseName, setAddExpenseName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addCategory, setAddCategory] = useState<string>("");
  const [addDate, setAddDate] = useState<Date | null>(new Date());
  const [addAmount, setAddAmount] = useState("");
  const [addStatus, setAddStatus] = useState("Approved");

  // Edit modal state
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editExpenseName, setEditExpenseName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editDate, setEditDate] = useState<Date | null>(new Date());
  const [editAmount, setEditAmount] = useState("");
  const [editStatus, setEditStatus] = useState("Approved");

  const statusOptions = [
    { value: "Approved", label: "Approved" },
    { value: "Pending", label: "Pending" },
  ];

  // Fetch categories
  useEffect(() => {
    const businessId = getActiveBusinessId();
    api.get<any[]>("/expenses/categories", { business_id: businessId })
      .then((res) => {
        if (Array.isArray(res)) setCategories(res);
      })
      .catch((err) => console.warn(err));
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = getActiveBusinessId();
      const params: any = { business_id: businessId };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategoryFilter !== "all") params.category_id = selectedCategoryFilter;

      const res = await api.get<any[]>("/expenses", params);
      if (Array.isArray(res)) {
        const mapped = res.map((e: any) => ({
          id: e.id,
          reference: e.reference_no || (e.id ? e.id.slice(-6).toUpperCase() : "EXP-001"),
          categoryName: e.category_name || "General",
          description: e.notes || e.recipient || "-",
          date: e.date ? new Date(e.date).toLocaleDateString("en-IN") : "-",
          amount: `₹${Number(e.amount || 0).toLocaleString("en-IN")}`,
          status: "Approved",
          raw: e,
        }));
        setExpenses(mapped);
      } else {
        setExpenses([]);
      }
    } catch (err) {
      console.warn("Failed to load expenses:", err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategoryFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleEditClick = (row: any) => {
    const raw = row.raw || row;
    setEditingExpense(raw);
    setEditExpenseName(raw.recipient || raw.reference_no || "");
    setEditDescription(raw.notes || "");
    setEditCategory(raw.category_id || "");
    setEditDate(raw.date ? new Date(raw.date) : new Date());
    setEditAmount(String(raw.amount || ""));
    setEditStatus("Approved");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!addAmount || isNaN(Number(addAmount))) return;
      const businessId = getActiveBusinessId();
      await api.post("/expenses", {
        business_id: businessId,
        recipient: addExpenseName || "Expense",
        notes: addDescription,
        category_id: addCategory || (categories[0]?.id || null),
        amount: Number(addAmount),
        date: addDate ? addDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        payment_method: "cash",
      });

      const modalEl = document.getElementById("add-units");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      setAddExpenseName("");
      setAddDescription("");
      setAddAmount("");
      await fetchExpenses();
    } catch (err) {
      console.error("Failed to add expense:", err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    try {
      await api.put(`/expenses/${editingExpense.id}`, {
        recipient: editExpenseName,
        notes: editDescription,
        category_id: editCategory || null,
        amount: Number(editAmount),
        date: editDate ? editDate.toISOString().split("T")[0] : undefined,
      });

      const modalEl = document.getElementById("edit-units");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      await fetchExpenses();
    } catch (err) {
      console.error("Failed to update expense:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/expenses/${deleteId}`);
      setDeleteId(null);
      await fetchExpenses();
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  const columns = [
    {
      header: "Reference",
      field: "reference",
    },
    {
      header: "CategoryName",
      field: "categoryName",
    },
    {
      header: "Description",
      field: "description",
    },
    {
      header: "Date",
      field: "date",
    },
    {
      header: "Amount",
      field: "amount",
    },
    {
      header: "Status",
      field: "status",
      body: (text: any) => (
        <span
          className={`badges status-badge fs-10 p-1 px-2 rounded-1 ${
            text?.status === "Approved" ? "" : "badge-pending"
          }`}
        >
          {text?.status}
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
            <Link className="me-2 p-2 mb-0" to="#">
              <i className="ti ti-eye" />
            </Link>
            <Link
              to="#"
              className="me-2 p-2 mb-0"
              data-bs-toggle="modal"
              data-bs-target="#edit-units"
              onClick={() => handleEditClick(row)}
            >
              <i className="ti ti-edit" />
            </Link>
            <Link
              className="me-3 confirm-text p-2 mb-0"
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#delete-modal"
              onClick={() => setDeleteId(row.id)}
            >
              <i className="ti ti-trash" />
            </Link>
          </div>
        </div>
      ),
    },
  ];

  const categoryOptionsForSelect = [
    { value: "", label: "Choose Category" },
    ...categories.map((c: any) => ({ value: c.id, label: c.name })),
  ];

  const filteredExpenses = expenses.filter((e) => {
    if (selectedStatusFilter !== "all" && e.status !== selectedStatusFilter) return false;
    return true;
  });

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Expenses</h4>
                <h6>Manage your Expenses</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#add-units"
                className="btn btn-primary"
              >
                <i className="feather icon-plus-circle me-2" />
                Add Expenses
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
                    Category: {selectedCategoryFilter === "all" ? "All" : (categories.find(c => c.id === selectedCategoryFilter)?.name || "All")}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setSelectedCategoryFilter("all")}
                      >
                        All Categories
                      </Link>
                    </li>
                    {categories.map((cat: any) => (
                      <li key={cat.id}>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                          onClick={() => setSelectedCategoryFilter(cat.id)}
                        >
                          {cat.name}
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
                    Status: {selectedStatusFilter === "all" ? "All" : selectedStatusFilter}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setSelectedStatusFilter("all")}
                      >
                        All
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setSelectedStatusFilter("Approved")}
                      >
                        Approved
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setSelectedStatusFilter("Pending")}
                      >
                        Pending
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body pb-0">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={filteredExpenses}
                  totalRecords={filteredExpenses.length}
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
        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - {new Date().getFullYear()} © DreamsPOS. All Right Reserved</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>

        <DeleteModal onConfirm={handleDelete} />
      </div>
      <>
        {/* Add Expense */}
        <div className="modal fade" id="add-units">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content">
                  <div className="modal-header">
                    <div className="page-title">
                      <h4>Add Expense</h4>
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
                        <div className="col-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Expense Name<span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={addExpenseName}
                              onChange={(e) => setAddExpenseName(e.target.value)}
                              placeholder="e.g. Electricity Bill, Fertilizer Transport"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-lg-12">
                          <div className="mb-3 summer-description-box">
                            <label className="form-label">Description</label>
                            <input
                              type="text"
                              className="form-control"
                              value={addDescription}
                              onChange={(e) => setAddDescription(e.target.value)}
                              placeholder="Notes or description"
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Category<span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              className="w-100"
                              options={categoryOptionsForSelect}
                              value={addCategory}
                              onChange={(e: any) => setAddCategory(e.value)}
                              placeholder="Choose"
                              filter={false}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">
                            Date<span className="text-danger ms-1">*</span>
                          </label>
                          <div className="mb-3 date-group mt-0">
                            <div className="input-groupicon calender-input">
                              <i className="feather icon-calendar info-img" />
                              <CommonDatePicker
                                value={addDate}
                                onChange={setAddDate}
                                className="w-100"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Amount (₹)<span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              value={addAmount}
                              onChange={(e) => setAddAmount(e.target.value)}
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Status<span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              className="w-100"
                              options={statusOptions}
                              value={addStatus}
                              onChange={(e: any) => setAddStatus(e.value)}
                              placeholder="Choose"
                              filter={false}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary fs-13 fw-medium p-2 px-3"
                      >
                        Add Expense
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Expense */}
        <div className="modal fade" id="edit-units">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content">
                  <div className="modal-header">
                    <div className="page-title">
                      <h4>Edit Expense</h4>
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
                  <form onSubmit={handleEditSubmit}>
                    <div className="modal-body">
                      <div className="row">
                        <div className="col-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Expense Name<span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={editExpenseName}
                              onChange={(e) => setEditExpenseName(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-lg-12 mb-3">
                          <div className="mb-3 summer-description-box">
                            <label className="form-label">Description</label>
                            <input
                              type="text"
                              className="form-control"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Category<span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              className="w-100"
                              options={categoryOptionsForSelect}
                              value={editCategory}
                              onChange={(e: any) => setEditCategory(e.value)}
                              placeholder="Choose"
                              filter={false}
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">
                            Date<span className="text-danger ms-1">*</span>
                          </label>
                          <div className="mb-3 date-group mt-0">
                            <div className="input-groupicon calender-input">
                              <i className="feather icon-calendar info-img" />
                              <CommonDatePicker
                                value={editDate}
                                onChange={setEditDate}
                                className="w-100"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Amount (₹)<span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Status<span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              className="w-100"
                              options={statusOptions}
                              value={editStatus}
                              onChange={(e: any) => setEditStatus(e.value)}
                              placeholder="Choose"
                              filter={false}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary fs-13 fw-medium p-2 px-3"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

export default ExpensesList;
