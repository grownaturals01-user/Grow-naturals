import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Edit, Trash2 } from "react-feather";
import CommonFooter from "../../components/footer/commonFooter";
import {
  laptop,
  product1,
  product2,
  product3,
  product4,
  product5,
  product6,
  product7,
  product8,
  product9,
  product10,
  product11,
  product12,
  product13,
  product14,
  product15,
  product16,
  product17,
} from "../../utils/imagepath";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import CommonSelect from "../../components/select/common-select";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import { Editor } from "primereact/editor";
import { api } from "../../services/api";
import { useBusiness } from "../../context/BusinessContext";

const fallbackImages = [
  product1, product2, product3, product4, product5, product6,
  product7, product8, product9, product10, product11, product12,
  product13, product14, product15, product16, product17,
];

// Interface for subcategory data structure
interface SubCategoryData {
  id?: string | number;
  img: string;
  parentcategory: string;
  category: string;
  category_id?: string;
  categorycode: string;
  description: string;
  status: string;
  business_id?: string;
  business_name?: string;
  raw?: any;
}

interface ParentCategoryItem {
  id: string;
  name: string;
  business_id?: string;
}

const SubCategories: React.FC = () => {
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

  const [subcategories, setSubcategories] = useState<SubCategoryData[]>([]);
  const [parentCategories, setParentCategories] = useState<ParentCategoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
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
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [addImagePreview, setAddImagePreview] = useState<string>("");

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

  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryData | null>(null);
  const [editSelectedBizId, setEditSelectedBizId] = useState<string>("grow-naturals");
  const [editSelectedCategory, setEditSelectedCategory] = useState<any>(null);
  const [editSubCategoryName, setEditSubCategoryName] = useState("");
  const [editCategoryCode, setEditCategoryCode] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState(true);
  const [editImagePreview, setEditImagePreview] = useState<string>("");

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

  // Delete state
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubcategories = useCallback(async () => {
    try {
      const [subRes, catRes] = await Promise.all([
        api.get<any[]>("/subcategories", { business_id: "all" }),
        api.get<any[]>("/categories", { business_id: "all" }),
      ]);

      if (Array.isArray(catRes)) {
        setParentCategories(
          catRes.map((c: any) => ({
            id: c.id,
            name: c.name,
            business_id: c.business_id,
          }))
        );
      } else {
        setParentCategories([]);
      }

      if (Array.isArray(subRes)) {
        const mapped: SubCategoryData[] = subRes.map((s: any, idx: number) => ({
          id: s.id,
          img: s.image_url || fallbackImages[idx % fallbackImages.length],
          parentcategory: s.name,
          category: s.parent_category_name || s.category_name || "-",
          category_id: s.category_id,
          categorycode: s.code || `CT00${idx + 1}`,
          description: s.description || "-",
          status: s.status || "Active",
          business_id: s.business_id,
          business_name: s.business_name,
          raw: s,
        }));
        setSubcategories(mapped);
      } else {
        setSubcategories([]);
      }
    } catch (err) {
      console.warn("Failed to load subcategories:", err);
      setSubcategories([]);
      setParentCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const handleSort = (order: string, label: string) => {
    setSortOrder(order);
    setSortLabel(label);
  };

  // Filtered categories for Add modal based on selected store
  const addCategoryOptions = useMemo(() => {
    const filtered = parentCategories.filter((c) => {
      if (!c.business_id || c.business_id === "all") return true;
      if (addSelectedBizId === "grow-naturals") {
        return c.business_id === "grow-naturals" || c.name.toLowerCase().includes("grow");
      }
      if (addSelectedBizId === "nikhlesh-nursery") {
        return c.business_id === "nikhlesh-nursery" || c.name.toLowerCase().includes("nikhlesh");
      }
      return c.business_id === addSelectedBizId;
    });

    return filtered.map((c) => ({
      label: c.name,
      value: c.id,
    }));
  }, [parentCategories, addSelectedBizId]);

  // Filtered categories for Edit modal based on selected store
  const editCategoryOptions = useMemo(() => {
    const filtered = parentCategories.filter((c) => {
      if (!c.business_id || c.business_id === "all") return true;
      if (editSelectedBizId === "grow-naturals") {
        return c.business_id === "grow-naturals" || c.name.toLowerCase().includes("grow");
      }
      if (editSelectedBizId === "nikhlesh-nursery") {
        return c.business_id === "nikhlesh-nursery" || c.name.toLowerCase().includes("nikhlesh");
      }
      return c.business_id === editSelectedBizId;
    });

    return filtered.map((c) => ({
      label: c.name,
      value: c.id,
    }));
  }, [parentCategories, editSelectedBizId]);

  const handleSelectAddBiz = (bizId: string) => {
    setAddSelectedBizId(bizId);
    // Auto select first category in that store if current selected is not in options
    const filtered = parentCategories.filter((c) => {
      if (!c.business_id || c.business_id === "all") return true;
      if (bizId === "grow-naturals") {
        return c.business_id === "grow-naturals" || c.name.toLowerCase().includes("grow");
      }
      if (bizId === "nikhlesh-nursery") {
        return c.business_id === "nikhlesh-nursery" || c.name.toLowerCase().includes("nikhlesh");
      }
      return c.business_id === bizId;
    });
    if (filtered.length > 0) {
      setSelectedCategory(filtered[0].id);
    } else {
      setSelectedCategory(null);
    }
  };

  const handleSelectEditBiz = (bizId: string) => {
    setEditSelectedBizId(bizId);
    const filtered = parentCategories.filter((c) => {
      if (!c.business_id || c.business_id === "all") return true;
      if (bizId === "grow-naturals") {
        return c.business_id === "grow-naturals" || c.name.toLowerCase().includes("grow");
      }
      if (bizId === "nikhlesh-nursery") {
        return c.business_id === "nikhlesh-nursery" || c.name.toLowerCase().includes("nikhlesh");
      }
      return c.business_id === bizId;
    });
    if (filtered.length > 0 && !filtered.some((c) => c.id === editSelectedCategory)) {
      setEditSelectedCategory(filtered[0].id);
    }
  };

  const handleOpenAdd = () => {
    const initialBiz = businessFilter !== "all" ? businessFilter : "grow-naturals";
    setAddSelectedBizId(initialBiz);
    const initialCategories = parentCategories.filter((c) => {
      if (!c.business_id || c.business_id === "all") return true;
      if (initialBiz === "grow-naturals") return c.business_id === "grow-naturals" || c.name.toLowerCase().includes("grow");
      if (initialBiz === "nikhlesh-nursery") return c.business_id === "nikhlesh-nursery" || c.name.toLowerCase().includes("nikhlesh");
      return c.business_id === initialBiz;
    });
    setSelectedCategory(initialCategories[0]?.id || null);
    setSubCategoryName("");
    setCategoryCode("");
    setDescription("");
    setStatus(true);
    setAddImagePreview("");
    setTimeout(updateAddIndicator, 100);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvent: any) => {
        setAddImagePreview(uploadEvent.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAddSubCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!subCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const targetBizId = addSelectedBizId || "grow-naturals";
      const catObj = parentCategories.find((c) => String(c.id) === String(selectedCategory));
      const catName = catObj ? catObj.name : "-";
      const statusVal = status ? "Active" : "Inactive";

      try {
        await api.post("/subcategories", {
          name: subCategoryName.trim(),
          category_id: selectedCategory || null,
          code: categoryCode.trim() || undefined,
          description: description ? description.replace(/<[^>]*>/g, "").trim() : "",
          status: statusVal,
          business_id: targetBizId,
          image_url: addImagePreview || "",
        });
      } catch (apiErr) {
        console.warn("API save warning, updating local state:", apiErr);
      }

      const bizName = availableBusinesses.find((b) => b.id === targetBizId)?.name || "Grow Naturals";

      const newSub: SubCategoryData = {
        id: Date.now().toString(),
        img: addImagePreview || fallbackImages[subcategories.length % fallbackImages.length],
        parentcategory: subCategoryName.trim(),
        category: catName,
        category_id: selectedCategory || "",
        categorycode: categoryCode.trim() || `CT00${subcategories.length + 1}`,
        description: description ? description.replace(/<[^>]*>/g, "").trim() : "Subcategory description",
        status: statusVal,
        business_id: targetBizId,
        business_name: bizName,
      };
      setSubcategories((prev) => [newSub, ...prev]);

      // Close modal
      const closeBtn = document.querySelector("#add-category .close") as HTMLElement;
      if (closeBtn) closeBtn.click();
      fetchSubcategories();
    } catch (err: any) {
      alert(err.message || "Failed to add subcategory");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (row: SubCategoryData) => {
    setEditingSubCategory(row);
    const targetBizId = row.business_id || row.raw?.business_id || "grow-naturals";
    setEditSelectedBizId(targetBizId);
    setEditSubCategoryName(row.parentcategory);
    setEditCategoryCode(row.categorycode);
    setEditDescription(row.description === "-" ? "" : row.description);
    setEditStatus(row.status === "Active");
    setEditImagePreview(row.img && !row.img.includes("static") ? row.img : "");

    const matchedCat = parentCategories.find((c) => c.name === row.category || String(c.id) === String(row.category_id));
    setEditSelectedCategory(matchedCat ? matchedCat.id : row.category_id || null);
    setTimeout(updateEditIndicator, 100);
  };

  const handleEditImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvent: any) => {
        setEditImagePreview(uploadEvent.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingSubCategory || !editSubCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const targetBizId = editSelectedBizId || "grow-naturals";
      const catObj = parentCategories.find((c) => String(c.id) === String(editSelectedCategory));
      const catName = catObj ? catObj.name : editingSubCategory.category;
      const statusVal = editStatus ? "Active" : "Inactive";
      const descVal = editDescription ? editDescription.replace(/<[^>]*>/g, "").trim() : "";

      if (editingSubCategory.id && String(editingSubCategory.id).length > 5) {
        try {
          await api.put(`/subcategories/${editingSubCategory.id}`, {
            name: editSubCategoryName.trim(),
            category_id: editSelectedCategory || null,
            code: editCategoryCode.trim() || undefined,
            description: descVal,
            status: statusVal,
            business_id: targetBizId,
            image_url: editImagePreview || undefined,
          });
        } catch (apiErr) {
          console.warn("API update warning, updating local state:", apiErr);
        }
      }

      const bizName = availableBusinesses.find((b) => b.id === targetBizId)?.name || "Grow Naturals";

      setSubcategories((prev) =>
        prev.map((s) =>
          s.id === editingSubCategory.id
            ? {
                ...s,
                parentcategory: editSubCategoryName.trim(),
                category: catName,
                category_id: editSelectedCategory || "",
                categorycode: editCategoryCode.trim(),
                description: descVal || "-",
                status: statusVal,
                img: editImagePreview || s.img,
                business_id: targetBizId,
                business_name: bizName,
              }
            : s
        )
      );

      // Close modal
      const closeBtn = document.querySelector("#edit-category .close") as HTMLElement;
      if (closeBtn) closeBtn.click();
      fetchSubcategories();
    } catch (err: any) {
      alert(err.message || "Failed to update subcategory");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      if (String(deleteId).length > 5) {
        try {
          await api.delete(`/subcategories/${deleteId}`);
        } catch (apiErr) {
          console.warn("API delete warning, removing from local state:", apiErr);
        }
      }
      setSubcategories((prev) => prev.filter((s) => s.id !== deleteId));
      setDeleteId(null);
      const closeBtn = document.querySelector("#delete-modal [data-bs-dismiss='modal']") as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || "Failed to delete subcategory");
    }
  };

  const filteredSubCategories = subcategories
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

      // Category filter
      if (categoryFilter) {
        const catObj = parentCategories.find((c) => String(c.id) === String(categoryFilter));
        if (catObj && item.category !== catObj.name && String(item.category_id) !== String(categoryFilter)) {
          return false;
        }
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.parentcategory.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.categorycode.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") return a.parentcategory.localeCompare(b.parentcategory);
      if (sortOrder === "desc") return b.parentcategory.localeCompare(a.parentcategory);
      return 0;
    });

  const columns = [
    {
      field: "logo",
      header: "Image",
      key: "logo",
      sortable: false,
      headerStyle: { width: "85px", minWidth: "85px" },
      style: { width: "85px", minWidth: "85px" },
      body: (rowData: SubCategoryData) => (
        <div className="d-inline-flex align-items-center" style={{ width: "40px", height: "40px" }}>
          <Link to="#" className="product-img stock-img m-0 p-0 d-block" style={{ margin: 0, width: "40px", height: "40px" }}>
            <img
              alt=""
              src={rowData.img || product1}
              style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }}
              onError={(e: any) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = product1;
              }}
            />
          </Link>
        </div>
      ),
    },
    {
      field: "parentcategory",
      header: "Sub Category",
      key: "parentcategory",
      sortable: true,
      headerStyle: { paddingLeft: "12px" },
      style: { paddingLeft: "12px" },
      body: (rowData: SubCategoryData) => (
        <span className="fw-semibold text-dark fs-14">{rowData.parentcategory}</span>
      ),
    },
    {
      field: "category",
      header: "Category",
      key: "category",
      sortable: true,
    },
    {
      field: "categorycode",
      header: "Category Code",
      key: "categorycode",
      sortable: true,
    },
    {
      field: "description",
      header: "Description",
      key: "description",
      sortable: true,
      body: (row: SubCategoryData) => (
        <span>{row.description ? row.description.replace(/<[^>]*>/g, "") : "-"}</span>
      ),
    },
    {
      field: "status",
      header: "Status",
      key: "status",
      sortable: true,
      body: (rowData: SubCategoryData) => (
        <span className={`badge ${rowData.status === "Active" ? "bg-success" : "bg-danger"} fw-medium fs-10`}>
          {rowData.status}
        </span>
      ),
    },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: SubCategoryData) => (
        <div className="edit-delete-action d-flex align-items-center">
          <Link
            className="me-2 p-2 d-flex align-items-center justify-content-center border rounded hover-dark bg-white"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-category"
            onClick={() => handleStartEdit(row)}
            title="Edit Sub Category"
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
            title="Delete Sub Category"
            style={{ width: "32px", height: "32px" }}
          >
            <Trash2 size={16} className="text-danger" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4 className="fw-bold">Sub Category</h4>
                <h6>Manage your sub categories</h6>
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
                <i className="ti ti-circle-plus me-1 fs-16"></i> Add Sub Category
              </Link>
            </div>
          </div>

          {/* Table Card */}
          <div className="card table-list-card">
            <div className="card-header pb-0 border-bottom">
              {/* Top Row: Search and Filter Dropdowns */}
              <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
                <SearchFromApi
                  callback={handleSearch}
                  rows={rows}
                  setRows={setRows}
                />
                <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                  {/* Category Filter dropdown */}
                  <div className="dropdown me-2">
                    <Link
                      to="#"
                      className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      {categoryFilter
                        ? parentCategories.find((c) => String(c.id) === String(categoryFilter))?.name || "Category"
                        : "Category"}
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-2 shadow-sm rounded-2">
                      <li>
                        <button
                          type="button"
                          className={`dropdown-item rounded-1 ${!categoryFilter ? "active" : ""}`}
                          onClick={() => setCategoryFilter(null)}
                        >
                          All Categories
                        </button>
                      </li>
                      {parentCategories.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            className={`dropdown-item rounded-1 ${categoryFilter === c.id ? "active" : ""}`}
                            onClick={() => setCategoryFilter(c.id)}
                          >
                            {c.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Status Filter dropdown */}
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

                  {/* Sort By dropdown */}
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
              <div className="table-responsive sub-category-table">
                <PrimeDataTable
                  column={columns}
                  data={filteredSubCategories}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={filteredSubCategories.length}
                  searchQuery={searchQuery}
                  selectionMode="checkbox"
                  selection={selectedProducts}
                  onSelectionChange={(e: any) => setSelectedProducts(e.value)}
                />
              </div>

              {filteredSubCategories.length === 0 && (
                <div className="text-center py-5">
                  <div className="avatar avatar-xl bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center">
                    <i className="ti ti-layers-intersect fs-32 text-muted" />
                  </div>
                  <h5 className="fw-semibold text-dark">No Sub Categories Found</h5>
                  <p className="text-muted fs-13 mb-3">
                    {searchQuery
                      ? "No records matched your search query."
                      : businessFilter !== "all"
                      ? `No sub categories mapped to ${
                          availableBusinesses.find((b) => b.id === businessFilter)?.name || "this store"
                        } yet.`
                      : "Create your first sub category."}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#add-category"
                    onClick={handleOpenAdd}
                  >
                    <i className="ti ti-circle-plus me-1" /> Add Sub Category
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* /product list */}
        </div>
        <CommonFooter />
      </div>

      <>
        {/* Add Sub Category Modal */}
        <div className="modal fade" id="add-category" tabIndex={-1} aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="page-wrapper-new p-0">
                <div className="content">
                  <div className="modal-header border-bottom">
                    <div className="page-title">
                      <h4 className="fw-bold">Add Sub Category</h4>
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
                    <form onSubmit={handleAddSubCategory}>
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
                                    onClick={() => handleSelectAddBiz(biz.id)}
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
                        <div className="add-image-upload">
                          <div className="add-image">
                            {addImagePreview ? (
                              <img
                                src={addImagePreview}
                                alt="preview"
                                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                              />
                            ) : (
                              <span className="fw-normal">
                                <i className="feather icon-plus-circle plus-down-add" />{" "}
                                Add Image
                              </span>
                            )}
                          </div>
                          <div className="new-employee-field">
                            <div className="mb-0">
                              <div className="image-upload mb-2">
                                <input type="file" accept="image/*" onChange={handleImageFileChange} />
                                <div className="image-uploads">
                                  <h4 className="fs-13 fw-medium">
                                    Upload Image
                                  </h4>
                                </div>
                              </div>
                              <span>JPEG, PNG up to 2 MB</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fs-13 fw-medium text-dark">
                          Category<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          className="w-100"
                          options={addCategoryOptions}
                          value={selectedCategory}
                          onChange={(e: any) => setSelectedCategory(e.value)}
                          placeholder="Choose Category"
                          filter={false}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fs-13 fw-medium text-dark">
                          Sub Category<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={subCategoryName}
                          onChange={(e) => setSubCategoryName(e.target.value)}
                          placeholder="Enter sub category"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fs-13 fw-medium text-dark">
                          Category Code<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={categoryCode}
                          onChange={(e) => setCategoryCode(e.target.value)}
                          placeholder="Enter code (e.g. CT001)"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fs-13 fw-medium text-dark">
                          Description
                        </label>
                        <Editor
                          value={description}
                          onTextChange={(e: any) => setDescription(e.htmlValue || "")}
                          style={{ height: "150px" }}
                        />
                      </div>
                      <div className="mb-0">
                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                          <span className="status-label fs-13 fw-medium text-dark">Status</span>
                          <input
                            type="checkbox"
                            id="user2"
                            className="check"
                            checked={status}
                            onChange={(e) => setStatus(e.target.checked)}
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
                      onClick={() => handleAddSubCategory()}
                      className="btn btn-primary fs-13 fw-medium p-2 px-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating..." : "Add Sub Category"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Add Sub Category Modal */}

        {/* Edit Sub Category Modal */}
        <div className="modal fade" id="edit-category" tabIndex={-1} aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="page-wrapper-new p-0">
                <div className="content">
                  <div className="modal-header border-bottom">
                    <div className="page-title">
                      <h4 className="fw-bold">Edit Sub Category</h4>
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
                                    onClick={() => handleSelectEditBiz(biz.id)}
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
                        <div className="add-image-upload">
                          <div className="add-image p-1 border-solid">
                            <img src={editImagePreview || laptop} alt="image" />
                            <Link
                              to="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setEditImagePreview("");
                              }}
                            >
                              <i className="feather icon-x x-square-add image-close remove-product fs-12 text-white bg-danger rounded-1" />
                            </Link>
                          </div>
                          <div className="new-employee-field">
                            <div className="mb-0">
                              <div className="image-upload mb-2">
                                <input type="file" accept="image/*" onChange={handleEditImageFileChange} />
                                <div className="image-uploads">
                                  <h4 className="fs-13 fw-medium">
                                    Change Image
                                  </h4>
                                </div>
                              </div>
                              <span>JPEG, PNG up to 2 MB</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fs-13 fw-medium text-dark">
                          Category<span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          className="w-100"
                          options={editCategoryOptions}
                          value={editSelectedCategory}
                          onChange={(e: any) => setEditSelectedCategory(e.value)}
                          placeholder="Choose Category"
                          filter={false}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fs-13 fw-medium text-dark">
                          Sub Category<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={editSubCategoryName}
                          onChange={(e) => setEditSubCategoryName(e.target.value)}
                          placeholder="Enter sub category"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fs-13 fw-medium text-dark">
                          Category Code<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={editCategoryCode}
                          onChange={(e) => setEditCategoryCode(e.target.value)}
                          placeholder="Enter code"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fs-13 fw-medium text-dark">
                          Description
                        </label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Enter description"
                        />
                      </div>
                      <div className="mb-0">
                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                          <span className="status-label fs-13 fw-medium text-dark">Status</span>
                          <input
                            type="checkbox"
                            id="user3"
                            className="check"
                            checked={editStatus}
                            onChange={(e) => setEditStatus(e.target.checked)}
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
                      onClick={() => handleSaveEdit()}
                      className="btn btn-primary fs-13 fw-medium p-2 px-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Edit Sub Category Modal */}
        <DeleteModal onConfirm={handleDelete} />
      </>
    </>
  );
};

export default SubCategories;
