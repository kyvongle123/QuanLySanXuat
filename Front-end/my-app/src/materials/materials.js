import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Plus, FileDown, ChevronDown, FileUp, ChevronRight, Trash2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect } from '../customComponent/customComponent';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../controller/materialsController';
import { getMaterialCategories, createMaterialCategory, updateMaterialCategory, deleteMaterialCategory } from '../controller/materialCategoriesController';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../controller/warehousesController';
import { getWarehouseLocations } from '../controller/warehouseLocationsController';
import { getWarehouseRacks } from '../controller/warehouseRacksController';
import { getWarehouseTypes } from '../controller/warehouseTypesController';
import { getWarehouseStatuses } from '../controller/warehouseStatusesController';
import { getUnits } from '../controller/unitsController';
import { LuSquarePen } from "react-icons/lu";
import { getWarehouseBins } from '../controller/warehouseBinsController';

export const Material = () => {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ name: '', materialCategory: '', quantity: 0, unit: '', location: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [importingStates, setImportingStates] = useState({}); // { [materialId]: quantityString }

  // States cho quản lý Danh mục nguyên liệu
  const [isCategoryMgmtModalOpen, setIsCategoryMgmtModalOpen] = useState(false);
  const [isCategoryMgmtMaximized, setIsCategoryMgmtMaximized] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryEditModalOpen, setIsCategoryEditModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState('add');
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '', unit: '' });
  const [isCategoryEditMaximized, setIsCategoryEditMaximized] = useState(false);

  // States cho quản lý Nhà kho
  const [warehouses, setWarehouses] = useState([]);
  const [openLocationMenuId, setOpenLocationMenuId] = useState(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [openTypeMenuId, setOpenTypeMenuId] = useState(null);
  const [typeMenuSearchQuery, setTypeMenuSearchQuery] = useState('');
  const [isWarehousesModalOpen, setIsWarehousesModalOpen] = useState(false);
  const [isLocMgmtOpen, setIsLocMgmtOpen] = useState(false);
  const [isLocMgmtMaximized, setIsLocMgmtMaximized] = useState(false);
  const [isWarehousesMgmtMaximized, setIsWarehousesMgmtMaximized] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState('');
  const [warehousesRawData, setWarehousesRawData] = useState([]);
  const [warehouseTypes, setWarehouseTypes] = useState([]);
  const [warehouseStatuses, setWarehouseStatuses] = useState([]);
  const [warehouseLocations, setWarehouseLocations] = useState([]);
  const [warehouseRacks, setWarehouseRacks] = useState([]);
  const [warehouseBins, setWarehouseBins] = useState([]);
  const [isWarehouseEditModalOpen, setIsWarehouseEditModalOpen] = useState(false);
  const [warehouseModalMode, setWarehouseModalMode] = useState('list');
  const [units, setUnits] = useState([]);
  const [editingWarehouse, setEditingWarehouse] = useState({ name: '', code: '', type: '', status: '', location: '' });

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  // Lắng nghe sự kiện click toàn cục để đóng menu khi bấm ra ngoài
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenLocationMenuId(null);
      setOpenTypeMenuId(null);
      setMenuSearchQuery('');
      setTypeMenuSearchQuery('');
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [materialData, catData, warehousesData, locationData, rackData, typesData, statusesData, unitsData, binData] = await Promise.all([
          getMaterials(),
          getMaterialCategories(),
          getWarehouses(),
          getWarehouseLocations(),
          getWarehouseRacks(),
          getWarehouseTypes(),
          getWarehouseStatuses(),
          getUnits(),
          getWarehouseBins()
        ]);
        setMaterials(materialData);
        setCategories(catData.map(c => ({ value: c.id, label: c.name, unit: c.unit })));
        setUnits(unitsData.map(u => ({ value: u.name || u.Name, label: u.name || u.Name })));

        setWarehousesRawData(warehousesData);
        setWarehouseTypes(typesData.map(wt => ({ value: wt.id, label: wt.name })));
        setWarehouseStatuses(statusesData.map(ws => ({ value: ws.id, label: ws.name })));
        setWarehouseLocations(locationData.map(l => {
          const rackObj = rackData.find(r => String(r.id || r.ID) === String(l.racks || l.Racks));
          const rackName = rackObj ? (rackObj.name || rackObj.Name) : (l.racks || l.Racks);
          const binObj = binData.find(b => String(b.id || b.ID) === String(l.bin || l.Bin));
          const binName = binObj ? (binObj.name || binObj.Name) : (l.bin || l.Bin);
          return {
            value: l.id || l.ID,
            label: `Kệ ${rackName} - Tầng ${l.level || l.Level} - Ô ${binName}`
          };
        }));
        setWarehouseRacks(rackData);
        setWarehouseBins(binData);
      } catch (err) {
        showNotification("Lỗi khi tải dữ liệu", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Tự động tính toán danh sách tùy chọn nhà kho dựa trên dữ liệu thô từ Backend
  const warehouseOptions = useMemo(() => {
    return warehousesRawData
      .filter(w => (w.type || w.Type) === 2) // Chỉ lấy các kho có loại là Nguyên liệu (Type 2)
      .map(w => {
        const locId = w.location || w.Location;
        const loc = warehouseLocations.find(l => String(l.id || l.ID) === String(locId));
        let label = w.name || 'N/A';

        if (loc) {
          const rackId = loc.racks || loc.Racks;
          const rackObj = warehouseRacks.find(r => String(r.id || r.ID) === String(rackId));
          const rackName = rackObj ? (rackObj.name || rackObj.Name) : rackId;
          const level = loc.level || loc.Level;
          const binObj = warehouseBins.find(b => String(b.id || b.ID) === String(loc.bin || loc.Bin));
          const binName = binObj ? (binObj.name || binObj.Name) : (loc.bin || loc.Bin);
          label = `Kho nguyên liệu: Kệ ${rackName} - Tầng ${level} - Ô ${binName}`;
        }
        return { value: w.id || w.ID, label };
      });
  }, [warehousesRawData, warehouseLocations, warehouseRacks, warehouseBins]);

  const filteredData = useMemo(() => {
    return materials.filter(m => {
      const catLabel = categories.find(c => String(c.value) === String(m.name))?.label || '';
      const warehouseLabel = warehouseOptions.find(w => String(w.value) === String(m.location))?.label || '';
      return (
        catLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouseLabel.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [materials, searchTerm, categories, warehouses]);

  const handleOpenCategoryEdit = (mode, category = null) => {
    setCategoryModalMode(mode);
    setCategoryForm(category ? { id: category.value, name: category.label, unit: category.unit } : { id: null, name: '', unit: '' });
    setIsCategoryEditModalOpen(true);
    setIsCategoryEditMaximized(false);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    try {
      if (categoryModalMode === 'add') {
        await createMaterialCategory({ Name: categoryForm.name, Unit: categoryForm.unit });
        showNotification("Thêm danh mục thành công");
      } else {
        await updateMaterialCategory(categoryForm.id, { ID: categoryForm.id, Name: categoryForm.name, Unit: categoryForm.unit });
        showNotification("Cập nhật danh mục thành công");
      }
      setIsCategoryEditModalOpen(false);
      const catData = await getMaterialCategories();
      setCategories(catData.map(c => ({ value: c.id, label: c.name, unit: c.unit })));
    } catch (err) {
      showNotification("Lỗi khi xử lý dữ liệu danh mục.", "error");
    }
  };

  const handleLocationChange = async (material, newLocationId) => {
    try {
      const updatedValue = newLocationId === "" ? null : parseInt(newLocationId);
      const updated = await updateMaterial(material.id, { ...material, location: updatedValue });
      setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
      setOpenLocationMenuId(null);
      showNotification("Cập nhật vị trí thành công!");
    } catch (err) {
      console.error("Error updating location:", err);
      showNotification("Lỗi khi cập nhật vị trí.", "error");
    }
  };

  const handleWarehouseLocationChange = async (warehouse, newLocationId) => {
    const payload = {
      ...warehouse,
      location: parseInt(newLocationId),
      Location: parseInt(newLocationId)
    };

    try {
      await updateWarehouse(warehouse.id, payload);
      setWarehousesRawData(prev => prev.map(w => (w.id || w.ID) === warehouse.id ? { ...w, location: parseInt(newLocationId), Location: parseInt(newLocationId) } : w));
      showNotification("Cập nhật vị trí kho thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật vị trí kho.", "error");
    }
  };

  const handleWarehouseTypeChange = async (warehouse, newTypeId) => {
    const payload = {
      ...warehouse,
      type: parseInt(newTypeId),
      Type: parseInt(newTypeId)
    };

    try {
      await updateWarehouse(warehouse.id, payload);
      setWarehousesRawData(prev => prev.map(w => (w.id || w.ID) === warehouse.id ? { ...w, type: parseInt(newTypeId), Type: parseInt(newTypeId) } : w));
      showNotification("Cập nhật loại kho thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật loại kho.", "error");
    }
  };

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editingWarehouse };
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

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ name: '', quantity: 0, unit: '', location: '' });
    setIsModalOpen(true);
    setImportingStates({}); // Thoát tất cả chế độ nhập hàng khi mở modal
  };

  const handleEditItem = (material) => {
    setModalMode('edit');
    setCurrentEditingItem({ ...material });
    setIsModalOpen(true);
    setImportingStates({}); // Thoát tất cả chế độ nhập hàng khi mở modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...currentEditingItem,
      name: currentEditingItem.name ? parseInt(currentEditingItem.name) : null,
      quantity: parseInt(currentEditingItem.quantity) || 0,
      location: currentEditingItem.location ? parseInt(currentEditingItem.location) : ''
    };

    try {
      if (modalMode === 'add') {
        const newItem = await createMaterial(payload);
        setMaterials(prev => [...prev, newItem]);
        showNotification("Thêm nguyên liệu thành công!");
      } else {
        const updated = await updateMaterial(currentEditingItem.id, payload);
        setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
        showNotification("Cập nhật nguyên liệu thành công!");
      }
      handleCloseModal();
    } catch (err) {
      showNotification("Có lỗi xảy ra khi lưu dữ liệu.", "error");
    }
  };

  const handleStartImport = (material) => {
    // Thêm ID của nguyên liệu vào object trạng thái nhập, giữ nguyên các dòng khác đang mở
    setImportingStates(prev => ({ ...prev, [material.id]: '' }));
  };

  const handleCancelImport = (id) => {
    // Chỉ xóa trạng thái nhập của dòng cụ thể
    setImportingStates(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const handleUpdateImport = async (material) => {
    const qtyString = importingStates[material.id];
    if (!qtyString || isNaN(parseFloat(qtyString)) || parseFloat(qtyString) <= 0) {
      showNotification("Vui lòng nhập số lượng hợp lệ để nhập hàng.", "error");
      return;
    }

    const quantityToAdd = parseFloat(qtyString);
    const newTotalQuantity = material.quantity + quantityToAdd;

    const payload = { ...material, quantity: newTotalQuantity };

    try {
      const updated = await updateMaterial(material.id, payload);
      setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
      showNotification("Nhập nguyên liệu thành công!", "success");
      handleCancelImport(material.id); // Chỉ thoát chế độ nhập cho dòng vừa cập nhật
    } catch (err) {
      showNotification("Lỗi khi cập nhật số lượng nguyên liệu.", "error");
    }
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách nguyên liệu ra tệp Excel không?'
    });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách nguyên liệu');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Tên nguyên liệu', key: 'name', width: 30 },
        { header: 'Vị trí', key: 'location', width: 45 },
        { header: 'Số lượng', key: 'quantity', width: 15 },
        { header: 'Đơn vị', key: 'unit', width: 10 },
      ];

      filteredData.forEach((material, index) => {
        const categoryLabel = categories.find(c => String(c.value) === String(material.name))?.label || 'N/A';
        const warehouseLabel = warehouses.find(w => String(w.value) === String(material.location))?.label || 'N/A';

        worksheet.addRow({
          stt: index + 1,
          name: categoryLabel, // Tên nguyên liệu thực chất là tên danh mục
          category: categories.find(c => String(c.value) === String(material.materialCategory))?.label || 'N/A',
          location: warehouseLabel,
          quantity: material.quantity,
          unit: material.unit,
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        // Chiều cao dòng: Header 30px, Body 25px
        if (rowNumber === 1) {
          row.height = 30;
        } else {
          // Đặt height là undefined để Excel tự động mở rộng chiều cao dòng khi văn bản (Vị trí) bị xuống dòng
          row.height = undefined;
        }

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          // Căn giữa cột STT
          if (colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        });

        if (rowNumber === 1) {
          row.font = { name: 'Times New Roman', size: 12, bold: true };
          row.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách nguyên liệu.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  // Cập nhật handleConfirmAction để xử lý cả export
  const handleConfirmAction = async () => {
    if (confirmModal.type === 'export') {
      await handleExportExcel();
    } else if (confirmModal.type === 'delete') {
      try {
        await deleteMaterial(confirmModal.id);
        setMaterials(prev => prev.filter(m => m.id !== confirmModal.id));
        showNotification("Xóa nguyên liệu thành công!", "success");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    } else if (confirmModal.type === 'deleteWarehouse') {
      try {
        await deleteWarehouse(confirmModal.id);
        showNotification("Đã xóa nhà kho!");
        const data = await getWarehouses(); // Re-fetch to update the list
        setWarehousesRawData(data);
      } catch (err) {
        console.error("Error deleting warehouse:", err);
        showNotification("Lỗi khi xóa nhà kho", "error");
      }
    } else if (confirmModal.type === 'deleteCategory') {
      try {
        await deleteMaterialCategory(confirmModal.id);
        const data = await getMaterialCategories();
        setCategories(data.map(c => ({ value: c.id, label: c.name, unit: c.unit })));
        showNotification("Xóa danh mục thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  // Định nghĩa cột cho bảng danh sách Nhà kho
  const warehouseTableColumns = useMemo(() => [
    {
      header: '',
      headerCellClassName: 'sm:hidden',
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
      className: 'sm:hidden w-[20px] !px-1 sm:!px-6 text-center',
    },
    {
      header: 'STT',
      className: '!px-1 sm:!px-6',
      render: (_, { index }) => index
    },
    {
      header: 'Vị trí',
      className: 'w-40 sm:w-64 !px-1 sm:!px-6',
      headerCellClassName: 'text-[10px] sm:text-sm',
      render: (row) => (
        // <div className="relative">
        //   <button
        //     type="button"
        //     onClick={(e) => { e.stopPropagation(); setIsLocMgmtOpen(true); }}
        //     className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
        //   >
        //     hiệu chỉnh
        //   </button>
        //   <CustomSelect
        //     label="" // Label được xử lý bởi header cột
        //     options={warehouseLocations}
        //     value={row.location}
        //     onChange={(e) => handleWarehouseLocationChange(row, e.target.value)}
        //     className="text-[11px] font-bold block w-full p-1 pr-8 rounded-lg border border-gray-300 bg-white appearance-none cursor-pointer outline-none text-left relative min-h-[26px] hover:border-blue-400 transition-colors text-blue-600"
        //   // CustomSelect tự quản lý trạng thái mở/đóng và tìm kiếm nội bộ
        //   />
        // </div>
        <div className={`relative ${openLocationMenuId === row.id ? 'z-30' : 'z-10'}`}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsLocMgmtOpen(true); }}
            className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
          >
            hiệu chỉnh
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (openLocationMenuId !== row.id) setMenuSearchQuery('');
              setOpenLocationMenuId(openLocationMenuId === row.id ? null : row.id);
            }}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-[11px] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none text-left relative min-h-[26px] font-bold text-blue-600"
          >
            <span className="truncate block">
              {warehouseLocations.find(s => String(s.value) === String(row.location || row.Location))?.label || '-- Chọn vị trí --'}
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
                    placeholder="Tìm nhanh vị trí..."
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
                {warehouseLocations.filter(s => s.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleLocationChange(row, s.value)}
                    className={`px-2 py-1.5 text-[10px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.location || row.Location) === String(s.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <span className="block w-full !whitespace-normal break-words leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Loại kho',
      className: 'hidden sm:table-cell w-32 sm:w-48 !px-1 sm:!px-6',
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm',
      render: (row) => {
        const rowId = row.id || row.ID;
        const isOpen = openTypeMenuId === rowId;
        const currentType = warehouseTypes.find(t => String(t.value) === String(row.type));

        return (
          <div className={`relative ${isOpen ? 'z-30' : 'z-10'}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (openTypeMenuId !== rowId) setTypeMenuSearchQuery('');
                setOpenTypeMenuId(isOpen ? null : rowId);
              }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-[9px] sm:text-[11px] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none text-left relative min-h-[26px] font-bold text-gray-700"
            >
              <span className="truncate block">
                {currentType?.label || '-- Chọn loại --'}
              </span>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </button>

            {isOpen && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal">
                <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
                      placeholder="Tìm nhanh..."
                      value={typeMenuSearchQuery}
                      onChange={(e) => setTypeMenuSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
                  {warehouseTypes.filter(t => t.label.toLowerCase().includes(typeMenuSearchQuery.toLowerCase())).map((t) => (
                    <button
                      key={t.value}
                      onClick={() => {
                        handleWarehouseTypeChange(row, t.value);
                        setOpenTypeMenuId(null);
                      }}
                      className={`px-2 py-1.5 text-[10px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.type) === String(t.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className="block w-full truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Hành động',
      className: 'text-right pr-5 !px-3 sm:!px-6',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setEditingWarehouse(row); setWarehouseModalMode('edit'); setIsWarehouseEditModalOpen(true); }}
            className="bg-blue-600 px-2 sm:px-3 hover:bg-blue-700 text-white font-bold py-1 rounded text-xs transition-all active:scale-95"
          >Sửa</button>
          <button
            onClick={() => setConfirmModal({
              isOpen: true, id: row.id, type: 'deleteWarehouse', title: 'Xác nhận xóa kho', message: `Bạn có chắc chắn muốn xóa kho "${row.name}"?`
            })}
            className="bg-red-500 px-2 sm:px-3 hover:bg-red-700 text-white font-bold py-1 rounded text-xs transition-all active:scale-95"
          >Xóa</button>
        </div>
      )
    }
  ], [warehouseTypes, warehouseLocations, setEditingWarehouse, setWarehouseModalMode, setIsWarehouseEditModalOpen, setConfirmModal, handleWarehouseLocationChange, setIsLocMgmtOpen]);

  const categoryMgmtColumns = [
    { header: 'STT', className: 'text-[11px] sm:text-sm !px-2', headerCellClassName: 'text-[10px] sm:text-xs', render: (_, { index }) => index },
    { header: <><span className="hidden sm:inline">Tên danh mục</span><span className="sm:hidden">Tên</span></>, className: 'text-[11px] sm:text-sm !px-2', headerCellClassName: 'text-[10px] sm:text-xs', render: (row) => <span className="font-bold text-gray-700">{row.label}</span> },
    {
      header: <><span className="hidden sm:inline">Đơn vị tính</span><span className="sm:hidden">Đơn vị</span></>,
      className: 'text-[11px] sm:text-sm !px-2',
      headerCellClassName: 'text-[10px] sm:text-xs',
      render: (row) => <span className="text-gray-600">{row.unit || 'N/A'}</span>
    },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleOpenCategoryEdit('edit', row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95">Sửa</button>
          <button
            onClick={() => setConfirmModal({
              isOpen: true,
              id: row.value,
              type: 'deleteCategory',
              title: 'Xác nhận xóa',
              message: `Bạn có chắc chắn muốn xóa danh mục "${row.label}"?`
            })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95"
          >
            Xóa
          </button>
        </div>
      )
    }
  ];

  const columns = [
    {
      header: '',
      headerCellClassName: 'sm:hidden', // Chỉ hiển thị trên mobile
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
      className: 'sm:hidden w-[20px] !px-2 text-center', // Chỉ hiển thị trên mobile
    },
    { header: 'STT', className: 'w-[30px] sm:w-[50px] !px-2 sm:!px-4 text-center', headerCellClassName: 'text-[10px] sm:text-sm', render: (row, { index }) => index },
    {
      header: 'Tên nguyên liệu',
      headerCellClassName: 'text-[10px] sm:text-sm',
      className: 'min-w-[120px] sm:min-w-[200px] !px-2 sm:!px-6 text-[11px] sm:text-sm',
      accessor: 'name',
      render: (row) => categories.find(c => String(c.value) === String(row.name))?.label || 'N/A'
    },
    {
      header: 'Số lượng',
      accessor: 'quantity',
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm',
      className: 'hidden sm:table-cell min-w-[200px] text-sm',
      render: (row) => (
        <div className="flex items-center gap-1">
          <span >{row.quantity?.toLocaleString()} {row.unit}</span>
          {importingStates[row.id] !== undefined && ( // Kiểm tra nếu dòng này đang ở chế độ nhập hàng
            <>
              <span className="text-gray-500">+</span>
              <input
                type="number"
                step="any" // Cho phép số thập phân
                value={importingStates[row.id]} // Lấy số lượng từ state của dòng này
                onChange={(e) => setImportingStates(prev => ({
                  ...prev,
                  [row.id]: e.target.value // Cập nhật số lượng cho dòng này
                }))}
                className="w-24 border border-gray-300 rounded-md shadow-sm p-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="SL thêm"
              />
            </>
          )}
        </div>
      )
    },
    {
      header: 'Vị trí',
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm',
      className: 'hidden sm:table-cell w-[320px]',
      render: (row) => (
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
            }}
            className="text-[11px] font-bold block w-full p-1 pr-8 rounded-lg border border-gray-300 bg-white appearance-none cursor-pointer outline-none text-left relative min-h-[26px] hover:border-blue-400 transition-colors text-blue-600"
          >
            <span className="truncate block">
              {warehouseOptions.find(w => String(w.value) === String(row.location))?.label || '-- Chọn --'}
            </span>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
              <ChevronDown size={14} />
            </div>
          </button>

          {openLocationMenuId === row.id && (
            <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal">
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
                {warehouseOptions.filter(w => w.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((w) => (
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
      )
    },
    {
      header: <div className="flex justify-center items-center w-full text-[10px] sm:text-sm">Hành động</div>,
      className: 'text-center whitespace-nowrap w-[100px] sm:w-[250px]', // Tăng chiều rộng để chứa nút mới
      render: (row) => (
        <div className="flex gap-2 justify-end items-center">
          {importingStates[row.id] !== undefined ? ( // Kiểm tra nếu dòng này đang ở chế độ nhập hàng
            <>
              <button onClick={() => handleUpdateImport(row)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[10px] sm:text-sm transition-colors active:scale-95">Lưu</button>
              <button onClick={() => handleCancelImport(row.id)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-2 sm:px-3 rounded text-[10px] sm:text-sm transition-colors active:scale-95">Hủy</button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleEditItem(row)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>Sửa</span>
              </button>
              <button
                onClick={() => setConfirmModal({ isOpen: true, id: row.id, type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa nguyên liệu này?' })}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>Xóa</span>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-2xl font-bold mb-4">Danh sách nguyên liệu</h2>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 gap-4">
        {/* Thanh tìm kiếm */}
        <div className="relative w-full lg:max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc vị trí"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
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
            <span className="hidden sm:inline">Thêm nguyên liệu mới</span>
            <span className="sm:hidden">Thêm nguyên liệu</span>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-4 text-gray-600 italic">Đang tải dữ liệu...</p>
      ) : (
        <CustomDatatable
          columns={columns}
          data={filteredData}
          bodyCellClassName="!py-2 lg:!py-3"
          renderExpansion={(row) => (
            <div className="py-4 pl-6 lg:pl-40 pr-6 bg-blue-50/30 border-b border-gray-100 relative">
              <div className="flex flex-wrap lg:flex-nowrap items-end gap-x-8 lg:gap-x-[140px] gap-y-4 text-sm !overflow-visible">
                {/* Thông tin hiển thị khi bị ẩn ở bảng chính trên Mobile */}
                <div className="flex flex-col gap-1 sm:hidden flex-none">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Số lượng</span>
                  <div className="flex items-center gap-1 font-medium text-gray-900">
                    <span >{row.quantity?.toLocaleString()} {row.unit}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 sm:hidden flex-none !overflow-visible">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vị trí</span>
                  <div className="relative w-64">
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
                      }}
                      className="text-[11px] font-bold block w-full p-1 pr-8 rounded-lg border border-gray-300 bg-white appearance-none cursor-pointer outline-none text-left relative min-h-[26px] hover:border-blue-400 transition-colors text-blue-600"
                    >
                      <span className="truncate block">
                        {warehouseOptions.find(w => String(w.value) === String(row.location))?.label || '-- Chọn --'}
                      </span>
                      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                        <ChevronDown size={14} />
                      </div>
                    </button>

                    {openLocationMenuId === row.id && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal">
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
                          {warehouseOptions.filter(w => w.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((w) => (
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
              </div>
            </div>
          )}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm nguyên liệu mới' : 'Cập nhật nguyên liệu'}
        // currentEditingItem được reset trong handleCloseModal của Modal component
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryMgmtModalOpen(true)}
              className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-[11px] font-bold underline z-10"
            >
              hiệu chỉnh
            </button>
            <CustomSelect
              label="Tên nguyên liệu"
              options={categories}
              value={currentEditingItem?.name || ''}
              onChange={(e) => {
                const categoryId = e.target.value;
                const selectedCat = categories.find(c => String(c.value) === String(categoryId));
                setCurrentEditingItem({
                  ...currentEditingItem,
                  name: categoryId,
                  unit: selectedCat ? selectedCat.unit : ''
                });
              }}
              isModalMaximized={isModalMaximized}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Số lượng</label>
              <input type="number" value={currentEditingItem?.quantity || 0} onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, quantity: e.target.value })} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Đơn vị tính</label>
              <input type="text" value={currentEditingItem?.unit || ''} readOnly className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none bg-gray-100 text-gray-500 cursor-not-allowed ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} placeholder="Đơn vị..." />
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsWarehousesModalOpen(true)}
              className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-[11px] font-bold underline z-10"
            >
              hiệu chỉnh
            </button>
            <CustomSelect label="Vị trí kho" options={warehouseOptions} value={currentEditingItem?.location || ''} onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, location: e.target.value })} isModalMaximized={isModalMaximized} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu</button>
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
          <div className="flex justify-between gap-4 items-center">
            <div className="relative max-w-[350px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên hoặc mã kho..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={warehouseSearchTerm}
                onChange={(e) => setWarehouseSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => { setEditingWarehouse({ name: '', code: '', type: '', status: '', location: '' }); setWarehouseModalMode('add'); setIsWarehouseEditModalOpen(true); }}
              className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-colors active:scale-95"
            >
              Thêm
            </button>
          </div>
          <div className={`${isWarehousesMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}>
            <CustomDatatable
              columns={warehouseTableColumns}
              data={warehousesRawData.filter(w => (w.name || '').toLowerCase().includes(warehouseSearchTerm.toLowerCase()) || (w.code || '').toLowerCase().includes(warehouseSearchTerm.toLowerCase()))}
              renderExpansion={(row) => (
                <div className="py-4 pl-6 pr-6 bg-blue-50/30 border-b border-gray-100 relative sm:hidden">
                  <div className="flex flex-wrap items-end gap-x-8 gap-y-4 text-sm">
                    {/* Loại kho */}
                    <div className="flex flex-col gap-1 !overflow-visible">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Loại kho</span>
                      <div className="relative w-36">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rowId = row.id || row.ID;
                            if (openTypeMenuId !== rowId) setTypeMenuSearchQuery('');
                            setOpenTypeMenuId(openTypeMenuId === rowId ? null : rowId);
                          }}
                          className="bg-white border border-gray-300 text-gray-900 text-[11px] rounded-lg p-1 pr-8 appearance-none cursor-pointer outline-none text-left relative min-h-[30px] w-full block hover:border-blue-400 transition-colors font-bold"
                        >
                          <span className="truncate block">
                            {warehouseTypes.find(t => String(t.value) === String(row.type || row.Type))?.label || '-- Chọn loại --'}
                          </span>
                          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                            <ChevronDown size={14} />
                          </div>
                        </button>

                        {openTypeMenuId === (row.id || row.ID) && (
                          <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal">
                            <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                              <div className="relative">
                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
                                  placeholder="Tìm nhanh..."
                                  value={typeMenuSearchQuery}
                                  onChange={(e) => setTypeMenuSearchQuery(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
                              {warehouseTypes.filter(t => t.label.toLowerCase().includes(typeMenuSearchQuery.toLowerCase())).map((t) => (
                                <button
                                  key={t.value}
                                  onClick={() => {
                                    handleWarehouseTypeChange(row, t.value);
                                    setOpenTypeMenuId(null);
                                  }}
                                  className={`px-2 py-1.5 text-[10px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.type || row.Type) === String(t.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                  <span className="block w-full truncate">{t.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Sức chứa */}
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sức chứa</span>
                      <span className="text-gray-900 font-medium">{row.available || row.Available || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </Modal>

      {/* Modal Quản lý danh mục nguyên liệu */}
      <Modal
        isOpen={isCategoryMgmtModalOpen}
        onClose={() => { setIsCategoryMgmtModalOpen(false); setIsCategoryMgmtMaximized(false); }}
        title={<><span className="hidden sm:inline">Danh sách danh mục nguyên liệu</span><span className="sm:hidden">Danh sách danh mục</span></>}
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
            <button onClick={() => handleOpenCategoryEdit('add')} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              <span className="hidden sm:inline">Thêm danh mục</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
          <div className={`${isCategoryMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm`}>
            <CustomDatatable
              columns={categoryMgmtColumns}
              data={categories.filter(cat => cat.label.toLowerCase().includes(categorySearch.toLowerCase()))}
              renderExpansion={(row) => (
                <div className="py-4 pl-12 pr-6 bg-blue-50/30 border-b border-gray-100 relative sm:hidden">
                  <div className="flex flex-wrap items-end gap-x-8 gap-y-4 text-sm">
                    <div className="flex flex-col gap-1 !overflow-visible">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Loại kho</span>
                      <div className="relative w-40">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rowId = row.id || row.ID;
                            if (openTypeMenuId !== rowId) setTypeMenuSearchQuery('');
                            setOpenTypeMenuId(openTypeMenuId === rowId ? null : rowId);
                          }}
                          className="bg-white border border-gray-300 text-gray-900 text-[11px] rounded-lg p-1 pr-8 appearance-none cursor-pointer outline-none text-left relative min-h-[30px] w-full block hover:border-blue-400 transition-colors font-bold"
                        >
                          <span className="truncate block">
                            {warehouseTypes.find(t => String(t.value) === String(row.type))?.label || '-- Chọn loại --'}
                          </span>
                          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                            <ChevronDown size={14} />
                          </div>
                        </button>

                        {openTypeMenuId === (row.id || row.ID) && (
                          <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal">
                            <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                              <div className="relative">
                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
                                  placeholder="Tìm nhanh..."
                                  value={typeMenuSearchQuery}
                                  onChange={(e) => setTypeMenuSearchQuery(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
                              {warehouseTypes.filter(t => t.label.toLowerCase().includes(typeMenuSearchQuery.toLowerCase())).map((t) => (
                                <button
                                  key={t.value}
                                  onClick={() => {
                                    handleWarehouseTypeChange(row, t.value);
                                    setOpenTypeMenuId(null);
                                  }}
                                  className={`px-2 py-1.5 text-[10px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.type) === String(t.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                  <span className="block w-full truncate">{t.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sức chứa</span>
                      <span className="text-gray-900 font-medium">{row.available || row.Available || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            />
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
              autoFocus
            />
          </div>
          <CustomSelect
            label="Đơn vị tính"
            name="unit"
            options={units}
            value={categoryForm.unit || ''}
            onChange={(e) => setCategoryForm({ ...categoryForm, unit: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsCategoryEditModalOpen(false)} className="bg-gray-500 text-white px-4 py-1.5 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
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
