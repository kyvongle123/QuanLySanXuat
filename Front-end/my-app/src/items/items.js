import React, { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, ChevronDown, ChevronRight, FileUp, FileDown, Trash2, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import { CustomDatatable, Modal, CustomSelect, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { getItems, deleteItem, createItem, updateItem } from '../controller/itemsController';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controller/categoriesController';
import { getItemStatuses } from '../controller/itemStatusesController';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../controller/warehousesController';
import { getWarehouseLocations } from '../controller/warehouseLocationsController';
import { getWarehouseRacks } from '../controller/warehouseRacksController';
import { getWarehouseTypes } from '../controller/warehouseTypesController';
import { getWarehouseStatuses } from '../controller/warehouseStatusesController';
import { BsLayoutSidebarInset, BsLayoutSidebarInsetReverse } from "react-icons/bs";
import { VscLayoutSidebarLeftDock, VscLayoutSidebarRightDock } from "react-icons/vsc";
import { RxDrawingPinFilled } from "react-icons/rx";
import { LuSquarePen } from "react-icons/lu";

export const Items = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
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

  // States cho quản lý danh mục
  const [isCategoryMgmtModalOpen, setIsCategoryMgmtModalOpen] = useState(false);
  const [isCategoryMgmtMaximized, setIsCategoryMgmtMaximized] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryEditModalOpen, setIsCategoryEditModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState('add'); // 'add' or 'edit'
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '' });
  const [isCategoryEditMaximized, setIsCategoryEditMaximized] = useState(false);

  // States cho quản lý Nhà kho (Warehouses)
  const [isWarehousesModalOpen, setIsWarehousesModalOpen] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState('');
  const [warehouseModalMode, setWarehouseModalMode] = useState('list'); // 'list', 'add', 'edit'
  const [isWarehousesMgmtMaximized, setIsWarehousesMgmtMaximized] = useState(false);
  const [isWarehouseEditModalOpen, setIsWarehouseEditModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState({ name: '', code: '', type: '', status: '', location: '' });
  const [warehousesRawData, setWarehousesRawData] = useState([]);
  const [warehouseTypes, setWarehouseTypes] = useState([]);
  const [warehouseStatuses, setWarehouseStatuses] = useState([]);
  const [warehouseLocations, setWarehouseLocations] = useState([]);

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
      const warehouseLabel = warehouses.find(w => String(w.value) === String(item.location))?.label || '';
      return (
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoryLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        statusLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouseLabel.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [items, searchTerm, categories, itemStatuses, warehouses]);

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

    const fetchWarehouses = async () => {
      try {
        const [warehousesData, locationData, rackData, typesData, statusesData] = await Promise.all([
          getWarehouses(),
          getWarehouseLocations(),
          getWarehouseRacks(),
          getWarehouseTypes(),
          getWarehouseStatuses()
        ]);

        setWarehousesRawData(warehousesData);
        setWarehouseTypes(typesData.map(wt => ({ value: wt.id, label: wt.name })));
        setWarehouseStatuses(statusesData.map(ws => ({ value: ws.id, label: ws.name })));
        setWarehouseLocations(locationData.map(l => ({ value: l.id, label: `Bin ${l.bin} - Tầng ${l.level}` })));

        // Lọc những nhà kho có type === 1 và thiết kế lại label dựa trên vị trí
        const mappedWarehouses = warehousesData
          .filter(w => (w.type || w.Type) === 1)
          .map(w => {
            const locId = w.location || w.Location;
            const loc = locationData.find(l => String(l.id || l.ID) === String(locId));
            let label = 'N/A';

            if (loc) {
              const rackId = loc.racks || loc.Racks;
              const rackObj = rackData.find(r => String(r.id || r.ID) === String(rackId));
              const rackName = rackObj ? (rackObj.name || rackObj.Name) : rackId;
              const level = loc.level || loc.Level;
              const bin = loc.bin || loc.Bin;
              label = `Kho hàng hóa: Kệ ${rackName} - Tầng ${level} - Ô ${bin}`;
            }
            return { value: w.id || w.ID, label };
          });
        setWarehouses(mappedWarehouses);
      } catch (err) {
        console.error("Error fetching warehouses:", err);
      }
    };
    fetchWarehouses();
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
    } else if (type === 'deleteCategory') {
      try {
        await deleteCategory(id);
        const data = await getCategories();
        setCategories(data.map(c => ({ value: c.id, label: c.name })));
        showNotification("Danh mục đã được xóa thành công!");
      } catch (err) {
        console.error("Error deleting category:", err);
        showNotification("Lỗi khi xóa danh mục. Có thể danh mục đang được sử dụng.", "error");
      }
    } else if (type === 'deleteWarehouse') {
      try {
        await deleteWarehouse(id);
        showNotification("Đã xóa nhà kho!");
        const data = await getWarehouses();
        setWarehousesRawData(data);
      } catch (err) {
        console.error("Error deleting category:", err);
        showNotification("Lỗi khi xóa danh mục. Có thể danh mục đang được sử dụng.", "error");
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

  const handleOpenCategoryEdit = (mode, category = null) => {
    setCategoryModalMode(mode);
    setCategoryForm(category ? { id: category.value, name: category.label } : { id: null, name: '' });
    setIsCategoryEditModalOpen(true);
    setIsCategoryEditMaximized(false);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    try {
      if (categoryModalMode === 'add') {
        await createCategory({ Name: categoryForm.name });
        showNotification("Thêm danh mục thành công");
      } else {
        await updateCategory(categoryForm.id, { ID: categoryForm.id, Name: categoryForm.name });
        showNotification("Cập nhật danh mục thành công");
      }
      setIsCategoryEditModalOpen(false);
      const data = await getCategories();
      setCategories(data.map(c => ({ value: c.id, label: c.name })));
    } catch (err) {
      showNotification("Lỗi khi xử lý dữ liệu danh mục.", "error");
    }
  };

  const handleDeleteWarehouse = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhà kho này?")) {
      try {
        await deleteWarehouse(id);
        showNotification("Đã xóa nhà kho!");
      } catch (err) {
        console.error("Error deleting warehouse:", err);
        showNotification("Lỗi khi xóa nhà kho", "error");
      }
    }
  };

  const warehouseTableColumns = useMemo(() => [
    { header: 'STT', render: (_, { index }) => index },
    {
      header: 'Loại kho',
      render: (row) => warehouseTypes.find(wt => String(wt.value) === String(row.type))?.label || 'N/A'
    },
    {
      header: 'Vị trí',
      render: (row) => warehouseLocations.find(wl => String(wl.value) === String(row.location))?.label || 'N/A'
    },
    {
      header: 'Hành động',
      className: 'text-right pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setEditingWarehouse(row); setWarehouseModalMode('edit'); setIsWarehouseEditModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >Sửa</button>
          <button
            onClick={() => handleDeleteWarehouse(row.id)}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >Xóa</button>
        </div>
      )
    }
  ], [warehouseTypes, warehouseStatuses, warehouseLocations, handleDeleteWarehouse]);

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingWarehouse,
        type: editingWarehouse.type === '' ? null : parseInt(editingWarehouse.type),
        status: editingWarehouse.status === '' ? null : parseInt(editingWarehouse.status),
        location: editingWarehouse.location === '' ? null : parseInt(editingWarehouse.location),
      };
      if (warehouseModalMode === 'add') {
        await createWarehouse(payload);
        showNotification("Thêm nhà kho thành công!");
      } else {
        await updateWarehouse(editingWarehouse.id, payload);
        showNotification("Cập nhật nhà kho thành công!");
      }
      setIsWarehouseEditModalOpen(false);
      const data = await getWarehouses();
      setWarehousesRawData(data);
    } catch (err) {
      showNotification("Lỗi khi lưu nhà kho", "error");
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
        { header: 'Tên sản phẩm', key: 'name', width: 30 },
        { header: 'Danh mục', key: 'category', width: 25 },
        { header: 'Giá', key: 'price', width: 15 },
        { header: 'Tồn kho', key: 'inventory', width: 12 },
        { header: 'Thuế', key: 'tax', width: 10 },
        { header: 'Cân nặng', key: 'weight', width: 15 },
        { header: 'Vị trí', key: 'location', width: 40 },
      ];

      // Đổ dữ liệu vào rows và xử lý mapping label
      filteredItems.forEach((item) => {
        const categoryLabel = categories.find(c => String(c.value) === String(item.category))?.label || '';
        const statusLabel = itemStatuses.find(s => String(s.value) === String(item.status))?.label || '';
        const warehouseLabel = warehouses.find(w => String(w.value) === String(item.location))?.label || '';

        worksheet.addRow({
          name: item.name,
          category: categoryLabel,
          price: item.price,
          inventory: item.inventory,
          tax: item.tax,
          weight: item.weight,
          status: statusLabel,
          location: warehouseLabel,
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
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCategoryMgmtModalOpen(true)}
            className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-[11px] font-bold underline z-10"
          >
            hiệu chỉnh
          </button>
          <CustomSelect
            label="Danh mục"
            name="category"
            value={currentEditingItem?.category || ''}
            onChange={handleModalInputChange}
            options={[...categories]}
            isModalMaximized={isModalMaximized}
          />
        </div>
        <div>
          <label htmlFor="inventory" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Số lượng tồn</label>
          <input type="number" id="inventory" name="inventory" value={currentEditingItem?.inventory || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
        </div>
      </div>
      <div>
        <label htmlFor="description" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Mô tả</label>
        <textarea id="description" name="description" value={currentEditingItem?.description || ''} onChange={handleModalInputChange} rows={isModalMaximized ? "3" : "2"} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}></textarea>
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
      <div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsWarehousesModalOpen(true)}
            className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-[11px] font-bold underline z-10"
          >
            hiệu chỉnh
          </button>
          <CustomSelect
            label="Vị trí (Nhà kho)"
            name="location"
            value={currentEditingItem?.location || ''}
            onChange={handleModalInputChange}
            options={[...warehouses]}
            isModalMaximized={isModalMaximized}
            placement="top"
          />
        </div>
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
    { header: 'STT', className: 'w-[50px] text-center', render: (row, { index }) => index },
    { header: 'Tên sản phẩm', accessor: 'name', className: 'font-medium text-blue-600 w-[180px]' },
    {
      header: 'Danh mục',
      className: 'w-[180px]',
      render: (row) => (
        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsCategoryMgmtModalOpen(true) }}
            className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
          >
            hiệu chỉnh
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (openCategoryMenuId !== row.id) setMenuSearchQuery('');
              setOpenCategoryMenuId(openCategoryMenuId === row.id ? null : row.id);
              setOpenStatusMenuId(null);
              setOpenManufactoryMenuId(null);
              setOpenLocationMenuId(null);
            }}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-[11px] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none font-medium text-left relative min-h-[26px] hover:border-blue-400 transition-colors"
          >
            <span className="truncate block">
              {categories.find(c => String(c.value) === String(row.category))?.label || '-- Chọn --'}
            </span>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
              <ChevronDown size={14} />
            </div>
          </button>

          {openCategoryMenuId === row.id && (
            <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-md shadow-2xl z-20 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal z-[1000]">
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
                    className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.category) === String(cat.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <span className="block w-full !whitespace-normal break-words leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Giá (VNĐ)',
      className: 'w-[120px] text-left',
      render: (row) => (
        <span className="text-gray-700 font-semibold text-sm">
          {row.price?.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Tồn kho',
      accessor: 'inventory',
      className: 'w-[100px] text-center',
      render: (row) => (
        <span>
          {row.inventory || 0}
        </span>
      )
    },
    {
      header: <div className="flex justify-center items-center w-full">Hành động</div>,
      className: 'text-center w-[180px]',
      render: (row, { isExpanded, toggleExpand }) => (
        <div className="flex justify-center items-center gap-3">
          {/* <RxDrawingPinFilled
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
          /> */}

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

  const categoryMgmtColumns = [
    { header: 'STT', render: (_, { index }) => index },
    { header: 'Tên danh mục', render: (row) => <span className="font-bold text-gray-700">{row.label}</span> },
    {
      header: 'Hành động',
      className: 'text-right pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleOpenCategoryEdit('edit', row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors">Sửa</button>
          <button
            onClick={() => setConfirmModal({
              isOpen: true,
              id: row.value,
              type: 'deleteCategory',
              title: 'Xác nhận xóa',
              message: `Bạn có chắc chắn muốn xóa danh mục "${row.label}"?`
            })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
          >
            Xóa
          </button>
        </div>
      )
    }
  ];

  const filteredCategoriesForMgmt = useMemo(() => {
    return categories.filter(cat =>
      cat.label.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  return (
    <div className="p-6"> {/* Removed bg-white, rounded-lg, shadow-md from here, moved to CustomDatatable */}
      <h2 className="text-2xl font-bold mb-4">Danh sách thành phẩm</h2>

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
          {/* <button
            onClick={handleBulkDelete}
            disabled={selectedItemIds.length === 0}
            className={`bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all flex items-center gap-2 ${selectedItemIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'shadow-md active:scale-95'}`}
          >
            <Trash2 size={18} />
            Xóa nhiều dòng {selectedItemIds.length > 0 && `(${selectedItemIds.length})`}
          </button> */}

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
                <div className="py-4 pl-40 pr-6 bg-blue-50/30 border-b border-gray-100 relative">
                  <div className="flex flex-wrap md:flex-nowrap items-end gap-x-[140px] gap-y-4 text-sm">
                    {/* Cột 1: Vị trí */}
                    <div className="flex flex-col gap-1 w-full md:w-64 flex-none">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vị trí</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setIsWarehousesModalOpen(true); }}
                          className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
                        >
                          hiệu chỉnh
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openLocationMenuId !== row.id) setMenuSearchQuery('');
                            setOpenLocationMenuId(openLocationMenuId === row.id ? null : row.id);
                            setOpenStatusMenuId(null);
                            setOpenManufactoryMenuId(null);
                            setOpenCategoryMenuId(null);
                          }}
                          className="text-xs font-bold block w-full p-1 pr-8 rounded-lg border border-gray-300 bg-white appearance-none cursor-pointer outline-none text-left relative min-h-[26px] hover:border-blue-400 transition-colors text-blue-600"
                        >
                          <span className="truncate block">
                            {warehouses.find(w => String(w.value) === String(row.location))?.label || '-- Chọn --'}
                          </span>
                          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                            <ChevronDown size={14} />
                          </div>
                        </button>

                        {openLocationMenuId === row.id && (
                          <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-md shadow-2xl z-20 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal">
                            <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                              <div className="relative">
                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
                                  placeholder="Lọc vị trí"
                                  value={menuSearchQuery}
                                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
                              {warehouses.filter(w => w.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((w) => (
                                <button
                                  key={w.value}
                                  onClick={() => handleLocationChange(row, w.value)}
                                  className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.location) === String(w.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                  <span className="block w-full !whitespace-normal break-words leading-tight">{w.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cột 2: Cân nặng */}
                    <div className="flex flex-col gap-1 whitespace-nowrap flex-none">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cân nặng</span>
                      <span className="text-gray-900 font-medium">{row.weight} kg</span>
                    </div>

                    {/* Cột 3: Thuế */}
                    <div className="flex flex-col gap-1 whitespace-nowrap flex-none">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thuế</span>
                      <span className="text-gray-900 font-medium">{row.tax}%</span>
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

      {/* Modal Quản lý danh mục */}
      <Modal
        isOpen={isCategoryMgmtModalOpen}
        onClose={() => { setIsCategoryMgmtModalOpen(false); setIsCategoryMgmtMaximized(false); }}
        title="Danh sách danh mục sản phẩm"
        maxWidth={isCategoryMgmtMaximized ? "max-w-full" : "max-w-4xl"}
        isMaximized={isCategoryMgmtMaximized}
        onMaximizeToggle={() => setIsCategoryMgmtMaximized(!isCategoryMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px] w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên danh mục..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
            </div>
            <button onClick={() => handleOpenCategoryEdit('add')} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors">
              <Plus size={16} /> Thêm danh mục
            </button>
          </div>
          <div className={`${isCategoryMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm`}>
            <CustomDatatable columns={categoryMgmtColumns} data={filteredCategoriesForMgmt} />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Danh mục */}
      <Modal isOpen={isCategoryEditModalOpen} onClose={() => setIsCategoryEditModalOpen(false)} title={categoryModalMode === 'add' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'} maxWidth="max-w-sm">
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Tên danh mục</label>
            <input
              type="text"
              value={categoryForm.name || ''}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsCategoryEditModalOpen(false)} className="bg-gray-500 text-white px-4 py-1.5 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm font-bold">Lưu</button>
          </div>
        </form>
      </Modal>

      {/* Modal quản lý Nhà kho */}
      <Modal
        isOpen={isWarehousesModalOpen}
        onClose={() => { setIsWarehousesModalOpen(false); setIsWarehousesMgmtMaximized(false); }}
        title="Danh sách nhà kho"
        maxWidth={isWarehousesMgmtMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isWarehousesMgmtMaximized}
        onMaximizeToggle={() => setIsWarehousesMgmtMaximized(!isWarehousesMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px] flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên hoặc mã kho..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={warehouseSearchTerm}
                onChange={(e) => setWarehouseSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => { setEditingWarehouse({ name: '', code: '', type: '', status: '', location: '' }); setWarehouseModalMode('add'); setIsWarehouseEditModalOpen(true); }} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              <Plus size={16} /> Thêm nhà kho
            </button>
          </div>
          <div className={`${isWarehousesMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}> {/* This is the div for the CustomDatatable */}
            <CustomDatatable columns={warehouseTableColumns} data={warehousesRawData.filter(w => (w.name || '').toLowerCase().includes(warehouseSearchTerm.toLowerCase()) || (w.code || '').toLowerCase().includes(warehouseSearchTerm.toLowerCase()))} />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Nhà kho */}
      <Modal
        isOpen={isWarehouseEditModalOpen}
        onClose={() => setIsWarehouseEditModalOpen(false)}
        title={warehouseModalMode === 'add' ? "Thêm nhà kho mới" : "Chỉnh sửa nhà kho"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleWarehouseSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Mã kho <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={editingWarehouse.code} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, code: e.target.value })} required autoFocus />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Tên kho <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={editingWarehouse.name} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, name: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Loại kho</label>
              <CustomSelect value={editingWarehouse.type || ''} options={warehouseTypes} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, type: e.target.value })} name="type" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Trạng thái</label>
              <CustomSelect value={editingWarehouse.status || ''} options={warehouseStatuses} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, status: e.target.value })} name="status" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsWarehouseEditModalOpen(false)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">Hủy bỏ</button>
            <button type="submit" className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 text-sm">Lưu thông tin</button>
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
        onClose={closeNotification}
      />
    </div>
  );
};
