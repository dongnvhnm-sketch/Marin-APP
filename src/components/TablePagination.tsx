import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check } from 'lucide-react';

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100, 200, 500, 1000],
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0;
  const validCurrentPage = totalPages > 0 ? Math.min(Math.max(1, currentPage), totalPages) : 1;

  // Calculate start and end item display
  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(validCurrentPage * pageSize, totalItems);

  // Generate page numbers
  const getPageNumbers = () => {
    if (totalPages <= 1) {
      return totalPages === 1 ? [1] : [1];
    }

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // When totalPages > 7
    if (validCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (validCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  const handleSelectSize = (size: number) => {
    onPageSizeChange(size);
    onPageChange(1);
    setIsOpen(false);
  };

  const isPrevDisabled = totalItems === 0 || validCurrentPage <= 1;
  const isNextDisabled = totalItems === 0 || validCurrentPage >= totalPages;

  return (
    <div
      className={`border-t border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 bg-white ${className}`}
    >
      {/* Left side: Pagination buttons */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 select-none">
        {/* First page button */}
        <button
          type="button"
          onClick={() => !isPrevDisabled && onPageChange(1)}
          disabled={isPrevDisabled}
          title="Trang đầu"
          className={`px-2 py-1 min-w-[28px] h-7 border border-gray-200 rounded flex items-center justify-center transition-colors ${
            isPrevDisabled
              ? 'opacity-35 cursor-not-allowed text-gray-300'
              : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
          }`}
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Previous page button */}
        <button
          type="button"
          onClick={() => !isPrevDisabled && onPageChange(validCurrentPage - 1)}
          disabled={isPrevDisabled}
          title="Trang trước"
          className={`px-2 py-1 min-w-[28px] h-7 border border-gray-200 rounded flex items-center justify-center transition-colors ${
            isPrevDisabled
              ? 'opacity-35 cursor-not-allowed text-gray-300'
              : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
          }`}
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page numbers */}
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-1 text-gray-400 select-none flex items-center justify-center h-7"
              >
                ...
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = totalItems > 0 && pageNum === validCurrentPage;

          if (isActive) {
            return (
              <span
                key={pageNum}
                className="min-w-[28px] h-7 px-2 flex items-center justify-center bg-black text-white font-bold rounded-md"
              >
                {pageNum}
              </span>
            );
          }

          return (
            <button
              key={pageNum}
              type="button"
              disabled={totalItems === 0}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[28px] h-7 px-2 border border-gray-200 rounded flex items-center justify-center transition-colors ${
                totalItems === 0
                  ? 'opacity-40 cursor-not-allowed text-gray-400'
                  : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next page button */}
        <button
          type="button"
          onClick={() => !isNextDisabled && onPageChange(validCurrentPage + 1)}
          disabled={isNextDisabled}
          title="Trang tiếp"
          className={`px-2 py-1 min-w-[28px] h-7 border border-gray-200 rounded flex items-center justify-center transition-colors ${
            isNextDisabled
              ? 'opacity-35 cursor-not-allowed text-gray-300'
              : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
          }`}
        >
          <ChevronRight size={14} />
        </button>

        {/* Last page button */}
        <button
          type="button"
          onClick={() => !isNextDisabled && onPageChange(totalPages)}
          disabled={isNextDisabled}
          title="Trang cuối"
          className={`px-2 py-1 min-w-[28px] h-7 border border-gray-200 rounded flex items-center justify-center transition-colors ${
            isNextDisabled
              ? 'opacity-35 cursor-not-allowed text-gray-300'
              : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
          }`}
        >
          <ChevronsRight size={14} />
        </button>
      </div>

      {/* Right side: Row range and Page Size Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1.5 px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-pointer text-gray-700 select-none"
        >
          <span>
            {totalItems === 0
              ? '0 trong số 0 dòng'
              : `${startItem}-${endItem} trong số ${totalItems} dòng`}
          </span>
          <span className="text-[10px] text-gray-600">▲</span>
        </button>

        {/* Upward floating popover menu matching Image 2 */}
        {isOpen && (
          <div className="absolute right-0 bottom-full mb-1.5 w-24 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95">
            {pageSizeOptions.map((opt) => {
              const isSelected = opt === pageSize;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectSize(opt)}
                  className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                    isSelected
                      ? 'text-red-500 font-semibold bg-red-50/30'
                      : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <Check size={14} className="text-emerald-500 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
