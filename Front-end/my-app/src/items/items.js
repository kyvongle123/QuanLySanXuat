import React, { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, ChevronDown, ChevronRight, FileUp, FileDown, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { CustomDatatable, Modal, CustomSelect, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { getItems, deleteItem, createItem, updateItem } from '../controller/itemsController';
import { getCategories } from '../controller/categoriesController';
import { getItemStatuses } from '../controller/itemStatusesController';
import { BsLayoutSidebarInset, BsLayoutSidebarInsetReverse } from "react-icons/bs";
import { VscLayoutSidebarLeftDock, VscLayoutSidebarRightDock} from "react-icons/vsc";
import { RxDrawingPinFilled } from "react-icons/rx";
import { LuSquarePen } from "react-icons/lu";

export const Items = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [itemStatuses, setItemStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentEditingItem, setCurrentEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategoryMenuId, setOpenCategoryMenuId] = useState(null);
  const [openManufactoryMenuId, setOpenManufactoryMenuId] = useState(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);
  const [openLocationMenuId, setOpenLocationMenuId] = useState(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  // Lắng nghe sự kiện click toàn cục để đóng menu khi bấm ra ngoài
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenCategoryMenuId(null);
      setOpenManufactoryMenuId(null);
      setOpenStatusMenuId(null);
      setOpenLocationMenuId(null);
      setMenuSearchQuery('');
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const closeNotification = () => setNotification(prev => ({ ...prev, isOpen: false }));

  // Logic lọc dữ liệu dựa trên searchTerm
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const categoryLabel = categories.find(c => String(c.value) === String(item.category))?.label || '';
      const statusLabel = itemStatuses.find(s => String(s.value) === String(item.status))?.label || '';
      return (
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoryLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        statusLabel.toLowerCase().includes(searchTerm.toLowerCase()) 
      );
    });
  }, [items, searchTerm, categories, itemStatuses]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await getItems(); // Sử dụng hàm đã import
        setItems(data);
      } catch (err) {
        setError("Failed to fetch items.");
        console.error("Error fetching items:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();

    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data.map(c => ({ value: c.id, label: c.name })));
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();

    const fetchStatuses = async () => {
      try {
        const data = await getItemStatuses();
        setItemStatuses(data.map(s => ({ value: s.id, label: s.name })));
      } catch (err) {
        console.error("Error fetching item statuses:", err);
      }
    };
    fetchStatuses();
  }, []);

  const handleDeleteItem = (itemId) => {
    setConfirmModal({ 
      isOpen: true, 
      id: itemId, 
      type: 'delete',
      title: 'Xác nhận xóa hàng hóa',
      message: 'Hàng hóa sẽ bị xóa khỏi kho dữ liệu. Bạn có chắc chắn?'
    });
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    if (type === 'delete') {
      try {
        await deleteItem(id);
        setItems(items.filter(item => item.id !== id));
        setSelectedItemIds(prev => prev.filter(selectedId => selectedId !== id));
        showNotification("Hàng hóa đã được xóa thành công!");
      } catch (err) {
        console.error("Error deleting item:", err);
        showNotification("Có lỗi xảy ra khi xóa hàng hóa.", "error");
      }
    } else if (type === 'export') {
      await handleExportExcel();
    } else if (type === 'bulkDelete') {
      try {
        // Thực hiện xóa đồng thời các ID đã chọn
        await Promise.all(id.map(itemId => deleteItem(itemId)));
        setItems(items.filter(item => !id.includes(item.id)));
        setSelectedItemIds([]);
        showNotification(`Đã xóa ${id.length} hàng hóa thành công!`);
      } catch (err) {
        console.error("Error bulk deleting items:", err);
        showNotification("Có lỗi xảy ra khi xóa nhiều hàng hóa.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleBulkDelete = () => {
    if (selectedItemIds.length === 0) return;
    
    setConfirmModal({ 
      isOpen: true, 
      id: selectedItemIds, 
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều hàng hóa',
      message: `Bạn có chắc chắn muốn xóa ${selectedItemIds.length} hàng hóa đã chọn không? Hành động này không thể hoàn tác.`
    });
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách hàng hóa ra tệp Excel không?'
    });
  };

  const handleEditItem = (item) => {
    setModalMode('edit');
    setCurrentEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ 
      name: '', 
      price: '', 
      description: '', 
      category: '', 
      inventory: 0,
      material: '',
      tax: 0,
      weight: 0,
      status: '', // Để trống để người dùng chọn
      location: ''
    });
    setIsModalOpen(true);
  };

  const toggleModalMaximize = () => {
    setIsModalMaximized(prev => !prev);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingItem(null);
    setIsModalMaximized(false); // Reset trạng thái khi đóng
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingItem(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = async (item, newCategoryId) => {
    try {
      const updatedValue = newCategoryId === "" ? null : parseInt(newCategoryId);
      const updated = await updateItem(item.id, { ...item, category: updatedValue });
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      setOpenCategoryMenuId(null);
      showNotification("Cập nhật danh mục thành công!");
    } catch (err) {
      console.error("Error updating category:", err);
      showNotification("Lỗi khi cập nhật danh mục.", "error");
    }
  };

  const handleManufactoryChange = async (item, newManufactoryId) => {
    try {
      const updatedValue = newManufactoryId === "" ? null : parseInt(newManufactoryId);
      const updated = await updateItem(item.id, { ...item, manufactory: updatedValue });
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      setOpenManufactoryMenuId(null);
      showNotification("Cập nhật nơi sản xuất thành công!");
    } catch (err) {
      console.error("Error updating manufactory:", err);
      showNotification("Lỗi khi cập nhật nơi sản xuất.", "error");
    }
  };

  const handleStatusChange = async (item, newStatusId) => {
    try {
      const updatedValue = newStatusId === "" ? null : parseInt(newStatusId);
      const updated = await updateItem(item.id, { ...item, status: updatedValue });
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      setOpenStatusMenuId(null);
      showNotification("Cập nhật tình trạng thành công!");
    } catch (err) {
      console.error("Error updating status:", err);
      showNotification("Lỗi khi cập nhật tình trạng.", "error");
    }
  };

  const handleLocationChange = async (item, newLocationId) => {
    try {
      const updatedValue = newLocationId === "" ? null : parseInt(newLocationId);
      const updated = await updateItem(item.id, { ...item, location: updatedValue });
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      setOpenLocationMenuId(null);
      showNotification("Cập nhật vị trí thành công!");
    } catch (err) {
      console.error("Error updating location:", err);
      showNotification("Lỗi khi cập nhật vị trí.", "error");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    // Chuẩn hóa dữ liệu: Chuyển chuỗi sang số hoặc null để khớp với Backend Model
    const payload = {
      ...currentEditingItem,
      price: currentEditingItem.price === '' ? null : parseFloat(currentEditingItem.price),
      inventory: currentEditingItem.inventory === '' ? null : parseInt(currentEditingItem.inventory),
      category: currentEditingItem.category === '' ? null : parseInt(currentEditingItem.category),
      manufactory: currentEditingItem.manufactory === '' ? null : parseInt(currentEditingItem.manufactory),
      tax: currentEditingItem.tax === '' ? null : parseFloat(currentEditingItem.tax),
      weight: currentEditingItem.weight === '' ? null : parseFloat(currentEditingItem.weight),
      status: currentEditingItem.status === '' ? null : parseInt(currentEditingItem.status),
      location: currentEditingItem.location === '' ? null : parseInt(currentEditingItem.location),
    };

    try {
      if (modalMode === 'add') {
        const newItem = await createItem(payload);
        setItems(prevItems => [...prevItems, newItem]);
        showNotification("Thêm hàng hóa thành công!");
      } else { // modalMode === 'edit'
        const updatedItem = await updateItem(currentEditingItem.id, payload);
        setItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? updatedItem : item));
        showNotification("Cập nhật hàng hóa thành công!");
      }
      handleCloseModal();
    } catch (err) {
      console.error(`Error ${modalMode === 'add' ? 'creating' : 'updating'} item:`, err);
      showNotification(`Lỗi khi ${modalMode === 'add' ? 'thêm' : 'cập nhật'} hàng hóa.`, "error");
    }
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách hàng hóa');

      // Định nghĩa các cột cho file Excel
      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Tên sản phẩm', key: 'name', width: 30 },
        { header: 'Giá (VNĐ)', key: 'price', width: 15 },
        { header: 'Vị trí', key: 'location', width: 20 },
        { header: 'Danh mục', key: 'category', width: 20 },
        { header: 'Tồn kho', key: 'inventory', width: 12 },
        { header: 'Nơi sản xuất', key: 'manufactory', width: 25 },
        { header: 'Chất liệu', key: 'material', width: 20 },
        { header: 'Thuế (%)', key: 'tax', width: 10 },
        { header: 'Cân nặng (kg)', key: 'weight', width: 15 },
        { header: 'Tình trạng', key: 'status', width: 20 },
        { header: 'Mô tả', key: 'description', width: 40 },
      ];

      // Đổ dữ liệu vào rows và xử lý mapping label
      filteredItems.forEach((item, index) => {
        const categoryLabel = categories.find(c => String(c.value) === String(item.category))?.label || '';
        const statusLabel = itemStatuses.find(s => String(s.value) === String(item.status))?.label || '';

        worksheet.addRow({
          stt: index + 1,
          name: item.name,
          price: item.price,
          category: categoryLabel,
          inventory: item.inventory,
          material: item.material,
          tax: item.tax,
          weight: item.weight,
          status: statusLabel,
          description: item.description,
        });
      });

      // Định dạng chung cho tất cả các ô: Times New Roman, cỡ chữ 12
      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        // Thêm viền cho các ô
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
          // Định dạng Header: In đậm, Cao 30px
          row.height = 30;
          row.font = { name: 'Times New Roman', size: 12, bold: true };
          row.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        // Không đặt row.height cố định cho Body (rowNumber > 1) 
        // để Excel tự động mở rộng chiều cao khi có text quá dài dẫn đến xuống dòng (wrapText: true)
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách hàng hóa.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  // Form cho Modal
  const itemForm = (
    <form onSubmit={handleModalSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="name" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Tên sản phẩm</label>
          <input type="text" id="name" name="name" value={currentEditingItem?.name || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} required />
        </div>
        <div>
          <label htmlFor="price" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Giá (VNĐ)</label>
          <input type="number" id="price" name="price" value={currentEditingItem?.price || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CustomSelect 
          label="Danh mục"
          name="category"
          value={currentEditingItem?.category || ''}
          onChange={handleModalInputChange}
          options={[...categories]}
          isModalMaximized={isModalMaximized}
        />
        <div>
          <label htmlFor="inventory" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Số lượng tồn</label>
          <input type="number" id="inventory" name="inventory" value={currentEditingItem?.inventory || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
        </div>
      </div>
      <div>
        <label htmlFor="description" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Mô tả</label>
        <textarea id="description" name="description" value={currentEditingItem?.description || ''} onChange={handleModalInputChange} rows={isModalMaximized ? "4" : "2"} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}></textarea>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CustomSelect 
          label="Nơi sản xuất"
          name="manufactory"
          value={''}
          onChange={handleModalInputChange}
          options={[]}
          isModalMaximized={isModalMaximized}
        />
        <div>
          <label htmlFor="material" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Chất liệu</label>
          <input type="text" id="material" name="material" value={currentEditingItem?.material || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="tax" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Thuế</label>
          <input type="text" id="tax" name="tax" value={currentEditingItem?.tax || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} required />
        </div>
        <div>
          <label htmlFor="weight" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Cân nặng</label>
          <input type="number" id="weight" name="weight" value={currentEditingItem?.weight || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CustomSelect 
          label="Tình trạng"
          name="status"
          value={currentEditingItem?.status || ''}
          onChange={handleModalInputChange}
          options={[...itemStatuses]}
          isModalMaximized={isModalMaximized}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CustomSelect 
          label="Vị trí (Chi nhánh)"
          name="location"
          value={currentEditingItem?.location || ''}
          onChange={handleModalInputChange}
          options={[]}
          isModalMaximized={isModalMaximized}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={handleCloseModal} className={`bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors ${isModalMaximized ? 'py-2 px-6 text-base' : 'py-1.5 px-4 text-sm'}`}>Hủy</button>
        <button type="submit" className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${isModalMaximized ? 'py-2 px-6 text-base' : 'py-1.5 px-4 text-sm'}`}>Lưu thông tin</button>
      </div>
    </form>
  );

  const itemColumns = [
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
    { header: 'STT', render: (row, { index }) => index },
    { header: 'Tên sản phẩm', accessor: 'name', className: 'font-medium text-blue-600 w-68' }, // Increased width
    { 
      header: 'Tồn kho', 
      accessor: 'inventory',
      className: 'w-32', // Changed from w-full to a fixed width
      render: (row) => (
        <span className={`font-bold ${row.inventory > 10 ? 'text-green-600' : 'text-red-500'}`}>
          {row.inventory || 0}
        </span>
      )
    },
    {
      header: <div className="flex justify-center items-center w-full">Hành động</div>,
      className: 'text-center w-[180px]',
      render: (row, { isExpanded, toggleExpand }) => (
        <div className="flex justify-center items-center gap-3">
          <RxDrawingPinFilled
            size={20}
            className={`cursor-pointer transition-colors ${selectedItemIds.includes(row.id) ? 'text-red-500' : 'text-gray-400'} hover:text-red-400`}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedItemIds.includes(row.id)) {
                setSelectedItemIds(prev => prev.filter(id => id !== row.id));
              } else {
                setSelectedItemIds(prev => [...prev, row.id]);
              }
            }}
            data-tooltip-id="select-multiple-users-tooltip"
            data-tooltip-content={selectedItemIds.includes(row.id) ? "Bỏ chọn" : "Chọn xóa nhiều dòng"}
          />

          {selectedItemIds.length < 1 && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <button 
                onClick={(e) => { e.stopPropagation(); handleEditItem(row); }} 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
              >
                Sửa
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteItem(row.id); }} 
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
              >
                Xóa
              </button>
            </div>
            )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6"> {/* Removed bg-white, rounded-lg, shadow-md from here, moved to CustomDatatable */}
      <h2 className="text-2xl font-bold mb-4">Danh sách hàng hóa</h2>
      
      <div className="flex justify-between items-center mb-4 gap-4">
        {/* Thanh tìm kiếm */}
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên hàng hóa"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleBulkDelete}
            disabled={selectedItemIds.length === 0}
            className={`bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all flex items-center gap-2 ${selectedItemIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'shadow-md active:scale-95'}`}
          >
            <Trash2 size={18} />
            Xóa nhiều dòng {selectedItemIds.length > 0 && `(${selectedItemIds.length})`}
          </button>

          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2">
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button onClick={handleAddItem} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors">
            Thêm hàng hóa mới
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-600 p-4">Đang tải dữ liệu hàng hóa...</p>}
      {error && <p className="text-red-600 p-4">Lỗi: {error}</p>}
      {!loading && !error && (
        <CustomDatatable 
          columns={itemColumns} 
          data={filteredItems} 
          renderExpansion={(row) => (
            (() => {
              const filteredStatuses = itemStatuses.filter(s => 
                s.label.toLowerCase().includes(menuSearchQuery.toLowerCase())
              );
              return (
            <div className="py-4 pl-48 pr-6 bg-blue-50/30 border-b border-gray-100 relative">              
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Giá sản phẩm</span>
                  <span className="text-blue-600 font-bold">{row.price?.toLocaleString()} VNĐ</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Danh mục</span>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (openCategoryMenuId !== row.id) setMenuSearchQuery('');
                        setOpenCategoryMenuId(openCategoryMenuId === row.id ? null : row.id);
                        setOpenStatusMenuId(null);
                        setOpenManufactoryMenuId(null);
                        setOpenLocationMenuId(null);
                      }}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none font-medium text-left relative min-h-[26px]"
                    >
                      <span className="truncate block">
                        {categories.find(c => String(c.value) === String(row.category))?.label || '-- Chọn --'}
                      </span>
                      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                        <ChevronDown size={14} />
                      </div>
                    </button>

                    {openCategoryMenuId === row.id && (
                      <div className="absolute left-0 top-full mt-1 w-full min-w-[192px] bg-white rounded-md shadow-2xl z-20 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal">
                        <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                          <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                              placeholder="Lọc danh mục"
                              value={menuSearchQuery}
                              onChange={(e) => setMenuSearchQuery(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                          {categories.filter(cat => cat.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((cat) => (
                            <button
                              key={cat.value}
                              onClick={() => handleCategoryChange(row, cat.value)}
                              className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${
                                String(row.category) === String(cat.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span className="block w-full !whitespace-normal break-words leading-tight">{cat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nơi sản xuất</span>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (openManufactoryMenuId !== row.id) setMenuSearchQuery('');
                        setOpenManufactoryMenuId(openManufactoryMenuId === row.id ? null : row.id);
                        setOpenStatusMenuId(null);
                        setOpenCategoryMenuId(null);
                        setOpenLocationMenuId(null);
                      }}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none font-medium text-left relative min-h-[26px]"
                    >
                      <span className="truncate block">
                      </span>
                      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                        <ChevronDown size={14} />
                      </div>
                    </button>

                    {openManufactoryMenuId === row.id && (
                      <div className="absolute left-0 top-full mt-1 w-full min-w-[192px] bg-white rounded-md shadow-2xl z-20 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal">
                        <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                          <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                              placeholder="Lọc nơi SX"
                              value={menuSearchQuery}
                              onChange={(e) => setMenuSearchQuery(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Chất liệu</span>
                  <span className="text-gray-900 font-medium">{row.material || '---'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thuế</span>
                  <span className="text-gray-900 font-medium">{row.tax}%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cân nặng</span>
                  <span className="text-gray-900 font-medium">{row.weight} kg</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tình trạng</span>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (openStatusMenuId !== row.id) setMenuSearchQuery('');
                        setOpenStatusMenuId(openStatusMenuId === row.id ? null : row.id);
                        setOpenManufactoryMenuId(null);
                        setOpenCategoryMenuId(null);
                        setOpenLocationMenuId(null);
                      }}
                      className={`text-xs font-bold block w-full p-1 pr-8 rounded-lg border border-gray-300 bg-white appearance-none cursor-pointer outline-none text-left relative min-h-[26px] hover:border-blue-400 transition-colors ${String(row.status) === '1' ? 'text-green-600' : 'text-orange-500'}`}
                    >
                      <span className="truncate block">
                        {itemStatuses.find(s => String(s.value) === String(row.status))?.label || '-- Chọn --'}
                      </span>
                      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                        <ChevronDown size={14} />
                      </div>
                    </button>

                    {openStatusMenuId === row.id && (
                      <div className="absolute left-0 top-full mt-1 w-full min-w-[192px] bg-white rounded-md shadow-2xl z-20 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal">
                        <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                          <input
                            type="text"
                            className="w-full pl-2 pr-2 py-0.5 text-[10px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
                            placeholder="Lọc tình trạng"
                            value={menuSearchQuery}
                            onChange={(e) => setMenuSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
                          {filteredStatuses.map((s) => (
                            <button
                              key={s.value}
                              onClick={() => handleStatusChange(row, s.value)}
                              className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.status) === String(s.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <span className="block w-full !whitespace-normal break-words leading-tight">{s.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
              );
            })()
          )}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm hàng hóa mới' : 'Chỉnh sửa hàng hóa'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-xl'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={toggleModalMaximize}
      >
        {itemForm}
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
        onClose={closeNotification} 
      />
    </div>
  );
};
