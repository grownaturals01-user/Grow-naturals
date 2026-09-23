import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { BusinessProvider } from './context/BusinessContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PosSyncProvider } from './context/PosSyncContext';
import { InventoryModulesProvider } from './context/InventoryModulesContext';

// Layout
import { Layout } from './components/layout/Layout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { POS } from './pages/POS';

// Customers
import { CustomersList } from './pages/CustomersList';
import { CustomerNew } from './pages/CustomerNew';
import { CustomerDetail } from './pages/CustomerDetail';

// Inventory & Products
import { ProductsList } from './pages/ProductsList';
import { ProductNew } from './pages/ProductNew';
import { ProductDetail } from './pages/ProductDetail';
import { ProductEdit } from './pages/ProductEdit';
import { CategoriesManager } from './pages/CategoriesManager';
import { PlantsInventory } from './pages/PlantsInventory';
import { CactusInventory } from './pages/CactusInventory';
import { PotsInventory } from './pages/PotsInventory';
import { FertilizersInventory } from './pages/FertilizersInventory';
import { FlowersInventory } from './pages/FlowersInventory';
import { LossTracking } from './pages/LossTracking';
import { WarehouseManagement } from './pages/WarehouseManagement';
import { InventoryModuleNew } from './pages/InventoryModuleNew';
import { DynamicInventoryPage } from './pages/DynamicInventoryPage';

// Quotations
import { QuotationsList } from './pages/QuotationsList';
import { QuotationNew } from './pages/QuotationNew';
import { QuotationDetail } from './pages/QuotationDetail';

// Delivery Challans
import { DeliveryChallansList } from './pages/DeliveryChallansList';
import { DeliveryChallanNew } from './pages/DeliveryChallanNew';
import { DeliveryChallanDetail } from './pages/DeliveryChallanDetail';

// Projects & Supervisors
import { ProjectsList } from './pages/ProjectsList';
import { ProjectNew } from './pages/ProjectNew';
import { ProjectDetail } from './pages/ProjectDetail';
import { SupervisorsDirectory } from './pages/SupervisorsDirectory';
import { SupervisorPortal } from './pages/SupervisorPortal';

// Purchases & Suppliers
import { SuppliersList } from './pages/SuppliersList';
import { SupplierNew } from './pages/SupplierNew';
import { SupplierEdit } from './pages/SupplierEdit';
import { PurchaseOrdersList } from './pages/PurchaseOrdersList';
import { PurchaseOrderNew } from './pages/PurchaseOrderNew';
import { PurchaseOrderDetail } from './pages/PurchaseOrderDetail';

// Expenses
import { ExpensesList } from './pages/ExpensesList';
import { ExpenseNew } from './pages/ExpenseNew';
import { ExpenseCategoriesManager } from './pages/ExpenseCategoriesManager';

// Sales Ops: Invoices & Refunds
import { InvoicesList } from './pages/InvoicesList';
import { CreateSalesInvoice } from './pages/CreateSalesInvoice';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { RefundsList } from './pages/RefundsList';
import { RefundNew } from './pages/RefundNew';
import { RefundDetail } from './pages/RefundDetail';

// Admin & Settings
import { StaffList } from './pages/StaffList';
import { StaffNew } from './pages/StaffNew';
import { StaffEdit } from './pages/StaffEdit';
import { ShopSettings } from './pages/ShopSettings';

// Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <AuthProvider>
          <PosSyncProvider>
            <InventoryModulesProvider>
              <BrowserRouter>
                <Routes>
                {/* Public Auth Route */}
                <Route path="/login" element={<Login />} />

                {/* Authenticated Routes within Layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  {/* Dashboard & Reports */}
                  <Route index element={<Dashboard />} />
                  <Route path="reports" element={<Reports />} />

                  {/* POS Counter */}
                  <Route path="pos" element={<POS />} />

                  {/* Customers */}
                  <Route path="customers" element={<CustomersList />} />
                  <Route path="customers/new" element={<CustomerNew />} />
                  <Route path="customers/:id" element={<CustomerDetail />} />

                  {/* Inventory & Products */}
                  <Route path="products" element={<ProductsList />} />
                  <Route path="products/new" element={<ProductNew />} />
                  <Route path="products/:id" element={<ProductDetail />} />
                  <Route path="products/:id/edit" element={<ProductEdit />} />
                  <Route path="categories" element={<CategoriesManager />} />
                  <Route path="inventory/plants" element={<PlantsInventory />} />
                  <Route path="inventory/cactus" element={<CactusInventory />} />
                  <Route path="inventory/pots" element={<PotsInventory />} />
                  <Route path="inventory/fertilizers" element={<FertilizersInventory />} />
                  <Route path="inventory/flowers" element={<FlowersInventory />} />
                  <Route path="inventory/losses" element={<LossTracking />} />
                  <Route path="inventory/new" element={<InventoryModuleNew />} />
                  <Route path="inventory/custom/:slug" element={<DynamicInventoryPage />} />
                  <Route path="warehouse" element={<WarehouseManagement />} />

                  {/* Quotations */}
                  <Route path="quotations" element={<QuotationsList />} />
                  <Route path="quotations/new" element={<QuotationNew />} />
                  <Route path="quotations/:id" element={<QuotationDetail />} />

                  {/* Delivery Challans */}
                  <Route path="delivery-challans" element={<DeliveryChallansList />} />
                  <Route path="delivery-challans/new" element={<DeliveryChallanNew />} />
                  <Route path="delivery-challans/:id" element={<DeliveryChallanDetail />} />

                  {/* Projects & Supervisors */}
                  <Route path="projects" element={<ProjectsList />} />
                  <Route path="projects/new" element={<ProjectNew />} />
                  <Route path="projects/:id" element={<ProjectDetail />} />
                  <Route path="supervisors" element={<SupervisorsDirectory />} />
                  <Route path="supervisor-portal" element={<SupervisorPortal />} />

                  {/* Purchases & Suppliers */}
                  <Route path="suppliers" element={<SuppliersList />} />
                  <Route path="suppliers/new" element={<SupplierNew />} />
                  <Route path="suppliers/:id/edit" element={<SupplierEdit />} />
                  <Route path="purchases" element={<PurchaseOrdersList />} />
                  <Route path="purchases/new" element={<PurchaseOrderNew />} />
                  <Route path="purchases/:id" element={<PurchaseOrderDetail />} />

                  {/* Expenses */}
                  <Route path="expenses" element={<ExpensesList />} />
                  <Route path="expenses/new" element={<ExpenseNew />} />
                  <Route path="expenses/categories" element={<ExpenseCategoriesManager />} />

                  {/* Sales Ops: Invoices & Refunds */}
                  <Route path="invoices" element={<InvoicesList />} />
                  <Route path="invoices/create" element={<CreateSalesInvoice />} />
                  <Route path="invoices/:id" element={<InvoiceDetail />} />
                  <Route path="refunds" element={<RefundsList />} />
                  <Route path="refunds/new" element={<RefundNew />} />
                  <Route path="refunds/:id" element={<RefundDetail />} />

                  {/* Admin: Staff & Settings */}
                  <Route path="staff" element={<StaffList />} />
                  <Route path="staff/new" element={<StaffNew />} />
                  <Route path="staff/:id/edit" element={<StaffEdit />} />
                  <Route path="settings" element={<ShopSettings />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </BrowserRouter>
            </InventoryModulesProvider>
          </PosSyncProvider>
        </AuthProvider>
      </BusinessProvider>
    </ThemeProvider>
  );
};

export default App;
