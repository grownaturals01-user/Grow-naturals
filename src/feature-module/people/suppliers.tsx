import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import DeleteModal from "../../components/delete-modal";
import CommonSelect from "../../components/select/common-select";
import TableTopHead from "../../components/table-top-head";
import CommonFooter from "../../components/footer/commonFooter";
import { editSupplier } from "../../utils/imagepath";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";

const Suppliers = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add form state
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [addPostalCode, setAddPostalCode] = useState("");

  // Edit form state
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const cityOptions = [
    { label: "Select", value: "" },
    { label: "Bengaluru", value: "Bengaluru" },
    { label: "Chennai", value: "Chennai" },
    { label: "Mumbai", value: "Mumbai" },
    { label: "Delhi", value: "Delhi" },
  ];

  const stateOptions = [
    { label: "Select", value: "" },
    { label: "Karnataka", value: "Karnataka" },
    { label: "Tamil Nadu", value: "Tamil Nadu" },
    { label: "Maharashtra", value: "Maharashtra" },
  ];

  const countryOptions = [
    { label: "Select", value: "" },
    { label: "India", value: "India" },
  ];

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      const res = await api.get<any[]>("/suppliers", params);
      if (Array.isArray(res)) {
        const mapped = res.map((s: any) => ({
          id: s.id,
          code: s.id ? (s.id.length > 8 ? s.id.slice(-6).toUpperCase() : s.id) : "SUP-001",
          supplier: s.name || "Supplier",
          email: s.email || "-",
          phone: s.phone || "-",
          country: "India",
          status: "Active",
          avatar: editSupplier,
          raw: s,
        }));
        setListData(mapped);
      } else {
        setListData([]);
      }
    } catch (err) {
      console.warn("Failed to load suppliers:", err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleEditClick = (row: any) => {
    const raw = row.raw || row;
    setEditingSupplier(raw);
    const parts = (raw.name || "").split(" ");
    setEditFirstName(parts[0] || "");
    setEditLastName(parts.slice(1).join(" ") || "");
    setEditEmail(raw.email || "");
    setEditPhone(raw.phone || "");
    setEditAddress(raw.address || "");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fullName = `${addFirstName} ${addLastName}`.trim() || addFirstName;
      if (!fullName) return;
      const fullAddress = [addAddress, selectedCity, selectedState, addPostalCode]
        .filter(Boolean)
        .join(", ");
      await api.post("/suppliers", {
        name: fullName,
        contact_person: addFirstName,
        email: addEmail,
        phone: addPhone,
        address: fullAddress,
      });

      const modalEl = document.getElementById("add-supplier");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      setAddFirstName("");
      setAddLastName("");
      setAddEmail("");
      setAddPhone("");
      setAddAddress("");
      setAddPostalCode("");
      await fetchSuppliers();
    } catch (err) {
      console.error("Failed to add supplier:", err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    try {
      const fullName = `${editFirstName} ${editLastName}`.trim() || editFirstName;
      await api.put(`/suppliers/${editingSupplier.id}`, {
        name: fullName,
        contact_person: editFirstName,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
      });

      const modalEl = document.getElementById("edit-supplier");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      await fetchSuppliers();
    } catch (err) {
      console.error("Failed to update supplier:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/suppliers/${deleteId}`);
      setDeleteId(null);
      await fetchSuppliers();
    } catch (err) {
      console.error("Failed to delete supplier:", err);
    }
  };

  const columns = [
    { header: "Code", field: "code", key: "code" },
    {
      header: "Supplier",
      field: "supplier",
      key: "supplier",
      body: (data: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md">
            <img src={data.avatar} className="img-fluid rounded-2" alt="img" />
          </Link>
          <div className="ms-2">
            <p className="text-gray-9 mb-0">
              <Link to="#">{data.supplier}</Link>
            </p>
          </div>
        </div>
      ),
    },
    { header: "Email", field: "email", key: "email" },
    { header: "Phone", field: "phone", key: "phone" },
    { header: "Country", field: "country", key: "country" },
    {
      header: "Status",
      field: "status",
      key: "status",
      body: (data: any) => (
        <span className="badge badge-success d-inline-flex align-items-center badge-xs">
          <i className="ti ti-point-filled me-1"></i>
          {data.status}
        </span>
      ),
    },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: any) => (
        <div className="edit-delete-action">
          <Link className="me-2 p-2" to="#">
            <i className="feather icon-eye"></i>
          </Link>
          <Link
            className="me-2 p-2"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-supplier"
            onClick={() => handleEditClick(row)}
          >
            <i className="feather icon-edit"></i>
          </Link>
          <Link
            className="p-2"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            onClick={() => setDeleteId(row.id)}
          >
            <i className="feather icon-trash-2"></i>
          </Link>
        </div>
      ),
    },
  ];

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Suppliers</h4>
                <h6>Manage your suppliers</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-supplier"
              >
                <i className="ti ti-circle-plus me-1" />
                Add Supplier
              </Link>
            </div>
          </div>
          {/* /product list */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <SearchFromApi
                callback={handleSearch}
                rows={rows}
                setRows={setRows}
              />
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={listData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={listData.length}
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
      {/* Add Supplier */}
      <div className="modal fade" id="add-supplier">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Supplier</h4>
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
                    <div className="new-employee-field">
                      <div className="profile-pic-upload mb-2">
                        <div className="profile-pic">
                          <span>
                            <i className="feather icon-plus-circle plus-down-add" />
                            Add Image
                          </span>
                        </div>
                        <div className="mb-0">
                          <div className="image-upload mb-2">
                            <input type="file" />
                            <div className="image-uploads">
                              <h4>Upload Image</h4>
                            </div>
                          </div>
                          <p>JPEG, PNG up to 2 MB</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        First Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={addFirstName}
                        onChange={(e) => setAddFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={addLastName}
                        onChange={(e) => setAddLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Phone <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={addPhone}
                        onChange={(e) => setAddPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Address
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={addAddress}
                        onChange={(e) => setAddAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-sm-10 col-10">
                    <div className="mb-3">
                      <label className="form-label">
                        City
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={cityOptions}
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.value)}
                        placeholder="Select City"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-sm-10 col-10">
                    <div className="mb-3">
                      <label className="form-label">
                        State
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={stateOptions}
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.value)}
                        placeholder="Select State"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-sm-10 col-10">
                    <div className="mb-3">
                      <label className="form-label">
                        Country
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={countryOptions}
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.value)}
                        placeholder="Select Country"
                        filter={false}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={addPostalCode}
                        onChange={(e) => setAddPostalCode(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">Status</span>
                        <input
                          type="checkbox"
                          id="users5"
                          className="check"
                          defaultChecked
                        />
                        <label htmlFor="users5" className="checktoggle mb-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn me-2 btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Supplier */}
      {/* Edit Supplier */}
      <div className="modal fade" id="edit-supplier">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="content">
              <div className="modal-header">
                <div className="page-title">
                  <h4>Edit Supplier</h4>
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
                      <div className="new-employee-field">
                        <div className="profile-pic-upload edit-pic">
                          <div className="profile-pic">
                            <span>
                              <img src={editSupplier} alt="Img" />
                            </span>
                            <div className="close-img">
                              <i className="feather icon-x info-img" />
                            </div>
                          </div>
                          <div className="mb-0">
                            <div className="image-upload mb-0">
                              <input type="file" />
                              <div className="image-uploads">
                                <h4>Change Image</h4>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">
                          First Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Phone <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Address
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="mb-0">
                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                          <span className="status-label">Status</span>
                          <input
                            type="checkbox"
                            id="users6"
                            className="check"
                            defaultChecked
                          />
                          <label htmlFor="users6" className="checktoggle mb-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn me-2 btn-secondary"
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
      </div>
      {/* /Edit Supplier */}
      <DeleteModal onConfirm={handleDelete} />
    </>
  );
};

export default Suppliers;
