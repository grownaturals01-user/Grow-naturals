import { Link } from "react-router-dom";
import OnlineorderModal from "./onlineorderModal";
import CommonFooter from "../../../components/footer/commonFooter";
import TableTopHead from "../../../components/table-top-head";
import SearchFromApi from "../../../components/data-table/search";
import { useState, useEffect, useCallback } from "react";
import PrimeDataTable from "../../../components/data-table";
import { api, getActiveBusinessId } from "../../../services/api";

const OnlineOrder = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = getActiveBusinessId();
      const params: any = { business_id: businessId };
      if (searchQuery) params.search = searchQuery;
      const res = await api.get<any[]>("/delivery-challans", params);
      if (Array.isArray(res)) {
        const mapped = res.map((dc: any) => ({
          id: dc.id,
          reference: dc.challan_number || (dc.id ? dc.id.slice(-6).toUpperCase() : "-"),
          date: dc.delivery_date ? new Date(dc.delivery_date).toLocaleDateString("en-IN") : (dc.created_at ? new Date(dc.created_at).toLocaleDateString("en-IN") : "-"),
          status: dc.status === "delivered" ? "Completed" : "Pending",
          total: `₹${Number(dc.total_amount || 0).toLocaleString("en-IN")}`,
          paid: `₹${Number(dc.paid_amount || 0).toLocaleString("en-IN")}`,
          due: `₹${Number((dc.total_amount || 0) - (dc.paid_amount || 0)).toLocaleString("en-IN")}`,
          paymentstatus: dc.payment_status === "paid" ? "Paid" : "Unpaid",
          biller: dc.business_name || "Admin",
          raw: dc,
        }));
        setOrders(mapped);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn("Failed to load delivery challans:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/delivery-challans/${deleteId}`);
      setDeleteId(null);
      await fetchOrders();
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const columns = [
    {
      header: "Reference",
      field: "reference",
      sortable: true,
      key: "reference",
    },
    {
      header: "Date",
      field: "date",
      sortable: true,
      key: "date",
    },
    {
      header: "Status",
      field: "status",
      sortable: true,
      key: "status",
      body: (rowData: any) => (
        <span
          className={`badge ${rowData.status === "Pending" ? "badge-cyan" : rowData.status === "Completed" ? "badge-success" : ""} `}
        >
          {rowData.status}
        </span>
      ),
    },
    {
      header: "Grand Total",
      field: "total",
      sortable: true,
      key: "total",
    },
    {
      header: "Paid",
      field: "paid",
      sortable: true,
      key: "paid",
    },
    {
      header: "Due",
      field: "due",
      sortable: true,
      key: "due",
    },
    {
      header: "Payment Status",
      field: "paymentstatus",
      sortable: true,
      key: "paymentstatus",
      body: (rowData: any) => (
        <span
          className={`badge badge-xs shadow-none ${rowData.paymentstatus === "Unpaid" ? "badge-soft-danger" : rowData.paymentstatus === "Paid" ? "badge-soft-success" : "badge-soft-warning"} `}
        >
          <i className="ti ti-point-filled me-1"></i>
          {rowData.paymentstatus}
        </span>
      ),
    },
    {
      header: "Biller",
      field: "biller",
      sortable: true,
      key: "biller",
    },
    {
      header: "",
      field: "action",
      sortable: false,
      key: "action",
      body: (row: any) => (
        <div className="text-center">
          <Link
            className="action-set"
            to="#"
            data-bs-toggle="dropdown"
            aria-expanded="true"
          >
            <i className="fa fa-ellipsis-v" aria-hidden="true" />
          </Link>
          <ul className="dropdown-menu">
            <li>
              <Link
                to="#"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target="#sales-details-new"
              >
                <i className="me-2 feather icon-eye info-img" />
                Sale Detail
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target="#edit-sales-new"
              >
                <i className="me-2 feather icon-edit info-img" />
                Edit Sale
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target="#showpayment"
              >
                <i className="me-2 feather icon-dollar-sign info-img" />
                Show Payments
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target="#createpayment"
              >
                <i className="me-2 feather icon-plus-circle info-img" />
                Create Payment
              </Link>
            </li>
            <li>
              <Link to="#" className="dropdown-item">
                <i className="me-2 feather icon-download info-img" />
                Download pdf
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="dropdown-item mb-0"
                data-bs-toggle="modal"
                data-bs-target="#delete-modal"
                onClick={() => setDeleteId(row.id)}
              >
                <i className="me-2 feather icon-trash-2 info-img" />
                Delete Sale
              </Link>
            </li>
          </ul>
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
                <h4>Sales</h4>
                <h6>Manage Your Sales</h6>
              </div>
            </div>
            <TableTopHead />
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-sales-new"
              >
                <i className="ti ti-circle-plus me-1"></i> Add Sales
              </Link>
            </div>
          </div>
          {/* /product list */}
          <div className="card table-list-card manage-stock">
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
                    Customer
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Walk-in Customer
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Minerva Rameriz
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Robert Lamon
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Patricia Lewis
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="dropdown me-2">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Staus
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Completed
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Pending
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="dropdown me-2">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Payment Status
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Paid
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Unpaid
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Overdue
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
              <div className="custom-datatable-filter table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={orders}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={orders.length}
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
      <OnlineorderModal />
      <>
        {/* Delete */}
        <div className="modal fade modal-default" id="delete-modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body p-0">
                <div className="success-wrap text-center">
                  <div className="icon-success bg-danger-transparent text-danger mb-2">
                    <i className="ti ti-trash" />
                  </div>
                  <h3 className="mb-2">Delete Sale</h3>
                  <p className="fs-16 mb-3">
                    Are you sure you want to delete sale?
                  </p>
                  <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-md btn-secondary"
                      data-bs-dismiss="modal"
                    >
                      No, Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-md btn-primary"
                      data-bs-dismiss="modal"
                      onClick={handleDelete}
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Delete */}
      </>

    </div>
  );
};

export default OnlineOrder;

