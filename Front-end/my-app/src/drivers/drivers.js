import { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, FileDown, FileUp, Plus, Maximize, Minimize, ChevronRight } from 'lucide-react';
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
  const [errors, setErrors] = useState({});

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditing(null);
    setIsModalMaximized(false);
    setErrors({});
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditing(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
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

    // Logic xác thực dữ liệu
    const newErrors = {};
    if (!currentEditing?.name?.trim()) newErrors.name = 'Bắt buộc nhập Tên tài xế';
    if (!currentEditing?.phone?.trim()) newErrors.phone = 'Bắt buộc nhập Số điện thoại';
    if (!currentEditing?.nationalIdNumber?.trim()) newErrors.nationalIdNumber = 'Bắt buộc nhập CCCD';
    if (!currentEditing?.email?.trim()) newErrors.email = 'Bắt buộc nhập Email';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

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
    {
      header: '',
      className: 'w-[40px] text-center !px-1',
      render: (row, { isExpanded, toggleExpand }) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
          className="p-1 hover:bg-blue-100 rounded-full transition-all duration-300 focus:outline-none flex items-center justify-center"
        >
          <ChevronRight
            size={18}
            className={`transition-transform duration-300 ${isExpanded ? 'rotate-90 text-blue-600' : 'text-gray-400'}`}
          />
        </button>
      ),
    },
    { header: 'STT', className: 'w-[50px] text-center !px-1 sm:!px-4', render: (row, { index }) => index },
    { header: 'Tên tài xế', accessor: 'name', className: 'font-bold text-blue-600 min-w-[150px] !px-1 sm:!px-4' },
    { header: 'Số điện thoại', accessor: 'phone', className: 'min-w-[120px]' },
    { header: 'CCCD', accessor: 'nationalIdNumber', className: 'hidden md:table-cell' },
    { header: 'Email', accessor: 'email', className: 'hidden lg:table-cell' },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-4 w-[100px] sm:w-[150px] !px-2 sm:!px-4',
      render: (row) => (
        <div className="flex gap-1.5 justify-end whitespace-nowrap">
          <button onClick={() => handleEditItem(row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95 shadow-sm">Sửa</button>
          <button onClick={() => handleDelete(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95 shadow-sm">Xóa</button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 tracking-tight">Quản lý Tài xế</h2>
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full lg:max-w-[350px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, CCCD..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm outline-none transition-all sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
            <FileUp size={18} /> Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
            <FileDown size={18} />Xuất Excel
          </button>
          <button onClick={handleAddItem} className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg whitespace-nowrap transition-all active:scale-95 shadow-md text-sm">
            + Thêm mới
          </button>
        </div>
      </div>

      {
        loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="italic text-sm">Đang tải dữ liệu tài xế...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <CustomDatatable
              columns={columns}
              data={filteredData}
              renderExpansion={(row) => (
                <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div className="flex flex-col gap-1 md:hidden">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CCCD</span>
                      <span className="text-gray-900 font-medium">{row.nationalIdNumber || '---'}</span>
                    </div>
                    <div className="flex flex-col gap-1 lg:hidden">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
                      <span className="text-gray-900 font-medium break-all">{row.email || '---'}</span>
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
        title={modalMode === 'add' ? 'Thêm tài xế mới' : 'Cập nhật thông tin tài xế'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-xl'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className={`space-y-5 ${isModalMaximized ? '' : 'max-h-[70vh] overflow-y-auto px-1'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${errors.name ? 'text-red-500' : 'text-gray-500'} uppercase ml-1`}>Tên tài xế</label>
              <input type="text" name="name" value={currentEditing?.name || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm p-2.5 focus:ring-2 outline-none transition-all text-sm bg-white`} />
              {errors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.name}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${errors.phone ? 'text-red-500' : 'text-gray-500'} uppercase ml-1`}>Số điện thoại</label>
              <input type="text" name="phone" value={currentEditing?.phone || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm p-2.5 focus:ring-2 outline-none transition-all text-sm bg-white`} />
              {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.phone}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${errors.nationalIdNumber ? 'text-red-500' : 'text-gray-500'} uppercase ml-1`}>CCCD</label>
              <input type="text" name="nationalIdNumber" value={currentEditing?.nationalIdNumber || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.nationalIdNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm p-2.5 focus:ring-2 outline-none transition-all text-sm bg-white`} />
              {errors.nationalIdNumber && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.nationalIdNumber}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${errors.email ? 'text-red-500' : 'text-gray-500'} uppercase ml-1`}>Email</label>
              <input type="email" name="email" value={currentEditing?.email || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm p-2.5 focus:ring-2 outline-none transition-all text-sm bg-white`} />
              {errors.email && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.email}</p>}
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

      <AppNotification
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />
    </div >
  );
};