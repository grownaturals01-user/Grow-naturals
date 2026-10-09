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
import { Edit, Trash2, Eye, Receipt } from "lucide-react";

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
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add form state
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [addPostalCode, setAddPostalCode] = useState("");
  const [addCustomerType, setAddCustomerType] = useState<"retailer" | "wholesaler">("retailer");
  const [addCreditLimit, setAddCreditLimit] = useState<string>("0");

  // Edit form state
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCustomerType, setEditCustomerType] = useState<"retailer" | "wholesaler">("retailer");
  const [editCreditLimit, setEditCreditLimit] = useState<string>("0");

  // Invoices popup state
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false);

  const handleViewInvoices = async (cust: any) => {
    const raw = cust.raw || cust;
    setViewingCustomer(cust);
    setLoadingInvoices(true);
    setCustomerInvoices([]);
    try {
      const res: any = await api.get(`/customers/${raw.id || cust.id}`);
      if (res) {
        setViewingCustomer({ ...cust, ...res });
        if (Array.isArray(res.invoices)) {
          setCustomerInvoices(res.invoices);
        }
      }
    } catch (err) {
      console.error("Failed to fetch customer invoices:", err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      const res = await api.get<any[]>("/customers", params);
      if (Array.isArray(res)) {
        setRawCustomers(res);
        const mapped = res.map((c: any) => {
          const rawType = String(c.customer_type || "").toLowerCase();
          const cType = rawType === "wholesaler" ? "wholesaler" : "retailer";
          const limit = Number(c.credit_limit || 0);

          return {
            id: c.id,
            code: c.id ? (c.id.length > 8 ? c.id.slice(-6).toUpperCase() : c.id) : "CUST-001",
            customer: c.name || "Customer",
            email: c.email || "-",
            phone: c.phone || "-",
            customer_type: cType,
            customer_type_label: cType === "wholesaler" ? "Wholesaler" : "Retailer",
            credit_limit: limit,
            country: "India",
            status: "Active",
            avatar: user41,
            raw: c,
          };
        });
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
    const rawType = String(raw.customer_type || "").toLowerCase();
    setEditCustomerType(rawType === "wholesaler" ? "wholesaler" : "retailer");
    setEditCreditLimit(String(raw.credit_limit || 0));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const fullName = `${addFirstName} ${addLastName}`.trim() || addFirstName;
      if (!fullName) {
        setFormError("Customer first name is required.");
        return;
      }
      setIsSubmitting(true);
      const addressCombined = [addAddress, selectedCity, selectedState, addPostalCode]
        .filter(Boolean)
        .join(", ");
      await api.post("/customers", {
        name: fullName,
        email: addEmail,
        phone: addPhone,
        address: addressCombined,
        customer_type: addCustomerType,
        credit_limit: Number(addCreditLimit) || 0,
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
      setAddCustomerType("retailer");
      setAddCreditLimit("0");
      setFormError(null);
      await fetchCustomers();
    } catch (err: any) {
      console.error("Failed to add customer:", err);
      setFormError(err?.message || "Failed to create customer. Please check your inputs and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setFormError(null);
    try {
      const fullName = `${editFirstName} ${editLastName}`.trim() || editFirstName;
      if (!fullName) {
        setFormError("Customer first name is required.");
        return;
      }
      setIsSubmitting(true);
      await api.put(`/customers/${editingCustomer.id}`, {
        name: fullName,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
        customer_type: editCustomerType,
        credit_limit: Number(editCreditLimit) || 0,
      });

      const modalEl = document.getElementById("edit-customer");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      setFormError(null);
      await fetchCustomers();
    } catch (err: any) {
      console.error("Failed to update customer:", err);
      setFormError(err?.message || "Failed to update customer.");
    } finally {
      setIsSubmitting(false);
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
            <img src={data.avatar} alt="customer" />
          </Link>
          <div>
            <Link to="#" className="fw-semibold text-dark">{data.customer}</Link>
          </div>
        </div>
      ),
    },
    {
      header: "Customer Type",
      field: "customer_type_label",
      key: "customer_type",
      body: (data: any) => (
        <span
          className={`badge ${
            data.customer_type === "wholesaler"
              ? "bg-purple-transparent text-purple border border-purple-300"
              : "bg-info-transparent text-info border border-info-300"
          } px-2 py-1 fs-12 fw-medium rounded-pill`}
        >
          <i className={`ti ${data.customer_type === "wholesaler" ? "ti-building-store" : "ti-shopping-cart"} me-1`}></i>
          {data.customer_type_label}
        </span>
      ),
    },
    { header: "Phone", field: "phone", key: "phone" },
    { header: "Email", field: "email", key: "email" },
    {
      header: "Credit Limit",
      field: "credit_limit",
      key: "credit_limit",
      body: (data: any) => (
        <div>
          {data.credit_limit > 0 ? (
            <span className="fw-bold text-dark">
              ₹{Number(data.credit_limit).toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="text-muted fs-12">₹0 (No Limit)</span>
          )}
        </div>
      ),
    },
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
      header: "Actions",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: any) => (
        <div className="edit-delete-action d-flex align-items-center">
          <Link
            className="me-2 d-flex align-items-center justify-content-center btn btn-sm btn-outline-light border rounded text-info"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#customer-invoices-modal"
            onClick={() => handleViewInvoices(row)}
            title="View Invoices History"
            style={{ width: "32px", height: "32px" }}
          >
            <Eye size={16} className="text-info" />
          </Link>
          <Link
            className="me-2 d-flex align-items-center justify-content-center btn btn-sm btn-outline-light border rounded text-primary"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-customer"
            onClick={() => handleEditClick(row)}
            title="Edit Customer"
            style={{ width: "32px", height: "32px" }}
          >
            <Edit size={16} className="text-primary" />
          </Link>
          <Link
            className="d-flex align-items-center justify-content-center btn btn-sm btn-outline-light border rounded text-danger"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            onClick={() => setDeleteId(row.id)}
            title="Delete Customer"
            style={{ width: "32px", height: "32px" }}
          >
            <Trash2 size={16} className="text-danger" />
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
    if (typeFilter !== "all" && item.customer_type !== typeFilter) return false;
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
                <h6>Manage your customers, pricing tiers, and credit limits</h6>
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
                {/* Type Filter */}
                <div className="dropdown me-2">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Type: {typeFilter === "all" ? "All Types" : typeFilter === "wholesaler" ? "Wholesaler" : "Retailer"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setTypeFilter("all")}
                      >
                        All Types
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setTypeFilter("retailer")}
                      >
                        <i className="ti ti-shopping-cart text-info me-1"></i> Retailer
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setTypeFilter("wholesaler")}
                      >
                        <i className="ti ti-building-store text-purple me-1"></i> Wholesaler
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Status Filter */}
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Status: {statusFilter === "all" ? "All Status" : statusFilter}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setStatusFilter("all")}
                      >
                        All Status
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

      {/* Add Customer Modal */}
      <div className="modal fade" id="add-customer">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4 className="fw-bold">Add New Customer</h4>
                <p className="text-muted fs-12 mb-0">Enter customer information, account tier, and credit limit</p>
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
                {formError && (
                  <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center" role="alert">
                    <i className="ti ti-alert-circle me-2 fs-16"></i>
                    <div className="fs-13">{formError}</div>
                  </div>
                )}
                <div className="new-employee-field mb-3">
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
                  {/* Customer Type Selection */}
                  <div className="col-lg-6 mb-3">
                    <label className="form-label fw-semibold">
                      Customer Type<span className="text-danger ms-1">*</span>
                    </label>
                    <div className="d-flex gap-2">
                      <div
                        className={`form-check flex-fill border rounded p-2 px-3 d-flex align-items-center ${
                          addCustomerType === "retailer"
                            ? "border-primary bg-primary-transparent text-primary fw-semibold"
                            : "bg-light text-muted"
                        }`}
                        onClick={() => setAddCustomerType("retailer")}
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          className="form-check-input me-2"
                          type="radio"
                          name="addCustomerType"
                          id="addTypeRetailer"
                          checked={addCustomerType === "retailer"}
                          onChange={() => setAddCustomerType("retailer")}
                        />
                        <label className="form-check-label mb-0" htmlFor="addTypeRetailer" style={{ cursor: "pointer" }}>
                          <i className="ti ti-shopping-cart me-1"></i> Retailer
                        </label>
                      </div>
                      <div
                        className={`form-check flex-fill border rounded p-2 px-3 d-flex align-items-center ${
                          addCustomerType === "wholesaler"
                            ? "border-primary bg-primary-transparent text-primary fw-semibold"
                            : "bg-light text-muted"
                        }`}
                        onClick={() => setAddCustomerType("wholesaler")}
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          className="form-check-input me-2"
                          type="radio"
                          name="addCustomerType"
                          id="addTypeWholesaler"
                          checked={addCustomerType === "wholesaler"}
                          onChange={() => setAddCustomerType("wholesaler")}
                        />
                        <label className="form-check-label mb-0" htmlFor="addTypeWholesaler" style={{ cursor: "pointer" }}>
                          <i className="ti ti-building-store me-1"></i> Wholesaler
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Credit Limit Input */}
                  <div className="col-lg-6 mb-3">
                    <label className="form-label fw-semibold">
                      Credit Limit (₹)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted fw-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        className="form-control"
                        placeholder="0 (Unlimited / Pay-as-you-go)"
                        value={addCreditLimit}
                        onChange={(e) => setAddCreditLimit(e.target.value)}
                      />
                    </div>
                    <small className="text-muted fs-11">Set 0 for pay-on-order or enter allowed credit cap.</small>
                  </div>

                  {/* Name fields */}
                  <div className="col-lg-6 mb-3">
                    <label className="form-label fw-semibold">
                      First Name<span className="text-danger ms-1">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. John"
                      value={addFirstName}
                      onChange={(e) => setAddFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label className="form-label fw-semibold">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Doe"
                      value={addLastName}
                      onChange={(e) => setAddLastName(e.target.value)}
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="col-lg-6 mb-3">
                    <label className="form-label fw-semibold">
                      Phone<span className="text-danger ms-1">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="10-digit mobile number"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label className="form-label fw-semibold">
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. customer@example.com"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                    />
                  </div>

                  {/* Address */}
                  <div className="col-lg-12 mb-3">
                    <label className="form-label fw-semibold">
                      Address
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Street address, building, locality"
                      value={addAddress}
                      onChange={(e) => setAddAddress(e.target.value)}
                    />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label className="form-label">City</label>
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
                    <label className="form-label">State</label>
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
                    <label className="form-label">Country</label>
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
                    <label className="form-label">Postal Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="PIN / ZIP Code"
                      value={addPostalCode}
                      onChange={(e) => setAddPostalCode(e.target.value)}
                    />
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    "Add Customer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Customer */}

      {/* Edit Customer Modal */}
      <div className="modal fade" id="edit-customer">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4 className="fw-bold">Edit Customer</h4>
                <p className="text-muted fs-12 mb-0">Update customer details, type, and credit limit</p>
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
                {formError && (
                  <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center" role="alert">
                    <i className="ti ti-alert-circle me-2 fs-16"></i>
                    <div className="fs-13">{formError}</div>
                  </div>
                )}
                <div className="new-employee-field mb-3">
                  <div className="profile-pic-upload image-field">
                    <div className="profile-pic p-2">
                      <img
                        src={user41}
                        className="object-fit-cover h-100 rounded-1"
                        alt="user"
                      />
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
                  {/* Customer Type Selection */}
                  <div className="col-lg-6 mb-3">
                    <label className="form-label fw-semibold">
                      Customer Type<span className="text-danger ms-1">*</span>
                    </label>
                    <div className="d-flex gap-2">
                      <div
                        className={`form-check flex-fill border rounded p-2 px-3 d-flex align-items-center ${
                          editCustomerType === "retailer"
                            ? "border-primary bg-primary-transparent text-primary fw-semibold"
                            : "bg-light text-muted"
                        }`}
                        onClick={() => setEditCustomerType("retailer")}
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          className="form-check-input me-2"
                          type="radio"
                          name="editCustomerType"
                          id="editTypeRetailer"
                          checked={editCustomerType === "retailer"}
                          onChange={() => setEditCustomerType("retailer")}
                        />
                        <label className="form-check-label mb-0" htmlFor="editTypeRetailer" style={{ cursor: "pointer" }}>
                          <i className="ti ti-shopping-cart me-1"></i> Retailer
                        </label>
                      </div>
                      <div
                        className={`form-check flex-fill border rounded p-2 px-3 d-flex align-items-center ${
                          editCustomerType === "wholesaler"
                            ? "border-primary bg-primary-transparent text-primary fw-semibold"
                            : "bg-light text-muted"
                        }`}
                        onClick={() => setEditCustomerType("wholesaler")}
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          className="form-check-input me-2"
                          type="radio"
                          name="editCustomerType"
                          id="editTypeWholesaler"
                          checked={editCustomerType === "wholesaler"}
                          onChange={() => setEditCustomerType("wholesaler")}
                        />
                        <label className="form-check-label mb-0" htmlFor="editTypeWholesaler" style={{ cursor: "pointer" }}>
                          <i className="ti ti-building-store me-1"></i> Wholesaler
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Credit Limit Input */}
                  <div className="col-lg-6 mb-3">
                    <label className="form-label fw-semibold">
                      Credit Limit (₹)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted fw-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        className="form-control"
                        placeholder="0 (Unlimited / Pay-as-you-go)"
                        value={editCreditLimit}
                        onChange={(e) => setEditCreditLimit(e.target.value)}
                      />
                    </div>
                    <small className="text-muted fs-11">Set 0 for pay-on-order or specify allowed credit limit.</small>
                  </div>

                  {/* Name fields */}
                  <div className="col-lg-6 mb-3">
                    <label className="form-label fw-semibold">
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
                    <label className="form-label fw-semibold">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                    />
                  </div>

                  {/* Contact info */}
                  <div className="col-lg-6 mb-3">
                    <label className="form-label fw-semibold">
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
                  <div className="col-lg-6 mb-3">
                    <label className="form-label fw-semibold">
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>

                  {/* Address */}
                  <div className="col-lg-12 mb-3">
                    <label className="form-label fw-semibold">
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Customer */}

      {/* Customer Invoices & Billing History Modal */}
      <div className="modal fade" id="customer-invoices-modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content shadow-lg border-0">
            <div className="modal-header border-bottom bg-light px-4 py-3">
              <div className="d-flex align-items-center gap-3">
                <div className="avatar avatar-md bg-primary-transparent text-primary rounded-circle d-flex align-items-center justify-content-center">
                  <Receipt size={22} />
                </div>
                <div>
                  <h5 className="modal-title fw-bold mb-0">Customer Invoices & Billing History</h5>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span className="fw-semibold text-dark fs-14">{viewingCustomer?.customer || viewingCustomer?.name}</span>
                    <span className="badge bg-secondary-transparent text-secondary fs-11">{viewingCustomer?.code}</span>
                    <span className={`badge ${viewingCustomer?.customer_type === 'wholesaler' ? 'bg-purple-transparent text-purple' : 'bg-info-transparent text-info'} fs-11`}>
                      {viewingCustomer?.customer_type === 'wholesaler' ? 'Wholesaler' : 'Retailer'}
                    </span>
                    {viewingCustomer?.phone && viewingCustomer?.phone !== '-' && (
                      <span className="text-muted fs-12 ms-2">📞 {viewingCustomer?.phone}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body p-4">
              {/* Financial Metrics Summary Cards */}
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div className="card border bg-light-50 shadow-none mb-0 h-100">
                    <div className="card-body p-3">
                      <div className="text-muted fs-12 fw-medium mb-1">Total Invoices</div>
                      <h4 className="fw-bold mb-0 text-dark">
                        {loadingInvoices ? "..." : customerInvoices.length}
                      </h4>
                      <small className="text-muted fs-11">Lifetime orders</small>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card border bg-light-50 shadow-none mb-0 h-100">
                    <div className="card-body p-3">
                      <div className="text-muted fs-12 fw-medium mb-1">Total Spent</div>
                      <h4 className="fw-bold mb-0 text-success">
                        ₹{Number(viewingCustomer?.total_spent || customerInvoices.reduce((s: number, inv: any) => s + Number(inv.total_amount || 0), 0)).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </h4>
                      <small className="text-muted fs-11">Total billing value</small>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card border bg-light-50 shadow-none mb-0 h-100">
                    <div className="card-body p-3">
                      <div className="text-muted fs-12 fw-medium mb-1">Unpaid / Closing Balance</div>
                      <h4 className={`fw-bold mb-0 ${Number(viewingCustomer?.closing_balance || 0) > 0 ? "text-danger" : "text-dark"}`}>
                        ₹{Number(viewingCustomer?.closing_balance || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </h4>
                      <small className="text-muted fs-11">
                        {Number(viewingCustomer?.closing_balance || 0) > 0 ? "Outstanding dues" : "All cleared"}
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="card border bg-light-50 shadow-none mb-0 h-100">
                    <div className="card-body p-3">
                      <div className="text-muted fs-12 fw-medium mb-1">Credit Limit</div>
                      <h4 className="fw-bold mb-0 text-primary">
                        {Number(viewingCustomer?.credit_limit || 0) > 0 
                          ? `₹${Number(viewingCustomer?.credit_limit).toLocaleString("en-IN")}`
                          : "No Limit"}
                      </h4>
                      <small className="text-muted fs-11">
                        {Number(viewingCustomer?.credit_limit || 0) > 0
                          ? `Available: ₹${Number(viewingCustomer?.available_credit || 0).toLocaleString("en-IN")}`
                          : "Pay-as-you-go"}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices List Section */}
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                  <Receipt size={18} className="text-primary" />
                  Previous Invoices & Transactions
                </h6>
                <span className="badge bg-primary text-white px-2 py-1 fs-12">
                  {customerInvoices.length} {customerInvoices.length === 1 ? "Invoice" : "Invoices"}
                </span>
              </div>

              {loadingInvoices ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted fs-13 mb-0">Loading customer invoices history...</p>
                </div>
              ) : customerInvoices.length === 0 ? (
                <div className="text-center py-5 bg-light rounded-3 border">
                  <div className="avatar avatar-xl bg-light text-muted rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center border">
                    <Receipt size={32} />
                  </div>
                  <h6 className="fw-bold text-dark mb-1">No Previous Invoices Found</h6>
                  <p className="text-muted fs-13 mb-0">This customer does not have any recorded invoices or orders yet.</p>
                </div>
              ) : (
                <div className="table-responsive border rounded-3">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="fs-12 fw-bold text-uppercase py-3">Invoice #</th>
                        <th className="fs-12 fw-bold text-uppercase py-3">Date</th>
                        <th className="fs-12 fw-bold text-uppercase py-3">Branch / Store</th>
                        <th className="fs-12 fw-bold text-uppercase py-3 text-end">Amount</th>
                        <th className="fs-12 fw-bold text-uppercase py-3">Payment Method</th>
                        <th className="fs-12 fw-bold text-uppercase py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerInvoices.map((inv: any, idx: number) => {
                        const status = (inv.payment_status || 'unpaid').toLowerCase();
                        const isPaid = status === 'paid';
                        const isPartial = status === 'partial';
                        const isCancelled = status === 'cancelled';

                        const dateStr = inv.created_at || inv.issue_date || inv.invoice_date;
                        const formattedDate = dateStr
                          ? new Date(dateStr).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-";

                        return (
                          <tr key={inv.id || idx}>
                            <td className="fw-bold text-primary">
                              {inv.invoice_number || inv.id || `INV-${idx + 1}`}
                            </td>
                            <td className="text-muted fs-13">{formattedDate}</td>
                            <td>
                              <span className="badge bg-light text-dark border fw-normal">
                                {inv.business_name || inv.outlet || "Grow Naturals"}
                              </span>
                            </td>
                            <td className="text-end fw-bold text-dark fs-14">
                              ₹{Number(inv.total_amount || 0).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td>
                              <span className="badge bg-light text-secondary border text-capitalize">
                                {inv.payment_method || "Cash"}
                              </span>
                            </td>
                            <td className="text-center">
                              <span
                                className={`badge px-2 py-1 rounded-pill fs-11 ${
                                  isPaid
                                    ? "bg-success text-white"
                                    : isPartial
                                    ? "bg-warning text-dark"
                                    : isCancelled
                                    ? "bg-secondary text-white"
                                    : "bg-danger text-white"
                                }`}
                              >
                                {isPaid ? "Paid" : isPartial ? "Partial" : isCancelled ? "Cancelled" : "Unpaid"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer bg-light border-top px-4 py-3">
              <button
                type="button"
                className="btn btn-secondary fs-13 px-4"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* /Customer Invoices Modal */}

      <DeleteModal onConfirm={handleDelete} />
    </>
  );
};

export default Customers;
