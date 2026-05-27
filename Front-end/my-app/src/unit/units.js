import { useEffect, useState, useMemo } from 'react';
import { Search, FileDown, FileUp, Trash2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal } from '../customComponent/customComponent';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../controller/unitsController';
import { FaRegSquare, FaRegSquareMinus } from "react-icons/fa6";
import { MdAdd } from "react-icons/md";

const API_BASE_URL = 'https://quanlysanxuat-production.up.railway.app/api';

export const Units = () => {
  const [units, setUnits] = useState([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingUnit, setCurrentEditingUnit] = useState({ id: '', unitCode: '', name: '' });
  const [unitErrors, setUnitErrors] = useState({}); // New state for validation errors
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getUnits();
      setUnits(data);
      setSelectedUnitIds([]);
      setIsBulkSelectMode(false);
    } catch (err) {
      showNotification("Lỗi khi tải dữ liệu đơn vị tính", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return units.filter(unit =>
      unit.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [units, searchTerm]);

  const getEntityId = (entity) => entity?.id || entity?.ID || entity?.Id;

  const handleBulkDelete = () => {
    if (!isBulkSelectMode) {
      setIsBulkSelectMode(true);
      setSelectedUnitIds([]);
      return;
    }

    if (selectedUnitIds.length === 0) {
      setIsBulkSelectMode(false);
      setSelectedUnitIds([]);
      return;
    }

    setConfirmModal({
      isOpen: true,
      id: selectedUnitIds,
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều đơn vị tính',
      message: `Bạn có chắc chắn muốn xóa ${selectedUnitIds.length} đơn vị tính đã chọn không? Hành động này không thể hoàn tác.`
    });
  };

  const handleSelectAllUnits = () => {
    const visibleUnitIds = filteredData.map(unit => getEntityId(unit)).filter(Boolean);
    setSelectedUnitIds(visibleUnitIds);
  };

  const handleClearSelectedUnits = () => {
    setSelectedUnitIds([]);
  };

  const handleToggleSelectUnit = (row) => {
    const rowId = getEntityId(row);
    setSelectedUnitIds(prev => prev.includes(rowId)
      ? prev.filter(id => id !== rowId)
      : [...prev, rowId]
    );
  };

  const handleOpenModal = (mode, unit = null) => {
    setModalMode(mode);
    setCurrentEditingUnit(unit ? { ...unit, id: getEntityId(unit) } : { id: '', unitCode: '', name: '' });
    setUnitErrors({}); // Reset errors when opening modal
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingUnit({ id: '', unitCode: '', name: '' });
    setUnitErrors({}); // Reset errors when closing modal
    setIsModalMaximized(false);
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingUnit(prev => ({ ...prev, [name]: value }));
    if (unitErrors[name]) {
      setUnitErrors(prev => ({ ...prev, [name]: null })); // Clear error when user starts typing
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!currentEditingUnit.name.trim()) {
      errors.name = "Bắt buộc nhập Tên đơn vị";
    }

    if (Object.keys(errors).length > 0) {
      setUnitErrors(errors);
      return;
    }

    setUnitErrors({}); // Clear errors if validation passes

    try {
      if (modalMode === 'add') {
        await createUnit({ Name: currentEditingUnit.name });
        showNotification("Thêm đơn vị tính thành công!");
      } else {
        await updateUnit(currentEditingUnit.id, { ID: currentEditingUnit.id, Name: currentEditingUnit.name });
        showNotification("Cập nhật đơn vị tính thành công!");
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu đơn vị tính.", "error");
    }
  };

  const handleDeleteRequest = (id) => {
    setConfirmModal({
      isOpen: true,
      id,
      type: 'delete',
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa đơn vị tính này không?'
    });
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'delete') {
      try {
        await deleteUnit(confirmModal.id);
        setUnits(prev => prev.filter(unit => unit.id !== confirmModal.id));
        setSelectedUnitIds(prev => prev.filter(id => id !== confirmModal.id));
        showNotification("Xóa đơn vị tính thành công!", "success");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    } else if (confirmModal.type === 'bulkDelete') {
      try {
        await Promise.all(confirmModal.id.map(id => deleteUnit(id)));
        setUnits(prev => prev.filter(unit => !confirmModal.id.includes(getEntityId(unit))));
        setSelectedUnitIds([]);
        setIsBulkSelectMode(false);
        showNotification(`Xóa ${confirmModal.id.length} đơn vị tính thành công!`, "success");
      } catch (err) {
        showNotification("Lỗi khi xóa nhiều đơn vị tính.", "error");
      }
    } else if (confirmModal.type === 'export') {
      await handleExportExcel();
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách đơn vị tính ra tệp Excel không?'
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
    window.location.href = `${API_BASE_URL}/Templates/import/units`;
  };

  const getExcelText = (cell) => {
    const value = cell?.value;
    if (value == null) return '';
    if (typeof value === 'object') {
      if (value.text) return String(value.text).trim();
      if (value.result != null) return String(value.result).trim();
      if (Array.isArray(value.richText)) {
        return value.richText.map(part => part.text || '').join('').trim();
      }
    }
    return String(value).trim();
  };

  const normalizeImportText = (value) => String(value || '').trim().toLowerCase();

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

      const unitMap = new Map(units.map(unit => [
        normalizeImportText(unit.unitCode || unit.UnitCode),
        unit
      ]));
      const importedUnits = [];
      const skippedRows = [];

      const rowNumbers = [];
      worksheet.eachRow({ includeEmpty: false }, (_, rowNumber) => {
        if (rowNumber >= 2) rowNumbers.push(rowNumber);
      });

      for (const rowNumber of rowNumbers) {
        const row = worksheet.getRow(rowNumber);
        try {
          const unitCode = getExcelText(row.getCell(2));
          const unitName = getExcelText(row.getCell(3));

          if (!unitCode && !unitName) continue;

          if (!unitCode) {
            skippedRows.push(`Dòng ${rowNumber}: thiếu Mã đơn vị`);
            continue;
          }

          if (!unitName) {
            skippedRows.push(`Dòng ${rowNumber}: thiếu Tên đơn vị`);
            continue;
          }

          const existingUnit = unitMap.get(normalizeImportText(unitCode));

          if (existingUnit) {
            const updatedUnit = await updateUnit(getEntityId(existingUnit), {
              ID: getEntityId(existingUnit),
              UnitCode: existingUnit.unitCode || existingUnit.UnitCode || unitCode,
              Name: unitName
            });
            const mergedUnit = { ...existingUnit, ...updatedUnit, id: getEntityId(existingUnit), name: unitName };
            importedUnits.push(mergedUnit);
            unitMap.set(normalizeImportText(mergedUnit.unitCode || mergedUnit.UnitCode), mergedUnit);
          } else {
            const createdUnit = await createUnit({
              UnitCode: unitCode || undefined,
              Name: unitName
            });
            const mergedUnit = { ...createdUnit, unitCode: createdUnit.unitCode || unitCode, name: createdUnit.name || unitName };
            importedUnits.push(mergedUnit);
            unitMap.set(normalizeImportText(mergedUnit.unitCode || mergedUnit.UnitCode), mergedUnit);
          }
        } catch (rowError) {
          console.error(`Error importing unit row ${rowNumber}:`, rowError);
          skippedRows.push(`Dòng ${rowNumber}: lỗi khi lưu dữ liệu`);
        }
      }

      if (importedUnits.length > 0) {
        setUnits(prevUnits => {
          const importedMap = new Map(importedUnits.map(unit => [getEntityId(unit), unit]));
          const nextUnits = prevUnits.map(unit => importedMap.get(getEntityId(unit)) || unit);
          const existingIds = new Set(prevUnits.map(unit => getEntityId(unit)));
          importedUnits.forEach(unit => {
            if (!existingIds.has(getEntityId(unit))) nextUnits.push(unit);
          });
          return nextUnits;
        });
      }

      handleCloseImportModal();
      showNotification("Nhập Excel thành công");
      if (skippedRows.length) console.warn("Các dòng không nhập được:", skippedRows);
    } catch (err) {
      console.error("Error importing units from Excel:", err);
      showNotification("Lỗi khi nhập Excel. Vui lòng kiểm tra lại file.", "error");
    } finally {
      setIsImportingExcel(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách đơn vị tính');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Mã đơn vị', key: 'unitCode', width: 20 },
        { header: 'Tên đơn vị', key: 'name', width: 20 },
      ];

      filteredData.forEach((unit, index) => {
        worksheet.addRow({
          stt: index + 1,
          unitCode: unit.unitCode || unit.UnitCode || '',
          name: unit.name,
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
      saveAs(new Blob([buffer]), `Danh sách đơn vị tính.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const columns = [
    { header: 'STT', className: 'w-[40px] text-center !px-1', render: (_, { index }) => index },
    {
      header: 'Mã đơn vị',
      className: 'w-[110px] text-center !px-1 text-gray-700',
      render: (row) => row.unitCode || row.UnitCode || ''
    },
    { header: 'Tên đơn vị', accessor: 'name', className: 'font-medium text-blue-600 !px-1' },
    {
      header: (
        isBulkSelectMode ? (
          <div className="flex w-full items-center justify-center gap-2 text-[10px] sm:text-sm">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAllUnits();
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
                handleClearSelectedUnits();
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
      className: 'text-center pr-2 sm:pr-4 w-[100px] sm:w-[150px]',
      render: (row) => (
        <div className="flex gap-1.5 justify-center">
          {isBulkSelectMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSelectUnit(row);
              }}
              className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-red-50"
              title={selectedUnitIds.includes(getEntityId(row)) ? 'Bỏ chọn' : 'Chọn dòng'}
            >
              {selectedUnitIds.includes(getEntityId(row)) ? (
                <FaRegSquareMinus size={20} className="text-red-600" />
              ) : (
                <FaRegSquare size={20} className="text-gray-400" />
              )}
            </button>
          ) : (
            <>
              <button onClick={() => handleOpenModal('edit', row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95">Sửa</button>
              <button onClick={() => handleDeleteRequest(getEntityId(row))} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95">Xóa</button>
            </>
          )}
        </div>
      ),
    }
  ];

  return (
    <div className="p-2 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Danh sách đơn vị tính</h2>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 gap-4">
        <div className="relative w-full lg:max-w-[300px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên đơn vị..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 w-full lg:w-auto lg:flex lg:flex-wrap">
          <button
            onClick={handleOpenImportModal}
            className="order-1 lg:order-2 w-full lg:w-auto lg:flex-none justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-3 rounded whitespace-nowrap transition-all flex items-center gap-2 text-sm shadow-sm active:scale-95"
          >
            <FileUp size={16} /> Nhập Excel
          </button>
          <button
            onClick={handleRequestExportExcel}
            className="order-2 lg:order-3 w-full lg:w-auto lg:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded whitespace-nowrap transition-all flex items-center gap-2 shadow-sm active:scale-95 text-sm"
          >
            <FileDown size={16} /> Xuất Excel
          </button>
          <button
            onClick={handleBulkDelete}
            className={`order-3 lg:order-1 w-full lg:w-auto lg:flex-none justify-center text-white font-bold py-2.5 px-3 rounded whitespace-nowrap transition-all flex items-center gap-2 shadow-sm text-sm ${selectedUnitIds.length > 0 ? 'bg-red-700 hover:bg-red-700 shadow-md active:scale-95' : 'bg-red-700 hover:bg-red-700'}`}
          >
            <Trash2 size={16} />
            <span className="truncate">Xóa nhiều dòng {selectedUnitIds.length > 0 && `(${selectedUnitIds.length})`}</span>
          </button>
          <button
            onClick={() => handleOpenModal('add')}
            className="order-4 w-full lg:w-auto lg:flex-none justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-3 rounded whitespace-nowrap transition-all flex items-center gap-2 shadow-md active:scale-95 text-sm"
          >
            <MdAdd />
            <span className="lg:hidden">Thêm mới</span>
            <span className="hidden lg:inline">Thêm đơn vị mới</span>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-4 text-gray-500">Đang tải dữ liệu đơn vị...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <CustomDatatable
            columns={columns}
            data={filteredData}
            bodyCellClassName="!py-2 sm:!py-3"
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm đơn vị tính mới' : 'Chỉnh sửa đơn vị tính'}
        maxWidth={isModalMaximized ? "max-w-full" : "max-w-sm"}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Mã đơn vị</label>
            <input
              type="text"
              name="unitCode"
              value={currentEditingUnit?.unitCode || ''}
              disabled
              className="w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 p-2 text-sm text-gray-500 shadow-sm outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Tên đơn vị</label>
            <input
              type="text"
              name="name"
              value={currentEditingUnit?.name || ''}
              onChange={handleModalInputChange}
              className={`w-full border ${unitErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm p-2 focus:ring-2 outline-none text-sm`}
              autoFocus={window.innerWidth >= 768}
            />
            {unitErrors.name && <p className="text-xs font-medium text-red-600">{unitErrors.name}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-1.5 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm font-bold">Lưu</button>
          </div>
        </form>
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
              htmlFor="unit-excel-file"
              className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-blue-600 hover:bg-blue-50"
            >
              <FileUp size={32} className="mb-3 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                {selectedImportFile ? selectedImportFile.name : 'Chọn file Excel để nhập'}
              </span>
              <span className="mt-1 text-xs text-gray-500">Hỗ trợ .xlsx</span>
              <input
                id="unit-excel-file"
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
