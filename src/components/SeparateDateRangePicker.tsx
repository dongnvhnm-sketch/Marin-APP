import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
} from 'lucide-react';

export interface SeparateDateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  prefixElement?: React.ReactNode;
  onClear?: () => void;
  isFiltered?: boolean;
  className?: string;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// Format date to DD/MM/YYYY
export const formatDateDMY = (d: Date): string => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Chuẩn hóa về đầu ngày 00:00:00
export const normalizeStartOfDay = (d: Date): Date => {
  const res = new Date(d);
  res.setHours(0, 0, 0, 0);
  return res;
};

export const SeparateDateRangePicker: React.FC<SeparateDateRangePickerProps> = ({
  startDate,
  endDate,
  onRangeChange,
  prefixElement,
  onClear,
  isFiltered = true,
  className = '',
}) => {
  // Trạng thái mở popup: 'none' | 'start' | 'end'
  const [activePopup, setActivePopup] = useState<'none' | 'start' | 'end'>('none');

  // Tháng và năm đang hiển thị trên lịch popup (0-indexed month)
  const [viewYear, setViewYear] = useState<number>(() => startDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => startDate.getMonth());

  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePopup((prev) => (prev === 'none' ? prev : 'none'));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mở lịch chọn Ngày bắt đầu
  const handleOpenStart = () => {
    setViewYear(startDate.getFullYear());
    setViewMonth(startDate.getMonth());
    setActivePopup('start');
  };

  // Mở lịch chọn Ngày kết thúc
  const handleOpenEnd = () => {
    setViewYear(endDate.getFullYear());
    setViewMonth(endDate.getMonth());
    setActivePopup('end');
  };

  // Điều hướng tháng/năm trên popup lịch
  const prevYear = () => setViewYear((y) => y - 1);
  const nextYear = () => setViewYear((y) => y + 1);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Logic click chọn ngày:
  // - Ngày bắt đầu luôn phải nhỏ hơn hoặc bằng ngày kết thúc (startDate <= endDate)
  const handleSelectDay = (dayDate: Date) => {
    const target = normalizeStartOfDay(dayDate);
    const startNorm = normalizeStartOfDay(startDate);
    const endNorm = normalizeStartOfDay(endDate);

    if (activePopup === 'start') {
      // Khi chọn Ngày bắt đầu: nếu target > ngày kết thúc hiện tại thì không cho phép
      if (target.getTime() > endNorm.getTime()) {
        return;
      }
      onRangeChange(target, endDate);
      setActivePopup('none');
    } else if (activePopup === 'end') {
      // Khi chọn Ngày kết thúc: nếu target < ngày bắt đầu hiện tại thì không cho phép
      if (target.getTime() < startNorm.getTime()) {
        return;
      }
      onRangeChange(startDate, target);
      setActivePopup('none');
    }
  };

  // Nút "Hôm nay"
  const handleSelectToday = () => {
    const today = normalizeStartOfDay(new Date());
    const startNorm = normalizeStartOfDay(startDate);
    const endNorm = normalizeStartOfDay(endDate);

    if (activePopup === 'start') {
      if (today.getTime() > endNorm.getTime()) {
        // Nếu hôm nay vượt quá ngày kết thúc, đồng bộ cả hai về hôm nay
        onRangeChange(today, today);
      } else {
        onRangeChange(today, endDate);
      }
      setActivePopup('none');
    } else if (activePopup === 'end') {
      if (today.getTime() < startNorm.getTime()) {
        // Nếu hôm nay nhỏ hơn ngày bắt đầu, đồng bộ cả hai về hôm nay
        onRangeChange(today, today);
      } else {
        onRangeChange(startDate, today);
      }
      setActivePopup('none');
    }
  };

  // Tạo lưới các ngày trong tháng (hỗ trợ hiển thị ngày tháng trước và tháng sau)
  const generateMonthDays = () => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(viewYear, viewMonth - 1, prevMonthLastDate - i),
        isCurrentMonth: false,
      });
    }

    const currentMonthDaysCount = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let i = 1; i <= currentMonthDaysCount; i++) {
      days.push({
        date: new Date(viewYear, viewMonth, i),
        isCurrentMonth: true,
      });
    }

    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(viewYear, viewMonth + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const startNorm = normalizeStartOfDay(startDate);
  const endNorm = normalizeStartOfDay(endDate);

  return (
    <div className={`relative inline-flex items-center select-none ${className}`} ref={containerRef}>
      {/* Container nhóm các nút chọn ngày tách riêng */}
      <div className="inline-flex items-center gap-1.5 text-xs font-medium">
        {/* Phần prefix (nếu có, ví dụ Dropdown chọn loại ngày) */}
        {prefixElement && <div className="flex items-center">{prefixElement}</div>}

        {/* Ô 1: Ngày bắt đầu (Tách riêng biệt theo Ảnh 1) */}
        <button
          type="button"
          onClick={activePopup === 'start' ? () => setActivePopup('none') : handleOpenStart}
          className={`h-[38px] px-3.5 flex items-center justify-between gap-2.5 rounded-lg border transition-all cursor-pointer min-w-[125px] ${
            activePopup === 'start'
              ? 'bg-white border-[#ef4444] ring-2 ring-[#ef4444]/20 shadow-xs text-gray-900 font-semibold'
              : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
          }`}
          title="Chọn ngày bắt đầu"
        >
          <span>{formatDateDMY(startDate)}</span>
          <CalendarIcon
            size={14}
            className={`transition-colors ${
              activePopup === 'start' ? 'text-[#ef4444]' : 'text-gray-400'
            }`}
          />
        </button>

        {/* Ô 2: Ngày kết thúc (Tách riêng biệt theo Ảnh 2) */}
        <button
          type="button"
          onClick={activePopup === 'end' ? () => setActivePopup('none') : handleOpenEnd}
          className={`h-[38px] px-3.5 flex items-center justify-between gap-2.5 rounded-lg border transition-all cursor-pointer min-w-[125px] ${
            activePopup === 'end'
              ? 'bg-white border-[#ef4444] ring-2 ring-[#ef4444]/20 shadow-xs text-gray-900 font-semibold'
              : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
          }`}
          title="Chọn ngày kết thúc"
        >
          <span>{formatDateDMY(endDate)}</span>
          <CalendarIcon
            size={14}
            className={`transition-colors ${
              activePopup === 'end' ? 'text-[#ef4444]' : 'text-gray-400'
            }`}
          />
        </button>

        {/* Nút Xóa Ngày Lọc (Clear X nếu có) */}
        {onClear && isFiltered && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="h-[38px] px-2 text-gray-400 hover:text-gray-700 flex items-center justify-center cursor-pointer rounded-lg hover:bg-gray-100 transition-colors"
            title="Xóa bộ lọc ngày"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ================= POPUP LỊCH THÁNG (Khớp 100% Ảnh 1 & Ảnh 2) ================= */}
      {(activePopup === 'start' || activePopup === 'end') && (
        <div
          className={`absolute top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-[295px] z-50 animate-in fade-in duration-100 ${
            activePopup === 'start' ? 'left-0' : 'left-24 sm:left-36'
          }`}
        >
          {/* Header điều hướng: <<  <   Th MM  YYYY   >  >> */}
          <div className="flex items-center justify-between pb-3 text-gray-600 border-b border-gray-50">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={prevYear}
                className="p-1 hover:text-[#ef4444] hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                title="Năm trước"
              >
                <ChevronsLeft size={16} className="text-gray-400 hover:text-[#ef4444]" />
              </button>
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 hover:text-[#ef4444] hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft size={16} className="text-gray-400 hover:text-[#ef4444]" />
              </button>
            </div>

            <span className="font-bold text-xs text-gray-900 tracking-wide">
              Th {String(viewMonth + 1).padStart(2, '0')}&nbsp;&nbsp;{viewYear}
            </span>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 hover:text-[#ef4444] hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                title="Tháng sau"
              >
                <ChevronRight size={16} className="text-gray-400 hover:text-[#ef4444]" />
              </button>
              <button
                type="button"
                onClick={nextYear}
                className="p-1 hover:text-[#ef4444] hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                title="Năm sau"
              >
                <ChevronsRight size={16} className="text-gray-400 hover:text-[#ef4444]" />
              </button>
            </div>
          </div>

          {/* Dòng thứ trong tuần: T2 T3 T4 T5 T6 T7 CN */}
          <div className="grid grid-cols-7 text-center my-2">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-[11px] font-semibold text-gray-500 py-0.5">
                {wd}
              </div>
            ))}
          </div>

          {/* Lưới các ngày trong tháng */}
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {generateMonthDays().map((item, idx) => {
              const itemDay = normalizeStartOfDay(item.date);
              const itemTime = itemDay.getTime();

              const isStartSelected = itemTime === startNorm.getTime();
              const isEndSelected = itemTime === endNorm.getTime();

              // Logic ràng buộc bắt buộc: ngày bắt đầu luôn phải nhỏ hơn hoặc bằng ngày kết thúc (Ảnh 1 & 2)
              let isDisabled = false;
              if (activePopup === 'start') {
                // Đang chọn ngày bắt đầu: các ngày lớn hơn ngày kết thúc hiện tại sẽ bị vô hiệu hóa
                isDisabled = itemTime > endNorm.getTime();
              } else if (activePopup === 'end') {
                // Đang chọn ngày kết thúc: các ngày nhỏ hơn ngày bắt đầu hiện tại sẽ bị vô hiệu hóa
                isDisabled = itemTime < startNorm.getTime();
              }

              // Ô được chọn chính: hình tròn đặc màu đồng bộ theme Dolax (#ef4444)
              const isCurrentSelection =
                (activePopup === 'start' && isStartSelected) ||
                (activePopup === 'end' && isEndSelected);

              // Mốc đối ứng (nếu đang chọn start thì end là vòng tròn viền ngoài, ngược lại)
              const isCounterpart =
                (activePopup === 'start' && isEndSelected && !isStartSelected) ||
                (activePopup === 'end' && isStartSelected && !isEndSelected);

              return (
                <div key={idx} className="flex items-center justify-center h-8">
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectDay(item.date)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                      isCurrentSelection
                        ? 'bg-[#ef4444] text-white font-bold shadow-xs cursor-pointer'
                        : isCounterpart
                        ? 'border-2 border-[#ef4444] text-[#ef4444] font-bold cursor-pointer'
                        : isDisabled
                        ? 'bg-gray-100/70 text-gray-300 cursor-not-allowed'
                        : item.isCurrentMonth
                        ? 'text-gray-700 hover:bg-rose-50 hover:text-[#ef4444] cursor-pointer'
                        : 'text-gray-300 cursor-pointer hover:bg-gray-50'
                    }`}
                    title={
                      isDisabled
                        ? activePopup === 'start'
                          ? 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc'
                          : 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu'
                        : formatDateDMY(item.date)
                    }
                  >
                    {item.date.getDate()}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Nút thao tác: "Hôm nay" (Khớp 100% Ảnh 1 & Ảnh 2) */}
          <div className="pt-2.5 mt-2 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
