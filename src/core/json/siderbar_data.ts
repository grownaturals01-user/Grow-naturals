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
    label: "Purchases",
    submenuOpen: true,
    submenuHdr: "Purchases",
    submenu: false,
    showSubRoute: false,
    submenuItems: [
      {
        label: "Purchase & Batches",
        link: "/purchase-list",
        icon: "shopping-bag",
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
      {
        label: "Variant Attributes",
        link: route.variantattributes,
        icon: "layers-intersect",
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
  {
    label: "Settings",
    submenuOpen: true,
    showSubRoute: false,
    submenuHdr: "Settings",
    submenuItems: [
      {
        label: "General Settings",
        icon: "settings",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Business Settings", link: route.generalsettings, showSubRoute: false },
          { label: "Business List", link: route.businesslist, showSubRoute: false },
          { label: "Prefixes", link: route.prefixes, showSubRoute: false },
          { label: "Security", link: route.securitysettings, showSubRoute: false },
          { label: "Notifications", link: route.notification, showSubRoute: false },
        ],
      },
      {
        label: "App Settings",
        icon: "device-mobile",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Invoice", link: route.invoicesettings, showSubRoute: false },
          { label: "Invoice Templates", link: route.invoicetemplate, showSubRoute: false },
          { label: "Printer", link: route.printersettings, showSubRoute: false },
          { label: "POS", link: route.possettings, showSubRoute: false },
          { label: "Signatures", link: route.signatures, showSubRoute: false },
          { label: "Custom Fields", link: route.customfields, showSubRoute: false },
        ],
      },
      {
        label: "Financial Settings",
        icon: "settings-dollar",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Bank Accounts", link: route.banksettingsgrid, showSubRoute: false },
          { label: "Tax Rates", link: route.taxrates, showSubRoute: false },
        ],
      },
      {
        label: "Other Settings",
        icon: "settings-2",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Storage", link: route.storagesettings, showSubRoute: false },
          { label: "Ban IP Address", link: route.banipaddress, showSubRoute: false },
        ],
      },
    ],
  },
];
