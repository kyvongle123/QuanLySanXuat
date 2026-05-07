import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus, ChevronDown, FileDown } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, Modal, CustomSelect, AppNotification, CustomConfirm } from '../customComponent/customComponent';
import { 
  getProductionSections, 
  deleteProductionSection, 
  createProductionSection, 
  updateProductionSection 
} from '../controller/productionSectionsController';
import { getUsers } from '../controller/usersController';

export const ProductionSections = () => {
  const [sections, setSections] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' hoặc 'edit'
  const [currentEditingSection, setCurrentEditingSection] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownSearch, setDropdownSearch] = useState('');

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách tổ sản xuất ra tệp Excel không?'
    });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách tổ sản xuất');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Mã tổ', key: 'productionSectionCode', width: 20 },
        { header: 'Tên tổ', key: 'name', width: 30 },
        { header: 'Tổ trưởng', key: 'leader', width: 25 },
        { header: 'Chi phí cơ bản (VNĐ)', key: 'baseUnitCost', width: 25 },
      ];

      filteredSections.forEach((section, index) => {
        const leader = users.find(u => String(u.id || u.ID) === String(section.leader));
        worksheet.addRow({
          stt: index + 1,
          productionSectionCode: section.productionSectionCode,
          name: section.name,
          leader: leader ? leader.name : 'Chưa phân công',
          baseUnitCost: section.baseUnitCost,
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
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          if (colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
          if (colNumber === 5 && rowNumber > 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '#,##0 "VNĐ"';
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách tổ sản xuất.xlsx`);
      showNotification("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Export Excel Error:", err);
      showNotification("Lỗi khi xuất file Excel.", "error");
    }
  };

  const handleConfirmAction = async () => {
    if (confirmModal.type === 'delete') {
      await handleConfirmDelete();
    } else if (confirmModal.type === 'export') {
      await handleExportExcel();
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  // Thêm logic lắng nghe click toàn cục để đóng dropdown khi bấm ra ngoài bất cứ đâu
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenDropdownId(null);
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // Reset tìm kiếm khi đóng hoặc chuyển đổi dropdown
  useEffect(() => {
    setDropdownSearch('');
  }, [openDropdownId]);

  // State cho thông báo và xác nhận
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  // Logic lọc dữ liệu theo từ khóa tìm kiếm
  const filteredSections = useMemo(() => {
    return sections.filter(section => {
      return (
        section.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.productionSectionCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [sections, searchTerm]);

  // Tải dữ liệu khi component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sectionsData, usersData] = await Promise.all([
        getProductionSections(),
        getUsers()
      ]);
      setSections(sectionsData);
      setUsers(usersData);
    } catch (err) {
      showNotification("Không thể tải danh sách tổ sản xuất.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      id: id,
      type: 'delete',
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa tổ sản xuất này không?'
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteProductionSection(confirmModal.id);
      setSections(prev => prev.filter(s => (s.id || s.ID) !== confirmModal.id));
      showNotification("Xóa tổ sản xuất thành công!");
    } catch (err) {
      showNotification("Có lỗi xảy ra khi xóa.", "error");
    }
  };

  const handleEdit = (section) => {
    setModalMode('edit');
    setCurrentEditingSection(section);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setModalMode('add');
    setCurrentEditingSection({ 
      productionSectionCode: '', 
      name: '', 
      leader: '', 
      baseUnitCost: 0 
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditingSection(null);
    setIsMaximized(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingSection(prev => ({ ...prev, [name]: value }));
  };

  const handleLeaderChange = async (section, newLeaderId) => {
    try {
      const id = section.id || section.ID;
      const payload = { 
        ...section, 
        leader: newLeaderId || null 
      };
      const updatedItem = await updateProductionSection(id, payload);
      setSections(prev => prev.map(s => (s.id || s.ID) === id ? updatedItem : s));
      showNotification("Cập nhật tổ trưởng thành công!");
    } catch (err) {
      showNotification("Có lỗi xảy ra khi cập nhật tổ trưởng.", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const newItem = await createProductionSection(currentEditingSection);
        setSections(prev => [...prev, newItem]);
        showNotification("Thêm tổ mới thành công!");
      } else {
        const id = currentEditingSection.id || currentEditingSection.ID;
        const updatedItem = await updateProductionSection(id, currentEditingSection);
        setSections(prev => prev.map(s => (s.id || s.ID) === (updatedItem.id || updatedItem.ID) ? updatedItem : s));
        showNotification("Cập nhật thành công!");
      }
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu. Vui lòng kiểm tra lại.", "error");
    }
  };

  const columns = [
    { header: 'STT', render: (row, { index }) => index },
    { header: 'Mã tổ', accessor: 'productionSectionCode' },
    { header: 'Tên tổ', accessor: 'name' },
    { 
      header: 'Tổ trưởng',
      className: 'min-w-[200px]',
      render: (row) => {
        const rowId = row.id || row.ID;
        const isOpen = openDropdownId === rowId;
        const currentLeader = users.find(u => String(u.id || u.ID) === String(row.leader));
        
        const filteredUsersForDropdown = users.filter(u => 
          u.name?.toLowerCase().includes(dropdownSearch.toLowerCase())
        );

        return (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdownId(isOpen ? null : rowId);
              }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 block w-full p-1 px-2.5 text-left focus:outline-none transition-all cursor-pointer flex justify-between items-center"
            >
              <span className="truncate">{currentLeader ? currentLeader.name : '-- Chưa phân công --'}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div onClick={(e) => e.stopPropagation()}>
                {/* Menu Dropdown - Thêm stopPropagation để click bên trong menu không làm đóng dropdown */}
                <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl z-20 overflow-hidden anim-fade-down">
                  {/* Ô tìm kiếm nhân viên */}
                  <div className="p-1.5 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                      <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm nhân viên..."
                        className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        value={dropdownSearch}
                        onChange={(e) => setDropdownSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Ngăn việc đóng dropdown khi click vào ô input
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-[140px] overflow-y-auto">
                    {filteredUsersForDropdown.length > 0 ? (
                      filteredUsersForDropdown.map((u) => (
                        <div
                          key={u.id || u.ID}
                          onClick={() => { handleLeaderChange(row, u.id || u.ID); setOpenDropdownId(null); }}
                          className={`px-3 py-1 text-sm hover:bg-blue-600 hover:text-white cursor-pointer transition-colors ${String(row.leader) === String(u.id || u.ID) ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                        >
                          {u.name}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-400 italic text-center">Không tìm thấy kết quả</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
    },
    { 
      header: 'Chi phí cơ bản', 
      accessor: 'baseUnitCost',
      render: (row) => row.baseUnitCost?.toLocaleString() + ' VNĐ'
    },
    {
      header: 'Hành động',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm">Sửa</button>
          <button onClick={() => handleDelete(row.id || row.ID)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm">Xóa</button>
        </div>
      ),
    },
  ];

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="productionSectionCode" className="block text-sm font-medium text-gray-700">Mã tổ sản xuất</label>
        <input
          type="text"
          id="productionSectionCode"
          name="productionSectionCode"
          value={currentEditingSection?.productionSectionCode || ''}
          onChange={handleInputChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên tổ sản xuất</label>
        <input
          type="text"
          id="name"
          name="name"
          value={currentEditingSection?.name || ''}
          onChange={handleInputChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <CustomSelect
          label="Tổ trưởng"
          name="leader"
          value={currentEditingSection?.leader || ''}
          onChange={handleInputChange}
          options={[
            { value: '', label: '-- Chọn tổ trưởng --' },
            ...users.map(u => ({ value: u.id, label: u.name }))
          ]}
        />
        <div>
          <label htmlFor="baseUnitCost" className="block text-sm font-medium text-gray-700">Chi phí cơ bản (VNĐ)</label>
          <input
            type="number"
            id="baseUnitCost"
            name="baseUnitCost"
            value={currentEditingSection?.baseUnitCost || 0}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
        <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors">Lưu</button>
      </div>
    </form>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Danh sách tổ sản xuất</h2>

      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative w-full max-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mô tả"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRequestExportExcel} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors"
          >
            <FileDown size={18} />
            Xuất Excel
          </button>
          <button 
            onClick={handleAdd} 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded whitespace-nowrap flex items-center gap-2 transition-colors"
          >
            Thêm tổ sản xuất mới
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-600 p-4">Đang tải dữ liệu...</p>}
      {error && <p className="text-red-600 p-4">Lỗi: {error}</p>}
      {!loading && !error && <CustomDatatable columns={columns} data={filteredSections} />}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm tổ sản xuất mới' : 'Chỉnh sửa tổ sản xuất'}
        isMaximized={isMaximized}
        onMaximizeToggle={() => setIsMaximized(!isMaximized)}
        maxWidth="max-w-xl"
      >
        {formContent}
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