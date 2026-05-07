import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './navbar/navbar';
import { Sidebar } from './sidebar/sidebar';
import { Items } from './items/items';
import { Users } from './users/users';
import { Categories } from './categories/categories';
import { Roles } from './roles/roles';
import { ItemStatuses } from './itemStatuses/itemStatuses';
import { TransportVehicles } from './transportVehicles/transportVehicles';
import { Drivers } from './drivers/drivers';
import { TransportRoutes } from './transportRoutes/transportRoutes';
import { MaterialCategories } from './materialCategories/materialCategories';
import { ProductionCapacities } from './productionCapacities/productionCapacities';
import { Material } from './materials/materials';
import { ProductionPlans } from './productionPlans/productionPlans';
import { ProductionOrders } from './productionOrders/productionOrders';
import { Warehouses } from './warehouses/warehouses';
import { WarehouseLocations } from './warehouseLocations/warehouseLocations';
import { Saleorders } from './saleorders/saleorders';
import { Profile } from './profile/profile';
import { Warehouse } from 'lucide-react';
import { Login } from './login/login';
import { Units } from './unit/units';
import { BOM } from './BOM/BOM';
import { Suppliers } from './suppliers/suppliers';
import { Customers } from './customers/customers';
import { Stages } from './stages/stages';
import { ProductionSections } from './productionSections/productionSections';
import { Machines } from './machines/machines';
import './index.css'; // Đảm bảo bạn định nghĩa layout trong index.css
import { MaterialReceipts } from './materialReceipts/materialReceipts';

const AppContent = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isProfilePage = location.pathname === '/profile';

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        {!isProfilePage && <Sidebar isOpen={isSidebarOpen} />}
        <main className="flex-1 overflow-auto p-1 bg-gray-100">
          <Routes>
            <Route path="/" element={<Navigate to="/items" replace />} />
            <Route path="/items" element={<Items />} />
            <Route path="/users" element={<Users />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/item-statuses" element={<ItemStatuses />} />
            <Route path="/roles" element={<Roles to="/items" replace />} />
            <Route path="/transport-vehicles" element={<TransportVehicles />} />
            <Route path="/transport-routes" element={<TransportRoutes />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/materials" element={<Material />} />
            <Route path="/material-categories" element={<MaterialCategories />} />
            <Route path="/production-capacities" element={<ProductionCapacities />} />
            <Route path="/production-plans" element={<ProductionPlans />} />
            <Route path="/production-orders" element={<ProductionOrders />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/warehouse-locations" element={<WarehouseLocations />} />"
            <Route path="/bom" element={<BOM />} />
            <Route path="/units" element={<Units />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/sale-orders" element={<Saleorders />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/production-sections" element={<ProductionSections />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/material-receipts" element={<MaterialReceipts />} />
            <Route path="/stages" element={<Stages />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App = () => (
  <Router>
    <AppContent />
  </Router>
);
