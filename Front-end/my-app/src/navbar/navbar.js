import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, UserRound, LogOut, Settings, Bell, HelpCircle, X, Trash2, Clock, Package } from 'lucide-react';
import { getNotifications, markAsRead, deleteNotification, getUnreadCount } from '../controller/notificationsController';
import { getCookie, removeCookie } from '../utils/cookieHelper';

export const Navbar = ({ onToggleSidebar }) => {
  // Định nghĩa địa chỉ máy chủ Back-end để lấy tệp tĩnh từ wwwroot
  const API_BASE_URL = 'https://quanlysanxuat-production.up.railway.app';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [hasOpenedGuide, setHasOpenedGuide] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Logic đóng menu khi người dùng click ra ngoài khu vực menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lấy thông tin người dùng từ localStorage khi component mount
  useEffect(() => {
    const storedUser = getCookie('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      setCurrentUser(null);
    }
  }, []);

  const fetchNotifications = async () => {
    if (!currentUser?.username) return;
    try {
      const data = await getNotifications(currentUser.username);
      setNotifications(data);
      const count = await getUnreadCount(currentUser.username);
      setUnreadCount(count);
    } catch (err) {
      console.error("Lỗi khi tải thông báo:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      // Polling thông báo mỗi 30 giây
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleMarkRead = async (notif) => {
    if (notif.isRead) return;
    try {
      await markAsRead(notif.id);
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      // Lần click đầu tiên: Đánh dấu đã đọc
      await handleMarkRead(notif);
    } else if (notif.type === 'item_created' && notif.referenceId) {
      // Lần click thứ hai (khi đã đọc): Điều hướng kèm theo ID thành phẩm
      navigate('/items', { state: { targetItemId: notif.referenceId } });
      setIsNotifOpen(false);
    } else if (notif.type === 'material_created' && notif.referenceId) {
      // Lần click thứ hai cho loại nguyên liệu: Điều hướng đến trang nguyên liệu
      // Truyền referenceId (ID nguyên liệu) qua state để trang đích xử lý việc tìm trang
      navigate('/materials', { state: { targetMaterialId: notif.referenceId } });
      setIsNotifOpen(false);
    } else if (notif.type === 'warehouse_created' && notif.referenceId) {
      // Lần click thứ hai cho nhà kho: Điều hướng đến trang quản lý nhà kho
      navigate('/warehouses', { state: { targetWarehouseId: notif.referenceId } });
      setIsNotifOpen(false);
    }
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notifications.find(n => n.id === id && !n.isRead)) setUnreadCount(prev => prev - 1);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    setHasOpenedGuide(localStorage.getItem('hasOpenedWebsiteGuide') === 'true');
  }, []);

  const handleOpenGuide = () => {
    setIsGuideModalOpen(true);
    if (!hasOpenedGuide) {
      localStorage.setItem('hasOpenedWebsiteGuide', 'true');
      setHasOpenedGuide(true);
    }
  };

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
            src={`${API_BASE_URL}/api/Logos/hanghoa`}
            alt="Logo App Quản Lý Sản Xuất"
            className="h-8 w-auto object-contain hidden sm:block"
          />
          <span className="font-bold text-lg text-gray-800 tracking-tight hidden sm:block">
            APP QUẢN LÝ SẢN XUẤT
          </span>

          <div className="relative">
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Khu vực Thông báo */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`p-2 rounded-full transition-all relative mr-2 ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute -right-10 sm:right-0 mt-3 w-80 sm:w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <span className="font-bold text-gray-800">Thông báo</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Mới nhất</span>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`px-4 py-3 border-b border-gray-50 flex gap-3 cursor-pointer transition-all relative group ${!notif.isRead ? 'bg-blue-50/40 hover:bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="mt-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notif.type === 'item_created' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          <Package size={16} />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <p className={`text-xs leading-relaxed ${!notif.isRead ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(notif.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>{new Date(notif.createdAt).toLocaleDateString('vi-VN')}</span>
                          {/* Trạng thái đã đọc/chưa đọc ở góc dưới bên trái, sau thời gian */}
                          <span className={`font-bold tracking-tighter ${!notif.isRead ? 'text-red-500' : 'text-gray-400'}`}>
                            {!notif.isRead ? 'Chưa đọc' : 'Đã đọc'}
                          </span>
                        </div>
                      </div>

                      {/* Nút xóa */}
                      <button
                        onClick={(e) => handleDeleteNotif(e, notif.id)}
                        className="absolute right-2 top-2 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-gray-400 italic text-sm">Không có thông báo nào</div>
                )}
              </div>
            </div>
          )}
        </div>

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
                  removeCookie('user'); // Xóa thông tin phiên làm việc trong Cookies
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

      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-bold text-gray-800">Hướng dẫn nghiệp vụ trang web</h2>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                aria-label="Dong huong dan"
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-6">
              <p className="text-sm text-gray-600">Phần hướng dẫn sẽ được cập nhật sau</p>
            </div>
            <div className="flex justify-end border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
