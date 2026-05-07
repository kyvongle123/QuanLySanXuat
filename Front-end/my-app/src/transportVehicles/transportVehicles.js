import { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, FileUp, FileDown, Plus } from 'lucide-react'; // Đã thêm FileDown cho nút xuất Excel
import { CustomDatatable, Modal, CustomSelect, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { getTransportVehicles, createTransportVehicle, updateTransportVehicle, deleteTransportVehicle } from '../controller/transportVehiclesController';

export const TransportVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentVehicle, setCurrentVehicle] = useState({ vehicleCode: '', licensePlate: '' });
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const closeNotification = () => setNotification(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vehicleData, brandsData] = await Promise.all([
          getTransportVehicles(),
        ]);
        setVehicles(vehicleData);
      } catch (err) {
        setError("Không thể tải dữ liệu phương tiện.");
        console.error("Error fetching vehicles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => 
      v.vehicleCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setCurrentVehicle({ vehicleCode: '', licensePlate: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle) => {
    setModalMode('edit');
    setCurrentVehicle(vehicle);
    setIsModalOpen(true);
  };

  const toggleModalMaximize = () => {
    setIsModalMaximized(prev => !prev);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
  };

  const handleDelete = async (id) => {
    setConfirmModal({ 
      isOpen: true, 
      id, 
      type: 'delete',
      title: 'Xác nhận xóa xe hàng',
      message: `Bạn có chắc chắn muốn xóa xe có ID: ${id} không?` 
    });
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    if (type === 'delete') {
      try {
        await deleteTransportVehicle(id);
        setVehicles(prev => prev.filter(v => v.id !== id));
        showNotification("Xóa xe hàng thành công!");
      } catch (err) {
        console.error("Error deleting vehicle:", err);
        showNotification("Lỗi khi xóa xe hàng.", "error");
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
      message: 'Bạn có chắc chắn muốn xuất danh sách xe hàng ra tệp Excel không?'
    });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách xe hàng');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Mã số xe', key: 'vehicleCode', width: 20 },
        { header: 'Biển số xe', key: 'licensePlate', width: 20 }
      ];

      filteredVehicles.forEach((vehicle, index) => {
        worksheet.addRow({
          stt: index + 1,
          vehicleCode: vehicle.vehicleCode,
          licensePlate: vehicle.licensePlate
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          if (rowNumber > 1 && colNumber === 1) { // Căn giữa cột STT ở body
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        });
        if (rowNumber === 1) { // Header formatting
          row.height = 30;
          row.font = { name: 'Times New Roman', size: 12, bold: true };
          row.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách xe hàng.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentVehicle(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...currentVehicle
    };

    try {
      if (modalMode === 'add') {
        const newData = await createTransportVehicle(payload);
        setVehicles(prev => [...prev, newData]);
        showNotification("Thêm xe hàng thành công!");
      } else {
        const updated = await updateTransportVehicle(currentVehicle.id, payload);
        setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
        showNotification("Cập nhật xe hàng thành công!");
      }
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi lưu thông tin xe hàng.", "error");
    }
  };

  const columns = [
    { header: 'STT', render: (row, { index }) => index },
    { 
      header: 'Mã số xe', // Đã sửa lại tên cột cho rõ ràng
      accessor: 'vehicleCode',
      className: 'min-w-[120px]'
    },
    { header: 'Biển số xe', accessor: 'licensePlate', className: 'w-full' },
    {
      header: 'Hành động',
      className: 'text-right',
      render: (row) => (
        <div className="flex gap-2 justify-end whitespace-nowrap">
          <button onClick={() => handleOpenEditModal(row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors focus:outline-none">Sửa</button>
          <button onClick={() => handleDelete(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors focus:outline-none">Xóa</button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Quản lý xe hàng</h2>

      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên xe"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2">
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button onClick={handleOpenAddModal} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Thêm xe mới
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-600 p-4">Đang tải dữ liệu...</p>}
      {error && <p className="text-red-600 p-4">Lỗi: {error}</p>}
      {!loading && !error && <CustomDatatable columns={columns} data={filteredVehicles} />}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm xe hàng mới' : 'Chỉnh sửa xe hàng'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-md'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={toggleModalMaximize}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Mã số xe</label>
              <input 
                name="vehicleCode" 
                type="text" 
                value={currentVehicle.vehicleCode || ''} 
                onChange={handleInputChange} 
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} 
              />
            </div>
            <div>
              <label className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Biển số xe</label>
              <input 
                name="licensePlate" 
                type="text" 
                value={currentVehicle.licensePlate || ''} 
                onChange={handleInputChange} 
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseModal} className={`bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors ${isModalMaximized ? 'py-2 px-6 text-base' : 'py-1.5 px-4 text-sm'}`}>Hủy</button>
            <button type="submit" className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${isModalMaximized ? 'py-2 px-6 text-base' : 'py-1.5 px-4 text-sm'}`}>Lưu</button>
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

      <AppNotification isOpen={notification.isOpen} message={notification.message} type={notification.type} onClose={closeNotification} />
    </div>
  );
};
