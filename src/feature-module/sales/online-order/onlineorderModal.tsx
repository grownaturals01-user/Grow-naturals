import { useState } from "react";
import { Link } from "react-router-dom";
import { pdf, printer, qrCodeImage, scanners, stockImg02, stockImg03, stockImg05 } from "../../../utils/imagepath";
import { Editor } from "primereact/editor";
import CommonDatePicker from "../../../components/date-picker/common-date-picker";
import CommonSelect from "../../../components/select/common-select";

const OnlineorderModal = () => {
  const [quantity, setQuantity] = useState(4);
  const [text, setText] = useState("");
  const [date1, setDate1] = useState<Date | null>(new Date());
  const [date2, setDate2] = useState<Date | null>(new Date());
  const [date3, setDate3] = useState<Date | null>(new Date());
  const [selectedCustomerName, setSelectedCustomerName] = useState<
    string | null
  >(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string | null>(
    null
  );
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(
    null
  );
  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrement = () => {
    setQuantity(quantity + 1);
  };

  const CustomerName = [{ label: "All Customers", value: "all" }];
  const OrderStatus = [
    { label: "Completed", value: "1" },
    { label: "Inprogress", value: "2" },
  ];
  const PaymentType = [
    { label: "Completed", value: "1" },
    { label: "Inprogress", value: "2" },
  ];
  const Supplier = [{ label: "All Suppliers", value: "all" }];

  return (
    <div>
      <>
        {/*add popup */}
        <div className="modal fade" id="add-sales-new">
          <div className="modal-dialog add-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div className="page-title">
                  <h4> Add Sales</h4>
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
              <form>
                <div className="card border-0">
                  <div className="card-body pb-0">
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
                        <tbody>
                          <tr>
                            <td colSpan={8} className="text-center text-muted py-3">No products added</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-6 ms-auto">
                      <div className="total-order w-100 max-widthauto m-auto mb-4">
                        <ul className="border-1 rounded-1">
                          <li className="border-bottom">
                            <h4 className="border-end">Order Tax</h4>
                            <h5>$ 0.00</h5>
                          </li>
                          <li className="border-bottom">
                            <h4 className="border-end">Discount</h4>
                            <h5>$ 0.00</h5>
                          </li>
                          <li className="border-bottom">
                            <h4 className="border-end">Grand Total</h4>
                            <h5>$ 0.00</h5>
                          </li>
                          <li className="border-bottom">
                            <h4 className="border-end">Paid</h4>
                            <h5>$ 0.00</h5>
                          </li>
                          <li className="border-bottom">
                            <h4 className="border-end">Due</h4>
                            <h5>$ 0.00</h5>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* /details popup */}
        {/* edit popup */}
        <div className="modal fade" id="edit-sales-new">
          <div className="modal-dialog edit-sales-modal">
            <div className="modal-content">
              <div className="page-wrapper p-0 m-0">
                <div className="content p-0">
                  <div className="page-header p-4 mb-0">
                    <div className="add-item new-sale-items d-flex">
                      <div className="page-title">
                        <h4>Edit Sales</h4>
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
                    <div className="card border-0">
                      <div className="card-body pb-0">
                        <div className="table-responsive no-pagination mb-3">
                          <table className="table  datanew">
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
                            <tbody><tr><td colSpan={8} className="text-center text-muted py-3">No products added</td></tr></tbody>
                          </table>
                        </div>
                        <div className="row">
                          <div className="col-lg-4 col-sm-6 col-12">
                            <div className="mb-3">
                              <label className="form-label">
                                Customer Name
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <div className="row">
                                <div className="col-lg-10 col-sm-10 col-10">
                                  <CommonSelect
                                    options={CustomerName}
                                    value={selectedCustomerName}
                                    onChange={(e) =>
                                      setSelectedCustomerName(e.value)
                                    }
                                    placeholder="Choose"
                                    filter={false}
                                  />
                                </div>
                                <div className="col-lg-2 col-sm-2 col-2 ps-0">
                                  <div className="add-icon">
                                    <Link
                                      to="#"
                                      className="bg-dark text-white p-2 rounded"
                                    >
                                      <i className="feather icon-plus-circle plus" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-sm-6 col-12">
                            <div className="mb-3">
                              <label className="form-label">
                                Date<span className="text-danger ms-1">*</span>
                              </label>
                              <div className="input-groupicon calender-input">
                                <CommonDatePicker
                                  value={date2}
                                  onChange={setDate2}
                                  className="w-100"
                                />
                                <i className="feather icon-calendar info-img" />
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-4 col-sm-6 col-12">
                            <div className="mb-3">
                              <label className="form-label">
                                Supplier
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <CommonSelect
                                options={Supplier}
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.value)}
                                placeholder="Choose"
                                filter={false}
                              />
                            </div>
                          </div>
                          <div className="col-lg-12 col-sm-6 col-12">
                            <div className="mb-3">
                              <label className="form-label">
                                Product Name
                                <span className="text-danger ms-1">*</span>
                              </label>
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
                        <div className="row">
                          <div className="col-lg-6 ms-auto">
                            <div className="total-order w-100 max-widthauto m-auto mb-4">
                              <ul className="border-1 rounded-1">
                                <li className="border-bottom">
                                  <h4 className="border-end">Order Tax</h4>
                                  <h5>$ 0.00</h5>
                                </li>
                                <li className="border-bottom">
                                  <h4 className="border-end">Discount</h4>
                                  <h5>$ 0.00</h5>
                                </li>
                                <li className="border-bottom">
                                  <h4 className="border-end">Shipping</h4>
                                  <h5>$ 0.00</h5>
                                </li>
                                <li className="border-bottom">
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
                              <label className="form-label">
                                Order Tax
                                <span className="text-danger ms-1">*</span>
                              </label>
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
                              <label className="form-label">
                                Discount
                                <span className="text-danger ms-1">*</span>
                              </label>
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
                              <label className="form-label">
                                Shipping
                                <span className="text-danger ms-1">*</span>
                              </label>
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
                            <div className="mb-3 mb-5">
                              <label className="form-label">
                                Status
                                <span className="text-danger ms-1">*</span>
                              </label>
                              <CommonSelect
                                options={OrderStatus}
                                value={selectedOrderStatus}
                                onChange={(e) =>
                                  setSelectedOrderStatus(e.value)
                                }
                                placeholder="Choose"
                                filter={false}
                              />
                            </div>
                          </div>
                          <div className="col-lg-12">
                            <div className="mb-3">
                              <label className="form-label">
                                Notes<span className="text-danger ms-1">*</span>
                              </label>
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
                        Save Changes
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /edit popup */}
        {/* show payment Modal */}
        <div
          className="modal fade"
          id="showpayment"
          tabIndex={-1}
          aria-labelledby="showpayment"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
            <div className="modal-content">
              <div className="modal-header">
                <div className="page-title">
                  <h4>Show Payments</h4>
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
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="modal-body-table total-orders p-0">
                      <div className="table-responsive rounded">
                        <table className="table datatable">
                          <thead className="thead-light">
                            <tr>
                              <th>Date</th>
                              <th>Reference</th>
                              <th>Amount</th>
                              <th>Paid By</th>
                              <th className="no-sort" />
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>19 Jan 2023</td>
                              <td>INV/ORD-001</td>
                              <td>$1500</td>
                              <td>Cash</td>
                              <td>
                                <div className="edit-delete-action d-flex align-items-center">
                                  <Link
                                    className="me-3 p-2 border rounded d-flex align-items-center"
                                    to="#"
                                  >
                                    <i className="feather icon-printer feather-rotate-ccw" />
                                  </Link>
                                  <Link
                                    className="me-3 p-2 border rounded d-flex align-items-center"
                                    to="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#editpayment"
                                  >
                                    <i className="feather icon-edit feather-edit" />
                                  </Link>
                                  <Link
                                    className="p-2 border rounded d-flex align-items-center"
                                    to="#"
                                  >
                                    <i className="feather icon-trash-2" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* show payment Modal */}
        {/* Create payment Modal */}
        <div
          className="modal fade"
          id="createpayment"
          tabIndex={-1}
          aria-labelledby="createpayment"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div className="page-title">
                  <h4>Create Payments</h4>
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
              <form>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">
                          {" "}
                          Date<span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-groupicon calender-input">
                          <CommonDatePicker
                            value={date3}
                            onChange={setDate3}
                            className="w-100"
                          />
                          <i className="feather icon-calendar info-img" />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6 col-sm-12 col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Reference<span className="text-danger ms-1">*</span>
                        </label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-4 col-sm-12 col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Received Amount
                          <span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-groupicon doller-input">
                          <i className="feather icon-dollar-sign info-img" />
                          <input type="text" className="form-control ps-4" />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-12 col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Paying Amount
                          <span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-groupicon doller-input">
                          <i className="feather icon-dollar-sign info-img" />
                          <input type="text" className="form-control ps-4" />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-12 col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Payment type
                          <span className="text-danger ms-1">*</span>
                        </label>
                        <CommonSelect
                          options={PaymentType}
                          value={selectedPaymentType}
                          onChange={(e) => setSelectedPaymentType(e.value)}
                          placeholder="Choose"
                          filter={false}
                        />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <Editor
                          value={text}
                          onTextChange={(e: any) => setText(e.htmlValue)}
                          style={{ height: "200px" }}
                        />
                        <p>Maximum 60 Characters</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <Link
                    to="#"
                    className="btn btn-primary"
                    data-bs-dismiss="modal"
                  >
                    Submit
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* Create payment Modal */}
        {/* edit payment Modal */}
        <div
          className="modal fade"
          id="editpayment"
          tabIndex={-1}
          aria-labelledby="editpayment"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div className="page-title">
                  <h4>Edit Payments</h4>
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
              <form>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Date<span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-groupicon calender-input">
                          <i className="feather icon-plus-calendar info-img" />
                          <input
                            type="text"
                            className="datetimepicker form-control"
                            placeholder="Select Date"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6 col-sm-12 col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Reference<span className="text-danger ms-1">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="INV/ORD-001"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-4 col-sm-12 col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Received Amount
                          <span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-groupicon calender-input">
                          <i className="feather icon-dollar-sign info-img" />
                          <input
                            type="text"
                            className="form-control"
                            defaultValue={1500}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-12 col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Paying Amount
                          <span className="text-danger ms-1">*</span>
                        </label>
                        <div className="input-groupicon calender-input">
                          <i className="feather icon-dollar-sign info-img" />
                          <input
                            type="text"
                            className="form-control"
                            defaultValue={1500}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-12 col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Payment type
                          <span className="text-danger ms-1">*</span>
                        </label>
                        <select className="select">
                          <option>Cash</option>
                          <option>Online</option>
                          <option>Inprogress</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="mb-3 summer-description-box transfer">
                        <label className="form-label">Description</label>
                        <div id="summernote2" />
                      </div>
                      <p>Maximum 60 Characters</p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* edit payment Modal */}
      </>
    </div>
  );
};

export default OnlineorderModal;
