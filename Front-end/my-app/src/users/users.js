import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, ChevronDown, ChevronRight, FileUp, FileDown, Trash2, Plus, Edit2, Upload, FileText } from 'lucide-react';
import { CustomDatatable, Modal, CustomSelect, AppNotification, CustomConfirm } from '../customComponent/customComponent'; // Thêm CustomSelect vào import
import { getUsers, deleteUser, createUser, updateUser } from '../controller/usersController'; // Sửa đường dẫn thành số nhiều
import { getRoles, createRole, updateRole, deleteRole } from '../controller/rolesController';
import { getStatuses, createStatus, updateStatus, deleteStatus } from '../controller/statusesController';
import { Tooltip } from 'react-tooltip'; // Import Tooltip
import { RxDrawingPinFilled } from "react-icons/rx";
import { RiUnpinFill } from "react-icons/ri";
import { FaRegSquare, FaRegSquareMinus } from "react-icons/fa6";

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
  const [openRoleMenuAnchorKey, setOpenRoleMenuAnchorKey] = useState(null);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [roleMenuRect, setRoleMenuRect] = useState(null);
  const roleMenuAnchorRefs = useRef({});
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // States cho quản lý Chức vụ (Roles)
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [roleModalMode, setRoleModalMode] = useState('list'); // 'list', 'add', 'edit'
  const [isRolesMgmtMaximized, setIsRolesMgmtMaximized] = useState(false);
  const [isRoleEditModalOpen, setIsRoleEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState({ name: '' });
  const [roleErrors, setRoleErrors] = useState({});

  // States cho quản lý Trạng thái (Statuses)
  const [isStatusesModalOpen, setIsStatusesModalOpen] = useState(false);
  const [statusSearchTerm, setStatusSearchTerm] = useState('');
  const [statusModalMode, setStatusModalMode] = useState('list'); // 'list', 'add', 'edit'
  const [isStatusesMgmtMaximized, setIsStatusesMgmtMaximized] = useState(false);
  const [isStatusEditModalOpen, setIsStatusEditModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState({ name: '' });
  const [statusErrors, setStatusErrors] = useState({});

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
      setOpenRoleMenuAnchorKey(null);
      setRoleMenuRect(null);
      setMenuSearchQuery('');
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  useEffect(() => {
    if (!openRoleMenuId || !openRoleMenuAnchorKey) return;

    const updateRoleMenuRect = () => {
      const anchor = roleMenuAnchorRefs.current[openRoleMenuAnchorKey];
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setRoleMenuRect({
        left: rect.left,
        top: rect.bottom + 4,
        width: Math.max(rect.width, 150),
      });
    };

    updateRoleMenuRect();
    window.addEventListener('resize', updateRoleMenuRect);
    window.addEventListener('scroll', updateRoleMenuRect, true);

    return () => {
      window.removeEventListener('resize', updateRoleMenuRect);
      window.removeEventListener('scroll', updateRoleMenuRect, true);
    };
  }, [openRoleMenuId, openRoleMenuAnchorKey]);

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
    setConfirmModal({
      isOpen: true,
      id: userId,
      type: 'delete',
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.'
    });
  };

  const handleBulkDelete = () => {
    if (!isBulkSelectMode) {
      setIsBulkSelectMode(true);
      setSelectedUserIds([]);
      return;
    }
    if (selectedUserIds.length === 0) {
      setIsBulkSelectMode(false);
      setSelectedUserIds([]);
      return;
    }
    setConfirmModal({
      isOpen: true,
      id: selectedUserIds,
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều người dùng',
      message: `Bạn có chắc chắn muốn xóa ${selectedUserIds.length} người dùng đã chọn không? Hành động này không thể hoàn tác.`
    });
  };

  const handleSelectAllUsers = () => {
    setSelectedUserIds(filteredUsers.map(user => user.id));
  };

  const handleClearSelectedUsers = () => {
    setSelectedUserIds([]);
  };

  const handleToggleSelectUser = (row) => {
    const rowId = row.id;
    setSelectedUserIds(prev =>
      prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
    );
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách người dùng ra tệp Excel không?'
    });
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

      const roleMap = new Map(roles.map(r => [String(r.label).toLowerCase(), r.value]));
      const userMap = new Map(users.map(u => [String(u.userCode || u.UserCode || '').toLowerCase(), u]));

      let successCount = 0;
      let totalProcessed = 0;

      const rowNumbers = [];
      worksheet.eachRow({ includeEmpty: false }, (_, rowNumber) => {
        if (rowNumber >= 2) rowNumbers.push(rowNumber);
      });

      for (const rowNumber of rowNumbers) {
        const row = worksheet.getRow(rowNumber);

        const userCode = getExcelText(row.getCell(2));
        const name = getExcelText(row.getCell(3));
        const email = getExcelText(row.getCell(4));
        const roleName = getExcelText(row.getCell(5));
        const phone = getExcelText(row.getCell(6));
        const address = getExcelText(row.getCell(7));

        if (!userCode) continue;
        totalProcessed++;

        const roleId = roleMap.get(roleName.toLowerCase()) || null;
        const existingUser = userMap.get(userCode.toLowerCase());

        const userData = {
          userCode,
          name: name || (existingUser ? (existingUser.name || existingUser.Name) : ''),
          email: email || (existingUser ? (existingUser.email || existingUser.Email) : ''),
          role: roleId !== null ? roleId : (existingUser ? (existingUser.role || existingUser.Role) : null),
          phone: phone || (existingUser ? (existingUser.phone || existingUser.Phone) : ''),
          address: address || (existingUser ? (existingUser.address || existingUser.Address) : ''),
        };

        try {
          if (existingUser) {
            await updateUser(existingUser.id, { ...existingUser, ...userData });
            successCount++;
          } else {
            const newPayload = {
              ...userData,
              username: userCode,
              password: 'Password123!',
              status: statuses.length > 0 ? statuses[0].value : null
            };
            await createUser(newPayload);
            successCount++;
          }
        } catch (err) {
          console.error(`Lỗi xử lý tại dòng ${rowNumber}:`, err);
        }
      }

      const data = await getUsers();
      setUsers(data);
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
      const worksheet = workbook.addWorksheet('Danh sách người dùng');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Mã người dùng', key: 'userCode', width: 15 },
        { header: 'Tên người dùng', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Tên chức vụ', key: 'role', width: 20 },
        { header: 'Số điện thoại', key: 'phone', width: 15 },
        { header: 'Địa chỉ', key: 'address', width: 40 },
      ];

      filteredUsers.forEach((user, index) => {
        const roleLabel = roles.find(r => String(r.value) === String(user.role))?.label || 'N/A';
        worksheet.addRow({
          stt: index + 1,
          userCode: user.userCode || 'N/A',
          name: user.name,
          email: user.email,
          roleId: user.role || 'N/A',
          role: roleLabel,
          phone: user.phone,
          address: user.address,
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        if (rowNumber === 1) {
          row.height = 30;
          row.font = { name: 'Times New Roman', size: 12, bold: true };
          row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else {
          row.height = 25;
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'Danh sách người dùng.xlsx');
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await fetch('https://quanlysanxuat-back-end.onrender.com/api/Templates/import/users');
      if (!response.ok) throw new Error('Không thể tải file mẫu từ máy chủ.');
      const blob = await response.blob();
      saveAs(blob, 'UserTemplate.xlsx');
      showNotification("Tải file mẫu thành công!");
    } catch (err) {
      console.error("Download Sample Error:", err);
      showNotification("Lỗi khi tải file mẫu.", "error");
    }
  };


  const handleConfirmAction = async () => {
    if (confirmModal.type === 'export') {
      await handleExportExcel();
    } else if (confirmModal.type === 'delete') {
      try {
        await deleteUser(confirmModal.id);
        setUsers(users.filter(user => user.id !== confirmModal.id));
        showNotification("Người dùng đã được xóa thành công!");
      } catch (err) {
        console.error("Error deleting user:", err);
        showNotification("Lỗi khi xóa người dùng.", "error");
      }
    } else if (confirmModal.type === 'bulkDelete') {
      try {
        await Promise.all(confirmModal.id.map(userId => deleteUser(userId)));
        setUsers(prev => prev.filter(u => !confirmModal.id.includes(u.id)));
        setSelectedUserIds([]);
        setIsBulkSelectMode(false);
        showNotification(`Đã xóa ${confirmModal.id.length} người dùng thành công!`, "success");
      } catch (err) {
        showNotification("Có lỗi xảy ra khi xóa nhiều người dùng.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
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
    if (!editingRole.name?.trim()) {
      setRoleErrors({ name: "Bắt buộc nhập Tên chức vụ" });
      return;
    }
    setRoleErrors({});

    try {
      if (roleModalMode === 'add') {
        await createRole({ name: editingRole.name });
        showNotification("Thêm chức vụ mới thành công!");
      } else {
        await updateRole(editingRole.id, { name: editingRole.name });
        showNotification("Cập nhật chức vụ thành công!");
      }
      handleCloseRoleEditModal();
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

  const handleCloseRoleEditModal = () => {
    setIsRoleEditModalOpen(false);
    setRoleErrors({});
  };

  // Handlers cho quản lý Trạng thái
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!editingStatus.name?.trim()) {
      setStatusErrors({ name: "Bắt buộc nhập Tên trạng thái" });
      return;
    }
    setStatusErrors({});

    try {
      if (statusModalMode === 'add') {
        await createStatus({ name: editingStatus.name });
        showNotification("Thêm trạng thái mới thành công!");
      } else {
        await updateStatus(editingStatus.id, { name: editingStatus.name });
        showNotification("Cập nhật trạng thái thành công!");
      }
      handleCloseStatusEditModal();
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

  const handleCloseStatusEditModal = () => {
    setIsStatusEditModalOpen(false);
    setStatusErrors({});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingUser(null);
    setErrors({});
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingUser(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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
      setOpenRoleMenuAnchorKey(null);
      setRoleMenuRect(null);
      showNotification("Cập nhật chức vụ thành công!");
    } catch (err) {
      console.error("Error updating role:", err);
      showNotification("Lỗi khi cập nhật chức vụ.", "error");
    }
  };

  const handleCloseImportModal = () => {
    setSelectedImportFile(null);
    setIsImportModalOpen(false);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault(); // Đảm bảo gọi preventDefault() đầu tiên
    // Validation logic
    const newErrors = {};
    if (!currentEditingUser?.name?.trim()) newErrors.name = 'Bắt buộc nhập Tên người dùng';
    if (!currentEditingUser?.userCode?.trim()) newErrors.userCode = 'Bắt buộc nhập Mã nhân viên';
    if (!currentEditingUser?.username?.trim()) newErrors.username = 'Bắt buộc nhập Username';
    if (!currentEditingUser?.password?.trim()) newErrors.password = 'Bắt buộc nhập Password';
    if (!currentEditingUser?.phone?.trim()) newErrors.phone = 'Bắt buộc nhập Số điện thoại';
    if (!currentEditingUser?.email?.trim()) newErrors.email = 'Bắt buộc nhập Email';
    if (!currentEditingUser?.role) newErrors.role = 'Bắt buộc nhập Chức vụ';
    if (!currentEditingUser?.status) newErrors.status = 'Bắt buộc nhập Trạng thái';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
    <form onSubmit={handleModalSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid-cols-2 gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block font-medium ${errors.name ? 'text-red-500' : 'text-gray-700'} ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Tên người dùng</label>
            <input type="text" name="name" value={currentEditingUser?.name || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
            {errors.name && <p className="text-[10px] font-medium text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className={`block font-medium ${errors.userCode ? 'text-red-500' : 'text-gray-700'} ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Mã nhân viên</label>
            <input type="text" name="userCode" value={currentEditingUser?.userCode || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.userCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
            {errors.userCode && <p className="text-[10px] font-medium text-red-500 mt-1">{errors.userCode}</p>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={`block font-medium ${errors.username ? 'text-red-500' : 'text-gray-700'} ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Username</label>
          <input type="text" name="username" value={currentEditingUser?.username || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
          {errors.username && <p className="text-[10px] font-medium text-red-500 mt-1">{errors.username}</p>}
        </div>
        <div>
          <label className={`block font-medium ${errors.password ? 'text-red-500' : 'text-gray-700'} ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Password</label>
          <input type="password" name="password" value={currentEditingUser?.password || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
          {errors.password && <p className="text-[10px] font-medium text-red-500 mt-1">{errors.password}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={`block font-medium ${errors.phone ? 'text-red-500' : 'text-gray-700'} ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Số điện thoại</label>
          <input type="text" name="phone" value={currentEditingUser?.phone || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
          {errors.phone && <p className="text-[10px] font-medium text-red-500 mt-1">{errors.phone}</p>}
        </div>
        <div>
          <label className={`block font-medium ${errors.email ? 'text-red-500' : 'text-gray-700'} ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Email</label>
          <input type="email" name="email" value={currentEditingUser?.email || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
          {errors.email && <p className="text-[10px] font-medium text-red-500 mt-1">{errors.email}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            error={!!errors.role}
            errorMessage={errors.role}
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
            error={!!errors.status}
            errorMessage={errors.status}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block font-medium text-gray-700 ${isModalMaximized ? 'text-sm' : 'text-xs'}`}>Địa chỉ</label>
          <input type="text" name="address" value={currentEditingUser?.address || ''} onChange={handleModalInputChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={handleCloseModal} className={`bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors ${isModalMaximized ? 'py-2 px-6 text-base' : 'py-1.5 px-4 text-sm'}`}>Hủy</button>
        <button type="submit" className={`bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${isModalMaximized ? 'py-2 px-6 text-base' : 'py-1.5 px-4 text-sm'}`}>Lưu</button>
      </div>
    </form>
  );

  const toggleRoleMenu = (e, row, anchorKey) => {
    e.stopPropagation();
    const isSameMenuOpen = openRoleMenuId === row.id && openRoleMenuAnchorKey === anchorKey;

    if (isSameMenuOpen) {
      setOpenRoleMenuId(null);
      setOpenRoleMenuAnchorKey(null);
      setRoleMenuRect(null);
      setMenuSearchQuery('');
      return;
    }

    if (openRoleMenuId !== row.id) setMenuSearchQuery('');
    setOpenRoleMenuId(row.id);
    setOpenRoleMenuAnchorKey(anchorKey);
    setOpenStatusMenuId(null);
    setOpenDepartmentMenuId(null);
    setOpenBranchMenuId(null);

    const rect = e.currentTarget.getBoundingClientRect();
    setRoleMenuRect({
      left: rect.left,
      top: rect.bottom + 4,
      width: Math.max(rect.width, 150),
    });
  };

  const renderRoleMenu = (row, anchorKey) => {
    if (openRoleMenuId !== row.id || openRoleMenuAnchorKey !== anchorKey || !roleMenuRect) return null;

    return createPortal(
      <div
        className="fixed bg-white rounded-md shadow-2xl z-[9999] border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal max-h-48"
        style={{ left: roleMenuRect.left, top: roleMenuRect.top, width: roleMenuRect.width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
              placeholder="Loc chuc vu..."
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        </div>
        <div className="flex flex-col gap-0.5 overflow-y-auto">
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
      </div>,
      document.body
    );
  };

  const userColumns = [
    {
      header: '',
      className: '!px-1 sm:!px-4',
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
    { header: 'STT', className: 'sm:table-cell w-[50px] text-center !px-1 sm:px-4', render: (row, { index }) => index },
    { header: 'Tên', accessor: 'name', className: 'font-bold text-blue-600 min-w-[140px] !px-1 sm:!px-4' },
    { header: 'Email', accessor: 'email', className: 'hidden sm:table-cell' },
    {
      header: 'Chức vụ',
      accessor: 'role',
      className: 'hidden lg:table-cell w-48 hidden sm:table-cell',
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
                toggleRoleMenu(e, row, `table-${row.id}`);
              }}
              ref={(el) => { roleMenuAnchorRefs.current[`table-${row.id}`] = el; }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 focus:outline-none transition-all cursor-pointer appearance-none text-left relative"
            >
              <span className="truncate block">{label}</span>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </button>

            {renderRoleMenu(row, `table-${row.id}`)}

            {false && openRoleMenuId === row.id && (
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
      header: isBulkSelectMode ? (
        <div className="flex w-full items-center justify-center gap-2 text-[10px] sm:text-sm">
          <button type="button" onClick={(e) => { e.stopPropagation(); handleSelectAllUsers(); }} className="font-semibold text-red-600 hover:text-red-700">Tất cả</button>
          <span className="text-gray-300">/</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleClearSelectedUsers(); }} className="font-semibold text-gray-500 hover:text-gray-700">Bỏ chọn</button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <span>Hành động</span>
        </div>
      ),
      className: 'text-center w-[100px] sm:w-[180px]',
      render: (row) => {
        return (
          <div className="flex justify-center items-center gap-3">
            {isBulkSelectMode ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggleSelectUser(row); }}
                className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-red-50"
                title={selectedUserIds.includes(row.id) ? 'Bỏ chọn' : 'Chọn dòng'}
              >
                {selectedUserIds.includes(row.id) ? (
                  <FaRegSquareMinus size={20} className="text-red-600" />
                ) : (
                  <FaRegSquare size={20} className="text-gray-400" />
                )}
              </button>
            ) : (
              selectedUserIds.length < 2 && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditUser(row); }}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteUser(row.id); }}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95"
                  >
                    Xóa
                  </button>
                </div>
              )
            )}
          </div>
        );
      }
    },
  ];

  // Định nghĩa cột cho bảng danh sách Chức vụ
  const roleTableColumns = useMemo(() => [
    { header: 'STT', render: (_, { index }) => index, className: '!px-1 sm:px-4 !flex !justify-center' },
    {
      header: 'Tên chức vụ', className: '!px-1 sm:!px-4 sm:hidden',
      render: (row) => <span className="font-bold text-gray-700">{row.label}</span>
    },
    {
      header: 'Hành động',
      className: 'text-right pr-5 !px-2 sm:!px-4',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setEditingRole({ id: row.value, name: row.label }); setRoleModalMode('edit'); setIsRoleEditModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95"
          >
            Sửa
          </button>
          <button
            onClick={() => handleDeleteRole(row.value)}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95"
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
            onClick={() => {
              setEditingStatus({ id: row.value, name: row.label });
              setStatusModalMode('edit');
              setStatusErrors({});
              setIsStatusEditModalOpen(true);
            }}
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
    <div className="p-4 sm:p-6 bg-gray-50/50 min-h-screen">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 tracking-tight">Danh sách người dùng</h2>


      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 gap-4">
        {/* Thanh tìm kiếm */}
        <div className="relative w-full lg:max-w-[350px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email"
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
            className={`order-3 lg:order-1 flex-1 lg:flex-none justify-center text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all flex items-center gap-2 text-sm ${selectedUserIds.length > 0 ? 'bg-red-700 hover:bg-red-700 shadow-md active:scale-95' : 'bg-red-700 hover:bg-red-700'}`}
          >
            <Trash2 size={18} />
            Xóa nhiều dòng {selectedUserIds.length > 0 && `(${selectedUserIds.length})`}
          </button>
          <button onClick={handleAddUser} className="order-4 lg:order-4 w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded whitespace-nowrap transition-all active:scale-95 shadow-md text-sm">
            Thêm mới
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-600 p-4">Đang tải dữ liệu người dùng...</p>}
      {error && <p className="text-red-600 p-4">Lỗi: {error}</p>}
      {
        !loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <CustomDatatable
              columns={userColumns}
              data={filteredUsers}
              renderExpansion={(row) => {
                const roleObj = roles.find(r => String(r.value) === String(row.role));
                return (
                  <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-12 md:grid-cols-4 gap-y-4 gap-x-4 sm:gap-x-8 text-sm">
                      <div className="flex flex-col gap-1 col-span-6 md:col-span-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chức vụ</span>
                        <div className="relative max-w-[150px]">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenRolesModal(); }}
                            className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
                          >
                            hiệu chỉnh
                          </button>
                          <button
                            onClick={(e) => {
                              toggleRoleMenu(e, row, `expansion-${row.id}`);
                            }}
                            ref={(el) => { roleMenuAnchorRefs.current[`expansion-${row.id}`] = el; }}
                            className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg p-1 pr-8 appearance-none cursor-pointer outline-none font-medium text-left relative min-h-[30px] w-full block hover:border-blue-400 transition-colors shadow-sm"
                          >
                            <span className="truncate block">{roleObj?.label || '---'}</span>
                            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                              <ChevronDown size={14} />
                            </div>
                          </button>

                          {renderRoleMenu(row, `expansion-${row.id}`)}

                          {false && openRoleMenuId === row.id && (
                            <div className="absolute inset-x-0 top-full mt-1 bg-white rounded-md shadow-2xl z-20 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal overflow-y-auto max-h-48">
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
                                {roles.filter(r => r.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((r) => (
                                  <button
                                    key={r.value}
                                    onClick={() => handleRoleChange(row, r.value)}
                                    className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.role) === String(r.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                  >
                                    <span className="block w-full !whitespace-normal break-words leading-tight">{r.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                      <div className="flex flex-col gap-1 col-span-6 md:col-span-1 lg:hidden">
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
                                  className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg p-1 pr-8 appearance-none cursor-pointer outline-none font-medium text-left relative min-h-[30px] w-full block hover:border-blue-400 transition-colors shadow-sm"
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
                      <div className="flex flex-col gap-1 col-span-7 md:col-span-1 md:hidden">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
                        <span className="text-gray-900 font-medium break-all">{row.email || '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1 col-span-5 md:col-span-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số điện thoại</span>
                        <span className="text-gray-900 font-medium">{row.phone || '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1 col-span-12 md:col-span-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Địa chỉ</span>
                        <span className="text-gray-900 font-medium">{row.address || '---'}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </div>

        )
      }

      {/* Modal Thêm/Sửa Người dùng */}
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
              Thêm chức vụ
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
        onClose={handleCloseRoleEditModal}
        title={roleModalMode === 'add' ? "Thêm chức vụ mới" : "Chỉnh sửa chức vụ"}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleRoleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-bold ${roleErrors.name ? 'text-red-500' : 'text-gray-700'}`}>Tên chức vụ <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={`w-full border ${roleErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`}
              placeholder="Nhập tên chức vụ..."
              value={editingRole.name}
              onChange={(e) => {
                setEditingRole({ ...editingRole, name: e.target.value });
                if (roleErrors.name) setRoleErrors({});
              }}
              autoFocus
            />
            {roleErrors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{roleErrors.name}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={handleCloseRoleEditModal} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">Hủy</button>
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
            <button onClick={() => {
              setEditingStatus({ name: '' });
              setStatusModalMode('add');
              setStatusErrors({});
              setIsStatusEditModalOpen(true);
            }} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              Thêm trạng thái
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
        onClose={handleCloseStatusEditModal}
        title={statusModalMode === 'add' ? "Thêm trạng thái mới" : "Chỉnh sửa trạng thái"}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-bold ${statusErrors.name ? 'text-red-500' : 'text-gray-700'}`}>Tên trạng thái <span className="text-red-500">*</span></label>
            <input
              type="text"
              className={`w-full border ${statusErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`}
              placeholder="Tên trạng thái"
              value={editingStatus.name}
              onChange={(e) => {
                setEditingStatus({ ...editingStatus, name: e.target.value });
                if (statusErrors.name) setStatusErrors({});
              }}
              autoFocus
            />
            {statusErrors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{statusErrors.name}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={handleCloseStatusEditModal} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">Hủy</button>
            <button type="submit" className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 text-sm">Lưu</button>
          </div>
        </form>
      </Modal>

      <CustomConfirm
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' })}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type === 'export' ? 'success' : (confirmModal.type === 'bulkDelete' || confirmModal.type === 'delete' ? 'danger' : 'success')}
      />

      {/* App Notification */}
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
    </div >
  )
}
