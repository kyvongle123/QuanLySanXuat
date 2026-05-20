import React, { useEffect, useState, useMemo } from 'react';
import { Search, ListChecks, FileDown, ChevronRight } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect } from '../customComponent/customComponent';
import { getProductionCapacities, createProductionCapacity, deleteProductionCapacity } from '../controller/productionCapacitiesController';
import { getItems } from '../controller/itemsController';
import { getMaterials } from '../controller/materialsController';
import { getBOMs } from '../controller/bomController';
import { getMaterialCategories } from '../controller/materialCategoriesController';

export const ProductionCapacities = () => {
  const [capacities, setCapacities] = useState([]);
  const [items, setItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [boms, setBoms] = useState([]);
  const [materialCategories, setMaterialCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [capacityData, itemsData, materialData, bomData, catData] = await Promise.all([
        getProductionCapacities(),
        getItems(),
        getMaterials(),
        getBOMs(),
        getMaterialCategories()
      ]);
      setCapacities(capacityData); // Dữ liệu lịch sử từ server
      setItems(itemsData.map(i => ({ value: i.id, label: i.name })));
      setMaterials(materialData);
      setBoms(bomData);
      setMaterialCategories(catData);
    } catch (err) {
      showNotification("Lỗi khi tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return capacities.filter(cap => {
      const itemLabel = items.find(i => String(i.value) === String(cap.item))?.label || '';
      return itemLabel.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [capacities, searchTerm, items]);

  const handleCloseModal = () => {
    setIsSelectModalOpen(false);
    setIsModalMaximized(false);
  };

  const handleToggleItemSelection = (id) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleCalculateCapacities = async () => {
    if (selectedItemIds.length === 0) {
      showNotification("Vui lòng chọn ít nhất một sản phẩm", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Tổng hợp tồn kho theo Category (Material.name chứa Category ID)
      const stockByCategory = {};
      materials.forEach(m => {
        const catId = m.name ? String(m.name) : 'unknown';
        stockByCategory[catId] = (stockByCategory[catId] || 0) + (m.quantity || 0);
      });

      let results = [];

      if (selectedItemIds.length === 1) {
        // TRƯỜNG HỢP 1 SẢN PHẨM: Bottleneck tiêu chuẩn
        const targetItemId = String(selectedItemIds[0]);
        const itemBoms = boms.filter(b => String(b.item) === targetItemId);
        console.log("itemBoms la", itemBoms);
        console.log("targetItemId la", targetItemId);
        console.log("boms la", boms);
        let minPossible = Infinity;
        let found = false;

        itemBoms.forEach(bom => {
          const bomCatId = bom.materialCategory ? String(bom.materialCategory) : null;
          const stock = bomCatId ? (stockByCategory[bomCatId] || 0) : 0;
          if (bom.requiredQuantity > 0) {
            minPossible = Math.min(minPossible, stock / bom.requiredQuantity);
            found = true;
          }
        });

        results.push({
          item: parseInt(targetItemId),
          maximumProductionQuantity: found ? Math.floor(minPossible) : 0
        });
      } else {
        // TRƯỜNG HỢP NHIỀU SẢN PHẨM: Tối ưu sản xuất đều (Equal Sets)
        // Tính tổng định mức cần thiết cho 1 "bộ" gồm tất cả các sản phẩm đã chọn
        const combinedReq = {};
        selectedItemIds.forEach(itemId => {
          const itemBoms = boms.filter(b => String(b.item) === String(itemId));
          itemBoms.forEach(bom => {
            const catId = bom.materialCategory ? String(bom.materialCategory) : 'unknown';
            combinedReq[catId] = (combinedReq[catId] || 0) + (bom.requiredQuantity || 0);
          });
        });

        let maxSets = Infinity;
        let found = false;
        Object.keys(combinedReq).forEach(catId => {
          const stock = stockByCategory[catId] || 0;
          if (combinedReq[catId] > 0) {
            maxSets = Math.min(maxSets, stock / combinedReq[catId]);
            found = true;
          }
        });

        const qtyPerItem = found ? Math.floor(maxSets) : 0;
        results = selectedItemIds.map(itemId => ({
          item: itemId,
          maximumProductionQuantity: qtyPerItem
        }));
      }

      // 2. Xóa toàn bộ dữ liệu cũ trong bảng ProductionCapacities
      const currentData = await getProductionCapacities();
      await Promise.all(currentData.map(c => deleteProductionCapacity(c.id)));

      // 3. Thêm các dòng mới đã tính toán
      await Promise.all(results.map(res => createProductionCapacity(res)));

      showNotification("Đã tính toán và lưu khả năng sản xuất thành công!");
      fetchData(); // Tải lại bảng từ DB
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi trong quá trình cập nhật năng lực sản xuất", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất kết quả khả năng sản xuất ra tệp Excel không?'
    });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Khả năng sản xuất');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Tên sản phẩm', key: 'itemName', width: 30 },
        { header: 'Nguyên liệu', key: 'materials', width: 50 },
        { header: 'Sản lượng có thể sản xuất', key: 'quantity', width: 25 },
        { header: 'Thời điểm tính toán', key: 'time', width: 25 },
      ];

      capacities.forEach((cap, index) => {
        const itemLabel = items.find(i => String(i.value) === String(cap.item))?.label || 'N/A';
        const itemBoms = boms.filter(b => String(b.item) === String(cap.item));
        const materialText = itemBoms.map(bom => {
          const cat = materialCategories.find(c => String(c.id) === String(bom.materialCategory));
          const totalNeeded = (cap.maximumProductionQuantity || 0) * (bom.requiredQuantity || 0);
          return `- ${totalNeeded.toLocaleString()} ${cat?.name || 'N/A'}`;
        }).join('\n') || 'Chưa thiết lập định mức';

        const calculationTime = cap.updatedAt || cap.createdAt;
        const timeStr = calculationTime ? new Date(calculationTime).toLocaleString('vi-VN') : 'N/A';

        worksheet.addRow({
          stt: index + 1,
          itemName: itemLabel,
          materials: materialText,
          quantity: cap.maximumProductionQuantity,
          time: timeStr
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        // Chiều cao dòng: Header 30px, Body 25px
        if (rowNumber === 1) {
          row.height = 30;
        } else {
          const cellValue = row.getCell(3).value; // Cột Nguyên liệu là cột 3
          const lineCount = (typeof cellValue === 'string') ? cellValue.split('\n').length : 1;
          // Cỡ chữ 12pt cao khoảng 15 pts. Thêm 15 pts (~20px) để tạo hiệu ứng padding trên/dưới mỗi bên 10px.
          row.height = (lineCount * 15) + 15;
        }

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          };
          // Căn giữa cột STT
          if (colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        });

        if (rowNumber === 1) {
          row.font = { name: 'Times New Roman', size: 12, bold: true };
          row.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Khả năng sản xuất.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'export') {
      await handleExportExcel();
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const columns = [
    {
      header: '',
      className: 'w-[40px] text-center',
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
      header: 'Tên sản phẩm',
      accessor: 'item',
      className: 'font-bold text-blue-600 min-w-[140px]',
      render: (row) => items.find(i => String(i.value) === String(row.item || row.Item))?.label || 'N/A'
    },
    {
      header: 'Nguyên liệu',
      className: 'hidden md:table-cell min-w-[300px]',
      render: (row) => {
        // Lấy danh sách định mức của sản phẩm này
        const itemBoms = boms.filter(b => String(b.item || b.Item) === String(row.item || row.Item));
        if (itemBoms.length === 0) return <span className="text-gray-400 italic text-sm">Chưa thiết lập định mức</span>;

        return (
          <div className="flex flex-wrap gap-2">
            {itemBoms.map((bom, idx) => {
              const cat = materialCategories.find(c => String(c.id || c.Id) === String(bom.materialCategory || bom.MaterialCategory));
              const totalNeeded = (row.maximumProductionQuantity || 0) * (bom.requiredQuantity || 0);
              return (
                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 text-xs shadow-sm">
                  <span className="text-black mr-1">{totalNeeded.toLocaleString()}</span>
                  <span className="text-gray-500 mr-1">x</span>
                  {cat?.name || 'N/A'}
                </span>
              );
            })}
          </div>
        );
      }
    },
    {
      header: 'Tồn kho',
      className: 'hidden lg:table-cell min-w-[300px]',
      render: (row) => {
        const itemBoms = boms.filter(b => String(b.item || b.Item) === String(row.item || row.Item));
        if (itemBoms.length === 0) return <span className="text-gray-400 italic text-sm">-</span>;

        return (
          <div className="flex flex-wrap gap-2">
            {itemBoms.map((bom, idx) => {
              const catId = String(bom.materialCategory || bom.MaterialCategory);
              const cat = materialCategories.find(c => String(c.id || c.Id) === catId);

              // Tính tổng tồn kho thực tế cho loại nguyên liệu này từ state materials
              const totalStock = materials
                .filter(m => String(m.name || m.Name) === catId)
                .reduce((sum, m) => sum + (m.quantity || m.Quantity || 0), 0);

              const totalNeeded = (row.maximumProductionQuantity || 0) * (bom.requiredQuantity || 0);
              const remaining = totalStock - totalNeeded;

              return (
                <span
                  key={idx}
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs shadow-sm border ${remaining < 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700'}`}
                >
                  <span className="text-black mr-1">{remaining.toLocaleString()}</span>
                  <span className="mr-1">x</span>
                  {cat?.name || 'N/A'}
                </span>
              );
            })}
          </div>
        );
      }
    },
    {
      header: 'Sản lượng có thể sản xuất',
      accessor: 'maximumProductionQuantity',
      className: 'min-w-[120px] text-center',
      render: (row) => <span className="text-black">{row.maximumProductionQuantity?.toLocaleString()}</span>
    }
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-50/50 min-h-screen">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 tracking-tight">Khả năng sản xuất</h2>

      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full lg:max-w-[350px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm outline-none transition-all sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button
            onClick={handleRequestExportExcel}
            className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-sm"
          >
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button
            onClick={() => setIsSelectModalOpen(true)}
            className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded whitespace-nowrap flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 text-sm"
          >
            + <span className="hidden sm:inline">Chọn sản phẩm cần tính</span><span className="sm:hidden">Tính toán</span>
          </button>
        </div>
      </div>

      {
        loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="italic text-sm">Đang chuẩn bị dữ liệu tính toán...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <CustomDatatable
              columns={columns}
              data={filteredData}
              renderExpansion={(row) => {
                const itemBoms = boms.filter(b => String(b.item || b.Item) === String(row.item || row.Item));
                return (
                  <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Định mức nguyên liệu</span>
                        <div className="flex flex-wrap gap-2">
                          {itemBoms.map((bom, idx) => {
                            const cat = materialCategories.find(c => String(c.id || c.Id) === String(bom.materialCategory || bom.MaterialCategory));
                            const totalNeeded = (row.maximumProductionQuantity || 0) * (bom.requiredQuantity || 0);
                            return (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-gray-200 text-xs shadow-sm">
                                <span className="text-blue-600 font-bold mr-1">{totalNeeded.toLocaleString()}</span>
                                <span className="text-gray-400 mr-1">x</span>
                                {cat?.name || 'N/A'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tồn kho khả dụng (Sau sản xuất)</span>
                        <div className="flex flex-wrap gap-2">
                          {itemBoms.map((bom, idx) => {
                            const catId = String(bom.materialCategory || bom.MaterialCategory);
                            const cat = materialCategories.find(c => String(c.id || c.Id) === catId);
                            const totalStock = materials
                              .filter(m => String(m.name || m.Name) === catId)
                              .reduce((sum, m) => sum + (m.quantity || m.Quantity || 0), 0);
                            const totalNeeded = (row.maximumProductionQuantity || 0) * (bom.requiredQuantity || 0);
                            const remaining = totalStock - totalNeeded;
                            return (
                              <span
                                key={idx}
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs shadow-sm border ${remaining < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}
                              >
                                <span className="font-bold mr-1">{remaining.toLocaleString()}</span>
                                <span className="mr-1">x</span>
                                {cat?.name || 'N/A'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )
      }

      <Modal
        isOpen={isSelectModalOpen}
        onClose={handleCloseModal}
        title="Chọn sản phẩm để tính toán định mức"
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 italic">* Chọn các sản phẩm bạn muốn kiểm tra khả năng sản xuất dựa trên tồn kho hiện tại.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-2 border rounded-md">
            {items.map(item => (
              <label key={item.value} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-200">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600"
                  checked={selectedItemIds.includes(item.value)}
                  onChange={() => handleToggleItemSelection(item.value)}
                />
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button type="button" onClick={handleCloseModal} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors text-sm">Hủy bỏ</button>
            <button onClick={handleCalculateCapacities} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm">Tải & Tính toán</button>
          </div>
        </div>
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
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />
    </div >
  );
};
