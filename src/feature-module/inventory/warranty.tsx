import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import CommonSelect from "../../components/select/common-select";
import DeleteModal from "../../components/delete-modal";
import { Editor } from "primereact/editor";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";

interface WarrantyItem {
  id: string;
  name: string;
  description: string;
  duration: string;
  period: string;
  status: string;
  raw: any;
}

const Warranty: React.FC = () => {
  const [warranties, setWarranties] = useState<WarrantyItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // Add Form state
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("1");
  const [selectedPeriod, setSelectedPeriod] = useState<any>({ label: "Month", value: "Month" });
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);

  // Edit Form state
  const [editingWarranty, setEditingWarranty] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState("1");
  const [editPeriod, setEditPeriod] = useState<any>({ label: "Month", value: "Month" });
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState(true);

  const [deleteWarrantyId, setDeleteWarrantyId] = useState<string | null>(null);

  const activeBusiness = getActiveBusinessId();

  const Period = [
    { label: "Month", value: "Month" },
    { label: "Year", value: "Year" },
  ];

  const fetchWarranties = useCallback(async () => {
    try {
      const data = await api.get('/warranties', { business_id: activeBusiness });
      const mapped = (Array.isArray(data) ? data : []).map((w: any) => ({
        id: w.id,
        name: w.name,
        description: w.description ? w.description.replace(/<[^>]*>?/gm, '') : '',
        duration: `${w.duration} ${w.period || 'Month'}`,
        period: w.period || 'Month',
        status: w.status || 'Active',
        raw: w
      }));
      setWarranties(mapped);
    } catch (err) {
      console.error("Failed to fetch warranties:", err);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchWarranties();
  }, [fetchWarranties]);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const handleAddWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !duration.trim()) return;
    try {
      await api.post('/warranties', {
        name: name.trim(),
        duration: duration.trim(),
        period: selectedPeriod?.value || selectedPeriod?.label || 'Month',
        description: description.trim(),
        status: status ? 'Active' : 'Inactive',
        business_id: activeBusiness
      });
      setName("");
      setDuration("1");
      setDescription("");
      setStatus(true);
      fetchWarranties();
      const closeBtn = document.querySelector('#add-units .close') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to add warranty');
    }
  };

  const handleStartEdit = (row: WarrantyItem) => {
    const w = row.raw;
    setEditingWarranty(w);
    setEditName(w.name || "");
    setEditDuration(w.duration || "1");
    setEditPeriod(w.period === 'Year' ? { label: "Year", value: "Year" } : { label: "Month", value: "Month" });
    setEditDescription(w.description || "");
    setEditStatus(w.status === 'Active');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarranty || !editName.trim() || !editDuration.trim()) return;
    try {
      await api.put(`/warranties/${editingWarranty.id}`, {
        name: editName.trim(),
        duration: editDuration.trim(),
        period: editPeriod?.value || editPeriod?.label || 'Month',
        description: editDescription.trim(),
        status: editStatus ? 'Active' : 'Inactive'
      });
      setEditingWarranty(null);
      fetchWarranties();
      const closeBtn = document.querySelector('#edit-units .close') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to update warranty');
    }
  };

  const handleDelete = async () => {
    if (!deleteWarrantyId) return;
    try {
      await api.delete(`/warranties/${deleteWarrantyId}`);
      setDeleteWarrantyId(null);
      fetchWarranties();
      const closeBtn = document.querySelector('#delete-modal [data-bs-dismiss="modal"]') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to delete warranty');
    }
  };

  const filteredWarranties = warranties.filter((item) => {
    if (!searchQuery) return true;
    return (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const columns = [
    {
      field: "name",
      header: "Name",
      key: "name",
      sortable: true,
    },
    {
      field: "description",
      header: "Description",
      key: "description",
      sortable: true,
    },
    {
      field: "duration",
      header: "Duration",
      key: "duration",
      sortable: true,
    },
    {
      field: "status",
      header: "Status",
      key: "status",
      sortable: true,
      body: (rowData: any) => (
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
      body: (row: WarrantyItem) => (
        <div className="edit-delete-action d-flex align-items-center">
          <Link
            className="me-2 p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#edit-units"
            onClick={() => handleStartEdit(row)}
          >
            <i className="feather icon-edit"></i>
          </Link>
          <Link
            className="p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            onClick={() => setDeleteWarrantyId(row.id)}
          >
            <i className="feather icon-trash-2"></i>
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
                <h4 className="fw-bold">Warranties</h4>
                <h6>Manage your warranties</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-units"
              >
                <i className="ti ti-circle-plus me-1"></i> Add Warranty
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
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={filteredWarranties}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={filteredWarranties.length}
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

      {/* Add Warranty */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Add Warranty</h4>
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
                <div className="modal-body">
                  <form onSubmit={handleAddWarranty}>
                    <div className="mb-3">
                      <label className="form-label">
                        Warranty<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter warranty name"
                        required
                      />
                    </div>
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Duration<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="e.g. 1, 6, 12"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Period<span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            className="w-100"
                            options={Period}
                            value={selectedPeriod}
                            onChange={(e: any) => setSelectedPeriod(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Description
                          </label>
                          <Editor
                            value={description}
                            onTextChange={(e: any) => setDescription(e.htmlValue || "")}
                            style={{ height: "150px" }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mb-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">Status</span>
                        <input
                          type="checkbox"
                          id="warranty-add-status"
                          className="check"
                          checked={status}
                          onChange={(e) => setStatus(e.target.checked)}
                        />
                        <label htmlFor="warranty-add-status" className="checktoggle" />
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
                        Add Warranty
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Warranty */}

      {/* Edit Warranty */}
      <div className="modal fade" id="edit-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Edit Warranty</h4>
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
                <div className="modal-body">
                  <form onSubmit={handleSaveEdit}>
                    <div className="mb-3">
                      <label className="form-label">
                        Warranty<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Duration<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editDuration}
                            onChange={(e) => setEditDuration(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Period<span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            className="w-100"
                            options={Period}
                            value={editPeriod}
                            onChange={(e: any) => setEditPeriod(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Description
                          </label>
                          <Editor
                            value={editDescription}
                            onTextChange={(e: any) => setEditDescription(e.htmlValue || "")}
                            style={{ height: "150px" }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mb-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">Status</span>
                        <input
                          type="checkbox"
                          id="warranty-edit-status"
                          className="check"
                          checked={editStatus}
                          onChange={(e) => setEditStatus(e.target.checked)}
                        />
                        <label htmlFor="warranty-edit-status" className="checktoggle" />
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
      {/* /Edit Warranty */}
      <DeleteModal onConfirm={handleDelete} />
    </>
  );
};

export default Warranty;
