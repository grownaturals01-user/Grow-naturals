import { Link } from "react-router-dom";
import Chart from "react-apexcharts";
import { all_routes } from "../../routes/all_routes";
import RefreshIcon from "../../components/tooltip-content/refresh";
import CollapesIcon from "../../components/tooltip-content/collapes";
import { HiIcon, totalSalesIcon, weeklyEarning } from "../../utils/imagepath";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";
import { useState, useEffect } from "react";
import { api, getActiveBusinessId } from "../../services/api";

const formatINR = (val: number | string) => {
  const num = Number(val) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const SalesDashbaord = () => {
  const route = all_routes;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const businessId = getActiveBusinessId();
    api.get("/reports/dashboard", { business_id: businessId })
      .then((res) => setData(res))
      .catch((err) => console.error(err));
  }, []);

  const metrics = data?.metrics || {
    today_sales: 0,
    period_sales: 0,
    today_bills: 0,
    total_orders: 0
  };

  const options: any = {
    series: [
      {
        name: "Sales Analysis",
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    ],
    chart: {
      height: 273,
      type: "area",
      zoom: { enabled: false },
    },
    colors: ["#FF9F43"],
    dataLabels: { enabled: false },
    stroke: { curve: "straight" },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    },
    yaxis: {
      labels: {
        formatter: (val: number) => "₹" + val,
      },
    },
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="welcome d-lg-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center welcome-text">
            <h3 className="d-flex align-items-center">
              <img src={HiIcon} alt="img" />
              &nbsp;Hi Admin,
            </h3>
            &nbsp;
            <h6>here&apos;s what&apos;s happening with your store today.</h6>
          </div>
          <div className="d-flex align-items-center">
            <div className="input-icon-start position-relative me-2">
              <span className="input-icon-addon fs-16 text-gray-9">
                <i className="ti ti-calendar" />
              </span>
              <CommonDateRangePicker />
            </div>
            <ul className="table-top-head">
              <RefreshIcon />
              <CollapesIcon />
            </ul>
          </div>
        </div>

        <div className="row sales-cards">
          <div className="col-xl-6 col-sm-12 col-12 d-flex">
            <div className="card d-flex align-items-center justify-content-between flex-fill mb-4">
              <div>
                <h6>Today's Sales</h6>
                <h3>{formatINR(metrics.today_sales)}</h3>
                <p className="sales-range">
                  <span className="text-muted">Realtime store billing</span>
                </p>
              </div>
              <img src={weeklyEarning} alt="img" />
            </div>
          </div>
          <div className="col-xl-6 col-sm-6 col-12 d-flex">
            <div className="card color-info bg-primary flex-fill mb-4">
              <div className="mb-2">
                <img src={totalSalesIcon} alt="img" />
              </div>
              <h3 className="counters">{metrics.today_bills || 0}</h3>
              <p>Total Orders Today</p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12 d-flex">
            <div className="card flex-fill w-100 mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title mb-0">Sales Analytics</h4>
              </div>
              <div className="card-body">
                <Chart options={options} series={options.series} type="area" height={273} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashbaord;
