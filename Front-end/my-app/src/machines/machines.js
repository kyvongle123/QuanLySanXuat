import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Search, Plus, ChevronDown, FileDown } from 'lucide-react';
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

// Component Searchable Select tùy chỉnh dành riêng cho các ô trong bảng
const SearchableSelect = ({ value, options, onChange, placeholder = "Tìm...", className, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectRef = useRef(null);

  // Logic lắng nghe click bên ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    // Thêm listener khi component mount
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const filteredOptions = options.filter(opt =>
    opt.label?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={selectRef}>
      {/* Ô hiển thị giá trị hiện tại */}
      <div 
        onClick={(e) => { 
          if (disabled) return;
          e.stopPropagation(); 
          setIsOpen(!isOpen); 
        }} 
        className={className || "bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg p-1 pr-7 cursor-pointer font-medium flex justify-between items-center min-h-[26px] hover:border-blue-400 transition-all shadow-sm"}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : '-- Chọn --'}</span>
        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
          <ChevronDown size={14} />
        </div>
      </div>
      
      {isOpen && (
          <div className="absolute z-[70] mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden min-w-[180px] left-0 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="p-1.5 border-b bg-gray-50 sticky top-0 z-10">
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
            <div className="max-h-40 overflow-y-auto custom-scrollbar">
              {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                <div key={opt.value} onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); setSearch(''); }} className={`p-2 text-xs hover:bg-blue-50 cursor-pointer transition-colors ${String(opt.value) === String(value) ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700'}`}>
                  {opt.label}
                </div>
              )) : <div className="p-3 text-xs text-gray-400 italic text-center">Không có kết quả</div>}
            </div>
          </div>
      )}
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

  // State thông báo và xác nhận xóa
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  
  // State quản lý Modal Danh sách Loại máy
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  
  // State MỚI: Quản lý Modal Form (Thêm/Sửa) Loại máy
  const [isTypeFormModalOpen, setIsTypeFormModalOpen] = useState(false);
  const [typeModalMode, setTypeModalMode] = useState('add'); // 'add' hoặc 'edit'
  const [currentType, setCurrentType] = useState({ name: '' });
  
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
      setIsStatusFormModalOpen(true);
    };
  
    // Hàm mở Modal chỉnh sửa
    const handleOpenEditStatus = (status) => {
      setCurrentStatus(status);
      setStatusModalMode('edit');
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
    { header: 'STT', render: (_, { index }) => index },
    { header: 'Tên loại máy', accessor: 'name', className: 'font-bold text-blue-600' },
    { header: 'Hành động', className: 'text-right pr-4', render: (row) => (
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
    )}
  ];


  // --- Logic quản lý Trạng thái máy ---
  const handleOpenStatusManagement = () => {
    setStatusModalMode('list');
    setIsStatusModalOpen(true);
  };

  const handleStatusInputChangeSub = (e) => {
    setCurrentStatus({ ...currentStatus, name: e.target.value });
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
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
    { header: 'Tên trạng thái', accessor: 'name', className: 'font-bold text-blue-600' },
    { header: 'Hành động', className: 'text-right pr-4', render: (row) => (
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
    )}
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
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentMachine(prev => ({ ...prev, [name]: value }));
  };

  // Xử lý Lưu hoặc Cập nhật
  const handleSubmit = async (e) => {
    e.preventDefault();
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
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
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
    { header: 'STT', render: (_, { index }) => index },
    { header: 'Mã máy', accessor: 'machineCode', className: 'font-bold text-blue-700' },
    { 
      header: 'Loại máy', 
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
    { header: 'OEE Target', render: (row) => <span className="font-bold text-orange-600">{row.oeeTarget}%</span> },
    { 
      header: 'Giờ chạy', 
      render: (row) => <span>{row.totalRunningHours?.toLocaleString()} h</span> 
    },
    {
      header: 'Hành động',
      className: 'text-right pr-4',
      render: (row) => (
        <div className="flex gap-2 justify-end whitespace-nowrap">
          <button onClick={() => handleOpenModal('edit', row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95">Sửa</button>
          <button onClick={() => handleDeleteRequest(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95">Xóa</button>
        </div>
      ),
    }
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Danh sách máy</h2>

      <div className="flex justify-between items-center mb-4 gap-4">
        {/* Thanh Tìm kiếm */}
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã máy"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleRequestExportExcel}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors"
          >
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button 
            onClick={() => handleOpenModal('add')}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors"
          >
            Thêm máy mới
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-4 italic text-gray-500">Đang tải danh sách máy...</p>
      ) : (
        <CustomDatatable columns={columns} data={filteredData} />
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm máy mới' : modalMode === 'edit' ? 'Cập nhật máy' : 'Thông tin chi tiết'}
        maxWidth={isModalMaximized ? "max-w-full" : "max-w-4xl"}
        isMaximized={isModalMaximized}
        onMaximizeToggle={toggleModalMaximize}
      >
        <form onSubmit={handleSubmit} className={`flex flex-col ${isModalMaximized ? 'h-[75vh]' : ''}`}>
          <div className={`space-y-5 ${isModalMaximized ? 'flex-1 overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Mã máy</label>
              <input type="text" name="machineCode" value={currentMachine?.machineCode || ''} onChange={handleInputChange} disabled={modalMode === 'view'} className="w-full border border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-50 h-[38px] text-sm bg-white" placeholder="VD: CNC-V1" required />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Loại máy</label>
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
                  className="w-full border border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-50 h-[38px] text-sm bg-white flex items-center justify-between cursor-pointer"
                  placeholder="Tìm loại máy..."
                />
                </div>
              </div>
            
            <DateInput label="Ngày sản xuất" name="productionDate" value={currentMachine?.productionDate || ''} onChange={handleInputChange} disabled={modalMode === 'view'} />
            <DateInput label="Ngày đưa vào sử dụng" name="commissioningDate" value={currentMachine?.commissioningDate || ''} onChange={handleInputChange} disabled={modalMode === 'view'} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Tổng số giờ đã chạy</label>
              <input type="number" name="totalRunningHours" value={currentMachine?.totalRunningHours || 0} onChange={handleInputChange} disabled={modalMode === 'view'} className="w-full border border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-50 h-[38px] text-sm" />
            </div>
            
            <DateInput label="Ngày bảo trì gần nhất" name="lastMaintainance" value={currentMachine?.lastMaintainance || ''} onChange={handleInputChange} disabled={modalMode === 'view'} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Trạng thái</label>
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
                  className="w-full border border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-50 h-[38px] text-sm bg-white flex items-center justify-between cursor-pointer"
                  placeholder="Tìm trạng thái..."
                />
                </div>
              </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Mục tiêu hiệu suất (%)</label>
              <input type="number" step="0.1" name="oeeTarget" value={currentMachine?.oeeTarget || 0} onChange={handleInputChange} disabled={modalMode === 'view'} className="w-full border border-gray-300 rounded-lg px-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-50 h-[38px] text-sm" />
            </div>
          </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-auto">
            <button type="button" onClick={handleCloseModal} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors">
              {modalMode === 'view' ? 'Đóng' : 'Hủy bỏ'}
            </button>
            {modalMode !== 'view' && (
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-medium shadow-md transition-all active:scale-95">
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
              <Plus size={18} /> Thêm mới
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
        onClose={() => setIsTypeFormModalOpen(false)}
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
              onChange={(e) => setCurrentType({ ...currentType, name: e.target.value })} 
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              placeholder="Nhập tên loại máy (VD: Máy CNC, Máy In...)"
              required 
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              onClick={() => setIsTypeFormModalOpen(false)} 
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
              <Plus size={18} /> Thêm mới
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
        onClose={() => setIsStatusFormModalOpen(false)}
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              placeholder="Nhập tên trạng thái (VD: Đang chạy, Đang dừng...)"
              required 
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              type="button" 
              onClick={() => setIsStatusFormModalOpen(false)} 
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
    </div>
  );
};