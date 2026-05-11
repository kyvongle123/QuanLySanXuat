import { useEffect, useState, useMemo } from 'react';
import { Search, FileDown, FileUp, ChevronDown } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect } from '../customComponent/customComponent';
import { getBOMs, createBOM, updateBOM, deleteBOM } from '../controller/bomController';
import { getItems } from '../controller/itemsController';
import { getMaterialCategories } from '../controller/materialCategoriesController';

export const BOM = () => {
  const [boms, setBoms] = useState([]);
  const [items, setItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openItemMenuId, setOpenItemMenuId] = useState(null);
  const [itemMenuSearchQuery, setItemMenuSearchQuery] = useState('');
  const [openMaterialMenuId, setOpenMaterialMenuId] = useState(null);
  const [materialMenuSearchQuery, setMaterialMenuSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ item: '', materialCategory: '', requiredQuantity: 0 });
  const [isModalMaximized, setIsModalMaximized] = useState(false);

  // Lắng nghe click toàn cục để đóng menu khi bấm ra ngoài
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenItemMenuId(null);
      setItemMenuSearchQuery('');
      setOpenMaterialMenuId(null);
      setMaterialMenuSearchQuery('');
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bomData, itemData, catData] = await Promise.all([
          getBOMs(),
          getItems(),
          getMaterialCategories()
        ]);
        setBoms(bomData);
        // Lấy Name từ ItemsController hiển thị lên Label của Select
        setItems(itemData.map(i => ({ value: i.id, label: i.name })));
        setMaterials(catData.map(c => ({ value: c.id, label: c.name, unit: c.unit })));

      } catch (err) {
        showNotification("Lỗi khi tải dữ liệu định mức", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return boms.filter(b => {
      const itemName = items.find(i => String(i.value) === String(b.item))?.label || '';
      const materialName = materials.find(m => String(m.value) === String(b.materialCategory))?.label || '';
      return (
        itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        materialName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [boms, searchTerm, items, materials]);

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ item: '', materialCategory: '', requiredQuantity: 0 });
    setIsModalOpen(true);
  };

  const handleEditItem = (bom) => {
    setModalMode('edit');
    setCurrentEditingItem({ ...bom });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingItem({ item: '', materialCategory: '', requiredQuantity: 0 });
    setIsModalMaximized(false);
  };

  const handleBOMMaterialChange = async (bom, newMaterialId) => {
    try {
      const payload = {
        ...bom,
        materialCategory: parseInt(newMaterialId)
      };
      const updated = await updateBOM(bom.id, payload);
      setBoms(prev => prev.map(b => b.id === updated.id ? updated : b));
      setOpenMaterialMenuId(null);
      showNotification("Cập nhật nguyên liệu thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật nguyên liệu.", "error");
    }
  };

  const handleBOMItemChange = async (bom, newItemId) => {
    try {
      const payload = {
        ...bom,
        item: parseInt(newItemId)
      };
      const updated = await updateBOM(bom.id, payload);
      setBoms(prev => prev.map(b => b.id === updated.id ? updated : b));
      setOpenItemMenuId(null);
      showNotification("Cập nhật sản phẩm thành công!");
    } catch (err) {
      showNotification("Lỗi khi cập nhật sản phẩm.", "error");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...currentEditingItem,
      item: currentEditingItem.item ? parseInt(currentEditingItem.item) : null,
      materialCategory: currentEditingItem.materialCategory ? parseInt(currentEditingItem.materialCategory) : null,
      requiredQuantity: parseFloat(currentEditingItem.requiredQuantity) || 0
    };

    try {
      if (modalMode === 'add') {
        const newItem = await createBOM(payload);
        setBoms(prev => [...prev, newItem]);
        showNotification("Thêm định mức thành công!");
      } else {
        const updated = await updateBOM(currentEditingItem.id, payload);
        setBoms(prev => prev.map(b => b.id === updated.id ? updated : b));
        showNotification("Cập nhật định mức thành công!");
      }
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
      message: 'Bạn có chắc chắn muốn xuất danh sách định mức (BOM) ra tệp Excel không?'
    });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách BOM');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Sản phẩm', key: 'item', width: 35 },
        { header: 'Nguyên liệu', key: 'material', width: 35 },
        { header: 'Số lượng định mức', key: 'quantity', width: 25 },
      ];

      filteredData.forEach((bom, index) => {
        const itemLabel = items.find(i => String(i.value) === String(bom.item))?.label || 'N/A';
        const materialObj = materials.find(m => String(m.value) === String(bom.materialCategory));
        const materialLabel = materialObj?.label || 'N/A';
        const unit = materialObj?.unit || '';

        worksheet.addRow({
          stt: index + 1,
          item: itemLabel,
          material: materialLabel,
          quantity: `${bom.requiredQuantity} ${unit}`
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
          row.height = 25;
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
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh_sach_BOM.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const handleConfirmAction = async () => {
    const { type, id } = confirmModal;
    if (type === 'delete') {
      try {
        await deleteBOM(id);
        setBoms(prev => prev.filter(b => b.id !== id));
        showNotification("Xóa định mức thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    } else if (type === 'export') {
      await handleExportExcel();
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const columns = [
    { header: 'STT', className: 'w-[30px] sm:w-[50px] !px-1 sm:!px-6 text-center', headerCellClassName: 'text-[10px] sm:text-sm', render: (row, { index }) => index },
    {
      header: <div className="flex justify-center items-center w-full text-[11px] sm:text-sm">Sản phẩm</div>,
      headerCellClassName: 'text-[10px] sm:text-sm',
      className: 'min-w-[100px] sm:min-w-[150px] !px-1 sm:!px-6 text-[11px] sm:text-sm',
      render: (row) => {
        const isOpen = openItemMenuId === row.id;
        return (
          <div className={`relative ${isOpen ? 'z-30' : 'z-10'}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (openItemMenuId !== row.id) setItemMenuSearchQuery('');
                setOpenItemMenuId(isOpen ? null : row.id);
              }}
              className="bg-gray-50 border border-gray-300 text-blue-600 text-[11px] sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none text-left relative min-h-[26px] font-bold hover:border-blue-400 transition-colors"
            >
              <span className="truncate block">
                {items.find(i => String(i.value) === String(row.item))?.label || '-- Chọn sản phẩm --'}
              </span>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </button>

            {isOpen && (
              <div className="absolute left-0 top-full mt-1 w-full min-w-[200px] bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top whitespace-normal">
                <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
                      placeholder="Tìm sản phẩm..."
                      value={itemMenuSearchQuery}
                      onChange={(e) => setItemMenuSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
                  {items.filter(i => i.label.toLowerCase().includes(itemMenuSearchQuery.toLowerCase())).map((i) => (
                    <button
                      key={i.value}
                      onClick={() => handleBOMItemChange(row, i.value)}
                      className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.item) === String(i.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className="block w-full truncate">{i.label}</span>
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
      header: 'Nguyên liệu',
      headerCellClassName: 'text-[10px] sm:text-sm',
      className: 'min-w-[100px] sm:min-w-[200px] !px-1 sm:!px-6 text-[10px] sm:text-sm',
      render: (row) => {
        const isOpen = openMaterialMenuId === row.id;
        const matObj = materials.find(m => String(m.value) === String(row.materialCategory));
        const materialLabel = matObj?.label || 'N/A';

        return (
          <div className={`relative ${isOpen ? 'z-30' : 'z-10'}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (openMaterialMenuId !== row.id) setMaterialMenuSearchQuery('');
                setOpenMaterialMenuId(isOpen ? null : row.id);
              }}
              className="w-full text-left outline-none transition-all p-0"
            >
              {/* <div className="flex items-center bg-white border border-gray-300 text-black text-sm rounded-lg p-1 pr-8 appearance-none cursor-pointer relative min-h-[28px] font-normal hover:border-blue-400 transition-colors">
                <span className="truncate flex-1">{materialLabel}</span>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown size={14} />
                </div>
              </div> */}
              {/* Giao diện trên Mobile: Thẻ xám chữ đen n x Nguyên liệu */}
              <div className="sm:hidden bg-white border border-gray-300 text-black px-2 py-1.5 rounded-lg flex items-center justify-between shadow-sm">
                <span className="truncate text-[11px] sm:text-sm">{row.requiredQuantity} x {materialLabel}</span>
                <ChevronDown size={14} className="text-gray-500 ml-1 shrink-0" />
              </div>
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full mt-1 w-full min-w-full bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top-right whitespace-normal">
                <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
                      placeholder="Tìm nguyên liệu..."
                      value={materialMenuSearchQuery}
                      onChange={(e) => setMaterialMenuSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
                  {materials.filter(m => m.label.toLowerCase().includes(materialMenuSearchQuery.toLowerCase())).map((m) => (
                    <button
                      key={m.value}
                      onClick={() => handleBOMMaterialChange(row, m.value)}
                      className={`px-2 py-1.5 text-[11px] rounded transition-colors text-left flex items-center justify-between min-w-0 group ${String(row.materialCategory) === String(m.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className="truncate flex-1">{m.label}</span>
                      <div className="hidden group-hover:flex items-center gap-2 ml-2 shrink-0 animate-in fade-in slide-in-from-right-1 duration-200">
                        <span className="text-[10px] text-gray-400 font-normal">Số lượng</span>
                        <input
                          type="number"
                          className="w-14 border border-gray-300 rounded px-1 py-0.5 text-black font-normal outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          defaultValue={row.requiredQuantity}
                          onClick={(e) => e.stopPropagation()} // Ngăn chặn việc đóng menu khi click vào input
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
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
      header: 'Số lượng định mức',
      headerCellClassName: 'hidden sm:table-cell text-[10px] sm:text-sm', // Ẩn trên mobile
      className: 'hidden sm:table-cell min-w-[150px] !px-2 sm:!px-6 text-[11px] sm:text-sm', // Ẩn trên mobile
      render: (row) => {
        const mat = materials.find(m => String(m.value) === String(row.materialCategory));
        return `${row.requiredQuantity} ${mat?.unit || ''}`;
      }
    },
    {
      header: <div className="flex justify-center items-center w-full text-[11px] sm:text-sm">Hành động</div>,
      headerCellClassName: 'text-[10px] sm:text-sm',
      className: 'text-right !px-2 sm:!px-6 w-[100px] sm:w-[150px]', // Điều chỉnh chiều rộng và padding
      render: (row) => (
        <div className="flex gap-1 sm:gap-2 justify-end"> {/* Điều chỉnh khoảng cách giữa các nút */}
          <button onClick={() => handleEditItem(row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-[10px] sm:text-sm transition-colors active:scale-95">Sửa</button> {/* Điều chỉnh cỡ chữ */}
          <button
            onClick={() => setConfirmModal({ isOpen: true, id: row.id, type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa định mức này?' })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-[10px] sm:text-sm transition-colors active:scale-95" // Điều chỉnh cỡ chữ
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 lg:p-6">
      <h2 className="text-2xl font-bold mb-4">Quản lý Định mức (BOM)</h2>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-4 gap-4">
        <div className="relative w-full lg:max-w-[300px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo sản phẩm hoặc nguyên liệu"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          {/* Nhóm nút Excel để hiển thị cùng dòng trên Mobile */}
          <div className="flex flex-row gap-2 w-full sm:w-auto">
            <button className="flex-1 justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2 text-sm">
              <FileUp size={18} />
              Nhập Excel
            </button>
            <button onClick={handleRequestExportExcel} className="flex-1 justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors text-sm">
              <FileDown size={18} />
              Xuất Excel
            </button>
          </div>
          {/* Nút thêm mới sẽ nằm ở dòng riêng trên mobile, full width */}
          <button onClick={handleAddItem} className="w-full sm:w-auto justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors text-sm">
            Thêm định mức mới
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-4 text-gray-600 italic">Đang tải dữ liệu định mức...</p>
      ) : (
        <CustomDatatable
          columns={columns}
          data={filteredData}
          bodyCellClassName="!py-2 lg:!py-3"
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thiết lập định mức mới' : 'Chỉnh sửa định mức'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <CustomSelect label="Sản phẩm áp dụng (Thành phẩm)" options={items} value={currentEditingItem?.item || ''} onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, item: e.target.value })} />
          <CustomSelect label="Nguyên vật liệu" options={materials} value={currentEditingItem?.materialCategory || ''} onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, materialCategory: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700">Số lượng (Định mức)</label>
            <input type="number" step="0.01" value={currentEditingItem?.requiredQuantity || ''} onChange={(e) => setCurrentEditingItem({ ...currentEditingItem, requiredQuantity: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu</button>
          </div>
        </form>
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
    </div>
  );
};