import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import { api, getActiveBusinessId } from "../../services/api";

const ExpenseCategory = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Add form state
  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");

  // Edit form state
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = getActiveBusinessId();
      const res = await api.get<any[]>("/expenses/categories", { business_id: businessId });
      if (Array.isArray(res)) {
        const mapped = res.map((cat: any) => ({
          id: cat.id,
          categoryName: cat.name,
          description: cat.description || "-",
          status: "Active",
          raw: cat,
        }));
        setCategories(mapped);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.warn("Failed to load expense categories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleEditClick = (row: any) => {
    const raw = row.raw || row;
    setEditingCategory(raw);
    setEditName(raw.name || "");
    setEditDescription(raw.description || "");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!addName) return;
      const businessId = getActiveBusinessId();
      await api.post("/expenses/categories", {
        business_id: businessId,
        name: addName,
        description: addDescription,
      });

      const modalEl = document.getElementById("add-units");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      setAddName("");
      setAddDescription("");
      await fetchCategories();
    } catch (err) {
      console.error("Failed to add expense category:", err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await api.put(`/expenses/categories/${editingCategory.id}`, {
        name: editName,
        description: editDescription,
      });

      const modalEl = document.getElementById("edit-units");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      await fetchCategories();
    } catch (err) {
      console.error("Failed to update expense category:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/expenses/categories/${deleteId}`);
      setDeleteId(null);
      await fetchCategories();
    } catch (err) {
      console.error("Failed to delete expense category:", err);
    }
  };

  const columns = [
    {
      header: "CategoryName",
      field: "categoryName",
    },
    {
      header: "Description",
      field: "description",
    },
    {
      header: "Status",
      field: "status",
      body: () => (
        <span
          className="badge badge-success d-inline-flex align-items-center badge-xs"
        >
          <i className="ti ti-point-filled me-1" />
          Active
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
              className="me-2 p-2 mb-0"
              data-bs-toggle="modal"
              data-bs-target="#edit-units"
              onClick={() => handleEditClick(row)}
            >
              <i className="ti ti-edit" />
            </Link>
            <Link
              className="me-0 confirm-text p-2 mb-0"
              data-bs-toggle="modal"
              data-bs-target="#delete-modal"
              to="#"
              onClick={() => setDeleteId(row.id)}
            >
              <i className="ti ti-trash" />
            </Link>
          </div>
        </div>
      ),
      sortable: false,
    },
  ];

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const filteredCategories = categories.filter((cat) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!cat.categoryName.toLowerCase().includes(q) && !cat.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (statusFilter !== "all" && cat.status !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Expense Category</h4>
                <h6>Manage your expense categories</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <li onClick={() => fetchCategories()}>
                <RefreshIcon />
              </li>
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#add-units"
                className="btn btn-primary"
              >
                <i className="feather icon-plus-circle me-2" />
                Add Expense Category
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
                    Select Status: {statusFilter === "all" ? "All" : statusFilter}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setStatusFilter("all")}
                      >
                        All
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setStatusFilter("Active")}
                      >
                        Active
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setStatusFilter("Inactive")}
                      >
                        Inactive
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
                  data={filteredCategories}
                  totalRecords={filteredCategories.length}
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

      {/* Add Expense Category Modal */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Add Expense Category</h4>
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
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Category<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={addName}
                            onChange={(e) => setAddName(e.target.value)}
                            placeholder="e.g. Nursery Maintenance, Fertilizer"
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
                            placeholder="Description"
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                          <span className="status-label">Status</span>
                          <input
                            type="checkbox"
                            id="user1"
                            className="check"
                            defaultChecked
                          />
                          <label htmlFor="user1" className="checktoggle" />
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
                      Add Expense Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Expense Category Modal */}
      <div className="modal fade" id="edit-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Edit Expense Category</h4>
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
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Category<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
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
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                          <span className="status-label">Status</span>
                          <input
                            type="checkbox"
                            id="user-edit"
                            className="check"
                            defaultChecked
                          />
                          <label htmlFor="user-edit" className="checktoggle" />
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
    </div>
  );
};

export default ExpenseCategory;
