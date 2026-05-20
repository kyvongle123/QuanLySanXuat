import { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, FileUp, FileDown, ChevronRight } from 'lucide-react'; // Đã thêm ChevronRight cho expansion
import { CustomDatatable, Modal, AppNotification, CustomConfirm } from '../customComponent/customComponent';
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
  const [errors, setErrors] = useState({});

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
    setErrors({});
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
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Logic xác thực dữ liệu
    const newErrors = {};
    if (!currentVehicle.vehicleCode?.trim()) newErrors.vehicleCode = 'Bắt buộc nhập Mã số xe';
    if (!currentVehicle.licensePlate?.trim()) newErrors.licensePlate = 'Bắt buộc nhập Biển số xe';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

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
    { header: 'STT', className: 'w-[50px] text-center hidden sm:table-cell', render: (_, { index }) => index },
    {
      header: 'Mã số xe', // Đã sửa lại tên cột cho rõ ràng
      accessor: 'vehicleCode',
      className: 'font-bold text-blue-700 min-w-[100px]'
    },
    { header: 'Biển số xe', accessor: 'licensePlate', className: 'min-w-[120px] sm:w-full' },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-4 w-[100px] sm:w-[150px]',
      render: (row) => (
        <div className="flex gap-1.5 justify-end whitespace-nowrap">
          <button onClick={() => handleOpenEditModal(row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95 shadow-sm">Sửa</button>
          <button onClick={() => handleDelete(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95 shadow-sm">Xóa</button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 tracking-tight">Quản lý xe hàng</h2>

      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full lg:max-w-[350px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên xe"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm outline-none transition-all sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
            <FileDown size={18} /> Xuất Excel
          </button>
          <button onClick={handleOpenAddModal} className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded whitespace-nowrap transition-all active:scale-95 shadow-md text-sm">
            + Thêm mới
          </button>
        </div>
      </div>

      {
        loading && (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="italic text-sm">Đang tải dữ liệu xe hàng...</p>
          </div>
        )
      }
      {error && <p className="text-red-600 p-4">Lỗi: {error}</p>}
      {
        !loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <CustomDatatable
              columns={columns}
              data={filteredVehicles}
              bodyCellClassName="!py-2 lg:!py-3"
              renderExpansion={(row) => (
                <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 tracking-wider">Mã số xe</span>
                      <span className="text-gray-900 font-medium">{row.vehicleCode || '---'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 tracking-wider">Biển số xe</span>
                      <span className="text-gray-900 font-medium">{row.licensePlate || '---'}</span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        )
      }

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm xe hàng mới' : 'Chỉnh sửa xe hàng'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-2xl'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={toggleModalMaximize}
      >
        <form onSubmit={handleSubmit} className={`space-y-5 ${isModalMaximized ? '' : 'max-h-[70vh] overflow-y-auto px-1'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${errors.vehicleCode ? 'text-red-500' : 'text-gray-500'} uppercase ml-1`}>Mã số xe</label>
              <input
                name="vehicleCode"
                type="text"
                value={currentVehicle.vehicleCode || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${errors.vehicleCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm focus:ring-2 outline-none transition-all ${isModalMaximized ? 'p-3 text-base' : 'p-2.5 text-sm'} bg-white`}
              />
              {errors.vehicleCode && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.vehicleCode}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${errors.licensePlate ? 'text-red-500' : 'text-gray-500'} uppercase ml-1`}>Biển số xe</label>
              <input
                name="licensePlate"
                type="text"
                value={currentVehicle.licensePlate || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full border ${errors.licensePlate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm focus:ring-2 outline-none transition-all ${isModalMaximized ? 'p-3 text-base' : 'p-2.5 text-sm'} bg-white`}
              />
              {errors.licensePlate && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.licensePlate}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button type="button" onClick={handleCloseModal} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors text-sm">Hủy bỏ</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm">Lưu thông tin</button>
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
    </div >
  );
};
