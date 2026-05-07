import React, { useEffect, useState, useMemo } from 'react';
import { Search } from 'lucide-react';
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
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [isModalMaximized, setIsModalMaximized] = useState(false);

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
    setConfirmModal({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteRole(confirmModal.id);
      setRoles(roles.filter(r => r.id !== confirmModal.id));
      showNotification("Xóa chức vụ thành công!");
    } catch (err) {
      console.error("Error deleting role:", err);
      showNotification("Lỗi khi xóa chức vụ.", "error");
    } finally {
      setConfirmModal({ isOpen: false, id: null });
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
  };

  const handleAdd = () => {
    setModalMode('add');
    setCurrentEditingRole({ name: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    { header: 'STT', render: (row, { index }) => index },
    { header: 'Tên chức vụ', accessor: 'name', className: 'w-full' },
    {
      header: 'Hành động',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors focus:outline-none">Sửa</button>
          <button onClick={() => handleDelete(row.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors focus:outline-none">Xóa</button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Chức vụ người dùng</h2>

      <div className="flex justify-between items-center mb-4 gap-4">
        {/* Thanh tìm kiếm */}
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên chức vụ"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={handleAdd} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors">
          Thêm chức vụ mới
        </button>
      </div>

      {loading && <p className="text-gray-600 p-4">Đang tải dữ liệu chức vụ...</p>}
      {error && <p className="text-red-600 p-4">{error}</p>}
      {!loading && !error && (
        <CustomDatatable columns={columns} data={filteredRoles} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm chức vụ' : 'Cập nhật chức vụ'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-md'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={toggleModalMaximize}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Tên chức vụ</label>
            <input
              type="text"
              value={currentEditingRole?.name || ''}
              onChange={(e) => setCurrentEditingRole({ ...currentEditingRole, name: e.target.value })}
              className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseModal} className={`bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors focus:outline-none ${isModalMaximized ? 'py-2 px-6 text-base' : 'py-1.5 px-4 text-sm'}`}>Hủy</button>
            <button type="submit" className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none ${isModalMaximized ? 'py-2 px-6 text-base' : 'py-1.5 px-4 text-sm'}`}>Lưu</button>
          </div>
        </form>
      </Modal>

      <CustomConfirm 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa chức vụ"
        message="Bạn có chắc chắn muốn xóa chức vụ này? Việc này có thể ảnh hưởng đến phân quyền của người dùng."
      />

      <AppNotification 
        isOpen={notification.isOpen} 
        message={notification.message} 
        type={notification.type} 
        onClose={closeNotification} 
      />
    </div>
  );
};
