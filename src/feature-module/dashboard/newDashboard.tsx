import { Link } from "react-router-dom";
import "bootstrap-daterangepicker/daterangepicker.css";
import Chart from "react-apexcharts";
import ReactApexChart from "react-apexcharts";
import { Doughnut } from "react-chartjs-2";
import ApexCharts from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useState, useEffect } from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { all_routes } from "../../routes/all_routes";
import CommonDateRangePicker from "../../components/date-range-picker/common-date-range-picker";
import CommonSelect from "../../components/select/common-select";
import { api, getActiveBusinessId } from "../../services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const formatINR = (val: number | string) => {
  const num = Number(val) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const NewDashboard = () => {
  const route: any = all_routes;
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [_loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>("1Y");

  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedResponsible, setSelectedResponsible] = useState(null);

  const Warehouse: any[] = [];
  const Store: any[] = [];
  const Responsible: any[] = [];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const businessId = getActiveBusinessId();
    api
      .get("/reports/dashboard", { business_id: businessId, range: timeRange })
      .then((res) => {
        if (isMounted) setDashboardData(res);
      })
      .catch((err) => {
        console.error("Dashboard data load error:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  const metrics = dashboardData?.metrics || {
    today_sales: 0,
    today_bills: 0,
    period_sales: 0,
    total_sales: 0,
    total_sales_return: 0,
    total_purchase: 0,
    total_purchase_return: 0,
    total_pre_orders: 0,
    pre_orders_count: 0,
    total_due_pending: 0,
    due_to_pay: 0,
    due_to_collect: 0,
    total_cash_in_bank: 0,
    total_cash_in_hand: 0,
    profit: 0,
    invoice_due: 0,
    total_expenses: 0,
    supplier_dues: 0,
    total_suppliers: 0,
    total_customers: 0,
    total_orders: 0,
    first_time_customers: 0,
    returning_customers: 0,
    low_stock_count: 0,
  };

  const topProducts = dashboardData?.top_products || [];
  const lowStockItems = dashboardData?.low_stock_items || [];
  const recentInvoices = dashboardData?.recent_invoices || [];
  const recentPurchases = dashboardData?.recent_purchases || [];
  const recentQuotations = dashboardData?.recent_quotations || [];
  const recentExpenses = dashboardData?.recent_expenses || [];
  const topCustomers = dashboardData?.top_customers || [];
  const categoriesList = dashboardData?.top_categories || [];

  const firstTimeCount = metrics.first_time_customers || 0;
  const returnCount = metrics.returning_customers || 0;
  const totalCust = firstTimeCount + returnCount;
  const firstTimePercent = totalCust > 0 ? Math.round((firstTimeCount / totalCust) * 100) : 0;
  const returnPercent = totalCust > 0 ? Math.round((returnCount / totalCust) * 100) : 0;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlySalesMap: Record<string, number> = {};
  (dashboardData?.monthly_sales || []).forEach((m: any) => {
    monthlySalesMap[m.month] = Number(m.sales) || 0;
  });
  const monthlyExpMap: Record<string, number> = {};
  (dashboardData?.monthly_expenses || []).forEach((m: any) => {
    monthlyExpMap[m.month] = Number(m.expenses) || 0;
  });

  const monthlyRevSeries = months.map((m) => monthlySalesMap[m] || 0);
  const monthlyExpSeries = months.map((m) => -(monthlyExpMap[m] || 0));

  const salesDayChart: any = {
    chart: {
      height: 245,
      type: "bar" as const,
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    colors: ["#FE9F43", "#FFE3CB"],
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "bottom",
            offsetX: -10,
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        borderRadius: 8,
        borderRadiusWhenStacked: "all",
        horizontal: false,
        endingShape: "rounded",
      },
    },
    series: [
      {
        name: "Sales",
        data: dashboardData?.sales_trend?.map((t: any) => Number(t.sales || t.total) || 0) || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        name: "Purchase",
        data: dashboardData?.purchase_trend?.map((t: any) => Number(t.purchase || t.total) || 0) || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    ],
    xaxis: {
      categories: [
        "2 am", "4 am", "6 am", "8 am", "10 am", "12 am",
        "14 pm", "16 pm", "18 pm", "20 pm", "22 pm", "24 pm",
      ],
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: any) => "₹" + val,
        offsetX: -15,
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 5,
      padding: {
        left: -16,
        top: 0,
        bottom: 0,
        right: 0,
      },
    },
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 1,
    },
  };

  const customerChart: ApexOptions = {
    chart: {
      type: "radialBar",
      height: 130,
      width: "100%",
      parentHeightOffset: 0,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 10,
          size: "30%",
        },
        track: {
          background: "#E6EAED",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            offsetY: -5,
          },
          value: {
            offsetY: 5,
          },
        },
      },
    },
    grid: {
      padding: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
    stroke: {
      lineCap: "round",
    },
    colors: ["#E04F16", "#0E9384"],
    labels: ["First Time", "Return"],
  };

  const series = [firstTimePercent || 0, returnPercent || 0];

  const options: ApexOptions = {
    series: [
      {
        name: "Revenue",
        data: monthlyRevSeries,
      },
      {
        name: "Expenses",
        data: monthlyExpSeries,
      },
    ],
    grid: {
      padding: {
        top: 5,
        right: 5,
      },
    },
    colors: ["#0E9384", "#E04F16"],
    chart: {
      type: "bar",
      height: 290,
      stacked: true,
      zoom: {
        enabled: true,
      },
    },
    responsive: [
      {
        breakpoint: 280,
        options: {
          legend: {
            position: "bottom",
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        borderRadiusApplication: "around",
        borderRadiusWhenStacked: "all",
        columnWidth: "20%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      labels: {
        offsetX: -15,
        formatter: (val: any) => "₹" + val,
      },
    },
    xaxis: {
      categories: months,
    },
    legend: {
      show: false,
    },
    fill: {
      opacity: 1,
    },
  };

  const donutLabels = categoriesList.length > 0 ? categoriesList.map((c: any) => c.name) : ["No Categories"];
  const donutData = categoriesList.length > 0 ? categoriesList.map((c: any) => Number(c.sales_count) || 0) : [0];

  const data: any = {
    labels: donutLabels,
    datasets: [
      {
        label: donutLabels,
        data: donutData,
        backgroundColor: ["#092C4C", "#E04F16", "#FE9F43", "#0E9384", "#10B981"],
        borderWidth: 5,
        borderRadius: 10,
        hoverBorderWidth: 0,
        cutout: "50%",
      },
    ],
  };

  const option = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: -20,
        bottom: -20,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const heat_chart = {
    chart: {
      type: "heatmap" as const,
      height: 370,
    },
    plotOptions: {
      heatmap: {
        radius: 4,
        enableShades: false,
        colorScale: {
          ranges: [
            { from: 0, to: 99, color: "#FFE3CB" },
            { from: 100, to: 200, color: "#FE9F43" },
          ],
        },
      },
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    grid: { padding: { top: -20, bottom: 0, left: 0, right: 0 } },
    yaxis: { labels: { offsetX: -15 } },
    series: [
      { name: "Orders", data: [{ x: "Mon", y: 0 }, { x: "Tue", y: 0 }, { x: "Wed", y: 0 }, { x: "Thu", y: 0 }, { x: "Fri", y: 0 }, { x: "Sat", y: 0 }, { x: "Sun", y: 0 }] }
    ],
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
            <div className="mb-3">
              <h1 className="mb-1">Welcome, Admin</h1>
              <p className="fw-medium">
                You have <span className="text-primary fw-bold">{metrics.today_bills || 0}</span> Orders, Today
              </p>
            </div>
            <div className="input-icon-start position-relative mb-3">
              <span className="input-icon-addon fs-16 text-gray-9">
                <i className="ti ti-calendar" />
              </span>
              <CommonDateRangePicker />
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="alert bg-orange-transparent alert-dismissible fade show mb-4">
            <div>
              <span>
                <i className="ti ti-info-circle fs-14 text-orange me-2" /> Your Product{" "}
              </span>
              <span className="text-orange fw-semibold">
                {lowStockItems.length > 0 ? `${lowStockItems[0].name} is running Low, ` : "Apple Iphone 15 is running Low, "}
              </span>
              already below {lowStockItems.length > 0 ? `${lowStockItems[0].stock_quantity || lowStockItems[0].minimum_quantity || 5} Pcs.` : "5 Pcs."},
              <Link
                to={route.lowstock}
                className="link-orange text-decoration-underline fw-semibold ms-1"
                data-bs-toggle="modal"
                data-bs-target="#add-stock"
              >
                Add Stock
              </Link>
            </div>
            <button
              type="button"
              className="btn-close text-gray-9 fs-14"
              data-bs-dismiss="alert"
              aria-label="Close"
            >
              <i className="ti ti-x" />
            </button>
          </div>

          {/* Top 4 Hero Cards */}
          <div className="row">
            {/* 1st: Total Sales */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card bg-primary sale-widget flex-fill">
                <div className="card-body d-flex align-items-center">
                  <span className="sale-icon bg-white text-primary">
                    <i className="ti ti-file-text fs-24" />
                  </span>
                  <div className="ms-2">
                    <p className="text-white mb-1">Total Sales</p>
                    <div className="d-inline-flex align-items-center flex-wrap gap-2">
                      <h4 className="text-white">
                        {formatINR(metrics.period_sales || metrics.today_sales || metrics.total_sales || 0)}
                      </h4>
                      <span className="badge badge-soft-primary">
                        <i className="ti ti-arrow-up me-1" />
                        +22%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2nd: Total Purchase */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card bg-secondary sale-widget flex-fill">
                <div className="card-body d-flex align-items-center">
                  <span className="sale-icon bg-white text-secondary">
                    <i className="ti ti-shopping-bag fs-24" />
                  </span>
                  <div className="ms-2">
                    <p className="text-white mb-1">Total Purchase</p>
                    <div className="d-inline-flex align-items-center flex-wrap gap-2">
                      <h4 className="text-white">
                        {formatINR(metrics.total_purchase || 0)}
                      </h4>
                      <span className="badge badge-soft-secondary">
                        <i className="ti ti-arrow-up me-1" />
                        +22%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3rd: Total Pre Orders */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card bg-teal sale-widget flex-fill">
                <div className="card-body d-flex align-items-center">
                  <span className="sale-icon bg-white text-teal">
                    <i className="ti ti-gift fs-24" />
                  </span>
                  <div className="ms-2">
                    <p className="text-white mb-1">Total Pre Orders</p>
                    <div className="d-inline-flex align-items-center flex-wrap gap-2">
                      <h4 className="text-white">
                        {formatINR(metrics.total_pre_orders || 0)}
                      </h4>
                      <span className="badge badge-soft-success">
                        <i className="ti ti-arrow-up me-1" />
                        +22%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4th: Total Due to pay */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card bg-info sale-widget flex-fill">
                <div className="card-body d-flex align-items-center">
                  <span className="sale-icon bg-white text-info">
                    <i className="ti ti-brand-pocket fs-24" />
                  </span>
                  <div className="ms-2">
                    <p className="text-white mb-1">Total Due to pay</p>
                    <div className="d-inline-flex align-items-center flex-wrap gap-2">
                      <h4 className="text-white">
                        {formatINR(metrics.due_to_pay ?? metrics.supplier_dues ?? metrics.total_due_pending ?? 0)}
                      </h4>
                      <span className="badge badge-soft-info">
                        <i className="ti ti-alert-circle me-1" />
                        Payables
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: 4 Metric Revenue Cards */}
          <div className="row">
            {/* Profit */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card revenue-widget flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                    <div>
                      <h4 className="mb-1">{metrics.profit ? formatINR(metrics.profit) : "₹0.00"}</h4>
                      <p>Profit</p>
                    </div>
                    <span className="revenue-icon bg-cyan-transparent text-cyan">
                      <i className="fa-solid fa-layer-group fs-16" />
                    </span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="mb-0">
                      <span className="fs-13 fw-bold text-success">+35%</span> vs Last Month
                    </p>
                    <Link to={route.profitloss} className="text-decoration-underline fs-13 fw-medium">
                      View All
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Due to Collect */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card revenue-widget flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                    <div>
                      <h4 className="mb-1">
                        {formatINR(metrics.due_to_collect ?? metrics.invoice_due ?? 0)}
                      </h4>
                      <p> Total Due to Collect</p>
                    </div>
                    <span className="revenue-icon bg-teal-transparent text-teal">
                      <i className="ti ti-chart-pie fs-16" />
                    </span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="mb-0">
                      <span className="fs-13 fw-bold text-success">+35%</span> vs Last Month
                    </p>
                    <Link to={route.invoicereport} className="text-decoration-underline fs-13 fw-medium">
                      View All
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card revenue-widget flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                    <div>
                      <h4 className="mb-1">{metrics.total_expenses ? formatINR(metrics.total_expenses) : "$8,980,097"}</h4>
                      <p>Total Expenses</p>
                    </div>
                    <span className="revenue-icon bg-orange-transparent text-orange">
                      <i className="ti ti-lifebuoy fs-16" />
                    </span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="mb-0">
                      <span className="fs-13 fw-bold text-success">+41%</span> vs Last Month
                    </p>
                    <Link to={route.expenselist} className="text-decoration-underline fs-13 fw-medium">
                      View All
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Cash in Bank */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="card revenue-widget flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                    <div>
                      <h4 className="mb-1">
                        {formatINR(metrics.total_cash_in_bank || 0)}
                      </h4>
                      <p>Total Cash in Bank</p>
                    </div>
                    <span className="revenue-icon bg-indigo-transparent text-indigo">
                      <i className="ti ti-building-bank fs-16" />
                    </span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="mb-0">
                      <span className="fs-13 fw-bold text-success">+25%</span> vs Last Month
                    </p>
                    <Link to={route.salesreport} className="text-decoration-underline fs-13 fw-medium">
                      View All
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales & Purchase Section + Overall Information */}
          <div className="row">
            <div className="col-xxl-8 col-xl-7 col-sm-12 col-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div className="d-inline-flex align-items-center">
                    <span className="title-icon bg-soft-primary fs-16 me-2">
                      <i className="ti ti-shopping-cart" />
                    </span>
                    <h5 className="card-title mb-0">Sales &amp; Purchase</h5>
                  </div>
                  <ul className="nav btn-group custom-btn-group">
                    {["1D", "1W", "1M", "3M", "6M", "1Y"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`btn btn-outline-light ${timeRange === t ? "active" : ""}`}
                        onClick={() => setTimeRange(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </ul>
                </div>
                <div className="card-body pb-0">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="border p-2 br-8">
                        <p className="d-inline-flex align-items-center mb-1">
                          <i className="ti ti-circle-filled fs-8 text-primary-300 me-1" />
                          Total Purchase
                        </p>
                        <h4>{metrics.total_purchase > 1000 ? `${(metrics.total_purchase / 1000).toFixed(0)}K` : (metrics.total_purchase ? formatINR(metrics.total_purchase) : "3K")}</h4>
                      </div>
                      <div className="border p-2 br-8">
                        <p className="d-inline-flex align-items-center mb-1">
                          <i className="ti ti-circle-filled fs-8 text-primary me-1" />
                          Total Sales
                        </p>
                        <h4>{(metrics.period_sales || metrics.today_sales) > 1000 ? `${((metrics.period_sales || metrics.today_sales) / 1000).toFixed(0)}K` : (metrics.period_sales || metrics.today_sales ? formatINR(metrics.period_sales || metrics.today_sales) : "1K")}</h4>
                      </div>
                    </div>
                    <div id="sales-daychart">
                      <Chart
                        options={salesDayChart}
                        series={salesDayChart.series}
                        type="bar"
                        height={245}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Information */}
            <div className="col-xxl-4 col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-header">
                  <div className="d-inline-flex align-items-center">
                    <span className="title-icon bg-soft-info fs-16 me-2">
                      <i className="ti ti-info-circle" />
                    </span>
                    <h5 className="card-title mb-0">Overall Information</h5>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="info-item border bg-light p-3 text-center">
                        <div className="mb-3 text-info fs-24">
                          <i className="ti ti-user-check" />
                        </div>
                        <p className="mb-1">Suppliers</p>
                        <h5>{metrics.total_suppliers || 6987}</h5>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="info-item border bg-light p-3 text-center">
                        <div className="mb-3 text-orange fs-24">
                          <i className="ti ti-users" />
                        </div>
                        <p className="mb-1">Customer</p>
                        <h5>{metrics.total_customers || 4896}</h5>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="info-item border bg-light p-3 text-center">
                        <div className="mb-3 text-teal fs-24">
                          <i className="ti ti-shopping-cart" />
                        </div>
                        <p className="mb-1">Orders</p>
                        <h5>{metrics.total_orders || 487}</h5>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer pb-sm-0">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <h6>Customers Overview</h6>
                    <div className="dropdown dropdown-wraper">
                      <Link
                        to="#"
                        className="dropdown-toggle btn btn-sm"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="ti ti-calendar me-1" />
                        Today
                      </Link>
                      <ul className="dropdown-menu p-3">
                        <li>
                          <Link to="#" className="dropdown-item">Today</Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item">Weekly</Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item">Monthly</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="row align-items-center">
                    <div className="col-sm-5">
                      <div id="customer-chart">
                        <Chart
                          options={customerChart}
                          series={series}
                          type="radialBar"
                          height={130}
                        />
                      </div>
                    </div>
                    <div className="col-sm-7">
                      <div className="row gx-0">
                        <div className="col-sm-6">
                          <div className="text-center border-end">
                            <h2 className="mb-1">{firstTimeCount || "5.5K"}</h2>
                            <p className="text-orange mb-2">First Time</p>
                            <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                              <i className="ti ti-arrow-up-left me-1" />
                              {firstTimePercent || 25}%
                            </span>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="text-center">
                            <h2 className="mb-1">{returnCount || "3.5K"}</h2>
                            <p className="text-teal mb-2">Return</p>
                            <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                              <i className="ti ti-arrow-up-left me-1" />
                              {returnPercent || 21}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products, Low Stock, Recent Sales */}
          <div className="row">
            {/* Top Selling Products */}
            <div className="col-xxl-4 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="d-inline-flex align-items-center">
                    <span className="title-icon bg-soft-pink fs-16 me-2">
                      <i className="ti ti-box" />
                    </span>
                    <h5 className="card-title mb-0">Top Selling Products</h5>
                  </div>
                  <Link to={route.productlist} className="fs-13 fw-bold text-decoration-underline">
                    View All
                  </Link>
                </div>
                <div className="card-body sell-product">
                  {topProducts.length === 0 ? (
                    <div className="text-center text-muted py-4 fs-13">No sales recorded yet</div>
                  ) : (
                    topProducts.slice(0, 5).map((p: any, idx: number) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between border-bottom py-2">
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md bg-light-primary text-primary me-2 d-flex align-items-center justify-content-center">
                            <i className="ti ti-package fs-16" />
                          </div>
                          <div>
                            <h6 className="fw-bold mb-1">{p.product_name || p.name}</h6>
                            <div className="d-flex align-items-center item-list">
                              <p className="text-muted fs-12">{p.total_qty || 0} Sold</p>
                            </div>
                          </div>
                        </div>
                        <span className="fw-bold text-gray-9">{formatINR(p.total_revenue || 0)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Low Stock Products */}
            <div className="col-xxl-4 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="d-inline-flex align-items-center">
                    <span className="title-icon bg-soft-danger fs-16 me-2">
                      <i className="ti ti-alert-triangle" />
                    </span>
                    <h5 className="card-title mb-0">Low Stock Products</h5>
                  </div>
                  <Link to={route.lowstock} className="fs-13 fw-bold text-decoration-underline">
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {lowStockItems.length === 0 ? (
                    <div className="text-center text-success py-4 fs-13">✓ All items well-stocked</div>
                  ) : (
                    lowStockItems.slice(0, 5).map((p: any, idx: number) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md bg-light-warning text-warning me-2 d-flex align-items-center justify-content-center">
                            <i className="ti ti-box fs-16" />
                          </div>
                          <div>
                            <h6 className="fw-bold mb-1">{p.name}</h6>
                            <p className="fs-13 text-muted">SKU: {p.sku || '#' + (p.id?.toString().slice(0, 6) || '')}</p>
                          </div>
                        </div>
                        <div className="text-end">
                          <p className="fs-13 mb-1">Instock</p>
                          <h6 className="text-orange fw-bold">{p.stock_quantity}</h6>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Sales */}
            <div className="col-xxl-4 col-md-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="d-inline-flex align-items-center">
                    <span className="title-icon bg-soft-pink fs-16 me-2">
                      <i className="ti ti-box" />
                    </span>
                    <h5 className="card-title mb-0">Recent Sales</h5>
                  </div>
                  <Link to={route.saleslist} className="fs-13 fw-bold text-decoration-underline">
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {recentInvoices.length === 0 ? (
                    <div className="text-center text-muted py-4 fs-13">No recent sales</div>
                  ) : (
                    recentInvoices.slice(0, 5).map((inv: any, idx: number) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md bg-light-info text-info me-2 d-flex align-items-center justify-content-center">
                            <i className="ti ti-user fs-16" />
                          </div>
                          <div>
                            <h6 className="fw-bold mb-1">{inv.customer_name || 'Walk-in Customer'}</h6>
                            <p className="text-muted fs-12">{inv.invoice_number}</p>
                          </div>
                        </div>
                        <div className="text-end">
                          <p className="fs-14 fw-bold text-gray-9 mb-1">{formatINR(inv.total_amount)}</p>
                          <span className="badge badge-success badge-xs">{inv.payment_status || 'Paid'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sales Statistics & Recent Transactions */}
          <div className="row">
            {/* Sales Statics */}
            <div className="col-xl-6 col-sm-12 col-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div className="d-inline-flex align-items-center">
                    <span className="title-icon bg-soft-danger fs-16 me-2">
                      <i className="ti ti-alert-triangle" />
                    </span>
                    <h5 className="card-title mb-0">Sales Statistics</h5>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <div className="border p-2 br-8">
                      <h5 className="d-inline-flex align-items-center text-teal">
                        {formatINR(metrics.period_sales || 0)}
                      </h5>
                      <p>Revenue</p>
                    </div>
                    <div className="border p-2 br-8">
                      <h5 className="d-inline-flex align-items-center text-orange">
                        {formatINR(metrics.total_expenses || 0)}
                      </h5>
                      <p>Expense</p>
                    </div>
                  </div>
                  <div id="sales-statistics">
                    <ReactApexChart
                      options={options}
                      series={options.series}
                      type="bar"
                      height={290}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="col-xl-6 col-sm-12 col-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="d-inline-flex align-items-center">
                    <span className="title-icon bg-soft-orange fs-16 me-2">
                      <i className="ti ti-flag" />
                    </span>
                    <h5 className="card-title mb-0">Recent Transactions</h5>
                  </div>
                  <Link to={route.saleslist} className="fs-13 fw-medium text-decoration-underline">
                    View All
                  </Link>
                </div>
                <div className="card-body p-0">
                  <ul className="nav nav-tabs nav-justified transaction-tab">
                    <li className="nav-item">
                      <Link className="nav-link active" to="#sale" data-bs-toggle="tab">
                        Sale
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="#purchase-transaction" data-bs-toggle="tab">
                        Purchase
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="#quotation" data-bs-toggle="tab">
                        Quotation
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="#expenses" data-bs-toggle="tab">
                        Expenses
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="#invoices" data-bs-toggle="tab">
                        Invoices
                      </Link>
                    </li>
                  </ul>
                  <div className="tab-content">
                    {/* Sales Tab */}
                    <div className="tab-pane show active" id="sale">
                      <div className="table-responsive">
                        <table className="table table-borderless custom-table">
                          <thead className="thead-light">
                            <tr>
                              <th>Date</th>
                              <th>Customer</th>
                              <th>Status</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentInvoices.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center text-muted py-4">No transactions found</td>
                              </tr>
                            ) : (
                              recentInvoices.slice(0, 5).map((tx: any, idx: number) => (
                                <tr key={idx}>
                                  <td>{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '-'}</td>
                                  <td>
                                    <h6 className="fw-medium">{tx.customer_name || 'Walk-in Customer'}</h6>
                                    <span className="fs-13 text-orange">{tx.invoice_number}</span>
                                  </td>
                                  <td>
                                    <span className="badge badge-success badge-xs">{tx.payment_status || 'Completed'}</span>
                                  </td>
                                  <td className="fs-16 fw-bold text-gray-9">{formatINR(tx.total_amount)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Purchase Tab */}
                    <div className="tab-pane fade" id="purchase-transaction">
                      <div className="table-responsive">
                        <table className="table table-borderless custom-table">
                          <thead className="thead-light">
                            <tr>
                              <th>Date</th>
                              <th>Supplier</th>
                              <th>Status</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentPurchases.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center text-muted py-4">No purchases found</td>
                              </tr>
                            ) : (
                              recentPurchases.slice(0, 5).map((po: any, idx: number) => (
                                <tr key={idx}>
                                  <td>{po.created_at ? new Date(po.created_at).toLocaleDateString() : '-'}</td>
                                  <td><span className="fw-semibold">{po.supplier_name || 'Vendor'}</span></td>
                                  <td><span className="badge badge-success badge-xs">Completed</span></td>
                                  <td className="text-gray-9">{formatINR(po.total_amount)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Quotation Tab */}
                    <div className="tab-pane fade" id="quotation">
                      <div className="table-responsive">
                        <table className="table table-borderless custom-table">
                          <thead className="thead-light">
                            <tr>
                              <th>Date</th>
                              <th>Customer</th>
                              <th>Status</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentQuotations.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center text-muted py-4">No quotations found</td>
                              </tr>
                            ) : (
                              recentQuotations.slice(0, 5).map((q: any, idx: number) => (
                                <tr key={idx}>
                                  <td>{q.created_at ? new Date(q.created_at).toLocaleDateString() : '-'}</td>
                                  <td><span className="fw-medium">{q.customer_name || 'Client'}</span></td>
                                  <td><span className="badge badge-warning badge-xs">{q.status || 'Sent'}</span></td>
                                  <td className="text-gray-9">{formatINR(q.total_amount)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Expenses Tab */}
                    <div className="tab-pane fade" id="expenses">
                      <div className="table-responsive">
                        <table className="table table-borderless custom-table">
                          <thead className="thead-light">
                            <tr>
                              <th>Date</th>
                              <th>Expenses</th>
                              <th>Status</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentExpenses.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center text-muted py-4">No expenses found</td>
                              </tr>
                            ) : (
                              recentExpenses.slice(0, 5).map((e: any, idx: number) => (
                                <tr key={idx}>
                                  <td>{e.created_at ? new Date(e.created_at).toLocaleDateString() : '-'}</td>
                                  <td><h6 className="fw-medium">{e.title || e.category || 'Store Expense'}</h6></td>
                                  <td><span className="badge badge-success badge-xs">Approved</span></td>
                                  <td className="text-gray-9">{formatINR(e.amount)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Invoices Tab */}
                    <div className="tab-pane fade" id="invoices">
                      <div className="table-responsive">
                        <table className="table table-borderless custom-table">
                          <thead className="thead-light">
                            <tr>
                              <th>Customer</th>
                              <th>Due Date</th>
                              <th>Status</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentInvoices.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center text-muted py-4">No invoices found</td>
                              </tr>
                            ) : (
                              recentInvoices.slice(0, 5).map((inv: any, idx: number) => (
                                <tr key={idx}>
                                  <td>
                                    <h6 className="fw-medium">{inv.customer_name || 'Walk-in Customer'}</h6>
                                    <span className="fs-13 text-orange">{inv.invoice_number}</span>
                                  </td>
                                  <td>{inv.due_date || '-'}</td>
                                  <td><span className="badge badge-success badge-xs">{inv.payment_status || 'Paid'}</span></td>
                                  <td className="text-gray-9">{formatINR(inv.total_amount)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Customers, Top Categories, Order Statistics */}
          <div className="row">
            {/* Top Customers */}
            <div className="col-xxl-4 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="d-inline-flex align-items-center">
                    <span className="title-icon bg-soft-orange fs-16 me-2">
                      <i className="ti ti-users" />
                    </span>
                    <h5 className="card-title mb-0">Top Customers</h5>
                  </div>
                  <Link to={route.customers} className="fs-13 fw-medium text-decoration-underline">
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {topCustomers.length === 0 ? (
                    <div className="text-center text-muted py-4 fs-13">No customer records found</div>
                  ) : (
                    topCustomers.slice(0, 5).map((c: any, idx: number) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between border-bottom mb-3 pb-3 flex-wrap gap-2">
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-md bg-light-primary text-primary me-2 d-flex align-items-center justify-content-center">
                            <i className="ti ti-user fs-16" />
                          </div>
                          <div>
                            <h6 className="fs-14 fw-bold mb-1">{c.name}</h6>
                            <p className="text-muted fs-12">{c.orders_count || 0} Orders</p>
                          </div>
                        </div>
                        <div className="text-end">
                          <h5>{formatINR(c.total_spent || 0)}</h5>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="col-xxl-4 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="d-inline-flex align-items-center">
                    <span className="title-icon bg-soft-orange fs-16 me-2">
                      <i className="ti ti-users" />
                    </span>
                    <h5 className="card-title mb-0">Top Categories</h5>
                  </div>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-4 mb-4">
                    <div>
                      <Doughnut
                        data={data}
                        options={option}
                        style={{
                          boxSizing: "border-box",
                          height: "230px",
                          width: "200px",
                        }}
                      />
                    </div>
                    <div>
                      {categoriesList.length === 0 ? (
                        <p className="text-muted fs-13">No categories active</p>
                      ) : (
                        categoriesList.slice(0, 3).map((cat: any, idx: number) => (
                          <div key={idx} className="category-item mb-2">
                            <p className="fs-13 mb-1">{cat.name}</p>
                            <h4 className="d-flex align-items-center">
                              {cat.sales_count || 0}
                              <span className="fs-13 fw-normal text-default ms-1">Sales</span>
                            </h4>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <h6 className="mb-2">Category Statistics</h6>
                  <div className="border br-8">
                    <div className="d-flex align-items-center justify-content-between border-bottom p-2">
                      <p className="d-inline-flex align-items-center mb-0">
                        <i className="ti ti-square-rounded-filled text-indigo fs-8 me-2" />
                        Total Categories
                      </p>
                      <h5>{categoriesList.length}</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Statistics */}
            <div className="col-xxl-4 col-md-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="d-inline-flex align-items-center">
                    <span className="title-icon bg-soft-indigo fs-16 me-2">
                      <i className="ti ti-package" />
                    </span>
                    <h5 className="card-title mb-0">Order Statistics</h5>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <div id="heat_chart">
                    <ApexCharts
                      options={heat_chart}
                      series={heat_chart.series}
                      type="heatmap"
                      height={370}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="copyright-footer d-flex align-items-center justify-content-between border-top bg-white gap-3 flex-wrap">
          <p className="fs-13 text-gray-9 mb-0">
            © {new Date().getFullYear()} Grow Naturals POS. All Rights Reserved.
          </p>
        </div>
      </div>

      {/* Add Stock Modal */}
      <div className="modal fade" id="add-stock">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="page-title">
                <h4>Add Stock</h4>
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
            <form action="#">
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Warehouse</label>
                      <CommonSelect
                        filter={false}
                        options={Warehouse}
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.value)}
                        placeholder="Choose Warehouse"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Store</label>
                      <CommonSelect
                        filter={false}
                        options={Store}
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.value)}
                        placeholder="Choose Store"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Responsible Person</label>
                      <CommonSelect
                        filter={false}
                        options={Responsible}
                        value={selectedResponsible}
                        onChange={(e) => setSelectedResponsible(e.value)}
                        placeholder="Choose Person"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-md btn-dark me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-md btn-primary">
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewDashboard;
