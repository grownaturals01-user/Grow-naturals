import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import EditSalesRetuens from "../../core/modals/sales/editsalesretuens";
import AddSalesReturns from "../../core/modals/sales/addsalesreturns";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import PrimeDataTable from "../../components/data-table";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";

const SalesReturn = () => {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const businessId = getActiveBusinessId();
      const params: any = { business_id: businessId };
      if (searchQuery) params.search = searchQuery;
      const res = await api.get<any[]>("/refunds", params);
      if (Array.isArray(res)) {
        const mapped = res.map((r: any) => ({
          id: r.id,
          product: r.refund_number ? `${r.refund_number} (Inv: ${r.invoice_number || 'N/A'})` : "Sales Return",
          image: "src/assets/img/products/stock-img-02.png",
          date: r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "-",
          customer: r.customer_name || "Walk-in Customer",
          customerImage: "src/assets/img/users/user-02.jpg",
          status: "Received",
          total: `₹${Number(r.total_refund_amount || 0).toLocaleString("en-IN")}`,
          paid: `₹${Number(r.total_refund_amount || 0).toLocaleString("en-IN")}`,
          due: "₹0.00",
          paymentStatus: "Paid",
          raw: r,
        }));
        setListData(mapped);
      } else {
        setListData([]);
      }
    } catch (err) {
      console.warn("Failed to load refunds:", err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/refunds/${deleteId}`);
      setDeleteId(null);
      await fetchRefunds();
    } catch (err) {
      console.error("Failed to delete refund:", err);
    }
  };

  const columns = [
    {
      header: "Product / Reference",
      field: "product",
      key: "product",
      body: (row: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2">
            <img src={row.image} alt="product" />
          </Link>
          <Link to="#">{row.product}</Link>
        </div>
      ),
    },
    {
      header: "Date",
      field: "date",
      key: "date",
    },
    {
      header: "Customer",
      field: "customer",
      key: "customer",
      body: (row: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2">
            <img src={row.customerImage} alt="customer" />
          </Link>
          <Link to="#">{row.customer}</Link>
        </div>
      ),
    },
    {
      header: "Status",
      field: "status",
      key: "status",
      body: (row: any) => (
        <span className="badge badge-success shadow-none">
          {row.status}
        </span>
      ),
    },
    {
      header: "Total",
      field: "total",
      key: "total",
    },
    {
      header: "Paid",
      field: "paid",
      key: "paid",
    },
    {
      header: "Due",
      field: "due",
      key: "due",
    },
    {
      header: "Payment Status",
      field: "paymentStatus",
      key: "paymentStatus",
      body: (row: any) => (
        <span className="badge badge-soft-success badge-xs shadow-none">
          <i className="ti ti-point-filled me-2" />
          {row.paymentStatus}
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
            data-bs-target="#edit-sales-new"
          >
            <i className="feather icon-edit" />
          </Link>
          <Link
            className="p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            onClick={() => setDeleteId(row.id)}
          >
            <i className="feather icon-trash-2" />
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
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Sales Return</h4>
                <h6>Manage your returns</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <li onClick={() => fetchRefunds()}>
                <RefreshIcon />
              </li>
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link
                to="#"
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#add-sales-new"
              >
                <i className="ti ti-circle-plus me-1" />
                Add Sales Return
              </Link>
            </div>
          </div>
          {/* /product list */}
          <div className="card employee-table">
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
                        onClick={() => setStatusFilter("Received")}
                      >
                        Received
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
          <p className="mb-0">2014 - {new Date().getFullYear()} © DreamsPOS. All Right Reserved</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>

      <AddSalesReturns />
      <EditSalesRetuens />
      <DeleteModal onConfirm={handleDelete} />
    </div>
  );
};

export default SalesReturn;
