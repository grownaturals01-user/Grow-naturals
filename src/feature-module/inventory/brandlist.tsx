import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import { brandIcon2 } from "../../utils/imagepath";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";

interface BrandItem {
  id: string;
  brand: string;
  logo: string;
  createdon: string;
  status: string;
  raw: any;
}

const BrandList: React.FC = () => {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // Form states for Add / Edit / Delete
  const [brandName, setBrandName] = useState("");
  const [brandStatus, setBrandStatus] = useState(true);

  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [editBrandName, setEditBrandName] = useState("");
  const [editBrandStatus, setEditBrandStatus] = useState(true);

  const [deleteBrandId, setDeleteBrandId] = useState<string | null>(null);

  const activeBusiness = getActiveBusinessId();

  const fetchBrands = useCallback(async () => {
    try {
      const data = await api.get('/brands', { business_id: activeBusiness });
      const mapped: BrandItem[] = (Array.isArray(data) ? data : []).map((b: any) => ({
        id: b.id,
        brand: b.name,
        logo: b.logo_url || brandIcon2,
        createdon: b.created_at ? new Date(b.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        status: b.status || 'Active',
        raw: b
      }));
      setBrands(mapped);
    } catch (err) {
      console.error("Failed to fetch brands:", err);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    try {
      await api.post('/brands', {
        name: brandName.trim(),
        status: brandStatus ? 'Active' : 'Inactive',
        business_id: activeBusiness
      });
      setBrandName("");
      setBrandStatus(true);
      fetchBrands();
      // Dismiss modal
      const closeBtn = document.querySelector('#add-brand .close') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to add brand');
    }
  };

  const handleStartEdit = (rowData: BrandItem) => {
    setEditingBrand(rowData.raw);
    setEditBrandName(rowData.raw.name);
    setEditBrandStatus(rowData.raw.status === 'Active');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editBrandName.trim()) return;
    try {
      await api.put(`/brands/${editingBrand.id}`, {
        name: editBrandName.trim(),
        status: editBrandStatus ? 'Active' : 'Inactive'
      });
      setEditingBrand(null);
      fetchBrands();
      const closeBtn = document.querySelector('#edit-brand .close') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to update brand');
    }
  };

  const handleDelete = async () => {
    if (!deleteBrandId) return;
    try {
      await api.delete(`/brands/${deleteBrandId}`);
      setDeleteBrandId(null);
      fetchBrands();
      const closeBtn = document.querySelector('#delete-modal [data-bs-dismiss="modal"]') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to delete brand');
    }
  };

  const filteredBrands = brands.filter((item) => {
    if (!searchQuery) return true;
    return item.brand.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const columns = [
    {
      field: "brand",
      header: "Brand",
      key: "brand",
      sortable: true,
    },
    {
      field: "logo",
      header: "Image",
      key: "logo",
      sortable: true,
      body: (rowData: BrandItem) => (
        <span className="productimgname">
          <Link to="#" className="product-img stock-img">
            <img alt="" src={rowData.logo} />
          </Link>
        </span>
      ),
      style: { width: "5%" },
    },
    {
      field: "createdon",
      header: "Created Date",
      key: "createdon",
      sortable: true,
    },
    {
      field: "status",
      header: "Status",
      key: "status",
      sortable: true,
      body: (rowData: BrandItem) => (
        <span className={`badge table-badge fw-medium fs-10 ${rowData.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
          {rowData.status}
        </span>
      ),
    },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: BrandItem) => (
        <div className="edit-delete-action d-flex align-items-center">
          <Link
            className="me-2 p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-brand"
            onClick={() => handleStartEdit(row)}
          >
            <i className="feather icon-edit"></i>
          </Link>
          <Link
            className="p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            onClick={() => setDeleteBrandId(row.id)}
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
                <h4 className="fw-bold">Brand</h4>
                <h6>Manage your brands</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-brand"
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add Brand
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
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Active
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
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
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
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
              <div className="table-responsive brand-table">
                <PrimeDataTable
                  column={columns}
                  data={filteredBrands}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={filteredBrands.length}
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
      <>
        {/* Add Brand */}
        <div className="modal fade" id="add-brand">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content">
                  <div className="modal-header">
                    <div className="page-title">
                      <h4>Add Brand</h4>
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
                  <div className="modal-body custom-modal-body new-employee-field">
                    <form onSubmit={handleAddBrand}>
                      <div className="profile-pic-upload mb-3">
                        <div className="profile-pic brand-pic">
                          <span>
                            <i className="feather icon-plus-circle plus-down-add" />{" "}
                            Add Image
                          </span>
                        </div>
                        <div>
                          <div className="image-upload mb-0">
                            <input type="file" />
                            <div className="image-uploads">
                              <h4>Upload Image</h4>
                            </div>
                          </div>
                          <p className="mt-2">JPEG, PNG up to 2 MB</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">
                          Brand<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="Enter brand name"
                          required
                        />
                      </div>
                      <div className="mb-0">
                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                          <span className="status-label">Status</span>
                          <input
                            type="checkbox"
                            id="brand-add-status"
                            className="check"
                            checked={brandStatus}
                            onChange={(e) => setBrandStatus(e.target.checked)}
                          />
                          <label htmlFor="brand-add-status" className="checktoggle" />
                        </div>
                      </div>
                      <div className="modal-footer px-0 pb-0 mt-3">
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
                          Add Brand
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Add Brand */}
        {/* Edit Brand */}
        <div className="modal fade" id="edit-brand">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content">
                  <div className="modal-header">
                    <div className="page-title">
                      <h4>Edit Brand</h4>
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
                  <div className="modal-body custom-modal-body new-employee-field">
                    <form onSubmit={handleSaveEdit}>
                      <div className="profile-pic-upload mb-3">
                        <div className="profile-pic brand-pic">
                          <span>
                            <img
                              src={brandIcon2}
                              alt="Img"
                            />
                          </span>
                          <Link to="#" className="remove-photo">
                            <i className="feather icon-x x-square-add" />
                          </Link>
                        </div>
                        <div>
                          <div className="image-upload mb-0">
                            <input type="file" />
                            <div className="image-uploads">
                              <h4>Change Image</h4>
                            </div>
                          </div>
                          <p className="mt-2">JPEG, PNG up to 2 MB</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">
                          Brand<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={editBrandName}
                          onChange={(e) => setEditBrandName(e.target.value)}
                          placeholder="Enter brand name"
                          required
                        />
                      </div>
                      <div className="mb-0">
                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                          <span className="status-label">Status</span>
                          <input
                            type="checkbox"
                            id="brand-edit-status"
                            className="check"
                            checked={editBrandStatus}
                            onChange={(e) => setEditBrandStatus(e.target.checked)}
                          />
                          <label htmlFor="brand-edit-status" className="checktoggle" />
                        </div>
                      </div>
                      <div className="modal-footer px-0 pb-0 mt-3">
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
        {/* Edit Brand */}
        <DeleteModal onConfirm={handleDelete} />
      </>
    </div>
  );
};

export default BrandList;
