import { useState } from "react";
import { Link } from "react-router-dom";
import CommonSelect from "../../../components/select/common-select";
import { Editor } from "primereact/editor";
import CommonDatePicker from "../../../components/date-picker/common-date-picker";
import { scanners, stockImg02, stockImg03, stockImg05 } from "../../../utils/imagepath";

const EditQuotation = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [text, setText] = useState("");

  const customer = [
    { value: "Choose", label: "Choose" },
    { value: "Thomas", label: "Thomas" },
    { value: "Rose", label: "Rose" },
  ];
  const Status = [
    { label: "Sent", value: "1" },
    { label: "Pending", value: "2" },
  ];
  const [date, setDate] = useState<Date | null>(new Date());
  return (
    <div>
      <>
        {/* edit popup */}
        <div className="modal fade" id="edit-units">
          <div className="modal-dialog edit-sales-modal">
            <div className="modal-content">
              <div className="page-header p-4">
                <div className="add-item new-sale-items d-flex align-items-center justify-content-between w-100 me-0">
                  <div className="page-title">
                    <h4>Edit Quotation</h4>
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
              </div>
              <form>
                <div className="card border-none">
                  <div className="card-body pb-0">
                    <div className="row">
                      <div className="col-lg-4 col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">Customer Name</label>
                          <div className="row">
                            <div className="col-lg-10 col-sm-10 col-10">
                              <CommonSelect
                                className="w-100"
                                options={customer}
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.value)}
                                placeholder="Choose"
                                filter={false}
                              />
                            </div>
                            <div className="col-lg-2 col-sm-2 col-2 ps-0">
                              <div className="add-icon">
                                <span className="bg-dark text-white p-2 rounded">
                                  <i className="feather icon-plus-circle" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4 col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">Date</label>
                          <div className="input-groupicon calender-input">
                            <CommonDatePicker
                              value={date}
                              onChange={setDate}
                              className="w-100"
                            />
                            <i className="feather icon-calendar info-img" />
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4 col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">Reference Number</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder={"010203"}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12 col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">Product Name</label>
                          <div className="input-groupicon select-code">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Please type product code and select"
                            />
                            <div className="addonset">
                              <img
                                src={scanners}
                                alt="img"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="table-responsive no-pagination mb-3">
                      <table className="table datanew">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Purchase Price($)</th>
                            <th>Discount($)</th>
                            <th>Tax(%)</th>
                            <th>Tax Amount($)</th>
                            <th>Unit Cost($)</th>
                            <th>Total Cost(%)</th>
                          </tr>
                        </thead>
                        <tbody><tr><td colSpan={8} className="text-center text-muted py-3">No items in quotation</td></tr></tbody>
                      </table>
                    </div>
                    <div className="row">
                      <div className="col-lg-6 ms-auto">
                        <div className="total-order w-100 max-widthauto m-auto mb-4">
                          <ul className="rounded-1 border-1">
                            <li className="border-0 border-bottom">
                              <h4 className="border-end">Order Tax</h4>
                              <h5>$ 0.00</h5>
                            </li>
                            <li className="border-0 border-bottom">
                              <h4 className="border-end">Discount</h4>
                              <h5>$ 0.00</h5>
                            </li>
                            <li className="border-0 border-bottom">
                              <h4 className="border-end">Shipping</h4>
                              <h5>$ 0.00</h5>
                            </li>
                            <li className="border-0 border-bottom">
                              <h4 className="border-end">Grand Total</h4>
                              <h5>$5200.00</h5>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-3 col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">Order Tax</label>
                          <div className="input-groupicon select-code">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={"0"}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-3 col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">Discount</label>
                          <div className="input-groupicon select-code">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={"0"}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-3 col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">Shipping</label>
                          <div className="input-groupicon select-code">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={"0"}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-3 col-sm-6 col-12">
                        <div className="mb-3">
                          <label className="form-label">Status</label>
                          <CommonSelect
                            className="w-100"
                            options={Status}
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="mb-3 summer-description-box">
                          <label className="form-label">Description</label>
                          <Editor
                            value={text}
                            onTextChange={(e: any) => setText(e.htmlValue)}
                            style={{ height: "200px" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary add-cancel me-3"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <Link
                    to="#"
                    className="btn btn-primary add-sale"
                    data-bs-dismiss="modal"
                  >
                    Submit
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* /edit popup */}
      </>
    </div>
  );
};

export default EditQuotation;
