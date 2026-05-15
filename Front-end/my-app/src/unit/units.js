import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus, FileDown, FileUp, Trash2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal } from '../customComponent/customComponent';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../controller/unitsController';

export const Units = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingUnit, setCurrentEditingUnit] = useState({ name: '' });
  const [unitErrors, setUnitErrors] = useState({}); // New state for validation errors
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getUnits();
      setUnits(data);
    } catch (err) {
      showNotification("Lỗi khi tải dữ liệu đơn vị tính", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return units.filter(unit =>
      unit.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [units, searchTerm]);

  const handleOpenModal = (mode, unit = null) => {
    setModalMode(mode);
    setCurrentEditingUnit(unit ? { ...unit } : { name: '' });
    setUnitErrors({}); // Reset errors when opening modal
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingUnit({ name: '' });
    setUnitErrors({}); // Reset errors when closing modal
    setIsModalMaximized(false);
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingUnit(prev => ({ ...prev, [name]: value }));
    if (unitErrors[name]) {
      setUnitErrors(prev => ({ ...prev, [name]: null })); // Clear error when user starts typing
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!currentEditingUnit.name.trim()) {
      errors.name = "Bắt buộc nhập Tên đơn vị";
    }

    if (Object.keys(errors).length > 0) {
      setUnitErrors(errors);
      return;
    }

    setUnitErrors({}); // Clear errors if validation passes

    try {
      if (modalMode === 'add') {
        await createUnit({ Name: currentEditingUnit.name });
        showNotification("Thêm đơn vị tính thành công!");
      } else {
        await updateUnit(currentEditingUnit.id, { ID: currentEditingUnit.id, Name: currentEditingUnit.name });
        showNotification("Cập nhật đơn vị tính thành công!");
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu đơn vị tính.", "error");
    }
  };

  const handleDeleteRequest = (id) => {
    setConfirmModal({
      isOpen: true,
      id,
      type: 'delete',
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa đơn vị tính này không?'
    });
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'delete') {
      try {
        await deleteUnit(confirmModal.id);
        setUnits(prev => prev.filter(unit => unit.id !== confirmModal.id));
        showNotification("Xóa đơn vị tính thành công!", "success");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    } else if (confirmModal.type === 'export') {
      await handleExportExcel();
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách đơn vị tính ra tệp Excel không?'
    });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách đơn vị tính');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Tên đơn vị', key: 'name', width: 30 },
      ];

      filteredData.forEach((unit, index) => {
        worksheet.addRow({
          stt: index + 1,
          name: unit.name,
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
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          if (colNumber === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách đơn vị tính.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const columns = [
    { header: 'STT', className: 'w-[40px] text-center !px-1', render: (_, { index }) => index },
    { header: 'Tên đơn vị', accessor: 'name', className: 'font-medium text-blue-600 !px-1' },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-4 w-[100px] sm:w-[150px]',
      render: (row) => (
        <div className="flex gap-1.5 justify-end">
          <button onClick={() => handleOpenModal('edit', row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95">Sửa</button>
          <button onClick={() => handleDeleteRequest(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95">Xóa</button>
        </div>
      ),
    }
  ];

  return (
    <div className="p-2 sm:p-6 bg-gray-50/50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Quản lý Đơn vị tính</h2>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 gap-4">
        <div className="relative w-full lg:max-w-[300px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên đơn vị..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-row gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 text-xs sm:text-sm">
              <FileUp size={16} /> Nhập Excel
            </button>
            <button
              onClick={handleRequestExportExcel}
              className="flex-1 sm:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg whitespace-nowrap flex items-center gap-2 shadow-sm transition-all active:scale-95 text-xs sm:text-sm"
            >
              <FileDown size={16} /> Xuất Excel
            </button>
          </div>
          <button
            onClick={() => handleOpenModal('add')}
            className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
          >
            <Plus size={18} /> Thêm đơn vị mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="italic">Đang tải dữ liệu đơn vị tính...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <CustomDatatable
            columns={columns}
            data={filteredData}
            bodyCellClassName="!py-2 sm:!py-3"
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm đơn vị tính mới' : 'Chỉnh sửa đơn vị tính'}
        maxWidth={isModalMaximized ? "max-w-full" : "max-w-sm"}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${unitErrors.name ? 'text-red-600' : 'text-gray-700'}`}>Tên đơn vị</label>
            <input
              type="text"
              name="name"
              value={currentEditingUnit?.name || ''}
              onChange={handleModalInputChange}
              className={`w-full border ${unitErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm p-2 focus:ring-2 outline-none text-sm`}
              autoFocus
            />
            {unitErrors.name && <p className="text-xs font-medium text-red-600">{unitErrors.name}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-1.5 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm font-bold">Lưu</button>
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