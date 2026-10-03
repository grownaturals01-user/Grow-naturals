import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Brand from "../../core/modals/inventory/brand";
import { all_routes } from "../../routes/all_routes";
import PrimeDataTable from "../../components/data-table";
import {
  expireProduct01,
  expireProduct02,
  expireProduct03,
  expireProduct04,
  stockImg02,
  stockImg03,
  stockImg04,
  stockImg05,
  stockImg06,
  user04,
  user08,
  user10,
  user13,
  user30,
  stockImg1,
  user11,
  user3,
  user2,
  user5,
  user01,
} from "../../utils/imagepath";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import TooltipIcons from "../../components/tooltip-content/tooltipIcons";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import { api, getActiveBusinessId } from "../../services/api";

const productImages = [
  stockImg1,
  stockImg06,
  stockImg02,
  stockImg03,
  stockImg04,
  stockImg05,
  expireProduct01,
  expireProduct02,
  expireProduct03,
  expireProduct04,
];

const userAvatars = [
  user30,
  user13,
  user11,
  user3,
  user2,
  user5,
  user08,
  user04,
  user01,
  user10,
];

export const fallbackProductListData = [
  {
    id: 1,
    product: "Lenovo 3rd Generation",
    productImage: stockImg1,
    sku: "PT001",
    category: "Laptop",
    brand: "Lenovo",
    price: "₹12,500",
    unit: "Pc",
    qty: "100",
    createdby: "Arroon",
    img: user30,
  },
  {
    id: 2,
    product: "Bold V3.2",
    productImage: stockImg06,
    sku: "PT002",
    category: "Electronics",
    brand: "Bolt",
    price: "₹1,600",
    unit: "Pc",
    qty: "140",
    createdby: "Kenneth",
    img: user13,
  },
  {
    id: 3,
    product: "Nike Jordan",
    productImage: stockImg02,
    sku: "PT003",
    category: "Shoe",
    brand: "Nike",
    price: "₹6,000",
    unit: "Pc",
    qty: "780",
    createdby: "Gooch",
    img: user11,
  },
  {
    id: 4,
    product: "Apple Series 5 Watch",
    productImage: stockImg03,
    sku: "PT004",
    category: "Electronics",
    brand: "Apple",
    price: "₹25,000",
    unit: "Pc",
    qty: "450",
    createdby: "Nathan",
    img: user3,
  },
  {
    id: 5,
    product: "Amazon Echo Dot",
    productImage: stockImg04,
    sku: "PT005",
    category: "Speaker",
    brand: "Amazon",
    price: "₹1,600",
    unit: "Pc",
    qty: "477",
    createdby: "Alice",
    img: user2,
  },
  {
    id: 6,
    product: "Lobar Handy",
    productImage: stockImg05,
    sku: "PT006",
    category: "Furnitures",
    brand: "Woodmart",
    price: "₹4,521",
    unit: "Kg",
    qty: "145",
    createdby: "Robb",
    img: user5,
  },
  {
    id: 7,
    product: "Red Premium Handy",
    productImage: expireProduct01,
    sku: "PT007",
    category: "Bags",
    brand: "Versace",
    price: "₹2,024",
    unit: "Kg",
    qty: "747",
    createdby: "Steven",
    img: user08,
  },
  {
    id: 8,
    product: "Iphone 14 Pro",
    productImage: expireProduct02,
    sku: "PT008",
    category: "Phone",
    brand: "Iphone",
    price: "₹1,698",
    unit: "Pc",
    qty: "897",
    createdby: "Gravely",
    img: user04,
  },
  {
    id: 9,
    product: "Black Slim 200",
    productImage: expireProduct03,
    sku: "PT009",
    category: "Chairs",
    brand: "Bently",
    price: "₹6,794",
    unit: "Pc",
    qty: "741",
    createdby: "Kevin",
    img: user01,
  },
  {
    id: 10,
    product: "Woodcraft Sandal",
    productImage: expireProduct04,
    sku: "PT010",
    category: "Bags",
    brand: "Woodcraft",
    price: "₹4,547",
    unit: "Kg",
    qty: "148",
    createdby: "Grillo",
    img: user10,
  },
];

export const productlistdata = fallbackProductListData;

interface ProductItem {
  id: string | number;
  sku: string;
  product: string;
  productImage: string;
  category: string;
  brand: string;
  price: string;
  unit: string;
  qty: string;
  createdby: string;
  img: string;
  action?: string;
  raw?: any;
}

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const businessId = getActiveBusinessId();
      const res = await api.get<any[]>("/products", { business_id: businessId });
      if (Array.isArray(res) && res.length > 0) {
        const mapped: ProductItem[] = res.map((p: any, idx: number) => ({
          id: p.id,
          sku: p.sku || `PT00${idx + 1}`,
          product: p.name,
          productImage: p.image_url || productImages[idx % productImages.length],
          category: p.category_name || (p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : "General"),
          brand: p.brand || "Grow Naturals",
          price: `₹${Number(p.selling_price || p.sale_price || 0).toLocaleString("en-IN")}`,
          unit: p.unit || "Pc",
          qty: String(p.stock_quantity ?? 0),
          createdby: p.business_name || "Admin",
          img: userAvatars[idx % userAvatars.length],
          raw: p,
        }));
        setProducts(mapped);

        // Extract brands
        const brandSet = new Set<string>();
        mapped.forEach((item) => {
          if (item.brand) brandSet.add(item.brand);
        });
        setBrands(Array.from(brandSet));
      } else {
        setProducts(fallbackProductListData);
        setBrands(["Lenovo", "Bolt", "Nike", "Apple", "Amazon", "Woodmart", "Versace", "Bently"]);
      }
    } catch (err) {
      console.warn("Failed to load products, using theme defaults:", err);
      setProducts(fallbackProductListData);
      setBrands(["Lenovo", "Bolt", "Nike", "Apple", "Amazon", "Woodmart", "Versace", "Bently"]);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const businessId = getActiveBusinessId();
      const res = await api.get<any[]>("/categories", { business_id: businessId });
      if (Array.isArray(res) && res.length > 0) {
        setCategories(res);
      } else {
        setCategories([
          { id: "1", name: "Computers" },
          { id: "2", name: "Electronics" },
          { id: "3", name: "Shoe" },
          { id: "4", name: "Speaker" },
          { id: "5", name: "Furnitures" },
        ]);
      }
    } catch (err) {
      setCategories([
        { id: "1", name: "Computers" },
        { id: "2", name: "Electronics" },
        { id: "3", name: "Shoe" },
        { id: "4", name: "Speaker" },
        { id: "5", name: "Furnitures" },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/products/${deleteId}`);
      setDeleteId(null);
      await fetchProducts();
    } catch (err: any) {
      console.error("Failed to delete product:", err);
    }
  };

  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const filteredProducts = products.filter((item) => {
    if (selectedCategory && item.category !== selectedCategory) {
      return false;
    }
    if (selectedBrand && item.brand !== selectedBrand) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.product.toLowerCase().includes(q);
      const matchSku = item.sku.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      return matchName || matchSku || matchCat || matchBrand;
    }
    return true;
  });

  const route = all_routes;
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
      body: (data: ProductItem) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2">
            <img alt="" src={data.productImage} />
          </Link>
          <Link to="#">{data.product}</Link>
        </div>
      ),
    },
    {
      header: "Category",
      field: "category",
      key: "category",
      sortable: true,
    },
    {
      header: "Brand",
      field: "brand",
      key: "brand",
      sortable: true,
    },
    {
      header: "Price",
      field: "price",
      key: "price",
      sortable: true,
    },
    {
      header: "Unit",
      field: "unit",
      key: "unit",
      sortable: true,
    },
    {
      header: "Qty",
      field: "qty",
      key: "qty",
      sortable: true,
    },
    {
      header: "Created By",
      field: "createdby",
      key: "createdby",
      sortable: true,
      body: (data: ProductItem) => (
        <span className="userimgname">
          <Link to="/profile" className="product-img">
            <img alt="" src={data.img} />
          </Link>
          <Link to="/profile">{data.createdby}</Link>
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
            to={`${all_routes.editproduct}?id=${row.id || ""}`}
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

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Product List</h4>
                <h6>Manage your products</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <TooltipIcons />
              <RefreshIcon />
              <CollapesIcon />
            </ul>
            <div className="page-btn">
              <Link to={route.addproduct} className="btn btn-primary">
                <i className="ti ti-circle-plus me-1"></i>
                Add Product
              </Link>
            </div>
            <div className="page-btn import">
              <Link
                to="#"
                className="btn btn-secondary color"
                data-bs-toggle="modal"
                data-bs-target="#view-notes"
              >
                <i className="feather icon-download feather me-2" />
                Import Product
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
                    {selectedCategory ? selectedCategory : "Category"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${!selectedCategory ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCategory(null);
                        }}
                      >
                        All Categories
                      </Link>
                    </li>
                    {categories.map((c) => (
                      <li key={c.id}>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${selectedCategory === c.name ? "active" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedCategory(c.name);
                          }}
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="dropdown me-2">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    {selectedBrand ? selectedBrand : "Brand"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${!selectedBrand ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedBrand(null);
                        }}
                      >
                        All Brands
                      </Link>
                    </li>
                    {brands.map((b, idx) => (
                      <li key={idx}>
                        <Link
                          to="#"
                          className={`dropdown-item rounded-1 ${selectedBrand === b ? "active" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedBrand(b);
                          }}
                        >
                          {b}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body">
              {/* /Filter */}
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={filteredProducts}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={filteredProducts.length}
                  searchQuery={searchQuery}
                  selectionMode="checkbox"
                  selection={selectedProducts}
                  onSelectionChange={(e: any) => setSelectedProducts(e.value)}
                />
              </div>
            </div>
          </div>
          {/* /product list */}
          <Brand />
        </div>
      </div>
      <DeleteModal onConfirm={handleDelete} />
    </>
  );
};

export default ProductList;
