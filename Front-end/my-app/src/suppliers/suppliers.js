import React, { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, FileUp, FileDown, ChevronRight, Trash2 } from 'lucide-react';
import { FaRegSquare, FaRegSquareMinus } from "react-icons/fa6";
import { CustomDatatable, Modal, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { getSuppliers, deleteSupplier, createSupplier, updateSupplier } from '../controller/suppliersController';
import { MdAdd } from "react-icons/md";

export const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentEditingSupplier, setCurrentEditingSupplier] = useState(null);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState([]);
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [supplierErrors, setSupplierErrors] = useState({});

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const closeNotification = () => setNotification(prev => ({ ...prev, isOpen: false }));

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers();
      setSuppliers(data);
      setSelectedSupplierIds([]);
      setIsBulkSelectMode(false);
      // Reset import states on data fetch
      setSelectedImportFile(null);
      setIsImportingExcel(false);
    } catch (err) {
      setError("Không thể tải dữ liệu nhà cung cấp.");
      console.error("Lỗi khi tải nhà cung cấp:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      return (
        supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [suppliers, searchTerm]);

  // Hàm chuẩn hóa text để so sánh (giống stages.js)
  const normalizeImportText = (value) => String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

  // Hàm lấy text từ cell Excel (xử lý richText, hyperlink...)
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

  const handleOpenImportModal = () => {
    setSelectedImportFile(null);
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setSelectedImportFile(null);
    setIsImportModalOpen(false);
  };

  const handleDownloadImportTemplate = () => {
    // Tải file mẫu từ thư mục Templates\ImportTemplate ở Back-end
    window.location.href = `https://quanlysanxuat-production.up.railway.app/api/Templates/import/suppliers`;
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

      for (let i = 2; i <= worksheet.rowCount; i++) { // Bắt đầu từ dòng 2 (bỏ qua header)
        const row = worksheet.getRow(i); // Lấy hàng hiện tại
        const supplierCode = getExcelCellText(row.getCell(2)).trim(); // Cột B
        const name = getExcelCellText(row.getCell(3)).trim(); // Cột C
        const contactPerson = getExcelCellText(row.getCell(4)).trim(); // Cột D
        const phone = getExcelCellText(row.getCell(5)).trim(); // Cột E
        const email = getExcelCellText(row.getCell(6)).trim(); // Cột F
        const address = getExcelCellText(row.getCell(7)).trim(); // Cột G
        const taxCode = getExcelCellText(row.getCell(8)).trim(); // Cột H
        const website = getExcelCellText(row.getCell(9)).trim(); // Cột I
        const notes = getExcelCellText(row.getCell(10)).trim(); // Cột J

        if (!supplierCode || !name) {
          showNotification(`Bỏ qua dòng ${i} do thiếu Mã nhà cung cấp hoặc Tên nhà cung cấp.`, "warning");
          continue;
        }

        const existingSupplier = suppliers.find(s => normalizeImportText(s.supplierCode) === normalizeImportText(supplierCode));

        const payload = {
          supplierCode,
          name,
          contactPerson,
          phone,
          email,
          address,
          taxCode,
          website,
          notes,
        };

        if (existingSupplier) {
          await updateSupplier(existingSupplier.id, { ...existingSupplier, ...payload }); // Cập nhật các trường
          updatedCount++;
        } else {
          await createSupplier(payload);
          createdCount++;
        }
      }

      showNotification(`Nhập Excel thành công: thêm mới ${createdCount}, cập nhật ${updatedCount}`, "success");
      fetchData();
      handleCloseImportModal();
    } catch (err) {
      console.error(err);
      showNotification("Lỗi khi nhập file Excel nhà cung cấp.", "error");
    } finally {
      setIsImportingExcel(false);
    }
  };

  const handleBulkDelete = () => {
    if (!isBulkSelectMode) {
      setIsBulkSelectMode(true);
      setSelectedSupplierIds([]);
      return;
    }

    if (selectedSupplierIds.length === 0) {
      setIsBulkSelectMode(false);
      setSelectedSupplierIds([]);
      return;
    }

    setConfirmModal({
      isOpen: true,
      id: selectedSupplierIds,
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều nhà cung cấp',
      message: `Bạn có chắc chắn muốn xóa ${selectedSupplierIds.length} nhà cung cấp đã chọn không? Hành động này không thể hoàn tác.`
    });
  };

  const handleSelectAllSuppliers = () => {
    const visibleSupplierIds = filteredSuppliers.map(s => s.id).filter(Boolean);
    setSelectedSupplierIds(visibleSupplierIds);
  };

  const handleClearSelectedSuppliers = () => {
    setSelectedSupplierIds([]);
  };

  const handleToggleSelectSupplier = (row) => {
    const rowId = row.id;
    setSelectedSupplierIds(prev => prev.includes(rowId)
      ? prev.filter(id => id !== rowId)
      : [...prev, rowId]
    );
  };

  const handleDeleteSupplier = (supplierId) => {
    setConfirmModal({
      isOpen: true,
      id: supplierId,
      type: 'delete',
      title: 'Xác nhận xóa nhà cung cấp',
      message: 'Nhà cung cấp sẽ bị xóa vĩnh viễn. Bạn có chắc chắn?'
    });
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    try {
      if (type === 'delete') {
        await deleteSupplier(id);
        await fetchData();
        showNotification("Xóa nhà cung cấp thành công", "success");
        setSelectedSupplierIds(prev => prev.filter(supplierId => supplierId !== id));
      } else if (type === 'bulkDelete') {
        await Promise.all(id.map(supplierId => deleteSupplier(supplierId)));
        await fetchData();
        showNotification(`Đã xóa ${id.length} nhà cung cấp thành công`, "success");
        setSelectedSupplierIds([]);
        setIsBulkSelectMode(false);
      } else if (type === 'export') {
        await handleExportExcel();
      }
    } catch (err) {
      showNotification("Có lỗi xảy ra thao tác.", "error");
      console.error("Lỗi:", err);
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleEditSupplier = (supplier) => {
    setModalMode('edit');
    setCurrentEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleAddSupplier = () => {
    setModalMode('add');
    setCurrentEditingSupplier({
      supplierCode: '',
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxCode: '',
      website: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingSupplier(null);
    setIsModalMaximized(false);
    setSupplierErrors({});
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingSupplier(prev => ({ ...prev, [name]: value }));
    if (supplierErrors[name]) {
      setSupplierErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!currentEditingSupplier?.name?.trim()) errors.name = "Bắt buộc nhập Tên nhà cung cấp";
    if (!currentEditingSupplier?.contactPerson?.trim()) errors.contactPerson = "Bắt buộc nhập Người liên hệ";
    if (!currentEditingSupplier?.phone?.trim()) errors.phone = "Bắt buộc nhập Điện thoại";
    if (!currentEditingSupplier?.email?.trim()) errors.email = "Bắt buộc nhập Email";
    if (!currentEditingSupplier?.address?.trim()) errors.address = "Bắt buộc nhập Địa chỉ";
    if (!currentEditingSupplier?.taxCode?.trim()) errors.taxCode = "Bắt buộc nhập Mã số thuế";
    if (!currentEditingSupplier?.website?.trim()) errors.website = "Bắt buộc nhập Website";

    if (Object.keys(errors).length > 0) {
      setSupplierErrors(errors);
      return;
    }
    setSupplierErrors({});

    try {
      if (modalMode === 'add') {
        const newSupplier = await createSupplier(currentEditingSupplier);
        if (!newSupplier)
          throw new Error("Có lỗi xảy ra khi tạo nhà cung cấp");
        await fetchData();
        showNotification("Thêm nhà cung cấp thành công!");
      } else {
        const updated = await updateSupplier(currentEditingSupplier.id, currentEditingSupplier);
        if (!updated)
          throw new Error("Có lỗi xảy ra khi cập nhật nhà cung cấp");
        await fetchData();
        showNotification("Cập nhật nhà cung cấp thành công!");
      }
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu.", "error");
      console.error("Lỗi khi lưu nhà cung cấp:", err);
    }
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách nhà cung cấp');
      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Mã nhà cung cấp', key: 'supplierCode', width: 20 },
        { header: 'Tên nhà cung cấp', key: 'name', width: 40 }, // 40 đơn vị ~ 280px
        { header: 'Người liên hệ', key: 'contactPerson', width: 25 },
        { header: 'Điện thoại', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Địa chỉ', key: 'address', width: 40 },
        { header: 'Mã số thuế', key: 'taxCode', width: 20 },
        { header: 'Website', key: 'website', width: 25 },
        { header: 'Ghi chú', key: 'notes', width: 50 },
      ];

      filteredSuppliers.forEach((supplier, index) => {
        worksheet.addRow({
          stt: index + 1,
          supplierCode: supplier.supplierCode || "",
          name: supplier.name,
          contactPerson: supplier.contactPerson,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          taxCode: supplier.taxCode,
          website: supplier.website,
          notes: supplier.notes || "",
        });
      });

      // Định dạng chung cho tất cả các ô: Times New Roman, cỡ chữ 12
      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        // vertical: 'middle' giúp nội dung luôn nằm giữa ô khi chiều cao hàng tăng lên
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        // Thêm viền cho tất cả các ô và xử lý căn lề riêng cho cột STT, Mã nhà cung cấp
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          // Căn giữa nội dung cho cột STT (1) và Mã nhà cung cấp (2)
          if (colNumber === 1 || colNumber === 2) {
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          }
        });

        if (rowNumber === 1) {
          // Định dạng Header: Cao 30px, In đậm, Căn giữa
          row.height = 30;
          row.font = { name: 'Times New Roman', size: 12, bold: true };
          row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else {
          // Lấy giá trị của cột "Tên nhà cung cấp" (key: 'name')
          const nameValue = row.getCell('name').value ? String(row.getCell('name').value) : "";

          // Với width = 40 và font size 12, ước tính khoảng 35 ký tự (bao gồm dấu) sẽ xuống dòng.
          // Chúng ta tính số dòng dự kiến.
          const estimatedLines = Math.ceil(nameValue.length / 35) || 1;

          // Chiều cao cơ bản là 25px. Mỗi dòng tiếp theo cộng thêm 18px để hiển thị rõ ràng và ổn định.
          row.height = 25 + (estimatedLines - 1) * 18;
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách nhà cung cấp.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      showNotification("Lỗi khi xuất file Excel.", "error");
      console.error("Lỗi xuất Excel:", err);
    }
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách nhà cung cấp ra tệp Excel không?'
    });
  };

  const supplierColumns = [
    {
      header: '',
      className: 'w-[40px] text-center !px-1 sm:!px-2',
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
    { header: 'STT', className: 'w-[50px] text-center !px-1 sm:!px-2', render: (row, { index }) => index },
    { header: 'Mã NCC', accessor: 'supplierCode', className: 'font-medium text-blue-700 w-[80px] sm:w-[120px] !px-1 sm:!px-6' },
    { header: 'Tên nhà cung cấp', accessor: 'name', className: 'hidden sm:table-cell font-bold text-blue-600 min-w-[150px]' },
    {
      header: isBulkSelectMode ? (
        <div className="flex w-full items-center justify-center gap-1 text-[10px] sm:text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAllSuppliers();
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
              handleClearSelectedSuppliers();
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
                handleToggleSelectSupplier(row);
              }}
              className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-red-50"
            >
              {selectedSupplierIds.includes(row.id) ? (
                <FaRegSquareMinus size={20} className="text-red-600" />
              ) : (
                <FaRegSquare size={20} className="text-gray-400" />
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleEditSupplier(row)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDeleteSupplier(row.id)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95"
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
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 tracking-tight">Danh sách nhà cung cấp</h2>

      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full lg:max-w-[350px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm nhà cung cấp..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm outline-none transition-all sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 w-full lg:w-auto lg:flex lg:flex-wrap">
          <button onClick={handleOpenImportModal} className="order-1 lg:order-2 w-full lg:w-auto justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded whitespace-nowrap transition-all active:scale-95 flex items-center gap-2 shadow-sm text-sm">
            <FileUp size={16} />
            <span>Nhập Excel</span>
          </button>
          <button
            onClick={handleRequestExportExcel}
            className="order-2 lg:order-3 w-full lg:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded whitespace-nowrap transition-all active:scale-95 flex items-center gap-2 shadow-sm text-sm"
          >
            <FileDown size={16} /> <span>Xuất Excel</span>
          </button>
          <button
            onClick={handleBulkDelete}
            className={`order-3 lg:order-1 w-full lg:w-auto justify-center text-white font-bold py-2 px-3 rounded whitespace-nowrap transition-all flex items-center gap-2 text-sm ${selectedSupplierIds.length > 0 ? 'bg-red-700 hover:bg-red-700 shadow-md active:scale-95' : 'bg-red-700 hover:bg-red-700'}`}
          >
            <Trash2 size={16} />
            <span className="truncate">Xóa nhiều dòng {selectedSupplierIds.length > 0 && `(${selectedSupplierIds.length})`}</span>
          </button>
          <button onClick={handleAddSupplier} className="flex gap-2 items-center order-4 w-full lg:w-auto justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all active:scale-95 shadow-md text-sm">
            <MdAdd />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600 p-4">Đang tải dữ liệu nhà cung cấp...</p>
      ) : null}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <CustomDatatable
            columns={supplierColumns}
            data={filteredSuppliers}
            bodyCellClassName="!py-2 sm:!py-3"
            renderExpansion={(row) => (
              <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col gap-4 text-sm">
                  {/* Dòng 1: Tên nhà cung cấp (Chỉ hiện trên mobile vì trên desktop đã có ở bảng chính) */}
                  <div className="flex flex-col gap-1 sm:hidden">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tên nhà cung cấp</span>
                    <span className="text-blue-600 font-bold text-base">{row.name || '---'}</span>
                  </div>

                  <div className="grid grid-cols-2 w-full md:w-4/5 md:grid-cols-4 gap-y-6 gap-x-4 md:gap-x-8">
                    {/* Dòng 2: cột Người liên hệ với cột Số điện thoại */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Người liên hệ</span>
                      <span className="text-gray-900 font-medium">{row.contactPerson || '---'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số điện thoại</span>
                      <span className="text-gray-900 font-medium">{row.phone || '---'}</span>
                    </div>

                    {/* Dòng 3: cột Email với cột Địa chỉ */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
                      <span className="text-gray-900 font-medium break-all">{row.email || '---'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Địa chỉ</span>
                      <span className="text-gray-900 font-medium leading-tight">{row.address || '---'}</span>
                    </div>

                    {/* Dòng 4: cột Website với cột Mã số thuế */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Website</span>
                      <span className="text-blue-600 font-medium break-all">
                        {row.website ? <a href={row.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{row.website}</a> : '---'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mã số thuế</span>
                      <span className="text-gray-900 font-medium">{row.taxCode || '---'}</span>
                    </div>

                    {/* Dòng 5: cột Ghi chú */}
                    <div className="col-span-2 md:col-span-4 flex flex-col gap-1 mt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ghi chú</span>
                      <p className="text-gray-600 italic leading-relaxed">{row.notes || 'Không có ghi chú'}</p>
                    </div>
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
        title="Nhập dữ liệu nhà cung cấp từ Excel"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="supplier-excel-file"
              className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-blue-600 hover:bg-blue-50"
            >
              <FileUp size={32} className="mb-3 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                {selectedImportFile ? selectedImportFile.name : 'Chọn file Excel (.xlsx)'}
              </span>
              <input
                id="supplier-excel-file"
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm nhà cung cấp mới' : 'Cập nhật nhà cung cấp'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-2xl'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          {/* Dòng 1: Tên nhà cung cấp và Mã nhà cung cấp */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-medium ${supplierErrors.name ? 'text-red-500' : 'text-gray-500'}`}>Tên nhà cung cấp <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                value={currentEditingSupplier?.name || ''}
                onChange={handleModalInputChange}
                className={`mt-1 block w-full border ${supplierErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm outline-none focus:ring-2 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              />
              {supplierErrors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{supplierErrors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Mã nhà cung cấp</label>
              <input
                type="text"
                name="supplierCode"
                value={currentEditingSupplier?.supplierCode || ''}
                disabled
                className={`mt-1 block w-full border border-gray-300 bg-gray-100 text-gray-500 rounded-md shadow-sm outline-none cursor-not-allowed ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              />
            </div>
          </div>

          {/* Dòng 2: Người liên hệ và Điện thoại */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-medium ${supplierErrors.contactPerson ? 'text-red-500' : 'text-gray-700'}`}>Người liên hệ</label>
              <input
                type="text"
                name="contactPerson"
                value={currentEditingSupplier?.contactPerson || ''}
                onChange={handleModalInputChange}
                className={`mt-1 block w-full border ${supplierErrors.contactPerson ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm outline-none focus:ring-2 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              />
              {supplierErrors.contactPerson && <p className="text-red-500 text-[10px] mt-1 font-medium">{supplierErrors.contactPerson}</p>}
            </div>
            <div>
              <label className={`text-xs font-medium ${supplierErrors.phone ? 'text-red-500' : 'text-gray-700'}`}>Điện thoại</label>
              <input
                type="text"
                name="phone"
                value={currentEditingSupplier?.phone || ''}
                onChange={handleModalInputChange}
                className={`mt-1 block w-full border ${supplierErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm outline-none focus:ring-2 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              />
              {supplierErrors.phone && <p className="text-red-500 text-[10px] mt-1 font-medium">{supplierErrors.phone}</p>}
            </div>
          </div>

          {/* Dòng 3: Địa chỉ */}
          <div>
            <label className={`text-xs font-medium ${supplierErrors.address ? 'text-red-500' : 'text-gray-700'}`}>Địa chỉ</label>
            <input
              type="text"
              name="address"
              value={currentEditingSupplier?.address || ''}
              onChange={handleModalInputChange}
              className={`mt-1 block w-full border ${supplierErrors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm outline-none focus:ring-2 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
            />
            {supplierErrors.address && <p className="text-red-500 text-[10px] mt-1 font-medium">{supplierErrors.address}</p>}
          </div>

          {/* Dòng 4: Email và Mã số thuế */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-medium ${supplierErrors.email ? 'text-red-500' : 'text-gray-700'}`}>Email</label>
              <input
                type="email"
                name="email"
                value={currentEditingSupplier?.email || ''}
                onChange={handleModalInputChange}
                className={`mt-1 block w-full border ${supplierErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm outline-none focus:ring-2 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              />
              {supplierErrors.email && <p className="text-red-500 text-[10px] mt-1 font-medium">{supplierErrors.email}</p>}
            </div>
            <div>
              <label className={`text-xs font-medium ${supplierErrors.taxCode ? 'text-red-500' : 'text-gray-700'}`}>Mã số thuế</label>
              <input
                type="text"
                name="taxCode"
                value={currentEditingSupplier?.taxCode || ''}
                onChange={handleModalInputChange}
                className={`mt-1 block w-full border ${supplierErrors.taxCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm outline-none focus:ring-2 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              />
              {supplierErrors.taxCode && <p className="text-red-500 text-[10px] mt-1 font-medium">{supplierErrors.taxCode}</p>}
            </div>
          </div>

          {/* Dòng 5: Website */}
          <div>
            <label className={`text-xs font-medium ${supplierErrors.website ? 'text-red-500' : 'text-gray-700'}`}>Website</label>
            <input
              type="text"
              name="website"
              value={currentEditingSupplier?.website || ''}
              onChange={handleModalInputChange}
              className={`mt-1 block w-full border ${supplierErrors.website ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm outline-none focus:ring-2 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
            />
            {supplierErrors.website && <p className="text-red-500 text-[10px] mt-1 font-medium">{supplierErrors.website}</p>}
          </div>

          {/* Dòng 6: Ghi chú */}
          <div>
            <label className="text-xs font-medium text-gray-700">Ghi chú</label>
            <textarea
              rows={isModalMaximized ? "4" : "2"}
              name="notes"
              value={currentEditingSupplier?.notes || ''}
              onChange={handleModalInputChange}
              className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm">Lưu nhà cung cấp</button>
          </div>
        </form>
      </Modal>

      <CustomConfirm
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      <AppNotification
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
      />
    </div>
  );
};
