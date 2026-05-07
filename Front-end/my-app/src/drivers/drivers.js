import { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, FileDown, FileUp, Plus, Maximize, Minimize } from 'lucide-react';
import { CustomDatatable, Modal, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../controller/driversController';

export const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditing, setCurrentEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditing(null);
    setIsModalMaximized(false);
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditing(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditing({ name: '', phone: '', nationalIdNumber: '', email: '' });
    setIsModalOpen(true);
  };

  const handleEditItem = (item) => {
    setModalMode('edit');
    setCurrentEditing(item);
    setIsModalOpen(true);
  };

  const filteredData = useMemo(() => {
    return drivers.filter(driver => 
      driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.nationalIdNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [drivers, searchTerm]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true);
        const data = await getDrivers();
        setDrivers(data);
      } catch (err) {
        setError("Không thể tải danh sách tài xế.");
        console.error("Error fetching drivers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  const handleDelete = (id) => {
    setConfirmModal({ 
      isOpen: true, 
      id, 
      type: 'delete',
      title: 'Xác nhận xóa tài xế',
      message: 'Bạn có chắc chắn muốn xóa tài xế này không?' 
    });
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    if (type === 'delete') {
      try {
        await deleteDriver(id);
        setDrivers(prev => prev.filter(d => d.id !== id));
        showNotification("Xóa tài xế thành công!");
      } catch (err) {
        console.error("Error deleting driver:", err);
        showNotification("Lỗi khi xóa tài xế.", "error");
      }
    } else if (type === 'export') {
      await handleExportExcel();
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách tài xế ra tệp Excel không?'
    });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách tài xế');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Tên tài xế', key: 'name', width: 30 },
        { header: 'Số điện thoại', key: 'phone', width: 20 },
        { header: 'CCCD', key: 'nationalIdNumber', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
      ];

      filteredData.forEach((driver, index) => {
        worksheet.addRow({
          stt: index + 1,
          name: driver.name,
          phone: driver.phone,
          nationalIdNumber: driver.nationalIdNumber,
          email: driver.email,
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          // Căn giữa nội dung cho cột STT (cột số 1) ở phần Body
          if (rowNumber > 1 && colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        });

        if (rowNumber === 1) {
          row.height = 30;
          row.font = { name: 'Times New Roman', size: 12, bold: true };
          row.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách tài xế.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const newItem = await createDriver(currentEditing);
        setDrivers(prev => [...prev, newItem]);
        showNotification("Thêm tài xế thành công!");
      } else {
        const updated = await updateDriver(currentEditing.id, currentEditing);
        setDrivers(prev => prev.map(d => d.id === updated.id ? updated : d));
        showNotification("Cập nhật tài xế thành công!");
      }
      handleCloseModal();
    } catch (err) {
      console.error("Error saving driver:", err);
      showNotification("Đã xảy ra lỗi khi lưu tài xế.", "error");
    }
  };

  const columns = [
    { header: 'STT', render: (row, { index }) => index },
    { header: 'Tên tài xế', accessor: 'name', className: 'font-medium' },
    { header: 'Số điện thoại', accessor: 'phone' },
    { header: 'CCCD', accessor: 'nationalIdNumber' },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Hành động',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => handleEditItem(row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors">Sửa</button>
          <button onClick={() => handleDelete(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors">Xóa</button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Quản lý Tài xế</h2>
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, CCCD..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none sm:text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors">
            <FileUp size={18} /> Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors">
            <FileDown size={18} /> Xuất Excel
          </button>
          <button onClick={handleAddItem} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors">
            Thêm mới tài xế
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-600 p-4">Đang tải...</p>}
      {!loading && !error && <CustomDatatable columns={columns} data={filteredData} />}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm tài xế mới' : 'Cập nhật thông tin tài xế'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-xl'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên tài xế</label>
              <input type="text" name="name" value={currentEditing?.name || ''} onChange={handleModalInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input type="text" name="phone" value={currentEditing?.phone || ''} onChange={handleModalInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">CCCD</label>
              <input type="text" name="nationalIdNumber" value={currentEditing?.nationalIdNumber || ''} onChange={handleModalInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" value={currentEditing?.email || ''} onChange={handleModalInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors">Lưu</button>
          </div>
        </form>
      </Modal>

      <CustomConfirm 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' })}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      <AppNotification 
        isOpen={notification.isOpen} 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
};