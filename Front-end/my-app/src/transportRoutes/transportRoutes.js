import { useEffect, useState, useMemo } from 'react';
import { MapPin, Truck, Package, Plus, Trash2, Edit3, ArrowRight, Search, MapPinned } from 'lucide-react';
import { Modal, CustomSelect, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { getTransportRoutes, createTransportRoute, updateTransportRoute, deleteTransportRoute } from '../controller/transportRoutesController';
import { getTransportVehicles } from '../controller/transportVehiclesController';
import { getDrivers } from '../controller/driversController';
import { getItems, updateItem } from '../controller/itemsController';

export const TransportRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentRoute, setCurrentRoute] = useState({ from: '', to: '', driver: '', transportVehicle: '', selectedItems: [] });
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [openFromMenuId, setOpenFromMenuId] = useState(null);
  const [openToMenuId, setOpenToMenuId] = useState(null);
  const [openVehicleMenuId, setOpenVehicleMenuId] = useState(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  // Lắng nghe sự kiện click toàn cục để đóng menu khi bấm ra ngoài
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenFromMenuId(null);
      setOpenToMenuId(null);
      setOpenVehicleMenuId(null);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [routesData, driversData, itemsData, vehiclesData] = await Promise.all([
          getTransportRoutes(),
          getDrivers(),
          getItems(),
          getTransportVehicles()
        ]);

        setRoutes(routesData);
        // Map dữ liệu an toàn để chấp nhận cả PascalCase từ Backend
        setDrivers(driversData.map(d => ({ value: d.id || d.Id, label: d.name || d.Name })));
        setVehicles(vehiclesData.map(v => ({ 
          value: v.id || v.Id, 
          label: v.licensePlate || v.LicensePlate,
          vehicleCode: v.vehicleCode || v.VehicleCode 
        })));
        setItems(itemsData); // Lưu toàn bộ object để không mất thông tin khi updateItem
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
    return routes.filter(route => {
      const driverName = drivers.find(d => d.value === route.driver)?.label || '';
      return (
        driverName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [routes, searchTerm, drivers]);

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
      showNotification("Cập nhật điểm đến thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật điểm đến.", "error");
    }
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setCurrentRoute({ from: '', to: '', driver: '', transportVehicle: '', selectedItems: [] });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
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
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Danh sách chuyến hàng</h2>
        <p className="text-gray-500 text-sm mb-4">Quản lý các chuyến hàng đang vận hành</p>

        <div className="flex justify-between items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm chuyến hàng" 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200"
          >
            Tạo chuyến hàng mới
          </button>
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
              <div key={route.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                
                {/* Header Card */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <MapPinned size={12} />
                    RT-{route.id.toString().padStart(4, '0')}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(route)} className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg">
                      <Edit3 size={16} />
                    </button>
                    <button 
                        onClick={() => setConfirmModal({ isOpen: true, id: route.id })}
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
                        className={`p-3 rounded-xl mb-2 transition-colors ${openFromMenuId === route.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        title="Thay đổi điểm xuất phát"
                      >
                        <MapPin size={24} />
                      </button>

                      {openFromMenuId === route.id && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-56 bg-white rounded-md shadow-2xl z-20 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top" onClick={e => e.stopPropagation()}>
                          <div className="p-1.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                            <div className="relative">
                              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                className="w-full pl-6 pr-2 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                                placeholder="Lọc chi nhánh"
                                value={menuSearchQuery}
                                onChange={(e) => setMenuSearchQuery(e.target.value)}
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-800 text-center whitespace-normal leading-tight">'Không xác định'</span>
                  </div>

                  <div className="flex flex-col items-center flex-1 px-2">
                    <div className="w-full flex items-center gap-1 mb-2 relative">
                        <div className="h-px bg-gray-200 flex-1 border-dashed border-t"></div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenVehicleMenuId(openVehicleMenuId === route.id ? null : route.id);
                            setOpenFromMenuId(null);
                            setOpenToMenuId(null);
                            setMenuSearchQuery('');
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${openVehicleMenuId === route.id ? 'bg-blue-600 text-white shadow-md' : 'text-blue-500 hover:bg-blue-50'}`}
                          title="Thay đổi xe hàng"
                        >
                          <Truck size={20} />
                        </button>
                        <div className="h-px bg-gray-200 flex-1 border-dashed border-t"></div>

                        {openVehicleMenuId === route.id && (
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
                                  className={`px-2 py-2 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${
                                    String(route.transportVehicle) === String(v.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenToMenuId(openToMenuId === route.id ? null : route.id);
                          setOpenFromMenuId(null);
                          setMenuSearchQuery('');
                        }}
                        className={`p-3 rounded-xl mb-2 transition-colors ${openToMenuId === route.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        title="Thay đổi điểm đến"
                      >
                        <MapPin size={24} />
                      </button>

                      {openToMenuId === route.id && (
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
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-800 text-center whitespace-normal leading-tight">'Không xác định'</span>
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
        <form onSubmit={handleModalSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <CustomSelect 
                label="Nơi nhận hàng (Từ)" 
                options={[]} 
                value={currentRoute.from}
                onChange={(e) => setCurrentRoute({...currentRoute, from: e.target.value})}
                wrapText={true}
            />
            <div className="flex justify-center py-0">
                <div className="bg-gray-100 p-2 rounded-full text-gray-400">
                    <ArrowRight size={20} className="rotate-90 md:rotate-0" />
                </div>
            </div>
            <CustomSelect 
                label="Nơi giao hàng (Đến)" 
                options={[]} 
                value={currentRoute.to}
                onChange={(e) => setCurrentRoute({...currentRoute, to: e.target.value})}
                wrapText={true}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect 
              label="Chỉ định Tài xế" 
              options={[...drivers]} 
              value={currentRoute.driver}
              onChange={(e) => setCurrentRoute({...currentRoute, driver: e.target.value})}
              wrapText={true}
            />

            <CustomSelect 
              label="Chọn Xe hàng" 
              options={[...vehicles]} 
              value={currentRoute.transportVehicle}
              onChange={(e) => setCurrentRoute({...currentRoute, transportVehicle: e.target.value})}
              wrapText={true}
            />
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
                                setCurrentRoute({...currentRoute, selectedItems: updatedItems});
                            }}
                        />
                        <span className="text-xs text-gray-600 whitespace-normal break-words leading-tight">{item.name || item.Name}</span>
                    </label>
                ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">* Chọn từ 1 đến 4 mặt hàng cần vận chuyển</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition-all">Hủy</button>
            <button type="submit" className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-md">Lưu lộ trình</button>
          </div>
        </form>
      </Modal>

      <CustomConfirm 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={async () => {
            try {
                await deleteTransportRoute(confirmModal.id);
                setRoutes(prev => prev.filter(r => r.id !== confirmModal.id));
                setNotification({ isOpen: true, message: "Đã xóa lộ trình!", type: 'success' });
            } catch (err) {
                setNotification({ isOpen: true, message: "Lỗi khi xóa", type: 'error' });
            }
            setConfirmModal({ isOpen: false, id: null });
        }}
        title="Xóa lộ trình"
        message="Bạn có chắc chắn muốn hủy lộ trình vận chuyển này?"
      />

      <AppNotification 
        isOpen={notification.isOpen} 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({...notification, isOpen: false})} 
      />
    </div>
  );
};