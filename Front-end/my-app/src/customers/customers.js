import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { CustomDatatable, Modal, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../controller/customersController';
import { FaPencil } from "react-icons/fa6";

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' hoặc 'edit'
  const [currentCustomer, setCurrentCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  // Hiển thị thông báo
  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const closeNotification = () => setNotification(prev => ({ ...prev, isOpen: false }));

  // Lấy dữ liệu từ Backend
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      setError("Không thể tải danh sách khách hàng.");
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Logic tìm kiếm
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) 
    );
  }, [customers, searchTerm]);

  // Xử lý chọn/bỏ chọn khách hàng
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCustomerIds(customers.map(customer => customer.id));
    } else {
      setSelectedCustomerIds([]);
    }
  };

  const handleSelectCustomer = (id) => {
    setSelectedCustomerIds(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(customerId => customerId !== id)
        : [...prevSelected, id]
    );
  };

  // Xử lý xác nhận hành động (xóa nhiều)
  const handleConfirmAction = async () => {
    if (confirmModal.type === 'bulk-delete') {
      try {
        await deleteCustomer(confirmModal.id); // confirmModal.id sẽ là một mảng các ID
        setCustomers(prevCustomers => prevCustomers.filter(c => !confirmModal.id.includes(c.id)));
        setSelectedCustomerIds([]); // Xóa các lựa chọn sau khi xóa
        showNotification(`Xóa ${confirmModal.id.length} khách hàng thành công!`);
      } catch (err) {
        console.error("Error deleting multiple customers:", err);
        showNotification("Lỗi khi xóa nhiều khách hàng.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };
  // Mở modal Thêm/Sửa
  const handleOpenModal = (mode, customer = null) => {
    setModalMode(mode);
    if (mode === 'edit' && customer) {
      setCurrentCustomer(customer);
    } else {
      setCurrentCustomer({ name: '', email: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCustomer({ name: '', email: '', phone: '', address: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCustomer(prev => ({ ...prev, [name]: value }));
  };

  // Xử lý Submit Form (Thêm hoặc Cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const newUser = await createCustomer(currentCustomer);
        setCustomers(prev => [...prev, newUser]);
        showNotification("Thêm khách hàng mới thành công!");
      } else {
        const updated = await updateCustomer(currentCustomer.id, currentCustomer);
        setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
        showNotification("Cập nhật thông tin thành công!");
      }
      handleCloseModal();
    } catch (err) {
      console.error("Error saving customer:", err);
      showNotification(`Lỗi khi ${modalMode === 'add' ? 'thêm' : 'cập nhật'} khách hàng.`, "error");
    }
  };

  // Cấu hình các cột cho bảng dữ liệu
  const columns = [ 
    {
      header: selectedCustomerIds.length > 0 ? (
        <button 
          onClick={() => setSelectedCustomerIds([])}
          className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors underline decoration-dotted underline-offset-2"
        >
          Bỏ chọn
        </button>
      ) : '',
      className: 'w-[40px]',
      render: (row) => (
        <div className="flex items-center">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
            checked={selectedCustomerIds.includes(row.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCustomerIds(prev => [...prev, row.id]);
              } else {
                setSelectedCustomerIds(prev => prev.filter(id => id !== row.id));
              }
            }}
          />
        </div>
      ),
    },
    { header: 'STT', render: (row, { index }) => index },
    { header: 'Họ tên', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Số điện thoại', accessor: 'phone' },
    { header: 'Địa chỉ', accessor: 'address' },
    {
      header: 'Hành động',
      className: 'text-right pr-[20px]',
      render: (row) => ( // Bỏ nút xóa cá nhân
        <div className="flex justify-end items-center">
          <button
            onClick={() => handleOpenModal('edit', row)}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
            title="Chỉnh sửa"
          >
            <FaPencil size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Danh sách khách hàng</h2>
      
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">          
          <button
            onClick={() => handleOpenModal('add')}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors"
          >
           Thêm khách hàng mới
          </button>
          <button
            onClick={() => setConfirmModal({
              isOpen: true,
              id: selectedCustomerIds, // Truyền mảng ID để xóa nhiều
              type: 'bulk-delete',
              title: 'Xác nhận xóa khách hàng',
              message: `Bạn có chắc chắn muốn xóa ${selectedCustomerIds.length} khách hàng đã chọn không?`
            })}
            disabled={selectedCustomerIds.length === 0}
            className={`bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all ${selectedCustomerIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'shadow-md active:scale-95'}`}
          >
            Xóa
          </button> 
        </div>
      </div>

      {loading ? <p className="p-4 italic text-gray-500">Đang tải dữ liệu...</p> : <CustomDatatable columns={columns} data={filteredCustomers} />}

      {/* Modal Thêm/Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm khách hàng mới' : 'Chỉnh sửa khách hàng'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Tên khách hàng</label>
              <input 
                name="name" 
                value={currentCustomer.name} 
                onChange={handleInputChange} 
                className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <input 
                type="email" 
                name="email" 
                value={currentCustomer.email} 
                onChange={handleInputChange} 
                className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Số điện thoại</label>
              <input 
                name="phone" 
                value={currentCustomer.phone} 
                onChange={handleInputChange} 
                className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Địa chỉ</label>
              <input 
                name="address" 
                value={currentCustomer.address} 
                onChange={handleInputChange} 
                className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={handleCloseModal} 
              className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors font-semibold"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>

      <AppNotification 
        isOpen={notification.isOpen} 
        message={notification.message} 
        type={notification.type} 
        onClose={closeNotification} 
      />

      <CustomConfirm 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ isOpen: false, id: null })} 
        onConfirm={handleConfirmAction} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        type={confirmModal.type} 
      />
    </div>
  );
};
