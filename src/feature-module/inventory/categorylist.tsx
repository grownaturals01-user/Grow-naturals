import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Edit, Trash2 } from "react-feather";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import { api } from "../../services/api";
import { useBusiness } from "../../context/BusinessContext";

// Define interface for Category item
interface CategoryItem {
  id?: string | number;
  category: string;
  categoryslug: string;
  createdon: string;
  status: string;
  business_id?: string;
  business_name?: string;
  raw?: any;
}

const CategoryList: React.FC = () => {
  const { businesses: contextBusinesses, businessId: currentActiveBiz } = useBusiness();

  // Fallback list of businesses if context not yet loaded
  const defaultBusinesses = useMemo(
    () => [
      { id: "grow-naturals", name: "Grow Naturals" },
      { id: "nikhlesh-nursery", name: "Nikhlesh Nursery" },
    ],
    []
  );

  const availableBusinesses = useMemo(() => {
    const list = (contextBusinesses || []).filter(
      (b) => b.id && b.id !== "all" && b.id !== "combined"
    );
    return list.length > 0 ? list : defaultBusinesses;
  }, [contextBusinesses, defaultBusinesses]);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<string>("last7Days");
  const [sortLabel, setSortLabel] = useState<string>("Last 7 Days");

  const [businessFilter, setBusinessFilter] = useState<string>(() => {
    if (currentActiveBiz && currentActiveBiz !== "all" && currentActiveBiz !== "combined") {
      return currentActiveBiz;
    }
    return "grow-naturals";
  });

  // Keep businessFilter synced with available businesses
  useEffect(() => {
    if (businessFilter === "all" || !availableBusinesses.some((b) => b.id === businessFilter)) {
      if (availableBusinesses.length > 0) {
        setBusinessFilter(availableBusinesses[0].id);
      }
    }
  }, [availableBusinesses, businessFilter]);

  // Tab underline indicator for Table Header tabs
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateIndicator = useCallback(() => {
    const activeEl = tabRefs.current[businessFilter];
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        ready: true,
      });
    }
  }, [businessFilter]);

  useEffect(() => {
    const t = setTimeout(updateIndicator, 0);
    return () => clearTimeout(t);
  }, [updateIndicator, availableBusinesses]);

  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  // Tab underline indicator for Add Modal store tabs
  const addTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [addIndicatorStyle, setAddIndicatorStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const [addSelectedBizId, setAddSelectedBizId] = useState<string>("grow-naturals");
  const [addCategoryName, setAddCategoryName] = useState("");
  const [addCategorySlug, setAddCategorySlug] = useState("");
  const [addCategoryStatus, setAddCategoryStatus] = useState(true);

  const updateAddIndicator = useCallback(() => {
    const activeEl = addSelectedBizId ? addTabRefs.current[addSelectedBizId] : null;
    if (activeEl && activeEl.offsetWidth > 0) {
      setAddIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        ready: true,
      });
    }
  }, [addSelectedBizId]);

  useEffect(() => {
    const t = setTimeout(updateAddIndicator, 50);
    return () => clearTimeout(t);
  }, [updateAddIndicator, addSelectedBizId]);

  useEffect(() => {
    const modalEl = document.getElementById("add-category");
    if (!modalEl) return;
    const onShown = () => {
      setTimeout(updateAddIndicator, 60);
    };
    modalEl.addEventListener("shown.bs.modal", onShown);
    return () => {
      modalEl.removeEventListener("shown.bs.modal", onShown);
    };
  }, [updateAddIndicator]);

  // Tab underline indicator for Edit Modal store tabs
  const editTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [editIndicatorStyle, setEditIndicatorStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editSelectedBizId, setEditSelectedBizId] = useState<string>("grow-naturals");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategorySlug, setEditCategorySlug] = useState("");
  const [editCategoryStatus, setEditCategoryStatus] = useState(true);

  const updateEditIndicator = useCallback(() => {
    const activeEl = editSelectedBizId ? editTabRefs.current[editSelectedBizId] : null;
    if (activeEl && activeEl.offsetWidth > 0) {
      setEditIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        ready: true,
      });
    }
  }, [editSelectedBizId]);

  useEffect(() => {
    const t = setTimeout(updateEditIndicator, 50);
    return () => clearTimeout(t);
  }, [updateEditIndicator, editSelectedBizId]);

  useEffect(() => {
    const modalEl = document.getElementById("edit-category");
    if (!modalEl) return;
    const onShown = () => {
      setTimeout(updateEditIndicator, 60);
    };
    modalEl.addEventListener("shown.bs.modal", onShown);
    return () => {
      modalEl.removeEventListener("shown.bs.modal", onShown);
    };
  }, [updateEditIndicator]);

  // Delete category state
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      // Pass business_id: "all" so we fetch all records for client-side store switching
      const res = await api.get<any[]>("/categories", { business_id: "all" });
      if (Array.isArray(res)) {
        const mapped: CategoryItem[] = res.map((c: any) => ({
          id: c.id,
          category: c.name,
          categoryslug: c.slug || c.type || (c.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "general"),
          createdon: c.created_at
            ? new Date(c.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Today",
          status: c.status || "Active",
          business_id: c.business_id,
          business_name: c.business_name,
          raw: c,
        }));
        setCategories(mapped);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.warn("Failed to load categories:", err);
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const handleOpenAdd = () => {
    setAddSelectedBizId(businessFilter !== "all" ? businessFilter : "grow-naturals");
    setAddCategoryName("");
    setAddCategorySlug("");
    setAddCategoryStatus(true);
    setTimeout(updateAddIndicator, 100);
  };

  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addCategoryName.trim()) return;

    try {
      const slugVal = addCategorySlug.trim() || addCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const statusVal = addCategoryStatus ? "Active" : "Inactive";
      const targetBizId = addSelectedBizId || "grow-naturals";

      try {
        await api.post("/categories", {
          name: addCategoryName.trim(),
          slug: slugVal,
          type: slugVal,
          status: statusVal,
          business_id: targetBizId,
        });
      } catch (apiErr) {
        console.warn("API save warning, updating local state:", apiErr);
      }

      const bizName = availableBusinesses.find((b) => b.id === targetBizId)?.name || "Grow Naturals";

      const newCat: CategoryItem = {
        id: Date.now().toString(),
        category: addCategoryName.trim(),
        categoryslug: slugVal,
        createdon: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        status: statusVal,
        business_id: targetBizId,
        business_name: bizName,
      };
      setCategories((prev) => [newCat, ...prev]);

      // Close modal
      const closeBtn = document.querySelector("#add-category .close") as HTMLElement;
      if (closeBtn) closeBtn.click();
      fetchCategories();
    } catch (err: any) {
      alert(err.message || "Failed to add category");
    }
  };

  const handleStartEdit = (row: CategoryItem) => {
    setEditingCategory(row);
    const biz = row.business_id || row.raw?.business_id || "grow-naturals";
    setEditSelectedBizId(biz);
    setEditCategoryName(row.category);
    setEditCategorySlug(row.categoryslug);
    setEditCategoryStatus(row.status === "Active");
    setTimeout(updateEditIndicator, 100);
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;

    try {
      const statusVal = editCategoryStatus ? "Active" : "Inactive";
      const slugVal = editCategorySlug.trim() || editCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const targetBizId = editSelectedBizId || "grow-naturals";

      if (editingCategory.id && String(editingCategory.id).length > 5) {
        try {
          await api.put(`/categories/${editingCategory.id}`, {
            name: editCategoryName.trim(),
            slug: slugVal,
            type: slugVal,
            status: statusVal,
            business_id: targetBizId,
          });
        } catch (apiErr) {
          console.warn("API update warning, updating local state:", apiErr);
        }
      }

      const bizName = availableBusinesses.find((b) => b.id === targetBizId)?.name || "Grow Naturals";

      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                category: editCategoryName.trim(),
                categoryslug: slugVal,
                status: statusVal,
                business_id: targetBizId,
                business_name: bizName,
              }
            : c
        )
      );

      // Close modal
      const closeBtn = document.querySelector("#edit-category .close") as HTMLElement;
      if (closeBtn) closeBtn.click();
      fetchCategories();
    } catch (err: any) {
      alert(err.message || "Failed to update category");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      if (String(deleteId).length > 5) {
        try {
          await api.delete(`/categories/${deleteId}`);
        } catch (apiErr) {
          console.warn("API delete warning, removing from local state:", apiErr);
        }
      }
      setCategories((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteId(null);
      const closeBtn = document.querySelector("#delete-modal [data-bs-dismiss='modal']") as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || "Failed to delete category");
    }
  };

  const handleSort = (order: string, label: string) => {
    setSortOrder(order);
    setSortLabel(label);
  };

  // Filter and sort categories
  const filteredCategories = categories
    .filter((item) => {
      // Store filter
      if (businessFilter && businessFilter !== "all") {
        const itemBiz = item.business_id || item.raw?.business_id || "grow-naturals";
        const itemBizName = (item.business_name || item.raw?.business_name || "").toLowerCase();

        if (businessFilter === "grow-naturals") {
          const isGN = itemBiz === "grow-naturals" || itemBizName.includes("grow") || !itemBiz;
          if (!isGN) return false;
        } else if (businessFilter === "nikhlesh-nursery") {
          const isNN = itemBiz === "nikhlesh-nursery" || itemBizName.includes("nikhlesh");
          if (!isNN) return false;
        } else if (itemBiz !== businessFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter && statusFilter !== "All" && item.status !== statusFilter) return false;

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.category.toLowerCase().includes(q) || item.categoryslug.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") return a.category.localeCompare(b.category);
      if (sortOrder === "desc") return b.category.localeCompare(a.category);
      return 0;
    });

  const columns = [
    {
      header: "Category",
      field: "category",
      key: "category",
      sortable: true,
      body: (rowData: CategoryItem) => {
        const bizId = rowData.business_id || rowData.raw?.business_id || "";
        const bizName = (rowData.business_name || rowData.raw?.business_name || "").toLowerCase();
        const isNN = bizId === "nikhlesh-nursery" || bizName.includes("nikhlesh");

        return (
          <div className="d-flex align-items-center">
            {isNN ? (
              <div
                className="avatar avatar-sm rounded-circle me-2 d-flex align-items-center justify-content-center fw-bold fs-11 flex-shrink-0"
                style={{
                  backgroundColor: "rgba(13, 110, 253, 0.12)",
                  color: "#0d6efd",
                  border: "1px solid rgba(13, 110, 253, 0.3)",
                  width: "32px",
                  height: "32px",
                }}
                title="Nikhlesh Nursery"
              >
                NN
              </div>
            ) : (
              <div
                className="avatar avatar-sm rounded-circle me-2 d-flex align-items-center justify-content-center fw-bold fs-11 flex-shrink-0"
                style={{
                  backgroundColor: "rgba(18, 122, 60, 0.12)",
                  color: "#127a3c",
                  border: "1px solid rgba(18, 122, 60, 0.3)",
                  width: "32px",
                  height: "32px",
                }}
                title="Grow Naturals"
              >
                GN
              </div>
            )}
            <span className="fw-semibold text-dark fs-14">{rowData.category}</span>
          </div>
        );
      },
    },
    {
      header: "Category Slug",
      field: "categoryslug",
      key: "categoryslug",
      sortable: true,
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
        <span className={`badge ${data.status === "Active" ? "bg-success" : "bg-danger"} fw-medium fs-10`}>
          {data.status}
        </span>
      ),
    },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: CategoryItem) => (
        <div className="edit-delete-action d-flex align-items-center">
          <Link
            className="me-2 p-2 d-flex align-items-center justify-content-center border rounded hover-dark bg-white"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-category"
            onClick={() => handleStartEdit(row)}
            title="Edit Category"
            style={{ width: "32px", height: "32px" }}
          >
            <Edit size={16} className="text-dark" style={{ color: "#000000" }} />
          </Link>
          <Link
            className="p-2 d-flex align-items-center justify-content-center border rounded hover-danger bg-white"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            onClick={() => setDeleteId(row.id || null)}
            title="Delete Category"
            style={{ width: "32px", height: "32px" }}
          >
            <Trash2 size={16} className="text-danger" />
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
                <h4 className="fw-bold">Category</h4>
                <h6>Manage your categories</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary d-inline-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#add-category"
                onClick={handleOpenAdd}
              >
                <i className="ti ti-circle-plus me-1 fs-16"></i> Add Category
              </Link>
            </div>
          </div>

          {/* Table Card */}
          <div className="card table-list-card">
            <div className="card-header pb-0 border-bottom">
              {/* Top Row: Search and Status Filter */}
              <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
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
                      <i className="ti ti-filter me-1 fs-14" />
                      Status: <span className="fw-semibold ms-1">{statusFilter}</span>
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-2 shadow-sm rounded-2">
                      <li>
                        <button
                          type="button"
                          className={`dropdown-item rounded-1 ${statusFilter === "All" ? "active" : ""}`}
                          onClick={() => setStatusFilter("All")}
                        >
                          All
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className={`dropdown-item rounded-1 ${statusFilter === "Active" ? "active" : ""}`}
                          onClick={() => setStatusFilter("Active")}
                        >
                          Active
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className={`dropdown-item rounded-1 ${statusFilter === "Inactive" ? "active" : ""}`}
                          onClick={() => setStatusFilter("Inactive")}
                        >
                          Inactive
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      Sort By : {sortLabel}
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-2 shadow-sm rounded-2">
                      <li>
                        <button
                          type="button"
                          className="dropdown-item rounded-1"
                          onClick={() => handleSort("recent", "Recently Added")}
                        >
                          Recently Added
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item rounded-1"
                          onClick={() => handleSort("asc", "Ascending")}
                        >
                          Ascending
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item rounded-1"
                          onClick={() => handleSort("desc", "Descending")}
                        >
                          Descending
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item rounded-1"
                          onClick={() => handleSort("lastMonth", "Last Month")}
                        >
                          Last Month
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item rounded-1"
                          onClick={() => handleSort("last7Days", "Last 7 Days")}
                        >
                          Last 7 Days
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Animated Underline Tabs placed under the Search Bar */}
              <div className="position-relative">
                <ul className="nav border-bottom-0 gap-3 gap-sm-4" role="tablist">
                  {availableBusinesses.map((biz) => {
                    const isSelected = businessFilter === biz.id;
                    return (
                      <li key={biz.id} className="nav-item">
                        <button
                          ref={(el) => {
                            tabRefs.current[biz.id] = el;
                          }}
                          type="button"
                          className={`nav-link border-0 bg-transparent px-2 d-inline-flex align-items-center rounded-0 fs-14 ${
                            isSelected ? "fw-bold" : "text-muted fw-medium"
                          }`}
                          style={{
                            boxShadow: "none",
                            background: "transparent",
                            paddingTop: 0,
                            paddingBottom: "6px",
                            color: isSelected ? "#127a3c" : undefined,
                            transition: "color 0.2s ease",
                          }}
                          onClick={() => {
                            setBusinessFilter(biz.id);
                            setCurrentPage(1);
                          }}
                        >
                          <span>{biz.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* Animated sliding underline indicator */}
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                    height: "3px",
                    backgroundColor: "#127a3c",
                    borderRadius: "3px 3px 0 0",
                    transition: indicatorStyle.ready
                      ? "left 0.28s cubic-bezier(0.4, 0, 0.2, 1), width 0.28s cubic-bezier(0.4, 0, 0.2, 1)"
                      : "none",
                    pointerEvents: "none",
                    opacity: indicatorStyle.ready ? 1 : 0,
                  }}
                />
              </div>
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
                  selection={selectedProducts}
                  onSelectionChange={(e: any) => setSelectedProducts(e.value)}
                />
              </div>

              {filteredCategories.length === 0 && (
                <div className="text-center py-5">
                  <div className="avatar avatar-xl bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center">
                    <i className="ti ti-layers-intersect fs-32 text-muted" />
                  </div>
                  <h5 className="fw-semibold text-dark">No Categories Found</h5>
                  <p className="text-muted fs-13 mb-3">
                    {searchQuery
                      ? "No records matched your search query."
                      : businessFilter !== "all"
                      ? `No categories mapped to ${
                          availableBusinesses.find((b) => b.id === businessFilter)?.name || "this store"
                        } yet.`
                      : "Create your first category."}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#add-category"
                    onClick={handleOpenAdd}
                  >
                    <i className="ti ti-circle-plus me-1" /> Add Category
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add Category Modal */}
      <div className="modal fade" id="add-category" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-bottom">
                  <div className="page-title">
                    <h4 className="fw-bold">Add Category</h4>
                  </div>
                  <button
                    type="button"
                    className="close bg-danger text-white fs-16 rounded-circle d-flex align-items-center justify-content-center border-0 p-0"
                    style={{ width: "28px", height: "28px" }}
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body custom-modal-bodys">
                  <form onSubmit={handleAddCategory}>
                    {/* Store Mapping Tabs */}
                    <div className="mb-3">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">
                        Store Mapping <span className="text-danger">*</span>
                      </label>
                      <div className="position-relative border-bottom">
                        <ul className="nav border-bottom-0 gap-3 gap-sm-4" role="tablist">
                          {availableBusinesses.map((biz) => {
                            const isSelected = addSelectedBizId === biz.id;
                            return (
                              <li key={biz.id} className="nav-item">
                                <button
                                  ref={(el) => {
                                    addTabRefs.current[biz.id] = el;
                                  }}
                                  type="button"
                                  className={`nav-link border-0 bg-transparent px-2 d-inline-flex align-items-center rounded-0 fs-14 position-relative ${
                                    isSelected ? "fw-bold" : "text-muted fw-medium"
                                  }`}
                                  style={{
                                    boxShadow: "none",
                                    background: "transparent",
                                    paddingTop: "4px",
                                    paddingBottom: "8px",
                                    color: isSelected ? "#127a3c" : "#5b6b79",
                                    cursor: "pointer",
                                    transition: "color 0.2s ease",
                                  }}
                                  onClick={() => setAddSelectedBizId(biz.id)}
                                >
                                  <span>{biz.name}</span>
                                  {isSelected && !addIndicatorStyle.ready && (
                                    <span
                                      style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: "3px",
                                        backgroundColor: "#127a3c",
                                        borderRadius: "3px 3px 0 0",
                                      }}
                                    />
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>

                        {/* Animated sliding underline indicator */}
                        <span
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: `${addIndicatorStyle.left}px`,
                            width: `${addIndicatorStyle.width}px`,
                            height: "3px",
                            backgroundColor: "#127a3c",
                            borderRadius: "3px 3px 0 0",
                            transition: addIndicatorStyle.ready
                              ? "left 0.28s cubic-bezier(0.4, 0, 0.2, 1), width 0.28s cubic-bezier(0.4, 0, 0.2, 1)"
                              : "none",
                            pointerEvents: "none",
                            opacity: addIndicatorStyle.ready && addIndicatorStyle.width > 0 ? 1 : 0,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fs-13 fw-medium text-dark">
                        Category<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Indoor Plants, Organic Fertilizers"
                        value={addCategoryName}
                        onChange={(e) => {
                          setAddCategoryName(e.target.value);
                          setAddCategorySlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                        }}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fs-13 fw-medium text-dark">
                        Category Slug<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="indoor-plants"
                        value={addCategorySlug}
                        onChange={(e) => setAddCategorySlug(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label fs-13 fw-medium text-dark">
                          Status<span className="text-danger ms-1">*</span>
                        </span>
                        <input
                          type="checkbox"
                          id="user2"
                          className="check"
                          checked={addCategoryStatus}
                          onChange={(e) => setAddCategoryStatus(e.target.checked)}
                        />
                        <label htmlFor="user2" className="checktoggle" />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary fs-13 fw-medium p-2 px-3"
                    onClick={() => handleAddCategory()}
                  >
                    Add Category
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      <div className="modal fade" id="edit-category" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-bottom">
                  <div className="page-title">
                    <h4 className="fw-bold">Edit Category</h4>
                  </div>
                  <button
                    type="button"
                    className="close bg-danger text-white fs-16 rounded-circle d-flex align-items-center justify-content-center border-0 p-0"
                    style={{ width: "28px", height: "28px" }}
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body custom-modal-bodys">
                  <form onSubmit={handleSaveEdit}>
                    {/* Store Mapping Tabs */}
                    <div className="mb-3">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">
                        Store Mapping <span className="text-danger">*</span>
                      </label>
                      <div className="position-relative border-bottom">
                        <ul className="nav border-bottom-0 gap-3 gap-sm-4" role="tablist">
                          {availableBusinesses.map((biz) => {
                            const isSelected = editSelectedBizId === biz.id;
                            return (
                              <li key={biz.id} className="nav-item">
                                <button
                                  ref={(el) => {
                                    editTabRefs.current[biz.id] = el;
                                  }}
                                  type="button"
                                  className={`nav-link border-0 bg-transparent px-2 d-inline-flex align-items-center rounded-0 fs-14 position-relative ${
                                    isSelected ? "fw-bold" : "text-muted fw-medium"
                                  }`}
                                  style={{
                                    boxShadow: "none",
                                    background: "transparent",
                                    paddingTop: "4px",
                                    paddingBottom: "8px",
                                    color: isSelected ? "#127a3c" : "#5b6b79",
                                    cursor: "pointer",
                                    transition: "color 0.2s ease",
                                  }}
                                  onClick={() => setEditSelectedBizId(biz.id)}
                                >
                                  <span>{biz.name}</span>
                                  {isSelected && !editIndicatorStyle.ready && (
                                    <span
                                      style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: "3px",
                                        backgroundColor: "#127a3c",
                                        borderRadius: "3px 3px 0 0",
                                      }}
                                    />
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>

                        {/* Animated sliding underline indicator */}
                        <span
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: `${editIndicatorStyle.left}px`,
                            width: `${editIndicatorStyle.width}px`,
                            height: "3px",
                            backgroundColor: "#127a3c",
                            borderRadius: "3px 3px 0 0",
                            transition: editIndicatorStyle.ready
                              ? "left 0.28s cubic-bezier(0.4, 0, 0.2, 1), width 0.28s cubic-bezier(0.4, 0, 0.2, 1)"
                              : "none",
                            pointerEvents: "none",
                            opacity: editIndicatorStyle.ready && editIndicatorStyle.width > 0 ? 1 : 0,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fs-13 fw-medium text-dark">
                        Category<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fs-13 fw-medium text-dark">
                        Category Slug<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editCategorySlug}
                        onChange={(e) => setEditCategorySlug(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label fs-13 fw-medium text-dark">
                          Status<span className="text-danger ms-1">*</span>
                        </span>
                        <input
                          type="checkbox"
                          id="user3"
                          className="check"
                          checked={editCategoryStatus}
                          onChange={(e) => setEditCategoryStatus(e.target.checked)}
                        />
                        <label htmlFor="user3" className="checktoggle" />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary fs-13 fw-medium p-2 px-3"
                    onClick={() => handleSaveEdit()}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteModal onConfirm={handleDelete} />
    </div>
  );
};

export default CategoryList;
