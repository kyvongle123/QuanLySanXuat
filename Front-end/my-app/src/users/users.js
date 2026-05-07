import { useEffect, useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, FileUp, FileDown, Trash2, Plus, Edit2 } from 'lucide-react';
import { CustomDatatable, Modal, CustomSelect, AppNotification, CustomConfirm } from '../customComponent/customComponent'; // Thêm CustomSelect vào import
import { getUsers, deleteUser, createUser, updateUser } from '../controller/usersController'; // Sửa đường dẫn thành số nhiều
import { getRoles, createRole, updateRole, deleteRole } from '../controller/rolesController';
import { getStatuses, createStatus, updateStatus, deleteStatus } from '../controller/statusesController';
import { Tooltip } from 'react-tooltip'; // Import Tooltip
import { RxDrawingPinFilled } from "react-icons/rx";
import { RiUnpinFill } from "react-icons/ri";

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentEditingUser, setCurrentEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);
  const [openRoleMenuId, setOpenRoleMenuId] = useState(null);
  const [openDepartmentMenuId, setOpenDepartmentMenuId] = useState(null);
  const [openBranchMenuId, setOpenBranchMenuId] = useState(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // States cho quản lý Chức vụ (Roles)
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [roleModalMode, setRoleModalMode] = useState('list'); // 'list', 'add', 'edit'
  const [isRolesMgmtMaximized, setIsRolesMgmtMaximized] = useState(false);
  const [isRoleEditModalOpen, setIsRoleEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState({ name: '' });

  // States cho quản lý Trạng thái (Statuses)
  const [isStatusesModalOpen, setIsStatusesModalOpen] = useState(false);
  const [statusSearchTerm, setStatusSearchTerm] = useState('');
  const [statusModalMode, setStatusModalMode] = useState('list'); // 'list', 'add', 'edit'
  const [isStatusesMgmtMaximized, setIsStatusesMgmtMaximized] = useState(false);
  const [isStatusEditModalOpen, setIsStatusEditModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState({ name: '' });

  const fetchMetaData = async () => {
    try {
      const [rolesData, statusesData] = await Promise.all([
        getRoles(),
        getStatuses(),
      ]);

      setRoles(rolesData.map(r => ({
        value: r.id,
        label: r.name
      })));

      setStatuses(statusesData.map(s => ({
        value: s.id || s.name,
        label: s.name
      })));

    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  };

  // Thêm logic lắng nghe click toàn cục để đóng menu khi bấm ra ngoài bất cứ đâu
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenStatusMenuId(null);
      setOpenRoleMenuId(null);
      setOpenDepartmentMenuId(null);
      setOpenBranchMenuId(null);
      setMenuSearchQuery('');
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const closeNotification = () => setNotification(prev => ({ ...prev, isOpen: false }));

  // Logic lọc dữ liệu dựa trên searchTerm
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const roleLabel = roles.find(r => String(r.value) === String(user.role))?.label || '';
      const statusLabel = statuses.find(s => String(s.value) === String(user.status))?.label || '';
      return (
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    });
  }, [users, searchTerm, roles, statuses]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError("Failed to fetch users.");
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
    fetchMetaData();
  }, []);

  const handleDeleteUser = (userId) => {
    setConfirmModal({ isOpen: true, id: userId });
  };

  const handleSelectUser = (id) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteUser(confirmModal.id);
      setUsers(users.filter(user => user.id !== confirmModal.id));
      showNotification("Người dùng đã được xóa thành công!");
    } catch (err) {
      console.error("Error deleting user:", err);
      showNotification("Lỗi khi xóa người dùng.", "error");
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const handleEditUser = (user) => {
    setModalMode('edit');
    setCurrentEditingUser(user);
    setIsModalOpen(true);
  };

  const handleAddUser = () => {
    setModalMode('add');
    setCurrentEditingUser({ name: '', email: '', role: '', status: '', department: '', branch: '', address: '', username: '', password: '', userCode: '', phone: '' });
    setIsModalOpen(true);
  };

  // Handler riêng cho việc chọn phòng ban trong Modal để đồng bộ chi nhánh
  const handleModalDepartmentChange = (e) => {
    const newDeptId = e.target.value;
    const deptObj = departments.find(d => String(d.value) === String(newDeptId));
    const newBranchId = deptObj ? deptObj.branchId : null;

    setCurrentEditingUser(prev => ({
      ...prev,
      department: newDeptId,
      branch: newBranchId // Tự động cập nhật chi nhánh ứng với phòng ban
    }));
  };

  const toggleModalMaximize = () => {
    setIsModalMaximized(prev => !prev);
  };

  // Handlers cho quản lý Chức vụ
  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (roleModalMode === 'add') {
        await createRole({ name: editingRole.name });
        showNotification("Thêm chức vụ mới thành công!");
      } else {
        await updateRole(editingRole.id, { name: editingRole.name });
        showNotification("Cập nhật chức vụ thành công!");
      }
      setIsRoleEditModalOpen(false);
      fetchMetaData();
    } catch (err) {
      console.error("Error saving role:", err);
      showNotification("Lỗi khi lưu chức vụ.", "error");
    }
  };

  const handleDeleteRole = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa chức vụ này?")) {
      try {
        await deleteRole(id);
        showNotification("Đã xóa chức vụ!");
        fetchMetaData();
      } catch (err) {
        console.error("Error deleting role:", err);
        showNotification("Lỗi khi xóa chức vụ.", "error");
      }
    }
  };

  const handleOpenRolesModal = () => {
    setRoleModalMode('list');
    setRoleSearchTerm('');
    setIsRolesModalOpen(true);
    setIsRolesMgmtMaximized(false);
  };

  // Handlers cho quản lý Trạng thái
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      if (statusModalMode === 'add') {
        await createStatus({ name: editingStatus.name });
        showNotification("Thêm trạng thái mới thành công!");
      } else {
        await updateStatus(editingStatus.id, { name: editingStatus.name });
        showNotification("Cập nhật trạng thái thành công!");
      }
      setIsStatusEditModalOpen(false);
      fetchMetaData();
    } catch (err) {
      console.error("Error saving status:", err);
      showNotification("Lỗi khi lưu trạng thái.", "error");
    }
  };

  const handleDeleteStatus = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa trạng thái này?")) {
      try {
        await deleteStatus(id);
        showNotification("Đã xóa trạng thái!");
        fetchMetaData();
      } catch (err) {
        console.error("Error deleting status:", err);
        showNotification("Lỗi khi xóa trạng thái.", "error");
      }
    }
  };

  const handleOpenStatusesModal = () => {
    setStatusModalMode('list');
    setStatusSearchTerm('');
    setIsStatusesModalOpen(true);
    setIsStatusesMgmtMaximized(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingUser(null);
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingUser(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = async (user, newStatusId) => {
    try {
      const updatedUser = await updateUser(user.id, { ...user, status: newStatusId });
      setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
      setOpenStatusMenuId(null);
      showNotification("Cập nhật trạng thái thành công!");
    } catch (err) {
      console.error("Error updating status:", err);
      showNotification("Lỗi khi cập nhật trạng thái.", "error");
    }
  };

  const handleDepartmentChange = async (user, newDeptId) => {
    try {
      const updatedValue = newDeptId === "" ? null : parseInt(newDeptId);

      // Tìm thông tin chi nhánh đi kèm với phòng ban được chọn
      const deptObj = departments.find(d => String(d.value) === String(newDeptId));
      const newBranchId = deptObj ? deptObj.branchId : null;

      const updatedUser = await updateUser(user.id, {
        ...user,
        department: updatedValue,
        branch: newBranchId
      });

      setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
      setOpenDepartmentMenuId(null);
      showNotification("Cập nhật phòng ban và chi nhánh thành công!");
    } catch (err) {
      console.error("Error updating department:", err);
      showNotification("Lỗi khi cập nhật phòng ban.", "error");
    }
  };

  const handleBranchChange = async (user, newBranchId) => {
    try {
      const updatedValue = newBranchId === "" ? null : parseInt(newBranchId);
      const updatedUser = await updateUser(user.id, { ...user, branch: updatedValue });
      setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
      setOpenBranchMenuId(null);
      showNotification("Cập nhật chi nhánh thành công!");
    } catch (err) {
      console.error("Error updating branch:", err);
      showNotification("Lỗi khi cập nhật chi nhánh.", "error");
    }
  };

  const handleRoleChange = async (user, newRoleId) => {
    try {
      // Gọi API cập nhật user với role mới
      const updatedUser = await updateUser(user.id, { ...user, role: newRoleId });
      // Cập nhật lại danh sách users trong state để giao diện đồng bộ
      setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
      setOpenRoleMenuId(null);
      showNotification("Cập nhật chức vụ thành công!");
    } catch (err) {
      console.error("Error updating role:", err);
      showNotification("Lỗi khi cập nhật chức vụ.", "error");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    // Chuẩn hóa dữ liệu: Chuyển chuỗi sang số hoặc null để khớp với SQL kiểu INT
    const payload = {
      ...currentEditingUser,
      role: currentEditingUser.role === '' ? null : parseInt(currentEditingUser.role),
      status: currentEditingUser.status === '' ? null : parseInt(currentEditingUser.status),
      department: currentEditingUser.department === '' ? null : parseInt(currentEditingUser.department),
      branch: currentEditingUser.branch === '' ? null : parseInt(currentEditingUser.branch),
    };

    try {
      if (modalMode === 'add') {
        const newUser = await createUser(payload);
        setUsers(prevUsers => [...prevUsers, newUser]);
        showNotification("Thêm người dùng thành công!");
      } else { // modalMode === 'edit'
        const updatedUser = await updateUser(currentEditingUser.id, payload);
        setUsers(prevUsers => prevUsers.map(user => user.id === updatedUser.id ? updatedUser : user));
        showNotification("Cập nhật người dùng thành công!");
      }
      handleCloseModal();
    } catch (err) {
      console.error(`Error ${modalMode === 'add' ? 'creating' : 'updating'} user:`, err);
      showNotification(`Lỗi khi ${modalMode === 'add' ? 'thêm' : 'cập nhật'} người dùng.`, "error");
    }
  };

  // Form cho Modal
  const userForm = (
    <form onSubmit={handleModalSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Tên người dùng</label>
          <input type="text" id="name" name="name" value={currentEditingUser?.name || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} required />
        </div>
        <div>
          <label htmlFor="userCode" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Mã nhân viên</label>
          <input type="text" id="userCode" name="userCode" value={currentEditingUser?.userCode || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="username" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Username</label>
          <input type="text" id="username" name="username" value={currentEditingUser?.username || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} required />
        </div>
        <div>
          <label htmlFor="password" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Password</label>
          <input type="password" id="password" name="password" value={currentEditingUser?.password || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Số điện thoại</label>
          <input type="text" id="phone" name="phone" value={currentEditingUser?.phone || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} required />
        </div>
        <div>
          <label htmlFor="email" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Email</label>
          <input type="email" id="email" name="email" value={currentEditingUser?.email || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="role-select" className={`font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Chức vụ</label>
            <button
              type="button"
              onClick={handleOpenRolesModal}
              className="text-blue-600 hover:text-blue-800 text-[10px] font-bold underline transition-colors"
            >
              hiệu chỉnh
            </button>
          </div>
          <CustomSelect
            id="role-select"
            name="role"
            value={currentEditingUser?.role || ''}
            onChange={handleModalInputChange}
            options={roles}
            isModalMaximized={isModalMaximized}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="status-select" className={`font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Trạng thái</label>
            <button type="button" onClick={handleOpenStatusesModal} className="text-blue-600 hover:text-blue-800 text-[10px] font-bold underline transition-colors">hiệu chỉnh</button>
          </div>
          <CustomSelect
            id="status-select"
            name="status"
            value={currentEditingUser?.status || ''}
            onChange={handleModalInputChange}
            options={statuses}
            isModalMaximized={isModalMaximized}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="address" className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Địa chỉ</label>
          <input type="text" id="address" name="address" value={currentEditingUser?.address || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={handleCloseModal} className={`bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors ${isModalMaximized ? 'py-2 px-6 text-base' : 'py-1.5 px-4 text-sm'}`}>Hủy</button>
        <button type="submit" className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${isModalMaximized ? 'py-2 px-6 text-base' : 'py-1.5 px-4 text-sm'}`}>Lưu</button>
      </div>
    </form>
  );

  const userColumns = [
    {
      header: '',
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
    { header: 'STT', render: (row, { index }) => index },
    { header: 'Tên', accessor: 'name' }, // Assuming 'name' is a property of User
    { header: 'Email', accessor: 'email' }, // Assuming 'email' is a property of User
    {
      header: 'Chức vụ',
      accessor: 'role',
      render: (row) => {
        const roleObj = roles.find(r => String(r.value) === String(row.role));
        const label = roleObj ? roleObj.label : '-- Chọn --';
        return (
          <div className="relative w-full">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleOpenRolesModal(); }}
              className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
            >
              hiệu chỉnh
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài document làm menu bị đóng ngay lập tức
                if (openRoleMenuId !== row.id) setMenuSearchQuery('');
                setOpenRoleMenuId(openRoleMenuId === row.id ? null : row.id);
                setOpenStatusMenuId(null);
                setOpenBranchMenuId(null);
              }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 focus:outline-none transition-all cursor-pointer appearance-none text-left relative"
            >
              <span className="truncate block">{label}</span>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </button>

            {openRoleMenuId === row.id && (
              <div className="absolute inset-x-0 top-full mt-1 bg-white rounded-md shadow-2xl z-[999] border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal overflow-y-auto max-h-44">
                <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                      placeholder="Lọc chức vụ..."
                      value={menuSearchQuery}
                      onChange={(e) => setMenuSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  {roles.filter(role => role.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((role) => (
                    <button
                      key={role.value}
                      onClick={() => handleRoleChange(row, role.value)}
                      className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.role) === String(role.value)
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span className="block w-full !whitespace-normal break-words leading-tight">
                        {role.label}
                      </span>
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
      header: (
        <div className="flex items-center justify-center gap-2">
          <span>Hành động</span>
          {selectedUserIds.length >= 2 && (
            <RiUnpinFill
              className="text-red-500 cursor-pointer hover:scale-110 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUserIds([]);
              }}
              title="Bỏ chọn tất cả"
            />
          )}
        </div>
      ),
      className: 'text-center w-[180px]',
      render: (row) => {
        const isSelected = selectedUserIds.includes(row.id);
        return (
          <div className="flex justify-center items-center gap-3">
            {/* Icon Pin nhích sang trái */}
            <RxDrawingPinFilled
              size={20}
              className={`cursor-pointer transition-colors ${isSelected ? 'text-red-500' : 'text-gray-400'} hover:text-red-400`}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectUser(row.id);
              }}
              data-tooltip-id="select-multiple-users-tooltip"
              data-tooltip-content={isSelected ? "Bỏ chọn" : "Chọn xóa nhiều dòng"}
            />

            {/* Ẩn Sửa/Xóa khi chọn từ 2 dòng trở lên */}
            {selectedUserIds.length < 2 && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditUser(row); }}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
                >
                  Sửa
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteUser(row.id); }}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
                >
                  Xóa
                </button>
              </div>
            )}
          </div>
        );
      }
    },
  ];

  // Định nghĩa cột cho bảng danh sách Chức vụ
  const roleTableColumns = useMemo(() => [
    { header: 'STT', render: (_, { index }) => index },
    {
      header: 'Tên chức vụ',
      render: (row) => <span className="font-bold text-gray-700">{row.label}</span>
    },
    {
      header: 'Hành động',
      className: 'text-right pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setEditingRole({ id: row.value, name: row.label }); setRoleModalMode('edit'); setIsRoleEditModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >
            Sửa
          </button>
          <button
            onClick={() => handleDeleteRole(row.value)}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >
            Xóa
          </button>
        </div>
      )
    }
  ], [handleDeleteRole]);

  // Định nghĩa cột cho bảng danh sách Trạng thái
  const statusTableColumns = useMemo(() => [
    { header: 'STT', render: (_, { index }) => index },
    {
      header: 'Tên trạng thái',
      render: (row) => <span className="font-bold text-gray-700">{row.label}</span>
    },
    {
      header: 'Hành động',
      className: 'text-right pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setEditingStatus({ id: row.value, name: row.label }); setStatusModalMode('edit'); setIsStatusEditModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >
            Sửa
          </button>
          <button
            onClick={() => handleDeleteStatus(row.value)}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95"
          >
            Xóa
          </button>
        </div>
      )
    }
  ], [handleDeleteStatus]);

  return (
    <div className="p-6"> {/* Removed container-fluid, d-flex, card, etc. from here */}
      <h2 className="text-2xl font-bold mb-4">Danh sách người dùng</h2>

      <div className="flex justify-between items-center mb-4 gap-4">
        {/* Thanh tìm kiếm */}
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {selectedUserIds.length >= 2 && (
            <button
              onClick={() => { /* Logic xóa nhiều dòng */ }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all shadow-md active:scale-95 animate-in zoom-in duration-200"
            >
              Xóa nhiều dòng ({selectedUserIds.length})
            </button>
          )}

          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2">
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button onClick={handleAddUser} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors">
            Thêm người dùng mới
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-600 p-4">Đang tải dữ liệu người dùng...</p>}
      {error && <p className="text-red-600 p-4">Lỗi: {error}</p>}
      {!loading && !error && (
        <CustomDatatable
          columns={userColumns}
          data={filteredUsers}
          renderExpansion={(row) => (
            <div className="py-4 pl-24 pr-6 bg-blue-50/30 border-b border-gray-100 relative">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-sm">
                <div className="flex flex-col gap-1 md:col-span-1">
                  {(() => {
                    const statusObj = statuses.find(s => String(s.value) === String(row.status));
                    const displayLabel = statusObj ? statusObj.label : '---';
                    return (
                      <>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</span>
                        <div className="relative max-w-[150px]">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenStatusesModal(); }}
                            className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
                          >
                            hiệu chỉnh
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openStatusMenuId !== row.id) setMenuSearchQuery('');
                              setOpenStatusMenuId(openStatusMenuId === row.id ? null : row.id);
                              setOpenDepartmentMenuId(null);
                              setOpenBranchMenuId(null);
                              setOpenRoleMenuId(null);
                            }}
                            className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg p-1 pr-8 appearance-none cursor-pointer outline-none font-medium text-left relative min-h-[30px] w-full block hover:border-blue-400 transition-colors"
                          >
                            <span className="truncate block">{displayLabel}</span>
                            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                              <ChevronDown size={14} />
                            </div>
                          </button>

                          {openStatusMenuId === row.id && (
                            <div className="absolute inset-x-0 top-full mt-1 bg-white rounded-md shadow-2xl z-20 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal overflow-y-auto max-h-48">
                              <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                                <div className="relative">
                                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                                    placeholder="Lọc trạng thái..."
                                    value={menuSearchQuery}
                                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                {statuses.filter(s => s.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((s) => (
                                  <button
                                    key={s.value}
                                    onClick={() => handleStatusChange(row, s.value)}
                                    className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.status) === String(s.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                  >
                                    <span className="block w-full !whitespace-normal break-words leading-tight">{s.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Số điện thoại</span>
                  <span className="text-gray-900 font-medium">{row.phone || '---'}</span>

                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Địa chỉ</span>
                  <span className="text-gray-900 font-medium">{row.address || '---'}</span>
                </div>
              </div>
            </div>
          )}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-2xl'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={toggleModalMaximize}
      >
        {userForm}
      </Modal>

      {/* Modal quản lý Chức vụ (Roles) */}
      <Modal
        isOpen={isRolesModalOpen}
        onClose={() => { setIsRolesModalOpen(false); setIsRolesMgmtMaximized(false); }}
        title="Danh sách chức vụ"
        maxWidth={isRolesMgmtMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isRolesMgmtMaximized}
        onMaximizeToggle={() => setIsRolesMgmtMaximized(!isRolesMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px] flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên chức vụ..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={roleSearchTerm}
                onChange={(e) => setRoleSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => { setEditingRole({ name: '' }); setRoleModalMode('add'); setIsRoleEditModalOpen(true); }} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              <Plus size={16} /> Thêm chức vụ
            </button>
          </div>
          <div className={`${isRolesMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}>
            <CustomDatatable columns={roleTableColumns} data={roles.filter(r => r.label.toLowerCase().includes(roleSearchTerm.toLowerCase()))} />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Chức vụ */}
      <Modal
        isOpen={isRoleEditModalOpen}
        onClose={() => setIsRoleEditModalOpen(false)}
        title={roleModalMode === 'add' ? "Thêm chức vụ mới" : "Chỉnh sửa chức vụ"}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleRoleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Tên chức vụ <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" placeholder="Nhập tên chức vụ..." value={editingRole.name} onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })} required autoFocus />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsRoleEditModalOpen(false)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">Hủy</button>
            <button type="submit" className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 text-sm">Lưu</button>
          </div>
        </form>
      </Modal>

      {/* Modal quản lý Trạng thái (Statuses) */}
      <Modal
        isOpen={isStatusesModalOpen}
        onClose={() => { setIsStatusesModalOpen(false); setIsStatusesMgmtMaximized(false); }}
        title="Danh sách trạng thái"
        maxWidth={isStatusesMgmtMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isStatusesMgmtMaximized}
        onMaximizeToggle={() => setIsStatusesMgmtMaximized(!isStatusesMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px] flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên trạng thái..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={statusSearchTerm}
                onChange={(e) => setStatusSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => { setEditingStatus({ name: '' }); setStatusModalMode('add'); setIsStatusEditModalOpen(true); }} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              <Plus size={16} /> Thêm trạng thái
            </button>
          </div>
          <div className={`${isStatusesMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}>
            <CustomDatatable columns={statusTableColumns} data={statuses.filter(s => s.label.toLowerCase().includes(statusSearchTerm.toLowerCase()))} />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Trạng thái */}
      <Modal
        isOpen={isStatusEditModalOpen}
        onClose={() => setIsStatusEditModalOpen(false)}
        title={statusModalMode === 'add' ? "Thêm trạng thái mới" : "Chỉnh sửa trạng thái"}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Tên trạng thái <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" placeholder="Tên trạng thái" value={editingStatus.name} onChange={(e) => setEditingStatus({ ...editingStatus, name: e.target.value })} required autoFocus />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsStatusEditModalOpen(false)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">Hủy</button>
            <button type="submit" className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 text-sm">Lưu</button>
          </div>
        </form>
      </Modal>

      <CustomConfirm
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác."
      />

      <AppNotification
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
      />

      {/* Custom Tooltip */}
      <Tooltip
        id="select-multiple-users-tooltip"
        place="bottom" // Vị trí hiển thị của tooltip: top, bottom, left, right
        effect="solid" // Kiểu hiệu ứng: solid (luôn hiển thị), float (hiển thị khi hover)
        className="z-50 px-0 py-0 text-[9px] font-medium rounded-md shadow-lg bg-gray-800 text-white opacity-95 transition-opacity duration-300"
        delayShow={300} // Độ trễ trước khi hiển thị tooltip (ms)
      />
    </div>
  )
}
