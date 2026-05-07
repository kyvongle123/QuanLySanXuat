import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus, Calendar, ClipboardList } from 'lucide-react';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect, DateInput } from '../customComponent/customComponent';
import { getProductionOrders, createProductionOrder, updateProductionOrder, deleteProductionOrder } from '../controller/productionOrdersController';
import { getProductionPlans } from '../controller/productionPlansController';
import { getProductionOrderStatuses } from '../controller/productionOrderStatusesController';
import { getProductionSections } from '../controller/productionSectionsController';

export const ProductionOrders = () => {
  const [orders, setOrders] = useState([]);
  const [plans, setPlans] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ orderCode: '', startDate: '', endDate: '', status: '', warehouse: '', productionPlan: '', note: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderData, planData, sectionData, statusData] = await Promise.all([
        getProductionOrders(),
        getProductionPlans(),
        getProductionSections(),
        getProductionOrderStatuses()
      ]);

      // Chuẩn hóa dữ liệu orders
      const rawOrders = orderData?.$values || orderData || [];
      setOrders(rawOrders.map(o => ({ ...o, id: o.id || o.Id })));

      // Chuẩn hóa dữ liệu plans cho Select
      const rawPlans = planData?.$values || planData || [];
      setPlans(rawPlans.map(p => ({ value: p.id || p.Id, label: p.planCode || p.PlanCode })));

      setSections(sectionData.map(s => ({ value: s.id || s.Id, label: s.name || s.Name })));
      setStatuses(statusData.map(s => ({ value: s.id, label: s.name })));
    } catch (err) {
      showNotification("Lỗi khi tải dữ liệu lệnh sản xuất", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return orders
      .filter(o => 
        (o.orderCode || o.OrderCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.note || o.Note || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => (a.orderCode || a.OrderCode || "").localeCompare(b.orderCode || b.OrderCode || "", undefined, { numeric: true }));
  }, [orders, searchTerm]);

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ 
      orderCode: `ORD-${Date.now()}`, 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: '', 
      status: statuses[0]?.value || '', 
      warehouse: '', 
      productionPlan: '', 
      note: '' 
    });
    setIsModalOpen(true);
  };

  const handleEditItem = (order) => {
    setModalMode('edit');
    setCurrentEditingItem({ 
      ...order,
      id: order.id || order.Id,
      orderCode: order.orderCode || order.OrderCode,
      startDate: (order.startDate || order.StartDate) ? (order.startDate || order.StartDate).split('T')[0] : '',
      endDate: (order.endDate || order.EndDate) ? (order.endDate || order.EndDate).split('T')[0] : '',
      warehouse: order.warehouse || order.Warehouse,
      status: order.status || order.Status,
      productionPlan: order.productionPlan || order.ProductionPlan,
      note: order.note || order.Note
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...currentEditingItem,
      OrderCode: currentEditingItem.orderCode,
      Status: currentEditingItem.status ? parseInt(currentEditingItem.status) : null,
      Warehouse: currentEditingItem.warehouse ? parseInt(currentEditingItem.warehouse) : null,
      ProductionPlan: currentEditingItem.productionPlan ? parseInt(currentEditingItem.productionPlan) : null,
    };

    try {
      if (modalMode === 'add') {
        await createProductionOrder(payload);
        showNotification("Thêm lệnh sản xuất thành công!");
      } else {
        await updateProductionOrder(currentEditingItem.id, payload);
        showNotification("Cập nhật lệnh sản xuất thành công!");
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu.", "error");
    }
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'delete') {
      try {
        await deleteProductionOrder(confirmModal.id);
        setOrders(prev => prev.filter(o => o.id !== confirmModal.id));
        showNotification("Xóa lệnh sản xuất thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa lệnh sản xuất.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const columns = [
    { header: 'STT', render: (row, { index }) => index },
    { 
      header: 'Mã lệnh', 
      render: (row) => <span className="font-bold text-blue-600">{row.orderCode || row.OrderCode}</span> 
    },
    { 
      header: 'Kế hoạch', 
      render: (row) => plans.find(p => String(p.value) === String(row.productionPlan || row.ProductionPlan))?.label || 'N/A'
    },
    { 
      header: 'Kho/Xưởng', 
      render: (row) => sections.find(s => String(s.value) === String(row.warehouse || row.Warehouse))?.label || 'N/A' 
    },
    { 
      header: 'Thời gian', 
      render: (row) => (
        <div className="text-xs">
          <div className="flex gap-1"><span>Bắt đầu:</span> {row.startDate || row.StartDate ? new Date(row.startDate || row.StartDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
          <div className="flex gap-1 mt-0.5"><span>Kết thúc:</span> {row.endDate || row.EndDate ? new Date(row.endDate || row.EndDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
        </div>
      )
    },
    { 
      header: 'Trạng thái', 
      render: (row) => {
        const statusName = statuses.find(s => String(s.value) === String(row.status || row.Status))?.label || 'N/A';
        return <span className="px-2 py-1 bg-gray-100 rounded text-[11px] font-medium border border-gray-200">{statusName}</span>
      }
    },
    {
      header: 'Hành động',
      className: 'text-right',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleEditItem(row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors">Sửa</button>
          <button 
            onClick={() => setConfirmModal({ isOpen: true, id: row.id, type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa lệnh sản xuất này?' })} 
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Lệnh sản xuất</h2>
      
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã lệnh hoặc ghi chú"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? <p className="p-4 italic text-gray-500">Đang tải dữ liệu...</p> : <CustomDatatable columns={columns} data={filteredData} />}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? 'Thêm lệnh sản xuất mới' : 'Chỉnh sửa lệnh sản xuất'} isMaximized={isModalMaximized} onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}>
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Mã lệnh sản xuất</label>
              <input 
                type="text" 
                value={currentEditingItem?.orderCode || ''} 
                onChange={(e) => setCurrentEditingItem({...currentEditingItem, orderCode: e.target.value})} 
                className={`w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 min-h-[44px] text-base' : 'p-1.5 min-h-[38px] text-sm'}`} 
                required 
              />
            </div>
            <CustomSelect label="Kế hoạch sản xuất" options={plans} value={currentEditingItem?.productionPlan || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, productionPlan: e.target.value})} isModalMaximized={isModalMaximized} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CustomSelect label="Kho/Xưởng nhận" options={sections} value={currentEditingItem?.warehouse || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, warehouse: e.target.value})} isModalMaximized={isModalMaximized} />
            <CustomSelect label="Trạng thái lệnh" options={statuses} value={currentEditingItem?.status || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, status: e.target.value})} isModalMaximized={isModalMaximized} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DateInput label="Ngày bắt đầu" value={currentEditingItem?.startDate || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, startDate: e.target.value})} isModalMaximized={isModalMaximized} />
            <DateInput label="Ngày kết thúc" value={currentEditingItem?.endDate || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, endDate: e.target.value})} isModalMaximized={isModalMaximized} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea value={currentEditingItem?.note || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, note: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none" rows="3"></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu lệnh sản xuất</button>
          </div>
        </form>
      </Modal>

      <CustomConfirm isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, id: null })} onConfirm={handleConfirmAction} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} />
      <AppNotification isOpen={notification.isOpen} message={notification.message} type={notification.type} onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
};
