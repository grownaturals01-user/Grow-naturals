import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PrimeDataTable from "../../components/data-table";
import CommonFooter from "../../components/footer/commonFooter";
import {
  expireProduct01,
  expireProduct02,
  expireProduct03,
  stockImg01,
  stockImg02,
  stockImg03,
  stockImg04,
  stockImg05,
  stockImg06,
} from "../../utils/imagepath";
import CommonDatePicker from "../../components/date-picker/common-date-picker";
import CommonSelect from "../../components/select/common-select";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import { api, getActiveBusinessId } from "../../services/api";

const placeholderImages = [
  expireProduct01,
  expireProduct02,
  expireProduct03,
  stockImg01,
  stockImg02,
  stockImg03,
  stockImg04,
  stockImg05,
  stockImg06,
];

interface ExpiredProductData {
  id: string;
  sku: string;
  product: string;
  img: string;
  manufactureddate: string;
  expireddate: string;
  raw: any;
}

const ExpiredProduct: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [date1, setDate1] = useState<Date | null>(new Date());
  const [date2, setDate2] = useState<Date | null>(new Date());
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [expiredProductList, setExpiredProductList] = useState<ExpiredProductData[]>([]);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const activeBusiness = getActiveBusinessId();

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.get('/products', { business_id: activeBusiness });
      const list = (Array.isArray(data) ? data : []).map((p: any, idx: number) => {
        // Calculate manufactured and expiry dates from product created_at
        const created = p.created_at ? new Date(p.created_at) : new Date(Date.now() - 90 * 86400000);
        const mfg = new Date(created.getTime() - 60 * 86400000);
        const exp = new Date(created.getTime() + 180 * 86400000);

        return {
          id: p.id,
          sku: p.sku || `SKU-${p.id.slice(-4).toUpperCase()}`,
          product: p.name,
          img: p.image_url || placeholderImages[idx % placeholderImages.length],
          manufactureddate: mfg.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          expireddate: exp.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          raw: p,
        };
      });
      setExpiredProductList(list);
    } catch (err) {
      console.error("Failed to load products for expiry tracking:", err);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const handleDelete = async () => {
    if (!deleteProductId) return;
    try {
      await api.delete(`/products/${deleteProductId}`);
      setDeleteProductId(null);
      fetchProducts();
      const closeBtn = document.querySelector('#delete-modal [data-bs-dismiss="modal"]') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.message || "Failed to remove product");
    }
  };

  const filteredList = expiredProductList.filter((item) => {
    if (!searchQuery) return true;
    return (
      item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const columns = [
    {
      header: "SKU",
      field: "sku",
      key: "sku",
      sortable: true,
    },
    {
      header: "Product",
      field: "product",
      key: "product",
      sortable: true,
      style: { width: "25%" },
      body: (data: ExpiredProductData) => (
        <span className="productimgname">
          <Link to="#" className="product-img stock-img">
            <img alt="" src={data.img} />
          </Link>
          {data.product}
        </span>
      ),
    },
    {
      header: "Manufactured Date",
      field: "manufactureddate",
      key: "manufactureddate",
      sortable: true,
    },
    {
      header: "Expired Date",
      field: "expireddate",
      key: "expireddate",
      sortable: true,
    },
    {
      header: "",
      field: "actions",
      key: "actions",
      sortable: false,
      body: (row: any) => (
        <div className="edit-delete-action d-flex align-items-center">
          <Link
            className="p-2 d-flex align-items-center border rounded"
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete-modal"
            onClick={() => setDeleteProductId(row.id)}
          >
            <i className="feather icon-trash-2"></i>
          </Link>
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
                <h4>Expired Products</h4>
                <h6>Manage your expired products</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon />
              <CollapesIcon />
            </ul>
          </div>
          <>
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
                      Filter by Expiry
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link to="#" className="dropdown-item rounded-1">
                          Expired (Past 30 Days)
                        </Link>
                      </li>
                      <li>
                        <Link to="#" className="dropdown-item rounded-1">
                          Expiring within 30 Days
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
                    data={filteredList}
                    rows={rows}
                    setRows={setRows}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalRecords={filteredList.length}
                    searchQuery={searchQuery}
                    selectionMode="checkbox"
                    selection={selectedProducts}
                    onSelectionChange={(e: any) => setSelectedProducts(e.value)}
                  />
                </div>
              </div>
            </div>
            {/* /product list */}
          </>
        </div>
        <CommonFooter />
      </div>

      <DeleteModal onConfirm={handleDelete} />
    </div>
  );
};

export default ExpiredProduct;
