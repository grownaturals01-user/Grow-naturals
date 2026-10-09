import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";
import { Edit, Trash2 } from "lucide-react";

interface SubCategoryData {
  id: string;
  name: string;
  category_id?: string;
  parent_category_name?: string;
  code?: string;
  description: string;
  product_count: number;
  status: string;
  created_at?: string;
}

const SubCategories: React.FC = () => {
  const [subcategories, setSubcategories] = useState<SubCategoryData[]>([]);
  const [parentCategories, setParentCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchSubcategories = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = getActiveBusinessId();
      const [subRes, catRes] = await Promise.all([
        api.get<any[]>("/subcategories", { business_id: businessId }),
        api.get<any[]>("/categories", { business_id: businessId }),
      ]);

      if (Array.isArray(catRes)) {
        setParentCategories(catRes.map((c: any) => ({ id: c.id, name: c.name })));
      } else {
        setParentCategories([]);
      }

      if (Array.isArray(subRes)) {
        const mapped: SubCategoryData[] = subRes.map((s: any) => ({
          id: s.id,
          name: s.name,
          category_id: s.category_id,
          parent_category_name: s.parent_category_name || "General",
          code: s.code || "-",
          description: s.description || "-",
          product_count: Number(s.product_count) || 0,
          status: "Active",
          created_at: s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN") : "Active",
        }));
        setSubcategories(mapped);
      } else {
        setSubcategories([]);
      }
    } catch (err) {
      console.warn("Failed to load subcategories:", err);
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setName("");
    setCategoryId(parentCategories[0]?.id || "");
    setCode("");
    setDescription("");
  };

  const handleOpenEdit = (item: SubCategoryData) => {
    setIsEditMode(true);
    setCurrentId(item.id);
    setName(item.name);
    setCategoryId(item.category_id || parentCategories[0]?.id || "");
    setCode(item.code && item.code !== "-" ? item.code : "");
    setDescription(item.description && item.description !== "-" ? item.description : "");
  };

  const handleSaveSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please provide a subcategory name");
      return;
    }

    setIsSubmitting(true);
    try {
      const businessId = getActiveBusinessId();
      const payload = {
        name: name.trim(),
        category_id: categoryId || (parentCategories[0]?.id ?? null),
        code: code.trim(),
        description: description.trim(),
        business_id: businessId,
      };

      if (isEditMode && currentId) {
        await api.put(`/subcategories/${currentId}`, payload);
      } else {
        await api.post("/subcategories", payload);
      }

      await fetchSubcategories();
      const modalEl = document.getElementById("add-subcategory-modal");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
    } catch (err: any) {
      alert(err.message || "Failed to save subcategory");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/subcategories/${deleteId}`);
      setDeleteId(null);
      await fetchSubcategories();
      const modalEl = document.getElementById("delete-subcategory-modal");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete subcategory");
    }
  };

  const filtered = subcategories.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.parent_category_name && s.parent_category_name.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      s.description.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      field: "name",
      header: "Sub Category",
      key: "name",
      sortable: true,
      body: (row: SubCategoryData) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-md bg-light-teal text-teal me-2 d-flex align-items-center justify-content-center">
            <i className="ti ti-folders fs-16" />
          </div>
          <div>
            <h6 className="fw-semibold mb-0">{row.name}</h6>
            <span className="fs-12 text-muted">{row.product_count} Products</span>
          </div>
        </div>
      ),
    },
    {
      field: "parent_category_name",
      header: "Parent Category",
      key: "parent_category_name",
      sortable: true,
      body: (row: SubCategoryData) => (
        <span className="badge badge-soft-primary text-capitalize fs-11">{row.parent_category_name || "General"}</span>
      ),
    },
    {
      field: "code",
      header: "Sub Category Code",
      key: "code",
      sortable: true,
      body: (row: SubCategoryData) => (
        <span className="badge badge-soft-secondary text-uppercase fs-11">{row.code || "-"}</span>
      ),
    },
    {
      field: "description",
      header: "Description",
      key: "description",
      sortable: false,
      body: (row: SubCategoryData) => (
        <span className="fs-13 text-muted text-truncate d-inline-block" style={{ maxWidth: "260px" }}>
          {row.description || "-"}
        </span>
      ),
    },
    {
      field: "status",
      header: "Status",
      key: "status",
      sortable: true,
      body: () => <span className="badge badge-soft-success fs-10">Active</span>,
    },
    {
      field: "actions",
      header: "Actions",
      key: "actions",
      sortable: false,
      body: (row: SubCategoryData) => (
        <div className="edit-delete-action d-flex align-items-center gap-1">
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light d-flex align-items-center justify-content-center"
            data-bs-toggle="modal"
            data-bs-target="#add-subcategory-modal"
            onClick={() => handleOpenEdit(row)}
            title="Edit Subcategory"
            style={{ width: "32px", height: "32px" }}
          >
            <Edit size={16} className="text-primary" />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light d-flex align-items-center justify-content-center"
            data-bs-toggle="modal"
            data-bs-target="#delete-subcategory-modal"
            onClick={() => setDeleteId(row.id)}
            title="Delete Subcategory"
            style={{ width: "32px", height: "32px" }}
          >
            <Trash2 size={16} className="text-danger" />
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
              <h4 className="fw-bold">Sub Categories</h4>
              <h6>Manage inventory classifications &amp; subcategories</h6>
            </div>
          </div>
          <TableTopHead />
          <div className="page-btn">
            <button
              type="button"
              className="btn btn-primary d-inline-flex align-items-center"
              data-bs-toggle="modal"
              data-bs-target="#add-subcategory-modal"
              onClick={handleOpenAdd}
            >
              <i className="ti ti-circle-plus me-1" />
              Add Sub Category
            </button>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <SearchFromApi callback={(val: any) => setSearchQuery(val)} rows={rows} setRows={setRows} />
            <button type="button" className="btn btn-outline-light btn-sm" onClick={fetchSubcategories}>
              <i className="ti ti-refresh me-1" /> Refresh
            </button>
          </div>

          <div className="card-body">
            <div className="table-responsive category-table">
              <PrimeDataTable
                column={columns}
                data={filtered}
                rows={rows}
                setRows={setRows}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalRecords={filtered.length}
                searchQuery={searchQuery}
                selectionMode="checkbox"
                selection={selectedItems}
                onSelectionChange={(e: any) => setSelectedItems(e.value)}
              />
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />

      {/* Add / Edit Sub Category Modal */}
      <div className="modal fade" id="add-subcategory-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fw-bold">
                {isEditMode ? "Edit Sub Category" : "Add Sub Category"}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <form onSubmit={handleSaveSubCategory}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Parent Category <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {parentCategories.length > 0 ? (
                      parentCategories.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))
                    ) : (
                      <option value="">No categories created yet (Create in Category List first)</option>
                    )}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Sub Category Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Indoor Greens, Grafted Succulents, Alphonso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Sub Category Code <span className="text-muted fs-12">(Optional)</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. SC001 or alphonso"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Description of subcategory..."
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
                  {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Sub Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className="modal fade" id="delete-subcategory-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content text-center p-4">
            <div className="mb-3">
              <span className="avatar avatar-xl bg-danger-transparent text-danger rounded-circle">
                <i className="ti ti-trash fs-24" />
              </span>
            </div>
            <h5 className="fw-bold mb-2">Delete Sub Category?</h5>
            <p className="text-muted fs-14 mb-4">
              Are you sure you want to delete this subcategory?
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

export default SubCategories;
