import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, ChevronDown, ChevronRight, FileUp, FileDown, Trash2, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import { CustomDatatable, Modal, CustomSelect, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { getItems, deleteItem, createItem, updateItem } from '../controller/itemsController';
import { getUsers } from '../controller/usersController';
import { createNotification } from '../controller/notificationsController';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controller/categoriesController';
import { getItemStatuses } from '../controller/itemStatusesController';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../controller/warehousesController';
import { getWarehouseLocations, createWarehouseLocation, updateWarehouseLocation, deleteWarehouseLocation } from '../controller/warehouseLocationsController';
import { createWarehouseRack, deleteWarehouseRack, getWarehouseRacks, updateWarehouseRack } from '../controller/warehouseRacksController';
import { getWarehouseTypes, createWarehouseType, updateWarehouseType, deleteWarehouseType } from '../controller/warehouseTypesController';
import { getWarehouseStatuses } from '../controller/warehouseStatusesController';
import { BsLayoutSidebarInset, BsLayoutSidebarInsetReverse } from "react-icons/bs";
import { VscLayoutSidebarLeftDock, VscLayoutSidebarRightDock } from "react-icons/vsc";
import { RxDrawingPinFilled } from "react-icons/rx";
import { LuSquarePen } from "react-icons/lu";
import { FaRegSquare, FaRegSquareMinus } from "react-icons/fa6";
import { MdAdd } from "react-icons/md";
import { getWarehouseBins } from '../controller/warehouseBinsController';
import { getCookie } from '../utils/cookieHelper';

const API_BASE_URL = 'https://quanlysanxuat-production.up.railway.app/api';

const AnchoredPortalMenu = ({ isOpen, onClose, trigger, children, className = '', anchorClassName = '' }) => {
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});
  const [isPositioned, setIsPositioned] = useState(false);

  useLayoutEffect(() => {
    if (!isOpen) {
      setIsPositioned(false);
      return;
    }

    const updateMenuPosition = () => {
      if (!anchorRef.current) return;

      const rect = anchorRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
      });
      setIsPositioned(true);
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        anchorRef.current &&
        !anchorRef.current.contains(event.target) &&
        (!menuRef.current || !menuRef.current.contains(event.target))
      ) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={anchorRef} className={`relative ${anchorClassName}`}>
      {trigger}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          onClick={(e) => e.stopPropagation()}
          className={`bg-white rounded-md shadow-2xl border border-gray-100 p-1 flex flex-col origin-top whitespace-normal z-[1000] ${isPositioned ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-[0.98] pointer-events-none'} ${className}`}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
};

export const Items = () => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [highlightedItemId, setHighlightedItemId] = useState(null);

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [itemStatuses, setItemStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [isLocMgmtOpen, setIsLocMgmtOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentEditingItem, setCurrentEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategoryMenuId, setOpenCategoryMenuId] = useState(null);
  const [openManufactoryMenuId, setOpenManufactoryMenuId] = useState(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);
  const [openLocationMenuId, setOpenLocationMenuId] = useState(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState([]);
  const [warehouseErrors, setWarehouseErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});
  const [categoryErrors, setCategoryErrors] = useState({});
  const [typeErrors, setTypeErrors] = useState({});
  const [locErrors, setLocErrors] = useState({});
  const [rackErrors, setRackErrors] = useState({});

  // States cho quản lý Vị trí kho (Locations)
  const [rawWarehouseLocations, setRawWarehouseLocations] = useState([]);
  const [locSearchTerm, setLocSearchTerm] = useState('');
  const [isLocMgmtMaximized, setIsLocMgmtMaximized] = useState(false);
  const [isLocEditModalOpen, setIsLocEditModalOpen] = useState(false);
  const [isLocEditMaximized, setIsLocEditMaximized] = useState(false);
  const [locModalMode, setLocModalMode] = useState('add');
  const [currentEditingLoc, setCurrentEditingLoc] = useState({ bin: '', racks: '', level: 1 });
  const [locConfirmModal, setLocConfirmModal] = useState({ isOpen: false, id: null });

  //States cho quản lý Kệ của kho
  const [racks, setRacks] = useState([]);
  const [isRackMgmtOpen, setIsRackMgmtOpen] = useState(false);
  const [rackSearchTerm, setRackSearchTerm] = useState('');
  const [isRackEditModalOpen, setIsRackEditModalOpen] = useState(false);
  const [rackModalMode, setRackModalMode] = useState('add');
  const [currentEditingRack, setCurrentEditingRack] = useState({ name: '' });
  const [rackConfirmModal, setRackConfirmModal] = useState({ isOpen: false, id: null });
  const [isRackMgmtMaximized, setIsRackMgmtMaximized] = useState(false);

  // States cho quản lý Loại kho
  const [isTypeMgmtModalOpen, setIsTypeMgmtModalOpen] = useState(false);
  const [isTypeMgmtMaximized, setIsTypeMgmtMaximized] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');
  const [isTypeEditModalOpen, setIsTypeEditModalOpen] = useState(false);
  const [isTypeEditMaximized, setIsTypeEditMaximized] = useState(false);
  const [typeModalMode, setTypeModalMode] = useState('add');
  const [typeForm, setTypeForm] = useState({ id: null, name: '' });

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
  const [openTypeMenuId, setOpenTypeMenuId] = useState(null);
  const [typeMenuSearchQuery, setTypeMenuSearchQuery] = useState('');
  const [warehouseModalMode, setWarehouseModalMode] = useState('list'); // 'list', 'add', 'edit'
  const [isWarehousesMgmtMaximized, setIsWarehousesMgmtMaximized] = useState(false);
  const [isWarehouseEditModalOpen, setIsWarehouseEditModalOpen] = useState(false);
  const [isWarehouseEditMaximized, setIsWarehouseEditMaximized] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState({ name: '', code: '', type: '', available: 0, location: '' });
  const [warehousesRawData, setWarehousesRawData] = useState([]);
  const [warehouseTypes, setWarehouseTypes] = useState([]);
  const [warehouseStatuses, setWarehouseStatuses] = useState([]);
  const [warehouseLocations, setWarehouseLocations] = useState([]);
  const [warehouseRacks, setWarehouseRacks] = useState([]);
  const [warehouseBins, setWarehouseBins] = useState([]);

  // Lắng nghe sự kiện click toàn cục để đóng menu khi bấm ra ngoài
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenCategoryMenuId(null);
      setOpenManufactoryMenuId(null);
      setOpenStatusMenuId(null);
      setOpenLocationMenuId(null);
      setOpenTypeMenuId(null);
      setMenuSearchQuery('');
      setTypeMenuSearchQuery('');
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

  const getEntityId = (entity) => entity?.id || entity?.ID || entity?.Id;
  const getEntityValue = (entity, camelKey, pascalKey) => entity?.[camelKey] ?? entity?.[pascalKey];
  const getExcelText = (cell) => {
    if (!cell) return '';
    if (cell.text !== undefined && cell.text !== null) return String(cell.text).trim();
    if (cell.value === undefined || cell.value === null) return '';
    if (typeof cell.value === 'object') {
      if (cell.value.text !== undefined) return String(cell.value.text).trim();
      if (cell.value.result !== undefined) return String(cell.value.result).trim();
      if (Array.isArray(cell.value.richText)) return cell.value.richText.map(part => part.text || '').join('').trim();
    }
    return String(cell.value).trim();
  };
  const normalizeImportText = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/^kho hang hoa:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const parseImportNumber = (value) => {
    const text = String(value || '').replace(/[^\d,.-]/g, '').trim();
    if (!text) return null;
    const normalized = text.includes(',') && !text.includes('.')
      ? text.replace(',', '.')
      : text.replace(/,/g, '');
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  };

  // Logic lọc dữ liệu dựa trên searchTerm
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const categoryLabel = categories.find(c => String(c.value) === String(item.category || item.Category))?.label || '';
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

  // Reset về trang 1 khi tìm kiếm thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Logic tự động nhảy trang khi được điều hướng từ thông báo
  useEffect(() => {
    const targetId = location.state?.targetItemId;
    if (targetId && filteredItems.length > 0) {
      const index = filteredItems.findIndex(item => getEntityId(item) === targetId);
      if (index !== -1) {
        const targetPage = Math.floor(index / rowsPerPage) + 1;
        setCurrentPage(targetPage);

        // Thiết lập highlight
        setHighlightedItemId(targetId);

        // Xóa highlight sau 3 giây
        const timer = setTimeout(() => setHighlightedItemId(null), 3000);

        // Xóa state trong location để tránh nhảy trang lại khi F5
        window.history.replaceState({}, document.title);

        return () => clearTimeout(timer);
      }
    }
  }, [location.state, filteredItems, rowsPerPage]);

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
        const [warehousesData, locationData, rackData, typesData, statusesData, binData] = await Promise.all([
          getWarehouses(),
          getWarehouseLocations(),
          getWarehouseRacks(),
          getWarehouseTypes(),
          getWarehouseStatuses(),
          getWarehouseBins()
        ]);

        setWarehousesRawData(warehousesData);
        setRawWarehouseLocations(locationData.map(l => ({ ...l, id: l.id || l.ID })));
        setWarehouseRacks(rackData);
        setRacks(rackData);
        setWarehouseTypes(typesData.map(wt => ({ value: wt.id, label: wt.name })));
        setWarehouseStatuses(statusesData.map(ws => ({ value: ws.id, label: ws.name })));
        setWarehouseLocations(locationData.map(l => {
          const rackObj = rackData.find(r => String(r.id || r.ID) === String(l.racks || l.Racks));
          const rackName = rackObj ? (rackObj.name || rackObj.Name) : (l.racks || l.Racks);
          const binName = l.bin;
          return {
            value: l.id || l.ID,
            label: `Kệ ${rackName} - Tầng ${l.level || l.Level} - Ô ${binName}`
          };
        }));

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
        setItems(items.filter(item => getEntityId(item) !== id));
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
        setItems(items.filter(item => !id.includes(getEntityId(item))));
        setSelectedItemIds([]);
        setIsBulkSelectMode(false);
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
    } else if (type === 'deleteType') {
      try {
        await deleteWarehouseType(id);
        showNotification("Xóa loại kho thành công!");
        fetchWarehouseTypes();
      } catch (err) {
        showNotification("Lỗi khi xóa loại kho. Vui lòng kiểm tra các vị trí kho đang sử dụng loại này.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleBulkDelete = () => {
    if (!isBulkSelectMode) {
      setIsBulkSelectMode(true);
      setSelectedItemIds([]);
      return;
    }

    if (selectedItemIds.length === 0) {
      setIsBulkSelectMode(false);
      setSelectedItemIds([]);
      return;
    }

    setConfirmModal({
      isOpen: true,
      id: selectedItemIds,
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều hàng hóa',
      message: `Bạn có chắc chắn muốn xóa ${selectedItemIds.length} hàng hóa đã chọn không? Hành động này không thể hoàn tác.`
    });
  };

  const handleSelectAllItems = () => {
    const visibleItemIds = filteredItems.map(item => getEntityId(item)).filter(Boolean);
    setSelectedItemIds(visibleItemIds);
  };

  const handleClearSelectedItems = () => {
    setSelectedItemIds([]);
  };

  const handleToggleSelectItem = (row) => {
    const rowId = getEntityId(row);
    setSelectedItemIds(prev => prev.includes(rowId)
      ? prev.filter(id => id !== rowId)
      : [...prev, rowId]
    );
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách hàng hóa ra tệp Excel không?'
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
    window.location.href = `${API_BASE_URL}/Templates/import/items`;
  };

  const getImportWarehouseLabel = (warehouse) => {
    const locationId = warehouse.location ?? warehouse.Location;
    const loc = rawWarehouseLocations.find(l => String(l.id || l.ID) === String(locationId));
    if (!loc) return '';

    const rackId = loc.racks ?? loc.Racks;
    const binId = loc.bin ?? loc.Bin;
    const rack = warehouseRacks.find(r => String(r.id || r.ID) === String(rackId));
    const rackName = rack ? (rack.name || rack.Name) : rackId;
    const binName = loc.bin;
    const level = loc.level ?? loc.Level;

    return `Kho hàng hóa: Kệ ${rackName} - Tầng ${level} - Ô ${binName}`;
  };

  const getImportWarehouseLookupLabels = (warehouse) => {
    const fullLabel = getImportWarehouseLabel(warehouse);
    const shortLabel = fullLabel.replace(/^Kho hàng hóa:\s*/i, '');
    return [fullLabel, shortLabel].filter(Boolean);
  };

  const buildImportItemPayload = (baseItem, importedValues) => {
    const itemId = getEntityId(baseItem);

    return {
      id: itemId || 0,
      name: importedValues.name,
      itemCode: importedValues.itemCode,
      description: getEntityValue(baseItem, 'description', 'Description') ?? null,
      price: importedValues.price,
      inventory: importedValues.inventory,
      category: importedValues.category,
      manufactory: getEntityValue(baseItem, 'manufactory', 'Manufactory') ?? null,
      material: getEntityValue(baseItem, 'material', 'Material') ?? null,
      tax: getEntityValue(baseItem, 'tax', 'Tax') ?? null,
      weight: importedValues.weight,
      status: getEntityValue(baseItem, 'status', 'Status') ?? null,
      createdAt: getEntityValue(baseItem, 'createdAt', 'CreatedAt') ?? null,
      updatedAt: getEntityValue(baseItem, 'updatedAt', 'UpdatedAt') ?? null,
      createdBy: getEntityValue(baseItem, 'createdBy', 'CreatedBy') ?? null,
      transportVehicle: getEntityValue(baseItem, 'transportVehicle', 'TransportVehicle') ?? null,
      transportRoute: getEntityValue(baseItem, 'transportRoute', 'TransportRoute') ?? null,
      location: importedValues.location
    };
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

    try {
      setIsImportingExcel(true);

      const workbook = new ExcelJS.Workbook();
      const buffer = await selectedImportFile.arrayBuffer();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        showNotification("File Excel không có sheet dữ liệu.", "error");
        return;
      }

      const categoryMap = new Map(categories.map(category => [
        normalizeImportText(category.label),
        category.value
      ]));
      const warehouseMap = new Map();
      warehousesRawData
        .filter(warehouse => Number(warehouse.type ?? warehouse.Type) === 1)
        .forEach(warehouse => {
          const warehouseId = warehouse.id || warehouse.ID;
          getImportWarehouseLookupLabels(warehouse).forEach(label => {
            const normalizedLabel = normalizeImportText(label);
            if (normalizedLabel) warehouseMap.set(normalizedLabel, warehouseId);
          });
        });
      const itemMap = new Map(items.map(item => [
        normalizeImportText(item.itemCode || item.ItemCode),
        item
      ]));

      let createdCount = 0;
      let updatedCount = 0;
      const skippedRows = [];
      const importedItems = [];

      const rowNumbers = [];
      worksheet.eachRow({ includeEmpty: false }, (_, rowNumber) => {
        if (rowNumber >= 2) rowNumbers.push(rowNumber);
      });

      for (const rowNumber of rowNumbers) {
        const row = worksheet.getRow(rowNumber);
        try {
          const itemCode = getExcelText(row.getCell(2));
          const itemName = getExcelText(row.getCell(3));
          const categoryName = getExcelText(row.getCell(4));
          const priceText = getExcelText(row.getCell(5));
          const inventoryText = getExcelText(row.getCell(6));
          const weightText = getExcelText(row.getCell(8));
          const locationText = getExcelText(row.getCell(9));

          if (!itemCode && !itemName && !categoryName && !priceText && !inventoryText && !weightText && !locationText) {
            continue;
          }

          if (!itemCode) {
            skippedRows.push(`Dòng ${rowNumber}: thiếu Mã thành phẩm`);
            continue;
          }

          const existingItem = itemMap.get(normalizeImportText(itemCode));
          const categoryId = categoryName ? categoryMap.get(normalizeImportText(categoryName)) : getEntityValue(existingItem, 'category', 'Category') ?? null;
          const locationId = locationText ? warehouseMap.get(normalizeImportText(locationText)) : getEntityValue(existingItem, 'location', 'Location') ?? null;

          if (categoryName && !categoryId) {
            skippedRows.push(`Dòng ${rowNumber}: không tìm thấy Danh mục "${categoryName}"`);
            continue;
          }

          if (locationText && !locationId) {
            skippedRows.push(`Dòng ${rowNumber}: không tìm thấy Vị trí "${locationText}"`);
            continue;
          }

          const importedValues = {
            itemCode,
            name: itemName || getEntityValue(existingItem, 'name', 'Name') || null,
            category: categoryId,
            price: priceText ? parseImportNumber(priceText) : getEntityValue(existingItem, 'price', 'Price') ?? null,
            inventory: inventoryText ? parseInt(parseImportNumber(inventoryText), 10) : getEntityValue(existingItem, 'inventory', 'Inventory') ?? null,
            weight: weightText ? parseImportNumber(weightText) : getEntityValue(existingItem, 'weight', 'Weight') ?? null,
            location: locationId
          };

          const payload = buildImportItemPayload(existingItem || {}, importedValues);

          if (existingItem) {
            const updatedItem = await updateItem(getEntityId(existingItem), payload);
            const mergedItem = { ...existingItem, ...updatedItem, ...payload, id: getEntityId(existingItem) };
            importedItems.push(mergedItem);
            itemMap.set(normalizeImportText(itemCode), mergedItem);
            updatedCount++;
          } else {
            const createdItem = await createItem(payload);
            const mergedItem = { ...createdItem, itemCode, ItemCode: itemCode };
            importedItems.push(mergedItem);
            itemMap.set(normalizeImportText(itemCode), mergedItem);
            createdCount++;
          }
        } catch (rowError) {
          console.error(`Error importing row ${rowNumber}:`, rowError);
          skippedRows.push(`Dòng ${rowNumber}: lỗi khi lưu dữ liệu`);
        }
      }

      if (importedItems.length > 0) {
        setItems(prevItems => {
          const importedMap = new Map(importedItems.map(item => [getEntityId(item), item]));
          const nextItems = prevItems.map(item => importedMap.get(getEntityId(item)) || item);
          const existingIds = new Set(prevItems.map(item => getEntityId(item)));
          importedItems.forEach(item => {
            if (!existingIds.has(getEntityId(item))) nextItems.push(item);
          });
          return nextItems;
        });
      }

      handleCloseImportModal();
      const skippedMessage = skippedRows.length ? ` Bỏ qua ${skippedRows.length} dòng.` : '';
      showNotification("Nhập Excel thành công");
      if (skippedRows.length) console.warn("Các dòng không nhập được:", skippedRows);
    } catch (err) {
      console.error("Error importing items from Excel:", err);
      showNotification("Lỗi khi nhập Excel. Vui lòng kiểm tra lại file.", "error");
    } finally {
      setIsImportingExcel(false);
    }
  };

  const handleEditItem = (item) => {
    setModalMode('edit');
    setCurrentEditingItem(item);
    setWarehouseErrors({}); // Clear warehouse errors when opening item modal
    setItemErrors({});
    setIsModalOpen(true);
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

  // Logic cho Rack Management (Tương tự Bin Management)
  const filteredRacks = useMemo(() => {
    return racks.filter(r => r.name.toLowerCase().includes(rackSearchTerm.toLowerCase()));
  }, [racks, rackSearchTerm]);

  const handleOpenRackEdit = (mode, rack = null) => {
    setRackModalMode(mode);
    setCurrentEditingRack(rack || { name: '' });
    setRackErrors({})
    setIsRackEditModalOpen(true);
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

  const rackColumns = [
    {
      header: 'STT',
      className: 'text-[11px] sm:text-sm !px-2',
      headerCellClassName: 'text-[11px] sm:text-xs !px-2',
      bodyCellClassName: '!py-2 sm: !py-4',
      render: (_, { index }) => index
    },
    {
      header: <><span className="hidden sm:inline">Tên Kệ</span><span className="sm:hidden">Tên</span></>,
      className: 'text-[11px] sm:text-sm !px-2',
      headerCellClassName: 'text-[11px] sm:text-xs !px-2 !py-2 sm: !py-4',
      bodyCellClassName: '!py-2 sm: !py-4',
      accessor: 'name'
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


  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({
      name: '',
      itemCode: '',
      price: '',
      description: '',
      category: '',
      inventory: 0,
      material: '',
      tax: '',
      weight: '',
      status: '', // Để trống để người dùng chọn
      location: ''
    });
    setWarehouseErrors({}); // Clear warehouse errors when opening item modal
    setItemErrors({});
    setIsModalOpen(true);
  };

  const toggleModalMaximize = () => {
    setIsModalMaximized(prev => !prev);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingItem(null);
    setItemErrors({});
    setWarehouseErrors({}); // Clear warehouse errors when closing item modal
    setIsModalMaximized(false); // Reset trạng thái khi đóng
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingItem(prev => ({ ...prev, [name]: value }));
    // Xóa lỗi của trường đang nhập khi người dùng thay đổi giá trị
    if (itemErrors[name]) {
      setItemErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCategoryChange = async (item, newCategoryId) => {
    try {
      const updatedValue = newCategoryId === "" ? null : parseInt(newCategoryId);
      const itemId = getEntityId(item);
      const updated = await updateItem(itemId, { ...item, category: updatedValue, Category: updatedValue });
      const updatedItem = { ...item, ...updated, category: updatedValue, Category: updatedValue };
      const updatedId = getEntityId(updatedItem);
      setItems(prev => prev.map(i => getEntityId(i) === updatedId ? updatedItem : i));
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
      const itemId = getEntityId(item);
      const itemPayload = {
        id: itemId,
        name: getEntityValue(item, 'name', 'Name') ?? null,
        itemCode: getEntityValue(item, 'itemCode', 'ItemCode') ?? null,
        description: getEntityValue(item, 'description', 'Description') ?? null,
        price: getEntityValue(item, 'price', 'Price') ?? null,
        inventory: getEntityValue(item, 'inventory', 'Inventory') ?? null,
        category: getEntityValue(item, 'category', 'Category') ?? null,
        manufactory: getEntityValue(item, 'manufactory', 'Manufactory') ?? null,
        material: getEntityValue(item, 'material', 'Material') ?? null,
        tax: getEntityValue(item, 'tax', 'Tax') ?? null,
        weight: getEntityValue(item, 'weight', 'Weight') ?? null,
        status: getEntityValue(item, 'status', 'Status') ?? null,
        createdAt: getEntityValue(item, 'createdAt', 'CreatedAt') ?? null,
        updatedAt: getEntityValue(item, 'updatedAt', 'UpdatedAt') ?? null,
        createdBy: getEntityValue(item, 'createdBy', 'CreatedBy') ?? null,
        transportVehicle: getEntityValue(item, 'transportVehicle', 'TransportVehicle') ?? null,
        transportRoute: getEntityValue(item, 'transportRoute', 'TransportRoute') ?? null,
        location: updatedValue
      };
      const updated = await updateItem(itemId, itemPayload);
      const updatedItem = { ...item, ...updated, location: updatedValue, Location: updatedValue };
      const updatedId = getEntityId(updatedItem);
      setItems(prev => prev.map(i => getEntityId(i) === updatedId ? updatedItem : i));
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
    setCategoryErrors({});
    setIsCategoryEditModalOpen(true);
    setIsCategoryEditMaximized(false);
  };

  const handleOpenTypeEdit = (mode, type = null) => {
    setTypeModalMode(mode);
    setTypeForm(type ? { id: type.value, name: type.label } : { id: null, name: '' });
    setTypeErrors({}); // Clear errors when opening modal
    setIsTypeEditModalOpen(true);
    setIsTypeEditMaximized(false);
  };

  const handleOpenLocEdit = (mode, loc = null) => {
    setLocModalMode(mode);
    setLocErrors({});
    setCurrentEditingLoc(loc ? {
      id: loc.id,
      bin: loc.bin || loc.Bin,
      racks: loc.racks || loc.Racks,
      level: loc.level || loc.Level
    } : { bin: '', racks: '', level: 1 });
    setIsLocEditModalOpen(true);
    setIsLocEditMaximized(false);
  };

  const handleLocSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!currentEditingLoc.bin) errors.bin = "Bắt buộc nhập Ô";
    if (!currentEditingLoc.racks) errors.racks = "Bắt buộc chọn Kệ";
    if (currentEditingLoc.level === '' || currentEditingLoc.level === undefined || currentEditingLoc.level === null) errors.level = "Bắt buộc nhập Tầng";

    if (Object.keys(errors).length > 0) {
      setLocErrors(errors);
      return;
    }
    setLocErrors({});

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

  const handleLocDelete = async () => {
    try {
      await deleteWarehouseLocation(locConfirmModal.id);
      showNotification("Xóa vị trí thành công!");
      const locationData = await getWarehouseLocations();
      setRawWarehouseLocations(locationData.map(l => ({ ...l, id: l.id || l.ID })));
      setLocConfirmModal({ isOpen: false, id: null });
    } catch (err) {
      showNotification("Không thể xóa vị trí này vì có thể đang được sử dụng.", "error");
    }
  };

  const handleSaveType = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!typeForm.name.trim()) errors.name = "Bắt buộc nhập Tên loại kho";

    if (Object.keys(errors).length > 0) {
      setTypeErrors(errors);
      return;
    }
    setTypeErrors({}); // Clear errors if validation passes

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

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      setCategoryErrors({ name: "Bắt buộc nhập Tên danh mục" });
      return;
    }
    setCategoryErrors({});
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
            <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-md shadow-2xl z-20 border border-gray-100 p-1 flex flex-col animate-in zoom-in duration-200 origin-top whitespace-normal">
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
              <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in zoom-in duration-200 origin-top whitespace-normal">
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
            onClick={() => handleDeleteWarehouse(row.id)}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-all active:scale-95"
          >Xóa</button>
        </div>
      )
    }
  ], [warehouseTypes, warehouseStatuses, warehouseLocations, handleDeleteWarehouse, setIsLocMgmtOpen]);

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    const hasEmptyWarehouseAvailable = editingWarehouse.available === '' || editingWarehouse.available === null || editingWarehouse.available === undefined;

    const errors = {};
    if (!editingWarehouse.type) errors.type = "Bắt buộc nhập Loại kho";
    if (!editingWarehouse.location) errors.location = "Bắt buộc nhập Vị trí chi tiết";

    if (hasEmptyWarehouseAvailable) errors.available = "Bắt buộc nhập Số lượng tối đa";

    if (Object.keys(errors).length > 0) {
      setWarehouseErrors(errors);
      return;
    }
    setWarehouseErrors({}); // Clear errors if validation passes


    try {
      const payload = {
        ...editingWarehouse,
        type: editingWarehouse.type === '' ? null : parseInt(editingWarehouse.type),
        available: editingWarehouse.available === '' ? null : parseInt(editingWarehouse.available),
        location: editingWarehouse.location === '' ? null : parseInt(editingWarehouse.location),
      };
      if (warehouseModalMode === 'add') {
        const addedWarehouse = await createWarehouse(payload);
        showNotification("Thêm nhà kho thành công!");

        // Gửi thông báo cho tất cả người dùng
        try {
          const userList = await getUsers();
          const sender = JSON.parse(getCookie('user') || '{}');
          const typeLabel = warehouseTypes.find(t => String(t.value) === String(payload.type))?.label || 'N/A';
          const locLabel = warehouseLocations.find(l => String(l.value) === String(payload.location))?.label || 'N/A';

          const notificationPayload = {
            message: `Người dùng ${sender?.name || sender?.username} vừa tạo một nhà kho ${locLabel} có loại kho ${typeLabel} trong danh sách loại kho`,
            type: 'warehouse_created',
            referenceId: getEntityId(addedWarehouse),
            Sender: sender?.username,
            isRead: false,
            createdAt: new Date().toISOString(),
            ReferenceType: 'warehouse',
          };

          await Promise.all((userList.$values || userList).map(u =>
            createNotification({ ...notificationPayload, Receiver: u.username || u.Username })
          ));
        } catch (notifErr) {
          console.error("Lỗi khi gửi thông báo nhà kho:", notifErr);
        }
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

    // Logic kiểm tra tính hợp lệ của dữ liệu
    const errors = {};
    if (!currentEditingItem?.name?.trim()) errors.name = "Bắt buộc nhập Tên sản phẩm";
    if (currentEditingItem?.price === '' || currentEditingItem?.price === undefined || currentEditingItem?.price === null) errors.price = "Bắt buộc nhập Giá (VNĐ)";
    if (currentEditingItem?.tax === '' || currentEditingItem?.tax === undefined || currentEditingItem?.tax === null) errors.tax = "Bắt buộc nhập Thuế";
    if (currentEditingItem?.weight === '' || currentEditingItem?.weight === undefined || currentEditingItem?.weight === null) errors.weight = "Bắt buộc nhập Cân nặng";
    if (!currentEditingItem?.category) errors.category = "Bắt buộc nhập Danh mục";
    if (!currentEditingItem?.location) errors.location = "Bắt buộc nhập Vị trí (Nhà kho)";

    if (Object.keys(errors).length > 0) {
      setItemErrors(errors);
      return;
    }
    setItemErrors({});

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

        // Gửi thông báo cho tất cả người dùng
        try {
          const userList = await getUsers();
          const sender = JSON.parse(getCookie('user') || '{}');
          const notificationPayload = {
            Message: `Người dùng ${sender?.name || sender?.username} vừa tạo một thành phẩm ${newItem.name} trong danh sách thành phẩm`,
            Type: 'item_created',
            Receiver: '', // Sẽ gán trong vòng lặp
            Sender: sender?.username,
            ReferenceType: 'item',
            ReferenceId: getEntityId(newItem)
          };

          // Gửi thông báo đến từng người dùng
          await Promise.all((userList.$values || userList).map(u =>
            createNotification({ ...notificationPayload, Receiver: u.username || u.Username })
          ));
        } catch (notifErr) {
          console.error("Lỗi khi gửi thông báo:", notifErr);
        }
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
        { header: 'Mã thành phẩm', key: 'itemCode', width: 18 },
        { header: 'Tên sản phẩm', key: 'name', width: 30 },
        { header: 'Danh mục', key: 'category', width: 25 },
        { header: 'Giá', key: 'price', width: 15 },
        { header: 'Tồn kho', key: 'inventory', width: 12 },
        { header: 'Thuế', key: 'tax', width: 10 },
        { header: 'Cân nặng', key: 'weight', width: 15 },
        { header: 'Vị trí', key: 'location', width: 40 },
      ];

      // Đổ dữ liệu vào rows và xử lý mapping label
      filteredItems.forEach((item, index) => {
        const categoryLabel = categories.find(c => String(c.value) === String(item.category || item.Category))?.label || '';
        const statusLabel = itemStatuses.find(s => String(s.value) === String(item.status))?.label || '';
        const warehouseLabel = warehouses.find(w => String(w.value) === String(item.location))?.label || '';

        worksheet.addRow({
          stt: index + 1,
          itemCode: item.itemCode || item.ItemCode || '',
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

        // Thêm viền cho các ô
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          };

          if (rowNumber === 1 || colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          } else if ([5, 6, 7, 8].includes(colNumber)) {
            cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          }
        });

        if (rowNumber === 1) {
          // Định dạng Header: In đậm, Cao 30px
          row.height = 30;
          row.font = { name: 'Times New Roman', size: 12, bold: true };
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
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div>
          <label htmlFor="name" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Tên sản phẩm</label>
          <input type="text" id="name" name="name" value={currentEditingItem?.name || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${itemErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
          {itemErrors.name && <p className="text-red-500 text-xs mt-1 font-medium">{itemErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="itemCode" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Mã thành phẩm</label>
          <input
            type="text"
            id="itemCode"
            name="itemCode"
            value={currentEditingItem?.itemCode || currentEditingItem?.ItemCode || ''}
            disabled
            className={`mt-1 block w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-md shadow-sm cursor-not-allowed outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
            className={itemErrors.category ? "!border-red-500 focus:!ring-red-500" : ""}
          />
          {itemErrors.category && <p className="text-red-500 text-xs mt-1  font-medium">{itemErrors.category}</p>}
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
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div>
          <label htmlFor="tax" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Thuế</label>
          <input type="text" id="tax" name="tax" value={currentEditingItem?.tax || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${itemErrors.tax ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
          {itemErrors.tax && <p className="text-red-500 text-xs mt-1 font-medium">{itemErrors.tax}</p>}
        </div>
        <div>
          <label htmlFor="weight" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Cân nặng</label>
          <input type="number" id="weight" name="weight" value={currentEditingItem?.weight || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${itemErrors.weight ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
          {itemErrors.weight && <p className="text-red-500 text-xs mt-1 font-medium">{itemErrors.weight}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div>
          <label htmlFor="price" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Giá (VNĐ)</label>
          <input type="number" id="price" name="price" value={currentEditingItem?.price || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${itemErrors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
          {itemErrors.price && <p className="text-red-500 text-xs mt-1 font-medium">{itemErrors.price}</p>}
        </div>
      </div>
      <div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsWarehousesModalOpen(true)}
            className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-xs font-bold underline z-10"
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
            className={itemErrors.location ? "!border-red-500 focus:!ring-red-500" : ""}
          />
          {itemErrors.location && <p className="text-red-500 text-xs mt-1 font-medium">{itemErrors.location}</p>}
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
    {
      header: 'Mã',
      className: 'hidden lg:table-cell w-[120px] text-left text-[11px] sm:text-sm !px-2 sm:!px-6',
      headerCellClassName: 'hidden lg:table-cell text-[10px] sm:text-sm',
      render: (row) => (
        <span className="font-semibold text-gray-700 whitespace-nowrap">
          {row.itemCode || row.ItemCode || '--'}
        </span>
      )
    },
    { header: 'Tên thành phẩm', accessor: 'name', headerCellClassName: 'text-[10px]  sm:text-sm', className: 'font-medium text-blue-600 text-[11px] sm:text-sm min-w-[100px] sm:min-w-[140px] !px-2 sm:!px-6' },
    {
      header: 'Danh mục',
      className: 'hidden lg:table-cell w-[180px]',
      headerCellClassName: 'hidden lg:table-cell text-[10px] sm:text-sm',
      render: (row) => (
        <div className="relative">
          <AnchoredPortalMenu
            isOpen={openCategoryMenuId === getEntityId(row)}
            onClose={() => setOpenCategoryMenuId(null)}
            trigger={(
              <>
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
                    const rowId = getEntityId(row);
                    if (openCategoryMenuId !== rowId) setMenuSearchQuery('');
                    setOpenCategoryMenuId(openCategoryMenuId === rowId ? null : rowId);
                    setOpenStatusMenuId(null);
                    setOpenManufactoryMenuId(null);
                    setOpenLocationMenuId(null);
                  }}
                  className="bg-white border border-gray-300 text-gray-900 text-[11px] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none font-medium text-left relative min-h-[30px] hover:border-blue-400 transition-colors"
                >
                  <span className="truncate block">
                    {categories.find(c => String(c.value) === String(row.category || row.Category))?.label || '-- Chọn --'}
                  </span>
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown size={14} />
                  </div>
                </button>
              </>
            )}
            anchorClassName="w-40"
          >

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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCategoryChange(row, cat.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.category || row.Category) === String(cat.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <span className="block w-full !whitespace-normal break-words leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </AnchoredPortalMenu>
        </div>
      )
    },
    {
      header: 'Tồn kho',
      accessor: 'inventory',
      headerCellClassName: 'text-[10px] sm:text-sm',
      className: 'w-[60px] sm:w-[120px] text-center text-[11px] sm:text-sm !px-2 sm:!px-6',
      render: (row) => (
        <span>
          {row.inventory || 0}
        </span>
      )
    },
    {
      header: (
        isBulkSelectMode ? (
          <div className="flex w-full items-center justify-center gap-2 text-[10px] sm:text-sm">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAllItems();
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
                handleClearSelectedItems();
              }}
              className="font-semibold text-gray-500 hover:text-gray-700"
            >
              Bỏ chọn
            </button>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center text-[10px] sm:text-sm">Hành động</div>
        )
      ),
      className: 'text-center w-[100px] sm:w-[180px]',
      render: (row) => (
        <div className="flex justify-center items-center gap-3">
          {isBulkSelectMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSelectItem(row);
              }}
              className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-red-50"
              title={selectedItemIds.includes(getEntityId(row)) ? 'Bỏ chọn' : 'Chọn dòng'}
            >
              {selectedItemIds.includes(getEntityId(row)) ? (
                <FaRegSquareMinus size={20} className="text-red-600" />
              ) : (
                <FaRegSquare size={20} className="text-gray-400" />
              )}
            </button>
          ) : (
            <div className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
              <button
                onClick={(e) => { e.stopPropagation(); handleEditItem(row); }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-all active:scale-95 flex items-center gap-1.5"
                title="Sửa"
              >
                <span className="sm:inline">Sửa</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteItem(getEntityId(row)); }}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-all active:scale-95 flex items-center gap-1.5"
                title="Xóa"
              >
                <span className="sm:inline">Xóa</span>
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const categoryMgmtColumns = [
    { header: 'STT', className: '!px-1 sm:!px-6', render: (_, { index }) => index },
    { header: 'Tên danh mục', className: '!px-1 sm:!px-6', render: (row) => <span className="font-bold text-gray-700">{row.label}</span> },
    {
      header: 'Hành động',
      className: 'text-right pr-5 !px-1 sm:!px-6',
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
      render: (row) => <span className="font-bold text-blue-600">{warehouseRacks.find(r => String(r.id || r.ID) === String(row.racks || row.Racks))?.name || 'N/A'}</span>
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

  return (
    <div className="p-2 lg:p-6"> {/* Removed bg-white, rounded-lg, shadow-md from here, moved to CustomDatatable */}
      <h2 className="text-2xl font-bold mb-4">Danh sách thành phẩm</h2>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 gap-4">
        {/* Thanh tìm kiếm */}
        <div className="relative w-full lg:max-w-[280px]">
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

        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
          {/* <button
            onClick={handleBulkDelete}
            disabled={selectedItemIds.length === 0}
            className={`bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all flex items-center gap-2 ${selectedItemIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'shadow-md active:scale-95'}`}
          >
            <Trash2 size={18} />
            Xóa nhiều dòng {selectedItemIds.length > 0 && `(${selectedItemIds.length})`}
          </button> */}

          <button
            onClick={handleBulkDelete}
            className={`order-3 lg:order-1 w-full lg:w-auto lg:flex-none justify-center text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all flex items-center gap-2 text-sm ${selectedItemIds.length > 0 ? 'bg-red-700 hover:bg-red-700 shadow-md active:scale-95' : 'bg-red-700 hover:bg-red-700'}`}
          >
            <Trash2 size={18} />
            Xóa nhiều dòng {selectedItemIds.length > 0 && `(${selectedItemIds.length})`}
          </button>

          <button onClick={handleOpenImportModal} className="order-1 lg:order-2 w-full lg:w-auto lg:flex-none justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2 text-sm">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="order-2 lg:order-3 w-full lg:w-auto lg:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2 text-sm">
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button onClick={handleAddItem} className="flex gap-2 items-center order-4 w-full lg:w-auto justify-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors text-sm">
            <MdAdd />
            <span className="lg:hidden">Thêm mới</span>
            <span className="hidden lg:inline">Thêm hàng hóa mới</span>
          </button>
        </div>
      </div>


      {loading && <p className="text-gray-600 p-4">Đang tải dữ liệu hàng hóa...</p>}
      {error && <p className="text-red-600 p-4">Lỗi: {error}</p>}
      {!loading && !error && (
        <CustomDatatable
          columns={itemColumns}
          data={filteredItems}
          page={currentPage}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(val) => {
            setRowsPerPage(val);
            setCurrentPage(1);
          }}
          rowClassName={(row) =>
            getEntityId(row) === highlightedItemId
              ? "transition-all duration-500 animate-pulse"
              : ""
          }
          bodyCellClassName="!py-2 lg:!py-3"
          renderExpansion={(row) => (
            (() => {
              const filteredStatuses = itemStatuses.filter(s =>
                s.label.toLowerCase().includes(menuSearchQuery.toLowerCase())
              );
              return (
                <div className="py-4 pl-6 lg:pl-24 pr-6 bg-blue-50/30 border-b border-gray-100 relative">
                  <div className="space-y-4 text-sm lg:hidden">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mã thành phẩm</span>
                        <span className="text-gray-900 font-medium truncate">{row.itemCode || row.ItemCode || '--'}</span>
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Danh mục</span>
                        <span className="text-gray-900 font-medium truncate">
                          {categories.find(c => String(c.value) === String(row.category || row.Category))?.label || '--'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vị trí</span>
                      <AnchoredPortalMenu
                        isOpen={openLocationMenuId === getEntityId(row)}
                        onClose={() => setOpenLocationMenuId(null)}
                        trigger={(
                          <>
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
                                const rowId = getEntityId(row);
                                if (openLocationMenuId !== rowId) setMenuSearchQuery('');
                                setOpenLocationMenuId(openLocationMenuId === rowId ? null : rowId);
                                setOpenStatusMenuId(null);
                                setOpenManufactoryMenuId(null);
                                setOpenCategoryMenuId(null);
                              }}
                              className="text-xs block w-full p-1 pr-8 rounded-lg border border-gray-300 bg-white appearance-none cursor-pointer outline-none text-left relative min-h-[26px] hover:border-blue-400 transition-colors"
                            >
                              <span className="truncate block">
                                {warehouses.find(w => String(w.value) === String(row.location ?? row.Location))?.label || '-- Chọn --'}
                              </span>
                              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                                <ChevronDown size={14} />
                              </div>
                            </button>
                          </>
                        )}
                      >

                        <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                          <div className="relative sm:hidden">
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
                        <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5 sm:hidden">
                          {warehouses.filter(w => w.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((w) => (
                            <button
                              key={w.value}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleLocationChange(row, w.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.location ?? row.Location) === String(w.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <span className="block w-full !whitespace-normal break-words leading-tight">{w.label}</span>
                            </button>
                          ))}
                        </div>
                      </AnchoredPortalMenu>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Giá bán</span>
                        <span className="text-gray-900 font-medium break-words">{row.price?.toLocaleString()} VNĐ</span>
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cân nặng</span>
                        <span className="text-gray-900 font-medium break-words">{row.weight} kg</span>
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thuế</span>
                        <span className="text-gray-900 font-medium break-words">{row.tax}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:flex flex-wrap lg:flex-nowrap items-end gap-x-8 lg:gap-x-[140px] gap-y-4 text-sm">
                    {/* Thông tin hiển thị khi bị ẩn ở bảng chính trên Mobile */}
                    <div className="flex flex-col gap-1 lg:hidden flex-none">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Danh mục</span>
                      <div className="relative sm:hidden">
                        <AnchoredPortalMenu
                          isOpen={openCategoryMenuId === getEntityId(row)}
                          onClose={() => setOpenCategoryMenuId(null)}
                          trigger={(
                            <>
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
                                  const rowId = getEntityId(row);
                                  if (openCategoryMenuId !== rowId) setMenuSearchQuery('');
                                  setOpenCategoryMenuId(openCategoryMenuId === rowId ? null : rowId);
                                  setOpenStatusMenuId(null);
                                  setOpenManufactoryMenuId(null);
                                  setOpenLocationMenuId(null);
                                }}
                                className="bg-white border border-gray-300 text-gray-900 text-[11px] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none font-medium text-left relative min-h-[30px] hover:border-blue-400 transition-colors"
                              >
                                <span className="truncate block">
                                  {categories.find(c => String(c.value) === String(row.category || row.Category))?.label || '-- Chọn --'}
                                </span>
                                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                                  <ChevronDown size={14} />
                                </div>
                              </button>
                            </>
                          )}
                          anchorClassName="w-40"
                        >

                          <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10 sm:hidden">
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
                          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 sm:hidden">
                            {categories.filter(cat => cat.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((cat) => (
                              <button
                                key={cat.value}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleCategoryChange(row, cat.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.category || row.Category) === String(cat.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                              >
                                <span className="block w-full !whitespace-normal break-words leading-tight">{cat.label}</span>
                              </button>
                            ))}
                          </div>
                        </AnchoredPortalMenu>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 flex-none">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Giá bán</span>
                      <span className="text-gray-900 font-medium">{row.price?.toLocaleString()} VNĐ</span>
                    </div>

                    {/* Cột 1: Vị trí */}
                    <div className="flex flex-col gap-1 w-full md:w-64 flex-none">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vị trí</span>
                      <AnchoredPortalMenu
                        isOpen={openLocationMenuId === getEntityId(row)}
                        onClose={() => setOpenLocationMenuId(null)}
                        trigger={(
                          <>
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
                                const rowId = getEntityId(row);
                                if (openLocationMenuId !== rowId) setMenuSearchQuery('');
                                setOpenLocationMenuId(openLocationMenuId === rowId ? null : rowId);
                                setOpenStatusMenuId(null);
                                setOpenManufactoryMenuId(null);
                                setOpenCategoryMenuId(null);
                              }}
                              className="text-xs block w-full p-1 pr-8 rounded-lg border border-gray-300 bg-white appearance-none cursor-pointer outline-none text-left relative min-h-[26px] hover:border-blue-400 transition-colors"
                            >
                              <span className="truncate block">
                                {warehouses.find(w => String(w.value) === String(row.location ?? row.Location))?.label || '-- Chọn --'}
                              </span>
                              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                                <ChevronDown size={14} />
                              </div>
                            </button>
                          </>
                        )}
                      >

                        <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                          <div className="relative hidden sm:flex">
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
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleLocationChange(row, w.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.location ?? row.Location) === String(w.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <span className="block w-full !whitespace-normal break-words leading-tight">{w.label}</span>
                            </button>
                          ))}
                        </div>
                      </AnchoredPortalMenu>
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

      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Nhập excel"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="item-excel-file"
              className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-blue-600 hover:bg-blue-50"
            >
              <FileUp size={32} className="mb-3 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                {selectedImportFile ? selectedImportFile.name : 'Chọn file Excel để nhập'}
              </span>
              <span className="mt-1 text-xs text-gray-500">Hỗ trợ .xlsx</span>
              <input
                id="item-excel-file"
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
        onClose={() => { setIsCategoryEditModalOpen(false); setCategoryErrors({}); }}
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
              onChange={(e) => {
                setCategoryForm({ ...categoryForm, name: e.target.value });
                if (categoryErrors.name) setCategoryErrors(prev => ({ ...prev, name: null }));
              }}
              className={`w-full border ${categoryErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none transition-all ${isCategoryEditMaximized ? 'p-3 text-base' : 'p-2 text-sm'}`}
            />
            {categoryErrors.name && <p className="text-red-500 text-xs mt-1 font-medium">{categoryErrors.name}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsCategoryEditModalOpen(false); setCategoryErrors({}); }} className={`bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors ${isCategoryEditMaximized ? 'px-6 py-2 text-base' : 'px-4 py-1.5 text-sm'}`}>Hủy</button>
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
                          <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in zoom-in duration-200 origin-top whitespace-normal">
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
            <label className="text-xs font-medium text-gray-700">Số lượng tối đa</label>
            <input
              type="number"
              min="0"
              value={editingWarehouse.available ?? ''}
              onChange={(e) => { setEditingWarehouse({ ...editingWarehouse, available: e.target.value }); if (warehouseErrors.available) setWarehouseErrors(prev => ({ ...prev, available: null })); }}
              className={`w-full border ${warehouseErrors.available ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none transition-all ${isWarehouseEditMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
            />
            {warehouseErrors.available && <p className="text-xs font-medium text-red-600">{warehouseErrors.available}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsWarehouseEditModalOpen(false); setIsWarehouseEditMaximized(false); setWarehouseErrors({}); }} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu vị trí</button>
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

      {/* Modal Thêm/Sửa Loại kho */}
      <Modal
        isOpen={isTypeEditModalOpen}
        onClose={() => { setIsTypeEditModalOpen(false); setIsTypeEditMaximized(false); setTypeErrors({}); }}
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
              onChange={(e) => {
                setTypeForm({ ...typeForm, name: e.target.value });
                if (typeErrors.name) setTypeErrors(prev => ({ ...prev, name: null }));
              }}
              className={`w-full border ${typeErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm p-2 focus:ring-2 outline-none text-sm`}
            />
            {typeErrors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{typeErrors.name}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsTypeEditModalOpen(false); setIsTypeEditMaximized(false); setTypeErrors({}); }} className="bg-gray-500 text-white px-4 py-1.5 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm font-bold">Lưu</button>
          </div>
        </form>
      </Modal>

      {/* Modal Thêm/Sửa Vị trí kho */}
      <Modal
        isOpen={isLocEditModalOpen}
        onClose={() => { setIsLocEditModalOpen(false); setIsLocEditMaximized(false); setLocErrors({}); }}
        title={locModalMode === 'add' ? 'Thêm vị trí mới' : 'Sửa vị trí'}
        maxWidth={isLocEditMaximized ? "max-w-full" : "max-w-xl"}
        isMaximized={isLocEditMaximized}
        onMaximizeToggle={() => setIsLocEditMaximized(!isLocEditMaximized)}
      >
        <form onSubmit={handleLocSubmit} className="space-y-4">
          <div className="relative">
            <label className="text-xs font-medium text-gray-700">Ô</label>
            <input
              type="number"
              value={currentEditingLoc?.bin || ''}
              onChange={(e) => {
                setCurrentEditingLoc({ ...currentEditingLoc, bin: e.target.value });
                if (locErrors.bin) setLocErrors(prev => ({ ...prev, bin: null }));
              }}
              className={`w-full border ${locErrors.bin ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm p-1.5 focus:ring-2 outline-none transition-all ${isModalMaximized ? 'text-base' : 'text-sm'}`}
            />
            {locErrors.bin && <p className="text-red-500 text-xs mt-1 font-medium">{locErrors.bin}</p>}
          </div>
          <div className="relative">
            <button type="button" onClick={() => setIsRackMgmtOpen(true)} className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-[11px] font-bold underline z-10">hiệu chỉnh</button>
            <CustomSelect
              label="Kệ"
              options={warehouseRacks.map(r => ({ value: r.id || r.ID, label: r.name || r.Name }))}
              value={currentEditingLoc.racks || ''}
              onChange={(e) => {
                setCurrentEditingLoc({ ...currentEditingLoc, racks: e.target.value });
                if (locErrors.racks) setLocErrors(prev => ({ ...prev, racks: null }));
              }}
              isModalMaximized={isLocEditMaximized}
              className={locErrors.racks ? "!border-red-500 focus:!ring-red-500" : ""}
            />
            {locErrors.racks && <p className="text-red-500 text-xs mt-1 font-medium">{locErrors.racks}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Tầng (Level)</label>
            <input
              type="number"
              value={currentEditingLoc.level || ''}
              onChange={(e) => {
                setCurrentEditingLoc({ ...currentEditingLoc, level: e.target.value });
                if (locErrors.level) setLocErrors(prev => ({ ...prev, level: null }));
              }}
              className={`w-full border ${locErrors.level ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none text-sm transition-all ${isLocEditMaximized ? 'p-2' : 'p-1.5'}`}
            />
            {locErrors.level && <p className="text-red-500 text-xs mt-1 font-medium">{locErrors.level}</p>}
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
            <div className="relative max-w-[460px]">
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
          <div className={`${isRackMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[460px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}>
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
              autoFocus
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
        onClose={closeNotification}
      />
    </div>
  );
};
