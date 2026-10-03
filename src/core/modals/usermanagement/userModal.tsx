import { useState, useEffect } from "react";
import CommonSelect from "../../../components/select/common-select";
import { user49 } from "../../../utils/imagepath";
import { api } from "../../../services/api";

interface UserModalProps {
  onSuccess?: () => void;
  editUser?: any;
}

const UserModal = ({ onSuccess, editUser }: UserModalProps) => {
  const status = [
    { value: "Admin", label: "Admin" },
    { value: "Manager", label: "Manager" },
    { value: "Cashier", label: "Cashier" },
    { value: "Staff", label: "Staff" },
  ];
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add user state
  const [selectedStatus, setSelectedStatus] = useState<any>({ value: "Staff", label: "Staff" });
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addConfirmPassword, setAddConfirmPassword] = useState("");
  const [addActive, setAddActive] = useState(true);

  // Edit user state
  const [editRole, setEditRole] = useState<any>({ value: "Staff", label: "Staff" });
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    if (editUser) {
      setEditName(editUser.name || editUser.username || "");
      setEditEmail(editUser.email || "");
      setEditPhone(editUser.phone || "");
      const roleCapitalized = editUser.role
        ? editUser.role.charAt(0).toUpperCase() + editUser.role.slice(1)
        : "Staff";
      setEditRole({ value: roleCapitalized, label: roleCapitalized });
      setEditActive(editUser.status === "active");
      setEditPassword("");
      setEditConfirmPassword("");
    }
  }, [editUser]);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };
  const handleToggleConfirmPassword = () => {
    setConfirmPassword((prev) => !prev);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) return;
    setSubmitting(true);
    try {
      const username = addEmail.split("@")[0] + "_" + Math.floor(100 + Math.random() * 900);
      await api.post("/staff", {
        name: addName.trim(),
        username,
        email: addEmail.trim(),
        phone: addPhone.trim(),
        role: (selectedStatus?.value || "Staff").toLowerCase(),
        status: addActive ? "active" : "inactive",
        password: addPassword || "password123",
      });
      setAddName("");
      setAddEmail("");
      setAddPhone("");
      setAddPassword("");
      setAddConfirmPassword("");
      const closeBtn = document.querySelector("#add-user [data-bs-dismiss='modal']") as HTMLButtonElement;
      if (closeBtn) closeBtn.click();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Failed to create staff member:", err);
      alert(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser?.id) return;
    setSubmitting(true);
    try {
      const payload: any = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        role: (editRole?.value || "Staff").toLowerCase(),
        status: editActive ? "active" : "inactive",
      };
      if (editPassword) payload.password = editPassword;
      await api.put(`/staff/${editUser.id}`, payload);
      const closeBtn = document.querySelector("#edit-user [data-bs-dismiss='modal']") as HTMLButtonElement;
      if (closeBtn) closeBtn.click();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Failed to update staff member:", err);
      alert(err.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Add User */}
      <div className="modal fade" id="add-user">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Add User</h4>
                  </div>
                  <button
                    type="button"
                    className="close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <form onSubmit={handleAddSubmit}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-lg-12">
                        <div className="new-employee-field">
                          <div className="profile-pic-upload mb-2">
                            <div className="profile-pic">
                              <span>
                                <i className="feather icon-plus-circle plus-down-add" />
                                Add Image
                              </span>
                            </div>
                            <div className="mb-0">
                              <div className="image-upload mb-0">
                                <input type="file" />
                                <div className="image-uploads">
                                  <h4>Upload Image</h4>
                                </div>
                              </div>
                              <p className="fs-13 mt-2">JPEG, PNG up to 2 MB</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">
                            User<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={addName}
                            onChange={(e) => setAddName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Role<span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            className="w-100"
                            options={status}
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Email<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            value={addEmail}
                            onChange={(e) => setAddEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Phone<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="tel"
                            className="form-control"
                            value={addPhone}
                            onChange={(e) => setAddPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Password<span className="text-danger ms-1">*</span>
                          </label>
                          <div className="pass-group">
                            <input
                              type={showPassword ? "text" : "password"}
                              className="pass-input form-control"
                              placeholder="Enter your password"
                              value={addPassword}
                              onChange={(e) => setAddPassword(e.target.value)}
                            />
                            <span
                              className={`ti toggle-password text-gray-9 ${showPassword ? "ti-eye" : "ti-eye-off"}`}
                              onClick={handleTogglePassword}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Confirm Password
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <div className="pass-group">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              className="pass-input form-control"
                              placeholder="Enter your password"
                              value={addConfirmPassword}
                              onChange={(e) => setAddConfirmPassword(e.target.value)}
                            />
                            <span
                              className={`ti  toggle-password text-gray-9 ${showConfirmPassword ? "ti-eye" : "ti-eye-off"}`}
                              onClick={handleToggleConfirmPassword}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                          <span className="status-label">Status</span>
                          <input
                            type="checkbox"
                            id="user1"
                            className="check"
                            checked={addActive}
                            onChange={(e) => setAddActive(e.target.checked)}
                          />
                          <label htmlFor="user1" className="checktoggle">
                            {" "}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn me-2 btn-secondary"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? "Adding..." : "Add User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Add User */}
      {/* Edit User */}
      <div className="modal fade" id="edit-user">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Edit User</h4>
                  </div>
                  <button
                    type="button"
                    className="close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <form onSubmit={handleEditSubmit}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-lg-12">
                        <div className="new-employee-field">
                          <div className="profile-pic-upload image-field">
                            <div className="profile-pic p-2">
                              <img
                                src={user49}
                                className="object-fit-cover h-100 rounded-1"
                                alt="user"
                              />
                              <button type="button" className="close rounded-1">
                                <span aria-hidden="true">×</span>
                              </button>
                            </div>
                            <div className="mb-3">
                              <div className="image-upload mb-0">
                                <input type="file" />
                                <div className="image-uploads">
                                  <h4>Change Image</h4>
                                </div>
                              </div>
                              <p className="mt-2">JPEG, PNG up to 2 MB</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">
                            User<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Role<span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            className="w-100"
                            options={status}
                            value={editRole}
                            onChange={(e) => setEditRole(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Email<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Phone<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="tel"
                            className="form-control"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Password
                          </label>
                          <div className="pass-group">
                            <input
                              type={showPassword ? "text" : "password"}
                              className="pass-input form-control"
                              placeholder="Leave blank to keep unchanged"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                            />
                            <span
                              className={`ti toggle-password text-gray-9 ${showPassword ? "ti-eye" : "ti-eye-off"}`}
                              onClick={handleTogglePassword}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Confirm Password
                          </label>
                          <div className="pass-group">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              className="pass-input form-control"
                              placeholder="Leave blank to keep unchanged"
                              value={editConfirmPassword}
                              onChange={(e) => setEditConfirmPassword(e.target.value)}
                            />
                            <span
                              className={`ti   toggle-password text-gray-9 ${showConfirmPassword ? "ti-eye" : "ti-eye-off"}`}
                              onClick={handleToggleConfirmPassword}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                          <span className="status-label">Status</span>
                          <input
                            type="checkbox"
                            id="user2"
                            className="check"
                            checked={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                          />
                          <label htmlFor="user2" className="checktoggle">
                            {" "}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn me-2 btn-secondary"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Edit User */}
    </>
  );
};

export default UserModal;
