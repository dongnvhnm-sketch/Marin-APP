import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export type OrderSearchType = 'trackingNumber' | 'lastDigits' | 'orderCode' | 'customOrderCode';

export interface OrderSearchOption {
  key: OrderSearchType;
  label: string;
  placeholder: string;
}

export const ORDER_SEARCH_OPTIONS: OrderSearchOption[] = [
  {
    key: 'orderCode',
    label: 'Mã đơn hàng',
    placeholder: 'Ví dụ: DH-2026-001, DH0001, ...',
  },
  {
    key: 'trackingNumber',
    label: 'Mã vận đơn',
    placeholder: 'Ví dụ: 802548505927, 802548200077, ...',
  },
  {
    key: 'lastDigits',
    label: '4 số cuối vận đơn',
    placeholder: 'Nhập 4, 5 hoặc 6 số cuối mã vận đơn...',
  },
  {
    key: 'customOrderCode',
    label: 'Mã đơn hàng riêng',
    placeholder: 'Nhập mã đơn riêng của shop...',
  },
];

interface OrderSearchInputProps {
  searchType: OrderSearchType;
  onSearchTypeChange: (type: OrderSearchType) => void;
  searchValue: string;
  onSearchValueChange: (val: string) => void;
}

export const OrderSearchInput: React.FC<OrderSearchInputProps> = ({
  searchType,
  onSearchTypeChange,
  searchValue,
  onSearchValueChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption =
    ORDER_SEARCH_OPTIONS.find((opt) => opt.key === searchType) || ORDER_SEARCH_OPTIONS[1]; // Mặc định: Mã vận đơn

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 min-w-[280px] h-[38px] flex items-center bg-gray-50 border rounded-lg transition-all duration-150 ${
        isOpen
          ? 'bg-white border-[#ef4444] ring-1 ring-[#ef4444]/25 shadow-xs'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-100/50 focus-within:bg-white focus-within:border-[#ef4444] focus-within:ring-1 focus-within:ring-[#ef4444]/25'
      }`}
    >
      {/* Nút thả xuống chọn loại tra cứu (Khớp Ảnh 2) */}
      <div className="relative h-full flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-full pl-3 pr-2 flex items-center space-x-1.5 text-xs font-medium transition-colors cursor-pointer shrink-0 select-none ${
            isOpen ? 'text-[#ef4444] font-semibold' : 'text-gray-800 hover:text-[#ef4444]'
          }`}
          title="Chọn tiêu chí tra cứu"
        >
          <span>{currentOption.label}</span>
          <ChevronDown
            size={13}
            className={`transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#ef4444]' : 'text-gray-400'
            }`}
          />
        </button>

        {/* Menu thả xuống các lựa chọn tra cứu (Khớp chính xác Ảnh 2) */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in duration-100">
            {ORDER_SEARCH_OPTIONS.map((opt) => {
              const isActive = opt.key === searchType;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    onSearchTypeChange(opt.key);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'text-[#ef4444] font-semibold bg-rose-50/50'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-normal'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Đường vạch ngăn cách thẳng đứng "|" (Khớp Ảnh 2) */}
      <div className="h-4 w-[1px] bg-gray-300 mx-1 shrink-0" />

      {/* Ô nhập thông tin tìm kiếm */}
      <input
        type="text"
        placeholder={currentOption.placeholder}
        value={searchValue}
        onChange={(e) => onSearchValueChange(e.target.value)}
        className="flex-1 bg-transparent px-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
      />

      {/* Nút xóa nhanh nếu có nội dung */}
      {searchValue && (
        <button
          type="button"
          onClick={() => onSearchValueChange('')}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer mr-1"
          title="Xóa nội dung tìm kiếm"
        >
          <X size={13} />
        </button>
      )}

      {/* Biểu tượng kính lúp tìm kiếm (Khớp Ảnh 1 & 2) */}
      <div className="pr-3 pl-1 flex items-center text-gray-400 pointer-events-none">
        <Search size={14} />
      </div>
    </div>
  );
};
