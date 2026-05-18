import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, FileDown, Trash2, ChevronDown, FileUp } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect } from '../customComponent/customComponent';
import { getWarehouseLocations, createWarehouseLocation, updateWarehouseLocation, deleteWarehouseLocation } from '../controller/warehouseLocationsController';
import { getWarehouseRacks, createWarehouseRack, updateWarehouseRack, deleteWarehouseRack } from '../controller/warehouseRacksController';
import { getWarehouseBins, createWarehouseBin, updateWarehouseBin, deleteWarehouseBin } from '../controller/warehouseBinsController'; // Import all CRUD functions for bins
import { LuSquarePen } from "react-icons/lu";

export const WarehouseLocations = () => {
  const [locations, setLocations] = useState([]);
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState([]); // New state for selected locations
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ bin: '', racks: '', level: 1 });
  const [modalErrors, setModalErrors] = useState({});
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  const [openRackMenuId, setOpenRackMenuId] = useState(null);
  const [openRackMenuAnchorKey, setOpenRackMenuAnchorKey] = useState(null);
  const [rackMenuRect, setRackMenuRect] = useState(null);
  const rackMenuAnchorRefs = useRef({});
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  // Quản lý Ô (Bins)
  const [isBinMgmtOpen, setIsBinMgmtOpen] = useState(false);
  const [binSearchTerm, setBinSearchTerm] = useState('');
  const [isBinEditModalOpen, setIsBinEditModalOpen] = useState(false);
  const [binModalMode, setBinModalMode] = useState('add');
  const [currentEditingBin, setCurrentEditingBin] = useState({ name: '' }); // Ensure ID is handled if editing
  const [binConfirmModal, setBinConfirmModal] = useState({ isOpen: false, id: null });

  // Quản lý Kệ (Racks) - Tương tự như Bins
  const [isRackMgmtOpen, setIsRackMgmtOpen] = useState(false);
  const [rackSearchTerm, setRackSearchTerm] = useState('');
  const [isRackEditModalOpen, setIsRackEditModalOpen] = useState(false);
  const [rackModalMode, setRackModalMode] = useState('add');
  const [currentEditingRack, setCurrentEditingRack] = useState({ name: '' });
  const [rackErrors, setRackErrors] = useState({});
  const [rackConfirmModal, setRackConfirmModal] = useState({ isOpen: false, id: null });
  const [isRackMgmtMaximized, setIsRackMgmtMaximized] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [locationData, rackData, binData] = await Promise.all([
        getWarehouseLocations(),
        getWarehouseRacks(),
        getWarehouseBins()
      ]);
      setLocations(locationData.map(l => ({ ...l, id: l.id || l.ID })));
      setRacks(rackData.map(r => ({ value: r.id || r.ID, label: r.name || r.Name, ...r }))); // Spread ...r to keep full object for editing
      setBins(binData.map(b => ({ value: b.id || b.ID, label: b.name || b.Name, ...b })));
    } catch (err) {
      showNotification("Lỗi khi tải dữ liệu vị trí kho", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleGlobalClick = () => {
      setOpenRackMenuId(null);
      setOpenRackMenuAnchorKey(null);
      setRackMenuRect(null);
      setMenuSearchQuery('');
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  useEffect(() => {
    if (!openRackMenuId || !openRackMenuAnchorKey) return;

    const updateRackMenuRect = () => {
      const anchor = rackMenuAnchorRefs.current[openRackMenuAnchorKey];
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setRackMenuRect({
        left: rect.left,
        top: rect.bottom + 4,
        width: Math.max(rect.width, 200),
      });
    };

    updateRackMenuRect();
    window.addEventListener('resize', updateRackMenuRect);
    window.addEventListener('scroll', updateRackMenuRect, true);

    return () => {
      window.removeEventListener('resize', updateRackMenuRect);
      window.removeEventListener('scroll', updateRackMenuRect, true);
    };
  }, [openRackMenuId, openRackMenuAnchorKey]);

  const filteredData = useMemo(() => {
    return locations.filter(l => {
      const rackLabel = racks.find(r => String(r.value) === String(l.racks || l.Racks))?.label || '';
      const binLabel = bins.find(b => String(b.value) === String(l.bin || l.Bin))?.label || '';
      return (
        rackLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        binLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(l.level || l.Level).includes(searchTerm.toLowerCase())
      );
    });
  }, [locations, searchTerm, racks, bins]);

  // Logic cho Bin Management
  const filteredBins = useMemo(() => {
    return bins.filter(b => b.label.toLowerCase().includes(binSearchTerm.toLowerCase()));
  }, [bins, binSearchTerm]);

  const handleOpenBinEdit = (mode, bin = null) => {
    setBinModalMode(mode);
    setCurrentEditingBin(bin || { name: '' });
    setIsBinEditModalOpen(true);
  };

  const handleBinSubmit = async (e) => {
    e.preventDefault();
    try {
      if (binModalMode === 'add') {
        await createWarehouseBin({ Name: currentEditingBin.name });
        showNotification("Thêm ô mới thành công!");
      } else {
        await updateWarehouseBin(currentEditingBin.id, { ID: currentEditingBin.id, Name: currentEditingBin.name });
        showNotification("Cập nhật ô thành công!");
      }
      const binData = await getWarehouseBins();
      setBins(binData.map(b => ({ value: b.id || b.ID, label: b.name || b.Name, ...b })));
      setIsBinEditModalOpen(false);
    } catch (err) {
      showNotification("Lỗi khi lưu thông tin ô.", "error");
    }
  };

  const handleBinDelete = async () => {
    try {
      await deleteWarehouseBin(binConfirmModal.id);
      setBins(prev => prev.filter(b => b.value !== binConfirmModal.id));
      showNotification("Xóa ô thành công!");
      setBinConfirmModal({ isOpen: false, id: null });
    } catch (err) {
      showNotification("Không thể xóa ô này vì có thể đang được sử dụng.", "error");
    }
  };

  // Xử lý chọn/bỏ chọn vị trí kho
  const handleSelectAllLocations = (e) => {
    if (e.target.checked) {
      setSelectedLocationIds(locations.map(loc => loc.id));
    } else {
      setSelectedLocationIds([]);
    }
  };

  const handleSelectLocation = (id) => {
    setSelectedLocationIds(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(locationId => locationId !== id)
        : [...prevSelected, id]
    );
  };

  // Hàm để refetch dữ liệu sau khi thêm/sửa/xóa
  const refreshData = async () => {
    await fetchData();
    setSelectedLocationIds([]); // Clear selections after data refresh
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
      setOpenRackMenuId(null);
      setOpenRackMenuAnchorKey(null);
      setRackMenuRect(null);
      showNotification("Cập nhật kệ thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật kệ.", "error");
    }
  };

  const toggleRackMenu = (e, rowId, anchorKey) => {
    e.stopPropagation();
    const isSameMenuOpen = openRackMenuId === rowId && openRackMenuAnchorKey === anchorKey;

    if (isSameMenuOpen) {
      setOpenRackMenuId(null);
      setOpenRackMenuAnchorKey(null);
      setRackMenuRect(null);
      return;
    }

    setMenuSearchQuery('');
    setOpenRackMenuId(rowId);
    setOpenRackMenuAnchorKey(anchorKey);

    const rect = e.currentTarget.getBoundingClientRect();
    setRackMenuRect({
      left: rect.left,
      top: rect.bottom + 4,
      width: Math.max(rect.width, 200),
    });
  };

  const renderRackMenu = (row, anchorKey) => {
    if (openRackMenuId !== row.id || openRackMenuAnchorKey !== anchorKey || !rackMenuRect) return null;

    return createPortal(
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed bg-white rounded-md shadow-2xl z-[9999] border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal"
        style={{
          left: rackMenuRect.left,
          top: rackMenuRect.top,
          width: rackMenuRect.width,
        }}
      >
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
              onClick={() => handleRackChange(row, r.value)}
              className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.racks || row.Racks) === String(r.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <span className="block w-full !whitespace-normal break-words leading-tight">{r.label}</span>
            </button>
          ))}
        </div>
      </div>,
      document.body
    );
  };

  const binColumns = [
    { header: 'STT', render: (_, { index }) => index },
    { header: 'Tên Ô', accessor: 'label' },
    {
      header: 'Hành động',
      className: 'text-right pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => handleOpenBinEdit('edit', row)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >Sửa</button>
          <button
            onClick={() => setBinConfirmModal({ isOpen: true, id: row.value })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >Xóa</button>
        </div>
      )
    }
  ];

  // Logic cho Rack Management (Tương tự Bin Management)
  const filteredRacks = useMemo(() => {
    return racks.filter(r => r.label.toLowerCase().includes(rackSearchTerm.toLowerCase()));
  }, [racks, rackSearchTerm]);

  const handleOpenRackEdit = (mode, rack = null) => {
    setRackModalMode(mode);
    setCurrentEditingRack(rack || { name: '' });
    setRackErrors({});
    setIsRackEditModalOpen(true);
  };

  const handleRackSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!currentEditingRack?.name?.trim()) {
      errors.name = "Bắt buộc nhập Tên kệ";
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

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ bin: '', racks: '', level: '' });
    setModalErrors({});
    setIsModalOpen(true);
  };

  const handleEditItem = (location) => {
    setModalMode('edit');
    setCurrentEditingItem({
      ...location,
      bin: location.bin || location.Bin,
      racks: location.racks || location.Racks,
      level: location.level || location.Level
    });
    setModalErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
    setModalErrors({});
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (currentEditingItem?.bin === '' || currentEditingItem?.bin === null || currentEditingItem?.bin === undefined) {
      errors.bin = "Bắt buộc nhập Ô";
    }

    if (!currentEditingItem?.racks) {
      errors.racks = "Bắt buộc nhập Kệ (Rack)";
    }

    if (currentEditingItem?.level === '' || currentEditingItem?.level === null || currentEditingItem?.level === undefined) {
      errors.level = "Bắt buộc nhập Tầng (Level)";
    }

    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      return;
    }

    setModalErrors({});

    const payload = {
      ID: currentEditingItem.id || 0,
      Bin: parseInt(currentEditingItem.bin),
      Racks: parseInt(currentEditingItem.racks),
      Level: parseInt(currentEditingItem.level)
    };

    try {
      if (modalMode === 'add') {
        await createWarehouseLocation(payload);
        showNotification("Thêm vị trí kho thành công!");
      } else {
        await updateWarehouseLocation(currentEditingItem.id, payload);
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

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách vị trí kho');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Ô (Bin)', key: 'bin', width: 20 },
        { header: 'Kệ (Rack)', key: 'racks', width: 20 },
        { header: 'Tầng (Level)', key: 'level', width: 15 },
      ];

      filteredData.forEach((loc, index) => {
        worksheet.addRow({
          stt: index + 1,
          bin: bins.find(b => String(b.value) === String(loc.bin || loc.Bin))?.label || 'N/A',
          racks: racks.find(r => String(r.value) === String(loc.racks || loc.Racks))?.label || 'N/A',
          level: loc.level || loc.Level,
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
      saveAs(new Blob([buffer]), `Danh sách vị trí kho.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'bulk-delete-locations') { // New type for bulk delete
      try {
        await deleteWarehouseLocation(confirmModal.id); // confirmModal.id will be an array of IDs
        setLocations(prevLocations => prevLocations.filter(loc => !confirmModal.id.includes(loc.id)));
        setSelectedLocationIds([]); // Clear selections after deleting
        showNotification(`Xóa ${confirmModal.id.length} vị trí kho thành công!`);
      } catch (err) {
        console.error("Error deleting multiple warehouse locations:", err);
        showNotification("Lỗi khi xóa nhiều vị trí kho.", "error");
      }
    } else if (confirmModal.type === 'export') {
      await handleExportExcel();
    } else if (confirmModal.type === 'delete') {
      try {
        await deleteWarehouseLocation(confirmModal.id);
        setLocations(prev => prev.filter(l => l.id !== confirmModal.id));
        showNotification("Xóa vị trí kho thành công!");
        // No need to clear selectedLocationIds here, as it's individual delete
        // but if it was part of a multi-select, it would be handled by bulk-delete
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const columns = [
    // Checkbox column
    { header: 'STT', className: 'w-[30px] sm:w-[50px] !px-2 sm:!px-4 text-center', headerCellClassName: 'text-[10px] sm:text-sm', render: (row, { index }) => index },
    {
      header: 'Ô (Bin)',
      className: 'text-[11px] sm:text-sm !px-2 sm:!px-6',
      headerCellClassName: 'text-[10px] sm:text-sm',
      render: (row) => `${row.bin || row.Bin}`
    },
    {
      header: 'Kệ (Rack)',
      className: 'w-36 sm:w-48 !px-2 sm:!px-6',
      headerCellClassName: 'text-[10px] sm:text-sm',
      render: (row) => (
        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsRackMgmtOpen(true); }}
            className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
          >
            hiệu chỉnh
          </button>
          <button
            ref={(el) => { rackMenuAnchorRefs.current[`rack-${row.id}`] = el; }}
            onClick={(e) => {
              toggleRackMenu(e, row.id, `rack-${row.id}`);
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

          {renderRackMenu(row, `rack-${row.id}`)}

          {false && openRackMenuId === row.id && (
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
      )
    },
    {
      header: 'Tầng (Level)',
      className: 'text-[11px] sm:text-sm !px-2 sm:!px-6',
      headerCellClassName: 'text-[10px] sm:text-sm',
      render: (row) => `Tầng ${row.level || row.Level}`
    },
    {
      header: <div className="flex justify-center items-center w-full text-[10px] sm:text-sm">Hành động</div>,
      className: 'text-center w-[100px] sm:w-[180px]',
      render: (row) => (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEditItem(row); }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-all active:scale-95 flex items-center gap-1.5"
            title="Sửa"
          >
            <span>Sửa</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: row.id, type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa vị trí kho này?' }); }}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-xs transition-all active:scale-95 flex items-center gap-1.5"
            title="Xóa"
          >
            <span>Xóa</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-2xl font-bold mb-4">Danh sách vị trí kho</h2>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 gap-4">
        {/* Thanh tìm kiếm */}
        <div className="relative w-full lg:max-w-[260px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo Ô, Kệ hoặc Tầng..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm outline-none transition-all"
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
            Thêm vị trí mới
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-4 italic text-gray-500">Đang tải dữ liệu...</p>
      ) : (
        <CustomDatatable
          columns={columns}
          data={filteredData}
          bodyCellClassName="!py-2 lg:!py-3"
        />
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? 'Thêm vị trí kho mới' : 'Chỉnh sửa vị trí kho'} isMaximized={isModalMaximized} onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)} maxWidth="max-w-xl">
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="relative">
            <label className={`text-xs font-medium ${modalErrors.bin ? 'text-red-600' : 'text-gray-700'}`}>Ô</label>
            <input
              type="number"
              value={currentEditingItem?.bin ?? ''}
              onChange={(e) => { setModalErrors(prev => ({ ...prev, bin: '' })); setCurrentEditingItem({ ...currentEditingItem, bin: e.target.value }); }}
              className={`w-full border ${modalErrors.bin ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm p-1.5 focus:ring-2 outline-none ${isModalMaximized ? 'text-base' : 'text-sm'}`}
            />
            {modalErrors.bin && <p className="text-xs font-medium text-red-600">{modalErrors.bin}</p>}
          </div>

          {/* Nút hiệu chỉnh cho Kệ (Rack) */}
          <div className="relative">
            <div className="absolute right-0 -top-1 z-20">
              <button type="button" onClick={() => setIsRackMgmtOpen(true)} className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline transition-colors p-1">
                hiệu chỉnh
              </button>
            </div>
            <CustomSelect label="Kệ (Rack)" options={racks} value={currentEditingItem?.racks || ''} onChange={(e) => { setModalErrors(prev => ({ ...prev, racks: '' })); setCurrentEditingItem({ ...currentEditingItem, racks: e.target.value }); }} isModalMaximized={isModalMaximized} error={!!modalErrors.racks} errorMessage={modalErrors.racks} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${modalErrors.level ? 'text-red-600' : 'text-gray-700'}`}>Tầng (Level)</label>
            <input
              type="number"
              value={currentEditingItem?.level ?? ''}
              onChange={(e) => { setModalErrors(prev => ({ ...prev, level: '' })); setCurrentEditingItem({ ...currentEditingItem, level: e.target.value }); }}
              className={`w-full border ${modalErrors.level ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm p-1.5 focus:ring-2 outline-none ${isModalMaximized ? 'text-base' : 'text-sm'}`}
            />
            {modalErrors.level && <p className="text-xs font-medium text-red-600">{modalErrors.level}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu vị trí</button>
          </div>
        </form>
      </Modal>

      {/* Modal Quản lý danh sách Ô */}
      <Modal isOpen={isBinMgmtOpen} onClose={() => setIsBinMgmtOpen(false)} title="Quản lý danh sách ô của kho" maxWidth="max-w-5xl">
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên ô..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={binSearchTerm}
                onChange={(e) => setBinSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => handleOpenBinEdit('add')} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors">
              <Plus size={16} /> Thêm ô
            </button>
          </div>
          <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg shadow-sm">
            <CustomDatatable columns={binColumns} data={filteredBins} />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Tên Ô */}
      <Modal isOpen={isBinEditModalOpen} onClose={() => setIsBinEditModalOpen(false)} title={binModalMode === 'add' ? 'Thêm ô mới' : 'Sửa tên ô'} maxWidth="max-w-sm">
        <form onSubmit={handleBinSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Tên Ô</label>
            <input
              type="text"
              value={currentEditingBin?.name || ''}
              onChange={(e) => setCurrentEditingBin({ ...currentEditingBin, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsBinEditModalOpen(false)} className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-200">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-blue-700">Lưu</button>
          </div>
        </form>
      </Modal>

      {/* Xác nhận xóa Ô */}
      <CustomConfirm
        isOpen={binConfirmModal.isOpen}
        onClose={() => setBinConfirmModal({ isOpen: false, id: null })}
        onConfirm={handleBinDelete}
        title="Xác nhận xóa ô"
        message="Hành động này không thể hoàn tác nếu ô đang có dữ liệu liên quan."
        type="delete"
      />

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
              onChange={(e) => { setRackErrors(prev => ({ ...prev, name: '' })); setCurrentEditingRack({ ...currentEditingRack, name: e.target.value }); }}
              className={`w-full border ${rackErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md p-2 text-sm focus:ring-2 outline-none`}
              autoFocus
            />
            {rackErrors.name && <p className="text-xs font-medium text-red-600">{rackErrors.name}</p>}
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

      <CustomConfirm isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, id: null })} onConfirm={handleConfirmAction} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} />
      <AppNotification isOpen={notification.isOpen} message={notification.message} type={notification.type} onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
};
