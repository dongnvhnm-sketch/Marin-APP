import React, { useState } from 'react';
import { X, Search, GripVertical, Check, ArrowUp, ArrowDown } from 'lucide-react';

export interface ColumnDef {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

export const ALL_ORDER_COLUMNS: ColumnDef[] = [
  { id: 'trackingNumber', label: 'Mã vận đơn', align: 'left' },
  { id: 'orderCode', label: 'Mã đơn hàng', align: 'left' },
  { id: 'storeName', label: 'Tên cửa hàng', align: 'left' },
  { id: 'customerName', label: 'Khách hàng', align: 'left' },
  { id: 'customerAddress', label: 'Địa chỉ', align: 'left' },
  { id: 'customerArea', label: 'Khu vực', align: 'left' },
  { id: 'productName', label: 'Thông tin sản phẩm', align: 'left' },
  { id: 'itemPrice', label: 'Tiền hàng', align: 'right' },
  { id: 'serviceFee', label: 'Phí dịch vụ giao hàng', align: 'right' },
  { id: 'orderValue', label: 'Giá trị đơn hàng', align: 'right' },
  { id: 'codAmount', label: 'Tiền thu hộ', align: 'right' },
  { id: 'status', label: 'Trạng thái', align: 'center' },
  { id: 'printCount', label: 'Số lần in đơn', align: 'center' },
  { id: 'notes', label: 'Ghi chú', align: 'left' },
  { id: 'createdAt', label: 'Thời gian tạo', align: 'left' },
];

export const DEFAULT_VISIBLE_COLUMNS: string[] = [
  'trackingNumber',
  'orderCode',
  'storeName',
  'itemPrice',
  'serviceFee',
  'orderValue',
  'codAmount',
  'status',
  'printCount',
];

interface ColumnCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: string[];
  onApply: (columns: string[]) => void;
}

export const ColumnCustomizeModal: React.FC<ColumnCustomizeModalProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  onApply,
}) => {
  // Temporary state inside modal before clicking "Áp dụng"
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(visibleColumns);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  // Toggle selection from left list
  const handleToggleColumn = (colId: string) => {
    if (selectedColumnIds.includes(colId)) {
      // Cannot uncheck if it's the last remaining column
      if (selectedColumnIds.length <= 1) return;
      setSelectedColumnIds(selectedColumnIds.filter((id) => id !== colId));
    } else {
      setSelectedColumnIds([...selectedColumnIds, colId]);
    }
  };

  // Move item up in order
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...selectedColumnIds];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setSelectedColumnIds(updated);
  };

  // Move item down in order
  const handleMoveDown = (index: number) => {
    if (index === selectedColumnIds.length - 1) return;
    const updated = [...selectedColumnIds];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setSelectedColumnIds(updated);
  };

  // Drag and drop handling
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...selectedColumnIds];
    const item = updated.splice(draggedIndex, 1)[0];
    updated.splice(index, 0, item);
    setDraggedIndex(index);
    setSelectedColumnIds(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleResetToDefault = () => {
    setSelectedColumnIds(DEFAULT_VISIBLE_COLUMNS);
  };

  const handleConfirm = () => {
    onApply(selectedColumnIds);
    onClose();
  };

  // Filter columns on the left
  const filteredColumns = ALL_ORDER_COLUMNS.filter((col) =>
    col.label.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header matching screenshot */}
        <div className="p-5 pb-3 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">
              Tùy chỉnh cột
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Chọn các cột sẽ hiển thị hoặc kéo chúng vào theo thứ tự khác.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2 Panels Body matching screenshot */}
        <div className="px-5 py-2 grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 overflow-y-auto">
          {/* Left Panel: Chọn cột mà bạn muốn hiển thị */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-800">
              Chọn cột mà bạn muốn hiển thị
            </h3>

            {/* Bordered box with search & checkbox list */}
            <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-3 shadow-2xs">
              {/* Search box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Chọn cột mà bạn muốn hiển thị"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ef4444]"
                />
                <Search size={15} className="absolute right-2.5 top-2.5 text-gray-400" />
              </div>

              {/* Checkbox list */}
              <div className="max-h-[290px] overflow-y-auto space-y-1.5 pr-1">
                {filteredColumns.map((col) => {
                  const isChecked = selectedColumnIds.includes(col.id);
                  return (
                    <div
                      key={col.id}
                      onClick={() => handleToggleColumn(col.id)}
                      className="flex items-center space-x-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer select-none transition-colors"
                    >
                      {/* Custom green checkbox like screenshot */}
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-[#10b981] border-[#10b981] text-white'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>

                      <span
                        className={`text-xs ${
                          isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'
                        }`}
                      >
                        {col.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Sắp xếp lại thứ tự các cột */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-800">
              Sắp xếp lại thứ tự các cột
            </h3>

            {/* List with drag handles */}
            <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1">
              {selectedColumnIds.map((colId, index) => {
                const colDef = ALL_ORDER_COLUMNS.find((c) => c.id === colId);
                if (!colDef) return null;

                return (
                  <div
                    key={colId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200/90 rounded-xl text-xs transition-all shadow-2xs group ${
                      draggedIndex === index ? 'opacity-40 border-dashed border-blue-400' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 cursor-grab active:cursor-grabbing">
                      <GripVertical
                        size={15}
                        className="text-gray-400 group-hover:text-gray-600"
                      />
                      <span className="text-gray-800 font-medium">{colDef.label}</span>
                    </div>

                    {/* Up/Down buttons for quick click reordering */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(index);
                        }}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-gray-100"
                        title="Di chuyển lên"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(index);
                        }}
                        disabled={index === selectedColumnIds.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded hover:bg-gray-100"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer matching screenshot */}
        <div className="p-4 px-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer"
          >
            Đặt về mặc định
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-[#0f172a] hover:bg-gray-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
