import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Check, Loader2 } from 'lucide-react';

export interface LocationOption {
  value: number;
  label: string;
  code?: string | number;
  subLabel?: string;
}

interface SearchableLocationSelectProps {
  options: LocationOption[];
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  required?: boolean;
  emptyText?: string;
  id?: string;
}

// Hàm chuẩn hóa chuỗi tiếng Việt (bỏ dấu) để tìm kiếm linh hoạt
function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

export const SearchableLocationSelect: React.FC<SearchableLocationSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '-- Chọn --',
  disabled = false,
  isLoading = false,
  required = false,
  emptyText = 'Không tìm thấy kết quả phù hợp',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Tìm option hiện tại tương ứng với value
  const selectedOption = useMemo(() => {
    if (value === '' || value === undefined || value === null) return null;
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  // Chuỗi đại diện cho option đang chọn
  const selectedLabel = useMemo(() => {
    if (!selectedOption) return '';
    return selectedOption.code
      ? `${selectedOption.label} (${selectedOption.code})`
      : selectedOption.label;
  }, [selectedOption]);

  // Giá trị hiển thị trong input: nếu đang mở và user đã gõ thì lấy userQuery, ngược lại lấy selectedLabel
  const displayValue = userQuery !== null ? userQuery : selectedLabel;

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setUserQuery(null);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Lọc danh sách options theo từ khóa người dùng gõ
  const filteredOptions = useMemo(() => {
    if (!isOpen || userQuery === null || !userQuery.trim()) {
      return options;
    }

    // Nếu query trùng với tên option đã chọn thì hiển thị toàn bộ
    if (userQuery === selectedLabel || userQuery === selectedOption?.label) {
      return options;
    }

    const normQuery = normalizeVietnamese(userQuery);

    return options
      .filter((opt) => {
        const normLabel = normalizeVietnamese(opt.label);
        const normCode = opt.code ? normalizeVietnamese(String(opt.code)) : '';
        const normSub = opt.subLabel ? normalizeVietnamese(opt.subLabel) : '';

        // Match tên hoặc mã hoặc subLabel
        return (
          normLabel.includes(normQuery) ||
          normCode.includes(normQuery) ||
          normSub.includes(normQuery)
        );
      })
      .sort((a, b) => {
        // Ưu tiên các mục bắt đầu bằng từ khóa
        const aNorm = normalizeVietnamese(a.label);
        const bNorm = normalizeVietnamese(b.label);
        const aStarts = aNorm.startsWith(normQuery);
        const bStarts = bNorm.startsWith(normQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      });
  }, [options, userQuery, isOpen, selectedLabel, selectedOption]);

  // Cuộn đến mục đang được highlight bằng bàn phím
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }, [highlightedIndex]);

  // Xử lý chọn option
  const handleSelectOption = (opt: LocationOption) => {
    onChange(opt.value);
    setUserQuery(null);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Xử lý xóa lựa chọn
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setUserQuery('');
    setIsOpen(true);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Điều hướng bằng bàn phím
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setUserQuery('');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setUserQuery(null);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setUserQuery(null);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      {/* Input box */}
      <div
        className={`relative flex items-center border rounded-lg transition-colors bg-white ${
          disabled
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            : isOpen
            ? 'border-[#ef4444] ring-1 ring-[#ef4444]'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="pl-2.5 text-gray-400 shrink-0">
          <Search size={13} className={isOpen ? 'text-[#ef4444]' : 'text-gray-400'} />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={displayValue}
          disabled={disabled}
          placeholder={disabled ? placeholder : `${placeholder} (gõ để tìm...)`}
          onChange={(e) => {
            setUserQuery(e.target.value);
            setHighlightedIndex(-1);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              // Select toàn bộ text khi focus để dễ gõ từ mới
              inputRef.current?.select();
            }
          }}
          onKeyDown={handleKeyDown}
          className="w-full text-xs px-2 py-2 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
          autoComplete="off"
        />

        <div className="flex items-center pr-2 space-x-1 shrink-0">
          {isLoading && (
            <Loader2 size={13} className="animate-spin text-[#ef4444]" />
          )}

          {!disabled && value !== '' && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              title="Xóa lựa chọn"
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={12} />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen((prev) => {
                  const next = !prev;
                  if (!next) {
                    setUserQuery(null);
                    setHighlightedIndex(-1);
                  }
                  return next;
                });
                inputRef.current?.focus();
              }
            }}
            className="p-0.5 text-gray-400 hover:text-gray-600 transition-transform duration-200"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#ef4444]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Hidden input to enforce html form validation if required */}
      {required && (
        <input
          type="text"
          value={value === '' ? '' : String(value)}
          required
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown danh sách gợi ý */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header hiển thị số lượng */}
          <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
            <span>
              {filteredOptions.length > 0
                ? `Tìm thấy ${filteredOptions.length} địa danh`
                : 'Không có địa danh'}
            </span>
            <span className="text-gray-400">Gõ tên hoặc mã để lọc</span>
          </div>

          <ul
            ref={listRef}
            className="max-h-56 overflow-y-auto divide-y divide-gray-50 scrollbar-thin scrollbar-thumb-gray-200"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-gray-500">
                <p className="font-medium">{emptyText}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Thử tìm kiếm với từ khóa khác
                </p>
              </li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-rose-50 text-[#ef4444] font-semibold'
                        : isHighlighted
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 pr-2 truncate">
                      <div className="truncate">{opt.label}</div>
                      {opt.subLabel && (
                        <div className="text-[10px] text-gray-400 truncate">
                          {opt.subLabel}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {opt.code && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isSelected
                              ? 'bg-rose-100 text-[#ef4444]'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {opt.code}
                        </span>
                      )}
                      {isSelected && <Check size={13} className="text-[#ef4444]" />}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
