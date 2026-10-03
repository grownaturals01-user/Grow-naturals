import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import EditCategoryList from "../../core/modals/inventory/editcategorylist";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";

// Define interfaces for type safety
interface CategoryItem {
  id?: string;
  category: string;
  categoryslug: string;
  createdon: string;
  status: string;
}

const fallbackCategories: CategoryItem[] = [
  {
    id: "1",
    category: "Computers",
    categoryslug: "computers",
    createdon: "25 May 2024",
    status: "Active",
  },
  {
    id: "2",
    category: "Electronics",
    categoryslug: "electronics",
    createdon: "24 Jun 2024",
    status: "Active",
  },
  {
    id: "3",
    category: "Shoe",
    categoryslug: "shoe",
    createdon: "23 Jul 2024",
    status: "Active",
  },
  {
    id: "4",
    category: "Speaker",
    categoryslug: "speaker",
    createdon: "22 Aug 2024",
    status: "Active",
  },
  {
    id: "5",
    category: "Furnitures",
    categoryslug: "furnitures",
    createdon: "21 Sep 2024",
    status: "Active",
  },
  {
    id: "6",
    category: "Bags",
    categoryslug: "bags",
    createdon: "20 Oct 2024",
    status: "Active",
  },
  {
    id: "7",
    category: "Phone",
    categoryslug: "phone",
    createdon: "19 Nov 2024",
    status: "Active",
  },
];

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>(fallbackCategories);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add category state
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const businessId = getActiveBusinessId();
      const res = await api.get<any[]>("/categories", { business_id: businessId });
      if (Array.isArray(res) && res.length > 0) {
        const mapped: CategoryItem[] = res.map((c: any) => ({
          id: c.id,
          category: c.name,
          categoryslug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
          createdon: c.created_at ? new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
          status: "Active",
        }));
        setCategories(mapped);
      } else {
        setCategories(fallbackCategories);
      }
    } catch (err) {
      console.warn("Failed to load categories, using fallback:", err);
      setCategories(fallbackCategories);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const businessId = getActiveBusinessId();
      await api.post("/categories", {
        name: newCatName.trim(),
        slug: newCatSlug.trim() || newCatName.toLowerCase().replace(/\s+/g, "-"),
        business_id: businessId,
      });
      setNewCatName("");
      setNewCatSlug("");
      await fetchCategories();
      const closeBtn = document.querySelector("#add-category [data-bs-dismiss='modal']") as HTMLElement;
      closeBtn?.click();
    } catch (err) {
      console.error("Failed to add category:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/categories/${deleteId}`);
      setDeleteId(null);
      await fetchCategories();
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  const filteredCategories = categories.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.category.toLowerCase().includes(q) ||
        item.categoryslug.toLowerCase().includes(q)
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
        <span className="badge bg-success fw-medium fs-10">{data.status}</span>
      ),
    },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: any) => (
        <div className="edit-delete-action d-flex align-items-center">
          <Link
            className="me-2 p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-customer"
          >
            <i className="feather icon-edit"></i>
          </Link>
          <Link
            className="p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            onClick={() => setDeleteId(row.id || null)}
          >
            <i className="feather icon-trash-2"></i>
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
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-category"
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add Category
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
                    {statusFilter ? statusFilter : "Status"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
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
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : Last 7 Days
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Desending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Last 7 Days
                      </Link>
                    </li>
                  </ul>
                </div>
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
            </div>
          </div>
          {/* /product list */}
        </div>
        <CommonFooter />
      </div>

      {/* Add Category */}
      <div className="modal fade" id="add-category">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Add Category</h4>
                  </div>
                  <button
                    type="button"
                    className="close bg-danger text-white fs-16"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <form onSubmit={handleAddCategory}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">
                        Category<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCatName}
                        onChange={(e) => {
                          setNewCatName(e.target.value);
                          setNewCatSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                        }}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Category Slug<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCatSlug}
                        onChange={(e) => setNewCatSlug(e.target.value)}
                      />
                    </div>
                    <div className="mb-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">
                          Status<span className="text-danger ms-1">*</span>
                        </span>
                        <input
                          type="checkbox"
                          id="user2"
                          className="check"
                          defaultChecked
                        />
                        <label htmlFor="user2" className="checktoggle" />
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
                      Add Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Category */}

      <EditCategoryList />
      <DeleteModal onConfirm={handleDelete} />
    </div>
  );
};

export default CategoryList;
