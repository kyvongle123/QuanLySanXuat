import React, { useState, useEffect, useMemo, Fragment, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check, ChevronDown, ArrowUp, ArrowDown, CheckCircle, XCircle, Search, Maximize, Minimize, Calendar, X } from 'lucide-react';

export const CustomDatatable = ({ columns, data, renderExpansion, paginationClassName, headerCellClassName, bodyCellClassName, rowClassName, page, onPageChange, rowsPerPage: externalRowsPerPage, onRowsPerPageChange }) => {
  // Local state chỉ sử dụng nếu không có props điều khiển từ bên ngoài
  const [internalPage, setInternalPage] = useState(1);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(5);

  // Xác định nguồn dữ liệu (ưu tiên Controlled props)
  const isPageControlled = page !== undefined && onPageChange !== undefined;
  const currentPage = isPageControlled ? page : internalPage;
  const setCurrentPage = isPageControlled ? onPageChange : setInternalPage;

  const isRowsPerPageControlled = externalRowsPerPage !== undefined && onRowsPerPageChange !== undefined;
  const rowsPerPage = isRowsPerPageControlled ? externalRowsPerPage : internalRowsPerPage;
  const setRowsPerPage = isRowsPerPageControlled ? onRowsPerPageChange : setInternalRowsPerPage;

  const [animate, setAnimate] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSort = (accessor) => {
    if (!accessor) return;
    let direction = 'asc';
    if (sortConfig.key === accessor) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig({ key: direction ? accessor : null, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key && sortConfig.direction) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Chuyển về chữ thường nếu là chuỗi để so sánh chính xác hơn
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage, sortConfig]);

  if (!data || data.length === 0) {
    return <p className="text-gray-600 p-4">Không có dữ liệu để hiển thị.</p>;
  }

  // Tính toán dữ liệu cho trang hiện tại
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedData.slice(indexOfFirstRow, indexOfLastRow);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      if (onPageChange) {
        onPageChange(pageNumber);
      }
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="relative z-10 overflow-x-auto overflow-y-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className?.includes('text-center') || column.headerCellClassName?.includes('text-center') ? 'text-center' :
                    column.className?.includes('text-right') || column.headerCellClassName?.includes('text-right') ? 'text-right' : 'text-left'
                    } ${column.header !== 'STT' && column.header !== 'Hành động' ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                    } ${column.className || ''} ${column.headerCellClassName || ''} ${headerCellClassName || ''}`}
                  onClick={() => {
                    if (column.header !== 'STT' && column.header !== 'Hành động') {
                      handleSort(column.accessor);
                    }
                  }}
                >
                  <div className={`flex items-center gap-1 ${(column.className?.includes('text-right') || column.headerCellClassName?.includes('text-right')) ? 'justify-end' :
                    (headerCellClassName?.includes('text-center') || column.className?.includes('text-center') || column.headerCellClassName?.includes('text-center')) ? 'justify-center' : ''
                    }`}>
                    {column.header}
                    {sortConfig.key === column.accessor && sortConfig.direction === 'asc' && <ArrowUp size={14} className="text-blue-500" />}
                    {sortConfig.key === column.accessor && sortConfig.direction === 'desc' && <ArrowDown size={14} className="text-blue-500" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`bg-white divide-y divide-gray-200 transition-all duration-500 ease-in-out ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {currentRows.map((row, rowIndex) => {
              const isExpanded = !!expandedRows[row.id];
              const customRowClassName = typeof rowClassName === 'function'
                ? rowClassName(row, { rowIndex, index: (currentPage - 1) * rowsPerPage + rowIndex + 1 })
                : rowClassName;
              return (
                <Fragment key={row.id || rowIndex}>
                  <tr className={`${customRowClassName || ''} hover:bg-gray-50 transition-colors`}>
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className={`px-6 py-4 ${bodyCellClassName || ''} whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}>
                        {column.render
                          ? column.render(row, { isExpanded, toggleExpand: () => toggleRow(row.id), index: (currentPage - 1) * rowsPerPage + rowIndex + 1, rowIndex })
                          : row[column.accessor]}
                      </td>
                    ))}
                  </tr>
                  {renderExpansion && (
                    <tr className={`bg-gray-50/50 transition-all duration-300 ${isExpanded ? 'border-t border-gray-100' : ''}`}>
                      <td colSpan={columns.length} className="p-0">
                        <div
                          className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                        >
                          <div className={isExpanded ? "overflow-visible" : "overflow-hidden"}>
                            {renderExpansion(row)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Thanh phân trang */}
      <div className={`relative z-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4 ${paginationClassName || ''}`}>
        <div className="flex items-center gap-6">
          <div className="text-sm text-gray-700">
            <span className="hidden sm:inline">Hiển thị trang </span><span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 border-l pl-6 border-gray-300">
            <span className="hidden sm:inline">Hiển thị</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              {[5, 10, 20, 50, 100].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <span>dòng/trang</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="p-1 sm:px-3 sm:py-1 text-sm font-medium rounded-md border border-gray-300 disabled:opacity-50 hover:bg-white transition-colors text-gray-700 bg-white flex items-center justify-center"
          >
            <span>Trang đầu</span>
          </button>

          {/* Nút Previous Page */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Nút Next Page */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 sm:px-3 sm:py-1 text-sm font-medium rounded-md border border-gray-300 disabled:opacity-50 hover:bg-white transition-colors text-gray-700 bg-white flex items-center justify-center"
          >
            <span >Trang cuối</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const AppNotification = ({ isOpen, message, type = 'success', onClose }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setAnimate(true), 10);
      const autoClose = setTimeout(() => onClose(), 3000); // Tự động đóng sau 3 giây
      return () => {
        clearTimeout(timer);
        clearTimeout(autoClose);
      };
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
      <div
        className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 border ${type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
          } ${animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'}`}
      >
        {type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
        <span className="font-medium text-lg">{message}</span>
      </div>
    </div>
  );
};

export const CustomSelect = ({ label, options, value, onChange, name, isModalMaximized = false, wrapText = false, isMulti = false, placement = 'bottom', className, error = false, errorMessage = '' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Tìm các tùy chọn đã chọn (hỗ trợ cả chọn đơn và chọn nhiều)
  const selectedOptions = useMemo(() => {
    if (isMulti) {
      if (!Array.isArray(value)) return [];
      // Hỗ trợ value là mảng các ID hoặc mảng các đối tượng {value, label}
      return options.filter(opt =>
        value.some(v => String(v?.value || v) === String(opt.value))
      );
    }
    return options.find(opt => String(opt.value) === String(value));
  }, [options, value, isMulti]);

  // Tự động reset tìm kiếm khi đóng menu
  useEffect(() => {
    if (!isOpen) setSearchQuery(''); // Reset search query when dropdown closes
  }, [isOpen]);

  // Lọc options dựa trên searchQuery
  const filteredOptions = useMemo(() => {
    return options.filter(opt =>
      (opt.label || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  return (
    <div className="flex flex-col gap-1 w-full relative">
      {label && <label className="text-xs font-medium text-gray-700">{label}</label>}
      <div className={`relative ${isModalMaximized ? 'text-base' : 'text-sm'}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full pr-10 border ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} ${className || ''} rounded-md focus:outline-none focus:ring-2 transition-all bg-white text-left appearance-none cursor-pointer flex items-center ${isModalMaximized ? 'p-2 min-h-[44px]' : 'p-1.5 min-h-[38px]'}`}
        >
          <span className={`block flex-1 ${wrapText ? 'whitespace-normal break-words leading-tight py-0.5' : 'truncate'}`}>
            {isMulti ? (
              selectedOptions.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedOptions.map(o => (
                    <span key={o.value} className="inline-flex items-center bg-gray-200 text-gray-800 text-xs font-medium px-2 py-1 rounded-full border border-gray-300">
                      {o.label}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn chặn việc đóng dropdown khi nhấn nút X
                          const newValue = selectedOptions.filter(s => String(s.value) !== String(o.value));
                          // Gọi onChange với mảng các đối tượng {value, label}
                          onChange(newValue);
                        }}
                        className="ml-1.5 p-0.5 rounded-full hover:bg-gray-300 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                '-- Chọn --'
              )
            ) : (
              selectedOptions ? selectedOptions.label : '-- Chọn --'
            )}
          </span>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">
            <ChevronDown size={16} />
          </div>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)}></div>
            <div className={`absolute left-0 ${placement === 'top' ? 'bottom-full mb-1 origin-bottom' : 'top-full mt-1 origin-top'} 
              w-full bg-white border border-gray-200 rounded-md shadow-xl z-[70] max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in duration-200 whitespace-normal`}
            >

              {/* Ô tìm kiếm bên trong dropdown */}
              <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
                <div className="relative">
                  <Search size={isModalMaximized ? 16 : 14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className={`w-full pl-7 pr-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${isModalMaximized ? 'py-2 text-sm' : 'py-1.5 text-xs'}`}
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (isMulti) {
                        const isSelected = selectedOptions.some(s => String(s.value) === String(opt.value));
                        let newValue;
                        if (isSelected) {
                          // Nếu đã chọn thì bỏ chọn
                          newValue = selectedOptions.filter(s => String(s.value) !== String(opt.value));
                        } else {
                          // Nếu chưa chọn thì thêm vào mảng
                          newValue = [...selectedOptions, opt];
                        }
                        onChange(newValue);
                      } else {
                        onChange({ target: { name, value: opt.value } });
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full px-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 flex items-center min-w-0 ${isModalMaximized ? 'py-3 text-base' : 'py-3 text-sm'} ${(isMulti ? selectedOptions.some(s => String(s.value) === String(opt.value)) : String(opt.value) === String(value)) ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-700'
                      }`}
                  >
                    <span className="block w-full !whitespace-normal break-words leading-relaxed">
                      {opt.label}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-xs text-gray-400 text-center italic">
                  Không tìm thấy kết quả
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {errorMessage && <p className="text-xs font-medium text-red-600">{errorMessage}</p>}
    </div>
  );
};

const CustomCalendar = ({ selectedDate, onSelect, compact = false }) => {
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [viewDate, setViewDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef(null);

  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const changeMonth = (offset) => {
    setViewDate(new Date(currentYear, currentMonth + offset, 1));
  };

  const changeYear = (year) => {
    setViewDate(new Date(year, currentMonth, 1));
    setIsYearDropdownOpen(false);
  };

  // Đóng dropdown năm khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setIsYearDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentYear, currentMonth, i));

  const isToday = (date) => {
    const today = new Date();
    return date && date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    if (!selectedDate || !date) return false;
    const d = new Date(selectedDate);
    return date.getDate() === d.getDate() && date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return (
    <div className={`select-none z-10 ${compact ? 'w-[256px]' : 'min-w-[250px]'}`}>
      <div className={`flex justify-between items-center ${compact ? 'mb-1 px-0' : 'mb-4 px-1'}`}>
        <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={compact ? 18 : 18} /></button>
        <div className={`flex items-center font-bold text-gray-800 relative ${compact ? 'gap-1 text-xs' : 'gap-1 text-sm'}`} ref={yearDropdownRef}>
          <span>{monthNames[currentMonth]}</span>
          {/* Thay thế select mặc định bằng Custom Year Dropdown */}
          <button
            type="button"
            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
            className="flex items-center gap-0.5 hover:text-blue-600 transition-colors focus:outline-none"
          >
            {currentYear}
            <ChevronDown size={compact ? 14 : 14} className={`transition-transform duration-200 ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isYearDropdownOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-24 bg-white border border-gray-200 rounded shadow-xl z-[110] max-h-[160px] overflow-y-auto animate-in fade-in zoom-in duration-200 origin-top">
              {Array.from({ length: 21 }, (_, i) => currentYear - 10 + i).map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => changeYear(y)}
                  className={`w-full px-2 py-2 text-center text-xs hover:bg-blue-50 transition-colors ${y === currentYear ? 'bg-blue-50 font-bold text-blue-600' : 'text-gray-700'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={compact ? 18 : 18} /></button>
      </div>
      <div className={`grid grid-cols-7 mb-1 ${compact ? 'gap-0' : 'gap-1'}`}>
        {dayNames.map(d => (
          <div key={d} className={`text-center font-bold text-gray-400 uppercase ${compact ? 'text-[10px]' : 'text-[10px]'}`}>{d}</div>
        ))}
      </div>
      <div className={`grid grid-cols-7 ${compact ? 'gap-0' : 'gap-1'}`}>
        {days.map((date, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {date ? (
              <button
                type="button"
                onClick={() => onSelect(formatDate(date))}
                className={`${compact ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs'} rounded-full flex items-center justify-center transition-all ${isSelected(date)
                  ? 'bg-blue-600 text-white font-bold'
                  : isToday(date)
                    ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100'
                    : 'hover:bg-blue-50 text-gray-700'
                  }`}
              >
                {date.getDate()}
              </button>
            ) : <div className={compact ? "w-5 h-5" : "w-7 h-7"} />}
          </div>
        ))}
      </div>
    </div>
  );
};

export const DateInput = ({ label, value, onChange, name, isModalMaximized = false, placement = 'bottom', className, error = false, errorMessage = '', compactCalendar = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [calendarStyle, setCalendarStyle] = useState({});
  const containerRef = useRef(null);
  const calendarRef = useRef(null);

  useLayoutEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        (!calendarRef.current || !calendarRef.current.contains(event.target))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updateCalendarPosition = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const calendarHeight = compactCalendar ? 168 : 292;
      const gap = 4;
      const top = placement === 'top'
        ? Math.max(gap, rect.top - calendarHeight - gap)
        : rect.bottom + gap;

      setCalendarStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${rect.left}px`,
        ...(compactCalendar ? { width: '288px' } : { minWidth: `${rect.width}px` }),
      });
    };

    updateCalendarPosition();
    window.addEventListener('resize', updateCalendarPosition);
    window.addEventListener('scroll', updateCalendarPosition, true);

    return () => {
      window.removeEventListener('resize', updateCalendarPosition);
      window.removeEventListener('scroll', updateCalendarPosition, true);
    };
  }, [isOpen, placement, compactCalendar]);

  const formattedValue = value ? new Date(value).toLocaleDateString('vi-VN') : '--/--/----';

  return (
    <div className="flex flex-col gap-1 w-full relative" ref={containerRef}>
      {label && <label className="text-xs font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={className || `w-full pr-10 border ${error ? 'border-red-500 focus:ring-0 focus:outline-none' : 'border-gray-300 focus:ring-blue-500'} rounded-md focus:outline-none focus:ring-2 transition-all bg-white text-left cursor-pointer flex items-center ${isModalMaximized ? 'p-2 min-h-[44px] text-base' : 'p-1.5 min-h-[38px] text-sm'}`}
        >
          <span className="truncate">{formattedValue}</span>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">
            <Calendar size={16} />
          </div>
        </button>

        {isOpen && createPortal(
          <div
            ref={calendarRef}
            style={calendarStyle}
            className={`bg-white border border-gray-200 rounded-md shadow-2xl z-[100] animate-in fade-in zoom-in duration-200 ${compactCalendar ? 'p-1.5' : 'p-3'} ${placement === 'top' ? 'origin-bottom' : 'origin-top'}`}
          >
            <CustomCalendar compact={compactCalendar} selectedDate={value} onSelect={(date) => { onChange({ target: { value: date, name } }); setIsOpen(false); }} />
          </div>,
          document.body
        )}
      </div>
      {errorMessage && <p className="text-red-500 text-xs mt-1 font-medium">{errorMessage}</p>}
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md", isMaximized, onMaximizeToggle }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Cần một khoảng trễ cực ngắn để browser kịp nhận diện component đã mount trước khi áp dụng class transition
      const timer = setTimeout(() => setAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
      // Đợi hiệu ứng transition chạy xong (300ms) rồi mới gỡ component khỏi DOM
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'} ${isMaximized ? 'p-0' : 'p-4'}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-white rounded-lg shadow-xl p-6 w-full transform transition-all duration-300 ${animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} ${isMaximized ? 'max-w-full h-screen rounded-none p-4' : maxWidth}`}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {onMaximizeToggle && (
            <button
              onClick={onMaximizeToggle}
              className="text-gray-400 hover:text-gray-600 focus:outline-none ml-auto mr-2"
            >
              {isMaximized ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export const CustomConfirm = ({ isOpen, onClose, onConfirm, title, message, type }) => {
  if (!isOpen) return null;

  // Kiểm tra nếu là hành động xuất file để áp dụng style riêng
  const isExport = type === 'export';

  // Nút xác nhận: Xanh dương cho export, Đỏ cho các hành động xóa/nguy hiểm khác
  const confirmBtnClass = isExport
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-red-600 hover:bg-red-700";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          {/* Nút Hủy: Luôn để màu xám */}
          <button
            onClick={onClose}
            className="bg-gray-500 text-white py-1.5 px-4 rounded-md text-sm hover:bg-gray-600 transition-colors"
          >
            Hủy
          </button>

          {/* Nút Xác nhận: Màu động dựa theo type và có icon Check */}
          <button
            onClick={onConfirm}
            className={`${confirmBtnClass} text-white py-1.5 px-4 rounded-md text-sm transition-colors flex items-center gap-2`}
          >
            <Check size={16} />
            Xác nhận
          </button>
        </div>
      </div>
    </Modal>
  );
};
