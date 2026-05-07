import React, { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Search, FileUp, FileDown, ChevronDown } from 'lucide-react';
import { CustomDatatable, Modal, CustomSelect, AppNotification, CustomConfirm, DateInput } from '../customComponent/customComponent';
import { getSaleOrders, deleteSaleOrder, createSaleOrder, updateSaleOrder } from '../controller/saleOrdersController';
import { getCustomers } from '../controller/customersController';
import { getSaleOrderStatuses } from '../controller/saleOrderStatusesController';
import { BsLayoutSidebarInset, BsLayoutSidebarInsetReverse } from "react-icons/bs";
import { FaPencil } from "react-icons/fa6";

export const Saleorders = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentEditingOrder, setCurrentEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenStatusMenuId(null);
      setMenuSearchQuery('');
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const closeNotification = () => setNotification(prev => ({ ...prev, isOpen: false }));

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersData, customersData, statusesData] = await Promise.all([
        getSaleOrders(),
        getCustomers(),
        getSaleOrderStatuses()
      ]);
      setOrders(ordersData);
      setCustomers(customersData.map(c => ({ value: c.id, label: c.name })));
      setOrderStatuses(statusesData.map(s => ({ value: s.id, label: s.name })));
    } catch (err) {
      setError("Không thể tải dữ liệu đơn hàng.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const customerLabel = customers.find(c => String(c.value) === String(order.customerId))?.label || '';
      return (
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerLabel.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [orders, searchTerm, customers]);

  const handleDeleteOrder = (orderId) => {
    setConfirmModal({ 
      isOpen: true, 
      id: orderId, 
      type: 'delete',
      title: 'Xác nhận xóa đơn hàng',
      message: 'Đơn hàng sẽ bị xóa vĩnh viễn. Bạn có chắc chắn?'
    });
  };

  const handleBulkDelete = () => {
    if (selectedOrderIds.length === 0) return;
    setConfirmModal({ 
      isOpen: true, 
      id: selectedOrderIds, 
      type: 'bulkDelete',
      title: 'Xác nhận xóa nhiều đơn hàng',
      message: `Bạn có chắc chắn muốn xóa ${selectedOrderIds.length} đơn hàng đã chọn không?`
    });
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    try {
      if (type === 'delete') {
        await deleteSaleOrder(id);
        setOrders(orders.filter(o => o.id !== id));
        setSelectedOrderIds(prev => prev.filter(orderId => orderId !== id));
        showNotification("Xóa đơn hàng thành công!");
      } else if (type === 'bulkDelete') {
        await Promise.all(id.map(orderId => deleteSaleOrder(orderId)));
        setOrders(orders.filter(o => !id.includes(o.id)));
        setSelectedOrderIds([]);
        showNotification(`Đã xóa ${id.length} đơn hàng thành công!`);
      } else if (type === 'export') {
        await handleExportExcel();
      }
    } catch (err) {
      showNotification("Có lỗi xảy ra thao tác.", "error");
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const handleEditOrder = (order) => {
    setModalMode('edit');
    setCurrentEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleAddOrder = () => {
    setModalMode('add');
    setCurrentEditingOrder({ 
      orderNumber: `DH${Date.now().toString().slice(-6)}`,
      customerId: '',
      orderDate: new Date().toISOString().split('T')[0],
      totalAmount: 0,
      status: '',
      shippingAddress: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const newOrder = await createSaleOrder(currentEditingOrder);
        setOrders(prev => [...prev, newOrder]);
        showNotification("Thêm đơn hàng thành công!");
      } else {
        const updated = await updateSaleOrder(currentEditingOrder.id, currentEditingOrder);
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        showNotification("Cập nhật đơn hàng thành công!");
      }
      setIsModalOpen(false);
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu.", "error");
    }
  };

  const handleStatusChange = async (order, newStatusId) => {
    try {
      const updated = await updateSaleOrder(order.id, { ...order, status: parseInt(newStatusId) });
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      showNotification("Cập nhật trạng thái thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật trạng thái.", "error");
    }
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách đơn hàng');
      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Mã đơn hàng', key: 'orderNumber', width: 20 },
        { header: 'Khách hàng', key: 'customer', width: 30 },
        { header: 'Ngày đặt', key: 'orderDate', width: 15 },
        { header: 'Tổng tiền', key: 'totalAmount', width: 20 },
        { header: 'Trạng thái', key: 'status', width: 20 }
      ];

      filteredOrders.forEach((order, index) => {
        worksheet.addRow({
          stt: index + 1,
          orderNumber: order.orderNumber,
          customer: customers.find(c => String(c.value) === String(order.customerId))?.label || '',
          orderDate: new Date(order.orderDate).toLocaleDateString('vi-VN'),
          totalAmount: order.totalAmount,
          status: orderStatuses.find(s => String(s.value) === String(order.status))?.label || ''
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách đơn hàng.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const orderColumns = [
    {
      header: selectedOrderIds.length > 0 ? (
        <button onClick={() => setSelectedOrderIds([])} className="text-[10px] font-bold text-red-500 underline">Bỏ chọn</button>
      ) : '',
      className: 'w-[40px]',
      render: (row) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          checked={selectedOrderIds.includes(row.id)}
          onChange={(e) => {
            if (e.target.checked) setSelectedOrderIds(prev => [...prev, row.id]);
            else setSelectedOrderIds(prev => prev.filter(id => id !== row.id));
          }}
        />
      ),
    },
    { header: 'STT', render: (row, { index }) => index },
    { header: 'Mã đơn hàng', accessor: 'orderNumber', className: 'font-medium text-blue-600 w-48' },
    { 
      header: 'Khách hàng', 
      render: (row) => customers.find(c => String(c.value) === String(row.customerId))?.label || '---',
      className: 'w-64'
    },
    { 
      header: 'Tổng tiền', 
      className: 'w-full text-right pr-4 font-bold text-orange-600',
      render: (row) => `${row.totalAmount?.toLocaleString()} VNĐ`
    },
    {
      header: 'Hành động',
      className: 'text-right whitespace-nowrap pr-2',
      render: (row, { isExpanded, toggleExpand }) => (
        <div className="flex gap-2 justify-end items-center">
          <button onClick={toggleExpand} className="p-1 hover:bg-blue-50 rounded-lg transition-all" title="Xem chi tiết">
            {isExpanded ? <BsLayoutSidebarInsetReverse size={20} className="text-blue-600" /> : <BsLayoutSidebarInset size={20} className="text-gray-400" />}
          </button>
          <button onClick={() => handleEditOrder(row)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="Chỉnh sửa">
            <FaPencil size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Quản lý Đơn bán hàng</h2>
      
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc khách hàng"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={() => setConfirmModal({ isOpen: true, type: 'export', title: 'Xác nhận', message: 'Xuất danh sách ra Excel?' })} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors">
            <FileDown size={18} /> Xuất Excel
          </button>
          <button onClick={handleAddOrder} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors">
            Thêm đơn hàng mới
          </button>
          <button 
            onClick={handleBulkDelete}
            disabled={selectedOrderIds.length === 0}
            className={`bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-all ${selectedOrderIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'shadow-md active:scale-95'}`}
          >
            Xóa
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-600 p-4 italic">Đang tải dữ liệu đơn hàng...</p>}
      {!loading && !error && (
        <CustomDatatable 
          columns={orderColumns} 
          data={filteredOrders} 
          renderExpansion={(row) => (
            <div className="py-4 pl-48 pr-6 bg-blue-50/30 border-b border-gray-100 relative">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Ngày đặt hàng</span>
                  <span className="text-gray-900 font-medium">{new Date(row.orderDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Trạng thái</span>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenStatusMenuId(openStatusMenuId === row.id ? null : row.id);
                      }}
                      className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg block w-full p-1 pr-8 outline-none font-bold min-h-[26px] text-left relative"
                    >
                      <span className="truncate block">
                        {orderStatuses.find(s => String(s.value) === String(row.status))?.label || '-- Chọn --'}
                      </span>
                      <div className="absolute inset-y-0 right-2 flex items-center text-gray-400">
                        <ChevronDown size={14} />
                      </div>
                    </button>

                    {openStatusMenuId === row.id && (
                      <div className="absolute left-0 top-full mt-1 w-full min-w-[160px] bg-white rounded-md shadow-2xl z-20 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top">
                        {orderStatuses.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => handleStatusChange(row, s.value)}
                            className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left ${String(row.status) === String(s.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col col-span-2 gap-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Địa chỉ giao hàng</span>
                  <span className="text-gray-900 font-medium">{row.shippingAddress || '---'}</span>
                </div>
                <div className="flex flex-col col-span-4 gap-1 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Ghi chú</span>
                  <p className="text-gray-600 italic">{row.description || 'Không có ghi chú'}</p>
                </div>
              </div>
            </div>
          )}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Tạo đơn hàng mới' : 'Cập nhật đơn hàng'}
        maxWidth={isModalMaximized ? 'max-w-full' : 'max-w-2xl'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700">Mã đơn hàng</label>
              <input 
                type="text" 
                value={currentEditingOrder?.orderNumber || ''} 
                onChange={(e) => setCurrentEditingOrder({...currentEditingOrder, orderNumber: e.target.value})}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} 
                required 
              />
            </div>
            <CustomSelect 
              label="Khách hàng"
              value={currentEditingOrder?.customerId || ''}
              onChange={(e) => setCurrentEditingOrder({...currentEditingOrder, customerId: e.target.value})}
              options={customers}
              isModalMaximized={isModalMaximized}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateInput 
              label="Ngày đặt hàng"
              value={currentEditingOrder?.orderDate || ''}
              onChange={(e) => setCurrentEditingOrder({...currentEditingOrder, orderDate: e.target.value})}
              isModalMaximized={isModalMaximized}
            />
            <div>
              <label className="text-xs font-medium text-gray-700">Tổng tiền (VNĐ)</label>
              <input 
                type="number" 
                value={currentEditingOrder?.totalAmount || ''} 
                onChange={(e) => setCurrentEditingOrder({...currentEditingOrder, totalAmount: parseFloat(e.target.value)})}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Địa chỉ giao hàng</label>
            <input 
              type="text" 
              value={currentEditingOrder?.shippingAddress || ''} 
              onChange={(e) => setCurrentEditingOrder({...currentEditingOrder, shippingAddress: e.target.value})}
              className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} 
            />
          </div>

          <CustomSelect 
            label="Trạng thái đơn hàng"
            value={currentEditingOrder?.status || ''}
            onChange={(e) => setCurrentEditingOrder({...currentEditingOrder, status: e.target.value})}
            options={orderStatuses}
            isModalMaximized={isModalMaximized}
          />

          <div>
            <label className="text-xs font-medium text-gray-700">Ghi chú / Mô tả</label>
            <textarea 
              rows={isModalMaximized ? "4" : "2"}
              value={currentEditingOrder?.description || ''} 
              onChange={(e) => setCurrentEditingOrder({...currentEditingOrder, description: e.target.value})}
              className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'p-2 text-base' : 'p-1.5 text-sm'}`} 
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm">Lưu đơn hàng</button>
          </div>
        </form>
      </Modal>

      <CustomConfirm 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
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
    </div>
  );
};
