import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus, FileDown, ChevronDown, Trash2, FileUp } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect } from '../customComponent/customComponent';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../controller/warehousesController';
import { getWarehouseTypes, createWarehouseType, updateWarehouseType, deleteWarehouseType } from '../controller/warehouseTypesController';
import { getWarehouseLocations, createWarehouseLocation, updateWarehouseLocation, deleteWarehouseLocation } from '../controller/warehouseLocationsController';
import { getWarehouseRacks } from '../controller/warehouseRacksController';
import { getWarehouseBins } from '../controller/warehouseBinsController';
import { getWarehouseStatuses, createWarehouseStatus, updateWarehouseStatus, deleteWarehouseStatus } from '../controller/warehouseStatusesController';

export const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [types, setTypes] = useState([]);
  const [sections, setSections] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ type: '', available: 1, location: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  const [openLocationMenuId, setOpenLocationMenuId] = useState(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [openTypeMenuId, setOpenTypeMenuId] = useState(null);
  const [typeMenuSearchQuery, setTypeMenuSearchQuery] = useState('');

  const [isTypeMgmtModalOpen, setIsTypeMgmtModalOpen] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');
  const [typeForm, setTypeForm] = useState({ id: null, name: '' });
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

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [whData, typeData, locationData, rackData, binData, statusData] = await Promise.all([
        getWarehouses(),
        getWarehouseTypes(),
        getWarehouseLocations(),
        getWarehouseRacks(),
        getWarehouseBins(),
        getWarehouseStatuses(),
      ]);
      setWarehouses(whData.map(w => ({ ...w, id: w.id || w.ID })));
      setTypes(typeData.map(t => ({ value: t.id || t.ID, label: t.name || t.Name })));
      setStatuses(statusData.map(s => ({ value: s.id || s.ID, label: s.name || s.Name })));

      setRawRacks(rackData.map(r => ({ value: r.id || r.ID, label: r.name || r.Name })));
      setRawBins(binData.map(b => ({ value: b.id || b.ID, label: b.name || b.Name })));
      setRawLocations(locationData.map(l => ({ ...l, id: l.id || l.ID })));

      setSections(locationData.map(l => {
        const rackObj = rackData.find(r => String(r.id || r.ID) === String(l.racks || l.Racks));
        const rackName = rackObj ? (rackObj.name || rackObj.Name) : (l.racks || l.Racks);
        const binObj = binData.find(b => String(b.id || b.ID) === String(l.bin || l.Bin));
        const binName = binObj ? (binObj.name || binObj.Name) : (l.bin || l.Bin);
        return {
          value: l.id || l.ID,
          label: `Kệ ${rackName} - Tầng ${l.level || l.Level} - Ô ${binName}`
        };
      }));
      setSelectedWarehouseIds([]); // Clear selections after data refresh
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
      setOpenTypeMenuId(null);
      setMenuSearchQuery('');
      setTypeMenuSearchQuery('');
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

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

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ type: '', available: 1, location: '' });
    setIsModalOpen(true);
  };

  const handleEditItem = (item) => {
    setModalMode('edit');
    setCurrentEditingItem({
      ...item,
      type: item.type || item.Type,
      available: item.available || item.Available,
      location: item.location || item.Location
    });
    setIsModalOpen(true);
  };

  const handleSelectAllWarehouses = (e) => {
    if (e.target.checked) {
      setSelectedWarehouseIds(warehouses.map(wh => wh.id));
    } else {
      setSelectedWarehouseIds([]);
    }
  };

  const handleSelectWarehouse = (id) => {
    setSelectedWarehouseIds(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(warehouseId => warehouseId !== id)
        : [...prevSelected, id]
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
  };

  const handleOpenTypeEdit = (mode, type = null) => {
    setTypeModalMode(mode);
    setTypeForm(type ? { id: type.value, name: type.label } : { id: null, name: '' });
    setIsTypeEditModalOpen(true);
    setIsTypeEditMaximized(false);
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
    { header: 'STT', render: (_, { index }) => index },
    { header: 'Tên loại kho', render: (row) => <span className="font-bold text-gray-700">{row.label}</span> },
    {
      header: 'Hành động',
      className: 'text-right pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleOpenTypeEdit('edit', row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors">Sửa</button>
          <button
            onClick={() => setConfirmModal({
              isOpen: true,
              id: row.value,
              type: 'deleteType',
              title: 'Xác nhận xóa',
              message: `Bạn có chắc chắn muốn xóa loại kho "${row.label}"?`
            })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
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
      Available: parseInt(warehouse.available || warehouse.Available),
      Location: parseInt(newLocationId)
    };

    try {
      await updateWarehouse(warehouse.id, payload);
      setWarehouses(prev => prev.map(w => w.id === warehouse.id ? { ...w, location: parseInt(newLocationId), Location: parseInt(newLocationId) } : w));
      setOpenLocationMenuId(null);
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
      Available: parseInt(warehouse.available || warehouse.Available),
      Location: parseInt(warehouse.location || warehouse.Location)
    };

    try {
      await updateWarehouse(warehouse.id, payload);
      setWarehouses(prev => prev.map(w => w.id === warehouse.id ? {
        ...w,
        type: parseInt(newTypeId),
        Type: parseInt(newTypeId)
      } : w));
      showNotification("Cập nhật loại kho thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật loại kho.", "error");
    }
  };

  const handleOpenLocEdit = (mode, loc = null) => {
    setLocModalMode(mode);
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
      header: 'Ô (Bin)',
      render: (row) => rawBins.find(b => String(b.value) === String(row.bin || row.Bin))?.label || 'N/A'
    },
    {
      header: 'Kệ (Rack)',
      render: (row) => <span className="font-bold text-blue-600">{rawRacks.find(r => String(r.value) === String(row.racks || row.Racks))?.label || 'N/A'}</span>
    },
    {
      header: 'Tầng (Level)',
      render: (row) => `Tầng ${row.level || row.Level}`
    },
    {
      header: 'Hành động',
      className: 'text-right pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleOpenLocEdit('edit', row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors">Sửa</button>
          <button
            onClick={() => setLocConfirmModal({ isOpen: true, id: row.id || row.ID })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
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
    const payload = {
      ID: currentEditingItem.id || 0,
      Type: parseInt(currentEditingItem.type),
      Available: parseInt(currentEditingItem.available),
      Location: parseInt(currentEditingItem.location)
    };

    try {
      if (modalMode === 'add') {
        await createWarehouse(payload);
        showNotification("Thêm vị trí kho thành công!");
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

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách nhà kho');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Loại kho', key: 'type', width: 20 },
        { header: 'Vị trí (Phân xưởng)', key: 'location', width: 25 },
        { header: 'Số lượng tối đa', key: 'available', width: 20 },
      ];

      filteredData.forEach((w, index) => {
        worksheet.addRow({
          stt: index + 1,
          type: types.find(t => String(t.value) === String(w.type || w.Type))?.label || 'N/A',
          available: (w.available || w.Available) === 1 ? 'Trống' : 'Có hàng',
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
        setWarehouses(prev => prev.filter(w => w.id !== confirmModal.id));
        showNotification("Xóa vị trí kho thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    } else if (confirmModal.type === 'bulk-delete-warehouses') {
      try {
        await deleteWarehouse(confirmModal.id); // Assuming deleteWarehouse can handle an array of IDs
        setWarehouses(prevWarehouses => prevWarehouses.filter(wh => !confirmModal.id.includes(wh.id)));
        setSelectedWarehouseIds([]); // Clear selections after deleting
        showNotification(`Xóa ${confirmModal.id.length} vị trí kho thành công!`);
      } catch (err) {
        console.error("Error deleting multiple warehouses:", err);
        showNotification("Lỗi khi xóa nhiều vị trí kho.", "error");
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
    // Checkbox column
    { header: 'STT', render: (row, { index }) => index },
    {
      header: 'Loại kho',
      className: 'w-48',
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
              onClick={(e) => {
                e.stopPropagation();
                if (openTypeMenuId !== rowId) setTypeMenuSearchQuery('');
                setOpenTypeMenuId(isOpen ? null : rowId);
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
      className: 'w-64',
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
            onClick={(e) => {
              e.stopPropagation();
              if (openLocationMenuId !== row.id) setMenuSearchQuery('');
              setOpenLocationMenuId(openLocationMenuId === row.id ? null : row.id);
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
      className: 'text-center',
      render: (row) => (
        <span className="font-bold text-gray-700">
          {row.available || row.Available || 0}
        </span>
      )
    },
    {
      header: 'Hành động',
      className: 'text-right pr-3',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={(e) => { e.stopPropagation(); handleEditItem(row); }} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors">Sửa</button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: row.id, type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa vị trí kho này?' }); }}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Danh sách nhà kho</h2>

      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-[280px]">
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

        <div className="flex gap-2">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors">
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button onClick={handleAddItem} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors">
            Thêm mới
          </button>
        </div>
      </div>

      {loading ? <p className="p-4 italic text-gray-500">Đang tải dữ liệu...</p> : <CustomDatatable columns={columns} data={filteredData} />}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? 'Thêm nhà kho mới' : 'Chỉnh sửa nhà kho'} isMaximized={isModalMaximized} onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}>
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTypeMgmtModalOpen(true)}
              className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-[11px] font-bold underline z-10"
            >
              hiệu chỉnh
            </button>
            <CustomSelect label="Loại kho" options={types} value={currentEditingItem?.type || ''} onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, type: e.target.value })} isModalMaximized={isModalMaximized} />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLocMgmtOpen(true)}
              className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-[11px] font-bold underline z-10"
            >
              hiệu chỉnh
            </button>
            <CustomSelect label="Vị trí chi tiết" options={sections} value={currentEditingItem?.location || ''} onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, location: e.target.value })} isModalMaximized={isModalMaximized} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Số lượng tối đa</label>
            <input
              type="number"
              min="0"
              value={currentEditingItem?.available || 0}
              onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, available: e.target.value })}
              className={`w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
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
            <button onClick={() => handleOpenTypeEdit('add')} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors">
              <Plus size={16} /> Thêm loại kho
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
              <Plus size={16} /> Thêm vị trí
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
        onClose={() => { setIsTypeEditModalOpen(false); setIsTypeEditMaximized(false); }}
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

      {/* Modal Thêm/Sửa Vị trí kho */}
      <Modal
        isOpen={isLocEditModalOpen}
        onClose={() => { setIsLocEditModalOpen(false); setIsLocEditMaximized(false); }}
        title={locModalMode === 'add' ? 'Thêm vị trí mới' : 'Sửa vị trí'}
        maxWidth={isLocEditMaximized ? "max-w-full" : "max-w-xl"}
        isMaximized={isLocEditMaximized}
        onMaximizeToggle={() => setIsLocEditMaximized(!isLocEditMaximized)}
      >
        <form onSubmit={handleLocSubmit} className="space-y-4">
          <CustomSelect
            label="Ô (Bin)"
            options={rawBins}
            value={currentEditingLoc.bin || ''}
            onChange={(e) => setCurrentEditingLoc({ ...currentEditingLoc, bin: e.target.value })}
            isModalMaximized={isLocEditMaximized}
          />
          <CustomSelect
            label="Kệ (Rack)"
            options={rawRacks}
            value={currentEditingLoc.racks || ''}
            onChange={(e) => setCurrentEditingLoc({ ...currentEditingLoc, racks: e.target.value })}
            isModalMaximized={isLocEditMaximized}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Tầng (Level)</label>
            <input
              type="number"
              value={currentEditingLoc.level || ''}
              onChange={(e) => setCurrentEditingLoc({ ...currentEditingLoc, level: e.target.value })}
              className={`w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm ${isLocEditMaximized ? 'p-2' : 'p-1.5'}`}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsLocEditModalOpen(false); setIsLocEditMaximized(false); }} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
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
