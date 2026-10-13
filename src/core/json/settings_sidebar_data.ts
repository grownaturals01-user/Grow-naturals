import { all_routes } from "../../routes/all_routes";

const route = all_routes;

export interface SettingsMenuItem {
  label: string;
  icon?: string;
  link?: string;
  submenu?: boolean;
  submenuItems?: SettingsMenuItem[];
}

export const SettingsSidebarData: SettingsMenuItem[] = [
  {
    label: "General Settings",
    icon: "settings",
    submenu: true,
    submenuItems: [
      { label: "Business Settings", link: route.generalsettings },
      { label: "Business List", link: route.businesslist },
      { label: "Prefixes", link: route.prefixes },
      { label: "Security", link: route.securitysettings },
      { label: "Notifications", link: route.notification },
    ],
  },
  {
    label: "App Settings",
    icon: "device-mobile",
    submenu: true,
    submenuItems: [
      { label: "Invoice", link: route.invoicesettings },
      { label: "Invoice Templates", link: route.invoicetemplate },
      { label: "Printer", link: route.printersettings },
      { label: "POS", link: route.possettings },
      { label: "Signatures", link: route.signatures },
      { label: "Custom Fields", link: route.customfields },
    ],
  },
  {
    label: "Financial Settings",
    icon: "settings-dollar",
    submenu: true,
    submenuItems: [
      { label: "Bank Accounts", link: route.banksettingsgrid },
      { label: "Tax Rates", link: route.taxrates },
    ],
  },
  {
    label: "Other Settings",
    icon: "settings-2",
    submenu: true,
    submenuItems: [
      { label: "Storage", link: route.storagesettings },
      { label: "Ban IP Address", link: route.banipaddress },
    ],
  },
];

