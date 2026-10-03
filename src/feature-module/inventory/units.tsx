import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";

export const Units = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // Form states
  const [unitName, setUnitName] = useState("");
  const [shortName, setShortName] = useState("");
  const [unitStatus, setUnitStatus] = useState(true);

  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [editUnitName, setEditUnitName] = useState("");
  const [editShortName, setEditShortName] = useState("");
  const [editUnitStatus, setEditUnitStatus] = useState(true);

  const [deleteUnitId, setDeleteUnitId] = useState<string | null>(null);

  const activeBusiness = getActiveBusinessId();

  const fetchUnits = useCallback(async () => {
    try {
      const data = await api.get('/units', { business_id: activeBusiness });
      const mapped = (Array.isArray(data) ? data : []).map((u: any) => ({
        id: u.id,
        unit: u.name,
        shortname: u.short_name,
        noofproducts: u.noofproducts || 0,
        createdon: u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        status: u.status || 'Active',
        raw: u
      }));
      setUnits(mapped);
    } catch (err) {
      console.error("Failed to fetch units:", err);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim() || !shortName.trim()) return;
    try {
      await api.post('/units', {
        name: unitName.trim(),
        short_name: shortName.trim(),
        status: unitStatus ? 'Active' : 'Inactive',
        business_id: activeBusiness
      });
      setUnitName("");
      setShortName("");
      setUnitStatus(true);
      fetchUnits();
      const closeBtn = document.querySelector('#add-units .close') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to add unit');
    }
  };

  const handleStartEdit = (rowData: any) => {
    setEditingUnit(rowData.raw);
    setEditUnitName(rowData.raw.name);
    setEditShortName(rowData.raw.short_name);
    setEditUnitStatus(rowData.raw.status === 'Active');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit || !editUnitName.trim() || !editShortName.trim()) return;
    try {
      await api.put(`/units/${editingUnit.id}`, {
        name: editUnitName.trim(),
        short_name: editShortName.trim(),
        status: editUnitStatus ? 'Active' : 'Inactive'
      });
      setEditingUnit(null);
      fetchUnits();
      const closeBtn = document.querySelector('#edit-units .close') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to update unit');
    }
  };

  const handleDelete = async () => {
    if (!deleteUnitId) return;
    try {
      await api.delete(`/units/${deleteUnitId}`);
      setDeleteUnitId(null);
      fetchUnits();
      const closeBtn = document.querySelector('#delete-modal [data-bs-dismiss="modal"]') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || 'Failed to delete unit');
    }
  };

  const filteredUnits = units.filter((item) => {
    if (!searchQuery) return true;
    return (
      item.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shortname.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const columns = [
    {
      field: "unit",
      header: "Unit",
      key: "unit",
      sortable: true,
    },
    {
      field: "shortname",
      header: "Short Name",
      key: "shortname",
      sortable: true,
    },
    {
      field: "noofproducts",
      header: "No of Products",
      key: "noofproducts",
      sortable: true,
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
      body: (row: any) => (
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
            onClick={() => setDeleteUnitId(row.id)}
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
                <h4 className="fw-bold">Units</h4>
                <h6>Manage your units</h6>
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
                <i className="ti ti-circle-plus me-1"></i> Add Unit
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
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={filteredUnits}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={filteredUnits.length}
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

      {/* Add Unit */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Add Unit</h4>
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
                  <form onSubmit={handleAddUnit}>
                    <div className="mb-3">
                      <label className="form-label">
                        Unit<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={unitName}
                        onChange={(e) => setUnitName(e.target.value)}
                        placeholder="Enter unit name (e.g. Kilogram, Box)"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Short Name<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={shortName}
                        onChange={(e) => setShortName(e.target.value)}
                        placeholder="Enter short code (e.g. kg, bx)"
                        required
                      />
                    </div>
                    <div className="mb-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">Status</span>
                        <input
                          type="checkbox"
                          id="unit-add-status"
                          className="check"
                          checked={unitStatus}
                          onChange={(e) => setUnitStatus(e.target.checked)}
                        />
                        <label htmlFor="unit-add-status" className="checktoggle" />
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
                        Add Unit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Unit */}

      {/* Edit Unit */}
      <div className="modal fade" id="edit-units">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Edit Unit</h4>
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
                        Unit<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editUnitName}
                        onChange={(e) => setEditUnitName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Short Name<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editShortName}
                        onChange={(e) => setEditShortName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <span className="status-label">Status</span>
                        <input
                          type="checkbox"
                          id="unit-edit-status"
                          className="check"
                          checked={editUnitStatus}
                          onChange={(e) => setEditUnitStatus(e.target.checked)}
                        />
                        <label htmlFor="unit-edit-status" className="checktoggle" />
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
      {/* /Edit Unit */}
      <DeleteModal onConfirm={handleDelete} />
    </>
  );
};
