import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileDown, Calendar, Package, ClipboardList } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect, DateInput } from '../customComponent/customComponent';
import { getProductionPlans, createProductionPlan, updateProductionPlan, deleteProductionPlan, getProductionPlanItems, createProductionPlanItem, deleteProductionPlanItem } from '../controller/productionPlansController';
import { createProductionOrder } from '../controller/productionOrdersController';
import { getItems } from '../controller/itemsController';
import { getMaterials } from '../controller/materialsController';
import { getBOMs } from '../controller/bomController';
import { getMaterialCategories } from '../controller/materialCategoriesController';

export const ProductionPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [items, setItems] = useState([]);
  const [planItems, setPlanItems] = useState([]); // Thêm state để lưu chi tiết nguyên liệu
  const [materials, setMaterials] = useState([]); // Thêm state để lưu tồn kho nguyên liệu thực tế
  const [boms, setBoms] = useState([]); // Định mức sản phẩm
  const [materialCategories, setMaterialCategories] = useState([]); // Danh mục nguyên liệu
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ planCode: '', startDate: '', endDate: '', status: '', warehouse: '', note: '' });
  const [selectedPlanItems, setSelectedPlanItems] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [isDetailModalMaximized, setIsDetailModalMaximized] = useState(false);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [isCreateOrderModalMaximized, setIsCreateOrderModalMaximized] = useState(false);
  const [activeBOMItemId, setActiveBOMItemId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingPlan, setViewingPlan] = useState(null);

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [planData, itemData, planItemsData, bomData, catData, materialData] = await Promise.all([
        getProductionPlans(),
        getItems(),
        getProductionPlanItems(), // Tải tất cả chi tiết để hiển thị ở bảng chính
        getBOMs(),
        getMaterialCategories(),
        getMaterials()
      ]);
      
      // Chuẩn hóa dữ liệu plans (Hỗ trợ Id/id và $values)
      const rawPlans = planData?.$values || planData || [];
      setPlans(rawPlans.map(p => ({ ...p, id: p.id || p.Id })));

      
      // Xử lý an toàn: Kiểm tra nếu data nằm trong $values hoặc trả về trực tiếp, hỗ trợ cả PascalCase (Id/Name)
      
      // Xử lý an toàn: Kiểm tra nếu data nằm trong $values hoặc trả về trực tiếp, hỗ trợ cả PascalCase (Id/Name)
      const rawItems = itemData?.data || itemData || [];
      setItems(rawItems.map(i => ({ value: i.id || i.Id, label: i.name || i.Name })));
      
      // Cập nhật state chi tiết sản phẩm
      const rawPlanItems = planItemsData?.$values || planItemsData || [];
      setPlanItems(rawPlanItems);
      
      const rawBoms = bomData?.$values || bomData || [];
      setBoms(rawBoms);

      const rawCats = catData?.$values || catData || [];
      setMaterialCategories(rawCats);
      
      const rawMaterials = materialData?.$values || materialData || [];
      setMaterials(rawMaterials);
      
    } catch (err) {
      showNotification("Lỗi khi tải dữ liệu kế hoạch", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return plans
      .filter(p => 
        p.planCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.note?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => (a.planCode || "").localeCompare(b.planCode || "", undefined, { numeric: true }));
  }, [plans, searchTerm]);

  // Tính toán dữ liệu nguyên liệu cho Modal chi tiết
  const planDetails = useMemo(() => {
    if (!viewingPlan) return [];

    // 1. Khởi tạo bản sao tồn kho tổng hợp theo từng loại nguyên liệu (Category ID)
    const currentStocks = {};
    materials.forEach(mat => {
      const catId = String(mat.name || mat.Name);
      currentStocks[catId] = (currentStocks[catId] || 0) + (mat.quantity || mat.Quantity || 0);
    });

    // 2. Duyệt qua từng sản phẩm trong kế hoạch để tính toán trừ dần tồn kho
    return planItems
      .filter(pi => String(pi.productionPlan || pi.ProductionPlan) === String(viewingPlan.id))
      .map(pi => {
        const item = items.find(i => String(i.value) === String(pi.item || pi.Item));
        const itemBoms = boms.filter(b => String(b.item || b.Item) === String(pi.item || pi.Item));
        
        const compositionMaterials = itemBoms.map(bom => {
          const catId = String(bom.materialCategory || bom.MaterialCategory);
          const cat = materialCategories.find(c => String(c.id || c.Id) === catId);
          const totalNeeded = (pi.quantity || pi.Quantity || 0) * (bom.requiredQuantity || bom.RequiredQuantity || 0);
          
          // Trừ dần tồn kho hiện tại
          const stockBefore = currentStocks[catId] || 0;
          currentStocks[catId] = stockBefore - totalNeeded;
          const stockAfter = currentStocks[catId];

          return {
            name: cat?.name || cat?.Name || 'N/A',
            quantityNeeded: totalNeeded,
            remainingStock: stockAfter,
            catId: catId
          };
        });

        return {
          id: pi.id || pi.Id,
          product: `${pi.quantity || pi.Quantity} ${item?.label || 'N/A'}`,
          materials: compositionMaterials
        };
      });
  }, [viewingPlan, planItems, items, boms, materialCategories, materials]);

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ planCode: `PLAN-${Date.now()}`, startDate: new Date().toISOString().split('T')[0], endDate: '', status: '', warehouse: '', note: '' });
    setSelectedPlanItems([]);
    setActiveTab('general');
    setActiveBOMItemId(null);
    setIsModalOpen(true);
  };

  const handleEditItem = async (plan) => {
    setModalMode('edit');
    // Chuyển đổi định dạng ngày để hiển thị trong input date
    setCurrentEditingItem({ 
      ...plan, 
      startDate: plan.startDate ? plan.startDate.split('T')[0] : '', 
      endDate: plan.endDate ? plan.endDate.split('T')[0] : '' 
    });
    
    try {
      // Lấy danh sách sản phẩm chi tiết của kế hoạch
      const details = await getProductionPlanItems(plan.id);
      // Xử lý an toàn cho danh sách chi tiết
      const rawDetails = details?.$values || details || [];
      setSelectedPlanItems(rawDetails.map(d => ({ itemId: d.item || d.Item, quantity: d.quantity || d.Quantity })));
    } catch (err) {
      console.error("Lỗi khi tải chi tiết sản phẩm:", err);
      setSelectedPlanItems([]);
    }

    setActiveTab('general');
    setActiveBOMItemId(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setIsDetailModalMaximized(false);
  };

  const handleCloseCreateOrderModal = () => {
    setIsCreateOrderModalOpen(false);
    setIsCreateOrderModalMaximized(false);
  };

  const handleCreateOrder = (plan) => {
    setViewingPlan(plan);
    setIsCreateOrderModalOpen(true);
  };

  const handleConfirmCreateOrder = async () => {
    try {
      const payload = {
        OrderCode: `ORD-${viewingPlan.planCode || viewingPlan.PlanCode}-${Date.now()}`,
        StartDate: viewingPlan.startDate || viewingPlan.StartDate,
        EndDate: viewingPlan.endDate || viewingPlan.EndDate,
        Warehouse: viewingPlan.warehouse || viewingPlan.Warehouse,
        ProductionPlan: viewingPlan.id || viewingPlan.Id,
        Note: `Lệnh tạo tự động từ kế hoạch ${viewingPlan.planCode || viewingPlan.PlanCode}`
      };
      await createProductionOrder(payload);
      showNotification("Tạo lệnh sản xuất thành công!");
      handleCloseCreateOrderModal();
    } catch (err) {
      showNotification("Lỗi khi tạo lệnh sản xuất.", "error");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    // Tạo danh sách chi tiết sản phẩm từ state hiện tại
    const productionPlanItems = selectedPlanItems.map(item => ({
      Item: item.itemId,
      Quantity: item.quantity
    }));

    const payload = {
      ...currentEditingItem,
      status: currentEditingItem.status ? parseInt(currentEditingItem.status) : null,
      warehouse: currentEditingItem.warehouse ? parseInt(currentEditingItem.warehouse) : null,
      ProductionPlanItemList: productionPlanItems // Phải khớp với tên ProductionPlanItemList trong CreateProductionPlanDto.cs
    };

    try {
      if (modalMode === 'add') {
        const response = await createProductionPlan(payload);
        const newItem = response?.value || response; // Xử lý nếu bị bọc trong { value: ... }
        const planId = newItem.id || newItem.Id; 
        setPlans(prev => [...prev, { ...newItem, id: planId }]);
      } else {
        const response = await updateProductionPlan(currentEditingItem.id, payload);
        const updated = response?.value || response;
        const planId = updated.id || updated.Id || currentEditingItem.id;
        setPlans(prev => prev.map(p => p.id === planId ? { ...updated, id: planId } : p));
      }

      showNotification(modalMode === 'add' ? "Thêm kế hoạch thành công!" : "Cập nhật kế hoạch thành công!");
      fetchData(); // Gọi lại fetchData để cập nhật cột Nguyên liệu và danh sách plans
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu.", "error");
    }
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách kế hoạch sản xuất ra tệp Excel không?'
    });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Kế hoạch sản xuất');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Mã kế hoạch', key: 'planCode', width: 20 },
        { header: 'Thành phẩm cần sản xuất', key: 'products', width: 40 },
        { header: 'Kho/Xưởng nhận', key: 'warehouse', width: 25 },
        { header: 'Ngày bắt đầu', key: 'startDate', width: 20 },
        { header: 'Ngày kết thúc', key: 'endDate', width: 20 },
        { header: 'Ghi chú', key: 'note', width: 30 },
      ];

      filteredData.forEach((plan, index) => {
        const warehouseName = "";
        const productsText = planItems
          .filter(pi => String(pi.productionPlan || pi.ProductionPlan) === String(plan.id))
          .map(pi => {
            const itemName = items.find(i => String(i.value) === String(pi.item || pi.Item))?.label || 'N/A';
            return `- ${pi.quantity || pi.Quantity} x ${itemName}`;
          })
          .join('\n');

        worksheet.addRow({
          stt: index + 1,
          planCode: plan.planCode,
          products: productsText,
          warehouse: warehouseName,
          startDate: plan.startDate ? new Date(plan.startDate).toLocaleDateString('vi-VN') : 'N/A',
          endDate: plan.endDate ? new Date(plan.endDate).toLocaleDateString('vi-VN') : 'N/A',
          note: plan.note || ''
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        if (rowNumber === 1) {
          row.font = { bold: true, name: 'Times New Roman', size: 12 };
          row.alignment = { vertical: 'middle', horizontal: 'center' };
          row.height = 30;
        } else {
          row.height = 25;
        }
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Kế hoạch sản xuất.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'export') {
      await handleExportExcel();
    } else if (confirmModal.type === 'delete') {
      try {
        await deleteProductionPlan(confirmModal.id);
        setPlans(prev => prev.filter(p => p.id !== confirmModal.id));
        showNotification("Xóa kế hoạch thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa kế hoạch.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const columns = [
    { header: 'STT', render: (row, { index }) => index }, // STT nên bắt đầu từ 1
    { 
      header: 'Mã kế hoạch', 
      accessor: 'planCode', 
      className: 'font-bold text-blue-600 max-w-[120px] truncate' // Làm cột ngắn lại
    },
    { 
      header: 'Thành phẩm', 
      render: (row) => {
        const currentItems = planItems.filter(pi => String(pi.productionPlan || pi.ProductionPlan) === String(row.id));
        return (
          <div className="relative group min-h-[30px]">
            <div className="text-[11px] flex flex-wrap gap-1.5 max-w-[200px] pr-8">
              {currentItems.map((pi, idx) => {
              const itemName = items.find(i => String(i.value) === String(pi.item || pi.Item))?.label || 'N/A';
              return (
                <span key={pi.id || pi.Id || idx} className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-700 font-medium whitespace-nowrap border border-gray-200">
                  {pi.quantity || pi.Quantity} x {itemName}
                </span>
              );
            })}
            </div>
            <button 
              onClick={() => { setViewingPlan(row); setIsDetailModalOpen(true); }}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50 rounded-full shadow-sm bg-white border border-blue-100"
              title="Xem chi tiết nguyên liệu cấu thành"
            >
              <Search size={14} />
            </button>
          </div>
        );
      }
    },
    { 
      header: 'Thời gian', 
      render: (row) => (
        <div className="text-xs">
          <div>Bắt đầu: {row.startDate ? new Date(row.startDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
          <div>Kết thúc: {row.endDate ? new Date(row.endDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Hành động',
      className: 'text-left',
      render: (row) => (
        <div className="flex gap-2 justify-start">
          <button onClick={() => handleEditItem(row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors">Sửa</button>
          <button 
            onClick={() => setConfirmModal({ isOpen: true, id: row.id, type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa kế hoạch này?' })} 
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors"
          >
            Xóa
          </button>
          <button 
            onClick={() => handleCreateOrder(row)} 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors whitespace-nowrap"
          >
            Tạo lệnh sản xuất
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Kế hoạch sản xuất</h2>
      
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã hoặc ghi chú"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={handleRequestExportExcel} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors">
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button onClick={handleAddItem} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors">
            Thêm kế hoạch mới
          </button>
        </div>
      </div>

      {loading ? <p className="p-4 italic text-gray-500">Đang tải dữ liệu...</p> : <CustomDatatable columns={columns} data={filteredData} />}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? 'Thêm kế hoạch mới' : 'Chỉnh sửa kế hoạch'} isMaximized={isModalMaximized} onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}>
        {/* Tab Headers */}
        <div className="flex border-b mb-4">
          <button type="button" onClick={() => setActiveTab('general')} className={`py-2 px-4 transition-all ${activeTab === 'general' ? 'border-b-2 border-blue-500 font-bold text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Thông tin chung</button>
          <button type="button" onClick={() => setActiveTab('details')} className={`py-2 px-4 transition-all ${activeTab === 'details' ? 'border-b-2 border-blue-500 font-bold text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Thông tin chi tiết</button>
        </div>

        <form onSubmit={handleModalSubmit} className="space-y-4">
          {/* Tab: Thông tin chung */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-700">Mã kế hoạch</label>
                  <input 
                    type="text" 
                    value={currentEditingItem?.planCode || ''} 
                    onChange={(e) => setCurrentEditingItem({...currentEditingItem, planCode: e.target.value})} 
                    className={`w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-2 min-h-[44px] text-base' : 'p-1.5 min-h-[38px] text-sm'}`} 
                    required 
                  />
                </div>
                <CustomSelect label="Kho/Xưởng nhận" options={[]} value={currentEditingItem?.warehouse || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, warehouse: e.target.value})} isModalMaximized={isModalMaximized} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DateInput label="Ngày bắt đầu" value={currentEditingItem?.startDate || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, startDate: e.target.value})} isModalMaximized={isModalMaximized} />
                <DateInput label="Ngày kết thúc" value={currentEditingItem?.endDate || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, endDate: e.target.value})} isModalMaximized={isModalMaximized} />
              </div>
              {/* <CustomSelect label="Trạng thái kế hoạch" options={statuses} value={currentEditingItem?.status || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, status: e.target.value})} /> */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea value={currentEditingItem?.note || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, note: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none" rows="3"></textarea>
              </div>
            </div>
          )}

          {/* Tab: Thông tin chi tiết */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <CustomSelect 
                label="Sản phẩm cần sản xuất" 
                options={items} 
                isMulti={true}
                isModalMaximized={isModalMaximized}
                value={items.filter(item => selectedPlanItems.some(sp => String(sp.itemId) === String(item.value)))}
                onChange={(selected) => {
                  const selectedIds = Array.isArray(selected) ? selected.map(s => s.value) : (selected ? [selected.value] : []);
                  setSelectedPlanItems(prev => {
                    const existing = prev.filter(p => selectedIds.includes(p.itemId));
                    const newOnes = selectedIds
                      .filter(id => !prev.some(p => p.itemId === id))
                      .map(id => ({ itemId: id, quantity: 1 }));
                    return [...existing, ...newOnes];
                  });
                }}
              />
              
              <div className="mt-4">
                <h4 className="font-bold text-sm text-gray-700 mb-2">Sản phẩm được chọn</h4>
                {/* Thay đổi overflow-hidden thành overflow-visible để không bị cắt menu absolute */}
                <div className="overflow-visible border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPlanItems.map((item) => (
                        <tr key={item.itemId}>
                          <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                            {items.find(i => String(i.value) === String(item.itemId))?.label || 'N/A'}
                          </td>
                          <td className="px-4 py-2 relative">
                            <input 
                              type="number" 
                              min="1"
                              value={item.quantity} 
                              onFocus={() => setActiveBOMItemId(item.itemId)}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setSelectedPlanItems(prev => prev.map(p => p.itemId === item.itemId ? {...p, quantity: val} : p));
                              }}
                              className="w-full border border-gray-300 rounded p-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {/* Ép kiểu String để so sánh ID chính xác hơn */}
                            {activeBOMItemId !== null && String(activeBOMItemId) === String(item.itemId) && (
                              <div className="absolute left-full top-0 ml-4 z-[100] bg-white border border-gray-200 shadow-2xl rounded-xl p-3 flex flex-wrap gap-2 min-w-[350px] w-max max-w-[500px] animate-in fade-in slide-in-from-left-2 duration-200">
                                <div className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 border-b pb-1">Định mức nguyên liệu</div>
                                {boms.filter(b => String(b.item || b.Item) === String(item.itemId)).length > 0 ? (
                                  boms.filter(b => String(b.item || b.Item) === String(item.itemId)).map((bom, bIdx) => {
                                    const cat = materialCategories.find(c => String(c.id || c.Id) === String(bom.materialCategory || bom.MaterialCategory));
                                    return (
                                      <span key={bIdx} className="bg-gray-200 px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-700 border border-gray-300 shadow-sm whitespace-nowrap">
                                        {((bom.requiredQuantity || bom.RequiredQuantity || 0) * (item.quantity || 0)).toLocaleString()} x {cat?.name || cat?.Name || 'N/A'}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-[11px] text-gray-400 italic p-1">Chưa thiết lập định mức (BOM)</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {selectedPlanItems.length === 0 && (
                        <tr>
                          <td colSpan="2" className="px-4 py-6 text-center text-sm text-gray-400 italic">Chưa có sản phẩm nào được chọn</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu kế hoạch</button>
          </div>
        </form>
      </Modal>

      {/* Modal chi tiết định mức nguyên liệu */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={handleCloseDetailModal} 
        title={`Chi tiết nguyên liệu cần thiết - ${viewingPlan?.planCode}`}
        maxWidth="max-w-7xl"
        isMaximized={isDetailModalMaximized}
        onMaximizeToggle={() => setIsDetailModalMaximized(!isDetailModalMaximized)}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r w-1/6">Thành phẩm</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r">Nguyên liệu cấu thành</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r">Tồn kho</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r min-w-[200px]">Kho/Xưởng</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[220px]">Thời gian</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {planDetails.map((detail, idx) => (
                <tr key={detail.id || idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-normal text-sm font-bold text-blue-600 border-r">
                    {detail.product}
                  </td>
                  <td className="px-4 py-4 border-r">
                    <div className="flex flex-wrap gap-2">
                      {detail.materials.length > 0 ? (
                        detail.materials.map((m, mIdx) => (
                          <span key={mIdx} className="bg-gray-200 px-2 py-1 rounded-md text-xs font-medium text-gray-700 border border-gray-300">
                            {m.quantityNeeded.toLocaleString()} x {m.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-xs">Chưa thiết lập định mức (BOM)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 border-r">
                    <div className="flex flex-wrap gap-2">
                      {detail.materials.length > 0 ? (
                        detail.materials.map((m, mIdx) => (
                          <span 
                            key={mIdx} 
                            className={`px-2 py-1 rounded-md text-xs font-medium border ${m.remainingStock < 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-200 text-gray-700 border-gray-300'}`}
                          >
                            {m.remainingStock.toLocaleString()} x {m.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-xs">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 border-r">
                    {[]}
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <div >Bắt đầu:</div>
                      <div>{viewingPlan?.startDate ? new Date(viewingPlan.startDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div >Kết thúc:</div>
                      <div>{viewingPlan?.endDate ? new Date(viewingPlan.endDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleCloseDetailModal}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Đóng
          </button>
        </div>
      </Modal>

      {/* Modal Xác nhận Tạo lệnh sản xuất */}
      <Modal 
        isOpen={isCreateOrderModalOpen} 
        onClose={handleCloseCreateOrderModal} 
        title={`Tạo Lệnh sản xuất từ - ${viewingPlan?.planCode}`}
        maxWidth="max-w-7xl"
        isMaximized={isCreateOrderModalMaximized}
        onMaximizeToggle={() => setIsCreateOrderModalMaximized(!isCreateOrderModalMaximized)}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 italic">* Hệ thống sẽ khởi tạo lệnh sản xuất dựa trên kế hoạch và định mức nguyên liệu bên dưới.</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r w-1/6">Thành phẩm</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r">Nguyên liệu cấu thành</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r">Tồn kho</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r min-w-[200px]">Kho/Xưởng</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[220px]">Thời gian</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {planDetails.map((detail, idx) => (
                  <tr key={detail.id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-normal text-sm font-bold text-blue-600 border-r">
                      {detail.product}
                    </td>
                    <td className="px-4 py-4 border-r">
                      <div className="flex flex-wrap gap-2">
                        {detail.materials.map((m, mIdx) => (
                          <span key={mIdx} className="bg-gray-200 px-2 py-1 rounded-md text-xs font-medium text-gray-700 border border-gray-300">
                            {m.quantityNeeded.toLocaleString()} x {m.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r">
                      <div className="flex flex-wrap gap-2">
                        {detail.materials.map((m, mIdx) => (
                          <span key={mIdx} className={`px-2 py-1 rounded-md text-xs font-medium border ${m.remainingStock < 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-200 text-gray-700 border-gray-300'}`}>
                            {m.remainingStock.toLocaleString()} x {m.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 border-r">
                      {[]}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <div >Bắt đầu:</div>
                        <div>{viewingPlan?.startDate ? new Date(viewingPlan.startDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div >Kết thúc:</div>
                        <div>{viewingPlan?.endDate ? new Date(viewingPlan.endDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={handleCloseCreateOrderModal} className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium">
              Đóng
            </button>
            <button onClick={handleConfirmCreateOrder} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-bold flex items-center gap-2">
              <ClipboardList size={18} />
              Tạo lệnh sản xuất
            </button>
          </div>
        </div>
      </Modal>

      <CustomConfirm isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, id: null })} onConfirm={handleConfirmAction} title={confirmModal.title} message={confirmModal.message} type={confirmModal.type} />
      <AppNotification isOpen={notification.isOpen} message={notification.message} type={notification.type} onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
};