import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus, FileDown, FileUp } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
    if (confirmModal.type === 'export') {
      await handleExportExcel();
    } else if (confirmModal.type === 'bulk-delete') {
      try {
        await deleteCustomer(confirmModal.id); // confirmModal.id sẽ là một mảng các ID
        setCustomers(prevCustomers => prevCustomers.filter(c => !confirmModal.id.includes(c.id)));
        setSelectedCustomerIds([]); // Xóa các lựa chọn sau khi xóa
        showNotification(`Xóa ${confirmModal.id.length} khách hàng thành công!`);
      } catch (err) {
        console.error("Error deleting multiple customers:", err);
        showNotification("Lỗi khi xóa nhiều khách hàng.", "error");
      }
    } else if (confirmModal.type === 'delete') {
      try {
        await deleteCustomer(confirmModal.id);
        setCustomers(prev => prev.filter(c => c.id !== confirmModal.id));
        showNotification("Xóa khách hàng thành công!");
      } catch (err) {
        console.error("Error deleting customer:", err);
        showNotification("Lỗi khi xóa khách hàng.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách khách hàng ra tệp Excel không?'
    });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách khách hàng');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Họ tên', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Số điện thoại', key: 'phone', width: 15 },
        { header: 'Địa chỉ', key: 'address', width: 40 },
      ];

      filteredCustomers.forEach((customer, index) => {
        worksheet.addRow({
          stt: index + 1,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        if (rowNumber === 1) {
          row.height = 30;
          row.font = { name: 'Times New Roman', size: 12, bold: true };
          row.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          row.height = 25;
        }

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          if (colNumber === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách khách hàng.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
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
    { header: 'STT', className: 'w-[60px] text-center', render: (row, { index }) => index },
    { header: 'Họ tên', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Số điện thoại', accessor: 'phone' },
    { header: 'Địa chỉ', accessor: 'address' },
    {
      header: 'Hành động',
      className: 'text-right pr-5 w-[160px]',
      render: (row) => ( // Bỏ nút xóa cá nhân
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={() => handleOpenModal('edit', row)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >
            Sửa
          </button>
          <button
            onClick={() => setConfirmModal({
              isOpen: true,
              id: row.id,
              type: 'delete',
              title: 'Xác nhận xóa',
              message: `Bạn có chắc chắn muốn xóa khách hàng "${row.name}"?`
            })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >
            Xóa
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
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button
            onClick={handleRequestExportExcel}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors"
          >
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button
            onClick={() => handleOpenModal('add')}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors"
          >
            Thêm khách hàng mới
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
