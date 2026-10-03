import PrimeDataTable from "../../components/data-table";
import SearchFromApi from "../../components/data-table/search";
import DeleteModal from "../../components/delete-modal";
import CommonSelect from "../../components/select/common-select";
import { user41 } from "../../utils/imagepath";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import { api } from "../../services/api";

const Customers = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [rawCustomers, setRawCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add form state
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [addPostalCode, setAddPostalCode] = useState("");

  // Edit form state
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      const res = await api.get<any[]>("/customers", params);
      if (Array.isArray(res)) {
        setRawCustomers(res);
        const mapped = res.map((c: any) => ({
          id: c.id,
          code: c.id ? (c.id.length > 8 ? c.id.slice(-6).toUpperCase() : c.id) : "CUST-001",
          customer: c.name || "Customer",
          email: c.email || "-",
          phone: c.phone || "-",
          country: "India",
          status: "Active",
          avatar: user41,
          raw: c,
        }));
        setListData(mapped);
      } else {
        setRawCustomers([]);
        setListData([]);
      }
    } catch (err) {
      console.warn("Failed to load customers:", err);
      setRawCustomers([]);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleEditClick = (cust: any) => {
    const raw = cust.raw || cust;
    setEditingCustomer(raw);
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
      const addressCombined = [addAddress, selectedCity, selectedState, addPostalCode]
        .filter(Boolean)
        .join(", ");
      await api.post("/customers", {
        name: fullName,
        email: addEmail,
        phone: addPhone,
        address: addressCombined,
        customer_type: "customer",
      });

      const modalEl = document.getElementById("add-customer");
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
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to add customer:", err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      const fullName = `${editFirstName} ${editLastName}`.trim() || editFirstName;
      await api.put(`/customers/${editingCustomer.id}`, {
        name: fullName,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
      });

      const modalEl = document.getElementById("edit-customer");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to update customer:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/customers/${deleteId}`);
      setDeleteId(null);
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to delete customer:", err);
    }
  };

  const columns = [
    { header: "Code", field: "code", key: "code" },
    {
      header: "Customer",
      field: "customer",
      key: "customer",
      body: (data: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2">
            <img src={data.avatar} alt="product" />
          </Link>
          <Link to="#">{data.customer}</Link>
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
        <span
          className={`d-inline-flex align-items-center p-1 pe-2 rounded-1 text-white bg-${
            data.status === "Active" ? "success" : "danger"
          } fs-10`}
        >
          <i className="ti ti-point-filled me-1 fs-11"></i>
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
        <div className="edit-delete-action d-flex align-items-center">
          <Link
            className="me-2 p-2 d-flex align-items-center border rounded"
            to="#"
          >
            <i className="feather icon-eye"></i>
          </Link>
          <Link
            className="me-2 p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-customer"
            onClick={() => handleEditClick(row)}
          >
            <i className="feather icon-edit"></i>
          </Link>
          <Link
            className="p-2 d-flex align-items-center border rounded"
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

  const filteredData = listData.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return true;
  });

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

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4 className="fw-bold">Customers</h4>
                <h6>Manage your customers</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <li onClick={() => fetchCustomers()}>
                <RefreshIcon />
              </li>
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary text-white"
                data-bs-toggle="modal"
                data-bs-target="#add-customer"
              >
                <i className="ti ti-circle-plus me-1" />
                Add Customer
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
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Status: {statusFilter === "all" ? "All" : statusFilter}
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
            <div className="card-body p-0">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={filteredData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={filteredData.length}
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
          <p className="mb-0 text-gray-9">
            2014 - 2025 © DreamsPOS. All Right Reserved
          </p>
          <p>
            Designed &amp; Developed by{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>
      {/* Add Customer */}
      <div className="modal fade" id="add-customer">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Customer</h4>
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
                <div className="new-employee-field">
                  <div className="profile-pic-upload">
                    <div className="profile-pic">
                      <span>
                        <i className="feather icon-plus-circle plus-down-add" />{" "}
                        Add Image
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="image-upload mb-0">
                        <input type="file" />
                        <div className="image-uploads">
                          <h4>Upload Image</h4>
                        </div>
                      </div>
                      <p className="mt-2">JPEG, PNG up to 2 MB</p>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-6 mb-3">
                    <label className="form-label">
                      First Name<span className="text-danger ms-1">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={addFirstName}
                      onChange={(e) => setAddFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-lg-6 mb-3">
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
                  <div className="col-lg-12 mb-3">
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
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">
                      Phone<span className="text-danger ms-1">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-lg-12 mb-3">
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
                  <div className="col-lg-6 mb-3">
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
                  <div className="col-lg-6 mb-3">
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
                  <div className="col-lg-6 mb-3">
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
                  <div className="col-lg-6 mb-3">
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
                  <div className="col-lg-12">
                    <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                      <span className="status-label">Status</span>
                      <input
                        type="checkbox"
                        id="user1"
                        className="check"
                        defaultChecked
                      />
                      <label htmlFor="user1" className="checktoggle">
                        {" "}
                      </label>
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
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Customer */}
      {/* Edit Customer */}
      <div className="modal fade" id="edit-customer">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Edit Customer</h4>
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
                    <div className="new-employee-field">
                      <div className="profile-pic-upload image-field">
                        <div className="profile-pic p-2">
                          <img
                            src={user41}
                            className="object-fit-cover h-100 rounded-1"
                            alt="user"
                          />
                          <button type="button" className="close rounded-1">
                            <span aria-hidden="true">×</span>
                          </button>
                        </div>
                        <div className="mb-3">
                          <div className="image-upload mb-0">
                            <input type="file" />
                            <div className="image-uploads">
                              <h4>Change Image</h4>
                            </div>
                          </div>
                          <p className="mt-2">JPEG, PNG up to 2 MB</p>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-6 mb-3">
                        <label className="form-label">
                          First Name<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-lg-6 mb-3">
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
                      <div className="col-lg-12 mb-3">
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
                      <div className="col-lg-12 mb-3">
                        <label className="form-label">
                          Phone<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-lg-12 mb-3">
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
                      <div className="col-lg-12">
                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                          <span className="status-label">Status</span>
                          <input
                            type="checkbox"
                            id="user2"
                            className="check"
                            defaultChecked
                          />
                          <label htmlFor="user2" className="checktoggle">
                            {" "}
                          </label>
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
      {/* /Edit Customer */}
      <DeleteModal onConfirm={handleDelete} />
    </>
  );
};

export default Customers;
