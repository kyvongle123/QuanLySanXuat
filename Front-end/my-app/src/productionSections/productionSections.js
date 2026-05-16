import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus, ChevronDown, FileDown, FileUp } from 'lucide-react';
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
  const [errors, setErrors] = useState({});

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
        { header: 'Mã tổ', key: 'productionSectionCode', width: 10 },
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
    setErrors({}); // Reset errors when modal is closed
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditingSection(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' })); // Clear error for this field
    }
  };

  const handleLeaderChange = async (section, newLeaderId) => {
    try {
      const id = section.id || section.ID;
      // Clear leader error if it exists
      if (errors.leader) {
        setErrors(prev => ({ ...prev, leader: '' }));
      }

      // Check if newLeaderId is valid (not empty string)
      if (newLeaderId === '') {
        // If leader is set to empty, ensure it's null in payload
        const payload = {
          ...section,
          leader: null
        };
        const updatedItem = await updateProductionSection(id, payload);
        setSections(prev => prev.map(s => (s.id || s.ID) === id ? updatedItem : s));
        showNotification("Cập nhật tổ trưởng thành công!");
        return;
      }

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

    const newErrors = {};
    if (!currentEditingSection?.productionSectionCode?.trim()) {
      newErrors.productionSectionCode = "Bắt buộc nhập Mã tổ sản xuất";
    }
    if (!currentEditingSection?.name?.trim()) {
      newErrors.name = "Bắt buộc nhập Tên tổ sản xuất";
    }
    if (!currentEditingSection?.leader) {
      newErrors.leader = "Bắt buộc chọn Tổ trưởng";
    }
    if (currentEditingSection?.baseUnitCost === null || currentEditingSection?.baseUnitCost === undefined || currentEditingSection?.baseUnitCost <= 0) {
      newErrors.baseUnitCost = "Bắt buộc nhập Chi phí cơ bản";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({}); // Clear all errors if validation passes
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
    { header: 'STT', className: 'w-[50px] text-center !px-1 sm:!px-4', render: (row, { index }) => index },
    { header: 'Mã tổ', accessor: 'productionSectionCode', className: 'font-medium text-blue-600 min-w-[120px] hidden sm:table-cell' },
    { header: 'Tên tổ', accessor: 'name', className: 'min-w-[150px] !px-1 sm:!px-4' },
    {
      header: 'Tổ trưởng',
      className: 'hidden md:table-cell min-w-[200px]', // Hide on small screens
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
      header: 'Chi phí cơ bản (VNĐ)',
      accessor: 'baseUnitCost',
      className: 'hidden lg:table-cell text-right', // Hide on smaller screens
      render: (row) => row.baseUnitCost?.toLocaleString() + ' VNĐ'
    },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-5 w-[120px] sm:w-[160px]',
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          <button onClick={() => handleEdit(row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 !px-2 sm:px-3 rounded text-xs transition-all active:scale-95">Sửa</button>
          <button onClick={() => handleDelete(row.id || row.ID)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 !px-2 sm:px-3 rounded text-xs transition-all active:scale-95">Xóa</button>
        </div>
      ),
    },
  ];

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1"> {/* Mã tổ sản xuất */}
        <label htmlFor="productionSectionCode" className={`text-xs ml-1 ${errors.productionSectionCode ? 'text-red-500' : 'text-gray-500'}`}>Mã tổ sản xuất <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="productionSectionCode"
          name="productionSectionCode"
          value={currentEditingSection?.productionSectionCode || ''}
          onChange={(e) => {
            handleInputChange(e);
            if (errors.productionSectionCode) setErrors(prev => ({ ...prev, productionSectionCode: '' }));
          }}
          className={`mt-1 block w-full border ${errors.productionSectionCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm p-2.5 focus:border-blue-500 outline-none transition-all text-sm`}
        />
        {errors.productionSectionCode && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.productionSectionCode}</p>}
      </div>
      <div className="flex flex-col gap-1"> {/* Tên tổ sản xuất */}
        <label htmlFor="name" className={`text-xs ml-1 ${errors.name ? 'text-red-500' : 'text-gray-500'}`}>Tên tổ sản xuất <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="name"
          name="name"
          value={currentEditingSection?.name || ''}
          onChange={(e) => {
            handleInputChange(e);
            if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
          }}
          className={`mt-1 block w-full border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm p-2.5 focus:border-blue-500 outline-none transition-all text-sm`}
        />
        {errors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.name}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Tổ trưởng & Chi phí cơ bản */}
        <CustomSelect
          label="Tổ trưởng"
          name="leader"
          value={currentEditingSection?.leader || ''}
          onChange={(e) => {
            handleInputChange(e);
            if (errors.leader) setErrors(prev => ({ ...prev, leader: '' }));
          }}
          options={[
            { value: '', label: '-- Chọn tổ trưởng --' },
            ...users.map(u => ({ value: u.id, label: u.name }))
          ]}
          isModalMaximized={isMaximized}
          error={!!errors.leader}
          errorMessage={errors.leader}
        />
        <div className="flex flex-col gap-1"> {/* Chi phí cơ bản */}
          <label htmlFor="baseUnitCost" className={`text-xs ml-1 ${errors.baseUnitCost ? 'text-red-500' : 'text-gray-500'}`}>Chi phí cơ bản (VNĐ)</label>
          <input
            type="number"
            id="baseUnitCost"
            name="baseUnitCost"
            value={currentEditingSection?.baseUnitCost || 0}
            onChange={(e) => {
              handleInputChange(e);
              if (errors.baseUnitCost) setErrors(prev => ({ ...prev, baseUnitCost: '' }));
            }}
            className={`mt-1 block w-full border ${errors.baseUnitCost ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg shadow-sm p-2.5 focus:border-blue-500 outline-none transition-all text-sm`}
          />
          {errors.baseUnitCost && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.baseUnitCost}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
        <button type="button" onClick={handleCloseModal} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors text-sm">Hủy bỏ</button>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm">Lưu thông tin</button>
      </div>
    </form>
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50/50 min-h-screen">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 tracking-tight">Danh sách tổ sản xuất</h2>

      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full lg:max-w-[350px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên tổ..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white focus:ring-2 focus:ring-blue-500 shadow-sm outline-none transition-all sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm">
            <FileUp size={18} />
            Nhập Excel
          </button>
          <button
            onClick={handleRequestExportExcel}
            className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg whitespace-nowrap transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm"
          >
            <FileDown size={18} /> Xuất Excel
          </button>
          <button
            onClick={handleAdd}
            className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg whitespace-nowrap transition-all active:scale-95 shadow-md text-sm"
          >
            + Thêm mới
          </button>
        </div>
      </div>

      {
        loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="italic text-sm">Đang tải dữ liệu tổ sản xuất...</p>
          </div>
        ) : null
      }
      {error && <p className="text-red-600 p-4">Lỗi: {error}</p>}
      {
        !loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <CustomDatatable
              columns={columns}
              data={filteredSections}
              renderExpansion={(row) => {
                const leader = users.find(u => String(u.id || u.ID) === String(row.leader));
                return (
                  <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100 relative animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div className="flex flex-col gap-1 md:hidden"> {/* Show leader on mobile if hidden in main table */}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổ trưởng</span>
                        <span className="text-gray-900 font-medium">{leader ? leader.name : 'Chưa phân công'}</span>
                      </div>
                      <div className="flex flex-col gap-1 lg:hidden"> {/* Show baseUnitCost on mobile if hidden in main table */}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chi phí cơ bản (VNĐ)</span>
                        <span className="text-gray-900 font-medium">{row.baseUnitCost?.toLocaleString() + ' VNĐ' || '---'}</span>
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
    </div >
  );
};