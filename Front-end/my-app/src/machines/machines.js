import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, ChevronDown, FileDown, FileUp, ChevronRight, Trash2 } from 'lucide-react';
import { FaRegSquare, FaRegSquareMinus } from "react-icons/fa6";
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
  getMachines,
  createMachine,
  updateMachine,
  deleteMachine
} from '../controller/machinesController';
import {
  getMachineTypes,
  createMachineType,
  updateMachineType,
  deleteMachineType
} from '../controller/machineTypesController';
import {
  getMachineStatuses,
  createMachineStatus,
  updateMachineStatus,
  deleteMachineStatus
} from '../controller/machineStatusesController';
import { MdAdd } from 'react-icons/md';

const API_BASE_URL = 'https://quanlysanxuat-production.up.railway.app/api';

// Component Searchable Select tùy chỉnh dành riêng cho các ô trong bảng
const SearchableSelect = ({ value, options, onChange, placeholder = "Tìm...", className, disabled = false, error = false, errorMessage = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuRect, setMenuRect] = useState(null);
  const selectRef = useRef(null);
  const menuRef = useRef(null);

  // Logic lắng nghe click bên ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideSelect = selectRef.current && selectRef.current.contains(event.target);
      const isInsideMenu = menuRef.current && menuRef.current.contains(event.target);

      if (!isInsideSelect && !isInsideMenu) {
        setIsOpen(false);
        setSearch('');
      }
    };

    // Thêm listener khi component mount
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const updateMenuRect = () => {
      if (!selectRef.current) return;

      const rect = selectRef.current.getBoundingClientRect();
      setMenuRect({
        left: rect.left,
        top: rect.bottom + 4,
        width: Math.max(rect.width, 180),
      });
    };

    updateMenuRect();
    window.addEventListener('resize', updateMenuRect);
    window.addEventListener('scroll', updateMenuRect, true);

    return () => {
      window.removeEventListener('resize', updateMenuRect);
      window.removeEventListener('scroll', updateMenuRect, true);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const filteredOptions = options.filter(opt =>
    opt.label?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-1 w-full" ref={selectRef}>
      {/* Ô hiển thị giá trị hiện tại */}
      <div
        onClick={(e) => {
          if (disabled) return;
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`${className || `bg-gray-50 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} text-gray-900 text-xs rounded-lg p-1 pr-7 cursor-pointer font-medium flex justify-between items-center min-h-[26px] hover:border-blue-400 transition-all shadow-sm`} relative`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : '-- Chọn --'}</span>
        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
          <ChevronDown size={14} />
        </div>
      </div>

      {isOpen && menuRect && createPortal(
        <div
          ref={menuRef}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden origin-top animate-in fade-in slide-in-from-top-1 duration-200"
          style={{
            left: menuRect.left,
            top: menuRect.top,
            width: menuRect.width,
          }}
        >
          <div className="p-1.5 border-b bg-gray-50 sticky top-0 z-10">
            <div className="relative group">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                autoFocus={window.innerWidth >= 768}
                placeholder={placeholder}
                className="w-full text-[11px] pl-8 pr-2 py-1.5 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-tight bg-white transition-all shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div key={opt.value} onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); setSearch(''); }} className={`p-2 text-xs hover:bg-blue-50 cursor-pointer transition-colors ${String(opt.value) === String(value) ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700'}`}>
                {opt.label}
              </div>
            )) : <div className="p-3 text-xs text-gray-400 italic text-center">Không có kết quả</div>}
          </div>
        </div>,
        document.body
      )}
      {errorMessage && <p className="text-red-500 text-xs mt-1 font-medium">{errorMessage}</p>}
    </div>
  );
};

export const Machines = () => {
  // State quản lý danh sách và dữ liệu metadata
  const [machines, setMachines] = useState([]);
  const [machineTypes, setMachineTypes] = useState([]);
  const [machineStatuses, setMachineStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedMachineIds, setSelectedMachineIds] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);

  // Hàm chuẩn hóa text để so sánh (giống stages.js)
  const normalizeImportText = (value) => String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

  // Hàm lấy text từ cell Excel (xử lý richText, hyperlink...)
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

  const handleOpenImportModal = () => {
    setSelectedImportFile(null);
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setSelectedImportFile(null);
    setIsImportModalOpen(false);
  };

  const handleDownloadImportTemplate = () => {
    // Tải file mẫu từ thư mục Templates\ImportTemplate ở Back-end
    window.location.href = `${API_BASE_URL}/Machines/import-template`;
  };

  const handleImportExcel = async () => {
    if (!selectedImportFile) {
      showNotification("Vui lòng chọn file Excel cần nhập.", "error");
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

      let createdCount = 0;
      let updatedCount = 0;

      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const machineCode = getExcelCellText(row.getCell(2)).trim(); // Cột B
        if (!machineCode) continue;

        const typeName = getExcelCellText(row.getCell(3)).trim(); // Cột C
        const statusName = getExcelCellText(row.getCell(4)).trim(); // Cột D
        const oeeTarget = parseFloat(getExcelCellText(row.getCell(5))) || 0; // Cột E
        const runningHours = parseFloat(getExcelCellText(row.getCell(6))) || 0; // Cột F

        // Dò ID dựa trên tên
        const typeId = rawMachineTypes.find(t => normalizeImportText(t.name) === normalizeImportText(typeName))?.id;
        const statusId = rawMachineStatuses.find(s => normalizeImportText(s.name) === normalizeImportText(statusName))?.id;

        const existingMachine = machines.find(m => normalizeImportText(m.machineCode) === normalizeImportText(machineCode));

        const payload = {
          machineCode,
          machineType: typeId || null,
          status: statusId || null,
          oeeTarget,
          totalRunningHours: runningHours,
          // Giữ nguyên các ngày cũ nếu có, hoặc để trống cho DB xử lý
          productionDate: existingMachine?.productionDate || new Date().toISOString(),
          commissioningDate: existingMachine?.commissioningDate || new Date().toISOString(),
          lastMaintainance: existingMachine?.lastMaintainance || new Date().toISOString(),
        };

        if (existingMachine) {
          await updateMachine(existingMachine.id, payload);
          updatedCount++;
        } else {
          await createMachine(payload);
          createdCount++;
        }
      }

      showNotification("Nhập Excel thành công", "success");
      fetchData();
      handleCloseImportModal();
    } catch (err) {
      console.error(err);
      showNotification("Lỗi khi nhập file Excel máy móc.", "error");
    } finally {
      setIsImportingExcel(false);
    }
  };

  // State quản lý Modal và Chế độ (Thêm/Sửa/Xem)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentMachine, setCurrentMachine] = useState(null);
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  // New states for sub-modals maximization
  const [isTypeModalMaximized, setIsTypeModalMaximized] = useState(false);
  const [isTypeFormModalMaximized, setIsTypeFormModalMaximized] = useState(false);
  const [isStatusModalMaximized, setIsStatusModalMaximized] = useState(false);
  const [isStatusFormModalMaximized, setIsStatusFormModalMaximized] = useState(false);

  // State quản lý Loại máy (Sub-modal)
  const [rawMachineTypes, setRawMachineTypes] = useState([]); // Lưu dữ liệu gốc để CRUD
  const [typeSearchTerm, setTypeSearchTerm] = useState('');

  // State quản lý Trạng thái máy (Sub-modal)
  const [rawMachineStatuses, setRawMachineStatuses] = useState([]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusSearchTerm, setStatusSearchTerm] = useState('');
  const [statusModalMode, setStatusModalMode] = useState('list'); // 'list', 'add', 'edit'
  const [currentStatus, setCurrentStatus] = useState({ name: '' });
  const [isStatusFormModalOpen, setIsStatusFormModalOpen] = useState(false);
  const [statusErrors, setStatusErrors] = useState({});

  // State thông báo và xác nhận xóa
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });


  // State quản lý Modal Danh sách Loại máy
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  // State MỚI: Quản lý Modal Form (Thêm/Sửa) Loại máy
  const [isTypeFormModalOpen, setIsTypeFormModalOpen] = useState(false);
  const [typeModalMode, setTypeModalMode] = useState('add'); // 'add' hoặc 'edit'
  const [currentType, setCurrentType] = useState({ name: '' });
  const [typeErrors, setTypeErrors] = useState({});

  // Hàm mở Modal thêm mới
  const handleOpenAddType = () => {
    setCurrentType({ name: '' });
    setTypeModalMode('add');
    setIsTypeFormModalOpen(true);
  };

  // Hàm mở Modal chỉnh sửa
  const handleOpenEditType = (type) => {
    setCurrentType(type);
    setTypeModalMode('edit');
    setIsTypeFormModalOpen(true);
  };

  // Hàm mở Modal thêm mới
  const handleOpenAddStatus = () => {
    setCurrentStatus({ name: '' });
    setStatusModalMode('add');
    setStatusErrors({});
    setIsStatusFormModalOpen(true);
  };

  // Hàm mở Modal chỉnh sửa
  const handleOpenEditStatus = (status) => {
    setCurrentStatus(status);
    setStatusModalMode('edit');
    setStatusErrors({});
    setIsStatusFormModalOpen(true);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  // Hàm tải dữ liệu từ Backend
  const fetchData = async () => {
    try {
      setLoading(true);
      const [machinesData, typesData, statusesData] = await Promise.all([
        getMachines(),
        getMachineTypes(),
        getMachineStatuses()
      ]);
      setMachines(machinesData);
      setSelectedMachineIds([]);
      setRawMachineTypes(typesData);
      setRawMachineStatuses(statusesData);
      setMachineTypes(typesData.map(t => ({ value: t.id, label: t.name })));
      setMachineStatuses(statusesData.map(s => ({ value: s.id, label: s.name })));
    } catch (err) {
      showNotification("Lỗi khi tải dữ liệu từ máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý lọc dữ liệu theo Mã máy
  const filteredData = useMemo(() => {
    return machines.filter(m =>
      m.machineCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [machines, searchTerm]);

  // Mở modal và chuẩn bị dữ liệu (Format ngày tháng cho Input HTML)
  const handleOpenModal = (mode, machine = null) => {
    setModalMode(mode);
    if (mode === 'add') {
      setCurrentMachine({
        machineCode: '',
        machineType: '',
        productionDate: '',
        commissioningDate: '',
        totalRunningHours: 0,
        lastMaintainance: '',
        status: '',
        oeeTarget: 0
      });
    } else {
      const formattedMachine = { ...machine };
      // Chuyển ISO Date thành định dạng YYYY-MM-DD để input[type="date"] nhận diện được
      if (machine.productionDate) formattedMachine.productionDate = machine.productionDate.split('T')[0];
      if (machine.commissioningDate) formattedMachine.commissioningDate = machine.commissioningDate.split('T')[0];
      if (machine.lastMaintainance) formattedMachine.lastMaintainance = machine.lastMaintainance.split('T')[0];
      setCurrentMachine(formattedMachine);
    }
    setIsModalOpen(true);
  };

  // --- Logic quản lý Loại máy ---
  const handleOpenTypeManagement = () => {
    setTypeModalMode('list');
    setIsTypeModalOpen(true);
  };

  const handleTypeInputChange = (e) => {
    setCurrentType({ ...currentType, name: e.target.value });
  };

  // Hàm lưu (Submit Form)
  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!currentType?.name?.trim()) {
      setTypeErrors({ name: "Bắt buộc nhập Tên loại máy" });
      return;
    }
    setTypeErrors({});

    try {
      if (typeModalMode === 'add') {
        await createMachineType({ name: currentType.name });
        showNotification("Thêm loại máy thành công!");
      } else {
        await updateMachineType(currentType.id, { id: currentType.id, name: currentType.name });
        showNotification("Cập nhật loại máy thành công!");
      }

      // Tải lại dữ liệu và đóng Modal Form
      const updatedTypes = await getMachineTypes();
      setRawMachineTypes(updatedTypes);
      setMachineTypes(updatedTypes.map(t => ({ value: t.id, label: t.name })));

      setIsTypeFormModalOpen(false); // Đóng modal nhập liệu
    } catch (err) {
      showNotification("Lỗi khi lưu loại máy", "error");
    }
  };

  const handleDeleteType = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa loại máy này?")) {
      try {
        await deleteMachineType(id);
        const updatedTypes = await getMachineTypes();
        setRawMachineTypes(updatedTypes);
        setMachineTypes(updatedTypes.map(t => ({ value: t.id, label: t.name })));
        showNotification("Đã xóa loại máy!");
      } catch (err) {
        showNotification("Không thể xóa (có thể đang được sử dụng)", "error");
      }
    }
  };

  const filteredTypes = useMemo(() => {
    return rawMachineTypes.filter(t => t.name?.toLowerCase().includes(typeSearchTerm.toLowerCase()));
  }, [rawMachineTypes, typeSearchTerm]);

  const typeColumns = [
    { header: 'STT', render: (_, { index }) => index, className: '!px-1 sm:!px-4' },
    { header: 'Tên loại máy', accessor: 'name', className: 'font-bold text-blue-600 !px-1 sm:!px-4' },
    {
      header: 'Hành động', className: 'text-right pr-4 !px-2 sm:!px-4', render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => handleOpenEditType(row)} // Gọi hàm mở modal sửa
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >
            Sửa
          </button>
          <button
            type="button"
            onClick={() => handleDeleteType(row.id)}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >
            Xóa
          </button>
        </div>
      )
    }
  ];


  // --- Logic quản lý Trạng thái máy ---
  const handleOpenStatusManagement = () => {
    setStatusModalMode('list');
    setIsStatusModalOpen(true);
  };

  const handleStatusInputChangeSub = (e) => {
    setCurrentStatus({ ...currentStatus, name: e.target.value });
    if (statusErrors.name) setStatusErrors({});
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!currentStatus?.name?.trim()) {
      setStatusErrors({ name: "Bắt buộc nhập Tên trạng thái" });
      return;
    }
    setStatusErrors({});

    try {
      if (statusModalMode === 'add') {
        await createMachineStatus({ name: currentStatus.name });
        showNotification("Thêm trạng thái thành công!");
      } else {
        await updateMachineStatus(currentStatus.id, { id: currentStatus.id, name: currentStatus.name });
        showNotification("Cập nhật trạng thái thành công!");
      }
      const updatedStatuses = await getMachineStatuses();
      setRawMachineStatuses(updatedStatuses);
      setMachineStatuses(updatedStatuses.map(s => ({ value: s.id, label: s.name })));
      setIsStatusFormModalOpen(false);
    } catch (err) {
      showNotification("Lỗi khi lưu trạng thái", "error");
    }
  };

  const handleDeleteStatus = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa trạng thái này?")) {
      try {
        await deleteMachineStatus(id);
        const updatedStatuses = await getMachineStatuses();
        setRawMachineStatuses(updatedStatuses);
        setMachineStatuses(updatedStatuses.map(s => ({ value: s.id, label: s.name })));
        showNotification("Đã xóa trạng thái!");
      } catch (err) {
        showNotification("Không thể xóa (có thể đang được sử dụng)", "error");
      }
    }
  };

  const filteredStatusesSub = useMemo(() => {
    return rawMachineStatuses.filter(s => s.name?.toLowerCase().includes(statusSearchTerm.toLowerCase()));
  }, [rawMachineStatuses, statusSearchTerm]);

  const statusColumns = [
    { header: 'STT', render: (_, { index }) => index },
    {
      header: <><span className="hidden sm:inline">Tên trạng thái</span><span className="sm:hidden">Tên</span></>
      , accessor: 'name', className: 'font-bold text-blue-600'
    },
    {
      header: 'Hành động', className: 'text-right pr-4', render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => handleOpenEditStatus(row)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >
            Sửa
          </button>
          <button type="button" onClick={() => handleDeleteStatus(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95">Xóa</button>
        </div>
      )
    }
  ];

  const toggleModalMaximize = () => {
    setIsModalMaximized(prev => !prev);
  };

  // New toggle functions for sub-modals
  const toggleTypeModalMaximize = () => {
    setIsTypeModalMaximized(prev => !prev);
  };

  const toggleTypeFormModalMaximize = () => {
    setIsTypeFormModalMaximized(prev => !prev);
  };

  const toggleStatusModalMaximize = () => {
    setIsStatusModalMaximized(prev => !prev);
  };

  const toggleStatusFormModalMaximize = () => {
    setIsStatusFormModalMaximized(prev => !prev);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentMachine(null);
    setIsModalMaximized(false);
    setIsTypeModalOpen(false);
    setTypeModalMode('list');
    setIsStatusModalOpen(false);
    setStatusModalMode('list');
    setIsTypeFormModalOpen(false);
    setIsStatusFormModalOpen(false);
    setErrors({});
    setTypeErrors({});
    setStatusErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentMachine(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Xử lý Lưu hoặc Cập nhật
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!currentMachine?.machineType) newErrors.machineType = "Bắt buộc nhập Loại máy";
    if (!currentMachine?.productionDate) newErrors.productionDate = "Bắt buộc nhập Ngày sản xuất";
    if (!currentMachine?.commissioningDate) newErrors.commissioningDate = "Bắt buộc nhập Ngày đưa vào sử dụng";
    if (!currentMachine?.lastMaintainance) newErrors.lastMaintainance = "Bắt buộc nhập Ngày bảo trì gần nhất";
    if (!currentMachine?.totalRunningHours || currentMachine?.totalRunningHours <= 0) newErrors.totalRunningHours = "Bắt buộc nhập Tổng số giờ đã chạy";
    if (!currentMachine?.status) newErrors.status = "Bắt buộc nhập Trạng thái";
    if (currentMachine?.oeeTarget === '' || currentMachine?.oeeTarget === undefined || currentMachine?.oeeTarget === null || currentMachine?.oeeTarget <= 0) {
      newErrors.oeeTarget = "Bắt buộc nhập Mục tiêu hiệu suất";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      if (modalMode === 'add') {
        await createMachine(currentMachine);
        showNotification("Thêm máy mới thành công!");
      } else if (modalMode === 'edit') {
        await updateMachine(currentMachine.id, currentMachine);
        showNotification("Cập nhật thông tin máy thành công!");
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      showNotification("Không thể lưu dữ liệu máy. Vui lòng thử lại.", "error");
    }
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách máy ra tệp Excel không?'
    });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách máy');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Mã máy', key: 'machineCode', width: 20 },
        { header: 'Loại máy', key: 'machineType', width: 25 },
        { header: 'Trạng thái', key: 'status', width: 20 },
        { header: 'OEE Target (%)', key: 'oeeTarget', width: 20 },
        { header: 'Giờ chạy (h)', key: 'totalRunningHours', width: 15 },
      ];

      filteredData.forEach((machine, index) => {
        const typeLabel = machineTypes.find(t => String(t.value) === String(machine.machineType))?.label || 'N/A';
        const statusLabel = machineStatuses.find(s => String(s.value) === String(machine.status))?.label || 'N/A';

        worksheet.addRow({
          stt: index + 1,
          machineCode: machine.machineCode,
          machineType: typeLabel,
          status: statusLabel,
          oeeTarget: machine.oeeTarget,
          totalRunningHours: machine.totalRunningHours,
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
          if (colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách máy.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  // Xử lý Xóa máy
  const handleDeleteRequest = (id) => {
    setConfirmModal({
      isOpen: true,
      id,
      type: 'delete',
      title: 'Xác nhận xóa máy',
      message: 'Bạn có chắc chắn muốn xóa máy này không? Thao tác này không thể khôi phục.'
    });
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'export') {
      await handleExportExcel();
    } else if (confirmModal.type === 'delete') {
      try {
        await deleteMachine(confirmModal.id);
        showNotification("Đã xóa máy thành công!");
        fetchData();
      } catch (err) {
        showNotification("Lỗi khi xóa máy", "error");
      }
    } else if (confirmModal.type === 'bulkDelete') {
      try {
        await Promise.all(confirmModal.id.map(id => deleteMachine(id)));
        showNotification(`Đã xóa ${confirmModal.id.length} máy thành công!`);
        setSelectedMachineIds([]);
        setIsBulkSelectMode(false);
        fetchData();
      } catch (err) {
        showNotification("Lỗi khi xóa nhiều máy", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleBulkDelete = () => {
    if (!isBulkSelectMode) {
      setIsBulkSelectMode(true);
      setSelectedMachineIds([]);
      return;
    }

    if (selectedMachineIds.length === 0) {
      setIsBulkSelectMode(false);
      setSelectedMachineIds([]);
      return;
    }

    setConfirmModal({
      isOpen: true,
      id: selectedMachineIds,
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều máy',
      message: `Bạn có chắc chắn muốn xóa ${selectedMachineIds.length} máy đã chọn không? Hành động này không thể hoàn tác.`
    });
  };

  const handleSelectAllMachines = () => {
    const visibleMachineIds = filteredData.map(machine => machine.id).filter(Boolean);
    setSelectedMachineIds(visibleMachineIds);
  };

  const handleClearSelectedMachines = () => {
    setSelectedMachineIds([]);
  };

  const handleToggleSelectMachine = (row) => {
    const rowId = row.id;
    setSelectedMachineIds(prev => prev.includes(rowId)
      ? prev.filter(id => id !== rowId)
      : [...prev, rowId]
    );
  };

  const handleMachineTypeChange = async (machine, newTypeId) => {
    try {
      const updatedValue = newTypeId === "" ? null : (isNaN(newTypeId) ? newTypeId : parseInt(newTypeId));
      const payload = { ...machine, machineType: updatedValue };
      await updateMachine(machine.id, payload);

      // Cập nhật lại danh sách máy trong state để UI đồng bộ ngay lập tức
      setMachines(prev => prev.map(m => m.id === machine.id ? { ...m, machineType: updatedValue } : m));
      showNotification("Cập nhật loại máy thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật loại máy", "error");
    }
  };

  const handleMachineStatusChange = async (machine, newStatusId) => {
    try {
      const updatedValue = newStatusId === "" ? null : (isNaN(newStatusId) ? newStatusId : parseInt(newStatusId));
      const payload = { ...machine, status: updatedValue };
      await updateMachine(machine.id, payload);

      setMachines(prev => prev.map(m => m.id === machine.id ? { ...m, status: updatedValue } : m));
      showNotification("Cập nhật trạng thái thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật trạng thái", "error");
    }
  };

  // Cấu hình các cột cho bảng
  const columns = [
    {
      header: '',
      className: 'w-[40px] text-center !px-1',
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
    { header: 'STT', className: 'w-[50px] text-center hidden sm:table-cell', render: (_, { index }) => index },
    { header: 'Mã máy', accessor: 'machineCode', className: 'font-bold text-blue-700 min-w-[120px] !px-2' },
    {
      header: 'Loại máy',
      className: 'hidden md:table-cell min-w-[150px]',
      render: (row) => (
        <div className="relative min-w-[150px]" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenTypeManagement();
            }}
            className="absolute right-1 top-[-8px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
          >
            hiệu chỉnh
          </button>
          <SearchableSelect
            value={row.machineType || ''}
            options={machineTypes}
            onChange={(val) => handleMachineTypeChange(row, val)}
            placeholder="Tìm loại máy..."
          />
        </div>
      )
    },
    {
      header: 'Trạng thái',
      className: 'hidden md:table-cell min-w-[150px]',
      render: (row) => (
        <div className="relative min-w-[150px]" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenStatusManagement();
            }}
            className="absolute right-1 top-[-8px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
          >
            hiệu chỉnh
          </button>
          <SearchableSelect
            value={row.status || ''}
            options={machineStatuses}
            onChange={(val) => handleMachineStatusChange(row, val)}
            placeholder="Tìm trạng thái..."
          />
        </div>
      )
    },
    { header: 'OEE Target', className: 'hidden lg:table-cell text-center', render: (row) => <span className="font-bold text-orange-600">{row.oeeTarget}%</span> },
    {
      header: 'Giờ chạy',
      className: 'hidden lg:table-cell text-center',
      render: (row) => <span>{row.totalRunningHours?.toLocaleString()} h</span>
    },
    {
      header: isBulkSelectMode ? (
        <div className="flex w-full items-center justify-center gap-1 text-[10px] sm:text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAllMachines();
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
              handleClearSelectedMachines();
            }}
            className="font-semibold text-gray-500 hover:text-gray-700"
          >
            Bỏ chọn
          </button>
        </div>
      ) : 'Hành động',
      className: 'text-center pr-2 sm:pr-4 w-[100px] sm:w-[150px]',
      render: (row) => (
        <div className="flex justify-center items-center gap-3 whitespace-nowrap">
          {isBulkSelectMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSelectMachine(row);
              }}
              className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-red-50"
              title={selectedMachineIds.includes(row.id) ? 'Bỏ chọn' : 'Chọn dòng'}
            >
              {selectedMachineIds.includes(row.id) ? (
                <FaRegSquareMinus size={20} className="text-red-600" />
              ) : (
                <FaRegSquare size={20} className="text-gray-400" />
              )}
            </button>
          ) : (
            <div className="flex gap-1.5 justify-end animate-in slide-in-from-left-2 duration-200">
              <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', row); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95">Sửa</button>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(row.id); }} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95">Xóa</button>
            </div>
          )}
        </div>
      ),
    }
  ];

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 tracking-tight">Danh sách máy</h2>

      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        {/* Thanh Tìm kiếm */}
        <div className="relative w-full lg:max-w-[350px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã máy"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm outline-none transition-all sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 w-full lg:w-auto lg:flex lg:flex-wrap">
          <button
            onClick={handleRequestExportExcel}
            className="order-1 lg:order-3 w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded whitespace-nowrap flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-sm"
          >
            <FileDown size={16} />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={handleOpenImportModal}
            className="order-2 lg:order-2 w-full lg:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded whitespace-nowrap transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
          >
            <FileUp size={16} />
            <span>Nhập Excel</span>
          </button>
          <button
            onClick={handleBulkDelete}
            className={`order-3 lg:order-1 w-full lg:w-auto text-white font-bold py-2 px-3 rounded whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm ${selectedMachineIds.length > 0 ? 'bg-red-700 hover:bg-red-700' : 'bg-red-700 hover:bg-red-700'}`}
          >
            <Trash2 size={16} />
            <span className="truncate">Xóa nhiều dòng {selectedMachineIds.length > 0 && `(${selectedMachineIds.length})`}</span>
          </button>
          <button
            onClick={() => handleOpenModal('add')}
            className="order-4 w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded whitespace-nowrap transition-all active:scale-95 shadow-md text-sm flex items-center justify-center gap-2"
          >
            <MdAdd />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      {
        loading ? (
          <p className="p-4 text-gray-600">Đang tải dữ liệu máy móc...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <CustomDatatable
              columns={columns}
              data={filteredData}
              bodyCellClassName="!py-2 lg:!py-3"
              renderExpansion={(row) => (
                <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-4 sm:gap-x-8 text-sm">
                    <div className="flex flex-col gap-1 md:hidden">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Loại máy</span>
                      <div className="relative max-w-[150px]">
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenTypeManagement(); }} className="absolute right-1 top-[-9px] text-blue-500 text-[9px] font-bold underline z-20 bg-white/80 px-0.5">hiệu chỉnh</button>
                        <SearchableSelect
                          value={row.machineType || ''}
                          options={machineTypes}
                          onChange={(val) => handleMachineTypeChange(row, val)}
                          className="w-full border border-gray-300 rounded-lg p-1 pr-7 bg-white text-[11px] min-h-[30px]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 md:hidden">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</span>
                      <div className="relative max-w-[150px]">
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenStatusManagement(); }} className="absolute right-1 top-[-9px] text-blue-500 text-[9px] font-bold underline z-20 bg-white/80 px-0.5">hiệu chỉnh</button>
                        <SearchableSelect
                          value={row.status || ''}
                          options={machineStatuses}
                          onChange={(val) => handleMachineStatusChange(row, val)}
                          className="w-full border border-gray-300 rounded-lg p-1 pr-7 bg-white text-[11px] min-h-[30px]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 lg:hidden">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OEE Target</span>
                      <span className="text-gray-900 font-bold text-orange-600">{row.oeeTarget}%</span>
                    </div>
                    <div className="flex flex-col gap-1 lg:hidden">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Giờ chạy</span>
                      <span className="text-gray-900 font-medium">{row.totalRunningHours?.toLocaleString()} h</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ngày sản xuất</span>
                      <span className="text-gray-900 font-medium">{row.productionDate ? new Date(row.productionDate).toLocaleDateString('vi-VN') : '---'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ngày bàn giao</span>
                      <span className="text-gray-900 font-medium">{row.commissioningDate ? new Date(row.commissioningDate).toLocaleDateString('vi-VN') : '---'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bảo trì gần nhất</span>
                      <span className="text-gray-900 font-medium">{row.lastMaintainance ? new Date(row.lastMaintainance).toLocaleDateString('vi-VN') : '---'}</span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        )
      }

      {/* Modal Nhập Excel */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Nhập dữ liệu máy móc từ Excel"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="machine-excel-file"
              className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-blue-600 hover:bg-blue-50"
            >
              <FileUp size={32} className="mb-3 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                {selectedImportFile ? selectedImportFile.name : 'Chọn file Excel (.xlsx)'}
              </span>
              <input
                id="machine-excel-file"
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
                className="text-xs font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors"
              >
                Tải file mẫu
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={handleCloseImportModal}
              className="rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleImportExcel}
              disabled={isImportingExcel || !selectedImportFile}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isImportingExcel ? 'Đang xử lý...' : 'Nhập dữ liệu'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm máy mới' : modalMode === 'edit' ? 'Cập nhật máy' : 'Thông tin chi tiết'}
        maxWidth={isModalMaximized ? "max-w-full" : "max-w-4xl"}
        isMaximized={isModalMaximized}
        onMaximizeToggle={toggleModalMaximize}
      >
        <form onSubmit={handleSubmit} className={`flex flex-col ${isModalMaximized ? 'h-[75vh]' : 'max-h-[70vh] overflow-y-auto px-1'}`}>
          <div className={`space-y-5 ${isModalMaximized ? 'flex-1 overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 ml-1">Mã máy <span className="text-red-500">*</span></label>
                <input type="text" name="machineCode" value={currentMachine?.machineCode || ''} onChange={handleInputChange} disabled className={`w-full block cursor-not-allowed bg-gray-100 border border-gray-300 focus:ring-blue-500 rounded-lg px-3 py-2.5 focus:ring-2 outline-none transition-all disabled:bg-gray-50 text-sm bg-white shadow-sm`} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 ml-1">Loại máy</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleOpenTypeManagement}
                    className="absolute right-0 top-[-18px] text-blue-500 hover:text-blue-700 text-[10px] font-bold underline z-20 bg-white px-1 leading-none transition-colors"
                  >
                    hiệu chỉnh
                  </button>
                  <SearchableSelect
                    value={currentMachine?.machineType || ''}
                    options={machineTypes}
                    onChange={(val) => handleInputChange({ target: { name: 'machineType', value: val } })}
                    disabled={modalMode === 'view'}
                    className={`w-full border ${errors.machineType ? 'border-red-500 focus:ring-0 focus:outline-none' : 'border-gray-300 focus:ring-blue-500'} rounded-lg px-3 py-2.5 focus:ring-2 outline-none transition-all disabled:bg-gray-50 text-sm bg-white flex items-center justify-between cursor-pointer shadow-sm`}
                    placeholder="Tìm loại máy..."
                    error={!!errors.machineType}
                    errorMessage={errors.machineType}
                  />
                </div>
              </div>

              <DateInput label="Ngày sản xuất" name="productionDate" value={currentMachine?.productionDate || ''} onChange={handleInputChange} disabled={modalMode === 'view'} error={!!errors.productionDate} errorMessage={errors.productionDate} />
              <DateInput label="Ngày đưa vào sử dụng" name="commissioningDate" value={currentMachine?.commissioningDate || ''} onChange={handleInputChange} disabled={modalMode === 'view'} error={!!errors.commissioningDate} errorMessage={errors.commissioningDate} />

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 ml-1">Tổng số giờ đã chạy</label>
                <input type="number" name="totalRunningHours" value={currentMachine?.totalRunningHours || 0} onChange={handleInputChange} disabled={modalMode === 'view'} className={`w-full border ${errors.totalRunningHours ? 'border-red-500 focus:ring-0 focus:outline-none' : 'border-gray-300 focus:ring-blue-500'} rounded-lg px-3 py-2.5 focus:ring-2 outline-none transition-all disabled:bg-gray-50 text-sm bg-white shadow-sm`} />
                {errors.totalRunningHours && <p className="text-red-500 text-xs mt-1 font-medium">{errors.totalRunningHours}</p>}
              </div>

              <DateInput label="Ngày bảo trì gần nhất" name="lastMaintainance" value={currentMachine?.lastMaintainance || ''} onChange={handleInputChange} disabled={modalMode === 'view'} error={!!errors.lastMaintainance} errorMessage={errors.lastMaintainance} />

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 ml-1">Trạng thái</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleOpenStatusManagement}
                    className="absolute right-0 top-[-18px] text-blue-500 hover:text-blue-700 text-[10px] font-bold underline z-20 bg-white px-1 leading-none transition-colors"
                  >
                    hiệu chỉnh
                  </button>
                  <SearchableSelect
                    value={currentMachine?.status || ''}
                    options={machineStatuses}
                    onChange={(val) => handleInputChange({ target: { name: 'status', value: val } })}
                    disabled={modalMode === 'view'}
                    className={`w-full border ${errors.status ? 'border-red-500 focus:ring-0 focus:outline-none' : 'border-gray-300 focus:ring-blue-500'} rounded-lg px-3 py-2.5 focus:ring-2 outline-none transition-all disabled:bg-gray-50 text-sm bg-white flex items-center justify-between cursor-pointer shadow-sm`}
                    placeholder="Tìm trạng thái..."
                    error={!!errors.status}
                    errorMessage={errors.status}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 ml-1">Mục tiêu hiệu suất (%)</label>
                <input type="number" step="0.1" name="oeeTarget" value={currentMachine?.oeeTarget || 0} onChange={handleInputChange} disabled={modalMode === 'view'} className={`w-full border ${errors.oeeTarget ? 'border-red-500 focus:ring-0 focus:ring-0 focus:outline-none' : 'border-gray-300 focus:ring-blue-500'} rounded-lg px-3 py-2.5 focus:ring-2 outline-none transition-all disabled:bg-gray-50 text-sm shadow-sm`} />
                {errors.oeeTarget && <p className="text-red-500 text-xs mt-1 font-medium">{errors.oeeTarget}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-auto sticky bottom-0 bg-white">
            <button type="button" onClick={handleCloseModal} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors text-sm">
              {modalMode === 'view' ? 'Đóng' : 'Hủy bỏ'}
            </button>
            {modalMode !== 'view' && (
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm">
                Lưu thông tin
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* Modal Quản lý Loại máy */}
      {/* 1. Modal Quản lý danh sách Loại máy */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title="Quản lý danh sách loại máy"
        maxWidth={isTypeModalMaximized ? "max-w-full" : "max-w-3xl"}
        isMaximized={isTypeModalMaximized}
        onMaximizeToggle={toggleTypeModalMaximize}
      >
        <div className={`space-y-5 ${isTypeModalMaximized ? 'flex-1 overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
          <div className="flex justify-between items-center gap-4">
            <div className="relative w-full max-w-[280px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Tìm loại máy..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50/50"
                value={typeSearchTerm}
                onChange={(e) => setTypeSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleOpenAddType} // Gọi hàm mở modal thêm mới
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <span className="hidden sm:inline">Thêm mới</span>
              <span className="sm:hidden">Thêm</span>
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
            <CustomDatatable columns={typeColumns} data={filteredTypes} />
          </div>
        </div>
      </Modal>

      {/* 2. Modal NHẬP LIỆU (Thêm/Sửa) - Đây là phần thiết kế lại theo yêu cầu của bạn */}
      <Modal
        isOpen={isTypeFormModalOpen}
        onClose={() => { setIsTypeFormModalOpen(false); setTypeErrors({}); }}
        title={typeModalMode === 'add' ? "Thêm loại máy mới" : "Chỉnh sửa loại máy"}
        maxWidth={isTypeFormModalMaximized ? "max-w-full" : "max-w-md"}
        isMaximized={isTypeFormModalMaximized}
        onMaximizeToggle={toggleTypeFormModalMaximize}
      >
        <form onSubmit={handleSaveType} className={`space-y-6 ${isTypeFormModalMaximized ? 'flex-1 overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Tên loại máy mới</label>
            <input
              type="text"
              value={currentType.name}
              onChange={(e) => {
                setCurrentType({ ...currentType, name: e.target.value });
                if (typeErrors.name) setTypeErrors({});
              }}
              className={`w-full border ${typeErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm`}
              placeholder="Nhập tên loại máy"
              autoFocus={window.innerWidth >= 768}
            />
            {typeErrors.name && <p className="text-red-500 text-xs mt-1 font-medium">{typeErrors.name}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => { setIsTypeFormModalOpen(false); setTypeErrors({}); }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
            >
              {typeModalMode === 'add' ? 'Thêm mới' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Quản lý Trạng thái */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Quản lý danh sách trạng thái"
        maxWidth={isStatusModalMaximized ? "max-w-full" : "max-w-3xl"}
        isMaximized={isStatusModalMaximized}
        onMaximizeToggle={toggleStatusModalMaximize}
      >
        <div className={`space-y-5 ${isStatusModalMaximized ? 'flex-1 overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
          <div className="flex justify-between items-center gap-4">
            <div className="relative w-full max-w-[280px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Tìm trạng thái..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50/50"
                value={statusSearchTerm}
                onChange={(e) => setStatusSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleOpenAddStatus}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <span className="hidden sm:inline">Thêm mới</span>
              Thêm
            </button>
          </div>
          <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
            <CustomDatatable columns={statusColumns} data={filteredStatusesSub} />
          </div>
        </div>
      </Modal>

      {/* Modal NHẬP LIỆU Trạng thái (Thêm/Sửa) */}
      <Modal
        isOpen={isStatusFormModalOpen}
        onClose={() => { setIsStatusFormModalOpen(false); setStatusErrors({}); }}
        title={statusModalMode === 'add' ? "Thêm trạng thái mới" : "Chỉnh sửa trạng thái"}
        maxWidth={isStatusFormModalMaximized ? "max-w-full" : "max-w-md"}
        isMaximized={isStatusFormModalMaximized}
        onMaximizeToggle={toggleStatusFormModalMaximize}
      >
        <form onSubmit={handleSaveStatus} className={`space-y-6 ${isStatusFormModalMaximized ? 'flex-1 overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Tên trạng thái mới</label>
            <input
              type="text"
              value={currentStatus.name}
              onChange={handleStatusInputChangeSub}
              className={`w-full border ${statusErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm`}
              placeholder="Nhập tên trạng thái (VD: Đang chạy, Đang dừng...)"
              autoFocus={window.innerWidth >= 768}
            />
            {statusErrors.name && <p className="text-red-500 text-xs mt-1 font-medium">{statusErrors.name}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => { setIsStatusFormModalOpen(false); setStatusErrors({}); }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
            >
              {statusModalMode === 'add' ? 'Thêm mới' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm & Notification */}
      <CustomConfirm
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' })}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type === 'export' ? 'success' : 'danger'}
      />
      <AppNotification isOpen={notification.isOpen} message={notification.message} type={notification.type} onClose={() => setNotification({ ...notification, isOpen: false })} />
    </div >
  );
};
