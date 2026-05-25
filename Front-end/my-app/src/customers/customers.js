import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, FileDown, FileUp, ChevronRight, Trash2 } from 'lucide-react';
import { FaRegSquare, FaRegSquareMinus } from "react-icons/fa6";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, Modal, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../controller/customersController';
import { FaPencil } from "react-icons/fa6";

const API_BASE_URL = 'https://quanlysanxuat-back-end.onrender.com/api';

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
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [errors, setErrors] = useState({});

  // Hàm chuẩn hóa text để so sánh
  const normalizeImportText = (value) => String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

  // Hàm lấy text từ cell Excel
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
      setSelectedCustomerIds([]);
      setIsBulkSelectMode(false);
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

  const handleOpenImportModal = () => {
    setSelectedImportFile(null);
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setSelectedImportFile(null);
    setIsImportModalOpen(false);
  };

  const handleDownloadImportTemplate = () => {
    window.location.href = `${API_BASE_URL}/Templates/import/customers`;
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

      // Cấu trúc file Excel: B: Mã khách hàng, C: Họ tên, D: Email, E: Số điện thoại, F: Địa chỉ
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const customerCode = getExcelCellText(row.getCell(2)).trim(); // Cột B
        if (!customerCode) continue;

        const name = getExcelCellText(row.getCell(3)).trim();         // Cột C
        const email = getExcelCellText(row.getCell(4)).trim();        // Cột D
        const phone = getExcelCellText(row.getCell(5)).trim();        // Cột E
        const address = getExcelCellText(row.getCell(6)).trim();      // Cột F

        const existingCustomer = customers.find(c => normalizeImportText(c.customerCode) === normalizeImportText(customerCode));

        const payload = {
          customerCode,
          name: name || (existingCustomer ? existingCustomer.name : ""),
          email: email || (existingCustomer ? existingCustomer.email : ""),
          phone: phone || (existingCustomer ? existingCustomer.phone : ""),
          address: address || (existingCustomer ? existingCustomer.address : "")
        };

        // Nếu thêm mới thì Họ tên là bắt buộc
        if (!existingCustomer && !payload.name) continue;

        if (existingCustomer) {
          await updateCustomer(existingCustomer.id, { ...existingCustomer, ...payload });
          updatedCount++;
        } else {
          await createCustomer(payload);
          createdCount++;
        }
      }

      showNotification(`Nhập Excel thành công: thêm mới ${createdCount}, cập nhật ${updatedCount}`, "success");
      fetchCustomers();
      handleCloseImportModal();
    } catch (err) {
      console.error(err);
      showNotification("Lỗi khi nhập file Excel khách hàng.", "error");
    } finally {
      setIsImportingExcel(false);
    }
  };

  const handleBulkDelete = () => {
    if (!isBulkSelectMode) {
      setIsBulkSelectMode(true);
      setSelectedCustomerIds([]);
      return;
    }

    if (selectedCustomerIds.length === 0) {
      setIsBulkSelectMode(false);
      setSelectedCustomerIds([]);
      return;
    }

    setConfirmModal({
      isOpen: true,
      id: selectedCustomerIds,
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều khách hàng',
      message: `Bạn có chắc chắn muốn xóa ${selectedCustomerIds.length} khách hàng đã chọn không? Hành động này không thể hoàn tác.`
    });
  };

  const handleSelectAllCustomers = () => {
    const visibleCustomerIds = filteredCustomers.map(c => c.id).filter(Boolean);
    setSelectedCustomerIds(visibleCustomerIds);
  };

  const handleClearSelectedCustomers = () => {
    setSelectedCustomerIds([]);
  };

  const handleToggleSelectCustomer = (row) => {
    const rowId = row.id;
    setSelectedCustomerIds(prev => prev.includes(rowId)
      ? prev.filter(id => id !== rowId)
      : [...prev, rowId]
    );
  };

  // Xử lý xác nhận hành động (xóa nhiều)
  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    if (type === 'export') {
      await handleExportExcel();
    } else if (type === 'bulkDelete') {
      try {
        await Promise.all(id.map(customerId => deleteCustomer(customerId)));
        await fetchCustomers();
        showNotification(`Xóa ${id.length} khách hàng thành công!`);
      } catch (err) {
        console.error("Error deleting multiple customers:", err);
        showNotification("Lỗi khi xóa nhiều khách hàng.", "error");
      }
    } else if (type === 'delete') {
      try {
        await deleteCustomer(id);
        await fetchCustomers();
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
        { header: 'Mã khách hàng', key: 'customerCode', width: 20 },
        { header: 'Họ tên', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Số điện thoại', key: 'phone', width: 15 },
        { header: 'Địa chỉ', key: 'address', width: 40 },
      ];

      filteredCustomers.forEach((customer, index) => {
        worksheet.addRow({
          stt: index + 1,
          customerCode: customer.customerCode || "",
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
          // ExcelJS sẽ tự động điều chỉnh chiều cao dòng nếu wrapText là true và không đặt chiều cao cố định
        }

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          if (colNumber === 1 || colNumber === 2) cell.alignment = { vertical: 'middle', horizontal: 'center' };
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
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCustomer(prev => ({ ...prev, [name]: value }));
    // Xóa thông báo lỗi khi người dùng bắt đầu nhập liệu
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Xử lý Submit Form (Thêm hoặc Cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Thực hiện kiểm tra validation các trường bắt buộc
    const newErrors = {};
    if (!currentCustomer.name?.trim()) newErrors.name = 'Bắt buộc nhập Tên khách hàng';
    if (!currentCustomer.email?.trim()) newErrors.email = 'Bắt buộc nhập Email';
    if (!currentCustomer.phone?.trim()) newErrors.phone = 'Bắt buộc nhập Số điện thoại';
    if (!currentCustomer.address?.trim()) newErrors.address = 'Bắt buộc nhập Địa chỉ';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
    { header: 'Họ tên', accessor: 'name', className: 'font-bold text-blue-600 min-w-[140px] !px-1 sm:!px-4' },
    { header: 'Email', accessor: 'email', className: 'hidden md:table-cell' },
    { header: 'Số điện thoại', accessor: 'phone', className: 'hidden sm:table-cell w-32 sm:w-40' },
    { header: 'Địa chỉ', accessor: 'address', className: 'hidden lg:table-cell' },
    {
      header: isBulkSelectMode ? (
        <div className="flex w-full items-center justify-center gap-1 text-[10px] sm:text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAllCustomers();
            }}
            className="font-semibold text-red-600 hover:text-red-700"
          >
            Tất cả
          </button>
          <span className="text-gray-300">/</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClearSelectedCustomers();
            }}
            className="font-semibold text-gray-500 hover:text-gray-700"
          >
            Bỏ chọn
          </button>
        </div>
      ) : 'Hành động',
      className: 'text-center pr-2 sm:pr-5 w-[120px] sm:w-[160px]',
      render: (row) => (
        <div className="flex justify-center items-center gap-2">
          {isBulkSelectMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSelectCustomer(row);
              }}
              className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-red-50"
            >
              {selectedCustomerIds.includes(row.id) ? (
                <FaRegSquareMinus size={20} className="text-red-600" />
              ) : (
                <FaRegSquare size={20} className="text-gray-400" />
              )}
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-50/50 min-h-screen">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 tracking-tight">Danh sách khách hàng</h2>

      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full lg:max-w-[350px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm outline-none transition-all sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 w-full lg:w-auto lg:flex lg:flex-wrap">
          <button
            onClick={handleOpenImportModal}
            className="order-1 lg:order-2 w-full lg:w-auto justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded whitespace-nowrap transition-all active:scale-95 flex items-center gap-2 shadow-sm text-xs sm:text-sm"
          >
            <FileUp size={16} />
            <span>Nhập Excel</span>
          </button>
          <button
            onClick={handleRequestExportExcel}
            className="order-2 lg:order-3 w-full lg:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded whitespace-nowrap transition-all active:scale-95 flex items-center gap-2 shadow-sm text-xs sm:text-sm"
          >
            <FileDown size={16} />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={handleBulkDelete}
            className={`order-3 lg:order-1 w-full lg:w-auto justify-center text-white font-bold py-2 px-3 rounded whitespace-nowrap transition-all flex items-center gap-2 text-xs sm:text-sm ${selectedCustomerIds.length > 0 ? 'bg-red-700 hover:bg-red-700 shadow-md active:scale-95' : 'bg-red-700 hover:bg-red-700'}`}
          >
            <Trash2 size={16} />
            <span className="truncate">Xóa nhiều dòng {selectedCustomerIds.length > 0 && `(${selectedCustomerIds.length})`}</span>
          </button>
          <button
            onClick={() => handleOpenModal('add')}
            className="order-4 w-full lg:w-auto justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all active:scale-95 shadow-md text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="italic text-sm">Đang tải dữ liệu khách hàng...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <CustomDatatable
            columns={columns}
            data={filteredCustomers}
            bodyCellClassName="!py-2 sm:!py-3"
            renderExpansion={(row) => (
              <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4 sm:gap-x-8 text-sm">
                  <div className="flex flex-col gap-1 md:hidden">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
                    <span className="text-gray-900 font-medium break-all">{row.email || '---'}</span>
                  </div>
                  <div className="flex flex-col gap-1 sm:hidden">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số điện thoại</span>
                    <span className="text-gray-900 font-medium">{row.phone || '---'}</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 sm:col-span-1 lg:hidden">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Địa chỉ</span>
                    <span className="text-gray-900 font-medium">{row.address || '---'}</span>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* Modal Nhập Excel */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Nhập dữ liệu khách hàng từ Excel"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="customer-excel-file"
              className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-blue-600 hover:bg-blue-50"
            >
              <FileUp size={32} className="mb-3 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                {selectedImportFile ? selectedImportFile.name : 'Chọn file Excel (.xlsx)'}
              </span>
              <input
                id="customer-excel-file"
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
                className="text-xs font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors"
              >
                Tải file mẫu
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button type="button" onClick={handleCloseImportModal} className="rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600">Hủy</button>
            <button type="button" onClick={handleImportExcel} disabled={isImportingExcel || !selectedImportFile} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
              {isImportingExcel ? 'Đang xử lý...' : 'Nhập dữ liệu'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm khách hàng mới' : 'Chỉnh sửa khách hàng'}
      >
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 ml-1">Tên khách hàng</label>
              <input
                name="name"
                value={currentCustomer.name}
                onChange={handleInputChange}
                className={`w-full border p-2.5 rounded-lg outline-none focus:ring-2 shadow-sm transition-all ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              {errors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.name}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 ml-1">Email</label>
              <input
                type="email"
                name="email"
                value={currentCustomer.email}
                onChange={handleInputChange}
                className={`w-full border p-2.5 rounded-lg outline-none focus:ring-2 shadow-sm transition-all ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              {errors.email && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.email}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 ml-1">Số điện thoại</label>
              <input
                name="phone"
                value={currentCustomer.phone}
                onChange={handleInputChange}
                className={`w-full border p-2.5 rounded-lg outline-none focus:ring-2 shadow-sm transition-all ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.phone}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 ml-1">Địa chỉ</label>
              <input
                name="address"
                value={currentCustomer.address}
                onChange={handleInputChange}
                className={`w-full border p-2.5 rounded-lg outline-none focus:ring-2 shadow-sm transition-all ${errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              />
              {errors.address && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.address}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={handleCloseModal}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm"
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
