import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus, FileDown } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect } from '../customComponent/customComponent';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../controller/materialsController';
import { getMaterialCategories } from '../controller/materialCategoriesController';

export const Material = () => {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({ name: '', materialCategory: '', quantity: 0, unit: '', location: '' });
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [importingStates, setImportingStates] = useState({}); // { [materialId]: quantityString }

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [materialData, catData] = await Promise.all([
          getMaterials(),
          getMaterialCategories(),
        ]);
        setMaterials(materialData);
        setCategories(catData.map(c => ({ value: c.id, label: c.name, unit: c.unit })));
      } catch (err) {
        showNotification("Lỗi khi tải dữ liệu", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return materials.filter(m => {
      const catLabel = categories.find(c => String(c.value) === String(m.name))?.label || '';
      return (
        catLabel.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [materials, searchTerm, categories]);

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({ name: '', quantity: 0, unit: '', location: '' });
    setIsModalOpen(true);
    setImportingStates({}); // Thoát tất cả chế độ nhập hàng khi mở modal
  };

  const handleEditItem = (material) => {
    setModalMode('edit');
    setCurrentEditingItem({ ...material });
    setIsModalOpen(true);
    setImportingStates({}); // Thoát tất cả chế độ nhập hàng khi mở modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...currentEditingItem,
      name: currentEditingItem.name ? parseInt(currentEditingItem.name) : null,
      quantity: parseInt(currentEditingItem.quantity) || 0,
      location: currentEditingItem.location ? parseInt(currentEditingItem.location) : ''
    };

    try {
      if (modalMode === 'add') {
        const newItem = await createMaterial(payload);
        setMaterials(prev => [...prev, newItem]);
        showNotification("Thêm nguyên liệu thành công!");
      } else {
        const updated = await updateMaterial(currentEditingItem.id, payload);
        setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
        showNotification("Cập nhật nguyên liệu thành công!");
      }
      handleCloseModal();
    } catch (err) {
      showNotification("Có lỗi xảy ra khi lưu dữ liệu.", "error");
    }
  };

  const handleStartImport = (material) => {
    // Thêm ID của nguyên liệu vào object trạng thái nhập, giữ nguyên các dòng khác đang mở
    setImportingStates(prev => ({ ...prev, [material.id]: '' }));
  };

  const handleCancelImport = (id) => {
    // Chỉ xóa trạng thái nhập của dòng cụ thể
    setImportingStates(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const handleUpdateImport = async (material) => {
    const qtyString = importingStates[material.id];
    if (!qtyString || isNaN(parseFloat(qtyString)) || parseFloat(qtyString) <= 0) {
      showNotification("Vui lòng nhập số lượng hợp lệ để nhập hàng.", "error");
      return;
    }

    const quantityToAdd = parseFloat(qtyString);
    const newTotalQuantity = material.quantity + quantityToAdd;

    const payload = { ...material, quantity: newTotalQuantity };

    try {
      const updated = await updateMaterial(material.id, payload);
      setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
      showNotification("Nhập nguyên liệu thành công!", "success");
      handleCancelImport(material.id); // Chỉ thoát chế độ nhập cho dòng vừa cập nhật
    } catch (err) {
      showNotification("Lỗi khi cập nhật số lượng nguyên liệu.", "error");
    }
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách nguyên liệu ra tệp Excel không?'
    });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách nguyên liệu');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Tên nguyên liệu', key: 'name', width: 30 },
        { header: 'Vị trí', key: 'location', width: 45 },
        { header: 'Số lượng', key: 'quantity', width: 15 },
        { header: 'Đơn vị', key: 'unit', width: 10 },
      ];

      filteredData.forEach((material, index) => {
        const categoryLabel = categories.find(c => String(c.value) === String(material.name))?.label || 'N/A';

        worksheet.addRow({
          stt: index + 1,
          name: categoryLabel, // Tên nguyên liệu thực chất là tên danh mục
          category: categories.find(c => String(c.value) === String(material.materialCategory))?.label || 'N/A',
          location: "",
          quantity: material.quantity,
          unit: material.unit,
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        
        // Chiều cao dòng: Header 30px, Body 25px
        if (rowNumber === 1) {
          row.height = 30;
        } else {
          // Đặt height là undefined để Excel tự động mở rộng chiều cao dòng khi văn bản (Vị trí) bị xuống dòng
          row.height = undefined;
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
      saveAs(new Blob([buffer]), `Danh sách nguyên liệu.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  // Cập nhật handleConfirmAction để xử lý cả export
  const handleConfirmAction = async () => {
    if (confirmModal.type === 'export') {
      await handleExportExcel();
    } else if (confirmModal.type === 'delete') {
      try {
        await deleteMaterial(confirmModal.id);
        setMaterials(prev => prev.filter(m => m.id !== confirmModal.id));
        showNotification("Xóa nguyên liệu thành công!", "success");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const columns = [
    { header: 'STT', render: (row, { index }) => index },
    { 
      header: 'Tên nguyên liệu', 
      accessor: 'name',
      render: (row) => categories.find(c => String(c.value) === String(row.name))?.label || 'N/A'
    },
    { 
      header: 'Số lượng', 
      accessor: 'quantity',
      className: 'min-w-[300px]',
      render: (row) => (
        <div className="flex items-center gap-1">
          <span className="font-bold text-orange-600">{row.quantity?.toLocaleString()} {row.unit}</span>
          {importingStates[row.id] !== undefined && ( // Kiểm tra nếu dòng này đang ở chế độ nhập hàng
            <>
              <span className="text-gray-500">+</span>
              <input
                type="number"
                step="any" // Cho phép số thập phân
                value={importingStates[row.id]} // Lấy số lượng từ state của dòng này
                onChange={(e) => setImportingStates(prev => ({
                  ...prev,
                  [row.id]: e.target.value // Cập nhật số lượng cho dòng này
                }))}
                className="w-24 border border-gray-300 rounded-md shadow-sm p-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="SL thêm"
              />
            </>
          )}
        </div>
      )
    },
    {
      header: 'Hành động',
      className: 'text-right whitespace-nowrap w-[250px]', // Tăng chiều rộng để chứa nút mới
      render: (row) => (
        <div className="flex gap-2 justify-end items-center">
          {importingStates[row.id] !== undefined ? ( // Kiểm tra nếu dòng này đang ở chế độ nhập hàng
            <>
              <button onClick={() => handleUpdateImport(row)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors">Cập nhật</button>
              <button onClick={() => handleCancelImport(row.id)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors">Hủy</button>
            </>
          ) : (
            <>
              <button onClick={() => handleEditItem(row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors">Sửa</button>
              <button 
                onClick={() => setConfirmModal({ isOpen: true, id: row.id, type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa nguyên liệu này?' })} 
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm transition-colors"
              >
                Xóa
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Danh sách nguyên liệu</h2>
      
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc vị trí"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
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
            Thêm nguyên liệu
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-4 text-gray-600 italic">Đang tải dữ liệu...</p>
      ) : (
        <CustomDatatable columns={columns} data={filteredData} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm nguyên liệu mới' : 'Cập nhật nguyên liệu'}
        // currentEditingItem được reset trong handleCloseModal của Modal component
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <CustomSelect 
            label="Tên nguyên liệu" 
            options={categories} 
            value={currentEditingItem?.name || ''} 
            onChange={(e) => {
              const categoryId = e.target.value;
              const selectedCat = categories.find(c => String(c.value) === String(categoryId));
              setCurrentEditingItem({
                ...currentEditingItem, 
                name: categoryId,
                unit: selectedCat ? selectedCat.unit : ''
              });
            }} 
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Số lượng</label>
              <input type="number" value={currentEditingItem?.quantity || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, quantity: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Đơn vị tính</label>
              <input type="text" value={currentEditingItem?.unit || ''} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 outline-none bg-gray-100 text-gray-500 cursor-not-allowed" placeholder="Đơn vị..." />
            </div>
          </div>
          <CustomSelect label="Vị trí kho" options={[]} value={currentEditingItem?.location || ''} onChange={(e) => setCurrentEditingItem({...currentEditingItem, location: e.target.value})} />
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
