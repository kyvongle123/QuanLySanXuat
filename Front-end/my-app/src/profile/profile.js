import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUser, updateUser } from '../controller/usersController';
import { AppNotification } from '../customComponent/customComponent';

export const Profile = () => {
  // Định nghĩa địa chỉ máy chủ Back-end để lấy tệp tĩnh từ wwwroot
  const API_BASE_URL = 'https://localhost:49851';

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    userAvatar: null
  });
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('personalInfo'); // State for active tab

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || !storedUser.id) {
          navigate('/login');
          return;
        }

        const data = await getUser(storedUser.id);
        setUserData({
          ...data,
          id: data.id || data.Id,
          name: data.name || data.Name || '',
          email: data.email || data.Email || '',
          phone: data.phone || data.Phone || '',
          address: data.address || data.Address || '',
          username: data.username || data.Username || '',
          userAvatar: data.userAvatar || data.UserAvatar || null,
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Hàm xử lý lấy URL đầy đủ của ảnh đại diện để hiển thị
  const getAvatarUrl = () => {
    const path = userData.userAvatar;
    if (!path) return null;
    
    // Nếu path bắt đầu bằng 'data:', đó là ảnh base64 người dùng vừa chọn. Ngược lại là đường dẫn từ server.
    return path.startsWith('data:') ? path : `${API_BASE_URL}${path}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData(prev => ({ ...prev, userAvatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    try {
      const response = await updateUser(userData.id, userData);
      const updatedData = response?.data || response;
      
      // Cập nhật lại tên hiển thị trong localStorage nếu người dùng đổi tên
      const currentUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...currentUser, name: userData.name, userAvatar: updatedData.userAvatar || updatedData.UserAvatar }));
      setUserData(prev => ({ ...prev, userAvatar: updatedData.userAvatar || updatedData.UserAvatar }));
      
      setNotification({ isOpen: true, message: 'Cập nhật hồ sơ thành công!', type: 'success' });
    } catch (err) {
      setNotification({ isOpen: true, message: 'Lỗi khi lưu thông tin cá nhân.', type: 'error' });
    }
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setNotification({ isOpen: true, message: 'Vui lòng điền đầy đủ các trường mật khẩu.', type: 'error' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setNotification({ isOpen: true, message: 'Mật khẩu mới và xác nhận mật khẩu không khớp.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) { // Ví dụ: Mật khẩu tối thiểu 6 ký tự
      setNotification({ isOpen: true, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.', type: 'error' });
      return;
    }

    try {
      // LƯU Ý QUAN TRỌNG: Backend PutUser hiện tại KHÔNG xác minh currentPassword.
      // Nó chỉ cập nhật mật khẩu nếu trường 'Password' trong đối tượng User gửi lên khác với mật khẩu đã lưu.
      // Để đảm bảo an toàn, backend cần được sửa đổi để xác minh mật khẩu hiện tại.
      const payload = { ...userData, password: newPassword }; // Gửi toàn bộ userData để không làm mất các trường khác
      await updateUser(userData.id, payload);
      
      setNotification({ isOpen: true, message: 'Cập nhật mật khẩu thành công!', type: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); // Xóa form
    } catch (err) {
      console.error("Error saving password:", err);
      setNotification({ isOpen: true, message: 'Lỗi khi cập nhật mật khẩu. Vui lòng thử lại.', type: 'error' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-8 flex flex-col items-center sm:items-start sm:flex-row gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-lg border border-gray-100 overflow-hidden">
                {getAvatarUrl() ? (
                  <img src={getAvatarUrl()} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                    <User size={48} />
                  </div>
                )}
              </div>
              <label className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-lg shadow-lg cursor-pointer hover:bg-blue-700 transition-all transform hover:scale-110 active:scale-95">
                <Camera size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>

            <div className="flex-1 mt-1 sm:mt-16 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{userData.name || 'Người dùng'}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-blue-600 mt-1">
                <ShieldCheck size={16} />
                <span className="text-sm font-bold uppercase">@{userData.username}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-end mb-6 -mt-10 sm:-mt-16"> {/* Điều chỉnh margin-top để định vị tab */}
            <div className="inline-flex rounded-lg shadow-sm bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('personalInfo')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'personalInfo' ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Thông tin cá nhân
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('password')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'password' ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mật khẩu
              </button>
            </div>
          </div>

          {activeTab === 'personalInfo' && (
            <form onSubmit={handleSavePersonalInfo} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Họ và tên', name: 'name', icon: User, placeholder: 'Nhập tên của bạn' },
                  { label: 'Email cá nhân', name: 'email', icon: Mail, placeholder: 'example@mail.com', type: 'email' },
                  { label: 'Số điện thoại', name: 'phone', icon: Phone, placeholder: '0xxx xxx xxx' },
                  { label: 'Địa chỉ liên lạc', name: 'address', icon: MapPin, placeholder: 'Tên đường, phường/xã...' },
                ].map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">{field.label}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <field.icon size={18} />
                      </span>
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        value={userData[field.name]}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
                        placeholder={field.placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-10 py-3 bg-gray-500 text-white rounded-xl font-bold shadow-lg shadow-gray-200 hover:bg-gray-600 transition-all active:scale-95"
                >
                  <ArrowLeft size={20} />
                  QUAY LẠI
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-95"
                >
                  <Save size={20} />
                  LƯU HỒ SƠ
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {[
                  { label: 'Mật khẩu hiện tại', name: 'currentPassword', type: 'password', icon: Lock, placeholder: 'Nhập mật khẩu hiện tại' },
                  { label: 'Mật khẩu mới', name: 'newPassword', type: 'password', icon: Lock, placeholder: 'Nhập mật khẩu mới' },
                  { label: 'Xác nhận mật khẩu mới', name: 'confirmNewPassword', type: 'password', icon: Lock, placeholder: 'Nhập lại mật khẩu mới' },
                ].map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">{field.label}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <field.icon size={18} />
                      </span>
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        value={passwordForm[field.name]}
                        onChange={handlePasswordFormChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
                        placeholder={field.placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-10 py-3 bg-gray-500 text-white rounded-xl font-bold shadow-lg shadow-gray-200 hover:bg-gray-600 transition-all active:scale-95"
              >
                <ArrowLeft size={20} />
                QUAY LẠI
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-95"
              >
                <Save size={20} />
                ĐỔI MẬT KHẨU
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
      <AppNotification isOpen={notification.isOpen} message={notification.message} type={notification.type} onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
};
