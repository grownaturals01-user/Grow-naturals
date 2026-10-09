import { all_routes } from "../../routes/all_routes";

const route = all_routes;

export const SidebarData = [
  {
    label: "Main",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Main",
    submenuItems: [
      {
        label: "Dashboard",
        icon: "layout-grid",
        link: "/admin-dashboard",
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "POS",
        icon: "shopping-cart",
        link: "/pos",
        showSubRoute: false,
        submenu: false,
      },
    ],
  },
  {
    label: "Sales",
    submenuOpen: true,
    submenuHdr: "Sales",
    submenu: false,
    showSubRoute: false,
    submenuItems: [
      {
        label: "Create Sales Invoice",
        link: "/create-sales-invoice",
        icon: "file-plus",
        showSubRoute: false,
        submenu: false,
      },
    ],
  },
  {
    label: "Inventory",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Inventory",
    submenuItems: [
      {
        label: "Product List",
        link: "/product-list",
        icon: "box",
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Add Product",
        link: "/add-product",
        icon: "table-plus",
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Category",
        link: "/category-list",
        icon: "layout-list",
        showSubRoute: false,
        submenu: false,
      },
      {
        label: "Sub Category",
        link: "/sub-categories",
        icon: "git-branch",
        showSubRoute: false,
        submenu: false,
      },
    ],
  },
  {
    label: "People",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "People",
    submenuItems: [
      {
        label: "Customers",
        link: "/customers",
        icon: "users-group",
        showSubRoute: false,
        submenu: false,
      },
    ],
  },
];
