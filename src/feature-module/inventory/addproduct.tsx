import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";
import { api, getActiveBusinessId } from "../../services/api";

const AddProduct: React.FC = () => {
  const route = all_routes;
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [type, setType] = useState("plants");
  const [categoryId, setCategoryId] = useState("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [stockQuantity, setStockQuantity] = useState<number | "">("");
  const [lowStockThreshold, setLowStockThreshold] = useState<number | "">(5);
  const [unit, setUnit] = useState("Pc");
  const [taxRate, setTaxRate] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [businessId, setBusinessId] = useState(getActiveBusinessId());

  // Dropdown lists from backend
  const [categories, setCategories] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string; category_id?: string }>>([]);
  const [subcategoryId, setSubcategoryId] = useState("");
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Fetch live categories
    api.get("/categories", { business_id: businessId })
      .then((res) => {
        if (Array.isArray(res)) setCategories(res);
      })
      .catch((err) => console.warn(err));

    // Fetch live subcategories
    api.get("/subcategories", { business_id: businessId })
      .then((res) => {
        if (Array.isArray(res)) setSubcategories(res);
      })
      .catch((err) => console.warn(err));

    // Fetch live businesses
    api.get("/businesses")
      .then((res) => {
        if (Array.isArray(res)) setBusinesses(res);
      })
      .catch((err) => console.warn(err));
  }, [businessId]);

  const generateSku = () => {
    const prefix = type.substring(0, 3).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newSku = `${prefix}-${rand}`;
    setSku(newSku);
    if (!barcode) setBarcode(newSku);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter product name");
      return;
    }
    if (sellingPrice === "" || Number(sellingPrice) < 0) {
      setErrorMsg("Please enter a valid selling price");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        type,
        category_id: categoryId || undefined,
        subcategory_id: subcategoryId || undefined,
        selling_price: Number(sellingPrice),
        cost_price: Number(costPrice) || 0,
        stock_quantity: Number(stockQuantity) || 0,
        low_stock_threshold: Number(lowStockThreshold) || 5,
        unit,
        tax_rate: Number(taxRate) || 0,
        description: description.trim(),
        business_id: businessId,
      };

      await api.post("/products", payload);
      alert("Product created successfully!");
      navigate(route.productlist || "/product-list");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4 className="fw-bold">Create Product</h4>
              <h6>Add a new product to your live database</h6>
            </div>
          </div>
          <div className="page-btn">
            <Link to={route.productlist} className="btn btn-secondary">
              <i className="feather icon-arrow-left me-2" />
              Back to Product List
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="ti ti-alert-circle me-2" />
            {errorMsg}
            <button type="button" className="btn-close" onClick={() => setErrorMsg("")} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ti ti-info-circle text-primary me-2" />
                Product Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 col-12 mb-3">
                  <label className="form-label">Store / Business <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                  >
                    {businesses.length === 0 ? (
                      <option value={businessId}>Grow Naturals</option>
                    ) : (
                      businesses.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="col-md-6 col-12 mb-3">
                  <label className="form-label">Product Type / Module <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="plants">🪴 Plants &amp; Indoor Greens</option>
                    <option value="cactus">🌵 Cactus &amp; Succulents</option>
                    <option value="pots">🏺 Pots &amp; Planters</option>
                    <option value="fertilizers">🧪 Fertilizers &amp; Nutrients</option>
                    <option value="flowers">🌸 Fresh Flowers</option>
                    <option value="fruit-trees">🌳 Fruit Trees &amp; Saplings</option>
                    <option value="seeds-bulbs">🌱 Seeds &amp; Bulbs</option>
                    <option value="general">📦 General Inventory</option>
                  </select>
                </div>

                <div className="col-md-6 col-12 mb-3">
                  <label className="form-label">Product Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ficus Bonsai Plant, White Ceramic Pot"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6 col-12 mb-3">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6 col-12 mb-3">
                  <label className="form-label">Sub Category</label>
                  <select
                    className="form-select"
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                  >
                    <option value="">-- Select Sub Category --</option>
                    {subcategories
                      .filter((s) => !categoryId || s.category_id === categoryId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                </div>

                <div className="col-md-6 col-12 mb-3">
                  <label className="form-label">SKU</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. PLA-1042"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                    />
                    <button type="button" className="btn btn-outline-primary" onClick={generateSku}>
                      Generate
                    </button>
                  </div>
                </div>

                <div className="col-md-6 col-12 mb-3">
                  <label className="form-label">Barcode / Item Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Scan or enter barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="ti ti-coin text-primary me-2" />
                Pricing &amp; Stock Inventory
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 col-12 mb-3">
                  <label className="form-label">Selling Price (₹) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    step="1"
                    min="0"
                    inputMode="numeric"
                    onKeyDown={(e) => {
                      if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    value={sellingPrice}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setSellingPrice(val === "" ? "" : parseInt(val, 10));
                    }}
                    required
                  />
                </div>

                <div className="col-md-4 col-12 mb-3">
                  <label className="form-label">Cost / Purchase Price (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    step="1"
                    min="0"
                    inputMode="numeric"
                    onKeyDown={(e) => {
                      if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    value={costPrice}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setCostPrice(val === "" ? "" : parseInt(val, 10));
                    }}
                  />
                </div>

                <div className="col-md-4 col-12 mb-3">
                  <label className="form-label">Unit of Measure</label>
                  <select
                    className="form-select"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option value="Pc">Pc (Piece)</option>
                    <option value="Pot">Pot (Planter)</option>
                    <option value="Kg">Kg (Kilogram)</option>
                    <option value="Bag">Bag (Pack)</option>
                    <option value="Tray">Tray</option>
                    <option value="Box">Box</option>
                  </select>
                </div>

                <div className="col-md-4 col-12 mb-3">
                  <label className="form-label">Opening Stock Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    step="1"
                    min="0"
                    inputMode="numeric"
                    onKeyDown={(e) => {
                      if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    value={stockQuantity}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setStockQuantity(val === "" ? "" : parseInt(val, 10));
                    }}
                  />
                </div>

                <div className="col-md-4 col-12 mb-3">
                  <label className="form-label">Low Stock Alert Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="5"
                    step="1"
                    min="0"
                    inputMode="numeric"
                    onKeyDown={(e) => {
                      if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                    }}
                    value={lowStockThreshold}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setLowStockThreshold(val === "" ? "" : parseInt(val, 10));
                    }}
                  />
                </div>

                <div className="col-md-4 col-12 mb-3">
                  <label className="form-label">GST Tax Rate</label>
                  <select
                    className="form-select"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>

                <div className="col-12 mb-3">
                  <label className="form-label">Description / Care Instructions</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Plant care tips, pot dimensions, sunlight requirements, or product notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-end gap-2 mb-4">
            <Link to={route.productlist} className="btn btn-secondary px-4">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
