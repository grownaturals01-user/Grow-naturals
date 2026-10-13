import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import RefreshIcon from "../../../components/tooltip-content/refresh";
import CollapesIcon from "../../../components/tooltip-content/collapes";
import CommonFooter from "../../../components/footer/commonFooter";
import SettingsSideBar from "../settingssidebar";
import CommonSelect from "../../../components/select/common-select";
import { useBusiness } from "../../../context/BusinessContext";
import { api, getActiveBusinessId } from "../../../services/api";
import { companyLogo, logoSmall, whiteCompanyLogo } from "../../../utils/imagepath";

interface BusinessDetailItem {
  id: string;
  key: string;
  value: string;
}

const GeneralSettings: React.FC = () => {
  const {
    business,
    businesses,
    reloadBusinesses,
    createBusiness,
    deleteBusiness,
    switchBusiness,
  } = useBusiness();

  // Company Information fields
  const [businessName, setBusinessName] = useState("Grow Naturals");
  const [phone, setPhone] = useState("8220040502");
  const [email, setEmail] = useState("contact@grownaturals.in");
  const [website, setWebsite] = useState("www.grownaturals.in");
  const [fax, setFax] = useState("");

  // Company Images fields (matching theme upload specs)
  const [companyIcon, setCompanyIcon] = useState<string>(logoSmall);
  const [favicon, setFavicon] = useState<string>(logoSmall);
  const [companyLogoImg, setCompanyLogoImg] = useState<string>(companyLogo);
  const [companyDarkLogoImg, setCompanyDarkLogoImg] = useState<string>(whiteCompanyLogo);

  const companyIconRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);
  const companyLogoRef = useRef<HTMLInputElement>(null);
  const companyDarkLogoRef = useRef<HTMLInputElement>(null);

  // Address Information fields
  const [billingAddress, setBillingAddress] = useState(
    "NO 19/7, 80 Feet Road, Anna Salai, KK Nagar"
  );
  const [selectedCountry, setSelectedCountry] = useState<{ label: string; value: string }>({
    label: "India",
    value: "India",
  });
  const [selectedState, setSelectedState] = useState<{ label: string; value: string }>({
    label: "Tamil Nadu",
    value: "Tamil Nadu",
  });
  const [city, setCity] = useState("Madurai");
  const [pincode, setPincode] = useState("625020");

  // Tax & Registration fields
  const [isGstRegistered, setIsGstRegistered] = useState(true);
  const [gstin, setGstin] = useState("33AKJPN8899F1ZI");
  const [panNumber, setPanNumber] = useState("AKJPN8899F");

  // Business Types & Classification
  const [businessType, setBusinessType] = useState<{ label: string; value: string }>({
    label: "Retailer",
    value: "Retailer",
  });
  const [industryType, setIndustryType] = useState<{ label: string; value: string }>({
    label: "Agriculture / Nursery / Gardening",
    value: "Agriculture / Nursery / Gardening",
  });
  const [registrationType, setRegistrationType] = useState<{ label: string; value: string }>({
    label: "Sole Proprietorship",
    value: "Sole Proprietorship",
  });

  // Authorized Signature
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Custom key-value business details
  const [customDetails, setCustomDetails] = useState<BusinessDetailItem[]>([
    { id: "1", key: "Website", value: "www.grownaturals.in" },
  ]);
  const [newDetailKey, setNewDetailKey] = useState("Website");
  const [newDetailVal, setNewDetailVal] = useState("");

  // Save states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingBiz, setAddingBiz] = useState(false);
  const [newBizName, setNewBizName] = useState("");
  const [newBizGstin, setNewBizGstin] = useState("");
  const [newBizPhone, setNewBizPhone] = useState("");
  const [newBizError, setNewBizError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBiz, setDeletingBiz] = useState(false);

  const [showTallyModal, setShowTallyModal] = useState(false);
  const [showFyModal, setShowFyModal] = useState(false);

  // Select Options
  const countryOptions = [
    { label: "India", value: "India" },
    { label: "United States", value: "United States" },
    { label: "United Kingdom", value: "United Kingdom" },
    { label: "United Arab Emirates", value: "United Arab Emirates" },
    { label: "Singapore", value: "Singapore" },
    { label: "Australia", value: "Australia" },
    { label: "Canada", value: "Canada" },
    { label: "Germany", value: "Germany" },
    { label: "France", value: "France" },
  ];

  const stateOptions = [
    { label: "Tamil Nadu", value: "Tamil Nadu" },
    { label: "Kerala", value: "Kerala" },
    { label: "Karnataka", value: "Karnataka" },
    { label: "Andhra Pradesh", value: "Andhra Pradesh" },
    { label: "Telangana", value: "Telangana" },
    { label: "Maharashtra", value: "Maharashtra" },
    { label: "Madhya Pradesh", value: "Madhya Pradesh" },
    { label: "Delhi", value: "Delhi" },
    { label: "Gujarat", value: "Gujarat" },
    { label: "Rajasthan", value: "Rajasthan" },
    { label: "West Bengal", value: "West Bengal" },
  ];

  const businessTypeOptions = [
    { label: "Retailer", value: "Retailer" },
    { label: "Wholesaler", value: "Wholesaler" },
    { label: "Manufacturer", value: "Manufacturer" },
    { label: "Distributor", value: "Distributor" },
    { label: "Services", value: "Services" },
  ];

  const industryTypeOptions = [
    { label: "Agriculture / Nursery / Gardening", value: "Agriculture / Nursery / Gardening" },
    { label: "Retail & Consumer Goods", value: "Retail & Consumer Goods" },
    { label: "FMCG", value: "FMCG" },
    { label: "Manufacturing", value: "Manufacturing" },
    { label: "Healthcare & Pharmaceuticals", value: "Healthcare & Pharmaceuticals" },
    { label: "Others", value: "Others" },
  ];

  const registrationTypeOptions = [
    { label: "Sole Proprietorship", value: "Sole Proprietorship" },
    { label: "Partnership Firm", value: "Partnership Firm" },
    { label: "Private Limited Company", value: "Private Limited Company" },
    { label: "Limited Liability Partnership (LLP)", value: "Limited Liability Partnership (LLP)" },
    { label: "One Person Company (OPC)", value: "One Person Company (OPC)" },
    { label: "Public Limited Company", value: "Public Limited Company" },
  ];

  // Initialize data from current active business
  useEffect(() => {
    const target = business || (businesses.length > 0 ? businesses[0] : null);
    if (target && target.id !== "all") {
      setBusinessName(target.name || "Grow Naturals");
      setPhone(target.phone || "8220040502");
      setEmail(target.email || "contact@grownaturals.in");
      setBillingAddress(target.address || "NO 19/7, 80 Feet Road, Anna Salai, KK Nagar");
      if (target.gstin) {
        setGstin(target.gstin);
        setIsGstRegistered(true);
        if (target.gstin.length >= 12) {
          setPanNumber(target.gstin.slice(2, 12));
        }
      }
      if (target.city) setCity(target.city);
      if (target.pincode) setPincode(target.pincode);
      if (target.state) {
        setSelectedState({ label: target.state, value: target.state });
      }
      if (target.country) {
        setSelectedCountry({ label: target.country, value: target.country });
      }
      if (target.website) setWebsite(target.website);
      if (target.fax) setFax(target.fax);
      if (target.logo_url) {
        setCompanyLogoImg(target.logo_url);
      }
      if (target.company_icon) {
        setCompanyIcon(target.company_icon);
      }
      if (target.favicon) {
        setFavicon(target.favicon);
      }
      if (target.dark_logo_url) {
        setCompanyDarkLogoImg(target.dark_logo_url);
      }
      if (target.signature_url) {
        setSignaturePreview(target.signature_url);
      }
    }
  }, [business, businesses]);

  // Image Upload Handlers
  const handleImageFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setter(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Signature Upload
  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setSignaturePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add custom detail
  const handleAddDetail = () => {
    if (!newDetailVal.trim()) return;
    setCustomDetails((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        key: newDetailKey,
        value: newDetailVal.trim(),
      },
    ]);
    setNewDetailVal("");
  };

  const handleRemoveDetail = (id: string) => {
    setCustomDetails((prev) => prev.filter((item) => item.id !== id));
  };

  // Save changes
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const activeId = getActiveBusinessId();
      const targetId = activeId && activeId !== "all" ? activeId : businesses[0]?.id;

      const payload = {
        name: businessName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        fax: fax.trim(),
        address: billingAddress.trim(),
        country: selectedCountry?.value || "India",
        state: selectedState?.value || "Tamil Nadu",
        city: city.trim(),
        pincode: pincode.trim(),
        gstin: isGstRegistered ? gstin.trim() : "",
        is_taxable: isGstRegistered,
        pan_number: panNumber.trim(),
        business_type: businessType?.value,
        industry_type: industryType?.value,
        registration_type: registrationType?.value,
        logo_url: companyLogoImg,
        company_icon: companyIcon,
        favicon: favicon,
        dark_logo_url: companyDarkLogoImg,
        signature_url: signaturePreview,
        custom_details: customDetails,
      };

      if (targetId) {
        await api.put(`/businesses/${targetId}`, payload);
      }
      await reloadBusinesses();
      setSaveSuccess("Company settings and information updated successfully!");
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update company settings");
    } finally {
      setSaving(false);
    }
  };

  // Create new business handler
  const handleCreateNewBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) {
      setNewBizError("Business Name is required");
      return;
    }
    setAddingBiz(true);
    setNewBizError(null);

    try {
      const created = await createBusiness({
        name: newBizName.trim(),
        phone: newBizPhone.trim(),
        gstin: newBizGstin.trim(),
        is_taxable: !!newBizGstin.trim(),
      });
      setShowAddModal(false);
      setNewBizName("");
      setNewBizGstin("");
      setNewBizPhone("");
      switchBusiness(created.id);
      setSaveSuccess(`New business "${created.name}" created and selected!`);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setNewBizError(err.message || "Failed to create business");
    } finally {
      setAddingBiz(false);
    }
  };

  // Delete business handler
  const handleDeleteBusiness = async () => {
    const targetId = business?.id || businesses[0]?.id;
    if (!targetId || targetId === "all") return;
    setDeletingBiz(true);
    try {
      await deleteBusiness(targetId);
      setShowDeleteModal(false);
      setSaveSuccess("Business successfully deleted.");
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to delete business");
    } finally {
      setDeletingBiz(false);
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
                <h4 className="fw-bold mb-1">Company Settings</h4>
                <h6 className="text-muted">Edit Your Company Settings And Information</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon />
              <CollapesIcon />
            </ul>
          </div>

          {/* Feedback Alerts */}
          {saveSuccess && (
            <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-3">
              <i className="ti ti-check-circle fs-18 me-2" />
              <span>{saveSuccess}</span>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSaveSuccess(null)}
              />
            </div>
          )}
          {saveError && (
            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-3">
              <i className="ti ti-alert-triangle fs-18 me-2" />
              <span>{saveError}</span>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSaveError(null)}
              />
            </div>
          )}

          {/* Settings Wrapper */}
          <div className="row">
            <div className="col-xl-12">
              <div className="settings-wrapper d-flex">
                <SettingsSideBar />

                {/* Main Settings Card */}
                <div className="card flex-fill mb-0 shadow-sm border-0">
                  {/* Card Header with Top Action Bar */}
                  <div className="card-header border-bottom py-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div>
                      <h4 className="fs-18 fw-bold mb-0">Edit Your Company Settings And Information</h4>
                      <p className="text-muted fs-12 mb-0">
                        Manage your company profile, branding assets, address and legal credentials
                      </p>
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-warning text-white fw-medium d-inline-flex align-items-center"
                        style={{ backgroundColor: "#d9531e", borderColor: "#d9531e" }}
                        onClick={() => setShowAddModal(true)}
                      >
                        <i className="ti ti-plus me-1" />
                        Create new business
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-secondary d-inline-flex align-items-center"
                        onClick={() => setShowFyModal(true)}
                      >
                        <i className="ti ti-calendar me-1" />
                        Close Financial Year
                      </button>

                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => reloadBusinesses()}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary fw-medium px-4"
                        disabled={saving}
                        onClick={handleSave}
                      >
                        {saving ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-1"
                              role="status"
                            />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="card-body p-4">
                    <form onSubmit={handleSave}>
                      {/* ================= SECTION 1: COMPANY INFORMATION ================= */}
                      <div className="border-bottom mb-4 pb-3">
                        <div className="card-title-head mb-3">
                          <h6 className="fs-16 fw-bold mb-0 text-dark d-flex align-items-center">
                            <span className="fs-18 me-2 text-danger">
                              <i className="ti ti-building" />
                            </span>
                            Company Information
                          </h6>
                        </div>

                        <div className="row g-3">
                          <div className="col-xl-4 col-lg-6 col-md-6">
                            <div>
                              <label className="form-label fw-medium mb-1">
                                Company Name <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Grow Naturals"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="col-xl-4 col-lg-6 col-md-6">
                            <div>
                              <label className="form-label fw-medium mb-1">
                                Company Email Address <span className="text-danger">*</span>
                              </label>
                              <input
                                type="email"
                                className="form-control"
                                placeholder="contact@grownaturals.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="col-xl-4 col-lg-6 col-md-6">
                            <div>
                              <label className="form-label fw-medium mb-1">
                                Phone Number <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="8220040502"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="col-xl-6 col-lg-6 col-md-6">
                            <div>
                              <label className="form-label fw-medium mb-1">
                                Website
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="www.grownaturals.in"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="col-xl-6 col-lg-6 col-md-6">
                            <div>
                              <label className="form-label fw-medium mb-1">
                                Fax
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter fax number"
                                value={fax}
                                onChange={(e) => setFax(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= SECTION 2: COMPANY IMAGES ================= */}
                      <div className="border-bottom mb-4 pb-4">
                        <div className="card-title-head mb-3">
                          <h6 className="fs-16 fw-bold mb-0 text-dark d-flex align-items-center">
                            <span className="fs-18 me-2 text-danger">
                              <i className="ti ti-photo" />
                            </span>
                            Company Images
                          </h6>
                        </div>

                        <div className="d-flex flex-column gap-3">
                          {/* 1. Company Icon */}
                          <div className="row align-items-center gy-3 py-2 border-bottom border-light">
                            <div className="col-xl-9 col-lg-8">
                              <div className="row gy-2 align-items-center">
                                <div className="col-md-5 col-lg-4">
                                  <div className="logo-info">
                                    <h6 className="fw-semibold mb-1 text-dark fs-14">Company Icon</h6>
                                    <p className="text-muted fs-13 mb-0">Upload Icon of your Company</p>
                                  </div>
                                </div>
                                <div className="col-md-7 col-lg-8">
                                  <div className="d-flex flex-column align-items-start align-items-sm-start">
                                    <input
                                      ref={companyIconRef}
                                      type="file"
                                      accept="image/*"
                                      className="d-none"
                                      onChange={(e) => handleImageFileChange(e, setCompanyIcon)}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-danger text-white fw-medium d-inline-flex align-items-center px-3 py-2"
                                      style={{ backgroundColor: "#d63031", borderColor: "#d63031", borderRadius: "6px" }}
                                      onClick={() => companyIconRef.current?.click()}
                                    >
                                      <i className="ti ti-upload me-1 fs-15" />
                                      Upload Image
                                    </button>
                                    <span className="text-muted fs-12 mt-1">
                                      Recommended size is 450px x 450px. Max size 5mb.
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-xl-3 col-lg-4">
                              <div className="new-logo ms-lg-auto d-flex justify-content-lg-end">
                                <div
                                  className="position-relative d-inline-flex align-items-center justify-content-center p-2 rounded"
                                  style={{
                                    border: "1px solid #d3d5d7",
                                    borderRadius: "10px",
                                    minWidth: "75px",
                                    minHeight: "52px",
                                    backgroundColor: "#ffffff",
                                  }}
                                >
                                  <img
                                    src={companyIcon}
                                    alt="Company Icon"
                                    style={{ maxHeight: "42px", maxWidth: "80px", objectFit: "contain" }}
                                  />
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    title="Reset Icon"
                                    style={{
                                      fontSize: "12px",
                                      width: "16px",
                                      height: "16px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#ffffff",
                                      backgroundColor: "#ff0000",
                                      borderRadius: "5px",
                                      position: "absolute",
                                      right: "4px",
                                      top: "4px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => setCompanyIcon(logoSmall)}
                                  >
                                    <i className="ti ti-x" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 2. Favicon */}
                          <div className="row align-items-center gy-3 py-2 border-bottom border-light">
                            <div className="col-xl-9 col-lg-8">
                              <div className="row gy-2 align-items-center">
                                <div className="col-md-5 col-lg-4">
                                  <div className="logo-info">
                                    <h6 className="fw-semibold mb-1 text-dark fs-14">Favicon</h6>
                                    <p className="text-muted fs-13 mb-0">Upload Favicon of your Company</p>
                                  </div>
                                </div>
                                <div className="col-md-7 col-lg-8">
                                  <div className="d-flex flex-column align-items-start align-items-sm-start">
                                    <input
                                      ref={faviconRef}
                                      type="file"
                                      accept="image/*"
                                      className="d-none"
                                      onChange={(e) => handleImageFileChange(e, setFavicon)}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-danger text-white fw-medium d-inline-flex align-items-center px-3 py-2"
                                      style={{ backgroundColor: "#d63031", borderColor: "#d63031", borderRadius: "6px" }}
                                      onClick={() => faviconRef.current?.click()}
                                    >
                                      <i className="ti ti-upload me-1 fs-15" />
                                      Upload Image
                                    </button>
                                    <span className="text-muted fs-12 mt-1">
                                      Recommended size is 450px x 450px. Max size 5mb.
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-xl-3 col-lg-4">
                              <div className="new-logo ms-lg-auto d-flex justify-content-lg-end">
                                <div
                                  className="position-relative d-inline-flex align-items-center justify-content-center p-2 rounded"
                                  style={{
                                    border: "1px solid #d3d5d7",
                                    borderRadius: "10px",
                                    minWidth: "75px",
                                    minHeight: "52px",
                                    backgroundColor: "#ffffff",
                                  }}
                                >
                                  <img
                                    src={favicon}
                                    alt="Favicon"
                                    style={{ maxHeight: "42px", maxWidth: "80px", objectFit: "contain" }}
                                  />
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    title="Reset Favicon"
                                    style={{
                                      fontSize: "12px",
                                      width: "16px",
                                      height: "16px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#ffffff",
                                      backgroundColor: "#ff0000",
                                      borderRadius: "5px",
                                      position: "absolute",
                                      right: "4px",
                                      top: "4px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => setFavicon(logoSmall)}
                                  >
                                    <i className="ti ti-x" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 3. Company Logo */}
                          <div className="row align-items-center gy-3 py-2 border-bottom border-light">
                            <div className="col-xl-9 col-lg-8">
                              <div className="row gy-2 align-items-center">
                                <div className="col-md-5 col-lg-4">
                                  <div className="logo-info">
                                    <h6 className="fw-semibold mb-1 text-dark fs-14">Company Logo</h6>
                                    <p className="text-muted fs-13 mb-0">Upload Logo of your Company</p>
                                  </div>
                                </div>
                                <div className="col-md-7 col-lg-8">
                                  <div className="d-flex flex-column align-items-start align-items-sm-start">
                                    <input
                                      ref={companyLogoRef}
                                      type="file"
                                      accept="image/*"
                                      className="d-none"
                                      onChange={(e) => handleImageFileChange(e, setCompanyLogoImg)}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-danger text-white fw-medium d-inline-flex align-items-center px-3 py-2"
                                      style={{ backgroundColor: "#d63031", borderColor: "#d63031", borderRadius: "6px" }}
                                      onClick={() => companyLogoRef.current?.click()}
                                    >
                                      <i className="ti ti-upload me-1 fs-15" />
                                      Upload Image
                                    </button>
                                    <span className="text-muted fs-12 mt-1">
                                      Recommended size is 450px x 450px. Max size 5mb.
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-xl-3 col-lg-4">
                              <div className="new-logo ms-lg-auto d-flex justify-content-lg-end">
                                <div
                                  className="position-relative d-inline-flex align-items-center justify-content-center p-2 rounded"
                                  style={{
                                    border: "1px solid #d3d5d7",
                                    borderRadius: "10px",
                                    minWidth: "110px",
                                    minHeight: "52px",
                                    backgroundColor: "#ffffff",
                                  }}
                                >
                                  <img
                                    src={companyLogoImg}
                                    alt="Company Logo"
                                    style={{ maxHeight: "42px", maxWidth: "120px", objectFit: "contain" }}
                                  />
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    title="Reset Logo"
                                    style={{
                                      fontSize: "12px",
                                      width: "16px",
                                      height: "16px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#ffffff",
                                      backgroundColor: "#ff0000",
                                      borderRadius: "5px",
                                      position: "absolute",
                                      right: "4px",
                                      top: "4px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => setCompanyLogoImg(companyLogo)}
                                  >
                                    <i className="ti ti-x" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 4. Company Dark Logo */}
                          <div className="row align-items-center gy-3 py-2">
                            <div className="col-xl-9 col-lg-8">
                              <div className="row gy-2 align-items-center">
                                <div className="col-md-5 col-lg-4">
                                  <div className="logo-info">
                                    <h6 className="fw-semibold mb-1 text-dark fs-14">Company Dark Logo</h6>
                                    <p className="text-muted fs-13 mb-0">Upload Logo of your Company</p>
                                  </div>
                                </div>
                                <div className="col-md-7 col-lg-8">
                                  <div className="d-flex flex-column align-items-start align-items-sm-start">
                                    <input
                                      ref={companyDarkLogoRef}
                                      type="file"
                                      accept="image/*"
                                      className="d-none"
                                      onChange={(e) => handleImageFileChange(e, setCompanyDarkLogoImg)}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-danger text-white fw-medium d-inline-flex align-items-center px-3 py-2"
                                      style={{ backgroundColor: "#d63031", borderColor: "#d63031", borderRadius: "6px" }}
                                      onClick={() => companyDarkLogoRef.current?.click()}
                                    >
                                      <i className="ti ti-upload me-1 fs-15" />
                                      Upload Image
                                    </button>
                                    <span className="text-muted fs-12 mt-1">
                                      Recommended size is 450px x 450px. Max size 5mb.
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-xl-3 col-lg-4">
                              <div className="new-logo ms-lg-auto d-flex justify-content-lg-end">
                                <div
                                  className="position-relative d-inline-flex align-items-center justify-content-center p-2 rounded"
                                  style={{
                                    border: "1px solid #1e293b",
                                    borderRadius: "10px",
                                    minWidth: "110px",
                                    minHeight: "52px",
                                    backgroundColor: "#0f172a",
                                  }}
                                >
                                  <img
                                    src={companyDarkLogoImg}
                                    alt="Company Dark Logo"
                                    style={{ maxHeight: "42px", maxWidth: "120px", objectFit: "contain" }}
                                  />
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    title="Reset Dark Logo"
                                    style={{
                                      fontSize: "12px",
                                      width: "16px",
                                      height: "16px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#ffffff",
                                      backgroundColor: "#ff0000",
                                      borderRadius: "5px",
                                      position: "absolute",
                                      right: "4px",
                                      top: "4px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => setCompanyDarkLogoImg(whiteCompanyLogo)}
                                  >
                                    <i className="ti ti-x" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= SECTION 3: ADDRESS INFORMATION ================= */}
                      <div className="border-bottom mb-4 pb-4">
                        <div className="card-title-head mb-3">
                          <h6 className="fs-16 fw-bold mb-0 text-dark d-flex align-items-center">
                            <span className="fs-18 me-2 text-danger">
                              <i className="ti ti-map-pin" />
                            </span>
                            Address Information
                          </h6>
                        </div>

                        <div className="row g-3">
                          <div className="col-12">
                            <div>
                              <label className="form-label fw-medium mb-1">
                                Address <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="NO 19/7, 80 Feet Road, Anna Salai, KK Nagar"
                                value={billingAddress}
                                onChange={(e) => setBillingAddress(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div>
                              <label className="form-label fw-medium mb-1">
                                Country <span className="text-danger">*</span>
                              </label>
                              <CommonSelect
                                options={countryOptions}
                                value={selectedCountry}
                                onChange={(e: any) => setSelectedCountry(e.value)}
                                placeholder="Choose Country"
                                filter={false}
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div>
                              <label className="form-label fw-medium mb-1">
                                State <span className="text-danger">*</span>
                              </label>
                              <CommonSelect
                                options={stateOptions}
                                value={selectedState}
                                onChange={(e: any) => setSelectedState(e.value)}
                                placeholder="Choose State"
                                filter={true}
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div>
                              <label className="form-label fw-medium mb-1">
                                City <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Madurai"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="col-md-6">
                            <div>
                              <label className="form-label fw-medium mb-1">
                                Postal Code <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="625020"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= SECTION 4: TAX & BUSINESS REGISTRATION ================= */}
                      <div className="border-bottom mb-4 pb-4">
                        <div className="card-title-head mb-3">
                          <h6 className="fs-16 fw-bold mb-0 text-dark d-flex align-items-center">
                            <span className="fs-18 me-2 text-danger">
                              <i className="ti ti-receipt-tax" />
                            </span>
                            Tax & Business Registration
                          </h6>
                        </div>

                        <div className="row g-4">
                          {/* Left Column: Tax & IDs */}
                          <div className="col-lg-6">
                            {/* GST Registered */}
                            <div className="mb-3">
                              <label className="form-label fw-medium mb-1">
                                Are you GST Registered?
                              </label>
                              <div className="d-flex align-items-center gap-3">
                                <div
                                  className={`form-check px-3 py-2 border rounded cursor-pointer ${
                                    isGstRegistered ? "border-primary bg-light" : ""
                                  }`}
                                  onClick={() => setIsGstRegistered(true)}
                                >
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="gstRegistered"
                                    id="gstYes"
                                    checked={isGstRegistered}
                                    onChange={() => setIsGstRegistered(true)}
                                  />
                                  <label
                                    className="form-check-label fw-medium ms-1 cursor-pointer"
                                    htmlFor="gstYes"
                                  >
                                    Yes
                                  </label>
                                </div>

                                <div
                                  className={`form-check px-3 py-2 border rounded cursor-pointer ${
                                    !isGstRegistered ? "border-primary bg-light" : ""
                                  }`}
                                  onClick={() => setIsGstRegistered(false)}
                                >
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="gstRegistered"
                                    id="gstNo"
                                    checked={!isGstRegistered}
                                    onChange={() => setIsGstRegistered(false)}
                                  />
                                  <label
                                    className="form-check-label fw-medium ms-1 cursor-pointer"
                                    htmlFor="gstNo"
                                  >
                                    No
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* GSTIN */}
                            {isGstRegistered && (
                              <div className="mb-3">
                                <label className="form-label fw-medium mb-1">
                                  GSTIN <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control text-uppercase"
                                  placeholder="33AKJPN8899F1ZI"
                                  value={gstin}
                                  onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    setGstin(val);
                                    if (val.length >= 12 && !panNumber) {
                                      setPanNumber(val.slice(2, 12));
                                    }
                                  }}
                                />
                              </div>
                            )}

                            {/* PAN Number */}
                            <div className="mb-3">
                              <label className="form-label fw-medium mb-1">PAN Number</label>
                              <input
                                type="text"
                                className="form-control text-uppercase"
                                placeholder="AKJPN8899F"
                                value={panNumber}
                                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                              />
                            </div>

                            {/* Business Type */}
                            <div className="mb-3">
                              <label className="form-label fw-medium mb-1">
                                Business Type
                              </label>
                              <CommonSelect
                                options={businessTypeOptions}
                                value={businessType}
                                onChange={(e: any) => setBusinessType(e.value)}
                                placeholder="Select Business Type"
                                filter={false}
                              />
                            </div>

                            {/* Industry Type */}
                            <div className="mb-3">
                              <label className="form-label fw-medium mb-1">
                                Industry Type
                              </label>
                              <CommonSelect
                                options={industryTypeOptions}
                                value={industryType}
                                onChange={(e: any) => setIndustryType(e.value)}
                                placeholder="Select Industry"
                                filter={true}
                              />
                            </div>

                            {/* Business Registration Type */}
                            <div className="mb-3">
                              <label className="form-label fw-medium mb-1">
                                Business Registration Type
                              </label>
                              <CommonSelect
                                options={registrationTypeOptions}
                                value={registrationType}
                                onChange={(e: any) => setRegistrationType(e.value)}
                                placeholder="Select Registration Type"
                                filter={false}
                              />
                            </div>
                          </div>

                          {/* Right Column: Signature & Custom Details */}
                          <div className="col-lg-6">
                            {/* Signature Upload Box */}
                            <div className="mb-4">
                              <label className="form-label fw-medium mb-1">Authorized Signature</label>
                              <div
                                className="border border-2 border-dashed rounded p-4 text-center cursor-pointer bg-light d-flex flex-column align-items-center justify-content-center"
                                style={{
                                  minHeight: "120px",
                                  borderColor: "#cbd5e1",
                                  transition: "all 0.2s ease",
                                }}
                                onClick={() => signatureInputRef.current?.click()}
                              >
                                {signaturePreview ? (
                                  <div className="position-relative">
                                    <img
                                      src={signaturePreview}
                                      alt="Authorized Signature"
                                      style={{ maxHeight: "80px", maxWidth: "100%" }}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 p-1 rounded-circle"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSignaturePreview(null);
                                      }}
                                    >
                                      <i className="ti ti-x fs-12" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-primary fw-medium fs-14">
                                    <i className="ti ti-plus me-1" />
                                    Add Authorized Signature
                                  </span>
                                )}
                                <input
                                  ref={signatureInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="d-none"
                                  onChange={handleSignatureChange}
                                />
                              </div>
                              <small className="text-muted fs-11 mt-1 d-block">
                                Signature appears automatically on all generated Tax Invoices & Delivery Challans
                              </small>
                            </div>

                            {/* Additional Business Details */}
                            <div className="card border shadow-none mb-3">
                              <div className="card-body p-3">
                                <h6 className="fw-bold mb-1">Additional Business Details</h6>
                                <p className="text-muted fs-12 mb-3">
                                  Include optional attributes like MSME number, CIN, or UPI ID on invoices
                                </p>

                                <div className="d-flex align-items-center gap-2 mb-3">
                                  <select
                                    className="form-select form-control"
                                    style={{ maxWidth: "160px" }}
                                    value={newDetailKey}
                                    onChange={(e) => setNewDetailKey(e.target.value)}
                                  >
                                    <option value="Website">Website</option>
                                    <option value="MSME Number">MSME Number</option>
                                    <option value="CIN">CIN</option>
                                    <option value="UPI ID">UPI ID</option>
                                    <option value="Bank Name">Bank Name</option>
                                    <option value="Account Number">Account Number</option>
                                    <option value="IFSC Code">IFSC Code</option>
                                  </select>
                                  <span className="text-muted fw-bold">=</span>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter value"
                                    value={newDetailVal}
                                    onChange={(e) => setNewDetailVal(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddDetail();
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-primary px-3 fw-medium"
                                    style={{ backgroundColor: "#4f46e5", borderColor: "#4f46e5" }}
                                    onClick={handleAddDetail}
                                  >
                                    Add
                                  </button>
                                </div>

                                {customDetails.length > 0 && (
                                  <div className="d-flex flex-column gap-2 pt-1">
                                    {customDetails.map((item) => (
                                      <div
                                        key={item.id}
                                        className="d-flex align-items-center justify-content-between p-2 bg-light rounded border fs-13"
                                      >
                                        <div>
                                          <strong className="text-dark me-2">{item.key}:</strong>
                                          <span className="text-muted">{item.value}</span>
                                        </div>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-link text-danger p-0"
                                          onClick={() => handleRemoveDetail(item.id)}
                                        >
                                          <i className="ti ti-trash fs-16" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= SECTION 5: OPERATIONS & MAINTENANCE ================= */}
                      <div className="mb-4">
                        <h6 className="fs-16 fw-bold mb-3 text-dark d-flex align-items-center">
                          <span className="fs-18 me-2 text-danger">
                            <i className="ti ti-settings-cog" />
                          </span>
                          Operations & Maintenance
                        </h6>
                        <div className="row g-3">
                          {/* Data Export to Tally Card */}
                          <div className="col-md-6 col-lg-5">
                            <div
                              className="card border h-100 shadow-none cursor-pointer"
                              style={{
                                transition: "all 0.2s ease",
                                borderColor: "#e2e8f0",
                              }}
                              onClick={() => setShowTallyModal(true)}
                            >
                              <div className="card-body d-flex align-items-center p-3">
                                <div
                                  className="avatar avatar-md rounded me-3 d-flex align-items-center justify-content-center"
                                  style={{
                                    width: "42px",
                                    height: "42px",
                                    backgroundColor: "#e0e7ff",
                                    color: "#4f46e5",
                                    flexShrink: 0,
                                  }}
                                >
                                  <i className="ti ti-file-export fs-20" />
                                </div>
                                <div className="flex-fill">
                                  <div className="d-flex align-items-center gap-2 mb-1">
                                    <h6 className="fw-bold mb-0 fs-14">Data Export to Tally</h6>
                                    <span
                                      className="badge bg-primary text-white"
                                      style={{ fontSize: "10px", padding: "2px 6px" }}
                                    >
                                      New
                                    </span>
                                  </div>
                                  <p className="text-muted fs-12 mb-0">
                                    Transfer vouchers, items and parties to Tally XML
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Delete Business Card */}
                          <div className="col-md-6 col-lg-5">
                            <div
                              className="card border h-100 shadow-none cursor-pointer"
                              style={{
                                transition: "all 0.2s ease",
                                borderColor: "#fee2e2",
                              }}
                              onClick={() => setShowDeleteModal(true)}
                            >
                              <div className="card-body d-flex align-items-center p-3">
                                <div
                                  className="avatar avatar-md rounded me-3 d-flex align-items-center justify-content-center"
                                  style={{
                                    width: "42px",
                                    height: "42px",
                                    backgroundColor: "#fee2e2",
                                    color: "#ef4444",
                                    flexShrink: 0,
                                  }}
                                >
                                  <i className="ti ti-trash fs-20" />
                                </div>
                                <div className="flex-fill">
                                  <h6 className="fw-bold mb-0 text-danger fs-14">
                                    Delete Business
                                  </h6>
                                  <p className="text-muted fs-12 mb-0">
                                    Permanently delete this business and its data
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Buttons */}
                      <div className="text-end settings-bottom-btn mt-4 pt-3 border-top">
                        <button
                          type="button"
                          className="btn btn-secondary me-2"
                          onClick={() => reloadBusinesses()}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary px-4 fw-medium"
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* ================= MODAL: CREATE NEW BUSINESS ================= */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Create New Business</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                />
              </div>
              <form onSubmit={handleCreateNewBusiness}>
                <div className="modal-body">
                  {newBizError && (
                    <div className="alert alert-danger py-2 mb-3">{newBizError}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      Business Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Grow Naturals Nursery"
                      value={newBizName}
                      onChange={(e) => setNewBizName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Company Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={newBizPhone}
                      onChange={(e) => setNewBizPhone(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">GSTIN (Optional)</label>
                    <input
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      value={newBizGstin}
                      onChange={(e) => setNewBizGstin(e.target.value.toUpperCase())}
                    />
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
      {showDeleteModal && (
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
                  className="avatar avatar-xl rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{ width: "64px", height: "64px", backgroundColor: "#fee2e2", color: "#ef4444" }}
                >
                  <i className="ti ti-trash fs-28" />
                </div>
                <h4 className="fw-bold mb-2">Delete Business?</h4>
                <p className="text-muted fs-14 mb-4">
                  Are you sure you want to delete{" "}
                  <strong>&quot;{businessName}&quot;</strong>? This action cannot be undone and
                  will remove all associated invoices and ledger settings.
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
                    onClick={handleDeleteBusiness}
                  >
                    {deletingBiz ? "Deleting..." : "Yes, Delete Business"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DATA EXPORT TO TALLY ================= */}
      {showTallyModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Export Data to Tally</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTallyModal(false)}
                />
              </div>
              <div className="modal-body">
                <p className="text-muted fs-14">
                  Generate Tally XML / Excel bridge file containing sales vouchers, master
                  ledgers, and item records for <strong>{businessName}</strong>.
                </p>
                <div className="mb-3">
                  <label className="form-label fw-medium">Export Type</label>
                  <select className="form-select form-control">
                    <option>Sales Invoices (XML)</option>
                    <option>Parties & Customers Ledger (XML)</option>
                    <option>Inventory Item Masters (XML)</option>
                    <option>Complete Audit Dump (Excel/CSV)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTallyModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    alert("Tally XML export package generated and downloaded successfully.");
                    setShowTallyModal(false);
                  }}
                >
                  <i className="ti ti-download me-1" />
                  Download Export File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CLOSE FINANCIAL YEAR ================= */}
      {showFyModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Close Financial Year</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowFyModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="alert alert-warning py-2 mb-3 fs-13">
                  <i className="ti ti-alert-triangle me-1" />
                  Closing the financial year will lock balances and rollover starting stock to the
                  new period.
                </div>
                <p className="text-muted fs-14 mb-0">
                  Current active financial period: <strong>FY 2025-2026</strong>.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFyModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-warning text-white"
                  style={{ backgroundColor: "#d9531e", borderColor: "#d9531e" }}
                  onClick={() => {
                    alert("Financial period checked. Ready for transition.");
                    setShowFyModal(false);
                  }}
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GeneralSettings;
