import React, { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, FileDown, Plus, Maximize, Minimize } from 'lucide-react';
import { CustomDatatable, AppNotification, CustomConfirm, Modal } from '../customComponent/customComponent';
import { getItemStatuses, deleteItemStatus, createItemStatus, updateItemStatus } from '../controller/itemStatusesController';

export const ItemStatuses = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState(null);
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const data = await getItemStatuses();
        setStatuses(data);
      } catch (err) {
        console.error("Error fetching statuses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatuses();
  }, []);

  const filteredStatuses = useMemo(() => {
    return statuses.filter(s => 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [statuses, searchTerm]);

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ name: '' });
    setIsModalOpen(true);
  };

  const handleEditItem = (item) => {
    setModalMode('edit');
    setCurrentEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id) => {
    setConfirmModal({
      isOpen: true,
      id: id,
      type: 'delete',
      title: 'Xác nhận xóa tình trạng',
      message: 'Tình trạng này sẽ bị xóa. Bạn có chắc chắn?'
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingItem(null);
    setIsModalMaximized(false);
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingItem(prev => ({ ...prev, [name]: value }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const newItem = await createItemStatus(currentEditingItem);
        setStatuses(prev => [...prev, newItem]);
        showNotification("Thêm tình trạng thành công!");
      } else {
        const updated = await updateItemStatus(currentEditingItem.id, currentEditingItem);
        setStatuses(prev => prev.map(s => s.id === updated.id ? updated : s));
        showNotification("Cập nhật tình trạng thành công!");
      }
      handleCloseModal();
    } catch (err) {
      showNotification("Có lỗi xảy ra.", "error");
    }
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách tình trạng hàng hóa không?'
    });
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'export') {
      await handleExportExcel();
    } else if (confirmModal.type === 'delete') {
      try {
        await deleteItemStatus(confirmModal.id);
        setStatuses(prev => prev.filter(s => s.id !== confirmModal.id));
        showNotification("Xóa tình trạng thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa tình trạng.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tình trạng hàng hóa');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Tên tình trạng', key: 'name', width: 40 },
      ];

      statuses.forEach((status, index) => {
        worksheet.addRow({
          stt: index + 1,
          name: status.name,
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
      saveAs(new Blob([buffer]), `Danh sách tình trạng.xlsx`);
      setNotification({ isOpen: true, message: "Xuất file Excel thành công!", type: 'success' });
    } catch (err) {
      setNotification({ isOpen: true, message: "Lỗi khi xuất file Excel.", type: 'error' });
    }
  };

  const columns = [
    { header: 'STT', render: (row, { index }) => index },
    { header: 'Tên tình trạng', accessor: 'name', className: 'font-medium w-full' },
    {
      header: 'Hành động',
      className: 'text-right',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleEditItem(row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm">Sửa</button>
          <button onClick={() => handleDeleteItem(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm">Xóa</button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Quản lý Tình trạng</h2>
      
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên tình trạng"
            className="block w-full max-w-[280px] pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={handleRequestExportExcel} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors">
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button onClick={handleAddItem} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors">
            Thêm mới tình trạng
          </button>
        </div>
      </div>

      {loading ? <p className="p-4">Đang tải...</p> : <CustomDatatable columns={columns} data={filteredStatuses} />}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm tình trạng mới' : 'Chỉnh sửa tình trạng'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên tình trạng</label>
            <input type="text" name="name" value={currentEditingItem?.name || ''} onChange={handleModalInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu</button>
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