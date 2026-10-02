import { useState } from "react";
import { Link } from "react-router-dom";
import AddAttendance from "../../core/modals/hrm/addattendance";
import EditAttendance from "../../core/modals/hrm/editattendance";

import {
  user01,
  user03,
  user04,
  user05,
  user06,
  user12,
  user26,
  user28,
  user30,
} from "../../utils/imagepath/index";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import CommonDatePicker from "../../components/date-picker/common-date-picker";
import SearchFromApi from "../../components/data-table/search";

export const attandanceadmindata: any[] = [];

const AttendanceAdmin = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, _setTotalRecords] = useState<any>(5);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(
    undefined
  );
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const handleSearch = (value: any) => {
    setSearchQuery(value);
  };

  const [date, setDate] = useState<Date | null>(new Date());
  const columns = [
    {
      field: "Employee",
      header: "Employee",
      sortable: true,
      body: (rowData: any) => (
        <div className="d-flex align-items-center">
          <Link to="#" className="avatar avatar-md me-2">
            <img src={rowData.image} alt="product" />
          </Link>
          <div>
            <h6>
              <Link to="#">{rowData.Employee}</Link>
            </h6>
            <span>{rowData.Role}</span>
          </div>
        </div>
      ),
    },
    {
      field: "Status",
      header: "Status",
      sortable: true,
      body: (rowData: any) => (
        <span
          className={`badge ${
            rowData.Status === "Present" ? "badge-success" : "badge-danger"
          } d-inline-flex align-items-center badge-xs`}
        >
          <i className="ti ti-point-filled me-1" />
          {rowData.Status}
        </span>
      ),
    },
    {
      field: "Clock_In",
      header: "Clock In",
      sortable: true,
    },
    {
      field: "Clock_Out",
      header: "Clock Out",
      sortable: true,
    },
    {
      field: "Production",
      header: "Production",
      sortable: true,
    },
    {
      field: "Break",
      header: "Break",
      sortable: true,
    },
    {
      field: "Overtime",
      header: "Overtime",
      sortable: true,
    },
    {
      field: "Total_Hours",
      header: "Total Hours",
      sortable: true,
    },
  ];

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Attendance</h4>
                <h6>Manage your Attendance</h6>
              </div>
            </div>
            <TableTopHead />
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
                <div className="me-2 date-select-small">
                  <div className="input-addon-left position-relative attendance-datepicker">
                    <CommonDatePicker
                      value={date}
                      onChange={setDate}
                    />
                    <span className="cus-icon">
                      <i className="feather icon-calendar" />
                    </span>
                  </div>
                </div>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Select Status
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Present
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Absent
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body pb-0">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={attandanceadmindata}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={totalRecords}
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

      <AddAttendance />
      <EditAttendance />
    </div>
  );
};

export default AttendanceAdmin;
