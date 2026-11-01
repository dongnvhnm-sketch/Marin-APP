import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerDropdownProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  preset: '7days' | '15days' | 'custom';
  onRangeChange: (start: string, end: string, preset: '7days' | '15days' | 'custom') => void;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// Reference system date: 29/09/2026 (Tuesday)
const REF_YEAR = 2026;
const REF_MONTH = 8; // 0-indexed: 8 is September
const REF_DATE = 29;

const formatVNWeekday = (d: Date): string => {
  return WEEKDAY_NAMES[d.getDay()];
};

const formatDateDMY = (d: Date): string => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateString = (d: Date): string => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

const parseDateString = (str: string): Date => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const DateRangePickerDropdown: React.FC<DateRangePickerDropdownProps> = ({
  startDate,
  endDate,
  preset,
  onRangeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Month shown on left calendar (default September 2026)
  const [leftYear, setLeftYear] = useState(REF_YEAR);
  const [leftMonth, setLeftMonth] = useState(REF_MONTH);

  // Right calendar is always the consecutive month
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;
  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;

  // Selected range in calendar
  const [tempStart, setTempStart] = useState<Date>(() => parseDateString(startDate));
  const [tempEnd, setTempEnd] = useState<Date>(() => parseDateString(endDate));
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsSelectingRange(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Sync tempStart/tempEnd when props change
  const prevPropsRef = useRef({ startDate, endDate });
  useEffect(() => {
    if (
      prevPropsRef.current.startDate !== startDate ||
      prevPropsRef.current.endDate !== endDate
    ) {
      prevPropsRef.current = { startDate, endDate };
      setTempStart(parseDateString(startDate));
      setTempEnd(parseDateString(endDate));
    }
  }, [startDate, endDate]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (leftMonth === 0) {
      setLeftMonth(11);
      setLeftYear((y) => y - 1);
    } else {
      setLeftMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (leftMonth === 11) {
      setLeftMonth(0);
      setLeftYear((y) => y + 1);
    } else {
      setLeftMonth((m) => m + 1);
    }
  };

  // Preset button handlers
  const handleSelectPreset = (newPreset: '7days' | '15days') => {
    const end = new Date(REF_YEAR, REF_MONTH, REF_DATE);
    const start = new Date(REF_YEAR, REF_MONTH, REF_DATE);

    if (newPreset === '7days') {
      start.setDate(end.getDate() - 6); // 23/09/2026 - 29/09/2026 (7 days)
    } else {
      start.setDate(end.getDate() - 14); // 15/09/2026 - 29/09/2026 (15 days)
    }

    setTempStart(start);
    setTempEnd(end);
    setIsSelectingRange(false);
    onRangeChange(formatDateString(start), formatDateString(end), newPreset);
    setIsOpen(false);
  };

  const handleToggleCustom = () => {
    setIsOpen((prev) => !prev);
    setIsSelectingRange(false);
  };

  // Day selection logic in calendar
  const handleDayClick = (date: Date) => {
    if (!isSelectingRange) {
      setTempStart(date);
      setTempEnd(date);
      setIsSelectingRange(true);
    } else {
      if (date < tempStart) {
        setTempEnd(tempStart);
        setTempStart(date);
      } else {
        setTempEnd(date);
      }
      setIsSelectingRange(false);
    }
  };

  const handleConfirm = () => {
    let finalStart = tempStart;
    let finalEnd = tempEnd;

    if (!finalEnd || finalStart > finalEnd) {
      finalEnd = finalStart;
    }

    onRangeChange(formatDateString(finalStart), formatDateString(finalEnd), 'custom');
    setIsOpen(false);
    setIsSelectingRange(false);
  };

  // Calculate inclusive days count for the footer preview
  const previewMin = tempStart <= tempEnd ? tempStart : tempEnd;
  const previewMax = tempStart <= tempEnd ? tempEnd : tempStart;
  const diffTime = previewMax.getTime() - previewMin.getTime();
  const previewDaysCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

  // Formatted range text displayed in top bar: e.g. "T3, 15/09/2026 - T3, 29/09/2026"
  const currentStartObj = parseDateString(startDate);
  const currentEndObj = parseDateString(endDate);
  const displayLabel = `${formatVNWeekday(currentStartObj)}, ${formatDateDMY(currentStartObj)} - ${formatVNWeekday(currentEndObj)}, ${formatDateDMY(currentEndObj)}`;

  // Determine active range bounds including hover state
  const effectiveRangeMin = isSelectingRange && hoverDate
    ? (hoverDate < tempStart ? hoverDate : tempStart)
    : (tempStart <= tempEnd ? tempStart : tempEnd);

  const effectiveRangeMax = isSelectingRange && hoverDate
    ? (hoverDate > tempStart ? hoverDate : tempStart)
    : (tempStart <= tempEnd ? tempEnd : tempStart);

  // Generate 42 days grid for a month view
  const renderMonthGrid = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding days to make 42 cells (6 rows x 7 cols)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return (
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {days.map((item, idx) => {
          const date = item.date;
          const time = date.getTime();
          const isStart =
            effectiveRangeMin &&
            date.toDateString() === effectiveRangeMin.toDateString();
          const isEnd =
            effectiveRangeMax &&
            date.toDateString() === effectiveRangeMax.toDateString();
          const isInRange =
            effectiveRangeMin &&
            effectiveRangeMax &&
            time >= effectiveRangeMin.getTime() &&
            time <= effectiveRangeMax.getTime();

          const isCurrentMonth = item.isCurrentMonth;

          return (
            <div
              key={idx}
              onClick={() => handleDayClick(date)}
              onMouseEnter={() => isSelectingRange && setHoverDate(date)}
              className="relative p-0.5 cursor-pointer group flex items-center justify-center h-8 select-none"
            >
              {/* Highlight strip for in-range days */}
              {isInRange && !isStart && !isEnd && (
                <div className="absolute inset-0 bg-blue-50/70" />
              )}
              {isStart && effectiveRangeMin.getTime() !== effectiveRangeMax.getTime() && (
                <div className="absolute inset-y-0 right-0 w-1/2 bg-blue-50/70" />
              )}
              {isEnd && effectiveRangeMin.getTime() !== effectiveRangeMax.getTime() && (
                <div className="absolute inset-y-0 left-0 w-1/2 bg-blue-50/70" />
              )}

              {/* Day Cell */}
              <div
                className={`relative z-10 w-7 h-7 flex items-center justify-center text-xs transition-all ${
                  isStart || isEnd
                    ? 'border-2 border-blue-400 rounded-lg text-blue-600 font-bold bg-white shadow-2xs'
                    : isInRange
                    ? 'text-blue-700 font-semibold'
                    : isCurrentMonth
                    ? 'text-gray-700 hover:bg-gray-100 rounded-lg'
                    : 'text-gray-300 line-through decoration-gray-300'
                }`}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Top Filter Bar Matching Screenshot */}
      <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-2xs overflow-hidden">
        {/* Date text: Clickable to toggle dropdown */}
        <button
          type="button"
          onClick={handleToggleCustom}
          className="px-3.5 py-1.5 text-xs text-gray-800 font-medium hover:bg-gray-50/80 transition-colors cursor-pointer select-none"
          title="Bấm để mở lịch chọn ngày"
        >
          {displayLabel}
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-gray-200" />

        {/* 7 NGÀY button */}
        <button
          type="button"
          onClick={() => handleSelectPreset('7days')}
          className={`px-3.5 py-1.5 text-xs transition-all cursor-pointer select-none ${
            preset === '7days'
              ? 'bg-[#ff2d55] text-white font-bold shadow-xs'
              : 'text-gray-700 font-medium hover:bg-gray-50'
          }`}
        >
          7 NGÀY
        </button>

        {/* 15 NGÀY button */}
        <button
          type="button"
          onClick={() => handleSelectPreset('15days')}
          className={`px-3.5 py-1.5 text-xs transition-all cursor-pointer select-none ${
            preset === '15days'
              ? 'bg-[#ff2d55] text-white font-bold shadow-xs'
              : 'text-gray-700 font-medium hover:bg-gray-50'
          }`}
        >
          15 NGÀY
        </button>

        {/* TÙY CHỈNH button */}
        <button
          type="button"
          onClick={handleToggleCustom}
          className={`px-3.5 py-1.5 text-xs transition-all cursor-pointer select-none ${
            preset === 'custom'
              ? 'bg-[#ff2d55] text-white font-bold shadow-xs'
              : 'text-gray-700 font-medium hover:bg-gray-50'
          }`}
        >
          TÙY CHỈNH
        </button>
      </div>

      {/* DROPDOWN CALENDAR: Anchored right below the button, NOT a full-screen popup */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-200/90 z-50 p-4 w-[520px] animate-in fade-in duration-100">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            {/* Left Month Calendar */}
            <div className="pr-3.5">
              {/* Header */}
              <div className="flex items-center justify-between mb-2 text-xs">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  title="Tháng trước"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="font-semibold text-gray-800">
                  {MONTH_NAMES[leftMonth]} {leftYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  title="Tháng sau"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 text-center mb-1">
                {WEEKDAY_NAMES.map((name, i) => (
                  <div key={i} className="text-[11px] font-medium text-gray-400 py-1">
                    {name}
                  </div>
                ))}
              </div>

              {/* Month Grid */}
              {renderMonthGrid(leftYear, leftMonth)}
            </div>

            {/* Right Month Calendar */}
            <div className="pl-3.5">
              {/* Header: Next month (month title in red/accent as in screenshot) */}
              <div className="flex items-center justify-between mb-2 text-xs">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  title="Tháng trước"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="font-bold text-[#ff2d55]">
                  {MONTH_NAMES[rightMonth]} {rightYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  title="Tháng sau"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 text-center mb-1">
                {WEEKDAY_NAMES.map((name, i) => (
                  <div key={i} className="text-[11px] font-medium text-gray-400 py-1">
                    {name}
                  </div>
                ))}
              </div>

              {/* Month Grid */}
              {renderMonthGrid(rightYear, rightMonth)}
            </div>
          </div>

          {/* Footer Bar with "Xác nhận" button exactly as in the user screenshot */}
          <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="text-[11px] text-gray-500 font-medium">
              Đã chọn: <span className="font-bold text-gray-800">{previewDaysCount} ngày</span> ({formatDateDMY(previewMin)} - {formatDateDMY(previewMax)})
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-1.5 bg-[#bfdbfe] hover:bg-[#93c5fd] active:bg-[#60a5fa] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
