import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import RefreshIcon from "../../../components/tooltip-content/refresh";
import CollapesIcon from "../../../components/tooltip-content/collapes";
import CommonFooter from "../../../components/footer/commonFooter";
import SettingsSideBar from "../settingssidebar";
import CommonSelect from "../../../components/select/common-select";
import { getCurrentUser } from "../../../utils/auth";
import { api, getActiveBusinessId } from "../../../services/api";

const GeneralSettings = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<any>({ label: "India", value: "India" });
  const [selectedState, setSelectedState] = useState<any>({ label: "Madhya Pradesh", value: "MP" });
  const [selectedCity, setSelectedCity] = useState<any>({ label: "Bhopal", value: "Bhopal" });

  const Country = [
    { label: "India", value: "India" },
    { label: "USA", value: "USA" },
    { label: "Australia", value: "Australia" },
    { label: "United Kingdom", value: "UK" },
  ];
  const State = [
    { label: "Madhya Pradesh", value: "MP" },
    { label: "Maharashtra", value: "MH" },
    { label: "Delhi", value: "DL" },
    { label: "Gujarat", value: "GJ" },
  ];
  const City = [
    { label: "Bhopal", value: "Bhopal" },
    { label: "Indore", value: "Indore" },
    { label: "Mumbai", value: "Mumbai" },
    { label: "Delhi", value: "Delhi" },
  ];

  useEffect(() => {
    const loadData = async () => {
      const user = getCurrentUser();
      if (user) {
        const parts = (user.name || "").split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setUserName(user.username || parts[0] || "admin");
        setEmail(user.email || "");
        setPhone(user.phone || "");
      }

      try {
        const bizId = getActiveBusinessId();
        if (bizId && bizId !== "all") {
          const biz = await api.get<any>(`/businesses/${bizId}`);
          if (biz) {
            if (biz.address) setAddress(biz.address);
            if (biz.phone && !phone) setPhone(biz.phone);
            if (biz.email && !email) setEmail(biz.email);
          }
        }
      } catch (err) {
        console.warn("Could not load business details:", err);
      }
    };
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const user = getCurrentUser();

      // Update staff / user profile
      if (user?.id) {
        try {
          await api.put(`/staff/${user.id}`, {
            name: fullName,
            email: email.trim(),
            phone: phone.trim(),
          });
        } catch (staffErr) {
          console.warn("Staff update fallback:", staffErr);
        }

        const updatedUser = {
          ...user,
          name: fullName,
          email: email.trim(),
          phone: phone.trim(),
          username: userName.trim(),
        };
        localStorage.setItem("current_user", JSON.stringify(updatedUser));
        localStorage.setItem("gn_auth_user", JSON.stringify(updatedUser));
      }

      // Update business address & phone if active
      const bizId = getActiveBusinessId();
      if (bizId && bizId !== "all") {
        await api.put(`/businesses/${bizId}`, {
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };


  return (
    <>
      <div className="page-wrapper">
        <div className="content settings-content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4 className="fw-bold">Settings</h4>
                <h6>Manage your settings on portal</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <RefreshIcon />
              <CollapesIcon />
            </ul>
          </div>
          <div className="row">
            <div className="col-xl-12">
              <div className="settings-wrapper d-flex">
                <SettingsSideBar />
                <div className="card flex-fill mb-0">
                  <div className="card-header">
                    <h4 className="fs-18 fw-bold">Profile</h4>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSave}>
                      <div className="card-title-head">
                        <h6 className="fs-16 fw-bold mb-3">
                          <span className="fs-16 me-2">
                            <i className="ti ti-user" />
                          </span>
                          Basic Information
                        </h6>
                      </div>
                      <div className="profile-pic-upload">
                        <div className="profile-pic">
                          <span>
                            <i className="ti ti-circle-plus mb-1 fs-16" /> Add
                            Image
                          </span>
                        </div>
                        <div className="new-employee-field">
                          <div className="mb-0">
                            <div className="image-upload mb-0">
                              <input type="file" />
                              <div className="image-uploads">
                                <h4>Upload Image</h4>
                              </div>
                            </div>
                            <span className="fs-13 fw-medium mt-2">
                              Upload an image below 2 MB, Accepted File format
                              JPG, PNG
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">
                              First Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">
                              Last Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">
                              User Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">
                              Phone Number{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">
                              Email <span className="text-danger">*</span>
                            </label>
                            <input
                              type="email"
                              className="form-control"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="card-title-head">
                        <h6 className="fs-16 fw-bold mb-3">
                          <span className="fs-16 me-2">
                            <i className="ti ti-map-pin" />
                          </span>
                          Address Information
                        </h6>
                      </div>
                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Address <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Country <span className="text-danger">*</span>
                            </label>
                            <CommonSelect
                              options={Country}
                              value={selectedCountry}
                              onChange={(e) => setSelectedCountry(e.value)}
                              placeholder="Choose"
                              filter={false}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              State <span className="text-danger">*</span>
                            </label>
                            <CommonSelect
                              options={State}
                              value={selectedState}
                              onChange={(e) => setSelectedState(e.value)}
                              placeholder="Choose"
                              filter={false}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              City <span className="text-danger">*</span>
                            </label>
                            <CommonSelect
                              options={City}
                              value={selectedCity}
                              onChange={(e) => setSelectedCity(e.value)}
                              placeholder="Choose"
                              filter={false}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Postal Code <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={postalCode}
                              onChange={(e) => setPostalCode(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-end settings-bottom-btn mt-0">
                        <button
                          type="button"
                          className="btn btn-secondary me-2"
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                          {saving ? "Saving..." : saveSuccess ? "Saved Successfully!" : "Save Changes"}
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
    </>
  );
};

export default GeneralSettings;
