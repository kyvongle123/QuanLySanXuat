import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Mail } from 'lucide-react';
import { login as loginApi } from '../controller/authController';
import { AppNotification } from '../customComponent/customComponent';

export const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'error' });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    // Xóa lỗi khi người dùng bắt đầu nhập lại dữ liệu
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra validation thủ công
    const newErrors = {};
    if (!credentials.username.trim()) newErrors.username = 'Bắt buộc nhập Tên đăng nhập';
    if (!credentials.password.trim()) newErrors.password = 'Bắt buộc nhập Mật khẩu';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({ username: '', password: '' });
    setLoading(true);
    try {
      const data = await loginApi(credentials);
      // Lưu thông tin người dùng vào localStorage, bao gồm userAvatar
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/items'); // Chuyển hướng sau khi đăng nhập thành công
    } catch (err) {
      setNotification({ isOpen: true, message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <img
            src="https://quanlysanxuat-back-end.onrender.com//api/logos/hanghoa"
            alt="Logo"
            className="w-20 h-18 mx-auto mb-4 object-contain"
          />
          <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
          <p className="text-gray-500 mt-2 text-sm">Vui lòng nhập tài khoản để tiếp tục</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1">
            <div className="relative">
              <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${errors.username ? 'text-red-400' : 'text-gray-400'}`}>
                <User size={18} />
              </span>
              <input
                type="text"
                name="username"
                className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 outline-none transition-all sm:text-sm ${errors.username ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                placeholder="Tên đăng nhập"
                value={credentials.username}
                onChange={handleInputChange}
              />
            </div>
            {errors.username && <p className="text-red-500 text-xs ml-1 animate-in fade-in slide-in-from-top-1">{errors.username}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <div className="relative">
              <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${errors.password ? 'text-red-400' : 'text-gray-400'}`}>
                <Lock size={18} />
              </span>
              <input
                type="password"
                name="password"
                className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 outline-none transition-all sm:text-sm ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                placeholder="Mật khẩu"
                value={credentials.password}
                onChange={handleInputChange}
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs ml-1 animate-in fade-in slide-in-from-top-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
          </button>
        </form>
      </div>
      <AppNotification
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
