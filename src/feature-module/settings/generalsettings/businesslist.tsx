import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import RefreshIcon from "../../../components/tooltip-content/refresh";
import CollapesIcon from "../../../components/tooltip-content/collapes";
import CommonFooter from "../../../components/footer/commonFooter";
import SettingsSideBar from "../settingssidebar";
import { useBusiness } from "../../../context/BusinessContext";
import { api } from "../../../services/api";
import { Business } from "../../../types";
import grownaturalsLogo from "../../../assets/grownaturalslogo.jpeg";

const BusinessList: React.FC = () => {
  const navigate = useNavigate();
  const {
    businesses,
    businessId,
    reloadBusinesses,
    switchBusiness,
    createBusiness,
    deleteBusiness,
    isBizActive,
    setBusinessStatus,
    activateAllBusinesses,
  } = useBusiness();

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBiz, setEditingBiz] = useState<Partial<Business> | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingBiz, setAddingBiz] = useState(false);
  const [newBiz, setNewBiz] = useState({
    name: "",
    legal_name: "",
    phone: "",
    email: "",
    gstin: "",
    address: "",
    invoice_prefix: "",
  });
  const [addError, setAddError] = useState<string | null>(null);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bizToDelete, setBizToDelete] = useState<Business | null>(null);
  const [deletingBiz, setDeletingBiz] = useState(false);

  // Toggling status state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Toast feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  // Filter businesses
  const filteredBusinesses = businesses.filter((b) => {
    if (b.id === "all") return false;
    const term = searchTerm.toLowerCase();
    return (
      b.name?.toLowerCase().includes(term) ||
      b.legal_name?.toLowerCase().includes(term) ||
      b.phone?.includes(term) ||
      b.email?.toLowerCase().includes(term) ||
      b.gstin?.toLowerCase().includes(term)
    );
  });

  const activeCount = filteredBusinesses.filter((b) => isBizActive(b)).length;

  // Toggle single business Active / Inactive status
  const handleToggleStatus = async (biz: Business) => {
    setTogglingId(biz.id);
    const currentlyActive = isBizActive(biz);
    const newStatus = currentlyActive ? "inactive" : "active";
    try {
      await setBusinessStatus(biz.id, newStatus);
      showNotification(
        `"${biz.name}" status changed to ${newStatus === "active" ? "Active" : "Inactive"}.`
      );
    } catch (err: any) {
      showNotification(err.message || "Failed to update business status", true);
    } finally {
      setTogglingId(null);
    }
  };

  // Activate Both / All stores at once
  const handleActivateAll = async () => {
    try {
      await activateAllBusinesses();
      showNotification("Both / All businesses have been set to Active!");
    } catch (err: any) {
      showNotification(err.message || "Failed to activate all businesses", true);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (biz: Business) => {
    setEditingBiz({ ...biz });
    setEditError(null);
    setShowEditModal(true);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBiz?.id) return;
    if (!editingBiz.name?.trim()) {
      setEditError("Business Name is required");
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      await api.put(`/businesses/${editingBiz.id}`, editingBiz);
      await reloadBusinesses();
      setShowEditModal(false);
      showNotification(`"${editingBiz.name}" updated successfully!`);
    } catch (err: any) {
      setEditError(err.message || "Failed to update business");
    } finally {
      setSavingEdit(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (biz: Business) => {
    setBizToDelete(biz);
    setShowDeleteModal(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!bizToDelete?.id) return;
    setDeletingBiz(true);
    try {
      await deleteBusiness(bizToDelete.id);
      await reloadBusinesses();
      setShowDeleteModal(false);
      showNotification(`"${bizToDelete.name}" deleted successfully.`);
    } catch (err: any) {
      showNotification(err.message || "Failed to delete business", true);
    } finally {
      setDeletingBiz(false);
    }
  };

  // Create Business
  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBiz.name.trim()) {
      setAddError("Business Name is required");
      return;
    }

    setAddingBiz(true);
    setAddError(null);
    try {
      const created = await createBusiness({
        name: newBiz.name.trim(),
        legal_name: newBiz.legal_name.trim() || newBiz.name.trim(),
        phone: newBiz.phone.trim(),
        email: newBiz.email.trim(),
        gstin: newBiz.gstin.trim(),
        address: newBiz.address.trim(),
        invoice_prefix: newBiz.invoice_prefix.trim(),
        is_taxable: !!newBiz.gstin.trim(),
        status: "active",
        is_active: true,
      });
      await reloadBusinesses();
      setShowAddModal(false);
      setNewBiz({
        name: "",
        legal_name: "",
        phone: "",
        email: "",
        gstin: "",
        address: "",
        invoice_prefix: "",
      });
      showNotification(`Business "${created.name}" created and set to Active!`);
    } catch (err: any) {
      setAddError(err.message || "Failed to create business");
    } finally {
      setAddingBiz(false);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content settings-content">
          {/* Page Header */}
          <div className="page-header settings-pg-header mb-3">
            <div className="add-item d-flex align-items-center">
              <div className="page-title">
                <h4 className="fw-bold mb-1">Business List</h4>
                <h6 className="text-muted">Manage all registered businesses and store statuses</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon />
              <CollapesIcon />
            </ul>
          </div>

          {/* Toast Alerts */}
          {actionSuccess && (
            <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-3">
              <i className="ti ti-check-circle fs-18 me-2" />
              <span>{actionSuccess}</span>
              <button
                type="button"
                className="btn-close"
                onClick={() => setActionSuccess(null)}
              />
            </div>
          )}
          {actionError && (
            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-3">
              <i className="ti ti-alert-triangle fs-18 me-2" />
              <span>{actionError}</span>
              <button
                type="button"
                className="btn-close"
                onClick={() => setActionError(null)}
              />
            </div>
          )}

          {/* Settings Wrapper */}
          <div className="row">
            <div className="col-xl-12">
              <div className="settings-wrapper d-flex">
                <SettingsSideBar />

                {/* Main Card */}
                <div className="card flex-fill mb-0">
                  <div className="card-header border-bottom py-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h4 className="fs-18 fw-bold mb-0">Registered Businesses</h4>
                        <span className="badge bg-success-light text-success fw-medium fs-12">
                          {activeCount} of {filteredBusinesses.length} Active
                        </span>
                      </div>
                      <p className="text-muted fs-12 mb-0">
                        Both or multiple businesses can be Active simultaneously.
                      </p>
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      {/* Active Both / All Quick Action */}
                      <button
                        type="button"
                        className="btn btn-outline-success d-inline-flex align-items-center"
                        onClick={handleActivateAll}
                        title="Set all businesses to Active"
                      >
                        <i className="ti ti-checks me-1" />
                        Active Both / All
                      </button>

                      {/* Both Stores Combined Scope Button */}
                      <button
                        type="button"
                        className={`btn ${
                          businessId === "all"
                            ? "btn-success text-white"
                            : "btn-outline-primary"
                        } d-inline-flex align-items-center`}
                        onClick={() => {
                          switchBusiness("all");
                          showNotification("Switched view to Both Stores Active (Combined View)");
                        }}
                        title="View and bill across both stores combined"
                      >
                        <i className="ti ti-layers-intersect me-1" />
                        {businessId === "all"
                          ? "Both Stores Active (Current)"
                          : "Select Both Stores (Combined)"}
                      </button>

                      <div className="search-input" style={{ minWidth: "180px" }}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Search business..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary d-inline-flex align-items-center"
                        onClick={() => setShowAddModal(true)}
                      >
                        <i className="ti ti-plus me-1" />
                        Add New Business
                      </button>
                    </div>
                  </div>

                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover table-center text-nowrap mb-0">
                        <thead className="thead-light">
                          <tr>
                            <th>Store / Business</th>
                            <th>Contact Information</th>
                            <th>GSTIN</th>
                            <th>Billing Address</th>
                            <th className="text-center">Status</th>
                            <th>Current Scope</th>
                            <th className="text-end pe-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBusinesses.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-5 text-muted">
                                <i className="ti ti-building-store fs-36 d-block mb-2 text-secondary opacity-50" />
                                No businesses found matching your criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredBusinesses.map((b) => {
                              const active = isBizActive(b);
                              const isSelectedScope = businessId === b.id;
                              const isCombinedScope = businessId === "all";

                              return (
                                <tr
                                  key={b.id}
                                  className={
                                    isSelectedScope
                                      ? "bg-light-primary"
                                      : isCombinedScope && active
                                      ? "bg-light"
                                      : ""
                                  }
                                >
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <img
                                        src={b.logo_url || grownaturalsLogo}
                                        alt={b.name}
                                        className="rounded me-3 border"
                                        style={{
                                          width: "42px",
                                          height: "42px",
                                          objectFit: "cover",
                                        }}
                                      />
                                      <div>
                                        <div className="d-flex align-items-center gap-2">
                                          <h6 className="fw-bold mb-0 fs-14">{b.name}</h6>
                                          {active && (
                                            <span
                                              className="badge bg-success"
                                              style={{ fontSize: "10px", padding: "2px 6px" }}
                                            >
                                              Live
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-muted fs-12">
                                          {b.legal_name || "Single Entity"}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="fs-13">
                                      {b.phone && (
                                        <div className="text-dark">
                                          <i className="ti ti-phone me-1 text-muted fs-12" />
                                          {b.phone}
                                        </div>
                                      )}
                                      {b.email && (
                                        <div className="text-muted">
                                          <i className="ti ti-mail me-1 text-muted fs-12" />
                                          {b.email}
                                        </div>
                                      )}
                                      {!b.phone && !b.email && (
                                        <span className="text-muted">-</span>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    {b.gstin ? (
                                      <span className="badge bg-light text-dark border font-monospace fs-12">
                                        {b.gstin}
                                      </span>
                                    ) : (
                                      <span className="badge bg-light text-muted border fs-12">
                                        Unregistered
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ maxWidth: "220px" }} className="text-truncate">
                                    <span className="fs-13 text-muted" title={b.address}>
                                      {b.address || "-"}
                                    </span>
                                  </td>

                                  {/* Status Column: Multiple / Both can be Active */}
                                  <td className="text-center">
                                    <div className="d-inline-flex align-items-center gap-2">
                                      <span
                                        className={`badge ${
                                          active
                                            ? "bg-success-light text-success"
                                            : "bg-light text-secondary border"
                                        } fw-bold px-2 py-1 fs-12`}
                                      >
                                        <i
                                          className={`ti ${
                                            active ? "ti-circle-check" : "ti-circle-x"
                                          } me-1`}
                                        />
                                        {active ? "Active" : "Inactive"}
                                      </span>

                                      <div className="form-check form-switch m-0">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          role="switch"
                                          checked={active}
                                          disabled={togglingId === b.id}
                                          onChange={() => handleToggleStatus(b)}
                                          title={`Click to set ${active ? "Inactive" : "Active"}`}
                                          style={{
                                            cursor: "pointer",
                                            width: "2.3em",
                                            height: "1.25em",
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </td>

                                  {/* Workspace Scope Indicator */}
                                  <td>
                                    {isSelectedScope ? (
                                      <span className="badge bg-primary text-white fs-11 px-2 py-1">
                                        <i className="ti ti-pin me-1" />
                                        Primary Scope
                                      </span>
                                    ) : isCombinedScope ? (
                                      <span className="badge bg-light-primary text-primary fs-11 px-2 py-1">
                                        In Combined Scope
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary fs-11 py-0 px-2"
                                        onClick={() => {
                                          switchBusiness(b.id);
                                          showNotification(`Switched primary store to "${b.name}"`);
                                        }}
                                      >
                                        Select Store
                                      </button>
                                    )}
                                  </td>

                                  <td className="text-end pe-4">
                                    <div className="d-inline-flex gap-2">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        title="Configure in Business Settings"
                                        onClick={() => {
                                          switchBusiness(b.id);
                                          navigate("/general-settings");
                                        }}
                                      >
                                        <i className="ti ti-settings me-1" />
                                        Configure
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-light border text-dark"
                                        title="Edit Business"
                                        onClick={() => handleOpenEdit(b)}
                                      >
                                        <i className="ti ti-edit" />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-light border text-danger"
                                        title="Delete Business"
                                        onClick={() => handleOpenDelete(b)}
                                      >
                                        <i className="ti ti-trash" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* ================= MODAL: EDIT BUSINESS ================= */}
      {showEditModal && editingBiz && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Edit Business Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                />
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4">
                  {editError && (
                    <div className="alert alert-danger py-2 mb-3">{editError}</div>
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        Business Display Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingBiz.name || ""}
                        onChange={(e) =>
                          setEditingBiz((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-meium">Legal Registered Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingBiz.legal_name || ""}
                        onChange={(e) =>
                          setEditingBiz((prev) => ({ ...prev, legal_name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingBiz.phone || ""}
                        onChange={(e) =>
                          setEditingBiz((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editingBiz.email || ""}
                        onChange={(e) =>
                          setEditingBiz((prev) => ({ ...prev, email: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">GSTIN</label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        value={editingBiz.gstin || ""}
                        onChange={(e) =>
                          setEditingBiz((prev) => ({
                            ...prev,
                            gstin: e.target.value.toUpperCase(),
                            is_taxable: !!e.target.value.trim(),
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Invoice Prefix</label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        placeholder="e.g. GN-"
                        value={editingBiz.invoice_prefix || ""}
                        onChange={(e) =>
                          setEditingBiz((prev) => ({
                            ...prev,
                            invoice_prefix: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Status</label>
                      <select
                        className="form-select form-control"
                        value={editingBiz.status || (editingBiz.is_active !== false ? "active" : "inactive")}
                        onChange={(e) =>
                          setEditingBiz((prev) => ({
                            ...prev,
                            status: e.target.value as "active" | "inactive",
                            is_active: e.target.value === "active",
                          }))
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Billing Address</label>
                      <textarea
                        rows={2}
                        className="form-control"
                        value={editingBiz.address || ""}
                        onChange={(e) =>
                          setEditingBiz((prev) => ({ ...prev, address: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD BUSINESS ================= */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Add New Business Entity</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                />
              </div>
              <form onSubmit={handleCreateBusiness}>
                <div className="modal-body p-4">
                  {addError && (
                    <div className="alert alert-danger py-2 mb-3">{addError}</div>
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">
                        Business Display Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Grow Naturals West"
                        value={newBiz.name}
                        onChange={(e) =>
                          setNewBiz((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Legal Registered Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Grow Naturals Enterprises LLP"
                        value={newBiz.legal_name}
                        onChange={(e) =>
                          setNewBiz((prev) => ({ ...prev, legal_name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 9876543210"
                        value={newBiz.phone}
                        onChange={(e) =>
                          setNewBiz((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. contact@domain.com"
                        value={newBiz.email}
                        onChange={(e) =>
                          setNewBiz((prev) => ({ ...prev, email: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">GSTIN</label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        placeholder="e.g. 33AAAAA0000A1Z5"
                        value={newBiz.gstin}
                        onChange={(e) =>
                          setNewBiz((prev) => ({
                            ...prev,
                            gstin: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Invoice Prefix</label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        placeholder="e.g. GNW-"
                        value={newBiz.invoice_prefix}
                        onChange={(e) =>
                          setNewBiz((prev) => ({
                            ...prev,
                            invoice_prefix: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Billing Address</label>
                      <textarea
                        rows={2}
                        className="form-control"
                        placeholder="Store address, Street, City, State"
                        value={newBiz.address}
                        onChange={(e) =>
                          setNewBiz((prev) => ({ ...prev, address: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={addingBiz}>
                    {addingBiz ? "Creating..." : "Create Business"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE BUSINESS ================= */}
      {showDeleteModal && bizToDelete && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                />
              </div>
              <div className="modal-body text-center px-4 pt-0">
                <div
                  className="avatar avatar-xl bg-light-danger text-danger rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{ width: "64px", height: "64px", backgroundColor: "#fee2e2" }}
                >
                  <i className="ti ti-trash fs-28" />
                </div>
                <h4 className="fw-bold mb-2">Delete Business?</h4>
                <p className="text-muted fs-14 mb-4">
                  Are you sure you want to permanently delete{" "}
                  <strong>&quot;{bizToDelete.name}&quot;</strong>? This action cannot be
                  undone.
                </p>
                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary px-4"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4"
                    disabled={deletingBiz}
                    onClick={handleConfirmDelete}
                  >
                    {deletingBiz ? "Deleting..." : "Yes, Delete Business"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BusinessList;
