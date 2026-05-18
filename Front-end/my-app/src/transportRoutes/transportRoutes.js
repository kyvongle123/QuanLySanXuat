import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MapPin, Truck, Package, Plus, Trash2, Edit3, ArrowRight, Search, MapPinned, FileDown, FileUp, ChevronRight, User } from 'lucide-react';
import { TbSortDescending } from "react-icons/tb";
import { Modal, CustomSelect, AppNotification, CustomConfirm, CustomDatatable } from '../customComponent/customComponent';
import { getTransportRoutes, createTransportRoute, updateTransportRoute, deleteTransportRoute } from '../controller/transportRoutesController';
import { getTransportVehicles, getTransportVehicle, createTransportVehicle, updateTransportVehicle, deleteTransportVehicle } from '../controller/transportVehiclesController';
import { getDrivers, getDriver, createDriver, updateDriver, deleteDriver } from '../controller/driversController';
import { getItems, updateItem } from '../controller/itemsController';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../controller/customersController';

export const TransportRoutes = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [currentCustomer, setCurrentCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentRoute, setCurrentRoute] = useState({ from: '', to: '', driver: '', transportVehicle: '', selectedItems: [] });
  const [routeErrors, setRouteErrors] = useState({});
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [openFromMenuId, setOpenFromMenuId] = useState(null);
  const [openToMenuId, setOpenToMenuId] = useState(null);
  const [openVehicleMenuId, setOpenVehicleMenuId] = useState(null);
  const [openRouteMenuAnchorKey, setOpenRouteMenuAnchorKey] = useState(null);
  const [routeMenuRect, setRouteMenuRect] = useState(null);
  const routeMenuAnchorRefs = useRef({});

  // States cho quản lý Khách hàng (Customers)
  const [isCustomersModalOpen, setIsCustomersModalOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerModalMode, setCustomerModalMode] = useState('list'); // 'list', 'add', 'edit'
  const [isCustomersMgmtMaximized, setIsCustomersMgmtMaximized] = useState(false);
  const [isCustomerEditModalOpen, setIsCustomerEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', taxCode: '', website: '', note: '' });
  const [customerErrors, setCustomerErrors] = useState({});
  const [customersRawData, setCustomersRawData] = useState([]);

  // States cho quản lý Tài xế (Drivers)
  const [isDriversModalOpen, setIsDriversModalOpen] = useState(false);
  const [driverSearchTerm, setDriverSearchTerm] = useState('');
  const [driverModalMode, setDriverModalMode] = useState('list'); // 'list', 'add', 'edit'
  const [isDriversMgmtMaximized, setIsDriversMgmtMaximized] = useState(false);
  const [isDriverEditModalOpen, setIsDriverEditModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState({ name: '', phone: '', email: '', licenseNumber: '', note: '' });
  const [driverErrors, setDriverErrors] = useState({});
  const [driversRawData, setDriversRawData] = useState([]);

  // States cho quản lý Xe hàng (Transport Vehicles)
  const [isVehiclesModalOpen, setIsVehiclesModalOpen] = useState(false);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
  const [vehicleModalMode, setVehicleModalMode] = useState('list'); // 'list', 'add', 'edit'
  const [isVehiclesMgmtMaximized, setIsVehiclesMgmtMaximized] = useState(false);
  const [isVehicleEditModalOpen, setIsVehicleEditModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState({ vehicleCode: '', licensePlate: '', type: '', capacity: '', note: '' });
  const [vehicleErrors, setVehicleErrors] = useState({});
  const [vehiclesRawData, setVehiclesRawData] = useState([]);

  const sortMenuRef = useRef(null);
  const [sortMenu, setSortMenu] = useState({ isOpen: false, activeField: null });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  // Lắng nghe sự kiện click toàn cục để đóng menu khi bấm ra ngoài
  useEffect(() => {
    const handleGlobalClick = (event) => {
      setOpenFromMenuId(null);
      setOpenToMenuId(null);
      setOpenVehicleMenuId(null);
      setOpenRouteMenuAnchorKey(null);
      setRouteMenuRect(null);
      setMenuSearchQuery('');

      // Đóng menu sắp xếp nếu click ra ngoài
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setSortMenu({ isOpen: false, activeField: null });
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [sortMenu.isOpen]);

  useEffect(() => {
    const openRouteMenuId = openVehicleMenuId || openToMenuId;
    if (!openRouteMenuId || !openRouteMenuAnchorKey) return;

    const updateRouteMenuRect = () => {
      const anchor = routeMenuAnchorRefs.current[openRouteMenuAnchorKey];
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setRouteMenuRect({
        left: rect.left + (rect.width / 2) - 112,
        top: rect.bottom + 4,
        width: 224,
      });
    };

    updateRouteMenuRect();
    window.addEventListener('resize', updateRouteMenuRect);
    window.addEventListener('scroll', updateRouteMenuRect, true);

    return () => {
      window.removeEventListener('resize', updateRouteMenuRect);
      window.removeEventListener('scroll', updateRouteMenuRect, true);
    };
  }, [openVehicleMenuId, openToMenuId, openRouteMenuAnchorKey]);

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [routesData, driversData, itemsData, vehiclesData, customersData] = await Promise.all([
          getTransportRoutes(),
          getDrivers(),
          getItems(),
          getTransportVehicles(),
          getCustomers()
        ]);
        console.log("customersData la", customersData);
        setRoutes(routesData);
        // Map dữ liệu an toàn để chấp nhận cả PascalCase từ Backend
        setDriversRawData(driversData);
        setDrivers(driversData.map(d => ({ value: d.id || d.Id, label: d.name || d.Name })));
        setVehiclesRawData(vehiclesData);
        setVehicles(vehiclesData.map(v => ({
          value: v.id || v.Id,
          label: v.licensePlate || v.LicensePlate,
          vehicleCode: v.vehicleCode || v.VehicleCode
        })));
        setItems(itemsData); // Lưu toàn bộ object để không mất thông tin khi updateItem
        setCustomersRawData(customersData);
        setCustomers(customersData.map(c => ({ value: c.id || c.Id, label: c.name || c.Name })));
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Thêm logic lọc lộ trình để thanh tìm kiếm hoạt động
  const filteredRoutes = useMemo(() => {
    let result = routes.filter(route => {
      const driverName = drivers.find(d => d.value === route.driver)?.label || '';
      return (
        driverName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'to') {
          valA = customers.find(c => String(c.value) === String(a.to))?.label || '';
          valB = customers.find(c => String(c.value) === String(b.to))?.label || '';
        } else if (sortConfig.key === 'transportVehicle') {
          const vA = vehicles.find(v => v.value === a.transportVehicle);
          const vB = vehicles.find(v => v.value === b.transportVehicle);
          valA = vA ? `${vA.vehicleCode} - ${vA.label}` : '';
          valB = vB ? `${vB.vehicleCode} - ${vB.label}` : '';
        } else if (sortConfig.key === 'driver') {
          valA = drivers.find(d => d.value === a.driver)?.label || '';
          valB = drivers.find(d => d.value === b.driver)?.label || '';
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [routes, searchTerm, drivers, customers, vehicles, sortConfig]);

  const handleFromChange = async (route, newBranchId) => {
    try {
      const updated = await updateTransportRoute(route.id, { ...route, from: parseInt(newBranchId) });
      setRoutes(prev => prev.map(r => r.id === updated.id ? updated : r));
      setOpenFromMenuId(null);
      showNotification("Cập nhật điểm xuất phát thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật điểm xuất phát.", "error");
    }
  };

  // Mở modal Thêm/Sửa
  const handleOpenModal = (mode, customer = null) => {
    setModalMode(mode);
    if (mode === 'edit' && customer) {
      setEditingCustomer(customer);
    } else {
      setEditingCustomer({ name: '', contactPerson: '', email: '', phone: '', address: '', taxCode: '', website: '', note: '' });
    }
    setIsCustomerEditModalOpen(true);
  };

  const handleVehicleChange = async (route, newVehicleId) => {
    try {
      const updated = await updateTransportRoute(route.id, { ...route, transportVehicle: parseInt(newVehicleId) });
      setRoutes(prev => prev.map(r => r.id === updated.id ? updated : r));
      setOpenVehicleMenuId(null);
      showNotification("Cập nhật xe hàng thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật xe hàng.", "error");
    }
  };

  const handleToChange = async (route, newBranchId) => {
    try {
      const updated = await updateTransportRoute(route.id, { ...route, to: parseInt(newBranchId) });
      setRoutes(prev => prev.map(r => r.id === updated.id ? updated : r));
      setOpenToMenuId(null);
      setOpenRouteMenuAnchorKey(null);
      setRouteMenuRect(null);
      showNotification("Cập nhật điểm đến thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật điểm đến.", "error");
    }
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách chuyến hàng ra tệp Excel không?'
    });
  };

  const toggleRouteMenu = (e, routeId, menuType) => {
    e.stopPropagation();
    const anchorKey = `${menuType}-${routeId}`;
    const isVehicleMenu = menuType === 'vehicle';
    const isSameMenuOpen = isVehicleMenu ? openVehicleMenuId === routeId : openToMenuId === routeId;

    if (isSameMenuOpen && openRouteMenuAnchorKey === anchorKey) {
      if (isVehicleMenu) setOpenVehicleMenuId(null);
      else setOpenToMenuId(null);
      setOpenRouteMenuAnchorKey(null);
      setRouteMenuRect(null);
      setMenuSearchQuery('');
      return;
    }

    setOpenFromMenuId(null);
    setOpenVehicleMenuId(isVehicleMenu ? routeId : null);
    setOpenToMenuId(isVehicleMenu ? null : routeId);
    setOpenRouteMenuAnchorKey(anchorKey);
    setMenuSearchQuery('');

    const rect = e.currentTarget.getBoundingClientRect();
    setRouteMenuRect({
      left: rect.left + (rect.width / 2) - 112,
      top: rect.bottom + 4,
      width: 224,
    });
  };

  const renderRouteVehicleMenu = (route) => {
    const anchorKey = `vehicle-${route.id}`;
    if (openVehicleMenuId !== route.id || openRouteMenuAnchorKey !== anchorKey || !routeMenuRect) return null;

    return createPortal(
      <div
        className="fixed bg-white rounded-md shadow-2xl z-[9999] border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top"
        style={{ left: routeMenuRect.left, top: routeMenuRect.top, width: routeMenuRect.width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-1.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-6 pr-2 py-1 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
              placeholder="Lọc xe hàng..."
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
          {vehicles.filter(v => v.label.toLowerCase().includes(menuSearchQuery.toLowerCase()) || v.vehicleCode.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((v) => (
            <button
              key={v.value}
              onClick={() => handleVehicleChange(route, v.value)}
              className={`px-2 py-2 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(route.transportVehicle) === String(v.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <span className="block w-full whitespace-normal break-words leading-tight">{v.vehicleCode} - {v.label}</span>
            </button>
          ))}
        </div>
      </div>,
      document.body
    );
  };

  const renderRouteToMenu = (route) => {
    const anchorKey = `to-${route.id}`;
    if (openToMenuId !== route.id || openRouteMenuAnchorKey !== anchorKey || !routeMenuRect) return null;

    return createPortal(
      <div
        className="fixed bg-white rounded-md shadow-2xl z-[9999] border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top"
        style={{ left: routeMenuRect.left, top: routeMenuRect.top, width: routeMenuRect.width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-1.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-6 pr-2 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
              placeholder="Lọc chi nhánh..."
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
          {customers.filter(c => c.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((c) => (
            <button
              key={c.value}
              onClick={() => handleToChange(route, c.value)}
              className={`px-2 py-2 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(route.to) === String(c.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <span className="block w-full whitespace-normal break-words leading-tight">{c.label}</span>
            </button>
          ))}
        </div>
      </div>,
      document.body
    );
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách chuyến hàng');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Mã lộ trình', key: 'id', width: 15 },
        { header: 'Điểm xuất phát', key: 'from', width: 20 },
        { header: 'Điểm đến', key: 'to', width: 30 },
        { header: 'Tài xế', key: 'driver', width: 25 },
        { header: 'Xe vận chuyển', key: 'vehicle', width: 25 },
        { header: 'Kiện hàng', key: 'items', width: 40 },
      ];

      filteredRoutes.forEach((route, index) => {
        const driver = drivers.find(d => d.value === route.driver)?.label || 'N/A';
        const vehicle = vehicles.find(v => v.value === route.transportVehicle);
        const vehicleLabel = vehicle ? `${vehicle.vehicleCode} - ${vehicle.label}` : 'N/A';
        const destination = customers.find(c => String(c.value) === String(route.to))?.label || 'N/A';
        const routeItems = items
          .filter(i => (i.transportRoute || i.TransportRoute) === route.id)
          .map(i => i.name || i.Name)
          .join(', ');

        worksheet.addRow({
          stt: index + 1,
          id: `RT-${route.id.toString().padStart(4, '0')}`,
          from: 'Nhà máy',
          to: destination,
          driver: driver,
          vehicle: vehicleLabel,
          items: routeItems || 'Chưa có kiện hàng'
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
          // Lấy giá trị của cột "Điểm đến" (key: 'to') và "Kiện hàng" (key: 'items')
          const toValue = row.getCell('to').value ? String(row.getCell('to').value) : "";
          const itemsValue = row.getCell('items').value ? String(row.getCell('items').value) : "";

          // Ước tính số dòng dựa trên độ rộng cột và cỡ chữ 12
          // Cột 'to' có width = 30 -> Khoảng 25 ký tự sẽ xuống dòng
          const estimatedLinesTo = Math.ceil(toValue.length / 25) || 1;
          // Cột 'items' có width = 40 -> Khoảng 35 ký tự sẽ xuống dòng
          const estimatedLinesItems = Math.ceil(itemsValue.length / 35) || 1;

          // Lấy số dòng lớn nhất giữa 2 cột để tăng chiều cao hàng
          const maxLines = Math.max(estimatedLinesTo, estimatedLinesItems);

          // Chiều cao cơ bản là 25px. Mỗi dòng tiếp theo cộng thêm 18px để hiển thị ổn định.
          row.height = 25 + (maxLines - 1) * 18;
        }
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          if (colNumber === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách chuyến hàng.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  // Handlers cho quản lý Khách hàng
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!editingCustomer.name?.trim()) newErrors.name = "Bắt buộc nhập Tên khách hàng";
    if (!editingCustomer.contactPerson?.trim()) newErrors.contactPerson = "Bắt buộc nhập Người liên hệ";
    if (!editingCustomer.phone?.trim()) newErrors.phone = "Bắt buộc nhập Số điện thoại";
    if (!editingCustomer.email?.trim()) newErrors.email = "Bắt buộc nhập Email";
    if (!editingCustomer.address?.trim()) newErrors.address = "Bắt buộc nhập Địa chỉ";
    if (!editingCustomer.taxCode?.trim()) newErrors.taxCode = "Bắt buộc nhập Mã số thuế";
    if (!editingCustomer.website?.trim()) newErrors.website = "Bắt buộc nhập Website";
    if (!editingCustomer.note?.trim()) newErrors.note = "Bắt buộc nhập Ghi chú";

    if (Object.keys(newErrors).length > 0) {
      setCustomerErrors(newErrors);
      return;
    }

    setCustomerErrors({}); // Clear errors if validation passes

    try {
      let savedCustomer;
      if (customerModalMode === 'add') {
        // Đảm bảo các trường không bắt buộc nhưng có thể null được gửi đúng định dạng
        const payload = { ...editingCustomer, taxCode: editingCustomer.taxCode || null, website: editingCustomer.website || null, note: editingCustomer.note || null };
        savedCustomer = await createCustomer(payload);
        showNotification("Thêm khách hàng thành công!");
      } else {
        savedCustomer = await updateCustomer(editingCustomer.id, editingCustomer);
        showNotification("Cập nhật khách hàng thành công!");
      }
      setIsCustomerEditModalOpen(false);
      // Tải lại dữ liệu
      const data = await getCustomers();
      setCustomersRawData(data);
      setCustomers(data.map(c => ({ value: c.id || c.Id, label: c.name || c.Name })));

      // Tự động chọn khách hàng vừa tạo/cập nhật trong select của lộ trình
      if (savedCustomer) {
        setCurrentRoute(prev => ({ ...prev, to: savedCustomer.id || savedCustomer.Id }));
        setRouteErrors(prev => ({ ...prev, to: null }));
      }
    } catch (err) {
      showNotification("Lỗi khi lưu khách hàng", "error");
    }
  };

  const handleDeleteCustomer = async (id) => {
    setConfirmModal({
      isOpen: true,
      id,
      type: 'deleteCustomer',
      title: 'Xác nhận xóa khách hàng',
      message: 'Khách hàng sẽ bị xóa vĩnh viễn. Bạn có chắc chắn?'
    });
  };

  const handleOpenCustomersModal = () => {
    setCustomerModalMode('list');
    setCustomerSearchTerm('');
    setIsCustomersModalOpen(true);
  };

  const handleCustomerEditModalInputChange = (e) => {
    const { name, value } = e.target;
    setEditingCustomer(prev => ({ ...prev, [name]: value }));
    if (customerErrors[name]) setCustomerErrors(prev => ({ ...prev, [name]: null }));
  };

  const customerTableColumns = useMemo(() => [
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
    { header: 'STT', className: 'w-[50px] text-center !px-1 sm:!px-4', render: (row, { index }) => index },
    { header: 'Họ tên', accessor: 'name', className: 'font-bold text-blue-600 min-w-[140px] !px-1 sm:!px-4' },
    { header: 'Email', accessor: 'email', className: 'hidden md:table-cell' },
    { header: 'Số điện thoại', accessor: 'phone', className: 'hidden sm:table-cell w-32 sm:w-40' },
    { header: 'Địa chỉ', accessor: 'address', className: 'hidden lg:table-cell' },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-5 w-[120px] sm:w-[160px]',
      render: (row) => ( // Bỏ nút xóa cá nhân
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={() => handleOpenModal('edit', row)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95"
          >
            Sửa
          </button>
          <button
            onClick={() => setConfirmModal({
              isOpen: true,
              id: row.id,
              type: 'delete',
              title: 'Xác nhận xóa',
              message: `Bạn có chắc chắn muốn xóa khách hàng "${row.name}"?`
            })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ], []);

  // Handlers cho quản lý Tài xế
  const handleDriverSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!editingDriver.name?.trim()) newErrors.name = "Bắt buộc nhập Tên tài xế";
    if (!editingDriver.phone?.trim()) newErrors.phone = "Bắt buộc nhập Số điện thoại";

    if (Object.keys(newErrors).length > 0) {
      setDriverErrors(newErrors);
      return;
    }

    setDriverErrors({});

    try {
      let savedDriver;
      if (driverModalMode === 'add') {
        savedDriver = await createDriver(editingDriver);
        showNotification("Thêm tài xế thành công!");
      } else {
        savedDriver = await updateDriver(editingDriver.id || editingDriver.Id, editingDriver);
        showNotification("Cập nhật tài xế thành công!");
      }
      setIsDriverEditModalOpen(false);
      const data = await getDrivers();
      setDriversRawData(data);
      setDrivers(data.map(d => ({ value: d.id || d.Id, label: d.name || d.Name })));

      if (savedDriver) {
        setCurrentRoute(prev => ({ ...prev, driver: savedDriver.id || savedDriver.Id }));
        setRouteErrors(prev => ({ ...prev, driver: null }));
      }
    } catch (err) {
      showNotification("Lỗi khi lưu tài xế", "error");
    }
  };

  const handleOpenDriversModal = () => {
    setDriverModalMode('list');
    setDriverSearchTerm('');
    setIsDriversModalOpen(true);
  };

  const handleDriverEditModalInputChange = (e) => {
    const { name, value } = e.target;
    setEditingDriver(prev => ({ ...prev, [name]: value }));
    if (driverErrors[name]) setDriverErrors(prev => ({ ...prev, [name]: null }));
  };

  const driverTableColumns = useMemo(() => [
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
    { header: 'STT', className: 'w-[50px] text-center !px-1 sm:!px-4', render: (row, { index }) => index },
    { header: 'Họ tên', accessor: 'name', className: 'font-bold text-blue-600 min-w-[140px] !px-1 sm:!px-4' },
    { header: 'Số điện thoại', accessor: 'phone', className: 'w-32 sm:w-40' },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-5 w-[120px] sm:w-[160px]',
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={() => { setEditingDriver(row); setDriverModalMode('edit'); setIsDriverEditModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95"
          >
            Sửa
          </button>
          <button
            onClick={() => setConfirmModal({
              isOpen: true,
              id: row.id || row.Id,
              type: 'deleteDriver',
              title: 'Xác nhận xóa',
              message: `Bạn có chắc chắn muốn xóa tài xế "${row.name || row.Name}"?`
            })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ], []);

  // Handlers cho quản lý Xe hàng
  const handleVehicleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!editingVehicle.vehicleCode?.trim()) newErrors.vehicleCode = "Bắt buộc nhập Mã xe";
    if (!editingVehicle.licensePlate?.trim()) newErrors.licensePlate = "Bắt buộc nhập Biển số xe";

    if (Object.keys(newErrors).length > 0) {
      setVehicleErrors(newErrors);
      return;
    }

    setVehicleErrors({});

    try {
      let savedVehicle;
      if (vehicleModalMode === 'add') {
        savedVehicle = await createTransportVehicle(editingVehicle);
        showNotification("Thêm xe hàng thành công!");
      } else {
        savedVehicle = await updateTransportVehicle(editingVehicle.id || editingVehicle.Id, editingVehicle);
        showNotification("Cập nhật xe hàng thành công!");
      }
      setIsVehicleEditModalOpen(false);
      const data = await getTransportVehicles();
      setVehiclesRawData(data);
      setVehicles(data.map(v => ({
        value: v.id || v.Id,
        label: v.licensePlate || v.LicensePlate,
        vehicleCode: v.vehicleCode || v.VehicleCode
      })));

      if (savedVehicle) {
        setCurrentRoute(prev => ({ ...prev, transportVehicle: savedVehicle.id || savedVehicle.Id }));
        setRouteErrors(prev => ({ ...prev, transportVehicle: null }));
      }
    } catch (err) {
      showNotification("Lỗi khi lưu xe hàng", "error");
    }
  };

  const handleOpenVehiclesModal = () => {
    setVehicleModalMode('list');
    setVehicleSearchTerm('');
    setIsVehiclesModalOpen(true);
  };

  const handleVehicleEditModalInputChange = (e) => {
    const { name, value } = e.target;
    setEditingVehicle(prev => ({ ...prev, [name]: value }));
    if (vehicleErrors[name]) setVehicleErrors(prev => ({ ...prev, [name]: null }));
  };

  const vehicleTableColumns = useMemo(() => [
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
    { header: 'STT', className: 'w-[50px] text-center !px-1 sm:!px-4', render: (row, { index }) => index },
    { header: 'Mã xe', accessor: 'vehicleCode', className: 'font-bold text-blue-600 min-w-[100px] !px-1 sm:!px-4' },
    { header: 'Biển số', accessor: 'licensePlate', className: 'w-32 sm:w-40 font-medium' },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-5 w-[120px] sm:w-[160px]',
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={() => { setEditingVehicle(row); setVehicleModalMode('edit'); setIsVehicleEditModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95"
          >
            Sửa
          </button>
          <button
            onClick={() => setConfirmModal({
              isOpen: true,
              id: row.id || row.Id,
              type: 'deleteVehicle',
              title: 'Xác nhận xóa',
              message: `Bạn có chắc chắn muốn xóa xe hàng "${row.vehicleCode || row.VehicleCode}"?`
            })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 !px-2 sm:!px-3 rounded text-xs transition-all active:scale-95"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ], []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setCurrentRoute({ from: '', to: '', driver: '', transportVehicle: '', selectedItems: [] });
    setRouteErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
    setRouteErrors({});
  };

  const handleOpenEdit = (route) => {
    setModalMode('edit');
    // Tìm các mặt hàng đang thuộc lộ trình này để tick vào checkbox
    const itemsOnThisRoute = items
      .filter(i => (i.transportRoute || i.TransportRoute) === route.id)
      .map(i => i.id || i.Id);

    setCurrentRoute({
      ...route,
      transportVehicle: route.transportVehicle || '',
      selectedItems: itemsOnThisRoute
    });
    setRouteErrors({});
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!currentRoute.to) newErrors.to = "Bắt buộc nhập Điểm đến";
    if (!currentRoute.driver) newErrors.driver = "Bắt buộc nhập Chỉ định tài xế";
    if (!currentRoute.transportVehicle) newErrors.transportVehicle = "Bắt buộc nhập Chọn xe hàng";

    if (Object.keys(newErrors).length > 0) {
      setRouteErrors(newErrors);
      return;
    }

    setRouteErrors({});

    try {
      const payload = {
        id: parseInt(currentRoute.id) || 0,
        from: parseInt(currentRoute.from),
        to: parseInt(currentRoute.to),
        driver: parseInt(currentRoute.driver),
        transportVehicle: parseInt(currentRoute.transportVehicle)
      };

      let savedRoute;
      if (modalMode === 'add') {
        savedRoute = await createTransportRoute(payload);
        setRoutes(prev => [...prev, savedRoute]);
      } else {
        savedRoute = await updateTransportRoute(currentRoute.id, payload);
        setRoutes(prev => prev.map(r => r.id === savedRoute.id ? savedRoute : r));
      }

      const routeId = savedRoute.id || savedRoute.Id;

      // Cập nhật transportRoute cho các Item liên quan
      // 1. Những item trước đây thuộc route này nhưng giờ không còn trong selectedItems -> Set null
      const itemsToRemove = items.filter(i =>
        (i.transportRoute || i.TransportRoute) === routeId &&
        !currentRoute.selectedItems.includes(i.id || i.Id)
      );

      // 2. Những item được chọn mới -> Set routeId
      const itemsToAdd = items.filter(i =>
        currentRoute.selectedItems.includes(i.id || i.Id) &&
        (i.transportRoute || i.TransportRoute) !== routeId
      );

      const updatePromises = [
        ...itemsToRemove.map(i => updateItem(i.id || i.Id, { ...i, transportRoute: null })),
        ...itemsToAdd.map(i => updateItem(i.id || i.Id, { ...i, transportRoute: routeId }))
      ];

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        // Refresh lại danh sách items để UI đồng bộ
        const refreshedItems = await getItems();
        setItems(refreshedItems);
      }

      handleCloseModal();
      setNotification({ isOpen: true, message: "Lưu lộ trình thành công!", type: 'success' });
    } catch (err) {
      setNotification({ isOpen: true, message: "Lỗi khi lưu dữ liệu", type: 'error' });
    }
  };

  return (
    <div className="p-2 lg:p-6">
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Danh sách chuyến hàng</h2>

          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setSortMenu(prev => ({ ...prev, isOpen: !prev.isOpen })); }}
              className="p-2.5 text-gray-600 hover:bg-white hover:text-blue-600 rounded-xl transition-all active:scale-95 shadow-sm border border-transparent hover:border-blue-100"
              title="Sắp xếp danh sách"
            >
              <TbSortDescending size={24} />
            </button>

            {sortMenu.isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 flex justify-between items-center border-b border-gray-50 mb-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sắp xếp theo</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSortConfig({ key: null, direction: null });
                      setSortMenu({ isOpen: false, activeField: null });
                    }}
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-wider transition-colors px-1"
                  >
                    Mặc định
                  </button>
                </div>
                {[
                  { label: 'Điểm đến', value: 'to' },
                  { label: 'Xe hàng', value: 'transportVehicle' },
                  { label: 'Tài xế', value: 'driver' },
                ].map((field) => (
                  <div
                    key={field.value}
                    className="relative"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setSortMenu(prev => ({ ...prev, activeField: prev.activeField === field.value ? null : field.value })); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${sortMenu.activeField === field.value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {field.label}
                      <ChevronRight size={14} className={`transition-transform ${sortMenu.activeField === field.value ? 'rotate-180 opacity-100' : 'opacity-0'}`} />
                    </button>

                    {sortMenu.activeField === field.value && (
                      <div className="absolute right-full top-0 mr-1 w-32 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 animate-in fade-in slide-in-from-right-1 duration-200">
                        <button
                          onClick={() => { setSortConfig({ key: field.value, direction: 'asc' }); setSortMenu({ isOpen: false, activeField: null }); }}
                          className={`w-full text-left px-4 py-2 text-xs hover:bg-blue-50 hover:text-blue-700 transition-colors ${sortConfig.key === field.value && sortConfig.direction === 'asc' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
                        >
                          Tăng dần
                        </button>
                        <button
                          onClick={() => { setSortConfig({ key: field.value, direction: 'desc' }); setSortMenu({ isOpen: false, activeField: null }); }}
                          className={`w-full text-left px-4 py-2 text-xs hover:bg-blue-50 hover:text-blue-700 transition-colors ${sortConfig.key === field.value && sortConfig.direction === 'desc' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}
                        >
                          Giảm dần
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          <div className="relative w-full lg:max-w-[350px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm chuyến hàng"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="flex-1 lg:flex-none justify-center bg-orange-500 hover:bg-orange-600 py-2.5 text-white font-bold px-6 rounded flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm">
                <FileUp size={18} />Nhập Excel
              </button>
              <button
                onClick={handleRequestExportExcel}
                className="flex-1 justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm"
              >
                <FileDown size={18} />Xuất Excel
              </button>
            </div>
            <button
              onClick={handleOpenAdd}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-100 active:scale-95 text-sm"
            >
              <Plus size={18} /> Tạo chuyến hàng
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20 text-gray-400 italic">Đang tải dữ liệu lộ trình...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRoutes.map((route) => {
            const driver = drivers.find(d => d.value === route.driver);
            const vehicle = vehicles.find(v => v.value === route.transportVehicle);

            return (
              <div key={route.id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>

                {/* Header Card */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <MapPinned size={12} />
                    RT-{route.id.toString().padStart(4, '0')}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(route)} className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg">
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmModal({
                        isOpen: true,
                        id: route.id,
                        type: 'delete',
                        title: 'Xóa lộ trình',
                        message: 'Bạn có chắc chắn muốn hủy lộ trình vận chuyển này?'
                      })}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Route Visual */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenFromMenuId(openFromMenuId === route.id ? null : route.id);
                          setOpenToMenuId(null);
                          setMenuSearchQuery('');
                        }}
                        className={`p-3 rounded-xl mb-2 transition-colors bg-gray-100 text-gray-400 cursor-not-allowed opacity-70`}
                        title="Thay đổi điểm xuất phát"
                        disabled
                      >
                        <MapPin size={24} />
                      </button>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-800 text-center whitespace-normal leading-tight min-h-[24px]">{'Nhà máy'}</span>
                  </div>

                  <div className="flex flex-col items-center flex-1 px-2">
                    <div className="w-full flex items-center gap-1 mb-2 relative">
                      <div className="h-px bg-gray-200 flex-1 border-dashed border-t"></div>
                      <button
                        ref={(el) => { routeMenuAnchorRefs.current[`vehicle-${route.id}`] = el; }}
                        onClick={(e) => {
                          toggleRouteMenu(e, route.id, 'vehicle');
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${openVehicleMenuId === route.id ? 'bg-blue-600 text-white shadow-md' : 'text-blue-500 hover:bg-blue-50'}`}
                        title="Thay đổi xe hàng"
                      >
                        <Truck size={20} />
                      </button>
                      <div className="h-px bg-gray-200 flex-1 border-dashed border-t"></div>

                      {renderRouteVehicleMenu(route)}

                      {false && openVehicleMenuId === route.id && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-56 bg-white rounded-md shadow-2xl z-20 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top" onClick={e => e.stopPropagation()}>
                          <div className="p-1.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                            <div className="relative">
                              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                className="w-full pl-6 pr-2 py-1 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                                placeholder="Lọc xe hàng..."
                                value={menuSearchQuery}
                                onChange={(e) => setMenuSearchQuery(e.target.value)}
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                            {vehicles.filter(v => v.label.toLowerCase().includes(menuSearchQuery.toLowerCase()) || v.vehicleCode.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((v) => (
                              <button
                                key={v.value}
                                onClick={() => handleVehicleChange(route, v.value)}
                                className={`px-2 py-2 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(route.transportVehicle) === String(v.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                              >
                                <span className="block w-full whitespace-normal break-words leading-tight">{v.vehicleCode} - {v.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-700 font-bold whitespace-nowrap">
                      {vehicle ? `${vehicle.vehicleCode} - ${vehicle.label}` : 'Đang chuyển'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <button
                        ref={(el) => { routeMenuAnchorRefs.current[`to-${route.id}`] = el; }}
                        onClick={(e) => {
                          toggleRouteMenu(e, route.id, 'to');
                        }}
                        className={`p-3 rounded-xl mb-2 transition-colors ${openToMenuId === route.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        title="Thay đổi điểm đến"
                      >
                        <MapPin size={24} />
                      </button>

                      {renderRouteToMenu(route)}

                      {false && openToMenuId === route.id && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-56 bg-white rounded-md shadow-2xl z-20 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top" onClick={e => e.stopPropagation()}>
                          <div className="p-1.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                            <div className="relative">
                              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                className="w-full pl-6 pr-2 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                                placeholder="Lọc chi nhánh..."
                                value={menuSearchQuery}
                                onChange={(e) => setMenuSearchQuery(e.target.value)}
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                            {customers.filter(c => c.label.toLowerCase().includes(menuSearchQuery.toLowerCase())).map((c) => (
                              <button
                                key={c.value}
                                onClick={() => handleToChange(route, c.value)}
                                className={`px-2 py-2 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(route.to) === String(c.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                              >
                                <span className="block w-full whitespace-normal break-words leading-tight">{c.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-800 text-center whitespace-normal leading-tight min-h-[24px]">
                      {customers.find(c => String(c.value) === String(route.to))?.label || 'Chưa xác định'}
                    </span>
                  </div>
                </div>

                {/* Footer Card: Driver & Items */}
                <div className="pt-4 border-t border-gray-50 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border border-white shadow-sm">
                      {driver?.label?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 leading-none">Tài xế phụ trách</p>
                      <p className="text-xs font-bold text-gray-700">{driver?.label || 'Chưa phân công'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {/* Hiển thị kiện hàng thực tế dựa trên TransportRoute ID */}
                    {items.filter(i => (i.transportRoute || i.TransportRoute) === route.id).map((item) => (
                      <div key={item.id || item.Id} className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-blue-100 max-w-[120px]">
                        <Package size={10} className="shrink-0" />
                        <span className="truncate">{item.name || item.Name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm Lộ Trình */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thiết lập lộ trình mới' : 'Cập nhật lộ trình'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-lg'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Điểm xuất phát (Từ)</label>
              <input
                type="text"
                value="Nhà máy"
                disabled
                readOnly
                className="w-full border border-gray-300 rounded-lg shadow-sm p-2.5 text-sm bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
              />
            </div>
            <div className="flex justify-center py-0">
              <div className="bg-gray-100 p-2 rounded-full text-gray-400">
                <ArrowRight size={20} className="rotate-90 md:rotate-0" />
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                className="absolute right-1 top-1 text-blue-600 hover:text-blue-800 text-[10px] font-bold underline z-20 leading-none bg-white px-1 rounded transition-colors"
                onClick={(e) => { e.stopPropagation(); handleOpenCustomersModal(); }}
              >
                hiệu chỉnh
              </button>
              <CustomSelect
                label="Điểm đến (Đến)"
                options={customers}
                value={currentRoute.to}
                onChange={(e) => {
                  setCurrentRoute({ ...currentRoute, to: e.target.value });
                  if (routeErrors.to) setRouteErrors(prev => ({ ...prev, to: null }));
                }}
                error={!!routeErrors.to}
                errorMessage={routeErrors.to}
                wrapText={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <button
                type="button"
                className="absolute right-1 top-1 text-blue-600 hover:text-blue-800 text-[10px] font-bold underline z-20 leading-none bg-white px-1 rounded transition-colors"
                onClick={(e) => { e.stopPropagation(); handleOpenDriversModal(); }}
              >
                hiệu chỉnh
              </button>
              <CustomSelect
                label="Chỉ định Tài xế"
                options={[...drivers]}
                value={currentRoute.driver}
                onChange={(e) => {
                  setCurrentRoute({ ...currentRoute, driver: e.target.value });
                  if (routeErrors.driver) setRouteErrors(prev => ({ ...prev, driver: null }));
                }}
                error={!!routeErrors.driver}
                errorMessage={routeErrors.driver}
                wrapText={true}
              />
            </div>

            <div className="relative">
              <button
                type="button"
                className="absolute right-1 top-1 text-blue-600 hover:text-blue-800 text-[10px] font-bold underline z-20 leading-none bg-white px-1 rounded transition-colors"
                onClick={(e) => { e.stopPropagation(); handleOpenVehiclesModal(); }}
              >
                hiệu chỉnh
              </button>
              <CustomSelect
                label="Chọn Xe hàng"
                options={[...vehicles]}
                value={currentRoute.transportVehicle}
                onChange={(e) => {
                  setCurrentRoute({ ...currentRoute, transportVehicle: e.target.value });
                  if (routeErrors.transportVehicle) setRouteErrors(prev => ({ ...prev, transportVehicle: null }));
                }}
                error={!!routeErrors.transportVehicle}
                errorMessage={routeErrors.transportVehicle}
                wrapText={true}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Chọn kiện hàng (Tối đa 4)</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
              {items.filter(i =>
                !(i.transportRoute || i.TransportRoute) ||
                (i.transportRoute || i.TransportRoute) === currentRoute.id
              ).map(item => (
                <label key={item.id || item.Id} className="flex items-center gap-2 p-2 bg-white rounded border hover:border-blue-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600"
                    checked={currentRoute.selectedItems.includes(item.id || item.Id)}
                    onChange={(e) => {
                      const val = item.id || item.Id;
                      let updatedItems = [...currentRoute.selectedItems];
                      if (e.target.checked) {
                        if (updatedItems.length < 4) {
                          updatedItems.push(val);
                        }
                      } else {
                        updatedItems = updatedItems.filter(i => i !== val);
                      }
                      setCurrentRoute({ ...currentRoute, selectedItems: updatedItems });
                    }}
                  />
                  <span className="text-xs text-gray-600 whitespace-normal break-words leading-tight">{item.name || item.Name}</span>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">* Chọn từ 1 đến 4 mặt hàng cần vận chuyển</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all text-sm">Hủy</button>
            <button type="submit" className="px-8 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 text-sm">Lưu lộ trình</button>
          </div>
        </form>
      </Modal>

      {/* Modal quản lý Tài xế */}
      <Modal
        isOpen={isDriversModalOpen}
        onClose={() => { setIsDriversModalOpen(false); setIsDriversMgmtMaximized(false); }}
        title="Danh sách tài xế"
        maxWidth={isDriversMgmtMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isDriversMgmtMaximized}
        onMaximizeToggle={() => setIsDriversMgmtMaximized(!isDriversMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px] flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên tài xế..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={driverSearchTerm}
                onChange={(e) => setDriverSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => { setEditingDriver({ name: '', phone: '', email: '', licenseNumber: '', note: '' }); setDriverModalMode('add'); setIsDriverEditModalOpen(true); }} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              <Plus size={16} /> Thêm tài xế
            </button>
          </div>
          <div className={`${isDriversMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm`}>
            <CustomDatatable
              columns={driverTableColumns}
              data={driversRawData.filter(d => (d.name || d.Name || '').toLowerCase().includes(driverSearchTerm.toLowerCase()))}
              renderExpansion={(row) => (
                <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4 sm:gap-x-8 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
                      <span className="text-gray-900 font-medium break-all">{row.email || '---'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số bằng lái</span>
                      <span className="text-gray-900 font-medium">{row.licenseNumber || '---'}</span>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ghi chú</span>
                      <span className="text-gray-900 font-medium">{row.note || '---'}</span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Tài xế */}
      <Modal
        isOpen={isDriverEditModalOpen}
        onClose={() => {
          setIsDriverEditModalOpen(false);
          setDriverErrors({});
        }}
        title={driverModalMode === 'add' ? "Thêm tài xế mới" : "Cập nhật tài xế"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleDriverSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${driverErrors.name ? 'text-red-500' : 'text-gray-700'}`}>Tên tài xế <span className="text-red-500">*</span></label>
              <input type="text" name="name" className={`w-full border ${driverErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`} value={editingDriver.name || ''} onChange={handleDriverEditModalInputChange} autoFocus />
              {driverErrors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{driverErrors.name}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${driverErrors.phone ? 'text-red-500' : 'text-gray-700'}`}>Số điện thoại <span className="text-red-500">*</span></label>
              <input type="text" name="phone" className={`w-full border ${driverErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`} value={editingDriver.phone || ''} onChange={handleDriverEditModalInputChange} />
              {driverErrors.phone && <p className="text-red-500 text-[10px] mt-1 font-medium">{driverErrors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Email</label>
              <input type="email" name="email" className="w-full border border-gray-300 focus:ring-blue-500 rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm" value={editingDriver.email || ''} onChange={handleDriverEditModalInputChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Số bằng lái</label>
              <input type="text" name="licenseNumber" className="w-full border border-gray-300 focus:ring-blue-500 rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm" value={editingDriver.licenseNumber || ''} onChange={handleDriverEditModalInputChange} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Ghi chú</label>
            <textarea name="note" className="w-full border border-gray-300 focus:ring-blue-500 rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm min-h-[80px]" value={editingDriver.note || ''} onChange={handleDriverEditModalInputChange} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsDriverEditModalOpen(false)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">Hủy bỏ</button>
            <button type="submit" className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 text-sm">Lưu thông tin</button>
          </div>
        </form>
      </Modal>

      {/* Modal quản lý Xe hàng */}
      <Modal
        isOpen={isVehiclesModalOpen}
        onClose={() => { setIsVehiclesModalOpen(false); setIsVehiclesMgmtMaximized(false); }}
        title="Danh sách xe hàng"
        maxWidth={isVehiclesMgmtMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isVehiclesMgmtMaximized}
        onMaximizeToggle={() => setIsVehiclesMgmtMaximized(!isVehiclesMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px] flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm mã hoặc biển số xe..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={vehicleSearchTerm}
                onChange={(e) => setVehicleSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => { setEditingVehicle({ vehicleCode: '', licensePlate: '', type: '', capacity: '', note: '' }); setVehicleModalMode('add'); setIsVehicleEditModalOpen(true); }} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              <Plus size={16} /> Thêm xe hàng
            </button>
          </div>
          <div className={`${isVehiclesMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm`}>
            <CustomDatatable
              columns={vehicleTableColumns}
              data={vehiclesRawData.filter(v =>
                (v.vehicleCode || v.VehicleCode || '').toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
                (v.licensePlate || v.LicensePlate || '').toLowerCase().includes(vehicleSearchTerm.toLowerCase())
              )}
              renderExpansion={(row) => (
                <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4 sm:gap-x-8 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Loại xe</span>
                      <span className="text-gray-900 font-medium">{row.type || row.Type || '---'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tải trọng</span>
                      <span className="text-gray-900 font-medium">{row.capacity || row.Capacity || '---'}</span>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ghi chú</span>
                      <span className="text-gray-900 font-medium">{row.note || row.Note || '---'}</span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Xe hàng */}
      <Modal
        isOpen={isVehicleEditModalOpen}
        onClose={() => {
          setIsVehicleEditModalOpen(false);
          setVehicleErrors({});
        }}
        title={vehicleModalMode === 'add' ? "Thêm xe hàng mới" : "Cập nhật xe hàng"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleVehicleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${vehicleErrors.vehicleCode ? 'text-red-500' : 'text-gray-700'}`}>Mã xe <span className="text-red-500">*</span></label>
              <input type="text" name="vehicleCode" className={`w-full border ${vehicleErrors.vehicleCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`} value={editingVehicle.vehicleCode || ''} onChange={handleVehicleEditModalInputChange} autoFocus />
              {vehicleErrors.vehicleCode && <p className="text-red-500 text-[10px] mt-1 font-medium">{vehicleErrors.vehicleCode}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${vehicleErrors.licensePlate ? 'text-red-500' : 'text-gray-700'}`}>Biển số xe <span className="text-red-500">*</span></label>
              <input type="text" name="licensePlate" className={`w-full border ${vehicleErrors.licensePlate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`} value={editingVehicle.licensePlate || ''} onChange={handleVehicleEditModalInputChange} />
              {vehicleErrors.licensePlate && <p className="text-red-500 text-[10px] mt-1 font-medium">{vehicleErrors.licensePlate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Loại xe</label>
              <input type="text" name="type" className="w-full border border-gray-300 focus:ring-blue-500 rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm" value={editingVehicle.type || ''} onChange={handleVehicleEditModalInputChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Tải trọng</label>
              <input type="text" name="capacity" className="w-full border border-gray-300 focus:ring-blue-500 rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm" value={editingVehicle.capacity || ''} onChange={handleVehicleEditModalInputChange} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Ghi chú</label>
            <textarea name="note" className="w-full border border-gray-300 focus:ring-blue-500 rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm min-h-[80px]" value={editingVehicle.note || ''} onChange={handleVehicleEditModalInputChange} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsVehicleEditModalOpen(false)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">Hủy bỏ</button>
            <button type="submit" className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 text-sm">Lưu thông tin</button>
          </div>
        </form>
      </Modal>

      {/* Modal quản lý Khách hàng */}
      <Modal
        isOpen={isCustomersModalOpen}
        onClose={() => { setIsCustomersModalOpen(false); setIsCustomersMgmtMaximized(false); }}
        title="Danh sách khách hàng (Điểm đến)"
        maxWidth={isCustomersMgmtMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isCustomersMgmtMaximized}
        onMaximizeToggle={() => setIsCustomersMgmtMaximized(!isCustomersMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px] flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Tìm tên khách hàng..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => { setEditingCustomer({ name: '', contactPerson: '', phone: '', email: '', address: '', taxCode: '', website: '', note: '' }); setCustomerModalMode('add'); setIsCustomerEditModalOpen(true); }} className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors active:scale-95">
              <Plus size={16} /> Thêm khách hàng
            </button>
          </div>
          <div className={`${isCustomersMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm`}>
            <CustomDatatable
              columns={customerTableColumns}
              data={customersRawData.filter(c => (c.name || c.Name || '').toLowerCase().includes(customerSearchTerm.toLowerCase()))}
              renderExpansion={(row) => (
                <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4 sm:gap-x-8 text-sm">
                    <div className="flex flex-col gap-1 md:hidden">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
                      <span className="text-gray-900 font-medium break-all">{row.email || '---'}</span>
                    </div>
                    <div className="flex flex-col gap-1 sm:hidden">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số điện thoại</span>
                      <span className="text-gray-900 font-medium">{row.phone || '---'}</span>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2 sm:col-span-1 lg:hidden">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Địa chỉ</span>
                      <span className="text-gray-900 font-medium">{row.address || '---'}</span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Khách hàng */}
      <Modal
        isOpen={isCustomerEditModalOpen}
        onClose={() => {
          setIsCustomerEditModalOpen(false);
          setCustomerErrors({}); // Xóa lỗi khi modal đóng
        }}
        title={customerModalMode === 'add' ? "Thêm khách hàng mới" : "Cập nhật khách hàng"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCustomerSubmit} className="space-y-4">
          {/* Dòng 1: Tên và Người liên hệ */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${customerErrors.name ? 'text-red-500' : 'text-gray-700'}`}>Tên khách hàng <span className="text-red-500">*</span></label>
              <input type="text" name="name" className={`w-full border ${customerErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`} value={editingCustomer.name} onChange={handleCustomerEditModalInputChange} autoFocus />
              {customerErrors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{customerErrors.name}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${customerErrors.contactPerson ? 'text-red-500' : 'text-gray-700'}`}>Người liên hệ <span className="text-red-500">*</span></label>
              <input type="text" name="contactPerson" className={`w-full border ${customerErrors.contactPerson ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`} value={editingCustomer.contactPerson || ''} onChange={handleCustomerEditModalInputChange} />
              {customerErrors.contactPerson && <p className="text-red-500 text-[10px] mt-1 font-medium">{customerErrors.contactPerson}</p>}
            </div>
          </div>

          {/* Dòng 2: Số điện thoại và Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${customerErrors.phone ? 'text-red-500' : 'text-gray-700'}`}>Số điện thoại <span className="text-red-500">*</span></label>
              <input type="text" name="phone" className={`w-full border ${customerErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`} value={editingCustomer.phone || ''} onChange={handleCustomerEditModalInputChange} />
              {customerErrors.phone && <p className="text-red-500 text-[10px] mt-1 font-medium">{customerErrors.phone}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${customerErrors.email ? 'text-red-500' : 'text-gray-700'}`}>Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" className={`w-full border ${customerErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`} value={editingCustomer.email || ''} onChange={handleCustomerEditModalInputChange} />
              {customerErrors.email && <p className="text-red-500 text-[10px] mt-1 font-medium">{customerErrors.email}</p>}
            </div>
          </div>

          {/* Dòng 3: Địa chỉ (Full width) */}
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-bold ${customerErrors.address ? 'text-red-500' : 'text-gray-700'}`}>Địa chỉ <span className="text-red-500">*</span></label>
            <input type="text" name="address" className={`w-full border ${customerErrors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`} value={editingCustomer.address || ''} onChange={handleCustomerEditModalInputChange} />
            {customerErrors.address && <p className="text-red-500 text-[10px] mt-1 font-medium">{customerErrors.address}</p>}
          </div>

          {/* Dòng 4: Mã số thuế và Website */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${customerErrors.taxCode ? 'text-red-500' : 'text-gray-700'}`}>Mã số thuế <span className="text-red-500">*</span></label>
              <input type="text" name="taxCode" className={`w-full border ${customerErrors.taxCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`} value={editingCustomer.taxCode || ''} onChange={handleCustomerEditModalInputChange} />
              {customerErrors.taxCode && <p className="text-red-500 text-[10px] mt-1 font-medium">{customerErrors.taxCode}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${customerErrors.website ? 'text-red-500' : 'text-gray-700'}`}>Website <span className="text-red-500">*</span></label>
              <input type="text" name="website" className={`w-full border ${customerErrors.website ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm`} value={editingCustomer.website || ''} onChange={handleCustomerEditModalInputChange} />
              {customerErrors.website && <p className="text-red-500 text-[10px] mt-1 font-medium">{customerErrors.website}</p>}
            </div>
          </div>

          {/* Dòng 5: Ghi chú (Full width) */}
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-bold text-gray-700`}>Ghi chú <span className="text-red-500">*</span></label>
            <textarea name="note" className="w-full border border-gray-300 focus:ring-blue-500 rounded-lg p-2.5 outline-none focus:ring-2 transition-all text-sm min-h-[60px]" value={editingCustomer.note || ''} onChange={handleCustomerEditModalInputChange} />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsCustomerEditModalOpen(false)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm">Hủy bỏ</button>
            <button type="submit" className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 text-sm">Lưu thông tin</button>
          </div>
        </form>
      </Modal>

      <CustomConfirm
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' })}
        onConfirm={async () => {
          if (confirmModal.type === 'export') {
            await handleExportExcel();
          } else if (confirmModal.type === 'deleteCustomer') {
            try {
              await deleteCustomer(confirmModal.id);
              showNotification("Đã xóa khách hàng thành công!");
              const data = await getCustomers();
              setCustomersRawData(data);
              setCustomers(data.map(c => ({ value: c.id || c.Id, label: c.name || c.Name })));
            } catch (err) {
              showNotification("Lỗi khi xóa khách hàng", "error");
            }
          } else if (confirmModal.type === 'deleteDriver') {
            try {
              await deleteDriver(confirmModal.id);
              showNotification("Đã xóa tài xế thành công!");
              const data = await getDrivers();
              setDriversRawData(data);
              setDrivers(data.map(d => ({ value: d.id || d.Id, label: d.name || d.Name })));
            } catch (err) {
              showNotification("Lỗi khi xóa tài xế", "error");
            }
          } else if (confirmModal.type === 'deleteVehicle') {
            try {
              await deleteTransportVehicle(confirmModal.id);
              showNotification("Đã xóa xe hàng thành công!");
              const data = await getTransportVehicles();
              setVehiclesRawData(data);
              setVehicles(data.map(v => ({
                value: v.id || v.Id,
                label: v.licensePlate || v.LicensePlate,
                vehicleCode: v.vehicleCode || v.VehicleCode
              })));
            } catch (err) {
              showNotification("Lỗi khi xóa xe hàng", "error");
            }
          } else {
            try {
              await deleteTransportRoute(confirmModal.id);
              setRoutes(prev => prev.filter(r => r.id !== confirmModal.id));
              showNotification("Đã xóa lộ trình!", "success");
            } catch (err) {
              showNotification("Lỗi khi xóa", "error");
            }
          }
          setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type === 'export' ? 'export' : 'danger'}
      />

      <AppNotification
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />
    </div>
  );
};
