import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, FileDown, FileUp, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect } from '../customComponent/customComponent';
import { getBOMs, createBOM, updateBOM, deleteBOM } from '../controller/bomController';
import { getItems, createItem, updateItem, deleteItem } from '../controller/itemsController';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controller/categoriesController';
import { getItemStatuses } from '../controller/itemStatusesController';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../controller/warehousesController';
import { getMaterialCategories, createMaterialCategory, updateMaterialCategory, deleteMaterialCategory } from '../controller/materialCategoriesController';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../controller/materialsController';
import { getUnits } from '../controller/unitsController';
import { MdAdd } from "react-icons/md";
import { getWarehouseBins } from '../controller/warehouseBinsController';
import { createWarehouseRack, deleteWarehouseRack, getWarehouseRacks, updateWarehouseRack } from '../controller/warehouseRacksController';
import { createWarehouseLocation, getWarehouseLocations, updateWarehouseLocation } from '../controller/warehouseLocationsController';
import { createWarehouseType, deleteWarehouseType, getWarehouseTypes, updateWarehouseType } from '../controller/warehouseTypesController';
import { FaRegSquare, FaRegSquareMinus } from "react-icons/fa6";

const API_BASE_URL = 'https://quanlysanxuat-production.up.railway.app/api';

export const BOM = () => {
  const [boms, setBoms] = useState([]);
  const [items, setItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBomBulkSelectMode, setIsBomBulkSelectMode] = useState(false);
  const [selectedBomIds, setSelectedBomIds] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);

  // States cho Quản lý Hàng hóa (giống items.js)
  const [isItemMgmtModalOpen, setIsItemMgmtModalOpen] = useState(false);
  const [isItemMgmtMaximized, setIsItemMgmtMaximized] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [rawItems, setRawItems] = useState([]);
  const [warehousesRawData, setWarehousesRawData] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [itemStatuses, setItemStatuses] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // States cho các menu dropdown inline và quản lý chọn (trong modal Items)
  const [isMaterialCategoryMgmtModalOpen, setIsMaterialCategoryMgmtModalOpen] = useState(false);
  const [isMaterialCategoryMgmtMaximized, setIsMaterialCategoryMgmtMaximized] = useState(false);
  const [isCategoryMgmtModalOpen, setIsCategoryMgmtModalOpen] = useState(false);
  const [isCategoryMgmtMaximized, setIsCategoryMgmtMaximized] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [openCategoryMenuId, setOpenCategoryMenuId] = useState(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);
  const [openManufactoryMenuId, setOpenManufactoryMenuId] = useState(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isCategoryEditModalOpen, setIsCategoryEditModalOpen] = useState(false);
  const [isMaterialCategoryEditModalOpen, setIsMaterialCategoryEditModalOpen] = useState(false);
  const [materialCategoryModalMode, setMaterialCategoryModalMode] = useState('add');
  const [categoryModalMode, setCategoryModalMode] = useState('add');
  const [materialCategoryForm, setMaterialCategoryForm] = useState({ id: null, name: '', unit: '' });
  const [materialCategoryErrors, setMaterialCategoryErrors] = useState({});
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '' });
  const [isMaterialCategoryEditMaximized, setIsMaterialCategoryEditMaximized] = useState(false);
  const [isCategoryEditMaximized, setIsCategoryEditMaximized] = useState(false);

  // States cho quản lý Kệ của kho
  const [isRackMgmtOpen, setIsRackMgmtOpen] = useState(false);
  const [rackSearchTerm, setRackSearchTerm] = useState('');
  const [isRackEditModalOpen, setIsRackEditModalOpen] = useState(false);
  const [rackModalMode, setRackModalMode] = useState('add');
  const [currentEditingRack, setCurrentEditingRack] = useState({ name: '' });
  const [rackConfirmModal, setRackConfirmModal] = useState({ isOpen: false, id: null });
  const [isRackMgmtMaximized, setIsRackMgmtMaximized] = useState(false);
  const [openRackMenuId, setOpenRackMenuId] = useState(null);
  const [rackErrors, setRackErrors] = useState({});
  const [racks, setRacks] = useState([]);

  // States cho quản lý Loại kho
  const [isTypeMgmtMaximized, setIsTypeMgmtMaximized] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');
  const [typeModalMode, setTypeModalMode] = useState('add');
  const [isTypeEditModalOpen, setIsTypeEditModalOpen] = useState(false);
  const [isTypeEditMaximized, setIsTypeEditMaximized] = useState(false);
  const [typeForm, setTypeForm] = useState({ id: null, name: '' });
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState([]);

  // States cho quản lý Vị trí kho (Locations)
  const [locations, setLocations] = useState([]);
  const [locConfirmModal, setLocConfirmModal] = useState({ isOpen: false, id: null });
  const [locModalMode, setLocModalMode] = useState('add');
  const [currentEditingLoc, setCurrentEditingLoc] = useState({ bin: '', racks: '', level: 1 });
  const [locErrors, setLocErrors] = useState({}); // Re-declaration, will remove the first one
  const [rawWarehouseLocations, setRawWarehouseLocations] = useState([]);
  const [warehouseBins, setWarehouseBins] = useState([]);
  const [warehouseRacks, setWarehouseRacks] = useState([]);
  const [isLocEditModalOpen, setIsLocEditModalOpen] = useState(false);
  const [isLocEditMaximized, setIsLocEditMaximized] = useState(false);

  // States cho quản lý Nhà kho (Modal danh sách kho)
  const [locSearchTerm, setLocSearchTerm] = useState('');
  const [isLocMgmtMaximized, setIsLocMgmtMaximized] = useState(false);
  const [isWarehousesModalOpen, setIsWarehousesModalOpen] = useState(false);
  const [isWarehousesMgmtMaximized, setIsWarehousesMgmtMaximized] = useState(false);
  const [isLocMgmtOpen, setIsLocMgmtOpen] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState('');
  const [warehouseModalMode, setWarehouseModalMode] = useState('list');
  const [isWarehouseEditModalOpen, setIsWarehouseEditModalOpen] = useState(false);
  const [isWarehouseEditMaximized, setIsWarehouseEditMaximized] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState({ name: '', code: '', type: '', status: '', location: '' });
  const [warehouseTypes, setWarehouseTypes] = useState([]);
  const [warehouseLocations, setWarehouseLocations] = useState([]);
  const [openTypeMenuId, setOpenTypeMenuId] = useState(null);
  const [typeMenuSearchQuery, setTypeMenuSearchQuery] = useState('');
  const [isTypeMgmtModalOpen, setIsTypeMgmtModalOpen] = useState(false);
  const [warehouseStatuses, setWarehouseStatuses] = useState([]);
  const [warehouseErrors, setWarehouseErrors] = useState({});


  const [isItemEditModalOpen, setIsItemEditModalOpen] = useState(false);
  const [itemEditModalMode, setItemEditModalMode] = useState('add');
  const [itemForm, setItemForm] = useState({ name: '', price: '', description: '', category: '', inventory: 0, tax: 0, weight: 0, status: '', location: '' });
  const [isItemEditMaximized, setIsItemEditMaximized] = useState(false);

  // States cho menu Vị trí kho (Location)
  const [openLocationMenuId, setOpenLocationMenuId] = useState(null);
  const [openLocationMenuAnchorKey, setOpenLocationMenuAnchorKey] = useState(null);
  const [locationMenuRect, setLocationMenuRect] = useState(null);

  // States cho Quản lý Nguyên liệu (giống materials.js)
  const [isMaterialMgmtModalOpen, setIsMaterialMgmtModalOpen] = useState(false);
  const [isMaterialMgmtMaximized, setIsMaterialMgmtMaximized] = useState(false);
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [rawMaterialsList, setRawMaterialsList] = useState([]);
  const [materialCategories, setMaterialCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [importingStates, setImportingStates] = useState({}); // {

  const [isMaterialEditModalOpen, setIsMaterialEditModalOpen] = useState(false);
  const [materialEditModalMode, setMaterialEditModalMode] = useState('add');
  const [materialForm, setMaterialForm] = useState({ name: '', quantity: 0, unit: '', location: '' });
  const [isMaterialEditMaximized, setIsMaterialEditMaximized] = useState(false);

  const [openItemMenuId, setOpenItemMenuId] = useState(null);
  const [openItemMenuAnchorKey, setOpenItemMenuAnchorKey] = useState(null);
  const [itemMenuRect, setItemMenuRect] = useState(null);
  const itemMenuAnchorRefs = useRef({});
  const [itemMenuSearchQuery, setItemMenuSearchQuery] = useState('');
  const [focusedMaterialId, setFocusedMaterialId] = useState(null);
  const [tempQuantity, setTempQuantity] = useState('');
  const [openMaterialMenuId, setOpenMaterialMenuId] = useState(null);
  const [openMaterialMenuAnchorKey, setOpenMaterialMenuAnchorKey] = useState(null);
  const [materialMenuRect, setMaterialMenuRect] = useState(null);
  const materialMenuAnchorRefs = useRef({});
  const [materialMenuSearchQuery, setMaterialMenuSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materialFormErrors, setMaterialFormErrors] = useState({});
  const [bomErrors, setBomErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ bomCode: '', item: '', materialCategory: '', requiredQuantity: 0 });
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const locationMenuAnchorRefs = useRef({})

  // Logic cập nhật tọa độ cho menu Vị trí (Location) khi scroll/resize
  useEffect(() => {
    if (!openLocationMenuId || !openLocationMenuAnchorKey) return;

    const updateLocationMenuRect = () => {
      const anchor = locationMenuAnchorRefs.current[openLocationMenuAnchorKey];
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setLocationMenuRect({
        left: rect.left,
        top: rect.bottom + 4,
        width: Math.max(rect.width, 200),
      });
    };

    updateLocationMenuRect();
    window.addEventListener('resize', updateLocationMenuRect);
    window.addEventListener('scroll', updateLocationMenuRect, true);

    return () => {
      window.removeEventListener('resize', updateLocationMenuRect);
      window.removeEventListener('scroll', updateLocationMenuRect, true);
    };
  }, [openLocationMenuId, openLocationMenuAnchorKey]);

  // Alias để tương thích với code copy từ items.js
  const categories = itemCategories;

  // Lắng nghe click toàn cục để đóng menu khi bấm ra ngoài
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenItemMenuId(null);
      setOpenItemMenuAnchorKey(null);
      setItemMenuRect(null);
      setItemMenuSearchQuery('');
      setOpenMaterialMenuId(null);
      setOpenMaterialMenuAnchorKey(null);
      setMaterialMenuRect(null);
      setMaterialMenuSearchQuery('');
      setFocusedMaterialId(null);
      setOpenCategoryMenuId(null);
      setOpenStatusMenuId(null);
      setOpenManufactoryMenuId(null);
      setOpenLocationMenuId(null);
      setMenuSearchQuery('');
      setOpenTypeMenuId(null);
      setTypeMenuSearchQuery('');
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    if (!openItemMenuId || !openItemMenuAnchorKey) return;

    const updateItemMenuRect = () => {
      const anchor = itemMenuAnchorRefs.current[openItemMenuAnchorKey];
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setItemMenuRect({
        left: rect.left,
        top: rect.bottom + 4,
        width: Math.max(rect.width, 200),
      });
    };

    updateItemMenuRect();
    window.addEventListener('resize', updateItemMenuRect);
    window.addEventListener('scroll', updateItemMenuRect, true);

    return () => {
      window.removeEventListener('resize', updateItemMenuRect);
      window.removeEventListener('scroll', updateItemMenuRect, true);
    };
  }, [openItemMenuId, openItemMenuAnchorKey]);

  useEffect(() => {
    if (!openMaterialMenuId || !openMaterialMenuAnchorKey) return;

    const updateMaterialMenuRect = () => {
      const anchor = materialMenuAnchorRefs.current[openMaterialMenuAnchorKey];
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setMaterialMenuRect({
        left: rect.left,
        top: rect.bottom + 4,
        width: Math.max(rect.width, 200),
      });
    };

    updateMaterialMenuRect();
    window.addEventListener('resize', updateMaterialMenuRect);
    window.addEventListener('scroll', updateMaterialMenuRect, true);

    return () => {
      window.removeEventListener('resize', updateMaterialMenuRect);
      window.removeEventListener('scroll', updateMaterialMenuRect, true);
    };
  }, [openMaterialMenuId, openMaterialMenuAnchorKey]);

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bomData, itemData, catData, itemCatData, statusData, warehouseData, locationData, materialsListData, unitsData, binData, rackData, warehouseTypesData] = await Promise.all([
          getBOMs(),
          getItems(),
          getMaterialCategories(),
          getCategories(),
          getItemStatuses(),
          getWarehouses(),
          getWarehouseLocations(),
          getMaterials(),
          getUnits(),
          getWarehouseBins(),
          getWarehouseRacks(),
          getWarehouseTypes()
        ]);
        setBoms(bomData);
        setSelectedBomIds([]);
        setIsBomBulkSelectMode(false);
        setRawItems(itemData);
        // Lấy Name từ ItemsController hiển thị lên Label của Select
        setItems(itemData.map(i => ({ value: i.id, label: i.name })));
        setMaterials(catData.map(c => ({ value: c.id, label: c.name, unit: c.unit })));
        setRawMaterialsList(materialsListData);
        setMaterialCategories(catData.map(c => ({ value: c.id, label: c.name, unit: c.unit })));
        setUnits(unitsData.map(u => ({ value: u.name || u.Name, label: u.name || u.Name })));
        setRawWarehouseLocations(locationData.map(l => ({ ...l, id: l.id || l.ID })));
        setWarehouseRacks(rackData);
        setItemCategories(itemCatData.map(c => ({ value: c.id, label: c.name })));
        setItemStatuses(statusData.map(s => ({ value: s.id, label: s.name })));
        setWarehouseStatuses(statusData.map(s => ({ value: s.id, label: s.name })));
        setWarehousesRawData(warehouseData);
        setWarehouseTypes(warehouseTypesData.map(t => ({ value: t.id, label: t.name })));
        setRacks(rackData.map(r => ({ value: r.id || r.ID, label: r.name || r.Name, ...r })));

        const locs = locationData.map(l => {
          const rackObj = rackData.find(r => String(r.id || r.ID) === String(l.racks || l.Racks));
          const rackName = rackObj ? (rackObj.name || rackObj.Name) : (l.racks || l.Racks);
          const binObj = binData.find(b => String(b.id || b.ID) === String(l.bin || l.Bin));
          const binName = binObj ? (binObj.name || binObj.Name) : (l.bin || l.Bin);
          return { value: l.id || l.ID, label: `Kệ ${rackName} - Tầng ${l.level || l.Level} - Ô ${binName}` };
        });
        setWarehouseLocations(locs);
        const mappedWarehouses = warehouseData
          .filter(w => (w.type || w.Type) === 2)
          .map(w => {
            const locId = w.location || w.Location;
            const loc = locationData.find(l => String(l.id || l.ID) === String(locId));
            let label = w.name || 'N/A';

            if (loc) {
              const rackId = loc.racks || loc.Racks;
              const rackObj = rackData.find(r => String(r.id || r.ID) === String(rackId));
              const rackName = rackObj ? (rackObj.name || rackObj.Name) : rackId;
              const level = loc.level || loc.Level;
              const binObj = binData.find(b => String(b.id || b.ID) === String(loc.bin || loc.Bin));
              const binName = binObj ? (binObj.name || binObj.Name) : (loc.bin || loc.Bin);
              label = `Kho nguyên liệu: Kệ ${rackName} - Tầng ${level} - Ô ${binName}`;
            }
            return { value: w.id || w.ID, label };
          });
        setWarehouses(mappedWarehouses);
        // warehouseData.map(w => ({ value: w.id || w.ID, label: w.name || w.Name })));

      } catch (err) {
        console.error("Chi tiết lỗi tải dữ liệu:", err);
        showNotification("Lỗi khi tải dữ liệu định mức", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchWarehouseTypes = async () => {
    try {
      setLoading(true);
      const typeData = await getWarehouseTypes();
      setWarehouseTypes(typeData.map(t => ({ value: t.id || t.ID, label: t.name || t.Name })));
      setSelectedWarehouseIds([]); // Clear selections after data refresh
    } catch (err) {
      showNotification("Lỗi khi tải dữ liệu nhà kho", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return boms.filter(b => {
      const itemName = items.find(i => String(i.value) === String(b.item))?.label || '';
      const materialName = materials.find(m => String(m.value) === String(b.materialCategory))?.label || '';
      return (
        itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        materialName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [boms, searchTerm, items, materials]);

  const getBomId = (bom) => bom?.id || bom?.ID || bom?.Id;

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

  const normalizeImportText = (value) => String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

  const parseImportQuantity = (value) => {
    if (typeof value === 'number') return value;
    const text = String(value || '').trim();
    const match = text.match(/-?\d+(?:[.,]\d+)?/);
    return match ? parseFloat(match[0].replace(',', '.')) : NaN;
  };

  const filteredMaterialsForMgmt = useMemo(() => {
    return rawMaterialsList.filter(m => {
      const catLabel = materialCategories.find(c => String(c.value) === String(m.name))?.label || '';
      const warehouseLabel = warehouses.find(w => String(w.value) === String(m.location))?.label || '';
      return (
        catLabel.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
        warehouseLabel.toLowerCase().includes(materialSearchTerm.toLowerCase())
      );
    });
  }, [rawMaterialsList, materialSearchTerm, materialCategories, warehouses]);

  const handleOpenMaterialEdit = (mode, material = null) => {
    setMaterialEditModalMode(mode);
    setMaterialForm(material ? { ...material } : { name: '', quantity: 0, unit: '', location: '' });
    setMaterialForm(material ? { ...material } : { name: '', quantity: '', unit: '', location: '' });
    setMaterialFormErrors({});
    setIsMaterialEditModalOpen(true);
    setIsMaterialEditMaximized(false);
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();

    // Logic kiểm tra tính hợp lệ của dữ liệu
    const errors = {};
    if (!materialForm?.name) errors.name = "Bắt buộc nhập Tên nguyên liệu";
    if (materialForm?.quantity === '' || materialForm?.quantity === null || materialForm?.quantity === undefined || materialForm?.quantity === 0) {
      errors.quantity = "Bắt buộc nhập Số lượng";
    }
    if (!materialForm?.location) errors.location = "Bắt buộc nhập Vị trí kho";

    if (Object.keys(errors).length > 0) {
      setMaterialFormErrors(errors);
      return;
    }
    setMaterialFormErrors({});

    try {
      const payload = {
        ...materialForm,
        name: materialForm.name ? parseInt(materialForm.name) : null,
        quantity: parseFloat(materialForm.quantity) || 0,
        location: materialForm.location ? parseInt(materialForm.location) : ''
      };

      if (materialEditModalMode === 'add') {
        await createMaterial(payload);
        showNotification("Thêm nguyên liệu thành công!");
      } else {
        await updateMaterial(materialForm.id, payload);
        showNotification("Cập nhật nguyên liệu thành công!");
      }
      setIsMaterialEditModalOpen(false);
      const updated = await getMaterials();
      setRawMaterialsList(updated);
    } catch (err) {
      showNotification("Lỗi khi lưu nguyên liệu.", "error");
    }
  };

  const toggleMaterialLocationMenu = (e, rowId, anchorKey) => {
    e.stopPropagation();
    const isSameMenuOpen = openLocationMenuId === rowId && openLocationMenuAnchorKey === anchorKey;

    if (isSameMenuOpen) {
      setOpenLocationMenuId(null);
      setOpenLocationMenuAnchorKey(null);
      setLocationMenuRect(null);
      return;
    }

    setMenuSearchQuery('');
    setOpenLocationMenuId(rowId);
    setOpenLocationMenuAnchorKey(anchorKey);

    const rect = e.currentTarget.getBoundingClientRect();
    setLocationMenuRect({
      left: rect.left,
      top: rect.bottom + 4,
      width: Math.max(rect.width, 200),
    });
  };

  const renderMaterialLocationMenu = (row, anchorKey) => {
    if (openLocationMenuId !== row.id || openLocationMenuAnchorKey !== anchorKey || !locationMenuRect) return null;

    return createPortal(
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed bg-white rounded-md shadow-2xl z-[9999] border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal"
        style={{
          left: locationMenuRect.left,
          top: locationMenuRect.top,
          width: locationMenuRect.width,
        }}
      >
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
              autoFocus={window.innerWidth >= 768}
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
      </div>,
      document.body
    );
  };

  const filteredItemsForMgmt = useMemo(() => {
    return rawItems.filter(item => {
      const categoryLabel = itemCategories.find(c => String(c.value) === String(item.category))?.label || '';
      return (
        item.name?.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
        categoryLabel.toLowerCase().includes(itemSearchTerm.toLowerCase())
      );
    });
  }, [rawItems, itemSearchTerm, itemCategories]);

  const handleOpenItemEdit = (mode, item = null) => {
    setItemEditModalMode(mode);
    setItemForm(item ? { ...item } : { name: '', price: '', description: '', category: '', inventory: 0, tax: 0, weight: 0, status: '', location: '' });
    setItemErrors({});
    setIsItemEditModalOpen(true);
    setIsItemEditMaximized(false);
  };

  const handleDeleteWarehouse = (id) => {
    setConfirmModal({
      isOpen: true,
      id: id,
      type: 'deleteWarehouse',
      title: 'Xác nhận xóa nhà kho',
      message: 'Bạn có chắc chắn muốn xóa nhà kho này?'
    });
  };

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();

    // Logic kiểm tra tính hợp lệ của dữ liệu
    const errors = {};
    if (!editingWarehouse.type) errors.type = "Bắt buộc nhập Loại kho";
    if (!editingWarehouse.location) errors.location = "Bắt buộc nhập Vị trí chi tiết";
    if (editingWarehouse.available === '' || editingWarehouse.available === null || editingWarehouse.available === undefined) {
      errors.available = "Bắt buộc nhập Số lượng tối đa";
    }

    if (Object.keys(errors).length > 0) {
      setWarehouseErrors(errors);
      return;
    }
    setWarehouseErrors({});

    try {
      const payload = {
        ...editingWarehouse,
        type: editingWarehouse.type === '' ? null : parseInt(editingWarehouse.type),
        available: editingWarehouse.available === '' ? null : parseInt(editingWarehouse.available),
        location: editingWarehouse.location === '' ? null : parseInt(editingWarehouse.location),
      };
      if (warehouseModalMode === 'add') {
        await createWarehouse(payload);
        showNotification("Thêm nhà kho thành công!");
      } else {
        await updateWarehouse(editingWarehouse.id || editingWarehouse.ID, payload);
        showNotification("Cập nhật nhà kho thành công!");
      }
      setIsWarehouseEditModalOpen(false);
      const data = await getWarehouses();
      setWarehousesRawData(data);
    } catch (err) {
      showNotification("Lỗi khi lưu nhà kho", "error");
    }
  };

  const handleWarehouseTypeChange = async (warehouse, newTypeId) => {
    const payload = {
      ...warehouse,
      type: parseInt(newTypeId),
    };
    try {
      await updateWarehouse(warehouse.id || warehouse.ID, payload);
      setWarehousesRawData(prev => prev.map(w => (w.id || w.ID) === (warehouse.id || warehouse.ID) ? { ...w, type: parseInt(newTypeId) } : w));
      showNotification("Cập nhật loại kho thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật loại kho.", "error");
    }
  };

  const handleOpenCategoryEdit = (mode, category = null) => {
    setCategoryModalMode(mode);
    setCategoryForm(category ? { id: category.value, name: category.label } : { id: null, name: '' });
    setIsCategoryEditModalOpen(true);
    setIsCategoryEditMaximized(false);
  };

  const handleOpenMaterialCategoryEdit = (mode, category = null) => {
    setMaterialCategoryModalMode(mode);
    setMaterialCategoryForm(category ? { id: category.value, name: category.label, unit: category.unit } : { id: null, name: '', unit: '' });
    setMaterialCategoryErrors({});
    setIsMaterialCategoryEditModalOpen(true);
    setIsMaterialCategoryEditMaximized(false);
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
      setItemCategories(data.map(c => ({ value: c.id, label: c.name })));
    } catch (err) {
      showNotification("Lỗi khi xử lý dữ liệu danh mục.", "error");
    }
  };
  const handleSaveMaterialCategory = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!materialCategoryForm.name?.trim()) {
      errors.name = "Bắt buộc nhập Tên danh mục";
    }

    if (!materialCategoryForm.unit) {
      errors.unit = "Bắt buộc nhập Đơn vị tính";
    }

    if (Object.keys(errors).length > 0) {
      setMaterialCategoryErrors(errors);
      return;
    }

    setMaterialCategoryErrors({});

    try {
      if (materialCategoryModalMode === 'add') {
        await createMaterialCategory({ Name: materialCategoryForm.name, Unit: materialCategoryForm.unit });
        showNotification("Thêm danh mục thành công");
      } else {
        await updateMaterialCategory(materialCategoryForm.id, { ID: materialCategoryForm.id, Name: materialCategoryForm.name, Unit: materialCategoryForm.unit });
        showNotification("Cập nhật danh mục thành công");
      }
      setIsMaterialCategoryEditModalOpen(false);
      const data = await getMaterialCategories();
      setItemCategories(data.map(c => ({ value: c.id, label: c.name })));
    } catch (err) {
      showNotification("Lỗi khi xử lý dữ liệu danh mục.", "error");
    }
  };

  const handleLocationChange = async (item, newLocationId) => {
    try {
      const updatedValue = newLocationId === "" ? null : parseInt(newLocationId);
      const updated = await updateItem(item.id, { ...item, location: updatedValue });
      setRawItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      setOpenLocationMenuId(null);
      showNotification("Cập nhật vị trí thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật vị trí.", "error");
    }
  };

  const handleCategoryChange = async (item, newCategoryId) => {
    try {
      const updatedValue = newCategoryId === "" ? null : parseInt(newCategoryId);
      const updated = await updateItem(item.id, { ...item, category: updatedValue });
      setRawItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      setOpenCategoryMenuId(null);
      showNotification("Cập nhật danh mục thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật danh mục.", "error");
    }
  };

  const handleDeleteItem = (itemId) => {
    setConfirmModal({
      isOpen: true,
      id: itemId,
      type: 'deleteItem',
      title: 'Xác nhận xóa hàng hóa',
      message: 'Hàng hóa sẽ bị xóa khỏi kho dữ liệu. Bạn có chắc chắn?'
    });
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();

    // Logic kiểm tra tính hợp lệ của dữ liệu
    const errors = {};
    if (!itemForm?.name?.trim()) errors.name = "Bắt buộc nhập Tên sản phẩm";
    if (itemForm?.price === '' || itemForm?.price === null || itemForm?.price === undefined) errors.price = "Bắt buộc nhập Giá bán";
    if (!itemForm?.category) errors.category = "Bắt buộc nhập Danh mục";
    if (itemForm?.tax === '' || itemForm?.tax === null || itemForm?.tax === undefined || itemForm?.tax === 0) errors.tax = "Bắt buộc nhập Thuế";
    if (itemForm?.weight === '' || itemForm?.weight === null || itemForm?.weight === undefined || itemForm?.weight === 0) errors.weight = "Bắt buộc nhập Cân nặng";
    if (!itemForm?.location) errors.location = "Bắt buộc nhập Vị trí kho";

    if (Object.keys(errors).length > 0) {
      setItemErrors(errors);
      return;
    }
    setItemErrors({});

    try {
      const payload = {
        ...itemForm,
        price: parseFloat(itemForm.price),
        inventory: parseInt(itemForm.inventory),
        category: parseInt(itemForm.category),
        status: parseInt(itemForm.status),
        location: parseInt(itemForm.location)
      };

      if (itemEditModalMode === 'add') {
        await createItem(payload);
        showNotification("Thêm hàng hóa thành công!");
      } else {
        await updateItem(itemForm.id, payload);
        showNotification("Cập nhật hàng hóa thành công!");
      }
      setIsItemEditModalOpen(false);
      const updatedItems = await getItems();
      setRawItems(updatedItems);
      setItems(updatedItems.map(i => ({ value: i.id, label: i.name })));
    } catch (err) {
      showNotification("Lỗi khi lưu hàng hóa.", "error");
    }
  };

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ bomCode: '', item: '', materialCategory: '', requiredQuantity: 0 });
    setBomErrors({});
    setIsModalOpen(true);
  };

  const handleEditItem = (bom) => {
    setModalMode('edit');
    setCurrentEditingItem({ ...bom });
    setBomErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingItem({ bomCode: '', item: '', materialCategory: '', requiredQuantity: 0 });
    setBomErrors({});
    setIsModalMaximized(false);
  };

  const handleBOMMaterialChange = async (bom, newMaterialId) => {
    try {
      const payload = {
        ...bom,
        materialCategory: parseInt(newMaterialId)
      };
      const updated = await updateBOM(bom.id, payload);
      setBoms(prev => prev.map(b => b.id === updated.id ? updated : b));
      setOpenMaterialMenuId(null);
      setOpenMaterialMenuAnchorKey(null);
      setMaterialMenuRect(null);
      showNotification("Cập nhật nguyên liệu thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật nguyên liệu.", "error");
    }
  };

  const handleBOMQuickUpdate = async (bom, newMaterialId, newQuantity) => {
    try {
      const payload = {
        ...bom,
        materialCategory: parseInt(newMaterialId),
        requiredQuantity: parseFloat(newQuantity) || 0
      };
      const updated = await updateBOM(bom.id, payload);
      setBoms(prev => prev.map(b => b.id === updated.id ? updated : b));
      setOpenMaterialMenuId(null);
      setOpenMaterialMenuAnchorKey(null);
      setMaterialMenuRect(null);
      setFocusedMaterialId(null);
      showNotification("Cập nhật định mức thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật định mức.", "error");
    }
  };

  const handleBOMItemChange = async (bom, newItemId) => {
    try {
      const payload = {
        ...bom,
        item: parseInt(newItemId)
      };
      const updated = await updateBOM(bom.id, payload);
      setBoms(prev => prev.map(b => b.id === updated.id ? updated : b));
      setOpenItemMenuId(null);
      setOpenItemMenuAnchorKey(null);
      setItemMenuRect(null);
      showNotification("Cập nhật sản phẩm thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật sản phẩm.", "error");
    }
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) return;
    try {
      if (typeModalMode === 'add') {
        await createWarehouseType({ Name: typeForm.name });
        showNotification("Thêm loại kho thành công");
      } else {
        await updateWarehouseType(typeForm.id, { ID: typeForm.id, Name: typeForm.name });
        showNotification("Cập nhật loại kho thành công");
      }
      setIsTypeEditModalOpen(false);
      fetchWarehouseTypes();
    } catch (err) {
      showNotification("Lỗi khi xử lý dữ liệu loại kho.", "error");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    // Logic kiểm tra tính hợp lệ của dữ liệu
    const errors = {};
    if (!currentEditingItem?.item) errors.item = "Bắt buộc nhập Sản phẩm áp dụng";
    if (!currentEditingItem?.materialCategory) errors.materialCategory = "Bắt buộc nhập Nguyên vật liệu";
    if (currentEditingItem?.requiredQuantity === '' || currentEditingItem?.requiredQuantity === undefined || currentEditingItem?.requiredQuantity === null || parseFloat(currentEditingItem.requiredQuantity) <= 0) {
      errors.requiredQuantity = "Bắt buộc nhập Số lượng (định mức)";
    }

    if (Object.keys(errors).length > 0) {
      setBomErrors(errors);
      return;
    }
    setBomErrors({});

    const payload = {
      ...currentEditingItem,
      item: currentEditingItem.item ? parseInt(currentEditingItem.item) : null,
      materialCategory: currentEditingItem.materialCategory ? parseInt(currentEditingItem.materialCategory) : null,
      requiredQuantity: parseFloat(currentEditingItem.requiredQuantity) || 0
    };

    try {
      if (modalMode === 'add') {
        const newItem = await createBOM(payload);
        setBoms(prev => [...prev, newItem]);
        showNotification("Thêm định mức thành công!");
      } else {
        const updated = await updateBOM(currentEditingItem.id, payload);
        setBoms(prev => prev.map(b => b.id === updated.id ? updated : b));
        showNotification("Cập nhật định mức thành công!");
      }
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu.", "error");
    }
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách định mức (BOM) ra tệp Excel không?'
    });
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
    window.location.href = `${API_BASE_URL}/Templates/import/boms`;
  };

  const handleImportExcel = async () => {
    if (!selectedImportFile) {
      showNotification("Vui lòng chọn file Excel cần nhập.", "error");
      return;
    }

    if (!selectedImportFile.name.toLowerCase().endsWith('.xlsx')) {
      showNotification("Vui lòng chọn file .xlsx để nhập dữ liệu.", "error");
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

      const bomMap = new Map(
        boms
          .filter(bom => bom.bomCode || bom.BomCode)
          .map(bom => [normalizeImportText(bom.bomCode || bom.BomCode), bom])
      );

      const itemMap = new Map(
        rawItems
          .filter(item => item.name || item.Name)
          .map(item => [normalizeImportText(item.name || item.Name), item.id || item.ID || item.Id])
      );

      const materialCategoryMap = new Map(
        materialCategories
          .filter(category => category.label || category.name || category.Name)
          .map(category => [
            normalizeImportText(category.label || category.name || category.Name),
            category.value || category.id || category.ID || category.Id
          ])
      );

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const bomCode = getExcelCellText(row.getCell(2)).trim();
        const itemName = getExcelCellText(row.getCell(3)).trim();
        const materialName = getExcelCellText(row.getCell(4)).trim();
        const quantityText = getExcelCellText(row.getCell(5));

        if (!bomCode && !itemName && !materialName && !quantityText) continue;

        const itemId = itemMap.get(normalizeImportText(itemName));
        const materialCategoryId = materialCategoryMap.get(normalizeImportText(materialName));
        const requiredQuantity = parseImportQuantity(quantityText);

        if (!bomCode || !itemId || !materialCategoryId || !Number.isFinite(requiredQuantity) || requiredQuantity <= 0) {
          skippedCount += 1;
          continue;
        }

        const existingBom = bomMap.get(normalizeImportText(bomCode));
        const payload = {
          ...(existingBom || {}),
          bomCode,
          item: parseInt(itemId, 10),
          materialCategory: parseInt(materialCategoryId, 10),
          requiredQuantity
        };

        if (existingBom) {
          const bomId = getBomId(existingBom);
          const updated = await updateBOM(bomId, { ...payload, id: bomId });
          bomMap.set(normalizeImportText(bomCode), updated);
          updatedCount += 1;
        } else {
          const created = await createBOM(payload);
          bomMap.set(normalizeImportText(created.bomCode || created.BomCode || bomCode), created);
          createdCount += 1;
        }
      }

      const latestBoms = await getBOMs();
      setBoms(latestBoms);
      setSelectedBomIds([]);
      setIsBomBulkSelectMode(false);

      const skippedMessage = skippedCount > 0 ? ` Bỏ qua ${skippedCount} dòng không hợp lệ.` : '';
      showNotification(`Nhập Excel thành công: thêm ${createdCount}, cập nhật ${updatedCount}.${skippedMessage}`, "success");
      handleCloseImportModal();
    } catch (err) {
      showNotification("Lỗi khi nhập file Excel BOM.", "error");
    } finally {
      setIsImportingExcel(false);
    }
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

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách BOM');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Mã định mức', key: 'bomCode', width: 20 },
        { header: 'Sản phẩm', key: 'item', width: 35 },
        { header: 'Nguyên liệu', key: 'material', width: 35 },
        { header: 'Số lượng định mức', key: 'quantity', width: 25 },
      ];

      filteredData.forEach((bom, index) => {
        const itemLabel = items.find(i => String(i.value) === String(bom.item))?.label || 'N/A';
        const materialObj = materials.find(m => String(m.value) === String(bom.materialCategory));
        const materialLabel = materialObj?.label || 'N/A';
        const unit = materialObj?.unit || '';

        worksheet.addRow({
          stt: index + 1,
          bomCode: bom.bomCode || bom.BomCode || '',
          item: itemLabel,
          material: materialLabel,
          quantity: `${bom.requiredQuantity} ${unit}`
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
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          // Căn giữa cột STT
          if (colNumber === 1 || colNumber === 2) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách định mức.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  // Hàm xử lý thay đổi vị trí của một nhà kho
  const handleWarehouseLocationChange = async (warehouse, newLocationId) => {
    const payload = {
      ...warehouse,
      location: parseInt(newLocationId),
      Location: parseInt(newLocationId) // Giả định backend có thể sử dụng 'Location'
    };

    try {
      await updateWarehouse(warehouse.id || warehouse.ID, payload);
      setWarehousesRawData(prev => prev.map(w => (w.id || w.ID) === (warehouse.id || warehouse.ID) ? { ...w, location: parseInt(newLocationId), Location: parseInt(newLocationId) } : w));
      setOpenLocationMenuId(null); // Đóng dropdown sau khi chọn
      showNotification("Cập nhật vị trí kho thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật vị trí kho.", "error");
    }
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    if (type === 'delete') {
      try {
        await deleteBOM(id);
        setBoms(prev => prev.filter(b => getBomId(b) !== id));
        setSelectedBomIds(prev => prev.filter(bomId => bomId !== id));
        showNotification("Xóa định mức thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    } else if (type === 'bulkDelete') {
      try {
        await Promise.all(id.map(bomId => deleteBOM(bomId)));
        setBoms(prev => prev.filter(b => !id.includes(getBomId(b))));
        setSelectedBomIds([]);
        setIsBomBulkSelectMode(false);
        showNotification(`Xóa ${id.length} định mức thành công!`);
      } catch (err) {
        showNotification("Lỗi khi xóa nhiều định mức.", "error");
      }
    } else if (type === 'deleteMaterial') {
      try {
        await deleteMaterial(id);
        setRawMaterialsList(prev => prev.filter(m => m.id !== id));
        showNotification("Xóa nguyên liệu thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    } else if (type === 'deleteItem') {
      try {
        await deleteItem(id);
        const updatedItems = await getItems();
        setRawItems(updatedItems);
        setItems(updatedItems.map(i => ({ value: i.id, label: i.name })));
        showNotification("Xóa hàng hóa thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    } else if (type === 'deleteWarehouse') {
      try {
        await deleteWarehouse(id);
        setWarehousesRawData(prev => prev.filter(w => (w.id || w.ID) !== id));
        showNotification("Xóa nhà kho thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa nhà kho.", "error");
      }
    } else if (type === 'deleteCategory') {
      try {
        await deleteCategory(id);
        const data = await getCategories();
        setItemCategories(data.map(c => ({ value: c.id, label: c.name })));
        showNotification("Xóa danh mục thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    } else if (type === 'deleteMaterialCategory') {
      try {
        await deleteMaterialCategory(id);
        const data = await getMaterialCategories();
        setItemCategories(data.map(c => ({ value: c.id, label: c.name })));
        showNotification("Xóa danh mục thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    } else if (type === 'deleteType') {
      try {
        await deleteWarehouseType(id);
        showNotification("Xóa loại kho thành công!");
        fetchWarehouseTypes();
      } catch (err) {
        showNotification("Lỗi khi xóa loại kho. Vui lòng kiểm tra các vị trí kho đang sử dụng loại này.", "error");
      }
    }
    else if (type === 'export') {
      await handleExportExcel();
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleBulkDelete = () => {
    if (!isBomBulkSelectMode) {
      setIsBomBulkSelectMode(true);
      setSelectedBomIds([]);
      return;
    }

    if (selectedBomIds.length === 0) {
      setIsBomBulkSelectMode(false);
      setSelectedBomIds([]);
      return;
    }

    setConfirmModal({
      isOpen: true,
      id: selectedBomIds,
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều định mức',
      message: `Bạn có chắc chắn muốn xóa ${selectedBomIds.length} định mức đã chọn không? Hành động này không thể hoàn tác.`
    });
  };

  const handleSelectAllBoms = () => {
    const visibleBomIds = filteredData.map(bom => getBomId(bom)).filter(Boolean);
    setSelectedBomIds(visibleBomIds);
  };

  const handleClearSelectedBoms = () => {
    setSelectedBomIds([]);
  };

  const handleToggleSelectBom = (row) => {
    const rowId = getBomId(row);
    setSelectedBomIds(prev => prev.includes(rowId)
      ? prev.filter(id => id !== rowId)
      : [...prev, rowId]
    );
  };

  const filteredCategoriesForMgmt = useMemo(() => {
    return categories.filter(cat =>
      (cat.label || '').toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const handleOpenLocEdit = (mode, loc = null) => {
    setLocModalMode(mode);
    setLocErrors({}); // Reset errors when opening modal
    setCurrentEditingLoc(loc ? {
      id: loc.id,
      bin: loc.bin || loc.Bin,
      racks: loc.racks || loc.Racks,
      level: loc.level || loc.Level
    } : { bin: '', racks: '', level: 1 });
    setIsLocEditModalOpen(true);
    setIsLocEditMaximized(false);
  };

  const filteredTypes = useMemo(() => {
    return warehouseTypes.filter(t =>
      t.label.toLowerCase().includes(typeSearch.toLowerCase()) ||
      String(t.value).includes(typeSearch)
    );
  }, [warehouseTypes, typeSearch]);

  const typeColumns = [
    {
      header: 'STT',
      className: 'text-[11px] sm:text-sm !px-2',
      headerCellClassName: 'text-[10px] sm:text-xs !px-2',
      render: (_, { index }) => index
    },
    {
      header: 'Tên loại kho',
      className: 'text-[11px] sm:text-sm !px-2',
      headerCellClassName: 'text-[10px] sm:text-xs !px-2',
      render: (row) => <span className="font-bold text-gray-700">{row.label}</span>
    },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => handleOpenTypeEdit('edit', row)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95"
          >Sửa</button>
          <button
            onClick={() => setConfirmModal({
              isOpen: true,
              id: row.value,
              type: 'deleteType',
              title: 'Xác nhận xóa',
              message: `Bạn có chắc chắn muốn xóa loại kho "${row.label}"?`
            })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95"
          >
            Xóa
          </button>
        </div>
      )
    }
  ];

  const handleOpenTypeEdit = (mode, type = null) => {
    setTypeModalMode(mode);
    setTypeForm(type ? { id: type.value, name: type.label } : { id: null, name: '' });
    setIsTypeEditModalOpen(true);
    setIsTypeEditMaximized(false);
  };

  const handleRackSubmit = async (e) => {
    e.preventDefault();
    // Logic kiểm tra tính hợp lệ của dữ liệu
    const errors = {};
    if (!currentEditingRack?.name?.trim()) {
      errors.name = "Bắt buộc nhập Tên Kệ";
    }

    if (Object.keys(errors).length > 0) {
      setRackErrors(errors);
      return;
    }
    setRackErrors({});

    try {
      if (rackModalMode === 'add') {
        await createWarehouseRack({ Name: currentEditingRack.name });
        showNotification("Thêm kệ mới thành công!");
      } else {
        await updateWarehouseRack(currentEditingRack.id, { ID: currentEditingRack.id, Name: currentEditingRack.name });
        showNotification("Cập nhật kệ thành công!");
      }
      // Re-fetch racks to update the list and the CustomSelect options
      const rackData = await getWarehouseRacks();
      setRacks(rackData.map(r => ({ value: r.id || r.ID, label: r.name || r.Name, ...r })));
      setIsRackEditModalOpen(false);
    } catch (err) {
      showNotification("Lỗi khi lưu thông tin kệ.", "error");
    }
  };

  const handleRackDelete = async () => {
    try {
      await deleteWarehouseRack(rackConfirmModal.id);
      setRacks(prev => prev.filter(r => r.value !== rackConfirmModal.id));
      showNotification("Xóa kệ thành công!");
      setRackConfirmModal({ isOpen: false, id: null });
    } catch (err) {
      showNotification("Không thể xóa kệ này vì có thể đang được sử dụng.", "error");
    }
  };

  const filteredRacks = useMemo(() => {
    return racks.filter(r => r.label.toLowerCase().includes(rackSearchTerm.toLowerCase()));
  }, [racks, rackSearchTerm]);

  const handleOpenRackEdit = (mode, rack = null) => {
    setRackModalMode(mode);
    setCurrentEditingRack(rack || { name: '' });
    setRackErrors({});
    setIsRackEditModalOpen(true);
  };

  const handleRackChange = async (location, newRackId) => {
    const payload = {
      ID: location.id,
      Bin: parseInt(location.bin || location.Bin),
      Racks: parseInt(newRackId),
      Level: parseInt(location.level || location.Level)
    };

    try {
      await updateWarehouseLocation(location.id, payload);
      setLocations(prev => prev.map(l => l.id === location.id ? { ...l, racks: parseInt(newRackId), Racks: parseInt(newRackId) } : l));
      showNotification("Cập nhật kệ thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật kệ.", "error");
    }
  };

  const handleLocSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (currentEditingLoc.bin === '' || currentEditingLoc.bin === null || currentEditingLoc.bin === undefined) {
      errors.bin = "Bắt buộc nhập Ô";
    }
    if (!currentEditingLoc.racks) {
      errors.racks = "Bắt buộc nhập Kệ (Rack)";
    }
    if (currentEditingLoc.level === '' || currentEditingLoc.level === null || currentEditingLoc.level === undefined) {
      errors.level = "Bắt buộc nhập Tầng (Level)";
    }

    if (Object.keys(errors).length > 0) {
      setLocErrors(errors);
      return;
    }
    setLocErrors({}); // Clear errors if validation passes

    const payload = {
      ID: currentEditingLoc.id || 0,
      Bin: parseInt(currentEditingLoc.bin),
      Racks: parseInt(currentEditingLoc.racks),
      Level: parseInt(currentEditingLoc.level)
    };
    try {
      if (locModalMode === 'add') {
        await createWarehouseLocation(payload);
        showNotification("Thêm vị trí mới thành công!");
      } else {
        await updateWarehouseLocation(currentEditingLoc.id, payload);
        showNotification("Cập nhật vị trí thành công!");
      }
      const locationData = await getWarehouseLocations();
      setRawWarehouseLocations(locationData.map(l => ({ ...l, id: l.id || l.ID })));
      // Cập nhật lại dropdown vị trí kho sau khi thay đổi data gốc
      // (Logic map warehouseLocations giống trong useEffect)
      setIsLocEditModalOpen(false);
    } catch (err) {
      showNotification("Lỗi khi lưu thông tin vị trí.", "error");
    }
  };

  const filteredLocs = useMemo(() => {
    return rawWarehouseLocations.filter(l => {
      const rackLabel = warehouseRacks.find(r => String(r.id || r.ID) === String(l.racks || l.Racks))?.name || '';
      const binLabel = warehouseBins.find(b => String(b.id || b.ID) === String(l.bin || l.Bin))?.name || '';
      return (
        rackLabel.toLowerCase().includes(locSearchTerm.toLowerCase()) ||
        binLabel.toLowerCase().includes(locSearchTerm.toLowerCase()) ||
        String(l.level || l.Level).includes(locSearchTerm)
      );
    });
  }, [rawWarehouseLocations, locSearchTerm, warehouseRacks, warehouseBins]);

  const categoryMgmtColumns = [
    { header: 'STT', className: '!px-1 sm:!px-6', render: (_, { index }) => index },
    { header: 'Tên danh mục', className: '!px-1 sm:!px-6', render: (row) => <span className="font-bold text-gray-700">{row.label}</span> },
    {
      header: 'Hành động',
      className: 'text-right pr-5 !px-1 sm:!px-6',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => handleOpenCategoryEdit('edit', row)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
          >
            Sửa
          </button>
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

  const materialCategoryMgmtColumns = [
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
          <button onClick={() => handleOpenMaterialCategoryEdit('edit', row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95">Sửa</button>
          <button
            onClick={() => setConfirmModal({
              isOpen: true,
              id: row.value,
              type: 'deleteMaterialCategory',
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

  const warehouseTableColumns = useMemo(() => {
    return [
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
      { header: 'STT', className: '!px-1 sm:!px-6', render: (_, { index }) => index },
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
                      onClick={() => handleWarehouseLocationChange(row, s.value)}
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
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsTypeMgmtModalOpen(true); }}
                className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
              >
                hiệu chỉnh
              </button>
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
                    {warehouseTypes.filter(t => (t.label || '').toLowerCase().includes(typeMenuSearchQuery.toLowerCase())).map((t) => (
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
              onClick={() => { setWarehouseErrors({}); setEditingWarehouse(row); setWarehouseModalMode('edit'); setIsWarehouseEditModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-all active:scale-95"
            >Sửa</button>
            <button
              onClick={() => setConfirmModal({
                isOpen: true, id: row.id || row.ID, type: 'deleteWarehouse', title: 'Xác nhận xóa kho', message: `Bạn có chắc chắn muốn xóa kho "${row.name || row.Name}"?`
              })}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-all active:scale-95"
            >Xóa</button>
          </div>
        )
      }
    ]
  }, [warehouseTypes, openTypeMenuId, typeMenuSearchQuery, openLocationMenuId, menuSearchQuery, warehouseLocations, setIsLocMgmtOpen, handleWarehouseLocationChange, setIsTypeMgmtModalOpen, handleWarehouseTypeChange, setEditingWarehouse, setWarehouseModalMode, setIsWarehouseEditModalOpen, setConfirmModal, handleDeleteWarehouse, warehousesRawData]);

  const itemMgmtColumns = [
    {
      header: '',
      className: 'w-[20px] sm:w-[40px] !px-2 sm:!px-6 text-center',
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
    { header: 'STT', className: 'w-[30px] sm:w-[50px] !px-2 sm:!px-6 text-center', headerCellClassName: 'text-[10px] sm:text-sm', render: (row, { index }) => index },
    { header: 'Tên sản phẩm', accessor: 'name', headerCellClassName: 'text-[10px]  sm:text-sm', className: 'font-medium text-blue-600 text-[11px] sm:text-sm min-w-[100px] sm:min-w-[140px] !px-2 sm:!px-6' },
    {
      header: 'Danh mục',
      className: 'hidden lg:table-cell w-[180px] lg:relative lg:left-[-80px]',
      headerCellClassName: 'hidden lg:table-cell text-[10px] sm:text-sm lg:relative lg:left-[-80px]',
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
                {categories.filter(cat => (cat.label || '').toLowerCase().includes(menuSearchQuery.toLowerCase())).map((cat) => (
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
      className: 'hidden sm:table-cell w-[60px] sm:w-[150px] text-left lg:relative lg:left-[-80px]',
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm lg:relative lg:left-[-80px]',
      render: (row) => (
        <span className="text-gray-700 font-semibold text-sm">
          {row.price?.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Tồn kho',
      accessor: 'inventory',
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm lg:relative lg:left-[-80px]',
      className: 'hidden sm:table-cell w-[60px] sm:w-[120px] text-center text-[11px] sm:text-sm !px-2 sm:!px-6 lg:relative lg:left-[-80px]',
      render: (row) => (
        <span>
          {row.inventory || 0}
        </span>
      )
    },
    {
      header: <div className="flex justify-center items-center w-full text-[10px] sm:text-sm">Hành động</div>,
      className: 'text-center w-[100px] sm:w-[180px]',
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
                onClick={() => handleOpenItemEdit('edit', row)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-all active:scale-95"
              >Sửa</button>
              <button
                onClick={() => setConfirmModal({
                  isOpen: true,
                  id: row.id,
                  type: 'deleteItem',
                  title: 'Xác nhận xóa',
                  message: `Bạn có chắc chắn muốn xóa hàng hóa "${row.name}"?`
                })}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-all active:scale-95"
              >Xóa</button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const materialMgmtColumns = [
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
      className: 'min-w-[120px] sm:min-w-[150px] !px-2 sm:!px-6 text-[11px] sm:text-sm',
      accessor: 'name',
      render: (row) => materialCategories.find(c => String(c.value) === String(row.name))?.label || 'N/A'
    },
    {
      header: 'Số lượng',
      accessor: 'quantity',
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm',
      className: 'hidden sm:table-cell min-w-[150px] text-sm',
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
              {warehouses.find(w => String(w.value) === String(row.location))?.label || '-- Chọn --'}
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
      )
    },
    {
      header: <div className="flex justify-center items-center w-full text-[10px] sm:text-sm">Hành động</div>,
      className: 'text-center whitespace-nowrap w-[100px] sm:w-[150px]', // Tăng chiều rộng để chứa nút mới
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
                onClick={() => handleOpenMaterialEdit('edit', row)}
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

  const locColumns = [
    {
      header: 'STT',
      className: '!px-2 sm:!px-6',
      render: (_, { index }) => index
    },
    {
      header: 'Ô',
      className: '!px-2 sm:!px-6',
      render: (row) => `${row.bin || row.Bin}`
    },
    {
      header: 'Kệ',
      className: '!px-2 sm:!px-6',
      render: (row) =>
        // <span className="font-bold text-blue-600">{warehouseRacks.find(r => String(r.id || r.ID) === String(row.racks || row.Racks))?.name || 'N/A'}</span>
        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsRackMgmtOpen(true); }}
            className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
          >
            hiệu chỉnh
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (openRackMenuId !== row.id) setMenuSearchQuery('');
              setOpenRackMenuId(openRackMenuId === row.id ? null : row.id);
            }}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-[11px] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none text-left relative min-h-[26px] font-bold text-blue-600 transition-all"
          >
            <span className="truncate block">
              {racks.find(r => String(r.value) === String(row.racks || row.Racks))?.label || '-- Chọn kệ --'}
            </span>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
              <ChevronDown size={14} />
            </div>
          </button>

          {openRackMenuId === row.id && (
            <div className="absolute left-0 top-full mt-1 w-full min-w-[200px] bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal">
              <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
                    placeholder="Tìm nhanh..."
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-[160px] overflow-y-auto flex flex-col gap-0.5">
                {racks.filter(r => r.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((r) => (
                  <button
                    key={r.value}
                    onClick={() => {
                      handleRackChange(row, r.value);
                      setOpenRackMenuId(null);
                    }}
                    className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.racks || row.Racks) === String(r.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <span className="block w-full !whitespace-normal break-words leading-tight">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
    },
    {
      header: 'Tầng',
      className: '!px-2 sm:!px-6',
      render: (row) => `Tầng ${row.level || row.Level}`
    },
    {
      header: 'Hành động',
      className: 'text-right pr-5 !px-2 sm:!px-6',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleOpenLocEdit('edit', row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-colors">Sửa</button>
          <button
            onClick={() => setLocConfirmModal({ isOpen: true, id: row.id || row.ID })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-colors"
          >
            Xóa
          </button>
        </div>
      )
    }
  ];

  const rackColumns = [
    {
      header: 'STT',
      className: 'text-[11px] sm:text-sm !px-2',
      headerCellClassName: 'text-[11px] sm:text-xs !px-2',
      render: (_, { index }) => index
    },
    {
      header: <><span className="hidden sm:inline">Tên Kệ</span><span className="sm:hidden">Tên</span></>,
      className: 'text-[11px] sm:text-sm !px-2',
      headerCellClassName: 'text-[11px] sm:text-xs !px-2',
      accessor: 'label'
    },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => handleOpenRackEdit('edit', row)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95"
          >Sửa</button>
          <button
            onClick={() => setRackConfirmModal({ isOpen: true, id: row.value })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95"
          >Xóa</button>
        </div>
      )
    }
  ];

  const toggleItemMenu = (e, rowId, anchorKey) => {
    e.stopPropagation();
    const isSameMenuOpen = openItemMenuId === rowId && openItemMenuAnchorKey === anchorKey;

    if (isSameMenuOpen) {
      setOpenItemMenuId(null);
      setOpenItemMenuAnchorKey(null);
      setItemMenuRect(null);
      return;
    }

    setItemMenuSearchQuery('');
    setOpenItemMenuId(rowId);
    setOpenItemMenuAnchorKey(anchorKey);
    setOpenMaterialMenuId(null);
    setOpenMaterialMenuAnchorKey(null);
    setMaterialMenuRect(null);
    setFocusedMaterialId(null);

    const rect = e.currentTarget.getBoundingClientRect();
    setItemMenuRect({
      left: rect.left,
      top: rect.bottom + 4,
      width: Math.max(rect.width, 200),
    });
  };

  const renderItemMenu = (row, anchorKey) => {
    if (openItemMenuId !== row.id || openItemMenuAnchorKey !== anchorKey || !itemMenuRect) return null;

    return createPortal(
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed bg-white rounded-md shadow-2xl z-[9999] border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal"
        style={{
          left: itemMenuRect.left,
          top: itemMenuRect.top,
          width: itemMenuRect.width,
        }}
      >
        <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
              placeholder="Tìm sản phẩm..."
              value={itemMenuSearchQuery}
              onChange={(e) => setItemMenuSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5">
          {items.filter(i => i.label.toLowerCase().includes(itemMenuSearchQuery.toLowerCase())).map((i) => (
            <button
              key={i.value}
              onClick={() => handleBOMItemChange(row, i.value)}
              className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.item) === String(i.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <span className="block w-full truncate">{i.label}</span>
            </button>
          ))}
        </div>
      </div>,
      document.body
    );
  };

  const toggleMaterialMenu = (e, rowId, anchorKey) => {
    e.stopPropagation();
    const isSameMenuOpen = openMaterialMenuId === rowId && openMaterialMenuAnchorKey === anchorKey;

    if (isSameMenuOpen) {
      setOpenMaterialMenuId(null);
      setOpenMaterialMenuAnchorKey(null);
      setMaterialMenuRect(null);
      setFocusedMaterialId(null);
      return;
    }

    setMaterialMenuSearchQuery('');
    setOpenMaterialMenuId(rowId);
    setOpenMaterialMenuAnchorKey(anchorKey);
    setOpenItemMenuId(null);
    setOpenItemMenuAnchorKey(null);
    setItemMenuRect(null);

    const rect = e.currentTarget.getBoundingClientRect();
    setMaterialMenuRect({
      left: rect.left,
      top: rect.bottom + 4,
      width: Math.max(rect.width, 200),
    });
  };

  const renderMaterialMenu = (row, anchorKey) => {
    if (openMaterialMenuId !== row.id || openMaterialMenuAnchorKey !== anchorKey || !materialMenuRect) return null;

    return createPortal(
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed bg-white rounded-xl shadow-2xl z-[9999] border border-gray-100 p-1.5 flex flex-col animate-in fade-in zoom-in duration-300 origin-top whitespace-normal"
        style={{
          left: materialMenuRect.left,
          top: materialMenuRect.top,
          width: materialMenuRect.width,
        }}
      >
        <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 text-gray-900"
              placeholder="Tìm nhanh nguyên liệu..."
              value={materialMenuSearchQuery}
              onChange={(e) => setMaterialMenuSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus={window.innerWidth >= 768}
            />
          </div>
        </div>

        <div className="sm:hidden max-h-60 overflow-y-auto flex flex-col gap-1 px-1">
          {materials.filter(m => (m.label || '').toLowerCase().includes(materialMenuSearchQuery.toLowerCase())).map((m) => (
            <button
              key={m.value}
              onClick={(e) => {
                e.stopPropagation();
                const isCurrentlyFocused = focusedMaterialId === m.value;
                setFocusedMaterialId(isCurrentlyFocused ? null : m.value);
                setTempQuantity(row.requiredQuantity);
              }}
              className={`px-2 py-2.5 text-[11px] rounded-lg transition-colors text-left flex items-center min-w-0 group ${String(row.materialCategory) === String(m.value) || focusedMaterialId === m.value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <span className="truncate">{m.label}</span>
              <div className={`${focusedMaterialId === m.value ? 'flex' : 'hidden'} items-center gap-1.5 ml-1.5 shrink-0 animate-in fade-in duration-200`}>
                <span className="text-gray-400 font-normal whitespace-nowrap">SL:</span>
                <input
                  type="number"
                  className="w-10 border border-gray-300 rounded px-1 py-0 text-black font-normal outline-none focus:ring-1 focus:ring-blue-500 bg-white h-5 text-[10px]"
                  value={focusedMaterialId === m.value ? tempQuantity : row.requiredQuantity}
                  onChange={(e) => setTempQuantity(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <span className="text-gray-400 font-normal text-[9px]">{m.unit}</span>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const qty = focusedMaterialId === m.value ? tempQuantity : row.requiredQuantity;
                    handleBOMQuickUpdate(row, m.value, qty);
                  }}
                  className="ml-0.5 bg-green-600 text-white px-2 py-0.5 rounded text-[9px] hover:bg-green-700 active:scale-95 transition-all cursor-pointer"
                >
                  Lưu
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="hidden sm:flex flex-col gap-0.5 max-h-52 overflow-y-auto custom-scrollbar px-1">
          {materials.filter(m => (m.label || '').toLowerCase().includes(materialMenuSearchQuery.toLowerCase())).map((m) => (
            <button
              key={m.value}
              onClick={(e) => {
                e.stopPropagation();
                handleBOMMaterialChange(row, m.value);
              }}
              className={`px-2 py-1.5 text-[11px] rounded-lg transition-all text-left flex items-center min-w-0 group ${String(row.materialCategory) === String(m.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-blue-50 hover:pl-4'}`}
            >
              <span className="truncate flex-1">{m.label}</span>
            </button>
          ))}
        </div>
      </div>,
      document.body
    );
  };

  const columns = [
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
    { header: 'STT', className: 'w-[36px] sm:w-[50px] !px-1 sm:!px-6 text-center', headerCellClassName: 'text-[10px] sm:text-sm', render: (row, { index }) => index },
    {
      header: 'Mã định mức',
      headerCellClassName: 'text-[10px] sm:text-sm',
      className: 'min-w-[160px] sm:w-[130px] !px-2 sm:!px-6 text-[11px] sm:text-sm text-gray-700 font-medium',
      render: (row, { isExpanded, toggleExpand }) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand();
          }}
          className="flex w-full items-center justify-between gap-2 text-left sm:pointer-events-none"
        >
          <span>{row.bomCode || row.BomCode || ''}</span>
        </button>
      )
    },
    {
      header: <div className="flex justify-center items-center w-full text-[11px] sm:text-sm">Sản phẩm</div>,
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm',
      className: 'hidden sm:table-cell min-w-[100px] sm:min-w-[150px] !px-1 sm:!px-6 text-[11px] sm:text-sm',
      render: (row) => {
        const isOpen = openItemMenuId === row.id;
        return (
          <div className={`relative ${isOpen ? 'z-30' : 'z-10'}`}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsItemMgmtModalOpen(true); }}
              className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
            >
              hiệu chỉnh
            </button>
            <button
              ref={(el) => { itemMenuAnchorRefs.current[`bom-item-${row.id}`] = el; }}
              onClick={(e) => {
                toggleItemMenu(e, row.id, `bom-item-${row.id}`);
              }}
              className="bg-white border border-gray-300 text-blue-600 text-[11px] sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none text-left relative min-h-[26px] font-bold hover:border-blue-400 transition-colors"
            >
              <span className="truncate block">
                {items.find(i => String(i.value) === String(row.item))?.label || '-- Chọn sản phẩm --'}
              </span>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </button>

            {renderItemMenu(row, `bom-item-${row.id}`)}

            {false && isOpen && (
              <div className="absolute left-0 top-full mt-1 w-full min-w-[200px] bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal">
                <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
                      placeholder="Tìm sản phẩm..."
                      value={itemMenuSearchQuery}
                      onChange={(e) => setItemMenuSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5">
                  {items.filter(i => i.label.toLowerCase().includes(itemMenuSearchQuery.toLowerCase())).map((i) => (
                    <button
                      key={i.value}
                      onClick={() => handleBOMItemChange(row, i.value)}
                      className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.item) === String(i.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className="block w-full truncate">{i.label}</span>
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
      header: 'Nguyên liệu',
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm',
      className: 'hidden sm:table-cell min-w-[100px] sm:min-w-[200px] !px-1 sm:!px-6 text-[10px] sm:text-sm',
      render: (row) => {
        const isOpen = openMaterialMenuId === row.id;
        const matObj = materials.find(m => String(m.value) === String(row.materialCategory));
        const materialLabel = matObj?.label || 'N/A';

        return (
          <div className={`relative ${isOpen ? 'z-30' : 'z-10'}`}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsMaterialMgmtModalOpen(true); }}
              className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
            >
              hiệu chỉnh
            </button>
            <button
              ref={(el) => { materialMenuAnchorRefs.current[`bom-material-${row.id}`] = el; }}
              onClick={(e) => {
                toggleMaterialMenu(e, row.id, `bom-material-${row.id}`);
              }}
              className="w-full text-left outline-none transition-all p-0"
            >
              <div className="hidden sm:flex items-center bg-white border border-gray-300 text-black text-sm rounded-lg p-1 pr-8 appearance-none cursor-pointer relative min-h-[28px] font-normal hover:border-blue-400 transition-colors">
                <span className="truncate flex-1">{materialLabel}</span>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </button>

            {renderMaterialMenu(row, `bom-material-${row.id}`)}

            {false && isOpen && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-2xl z-30 border border-gray-100 p-1.5 flex flex-col animate-in fade-in zoom-in duration-300 origin-top whitespace-normal">
                <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                  <div className="relative">
                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 text-gray-900"
                      placeholder="Tìm nhanh nguyên liệu..."
                      value={materialMenuSearchQuery}
                      onChange={(e) => setMaterialMenuSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Giao diện Menu cho Desktop: Thiết kế chuyên nghiệp, đồng bộ với nhãn hiển thị */}
                <div className="hidden sm:flex flex-col gap-0.5 max-h-52 overflow-y-auto custom-scrollbar px-1">
                  {materials.filter(m => (m.label || '').toLowerCase().includes(materialMenuSearchQuery.toLowerCase())).map((m) => (
                    <button
                      key={m.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBOMMaterialChange(row, m.value);
                      }}
                      className={`px-2 py-1.5 text-[11px] rounded-lg transition-all text-left flex items-center min-w-0 group ${String(row.materialCategory) === String(m.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-blue-50 hover:pl-4'}`}
                    >
                      <span className="truncate flex-1">{m.label}</span>
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
      header: 'Số lượng',
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm', // Ẩn trên mobile
      className: 'hidden sm:table-cell min-w-[150px] !px-2 sm:!px-6 text-[11px] sm:text-sm', // Ẩn trên mobile
      render: (row) => {
        const mat = materials.find(m => String(m.value) === String(row.materialCategory));
        return `${row.requiredQuantity} ${mat?.unit || ''}`;
      }
    },
    {
      header: (
        isBomBulkSelectMode ? (
          <div className="flex w-full items-center justify-center gap-2 text-[10px] sm:text-sm">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAllBoms();
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
                handleClearSelectedBoms();
              }}
              className="font-semibold text-gray-500 hover:text-gray-700"
            >
              Bỏ chọn
            </button>
          </div>
        ) : (
          <div className="flex justify-center items-center w-full text-[11px] sm:text-sm">Hành động</div>
        )
      ),
      headerCellClassName: 'text-[10px] sm:text-sm',
      className: 'text-right !px-2 sm:!px-6 w-[90px] sm:w-[150px]', // Điều chỉnh chiều rộng và padding
      render: (row) => (
        <div className="flex gap-1 sm:gap-2 justify-center">
          {isBomBulkSelectMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSelectBom(row);
              }}
              className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-red-50"
              title={selectedBomIds.includes(getBomId(row)) ? 'Bỏ chọn' : 'Chọn dòng'}
            >
              {selectedBomIds.includes(getBomId(row)) ? (
                <FaRegSquareMinus size={20} className="text-red-600" />
              ) : (
                <FaRegSquare size={20} className="text-gray-400" />
              )}
            </button>
          ) : (
            <>
              <button onClick={() => handleEditItem(row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-[10px] sm:text-sm transition-colors active:scale-95">Sửa</button>
              <button
                onClick={() => setConfirmModal({ isOpen: true, id: getBomId(row), type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa định mức này?' })}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-[10px] sm:text-sm transition-colors active:scale-95"
              >
                Xóa
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const renderBomMobileExpansion = (row) => {
    const matObj = materials.find(m => String(m.value) === String(row.materialCategory));
    const materialLabel = matObj?.label || 'N/A';

    return (
      <div className="grid grid-cols-2 gap-2 p-3 sm:hidden">
        <div className="min-w-0 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Sản phẩm</span>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsItemMgmtModalOpen(true); }}
              className="absolute right-1 top-[-9px] z-20 bg-gray-50 px-0.5 text-[9px] font-bold leading-none text-blue-500 underline hover:text-blue-700"
            >
              hiệu chỉnh
            </button>
            <button
              ref={(el) => { itemMenuAnchorRefs.current[`bom-mobile-item-${row.id}`] = el; }}
              onClick={(e) => {
                toggleItemMenu(e, row.id, `bom-mobile-item-${row.id}`);
              }}
              className="relative block min-h-[34px] w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white p-2 pr-7 text-left text-[11px] font-bold text-blue-600 outline-none transition-colors hover:border-blue-400"
            >
              <span className="block truncate">
                {items.find(i => String(i.value) === String(row.item))?.label || '-- Chọn sản phẩm --'}
              </span>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
                <ChevronDown size={14} />
              </div>
            </button>
            {renderItemMenu(row, `bom-mobile-item-${row.id}`)}
          </div>
        </div>

        <div className="min-w-0 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Nguyên liệu</span>
          <div className={`relative ${openMaterialMenuId === row.id ? 'z-30' : 'z-10'}`}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsMaterialMgmtModalOpen(true); }}
              className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
            >
              hiệu chỉnh
            </button>
            <button
              ref={(el) => { if (el) materialMenuAnchorRefs.current[`bom-mobile-material-${row.id}`] = el; }}
              onClick={(e) => {
                toggleMaterialMenu(e, row.id, `bom-mobile-material-${row.id}`);
              }}
              className="w-full text-left outline-none transition-all p-0"
            >
              <div className="sm:hidden bg-white border border-gray-300 text-black px-2 py-1.5 rounded-lg flex items-center justify-between shadow-sm">
                <span className="truncate text-[11px] font-bold text-blue-600">{row.requiredQuantity} x {materialLabel}</span>
                <ChevronDown size={14} className="text-gray-500 ml-1 shrink-0" />
              </div>
            </button>

            {renderMaterialMenu(row, `bom-mobile-material-${row.id}`)}
          </div>
        </div>

        <div className="hidden">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Số lượng</span>
            <span className="text-sm font-medium text-gray-900">{row.requiredQuantity} {matObj?.unit || ''}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-2xl font-bold mb-4">Danh sách định mức (BOM)</h2>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-4 gap-4">
        <div className="relative w-full lg:max-w-[300px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo sản phẩm hoặc nguyên liệu"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 w-full lg:w-auto lg:flex lg:flex-wrap">
          <button onClick={handleOpenImportModal} className="order-1 lg:order-2 w-full lg:w-auto justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2 text-sm">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="order-2 lg:order-3 w-full lg:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors text-sm">
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button
            onClick={handleBulkDelete}
            className={`order-3 lg:order-1 w-full lg:w-auto justify-center text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all flex items-center gap-2 text-sm ${selectedBomIds.length > 0 ? 'bg-red-700 hover:bg-red-700 shadow-md active:scale-95' : 'bg-red-700 hover:bg-red-700'}`}
          >
            <Trash2 size={18} />
            Xóa nhiều dòng {selectedBomIds.length > 0 && `(${selectedBomIds.length})`}
          </button>
          <button onClick={handleAddItem} className="flex gap-2 items-center order-4 w-full lg:w-auto justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors text-sm">
            <MdAdd />
            <span className="lg:hidden">Thêm mới</span>
            <span className="hidden lg:inline">Thêm định mức mới</span>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-4 text-gray-600">Đang tải dữ liệu định mức...</p>
      ) : (
        <CustomDatatable
          columns={columns}
          data={filteredData}
          renderExpansion={renderBomMobileExpansion}
          bodyCellClassName="!py-2 lg:!py-3"
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thiết lập định mức mới' : 'Chỉnh sửa định mức'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã định mức</label>
            <input
              type="text"
              value={currentEditingItem?.bomCode || currentEditingItem?.BomCode || ''}
              disabled
              className="mt-1 block w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 p-2 text-sm text-gray-500 shadow-sm outline-none"
            />
          </div>
          <CustomSelect
            label="Sản phẩm áp dụng (Thành phẩm)"
            options={items}
            value={currentEditingItem?.item || ''}
            onChange={(e) => {
              setCurrentEditingItem({ ...currentEditingItem, item: e.target.value });
              if (bomErrors.item) setBomErrors(prev => ({ ...prev, item: null }));
            }}
            error={!!bomErrors.item}
            errorMessage={bomErrors.item}
          />
          <CustomSelect
            label="Nguyên vật liệu"
            options={materials}
            value={currentEditingItem?.materialCategory || ''}
            onChange={(e) => {
              setCurrentEditingItem({ ...currentEditingItem, materialCategory: e.target.value });
              if (bomErrors.materialCategory) setBomErrors(prev => ({ ...prev, materialCategory: null }));
            }}
            error={!!bomErrors.materialCategory}
            errorMessage={bomErrors.materialCategory}
          />
          <div>
            <label className={`block text-sm font-medium ${bomErrors.requiredQuantity ? 'text-red-600' : 'text-gray-700'}`}>Số lượng (Định mức)</label>
            <input
              type="number"
              step="0.01"
              value={currentEditingItem?.requiredQuantity ?? ''}
              onChange={(e) => {
                setCurrentEditingItem({ ...currentEditingItem, requiredQuantity: e.target.value });
                if (bomErrors.requiredQuantity) setBomErrors(prev => ({ ...prev, requiredQuantity: null }));
              }}
              className={`mt-1 block w-full border ${bomErrors.requiredQuantity ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm p-2 outline-none focus:ring-2`}
            />
            {bomErrors.requiredQuantity && <p className="mt-1 text-xs font-medium text-red-600">{bomErrors.requiredQuantity}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu</button>
          </div>
        </form>
      </Modal>

      {/* Modal Quản lý Hàng hóa (Items) - Thiết kế giống items.js */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Nhập excel"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="bom-excel-file"
              className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-blue-600 hover:bg-blue-50"
            >
              <FileUp size={32} className="mb-3 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                {selectedImportFile ? selectedImportFile.name : 'Chọn file Excel để nhập'}
              </span>
              <span className="mt-1 text-xs text-gray-500">Hỗ trợ .xlsx</span>
              <input
                id="bom-excel-file"
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
                className="text-xs font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800"
              >
                Tải file mẫu
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleCloseImportModal}
              className="rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleImportExcel}
              disabled={isImportingExcel}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImportingExcel ? 'Đang nhập...' : 'Nhập Excel'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isItemMgmtModalOpen}
        onClose={() => { setIsItemMgmtModalOpen(false); setIsItemMgmtMaximized(false); }}
        title="Danh sách thành phẩm"
        maxWidth={isItemMgmtMaximized ? "max-w-full" : "max-w-6xl"}
        isMaximized={isItemMgmtMaximized}
        onMaximizeToggle={() => setIsItemMgmtMaximized(!isItemMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px] flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm theo tên sản phẩm hoặc danh mục..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => handleOpenItemEdit('add')} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              Thêm hàng hóa
            </button>
          </div>
          <div className={`${isItemMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}>
            <CustomDatatable
              columns={itemMgmtColumns}
              data={filteredItemsForMgmt}
              bodyCellClassName="!py-2 lg:!py-3"
              renderExpansion={(row) => (
                (() => {
                  const filteredStatuses = itemStatuses.filter(s =>
                    s.label.toLowerCase().includes(menuSearchQuery.toLowerCase())
                  );
                  return (
                    <div className="py-4 pl-6 lg:pl-40 pr-6 bg-blue-50/30 border-b border-gray-100 relative">
                      <div className="flex flex-wrap lg:flex-nowrap items-end gap-x-8 lg:gap-x-[140px] gap-y-4 text-sm">
                        {/* Thông tin hiển thị khi bị ẩn ở bảng chính trên Mobile */}
                        <div className="flex flex-col gap-1 lg:hidden flex-none">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Danh mục</span>
                          <div className="relative w-40">
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
                              className="bg-white border border-gray-300 text-gray-900 text-[11px] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none font-medium text-left relative min-h-[30px] hover:border-blue-400 transition-colors"
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
                                      autoFocus={window.innerWidth >= 768}
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
                        </div>

                        <div className="flex flex-col gap-1 sm:hidden flex-none">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Giá bán</span>
                          <span className="text-gray-900 font-medium">{row.price?.toLocaleString()} VNĐ</span>
                        </div>

                        <div className="flex flex-col gap-1 sm:hidden flex-none">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tồn kho</span>
                          <span className="text-gray-900 font-medium">{row.inventory || 0}</span>
                        </div>

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
                              ref={(el) => { if (el) locationMenuAnchorRefs.current[`bom-item-loc-${row.id}`] = el; }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMaterialLocationMenu(e, row.id, `bom-item-loc-${row.id}`);
                              }}
                              className="text-xs block w-full p-1 pr-8 rounded-lg border border-gray-300 bg-white appearance-none cursor-pointer outline-none text-left relative min-h-[26px] hover:border-blue-400 transition-colors"
                            >
                              <span className="truncate block">
                                {warehouses.find(w => String(w.value) === String(row.location))?.label || '-- Chọn --'}
                              </span>
                              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                                <ChevronDown size={14} />
                              </div>
                            </button>

                            {renderMaterialLocationMenu(row, `bom-item-loc-${row.id}`)}
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
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Hàng hóa */}
      <Modal
        isOpen={isItemEditModalOpen}
        onClose={() => { setIsItemEditModalOpen(false); setItemErrors({}); }}
        title={itemEditModalMode === 'add' ? 'Thêm hàng hóa mới' : 'Chỉnh sửa hàng hóa'}
        maxWidth={isItemEditMaximized ? "max-w-full" : "max-w-2xl"}
        isMaximized={isItemEditMaximized}
        onMaximizeToggle={() => setIsItemEditMaximized(!isItemEditMaximized)}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={`text-xs ${itemErrors.name ? 'text-red-600' : 'text-gray-700'}`}>Tên sản phẩm</label>
              <input
                type="text"
                value={itemForm.name}
                onChange={(e) => {
                  setItemForm({ ...itemForm, name: e.target.value });
                  if (itemErrors.name) setItemErrors(prev => ({ ...prev, name: null }));
                }}
                className={`w-full border ${itemErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2 outline-none focus:ring-2 text-sm`}
              />
              {itemErrors.name && <p className="text-xs font-medium text-red-600 mt-0.5">{itemErrors.name}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs ${itemErrors.price ? 'text-red-600' : 'text-gray-700'}`}>Giá bán (VNĐ)</label>
              <input
                type="number"
                value={itemForm.price}
                onChange={(e) => {
                  setItemForm({ ...itemForm, price: e.target.value });
                  if (itemErrors.price) setItemErrors(prev => ({ ...prev, price: null }));
                }}
                className={`w-full border ${itemErrors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2 outline-none focus:ring-2 text-sm`}
              />
              {itemErrors.price && <p className="text-xs font-medium text-red-600 mt-0.5">{itemErrors.price}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Danh mục"
              options={itemCategories}
              value={itemForm.category}
              onChange={(e) => {
                setItemForm({ ...itemForm, category: e.target.value });
                if (itemErrors.category) setItemErrors(prev => ({ ...prev, category: null }));
              }}
              error={!!itemErrors.category}
              errorMessage={itemErrors.category}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Số lượng tồn</label>
              <input type="number" value={itemForm.inventory} onChange={(e) => setItemForm({ ...itemForm, inventory: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Mô tả</label>
            <textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" rows="2"></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${itemErrors.tax ? 'text-red-600' : 'text-gray-700'}`}>Thuế (%)</label>
              <input
                type="number"
                value={itemForm.tax}
                onChange={(e) => {
                  setItemForm({ ...itemForm, tax: e.target.value });
                  if (itemErrors.tax) setItemErrors(prev => ({ ...prev, tax: null }));
                }}
                className={`w-full border ${itemErrors.tax ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2 outline-none focus:ring-2 text-sm`}
              />
              {itemErrors.tax && <p className="text-xs font-medium text-red-600 mt-0.5">{itemErrors.tax}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${itemErrors.weight ? 'text-red-600' : 'text-gray-700'}`}>Cân nặng (kg)</label>
              <input
                type="number"
                step="0.01"
                value={itemForm.weight}
                onChange={(e) => {
                  setItemForm({ ...itemForm, weight: e.target.value });
                  if (itemErrors.weight) setItemErrors(prev => ({ ...prev, weight: null }));
                }}
                className={`w-full border ${itemErrors.weight ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2 outline-none focus:ring-2 text-sm`}
              />
              {itemErrors.weight && <p className="text-xs font-medium text-red-600 mt-0.5">{itemErrors.weight}</p>}
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
            <CustomSelect
              placement="top"
              label="Vị trí kho"
              options={warehouses}
              value={itemForm.location}
              onChange={(e) => {
                setItemForm({ ...itemForm, location: e.target.value });
                if (itemErrors.location) setItemErrors(prev => ({ ...prev, location: null }));
              }}
              error={!!itemErrors.location}
              errorMessage={itemErrors.location}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => { setIsItemEditModalOpen(false); setItemErrors({}); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">Hủy</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 text-sm">Lưu thông tin</button>
          </div>
        </form>
      </Modal>



      {/* Modal Quản lý Nguyên liệu (Materials) - Thiết kế giống materials.js */}
      <Modal
        isOpen={isMaterialMgmtModalOpen}
        onClose={() => { setIsMaterialMgmtModalOpen(false); setIsMaterialMgmtMaximized(false); }}
        title={
          <>
            <span className="hidden sm:inline">Danh sách nguyên liệu tồn kho</span>
            <span className="sm:hidden">Danh sách nguyên liệu</span>
          </>
        }
        maxWidth={isMaterialMgmtMaximized ? "max-w-full" : "max-w-6xl"}
        isMaximized={isMaterialMgmtMaximized}
        onMaximizeToggle={() => setIsMaterialMgmtMaximized(!isMaterialMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px] flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm theo tên nguyên liệu hoặc vị trí..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={materialSearchTerm}
                onChange={(e) => setMaterialSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => handleOpenMaterialEdit('add')} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              <span className="hidden sm:inline">Thêm nguyên liệu</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
          <div className={`${isMaterialMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}>
            <CustomDatatable
              columns={materialMgmtColumns}
              data={filteredMaterialsForMgmt}
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
                            {warehouses.find(w => w.value === row.location)?.label || '-- Chọn --'}
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
                                  autoFocus={window.innerWidth >= 768}
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
                  </div>
                </div>
              )} />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Nguyên liệu */}
      <Modal
        isOpen={isMaterialEditModalOpen}
        onClose={() => { setIsMaterialEditModalOpen(false); setMaterialFormErrors({}); }}
        title={materialEditModalMode === 'add' ? 'Thêm nguyên liệu mới' : 'Chỉnh sửa nguyên liệu'}
        maxWidth={isMaterialEditMaximized ? "max-w-full" : "max-w-xl"}
        isMaximized={isMaterialEditMaximized}
        onMaximizeToggle={() => setIsMaterialEditMaximized(!isMaterialEditMaximized)}
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
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
              options={materialCategories}
              value={materialForm.name || ''}
              onChange={(e) => {
                const categoryId = e.target.value;
                const selectedCat = materialCategories.find(c => String(c.value) === String(categoryId));
                if (materialFormErrors.name) setMaterialFormErrors(prev => ({ ...prev, name: null }));
                setMaterialForm({
                  ...materialForm,
                  name: categoryId,
                  unit: selectedCat ? selectedCat.unit : ''
                });
              }}
              error={!!materialFormErrors.name}
              errorMessage={materialFormErrors.name}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${materialFormErrors.quantity ? 'text-red-600' : 'text-gray-700'}`}>Số lượng</label>
              <input
                type="number"
                value={materialForm.quantity}
                onChange={(e) => {
                  setMaterialForm({ ...materialForm, quantity: e.target.value });
                  if (materialFormErrors.quantity) setMaterialFormErrors(prev => ({ ...prev, quantity: null }));
                }}
                className={`w-full border ${materialFormErrors.quantity ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2 outline-none focus:ring-2 text-sm`}
              />
              {materialFormErrors.quantity && <p className="text-red-500 text-[10px] mt-1 font-medium">{materialFormErrors.quantity}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Đơn vị tính</label>
              <input type="text" value={materialForm.unit} readOnly className="w-full border border-gray-300 rounded-lg p-2 outline-none bg-gray-100 text-gray-500 text-sm cursor-not-allowed" />
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
            <CustomSelect
              label="Vị trí kho"
              options={warehouses}
              value={materialForm.location}
              onChange={(e) => {
                setMaterialForm({ ...materialForm, location: e.target.value });
                if (materialFormErrors.location) setMaterialFormErrors(prev => ({ ...prev, location: null }));
              }}
              error={!!materialFormErrors.location}
              errorMessage={materialFormErrors.location}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => { setIsMaterialEditModalOpen(false); setMaterialFormErrors({}); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">Hủy</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 text-sm">Lưu thông tin</button>
          </div>
        </form>
      </Modal>

      {/* Modal Quản lý danh mục */}
      <Modal
        isOpen={isCategoryMgmtModalOpen}
        onClose={() => { setIsCategoryMgmtModalOpen(false); setIsCategoryMgmtMaximized(false); }}
        title={
          <>
            <span className="hidden sm:inline">Danh sách danh mục sản phẩm</span>
            <span className="sm:hidden">Danh sách danh mục</span>
          </>
        }
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
              <span className="hidden sm:inline">
                Thêm danh mục
              </span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
          <div className={`${isCategoryMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm`}>
            <CustomDatatable columns={categoryMgmtColumns} data={filteredCategoriesForMgmt} />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Danh mục */}
      <Modal
        isOpen={isCategoryEditModalOpen}
        onClose={() => setIsCategoryEditModalOpen(false)}
        title={categoryModalMode === 'add' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
        maxWidth={isCategoryEditMaximized ? "max-w-full" : "max-w-sm"}
        isMaximized={isCategoryEditMaximized}
        onMaximizeToggle={() => setIsCategoryEditMaximized(!isCategoryEditMaximized)}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Tên danh mục</label>
            <input
              type="text"
              value={categoryForm.name || ''}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className={`w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isCategoryEditMaximized ? 'p-3 text-base' : 'p-2 text-sm'}`}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsCategoryEditModalOpen(false)} className={`bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors ${isCategoryEditMaximized ? 'px-6 py-2 text-base' : 'px-4 py-1.5 text-sm'}`}>Hủy</button>
            <button type="submit" className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-bold ${isCategoryEditMaximized ? 'px-8 py-2 text-base' : 'px-4 py-1.5 text-sm'}`}>Lưu</button>
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
            <button onClick={() => { setWarehouseErrors({}); setEditingWarehouse({ name: '', code: '', type: '', available: '', location: '' }); setWarehouseModalMode('add'); setIsWarehouseEditModalOpen(true); }} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              Thêm
            </button>
          </div>
          <div className={`${isWarehousesMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}> {/* This is the div for the CustomDatatable */}
            <CustomDatatable
              columns={warehouseTableColumns}
              data={warehousesRawData.filter(w => (w.name || '').toLowerCase().includes(warehouseSearchTerm.toLowerCase()) || (w.code || '').toLowerCase().includes(warehouseSearchTerm.toLowerCase()))}
              renderExpansion={(row) => (
                <div className="py-4 pl-6 pr-6 bg-blue-50/30 border-b border-gray-100 relative sm:hidden">
                  <div className="flex flex-wrap items-end gap-x-8 gap-y-4 text-sm">
                    {/* Loại kho */}
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Loại kho</span>
                      <div className="relative w-36">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setIsTypeMgmtModalOpen(true); }}
                          className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
                        >
                          hiệu chỉnh
                        </button>
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
                                  autoFocus={window.innerWidth >= 768}
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

      {/* Modal Thêm/Sửa Nhà kho */}
      <Modal
        isOpen={isWarehouseEditModalOpen}
        onClose={() => { setIsWarehouseEditModalOpen(false); setIsWarehouseEditMaximized(false); setWarehouseErrors({}); }}
        title={warehouseModalMode === 'add' ? "Thêm nhà kho mới" : "Chỉnh sửa nhà kho"}
        maxWidth={isWarehouseEditMaximized ? "max-w-full" : "max-w-xl"}
        isMaximized={isWarehouseEditMaximized}
        onMaximizeToggle={() => setIsWarehouseEditMaximized(!isWarehouseEditMaximized)}
      >
        <form onSubmit={handleWarehouseSubmit} className="space-y-4">
          <div className="relative">
            <button type="button" onClick={() => setIsTypeMgmtModalOpen(true)} className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-[11px] font-bold underline z-10">hiệu chỉnh</button>
            <CustomSelect
              label="Loại kho"
              options={warehouseTypes}
              value={editingWarehouse.type || ''}
              onChange={(e) => {
                setEditingWarehouse({ ...editingWarehouse, type: e.target.value });
                if (warehouseErrors.type) setWarehouseErrors(prev => ({ ...prev, type: null }));
              }}
              isModalMaximized={isWarehouseEditMaximized}
              error={!!warehouseErrors.type}
              errorMessage={warehouseErrors.type}
            />
          </div>
          <div className="relative">
            <button type="button" onClick={() => setIsLocMgmtOpen(true)} className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-[11px] font-bold underline z-10">hiệu chỉnh</button>
            <CustomSelect
              label="Vị trí chi tiết"
              options={warehouseLocations}
              value={editingWarehouse.location || ''}
              onChange={(e) => {
                setEditingWarehouse({ ...editingWarehouse, location: e.target.value });
                if (warehouseErrors.location) setWarehouseErrors(prev => ({ ...prev, location: null }));
              }}
              isModalMaximized={isWarehouseEditMaximized}
              error={!!warehouseErrors.location}
              errorMessage={warehouseErrors.location}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${warehouseErrors.available ? 'text-red-600' : 'text-gray-700'}`}>Số lượng tối đa</label>
            <input
              type="number"
              min="0"
              value={editingWarehouse.available ?? ''}
              onChange={(e) => {
                setEditingWarehouse({ ...editingWarehouse, available: e.target.value });
                if (warehouseErrors.available) setWarehouseErrors(prev => ({ ...prev, available: null }));
              }}
              className={`w-full border ${warehouseErrors.available ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none transition-all ${isWarehouseEditMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
            />
            {warehouseErrors.available && <p className="text-xs font-medium text-red-600 italic">{warehouseErrors.available}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsWarehouseEditModalOpen(false); setIsWarehouseEditMaximized(false); setWarehouseErrors({}); }} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu vị trí</button>
          </div>
        </form>
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
            <button onClick={() => handleOpenMaterialCategoryEdit('add')} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              <span className="hidden sm:inline">Thêm danh mục</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
          <div className={`${isCategoryMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm`}>
            <CustomDatatable
              columns={materialCategoryMgmtColumns}
              data={materialCategories.filter(cat => cat.label.toLowerCase().includes(categorySearch.toLowerCase()))}
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
                                  autoFocus={window.innerWidth >= 768}
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

      {/* Modal Thêm/Sửa Danh mục nguyên liệu*/}
      <Modal
        isOpen={isMaterialCategoryEditModalOpen}
        onClose={() => { setIsMaterialCategoryEditModalOpen(false); setIsMaterialCategoryEditMaximized(false); setMaterialCategoryErrors({}); }}
        title={materialCategoryModalMode === 'add' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
        maxWidth={isMaterialCategoryEditMaximized ? "max-w-full" : "max-w-sm"}
        isMaximized={isMaterialCategoryEditMaximized}
        onMaximizeToggle={() => setIsMaterialCategoryEditMaximized(!isMaterialCategoryEditMaximized)}
      >
        <form onSubmit={handleSaveMaterialCategory} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className={`font-medium ${materialCategoryErrors.name ? 'text-red-600' : 'text-gray-700'} ${isMaterialCategoryEditMaximized ? 'text-sm' : 'text-xs'}`}>Tên danh mục</label>
            <input type="text" value={materialCategoryForm.name || ''} onChange={(e) => { setMaterialCategoryErrors(prev => ({ ...prev, name: '' })); setMaterialCategoryForm({ ...materialCategoryForm, name: e.target.value }); }} className={`w-full border ${materialCategoryErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none transition-all ${isMaterialCategoryEditMaximized ? 'p-3 text-base' : 'p-2 text-sm'}`} autoFocus={window.innerWidth >= 768} />
            {materialCategoryErrors.name && <p className="text-xs font-medium text-red-600">{materialCategoryErrors.name}</p>}
          </div>
          <CustomSelect
            label="Đơn vị tính"
            name="unit"
            options={units}
            value={materialCategoryForm.unit || ''}
            onChange={(e) => { setMaterialCategoryErrors(prev => ({ ...prev, unit: '' })); setMaterialCategoryForm({ ...materialCategoryForm, unit: e.target.value }); }}
            isModalMaximized={isMaterialCategoryEditMaximized}
            error={!!materialCategoryErrors.unit}
            errorMessage={materialCategoryErrors.unit}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsMaterialCategoryEditModalOpen(false); setIsMaterialCategoryEditMaximized(false); setMaterialCategoryErrors({}); }} className={`bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors ${isMaterialCategoryEditMaximized ? 'px-6 py-2 text-base' : 'px-4 py-1.5 text-sm'}`}>Hủy</button>
            <button type="submit" className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-bold ${isMaterialCategoryEditMaximized ? 'px-8 py-2 text-base' : 'px-4 py-1.5 text-sm'}`}>Lưu</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isTypeMgmtModalOpen}
        onClose={() => { setIsTypeMgmtModalOpen(false); setIsTypeMgmtMaximized(false); }}
        title="Danh sách loại kho"
        maxWidth={isTypeMgmtMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isTypeMgmtMaximized}
        onMaximizeToggle={() => setIsTypeMgmtMaximized(!isTypeMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên loại kho hoặc ID"
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
              />
            </div>
            <button onClick={() => handleOpenTypeEdit('add')} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              <span className="hidden sm:inline">Thêm loại kho</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
          <div className={`${isTypeMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}>
            <CustomDatatable columns={typeColumns} data={filteredTypes} />
          </div>
        </div>
      </Modal>



      {/* Modal Thêm/Sửa Loại kho */}
      <Modal
        isOpen={isTypeEditModalOpen}
        onClose={() => { setIsTypeEditModalOpen(false); setIsTypeEditMaximized(false); }}
        title={typeModalMode === 'add' ? 'Thêm loại kho mới' : 'Chỉnh sửa loại kho'}
        maxWidth={isTypeEditMaximized ? "max-w-full" : "max-w-sm"}
        isMaximized={isTypeEditMaximized}
        onMaximizeToggle={() => setIsTypeEditMaximized(!isTypeEditMaximized)}
      >
        <form onSubmit={handleSaveType} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Tên loại kho</label>
            <input
              type="text"
              value={typeForm.name || ''}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsTypeEditModalOpen(false); setIsTypeEditMaximized(false); }} className="bg-gray-500 text-white px-4 py-1.5 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm font-bold">Lưu</button>
          </div>
        </form>
      </Modal>

      {/* Modal Quản lý danh sách Vị trí chi tiết */}
      <Modal
        isOpen={isLocMgmtOpen}
        onClose={() => { setIsLocMgmtOpen(false); setIsLocMgmtMaximized(false); }}
        title="Danh sách vị trí nhà kho"
        maxWidth={isLocMgmtMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isLocMgmtMaximized}
        onMaximizeToggle={() => setIsLocMgmtMaximized(!isLocMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên ô, kệ hoặc tầng..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={locSearchTerm}
                onChange={(e) => setLocSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => handleOpenLocEdit('add')} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors">
              <span className="hidden sm:inline">Thêm vị trí</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
          <div className={`${isLocMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}>
            <CustomDatatable columns={locColumns} data={filteredLocs} />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Vị trí kho */}
      <Modal
        isOpen={isLocEditModalOpen}
        onClose={() => { setIsLocEditModalOpen(false); setIsLocEditMaximized(false); setLocErrors({}); }} // Reset errors on close
        title={locModalMode === 'add' ? 'Thêm vị trí mới' : 'Chỉnh sửa vị trí'}
        maxWidth={isLocEditMaximized ? "max-w-full" : "max-w-xl"}
        isMaximized={isLocEditMaximized}
        onMaximizeToggle={() => setIsLocEditMaximized(!isLocEditMaximized)}
      >
        <form onSubmit={handleLocSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${locErrors.bin ? 'text-red-600' : 'text-gray-700'}`}>Ô</label>
            <input
              type="number"
              value={currentEditingLoc?.bin || ''}
              onChange={(e) => {
                setCurrentEditingLoc({ ...currentEditingLoc, bin: e.target.value });
                if (locErrors.bin) setLocErrors(prev => ({ ...prev, bin: null })); // Clear error on change
              }}
              className={`w-full border ${locErrors.bin ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm p-1.5 focus:ring-2 outline-none transition-all ${isModalMaximized ? 'text-base' : 'text-sm'}`}
            />
            {locErrors.bin && <p className="text-red-500 text-[10px] mt-1 font-medium italic">{locErrors.bin}</p>}
          </div>

          <div className="relative">
            <div className="absolute right-0 -top-1 z-20">
              <button type="button" onClick={() => setIsRackMgmtOpen(true)} className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline transition-colors p-1">
                hiệu chỉnh
              </button>
            </div>
            <CustomSelect
              label="Kệ (Rack)"
              options={warehouseRacks.map(r => ({ value: r.id || r.ID, label: r.name || r.Name }))}
              value={currentEditingLoc.racks || ''}
              onChange={(e) => {
                setCurrentEditingLoc({ ...currentEditingLoc, racks: e.target.value });
                if (locErrors.racks) setLocErrors(prev => ({ ...prev, racks: null })); // Clear error on change
              }}
              isModalMaximized={isLocEditMaximized}
              error={!!locErrors.racks}
              errorMessage={locErrors.racks}
            />
            {locErrors.racks && <p className="text-red-500 text-[10px] mt-1 font-medium italic">{locErrors.racks}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${locErrors.level ? 'text-red-600' : 'text-gray-700'}`}>Tầng (Level)</label>
            <input
              type="number"
              value={currentEditingLoc.level || ''}
              onChange={(e) => {
                setCurrentEditingLoc({ ...currentEditingLoc, level: e.target.value });
                if (locErrors.level) setLocErrors(prev => ({ ...prev, level: null })); // Clear error on change
              }}
              className={`w-full border ${locErrors.level ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm p-1.5 focus:ring-2 outline-none text-sm transition-all ${isLocEditMaximized ? 'p-2' : 'p-1.5'}`}
            />
            {locErrors.level && <p className="text-red-500 text-[10px] mt-1 font-medium italic">{locErrors.level}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsLocEditModalOpen(false); setIsLocEditMaximized(false); setLocErrors({}); }} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-bold">Lưu</button>
          </div>
        </form>
      </Modal>

      {/* Modal Quản lý danh sách Kệ của kho */}
      <Modal
        isOpen={isRackMgmtOpen}
        onClose={() => { setIsRackMgmtOpen(false); setIsRackMgmtMaximized(false); }}
        title={<><span className="hidden sm:inline">Quản lý danh sách kệ của kho</span><span className="sm:hidden">Quản lý danh sách kệ</span></>}
        maxWidth={isRackMgmtMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isRackMgmtMaximized}
        onMaximizeToggle={() => setIsRackMgmtMaximized(!isRackMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên kệ..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={rackSearchTerm}
                onChange={(e) => setRackSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => handleOpenRackEdit('add')} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              <span className="hidden sm:inline">Thêm kệ</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>
          <div className={`${isRackMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[400px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}>
            <CustomDatatable columns={rackColumns} data={filteredRacks} />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Tên Kệ */}
      <Modal isOpen={isRackEditModalOpen} onClose={() => { setIsRackEditModalOpen(false); setRackErrors({}); }} title={rackModalMode === 'add' ? 'Thêm kệ mới' : 'Sửa tên kệ'} maxWidth="max-w-sm">
        <form onSubmit={handleRackSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${rackErrors.name ? 'text-red-600' : 'text-gray-700'}`}>Tên Kệ</label>
            <input
              type="text"
              value={currentEditingRack?.name || ''}
              onChange={(e) => {
                setCurrentEditingRack({ ...currentEditingRack, name: e.target.value });
                if (rackErrors.name) setRackErrors(prev => ({ ...prev, name: null }));
              }}
              className={`w-full border ${rackErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md p-2 text-sm focus:ring-2 outline-none`}
              autoFocus={window.innerWidth >= 768}
            />
            {rackErrors.name && <p className="text-red-500 text-xs mt-1 font-medium">{rackErrors.name}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setIsRackEditModalOpen(false); setRackErrors({}); }} className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-200">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu</button>
          </div>
        </form>
      </Modal>

      {/* Xác nhận xóa Kệ */}
      <CustomConfirm
        isOpen={rackConfirmModal.isOpen}
        onClose={() => setRackConfirmModal({ isOpen: false, id: null })}
        onConfirm={handleRackDelete}
        title="Xác nhận xóa kệ"
        message="Hành động này không thể hoàn tác nếu kệ đang có dữ liệu liên quan."
        type="delete"
      />

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
