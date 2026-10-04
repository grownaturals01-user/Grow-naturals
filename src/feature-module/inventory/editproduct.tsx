import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";
import AddCategory from "../../core/modals/inventory/addcategory";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import AddVariant from "../../core/modals/inventory/addvariant";
import AddVarientNew from "../../core/modals/inventory/addVarientNew";
import CommonDatePicker from "../../components/date-picker/common-date-picker";
import { Editor } from "primereact/editor";
import CommonSelect from "../../components/select/common-select";
import { api, getActiveBusinessId } from "../../services/api";
import { ProductImageUploader } from "../../components/common/ProductImageUploader";

const EditProduct: React.FC = () => {
  const route = all_routes;
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const productId = params.id || searchParams.get("id") || "";

  const [date1, setDate1] = useState<Date | null>(new Date());
  const [date2, setDate2] = useState<Date | null>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBarcodeSymbol, setSelectedBarcodeSymbol] = useState<string | null>(null);
  const [selectedTaxType, setSelectedTaxType] = useState<string | null>(null);

  const [selectedWarranty, setSelectedWarranty] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [selectedSellingType, setSelectedSellingType] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [text, setText] = useState("");

  // Product field states
  const [productName, setProductName] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [qtyAlert, setQtyAlert] = useState("5");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Dynamic Options from API
  const [storeOptions, setStoreOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "choose", label: "Choose" },
    { value: "main", label: "Grow Naturals Main" },
    { value: "nikhlesh", label: "Nikhlesh Nursery" },
  ]);

  const [warehouseOptions, setWarehouseOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "choose", label: "Choose" },
    { value: "wh-1", label: "Central Depot" },
    { value: "wh-2", label: "Nursery Storage" },
  ]);

  const [categoryOptions, setCategoryOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "choose", label: "Choose" },
    { value: "plants", label: "Plants" },
    { value: "electronics", label: "Electronics" },
    { value: "fertilizers", label: "Fertilizers" },
  ]);

  const [subCategoryOptions, setSubCategoryOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "choose", label: "Choose" },
    { value: "indoor", label: "Indoor Plants" },
    { value: "outdoor", label: "Outdoor Plants" },
  ]);

  const brand = [
    { value: "choose", label: "Choose" },
    { value: "nike", label: "Nike" },
    { value: "bolt", label: "Bolt" },
    { value: "grownaturals", label: "Grow Naturals" },
  ];

  const unit = [
    { value: "choose", label: "Choose" },
    { value: "kg", label: "Kg" },
    { value: "pc", label: "Pc" },
  ];

  const sellingtype = [
    { value: "choose", label: "Choose" },
    { value: "transactionalSelling", label: "Transactional selling" },
    { value: "solutionSelling", label: "Solution selling" },
  ];

  const barcodesymbol = [
    { value: "code34", label: "Code34" },
    { value: "code35", label: "Code35" },
    { value: "code36", label: "Code36" },
  ];

  const taxtype = [
    { value: "exclusive", label: "Exclusive" },
    { value: "salesTax", label: "Sales Tax" },
  ];

  const warrenty = [
    { value: "choose", label: "Choose" },
    { value: "Replacement Warranty", label: "Replacement Warranty" },
    { value: "On-Site Warranty", label: "On-Site Warranty" },
    {
      value: "Accidental Protection Plan",
      label: "Accidental Protection Plan",
    },
  ];

  useEffect(() => {
    const businessId = getActiveBusinessId();

    // Fetch dropdown data
    api.get<any[]>("/businesses").then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setStoreOptions([
          { value: "choose", label: "Choose" },
          ...res.map((b) => ({ value: b.id, label: b.name })),
        ]);
      }
    }).catch(() => {});

    api.get<any[]>("/warehouses", { business_id: businessId }).then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setWarehouseOptions([
          { value: "choose", label: "Choose" },
          ...res.map((w) => ({ value: w.id, label: w.name })),
        ]);
      }
    }).catch(() => {});

    api.get<any[]>("/categories", { business_id: businessId }).then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setCategoryOptions([
          { value: "choose", label: "Choose" },
          ...res.map((c) => ({ value: c.id, label: c.name })),
        ]);
      }
    }).catch(() => {});

    api.get<any[]>("/subcategories", { business_id: businessId }).then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setSubCategoryOptions([
          { value: "choose", label: "Choose" },
          ...res.map((sc) => ({ value: sc.id, label: sc.name })),
        ]);
      }
    }).catch(() => {});

    // Fetch product if ID exists
    if (productId) {
      setIsLoading(true);
      api.get<any>(`/products/${productId}`)
        .then((p) => {
          if (p) {
            setProductName(p.name || "");
            setImageUrl(p.image_url || "");
            setSlug(p.slug || (p.name ? p.name.toLowerCase().replace(/\s+/g, "-") : ""));
            setSku(p.sku || "");
            setItemCode(p.barcode || p.sku || "");
            setPrice(String(p.selling_price || p.sale_price || p.price || ""));
            setCostPrice(String(p.cost_price || ""));
            setQuantity(String(p.stock_quantity ?? 0));
            setQtyAlert(String(p.low_stock_threshold ?? 5));
            setSelectedStore(p.business_id || null);
            setSelectedCategory(p.category_id || null);
            setSelectedUnit(p.unit ? p.unit.toLowerCase() : "pc");
            setText(p.description || "");
          }
        })
        .catch((err) => {
          console.warn("Failed to load product for edit:", err);
          setMessage({ type: "error", text: "Failed to load product details." });
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [productId]);

  const generateSku = (e: React.MouseEvent) => {
    e.preventDefault();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`GN-${rand}`);
  };

  const generateItemCode = (e: React.MouseEvent) => {
    e.preventDefault();
    const rand = Math.floor(100000 + Math.random() * 900000);
    setItemCode(`BAR-${rand}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !sku.trim()) {
      setMessage({ type: "error", text: "Product Name and SKU are required." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const parsedPrice = parseFloat(price) || 0;
      const parsedCost = parseFloat(costPrice) || (parsedPrice * 0.7);
      const parsedQty = parseInt(quantity, 10) || 0;
      const parsedAlert = parseInt(qtyAlert, 10) || 5;

      const payload = {
        name: productName.trim(),
        sku: sku.trim(),
        business_id: selectedStore && selectedStore !== "choose" ? selectedStore : undefined,
        category_id: selectedCategory && selectedCategory !== "choose" ? selectedCategory : undefined,
        sale_price: parsedPrice,
        selling_price: parsedPrice,
        price: parsedPrice,
        cost_price: parsedCost,
        stock_quantity: parsedQty,
        quantity: parsedQty,
        low_stock_threshold: parsedAlert,
        unit: selectedUnit && selectedUnit !== "choose" ? selectedUnit : "Pc",
        barcode: itemCode || sku || undefined,
        image_url: imageUrl || "",
        description: text || "",
      };

      if (productId) {
        await api.put(`/products/${productId}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setMessage({ type: "success", text: "Product updated successfully!" });
      setTimeout(() => {
        navigate(route.productlist);
      }, 800);
    } catch (err: any) {
      console.error("Failed to update product:", err);
      setMessage({ type: "error", text: err.message || "Failed to update product." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>{productId ? "Edit Product" : "New Product"}</h4>
                <h6>{productId ? "Update product details & media" : "Create new product"}</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon />
              <CollapesIcon />
              <li>
                <div className="page-btn">
                  <Link to={route.productlist} className="btn btn-secondary">
                    <i className="feather icon-arrow-left me-2" />
                    Back to Product
                  </Link>
                </div>
              </li>
            </ul>
          </div>

          {message && (
            <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"} alert-dismissible fade show`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage(null)} />
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading product...</span>
              </div>
              <p className="mt-2 text-muted">Loading product details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="card">
                <div className="card-body add-product pb-0">
                  <div
                    className="accordions-items-seperate"
                    id="accordionSpacingExample"
                  >
                    {/* Section 1: Product Info */}
                    <div className="accordion-item border mb-4">
                      <h2 className="accordion-header" id="headingSpacingOne">
                        <div
                          className="accordion-button collapsed bg-white"
                          data-bs-toggle="collapse"
                          data-bs-target="#SpacingOne"
                          aria-expanded="true"
                          aria-controls="SpacingOne"
                        >
                          <div className="d-flex align-items-center justify-content-between flex-fill">
                            <h5 className="d-flex align-items-center">
                              <i className="feather icon-info text-primary me-2" />
                              <span>Product Information</span>
                            </h5>
                          </div>
                        </div>
                      </h2>
                      <div
                        id="SpacingOne"
                        className="accordion-collapse collapse show"
                        aria-labelledby="headingSpacingOne"
                      >
                        <div className="accordion-body border-top">
                          <div className="row">
                            <div className="col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Store<span className="text-danger ms-1">*</span>
                                </label>
                                <CommonSelect
                                  className="w-100"
                                  options={storeOptions}
                                  value={selectedStore}
                                  onChange={(e) => setSelectedStore(e.value)}
                                  placeholder="Choose"
                                  filter={false}
                                />
                              </div>
                            </div>
                            <div className="col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Warehouse
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <CommonSelect
                                  className="w-100"
                                  options={warehouseOptions}
                                  value={selectedWarehouse}
                                  onChange={(e) => setSelectedWarehouse(e.value)}
                                  placeholder="Choose"
                                  filter={false}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Product Name
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={productName}
                                  onChange={(e) => {
                                    setProductName(e.target.value);
                                    if (!slug) {
                                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                                    }
                                  }}
                                  className="form-control"
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Slug<span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={slug}
                                  onChange={(e) => setSlug(e.target.value)}
                                  className="form-control"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-sm-6 col-12">
                              <div className="mb-3 list position-relative">
                                <label className="form-label">
                                  SKU<span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={sku}
                                  onChange={(e) => setSku(e.target.value)}
                                  className="form-control list"
                                  required
                                />
                                <button
                                  type="button"
                                  className="btn btn-primaryadd"
                                  onClick={generateSku}
                                >
                                  Generate
                                </button>
                              </div>
                            </div>
                            <div className="col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Selling Type
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <CommonSelect
                                  className="w-100"
                                  options={sellingtype}
                                  value={selectedSellingType}
                                  onChange={(e) =>
                                    setSelectedSellingType(e.value)
                                  }
                                  placeholder="Choose"
                                  filter={false}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="addservice-info">
                            <div className="row">
                              <div className="col-sm-6 col-12">
                                <div className="mb-3">
                                  <div className="add-newplus">
                                    <label className="form-label">
                                      Category
                                      <span className="text-danger ms-1">*</span>
                                    </label>
                                  </div>
                                  <CommonSelect
                                    className="w-100"
                                    options={categoryOptions}
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.value)}
                                    placeholder="Choose"
                                    filter={false}
                                  />
                                </div>
                              </div>
                              <div className="col-sm-6 col-12">
                                <div className="mb-3">
                                  <label className="form-label">
                                    Sub Category
                                    <span className="text-danger ms-1">*</span>
                                  </label>
                                  <CommonSelect
                                    className="w-100"
                                    options={subCategoryOptions}
                                    value={selectedSubCategory}
                                    onChange={(e) =>
                                      setSelectedSubCategory(e.value)
                                    }
                                    placeholder="Choose"
                                    filter={false}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="add-product-new">
                            <div className="row">
                              <div className="col-sm-6 col-12">
                                <div className="mb-3">
                                  <div className="add-newplus">
                                    <label className="form-label">
                                      Brand
                                      <span className="text-danger ms-1">*</span>
                                    </label>
                                  </div>
                                  <CommonSelect
                                    className="w-100"
                                    options={brand}
                                    value={selectedBrand}
                                    onChange={(e) => setSelectedBrand(e.value)}
                                    placeholder="Choose"
                                    filter={false}
                                  />
                                </div>
                              </div>
                              <div className="col-sm-6 col-12">
                                <div className="mb-3">
                                  <div className="add-newplus">
                                    <label className="form-label">
                                      Unit
                                      <span className="text-danger ms-1">*</span>
                                    </label>
                                  </div>
                                  <CommonSelect
                                    className="w-100"
                                    options={unit}
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.value)}
                                    placeholder="Choose"
                                    filter={false}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-lg-6 col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Barcode Symbology
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <CommonSelect
                                  className="w-100"
                                  options={barcodesymbol}
                                  value={selectedBarcodeSymbol}
                                  onChange={(e) =>
                                    setSelectedBarcodeSymbol(e.value)
                                  }
                                  placeholder="Choose"
                                  filter={false}
                                />
                              </div>
                            </div>
                            <div className="col-lg-6 col-sm-6 col-12">
                              <div className="mb-3 list position-relative">
                                <label className="form-label">
                                  Item Code / Barcode
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={itemCode}
                                  onChange={(e) => setItemCode(e.target.value)}
                                  className="form-control list"
                                />
                                <button
                                  type="button"
                                  className="btn btn-primaryadd"
                                  onClick={generateItemCode}
                                >
                                  Generate
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* Description */}
                          <div className="col-lg-12">
                            <div className="summer-description-box">
                              <label className="form-label">Description</label>
                              <Editor
                                value={text}
                                onTextChange={(e: any) => setText(e.htmlValue)}
                                style={{ height: "160px" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Pricing & Stocks */}
                    <div className="accordion-item border mb-4">
                      <h2 className="accordion-header" id="headingSpacingTwo">
                        <div
                          className="accordion-button collapsed bg-white"
                          data-bs-toggle="collapse"
                          data-bs-target="#SpacingTwo"
                          aria-expanded="true"
                          aria-controls="SpacingTwo"
                        >
                          <div className="d-flex align-items-center justify-content-between flex-fill">
                            <h5 className="d-flex align-items-center">
                              <i className="feather icon-life-buoy text-primary me-2" />
                              <span>Pricing &amp; Stocks</span>
                            </h5>
                          </div>
                        </div>
                      </h2>
                      <div
                        id="SpacingTwo"
                        className="accordion-collapse collapse show"
                        aria-labelledby="headingSpacingTwo"
                      >
                        <div className="accordion-body border-top">
                          <div className="row">
                            <div className="col-lg-4 col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Selling Price (₹)
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={price}
                                  onChange={(e) => setPrice(e.target.value)}
                                  placeholder="0.00"
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-lg-4 col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Cost Price (₹)
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={costPrice}
                                  onChange={(e) => setCostPrice(e.target.value)}
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            <div className="col-lg-4 col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Quantity
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={quantity}
                                  onChange={(e) => setQuantity(e.target.value)}
                                  placeholder="0"
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-lg-4 col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Quantity Alert
                                  <span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={qtyAlert}
                                  onChange={(e) => setQtyAlert(e.target.value)}
                                  placeholder="5"
                                />
                              </div>
                            </div>
                            <div className="col-lg-4 col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Tax Type
                                </label>
                                <CommonSelect
                                  className="w-100"
                                  options={taxtype}
                                  value={selectedTaxType}
                                  onChange={(e) =>
                                    setSelectedTaxType(e.value)
                                  }
                                  placeholder="Choose"
                                  filter={false}
                                />
                              </div>
                            </div>
                            <div className="col-lg-4 col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Discount Value
                                </label>
                                <input
                                  className="form-control"
                                  type="text"
                                  value={discountValue}
                                  onChange={(e) => setDiscountValue(e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Images */}
                    <div className="accordion-item border mb-4">
                      <h2 className="accordion-header" id="headingSpacingThree">
                        <div
                          className="accordion-button collapsed bg-white"
                          data-bs-toggle="collapse"
                          data-bs-target="#SpacingThree"
                          aria-expanded="true"
                          aria-controls="SpacingThree"
                        >
                          <div className="d-flex align-items-center justify-content-between flex-fill">
                            <h5 className="d-flex align-items-center">
                              <i className="feather icon-image text-primary me-2" />
                              <span>Product Images &amp; Media</span>
                            </h5>
                          </div>
                        </div>
                      </h2>
                      <div
                        id="SpacingThree"
                        className="accordion-collapse collapse show"
                        aria-labelledby="headingSpacingThree"
                      >
                        <div className="accordion-body border-top p-4">
                          <ProductImageUploader
                            value={imageUrl}
                            onChange={setImageUrl}
                            label="Product Photo / Media (Upload, paste URL, or choose botanical preset)"
                            productType={selectedCategory || "plants"}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Custom Fields */}
                    <div className="accordion-item border mb-4">
                      <h2 className="accordion-header" id="headingSpacingFour">
                        <div
                          className="accordion-button collapsed bg-white"
                          data-bs-toggle="collapse"
                          data-bs-target="#SpacingFour"
                          aria-expanded="true"
                          aria-controls="SpacingFour"
                        >
                          <div className="d-flex align-items-center justify-content-between flex-fill">
                            <h5 className="d-flex align-items-center">
                              <i className="feather icon-list text-primary me-2" />
                              <span>Custom Fields &amp; Warranty</span>
                            </h5>
                          </div>
                        </div>
                      </h2>
                      <div
                        id="SpacingFour"
                        className="accordion-collapse collapse show"
                        aria-labelledby="headingSpacingFour"
                      >
                        <div className="accordion-body border-top">
                          <div className="row">
                            <div className="col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Warranty
                                </label>
                                <CommonSelect
                                  className="w-100"
                                  options={warrenty}
                                  value={selectedWarranty}
                                  onChange={(e) => setSelectedWarranty(e.value)}
                                  placeholder="Choose"
                                  filter={false}
                                />
                              </div>
                            </div>
                            <div className="col-sm-6 col-12">
                              <div className="mb-3 add-product">
                                <label className="form-label">
                                  Manufacturer
                                </label>
                                <input
                                  type="text"
                                  defaultValue={"Grow Naturals"}
                                  className="form-control"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Manufactured Date
                                </label>
                                <div className="input-groupicon calender-input">
                                  <i className="feather icon-calendar info-img" />
                                  <CommonDatePicker
                                    value={date1}
                                    onChange={setDate1}
                                    className="w-100"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="col-sm-6 col-12">
                              <div className="mb-3">
                                <label className="form-label">
                                  Expiry On
                                </label>
                                <div className="input-groupicon calender-input">
                                  <i className="feather icon-calendar info-img" />
                                  <CommonDatePicker
                                    value={date2}
                                    onChange={setDate2}
                                    className="w-100"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-12">
                  <div className="d-flex align-items-center justify-content-end mb-4 px-4">
                    <Link to={route.productlist} className="btn btn-secondary me-2">
                      Cancel
                    </Link>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          Saving...
                        </>
                      ) : (
                        "Save Product"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <AddCategory />
      <AddVariant />
      <AddVarientNew />
    </>
  );
};

export default EditProduct;
