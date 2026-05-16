import React, { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, FileDown, FileUp } from 'lucide-react';
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
  const [errors, setErrors] = useState({});

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

  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    if (type === 'export') {
      await handleExportExcel();
    } else if (type === 'delete') {
      try {
        await deleteRole(id);
        setRoles(roles.filter(r => r.id !== id));
        showNotification("Xóa chức vụ thành công!");
      } catch (err) {
        console.error("Error deleting role:", err);
        showNotification("Lỗi khi xóa chức vụ.", "error");
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

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách chức vụ');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Tên chức vụ', key: 'name', width: 40 },
      ];

      filteredRoles.forEach((role, index) => {
        worksheet.addRow({
          stt: index + 1,
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
    { header: 'STT', className: 'w-[50px] text-center !px-1 sm:!px-4', render: (row, { index }) => index },
    { header: 'Tên chức vụ', accessor: 'name', className: 'font-bold text-blue-600 min-w-[150px] !px-1 sm:!px-4' },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-5 w-[120px] sm:w-[160px]',
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          <button onClick={() => handleEdit(row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95">Sửa</button>
          <button onClick={() => handleDelete(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95">Xóa</button>
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
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {/* Nút Nhập Excel */}
          <button className="flex-1 lg:flex-none bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
            <FileUp size={18} />
            Nhập Excel
          </button>
          {/* Nút Xuất Excel */}
          <button onClick={handleRequestExportExcel} className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
            <FileDown size={18} /> Xuất Excel
          </button>
          {/* Nút Thêm mới */}
          <button onClick={handleAdd} className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg whitespace-nowrap transition-all active:scale-95 shadow-md text-sm">
            + Thêm mới
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
            <CustomDatatable columns={columns} data={filteredRoles} />
          </div>
        )
      }

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm chức vụ' : 'Cập nhật chức vụ'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-md'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={toggleModalMaximize}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-bold ${errors.name ? 'text-red-500' : 'text-gray-500'} uppercase ml-1`}>Tên chức vụ <span className="text-red-500">*</span></label>
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
