import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Search, Plus, FileDown, ChevronDown, Trash2, FileUp, ChevronRight } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect } from '../customComponent/customComponent';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../controller/warehousesController';
import { getWarehouseTypes, createWarehouseType, updateWarehouseType, deleteWarehouseType } from '../controller/warehouseTypesController';
import { getWarehouseLocations, createWarehouseLocation, updateWarehouseLocation, deleteWarehouseLocation } from '../controller/warehouseLocationsController';
import { getWarehouseRacks } from '../controller/warehouseRacksController';
import { getWarehouseBins } from '../controller/warehouseBinsController';
import { getWarehouseStatuses, createWarehouseStatus, updateWarehouseStatus, deleteWarehouseStatus } from '../controller/warehouseStatusesController';
import { LuSquarePen } from "react-icons/lu";
import { MdAdd } from "react-icons/md";
import { FaRegSquare, FaRegSquareMinus } from "react-icons/fa6";
import { getUsers } from '../controller/usersController';
import { createNotification } from '../controller/notificationsController';
import { getCookie } from '../utils/cookieHelper';

const API_BASE_URL = 'https://quanlysanxuat-production.up.railway.app/api';

export const Warehouses = () => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [highlightedWarehouseId, setHighlightedWarehouseId] = useState(null);

  const [warehouses, setWarehouses] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState([]);
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [sections, setSections] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ type: '', warehouseCode: '', available: 0, location: '' });
  const [modalErrors, setModalErrors] = useState({});
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  const [openLocationMenuId, setOpenLocationMenuId] = useState(null);
  const [openLocationMenuAnchorKey, setOpenLocationMenuAnchorKey] = useState(null);
  const [locationMenuRect, setLocationMenuRect] = useState(null);
  const locationMenuAnchorRefs = useRef({});
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [openTypeMenuId, setOpenTypeMenuId] = useState(null);
  const [openTypeMenuAnchorKey, setOpenTypeMenuAnchorKey] = useState(null);
  const [typeMenuRect, setTypeMenuRect] = useState(null);
  const typeMenuAnchorRefs = useRef({});
  const [typeMenuSearchQuery, setTypeMenuSearchQuery] = useState('');

  const [isTypeMgmtModalOpen, setIsTypeMgmtModalOpen] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');
  const [typeForm, setTypeForm] = useState({ id: null, name: '' });
  const [typeErrors, setTypeErrors] = useState({});
  const [isTypeMgmtMaximized, setIsTypeMgmtMaximized] = useState(false);
  const [isTypeEditMaximized, setIsTypeEditMaximized] = useState(false);
  const [isTypeEditModalOpen, setIsTypeEditModalOpen] = useState(false);
  const [typeModalMode, setTypeModalMode] = useState('add');

  const [isLocMgmtOpen, setIsLocMgmtOpen] = useState(false);
  const [locSearchTerm, setLocSearchTerm] = useState('');
  const [isLocEditModalOpen, setIsLocEditModalOpen] = useState(false);
  const [isLocEditMaximized, setIsLocEditMaximized] = useState(false);
  const [locModalMode, setLocModalMode] = useState('add');
  const [currentEditingLoc, setCurrentEditingLoc] = useState({ bin: '', racks: '', level: 1 });
  const [locErrors, setLocErrors] = useState({});
  const [locConfirmModal, setLocConfirmModal] = useState({ isOpen: false, id: null });
  const [isLocMgmtMaximized, setIsLocMgmtMaximized] = useState(false);
  const [rawRacks, setRawRacks] = useState([]);
  const [rawBins, setRawBins] = useState([]);
  const [rawLocations, setRawLocations] = useState([]);

  const [isStatusMgmtOpen, setIsStatusMgmtOpen] = useState(false);
  const [statusSearchTerm, setStatusSearchTerm] = useState('');
  const [isStatusEditModalOpen, setIsStatusEditModalOpen] = useState(false);
  const [statusModalMode, setStatusModalMode] = useState('add');
  const [currentEditingStatus, setCurrentEditingStatus] = useState({ name: '' });
  const [statusConfirmModal, setStatusConfirmModal] = useState({ isOpen: false, id: null });
  const [isStatusMgmtMaximized, setIsStatusMgmtMaximized] = useState(false);

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);

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

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [whData, typeData, locationData, rackData, statusData] = await Promise.all([
        getWarehouses(),
        getWarehouseTypes(),
        getWarehouseLocations(),
        getWarehouseRacks(),
        getWarehouseStatuses(),
      ]);
      setWarehouses(whData.map(w => ({ ...w, id: getEntityId(w) })));
      setTypes(typeData.map(t => ({ value: t.id || t.ID, label: t.name || t.Name })));
      setStatuses(statusData.map(s => ({ value: s.id || s.ID, label: s.name || s.Name })));

      setRawRacks(rackData.map(r => ({ value: r.id || r.ID, label: r.name || r.Name })));
      setRawLocations(locationData.map(l => ({ ...l, id: l.id || l.ID })));

      setSections(locationData.map(l => {
        const rackObj = rackData.find(r => String(r.id || r.ID) === String(l.racks || l.Racks));
        const rackName = rackObj ? (rackObj.name || rackObj.Name) : (l.racks || l.Racks);
        const binName = l.bin;
        return {
          value: l.id || l.ID,
          label: `Kệ ${rackName} - Tầng ${l.level || l.Level} - Ô ${binName}`
        };
      }));
      setSelectedWarehouseIds([]); // Clear selections after data refresh
      setIsBulkSelectMode(false);
    } catch (err) {
      showNotification("Lỗi khi tải dữ liệu nhà kho", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleGlobalClick = () => {
      setOpenLocationMenuId(null);
      setOpenLocationMenuAnchorKey(null);
      setLocationMenuRect(null);
      setOpenTypeMenuId(null);
      setOpenTypeMenuAnchorKey(null);
      setTypeMenuRect(null);
      setMenuSearchQuery('');
      setTypeMenuSearchQuery('');
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  useEffect(() => {
    if (!openLocationMenuId || !openLocationMenuAnchorKey) return;

    const updateLocationMenuRect = () => {
      const anchor = locationMenuAnchorRefs.current[openLocationMenuAnchorKey];
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setLocationMenuRect({
        left: rect.left,
        top: rect.bottom + 4,
        width: rect.width,
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

  useEffect(() => {
    if (!openTypeMenuId || !openTypeMenuAnchorKey) return;

    const updateTypeMenuRect = () => {
      const anchor = typeMenuAnchorRefs.current[openTypeMenuAnchorKey];
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setTypeMenuRect({
        left: rect.left,
        top: rect.bottom + 4,
        width: rect.width,
      });
    };

    updateTypeMenuRect();
    window.addEventListener('resize', updateTypeMenuRect);
    window.addEventListener('scroll', updateTypeMenuRect, true);

    return () => {
      window.removeEventListener('resize', updateTypeMenuRect);
      window.removeEventListener('scroll', updateTypeMenuRect, true);
    };
  }, [openTypeMenuId, openTypeMenuAnchorKey]);

  const filteredData = useMemo(() => {
    return warehouses.filter(w => {
      const locationLabel = sections.find(s => String(s.value) === String(w.location || w.Location))?.label || '';
      const typeLabel = types.find(t => String(t.value) === String(w.type || w.Type))?.label || '';
      return (
        locationLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        typeLabel.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [warehouses, searchTerm, sections, types]);

  // Reset về trang 1 khi tìm kiếm thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Logic tự động nhảy trang khi được điều hướng từ thông báo
  useEffect(() => {
    const targetId = location.state?.targetWarehouseId;
    if (targetId && filteredData.length > 0) {
      const index = filteredData.findIndex(w => getEntityId(w) === targetId);
      if (index !== -1) {
        const targetPage = Math.floor(index / rowsPerPage) + 1;
        setCurrentPage(targetPage);

        // Thiết lập highlight
        setHighlightedWarehouseId(targetId);

        // Xóa highlight sau 3 giây
        const timer = setTimeout(() => setHighlightedWarehouseId(null), 3000);

        // Xóa state trong location để tránh nhảy trang lại khi F5
        window.history.replaceState({}, document.title);
        return () => clearTimeout(timer);
      }
    }
  }, [location.state, filteredData, rowsPerPage]);

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ type: '', warehouseCode: '', available: '', location: '' });
    setModalErrors({});
    setIsModalOpen(true);
  };

  const handleEditItem = (item) => {
    setModalMode('edit');
    setCurrentEditingItem({
      ...item,
      type: item.type || item.Type,
      warehouseCode: item.warehouseCode || item.WarehouseCode || '',
      available: item.available || item.Available,
      location: item.location || item.Location
    });
    setModalErrors({});
    setIsModalOpen(true);
  };

  const handleBulkDelete = () => {
    if (!isBulkSelectMode) {
      setIsBulkSelectMode(true);
      setSelectedWarehouseIds([]);
      return;
    }

    if (selectedWarehouseIds.length === 0) {
      setIsBulkSelectMode(false);
      setSelectedWarehouseIds([]);
      return;
    }

    setConfirmModal({
      isOpen: true,
      id: selectedWarehouseIds,
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều nhà kho',
      message: `Bạn có chắc chắn muốn xóa ${selectedWarehouseIds.length} nhà kho đã chọn không? Hành động này không thể hoàn tác.`
    });
  };

  const handleSelectAllWarehouses = () => {
    const visibleWarehouseIds = filteredData.map(warehouse => getEntityId(warehouse)).filter(Boolean);
    setSelectedWarehouseIds(visibleWarehouseIds);
  };

  const handleClearSelectedWarehouses = () => {
    setSelectedWarehouseIds([]);
  };

  const handleToggleSelectWarehouse = (row) => {
    const rowId = getEntityId(row);
    setSelectedWarehouseIds(prevSelected =>
      prevSelected.includes(rowId)
        ? prevSelected.filter(warehouseId => warehouseId !== rowId)
        : [...prevSelected, rowId]
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
    setModalErrors({});
  };

  const handleOpenTypeEdit = (mode, type = null) => {
    setTypeModalMode(mode);
    setTypeForm(type ? { id: type.value, name: type.label } : { id: null, name: '' });
    setTypeErrors({});
    setIsTypeEditModalOpen(true);
    setIsTypeEditMaximized(false);
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!typeForm.name?.trim()) {
      errors.name = "Bắt buộc nhập Tên loại kho";
    }

    if (Object.keys(errors).length > 0) {
      setTypeErrors(errors);
      return;
    }

    setTypeErrors({});

    try {
      if (typeModalMode === 'add') {
        await createWarehouseType({ Name: typeForm.name });
        showNotification("Thêm loại kho thành công");
      } else {
        await updateWarehouseType(typeForm.id, { ID: typeForm.id, Name: typeForm.name });
        showNotification("Cập nhật loại kho thành công");
      }
      setIsTypeEditModalOpen(false);
      fetchData();
    } catch (err) {
      showNotification("Lỗi khi xử lý dữ liệu loại kho.", "error");
    }
  };

  const filteredTypes = useMemo(() => {
    return types.filter(t =>
      t.label.toLowerCase().includes(typeSearch.toLowerCase()) ||
      String(t.value).includes(typeSearch)
    );
  }, [types, typeSearch]);

  const typeColumns = [
    {
      header: 'STT',
      className: 'text-[11px] sm:text-sm !px-2',
      headerCellClassName: 'text-[10px] sm:text-xs !px-2',
      render: (_, { index }) => index
    },
    {
      header: <><span className="hidden sm:inline">Tên loại kho</span><span className="sm:hidden">Tên</span></>,
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

  const handleLocationChange = async (warehouse, newLocationId) => {
    const payload = {
      ID: warehouse.id,
      Type: parseInt(warehouse.type || warehouse.Type),
      Available: Number(warehouse.available || warehouse.Available || 0),
      Location: parseInt(newLocationId)
    };

    try {
      await updateWarehouse(warehouse.id, payload);
      setWarehouses(prev => prev.map(w => w.id === warehouse.id ? { ...w, location: parseInt(newLocationId), Location: parseInt(newLocationId) } : w));
      setOpenLocationMenuId(null);
      setOpenLocationMenuAnchorKey(null);
      setLocationMenuRect(null);
      showNotification("Cập nhật vị trí thành công!");
    } catch (err) {
      console.error("Error updating location:", err);
      showNotification("Lỗi khi cập nhật vị trí.", "error");
    }
  };

  const handleTypeChange = async (warehouse, newTypeId) => {
    const payload = {
      ID: warehouse.id,
      Type: parseInt(newTypeId),
      Available: Number(warehouse.available || warehouse.Available || 0),
      Location: parseInt(warehouse.location || warehouse.Location)
    };

    try {
      await updateWarehouse(warehouse.id, payload);
      setWarehouses(prev => prev.map(w => w.id === warehouse.id ? {
        ...w,
        type: parseInt(newTypeId),
        Type: parseInt(newTypeId)
      } : w));
      setOpenTypeMenuId(null);
      setOpenTypeMenuAnchorKey(null);
      setTypeMenuRect(null);
      showNotification("Cập nhật loại kho thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật loại kho.", "error");
    }
  };

  const toggleLocationMenu = (e, rowId, anchorKey) => {
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
    setOpenTypeMenuId(null);
    setOpenTypeMenuAnchorKey(null);
    setTypeMenuRect(null);

    const rect = e.currentTarget.getBoundingClientRect();
    setLocationMenuRect({
      left: rect.left,
      top: rect.bottom + 4,
      width: rect.width,
    });
  };

  const renderLocationMenu = (row, anchorKey) => {
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
              placeholder="Tìm nhanh vị trí..."
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus={window.innerWidth >= 768}
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
          {sections.filter(s => s.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((s) => (
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
      </div>,
      document.body
    );
  };

  const toggleTypeMenu = (e, rowId, anchorKey) => {
    e.stopPropagation();
    const isSameMenuOpen = openTypeMenuId === rowId && openTypeMenuAnchorKey === anchorKey;

    if (isSameMenuOpen) {
      setOpenTypeMenuId(null);
      setOpenTypeMenuAnchorKey(null);
      setTypeMenuRect(null);
      return;
    }

    setTypeMenuSearchQuery('');
    setOpenTypeMenuId(rowId);
    setOpenTypeMenuAnchorKey(anchorKey);
    setOpenLocationMenuId(null);
    setOpenLocationMenuAnchorKey(null);
    setLocationMenuRect(null);

    const rect = e.currentTarget.getBoundingClientRect();
    setTypeMenuRect({
      left: rect.left,
      top: rect.bottom + 4,
      width: rect.width,
    });
  };

  const renderTypeMenu = (row, rowId, anchorKey, maxHeightClassName = 'max-h-48') => {
    if (openTypeMenuId !== rowId || openTypeMenuAnchorKey !== anchorKey || !typeMenuRect) return null;

    return createPortal(
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed bg-white rounded-md shadow-2xl z-[9999] border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal"
        style={{
          left: typeMenuRect.left,
          top: typeMenuRect.top,
          width: typeMenuRect.width,
        }}
      >
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
        <div className={`${maxHeightClassName} overflow-y-auto flex flex-col gap-0.5`}>
          {types.filter(t => t.label.toLowerCase().includes(typeMenuSearchQuery.toLowerCase())).map((t) => (
            <button
              key={t.value}
              onClick={() => handleTypeChange(row, t.value)}
              className={`px-2 py-1.5 text-[10px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.type || row.Type) === String(t.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <span className="block w-full truncate">{t.label}</span>
            </button>
          ))}
        </div>
      </div>,
      document.body
    );
  };

  const handleOpenLocEdit = (mode, loc = null) => {
    setLocModalMode(mode);
    setCurrentEditingLoc(loc ? {
      id: loc.id,
      bin: loc.bin || loc.Bin,
      racks: loc.racks || loc.Racks,
      level: loc.level || loc.Level
    } : { bin: '', racks: '', level: '' });
    setLocErrors({});
    setIsLocEditModalOpen(true);
    setIsLocEditMaximized(false);
  };

  const handleLocSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (currentEditingLoc.bin === '' || currentEditingLoc.bin === null || currentEditingLoc.bin === undefined) {
      errors.bin = "Bắt buộc nhập Ô";
    }

    if (!currentEditingLoc.racks) {
      errors.racks = "Bắt buộc nhập Kệ";
    }

    if (currentEditingLoc.level === '' || currentEditingLoc.level === null || currentEditingLoc.level === undefined) {
      errors.level = "Bắt buộc nhập Tầng";
    }

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
      fetchData();
      setIsLocEditModalOpen(false);
    } catch (err) {
      showNotification("Lỗi khi lưu thông tin vị trí.", "error");
    }
  };

  const handleLocDelete = async () => {
    try {
      await deleteWarehouseLocation(locConfirmModal.id);
      showNotification("Xóa vị trí thành công!");
      fetchData();
      setLocConfirmModal({ isOpen: false, id: null });
    } catch (err) {
      showNotification("Không thể xóa vị trí này vì có thể đang được sử dụng.", "error");
    }
  };

  const filteredLocs = useMemo(() => {
    return rawLocations.filter(l => {
      const rackLabel = rawRacks.find(r => String(r.value) === String(l.racks || l.Racks))?.label || '';
      const binLabel = rawBins.find(b => String(b.value) === String(l.bin || l.Bin))?.label || '';
      return (
        rackLabel.toLowerCase().includes(locSearchTerm.toLowerCase()) ||
        binLabel.toLowerCase().includes(locSearchTerm.toLowerCase()) ||
        String(l.level || l.Level).includes(locSearchTerm)
      );
    });
  }, [rawLocations, locSearchTerm, rawRacks, rawBins]);

  const locColumns = [
    {
      header: 'STT',
      className: '!px-2 sm:!px-6',
      render: (_, { index }) => index
    },
    {
      header: 'Ô',
      className: '!px-2 sm:!px-6',
      render: (row) => row.bin
    },
    {
      header: 'Kệ',
      className: '!px-2 sm:!px-6',
      render: (row) => <span className="font-bold text-blue-600">{rawRacks.find(r => String(r.value) === String(row.racks || row.Racks))?.label || 'N/A'}</span>
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

  const handleOpenStatusEdit = (mode, status = null) => {
    setStatusModalMode(mode);
    setCurrentEditingStatus(status ? { id: status.value, name: status.label } : { name: '' });
    setIsStatusEditModalOpen(true);
  };

  const handleStatusMgmtSubmit = async (e) => {
    e.preventDefault();
    try {
      if (statusModalMode === 'add') {
        await createWarehouseStatus({ Name: currentEditingStatus.name });
        showNotification("Thêm trạng thái thành công!");
      } else {
        await updateWarehouseStatus(currentEditingStatus.id, { ID: currentEditingStatus.id, Name: currentEditingStatus.name });
        showNotification("Cập nhật trạng thái thành công!");
      }
      fetchData();
      setIsStatusEditModalOpen(false);
    } catch (err) {
      showNotification("Lỗi khi lưu trạng thái.", "error");
    }
  };

  const handleStatusDelete = async () => {
    try {
      await deleteWarehouseStatus(statusConfirmModal.id);
      showNotification("Xóa trạng thái thành công!");
      fetchData();
      setStatusConfirmModal({ isOpen: false, id: null });
    } catch (err) {
      showNotification("Không thể xóa trạng thái này.", "error");
    }
  };

  const filteredStatuses = useMemo(() => {
    return statuses.filter(s => s.label.toLowerCase().includes(statusSearchTerm.toLowerCase()));
  }, [statuses, statusSearchTerm]);

  const statusColumns = [
    { header: 'STT', render: (_, { index }) => index },
    { header: 'Tên Trạng thái', accessor: 'label' },
    {
      header: 'Hành động',
      className: 'text-right pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end pr-5">
          <button onClick={() => handleOpenStatusEdit('edit', row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors">Sửa</button>
          <button
            onClick={() => setStatusConfirmModal({ isOpen: true, id: row.value })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
          >
            Xóa
          </button>
        </div>
      )
    }
  ];

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!currentEditingItem?.type) {
      errors.type = "Bắt buộc nhập Loại kho";
    }

    if (!currentEditingItem?.location) {
      errors.location = "Bắt buộc nhập Vị trí chi tiết";
    }

    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      return;
    }

    setModalErrors({});

    const payload = {
      ID: currentEditingItem.id || 0,
      WarehouseCode: currentEditingItem.warehouseCode || currentEditingItem.WarehouseCode || null,
      Type: parseInt(currentEditingItem.type),
      Available: Number(currentEditingItem.available || 0),
      Location: parseInt(currentEditingItem.location)
    };

    try {
      if (modalMode === 'add') {
        const addedWarehouse = await createWarehouse(payload);
        showNotification("Thêm vị trí kho thành công!");

        // Gửi thông báo cho tất cả người dùng
        try {
          const userList = await getUsers();
          const sender = JSON.parse(getCookie('user') || '{}');
          const typeLabel = types.find(t => String(t.value) === String(payload.Type))?.label || 'N/A';
          const locLabel = sections.find(s => String(s.value) === String(payload.Location))?.label || 'N/A';

          const notificationPayload = {
            message: `Người dùng ${sender?.name || sender?.username} vừa tạo một nhà kho ${locLabel} loại nhà kho ${typeLabel} trong danh sách nhà kho`,
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
        await updateWarehouse(currentEditingItem.id, payload);
        showNotification("Cập nhật vị trí kho thành công!");
      }
      fetchData();
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
      message: 'Bạn có chắc chắn muốn xuất danh sách vị trí kho ra tệp Excel không?'
    });
  };

  const handleOpenImportModal = () => {
    setSelectedImportFile(null);
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setSelectedImportFile(null);
    setIsImportingExcel(false);
    setIsImportModalOpen(false);
  };

  const handleDownloadImportTemplate = () => {
    window.location.href = `${API_BASE_URL}/Templates/import/warehouses`;
  };

  const buildImportWarehousePayload = (baseWarehouse, importedValues) => {
    const warehouseId = getEntityId(baseWarehouse);

    return {
      ID: warehouseId || 0,
      WarehouseCode: importedValues.warehouseCode,
      Type: importedValues.type,
      Location: importedValues.location,
      Available: importedValues.available
    };
  };

  const handleImportExcel = async () => {
    if (!selectedImportFile) {
      showNotification("Vui lòng chọn file Excel trước khi nhập.", "error");
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

      const typeMap = new Map(types.map(type => [
        normalizeImportText(type.label),
        type.value
      ]));
      const locationMap = new Map(sections.map(section => [
        normalizeImportText(section.label),
        section.value
      ]));
      const warehouseMap = new Map(warehouses.map(warehouse => [
        normalizeImportText(warehouse.warehouseCode || warehouse.WarehouseCode),
        warehouse
      ]));

      let createdCount = 0;
      let updatedCount = 0;
      const skippedRows = [];
      const importedWarehouses = [];

      const rowNumbers = [];
      worksheet.eachRow({ includeEmpty: false }, (_, rowNumber) => {
        if (rowNumber >= 2) rowNumbers.push(rowNumber);
      });

      for (const rowNumber of rowNumbers) {
        const row = worksheet.getRow(rowNumber);

        try {
          const warehouseCode = getExcelText(row.getCell(2));
          const typeText = getExcelText(row.getCell(3));
          const locationText = getExcelText(row.getCell(4));
          const availableText = getExcelText(row.getCell(5));

          if (!warehouseCode && !typeText && !locationText && !availableText) {
            continue;
          }

          if (!warehouseCode) {
            skippedRows.push(`Dòng ${rowNumber}: thiếu Mã kho`);
            continue;
          }

          const existingWarehouse = warehouseMap.get(normalizeImportText(warehouseCode));
          const typeId = typeText ? typeMap.get(normalizeImportText(typeText)) : getEntityValue(existingWarehouse, 'type', 'Type') ?? null;

          if (typeText && !typeId) {
            skippedRows.push(`Dòng ${rowNumber}: không tìm thấy Loại kho "${typeText}"`);
            continue;
          }

          if (!typeId) {
            skippedRows.push(`Dòng ${rowNumber}: thiếu Loại kho`);
            continue;
          }

          const locationId = locationText ? locationMap.get(normalizeImportText(locationText)) : getEntityValue(existingWarehouse, 'location', 'Location') ?? null;

          if (locationText && !locationId) {
            skippedRows.push(`Dòng ${rowNumber}: không tìm thấy Vị trí "${locationText}"`);
            continue;
          }

          if (!locationId) {
            skippedRows.push(`Dòng ${rowNumber}: thiếu Vị trí`);
            continue;
          }

          const parsedAvailable = availableText ? parseImportNumber(availableText) : null;
          if (availableText && parsedAvailable === null) {
            skippedRows.push(`Dòng ${rowNumber}: Số lượng không hợp lệ`);
            continue;
          }

          const importedValues = {
            warehouseCode,
            type: parseInt(typeId, 10),
            location: parseInt(locationId, 10),
            available: parsedAvailable !== null ? parseInt(parsedAvailable, 10) : getEntityValue(existingWarehouse, 'available', 'Available') ?? 0
          };
          const payload = buildImportWarehousePayload(existingWarehouse || {}, importedValues);

          if (existingWarehouse) {
            const updatedWarehouse = await updateWarehouse(getEntityId(existingWarehouse), payload);
            const mergedWarehouse = { ...existingWarehouse, ...updatedWarehouse, ...payload, id: getEntityId(existingWarehouse), warehouseCode };
            importedWarehouses.push(mergedWarehouse);
            warehouseMap.set(normalizeImportText(warehouseCode), mergedWarehouse);
            updatedCount++;
          } else {
            const createdWarehouse = await createWarehouse(payload);
            const mergedWarehouse = { ...createdWarehouse, warehouseCode, WarehouseCode: warehouseCode };
            importedWarehouses.push(mergedWarehouse);
            warehouseMap.set(normalizeImportText(warehouseCode), mergedWarehouse);
            createdCount++;
          }
        } catch (rowError) {
          console.error(`Error importing warehouse row ${rowNumber}:`, rowError);
          skippedRows.push(`Dòng ${rowNumber}: lỗi khi lưu dữ liệu`);
        }
      }

      if (importedWarehouses.length > 0) {
        setWarehouses(prevWarehouses => {
          const importedMap = new Map(importedWarehouses.map(warehouse => [getEntityId(warehouse), warehouse]));
          const nextWarehouses = prevWarehouses.map(warehouse => importedMap.get(getEntityId(warehouse)) || warehouse);
          const existingIds = new Set(prevWarehouses.map(warehouse => getEntityId(warehouse)));
          importedWarehouses.forEach(warehouse => {
            if (!existingIds.has(getEntityId(warehouse))) nextWarehouses.push(warehouse);
          });
          return nextWarehouses;
        });
      }

      handleCloseImportModal();
      showNotification("Nhập Excel thành công");
      if (skippedRows.length) console.warn("Các dòng không nhập được:", skippedRows);
    } catch (err) {
      console.error("Import Warehouse Excel Error:", err);
      showNotification("Lỗi khi nhập Excel nhà kho.", "error");
    } finally {
      setIsImportingExcel(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách nhà kho');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Mã kho', key: 'warehouseCode', width: 18 },
        { header: 'Loại kho', key: 'type', width: 20 },
        { header: 'Vị trí (Phân xưởng)', key: 'location', width: 25 },
        { header: 'Số lượng tối đa', key: 'available', width: 20 },
      ];

      filteredData.forEach((w, index) => {
        worksheet.addRow({
          stt: index + 1,
          warehouseCode: w.warehouseCode || w.WarehouseCode || '',
          type: types.find(t => String(t.value) === String(w.type || w.Type))?.label || 'N/A',
          available: w.available || w.Available || 0,
          location: sections.find(s => String(s.value) === String(w.location || w.Location))?.label || 'N/A',
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
      saveAs(new Blob([buffer]), `Danh sách nhà kho.xlsx`);
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
        await deleteWarehouse(confirmModal.id);
        setWarehouses(prev => prev.filter(w => getEntityId(w) !== confirmModal.id));
        setSelectedWarehouseIds(prev => prev.filter(id => id !== confirmModal.id));
        showNotification("Xóa vị trí kho thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    } else if (confirmModal.type === 'bulkDelete') {
      try {
        await deleteWarehouse(confirmModal.id);
        setWarehouses(prevWarehouses => prevWarehouses.filter(wh => !confirmModal.id.includes(getEntityId(wh))));
        setSelectedWarehouseIds([]);
        setIsBulkSelectMode(false);
        showNotification(`Xóa ${confirmModal.id.length} nhà kho thành công!`);
      } catch (err) {
        console.error("Error deleting multiple warehouses:", err);
        showNotification("Lỗi khi xóa nhiều nhà kho.", "error");
      }
    } else if (confirmModal.type === 'deleteType') {
      try {
        await deleteWarehouseType(confirmModal.id);
        showNotification("Xóa loại kho thành công!");
        fetchData();
      } catch (err) {
        showNotification("Lỗi khi xóa loại kho. Vui lòng kiểm tra các vị trí kho đang sử dụng loại này.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const columns = [
    {
      header: '',
      className: 'w-[20px] sm:w-[40px] !px-2 sm:!px-4 text-center sm:hidden',
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
    { header: 'STT', className: 'w-[30px] sm:w-[50px] !px-2 sm:!px-4 text-center', headerCellClassName: 'text-[10px] sm:text-sm', render: (row, { index }) => index },
    {
      header: 'Mã kho',
      className: 'hidden sm:table-cell w-28 !px-2 sm:!px-6 text-center',
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm',
      render: (row) => (
        <span className="font-semibold text-gray-700">
          {row.warehouseCode || row.WarehouseCode || '-'}
        </span>
      )
    },
    {
      header: 'Loại kho',
      className: 'hidden sm:table-cell w-32 sm:w-48 !px-2 sm:!px-6',
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm',
      render: (row) => {
        const rowId = row.id || row.ID;
        const isOpen = openTypeMenuId === rowId;
        const currentType = types.find(t => String(t.value) === String(row.type || row.Type));

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
              ref={(el) => { typeMenuAnchorRefs.current[`warehouse-type-desktop-${rowId}`] = el; }}
              onClick={(e) => {
                toggleTypeMenu(e, rowId, `warehouse-type-desktop-${rowId}`);
              }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-[11px] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none text-left relative min-h-[26px] font-bold text-gray-700"
            >
              <span className="truncate block">
                {currentType?.label || '-- Chọn loại --'}
              </span>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </button>

            {renderTypeMenu(row, rowId, `warehouse-type-desktop-${rowId}`)}

            {false && isOpen && (
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
                <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                  {types.filter(t => t.label.toLowerCase().includes(typeMenuSearchQuery.toLowerCase())).map((t) => (
                    <button
                      key={t.value}
                      onClick={() => {
                        handleTypeChange(row, t.value);
                        setOpenTypeMenuId(null);
                      }}
                      className={`px-2 py-1.5 text-[10px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.type || row.Type) === String(t.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                        }`}
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
      header: 'Vị trí',
      className: 'w-40 sm:w-64 !px-2 sm:!px-6',
      headerCellClassName: 'text-[10px] sm:text-sm',
      render: (row) => (
        <div className={`relative ${openLocationMenuId === row.id ? 'z-30' : 'z-10'}`}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsLocMgmtOpen(true); }}
            className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
          >
            hiệu chỉnh
          </button>
          <button
            ref={(el) => { locationMenuAnchorRefs.current[`warehouse-location-${row.id}`] = el; }}
            onClick={(e) => {
              toggleLocationMenu(e, row.id, `warehouse-location-${row.id}`);
            }}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-[11px] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none text-left relative min-h-[26px] font-bold text-blue-600"
          >
            <span className="truncate block">
              {sections.find(s => String(s.value) === String(row.location || row.Location))?.label || '-- Chọn vị trí --'}
            </span>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
              <ChevronDown size={14} />
            </div>
          </button>

          {renderLocationMenu(row, `warehouse-location-${row.id}`)}

          {false && openLocationMenuId === row.id && (
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
                    autoFocus={window.innerWidth >= 768}
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
                {sections.filter(s => s.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((s) => (
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
      header: 'Số lượng tối đa',
      className: 'hidden sm:table-cell text-center text-[11px] sm:text-sm !px-2 sm:!px-6',
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm',
      render: (row) => (
        <span className="font-bold text-gray-700">
          {row.available || row.Available || 0}
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
                handleSelectAllWarehouses();
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
                handleClearSelectedWarehouses();
              }}
              className="font-semibold text-gray-500 hover:text-gray-700"
            >
              Bỏ chọn
            </button>
          </div>
        ) : (
          <div className="flex justify-center items-center w-full text-[10px] sm:text-sm">Hành động</div>
        )
      ),
      className: 'text-center w-[100px] sm:w-[180px]',
      render: (row) => (
        <div className="flex justify-center items-center gap-2">
          {isBulkSelectMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSelectWarehouse(row);
              }}
              className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-red-50"
              title={selectedWarehouseIds.includes(getEntityId(row)) ? 'Bỏ chọn' : 'Chọn dòng'}
            >
              {selectedWarehouseIds.includes(getEntityId(row)) ? (
                <FaRegSquareMinus size={20} className="text-red-600" />
              ) : (
                <FaRegSquare size={20} className="text-gray-400" />
              )}
            </button>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleEditItem(row); }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-all active:scale-95 flex items-center gap-1.5"
                title="Sửa"
              >
                <span>Sửa</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: getEntityId(row), type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa vị trí kho này?' }); }}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-all active:scale-95 flex items-center gap-1.5"
                title="Xóa"
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
      <h2 className="text-2xl font-bold mb-4">Danh sách nhà kho</h2>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 gap-4">
        {/* Thanh tìm kiếm */}
        <div className="relative w-full lg:max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo loại hoặc vị trí"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
          <button
            onClick={handleBulkDelete}
            className={`order-3 lg:order-1 w-full lg:w-auto lg:flex-none justify-center text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all flex items-center gap-2 text-sm ${selectedWarehouseIds.length > 0 ? 'bg-red-700 hover:bg-red-700 shadow-md active:scale-95' : 'bg-red-700 hover:bg-red-700'}`}
          >
            <Trash2 size={18} />
            Xóa nhiều dòng {selectedWarehouseIds.length > 0 && `(${selectedWarehouseIds.length})`}
          </button>
          <button onClick={handleOpenImportModal} className="order-1 lg:order-2 w-full lg:w-auto lg:flex-none justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2 text-sm">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="order-2 lg:order-3 w-full lg:w-auto lg:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors text-sm">
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button onClick={handleAddItem} className="flex gap-2 items-center order-4 w-full lg:w-auto justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors text-sm">
            <MdAdd />
            <span className="lg:hidden">Thêm mới</span>
            <span className="hidden lg:inline">Thêm nhà kho mới</span>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-4 text-gray-500">Đang tải dữ liệu nhà kho...</p>
      ) : (
        <CustomDatatable
          columns={columns}
          data={filteredData}
          page={currentPage}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(val) => {
            setRowsPerPage(val);
            setCurrentPage(1);
          }}
          rowClassName={(row) =>
            getEntityId(row) === highlightedWarehouseId
              ? "transition-all duration-500 animate-pulse bg-blue-100"
              : ""
          }
          bodyCellClassName="!py-2 lg:!py-3"
          renderExpansion={(row) => (
            <div className="py-4 pl-6 lg:pl-40 pr-6 bg-blue-50/30 border-b border-gray-100 relative">
              <div className="flex flex-wrap lg:flex-nowrap items-end gap-x-8 lg:gap-x-[140px] gap-y-4 text-sm !overflow-visible">
                {/* Thông tin hiển thị khi bị ẩn ở bảng chính trên Mobile */}
                <div className="flex flex-col gap-1 sm:hidden flex-none">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mã kho</span>
                  <span className="text-gray-900 font-semibold">{row.warehouseCode || row.WarehouseCode || '-'}</span>
                </div>

                <div className="flex flex-col gap-1 sm:hidden flex-none !overflow-visible">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Loại kho</span>
                  <div className="relative w-40">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setIsTypeMgmtModalOpen(true); }}
                      className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
                    >
                      hiệu chỉnh
                    </button>
                    <button
                      ref={(el) => { typeMenuAnchorRefs.current[`warehouse-type-mobile-${row.id || row.ID}`] = el; }}
                      onClick={(e) => {
                        const rowId = row.id || row.ID;
                        toggleTypeMenu(e, rowId, `warehouse-type-mobile-${rowId}`);
                      }}
                      className="bg-white border border-gray-300 text-gray-900 text-[11px] rounded-lg p-1 pr-8 appearance-none cursor-pointer outline-none text-left relative min-h-[30px] w-full block hover:border-blue-400 transition-colors font-bold"
                    >
                      <span className="truncate block">
                        {types.find(t => String(t.value) === String(row.type || row.Type))?.label || '-- Chọn loại --'}
                      </span>
                      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                        <ChevronDown size={14} />
                      </div>
                    </button>

                    {renderTypeMenu(row, row.id || row.ID, `warehouse-type-mobile-${row.id || row.ID}`, 'max-h-40')}

                    {false && openTypeMenuId === (row.id || row.ID) && (
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
                          {types.filter(t => t.label.toLowerCase().includes(typeMenuSearchQuery.toLowerCase())).map((t) => (
                            <button
                              key={t.value}
                              onClick={() => {
                                handleTypeChange(row, t.value);
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

                <div className="flex flex-col gap-1 sm:hidden flex-none -mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Số lượng tối đa</span>
                  <span className="text-gray-900 font-medium">{row.available || row.Available || 0}</span>
                </div>
              </div>
            </div>
          )}
        />
      )}

      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Nhập excel"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="warehouse-excel-file"
              className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-blue-600 hover:bg-blue-50"
            >
              <FileUp size={32} className="mb-3 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                {selectedImportFile ? selectedImportFile.name : 'Chọn file Excel để nhập'}
              </span>
              <span className="mt-1 text-xs text-gray-500">Hỗ trợ .xlsx</span>
              <input
                id="warehouse-excel-file"
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

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? 'Thêm nhà kho mới' : 'Chỉnh sửa nhà kho'} isMaximized={isModalMaximized} onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}>
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTypeMgmtModalOpen(true)}
                className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-[11px] font-bold underline z-10"
              >
                hiệu chỉnh
              </button>
              <CustomSelect label="Loại kho" options={types} value={currentEditingItem?.type || ''} onChange={(e) => { setModalErrors(prev => ({ ...prev, type: '' })); setCurrentEditingItem({ ...currentEditingItem, type: e.target.value }); }} isModalMaximized={isModalMaximized} error={!!modalErrors.type} errorMessage={modalErrors.type} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Mã kho</label>
              <input
                type="text"
                value={currentEditingItem?.warehouseCode || currentEditingItem?.WarehouseCode || ''}
                disabled
                className={`w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 text-gray-500 shadow-sm outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              />
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLocMgmtOpen(true)}
              className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-[11px] font-bold underline z-10"
            >
              hiệu chỉnh
            </button>
            <CustomSelect label="Vị trí chi tiết" options={sections} value={currentEditingItem?.location || ''} onChange={(e) => { setModalErrors(prev => ({ ...prev, location: '' })); setCurrentEditingItem({ ...currentEditingItem, location: e.target.value }); }} isModalMaximized={isModalMaximized} error={!!modalErrors.location} errorMessage={modalErrors.location} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Số lượng tối đa</label>
            <input
              type="number"
              min="0"
              value={currentEditingItem?.available ?? ''}
              onChange={(e) => { setModalErrors(prev => ({ ...prev, available: '' })); setCurrentEditingItem({ ...currentEditingItem, available: e.target.value }); }}
              className={`w-full border border-gray-300 focus:ring-blue-500 rounded-md shadow-sm focus:ring-2 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
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

      {/* Modal Quản lý danh sách Trạng thái kho */}
      <Modal
        isOpen={isStatusMgmtOpen}
        onClose={() => { setIsStatusMgmtOpen(false); setIsStatusMgmtMaximized(false); }}
        title="Danh sách trạng thái kho"
        maxWidth={isStatusMgmtMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isStatusMgmtMaximized}
        onMaximizeToggle={() => setIsStatusMgmtMaximized(!isStatusMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên trạng thái..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={statusSearchTerm}
                onChange={(e) => setStatusSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => handleOpenStatusEdit('add')} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors">
              <Plus size={16} /> Thêm trạng thái
            </button>
          </div>
          <div className={`${isStatusMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}>
            <CustomDatatable columns={statusColumns} data={filteredStatuses} />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Trạng thái kho */}
      <Modal isOpen={isStatusEditModalOpen} onClose={() => setIsStatusEditModalOpen(false)} title={statusModalMode === 'add' ? 'Thêm trạng thái mới' : 'Sửa trạng thái'} maxWidth="max-w-sm">
        <form onSubmit={handleStatusMgmtSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Tên Trạng thái</label>
            <input
              type="text"
              value={currentEditingStatus.name || ''}
              onChange={(e) => setCurrentEditingStatus({ ...currentEditingStatus, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsStatusEditModalOpen(false)} className="bg-gray-500 text-white px-4 py-1.5 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm font-bold">Lưu</button>
          </div>
        </form>
      </Modal>

      {/* Modal Thêm/Sửa Loại kho */}
      <Modal
        isOpen={isTypeEditModalOpen}
        onClose={() => { setIsTypeEditModalOpen(false); setIsTypeEditMaximized(false); setTypeErrors({}); }}
        title={typeModalMode === 'add' ? 'Thêm loại kho mới' : 'Sửa loại kho'}
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
              onChange={(e) => { setTypeErrors(prev => ({ ...prev, name: '' })); setTypeForm({ ...typeForm, name: e.target.value }); }}
              className={`w-full border ${typeErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm p-2 focus:ring-2 outline-none text-sm`}
            />
            {typeErrors.name && <p className="text-xs font-medium text-red-600">{typeErrors.name}</p>}
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
              value={currentEditingLoc?.bin ?? ''}
              onChange={(e) => { setLocErrors(prev => ({ ...prev, bin: '' })); setCurrentEditingLoc({ ...currentEditingLoc, bin: e.target.value }); }}
              className={`w-full border ${locErrors.bin ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm p-1.5 focus:ring-2 outline-none ${isLocEditMaximized ? 'text-base' : 'text-sm'}`}
            />
            {locErrors.bin && <p className="text-xs font-medium text-red-600">{locErrors.bin}</p>}
          </div>
          <CustomSelect
            label="Kệ"
            options={rawRacks}
            value={currentEditingLoc.racks || ''}
            onChange={(e) => { setLocErrors(prev => ({ ...prev, racks: '' })); setCurrentEditingLoc({ ...currentEditingLoc, racks: e.target.value }); }}
            isModalMaximized={isLocEditMaximized}
            error={!!locErrors.racks}
            errorMessage={locErrors.racks}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Tầng (Level)</label>
            <input
              type="number"
              value={currentEditingLoc.level ?? ''}
              onChange={(e) => { setLocErrors(prev => ({ ...prev, level: '' })); setCurrentEditingLoc({ ...currentEditingLoc, level: e.target.value }); }}
              className={`w-full border ${locErrors.level ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none text-sm ${isLocEditMaximized ? 'p-2' : 'p-1.5'}`}
            />
            {locErrors.level && <p className="text-xs font-medium text-red-600">{locErrors.level}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsLocEditModalOpen(false); setIsLocEditMaximized(false); setLocErrors({}); }} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-bold">Lưu</button>
          </div>
        </form>
      </Modal>

      <CustomConfirm isOpen={statusConfirmModal.isOpen} onClose={() => setStatusConfirmModal({ isOpen: false, id: null })} onConfirm={handleStatusDelete} title="Xác nhận xóa trạng thái" message="Hành động này không thể hoàn tác nếu trạng thái đang được sử dụng." type="delete" />

      <CustomConfirm isOpen={locConfirmModal.isOpen} onClose={() => setLocConfirmModal({ isOpen: false, id: null })} onConfirm={handleLocDelete} title="Xác nhận xóa vị trí" message="Hành động này không thể hoàn tác nếu vị trí đang có hàng hóa liên quan." type="delete" />

      <CustomConfirm isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, id: null })} onConfirm={handleConfirmAction} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} />
      <AppNotification isOpen={notification.isOpen} message={notification.message} type={notification.type} onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
};
