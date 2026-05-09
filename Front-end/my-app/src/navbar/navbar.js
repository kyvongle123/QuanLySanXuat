import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, UserRound, LogOut, Settings, Bell, User } from 'lucide-react';
const hanghoa = "/hanghoa.png";

export const Navbar = ({ onToggleSidebar }) => {
  // Định nghĩa địa chỉ máy chủ Back-end để lấy tệp tĩnh từ wwwroot
  const API_BASE_URL = 'https://quanlysanxuat-back-end.onrender.com';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Logic đóng menu khi người dùng click ra ngoài khu vực menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lấy thông tin người dùng từ localStorage khi component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      setCurrentUser(null);
    }
  }, []);

  // Hàm xử lý lấy URL đầy đủ của ảnh đại diện
  const getAvatarUrl = () => {
    const path = currentUser?.userAvatar || currentUser?.UserAvatar;
    if (!path) return null;
    // Nếu path bắt đầu bằng 'data:', đó là ảnh base64 vừa upload. Ngược lại là đường dẫn từ server.
    return path.startsWith('data:') ? path : `${API_BASE_URL}${path}`;
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between sticky top-0 z-40 shadow-sm h-16">
      <div className="flex items-center gap-4">
        {/* Nút đóng/mở Sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 focus:outline-none"
        >
          <Menu size={20} />
        </button>

        {/* Logo và Tên dự án */}
        <div className="flex items-center gap-2 select-none">
          <img
            src={hanghoa}
            alt="Logo App Quản Lý Sản Xuất"
            className="h-8 w-auto object-contain hidden sm:block"
          />
          <span className="font-bold text-lg text-gray-800 tracking-tight hidden sm:block">
            APP QUẢN LÝ SẢN XUẤT
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Nút thông báo (Tùy chọn thêm để giao diện cân đối hơn) */}
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative mr-2">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Khu vực Avatar và Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-4 hover:ring-gray-50 transition-all border border-gray-200 overflow-hidden"
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-inner overflow-hidden">
              {getAvatarUrl() ? (
                <img src={getAvatarUrl()} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserRound size={20} />
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
              <div className="px-4 py-3 border-b border-gray-100 mb-1">
                <p className="text-sm font-bold text-gray-800">{currentUser?.name || 'Người dùng'}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.username || 'N/A'}</p>
              </div>

              <button
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors group"
                onClick={() => {
                  navigate('/profile');
                  setIsMenuOpen(false);
                }}
              >
                <Settings size={18} className="text-gray-400 group-hover:text-blue-600" />
                Thiết lập tài khoản
              </button>

              <div className="h-px bg-gray-100 my-1"></div>

              <button
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors group"
                onClick={() => {
                  localStorage.removeItem('user'); // Xóa thông tin phiên làm việc
                  setIsMenuOpen(false);
                  navigate('/login'); // Chuyển hướng về trang login
                }}
              >
                <LogOut size={18} className="text-red-400 group-hover:text-red-600" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
