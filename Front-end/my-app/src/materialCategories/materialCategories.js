import { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, FileDown } from 'lucide-react';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect } from '../customComponent/customComponent';
import { getMaterialCategories, createMaterialCategory, updateMaterialCategory, deleteMaterialCategory } from '../controller/materialCategoriesController';
import { getItems } from '../controller/itemsController';

export const MaterialCategories = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ name: '', unit: '', quantity: 0, item: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catData, itemData] = await Promise.all([
        getMaterialCategories(),
        getItems()
      ]);
      setCategories(catData);
      setItems(itemData.map(i => ({ value: i.id, label: i.name })));
    } catch (err) {
      showNotification("Lỗi khi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  const tableData = useMemo(() => {
    return categories.filter(cat => 
      cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.unit?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ name: '', unit: '', quantity: 0, item: '' });
    setIsModalOpen(true);
  };

  const handleEditItem = (category) => {
    setModalMode('edit');
    setCurrentEditingItem({ ...category });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingItem({ name: '', unit: '', quantity: 0, item: '' });
    setIsModalMaximized(false);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...currentEditingItem,
      item: currentEditingItem.item ? parseInt(currentEditingItem.item) : null
    };

    try {
      if (modalMode === 'add') {
        const newItem = await createMaterialCategory(payload);
        setCategories(prev => [newItem, ...prev]);
        showNotification("Thêm danh mục thành công!");
      } else {
        const updated = await updateMaterialCategory(currentEditingItem.id, payload);
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        showNotification("Cập nhật danh mục thành công!");
      }
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu", "error");
    }
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách danh mục nguyên liệu ra tệp Excel không?'
    });
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'export') {
      await handleExportExcel();
    } else if (confirmModal.type === 'delete') {
      try {
        await deleteMaterialCategory(confirmModal.id);
        setCategories(prev => prev.filter(c => c.id !== confirmModal.id));
        showNotification("Xóa danh mục thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh mục nguyên liệu');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Tên danh mục', key: 'name', width: 30 },
        { header: 'Đơn vị tính', key: 'unit', width: 15 },
      ];

      categories.forEach((cat, index) => {
        worksheet.addRow({
          stt: index + 1,
          name: cat.name,
          unit: cat.unit,
          quantity: cat.quantity,
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          };
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
      saveAs(new Blob([buffer]), `Danh mục nguyên liệu.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const columns = [
    { header: 'STT', render: (row, { index }) => index },
    { 
      header: 'Tên danh mục', 
      accessor: 'name', 
      className: 'min-w-[200px]',
      render: (row) => <span className="font-bold text-blue-600">{row.name}</span>
    },
    { 
      header: 'Đơn vị tính', 
      accessor: 'unit', 
      className: 'min-w-[280px]',
    },
    {
      header: 'Hành động',
      className: 'text-right whitespace-nowrap w-[150px]',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleEditItem(row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors">Sửa</button>
          <button 
            onClick={() => setConfirmModal({ 
              isOpen: true, id: row.id, type: 'delete', 
              title: 'Xác nhận xóa danh mục', 
              message: 'Danh mục này sẽ bị xóa vĩnh viễn. Bạn có chắc chắn?' 
            })} 
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Danh mục nguyên liệu</h2>
      
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc đơn vị" 
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
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
            Thêm danh mục mới
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-4 text-gray-600">Đang tải dữ liệu...</p>
      ) : (
        <CustomDatatable columns={columns} data={tableData} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm danh mục mới' : 'Cập nhật danh mục'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên danh mục</label>
            <input type="text" value={currentEditingItem?.name || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Đơn vị tính</label>
            <input type="text" value={currentEditingItem?.unit || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, unit: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="kg, mét,..." required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu</button>
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
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
};