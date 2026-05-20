import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUser, updateUser, uploadUserAvatar } from '../controller/usersController';
import { AppNotification } from '../customComponent/customComponent';

export const Profile = () => {
  // Định nghĩa địa chỉ máy chủ Back-end để lấy tệp tĩnh từ wwwroot
  const API_BASE_URL = 'https://quanlysanxuat-back-end.onrender.com';

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
  const [errors, setErrors] = useState({});
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
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

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  // Hàm xử lý lấy URL đầy đủ của ảnh đại diện để hiển thị
  const getAvatarUrl = () => {
    if (avatarPreviewUrl) return avatarPreviewUrl;

    const path = userData.userAvatar;
    if (!path) return null;

    // Nếu path bắt đầu bằng 'data:', đó là ảnh base64 người dùng vừa chọn. Ngược lại là đường dẫn từ server.
    return path.startsWith('data:') ? path : `${API_BASE_URL}${path}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setNotification({ isOpen: true, message: 'Vui lòng chọn tệp hình ảnh.', type: 'error' });
        return;
      }

      setSelectedAvatarFile(file);
      setAvatarPreviewUrl(prevUrl => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return URL.createObjectURL(file);
      });
    }
  };

  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    // Validation logic
    const newErrors = {};
    if (!userData.name?.trim()) newErrors.name = "Bắt buộc nhập Họ và tên";
    if (!userData.email?.trim()) newErrors.email = "Bắt buộc nhập Email cá nhân";
    if (!userData.phone?.trim()) newErrors.phone = "Bắt buộc nhập Số điện thoại";
    if (!userData.address?.trim()) newErrors.address = "Bắt buộc nhập Địa chỉ liên lạc";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    try {
      const personalInfoPayload = { ...userData };
      delete personalInfoPayload.userAvatar;
      delete personalInfoPayload.UserAvatar;
      const response = await updateUser(userData.id, personalInfoPayload);
      let updatedData = response?.data || response;

      if (selectedAvatarFile) {
        const avatarResponse = await uploadUserAvatar(userData.id, selectedAvatarFile);
        updatedData = avatarResponse?.data || avatarResponse;
        setSelectedAvatarFile(null);
        setAvatarPreviewUrl(prevUrl => {
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          return null;
        });
      }

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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

    // Validation logic cho mật khẩu
    const newErrors = {};
    if (!currentPassword?.trim()) newErrors.currentPassword = "Bắt buộc nhập Mật khẩu hiện tại";
    if (!newPassword?.trim()) newErrors.newPassword = "Bắt buộc nhập Mật khẩu mới";
    if (!confirmNewPassword?.trim()) newErrors.confirmNewPassword = "Bắt buộc nhập Xác nhận mật khẩu mới";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

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

        <div className="px-4 pb-8">
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
              <div className="hidden sm:flex items-center justify-center sm:justify-start gap-1.5 text-blue-600 mt-1">
                <ShieldCheck size={16} />
                <span className="text-sm font-bold uppercase">@{userData.username}</span>
              </div>
              <div className="flex py-1 sm:hidden items-center justify-center sm:justify-start gap-1.5 text-blue-600 mt-1">
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center sm:justify-end mb-6 -mt-10 sm:-mt-16"> {/* Điều chỉnh margin-top để định vị tab */}
            <div className="inline-flex rounded-lg shadow-sm bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('personalInfo')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'personalInfo' ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Thông tin cá nhân
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('password')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'password' ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-200'
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
                    <label className={`text-[11px] font-bold uppercase tracking-wider ml-1 ${errors[field.name] ? 'text-red-500' : 'text-gray-500'}`}>{field.label}</label>
                    <div className="relative">
                      <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${errors[field.name] ? 'text-red-400' : 'text-gray-400'}`}>
                        <field.icon size={18} />
                      </span>
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        value={userData[field.name]}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 outline-none transition-all text-sm font-medium ${errors[field.name] ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:bg-white'
                          }`}
                        placeholder={field.placeholder}
                      />
                    </div>
                    {errors[field.name] && <p className="text-red-500 text-[10px] ml-1 mt-1 font-medium">{errors[field.name]}</p>}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-center sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 sm:flex-none flex sm:font-bold sm:uppercase items-center justify-center gap-2 px-6 sm:px-10 py-2 sm:py-3 bg-gray-500 text-white rounded-xl font-bold shadow-lg shadow-gray-200 hover:bg-gray-600 transition-all active:scale-95 text-sm sm:text-base"
                >
                  <ArrowLeft size={20} />
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none flex sm:font-bold sm:uppercase items-center justify-center gap-2 px-6 sm:px-10 py-2 sm:py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-95 text-sm sm:text-base"
                >
                  <Save size={20} />
                  Lưu hồ sơ
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
                    <label className={`text-[11px] font-bold uppercase tracking-wider ml-1 ${errors[field.name] ? 'text-red-500' : 'text-gray-500'}`}>{field.label}</label>
                    <div className="relative">
                      <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${errors[field.name] ? 'text-red-400' : 'text-gray-400'}`}>
                        <field.icon size={18} />
                      </span>
                      <input
                        type={field.type || 'text'}
                        name={field.name}
                        value={passwordForm[field.name]}
                        onChange={handlePasswordFormChange}
                        className={`w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 outline-none transition-all text-sm font-medium ${errors[field.name] ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 focus:bg-white'
                          }`}
                        placeholder={field.placeholder}
                      />
                    </div>
                    {errors[field.name] && <p className="text-red-500 text-[10px] ml-1 mt-1 font-medium">{errors[field.name]}</p>}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-center sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 sm:flex-none flex sm:font-bold sm:uppercase items-center justify-center gap-2 px-6 sm:px-10 py-2 sm:py-3 bg-gray-500 text-white rounded-xl font-bold shadow-lg shadow-gray-200 hover:bg-gray-600 transition-all active:scale-95 text-sm sm:text-base"
                >
                  <ArrowLeft size={20} />
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex sm:flex-none flex sm:font-bold sm:uppercase items-center justify-center gap-2 px-6 sm:px-10 py-2 sm:py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-95 text-sm sm:text-base"
                >
                  <Save size={20} />
                  Đổi mật khẩu
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
