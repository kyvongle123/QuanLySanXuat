import { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, FileDown, FileUp, Trash2, FileText, Upload, ChevronRight } from 'lucide-react';
import { FaRegSquare, FaRegSquareMinus } from "react-icons/fa6";
import { CustomDatatable, Modal, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { getRoles, createRole, updateRole, deleteRole } from '../controller/rolesController';

export const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingRole, setCurrentEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const closeNotification = () => setNotification(prev => ({ ...prev, isOpen: false }));

  // Logic lọc dữ liệu dựa trên searchTerm
  const filteredRoles = useMemo(() => {
    return roles.filter(role =>
      role.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const data = await getRoles();
        setRoles(data);
        setSelectedRoleIds([]);
        setIsBulkSelectMode(false);
      } catch (err) {
        setError("Không thể tải danh sách chức vụ.");
        console.error("Error fetching roles:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      id,
      type: 'delete',
      title: 'Xác nhận xóa chức vụ',
      message: 'Bạn có chắc chắn muốn xóa chức vụ này? Việc này có thể ảnh hưởng đến phân quyền của người dùng.'
    });
  };

  const handleBulkDelete = () => {
    if (!isBulkSelectMode) {
      setIsBulkSelectMode(true);
      setSelectedRoleIds([]);
      return;
    }

    if (selectedRoleIds.length === 0) {
      setIsBulkSelectMode(false);
      setSelectedRoleIds([]);
      return;
    }

    setConfirmModal({
      isOpen: true,
      id: selectedRoleIds,
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều chức vụ',
      message: `Bạn có chắc chắn muốn xóa ${selectedRoleIds.length} chức vụ đã chọn không? Hành động này không thể hoàn tác.`
    });
  };

  const handleSelectAllRoles = () => {
    setSelectedRoleIds(filteredRoles.map(role => role.id));
  };

  const handleClearSelectedRoles = () => {
    setSelectedRoleIds([]);
  };

  const handleToggleSelectRole = (row) => {
    const rowId = row.id;
    setSelectedRoleIds(prev =>
      prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
    );
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    if (type === 'export') {
      await handleExportExcel();
    } else if (type === 'delete') {
      try {
        await deleteRole(id);
        setRoles(roles.filter(r => r.id !== id));
        setSelectedRoleIds(prev => prev.filter(roleId => roleId !== id));
        showNotification("Xóa chức vụ thành công!");
      } catch (err) {
        console.error("Error deleting role:", err);
        showNotification("Lỗi khi xóa chức vụ.", "error");
      }
    } else if (type === 'bulkDelete') {
      try {
        await Promise.all(id.map(roleId => deleteRole(roleId)));
        setRoles(prev => prev.filter(r => !id.includes(r.id)));
        setSelectedRoleIds([]);
        setIsBulkSelectMode(false);
        showNotification(`Đã xóa ${id.length} chức vụ thành công!`, "success");
      } catch (err) {
        showNotification("Có lỗi xảy ra khi xóa nhiều chức vụ.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách chức vụ ra tệp Excel không?'
    });
  };

  const handleDownloadSample = async () => {
    try {
      const response = await fetch('https://quanlysanxuat-back-end.onrender.com/api/Templates/import/roles');
      if (!response.ok) throw new Error('Không thể tải file mẫu từ máy chủ.');
      const blob = await response.blob();
      saveAs(blob, 'RoleTemplate.xlsx');
      showNotification("Tải file mẫu thành công!");
    } catch (err) {
      console.error("Download Sample Error:", err);
      showNotification("Lỗi khi tải file mẫu.", "error");
    }
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

      const roleMap = new Map(roles.map(r => [String(r.roleCode || '').toLowerCase(), r]));
      let successCount = 0;
      let totalProcessed = 0;

      const rowNumbers = [];
      worksheet.eachRow({ includeEmpty: false }, (_, rowNumber) => {
        if (rowNumber >= 2) rowNumbers.push(rowNumber);
      });

      for (const rowNumber of rowNumbers) {
        const row = worksheet.getRow(rowNumber);
        const roleCode = getExcelText(row.getCell(2)); // Cột B: Mã chức vụ
        const roleName = getExcelText(row.getCell(3)); // Cột C: Tên chức vụ

        if (!roleCode || !roleName) continue;
        totalProcessed++;

        const existingRole = roleMap.get(roleCode.toLowerCase());

        try {
          if (existingRole) {
            await updateRole(existingRole.id, { ...existingRole, name: roleName });
            successCount++;
          } else {
            await createRole({ roleCode, name: roleName });
            successCount++;
          }
        } catch (err) {
          console.error(`Lỗi xử lý tại dòng ${rowNumber}:`, err);
        }
      }

      const data = await getRoles();
      setRoles(data);
      showNotification(`Đã xử lý thành công ${successCount}/${totalProcessed} dòng dữ liệu.`);
      setIsImportModalOpen(false);
      setSelectedImportFile(null);
    } catch (err) {
      console.error("Import Excel Error:", err);
      showNotification("Lỗi khi xử lý file Excel.", "error");
    } finally {
      setIsImportingExcel(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách chức vụ');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Mã chức vụ', key: 'roleCode', width: 15 },
        { header: 'Tên chức vụ', key: 'name', width: 40 },
      ];

      filteredRoles.forEach((role, index) => {
        worksheet.addRow({
          stt: index + 1,
          roleCode: role.roleCode || 'N/A',
          name: role.name,
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
          if (colNumber === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách chức vụ.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const handleEdit = (role) => {
    setModalMode('edit');
    setCurrentEditingRole(role);
    setIsModalOpen(true);
  };

  const toggleModalMaximize = () => {
    setIsModalMaximized(prev => !prev);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
    setErrors({});
  };

  const handleAdd = () => {
    setModalMode('add');
    setCurrentEditingRole({ name: '' });
    setIsModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setSelectedImportFile(null);
    setIsImportModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentEditingRole?.name?.trim()) {
      setErrors({ name: 'Bắt buộc nhập Tên chức vụ' });
      return;
    }
    setErrors({});

    try {
      if (modalMode === 'add') {
        const newRole = await createRole(currentEditingRole);
        setRoles([...roles, newRole]);
        showNotification("Thêm chức vụ thành công!");
      } else {
        const updated = await updateRole(currentEditingRole.id, currentEditingRole);
        setRoles(roles.map(r => r.id === updated.id ? updated : r));
        showNotification("Cập nhật chức vụ thành công!");
      }
      handleCloseModal();
    } catch (err) {
      console.error("Error saving role:", err);
      showNotification("Đã xảy ra lỗi khi lưu thông tin chức vụ.", "error");
    }
  };

  const columns = [
    {
      header: '',
      className: 'sm:hidden !px-1 w-[40px]',
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
    { header: 'STT', className: 'w-[50px] text-center !px-1 sm:!px-4', render: (row, { index }) => index },
    { header: 'Mã chức vụ', accessor: 'roleCode', className: 'hidden sm:table-cell text-gray-500 w-[120px] !px-1 sm:!px-4' },
    { header: 'Tên chức vụ', accessor: 'name', className: 'font-bold text-blue-600 min-w-[150px] !px-1 sm:!px-4' },
    {
      header: isBulkSelectMode ? (
        <div className="flex w-full items-center justify-center gap-2 text-[10px] sm:text-sm">
          <button type="button" onClick={(e) => { e.stopPropagation(); handleSelectAllRoles(); }} className="font-semibold text-red-600 hover:text-red-700">Tất cả</button>
          <span className="text-gray-300">/</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleClearSelectedRoles(); }} className="font-semibold text-gray-500 hover:text-gray-700">Bỏ chọn</button>
        </div>
      ) : 'Hành động',
      className: 'text-right pr-2 sm:pr-5 w-[120px] sm:w-[160px]',
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          {isBulkSelectMode ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleToggleSelectRole(row); }}
              className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-red-50"
              title={selectedRoleIds.includes(row.id) ? 'Bỏ chọn' : 'Chọn dòng'}
            >
              {selectedRoleIds.includes(row.id) ? (
                <FaRegSquareMinus size={20} className="text-red-600" />
              ) : (
                <FaRegSquare size={20} className="text-gray-400" />
              )}
            </button>
          ) : (
            selectedRoleIds.length < 2 && (
              <>
                <button onClick={() => handleEdit(row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95">Sửa</button>
                <button onClick={() => handleDelete(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95">Xóa</button>
              </>
            )
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-50/50 min-h-screen">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 tracking-tight">Chức vụ người dùng</h2>

      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        {/* Thanh tìm kiếm */}
        <div className="relative w-full lg:max-w-[350px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên chức vụ"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm outline-none transition-all sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 w-full lg:w-auto">
          <button onClick={() => { setIsImportModalOpen(true); setSelectedImportFile(null); }} className="order-1 lg:order-2 flex-1 lg:flex-none bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="order-2 lg:order-3 flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
            <FileDown size={18} /> <span>Xuất Excel</span>
          </button>
          <button
            onClick={handleBulkDelete}
            className={`order-3 lg:order-1 flex-1 lg:flex-none justify-center text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all flex items-center gap-2 text-sm ${selectedRoleIds.length > 0 ? 'bg-red-700 hover:bg-red-700 shadow-md active:scale-95' : 'bg-red-700 hover:bg-red-700'}`}
          >
            <Trash2 size={18} />
            Xóa nhiều dòng {selectedRoleIds.length > 0 && `(${selectedRoleIds.length})`}
          </button>
          <button onClick={handleAdd} className="order-4 lg:order-4 w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded whitespace-nowrap transition-all active:scale-95 shadow-md text-sm">
            Thêm mới
          </button>
        </div>
      </div>

      {
        loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="italic text-sm">Đang tải dữ liệu chức vụ...</p>
          </div>
        ) : null
      }
      {error && <p className="text-red-600 p-4">{error}</p>}
      {
        !loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <CustomDatatable
              columns={columns}
              data={filteredRoles}
              renderExpansion={(row) => (
                <div className="py-3 px-4 sm:hidden bg-blue-50/30 border-b border-gray-100 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mã chức vụ</span>
                    <span className="text-sm text-gray-600 font-medium">
                      {row.roleCode || 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            />
          </div>
        )
      }

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm chức vụ' : 'Chỉnh sửa chức vụ'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-md'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={toggleModalMaximize}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 ml-1 font-medium">Mã chức vụ</label>
            <input
              type="text"
              value={currentEditingRole?.roleCode || ''}
              disabled
              className={`mt-1 block w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg shadow-sm outline-none transition-all cursor-not-allowed ${isModalMaximized ? 'p-3 text-base' : 'p-2 text-sm'}`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-xs ${errors.name ? 'text-red-500' : 'text-gray-500'} ml-1`}>Tên chức vụ <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={currentEditingRole?.name || ''}
              onChange={(e) => {
                setCurrentEditingRole({ ...currentEditingRole, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className={`mt-1 block w-full border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm outline-none focus:ring-2 transition-all ${isModalMaximized ? 'p-3 text-base' : 'p-2 text-sm'}`}
            />
            {errors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.name}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={handleCloseModal} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors text-sm">Hủy bỏ</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm">Lưu thông tin</button>
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
    </div >
  );
};
