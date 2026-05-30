
import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, ChevronDown, FileText, Eye, Edit2, Trash2, FileDown, X, Upload, Maximize, Minimize, ChevronRight, FileUp, Calendar } from 'lucide-react';
import { FaRegSquareMinus, FaRegSquare } from 'react-icons/fa6';
import { getCookie, removeCookie } from '../utils/cookieHelper';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  CustomDatatable,
  AppNotification,
  CustomConfirm,
  Modal,
  DateInput
} from '../customComponent/customComponent';
import {
  getMaterialReceipts,
  createMaterialReceipt,
  updateMaterialReceipt,
  deleteMaterialReceipt,
  receiveMaterialReceipt,
  markMaterialReceiptWrongInfo,
  exportInspectionReport,
  downloadReceiptFile,
  handleRequestDownload
} from '../controller/materialReceiptsController';
import { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse } from '../controller/warehousesController';
import { getWarehouseLocations, getWarehouseLocation, createWarehouseLocation, updateWarehouseLocation, deleteWarehouseLocation } from '../controller/warehouseLocationsController';
import { getWarehouseRacks, getWarehouseRack, createWarehouseRack, updateWarehouseRack, deleteWarehouseRack } from '../controller/warehouseRacksController';
import { getUsers, getUser } from '../controller/usersController';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../controller/suppliersController';
import { getMaterials } from '../controller/materialsController';
import { getMaterialCategories } from '../controller/materialCategoriesController';
import { getWarehouseTypes, getWarehouseType, createWarehouseType, updateWarehouseType, deleteWarehouseType } from '../controller/warehouseTypesController';
import { getWarehouseStatuses, getWarehouseStatus, createWarehouseStatus, updateWarehouseStatus, deleteWarehouseStatus } from '../controller/warehouseStatusesController';
import { getWarehouseBins, getWarehouseBin, createWarehouseBin, updateWarehouseBin, deleteWarehouseBin } from '../controller/warehouseBinsController';
import { MdAdd } from "react-icons/md";
import { getRoles } from '../controller/rolesController';

// Component Lịch hiển thị trực tiếp (Inline Calendar) dành cho Mobile
const InlineCalendar = ({ value, onChange }) => {
  const [viewDate, setViewDate] = useState(() => {
    const initial = value ? new Date(value) : new Date();
    return isNaN(initial.getTime()) ? new Date() : initial;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  const isSelected = (date) => {
    if (!date || !value) return false;
    const d = new Date(value);
    return date.getDate() === d.getDate() && date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const handleDateClick = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${day}`);
  };

  return (
    <div className="w-full bg-white select-none">
      <div className="flex items-center justify-between mb-4 bg-blue-50/50 p-2 rounded-xl">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-white rounded-lg transition-colors"><ChevronRight className="rotate-180 text-blue-600" size={20} /></button>
        <span className="font-bold text-gray-800">Tháng {month + 1}, {year}</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-white rounded-lg transition-colors"><ChevronRight className="text-blue-600" size={20} /></button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
          <div key={day} className="text-[10px] font-bold text-gray-400 text-center py-1 uppercase">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => (
          <div key={idx} className="aspect-square flex items-center justify-center">
            {date ? (
              <button
                type="button"
                onClick={() => handleDateClick(date)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs transition-all font-bold
                  ${isSelected(date)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110'
                    : isToday(date)
                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : 'hover:bg-gray-100 text-gray-700'}
                `}
              >{date.getDate()}</button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

// Component Searchable Select tùy chỉnh (Tương tự machines.js)
const SearchableSelect = ({ value, options, onChange, placeholder = "Tìm...", className, disabled = false, placement = "bottom", usePortal = false, error = false, errorMessage = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownRect, setDropdownRect] = useState(null);
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(event.target))
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !usePortal) return;

    const updateDropdownRect = () => {
      if (!selectRef.current) return;

      const rect = selectRef.current.getBoundingClientRect();
      setDropdownRect({
        left: rect.left,
        top: placement === 'top' ? rect.top - 4 : rect.bottom + 4,
        width: Math.max(rect.width, 200),
      });
    };

    updateDropdownRect();
    window.addEventListener('resize', updateDropdownRect);
    window.addEventListener('scroll', updateDropdownRect, true);

    return () => {
      window.removeEventListener('resize', updateDropdownRect);
      window.removeEventListener('scroll', updateDropdownRect, true);
    };
  }, [isOpen, placement, usePortal]);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const filteredOptions = options.filter(opt =>
    String(opt.label || '').toLowerCase().includes(search.toLowerCase())
  );

  const dropdownMenu = (
    <div
      ref={dropdownRef}
      className={`${usePortal ? 'fixed z-[9999]' : `absolute z-[100] w-full left-0 ${placement === 'top'
        ? 'bottom-full mb-1 slide-in-from-bottom-1'
        : 'mt-1 slide-in-from-top-1'
        }`} bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden min-w-[200px] animate-in fade-in duration-200`}
      style={usePortal && dropdownRect ? {
        left: dropdownRect.left,
        top: placement === 'top' ? 'auto' : dropdownRect.top,
        bottom: placement === 'top' ? window.innerHeight - dropdownRect.top : 'auto',
        width: dropdownRect.width,
      } : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 border-b bg-gray-50 sticky top-0 z-10">
        <div className="relative group">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            autoFocus
            placeholder={placeholder}
            className="w-full text-[11px] pl-8 pr-2 py-1.5 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-tight bg-white transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <div className="max-h-44 overflow-y-auto custom-scrollbar">
        {filteredOptions.length > 0 ? filteredOptions.map(opt => (
          <div key={opt.value} onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); setSearch(''); }} className={`p-2.5 text-xs hover:bg-blue-50 cursor-pointer transition-colors ${String(opt.value) === String(value) ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700'}`}>
            {opt.label}
          </div>
        )) : <div className="p-3 text-xs text-gray-400 italic text-center">Không có kết quả</div>}
      </div>
    </div>
  );

  return (
    <div className="relative w-full" ref={selectRef}>
      <div
        onClick={(e) => {
          if (disabled) return;
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`${className || `relative bg-gray-50 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} text-gray-900 text-sm rounded-md p-1.5 pr-7 font-medium flex justify-between items-center min-h-[38px] hover:border-blue-400 transition-all shadow-sm`} ${disabled ? '!bg-gray-100 !text-gray-500 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="truncate pl-2">{selectedOption ? selectedOption.label : '-- Chọn --'}</span>
        <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-gray-600">
          <ChevronDown size={14} />
        </div>
      </div>

      {isOpen && !usePortal && (
        <div className={`absolute z-[100] w-full bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden min-w-[200px] left-0 animate-in fade-in duration-200 ${placement === 'top'
          ? 'bottom-full mb-1 slide-in-from-bottom-1'
          : 'mt-1 slide-in-from-top-1'
          }`}>
          <div className="p-2 border-b bg-gray-50 sticky top-0 z-10">
            <div className="relative group">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                autoFocus
                placeholder={placeholder}
                className="w-full text-[11px] pl-8 pr-2 py-1.5 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-tight bg-white transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div key={opt.value} onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); setSearch(''); }} className={`p-2.5 text-xs hover:bg-blue-50 cursor-pointer transition-colors ${String(opt.value) === String(value) ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700'}`}>
                {opt.label}
              </div>
            )) : <div className="p-3 text-xs text-gray-400 italic text-center">Không có kết quả</div>}
          </div>
        </div>
      )}
      {isOpen && usePortal && dropdownRect && createPortal(dropdownMenu, document.body)}
      {errorMessage && <p className="text-red-500 text-xs mt-1 font-medium">{errorMessage}</p>}
    </div>
  );
};

// Component Multi Searchable Select
const MultiSearchableSelect = ({ selectedValues = [], options, onChange, placeholder = "Chọn nguyên liệu...", error = false, errorMessage = '', disabled = false, isCommitteeMode = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayOptions = useMemo(() => {
    const searchLower = search.toLowerCase();
    return options.filter(opt => {
      const labelMatch = String(opt.label || '').toLowerCase().includes(searchLower);
      if (!labelMatch) return false;
      // Nếu là Tab 3 (Ban kiểm nghiệm), kiểm tra dựa trên userCode của đối tượng
      if (isCommitteeMode) {
        return !selectedValues.some(e => String(e?.userCode || '').includes(String(opt.value)));
      }
      // Nếu là Tab 2 (Nguyên liệu), kiểm tra dựa trên ID đơn thuần
      return !selectedValues.includes(opt.value);
    });
  }, [options, search, selectedValues, isCommitteeMode]);

  return (
    <div className="relative w-full" ref={selectRef}>
      <div
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
        className={`bg-white border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} text-gray-900 text-xs rounded-lg p-2 flex flex-wrap gap-1 min-h-[38px] hover:border-blue-400 transition-all shadow-sm ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {selectedValues.length > 0 ? (
          options.filter(o => {
            if (isCommitteeMode) return selectedValues.some(e => String(e?.userCode || '').includes(String(o.value)));
            return selectedValues.includes(o.value);
          }).map(o => (
            <span key={o.value} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
              {o.label}
              {!disabled && (
                <X
                  size={12}
                  className="hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newValue = isCommitteeMode
                      ? selectedValues.filter(v => String(v.userCode) !== String(o.value))
                      : selectedValues.filter(v => String(v) !== String(o.value));
                    onChange(newValue);
                  }}
                />
              )}
            </span>
          ))
        ) : <span className="text-gray-400 pl-1">{placeholder}</span>}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[110] mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden min-w-[250px]">
          <div className="p-2 border-b bg-gray-50">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Tìm kiếm..."
                className="w-full text-[11px] pl-8 pr-2 py-1.5 border border-gray-300 rounded-md outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {
              displayOptions.length > 0 ? displayOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    const newValue = isCommitteeMode
                      ? [...selectedValues, { userCode: opt.value, name: opt.label, isLeader: opt.label.includes("Trưởng ban") }]
                      : [...selectedValues, opt.value];
                    onChange(newValue);
                    setSearch('');
                  }}
                  className="p-2.5 text-xs hover:bg-blue-50 cursor-pointer text-gray-700 border-b last:border-0"
                >
                  {opt.label}
                </div>
              )) : <div className="p-3 text-xs text-gray-400 italic text-center">Không còn kết quả</div>
            }
          </div>
        </div>
      )}
      {errorMessage && <p className="text-red-500 text-xs mt-1 font-medium">{errorMessage}</p>}
    </div>
  );
};

export const MaterialReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [usersRawData, setUsersRawData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [loading, setLoading] = useState(true); // This state holds all raw warehouse data
  const [warehousesRawData, setWarehousesRawData] = useState([]); // New state for all raw warehouse data
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [receiptErrors, setReceiptErrors] = useState({});
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(getCookie('user') || 'null');
    } catch {
      return null;
    }
  }, []);
  const [currentUserDetail, setCurrentUserDetail] = useState(null);

  useEffect(() => {
    const fetchCurrentUserDetail = async () => {
      const userId = currentUser?.id || currentUser?.Id || currentUser?.ID;
      if (!userId) {
        setCurrentUserDetail(null);
        return;
      }

      try {
        const user = await getUser(userId);
        setCurrentUserDetail(user);
      } catch (error) {
        console.error("Error fetching current user detail:", error);
        setCurrentUserDetail(null);
      }
    };

    fetchCurrentUserDetail();
  }, [currentUser]);

  const currentUserRoleName = useMemo(() => {
    const directRoleName = currentUserDetail?.roleName || currentUserDetail?.RoleName || currentUserDetail?.role?.name || currentUserDetail?.Role?.Name || currentUserDetail?.role?.Name;
    if (directRoleName) return directRoleName;

    const roleId = currentUserDetail?.role || currentUserDetail?.Role || currentUserDetail?.roleId || currentUserDetail?.RoleId;
    return roles.find(role => String(role.id || role.Id) === String(roleId))?.name || '';
  }, [currentUserDetail, roles]);
  const currentUserRoleId = currentUserDetail?.role || currentUserDetail?.Role || currentUserDetail?.roleId || currentUserDetail?.RoleId;
  const isWarehouseEmployee = String(currentUserRoleId) === '1' || currentUserRoleName === 'Nhân viên kho';
  const isPurchasingEmployee = currentUserRoleName === 'Nhân viên mua hàng';
  const getReceiptStatus = (receipt) => String(receipt?.status || receipt?.Status || receipt?.qualityStatus || receipt?.QualityStatus || '');

  // States cho quản lý Nhà cung cấp (Suppliers)
  const [isSuppliersModalOpen, setIsSuppliersModalOpen] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [supplierModalMode, setSupplierModalMode] = useState('list'); // 'list', 'add', 'edit'
  const [isSuppliersMgmtMaximized, setIsSuppliersMgmtMaximized] = useState(false);
  const [isSupplierEditModalOpen, setIsSupplierEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', taxId: '' });

  // States cho quản lý Nhà kho (Warehouses)
  const [isWarehousesModalOpen, setIsWarehousesModalOpen] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState('');
  const [warehouseModalMode, setWarehouseModalMode] = useState('list'); // 'list', 'add', 'edit'
  const [isWarehousesMgmtMaximized, setIsWarehousesMgmtMaximized] = useState(false);
  const [isWarehouseEditModalOpen, setIsWarehouseEditModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState({ name: '', code: '', type: '', status: '', location: '' });
  const [warehouseTypes, setWarehouseTypes] = useState([]);
  const [openInventoryMenuId, setOpenInventoryMenuId] = useState(null); // State để quản lý menu tồn kho
  const inventoryMenuRef = useRef(null); // Ref để đóng menu khi click ra ngoài
  const [isMaterialInfoModalOpen, setIsMaterialInfoModalOpen] = useState(false);
  const [warehouseStatuses, setWarehouseStatuses] = useState([]);
  const [warehouseLocations, setWarehouseLocations] = useState([]);
  const [warehouseRacks, setWarehouseRacks] = useState([]); // Cần cho việc hiển thị label của location
  const [warehouseBins, setWarehouseBins] = useState([]); // Cần cho việc hiển thị label của location

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });
  const [mobileDateModal, setMobileDateModal] = useState({ isOpen: false, value: '', label: '', field: '', materialId: null });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedReceiptIds, setSelectedReceiptIds] = useState([]);

  const qualityOptions = [
    { value: 1, label: 'Đạt chất lượng (Passed)' },
    { value: 2, label: 'Chờ kiểm định (Pending)' },
    { value: 3, label: 'Không đạt (Failed)' }
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [receiptsData, warehousesData, usersData, locationData, rackData, suppliersData, materialsData, categoriesData, warehouseTypesData, warehouseStatusesData, warehouseBinsData, rolesData] = await Promise.all([
        getMaterialReceipts(),
        getWarehouses(),
        getUsers(),
        getWarehouseLocations(),
        getWarehouseRacks(),
        getSuppliers(),
        getMaterials(),
        getMaterialCategories(),
        getWarehouseTypes(),
        getWarehouseStatuses(),
        getWarehouseBins(),
        getRoles(),
      ]);
      setWarehousesRawData(warehousesData); // Store all raw warehouses data
      setReceipts(receiptsData);
      setSelectedReceiptIds([]);
      setIsBulkSelectMode(false);

      setWarehouseTypes(warehouseTypesData.map(wt => ({ value: wt.id, label: wt.name })));
      setWarehouseStatuses(warehouseStatusesData.map(ws => ({ value: ws.id, label: ws.name })));
      setWarehouseRacks(rackData.map(wr => ({ value: wr.id, label: wr.name })));
      setWarehouseBins(warehouseBinsData.map(wb => ({ value: wb.id, label: wb.name })));
      setRoles(rolesData);
      setUsersRawData(usersData);

      // Lọc những nhà kho có type === 1 và thiết kế lại label dựa trên vị trí (location)
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
            label = `Kho nguyên liệu: Kệ ${rackName} - Tầng ${level} - Ô ${bin}`;
          }
          return { value: w.id || w.ID, label };
        });

      // Lưu trữ tất cả các warehouse locations để sử dụng trong modal quản lý kho
      setWarehouseLocations(locationData.map(l => ({ value: l.id, label: `${l.bin} - Kệ ${rackData.find(r => String(r.id) === String(l.racks))?.name || l.racks} - Tầng ${l.level}` })));

      setWarehouses(mappedWarehouses);

      setUsers(usersData.map(u => ({ value: u.id, label: u.name })));
      setSuppliers(suppliersData.map(s => ({ value: s.id, label: s.name })));

      setAllMaterials(materialsData.map(m => {
        const category = categoriesData.find(c => String(c.id) === String(m.name));
        return {
          value: m.id,
          label: category ? category.name : `Nguyên liệu #${m.id}`,
          // Đảm bảo thông tin số lượng và đơn vị tồn kho được lưu trữ
          quantity: m.quantity,
          unit: m.unit
        };
      }));
    } catch (err) {
      showNotification("Lỗi khi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  // useEffect để đóng menu tồn kho khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inventoryMenuRef.current && !inventoryMenuRef.current.contains(event.target)) {
        setOpenInventoryMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return receipts.filter(r =>
      r.materialReceiptCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [receipts, searchTerm]);

  // Lọc danh sách người dùng thuộc Ban kiểm nghiệm cho dropdown
  const inspectorOptions = useMemo(() => {
    const tbknRole = roles.find(r => r.name === "Trưởng ban kiểm nghiệm");
    const ubknRole = roles.find(r => r.name === "Ủy ban kiểm nghiệm");

    const filtered = usersRawData.filter(u =>
      String(u.role || u.Role) === String(tbknRole?.id) ||
      String(u.role || u.Role) === String(ubknRole?.id)
    ).map(u => ({
      value: u.userCode || u.UserCode,
      label: `${u.name || u.Name} (${String(u.role || u.Role) === String(tbknRole?.id) ? 'Trưởng ban' : 'Ủy ban'})`,
      roleId: u.role || u.Role
    }));

    // Sắp xếp: Trưởng ban luôn đứng trước Ủy ban trong mảng options
    return filtered.sort((a, b) => {
      const aIsHead = String(a.roleId) === String(tbknRole?.id);
      const bIsHead = String(b.roleId) === String(tbknRole?.id);
      if (aIsHead && !bIsHead) return -1; // Đẩy Trưởng ban lên đầu
      if (!aIsHead && bIsHead) return 1;  // Đẩy Ủy ban xuống sau
      return 0;
    });
  }, [usersRawData, roles]);

  // Kiểm tra điều kiện để kích hoạt nút xuất biên bản giám định
  const canExportInspectionReport = useMemo(() => {
    const selectedIds = currentReceipt?.inspectorPanel || [];
    if (selectedIds.length === 0) return false;

    // Tìm ID của các chức vụ cần thiết
    const tbknRoleId = roles.find(r => r.name === "Trưởng ban kiểm nghiệm")?.id;
    const ubknRoleId = roles.find(r => r.name === "Ủy ban kiểm nghiệm")?.id;

    const selectedOptions = inspectorOptions.filter(opt => selectedIds.includes(opt.value));
    const hasTbkn = selectedOptions.some(opt => String(opt.roleId) === String(tbknRoleId));
    const hasUbkn = selectedOptions.some(opt => String(opt.roleId) === String(ubknRoleId));

    return hasTbkn && hasUbkn;
  }, [currentReceipt?.inspectorPanel, inspectorOptions, roles]);

  const handleInspectorChange = (newIds) => {
    const tbknRoleId = roles.find(r => r.name === "Trưởng ban kiểm nghiệm")?.id;
    const ubknRoleId = roles.find(r => r.name === "Ủy ban kiểm nghiệm")?.id;

    // LƯU Ý: Vì inspectorOptions dùng userCode làm value, nên newIds chứa các chuỗi userCode
    const selectedUsers = usersRawData.filter(u =>
      newIds.some(e => e?.userCode.includes(u.userCode || u.UserCode))
    );

    const tbknCount = selectedUsers.filter(u => String(u.role || u.Role) === String(tbknRoleId)).length;
    const ubknCount = selectedUsers.filter(u => String(u.role || u.Role) === String(ubknRoleId)).length;

    if (tbknCount > 1) return showNotification("Chỉ được chọn tối đa 1 Trưởng ban kiểm nghiệm", "error");
    if (ubknCount > 2) return showNotification("Chỉ được chọn tối đa 2 Ủy ban kiểm nghiệm", "error");

    setCurrentReceipt(prev => ({ ...prev, inspectationCommitteeList: newIds }));
    if (receiptErrors.inspectorPanel) setReceiptErrors(prev => ({ ...prev, inspectorPanel: null }));
  };

  const handleOpenModal = (mode, receipt = null) => {
    setModalMode(mode);
    setActiveTab(1);
    setReceiptErrors({});
    if (mode === 'add') {
      setCurrentReceipt({
        materialReceiptCode: '',
        supplier: '',
        deliveryNoteNumber: '',
        receivingDate: '',
        status: 1,
        items: [], // { materialId, shippedQuantity, mfgDate, expiredDate }
        specialStorageCondition: '',
        inspectationReport: '',
        receiver: '',
        inspectorPanel: [],
        certificateOfOrigin: '',
        certificateOfQuality: '',
        expiryDate: ''
      });
    } else {
      const formatted = { ...receipt };
      if (receipt.receivingDate) formatted.receivingDate = receipt.receivingDate.split('T')[0];
      if (receipt.expiryDate) formatted.expiryDate = receipt.expiryDate.split('T')[0];

      // Ánh xạ ngược từ materialReceiptBatchList về items để hiển thị trên bảng
      if (receipt.materialReceiptBatchList) {
        formatted.items = receipt.materialReceiptBatchList.map(item => ({
          ...item,
          materialId: item.materialId ?? item.MaterialId,
          shippedQuantity: item.shippedQuantity ?? item.ShippedQuantity ?? 0,
          mfgDate: item.mfgDate ? item.mfgDate.split('T')[0] : '',
          expiredDate: item.expiredDate ? item.expiredDate.split('T')[0] : '',
          deliveredQuantity: item.deliveredQuantity ?? item.DeliveredQuantity ?? ''
        }));
      }

      // Khởi tạo inspectorPanel từ inspectationCommitteeList của backend trả về
      formatted.inspectorPanel = (receipt.inspectationCommitteeList || receipt.InspectationCommitteeList || [])
        .map(item => item.userCode || item.usercode || item.UserCode)
        .filter(Boolean);

      setCurrentReceipt(formatted);
    }
    setIsModalOpen(true);
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách phiếu nhập nguyên liệu ra tệp Excel không?'
    });
  };

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
    setImportFile(null);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setImportFile(file);
  };

  const handleImportExcel = async (e) => {
    e.preventDefault();
    if (!selectedImportFile) {
      showNotification("Vui lòng chọn file Excel.", "error");
      return;
    }

    setIsImportingExcel(true);
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(selectedImportFile);
      const worksheet = workbook.getWorksheet(1);

      const importedData = [];
      const lookupErrors = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < 2) return; // Bỏ qua dòng tiêu đề

        const receiptCode = row.getCell(2).text?.trim(); // Cột B
        if (!receiptCode) return;

        const supplierName = row.getCell(3).text?.trim(); // Cột C
        const deliveryNote = row.getCell(4).text?.trim(); // Cột D
        const receivingDateRaw = row.getCell(5).value;    // Cột E
        const materialsRaw = row.getCell(6).text?.trim(); // Cột F
        const committeeRaw = row.getCell(7).text?.trim(); // Cột G
        const receiverName = row.getCell(8).text?.trim(); // Cột H

        // 1. Dò Nhà cung cấp (Bảng Suppliers)
        const supplier = suppliers.find(s => s.label?.toLowerCase() === supplierName?.toLowerCase());
        if (supplierName && !supplier) lookupErrors.push(`Dòng ${rowNumber}: Không thấy NCC "${supplierName}"`);

        // 2. Dò Người nhận (Bảng Users)
        const receiverUser = usersRawData.find(u => (u.name || u.Name)?.toLowerCase() === receiverName?.toLowerCase());
        if (receiverName && !receiverUser) lookupErrors.push(`Dòng ${rowNumber}: Không thấy Người nhận "${receiverName}"`);

        // 3. Phân tích Nguyên liệu (Cột F) -> MaterialReceipt_Batches
        const batchList = [];
        if (materialsRaw) {
          const lines = materialsRaw.split('\n').filter(Boolean);
          lines.forEach(line => {
            // Tách "a Tên nguyên liệu" (Số lượng và Tên)
            const match = line.trim().match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
            if (match) {
              const qty = parseFloat(match[1]);
              const mName = match[2].trim();
              const material = allMaterials.find(m => m.label?.toLowerCase() === mName.toLowerCase());
              if (material) {
                batchList.push({
                  MaterialId: material.value,
                  ShippedQuantity: qty,
                  DeliveredQuantity: qty,
                  MFGDate: null,
                  ExpiredDate: null,
                  BatchCode: ""
                });
              } else {
                lookupErrors.push(`Dòng ${rowNumber}: Không thấy NL "${mName}"`);
              }
            }
          });
        }

        // 4. Phân tích Ban kiểm nghiệm (Cột G)
        let leaderCode = "";
        let comm1Code = "";
        let comm2Code = "";
        if (committeeRaw) {
          const names = committeeRaw.split('\n')
            .map(l => l.split('(')[0].trim()) // Lấy phần tên trước dấu ngoặc
            .filter(Boolean);

          const userCodes = names.map(name => {
            const u = usersRawData.find(user => (user.name || user.Name)?.toLowerCase() === name.toLowerCase());
            return u ? (u.userCode || u.UserCode) : null;
          });

          leaderCode = userCodes[0] || "";
          comm1Code = userCodes[1] || "";
          comm2Code = userCodes[2] || "";
        }

        // 5. Xử lý Ngày nhận
        let receivingDate = "";
        if (receivingDateRaw instanceof Date) {
          receivingDate = receivingDateRaw.toISOString().split('T')[0];
        } else if (receivingDateRaw) {
          const d = new Date(receivingDateRaw);
          if (!isNaN(d.getTime())) receivingDate = d.toISOString().split('T')[0];
        }

        const existingReceipt = receipts.find(r => r.materialReceiptCode === receiptCode);

        importedData.push({
          id: existingReceipt ? (existingReceipt.id || existingReceipt.Id) : 0,
          materialReceiptCode: receiptCode,
          supplier: supplier?.value || "",
          deliveryNoteNumber: deliveryNote || "",
          receivingDate: receivingDate || new Date().toISOString().split('T')[0],
          receiver: receiverUser ? (receiverUser.id || receiverUser.Id) : 0,
          InspectationCommitteeLeader: leaderCode,
          InspectationCommittee1: comm1Code,
          InspectationCommittee2: comm2Code,
          materialReceiptBatchList: batchList
        });
      });

      if (lookupErrors.length > 0) {
        showNotification("Lỗi dò tìm: " + lookupErrors.slice(0, 3).join("; ") + (lookupErrors.length > 3 ? "..." : ""), "error");
        setIsImportingExcel(false);
        return;
      }

      // Thực hiện gọi API lưu dữ liệu (Thêm mới hoặc Cập nhật)
      for (const payload of importedData) {
        if (payload.id > 0) await updateMaterialReceipt(payload.id, payload);
        else await createMaterialReceipt(payload);
      }

      showNotification(`Đã nhập/cập nhật thành công ${importedData.length} phiếu nhập!`);
      fetchData();
      handleCloseImportModal();
    } catch (err) {
      console.error("Import Error:", err);
      showNotification("Lỗi khi xử lý file Excel hoặc lưu dữ liệu.", "error");
    } finally {
      setIsImportingExcel(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách phiếu nhập');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Mã phiếu', key: 'materialReceiptCode', width: 20 },
        { header: 'Nhà cung cấp', key: 'supplier', width: 30 },
        { header: 'Số vận đơn', key: 'deliveryNoteNumber', width: 20 },
        { header: 'Ngày nhận', key: 'receivingDate', width: 15 },
        { header: 'Nguyên liệu', key: 'items', width: 40 },
        { header: 'Ban kiểm nghiệm sản phẩm', key: 'inspectorPanel', width: 35 },
        { header: 'Người nhận', key: 'receiver', width: 20 },
      ];

      filteredData.forEach((receipt, index) => {
        const supplierLabel = suppliers.find(s => s.value === receipt.supplier)?.label || 'N/A';
        const receiverLabel = users.find(u => u.value === receipt.receiver)?.label || 'N/A';

        // Xử lý chuỗi danh sách nguyên liệu
        const materialsString = (receipt.materialReceiptBatchList || []).map(batch => {
          const materialName = allMaterials.find(m => String(m.value) === String(batch.materialId))?.label || `NL #${batch.materialId}`;
          const qty = batch.deliveredQuantity ?? batch.shippedQuantity ?? 0;
          return `${qty} ${materialName}`;
        }).join('\n');

        // Xử lý chuỗi ban kiểm nghiệm
        const panelUserCodes = receipt.inspectationCommitteeList
          ? (Array.isArray(receipt.inspectationCommitteeList) ? receipt.inspectationCommitteeList.map(item => item.userCode) : receipt.inspectationCommitteeList.split(',').map(Number))
          : [];
        const inspectorPanelNames = panelUserCodes.map(userCode => {
          return inspectorOptions.find(opt => opt.value === userCode)?.label || `UserCode: ${userCode}`;
        }).join('\n');

        worksheet.addRow({
          stt: index + 1,
          materialReceiptCode: receipt.materialReceiptCode,
          supplier: supplierLabel,
          deliveryNoteNumber: receipt.deliveryNoteNumber,
          receivingDate: receipt.receivingDate ? new Date(receipt.receivingDate).toLocaleDateString('vi-VN') : 'N/A',
          items: materialsString,
          inspectorPanel: inspectorPanelNames,
          receiver: receiverLabel,
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        if (rowNumber === 1) {
          row.height = 30;
          row.font = { name: 'Times New Roman', size: 12, bold: true };
          row.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          if (colNumber === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách phiếu nhập nguyên liệu.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsMaterialInfoModalOpen(false);
    setCurrentReceipt(null);
    setReceiptErrors({});
    setIsModalMaximized(false);
  };

  const handleInputChange = (eOrVal, nameFromSelect = null) => {
    // Xử lý cả input event và giá trị từ SearchableSelect
    const name = nameFromSelect || eOrVal.target.name;
    const value = nameFromSelect ? eOrVal : eOrVal.target.value;
    setCurrentReceipt(prev => ({ ...prev, [name]: value }));
    if (receiptErrors[name]) setReceiptErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleItemFieldChange = (materialId, field, value) => {
    setCurrentReceipt(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.materialId === materialId ? { ...item, [field]: value } : item
      )
    }));
  };

  const isReceiveMode = modalMode === 'receive';
  const currentReceiptStatus = String(
    getReceiptStatus(currentReceipt)
  );
  const isWarehouseMaterialInfoMode = isWarehouseEmployee && isMaterialInfoModalOpen;
  const isCompletedMaterialInfoMode = isMaterialInfoModalOpen && currentReceiptStatus === '4';
  const isMaterialInfoReadOnlyMode = isWarehouseMaterialInfoMode || isCompletedMaterialInfoMode;
  const isReadOnlyReceiptItemField = isReceiveMode || isMaterialInfoReadOnlyMode;
  const showDeliveredQuantityColumn = isReceiveMode || isWarehouseMaterialInfoMode || isCompletedMaterialInfoMode;
  const canEditDeliveredQuantity = isReceiveMode || (isWarehouseMaterialInfoMode && currentReceiptStatus === '1');

  const handleReceiveWrongInfo = async () => {
    try {
      await markMaterialReceiptWrongInfo(currentReceipt.id || currentReceipt.Id);
      showNotification("Đã ghi nhận phiếu nhập sai thông tin.", "error");
      fetchData();
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi ghi nhận sai thông tin", "error");
    }
  };

  const handleReceiveConfirm = async () => {
    try {
      const invalidItem = (currentReceipt.items || []).find(item => {
        const hasDeliveredQuantity = item.deliveredQuantity !== '' && item.deliveredQuantity !== null && item.deliveredQuantity !== undefined;
        const deliveredQuantity = Number(item.deliveredQuantity);
        const shippedQuantity = Number(item.shippedQuantity);
        return !hasDeliveredQuantity || Number.isNaN(deliveredQuantity) || deliveredQuantity < 0 || deliveredQuantity > shippedQuantity;
      });

      if (invalidItem) {
        showNotification("Số lượng nhận không được bỏ trống, nhỏ hơn 0 hoặc vượt quá Số lượng cùng dòng.", "error");
        setActiveTab(2);
        return;
      }

      await receiveMaterialReceipt(
        currentReceipt.id || currentReceipt.Id,
        (currentReceipt.items || []).map(item => ({
          materialId: item.materialId,
          deliveredQuantity: Number(item.deliveredQuantity) || 0
        }))
      );
      showNotification("Nhận nguyên liệu thành công!");
      fetchData();
      handleCloseModal();
    } catch (err) {
      const message = err?.response?.data?.message || "Lỗi khi nhận nguyên liệu";
      showNotification(message, "error");
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      // Lưu trực tiếp đối tượng File thay vì dùng FileReader
      setCurrentReceipt(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!currentReceipt?.supplier) newErrors.supplier = "Bắt buộc nhập Nhà cung cấp";
    if (!currentReceipt?.deliveryNoteNumber?.trim()) newErrors.deliveryNoteNumber = "Bắt buộc nhập Số vận đơn";
    if (!currentReceipt?.receivingDate) newErrors.receivingDate = "Bắt buộc nhập Ngày nhận hàng";
    if (!currentReceipt?.items?.length) newErrors.items = "Bắt buộc nhập nguyên liệu nhập";
    if (!currentReceipt?.receiver) newErrors.receiver = "Bắt buộc nhập Người nhận hàng";
    if (!currentReceipt?.inspectationCommitteeList?.length) newErrors.inspectorPanel = "Bắt buộc nhập Ban kiểm nghiệm sản phẩm";

    if (Object.keys(newErrors).length > 0) {
      setReceiptErrors(newErrors);
      if (newErrors.supplier || newErrors.deliveryNoteNumber || newErrors.receivingDate) setActiveTab(1);
      else if (newErrors.items) setActiveTab(2);
      else setActiveTab(3);
      return;
    }
    setReceiptErrors({});

    try {
      // Tìm ID của các chức vụ để phân loại thành viên
      const tbknRoleId = roles.find(r => r.name === "Trưởng ban kiểm nghiệm")?.id;
      const ubknRoleId = roles.find(r => r.name === "Ủy ban kiểm nghiệm")?.id;

      // Lấy thông tin người dùng đầy đủ từ danh sách ID đã chọn trong Ban kiểm nghiệm
      const selectedInspectors = usersRawData.filter(u => (currentReceipt.inspectationCommitteeList || []).some(e => e.userCode.includes(u.userCode || u.UserCode)));

      const leaderUser = selectedInspectors.find(u => String(u.role || u.Role) === String(tbknRoleId));
      const committeeMembers = selectedInspectors.filter(u => String(u.role || u.Role) === String(ubknRoleId));

      // Xây dựng payload sạch sẽ theo cấu trúc DTO ở Back-end
      const payload = {
        id: currentReceipt.id,
        materialReceiptCode: currentReceipt.materialReceiptCode,
        supplier: currentReceipt.supplier,
        deliveryNoteNumber: currentReceipt.deliveryNoteNumber,
        receivingDate: currentReceipt.receivingDate,
        status: modalMode === 'edit' && isPurchasingEmployee ? 5 : currentReceipt.status,
        specialStorageCondition: currentReceipt.specialStorageCondition || "", // Giữ nguyên nội dung textarea bao gồm cả xuống dòng
        receiver: currentReceipt.receiver,
        InspectorCommitteeList: currentReceipt.inspectationCommitteeList || [], // Đổi thành PascalCase để khớp với DTO ở Back-end
        InspectationCommitteeLeader: leaderUser?.userCode || leaderUser?.UserCode || "",
        InspectationCommittee1: committeeMembers[0]?.userCode || committeeMembers[0]?.UserCode || "",
        InspectationCommittee2: committeeMembers[1]?.userCode || committeeMembers[1]?.UserCode || "",
        materialReceiptBatchList: (currentReceipt.items || []).map(item => ({
          MaterialId: item.materialId,
          ShippedQuantity: parseFloat(item.shippedQuantity) || 0,
          DeliveredQuantity: parseFloat(item.deliveredQuantity ?? item.shippedQuantity) || 0, // Mặc định số lượng thực nhận bằng số lượng vận đơn
          MFGDate: item.mfgDate || null, // Sử dụng PascalCase để khớp chính xác với Service logic
          ExpiredDate: item.expiredDate || null, // Sử dụng PascalCase để khớp chính xác với Service logic
          BatchCode: item.batchCode || ""
        }))
      };

      // Chỉ gửi tệp tin nếu người dùng thực sự chọn file mới (đối tượng File)
      // Tên trường khớp với logic xử lý của createFormData trong materialReceiptsController.js
      if (currentReceipt.certificateOfOrigin instanceof File) payload.certificateOfOrigin = currentReceipt.certificateOfOrigin;
      if (currentReceipt.certificateOfQuality instanceof File) payload.certificateOfQuality = currentReceipt.certificateOfQuality;
      if (currentReceipt.inspectationReport instanceof File) payload.inspectationReport = currentReceipt.inspectationReport;

      if (modalMode === 'add') {
        console.log("payload la", payload);
        await createMaterialReceipt(payload);
        showNotification("Thêm phiếu nhập mới thành công!");
      } else if (modalMode === 'edit') {
        await updateMaterialReceipt(currentReceipt.id, payload);
        showNotification("Cập nhật phiếu nhập thành công!");
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu", "error");
    }
  };

  const handleDeleteRequest = (id) => {
    setConfirmModal({
      isOpen: true,
      id,
      type: 'delete',
      title: 'Xác nhận xóa phiếu',
      message: 'Bạn có chắc chắn muốn xóa phiếu nhập nguyên liệu này?'
    });
  };

  const handleBulkDelete = () => {
    if (!isBulkSelectMode) {
      setIsBulkSelectMode(true);
      setSelectedReceiptIds([]);
      return;
    }
    if (selectedReceiptIds.length === 0) {
      setIsBulkSelectMode(false);
      setSelectedReceiptIds([]);
      return;
    }
    setConfirmModal({
      isOpen: true,
      id: selectedReceiptIds,
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều phiếu nhập',
      message: `Bạn có chắc chắn muốn xóa ${selectedReceiptIds.length} phiếu nhập đã chọn không? Hành động này không thể hoàn tác.`
    });
  };

  const handleSelectAllReceipts = () => {
    setSelectedReceiptIds(filteredData.map(r => r.id || r.Id));
  };

  const handleClearSelectedReceipts = () => {
    setSelectedReceiptIds([]);
  };

  const handleToggleSelectReceipt = (row) => {
    const rowId = row.id || row.Id;
    setSelectedReceiptIds(prev =>
      prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
    );
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'export') {
      await handleExportExcel();
    } else if (confirmModal.type === 'delete') {
      try {
        await deleteMaterialReceipt(confirmModal.id);
        showNotification("Đã xóa phiếu thành công!");
        fetchData();
      } catch (err) {
        console.error("Error deleting material receipt:", err);
        showNotification("Lỗi khi xóa phiếu", "error");
      }
    } else if (confirmModal.type === 'bulkDelete') {
      try {
        await Promise.all(confirmModal.id.map(receiptId => deleteMaterialReceipt(receiptId)));
        setReceipts(prev => prev.filter(r => !confirmModal.id.includes(r.id || r.Id)));
        setSelectedReceiptIds([]);
        setIsBulkSelectMode(false);
        showNotification(`Đã xóa ${confirmModal.id.length} phiếu nhập thành công!`, "success");
      } catch (err) {
        showNotification("Có lỗi xảy ra khi xóa nhiều phiếu nhập.", "error");
      }
    } else if (confirmModal.type === 'download') {
      try {
        const { code, type } = confirmModal.id;
        await downloadReceiptFile(code, type);
        showNotification("Tải tệp tin thành công!");
      } catch (error) {
        console.error("Error downloading file:", error);
        showNotification("Lỗi khi tải file: " + error.message, "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleOpenMaterialInfoModal = (receipt) => {
    setModalMode('edit'); // Đặt mode là edit để handleSubmit thực hiện update
    const formatted = { ...receipt };
    if (receipt.receivingDate) formatted.receivingDate = receipt.receivingDate.split('T')[0];
    if (receipt.materialReceiptBatchList) {
      formatted.items = receipt.materialReceiptBatchList.map(item => ({
        ...item,
        materialId: item.materialId ?? item.MaterialId,
        shippedQuantity: item.shippedQuantity ?? item.ShippedQuantity ?? 0,
        deliveredQuantity: item.deliveredQuantity ?? item.DeliveredQuantity ?? '',
        mfgDate: item.mfgDate ? item.mfgDate.split('T')[0] : '',
        expiredDate: item.expiredDate ? item.expiredDate.split('T')[0] : ''
      }));
    }
    setCurrentReceipt(formatted);
    setIsMaterialInfoModalOpen(true);
  };

  // Handlers cho quản lý Nhà cung cấp
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      if (supplierModalMode === 'add') {
        await createSupplier(editingSupplier);
        showNotification("Thêm nhà cung cấp thành công!");
      } else {
        await updateSupplier(editingSupplier.id, editingSupplier);
        showNotification("Cập nhật nhà cung cấp thành công!");
      }
      setIsSupplierEditModalOpen(false);
      fetchData(); // Tải lại danh sách sau khi thay đổi
    } catch (err) {
      console.error("Error saving supplier:", err);
      showNotification("Lỗi khi lưu nhà cung cấp", "error");
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) {
      try {
        await deleteSupplier(id);
        showNotification("Đã xóa nhà cung cấp!");
        fetchData();
      } catch (err) {
        console.error("Error deleting supplier:", err);
        showNotification("Lỗi khi xóa nhà cung cấp", "error");
      }
    }
  };

  const handleOpenSuppliersModal = () => {
    setSupplierModalMode('list');
    setSupplierSearchTerm('');
    setIsSuppliersModalOpen(true);
  };

  const handleExportInspectionReport = async () => {
    try {
      showNotification("Đang tạo biên bản giám định, vui lòng đợi...", "info");
      await exportInspectionReport(currentReceipt.id);
      showNotification("Xuất biên bản thành công!");
    } catch (err) {
      console.error("Export Error:", err);
      showNotification("Lỗi khi xuất biên bản giám định.", "error");
    }
  };

  // Handlers cho quản lý Nhà kho
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
      fetchData(); // Tải lại danh sách sau khi thay đổi
    } catch (err) {
      console.error("Error saving warehouse:", err);
      showNotification("Lỗi khi lưu nhà kho", "error");
    }
  };

  const handleDeleteWarehouse = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhà kho này?")) {
      try {
        await deleteWarehouse(id);
        showNotification("Đã xóa nhà kho!");
        fetchData();
      } catch (err) {
        console.error("Error deleting warehouse:", err);
        showNotification("Lỗi khi xóa nhà kho", "error");
      }
    }
  };

  const handleOpenWarehousesModal = () => {
    setWarehouseModalMode('list');
    setWarehouseSearchTerm('');
    setIsWarehousesModalOpen(true);
    setIsWarehousesMgmtMaximized(false);
  };

  // Định nghĩa columns cho bảng nguyên liệu trong Modal
  const itemColumns = useMemo(() => [
    {
      header: 'Tên nguyên liệu',
      render: (item) => allMaterials.find(m => m.value === item.materialId)?.label || 'N/A',
      className: 'w-48' // Điều chỉnh chiều rộng cột
    },
    {
      header: 'Số lượng',
      render: (item) => (
        <div className="relative flex items-center gap-1">
          <input
            type="number"
            value={item.shippedQuantity}
            onChange={(e) => handleItemFieldChange(item.materialId, 'shippedQuantity', e.target.value)}
            disabled={isReadOnlyReceiptItemField}
            className={`w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none ${isReadOnlyReceiptItemField ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
            min="0"
            onFocus={(e) => {
              if (isReadOnlyReceiptItemField) return;
              e.stopPropagation();
              setOpenInventoryMenuId(openInventoryMenuId === item.materialId ? null : item.materialId);
            }}
          />

          {openInventoryMenuId === item.materialId && (
            <div
              ref={inventoryMenuRef} // Gắn ref để xử lý click ra ngoài
              className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[999] p-2 text-xs animate-in fade-in zoom-in duration-200 origin-top min-w-[150px]"
            >
              {/* Hiển thị thông tin tồn kho */}
              <div className="flex flex-col gap-1">
                <span className="font-bold text-gray-700">Tồn kho:</span>
                <span className="text-blue-600">
                  {allMaterials.find(m => m.value === item.materialId)?.quantity?.toLocaleString() || 'N/A'}
                  {' '}
                  {allMaterials.find(m => m.value === item.materialId)?.unit || ''}
                </span>
              </div>
            </div>
          )}
        </div>
      ),
      className: 'min-w-[120px]' // Ép chiều rộng tối thiểu 180px để thấy rõ số lượng và đơn vị
    },
    ...(showDeliveredQuantityColumn ? [{
      header: 'Số lượng nhận',
      render: (item) => (
        <input
          type="number"
          value={item.deliveredQuantity ?? ''}
          onChange={(e) => {
            const shippedQuantity = Number(item.shippedQuantity) || 0;
            const nextValue = Math.min(Number(e.target.value) || 0, shippedQuantity);
            handleItemFieldChange(item.materialId, 'deliveredQuantity', nextValue);
          }}
          disabled={!canEditDeliveredQuantity}
          className={`w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none ${canEditDeliveredQuantity ? 'bg-white' : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}
          min="0"
          max={Number(item.shippedQuantity) || 0}
          placeholder="Nhập SL nhận"
        />
      ),
      className: 'min-w-[130px]'
    }] : []),
    {
      header: 'Ngày sản xuất',
      render: (item, { rowIndex }) => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          return (
            <div className="relative group">
              <input
                readOnly
                value={item.mfgDate ? new Date(item.mfgDate).toLocaleDateString('vi-VN') : ''}
                onClick={() => !isReadOnlyReceiptItemField && setMobileDateModal({ isOpen: true, value: item.mfgDate || '', label: 'Ngày sản xuất', field: 'mfgDate', materialId: item.materialId })}
                placeholder="Chọn..."
                className={`w-full border border-gray-300 rounded-md px-2 py-1 text-[11px] h-[30px] pr-8 outline-none focus:ring-1 focus:ring-blue-500 font-medium ${isReadOnlyReceiptItemField ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white cursor-pointer'}`}
              />
              <Calendar size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
            </div>
          );
        }
        const isNearBottom = rowIndex >= 3;
        return (
          <DateInput
            label=""
            value={item.mfgDate || ''}
            onChange={(e) => handleItemFieldChange(item.materialId, 'mfgDate', e.target.value)}
            className={`w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-left focus:ring-1 focus:ring-blue-500 outline-none relative z-10 ${isReadOnlyReceiptItemField ? 'bg-gray-100 text-gray-500 pointer-events-none' : ''}`}
            placement={isNearBottom ? "top" : "bottom"}
          />
        );
      },
      className: 'min-w-[150px]', // Ép chiều rộng tối thiểu 220px để hiển thị ngày và icon lịch
    },
    {
      header: 'Ngày hết hạn',
      render: (item, { rowIndex }) => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          return (
            <div className="relative group">
              <input
                readOnly
                value={item.expiredDate ? new Date(item.expiredDate).toLocaleDateString('vi-VN') : ''}
                onClick={() => !isReadOnlyReceiptItemField && setMobileDateModal({ isOpen: true, value: item.expiredDate || '', label: 'Ngày hết hạn', field: 'expiredDate', materialId: item.materialId })}
                placeholder="Chọn..."
                className={`w-full border border-gray-300 rounded-md px-2 py-1 text-[11px] h-[30px] pr-8 outline-none focus:ring-1 focus:ring-blue-500 font-medium ${isReadOnlyReceiptItemField ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white cursor-pointer'}`}
              />
              <Calendar size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
            </div>
          );
        }
        const isNearBottom = rowIndex >= 3; // Tương tự như trên
        return (
          <DateInput
            label=""
            value={item.expiredDate || ''}
            onChange={(e) => handleItemFieldChange(item.materialId, 'expiredDate', e.target.value)}
            className={`w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-left focus:ring-1 focus:ring-blue-500 outline-none relative z-10 ${isReadOnlyReceiptItemField ? 'bg-gray-100 text-gray-500 pointer-events-none' : ''}`}
            placement={isNearBottom ? "top" : "bottom"}
          />
        );
      },
      className: 'min-w-[150px]', // Ép chiều rộng tối thiểu 220px để hiển thị ngày và icon lịch
    },
    {
      header: 'Xóa',
      hiddenInReceive: true,
      className: 'w-16 text-center !px-2',
      headerCellClassName: 'text-center',
      render: (item) => (
        <button type="button" onClick={() => setCurrentReceipt(prev => ({ ...prev, items: prev.items.filter(i => i.materialId !== item.materialId) }))} className="text-gray-500 hover:text-gray-700 active:scale-95"><Trash2 size={16} /></button>
      )
    }
  ], [allMaterials, currentReceipt, handleItemFieldChange, isReadOnlyReceiptItemField, showDeliveredQuantityColumn, canEditDeliveredQuantity, openInventoryMenuId]);

  const receiptItemColumns = useMemo(
    () => isReadOnlyReceiptItemField ? itemColumns.filter(column => !column.hiddenInReceive) : itemColumns,
    [isReadOnlyReceiptItemField, itemColumns]
  );

  // Định nghĩa cột cho bảng danh sách Nhà cung cấp
  const supplierTableColumns = useMemo(() => [
    { header: 'STT', render: (_, { index }) => index },
    { header: 'Tên nhà cung cấp', render: (row) => <span className="font-bold text-gray-700">{row.label}</span> },
    {
      header: 'Hành động',
      className: 'text-right pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={async () => {
              try {
                const fullSupplier = await getSupplier(row.value);
                setEditingSupplier(fullSupplier);
                setSupplierModalMode('edit');
                setIsSupplierEditModalOpen(true);
              } catch (e) { showNotification("Lỗi khi tải thông tin", "error"); }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >Sửa</button>
          <button
            onClick={() => handleDeleteSupplier(row.value)}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >Xóa</button>
        </div>
      )
    }
  ], [handleDeleteSupplier]);

  // Định nghĩa cột cho bảng danh sách Nhà kho
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

  const handleWarehouseChange = async (receipt, newWarehouseId) => {
    try {
      const payload = {
        ...receipt,
        warehouse: newWarehouseId,
        materialReceiptBatchList: receipt.materialReceiptBatchList || []
      };
      const updated = await updateMaterialReceipt(receipt.id, payload);
      if (updated) {
        setReceipts(prev => prev.map(r => r.id === updated.id ? updated : r));
        showNotification("Cập nhật kho thành công!");
      }
    } catch (err) {
      console.error("Error updating warehouse:", err);
      showNotification("Lỗi khi cập nhật kho.", "error");
    }
  };

  const handleReceiverChange = async (receipt, newReceiverId) => {
    try {
      const payload = {
        ...receipt,
        receiver: newReceiverId,
        materialReceiptBatchList: receipt.materialReceiptBatchList || []
      };
      const updated = await updateMaterialReceipt(receipt.id, payload);
      if (updated) {
        setReceipts(prev => prev.map(r => r.id === updated.id ? updated : r));
        showNotification("Cập nhật người nhận hàng thành công!");
      }
    } catch (err) {
      console.error("Error updating receiver:", err);
      showNotification("Lỗi khi cập nhật người nhận hàng.", "error");
    }
  };

  const handleSupplierChange = async (receipt, newSupplierId) => {
    try {
      const payload = {
        ...receipt,
        supplier: newSupplierId,
        materialReceiptBatchList: receipt.materialReceiptBatchList || []
      };
      const updated = await updateMaterialReceipt(receipt.id, payload);
      if (updated) {
        setReceipts(prev => prev.map(r => r.id === updated.id ? updated : r));
        showNotification("Cập nhật nhà cung cấp thành công!");
      }
    } catch (err) {
      console.error("Error updating supplier:", err);
      showNotification("Lỗi khi cập nhật nhà cung cấp.", "error");
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await fetch('https://quanlysanxuat-production.up.railway.app/api/Templates/import/material-receipts');
      if (!response.ok) throw new Error('Không thể tải file mẫu từ máy chủ.');
      const blob = await response.blob();
      saveAs(blob, 'MaterialReceiptTemplate.xlsx');
      showNotification("Tải file mẫu thành công!");
    } catch (err) {
      console.error("Download Sample Error:", err);
      showNotification("Lỗi khi tải file mẫu.", "error");
    }
  };

  const columns = [
    {
      header: '',
      className: 'w-[30px] text-center !px-1 sm:!px-6',
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
    {
      header: 'STT',
      className: 'w-[50px] text-center hidden sm:table-cell',
      render: (_, { index }) => index
    },
    {
      header: <div className="flex justify-center items-center w-full text-[10px] sm:text-sm">Mã phiếu</div>
      , accessor: 'materialReceiptCode', className: 'font-medium text-blue-600 !px-1 sm:!px-6 w-[50px] sm:w-[120px]'
    },
    {
      header: <div className="flex justify-center items-center w-full text-[10px] sm:text-sm">Ngày nhận</div>,
      className: 'w-[35px] sm:w-40 !px-1 sm:!px-6', // Hiển thị trên mobile, điều chỉnh chiều rộng
      render: (row) => <span>{row.receivingDate ? new Date(row.receivingDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
    },
    { header: 'Số vận đơn', accessor: 'deliveryNoteNumber', className: 'hidden sm:table-cell' },
    {
      header: isBulkSelectMode ? (
        <div className="flex w-full items-center justify-center gap-2 text-[10px] sm:text-xs">
          <button type="button" onClick={(e) => { e.stopPropagation(); handleSelectAllReceipts(); }} className="font-semibold text-red-600 hover:text-red-700">Tất cả</button>
          <span className="text-gray-300">/</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleClearSelectedReceipts(); }} className="font-semibold text-gray-500 hover:text-gray-700">Bỏ chọn</button>
        </div>
      ) : (
        <div className="flex justify-center items-center w-full text-[10px] sm:text-sm">Hành động</div>
      ),
      className: 'text-right pr-2 sm:pr-4 w-[60px] sm:w-[150px]',
      render: (row) => {
        if (isBulkSelectMode) {
          const rowId = row.id || row.Id;
          return (
            <div className="flex justify-center pr-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggleSelectReceipt(row); }}
                className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-red-50"
              >
                {selectedReceiptIds.includes(rowId) ? (
                  <FaRegSquareMinus size={20} className="text-red-600" />
                ) : (
                  <FaRegSquare size={20} className="text-gray-400" />
                )}
              </button>
            </div>
          );
        }
        const rowStatus = getReceiptStatus(row);

        if (rowStatus === "4") {
          return (
            <div className="flex gap-1.5 justify-end">
              <button
                type="button"
                disabled
                className="bg-gray-200 text-gray-500 font-bold py-1 px-2 rounded text-[11px] sm:text-xs cursor-not-allowed whitespace-nowrap"
              >
                Đã nhận
              </button>
              <button
                onClick={() => handleDeleteRequest(row.id || row.Id)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-[11px] sm:text-xs transition-all active:scale-95"
              >
                Xóa
              </button>
            </div>
          );
        }

        if (isWarehouseEmployee) {
          if (rowStatus === "5") {
            return (
              <div className="flex gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenModal('receive', row);
                    setActiveTab(2);
                  }}
                  className="bg-pink-100 hover:bg-pink-200 text-red-600 border border-pink-200 font-bold py-1 px-2 rounded text-[11px] sm:text-xs transition-all active:scale-95 whitespace-nowrap"
                >
                  Đã sửa thông tin
                </button>
                <button
                  onClick={() => handleDeleteRequest(row.id || row.Id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-[11px] sm:text-xs transition-all active:scale-95"
                >
                  Xóa
                </button>
              </div>
            );
          }

          if (rowStatus === "2") {
            return (
              <div className="flex gap-1.5 justify-end">
                <button
                  type="button"
                  disabled
                  className="bg-pink-200 text-red-500 border border-red-200 font-bold py-1 px-2 rounded text-[11px] sm:text-xs cursor-not-allowed whitespace-nowrap"
                >
                  Sai thông tin
                </button>
                <button
                  onClick={() => handleDeleteRequest(row.id || row.Id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-[11px] sm:text-xs transition-all active:scale-95"
                >
                  Xóa
                </button>
              </div>
            );
          }

          if (rowStatus === "3") {
            return (
              <div className="flex gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenModal('receive', row);
                    setActiveTab(2);
                  }}
                  className="bg-pink-100 hover:bg-pink-200 text-red-600 border border-pink-200 font-bold py-1 px-2 rounded text-[11px] sm:text-xs transition-all active:scale-95 whitespace-nowrap"
                >
                  Thiếu nguyên liệu
                </button>
                <button
                  onClick={() => handleDeleteRequest(row.id || row.Id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-[11px] sm:text-xs transition-all active:scale-95"
                >
                  Xóa
                </button>
              </div>
            );
          }

          return (
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => handleOpenModal('receive', row)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-[11px] sm:text-xs transition-all active:scale-95 whitespace-nowrap"
              >
                Nhận nguyên liệu
              </button>
            </div>
          );
        }

        return (
          <div className="flex gap-1.5 justify-end">
            <button onClick={() => handleOpenModal('edit', row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-[11px] sm:text-xs transition-all active:scale-95">
              {isPurchasingEmployee && getReceiptStatus(row) === "2" ? "Sửa thông tin" : "Sửa"}
            </button>
            <button onClick={() => handleDeleteRequest(row.id || row.Id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-[11px] sm:text-xs transition-all active:scale-95">Xóa</button>
          </div>
        );
      },
    }
  ];

  return (
    <div className="p-2 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Danh sách phiếu nhập nguyên liệu</h2>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 gap-4">
        <div className="relative w-full lg:max-w-[300px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã phiếu..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {!isWarehouseEmployee && (
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full lg:w-auto">
            <button
              onClick={handleOpenImportModal}
              className="w-full sm:w-auto justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded whitespace-nowrap transition-colors flex items-center gap-2 text-xs sm:text-sm order-1 sm:order-2"
            >
              <FileUp size={16} /> Nhập Excel
            </button>
            <button
              onClick={handleRequestExportExcel}
              className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded whitespace-nowrap flex items-center gap-2 shadow-sm transition-all active:scale-95 text-xs sm:text-sm order-2 sm:order-3"
            >
              <FileDown size={16} /> Xuất Excel
            </button>
            {isBulkSelectMode ? (
              <button
                onClick={handleBulkDelete}
                className="w-full sm:w-auto justify-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all active:scale-95 flex items-center gap-2 shadow-sm text-sm order-3 sm:order-1"
              >
                <Trash2 size={16} /> Xóa đã chọn ({selectedReceiptIds.length})
              </button>
            ) : (
              <button
                onClick={() => setIsBulkSelectMode(true)}
                className="w-full sm:w-auto justify-center bg-red-700 hover:bg-red-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all active:scale-95 flex items-center gap-2 shadow-sm text-sm order-3 sm:order-1"
              >
                <Trash2 size={16} /> Xóa nhiều dòng
              </button>
            )}
            <button
              onClick={() => handleOpenModal('add')}
              className="flex gap-2 items-center w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm order-4 sm:order-4"
            >
              <MdAdd />
              <span className="lg:hidden">Thêm mới</span>
              <span className="hidden lg:inline">Thêm phiếu mới</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="p-4 text-gray-500">Đang tải dữ liệu phiếu nhập...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CustomDatatable
            columns={columns}
            data={filteredData}
            bodyCellClassName="!py-2 sm:!py-3"
            renderExpansion={(row) => (
              <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-y-6 gap-x-8 text-sm">
                  <div className="flex flex-col gap-5 lg:col-span-2">
                    {/* Hiển thị trên Mobile: Các trường bị ẩn ở bảng chính */}
                    <div className="grid grid-cols-2 gap-4 sm:hidden"> {/* Chỉ hiển thị trên mobile */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Số vận đơn</span>
                        <span className="text-gray-700 font-medium">{row.deliveryNoteNumber || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Người nhận hàng</span>
                        <div className="relative w-full"> {/* Rút gọn chiều rộng */}
                          <SearchableSelect value={row.receiver} options={users} onChange={(val) => handleReceiverChange(row, val)} placeholder="Chọn người nhận..." disabled={isWarehouseEmployee || getReceiptStatus(row) === "4"} className="w-full flex items-center border border-gray-300 rounded-md px-2 bg-white text-xs min-h-[34px]" />
                        </div>
                      </div>

                    </div>

                    <div className="flex flex-col gap-1 lg:hidden">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Kho lưu trữ</span>
                      <div className="relative w-full">
                        {!(isWarehouseEmployee || getReceiptStatus(row) === "4") && <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenWarehousesModal(); }} className="absolute right-1 top-[-10px] text-blue-600 text-[9px] font-bold underline z-20 leading-none bg-white/80 px-1 rounded">hiệu chỉnh</button>}
                        <SearchableSelect value={row.warehouse} options={warehouses} onChange={(val) => handleWarehouseChange(row, val)} disabled={isWarehouseEmployee || getReceiptStatus(row) === "4"} className="w-full flex items-center border border-gray-300 rounded-md px-2 bg-white text-xs min-h-[34px]" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nhà cung cấp</span>
                      <div className="relative w-full max-w-[400px]">
                        {!(isWarehouseEmployee || getReceiptStatus(row) === "4") && <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenSuppliersModal(); }} className="absolute right-1 top-[-10px] text-blue-600 text-[9px] font-bold underline z-20 leading-none bg-white/80 px-1 rounded">hiệu chỉnh</button>}
                        <SearchableSelect value={row.supplier} options={suppliers} onChange={(val) => handleSupplierChange(row, val)} placeholder="Chọn nhà cung cấp..." disabled={isWarehouseEmployee || getReceiptStatus(row) === "4"} className="w-full flex items-center border border-gray-300 rounded-md px-2 bg-white text-xs min-h-[34px]" usePortal />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 lg:col-span-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thông tin nguyên liệu</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(row.materialReceiptBatchList || []).slice(0, 3).map((batch, idx) => {
                        const materialName = allMaterials.find(m => String(m.value) === String(batch.materialId))?.label || `NL #${batch.materialId}`;
                        return (
                          <span key={idx} className="text-[11px] bg-gray-100 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md text-xs font-medium shadow-sm">
                            {batch.deliveredQuantity || batch.shippedQuantity} x {materialName}
                          </span>
                        );
                      })}
                      <button onClick={(e) => { e.stopPropagation(); handleOpenMaterialInfoModal(row); }} className="text-blue-600 hover:text-blue-800 text-xs font-bold underline transition-colors">
                        {row.materialReceiptBatchList?.length > 3 ? `+ ${row.materialReceiptBatchList.length - 3} khác (xem tất cả)` : (row.materialReceiptBatchList?.length > 0 ? '(xem chi tiết)' : '')}
                      </button>
                      {(!row.materialReceiptBatchList || row.materialReceiptBatchList.length === 0) && <span className="text-gray-400 italic">Chưa có nguyên liệu</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 lg:col-span-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ban kiểm nghiệm sản phẩm</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {row.inspectationCommitteeList?.length > 0 ? (
                        row.inspectationCommitteeList.map((inspector, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-white border border-gray-100 px-2 py-1 rounded-md shadow-sm">
                            <div className={`w-1.2 h-1.2 rounded-full ${inspector.isLeader === 1 ? 'bg-orange-500' : 'bg-blue-500'}`} />
                            <span className="text-[10px] font-bold text-gray-700">{inspector.Name || inspector.name}</span>
                            <span className="text-[10px] text-gray-400 italic">
                              ({inspector.isLeader === 1 ? 'Trưởng ban' : 'Ủy viên'})
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-xs">Chưa gán ban kiểm nghiệm</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={<span className="text-lg sm:text-xl">{modalMode === 'add' ? 'Tạo phiếu nhập mới' : modalMode === 'edit' ? 'Cập nhật phiếu nhập' : modalMode === 'receive' ? 'Nhận nguyên liệu' : 'Chi tiết phiếu nhập'}</span>}
        maxWidth={isModalMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 mb-6 bg-gray-50 rounded-t-lg overflow-x-auto custom-scrollbar no-scrollbar">
          {[
            { id: 1, label: 'Đối chiếu' },
            { id: 2, label: 'Nguyên liệu' },
            { id: 3, label: 'Chất lượng' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 text-sm font-bold transition-all flex-1 sm:flex-none whitespace-nowrap ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-blue-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className={`min-h-[400px] overflow-y-auto max-h-[calc(100vh-320px)] sm:max-h-none sm:overflow-visible ${isModalMaximized ? 'lg:max-h-[70vh] lg:overflow-y-auto' : ''}`}>

            {/* Tab 1: Thông tin đối chiếu */}
            {activeTab === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
                {/* Mã phiếu nhập */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Mã phiếu nhập</label>
                  <input
                    type="text"
                    name="materialReceiptCode"
                    value={currentReceipt?.materialReceiptCode || ''}
                    disabled
                    className="w-full border border-gray-300 rounded-md p-1.5 h-[38px] text-sm outline-none bg-gray-100 text-gray-500 cursor-not-allowed"
                    placeholder="Hệ thống tự tạo"
                  />
                </div>
                <div className="hidden md:block"></div> {/* Dòng 1 chiếm nửa dòng */}

                {/* Nhà cung cấp */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Nhà cung cấp</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenSuppliersModal(); }}
                      className="absolute right-1 top-[-18px] text-blue-600 hover:text-blue-800 text-[10px] font-bold underline z-20 leading-none bg-white px-1 rounded"
                    >
                      hiệu chỉnh
                    </button>
                    <SearchableSelect value={currentReceipt?.supplier || ''} options={suppliers} onChange={(val) => handleInputChange(val, 'supplier')} placeholder="Chọn nhà cung cấp..." error={!!receiptErrors.supplier} errorMessage={receiptErrors.supplier} disabled={isReceiveMode} />
                  </div>
                </div>

                {/* Số vận đơn */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Số vận đơn</label>
                  <input type="text" name="deliveryNoteNumber" value={currentReceipt?.deliveryNoteNumber || ''} onChange={handleInputChange} disabled={isReceiveMode} className={`w-full border ${receiptErrors.deliveryNoteNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md p-1.5 h-[38px] text-sm focus:ring-2 outline-none ${isReceiveMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} placeholder="Nhập số vận đơn" />
                  {receiptErrors.deliveryNoteNumber && <p className="text-red-500 text-[10px] mt-1 font-medium">{receiptErrors.deliveryNoteNumber}</p>}
                </div>

                {/* Ngày nhận hàng */}
                <DateInput
                  label="Ngày nhận hàng"
                  name="receivingDate"
                  value={currentReceipt?.receivingDate || ''}
                  onChange={handleInputChange}
                  placement={window.innerWidth < 768 ? "top" : "bottom"}
                  error={!!receiptErrors.receivingDate}
                  errorMessage={receiptErrors.receivingDate}
                  compactCalendar
                  className={`w-full pr-10 border ${receiptErrors.receivingDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md focus:outline-none focus:ring-2 transition-all text-left flex items-center p-1.5 min-h-[38px] text-sm ${isReceiveMode ? 'bg-gray-100 text-gray-500 pointer-events-none cursor-not-allowed' : 'bg-white cursor-pointer'}`}
                />

                <div className="hidden md:block"></div> {/* Dòng 3 chiếm nửa dòng */}
              </div>
            )}

            {/* Tab 2: Thông tin nguyên liệu */}
            {activeTab === 2 && ( /* This is the div for Tab 2 content */
              <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Nguyên liệu nhập</label>
                  <MultiSearchableSelect
                    selectedValues={currentReceipt?.items?.map(i => i.materialId) || []}
                    options={allMaterials}
                    onChange={(newIds) => {
                      const currentItems = currentReceipt?.items || [];
                      const updatedItems = newIds.map(id => {
                        const existing = currentItems.find(i => i.materialId === id);
                        return existing || { materialId: id, shippedQuantity: 0, deliveredQuantity: 0, mfgDate: '', expiredDate: '', batchCode: '' };
                      });
                      setCurrentReceipt(prev => ({ ...prev, items: updatedItems }));
                      if (receiptErrors.items) setReceiptErrors(prev => ({ ...prev, items: null }));
                    }}
                    error={!!receiptErrors.items}
                    errorMessage={receiptErrors.items}
                    disabled={isReceiveMode}
                  />
                </div>

                {/* CustomDatatable đã thay thế bảng thủ công */}
                <div className="overflow-x-auto overflow-y-auto max-h-[350px] sm:max-h-none sm:overflow-visible custom-scrollbar border border-gray-100 sm:border-none rounded-lg">
                  <CustomDatatable columns={receiptItemColumns} data={currentReceipt?.items || []} paginationClassName="!py-1 !px-4" headerCellClassName="!py-1" bodyCellClassName="!py-2" />
                </div>
              </div>
            )}

            {/* Tab 3: Thông tin kiểm soát chất lượng */}
            {activeTab === 3 && ( /* This is the div for Tab 3 content */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
                {/* Hàng 1: Người nhận hàng chiếm 1/2 màn hình, nằm riêng một hàng */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Người nhận hàng</label>
                  <SearchableSelect value={currentReceipt?.receiver || ''} options={users} onChange={(val) => handleInputChange(val, 'receiver')} placeholder="Chọn nhân viên..." error={!!receiptErrors.receiver} errorMessage={receiptErrors.receiver} disabled={isReceiveMode} />
                </div>
                <div className="hidden md:block"></div>

                {/* Thành phần mới: Ban kiểm nghiệm sản phẩm */}
                <div className="md:col-span-2 flex flex-col gap-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Ban kiểm nghiệm sản phẩm
                    </label>
                    <p className="text-[10px] text-gray-500 italic mt-0.5">* Quy định: 1 Trưởng ban và tối đa 2 Ủy ban kiểm nghiệm</p>
                  </div>
                  {isReceiveMode ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1.5 p-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                      {currentReceipt?.inspectationCommitteeList?.length > 0 ? (
                        currentReceipt.inspectationCommitteeList.map((inspector, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-blue-300">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inspector.isLeader === 1 ? 'bg-orange-500 ring-4 ring-orange-50' : 'bg-blue-500 ring-4 ring-blue-50'}`} />
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-bold text-gray-800 truncate">{inspector.Name || inspector.name}</span>
                              <span className="text-[10px] text-gray-400 font-medium italic whitespace-nowrap">
                                ({inspector.isLeader === 1 ? 'Trưởng ban' : 'Ủy viên'})
                              </span>
                            </div>
                          </div>
                        ))
                      ) : <span className="text-sm italic text-gray-400">Chưa có thông tin ban kiểm nghiệm</span>}
                    </div>
                  ) : (
                    <MultiSearchableSelect
                      placeholder="Chọn thành viên ban kiểm nghiệm (1 Trưởng ban, tối đa 2 Ủy ban)..."
                      selectedValues={currentReceipt?.inspectationCommitteeList || []}
                      options={inspectorOptions}
                      onChange={handleInspectorChange}
                      error={!!receiptErrors.inspectorPanel}
                      errorMessage={receiptErrors.inspectorPanel}
                      isCommitteeMode={true}
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    Chứng nhận xuất xứ (CO) <span className="text-[10px] text-gray-400 font-normal">(PDF)</span>
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1 group">
                      <input type="file" onChange={(e) => handleFileUpload(e, 'certificateOfOrigin')} disabled={isReceiveMode} className={`absolute inset-0 w-full h-full opacity-0 z-10 ${isReceiveMode ? 'cursor-not-allowed' : 'cursor-pointer'}`} accept=".pdf" />
                      <div className={`w-full border-2 border-dashed border-gray-300 rounded-l-lg p-2 flex items-center justify-center gap-2 bg-gray-50 group-hover:border-blue-400 transition-all ${currentReceipt?.certificateOfOrigin && typeof currentReceipt.certificateOfOrigin === 'string'
                        ? 'border-r-0'
                        : ''
                        }`}>
                        {(currentReceipt?.certificateOfOrigin instanceof File || (currentReceipt?.certificateOfOrigin && typeof currentReceipt.certificateOfOrigin === 'string')) ? (
                          <FileText size={16} className="text-blue-500" />
                        ) : (
                          <Upload size={18} className="text-gray-400 group-hover:text-blue-500" />
                        )}
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {currentReceipt?.certificateOfOrigin instanceof File
                            ? currentReceipt.certificateOfOrigin.name
                            : (currentReceipt?.certificateOfOrigin && typeof currentReceipt.certificateOfOrigin === 'string'
                              ? currentReceipt.certificateOfOrigin.split('/').pop()
                              : 'Nhấn để tải lên')}
                        </span>
                      </div>
                    </div>
                    {currentReceipt?.certificateOfOrigin && typeof currentReceipt.certificateOfOrigin === 'string' && (
                      <button
                        type="button"
                        onClick={() => handleRequestDownload(currentReceipt.materialReceiptCode, 'CertificateOfOrigin', setConfirmModal)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-r-lg hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm h-full flex items-center"
                        title="Tải file hiện tại"
                      >
                        <FileDown size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    Chứng nhận chất lượng (CQ) <span className="text-[10px] text-gray-400 font-normal">(PDF/IMG)</span>
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1 group"> {/* This is the div (lines 747-763) */}
                      <input type="file" onChange={(e) => handleFileUpload(e, 'certificateOfQuality')} disabled={isReceiveMode} className={`absolute inset-0 w-full h-full opacity-0 z-10 ${isReceiveMode ? 'cursor-not-allowed' : 'cursor-pointer'}`} accept=".pdf,image/*" />
                      <div className={`w-full border-2 border-dashed border-gray-300 rounded-l-lg p-2 flex items-center justify-center gap-2 bg-gray-50 group-hover:border-blue-400 transition-all ${currentReceipt?.certificateOfQuality && typeof currentReceipt.certificateOfQuality === 'string'
                        ? 'border-r-0'
                        : ''
                        }`}>
                        {(currentReceipt?.certificateOfQuality instanceof File || (currentReceipt?.certificateOfQuality && typeof currentReceipt.certificateOfQuality === 'string')) ? (
                          <FileText size={16} className="text-blue-500" />
                        ) : (
                          <Upload size={18} className="text-gray-400 group-hover:text-blue-500" />
                        )}
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {currentReceipt?.certificateOfQuality instanceof File
                            ? currentReceipt.certificateOfQuality.name
                            : (currentReceipt?.certificateOfQuality && typeof currentReceipt.certificateOfQuality === 'string'
                              ? currentReceipt.certificateOfQuality.split('/').pop()
                              : 'Nhấn để tải lên')}
                        </span>
                      </div>
                    </div>
                    {currentReceipt?.certificateOfQuality && typeof currentReceipt.certificateOfQuality === 'string' && (
                      <button
                        type="button"
                        onClick={() => handleRequestDownload(currentReceipt.materialReceiptCode, 'CertificateOfQuality', setConfirmModal)}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-r-lg hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm h-full flex items-center"
                        title="Tải file hiện tại"
                      >
                        <FileDown size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Biên bản giám định</label>
                  <div className="flex items-center"> {/* This is the div (lines 778-794) */}
                    <div className="relative flex-1 group">
                      <input type="file" onChange={(e) => handleFileUpload(e, 'inspectationReport')} disabled={isReceiveMode} className={`absolute inset-0 w-full h-full opacity-0 z-10 ${isReceiveMode ? 'cursor-not-allowed' : 'cursor-pointer'}`} accept=".pdf,image/*" />
                      <div className={`w-full border-2 border-dashed border-gray-300 rounded-l-lg p-2.5 flex items-center justify-center gap-2 bg-gray-50 group-hover:border-blue-400 transition-all ${currentReceipt?.inspectationReport && typeof currentReceipt.inspectationReport === 'string'
                        ? 'border-r-0'
                        : ''
                        }`}>
                        {(currentReceipt?.inspectationReport instanceof File || (currentReceipt?.inspectationReport && typeof currentReceipt.inspectationReport === 'string')) ? (
                          <FileText size={16} className="text-blue-500" />
                        ) : (
                          <Upload size={18} className="text-gray-400 group-hover:text-blue-500" />
                        )}
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {currentReceipt?.inspectationReport instanceof File
                            ? currentReceipt.inspectationReport.name
                            : (currentReceipt?.inspectationReport && typeof currentReceipt.inspectationReport === 'string'
                              ? currentReceipt.inspectationReport.split('/').pop()
                              : 'Nhấn để tải lên')}
                        </span>
                      </div>
                    </div>
                    {currentReceipt?.inspectationReport && typeof currentReceipt.inspectationReport === 'string' && (
                      <button
                        type="button"
                        onClick={() => handleRequestDownload(currentReceipt.materialReceiptCode, 'InspectationReport', setConfirmModal)}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-r-lg hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm h-full flex items-center"
                        title="Tải file hiện tại"
                      >
                        <FileDown size={18} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="hidden md:block"></div>

                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Điều kiện bảo quản đặc biệt</label>
                  <textarea name="specialStorageCondition" value={currentReceipt?.specialStorageCondition || ''} onChange={handleInputChange} disabled={isReceiveMode} className={`w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[30px] sm:min-h-[30px] ${isReceiveMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} ></textarea>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t sm:justify-end sm:items-center">
            {activeTab === 3 && !isReceiveMode && (
              <button
                type="button"
                disabled={!canExportInspectionReport}
                onClick={handleExportInspectionReport}
                className={`w-full sm:w-auto order-1 sm:order-2 px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md text-sm ${canExportInspectionReport
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-100'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                title={!canExportInspectionReport ? "Yêu cầu chọn ít nhất 1 Trưởng ban và 1 Ủy ban kiểm nghiệm" : ""}
              >
                <FileText size={18} /> Biên bản giám định
              </button>
            )}
            <div className={`flex gap-3 w-full sm:w-auto order-2 sm:order-1 ${currentReceiptStatus === "3" ? "justify-center" : ""}`}>
              {isReceiveMode && (
                <>
                  {currentReceiptStatus !== '3' && (
                    <button
                      type="button"
                      onClick={handleReceiveWrongInfo}
                      className="flex-1 sm:flex-none text-black-600 border border-gray-200 px-6 py-2.5 rounded-lg font-bold transition-colors text-sm"
                    >
                      Sai thông tin
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleReceiveConfirm}
                    className="hidden sm:flex sm:items-center sm:justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm sm:flex-none"
                  >
                    Nhận nguyên liệu
                  </button>
                  <button
                    type="button"
                    onClick={handleReceiveConfirm}
                    className="flex items-center justify-center sm:hidden bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm flex-1"
                  >
                    Nhận
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleCloseModal}
                className={`flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors text-sm ${isReceiveMode ? 'hidden' : ''}`}
              >
                {modalMode === 'view' ? 'Đóng' : 'Hủy bỏ'}
              </button>
              {modalMode !== 'view' && !isReceiveMode && (
                <button type="submit" className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm">
                  Lưu dữ liệu
                </button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal quản lý Nhà cung cấp */}
      <Modal
        isOpen={isSuppliersModalOpen}
        onClose={() => { setIsSuppliersModalOpen(false); setIsSuppliersMgmtMaximized(false); }}
        title="Danh sách nhà cung cấp"
        maxWidth={isSuppliersMgmtMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isSuppliersMgmtMaximized}
        onMaximizeToggle={() => setIsSuppliersMgmtMaximized(!isSuppliersMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px] flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên nhà cung cấp..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={supplierSearchTerm}
                onChange={(e) => setSupplierSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => { setEditingSupplier({ name: '', contactPerson: '', phone: '', email: '', address: '', taxId: '' }); setSupplierModalMode('add'); setIsSupplierEditModalOpen(true); }} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              Thêm nhà cung cấp
            </button>
          </div>
          <div className={`${isSuppliersMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}>
            <CustomDatatable columns={supplierTableColumns} data={suppliers.filter(s => s.label.toLowerCase().includes(supplierSearchTerm.toLowerCase()))} />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Nhà cung cấp */}
      <Modal
        isOpen={isSupplierEditModalOpen}
        onClose={() => setIsSupplierEditModalOpen(false)}
        title={supplierModalMode === 'add' ? "Thêm nhà cung cấp mới" : "Cập nhật nhà cung cấp"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSupplierSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Tên nhà cung cấp <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={editingSupplier.name} onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })} required autoFocus={window.innerWidth >= 768} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Người liên hệ</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={editingSupplier.contactPerson || ''} onChange={(e) => setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Số điện thoại</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={editingSupplier.phone || ''} onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Email</label>
              <input type="email" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={editingSupplier.email || ''} onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Địa chỉ</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={editingSupplier.address || ''} onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsSupplierEditModalOpen(false)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">Hủy bỏ</button>
            <button type="submit" className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 text-sm">Lưu thông tin</button>
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
              Thêm nhà kho
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
        title={warehouseModalMode === 'add' ? "Thêm nhà kho mới" : "Cập nhật nhà kho"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleWarehouseSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Mã kho <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={editingWarehouse.code} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, code: e.target.value })} required autoFocus={window.innerWidth >= 768} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Tên kho <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={editingWarehouse.name} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, name: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Loại kho</label>
              <SearchableSelect value={editingWarehouse.type || ''} options={warehouseTypes} onChange={(val) => setEditingWarehouse({ ...editingWarehouse, type: val })} placeholder="Chọn loại kho..." />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Trạng thái</label>
              <SearchableSelect value={editingWarehouse.status || ''} options={warehouseStatuses} onChange={(val) => setEditingWarehouse({ ...editingWarehouse, status: val })} placeholder="Chọn trạng thái..." />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Vị trí</label>
            <SearchableSelect value={editingWarehouse.location || ''} options={warehouseLocations} onChange={(val) => setEditingWarehouse({ ...editingWarehouse, location: val })} placeholder="Chọn vị trí..." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsWarehouseEditModalOpen(false)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">Hủy bỏ</button>
            <button type="submit" className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 text-sm">Lưu thông tin</button>
          </div>
        </form>
      </Modal>

      {/* Modal Thông tin nguyên liệu (Xem tất cả) */}
      <Modal
        isOpen={isMaterialInfoModalOpen}
        onClose={() => setIsMaterialInfoModalOpen(false)}
        title="Thông tin nguyên liệu"
        maxWidth={isModalMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-5 !overflow-visible">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Nguyên liệu nhập</label>
              <MultiSearchableSelect
                selectedValues={currentReceipt?.items?.map(i => i.materialId) || []}
                options={allMaterials}
                onChange={(newIds) => {
                  const currentItems = currentReceipt?.items || [];
                  const updatedItems = newIds.map(id => {
                    const existing = currentItems.find(i => i.materialId === id);
                    return existing || { materialId: id, shippedQuantity: 0, deliveredQuantity: 0, mfgDate: '', expiredDate: '', batchCode: '' };
                  });
                  setCurrentReceipt(prev => ({ ...prev, items: updatedItems }));
                }}
                disabled={isMaterialInfoReadOnlyMode}
              />
            </div>

            {/* Bảng danh sách nguyên liệu y hệt Tab 2 */}
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] sm:max-h-none sm:overflow-visible custom-scrollbar border border-gray-100 sm:border-none rounded-lg">
              <CustomDatatable
                columns={receiptItemColumns}
                data={currentReceipt?.items || []}
                paginationClassName="!py-1 !px-4"
                headerCellClassName="!py-1"
                bodyCellClassName="!py-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsMaterialInfoModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors text-sm">
              Đóng
            </button>
            {currentReceiptStatus !== '4' && (
              <button type="submit" disabled={isWarehouseMaterialInfoMode && currentReceiptStatus !== '1'} className={`px-10 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95 text-sm ${isWarehouseMaterialInfoMode && currentReceiptStatus !== '1' ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'}`}>
                Lưu thông tin
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* Modal Nhập Excel */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => { setIsImportModalOpen(false); setSelectedImportFile(null); }}
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
                onClick={handleDownloadSample}
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

      {/* Modal chọn ngày dành riêng cho Mobile Picker */}
      <Modal
        isOpen={mobileDateModal.isOpen}
        onClose={() => setMobileDateModal(prev => ({ ...prev, isOpen: false }))}
        title={`Chọn ${mobileDateModal.label}`}
        maxWidth="max-w-xs"
      >
        <div className="p-4">
          <InlineCalendar
            value={mobileDateModal.value}
            onChange={(newVal) => {
              handleItemFieldChange(mobileDateModal.materialId, mobileDateModal.field, newVal);
              setMobileDateModal(prev => ({ ...prev, value: newVal, isOpen: false }));
            }}
          />
        </div>
      </Modal>

      <CustomConfirm
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' })}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type={(confirmModal.type === 'export' || confirmModal.type === 'download') ? 'export' : 'danger'}
      />
      <AppNotification isOpen={notification.isOpen} message={notification.message} type={notification.type} onClose={() => setNotification({ ...notification, isOpen: false })} />
    </div >
  );
};
