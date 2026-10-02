import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";

interface CategoryItem {
  id: string;
  name: string;
  type: string;
  description: string;
  product_count: number;
  status: string;
  created_at?: string;
  business_name?: string;
}

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedCategories, setSelectedCategories] = useState<any[]>([]);

  // Add/Edit modal form state
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = getActiveBusinessId();
      const res = await api.get<any[]>("/categories", { business_id: businessId });
      if (Array.isArray(res)) {
        const mapped: CategoryItem[] = res.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type || c.slug || "general",
          description: c.description || "-",
          product_count: Number(c.product_count) || 0,
          status: "Active",
          created_at: c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : "Active",
          business_name: c.business_name || "Grow Naturals",
        }));
        setCategories(mapped);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.warn("Error loading categories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setName("");
    setSlug("");
    setDescription("");
  };

  const handleOpenEdit = (item: CategoryItem) => {
    setIsEditMode(true);
    setCurrentId(item.id);
    setName(item.name);
    setSlug(item.type || "");
    setDescription(item.description && item.description !== "-" ? item.description : "");
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please provide a category name");
      return;
    }

    setIsSubmitting(true);
    try {
      const businessId = getActiveBusinessId();
      const cleanSlug = slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        name: name.trim(),
        slug: cleanSlug,
        type: cleanSlug,
        description: description.trim(),
        business_id: businessId,
      };

      if (isEditMode && currentId) {
        await api.put(`/categories/${currentId}`, payload);
      } else {
        await api.post("/categories", payload);
      }

      await fetchCategories();
      // Close bootstrap modal programmatically
      const modalEl = document.getElementById("add-category-modal");
      if (modalEl) {
        const closeBtn = modalEl.querySelector(".btn-close, [data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
    } catch (err: any) {
      alert(err.message || "Failed to save category");
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
      alert(err.message || "Failed to delete category");
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  const columns = [
    {
      header: "Category Name",
      field: "name",
      key: "name",
      sortable: true,
      body: (data: CategoryItem) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-md bg-light-primary text-primary me-2 d-flex align-items-center justify-content-center">
            <i className="ti ti-folders fs-16" />
          </div>
          <div>
            <h6 className="fw-semibold mb-0">{data.name}</h6>
          </div>
        </div>
      ),
    },
    {
      header: "Category Code / Slug",
      field: "type",
      key: "type",
      sortable: true,
      body: (data: CategoryItem) => (
        <span className="badge badge-soft-info text-capitalize fs-11">{data.type}</span>
      ),
    },
    {
      header: "Description",
      field: "description",
      key: "description",
      sortable: false,
      body: (data: CategoryItem) => (
        <span className="fs-13 text-muted text-truncate d-inline-block" style={{ maxWidth: "250px" }}>
          {data.description || "-"}
        </span>
      ),
    },
    {
      header: "Products Count",
      field: "product_count",
      key: "product_count",
      sortable: true,
      body: (data: CategoryItem) => (
        <span className="badge bg-light text-dark fw-bold">{data.product_count} Products</span>
      ),
    },
    {
      header: "Status",
      field: "status",
      key: "status",
      sortable: true,
      body: () => <span className="badge badge-soft-success fw-medium fs-10">Active</span>,
    },
    {
      header: "Actions",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: CategoryItem) => (
        <div className="edit-delete-action d-flex align-items-center gap-1">
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light"
            data-bs-toggle="modal"
            data-bs-target="#add-category-modal"
            onClick={() => handleOpenEdit(row)}
            title="Edit"
          >
            <i className="feather icon-edit text-primary fs-14" />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light"
            data-bs-toggle="modal"
            data-bs-target="#delete-category-modal"
            onClick={() => setDeleteId(row.id)}
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
              <h4 className="fw-bold">Category List</h4>
              <h6>Manage your product categories and modules</h6>
            </div>
          </div>
          <TableTopHead />
          <div className="page-btn">
            <button
              type="button"
              className="btn btn-primary d-inline-flex align-items-center"
              data-bs-toggle="modal"
              data-bs-target="#add-category-modal"
              onClick={handleOpenAdd}
            >
              <i className="ti ti-circle-plus me-1" />
              Add Category
            </button>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <SearchFromApi callback={(val: any) => setSearchQuery(val)} rows={rows} setRows={setRows} />
            <button type="button" className="btn btn-outline-light btn-sm" onClick={fetchCategories}>
              <i className="ti ti-refresh me-1" /> Refresh
            </button>
          </div>

          <div className="card-body">
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
                selection={selectedCategories}
                onSelectionChange={(e: any) => setSelectedCategories(e.value)}
              />
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      {/* Add / Edit Category Modal */}
      <div className="modal fade" id="add-category-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fw-bold">
                {isEditMode ? "Edit Category" : "Add New Category"}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Category Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Mango, Plants, Pots, Fertilizers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Category Code / Slug <span className="text-muted fs-12">(Optional)</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. mango, plants, pots (auto-generated if left blank)"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Brief details about this category..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete-category-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content text-center p-4">
            <div className="mb-3">
              <span className="avatar avatar-xl bg-danger-transparent text-danger rounded-circle">
                <i className="ti ti-trash fs-24" />
              </span>
            </div>
            <h5 className="fw-bold mb-2">Delete Category?</h5>
            <p className="text-muted fs-14 mb-4">
              Are you sure you want to delete this category? Products linked to it will remain safe.
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

export default CategoryList;
