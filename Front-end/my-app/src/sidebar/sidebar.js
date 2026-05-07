import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Users, ChevronRight, Building2, Factory, Truck, UserRound, Search } from 'lucide-react';
import { PiToolboxFill } from "react-icons/pi";
import { LuWalletCards } from "react-icons/lu";
import { TbBowlFilled } from "react-icons/tb";

export const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Hàm kiểm tra hiển thị dựa trên tìm kiếm
  const isVisible = (labels) => {
    if (!sidebarSearch) return true;
    const searchLower = sidebarSearch.toLowerCase();
    return labels.some(label => label.toLowerCase().includes(searchLower));
  };

  return (
    <aside className={`bg-gray-800 text-white transition-all duration-300 z-20 ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
      <div className="flex flex-col p-4 gap-2 whitespace-nowrap">
        {isOpen && (
          <>
            {/* Thanh tìm kiếm Sidebar */}
            <div className="px-3 mb-2 mt-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-gray-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Tìm nhanh chức năng"
                  className="w-full bg-gray-700 text-white text-[11px] rounded-md pl-8 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all border-none"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* Nhóm Hàng hóa với Hover Menu */}
        {isOpen && isVisible(['Hàng hóa', 'Thành phẩm', 'Nguyên liệu']) && (
          <div className="relative group px-3 py-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package size={18} />
                <span className="text-[13px] font-medium">Hàng hóa</span>
              </div>
              <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Vùng đệm và Menu bên phải */}
            <div className="absolute left-full top-0 pl-3 hidden group-hover:block z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                <Link to="/items" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/items' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/items' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Thành phẩm
                </Link>
                <Link to="/materials" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/materials' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/materials' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Nguyên liệu
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Kho với Hover Menu */}
        {isOpen && isVisible(['Kho', 'Vị trí kho', 'Đơn vị tính']) && (
          <div className="relative group px-3 py-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 size={18} />
                <span className="text-[13px] font-medium">Kho</span>
              </div>
              <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Vùng đệm và Menu bên phải */}
            <div className="absolute left-full top-0 pl-3 hidden group-hover:block z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                <Link to="/warehouses" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/warehouses' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/warehouses' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Kho
                </Link>
                <Link to="/warehouse-locations" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/warehouse-locations' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/warehouse-locations' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Vị trí kho
                </Link>
                <Link to="/units" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/units' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/units' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Đơn vị tính
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Đơn hàng với Hover Menu */}
        {isOpen && isVisible(['Đơn hàng', 'Đơn sản xuất', 'Đơn nhập hàng']) && (
          <div className="relative group px-3 py-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LuWalletCards  size={18} />
                <span className="text-[13px] font-medium">Đơn hàng</span>
              </div>
              <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Vùng đệm pl-3 tạo khoảng cách và Menu bên phải */}
            <div className="absolute left-full top-0 pl-3 hidden group-hover:block z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                <Link to="/sale-orders" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/sale-orders' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/sale-orders' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Đơn hàng
                </Link>
                <Link to="/manufacturing-orders" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/manufacturing-orders' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/manufacturing-orders' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Đơn sản xuất
                </Link>
                <Link to="/material-receipts" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/material-receipts' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/material-receipts' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Đơn nhập nguyên liệu
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Sản xuất với Hover Menu */}
        {isOpen && isVisible(['Sản xuất', 'BOM', 'Công đoạn', 'Máy móc', 'Tổ']) && (
          <div className="relative group px-3 py-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Factory size={18} />
                <span className="text-[13px] font-medium">Sản xuất</span>
              </div>
              <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Vùng đệm và Menu bên phải */}
            <div className="absolute left-full top-0 pl-3 hidden group-hover:block z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                <Link to="/bom" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/bom' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/bom' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  BOM
                </Link>
                <Link to="/stages" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/stages' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/stages' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Công đoạn
                </Link>
                <Link to="/machines" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/machines' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/machines' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Máy móc
                </Link>
                <Link to="/production-sections" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/production-sections' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/production-sections' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Tổ
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Tiến hành sản xuất với Hover Menu */}
        {isOpen && isVisible(['Tiến hành sản xuất', 'Khả năng', 'Kế hoạch', 'Lệnh sản xuất']) && (
          <div className="relative group px-3 py-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PiToolboxFill size={18} />
                <span className="text-[13px] font-medium">Tiến hành sản xuất</span>
              </div>
              <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Vùng đệm pl-3 tạo khoảng cách và Menu bên phải */}
            <div className="absolute left-full top-0 pl-3 hidden group-hover:block z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                <Link to="/production-capacities" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/production-capacities' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/production-capacities' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Khả năng
                </Link>
                <Link to="/production-plans" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/production-plans' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/production-plans' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Kế hoạch
                </Link>
                <Link to="/production-orders" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/production-orders' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/production-orders' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Lệnh sản xuất
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Vận chuyển hàng với Hover Menu */}
        {isOpen && isVisible(['Vận chuyển hàng', 'Xe hàng', 'Tài xế', 'Chuyến hàng']) && (
          <div className="relative group px-3 py-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck size={18} />
                <span className="text-[13px] font-medium">Vận chuyển hàng</span>
              </div>
              <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Vùng đệm pl-3 tạo khoảng cách và Menu bên phải */}
            <div className="absolute left-full top-0 pl-3 hidden group-hover:block z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                <Link to="/transport-vehicles" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/transport-vehicles' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/transport-vehicles' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Xe hàng
                </Link>
                <Link to="/drivers" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/drivers' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/drivers' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Tài xế
                </Link>
                <Link to="/transport-routes" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/transport-routes' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/transport-routes' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Chuyến hàng
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Đối tác với Hover Menu */}
        {isOpen && isVisible(['Đối tác', 'Nhà cung cấp', 'Khách hàng']) && (
          <div className="relative group px-3 py-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={18} />
                <span className="text-[13px] font-medium">Đối tác</span>
              </div>
              <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Vùng đệm pl-3 tạo khoảng cách và Menu bên phải */}
            <div className="absolute left-full top-0 pl-3 hidden group-hover:block z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                <Link to="/suppliers" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/suppliers' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/suppliers' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Nhà cung cấp
                </Link>
                <Link to="/customers" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/customers' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/customers' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Khách hàng
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Nhân sự với Hover Menu */}
        {isOpen && isVisible(['Nhân sự', 'Nhân viên', 'Ca', 'Chức vụ']) && (
          <div className="relative group px-3 py-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserRound size={18} />
                <span className="text-[13px] font-medium">Nhân sự</span>
              </div>
              <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Vùng đệm pl-3 tạo khoảng cách và Menu bên phải */}
            <div className="absolute left-full top-0 pl-3 hidden group-hover:block z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                <Link to="/users" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/users' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/users' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Nhân viên
                </Link>
                <Link to="/shifts" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/shifts' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/shifts' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Ca
                </Link>
                <Link to="/roles" className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/roles' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/roles' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Chức vụ
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
};
