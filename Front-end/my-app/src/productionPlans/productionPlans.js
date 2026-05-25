import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Search, Plus, FileDown, Calendar, Package, ClipboardList, ChevronRight, ChevronDown, X } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect, DateInput } from '../customComponent/customComponent';
import { getProductionPlans, createProductionPlan, updateProductionPlan, deleteProductionPlan, getProductionPlanItems, createProductionPlanItem, deleteProductionPlanItem } from '../controller/productionPlansController';
import { createProductionOrder } from '../controller/productionOrdersController';
import { getItems } from '../controller/itemsController';
import { getMaterials } from '../controller/materialsController';
import { getBOMs } from '../controller/bomController';
import { getMaterialCategories } from '../controller/materialCategoriesController';
import { getProductionSections } from '../controller/productionSectionsController';
import { getMachines } from '../controller/machinesController';
import { getUsers } from '../controller/usersController';
import { MdAdd } from "react-icons/md";

const PortalMultiSelect = ({ label, options, value = [], onChange, placeholder = '-- Chọn --', isModalMaximized = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuRect, setMenuRect] = useState(null);
  const triggerRef = useRef(null);
  const selectedOptions = useMemo(() => (
    options.filter(option => value.some(selected => String(selected?.value || selected) === String(option.value)))
  ), [options, value]);
  const filteredOptions = useMemo(() => (
    options.filter(option => (option.label || '').toLowerCase().includes(searchQuery.toLowerCase()))
  ), [options, searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setMenuRect(null);
      return undefined;
    }

    const updateRect = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuRect({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width
      });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isOpen]);

  const toggleOption = (option) => {
    const isSelected = selectedOptions.some(selected => String(selected.value) === String(option.value));
    const nextOptions = isSelected
      ? selectedOptions.filter(selected => String(selected.value) !== String(option.value))
      : [...selectedOptions, option];
    onChange(nextOptions.map(selected => selected.value));
  };

  const menu = isOpen && menuRect ? createPortal(
    <>
      <div className="fixed inset-0 z-[99980]" onClick={() => setIsOpen(false)} />
      <div
        style={{
          position: 'fixed',
          top: Math.min(menuRect.top, window.innerHeight - 260),
          left: Math.max(16, Math.min(menuRect.left, window.innerWidth - menuRect.width - 16)),
          width: menuRect.width,
          zIndex: 99990
        }}
        className="max-h-64 overflow-y-auto overflow-x-hidden rounded-md border border-gray-200 bg-white shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white p-2">
          <div className="relative">
            <Search size={isModalMaximized ? 16 : 14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className={`w-full rounded border border-gray-200 pl-7 pr-2 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isModalMaximized ? 'py-2 text-sm' : 'py-1.5 text-xs'}`}
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {filteredOptions.length > 0 ? (
          filteredOptions.map(option => {
            const isSelected = selectedOptions.some(selected => String(selected.value) === String(option.value));
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option)}
                className={`flex w-full min-w-0 items-center border-b border-gray-50 px-3 text-left transition-colors last:border-b-0 hover:bg-blue-50 ${isModalMaximized ? 'py-3 text-base' : 'py-3 text-sm'} ${isSelected ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-700'}`}
              >
                <span className="block w-full break-words leading-relaxed">{option.label}</span>
              </button>
            );
          })
        ) : (
          <div className="px-3 py-4 text-center text-xs italic text-gray-400">Không tìm thấy kết quả</div>
        )}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="flex w-full flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-700">{label}</label>}
      <div className={`relative ${isModalMaximized ? 'text-base' : 'text-sm'}`} ref={triggerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex w-full cursor-pointer items-center rounded-md border border-gray-300 bg-white pr-10 text-left shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${isModalMaximized ? 'min-h-[44px] p-2' : 'min-h-[38px] p-1.5'}`}
        >
          <span className="block flex-1 whitespace-normal break-words leading-tight">
            {selectedOptions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedOptions.map(option => (
                  <span key={option.value} className="inline-flex items-center rounded-full border border-gray-300 bg-gray-200 px-2 py-1 text-xs font-medium text-gray-800">
                    {option.label}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(selectedOptions.filter(selected => String(selected.value) !== String(option.value)).map(selected => selected.value));
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        e.stopPropagation();
                        onChange(selectedOptions.filter(selected => String(selected.value) !== String(option.value)).map(selected => selected.value));
                      }}
                      className="ml-1.5 rounded-full p-0.5 transition-colors hover:bg-gray-300"
                    >
                      <X size={10} />
                    </span>
                  </span>
                ))}
              </div>
            ) : placeholder}
          </span>
          <div className="absolute inset-y-0 right-4 flex items-center text-gray-500 pointer-events-none">
            <ChevronDown size={16} />
          </div>
        </button>
      </div>
      {menu}
    </div>
  );
};

export const ProductionPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [items, setItems] = useState([]);
  const [planItems, setPlanItems] = useState([]); // Thêm state để lưu chi tiết nguyên liệu
  const [materials, setMaterials] = useState([]); // Thêm state để lưu tồn kho nguyên liệu thực tế
  const [boms, setBoms] = useState([]); // Định mức sản phẩm
  const [materialCategories, setMaterialCategories] = useState([]); // Danh mục nguyên liệu
  const [productionSections, setProductionSections] = useState([]);
  const [machines, setMachines] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ planCode: '', startDate: '', endDate: '', status: '', warehouse: '', note: '', productionSection: '', machines: [] });
  const [selectedPlanItems, setSelectedPlanItems] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [isDetailModalMaximized, setIsDetailModalMaximized] = useState(false);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [isCreateOrderModalMaximized, setIsCreateOrderModalMaximized] = useState(false);
  const [activeBOMItemId, setActiveBOMItemId] = useState(null);
  const [bomMenuRect, setBomMenuRect] = useState(null);
  const [bomMenuOffset, setBomMenuOffset] = useState({ x: 0, y: 0 });
  const [isBOMMenuDragging, setIsBOMMenuDragging] = useState(false);
  const bomMenuAnchorRefs = useRef({});
  const bomMenuRef = useRef(null);
  const bomMenuDragRef = useRef(null);
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
      const [planData, itemData, planItemsData, bomData, catData, materialData, sectionData, machineData, userData] = await Promise.all([
        getProductionPlans(),
        getItems(),
        getProductionPlanItems(), // Tải tất cả chi tiết để hiển thị ở bảng chính
        getBOMs(),
        getMaterialCategories(),
        getMaterials(),
        getProductionSections(),
        getMachines(),
        getUsers()
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

      const rawSections = sectionData?.$values || sectionData || [];
      setProductionSections(rawSections.map(section => ({
        id: section.id || section.ID,
        name: section.name || section.Name,
        leader: section.leader || section.Leader || ''
      })));

      const rawMachines = machineData?.$values || machineData || [];
      setMachines(rawMachines.map(machine => ({
        value: machine.id || machine.Id,
        label: machine.machineCode || machine.MachineCode || `Máy #${machine.id || machine.Id}`
      })));

      const rawUsers = userData?.$values || userData || [];
      setUsers(rawUsers.map(user => ({
        id: user.id || user.ID || user.Id,
        name: user.name || user.Name || user.username || user.UserName || `User #${user.id || user.ID || user.Id}`
      })));

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

  const productionSectionOptions = useMemo(() => (
    productionSections.map(section => ({ value: section.id, label: section.name || `Tổ #${section.id}` }))
  ), [productionSections]);

  const selectedProductionSection = useMemo(() => (
    productionSections.find(section => String(section.id) === String(currentEditingItem?.productionSection))
  ), [currentEditingItem?.productionSection, productionSections]);

  const selectedSectionLeaderName = useMemo(() => {
    if (!selectedProductionSection?.leader) return '';
    return users.find(user => String(user.id) === String(selectedProductionSection.leader))?.name || '';
  }, [selectedProductionSection, users]);

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

  const activeBOMPlanItem = useMemo(() => (
    selectedPlanItems.find(item => String(item.itemId) === String(activeBOMItemId))
  ), [activeBOMItemId, selectedPlanItems]);

  useEffect(() => {
    setBomMenuOffset({ x: 0, y: 0 });
    setIsBOMMenuDragging(false);
    bomMenuDragRef.current = null;
  }, [activeBOMItemId]);

  useEffect(() => {
    if (!isModalOpen || activeTab !== 'details' || activeBOMItemId === null) {
      setBomMenuRect(null);
      setBomMenuOffset({ x: 0, y: 0 });
      return undefined;
    }

    const updateBOMMenuRect = () => {
      const anchor = bomMenuAnchorRefs.current[String(activeBOMItemId)];
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setBomMenuRect({
        top: rect.top,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height
      });
    };

    updateBOMMenuRect();
    window.addEventListener('resize', updateBOMMenuRect);
    window.addEventListener('scroll', updateBOMMenuRect, true);

    return () => {
      window.removeEventListener('resize', updateBOMMenuRect);
      window.removeEventListener('scroll', updateBOMMenuRect, true);
    };
  }, [activeBOMItemId, activeTab, isModalOpen, isModalMaximized]);

  useEffect(() => {
    if (activeBOMItemId === null) return undefined;

    const handleClickOutsideBOMMenu = (event) => {
      const anchor = bomMenuAnchorRefs.current[String(activeBOMItemId)];
      if (anchor?.contains(event.target) || bomMenuRef.current?.contains(event.target)) return;
      setActiveBOMItemId(null);
      setBomMenuRect(null);
    };

    document.addEventListener('mousedown', handleClickOutsideBOMMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideBOMMenu);
  }, [activeBOMItemId]);

  useEffect(() => {
    if (!isBOMMenuDragging) return undefined;

    const handlePointerMove = (event) => {
      if (!bomMenuDragRef.current) return;
      const nextX = bomMenuDragRef.current.originX + event.clientX - bomMenuDragRef.current.startX;
      const nextY = bomMenuDragRef.current.originY + event.clientY - bomMenuDragRef.current.startY;
      setBomMenuOffset({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      setIsBOMMenuDragging(false);
      bomMenuDragRef.current = null;
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isBOMMenuDragging]);

  const handleBOMMenuDragStart = (event) => {
    event.preventDefault();
    bomMenuDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: bomMenuOffset.x,
      originY: bomMenuOffset.y
    };
    setIsBOMMenuDragging(true);
  };

  const renderBOMMenu = () => {
    if (!activeBOMPlanItem || !bomMenuRect) return null;

    const isMobile = window.innerWidth < 768;
    const menuWidth = window.innerWidth >= 768
      ? Math.min(500, Math.max(350, window.innerWidth - bomMenuRect.right - 32))
      : Math.min(500, Math.max(320, window.innerWidth - 32));
    const baseLeft = window.innerWidth >= 768
      ? bomMenuRect.right + 16
      : Math.max(16, Math.min(bomMenuRect.left, window.innerWidth - menuWidth - 16));
    const baseTop = isMobile
      ? bomMenuRect.top + bomMenuRect.height + 8
      : bomMenuRect.top;
    const left = Math.max(8, Math.min(baseLeft + bomMenuOffset.x, window.innerWidth - menuWidth - 8));
    const top = Math.max(8, Math.min(baseTop + bomMenuOffset.y, window.innerHeight - 96));
    const activeBOMs = boms.filter(b => String(b.item || b.Item) === String(activeBOMPlanItem.itemId));

    return createPortal(
      <div
        ref={bomMenuRef}
        style={{ position: 'fixed', top, left, width: menuWidth, zIndex: 99999 }}
        className="bg-white border border-gray-200 shadow-2xl rounded-xl p-3 flex flex-wrap gap-2 max-w-[calc(100vw-32px)] animate-in fade-in slide-in-from-left-2 duration-200"
      >
        <button
          type="button"
          onPointerDown={handleBOMMenuDragStart}
          className="w-full cursor-move touch-none select-none text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 border-b pb-1 active:text-blue-600"
          title="Kéo để di chuyển"
        >
          Định mức nguyên liệu
        </button>
        {activeBOMs.length > 0 ? (
          activeBOMs.map((bom, bIdx) => {
            const cat = materialCategories.find(c => String(c.id || c.Id) === String(bom.materialCategory || bom.MaterialCategory));
            return (
              <span key={bIdx} className="bg-gray-200 px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-700 border border-gray-300 shadow-sm whitespace-nowrap">
                {((bom.requiredQuantity || bom.RequiredQuantity || 0) * (activeBOMPlanItem.quantity || 0)).toLocaleString()} x {cat?.name || cat?.Name || 'N/A'}
              </span>
            );
          })
        ) : (
          <span className="text-[11px] text-gray-400 italic p-1">Chưa thiết lập định mức (BOM)</span>
        )}
      </div>,
      document.body
    );
  };

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ planCode: `PLAN-${Date.now()}`, startDate: new Date().toISOString().split('T')[0], endDate: '', status: '', warehouse: '', note: '', productionSection: '', machines: [] });
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
      endDate: plan.endDate ? plan.endDate.split('T')[0] : '',
      productionSection: plan.productionSection || plan.ProductionSection || '',
      machines: Array.isArray(plan.machines || plan.Machines)
        ? (plan.machines || plan.Machines)
        : []
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
    setActiveBOMItemId(null);
    setBomMenuRect(null);
    setBomMenuOffset({ x: 0, y: 0 });
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
      ProductionSection: currentEditingItem.productionSection ? parseInt(currentEditingItem.productionSection) : null,
      MachineList: (currentEditingItem.machines || []).map(machineId => parseInt(machineId)),
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
        { header: 'Mã kế hoạch', key: 'planCode', width: 22 },
        { header: 'Thành phẩm cần sản xuất', key: 'product', width: 42 },
        { header: 'Nguyên liệu', key: 'materials', width: 55 },
        { header: 'Kho/Xưởng nhận', key: 'warehouse', width: 25 },
        { header: 'Ngày bắt đầu', key: 'startDate', width: 20 },
        { header: 'Ngày kết thúc', key: 'endDate', width: 20 },
        { header: 'Ghi chú', key: 'note', width: 30 },
      ];

      filteredData.forEach((plan, index) => {
        const planId = plan.id || plan.Id;
        const warehouseName = "";
        const planProducts = planItems.filter(pi => String(pi.productionPlan || pi.ProductionPlan) === String(planId));
        const rowsForPlan = planProducts.length > 0 ? planProducts : [{ item: null, Item: null, quantity: 0, Quantity: 0 }];
        const startRow = worksheet.rowCount + 1;

        rowsForPlan.forEach((pi) => {
          const itemId = pi.item || pi.Item;
          const quantity = pi.quantity || pi.Quantity || 0;
          const itemName = items.find(i => String(i.value) === String(itemId))?.label || 'N/A';
          const productBoms = boms.filter(b => String(b.item || b.Item) === String(itemId));
          const materialsText = productBoms.length > 0
            ? productBoms.map((bom) => {
              const materialCategoryId = bom.materialCategory || bom.MaterialCategory;
              const category = materialCategories.find(c => String(c.id || c.Id) === String(materialCategoryId));
              const requiredQuantity = (bom.requiredQuantity || bom.RequiredQuantity || 0) * quantity;
              return `- ${requiredQuantity.toLocaleString()} ${category?.name || category?.Name || 'N/A'}`;
            }).join('\n')
            : 'Chưa thiết lập định mức (BOM)';

          const row = worksheet.addRow({
            stt: index + 1,
            planCode: plan.planCode || plan.PlanCode || '',
            product: itemId ? `- ${quantity.toLocaleString()} ${itemName}` : 'Chưa có thành phẩm',
            materials: materialsText,
            warehouse: warehouseName,
            startDate: plan.startDate ? new Date(plan.startDate).toLocaleDateString('vi-VN') : 'N/A',
            endDate: plan.endDate ? new Date(plan.endDate).toLocaleDateString('vi-VN') : 'N/A',
            note: plan.note || plan.Note || ''
          });
          row.height = Math.max(25, materialsText.split('\n').length * 18);
        });

        const endRow = worksheet.rowCount;
        if (endRow > startRow) {
          ['A', 'B', 'E', 'F', 'G', 'H'].forEach((column) => {
            worksheet.mergeCells(`${column}${startRow}:${column}${endRow}`);
          });
        }
      });

      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        if (rowNumber === 1) {
          row.font = { bold: true, name: 'Times New Roman', size: 12 };
          row.alignment = { vertical: 'middle', horizontal: 'center' };
          row.height = 30;
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
    { header: 'STT', className: 'hidden sm:table-cell w-[50px] text-center', render: (row, { index }) => index },
    {
      header: 'Mã kế hoạch',
      accessor: 'planCode',
      className: 'font-bold text-blue-600 min-w-[100px] truncate'
    },
    {
      header: 'Thành phẩm',
      render: (row) => {
        const currentItems = planItems.filter(pi => String(pi.productionPlan || pi.ProductionPlan) === String(row.id));
        return (
          <div className="relative group min-h-[24px]">
            <div className="text-[10px] sm:text-[11px] flex flex-wrap gap-1 max-w-[180px] sm:max-w-[200px] pr-6">
              {currentItems.map((pi, idx) => {
                const itemName = items.find(i => String(i.value) === String(pi.item || pi.Item))?.label || 'N/A';
                return (
                  <span key={pi.id || pi.Id || idx} className="bg-gray-50 px-1.5 py-0.5 rounded text-gray-600 font-medium whitespace-nowrap border border-gray-200">
                    {pi.quantity || pi.Quantity} x {itemName}
                  </span>
                );
              })}
            </div>
            <button
              onClick={() => { setViewingPlan(row); setIsDetailModalOpen(true); }}
              className="absolute right-0 top-0 p-1 text-blue-600 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-50 rounded shadow-sm bg-white/80 border border-blue-100"
              title="Xem chi tiết nguyên liệu cấu thành"
            >
              <Search size={12} />
            </button>
          </div>
        );
      }
    },
    {
      header: 'Thời gian',
      className: 'hidden md:table-cell',
      render: (row) => (
        <div className="text-xs">
          <div>Bắt đầu: {row.startDate ? new Date(row.startDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
          <div>Kết thúc: {row.endDate ? new Date(row.endDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-4 w-[100px] sm:w-[250px]',
      render: (row) => (
        <div className="flex gap-1.5 justify-end items-center">
          <button onClick={() => handleEditItem(row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95">Sửa</button>
          <button
            onClick={() => setConfirmModal({ isOpen: true, id: row.id, type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa kế hoạch này?' })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded text-[11px] sm:text-xs transition-all active:scale-95"
          >
            Xóa
          </button>
          <button
            onClick={() => handleCreateOrder(row)}
            className="hidden sm:inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs transition-all active:scale-95 whitespace-nowrap shadow-sm"
          >
            Tạo lệnh sản xuất
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-50/50 min-h-screen">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 tracking-tight">Kế hoạch sản xuất</h2>

      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full lg:max-w-[350px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã hoặc ghi chú"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm outline-none transition-all sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button onClick={handleRequestExportExcel} className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-sm">
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button onClick={handleAddItem} className="flex gap-2 items-center justify-center w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded whitespace-nowrap transition-all active:scale-95 shadow-md text-sm">
            <MdAdd />
            Thêm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="italic text-sm">Đang tải dữ liệu kế hoạch...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <CustomDatatable
            columns={columns}
            data={filteredData}
            renderExpansion={(row) => (
              <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-sm">
                  <div className="flex flex-col gap-1 md:hidden">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thời gian dự kiến</span>
                    <div className="text-gray-900 font-medium">
                      {row.startDate ? new Date(row.startDate).toLocaleDateString('vi-VN') : '---'} → {row.endDate ? new Date(row.endDate).toLocaleDateString('vi-VN') : '---'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ghi chú kế hoạch</span>
                    <span className="text-gray-900 font-medium italic leading-relaxed">{row.note || '---'}</span>
                  </div>
                  <div className="flex flex-col gap-2 sm:hidden">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tác vụ nhanh</span>
                    <button
                      onClick={() => handleCreateOrder(row)}
                      className="w-full bg-green-600 text-white font-bold py-2 rounded-lg text-[11px] shadow-sm active:scale-95"
                    >
                      Tạo lệnh sản xuất
                    </button>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? 'Thêm kế hoạch mới' : 'Chỉnh sửa kế hoạch'} maxWidth="max-w-[60vw] max-lg:max-w-[90vw]" isMaximized={isModalMaximized} onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}>
        {/* Tab Headers */}
        <div className="mb-4 overflow-x-auto overflow-y-hidden border-b custom-scrollbar">
          <div className="flex min-w-max">
            <button type="button" onClick={() => { setActiveTab('general'); setActiveBOMItemId(null); setBomMenuRect(null); }} className={`shrink-0 whitespace-nowrap py-2 px-4 transition-all ${activeTab === 'general' ? 'border-b-2 border-blue-500 font-bold text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <span className="sm:hidden">Cơ bản</span>
              <span className="hidden sm:inline">Thông tin cơ bản</span>
            </button>
            <button type="button" onClick={() => setActiveTab('details')} className={`shrink-0 whitespace-nowrap py-2 px-4 transition-all ${activeTab === 'details' ? 'border-b-2 border-blue-500 font-bold text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <span className="sm:hidden">Sản phẩm</span>
              <span className="hidden sm:inline">Thông tin sản phẩm</span>
            </button>
            <button type="button" onClick={() => { setActiveTab('productionSection'); setActiveBOMItemId(null); setBomMenuRect(null); }} className={`shrink-0 whitespace-nowrap py-2 px-4 transition-all ${activeTab === 'productionSection' ? 'border-b-2 border-blue-500 font-bold text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Tổ sản xuất</button>
          </div>
        </div>

        <form onSubmit={handleModalSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto px-1">
          {/* Tab: Thông tin cơ bản */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs ml-1">Mã kế hoạch <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={currentEditingItem?.planCode || ''}
                    onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, planCode: e.target.value })}
                    className={`w-full border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isModalMaximized ? 'p-3 text-base' : 'p-2.5 text-sm'}`}
                    required
                  />
                </div>
                <CustomSelect label="Kho/Xưởng nhận" options={[]} value={currentEditingItem?.warehouse || ''} onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, warehouse: e.target.value })} isModalMaximized={isModalMaximized} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DateInput label="Ngày bắt đầu" value={currentEditingItem?.startDate || ''} onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, startDate: e.target.value })} isModalMaximized={isModalMaximized} />
                <DateInput label="Ngày kết thúc" value={currentEditingItem?.endDate || ''} onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, endDate: e.target.value })} isModalMaximized={isModalMaximized} />
              </div>
              {/* <CustomSelect label="Trạng thái kế hoạch" options={statuses} value={currentEditingItem?.status || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, status: e.target.value})} /> */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ghi chú</label>
                <textarea value={currentEditingItem?.note || ''} onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, note: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm" rows="3"></textarea>
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
                  setActiveBOMItemId(null);
                  setBomMenuRect(null);
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
                              ref={(el) => {
                                if (el) bomMenuAnchorRefs.current[String(item.itemId)] = el;
                                else delete bomMenuAnchorRefs.current[String(item.itemId)];
                              }}
                              type="number"
                              min="1"
                              value={item.quantity}
                              onFocus={() => setActiveBOMItemId(item.itemId)}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setSelectedPlanItems(prev => prev.map(p => p.itemId === item.itemId ? { ...p, quantity: val } : p));
                              }}
                              className="w-full border border-gray-300 rounded p-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
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

          {/* Tab: Tổ sản xuất */}
          {activeTab === 'productionSection' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomSelect
                  label="Tổ sản xuất"
                  name="productionSection"
                  options={productionSectionOptions}
                  value={currentEditingItem?.productionSection || ''}
                  onChange={(e) => setCurrentEditingItem(prev => ({
                    ...prev,
                    productionSection: e.target.value
                  }))}
                  isModalMaximized={isModalMaximized}
                />

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-700">Tổ trưởng</label>
                  <input
                    type="text"
                    value={selectedSectionLeaderName || ''}
                    disabled
                    placeholder="Tự động theo tổ sản xuất"
                    className={`w-full border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed shadow-sm outline-none ${isModalMaximized ? 'p-2 min-h-[44px] text-base' : 'p-1.5 min-h-[38px] text-sm'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1">
                <PortalMultiSelect
                  label="Máy"
                  options={machines}
                  value={currentEditingItem?.machines || []}
                  onChange={(selectedMachineIds) => setCurrentEditingItem(prev => ({
                    ...prev,
                    machines: selectedMachineIds
                  }))}
                  isModalMaximized={isModalMaximized}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button type="button" onClick={handleCloseModal} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors text-sm">Hủy</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm">Lưu thông tin</button>
          </div>
        </form>
        {renderBOMMenu()}
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
        <div className="max-h-[70vh] overflow-y-auto pr-1 sm:pr-2 md:overflow-x-auto">
          <div className="space-y-3 md:hidden">
            {planDetails.length > 0 ? (
              planDetails.map((detail, idx) => (
                <div key={detail.id || idx} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="border-b border-gray-100 pb-3">
                    <p className="text-[10px] font-bold uppercase text-gray-400">Thành phẩm</p>
                    <p className="mt-1 text-sm font-bold text-blue-600 break-words">{detail.product}</p>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-400">Nguyên liệu cấu thành</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {detail.materials.length > 0 ? (
                          detail.materials.map((m, mIdx) => (
                            <span key={mIdx} className="max-w-full break-words rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              {m.quantityNeeded.toLocaleString()} x {m.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs italic text-gray-400">Chưa thiết lập định mức (BOM)</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-400">Tồn kho</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {detail.materials.length > 0 ? (
                          detail.materials.map((m, mIdx) => (
                            <span
                              key={mIdx}
                              className={`max-w-full break-words rounded-md border px-2 py-1 text-xs font-medium ${m.remainingStock < 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}
                            >
                              {m.remainingStock.toLocaleString()} x {m.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs italic text-gray-400">-</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 text-xs text-gray-700">
                      <div>
                        <span className="font-semibold text-gray-500">Kho/Xưởng: </span>
                        <span>N/A</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <span><span className="font-semibold text-gray-500">Bắt đầu:</span> {viewingPlan?.startDate ? new Date(viewingPlan.startDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                        <span><span className="font-semibold text-gray-500">Kết thúc:</span> {viewingPlan?.endDate ? new Date(viewingPlan.endDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
                Không có dữ liệu nguyên liệu
              </div>
            )}
          </div>

          <table className="hidden min-w-full divide-y divide-gray-200 border md:table">
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
        <div className="mt-4 flex justify-end border-t border-gray-100 pt-3 sm:mt-6">
          <button
            onClick={handleCloseDetailModal}
            className="w-full bg-gray-500 text-white px-6 py-2.5 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium sm:w-auto sm:py-2"
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
          <p className="rounded-lg border border-green-100 bg-green-50 px-3 py-2.5 text-sm font-medium text-green-800 sm:px-4">Hệ thống sẽ khởi tạo lệnh sản xuất dựa trên kế hoạch và định mức nguyên liệu bên dưới.</p>
          <div className="max-h-[70vh] overflow-y-auto pr-1 sm:pr-2 md:overflow-x-auto">
            <div className="space-y-3 md:hidden">
              {planDetails.length > 0 ? (
                planDetails.map((detail, idx) => (
                  <div key={detail.id || idx} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Thành phẩm</p>
                      <p className="mt-1 text-sm font-bold text-blue-600 break-words">{detail.product}</p>
                    </div>

                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400">Nguyên liệu cấu thành</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {detail.materials.length > 0 ? (
                            detail.materials.map((m, mIdx) => (
                              <span key={mIdx} className="max-w-full break-words rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                {m.quantityNeeded.toLocaleString()} x {m.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs italic text-gray-400">Chưa thiết lập định mức (BOM)</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400">Tồn kho</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {detail.materials.length > 0 ? (
                            detail.materials.map((m, mIdx) => (
                              <span
                                key={mIdx}
                                className={`max-w-full break-words rounded-md border px-2 py-1 text-xs font-medium ${m.remainingStock < 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}
                              >
                                {m.remainingStock.toLocaleString()} x {m.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs italic text-gray-400">-</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 text-xs text-gray-700">
                        <div>
                          <span className="font-semibold text-gray-500">Kho/Xưởng: </span>
                          <span>N/A</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          <span><span className="font-semibold text-gray-500">Bắt đầu:</span> {viewingPlan?.startDate ? new Date(viewingPlan.startDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                          <span><span className="font-semibold text-gray-500">Kết thúc:</span> {viewingPlan?.endDate ? new Date(viewingPlan.endDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
                  Không có dữ liệu nguyên liệu
                </div>
              )}
            </div>

            <table className="hidden min-w-full divide-y divide-gray-200 border md:table">
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
          <div className="mt-4 flex flex-col-reverse gap-2 border-t border-gray-100 pt-3 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
            <button onClick={handleCloseCreateOrderModal} className="w-full bg-gray-500 text-white px-6 py-2.5 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium sm:w-auto sm:py-2">
              Đóng
            </button>
            <button onClick={handleConfirmCreateOrder} className="flex w-full items-center justify-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-md hover:bg-green-700 transition-colors text-sm font-bold sm:w-auto sm:py-2">
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
