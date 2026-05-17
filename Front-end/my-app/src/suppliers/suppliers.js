import React, { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, FileUp, FileDown, ChevronRight } from 'lucide-react';
import { CustomDatatable, Modal, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { getSuppliers, deleteSupplier, createSupplier, updateSupplier } from '../controller/suppliersController';
import { BsLayoutSidebarInset, BsLayoutSidebarInsetReverse } from "react-icons/bs";
import { FaPencil } from "react-icons/fa6";

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
  const [isModalMaximized, setIsModalMaximized] = useState(false);
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

  const handleBulkDelete = () => {
    if (selectedSupplierIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      id: selectedSupplierIds,
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều nhà cung cấp',
      message: `Bạn có chắc chắn muốn xóa ${selectedSupplierIds.length} nhà cung cấp đã chọn không?`
    });
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
          name: supplier.name,
          contactPerson: supplier.contactPerson,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          taxCode: supplier.taxCode,
          website: supplier.website,
          notes: supplier.notes,
        });
      });

      // Định dạng chung cho tất cả các ô: Times New Roman, cỡ chữ 12
      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        // vertical: 'middle' giúp nội dung luôn nằm giữa ô khi chiều cao hàng tăng lên
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        // Thêm viền cho tất cả các ô và xử lý căn lề riêng cho cột STT
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          // Căn giữa nội dung cho cột STT (Cột số 1)
          if (colNumber === 1) {
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
    { header: 'Tên nhà cung cấp', accessor: 'name', className: 'font-bold text-blue-600 min-w-[150px]' },
    { header: 'Người liên hệ', accessor: 'contactPerson', className: 'hidden md:table-cell w-48 !px-1 sm:!px-2' },
    { header: 'Điện thoại', accessor: 'phone', className: 'hidden sm:table-cell w-32 sm:w-40' },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-5 w-[120px] sm:w-[160px]',
      render: (row) => (
        <div className="flex gap-2 justify-end items-center">
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

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
            <FileUp size={18} />
            <span>Nhập Excel</span>
          </button>
          <button onClick={handleRequestExportExcel} className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
            <FileDown size={18} /> <span>Xuất Excel</span>
          </button>
          <button onClick={handleAddSupplier} className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg whitespace-nowrap transition-all active:scale-95 shadow-md text-sm">
            Thêm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm">Đang tải dữ liệu nhà cung cấp...</p>
        </div>
      ) : null}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <CustomDatatable
            columns={supplierColumns}
            data={filteredSuppliers}
            bodyCellClassName="!py-2 sm:!py-3"
            renderExpansion={(row) => (
              <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 w-4/5 md:grid-cols-4 gap-y-6 gap-x-4 md:gap-x-8 text-sm">
                  {/* Hàng 1: cột Người liên hệ với cột Số điện thoại */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Người liên hệ</span>
                    <span className="text-gray-900 font-medium">{row.contactPerson || '---'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số điện thoại</span>
                    <span className="text-gray-900 font-medium">{row.phone || '---'}</span>
                  </div>

                  {/* Hàng 2: cột Email với cột Địa chỉ */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
                    <span className="text-gray-900 font-medium break-all">{row.email || '---'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Địa chỉ</span>
                    <span className="text-gray-900 font-medium leading-tight">{row.address || '---'}</span>
                  </div>

                  {/* Hàng 3: cột Website với cột Mã số thuế */}
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

                  {/* Hàng 4: cột Ghi chú */}
                  <div className="col-span-2 md:col-span-4 flex flex-col gap-1 mt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ghi chú</span>
                    <p className="text-gray-600 italic leading-relaxed">{row.notes || 'Không có ghi chú'}</p>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm nhà cung cấp mới' : 'Cập nhật nhà cung cấp'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-2xl'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-medium ${supplierErrors.name ? 'text-red-500' : 'text-gray-700'}`}>Tên nhà cung cấp</label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

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
