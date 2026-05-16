import { useEffect, useState, useMemo, useRef } from 'react';
import { Search, Plus, ChevronDown, FileText, Eye, Edit2, Trash2, FileDown, X, Upload, Maximize, Minimize, ChevronRight, FileUp, Calendar } from 'lucide-react';
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
  exportInspectionReport
} from '../controller/materialReceiptsController';
import { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse } from '../controller/warehousesController';
import { getWarehouseLocations, getWarehouseLocation, createWarehouseLocation, updateWarehouseLocation, deleteWarehouseLocation } from '../controller/warehouseLocationsController';
import { getWarehouseRacks, getWarehouseRack, createWarehouseRack, updateWarehouseRack, deleteWarehouseRack } from '../controller/warehouseRacksController';
import { getUsers } from '../controller/usersController';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../controller/suppliersController';
import { getMaterials } from '../controller/materialsController';
import { getMaterialCategories } from '../controller/materialCategoriesController';
import { getWarehouseTypes, getWarehouseType, createWarehouseType, updateWarehouseType, deleteWarehouseType } from '../controller/warehouseTypesController';
import { getWarehouseStatuses, getWarehouseStatus, createWarehouseStatus, updateWarehouseStatus, deleteWarehouseStatus } from '../controller/warehouseStatusesController';
import { getWarehouseBins, getWarehouseBin, createWarehouseBin, updateWarehouseBin, deleteWarehouseBin } from '../controller/warehouseBinsController';
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
const SearchableSelect = ({ value, options, onChange, placeholder = "Tìm...", className, disabled = false, placement = "bottom" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const filteredOptions = options.filter(opt =>
    String(opt.label || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={selectRef}>
      <div
        onClick={(e) => {
          if (disabled) return;
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={className || "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md p-1.5 pr-7 cursor-pointer font-medium flex justify-between items-center min-h-[38px] hover:border-blue-400 transition-all shadow-sm"}
      >
        <span className="truncate pl-2">{selectedOption ? selectedOption.label : '-- Chọn --'}</span>
        <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-gray-600">
          <ChevronDown size={14} />
        </div>
      </div>

      {isOpen && (
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
    </div>
  );
};

// Component Multi Searchable Select
const MultiSearchableSelect = ({ selectedValues = [], options, onChange, placeholder = "Chọn nguyên liệu..." }) => {
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

  const filteredOptions = options.filter(opt =>
    String(opt.label || '').toLowerCase().includes(search.toLowerCase()) && !selectedValues.includes(opt.value)
  );

  return (
    <div className="relative w-full" ref={selectRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg p-2 cursor-pointer flex flex-wrap gap-1 min-h-[38px] hover:border-blue-400 transition-all shadow-sm"
      >
        {selectedValues.length > 0 ? (
          options.filter(o => selectedValues.includes(o.value)).map(o => (
            <span key={o.value} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
              {o.label}
              <X size={12} className="hover:text-red-500" onClick={(e) => { e.stopPropagation(); onChange(selectedValues.filter(v => v !== o.value)); }} />
            </span>
          ))
        ) : <span className="text-gray-400 pl-1">{placeholder}</span>}
      </div>

      {isOpen && (
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
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div
                key={opt.value}
                onClick={() => { onChange([...selectedValues, opt.value]); setSearch(''); }}
                className="p-2.5 text-xs hover:bg-blue-50 cursor-pointer text-gray-700 border-b last:border-0"
              >
                {opt.label}
              </div>
            )) : <div className="p-3 text-xs text-gray-400 italic text-center">Không còn kết quả</div>}
          </div>
        </div>
      )}
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
  const [isModalMaximized, setIsModalMaximized] = useState(false);

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
      value: u.id || u.Id,
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

    const selectedUsers = usersRawData.filter(u => newIds.includes(u.id || u.Id));
    const tbknCount = selectedUsers.filter(u => String(u.role || u.Role) === String(tbknRoleId)).length;
    const ubknCount = selectedUsers.filter(u => String(u.role || u.Role) === String(ubknRoleId)).length;

    if (tbknCount > 1) return showNotification("Chỉ được chọn tối đa 1 Trưởng ban kiểm nghiệm", "error");
    if (ubknCount > 2) return showNotification("Chỉ được chọn tối đa 2 Ủy ban kiểm nghiệm", "error");

    setCurrentReceipt(prev => ({ ...prev, inspectorPanel: newIds }));
  };

  const handleOpenModal = (mode, receipt = null) => {
    setModalMode(mode);
    setActiveTab(1);
    if (mode === 'add') {
      setCurrentReceipt({
        materialReceiptCode: '',
        supplier: '',
        deliveryNoteNumber: '',
        receivingDate: new Date().toISOString().split('T')[0],
        qualityStatus: 1,
        warehouse: '',
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
          mfgDate: item.mfgDate ? item.mfgDate.split('T')[0] : '',
          expiredDate: item.expiredDate ? item.expiredDate.split('T')[0] : ''
        }));
      }

      formatted.inspectorPanel = receipt.inspectorPanel ? (Array.isArray(receipt.inspectorPanel) ? receipt.inspectorPanel : receipt.inspectorPanel.split(',').map(Number)) : [];

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

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách phiếu nhập');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Mã phiếu', key: 'materialReceiptCode', width: 20 },
        { header: 'Số vận đơn', key: 'deliveryNoteNumber', width: 20 },
        { header: 'Ngày nhận', key: 'receivingDate', width: 15 },
        { header: 'Kho', key: 'warehouse', width: 25 },
        { header: 'Chất lượng', key: 'qualityStatus', width: 20 },
        { header: 'Người nhận', key: 'receiver', width: 20 },
      ];

      filteredData.forEach((receipt, index) => {
        const warehouseLabel = warehouses.find(w => w.value === receipt.warehouse)?.label || 'N/A';
        const qualityLabel = qualityOptions.find(q => q.value === receipt.qualityStatus)?.label || 'N/A';
        const receiverLabel = users.find(u => u.value === receipt.receiver)?.label || 'N/A';

        worksheet.addRow({
          stt: index + 1,
          materialReceiptCode: receipt.materialReceiptCode,
          deliveryNoteNumber: receipt.deliveryNoteNumber,
          receivingDate: receipt.receivingDate ? new Date(receipt.receivingDate).toLocaleDateString('vi-VN') : 'N/A',
          warehouse: warehouseLabel,
          qualityStatus: qualityLabel,
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
        } else {
          row.height = 25;
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
    setIsModalMaximized(false);
  };

  const handleInputChange = (eOrVal, nameFromSelect = null) => {
    // Xử lý cả input event và giá trị từ SearchableSelect
    const name = nameFromSelect || eOrVal.target.name;
    const value = nameFromSelect ? eOrVal : eOrVal.target.value;
    setCurrentReceipt(prev => ({ ...prev, [name]: value }));
  };

  const handleItemFieldChange = (materialId, field, value) => {
    setCurrentReceipt(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.materialId === materialId ? { ...item, [field]: value } : item
      )
    }));
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
    try {
      // Xây dựng payload sạch sẽ theo cấu trúc DTO ở Back-end
      const payload = {
        id: currentReceipt.id,
        materialReceiptCode: currentReceipt.materialReceiptCode,
        supplier: currentReceipt.supplier,
        deliveryNoteNumber: currentReceipt.deliveryNoteNumber,
        receivingDate: currentReceipt.receivingDate,
        qualityStatus: currentReceipt.qualityStatus,
        warehouse: currentReceipt.warehouse,
        specialStorageCondition: currentReceipt.specialStorageCondition || "", // Giữ nguyên nội dung textarea bao gồm cả xuống dòng
        receiver: currentReceipt.receiver,
        InspectorPanel: currentReceipt.inspectorPanel || [], // Đổi thành PascalCase để khớp với DTO ở Back-end
        materialReceiptBatchList: (currentReceipt.items || []).map(item => ({
          MaterialId: item.materialId,
          ShippedQuantity: parseFloat(item.shippedQuantity) || 0,
          DeliveredQuantity: parseFloat(item.shippedQuantity) || 0, // Mặc định số lượng thực nhận bằng số lượng vận đơn
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

  const handleRequestDownload = (url) => {
    setConfirmModal({
      isOpen: true,
      id: url,
      type: 'download',
      title: 'Xác nhận tải file',
      message: 'Bạn có chắc chắn muốn tải tập tin này về máy không?'
    });
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
        // Log the error for debugging purposes
        console.error("Error deleting material receipt:", err);
        showNotification("Lỗi khi xóa phiếu", "error");
      }
    } else if (confirmModal.type === 'download') {
      try {
        const response = await fetch(confirmModal.id);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();

        // Trích xuất tên file từ URL
        const urlParts = confirmModal.id.split('/');
        const filename = urlParts[urlParts.length - 1];

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename); // Đặt tên file cho thuộc tính download
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href); // Giải phóng URL đối tượng
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
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            min="0"
            onFocus={(e) => {
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
                onClick={() => setMobileDateModal({ isOpen: true, value: item.mfgDate || '', label: 'Ngày sản xuất', field: 'mfgDate', materialId: item.materialId })}
                placeholder="Chọn..."
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-[11px] bg-white h-[30px] pr-8 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500 font-medium"
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
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-left focus:ring-1 focus:ring-blue-500 outline-none relative z-10"
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
                onClick={() => setMobileDateModal({ isOpen: true, value: item.expiredDate || '', label: 'Ngày hết hạn', field: 'expiredDate', materialId: item.materialId })}
                placeholder="Chọn..."
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-[11px] bg-white h-[30px] pr-8 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500 font-medium"
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
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs text-left focus:ring-1 focus:ring-blue-500 outline-none relative z-10"
            placement={isNearBottom ? "top" : "bottom"}
          />
        );
      },
      className: 'min-w-[150px]', // Ép chiều rộng tối thiểu 220px để hiển thị ngày và icon lịch
    },
    {
      header: 'Xóa',
      className: 'w-16 text-center !px-2',
      headerCellClassName: 'text-center',
      render: (item) => (
        <button type="button" onClick={() => setCurrentReceipt(prev => ({ ...prev, items: prev.items.filter(i => i.materialId !== item.materialId) }))} className="text-red-500 hover:text-red-700 active:scale-95"><Trash2 size={16} /></button>
      )
    }
  ], [allMaterials, currentReceipt, handleItemFieldChange]); // Thêm currentReceipt vào dependencies

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
    { header: 'STT', className: 'w-[25px] text-center !px-1', render: (_, { index }) => index },
    {
      header: <div className="flex justify-center items-center w-full text-[10px] sm:text-sm">Mã phiếu</div>
      , accessor: 'materialReceiptCode', className: 'font-medium text-blue-600 !px-2 w-[40px]'
    },
    {
      header: <div className="flex justify-center items-center w-full text-[10px] sm:text-sm">Ngày nhận</div>,
      className: 'w-[35px] sm:w-40 !px-2', // Hiển thị trên mobile, điều chỉnh chiều rộng
      render: (row) => <span>{row.receivingDate ? new Date(row.receivingDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
    },
    { header: 'Số vận đơn', accessor: 'deliveryNoteNumber', className: 'hidden sm:table-cell' },
    {
      header: 'Kho lưu trữ',
      className: 'hidden lg:table-cell w-64',
      render: (row) => (
        <div className="relative w-full">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleOpenWarehousesModal(); }}
            className="absolute right-1 top-[-10px] text-blue-600 hover:text-blue-800 text-[10px] font-bold underline z-20 leading-none bg-white px-1 rounded border border-blue-50 transition-colors"
          >
            hiệu chỉnh
          </button>
          <SearchableSelect
            value={row.warehouse}
            options={warehouses} // Use the 'warehouses' state which now contains all mapped options
            onChange={(val) => handleWarehouseChange(row, val)}
            className="w-full flex items-center border border-gray-300 rounded-md px-2 !bg-white !text-xs !min-h-[30px]"
          />
        </div>
      )
    },
    {
      header: <div className="flex justify-center items-center w-full text-[10px] sm:text-sm" > Hành động</div>,
      className: 'text-right pr-2 sm:pr-4 w-[60px] sm:w-[150px]',
      render: (row) => (
        <div className="flex gap-1.5 justify-end">
          <button onClick={() => handleOpenModal('edit', row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-[11px] sm:text-xs transition-all active:scale-95">Sửa</button>
          <button onClick={() => handleDeleteRequest(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-[11px] sm:text-xs transition-all active:scale-95">Xóa</button>
        </div>
      ),
    }
  ];

  return (
    <div className="p-2 sm:p-6 bg-gray-50/50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Quản lý Phiếu nhập nguyên liệu</h2>
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
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-row gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded whitespace-nowrap transition-colors flex items-center gap-2 text-xs sm:text-sm">
              <FileUp size={16} /> Nhập Excel
            </button>
            <button
              onClick={handleRequestExportExcel}
              className="flex-1 sm:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded whitespace-nowrap flex items-center gap-2 shadow-sm transition-all active:scale-95 text-xs sm:text-sm"
            >
              <FileDown size={16} /> Xuất Excel
            </button>
          </div>
          <button
            onClick={() => handleOpenModal('add')}
            className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
          >
            <Plus size={18} /> Thêm phiếu mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="italic">Đang tải dữ liệu phiếu nhập...</p>
        </div>
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
                          <SearchableSelect value={row.receiver} options={users} onChange={(val) => handleReceiverChange(row, val)} placeholder="Chọn người nhận..." className="w-full flex items-center border border-gray-300 rounded-md px-2 bg-white text-xs min-h-[34px]" />
                        </div>
                      </div>

                    </div>

                    <div className="flex flex-col gap-1 lg:hidden">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Kho lưu trữ</span>
                      <div className="relative w-full">
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenWarehousesModal(); }} className="absolute right-1 top-[-10px] text-blue-600 text-[9px] font-bold underline z-20 leading-none bg-white/80 px-1 rounded">hiệu chỉnh</button>
                        <SearchableSelect value={row.warehouse} options={warehouses} onChange={(val) => handleWarehouseChange(row, val)} className="w-full flex items-center border border-gray-300 rounded-md px-2 bg-white text-xs min-h-[34px]" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nhà cung cấp</span>
                      <div className="relative w-full max-w-[400px]">
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenSuppliersModal(); }} className="absolute right-1 top-[-10px] text-blue-600 text-[9px] font-bold underline z-20 leading-none bg-white/80 px-1 rounded">hiệu chỉnh</button>
                        <SearchableSelect value={row.supplier} options={suppliers} onChange={(val) => handleSupplierChange(row, val)} placeholder="Chọn nhà cung cấp..." className="w-full flex items-center border border-gray-300 rounded-md px-2 bg-white text-xs min-h-[34px]" />
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
                </div>
              </div>
            )}
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={<span className="text-lg sm:text-xl">{modalMode === 'add' ? 'Tạo phiếu nhập mới' : modalMode === 'edit' ? 'Cập nhật phiếu nhập' : 'Chi tiết phiếu nhập'}</span>}
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
                {/* Dòng 1: Mã phiếu nhập chiếm 1/2 */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Mã phiếu nhập <span className="text-red-500">*</span></label>
                  <input type="text" name="materialReceiptCode" value={currentReceipt?.materialReceiptCode || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-1.5 h-[38px] text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: PN-2024-001" required />
                </div>
                <div className="hidden md:block"></div>

                {/* Dòng 2: Nhà cung cấp và Số vận đơn */}
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
                    <SearchableSelect value={currentReceipt?.supplier || ''} options={suppliers} onChange={(val) => handleInputChange(val, 'supplier')} placeholder="Chọn nhà cung cấp..." />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Số vận đơn</label>
                  <input type="text" name="deliveryNoteNumber" value={currentReceipt?.deliveryNoteNumber || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-1.5 h-[38px] text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập số vận đơn" />
                </div>

                {/* Dòng 3: Kho lưu trữ và Ngày nhận hàng */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Kho lưu trữ</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenWarehousesModal(); }}
                      className="absolute right-1 top-[-18px] text-blue-600 hover:text-blue-800 text-[10px] font-bold underline z-20 leading-none bg-white px-1 rounded"
                    >
                      hiệu chỉnh
                    </button>
                    <SearchableSelect
                      value={currentReceipt?.warehouse || ''}
                      options={warehouses}
                      onChange={(val) => handleInputChange(val, 'warehouse')}
                      placeholder="Chọn kho..."
                      placement={window.innerWidth < 768 ? "top" : "bottom"}
                    />
                  </div>
                </div>
                <DateInput
                  label="Ngày nhận hàng"
                  name="receivingDate"
                  value={currentReceipt?.receivingDate || ''}
                  onChange={handleInputChange}
                  placement={window.innerWidth < 768 ? "top" : "bottom"}
                />
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
                    }}
                  />
                </div>

                {/* CustomDatatable đã thay thế bảng thủ công */}
                <div className="overflow-x-auto overflow-y-auto max-h-[350px] sm:max-h-none sm:overflow-visible custom-scrollbar border border-gray-100 sm:border-none rounded-lg">
                  <CustomDatatable columns={itemColumns} data={currentReceipt?.items || []} paginationClassName="!py-1 !px-4" headerCellClassName="!py-1" bodyCellClassName="!py-2" />
                </div>
              </div>
            )}

            {/* Tab 3: Thông tin kiểm soát chất lượng */}
            {activeTab === 3 && ( /* This is the div for Tab 3 content */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
                {/* Hàng 1: Người nhận hàng chiếm 1/2 màn hình, nằm riêng một hàng */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Người nhận hàng</label>
                  <SearchableSelect value={currentReceipt?.receiver || ''} options={users} onChange={(val) => handleInputChange(val, 'receiver')} placeholder="Chọn nhân viên..." />
                </div>
                <div className="hidden md:block"></div>

                {/* Thành phần mới: Ban kiểm nghiệm sản phẩm */}
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Ban kiểm nghiệm sản phẩm</label>
                  <MultiSearchableSelect
                    placeholder="Chọn thành viên ban kiểm nghiệm (1 Trưởng ban, tối đa 2 Ủy ban)..."
                    selectedValues={currentReceipt?.inspectorPanel || []}
                    options={inspectorOptions}
                    onChange={handleInspectorChange}
                  />
                  <p className="text-[10px] text-gray-500 italic mt-0.5">* Quy định: 1 Trưởng ban và tối đa 2 Ủy ban kiểm nghiệm</p>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    Chứng nhận xuất xứ (CO) <span className="text-[10px] text-gray-400 font-normal">(PDF)</span>
                  </label>
                  <div className="flex items-center">
                    <div className="relative flex-1 group">
                      <input type="file" onChange={(e) => handleFileUpload(e, 'certificateOfOrigin')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf" />
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
                        onClick={() => handleRequestDownload(`https://quanlysanxuat-back-end.onrender.com${currentReceipt.certificateOfOrigin}`)}
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
                      <input type="file" onChange={(e) => handleFileUpload(e, 'certificateOfQuality')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,image/*" />
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
                        onClick={() => handleRequestDownload(`https://quanlysanxuat-back-end.onrender.com${currentReceipt.certificateOfQuality}`)}
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
                      <input type="file" onChange={(e) => handleFileUpload(e, 'inspectationReport')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,image/*" />
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
                        onClick={() => handleRequestDownload(`https://quanlysanxuat-back-end.onrender.com${currentReceipt.inspectationReport}`)}
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
                  <textarea name="specialStorageCondition" value={currentReceipt?.specialStorageCondition || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[40px] sm:min-h-[40px]" ></textarea>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t sm:justify-end sm:items-center">
            {activeTab === 3 && (
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
            <div className="flex gap-3 w-full sm:w-auto order-2 sm:order-1">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors text-sm"
              >
                {modalMode === 'view' ? 'Đóng' : 'Hủy bỏ'}
              </button>
              {modalMode !== 'view' && (
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
              <Plus size={16} /> Thêm nhà cung cấp
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
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={editingSupplier.name} onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })} required autoFocus />
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
        title={warehouseModalMode === 'add' ? "Thêm nhà kho mới" : "Cập nhật nhà kho"}
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
              />
            </div>

            {/* Bảng danh sách nguyên liệu y hệt Tab 2 */}
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] sm:max-h-none sm:overflow-visible custom-scrollbar border border-gray-100 sm:border-none rounded-lg">
              <CustomDatatable
                columns={itemColumns}
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
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm">
              Lưu thông tin
            </button>
          </div>
        </form>
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
    </div>
  );
};
