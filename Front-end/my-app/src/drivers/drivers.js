import { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MdAdd } from "react-icons/md";
import { Search, FileDown, FileUp, ChevronRight, Trash2 } from 'lucide-react';
import { getCookie, removeCookie } from '../utils/cookieHelper';
import { FaRegSquare, FaRegSquareMinus } from "react-icons/fa6";
import { CustomDatatable, Modal, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../controller/driversController';

const API_BASE_URL = 'https://quanlysanxuat-production.up.railway.app/api';

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
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedDriverIds, setSelectedDriverIds] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const getExcelCellText = (cell) => {
    const value = cell?.value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      if (value.text !== undefined) return String(value.text);
      if (value.result !== undefined) return String(value.result);
      if (Array.isArray(value.richText)) return value.richText.map(part => part.text || '').join('');
      if (value.hyperlink && value.text) return String(value.text);
    }
    return String(value);
  };

  const normalizeImportText = (value) => String(value || '').trim().toLowerCase();

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const data = await getDrivers();
      setDrivers(data);
      setSelectedDriverIds([]);
      setIsBulkSelectMode(false);
    } catch (err) {
      setError("Không thể tải danh sách tài xế.");
      console.error("Error fetching drivers:", err);
    } finally {
      setLoading(false);
    }
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
    setCurrentEditing({ driverCode: '', name: '', phone: '', nationalIdNumber: '', email: '' });
    setIsModalOpen(true);
  };

  const handleOpenImportModal = () => {
    setSelectedImportFile(null);
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setSelectedImportFile(null);
    setIsImportModalOpen(false);
  };

  const handleDownloadImportTemplate = () => {
    window.location.href = `${API_BASE_URL}/Templates/import/drivers`;
  };

  const handleImportExcel = async () => {
    if (!selectedImportFile) {
      showNotification("Vui lòng chọn file Excel cần nhập.", "error");
      return;
    }
    setIsImportingExcel(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await selectedImportFile.arrayBuffer();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        showNotification("File Excel không có dữ liệu.", "error");
        return;
      }

      let createdCount = 0;
      let updatedCount = 0;

      // Cấu trúc file Excel: 
      // B (2): Mã tài xế (Khóa chính để dò tìm)
      // C (3): Tên tài xế
      // D (4): Số điện thoại
      // E (5): CCCD
      // F (6): Email
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const driverCode = getExcelCellText(row.getCell(2)).trim();
        if (!driverCode) continue; // Bỏ qua nếu dòng không có mã tài xế

        const name = getExcelCellText(row.getCell(3)).trim();
        const phone = getExcelCellText(row.getCell(4)).trim();
        const nationalIdNumber = getExcelCellText(row.getCell(5)).trim();
        const email = getExcelCellText(row.getCell(6)).trim();

        // Dò tìm tài xế trong danh sách hiện tại dựa trên Mã tài xế (driverCode)
        const existingDriver = drivers.find(d => normalizeImportText(d.driverCode || d.DriverCode) === normalizeImportText(driverCode));

        const payload = {
          driverCode,
          // Nếu ô Excel trống, giữ lại giá trị cũ của tài xế đã tồn tại
          name: name || (existingDriver ? (existingDriver.name || existingDriver.Name) : ""),
          phone: phone || (existingDriver ? (existingDriver.phone || existingDriver.Phone) : ""),
          nationalIdNumber: nationalIdNumber || (existingDriver ? (existingDriver.nationalIdNumber || existingDriver.NationalIdNumber) : ""),
          email: email || (existingDriver ? (existingDriver.email || existingDriver.Email) : "")
        };

        if (existingDriver) {
          // Cập nhật tài xế nếu đã tồn tại mã
          await updateDriver(existingDriver.id || existingDriver.Id, payload);
          updatedCount++;
        } else {
          // Thêm mới nếu mã chưa tồn tại (yêu cầu tối thiểu phải có tên tài xế)
          if (!payload.name) continue;
          await createDriver(payload);
          createdCount++;
        }
      }

      showNotification(`Nhập Excel thành công: thêm mới ${createdCount}, cập nhật ${updatedCount}`, "success");
      fetchDrivers();
      handleCloseImportModal();
    } catch (err) {
      console.error(err);
      showNotification("Lỗi khi nhập file Excel tài xế.", "error");
    } finally {
      setIsImportingExcel(false);
    }
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

  const handleBulkDelete = () => {
    if (!isBulkSelectMode) {
      setIsBulkSelectMode(true);
      setSelectedDriverIds([]);
      return;
    }
    if (selectedDriverIds.length === 0) {
      setIsBulkSelectMode(false);
      setSelectedDriverIds([]);
      return;
    }
    setConfirmModal({
      isOpen: true,
      id: selectedDriverIds,
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều tài xế',
      message: `Bạn có chắc chắn muốn xóa ${selectedDriverIds.length} tài xế đã chọn không? Hành động này không thể hoàn tác.`
    });
  };

  const handleSelectAllDrivers = () => {
    setSelectedDriverIds(filteredData.map(d => d.id));
  };

  const handleClearSelectedDrivers = () => {
    setSelectedDriverIds([]);
  };

  const handleToggleSelectDriver = (id) => {
    setSelectedDriverIds(prev =>
      prev.includes(id) ? prev.filter(driverId => driverId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
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
        fetchDrivers();
        showNotification("Xóa tài xế thành công!");
      } catch (err) {
        console.error("Error deleting driver:", err);
        showNotification("Lỗi khi xóa tài xế.", "error");
      }
    } else if (type === 'bulkDelete') {
      try {
        await Promise.all(id.map(driverId => deleteDriver(driverId)));
        fetchDrivers();
        setSelectedDriverIds([]);
        setIsBulkSelectMode(false);
        showNotification(`Đã xóa ${id.length} tài xế thành công!`, "success");
      } catch (err) {
        showNotification("Có lỗi xảy ra khi xóa nhiều tài xế.", "error");
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
        { header: 'Mã tài xế', key: 'driverCode', width: 15 },
        { header: 'Tên tài xế', key: 'name', width: 30 },
        { header: 'Số điện thoại', key: 'phone', width: 20 },
        { header: 'CCCD', key: 'nationalIdNumber', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
      ];

      filteredData.forEach((driver, index) => {
        worksheet.addRow({
          stt: index + 1,
          driverCode: driver.driverCode || driver.DriverCode || '',
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
          // Căn giữa nội dung cho cột STT (1) và Mã tài xế (2)
          if (colNumber === 1 || colNumber === 2) {
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
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
      className: 'w-[40px] text-center !px-1 sm:hidden',
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
    {
      header: 'STT',
      className: 'hidden sm:table-cell w-[50px] text-center !px-1 sm:!px-4',
      headerCellClassName: 'hidden sm:table-cell',
      render: (row, { index }) => index
    },
    {
      header: 'Mã tài xế',
      accessor: 'driverCode',
      className: 'font-bold text-blue-600 min-w-[100px] !px-1 sm:!px-4',
      headerCellClassName: 'table-cell', // Always show on mobile
    },
    { header: 'Tên tài xế', accessor: 'name', className: 'hidden sm:table-cell font-bold text-blue-600 min-w-[150px] !px-1 sm:!px-4' },
    { header: 'Số điện thoại', accessor: 'phone', className: 'hidden sm:table-cell min-w-[120px]' },
    { header: 'CCCD', accessor: 'nationalIdNumber', className: 'hidden sm:table-cell md:table-cell' },
    { header: 'Email', accessor: 'email', className: 'hidden sm:table-cell lg:table-cell' },
    {
      header: isBulkSelectMode ? (
        <div className="flex w-full items-center justify-center gap-2 text-[10px] sm:text-sm">
          <button type="button" onClick={(e) => { e.stopPropagation(); handleSelectAllDrivers(); }} className="font-semibold text-red-600 hover:text-red-700">Tất cả</button>
          <span className="text-gray-300">/</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleClearSelectedDrivers(); }} className="font-semibold text-gray-500 hover:text-gray-700">Bỏ chọn</button>
        </div>
      ) : 'Hành động',
      className: 'text-center pr-2 sm:pr-4 w-[100px] sm:w-[150px] !px-2 sm:!px-4',
      render: (row) => (
        <div className="flex justify-center items-center gap-2">
          {isBulkSelectMode ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleToggleSelectDriver(row.id); }}
              className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-red-50"
            >
              {selectedDriverIds.includes(row.id) ? (
                <FaRegSquareMinus size={20} className="text-red-600" />
              ) : (
                <FaRegSquare size={20} className="text-gray-400" />
              )}
            </button>
          ) : (
            <div className="flex gap-1.5 justify-end whitespace-nowrap">
              <button onClick={() => handleEditItem(row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95 shadow-sm">Sửa</button>
              <button onClick={() => handleDelete(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95 shadow-sm">Xóa</button>
            </div>
          )}
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
        <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 w-full lg:w-auto">
          <button
            onClick={handleBulkDelete}
            className={`order-3 lg:order-1 w-full lg:w-auto lg:flex-none justify-center text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all flex items-center gap-2 text-sm ${selectedDriverIds.length > 0 ? 'bg-red-700 hover:bg-red-700 shadow-md active:scale-95' : 'bg-red-700 hover:bg-red-700'}`}
          >
            <Trash2 size={18} />
            Xóa nhiều dòng {selectedDriverIds.length > 0 && `(${selectedDriverIds.length})`}
          </button>
          <button
            onClick={handleOpenImportModal}
            className="order-1 lg:order-2 flex-1 lg:flex-none bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm"
          >
            <FileUp size={18} /> Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="order-2 lg:order-3 flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
            <FileDown size={18} />Xuất Excel
          </button>
          <button onClick={handleAddItem} className="flex gap-2 items-center justify-center order-4 w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded whitespace-nowrap transition-all active:scale-95 shadow-md text-sm">
            <MdAdd /> Thêm mới
          </button>
        </div>
      </div>

      {
        loading ? (
          <p className="p-4 text-gray-600">Đang tải dữ liệu tài xế...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <CustomDatatable
              columns={columns}
              data={filteredData}
              bodyCellClassName="!py-2 sm:!py-3"
              renderExpansion={(row) => (
                <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4 sm:gap-x-8 text-sm">
                      <div className="flex flex-col gap-1 sm:hidden">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tên tài xế</span>
                        <span className="text-blue-600 font-bold">{row.name || '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1 sm:hidden">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số điện thoại</span>
                        <span className="text-gray-900 font-medium">{row.phone || '---'}</span>
                      </div>
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
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 ml-1">Tên tài xế <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={currentEditing?.name || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm p-2.5 focus:ring-2 outline-none transition-all text-sm bg-white`} />
              {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 ml-1">Mã tài xế</label>
              <input type="text" name="driverCode" value={currentEditing?.driverCode || currentEditing?.DriverCode || ''} disabled className="mt-1 block w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg shadow-sm p-2.5 cursor-not-allowed outline-none text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 ml-1">Số điện thoại <span className="text-red-500">*</span></label>
              <input type="text" name="phone" value={currentEditing?.phone || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm p-2.5 focus:ring-2 outline-none transition-all text-sm bg-white`} />
              {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 ml-1">Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={currentEditing?.email || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm p-2.5 focus:ring-2 outline-none transition-all text-sm bg-white`} />
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">CCCD <span className="text-red-500">*</span></label>
              <input type="text" name="nationalIdNumber" value={currentEditing?.nationalIdNumber || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.nationalIdNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm p-2.5 focus:ring-2 outline-none transition-all text-sm bg-white`} />
              {errors.nationalIdNumber && <p className="text-red-500 text-xs mt-1 font-medium">{errors.nationalIdNumber}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button type="button" onClick={handleCloseModal} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors text-sm">Hủy bỏ</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm">Lưu thông tin</button>
          </div>
        </form>
      </Modal>

      {/* Modal Nhập Excel */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Nhập excel"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="driver-excel-file"
              className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-blue-600 hover:bg-blue-50"
            >
              <FileUp size={32} className="mb-3 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                {selectedImportFile ? selectedImportFile.name : 'Chọn file Excel để nhập'}
              </span>
              <span className="mt-1 text-xs text-gray-500">Hỗ trợ .xlsx</span>
              <input
                id="driver-excel-file"
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => setSelectedImportFile(e.target.files?.[0] || null)}
              />
            </label>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleDownloadImportTemplate}
                className="text-xs font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800"
              >
                Tải file mẫu
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleCloseImportModal}
              className="rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleImportExcel}
              disabled={isImportingExcel}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImportingExcel ? 'Đang nhập...' : 'Nhập Excel'}
            </button>
          </div>
        </div>
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