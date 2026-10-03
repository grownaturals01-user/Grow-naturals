import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import PrimeDataTable from "../../components/data-table";
import UserModal from "../../core/modals/usermanagement/userModal";
import SearchFromApi from "../../components/data-table/search";
import { api } from "../../services/api";
import { user49 } from "../../utils/imagepath";

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== "All") {
        params.status = filterStatus.toLowerCase();
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      const res = await api.get<any[]>("/staff", params);
      if (Array.isArray(res)) {
        const mapped = res.map((u: any) => ({
          id: u.id,
          username: u.name || u.username,
          img: user49,
          phone: u.phone || "-",
          email: u.email || "-",
          role: u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : "Staff",
          createdon: u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN") : "-",
          status: u.status === "active" ? "Active" : "Inactive",
          raw: u,
        }));
        setUsers(mapped);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.warn("Failed to fetch staff:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/staff/${deleteId}`);
      setDeleteId(null);
      await fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const columns = [
    {
      header: "User Name",
      field: "username",
      sortable: true,
      key: "username",
      body: (rowData: any) => (
        <span className="userimgname">
          <Link to="#" className="avatar avatar-md me-2">
            <img alt="" src={rowData.img} />
          </Link>
          <div>
            <Link to="#">{rowData.username}</Link>
          </div>
        </span>
      ),
    },
    {
      header: "Phone",
      field: "phone",
      sortable: true,
      key: "phone",
    },
    {
      header: "Email",
      field: "email",
      sortable: true,
      key: "email",
    },
    {
      header: "Role",
      field: "role",
      sortable: true,
      key: "role",
    },
    {
      header: "Created On",
      field: "createdon",
      sortable: true,
      key: "createdon",
    },
    {
      header: "Status",
      field: "status",
      sortable: true,
      key: "status",
      body: (rowData: any) => (
        <div>
          {rowData.status === "Active" && (
            <span className="d-inline-flex align-items-center p-1 pe-2 rounded-1 text-white bg-success fs-10">
              <i className="ti ti-point-filled me-1 fs-11"></i>
              {rowData.status}
            </span>
          )}
          {rowData.status === "Inactive" && (
            <span className="d-inline-flex align-items-center p-1 pe-2 rounded-1 text-white bg-danger fs-10">
              <i className="ti ti-point-filled me-1 fs-11"></i>
              {rowData.status}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      field: "actions",
      sortable: false,
      key: "actions",
      body: (rowData: any) => (
        <div className="action-table-data">
          <div className="edit-delete-action">
            <Link
              className="me-2 p-2"
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#edit-user"
              onClick={() => setSelectedUser(rowData.raw)}
            >
              <i data-feather="edit" className="feather-edit"></i>
            </Link>
            <Link
              className="confirm-text p-2"
              to="#"
              data-bs-toggle="modal"
              data-bs-target="#delete-modal"
              onClick={() => setDeleteId(rowData.raw?.id)}
            >
              <i
                data-feather="trash-2"
                className="feather-trash-2"
              ></i>
            </Link>
          </div>
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
                <h4>User List</h4>
                <h6>Manage Your Users</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon />
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-added"
                data-bs-toggle="modal"
                data-bs-target="#add-user"
              >
                <i className="ti ti-circle-plus me-1"></i>
                Add New User
              </Link>
            </div>
          </div>
          {/* /product list */}
          <div className="card table-list-card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div className="search-set">
                <SearchFromApi
                  callback={handleSearch}
                  rows={rows}
                  setRows={setRows}
                />
              </div>
              <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-2">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Status: {filterStatus}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => { e.preventDefault(); setFilterStatus("All"); }}
                      >
                        All
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => { e.preventDefault(); setFilterStatus("Active"); }}
                      >
                        Active
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => { e.preventDefault(); setFilterStatus("Inactive"); }}
                      >
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
                  data={users}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={users.length}
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
      </div>
      <UserModal editUser={selectedUser} onSuccess={fetchUsers} />
      <div className="modal fade" id="delete-modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content p-5 px-3 text-center">
                <span className="rounded-circle d-inline-flex p-2 bg-danger-transparent mb-2">
                  <i className="ti ti-trash fs-24 text-danger" />
                </span>
                <h4 className="fs-20 fw-bold mb-2 mt-1">Delete User</h4>
                <p className="mb-0 fs-16">
                  Are you sure you want to delete user?
                </p>
                <div className="modal-footer-btn mt-3 d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary fs-13 fw-medium p-2 px-3"
                    data-bs-dismiss="modal"
                    onClick={handleDelete}
                  >
                    Yes Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
