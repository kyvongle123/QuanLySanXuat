import { useEffect, useState, useMemo } from 'react';
import { Search, FileDown, FileUp } from 'lucide-react';
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ item: '', materialCategory: '', requiredQuantity: 0 });
  const [isModalMaximized, setIsModalMaximized] = useState(false);

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
    { header: 'STT', render: (row, { index }) => index },
    {
      header: 'Sản phẩm',
      render: (row) => items.find(i => String(i.value) === String(row.item))?.label || 'N/A'
    },
    {
      header: 'Nguyên liệu',
      render: (row) => materials.find(m => String(m.value) === String(row.materialCategory))?.label || 'N/A'
    },
    {
      header: 'Số lượng định mức',
      className: 'min-w-[400px]', // Tăng chiều rộng tối thiểu để chiếm không gian
      render: (row) => {
        const mat = materials.find(m => String(m.value) === String(row.materialCategory));
        return `${row.requiredQuantity} ${mat?.unit || ''}`;
      }
    },
    {
      header: 'Hành động',
      className: 'text-right w-1 whitespace-nowrap !pr-6', // Thu nhỏ cột về kích thước nội dung và đẩy sát lề
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleEditItem(row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors">Sửa</button>
          <button
            onClick={() => setConfirmModal({ isOpen: true, id: row.id, type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa định mức này?' })}
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
      <h2 className="text-2xl font-bold mb-4">Quản lý Định mức (BOM)</h2>

      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-[300px]">
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

        <div className="flex gap-2">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors flex items-center gap-2">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button onClick={handleRequestExportExcel} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors">
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button onClick={handleAddItem} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap transition-colors">
            Thêm định mức mới
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-4 text-gray-600 italic">Đang tải dữ liệu định mức...</p>
      ) : (
        <CustomDatatable columns={columns} data={filteredData} />
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