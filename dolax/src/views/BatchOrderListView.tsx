import React, { useState, useRef, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  Clock,
  HelpCircle,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  RotateCw,
  Calendar,
  MoreVertical,
  Layers,
  Copy,
  Plus,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { TablePagination } from '../components/TablePagination';
import { Order, BatchOrderHistoryItem } from '../types';
import { calculateShippingFeeByWeight } from '../utils/feeCalculator';
import {
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_ROWS,
  estimateCarrierCost,
  parseVndAmount,
  parseWeightKg,
} from '../utils/moneyRules';
import {
  BatchOrderEditModal,
  BatchOrderRow,
} from '../components/BatchOrderEditModal';

export const BatchOrderListView: React.FC = () => {
  const {
    batchOrders,
    orders,
    addBatchOrder,
    stores,
    currentUser,
    formatVND,
    setCurrentPage,
  } = useApp();

  // Mode: 'create' (Thực hiện lên đơn hàng loạt - image_3507d0b9) | 'history' (Lịch sử - image_55449683)
  const [viewMode, setViewMode] = useState<'create' | 'history'>('create');

  // Active tab in create mode: 'orders' | 'split_address'
  const [activeTab, setActiveTab] = useState<'orders' | 'split_address'>('orders');

  // Filter in create mode: 'all' | 'valid' | 'error'
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'error'>('all');

  // Batch rows in create mode - initial state is empty until user uploads a file
  const [batchRows, setBatchRows] = useState<BatchOrderRow[]>([]);

  // Selected row IDs for checkboxes
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Editing order for BatchOrderEditModal
  const [editingRow, setEditingRow] = useState<BatchOrderRow | null>(null);

  // Tooltip hover state for error (!) icon
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  // Control panel settings
  const [selectedCarrier, setSelectedCarrier] = useState('J&T Express');
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || 'CH0001001');
  const [pickupRequest, setPickupRequest] = useState('Gửi tại bưu cục');
  const [expectedPickupTime, setExpectedPickupTime] = useState('');
  const [latestPickupTime, setLatestPickupTime] = useState('');
  const [partialReceipt, setPartialReceipt] = useState('Có ký nhận 1 phần');

  // Pagination for create mode table
  const [createPage, setCreatePage] = useState(1);
  const [createPageSize, setCreatePageSize] = useState(20);

  // Toast message
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Hidden file input ref for "Tải lên file khác"
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History mode search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotification, setShowNotification] = useState(true);
  const [showExtraFilters, setShowExtraFilters] = useState(false);
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [codMethodFilter, setCodMethodFilter] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(20);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Counts
  const validCount = useMemo(() => batchRows.filter((r) => r.isValid).length, [batchRows]);
  const errorCount = useMemo(() => batchRows.filter((r) => !r.isValid).length, [batchRows]);

  // Filtered rows for create mode
  const filteredCreateRows = useMemo(() => {
    if (activeTab === 'split_address') {
      return batchRows.filter((r) => !r.isValid);
    }
    if (statusFilter === 'valid') {
      return batchRows.filter((r) => r.isValid);
    }
    if (statusFilter === 'error') {
      return batchRows.filter((r) => !r.isValid);
    }
    return batchRows;
  }, [batchRows, activeTab, statusFilter]);

  // Paginated create rows
  const paginatedCreateRows = useMemo(() => {
    const startIndex = (createPage - 1) * createPageSize;
    return filteredCreateRows.slice(startIndex, startIndex + createPageSize);
  }, [filteredCreateRows, createPage, createPageSize]);

  // Select all handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredCreateRows.map((r) => r.id));
      setSelectedRowIds(allIds);
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRowIds(next);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    setBatchRows((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      return filtered.map((r, idx) => ({ ...r, rowNumber: idx + 1 }));
    });
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showToast('success', 'Đã xóa đơn hàng khỏi danh sách tải lên.');
  };

  // Delete all selected rows
  const handleDeleteSelectedRows = () => {
    if (selectedRowIds.size === 0) return;
    const countToDelete = selectedRowIds.size;
    setBatchRows((prev) => {
      const remaining = prev.filter((r) => !selectedRowIds.has(r.id));
      return remaining.map((r, idx) => ({ ...r, rowNumber: idx + 1 }));
    });
    setSelectedRowIds(new Set());
    showToast('success', `Đã xóa ${countToDelete} đơn hàng đã chọn khỏi danh sách tải lên.`);
  };

  // Save edited row from BatchOrderEditModal
  const handleSaveEditedOrder = (updated: BatchOrderRow) => {
    setBatchRows((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...updated, isValid: true, errorReason: undefined } : r))
    );
    showToast('success', `Đã cập nhật đơn hàng thành công (Người nhận: ${updated.recipientName})`);
  };

  // Excel template download
  const handleDownloadTemplate = () => {
    const sampleHeaders = [
      'Mã đơn hàng',
      'Tên người nhận',
      'Số điện thoại',
      'Địa chỉ nhận',
      'Tỉnh/Thành phố',
      'Quận/Huyện',
      'Phường/Xã',
      'Tên hàng hóa',
      'Khối lượng (gram)',
      'Tiền COD (VNĐ)',
      'Giá trị hàng (VNĐ)',
      'Ghi chú',
    ];

    const sampleRows = [
      [
        'DH-BATCH-001',
        'Ngô Anh Thuấn',
        '0908025485',
        '142 trần phú',
        'Lâm Đồng',
        'Bảo Lâm',
        'Xã Bảo Lâm 1',
        '1 KÍNH LÃO 1,5 ĐỘ',
        1000,
        250000,
        250000,
        'Giao giờ hành chính',
      ],
      [
        'DH-BATCH-002',
        'Nguyễn Văn Hiếu',
        '0377087856',
        '112 thích Thiện chiếu',
        'Đà Nẵng',
        'Sơn Trà',
        'Phường Sơn Trà',
        '1 KÍNH LÃO 1,5 ĐỘ ĐEN',
        1000,
        250000,
        250000,
        'Cho xem hàng',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([sampleHeaders, ...sampleRows]);
    ws['!cols'] = [
      { wch: 18 },
      { wch: 22 },
      { wch: 15 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Len_Don_Hang_Loat');
    XLSX.writeFile(wb, 'Mau_Len_Don_Hang_Loat_Dolax.xlsx');
  };

  // Handle uploading a new Excel file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      showToast('error', `File quá lớn (tối đa ${MAX_IMPORT_FILE_BYTES / 1024 / 1024}MB).`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const uploadStore = stores.find((s) => s.id === selectedStoreId);
    if (!uploadStore) {
      showToast('error', 'Vui lòng chọn cửa hàng trước khi tải file lên.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
          showToast('error', 'File không chứa dòng đơn hàng nào.');
          return;
        }
        if (rawJson.length - 1 > MAX_IMPORT_ROWS) {
          showToast('error', `File có quá nhiều dòng (tối đa ${MAX_IMPORT_ROWS} đơn mỗi lần).`);
          return;
        }

        const headers: string[] = rawJson[0].map((h: any) => String(h || '').trim().toLowerCase());
        const findColIdx = (keywords: string[]) =>
          headers.findIndex((h) => keywords.some((k) => h.includes(k)));

        const idxOrderCode = findColIdx(['mã đơn', 'order', 'ma don']);
        const idxName = findColIdx(['tên người nhận', 'người nhận', 'khách hàng', 'tên']);
        const idxPhone = findColIdx(['số điện thoại', 'sđt', 'điện thoại', 'phone']);
        const idxAddress = findColIdx(['địa chỉ nhận', 'địa chỉ', 'dia chi', 'address']);
        const idxProvince = findColIdx(['tỉnh', 'thành phố', 'province', 'city']);
        const idxDistrict = findColIdx(['quận', 'huyện', 'district']);
        const idxWard = findColIdx(['phường', 'xã', 'ward']);
        const idxProduct = findColIdx(['hàng hóa', 'sản phẩm', 'product', 'tên hàng']);
        const idxWeight = findColIdx(['khối lượng', 'trọng lượng', 'weight', 'gram', 'kg']);
        const idxCod = findColIdx(['tiền cod', 'cod', 'thu hộ']);
        const idxItemPrice = findColIdx(['giá trị hàng', 'tiền hàng', 'giá']);
        const idxNote = findColIdx(['ghi chú', 'lưu ý', 'note']);

        const rowsParsed: BatchOrderRow[] = rawJson.slice(1).map((row, index) => {
          const rawPhone = String(row[idxPhone >= 0 ? idxPhone : 2] || '').trim();
          const cleanPhone = rawPhone.replace(/\D/g, '');
          const recipientName = String(row[idxName >= 0 ? idxName : 1] || '').trim();
          const rawAddress = String(row[idxAddress >= 0 ? idxAddress : 3] || '').trim();
          const province = idxProvince >= 0 ? String(row[idxProvince] || '').trim() : '';
          const district = idxDistrict >= 0 ? String(row[idxDistrict] || '').trim() : '';
          const ward = idxWard >= 0 ? String(row[idxWard] || '').trim() : '';

          let fullAddr = rawAddress;
          if (province || district || ward) {
            fullAddr = [rawAddress, ward, district, province].filter(Boolean).join(', ');
          }

          const productName = String(row[idxProduct >= 0 ? idxProduct : 7] || 'Hàng tiêu dùng').trim();
          // Cột khối lượng mặc định là gram (theo file mẫu); nếu tiêu đề ghi "kg" thì là kilogram
          const weightUnit: 'g' | 'kg' = idxWeight >= 0 && headers[idxWeight].includes('kg') ? 'kg' : 'g';
          const weightKg = parseWeightKg(row[idxWeight >= 0 ? idxWeight : 8], weightUnit);
          // Ô COD trống nghĩa là không thu hộ (0). Hỗ trợ định dạng "1.500.000" / "1,500,000"
          const cod = parseVndAmount(row[idxCod >= 0 ? idxCod : 9]) ?? 0;
          // Giá trị hàng: lấy theo cột; nếu không có thì dùng tiền COD; không tự điền số giả
          const itemPrice = parseVndAmount(row[idxItemPrice >= 0 ? idxItemPrice : 10]) ?? cod;
          const note = idxNote >= 0 ? String(row[idxNote] || '').trim() : '';
          const orderCode =
            idxOrderCode >= 0 && row[idxOrderCode]
              ? String(row[idxOrderCode]).trim()
              : '---';

          // Validate
          const hasValidPhone = cleanPhone.length >= 9 && cleanPhone.length <= 11;
          const hasValidAddress = (ward || district || province) || fullAddr.includes('phường') || fullAddr.includes('quận') || fullAddr.includes('tp');
          const errors: string[] = [];
          if (!hasValidPhone) errors.push('Số điện thoại không hợp lệ');
          if (!recipientName) errors.push('Thiếu tên người nhận');
          if (!hasValidAddress) errors.push('Khu vực chưa đầy đủ');
          if (weightKg === undefined) errors.push('Thiếu hoặc sai khối lượng');
          const isValid = errors.length === 0;

          const area = isValid
            ? [province, district, ward].filter(Boolean).join('/') || 'Đã chuẩn hóa'
            : 'Chưa hợp lệ';

          // Phí dịch vụ theo bảng cước của cửa hàng đang chọn (không còn con số cố định 15.000đ)
          const serviceFee =
            weightKg !== undefined
              ? calculateShippingFeeByWeight(weightKg, uploadStore.feeBrackets, uploadStore.defaultFee).fee
              : 0;

          return {
            id: `upload-${Date.now()}-${index}`,
            rowNumber: index + 1,
            orderCode,
            recipientName: recipientName || 'Chưa rõ tên',
            phone: cleanPhone || rawPhone,
            address: fullAddr || 'Chưa có địa chỉ',
            area,
            productName,
            itemPrice,
            serviceFee,
            totalOrderValue: itemPrice + serviceFee,
            cod,
            weightKg: weightKg ?? 0,
            isValid,
            errorReason: !isValid ? errors.join('; ') : undefined,
            provinceName: province,
            districtName: district,
            wardName: ward,
            note,
          };
        }).filter((r) => r.recipientName !== 'Chưa rõ tên' || r.phone);

        if (rowsParsed.length > 0) {
          setBatchRows(rowsParsed);
          setCreatePage(1);
          showToast('success', `Đã tải lên thành công ${rowsParsed.length} dòng đơn hàng.`);
        }
      } catch (err: any) {
        showToast('error', 'Lỗi phân tích file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Create batch orders into system
  const handleCreateOrders = () => {
    const validOrders = batchRows.filter((r) => r.isValid);
    if (validOrders.length === 0) {
      showToast('error', 'Không có đơn hàng hợp lệ nào để tạo. Vui lòng chỉnh sửa các đơn lỗi trước.');
      return;
    }

    // Không dự phòng về stores[0]: đơn hàng loạt gắn nhầm cửa hàng sẽ tính sai phí và đối soát
    const store = stores.find((s) => s.id === selectedStoreId);
    if (!store) {
      showToast('error', 'Không tìm thấy cửa hàng đã chọn. Vui lòng chọn lại cửa hàng.');
      return;
    }
    const usedTracking = new Set(orders.map((o) => o.trackingNumber));
    const nextTracking = (): string => {
      let t = '';
      do {
        t = `#8028${Math.floor(10000000 + Math.random() * 90000000)}`;
      } while (usedTracking.has(t));
      usedTracking.add(t);
      return t;
    };
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newOrders: Order[] = validOrders.map((r) => ({
      trackingNumber: nextTracking(),
      orderCode: r.orderCode !== '---' ? `#${r.orderCode.replace(/^#/, '')}` : `#9136${Math.floor(10000 + Math.random() * 90000)}`,
      storeId: store.id,
      storeName: store.name,
      customerName: r.recipientName,
      customerPhone: r.phone,
      customerAddress: r.address,
      productName: r.productName,
      weightKg: r.weightKg,
      itemPrice: r.itemPrice,
      // Tính lại phí theo bảng cước hiện tại của cửa hàng (cửa hàng có thể đã đổi sau khi tải file)
      serviceFee: calculateShippingFeeByWeight(r.weightKg, store.feeBrackets, store.defaultFee).fee,
      actualShippingCost: estimateCarrierCost(
        calculateShippingFeeByWeight(r.weightKg, store.feeBrackets, store.defaultFee).fee,
      ),
      costIsEstimated: true,
      // Giá trị hàng hóa khai báo (không cộng phí vận chuyển), dùng để tính phí bảo hiểm
      orderValue: r.itemPrice,
      codAmount: r.cod,
      status: 'sent',
      printCount: 0,
      createdAt: formattedDate,
      carrier: selectedCarrier,
      notes: r.note,
      partialReceipt: partialReceipt.includes('Có'),
    }));

    const batchItem: BatchOrderHistoryItem = {
      id: `batch-${Date.now()}`,
      fileName: `File_len_don_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.xlsx`,
      fileSize: '48.5 KB',
      createdAt: formattedDate,
      codMethod: 'Shop tự nhập tiền thu hộ (COD)',
      carrier: selectedCarrier,
      createdByUser: currentUser?.name || 'Dong',
      successCount: validOrders.length,
      totalCount: batchRows.length,
      statusText: `${validOrders.length}/${batchRows.length}`,
    };

    addBatchOrder(batchItem, newOrders);
    showToast('success', `Đã tạo thành công ${validOrders.length} đơn hàng vào hệ thống!`);
    setTimeout(() => {
      setCurrentPage('orders');
    }, 1200);
  };

  // Filtered batches for history mode
  const filteredBatches = useMemo(() => {
    return batchOrders.filter((b) => {
      const matchSearch =
        searchTerm.trim() === '' || b.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCarrier = carrierFilter === 'all' || b.carrier === carrierFilter;
      const matchCod =
        codMethodFilter === 'all' || b.codMethod.toLowerCase().includes(codMethodFilter.toLowerCase());
      return matchSearch && matchCarrier && matchCod;
    });
  }, [batchOrders, searchTerm, carrierFilter, codMethodFilter]);

  const paginatedBatches = useMemo(() => {
    const startIndex = (historyPage - 1) * historyPageSize;
    return filteredBatches.slice(startIndex, startIndex + historyPageSize);
  }, [filteredBatches, historyPage, historyPageSize]);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      {/* Toast popup */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hidden file input for "Tải lên file khác" */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* SCREEN HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            Lên đơn hàng loạt
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {viewMode === 'create' ? 'Thực hiện lên đơn hàng loạt' : 'Lịch sử lên đơn hàng loạt'}
          </p>
        </div>

        {/* Top Right Action Buttons matching image_3507d0b9.png */}
        <div className="flex items-center space-x-2">
          {/* Refresh button */}
          <button
            type="button"
            onClick={() => {
              setBatchRows([]);
              setSelectedRowIds(new Set());
              setCreatePage(1);
              showToast('success', 'Đã làm mới dữ liệu đơn hàng loạt.');
            }}
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Làm mới dữ liệu"
          >
            <RotateCw size={14} />
          </button>

          {/* Tải file nhập mẫu */}
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
            title="Tải file mẫu Excel"
          >
            <Download size={13} className="text-gray-500" />
            <span>Tải file nhập mẫu</span>
          </button>

          {/* Switch to Lịch sử lên đơn <-> Thực hiện lên đơn hàng loạt */}
          {viewMode === 'create' ? (
            <button
              type="button"
              onClick={() => setViewMode('history')}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#111827] hover:bg-black rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Clock size={13} />
              <span>Lịch sử lên đơn</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setViewMode('create')}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#111827] hover:bg-black rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <FileSpreadsheet size={13} />
              <span>Thực hiện lên đơn hàng loạt</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE: CREATE (Màn hình chính theo ảnh image_3507d0b9.png) */}
      {/* ========================================================================= */}
      {viewMode === 'create' ? (
        <div className="space-y-3">
          {/* Tabs row: "Tạo đơn gửi giao hàng" và "Tách địa chỉ (6)" */}
          <div className="flex items-center space-x-6 border-b border-gray-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('orders');
                setStatusFilter('all');
                setCreatePage(1);
              }}
              className={`pb-2.5 transition-colors relative cursor-pointer ${
                activeTab === 'orders'
                  ? 'text-gray-900 font-bold border-b-2 border-red-500'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Tạo đơn gửi giao hàng
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('split_address');
                setCreatePage(1);
              }}
              className={`pb-2.5 flex items-center space-x-1.5 transition-colors relative cursor-pointer ${
                activeTab === 'split_address'
                  ? 'text-gray-900 font-bold border-b-2 border-red-500'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>Tách địa chỉ</span>
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {errorCount}
              </span>
            </button>
          </div>

          {/* Control Panel: Cấu hình vận chuyển matching image_3507d0b9.png */}
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Đối tác vận chuyển */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Đối tác vận chuyển
                </label>
                <select
                  value={selectedCarrier}
                  onChange={(e) => setSelectedCarrier(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white focus:outline-none focus:border-red-500 text-gray-800"
                >
                  <option value="J&T Express">J&T Express</option>
                  <option value="Viettel Post">Viettel Post</option>
                  <option value="Giao Hàng Nhanh">Giao Hàng Nhanh</option>
                </select>
              </div>

              {/* Điểm gửi hàng */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Điểm gửi hàng
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white focus:outline-none focus:border-red-500 text-gray-800"
                >
                  {stores.length > 0 ? (
                    stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  ) : (
                    <option value="CH0001001">Dong Test</option>
                  )}
                </select>
              </div>

              {/* Yêu cầu lấy hàng */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Yêu cầu lấy hàng
                </label>
                <select
                  value={pickupRequest}
                  onChange={(e) => setPickupRequest(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white focus:outline-none focus:border-red-500 text-gray-800"
                >
                  <option value="Gửi tại bưu cục">Gửi tại bưu cục</option>
                  <option value="Đến lấy hàng">Đến lấy hàng</option>
                </select>
              </div>

              {/* Thời gian lấy hàng dự kiến */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Thời gian lấy hàng dự kiến
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={expectedPickupTime}
                    onChange={(e) => setExpectedPickupTime(e.target.value)}
                    placeholder="Chọn thời gian hẹn bắt đầu lấy hàng"
                    className="w-full text-xs border border-gray-200 rounded-lg pl-3 pr-8 py-2 bg-white focus:outline-none focus:border-red-500 text-gray-800 placeholder:text-gray-400"
                  />
                  <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Thời gian hẹn trễ nhất có thể lấy hàng */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Thời gian hẹn trễ nhất có thể lấy hàng
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={latestPickupTime}
                    onChange={(e) => setLatestPickupTime(e.target.value)}
                    placeholder="Chọn thời gian hẹn trễ nhất có thể lấy hàng"
                    className="w-full text-xs border border-gray-200 rounded-lg pl-3 pr-8 py-2 bg-white focus:outline-none focus:border-red-500 text-gray-800 placeholder:text-gray-400"
                  />
                  <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Kí nhận 1 phần */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Kí nhận 1 phần
                </label>
                <select
                  value={partialReceipt}
                  onChange={(e) => setPartialReceipt(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white focus:outline-none focus:border-red-500 text-gray-800"
                >
                  <option value="Có ký nhận 1 phần">Có ký nhận 1 phần</option>
                  <option value="Không ký nhận 1 phần">Không ký nhận 1 phần</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action and Filter Row matching image_3507d0b9.png */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            {/* Left pills and actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Tổng đơn */}
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setActiveTab('orders');
                  setCreatePage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  statusFilter === 'all' && activeTab === 'orders'
                    ? 'border-gray-800 text-gray-900 bg-gray-50'
                    : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                }`}
              >
                Tổng đơn <span className="font-bold">{batchRows.length}</span>
              </button>

              {/* Đơn hợp lệ */}
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('valid');
                  setActiveTab('orders');
                  setCreatePage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  statusFilter === 'valid'
                    ? 'border-emerald-500 text-emerald-800 bg-emerald-50/60'
                    : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                }`}
              >
                Đơn hợp lệ <span className="font-bold text-emerald-600">{validCount}</span>
              </button>

              {/* Đơn lỗi */}
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('error');
                  setActiveTab('orders');
                  setCreatePage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  statusFilter === 'error'
                    ? 'border-rose-500 text-rose-800 bg-rose-50/60'
                    : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                }`}
              >
                Đơn lỗi <span className="font-bold text-rose-600">{errorCount}</span>
              </button>

              {/* + Tạo đơn hàng */}
              <button
                type="button"
                onClick={handleCreateOrders}
                disabled={validCount === 0}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                  validCount > 0
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-800 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus size={13} />
                <span>Tạo đơn hàng</span>
              </button>

              {/* Tải lên file khác */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-2xs cursor-pointer"
              >
                <UploadCloud size={13} className="text-gray-500" />
                <span>Tải lên file khác</span>
              </button>

              {/* Xóa đơn hàng (hiển thị khi người dùng ấn chọn đơn) */}
              {selectedRowIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelectedRows}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all shadow-2xs cursor-pointer animate-in fade-in"
                  title="Xóa các đơn hàng đã chọn khỏi danh sách tải lên"
                >
                  <Trash2 size={13} className="text-rose-600" />
                  <span>Xóa đơn hàng ({selectedRowIds.size})</span>
                </button>
              )}
            </div>

            {/* Right filter tags matching image_3507d0b9.png */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe] hover:bg-[#ede9fe] transition-colors cursor-pointer"
              >
                <Copy size={13} />
                <span>Lọc đơn trùng SĐT trong 1 file (0)</span>
              </button>

              <button
                type="button"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#fffbeb] text-[#b45309] border border-[#fde68a] hover:bg-[#fef3c7] transition-colors cursor-pointer"
              >
                <Layers size={13} />
                <span>Lọc đơn hàng trùng (0)</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto min-h-[360px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold">
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={
                          paginatedCreateRows.length > 0 &&
                          paginatedCreateRows.every((r) => selectedRowIds.has(r.id))
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </th>
                    <th className="py-3 px-3 w-12 text-gray-700">STT</th>
                    <th className="py-3 px-3 w-28 text-gray-700">Mã ĐH riêng</th>
                    <th className="py-3 px-3 w-36 text-gray-700">Người nhận</th>
                    <th className="py-3 px-3 w-28 text-gray-700">Số điện thoại</th>
                    <th className="py-3 px-4 min-w-[200px] text-gray-700">Địa chỉ</th>
                    <th className="py-3 px-3 min-w-[170px] text-gray-700">Khu vực</th>
                    <th className="py-3 px-3 min-w-[170px] text-gray-700">Nội dung hàng hóa</th>
                    <th className="py-3 px-3 w-24 text-gray-700">Tiền hàng</th>
                    <th className="py-3 px-3 w-24 text-gray-700">Giá trị bảo hiểm</th>
                    <th className="py-3 px-3 w-28 text-gray-700">Phí dịch vụ giao hàng</th>
                    <th className="py-3 px-3 w-24 text-gray-700">Giá trị đơn hàng</th>
                    <th className="py-3 px-3 w-16 text-center text-gray-700"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedCreateRows.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-20 text-center text-gray-400">
                        <FileSpreadsheet size={38} className="mx-auto mb-2.5 text-gray-300 stroke-1" />
                        {batchRows.length === 0 ? (
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Chưa có dữ liệu đơn hàng</p>
                              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                                Vui lòng tải lên file Excel (.xlsx, .csv) danh sách đơn hàng để bắt đầu tạo đơn hàng loạt.
                              </p>
                            </div>
                            <div className="flex items-center justify-center pt-1">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#111827] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                              >
                                <UploadCloud size={14} />
                                <span>Tải lên file Excel</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm font-medium">Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedCreateRows.map((row) => {
                      const isSelected = selectedRowIds.has(row.id);
                      const isError = !row.isValid;

                      return (
                        <tr
                          key={row.id}
                          className={`group transition-colors relative ${
                            isError
                              ? 'bg-rose-50/15 hover:bg-rose-50/40 border-l-4 border-l-rose-500'
                              : 'hover:bg-gray-50/60 border-l-4 border-l-transparent'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(row.id)}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                          </td>

                          {/* STT */}
                          <td className="py-3 px-3 text-gray-600 font-medium">
                            {row.rowNumber}
                          </td>

                          {/* Mã ĐH riêng with (!) icon if error */}
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-1.5">
                              {isError && (
                                <div className="relative inline-flex items-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveTooltipId(activeTooltipId === row.id ? null : row.id)
                                    }
                                    onMouseEnter={() => setActiveTooltipId(row.id)}
                                    onMouseLeave={() => setActiveTooltipId(null)}
                                    className="cursor-pointer text-rose-500 hover:text-rose-700 transition-colors focus:outline-none"
                                    title="Nhấn để xem chi tiết lỗi"
                                  >
                                    <AlertCircle size={15} className="fill-rose-500 text-white" />
                                  </button>

                                  {/* Tooltip dark box matching image_274cec53.png */}
                                  {activeTooltipId === row.id && (
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-40 bg-[#1e293b] text-white text-[11px] py-1 px-2.5 rounded shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                                      <div className="flex items-center space-x-1">
                                        <span className="text-white">&bull;</span>
                                        <span>{row.errorReason || 'Khu vực chưa đầy đủ'}</span>
                                      </div>
                                      {/* Arrow bottom */}
                                      <div className="w-2 h-2 bg-[#1e293b] rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                                    </div>
                                  )}
                                </div>
                              )}
                              <span className="text-gray-700 font-mono">
                                {row.orderCode || '---'}
                              </span>
                            </div>
                          </td>

                          {/* Người nhận */}
                          <td className="py-3 px-3 font-semibold text-gray-900">
                            {row.recipientName}
                          </td>

                          {/* Số điện thoại */}
                          <td className="py-3 px-3 text-gray-700 font-mono">
                            {row.phone}
                          </td>

                          {/* Địa chỉ */}
                          <td className="py-3 px-4 max-w-[260px]">
                            {isError ? (
                              <button
                                type="button"
                                onClick={() => setEditingRow(row)}
                                className="text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer truncate block w-full"
                                title="Nhấp để chỉnh sửa địa chỉ"
                              >
                                {row.address}
                              </button>
                            ) : (
                              <span className="text-gray-700 truncate block" title={row.address}>
                                {row.address}
                              </span>
                            )}
                          </td>

                          {/* Khu vực */}
                          <td className="py-3 px-3">
                            {isError ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-600">
                                Chưa hợp lệ
                              </span>
                            ) : (
                              <span className="text-gray-700 truncate block max-w-[200px]" title={row.area}>
                                {row.area}
                              </span>
                            )}
                          </td>

                          {/* Nội dung hàng hóa */}
                          <td className="py-3 px-3 text-gray-800 font-medium">
                            {row.productName}
                          </td>

                          {/* Tiền hàng */}
                          <td className="py-3 px-3 text-gray-900 font-medium">
                            {formatVND(row.itemPrice)}
                          </td>

                          {/* Giá trị bảo hiểm */}
                          <td className="py-3 px-3 text-gray-400">
                            {row.insuranceValue ? formatVND(row.insuranceValue) : '---'}
                          </td>

                          {/* Phí dịch vụ giao hàng */}
                          <td className="py-3 px-3 text-gray-900 font-medium">
                            {formatVND(row.serviceFee)}
                          </td>

                          {/* Giá trị đơn hàng */}
                          <td className="py-3 px-3 text-gray-900 font-medium">
                            {formatVND(row.totalOrderValue)}
                          </td>

                          {/* Actions matching image_3507d0b9.png / image_a30b5e39.png */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {/* Always show edit & delete for error rows or on row hover for valid rows */}
                              <button
                                type="button"
                                onClick={() => setEditingRow(row)}
                                className="p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer group-hover:opacity-100"
                                title="Chỉnh sửa đơn hàng"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer group-hover:opacity-100"
                                title="Xóa đơn hàng"
                              >
                                <Trash2 size={14} />
                              </button>

                              {!isError && (
                                <button
                                  type="button"
                                  onClick={() => setEditingRow(row)}
                                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                >
                                  <MoreVertical size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component per user request */}
            <TablePagination
              currentPage={createPage}
              totalItems={filteredCreateRows.length}
              pageSize={createPageSize}
              onPageChange={setCreatePage}
              onPageSizeChange={setCreatePageSize}
              pageSizeOptions={[20, 50, 100, 200, 500, 1000]}
            />
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW MODE: HISTORY (Lịch sử lên đơn hàng loạt - image_55449683.png) */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Blue Informational Banner */}
          {showNotification && (
            <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-3.5 sm:p-4 text-xs text-[#1e3a8a] relative flex items-start space-x-3 transition-all">
              <div className="w-5 h-5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center shrink-0 mt-0.5">
                <HelpCircle size={13} />
              </div>
              <div className="flex-1 space-y-1 pr-6 leading-relaxed">
                <div className="flex items-start space-x-1.5">
                  <span className="text-[#3b82f6] font-bold">&bull;</span>
                  <span>
                    Lên đơn hàng loạt cho phép đẩy đơn hàng loạt đến đơn vị vận chuyển có trên hệ thống lên đơn của UPOS.
                  </span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-[#3b82f6] font-bold">&bull;</span>
                  <span>
                    Các cấu hình đặc thù của đơn vị vận chuyển, bạn hoàn toàn có thể chỉnh sửa ở trên trước khi gửi đơn.
                  </span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-[#3b82f6] font-bold">&bull;</span>
                  <span>
                    Dữ liệu file lên đơn sẽ được lưu <strong className="font-bold text-[#1e40af]">trong vòng 07 ngày</strong> (kể từ ngày Upload file).
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotification(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-blue-100/50 transition-colors absolute right-2.5 top-2.5 cursor-pointer"
                title="Đóng thông báo"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Search and Filters Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHistoryPage(1);
                  }}
                  placeholder="Tìm kiếm theo tên file"
                  className="w-full pl-3.5 pr-9 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-400"
                />
                <Search
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowExtraFilters(!showExtraFilters)}
                  className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-colors cursor-pointer ${
                    showExtraFilters || carrierFilter !== 'all' || codMethodFilter !== 'all'
                      ? 'border-red-400 text-red-600 bg-red-50/50'
                      : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Filter size={13} />
                  <span>Bộ lọc khác</span>
                </button>

                {(carrierFilter !== 'all' || codMethodFilter !== 'all' || searchTerm) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setCarrierFilter('all');
                      setCodMethodFilter('all');
                      setHistoryPage(1);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 font-medium transition-colors cursor-pointer"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>
            </div>

            {showExtraFilters && (
              <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Đơn vị vận chuyển
                  </label>
                  <select
                    value={carrierFilter}
                    onChange={(e) => {
                      setCarrierFilter(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white focus:outline-none focus:border-red-500"
                  >
                    <option value="all">Tất cả đơn vị vận chuyển</option>
                    <option value="---">Chưa phân bổ (---)</option>
                    <option value="J&T Express">J&T Express</option>
                    <option value="Viettel Post">Viettel Post</option>
                    <option value="Giao Hàng Nhanh">Giao Hàng Nhanh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Cách tính COD
                  </label>
                  <select
                    value={codMethodFilter}
                    onChange={(e) => {
                      setCodMethodFilter(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-white focus:outline-none focus:border-red-500"
                  >
                    <option value="all">Tất cả cách tính</option>
                    <option value="Shop tự nhập">Shop tự nhập tiền thu hộ (COD)</option>
                    <option value="Hệ thống">Hệ thống tính</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* History Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-600 font-semibold">
                    <th className="py-3 px-4 w-[28%]">File</th>
                    <th className="py-3 px-4 w-[24%]">Cách tính COD</th>
                    <th className="py-3 px-4 w-[16%]">Đơn vị vận chuyển</th>
                    <th className="py-3 px-4 w-[16%]">Nhân viên lên đơn</th>
                    <th className="py-3 px-4 w-[16%]">
                      <div className="flex items-center space-x-1">
                        <span>Trạng thái</span>
                        <HelpCircle size={13} className="text-gray-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedBatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-gray-400">
                        <FileSpreadsheet size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-medium">Chưa có lịch sử lên đơn hàng loạt nào</p>
                        <button
                          type="button"
                          onClick={() => setViewMode('create')}
                          className="mt-2 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                        >
                          Đi đến màn hình Thực hiện lên đơn hàng loạt &rarr;
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedBatches.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-gray-900 hover:text-red-600 transition-colors">
                              {item.fileName}
                            </p>
                            <div className="flex items-center space-x-1 text-[11px] text-gray-400">
                              <Clock size={12} />
                              <span>{item.createdAt}</span>
                              {item.fileSize && <span>&bull; {item.fileSize}</span>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-gray-700">
                          <span>{item.codMethod}</span>
                        </td>

                        <td className="py-3 px-4">
                          {item.carrier === '---' ? (
                            <span className="text-gray-400">---</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-800">
                              {item.carrier}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-gray-700 font-medium">
                          {item.createdByUser}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`font-bold ${
                              item.successCount === 0
                                ? 'text-red-500'
                                : item.successCount === item.totalCount
                                ? 'text-emerald-600'
                                : 'text-amber-500'
                            }`}
                          >
                            {item.statusText || `${item.successCount}/${item.totalCount}`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={historyPage}
              totalItems={filteredBatches.length}
              pageSize={historyPageSize}
              onPageChange={setHistoryPage}
              onPageSizeChange={setHistoryPageSize}
              pageSizeOptions={[20, 50, 100, 200, 500, 1000]}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHỈNH SỬA ĐƠN HÀNG (Ảnh 4: image_250e20c0.png) */}
      {/* ========================================================================= */}
      <BatchOrderEditModal
        isOpen={Boolean(editingRow)}
        order={editingRow}
        onClose={() => setEditingRow(null)}
        onSave={handleSaveEditedOrder}
      />
    </div>
  );
};
