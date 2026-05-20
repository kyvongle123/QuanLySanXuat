import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, FileDown, ChevronDown, FileUp, ChevronRight } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CustomDatatable, AppNotification, CustomConfirm, Modal, CustomSelect } from '../customComponent/customComponent';
import { getStages, createStage, updateStage, deleteStage } from '../controller/stagesController';
import {
  getProductionSections,
  createProductionSection,
  updateProductionSection,
  deleteProductionSection
} from '../controller/productionSectionsController';

export const Stages = () => {
  const [stages, setStages] = useState([]);
  // Quản lý danh sách Tổ sản xuất và trạng thái Modal
  const [productionSections, setProductionSections] = useState([]);
  const [isSectionMgmtModalOpen, setIsSectionMgmtModalOpen] = useState(false);
  const [sectionSearch, setSectionSearch] = useState('');
  const [sectionForm, setSectionForm] = useState({ id: null, name: '' });
  const [isSectionMgmtMaximized, setIsSectionMgmtMaximized] = useState(false);
  const [sectionErrors, setSectionErrors] = useState({});
  const [isSectionEditModalOpen, setIsSectionEditModalOpen] = useState(false);
  const [sectionConfirmModal, setSectionConfirmModal] = useState({ isOpen: false, id: null });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEditingItem, setCurrentEditingItem] = useState({
    stageCode: '',
    name: '',
    sequence: 0,
    productionSection: ''
  });
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [errors, setErrors] = useState({});

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null, title: '', message: '' });

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [openDropdownAnchorKey, setOpenDropdownAnchorKey] = useState(null);
  const [dropdownRect, setDropdownRect] = useState(null);
  const dropdownAnchorRefs = useRef({});
  const [dropdownSearch, setDropdownSearch] = useState('');

  // Lắng nghe click toàn cục để đóng dropdown
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenDropdownId(null);
      setOpenDropdownAnchorKey(null);
      setDropdownRect(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    setDropdownSearch('');
  }, [openDropdownId]);

  useEffect(() => {
    if (!openDropdownId || !openDropdownAnchorKey) return;

    const updateDropdownRect = () => {
      const anchor = dropdownAnchorRefs.current[openDropdownAnchorKey];
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setDropdownRect({
        left: rect.left,
        top: rect.bottom + 4,
        width: Math.max(rect.width, 200),
      });
    };

    updateDropdownRect();
    window.addEventListener('resize', updateDropdownRect);
    window.addEventListener('scroll', updateDropdownRect, true);

    return () => {
      window.removeEventListener('resize', updateDropdownRect);
      window.removeEventListener('scroll', updateDropdownRect, true);
    };
  }, [openDropdownId, openDropdownAnchorKey]);

  const showNotification = (message, type = 'success') => {
    setNotification({ isOpen: true, message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stageData, sectionData] = await Promise.all([
        getStages(),
        getProductionSections()
      ]);
      // Đảm bảo dữ liệu có trường id nhất quán (hỗ trợ cả id và ID từ backend)
      setStages(stageData.map(s => ({ ...s, id: s.id || s.ID })));
      // Chuyển đổi đồng nhất dữ liệu tổ sản xuất
      setProductionSections(sectionData.map(s => ({
        value: s.id || s.ID,
        label: s.name || s.Name
      })));
    } catch (err) {
      showNotification("Lỗi khi tải dữ liệu danh sách công đoạn", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const data = await getProductionSections();
      // Chuyển đổi dữ liệu về dạng { value, label } cho Select
      setProductionSections(data.map(s => ({
        value: s.id || s.ID,
        label: s.name || s.Name
      })));
    } catch (err) {
      showNotification("Lỗi khi tải danh sách tổ sản xuất", "error");
    }
  };

  const handleSaveSection = async () => {
    if (!sectionForm.name?.trim()) {
      setSectionErrors({ name: "Bắt buộc nhập Tên tổ sản xuất" });
      return;
    }
    setSectionErrors({});

    try {
      if (sectionForm.id) {
        await updateProductionSection(sectionForm.id, { ID: sectionForm.id, Name: sectionForm.name });
        showNotification("Cập nhật tổ sản xuất thành công");
      } else {
        await createProductionSection({ Name: sectionForm.name });
        showNotification("Thêm tổ sản xuất mới thành công");
      }
      setSectionForm({ id: null, name: '' });
      fetchSections(); // Tải lại danh sách
      handleCloseSectionEditModal();
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu tổ sản xuất.", "error");
    }
  };

  const filteredSectionsForMgmt = useMemo(() => {
    return productionSections.filter(s =>
      (s.label || "").toLowerCase().includes(sectionSearch.toLowerCase())
    );
  }, [productionSections, sectionSearch]);

  const handleOpenSectionEdit = (mode, section = null) => {
    setSectionErrors({});
    if (mode === 'add') {
      setSectionForm({ id: null, name: '' });
    } else {
      setSectionForm({ id: section.value, name: section.label });
    }
    setIsSectionEditModalOpen(true);
  };

  const handleCloseSectionEditModal = () => {
    setIsSectionEditModalOpen(false);
    setSectionErrors({});
  };

  const sectionColumns = [
    { header: 'STT', render: (_, { index }) => index },
    { header: 'Tên Tổ sản xuất', render: (row) => <span className="font-bold text-blue-600">{row.label}</span> },
    {
      header: 'Hành động',
      className: 'text-right pr-5',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => handleOpenSectionEdit('edit', row)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors">Sửa</button>
          <button
            onClick={() => setSectionConfirmModal({ isOpen: true, id: row.value })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs transition-colors"
          >
            Xóa
          </button>
        </div>
      )
    }
  ];

  const handleDeleteSection = async () => {
    try {
      await deleteProductionSection(sectionConfirmModal.id);
      showNotification("Xóa tổ sản xuất thành công!");
      fetchSections();
      setSectionConfirmModal({ isOpen: false, id: null });
    } catch (err) {
      showNotification("Lỗi: Tổ sản xuất có thể đang được sử dụng.", "error");
    }
  };

  useEffect(() => {
    fetchData();
    fetchSections();
  }, []);



  const filteredData = useMemo(() => {
    const filtered = stages.filter(s => {
      return (
        (s.name || s.Name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.stageCode || s.StageCode || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Sắp xếp dữ liệu theo Mã công đoạn (StageCode)
    return [...filtered].sort((a, b) => {
      const codeA = (a.stageCode || a.StageCode || "").toString();
      const codeB = (b.stageCode || b.StageCode || "").toString();
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [stages, searchTerm]);

  const handleAddItem = () => {
    setModalMode('add');
    setCurrentEditingItem({
      stageCode: '', name: '', sequence: 0, productionSection: ''
    });
    setIsModalOpen(true);
  };

  const handleEditItem = (stage) => {
    setModalMode('edit');
    setCurrentEditingItem({
      ...stage,
      stageCode: stage.stageCode || stage.StageCode || '',
      name: stage.name || stage.Name || '',
      sequence: stage.sequence || stage.Sequence || 0,
      productionSection: stage.productionSection || stage.ProductionSection || ''
    });
    setIsModalOpen(true);
  };

  const handleSectionChange = async (stage, newSectionId) => {
    try {
      const payload = {
        ID: stage.id || 0,
        StageCode: stage.stageCode || stage.StageCode,
        Name: stage.name || stage.Name,
        Sequence: parseInt(stage.sequence || stage.Sequence),
        ProductionSection: newSectionId || null
      };

      await updateStage(stage.id, payload);
      setStages(prev => prev.map(s => (s.id || s.ID) === stage.id ? { ...s, productionSection: newSectionId, ProductionSection: newSectionId } : s));
      setOpenDropdownId(null);
      setOpenDropdownAnchorKey(null);
      setDropdownRect(null);
      showNotification("Cập nhật tổ sản xuất thành công!");
    } catch (err) {
      console.error(err);
      showNotification("Lỗi khi cập nhật tổ sản xuất.", "error");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalMaximized(false);
    setErrors({});
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    // Logic xác thực dữ liệu
    const newErrors = {};
    if (!currentEditingItem?.stageCode?.trim()) newErrors.stageCode = "Bắt buộc nhập Mã công đoạn";
    if (!currentEditingItem?.name?.trim()) newErrors.name = "Bắt buộc nhập Tên công đoạn";
    if (currentEditingItem?.sequence === '' || currentEditingItem?.sequence === null || currentEditingItem?.sequence === undefined || currentEditingItem?.sequence <= 0) {
      newErrors.sequence = "Bắt buộc nhập Thứ tự";
    }
    if (!currentEditingItem?.productionSection) newErrors.productionSection = "Bắt buộc nhập Tổ sản xuất";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const payload = {
      ID: currentEditingItem.id || 0,
      StageCode: currentEditingItem.stageCode,
      Name: currentEditingItem.name,
      Sequence: parseInt(currentEditingItem.sequence),
      ProductionSection: currentEditingItem.productionSection
    };

    try {
      if (modalMode === 'add') {
        await createStage(payload);
        showNotification("Thêm công đoạn thành công!");
      } else {
        await updateStage(currentEditingItem.id, payload);
        showNotification("Cập nhật công đoạn thành công!");
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      showNotification("Lỗi khi lưu dữ liệu công đoạn.", "error");
    }
  };

  const handleRequestExportExcel = () => {
    setConfirmModal({
      isOpen: true,
      type: 'export',
      title: 'Xác nhận xuất Excel',
      message: 'Bạn có chắc chắn muốn xuất danh sách công đoạn ra tệp Excel không?'
    });
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách công đoạn');
      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 10 },
        { header: 'Tổ sản xuất', key: 'section', width: 25 },
        { header: 'Mã công đoạn', key: 'stageCode', width: 20 },
        { header: 'Tên công đoạn', key: 'name', width: 40 },
        { header: 'Thứ tự', key: 'sequence', width: 10 },
      ];
      console.log("filteredData la", filteredData);
      filteredData.forEach((item, index) => {
        const section = productionSections.find(s => String(s.value) === String(item.productionSection || item.ProductionSection));
        worksheet.addRow({
          stt: index + 1,
          stageCode: item.stageCode || item.StageCode,
          name: item.name || item.Name,
          sequence: item.sequence || item.Sequence,
          section: section ? section.label : 'Chưa phân công'
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        // Thiết lập font và căn chỉnh mặc định cho tất cả các hàng
        row.font = { name: 'Times New Roman', size: 12 };
        row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        // Định dạng cho hàng tiêu đề (header)
        if (rowNumber === 1) {
          row.height = 30; // Chiều cao 30px cho header
          row.font = { name: 'Times New Roman', size: 12, bold: true }; // Header in đậm
          row.alignment = { vertical: 'middle', horizontal: 'center' }; // Header căn giữa
        } else {
          row.height = 25; // Chiều cao 25px cho các ô body
        }

        // Định dạng cho từng ô
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          // Viền cho tất cả các ô
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          // Căn giữa cho cột STT (colNumber === 1)
          if (colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Danh sách công đoạn.xlsx`);
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
        await deleteStage(confirmModal.id);
        setStages(prev => prev.filter(s => s.id !== confirmModal.id));
        showNotification("Xóa công đoạn thành công!");
      } catch (err) {
        showNotification("Lỗi khi xóa dữ liệu.", "error");
      }
    }
    setConfirmModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const columns = [
    {
      header: '',
      className: 'w-[40px] text-center !px-1 sm:hidden',
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
    { header: 'STT', className: 'w-[40px] text-center !px-1', render: (_, { index }) => index },
    {
      header: 'Công đoạn',
      className: 'min-w-[120px] !px-2',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-blue-600 text-xs sm:text-sm">{row.name || row.Name}</span>
          <span className="text-[10px] text-gray-400 sm:hidden uppercase font-semibold">{(row.stageCode || row.StageCode)}</span>
        </div>
      )
    },
    {
      header: 'Tổ sản xuất',
      className: 'hidden md:table-cell min-w-[200px]',
      render: (row) => {
        const rowId = row.id || row.ID;
        const isOpen = openDropdownId === rowId;
        const currentSection = productionSections.find(s => String(s.value) === String(row.productionSection || row.ProductionSection));

        return (
          <div className="relative w-full">
            {/* Nút Hiệu chỉnh nằm trên lề trên của Select */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsSectionMgmtModalOpen(true);
              }}
              className="absolute right-1 top-[-9px] text-blue-500 hover:text-blue-700 text-[9px] font-bold underline z-20 leading-none bg-white px-0.5"
            >
              hiệu chỉnh
            </button>

            <button
              ref={(el) => { dropdownAnchorRefs.current[`section-desktop-${rowId}`] = el; }}
              onClick={(e) => {
                toggleSectionMenu(e, rowId, `section-desktop-${rowId}`);
              }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-[11px] rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 pr-8 appearance-none cursor-pointer outline-none text-left relative min-h-[26px] font-bold text-gray-700"
            >
              <span className="truncate block">
                {currentSection?.label || '-- Chọn tổ sản xuất --'}
              </span>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </button>

            {renderSectionMenu(row, rowId, `section-desktop-${rowId}`)}

            {false && isOpen && (
              <div className="absolute left-0 top-full mt-1 w-full min-w-[200px] bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top">
                <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-6 pr-2 py-0.5 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900"
                      placeholder="Tìm nhanh..."
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                  {productionSections
                    .filter(s => (s.label || "").toLowerCase().includes(dropdownSearch.toLowerCase()))
                    .map((s) => (
                      <button
                        key={s.value}
                        onClick={() => handleSectionChange(row, s.value)}
                        className={`px-2 py-1.5 text-[10px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.productionSection || row.ProductionSection) === String(s.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <span className="block w-full truncate">{s.label}</span>
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
      header: 'Mã công đoạn',
      className: 'hidden lg:table-cell w-32 font-medium text-gray-600',
      render: (row) => <span className="font-medium text-gray-900">{row.stageCode || row.StageCode}</span>
    },
    {
      header: 'Thứ tự',
      className: 'hidden lg:table-cell w-20 text-center',
      render: (row) => row.sequence || row.Sequence
    },
    {
      header: 'Hành động',
      className: 'text-right pr-2 sm:pr-4 w-[100px] sm:w-[150px]',
      render: (row) => (
        <div className="flex gap-1.5 justify-end">
          <button onClick={(e) => { e.stopPropagation(); handleEditItem(row); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95">Sửa</button>
          <button onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: row.id, type: 'delete', title: 'Xác nhận xóa', message: 'Bạn có chắc chắn muốn xóa công đoạn này?' }); }} className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded text-[11px] sm:text-xs transition-all active:scale-95">Xóa</button>
        </div>
      ),
    },
  ];

  const toggleSectionMenu = (e, rowId, anchorKey) => {
    e.stopPropagation();
    const isSameMenuOpen = openDropdownId === rowId && openDropdownAnchorKey === anchorKey;

    if (isSameMenuOpen) {
      setOpenDropdownId(null);
      setOpenDropdownAnchorKey(null);
      setDropdownRect(null);
      return;
    }

    setDropdownSearch('');
    setOpenDropdownId(rowId);
    setOpenDropdownAnchorKey(anchorKey);

    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownRect({
      left: rect.left,
      top: rect.bottom + 4,
      width: Math.max(rect.width, 200),
    });
  };

  const renderSectionMenu = (row, rowId, anchorKey, inputPaddingClassName = 'py-0.5') => {
    if (openDropdownId !== rowId || openDropdownAnchorKey !== anchorKey || !dropdownRect) return null;

    return createPortal(
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed bg-white rounded-md shadow-2xl z-[9999] border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top"
        style={{
          left: dropdownRect.left,
          top: dropdownRect.top,
          width: dropdownRect.width,
        }}
      >
        <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className={`w-full pl-6 pr-2 ${inputPaddingClassName} text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-900`}
              placeholder="Lọc tổ..."
              value={dropdownSearch}
              onChange={(e) => setDropdownSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
          {productionSections
            .filter(s => (s.label || "").toLowerCase().includes(dropdownSearch.toLowerCase()))
            .map((s) => (
              <button
                key={s.value}
                onClick={() => handleSectionChange(row, s.value)}
                className={`px-2 py-1.5 text-[10px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.productionSection || row.ProductionSection) === String(s.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <span className="block w-full truncate">{s.label}</span>
              </button>
            ))}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="p-2 lg:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Quản lý Công đoạn sản xuất</h2>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-4 gap-4">
        <div className="relative w-full lg:max-w-[300px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm mã hoặc tên..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-row gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded whitespace-nowrap transition-colors flex items-center gap-2 text-xs sm:text-sm">
              <FileUp size={16} /> Nhập Excel
            </button>
            <button
              onClick={handleRequestExportExcel}
              className="flex-1 sm:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded whitespace-nowrap flex items-center gap-2 shadow-sm transition-all active:scale-95 text-xs sm:text-sm"
            >
              <FileDown size={16} /> Xuất Excel
            </button>
          </div>
          <button
            onClick={handleAddItem}
            className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
          >
            Thêm công đoạn
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <CustomDatatable
          columns={columns}
          data={filteredData}
          loading={loading}
          bodyCellClassName="!py-2 sm:!py-3"
          renderExpansion={(row) => {
            const rowId = row.id || row.ID;
            const isOpen = openDropdownId === rowId;
            const currentSection = productionSections.find(s => String(s.value) === String(row.productionSection || row.ProductionSection));
            return (
              <div className="py-4 px-4 sm:pl-24 sm:pr-6 bg-blue-50/30 border-b border-gray-100">
                <div className="grid grid-cols-12 lg:grid-cols-3 gap-6 text-sm">
                  <div className="flex flex-col col-span-4 gap-1 sm:hidden">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mã công đoạn</span>
                    <span className="text-gray-700 font-medium">{row.stageCode || row.StageCode}</span>
                  </div>
                  <div className="flex flex-col col-span-8 gap-1 md:hidden">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổ sản xuất</span>
                    <div className="relative w-full max-w-[200px]">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIsSectionMgmtModalOpen(true); }}
                        className="absolute right-1 top-[-10px] text-blue-600 text-[9px] font-bold underline z-20 leading-none bg-white/80 px-1 rounded"
                      >hiệu chỉnh</button>
                      <button
                        ref={(el) => { dropdownAnchorRefs.current[`section-mobile-${rowId}`] = el; }}
                        onClick={(e) => { toggleSectionMenu(e, rowId, `section-mobile-${rowId}`); }}
                        className="bg-white border border-gray-300 text-gray-900 text-[11px] rounded-lg p-1.5 pr-8 appearance-none cursor-pointer outline-none text-left relative min-h-[34px] w-full font-bold shadow-sm"
                      >
                        <span className="truncate block">{currentSection?.label || '-- Chọn tổ --'}</span>
                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                          <ChevronDown size={14} />
                        </div>
                      </button>
                      {renderSectionMenu(row, rowId, `section-mobile-${rowId}`, 'py-1')}

                      {false && isOpen && (
                        <div className="absolute left-0 top-full mt-1 w-full min-w-[200px] bg-white rounded-md shadow-2xl z-30 border border-gray-100 p-1 flex flex-col animate-in fade-in zoom-in duration-200 origin-top">
                          <div className="p-0.5 border-b border-gray-50 mb-1 sticky top-0 bg-white z-10">
                            <div className="relative">
                              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input type="text" className="w-full pl-6 pr-2 py-1 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50" placeholder="Lọc tổ..." value={dropdownSearch} onChange={(e) => setDropdownSearch(e.target.value)} onClick={(e) => e.stopPropagation()} autoFocus />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                            {productionSections.filter(s => (s.label || "").toLowerCase().includes(dropdownSearch.toLowerCase())).map((s) => (
                              <button key={s.value} onClick={() => handleSectionChange(row, s.value)} className={`px-2 py-1.5 text-[10px] rounded transition-colors text-left flex items-center min-w-0 ${String(row.productionSection || row.ProductionSection) === String(s.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}><span className="block w-full truncate">{s.label}</span></button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col col-span-6 gap-1 lg:hidden">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thứ tự thực hiện</span>
                    <span className="text-gray-700 font-medium">Bước số {row.sequence || row.Sequence}</span>
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === 'add' ? 'Thêm công đoạn mới' : 'Chỉnh sửa công đoạn'}
        isMaximized={isModalMaximized}
        onMaximizeToggle={() => setIsModalMaximized(!isModalMaximized)}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium ${errors.stageCode ? 'text-red-500' : 'text-gray-700'}`}>Mã công đoạn</label>
              <input
                type="text"
                value={currentEditingItem?.stageCode || ''}
                onChange={(e) => {
                  setCurrentEditingItem({ ...currentEditingItem, stageCode: e.target.value });
                  if (errors.stageCode) setErrors(prev => ({ ...prev, stageCode: null }));
                }}
                className={`w-full border ${errors.stageCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none transition-all ${isModalMaximized ? 'p-2 min-h-[44px] text-base' : 'p-1.5 min-h-[38px] text-sm'}`}
              />
              {errors.stageCode && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.stageCode}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium ${errors.sequence ? 'text-red-500' : 'text-gray-700'}`}>Thứ tự</label>
              <input
                type="number"
                value={currentEditingItem?.sequence || 0}
                onChange={(e) => {
                  setCurrentEditingItem({ ...currentEditingItem, sequence: e.target.value });
                  if (errors.sequence) setErrors(prev => ({ ...prev, sequence: null }));
                }}
                className={`w-full border ${errors.sequence ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none transition-all ${isModalMaximized ? 'p-2 min-h-[44px] text-base' : 'p-1.5 min-h-[38px] text-sm'}`}
              />
              {errors.sequence && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.sequence}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${errors.name ? 'text-red-500' : 'text-gray-700'}`}>Tên công đoạn</label>
            <input
              type="text"
              value={currentEditingItem?.name || ''}
              onChange={(e) => {
                setCurrentEditingItem({ ...currentEditingItem, name: e.target.value });
                if (errors.name) setErrors(prev => ({ ...prev, name: null }));
              }}
              className={`w-full border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm focus:ring-2 outline-none transition-all ${isModalMaximized ? 'p-2 min-h-[44px] text-base' : 'p-1.5 min-h-[38px] text-sm'}`}
            />
            {errors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.name}</p>}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSectionMgmtModalOpen(true)}
              className="absolute right-0 top-0 text-blue-600 hover:text-blue-800 text-[11px] font-bold underline z-10"
            >
              hiệu chỉnh
            </button>
            <CustomSelect
              label="Tổ sản xuất"
              name="productionSection"
              value={currentEditingItem?.productionSection || ''}
              onChange={(e) => {
                setCurrentEditingItem({ ...currentEditingItem, productionSection: e.target.value });
                if (errors.productionSection) setErrors(prev => ({ ...prev, productionSection: null }));
              }}
              options={productionSections}
              isModalMaximized={isModalMaximized}
              error={!!errors.productionSection}
              errorMessage={errors.productionSection}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseModal} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">Hủy</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Lưu thông tin</button>
          </div>
        </form>
      </Modal>

      {/* Modal Quản lý Danh sách Tổ sản xuất */}
      <Modal
        isOpen={isSectionMgmtModalOpen}
        onClose={() => {
          setIsSectionMgmtModalOpen(false);
          setSectionForm({ id: null, name: '' });
          setIsSectionMgmtMaximized(false);
        }}
        title="Quản lý Danh sách Tổ sản xuất"
        maxWidth={isSectionMgmtMaximized ? "max-w-full" : "max-w-5xl"}
        isMaximized={isSectionMgmtMaximized}
        onMaximizeToggle={() => setIsSectionMgmtMaximized(!isSectionMgmtMaximized)}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-[350px] w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm nhanh tổ sản xuất..."
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={sectionSearch}
                onChange={(e) => setSectionSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => handleOpenSectionEdit('add')}
              className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
            >
              Thêm tổ sản xuất
            </button>
          </div>

          <div className={`${isSectionMgmtMaximized ? 'max-h-[calc(100vh-250px)]' : 'max-h-[450px]'} overflow-y-auto border border-gray-200 rounded-lg shadow-sm transition-all duration-300`}>
            <CustomDatatable columns={sectionColumns} data={filteredSectionsForMgmt} />
          </div>
        </div>
      </Modal>

      {/* Modal Thêm/Sửa Tổ sản xuất */}
      <Modal isOpen={isSectionEditModalOpen} onClose={handleCloseSectionEditModal} title={sectionForm.id ? 'Sửa tổ sản xuất' : 'Thêm tổ sản xuất mới'} maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${sectionErrors.name ? 'text-red-500' : 'text-gray-700'}`}>Tên Tổ sản xuất</label>
            <input
              type="text"
              value={sectionForm.name}
              onChange={(e) => {
                setSectionForm({ ...sectionForm, name: e.target.value });
                if (sectionErrors.name) setSectionErrors(prev => ({ ...prev, name: null }));
              }}
              className={`w-full border ${sectionErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md shadow-sm p-2 outline-none text-sm transition-all`}
              placeholder="Nhập tên tổ sản xuất..."
            />
            {sectionErrors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{sectionErrors.name}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleCloseSectionEditModal} className="bg-gray-500 text-white px-4 py-1.5 rounded-md hover:bg-gray-600 transition-colors text-sm">Hủy</button>
            <button type="button" onClick={handleSaveSection} className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm font-bold">Lưu</button>
          </div>
        </div>
      </Modal>

      {/* Component xác nhận xóa Tổ sản xuất */}
      <CustomConfirm
        isOpen={sectionConfirmModal.isOpen}
        onClose={() => setSectionConfirmModal({ isOpen: false, id: null })}
        onConfirm={handleDeleteSection}
        title="Xác nhận xóa tổ sản xuất"
        message="Bạn có chắc chắn muốn xóa tổ sản xuất này không? Hành động này không thể hoàn tác."
        type="delete"
      />

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
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
