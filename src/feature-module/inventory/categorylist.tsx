import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";
import { Edit, Trash2, Layers } from "lucide-react";

interface CategoryItem {
  id: string;
  category: string;
  categoryslug: string;
  description?: string;
  createdon: string;
  status: string;
  product_count: number;
}

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add / Edit Category Modal State
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catStatus, setCatStatus] = useState("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = getActiveBusinessId();
      const res = await api.get<any[]>("/categories", { business_id: businessId });
      if (Array.isArray(res)) {
        const mapped: CategoryItem[] = res.map((c: any) => ({
          id: c.id,
          category: c.name,
          categoryslug: c.slug || c.type || (c.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "general"),
          description: c.description || "",
          createdon: c.created_at
            ? new Date(c.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Today",
          status: c.status || "Active",
          product_count: Number(c.product_count || 0),
        }));
        setCategories(mapped);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.warn("Failed to load categories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setCatName("");
    setCatSlug("");
    setCatDescription("");
    setCatStatus("Active");
    setFormError(null);
  };

  const handleOpenEdit = (item: CategoryItem) => {
    setIsEditMode(true);
    setCurrentId(item.id);
    setCatName(item.category);
    setCatSlug(item.categoryslug);
    setCatDescription(item.description || "");
    setCatStatus(item.status || "Active");
    setFormError(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const businessId = getActiveBusinessId();
      const payload = {
        name: catName.trim(),
        slug: catSlug.trim() || catName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        type: catSlug.trim() || catName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: catDescription.trim(),
        status: catStatus,
        business_id: businessId,
      };

      if (isEditMode && currentId) {
        await api.put(`/categories/${currentId}`, payload);
      } else {
        await api.post("/categories", payload);
      }

      await fetchCategories();
      const modalEl = document.getElementById("category-modal");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
    } catch (err: any) {
      console.error("Failed to save category:", err);
      setFormError(err.message || "Failed to save category. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/categories/${deleteId}`);
      setDeleteId(null);
      await fetchCategories();
      const modalEl = document.getElementById("delete-category-modal");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
    } catch (err: any) {
      console.error("Failed to delete category:", err);
      alert(err.message || "Failed to delete category.");
    }
  };

  const filteredCategories = categories.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.category.toLowerCase().includes(q) ||
        item.categoryslug.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const columns = [
    {
      header: "Category",
      field: "category",
      key: "category",
      sortable: true,
      body: (data: CategoryItem) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-md bg-light-primary text-primary me-2 d-flex align-items-center justify-content-center border rounded">
            <Layers size={18} />
          </div>
          <div>
            <h6 className="fw-semibold mb-0 text-dark">{data.category}</h6>
            {data.description ? (
              <span className="fs-12 text-muted text-truncate d-inline-block" style={{ maxWidth: "200px" }}>
                {data.description}
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      header: "Category Slug",
      field: "categoryslug",
      key: "categoryslug",
      sortable: true,
      body: (data: CategoryItem) => (
        <span className="badge bg-light text-secondary border fs-12 fw-normal">{data.categoryslug}</span>
      ),
    },
    {
      header: "Products",
      field: "product_count",
      key: "product_count",
      sortable: true,
      body: (data: CategoryItem) => (
        <span className="fw-bold text-dark fs-13">{data.product_count} items</span>
      ),
    },
    {
      header: "Created On",
      field: "createdon",
      key: "createdon",
      sortable: true,
    },
    {
      header: "Status",
      field: "status",
      key: "status",
      sortable: true,
      body: (data: CategoryItem) => (
        <span
          className={`badge ${
            data.status === "Active" ? "bg-success" : "bg-danger"
          } fw-medium fs-11 px-2 py-1 rounded-pill`}
        >
          {data.status}
        </span>
      ),
    },
    {
      header: "Actions",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: CategoryItem) => (
        <div className="edit-delete-action d-flex align-items-center">
          <button
            type="button"
            className="me-2 d-flex align-items-center justify-content-center btn btn-sm btn-outline-light border rounded text-primary"
            data-bs-toggle="modal"
            data-bs-target="#category-modal"
            onClick={() => handleOpenEdit(row)}
            title="Edit Category"
            style={{ width: "32px", height: "32px" }}
          >
            <Edit size={16} className="text-primary" />
          </button>
          <button
            type="button"
            className="d-flex align-items-center justify-content-center btn btn-sm btn-outline-light border rounded text-danger"
            data-bs-toggle="modal"
            data-bs-target="#delete-category-modal"
            onClick={() => setDeleteId(row.id)}
            title="Delete Category"
            style={{ width: "32px", height: "32px" }}
          >
            <Trash2 size={16} className="text-danger" />
          </button>
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
                <h4 className="fw-bold">Category</h4>
                <h6>Manage your product categories and classification</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <button
                type="button"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#category-modal"
                onClick={handleOpenAdd}
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add Category
              </button>
            </div>
          </div>

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
                    {statusFilter ? statusFilter : "Status: All"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${!statusFilter ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setStatusFilter(null);
                        }}
                      >
                        All Status
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${statusFilter === "Active" ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setStatusFilter("Active");
                        }}
                      >
                        Active
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${statusFilter === "Inactive" ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setStatusFilter("Inactive");
                        }}
                      >
                        Inactive
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive category-table">
                  <PrimeDataTable
                    column={columns}
                    data={filteredCategories}
                    rows={rows}
                    setRows={setRows}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalRecords={filteredCategories.length}
                    searchQuery={searchQuery}
                    selectionMode="checkbox"
                    selection={selectedProducts}
                    onSelectionChange={(e: any) => setSelectedProducts(e.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add / Edit Category Modal */}
      <div className="modal fade" id="category-modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header border-bottom bg-light px-4 py-3">
              <h5 className="modal-title fw-bold">
                {isEditMode ? "Edit Category" : "Add New Category"}
              </h5>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="modal-body p-4">
                {formError && (
                  <div className="alert alert-danger py-2 px-3 fs-13 mb-3">
                    {formError}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Category Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Indoor Plants, Ceramic Pots, Organic Fertilizers"
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      if (!isEditMode) {
                        setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                      }
                    }}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Category Slug <span className="text-muted fs-12">(URL identifier)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. indoor-plants"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Brief description of this category..."
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Status</label>
                  <select
                    className="form-select"
                    value={catStatus}
                    onChange={(e) => setCatStatus(e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer bg-light border-top px-4 py-3">
                <button
                  type="button"
                  className="btn btn-secondary fs-13 px-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary fs-13 px-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Saving...
                    </>
                  ) : isEditMode ? (
                    "Save Changes"
                  ) : (
                    "Create Category"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add / Edit Category Modal */}

      {/* Delete Category Confirmation Modal */}
      <div className="modal fade" id="delete-category-modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content text-center p-4 border-0 shadow-lg">
            <div className="mb-3">
              <span className="avatar avatar-xl bg-danger-transparent text-danger rounded-circle d-inline-flex align-items-center justify-content-center">
                <Trash2 size={28} />
              </span>
            </div>
            <h5 className="fw-bold mb-2">Delete Category?</h5>
            <p className="text-muted fs-14 mb-4">
              Are you sure you want to delete this category? Any associated products may become uncategorized.
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
      {/* /Delete Modal */}
    </div>
  );
};

export default CategoryList;
