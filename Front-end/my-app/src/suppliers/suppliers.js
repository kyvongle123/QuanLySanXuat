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
        setSuppliers(suppliers.filter(s => s.id !== id));
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
      taxId: '',
      website: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingSupplier(null);
    setIsModalMaximized(false);
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingSupplier(prev => ({ ...prev, [name]: value }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const newSupplier = await createSupplier(currentEditingSupplier);
        setSuppliers(prev => [...prev, newSupplier]);
        showNotification("Thêm nhà cung cấp thành công!");
      } else {
        const updated = await updateSupplier(currentEditingSupplier.id, currentEditingSupplier);
        setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
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
        { header: 'Tên nhà cung cấp', key: 'name', width: 30 },
        { header: 'Người liên hệ', key: 'contactPerson', width: 25 },
        { header: 'Điện thoại', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Địa chỉ', key: 'address', width: 40 },
        { header: 'Mã số thuế', key: 'taxId', width: 20 },
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
          taxId: supplier.taxId,
          website: supplier.website,
          notes: supplier.notes,
        });
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
      className: 'w-[40px] text-center',
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
    { header: 'STT', className: 'w-[60px] text-center', render: (row, { index }) => index },
    { header: 'Tên nhà cung cấp', accessor: 'name', className: 'font-medium text-blue-600 w-64' },
    { header: 'Người liên hệ', accessor: 'contactPerson', className: 'w-48' },
    { header: 'Điện thoại', accessor: 'phone', className: 'w-full' },
    {
      header: 'Hành động',
      className: 'text-right pr-5 w-[160px]',
      render: (row) => (
        <div className="flex gap-2 justify-end items-center">
          <button
            onClick={() => handleEditSupplier(row)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >
            Sửa
          </button>
          <button
            onClick={() => handleDeleteSupplier(row.id)}
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
      <h2 className="text-2xl font-bold mb-4">Danh sách nhà cung cấp</h2>

      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên, người liên hệ, email, SĐT"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors">
            <FileDown size={18} /> Xuất Excel
          </button>
          <button onClick={handleAddSupplier} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors">
            Thêm nhà cung cấp mới
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-600 p-4 italic">Đang tải dữ liệu nhà cung cấp...</p>}
      {!loading && !error && (
        <CustomDatatable
          columns={supplierColumns}
          data={filteredSuppliers}
          renderExpansion={(row) => (
            <div className="py-4 pl-48 pr-6 bg-blue-50/30 border-b border-gray-100 relative">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-sm">
                <div className="flex flex-col col-span-2 gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Địa chỉ</span>
                  <span className="text-gray-900 font-medium">{row.address || '---'}</span>
                </div>
                <div className="flex flex-col col-span-2 gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Email</span>
                  <span className="text-gray-900 font-medium">{row.email || '---'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Mã số thuế</span>
                  <span className="text-gray-900 font-medium">{row.taxId || '---'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Website</span>
                  <span className="text-blue-600 font-medium">
                    {row.website ? <a href={row.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{row.website}</a> : '---'}
                  </span>
                </div>
                <div className="flex flex-col col-span-4 gap-1 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Ghi chú</span>
                  <p className="text-gray-600 italic">{row.notes || 'Không có ghi chú'}</p>
                </div>
              </div>
            </div>
          )}
        />
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
              <label className="text-xs font-medium text-gray-700">Tên nhà cung cấp</label>
              <input
                type="text"
                name="name"
                value={currentEditingSupplier?.name || ''}
                onChange={handleModalInputChange}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Người liên hệ</label>
              <input
                type="text"
                name="contactPerson"
                value={currentEditingSupplier?.contactPerson || ''}
                onChange={handleModalInputChange}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700">Điện thoại</label>
              <input
                type="text"
                name="phone"
                value={currentEditingSupplier?.phone || ''}
                onChange={handleModalInputChange}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={currentEditingSupplier?.email || ''}
                onChange={handleModalInputChange}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Địa chỉ</label>
            <input
              type="text"
              name="address"
              value={currentEditingSupplier?.address || ''}
              onChange={handleModalInputChange}
              className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700">Mã số thuế</label>
              <input
                type="text"
                name="taxId"
                value={currentEditingSupplier?.taxId || ''}
                onChange={handleModalInputChange}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Website</label>
              <input
                type="text"
                name="website"
                value={currentEditingSupplier?.website || ''}
                onChange={handleModalInputChange}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              />
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
