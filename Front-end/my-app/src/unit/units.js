import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus, FileDown, Trash2, FileUp } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { LuSquarePen } from "react-icons/lu";
import { CustomDatatable, AppNotification, CustomConfirm, Modal } from '../customComponent/customComponent';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../controller/unitsController';

export const Units = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ name: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const unitData = await getUnits();
      setUnits(unitData.map(u => ({ ...u, id: u.id || u.ID }))); // Ensure consistent ID field
      setSelectedUnitIds([]); // Clear selections after data refresh
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
    return units.filter(u => {
      return (
        (u.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [units, searchTerm]);

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ name: '' });
    setIsModalOpen(true);
  };

  const handleEditItem = (unit) => {
    setModalMode('edit');
    setCurrentEditingItem({
      ...unit,
      name: unit.name || unit.Name
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ID: currentEditingItem.id || 0, // ID is 0 for new items, actual ID for existing
      Name: currentEditingItem.name
    };

    try {
      if (modalMode === 'add') {
        await createUnit(payload);
        showNotification("Thêm đơn vị tính thành công!");
      } else {
        await updateUnit(currentEditingItem.id, payload);
        showNotification("Cập nhật đơn vị tính thành công!");
      }
      fetchData(); // Refresh data after CUD operation
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu.", "error");
    }
  };

  const handleSelectUnit = (id) => {
    setSelectedUnitIds(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(unitId => unitId !== id)
        : [...prevSelected, id]
    );
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
          name: unit.name || unit.Name,
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        if (rowNumber === 1) row.font.bold = true;
        row.eachCell((cell) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh_sach_don_vi_tinh.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'export') {
      await handleExportExcel();
    } else if (confirmModal.type === 'delete') {
      try {
        await deleteUnit(confirmModal.id);
        setUnits(prev => prev.filter(u => u.id !== confirmModal.id));
        showNotification("Xóa đơn vị tính thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    } else if (confirmModal.type === 'bulk-delete-units') {
      try {
        // Thực hiện xóa tất cả các ID đã chọn
        await Promise.all(confirmModal.id.map(id => deleteUnit(id)));
        setUnits(prev => prev.filter(u => !confirmModal.id.includes(u.id)));
        setSelectedUnitIds([]);
        showNotification(`Xóa ${confirmModal.id.length} đơn vị tính thành công!`);
      } catch (err) {
        showNotification("Lỗi khi xóa nhiều dữ liệu.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const columns = [
    {
      header: 'STT',
      className: 'w-[30px] sm:w-[50px] !px-2 sm:!px-4 text-center',
      headerCellClassName: 'text-[10px] sm:text-sm',
      render: (row, { index }) => index
    },
    {
      header: 'Tên đơn vị',
      accessor: 'name',
      headerCellClassName: 'text-[10px] sm:text-sm',
      className: 'text-[11px] sm:text-sm !px-2 sm:!px-6',
      render: (row) => <span className="font-bold text-blue-600">{row.name || row.Name}</span>
    },
    {
      header: <div className="flex justify-center items-center w-full text-[10px] sm:text-sm">Hành động</div>,
      className: 'text-center w-[100px] sm:w-[180px]',
      render: (row) => (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEditItem(row); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95"
          >
            Sửa
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: row.id, type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa đơn vị tính này?' }); }}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-2xl font-bold mb-4">Danh sách đơn vị tính</h2>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 gap-4">
        <div className="relative w-full lg:max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên đơn vị..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="flex-1 lg:flex-none justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2 text-sm">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="flex-1 lg:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors text-sm">
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button onClick={handleAddItem} className="w-full lg:w-auto justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors text-sm">
            <span className="hidden sm:inline">Thêm đơn vị mới</span>
            <span className="sm:hidden">Thêm đơn vị</span>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-4 italic text-gray-500">Đang tải dữ liệu...</p>
      ) : (
        <CustomDatatable
          columns={columns}
          data={filteredData}
          bodyCellClassName="!py-2 lg:!py-3"
        />
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? 'Thêm đơn vị tính mới' : 'Chỉnh sửa đơn vị tính'} isMaximized={isModalMaximized} onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}>
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Tên đơn vị</label>
            <input
              type="text"
              value={currentEditingItem?.name || ''}
              onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, name: e.target.value })}
              className={`w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 min-h-[44px] text-base' : 'p-1.5 min-h-[38px] text-sm'}`}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu đơn vị</button>
          </div>
        </form>
      </Modal>

      <CustomConfirm isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, id: null })} onConfirm={handleConfirmAction} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} />
      <AppNotification isOpen={notification.isOpen} message={notification.message} type={notification.type} onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
};
