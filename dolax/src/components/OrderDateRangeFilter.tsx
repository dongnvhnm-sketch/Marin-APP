import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  SeparateDateRangePicker,
  formatDateDMY,
  normalizeStartOfDay,
} from './SeparateDateRangePicker';

export { formatDateDMY, normalizeStartOfDay };

export type OrderDateFilterType = 'created' | 'picked' | 'delivered' | 'returned';

export interface DateFilterOption {
  key: OrderDateFilterType;
  label: string; // Tên hiển thị trong menu thả xuống
  shortLabel: string; // Tên hiển thị trên ô bộ lọc
}

export const DATE_FILTER_OPTIONS: DateFilterOption[] = [
  { key: 'created', label: 'Ngày tạo đơn', shortLabel: 'Ngày tạo đơn' },
  { key: 'picked', label: 'Ngày lấy hàng', shortLabel: 'Ngày lấy hàng' },
  { key: 'delivered', label: 'Ngày ký nhận', shortLabel: 'Ngày ký nhận' },
  { key: 'returned', label: 'Ngày hoàn hàng', shortLabel: 'Ngày hoàn hàng' },
];

interface OrderDateRangeFilterProps {
  dateType: OrderDateFilterType;
  onDateTypeChange: (type: OrderDateFilterType) => void;
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (start: Date, end: Date) => void;
  onClear?: () => void;
  isFiltered?: boolean;
}

export const OrderDateRangeFilter: React.FC<OrderDateRangeFilterProps> = ({
  dateType,
  onDateTypeChange,
  startDate,
  endDate,
  onDateRangeChange,
  onClear,
  isFiltered = true,
}) => {
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const typeContainerRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown loại ngày khi click ra ngoài
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (typeContainerRef.current && !typeContainerRef.current.contains(e.target as Node)) {
        setIsTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedOption =
    DATE_FILTER_OPTIONS.find((o) => o.key === dateType) || DATE_FILTER_OPTIONS[0];

  const prefix = (
    <div className="relative mr-1" ref={typeContainerRef}>
      <button
        type="button"
        onClick={() => setIsTypeOpen(!isTypeOpen)}
        className={`h-[38px] px-3 flex items-center space-x-1.5 rounded-lg border transition-all cursor-pointer ${
          isTypeOpen
            ? 'bg-rose-50/70 border-[#ef4444] text-[#ef4444] font-semibold ring-2 ring-[#ef4444]/20'
            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
        }`}
        title="Chọn loại ngày lọc"
      >
        <span>{selectedOption.shortLabel}</span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-150 ${
            isTypeOpen ? 'rotate-180 text-[#ef4444]' : 'text-gray-400'
          }`}
        />
      </button>

      {/* Menu thả xuống chọn loại ngày */}
      {isTypeOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in duration-100">
          {DATE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                onDateTypeChange(opt.key);
                setIsTypeOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                opt.key === dateType
                  ? 'bg-rose-50 text-[#ef4444] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <SeparateDateRangePicker
      startDate={startDate}
      endDate={endDate}
      onRangeChange={onDateRangeChange}
      prefixElement={prefix}
      onClear={onClear}
      isFiltered={isFiltered}
    />
  );
};
