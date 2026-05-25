import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Users, ChevronRight, Warehouse, Factory, Truck, UserRound, Search, X } from 'lucide-react';
import { PiToolboxFill } from "react-icons/pi";
import { LuWalletCards } from "react-icons/lu";

export const Sidebar = ({ isOpen, onToggleSidebar }) => {
  const location = useLocation();
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [expandedMenu, setExpandedMenu] = useState(null); // Trạng thái mở menu accordion trên mobile

  const handleMenuClick = (menuName) => {
    // Chỉ kích hoạt hiệu ứng accordion khi màn hình nhỏ (< 1024px)
    if (window.innerWidth < 1024) {
      setExpandedMenu(expandedMenu === menuName ? null : menuName);
    }
  };

  // Hàm đóng sidebar khi người dùng nhấn vào các mục menu con ở giao diện mobile
  const handleSubmenuLinkClick = () => {
    if (window.innerWidth < 1024) {
      if (typeof onToggleSidebar === 'function') onToggleSidebar();
      setExpandedMenu(null);
    }
  };

  // Hàm kiểm tra hiển thị dựa trên tìm kiếm
  const isVisible = (labels) => {
    if (!sidebarSearch) return true;
    const searchLower = sidebarSearch.toLowerCase();
    return labels.some(label => label.toLowerCase().includes(searchLower));
  };

  return (
    <aside className={`bg-gray-800 text-white transition-all duration-300 z-30 fixed top-16 bottom-0 left-0 lg:relative lg:top-0 ${isOpen ? 'w-full lg:w-64' : 'w-0 overflow-hidden'}`}>
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
          <div
            onClick={() => handleMenuClick('hanghoa')}
            className="relative group px-3 py-2 rounded-lg lg:hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package size={18} />
                <span className="text-[13px] font-medium">Hàng hóa</span>
              </div>
              <ChevronRight size={14} className={`text-gray-500 transition-transform ${expandedMenu === 'hanghoa' ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
            </div>

            {/* Vùng đệm và Menu bên phải */}
            <div className={`${expandedMenu === 'hanghoa' ? 'block' : 'hidden'} lg:absolute lg:left-full lg:top-0 lg:pl-3 lg:hidden lg:group-hover:block z-50`} onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-800 lg:border lg:border-gray-700 rounded-xl lg:shadow-2xl py-1.5 w-full lg:w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200 mt-1 lg:mt-0">
                <Link to="/items" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/items' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/items' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Thành phẩm
                </Link>
                <Link to="/materials" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/materials' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/materials' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Nguyên liệu
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Kho với Hover Menu */}
        {isOpen && isVisible(['Kho', 'Vị trí kho', 'Đơn vị tính']) && (
          <div
            onClick={() => handleMenuClick('kho')}
            className="relative group px-3 py-2 rounded-lg lg:hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Warehouse size={18} />
                <span className="text-[13px] font-medium">Kho</span>
              </div>
              <ChevronRight size={14} className={`text-gray-500 transition-transform ${expandedMenu === 'kho' ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
            </div>

            {/* Vùng đệm và Menu bên phải */}
            <div className={`${expandedMenu === 'kho' ? 'block' : 'hidden'} lg:absolute lg:left-full lg:top-0 lg:pl-3 lg:hidden lg:group-hover:block z-50`} onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-800 lg:border lg:border-gray-700 rounded-xl lg:shadow-2xl py-1.5 w-full lg:w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200 mt-1 lg:mt-0">
                <Link to="/warehouses" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/warehouses' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/warehouses' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Kho
                </Link>
                <Link to="/warehouse-locations" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/warehouse-locations' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/warehouse-locations' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Vị trí kho
                </Link>
                <Link to="/units" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/units' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/units' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Đơn vị tính
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Đơn hàng với Hover Menu */}
        {isOpen && isVisible(['Đơn hàng', 'Đơn sản xuất', 'Đơn nhập hàng']) && (
          <div
            onClick={() => handleMenuClick('donhang')}
            className="relative group px-3 py-2 rounded-lg lg:hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LuWalletCards size={18} />
                <span className="text-[13px] font-medium">Đơn hàng</span>
              </div>
              <ChevronRight size={14} className={`text-gray-500 transition-transform ${expandedMenu === 'donhang' ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
            </div>

            {/* Vùng đệm pl-3 tạo khoảng cách và Menu bên phải */}
            <div className={`${expandedMenu === 'donhang' ? 'block' : 'hidden'} lg:absolute lg:left-full lg:top-0 lg:pl-3 lg:hidden lg:group-hover:block z-50`} onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-800 lg:border lg:border-gray-700 rounded-xl lg:shadow-2xl py-1.5 w-full lg:w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200 mt-1 lg:mt-0">
                <Link to="/sale-orders" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/sale-orders' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/sale-orders' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Đơn hàng
                </Link>
                <Link to="/manufacturing-orders" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/manufacturing-orders' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/manufacturing-orders' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Đơn sản xuất
                </Link>
                <Link to="/material-receipts" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/material-receipts' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/material-receipts' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Đơn nhập nguyên liệu
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Sản xuất với Hover Menu */}
        {isOpen && isVisible(['Sản xuất', 'BOM', 'Công đoạn', 'Máy móc', 'Tổ']) && (
          <div
            onClick={() => handleMenuClick('sanxuat')}
            className="relative group px-3 py-2 rounded-lg lg:hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Factory size={18} />
                <span className="text-[13px] font-medium">Sản xuất</span>
              </div>
              <ChevronRight size={14} className={`text-gray-500 transition-transform ${expandedMenu === 'sanxuat' ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
            </div>

            {/* Vùng đệm và Menu bên phải */}
            <div className={`${expandedMenu === 'sanxuat' ? 'block' : 'hidden'} lg:absolute lg:left-full lg:top-0 lg:pl-3 lg:hidden lg:group-hover:block z-50`} onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-800 lg:border lg:border-gray-700 rounded-xl lg:shadow-2xl py-1.5 w-full lg:w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200 mt-1 lg:mt-0">
                <Link to="/bom" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/bom' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/bom' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  BOM
                </Link>
                <Link to="/stages" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/stages' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/stages' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Công đoạn
                </Link>
                <Link to="/machines" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/machines' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/machines' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Máy móc
                </Link>
                <Link to="/production-sections" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/production-sections' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/production-sections' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Tổ
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Tiến hành sản xuất với Hover Menu */}
        {isOpen && isVisible(['Tiến hành sản xuất', 'Khả năng', 'Kế hoạch', 'Lệnh sản xuất']) && (
          <div
            onClick={() => handleMenuClick('tienhanh')}
            className="relative group px-3 py-2 rounded-lg lg:hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PiToolboxFill size={18} />
                <span className="text-[13px] font-medium">Tiến hành sản xuất</span>
              </div>
              <ChevronRight size={14} className={`text-gray-500 transition-transform ${expandedMenu === 'tienhanh' ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
            </div>

            {/* Vùng đệm pl-3 tạo khoảng cách và Menu bên phải */}
            <div className={`${expandedMenu === 'tienhanh' ? 'block' : 'hidden'} lg:absolute lg:left-full lg:top-0 lg:pl-3 lg:hidden lg:group-hover:block z-50`} onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-800 lg:border lg:border-gray-700 rounded-xl lg:shadow-2xl py-1.5 w-full lg:w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200 mt-1 lg:mt-0">
                <Link to="/production-capacities" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/production-capacities' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/production-capacities' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Khả năng
                </Link>
                <Link to="/production-plans" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/production-plans' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/production-plans' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Kế hoạch
                </Link>
                <Link to="/production-orders" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/production-orders' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/production-orders' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Lệnh sản xuất
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Vận chuyển hàng với Hover Menu */}
        {isOpen && isVisible(['Vận chuyển hàng', 'Xe hàng', 'Tài xế', 'Chuyến hàng']) && (
          <div
            onClick={() => handleMenuClick('vanchuyen')}
            className="relative group px-3 py-2 rounded-lg lg:hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck size={18} />
                <span className="text-[13px] font-medium">Vận chuyển hàng</span>
              </div>
              <ChevronRight size={14} className={`text-gray-500 transition-transform ${expandedMenu === 'vanchuyen' ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
            </div>

            {/* Vùng đệm pl-3 tạo khoảng cách và Menu bên phải */}
            <div className={`${expandedMenu === 'vanchuyen' ? 'block' : 'hidden'} lg:absolute lg:left-full lg:top-0 lg:pl-3 lg:hidden lg:group-hover:block z-50`} onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-800 lg:border lg:border-gray-700 rounded-xl lg:shadow-2xl py-1.5 w-full lg:w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200 mt-1 lg:mt-0">
                <Link to="/transport-vehicles" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/transport-vehicles' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/transport-vehicles' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Xe hàng
                </Link>
                <Link to="/drivers" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/drivers' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/drivers' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Tài xế
                </Link>
                <Link to="/transport-routes" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/transport-routes' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/transport-routes' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Chuyến hàng
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Đối tác với Hover Menu */}
        {isOpen && isVisible(['Đối tác', 'Nhà cung cấp', 'Khách hàng']) && (
          <div
            onClick={() => handleMenuClick('doitac')}
            className="relative group px-3 py-2 rounded-lg lg:hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={18} />
                <span className="text-[13px] font-medium">Đối tác</span>
              </div>
              <ChevronRight size={14} className={`text-gray-500 transition-transform ${expandedMenu === 'doitac' ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
            </div>

            {/* Vùng đệm pl-3 tạo khoảng cách và Menu bên phải */}
            <div className={`${expandedMenu === 'doitac' ? 'block' : 'hidden'} lg:absolute lg:left-full lg:top-0 lg:pl-3 lg:hidden lg:group-hover:block z-50`} onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-800 lg:border lg:border-gray-700 rounded-xl lg:shadow-2xl py-1.5 w-full lg:w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200 mt-1 lg:mt-0">
                <Link to="/suppliers" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/suppliers' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/suppliers' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Nhà cung cấp
                </Link>
                <Link to="/customers" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/customers' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/customers' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Khách hàng
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Nhóm Nhân sự với Hover Menu */}
        {isOpen && isVisible(['Nhân sự', 'Nhân viên', 'Chức vụ']) && (
          <div
            onClick={() => handleMenuClick('nhansu')}
            className="relative group px-3 py-2 rounded-lg lg:hover:bg-gray-700 cursor-pointer transition-all text-gray-300 hover:text-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserRound size={18} />
                <span className="text-[13px] font-medium">Nhân sự</span>
              </div>
              <ChevronRight size={14} className={`text-gray-500 transition-transform ${expandedMenu === 'nhansu' ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
            </div>

            {/* Vùng đệm pl-3 tạo khoảng cách và Menu bên phải */}
            <div className={`${expandedMenu === 'nhansu' ? 'block' : 'hidden'} lg:absolute lg:left-full lg:top-0 lg:pl-3 lg:hidden lg:group-hover:block z-50`} onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-800 lg:border lg:border-gray-700 rounded-xl lg:shadow-2xl py-1.5 w-full lg:w-44 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200 mt-1 lg:mt-0">
                <Link to="/users" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/users' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === '/users' ? 'bg-white' : 'bg-gray-500'}`}></div>
                  Nhân viên
                </Link>
                <Link to="/roles" onClick={handleSubmenuLinkClick} className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${location.pathname === '/roles' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
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
