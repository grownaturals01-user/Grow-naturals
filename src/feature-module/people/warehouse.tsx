import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import SearchFromApi from "../../components/data-table/search";
import CommonSelect from "../../components/select/common-select";
import DeleteModal from "../../components/delete-modal";
import { editSupplier } from "../../utils/imagepath";
import { api, getActiveBusinessId } from "../../services/api";

const Warehouse = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add form state
  const [addName, setAddName] = useState("");
  const [addContactPerson, setAddContactPerson] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [addCity, setAddCity] = useState("");
  const [addState, setAddState] = useState("");
  const [addCountry, setAddCountry] = useState("India");
  const [addPostalCode, setAddPostalCode] = useState("");

  // Edit form state
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editContactPerson, setEditContactPerson] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editCountry, setEditCountry] = useState("India");
  const [editPostalCode, setEditPostalCode] = useState("");

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

  const contactPersonOptions = [
    { label: "Select", value: "" },
    { label: "Rajesh Kumar", value: "Rajesh Kumar" },
    { label: "Nikhlesh Gowda", value: "Nikhlesh Gowda" },
    { label: "Warehouse Manager", value: "Warehouse Manager" },
  ];

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = getActiveBusinessId();
      const params: any = { business_id: businessId };
      if (searchQuery) params.search = searchQuery;
      const res = await api.get<any[]>("/warehouses", params);
      if (Array.isArray(res)) {
        const mapped = res.map((w: any) => ({
          id: w.id,
          warehouse: w.name,
          contactPerson: w.contact_person || "-",
          avatar: editSupplier,
          phone: w.phone || "-",
          totalProducts: w.total_products || 0,
          stock: w.total_stock || 0,
          qty: w.total_stock || 0,
          createdOn: w.created_at ? new Date(w.created_at).toLocaleDateString("en-IN") : "-",
          status: w.status || "Active",
          raw: w,
        }));
        setListData(mapped);
      } else {
        setListData([]);
      }
    } catch (err) {
      console.warn("Failed to load warehouses:", err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleEditClick = (row: any) => {
    const raw = row.raw || row;
    setEditingWarehouse(raw);
    setEditName(raw.name || "");
    setEditContactPerson(raw.contact_person || "");
    setEditEmail(raw.email || "");
    setEditPhone(raw.phone || "");
    setEditAddress(raw.address || "");
    setEditCity(raw.city || "");
    setEditState(raw.state || "");
    setEditCountry(raw.country || "India");
    setEditPostalCode(raw.postal_code || "");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!addName) return;
      const businessId = getActiveBusinessId();
      await api.post("/warehouses", {
        business_id: businessId,
        name: addName,
        contact_person: addContactPerson,
        email: addEmail,
        phone: addPhone,
        address: addAddress,
        city: addCity,
        state: addState,
        country: addCountry,
        postal_code: addPostalCode,
        status: "Active",
      });

      const modalEl = document.getElementById("add-warehouse");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      setAddName("");
      setAddContactPerson("");
      setAddEmail("");
      setAddPhone("");
      setAddAddress("");
      setAddCity("");
      setAddState("");
      setAddPostalCode("");
      await fetchWarehouses();
    } catch (err) {
      console.error("Failed to add warehouse:", err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouse) return;
    try {
      await api.put(`/warehouses/${editingWarehouse.id}`, {
        name: editName,
        contact_person: editContactPerson,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
        city: editCity,
        state: editState,
        country: editCountry,
        postal_code: editPostalCode,
      });

      const modalEl = document.getElementById("edit-warehouse");
      if (modalEl) {
        const closeBtn = modalEl.querySelector("[data-bs-dismiss='modal']") as HTMLElement;
        closeBtn?.click();
      }
      await fetchWarehouses();
    } catch (err) {
      console.error("Failed to update warehouse:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/warehouses/${deleteId}`);
      setDeleteId(null);
      await fetchWarehouses();
    } catch (err) {
      console.error("Failed to delete warehouse:", err);
    }
  };

  const columns = [
    { header: "Warehouse", field: "warehouse", key: "warehouse" },
    {
      header: "Contact Person",
      field: "contactPerson",
      key: "contactPerson",
      body: (data: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md">
            <img src={data.avatar} className="img-fluid rounded-2" alt="img" />
          </Link>
          <div className="ms-2">
            <p className="mb-0">
              <Link to="#" className="text-default">
                {data.contactPerson}
              </Link>
            </p>
          </div>
        </div>
      ),
    },
    { header: "Phone", field: "phone", key: "phone" },
    { header: "Total Products", field: "totalProducts", key: "totalProducts" },
    { header: "Stock", field: "stock", key: "stock" },
    { header: "Qty", field: "qty", key: "qty" },
    { header: "Created On", field: "createdOn", key: "createdOn" },
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
            data-bs-target="#edit-warehouse"
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

  const filteredData = listData.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return true;
  });

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Warehouses</h4>
                <h6>Manage your warehouses</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-warehouse"
              >
                <i className="ti ti-circle-plus me-1" />
                Add Warehouse
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
        <CommonFooter />
      </div>
      {/* Add Warehouse */}
      <div className="modal fade" id="add-warehouse">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Warehouse</h4>
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
                    <div className="mb-3">
                      <label className="form-label">
                        Warehouse Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={addContactPerson}
                        onChange={(e) => setAddContactPerson(e.target.value)}
                        placeholder="Enter contact person name"
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
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Phone
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={addPhone}
                        onChange={(e) => setAddPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Phone (Work)</label>
                      <input type="text" className="form-control" />
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
                        value={addCity}
                        onChange={(e: any) => setAddCity(e.value)}
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
                        value={addState}
                        onChange={(e: any) => setAddState(e.value)}
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
                        value={addCountry}
                        onChange={(e: any) => setAddCountry(e.value)}
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
                  Add Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Warehouse */}
      {/* Edit Warehouse */}
      <div className="modal fade" id="edit-warehouse">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Edit Warehouse</h4>
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
                    <div className="mb-3">
                      <label className="form-label">
                        Warehouse <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editContactPerson}
                        onChange={(e) => setEditContactPerson(e.target.value)}
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
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Phone
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Phone(Work)</label>
                      <input type="text" className="form-control" />
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
                  <div className="col-lg-6 col-sm-10 col-10">
                    <div className="mb-3">
                      <label className="form-label">
                        City
                      </label>
                      <CommonSelect
                        className="w-100"
                        options={cityOptions}
                        value={editCity}
                        onChange={(e: any) => setEditCity(e.value)}
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
                        value={editState}
                        onChange={(e: any) => setEditState(e.value)}
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
                        value={editCountry}
                        onChange={(e: any) => setEditCountry(e.value)}
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
                        value={editPostalCode}
                        onChange={(e) => setEditPostalCode(e.target.value)}
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
      {/* /Edit Warehouse */}
      <DeleteModal onConfirm={handleDelete} />
    </>
  );
};

export default Warehouse;
