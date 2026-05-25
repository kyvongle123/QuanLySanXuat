import { useEffect, useState } from 'react';
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
import { getCookie } from './utils/cookieHelper'; // Import getCookie

const AppContent = () => {
  // Mặc định mở trên desktop (>= 1024px) và đóng trên mobile (< 1024px)
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const location = useLocation();

  const userCookie = getCookie('user');
  const isAuthenticated = !!userCookie; // Kiểm tra xem cookie 'user' có tồn tại không

  // useEffect(() => {
  //   const handleResize = () => {
  //     setSidebarOpen(window.innerWidth < 1024);
  //   };

  //   window.addEventListener('resize', handleResize);

  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);

  // Logic điều hướng toàn cục dựa trên trạng thái đăng nhập
  if (!isAuthenticated && location.pathname !== '/login') {
    // Nếu chưa đăng nhập và không ở trang login, điều hướng về trang login
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated && location.pathname === '/login') {
    // Nếu đã đăng nhập và đang ở trang login, điều hướng về trang items
    return <Navigate to="/items" replace />;
  }

  if (isAuthenticated && location.pathname === '/') {
    // Nếu đã đăng nhập và đang ở đường dẫn gốc, điều hướng về trang items
    return <Navigate to="/items" replace />;
  }

  // Nếu chưa đăng nhập và đang ở trang login, chỉ render component Login
  if (!isAuthenticated && location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Nếu đến đây, người dùng đã được xử lý điều hướng hoặc đang ở trạng thái hợp lệ để render ứng dụng chính
  const isProfilePage = location.pathname === '/profile'; // Định nghĩa ở đây để đảm bảo scope chính xác

  return (
    <div className="flex flex-col h-screen">
      <Navbar onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar không hiển thị trên trang profile */}
        {!isProfilePage && <Sidebar isOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />}
        <main className="flex-1 overflow-auto p-1 bg-gray-100">
          <Routes>
            {/* Các Route của ứng dụng */}
            {/* Không cần Route "/" ở đây vì đã được xử lý bằng Navigate toàn cục */}
            <Route path="/items" element={<Items />} />
            <Route path="/users" element={<Users />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/item-statuses" element={<ItemStatuses />} />
            <Route path="/roles" element={<Roles />} /> {/* Đã bỏ prop 'to' không hợp lệ */}
            <Route path="/transport-vehicles" element={<TransportVehicles />} />
            <Route path="/transport-routes" element={<TransportRoutes />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/materials" element={<Material />} />
            <Route path="/material-categories" element={<MaterialCategories />} />
            <Route path="/production-capacities" element={<ProductionCapacities />} />
            <Route path="/production-plans" element={<ProductionPlans />} />
            <Route path="/production-orders" element={<ProductionOrders />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/warehouse-locations" element={<WarehouseLocations />} />
            <Route path="/bom" element={<BOM />} />
            <Route path="/units" element={<Units />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/sale-orders" element={<Saleorders />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/production-sections" element={<ProductionSections />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/material-receipts" element={<MaterialReceipts />} />
            <Route path="/stages" element={<Stages />} />
            <Route path="/login" element={<Login />} /> {/* Vẫn cần Route này để component Login được định nghĩa */}
            <Route path="/profile" element={<Profile />} />
            {/* Route catch-all: Điều hướng đến /items nếu đã đăng nhập, ngược lại về /login */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/items" : "/login"} replace />} />
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
