export const SidebarData1 = [
  {
    tittle: "Main Menu",
    hasSubRoute: true,
    icon: "layout-grid",
    showSubRoute: false,
    subRoutes: [
      {
        tittle: "Dashboard",
        hasSubRoute: false,
        showSubRoute: false,
        route: "/admin-dashboard",
        subRoutes: [],
      },
      {
        tittle: "POS",
        hasSubRoute: false,
        showSubRoute: false,
        route: "/pos",
        subRoutes: [],
      },
    ],
  },
  {
    tittle: "Sales",
    hasSubRoute: true,
    icon: "file-plus",
    showSubRoute: false,
    subRoutes: [
      {
        tittle: "Create Sales Invoice",
        hasSubRoute: false,
        showSubRoute: false,
        route: "/create-sales-invoice",
        subRoutes: [],
      },
    ],
  },
  {
    tittle: "Inventory",
    hasSubRoute: true,
    icon: "box",
    showSubRoute: false,
    subRoutes: [
      {
        tittle: "Product List",
        hasSubRoute: false,
        showSubRoute: false,
        route: "/product-list",
        subRoutes: [],
      },
      {
        tittle: "Add Product",
        hasSubRoute: false,
        showSubRoute: false,
        route: "/add-product",
        subRoutes: [],
      },
      {
        tittle: "Category",
        hasSubRoute: false,
        showSubRoute: false,
        route: "/category-list",
        subRoutes: [],
      },
      {
        tittle: "Sub Category",
        hasSubRoute: false,
        showSubRoute: false,
        route: "/sub-categories",
        subRoutes: [],
      },
    ],
  },
  {
    tittle: "People",
    hasSubRoute: true,
    icon: "users-group",
    showSubRoute: false,
    subRoutes: [
      {
        tittle: "Customers",
        hasSubRoute: false,
        showSubRoute: false,
        route: "/customers",
        subRoutes: [],
      },
    ],
  },
];
