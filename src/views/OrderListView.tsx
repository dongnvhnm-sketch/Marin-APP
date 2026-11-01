import React, { useState, useMemo } from 'react';
import {
  RotateCw,
  FileSpreadsheet,
  Filter,
  HelpCircle,
  Plus,
  Printer,
  ChevronDown,
  X,
  Clock,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import {
  ColumnCustomizeModal,
  ALL_ORDER_COLUMNS,
  DEFAULT_VISIBLE_COLUMNS,
} from '../components/ColumnCustomizeModal';
import {
  OrderDateRangeFilter,
  OrderDateFilterType,
  DATE_FILTER_OPTIONS,
  formatDateDMY,
} from '../components/OrderDateRangeFilter';
import { OrderSearchInput, OrderSearchType } from '../components/OrderSearchInput';
import { TablePagination } from '../components/TablePagination';

export const OrderListView: React.FC = () => {
  const {
    filteredOrders,
    filteredStores,
    formatVND,
    incrementPrintCount,
    addOrder,
    setCurrentPage,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('all');
  // Bộ lọc thời gian chuẩn theo ảnh 2 & 3: 21/10/2026 00:00 - 27/10/2026 23:59
  const [dateFilterType, setDateFilterType] = useState<OrderDateFilterType>('created');
  const [filterStartDate, setFilterStartDate] = useState<Date>(() => new Date(2026, 9, 21)); // 21/10/2026
  const [filterEndDate, setFilterEndDate] = useState<Date>(() => new Date(2026, 9, 27)); // 27/10/2026
  const [isDateFilterActive, setIsDateFilterActive] = useState<boolean>(true);

  // Mở rộng bộ lọc khác (hiển thị 3 hàng như trong ảnh 2 & 3)
  const [showExtraFilters, setShowExtraFilters] = useState<boolean>(true);

  // Các trường bộ lọc
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');
  const [trackingSearch, setTrackingSearch] = useState<string>('');
  const [orderSearchType, setOrderSearchType] = useState<OrderSearchType>('trackingNumber');
  const [printCountFilter, setPrintCountFilter] = useState<string>('all');
  const [partialReceiptFilter, setPartialReceiptFilter] = useState<string>('all');
  const [partialCodFilter, setPartialCodFilter] = useState<string>('all');
  const [pickupPointFilter, setPickupPointFilter] = useState<string>('all');
  const [codAmountFilter, setCodAmountFilter] = useState<string>('all');

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Phân trang danh sách đơn hàng khớp chuẩn Ảnh 1 & 2
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Tự động đưa về trang 1 khi các bộ lọc thay đổi theo React patterns chuẩn
  const filterKey = `${activeTab}_${dateFilterType}_${filterStartDate.getTime()}_${filterEndDate.getTime()}_${isDateFilterActive}_${selectedStoreFilter}_${trackingSearch}_${orderSearchType}_${printCountFilter}_${partialReceiptFilter}_${partialCodFilter}_${pickupPointFilter}_${codAmountFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  // Tùy chỉnh danh sách cột hiển thị (lưu nhớ cấu hình vào localStorage)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dolax_order_columns');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_VISIBLE_COLUMNS;
  });
  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);

  const handleApplyColumns = (newCols: string[]) => {
    setVisibleColumns(newCols);
    try {
      localStorage.setItem('dolax_order_columns', JSON.stringify(newCols));
    } catch {
      // ignore
    }
  };

  // New order form state
  const [newOrderStoreId, setNewOrderStoreId] = useState(
    filteredStores[0]?.id || '',
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [productName, setProductName] = useState('');
  const [codAmount, setCodAmount] = useState<number>(120000);
  const [weightKg, setWeightKg] = useState<number>(0.5);

  const canCreateOrder = true;

  // Available pickup points from stores
  const availablePickupPoints = useMemo(() => {
    const points = new Set<string>();
    filteredStores.forEach((s) => {
      s.pickupPoints?.forEach((p) => {
        if (p.name) points.add(p.name);
      });
    });
    return Array.from(points);
  }, [filteredStores]);

  // Filter orders by status tab, store, and tracking code
  const displayedOrders = filteredOrders.filter((order) => {
    // Tab filter
    if (activeTab === 'draft' && order.status !== 'draft') return false;
    if (activeTab === 'cancelled' && order.status !== 'cancelled') return false;
    if (activeTab === 'sent' && order.status !== 'sent') return false;
    if (activeTab === 'picked' && order.status !== 'picked') return false;
    if (activeTab === 'in_transit' && order.status !== 'in_transit') return false;
    if (activeTab === 'delivering' && order.status !== 'delivering') return false;
    if (activeTab === 'delivered' && order.status !== 'delivered') return false;
    if (activeTab === 'returning' && order.status !== 'returning') return false;
    if (activeTab === 'reconciled' && order.status !== 'reconciled') return false;

    // Store filter
    if (selectedStoreFilter !== 'all' && order.storeId !== selectedStoreFilter) {
      return false;
    }

    // Date filter: chỉ lọc khi isDateFilterActive bật
    if (isDateFilterActive && order.createdAt) {
      const parts = order.createdAt.trim().split(" ")[0].split("/");
      if (parts.length === 3) {
        const orderDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const startTimestamp = new Date(filterStartDate).setHours(0, 0, 0, 0);
        const endTimestamp = new Date(filterEndDate).setHours(23, 59, 59, 999);
        if (orderDate.getTime() < startTimestamp || orderDate.getTime() > endTimestamp) {
          return false;
        }
      }
    }

    // Bộ lọc: Số lần in đơn
    if (printCountFilter !== 'all') {
      const pCount = order.printCount || 0;
      if (printCountFilter === '0' && pCount !== 0) return false;
      if (printCountFilter === 'printed' && pCount < 1) return false;
      if (printCountFilter === '1' && pCount !== 1) return false;
      if (printCountFilter === '2' && pCount !== 2) return false;
      if (printCountFilter === '3_plus' && pCount < 3) return false;
    }

    // Bộ lọc: Ký nhận 1 phần
    if (partialReceiptFilter !== 'all') {
      if (partialReceiptFilter === 'yes' && !order.partialReceipt) return false;
      if (partialReceiptFilter === 'no' && order.partialReceipt) return false;
    }

    // Bộ lọc: Sửa COD đơn 1 phần
    if (partialCodFilter !== 'all') {
      if (partialCodFilter === 'yes' && !order.partialCodModified) return false;
      if (partialCodFilter === 'no' && order.partialCodModified) return false;
    }

    // Bộ lọc: Điểm gửi hàng
    if (pickupPointFilter !== 'all') {
      if (order.pickupPoint !== pickupPointFilter) return false;
    }

    // Bộ lọc: Tiền thu hộ
    if (codAmountFilter !== 'all') {
      const cod = order.codAmount || 0;
      if (codAmountFilter === '0' && cod !== 0) return false;
      if (codAmountFilter === 'has_cod' && cod <= 0) return false;
      if (codAmountFilter === 'under_500k' && (cod <= 0 || cod >= 500000)) return false;
      if (codAmountFilter === '500k_1m' && (cod < 500000 || cod > 1000000)) return false;
      if (codAmountFilter === 'over_1m' && cod <= 1000000) return false;
    }

    // Search filter theo loại tra cứu khớp chuẩn Ảnh 1 & 2
    if (trackingSearch.trim()) {
      const q = trackingSearch.trim().toLowerCase();

      if (orderSearchType === 'trackingNumber') {
        const codes = q.split(/[,;\s]+/).filter(Boolean);
        const matchTracking = codes.some((code) =>
          order.trackingNumber.toLowerCase().includes(code)
        );
        if (!matchTracking) return false;
      } else if (orderSearchType === 'lastDigits') {
        const rawTokens = q.split(/[,;\s]+/).filter(Boolean);
        const cleanOrderDigits = order.trackingNumber.replace(/\D/g, "");
        const cleanOrderTracking = order.trackingNumber.toLowerCase();

        const matchLastDigits = rawTokens.some((token) => {
          const cleanToken = token.replace(/\D/g, "");
          if (!cleanToken) {
            return cleanOrderTracking.endsWith(token);
          }
          return (
            cleanOrderDigits.endsWith(cleanToken) ||
            cleanOrderTracking.endsWith(token)
          );
        });

        if (!matchLastDigits) return false;
      } else if (orderSearchType === 'orderCode') {
        const codes = q.split(/[,;\s]+/).filter(Boolean);
        const matchCode = codes.some((code) =>
          order.orderCode.toLowerCase().includes(code)
        );
        if (!matchCode) return false;
      } else if (orderSearchType === 'customOrderCode') {
        const codes = q.split(/[,;\s]+/).filter(Boolean);
        const matchCustom = codes.some(
          (code) =>
            order.orderCode.toLowerCase().includes(code) ||
            (order.notes && order.notes.toLowerCase().includes(code))
        );
        if (!matchCustom) return false;
      }
    }

    return true;
  });

  // Danh sách các tag bộ lọc đang áp dụng (Khớp chuẩn Ảnh 2 & 3)
  const activeFiltersList = useMemo(() => {
    const list: { key: string; label: string; onRemove: () => void }[] = [];

    // 1. Ngày tạo đơn
    if (isDateFilterActive) {
      const typeLabel =
        DATE_FILTER_OPTIONS.find((o) => o.key === dateFilterType)?.label || 'Ngày tạo đơn';
      list.push({
        key: 'date',
        label: `${typeLabel}: ${formatDateDMY(filterStartDate)} 00:00 - ${formatDateDMY(filterEndDate)} 23:59`,
        onRemove: () => setIsDateFilterActive(false),
      });
    }

    // 2. Tên cửa hàng
    if (selectedStoreFilter !== 'all') {
      const store = filteredStores.find((s) => s.id === selectedStoreFilter);
      list.push({
        key: 'store',
        label: `Tên cửa hàng: ${store ? store.name : selectedStoreFilter}`,
        onRemove: () => setSelectedStoreFilter('all'),
      });
    }

    // 3. Số lần in đơn
    if (printCountFilter !== 'all') {
      const printLabels: Record<string, string> = {
        '0': '0 lần',
        printed: 'Đã in (≥ 1 lần)',
        '1': '1 lần',
        '2': '2 lần',
        '3_plus': 'Từ 3 lần trở lên',
      };
      list.push({
        key: 'printCount',
        label: `Số lần in đơn: ${printLabels[printCountFilter] || printCountFilter}`,
        onRemove: () => setPrintCountFilter('all'),
      });
    }

    // 4. Ký nhận 1 phần
    if (partialReceiptFilter !== 'all') {
      list.push({
        key: 'partialReceipt',
        label: `Ký nhận 1 phần: ${
          partialReceiptFilter === 'yes' ? 'Có ký nhận 1 phần' : 'Không ký nhận 1 phần'
        }`,
        onRemove: () => setPartialReceiptFilter('all'),
      });
    }

    // 5. Sửa COD đơn 1 phần
    if (partialCodFilter !== 'all') {
      list.push({
        key: 'partialCod',
        label: `Sửa COD đơn 1 phần: ${
          partialCodFilter === 'yes' ? 'Có sửa COD đơn 1 phần' : 'Không sửa COD đơn 1 phần'
        }`,
        onRemove: () => setPartialCodFilter('all'),
      });
    }

    // 6. Điểm gửi hàng
    if (pickupPointFilter !== 'all') {
      list.push({
        key: 'pickupPoint',
        label: `Điểm gửi hàng: ${pickupPointFilter}`,
        onRemove: () => setPickupPointFilter('all'),
      });
    }

    // 7. Tiền thu hộ
    if (codAmountFilter !== 'all') {
      const codLabels: Record<string, string> = {
        '0': '0đ',
        has_cod: 'Có thu COD',
        under_500k: 'Dưới 500.000đ',
        '500k_1m': '500.000đ - 1.000.000đ',
        over_1m: 'Trên 1.000.000đ',
      };
      list.push({
        key: 'codAmount',
        label: `Tiền thu hộ: ${codLabels[codAmountFilter] || codAmountFilter}`,
        onRemove: () => setCodAmountFilter('all'),
      });
    }

    // 8. Từ khóa tra cứu
    if (trackingSearch.trim()) {
      list.push({
        key: 'search',
        label: `Mã tra cứu: ${trackingSearch.trim()}`,
        onRemove: () => setTrackingSearch(''),
      });
    }

    return list;
  }, [
    isDateFilterActive,
    dateFilterType,
    filterStartDate,
    filterEndDate,
    selectedStoreFilter,
    filteredStores,
    trackingSearch,
    printCountFilter,
    partialReceiptFilter,
    partialCodFilter,
    pickupPointFilter,
    codAmountFilter,
  ]);

  // Đặt lại mặc định: tắt tất cả lọc và đưa về trạng thái chuẩn
  const handleResetFilters = () => {
    setSelectedStoreFilter('all');
    setTrackingSearch('');
    setPrintCountFilter('all');
    setPartialReceiptFilter('all');
    setPartialCodFilter('all');
    setPickupPointFilter('all');
    setCodAmountFilter('all');
    setIsDateFilterActive(true);
    setDateFilterType('created');
    setFilterStartDate(new Date(2026, 9, 21));
    setFilterEndDate(new Date(2026, 9, 27));
  };

  // Dynamic status tab counts based on actual order data
  const tabCounts = useMemo(() => {
    const baseList =
      selectedStoreFilter === 'all'
        ? filteredOrders
        : filteredOrders.filter((o) => o.storeId === selectedStoreFilter);

    const counts: Record<string, number> = {
      all: baseList.length,
      draft: 0,
      cancelled: 0,
      cancel_delivery: 0,
      sent: 0,
      picked: 0,
      in_transit: 0,
      delivering: 0,
      delivered: 0,
      returning: 0,
      reconciled: 0,
    };

    baseList.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });

    return counts;
  }, [filteredOrders, selectedStoreFilter]);

  const statusTabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'draft', label: 'Đơn nháp' },
    { key: 'cancelled', label: 'Hủy đơn hàng' },
    { key: 'sent', label: 'Gửi đơn giao hàng' },
    { key: 'in_transit', label: 'Đang vận chuyển' },
    { key: 'delivering', label: 'Đang phát hàng' },
    { key: 'delivered', label: 'Giao hàng thành công' },
    { key: 'returning', label: 'Chuyển hoàn' },
    { key: 'reconciled', label: 'Đối soát' },
  ];

  // Dữ liệu đơn hàng sau khi phân trang theo pageSize
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return displayedOrders.slice(start, start + pageSize);
  }, [displayedOrders, page, pageSize]);

  // Metrics calculation
  const totalCount = displayedOrders.length;
  const totalValue = displayedOrders.reduce((s, o) => s + (o.orderValue || 0), 0);
  const totalCod = displayedOrders.reduce((s, o) => s + (o.codAmount || 0), 0);
  const totalFee = displayedOrders.reduce((s, o) => s + (o.serviceFee || 0), 0);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(paginatedOrders.map((o) => o.trackingNumber));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOne = (code: string) => {
    if (selectedOrders.includes(code)) {
      setSelectedOrders(selectedOrders.filter((c) => c !== code));
    } else {
      setSelectedOrders([...selectedOrders, code]);
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    addOrder({
      storeId: newOrderStoreId,
      customerName,
      customerPhone,
      customerAddress,
      productName,
      codAmount: Number(codAmount),
      weightKg: Number(weightKg),
      serviceFee: 22000,
      actualShippingCost: 16500,
      orderValue: Number(codAmount),
      status: 'sent',
    });
    setShowCreateModal(false);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setProductName('');
  };

  const handleExportExcel = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Mã vận đơn,Mã đơn hàng,Cửa hàng,Khách hàng,Tiền COD,Phí dịch vụ,Trạng thái']
        .concat(
          displayedOrders.map(
            (o) =>
              `"${o.trackingNumber}","${o.orderCode}","${o.storeName}","${o.customerName}",${o.codAmount},${o.serviceFee},"${o.status}"`,
          ),
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Danh_sach_don_hang_dolax.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'in_transit':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
            Đang vận chuyển
          </span>
        );
      case 'delivering':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
            Đang phát hàng
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
            Giao hàng thành công
          </span>
        );
      case 'sent':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
            Gửi đơn giao hàng
          </span>
        );
      case 'picked':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-sky-50 text-sky-600 border border-sky-100">
            Lấy hàng thành công
          </span>
        );
      case 'returning':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
            Chuyển hoàn
          </span>
        );
      case 'reconciled':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-purple-50 text-purple-600 border border-purple-100">
            Đã đối soát
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
            Hủy đơn hàng
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  // Render cell theo cột được tùy chỉnh
  const renderCell = (order: Order, colId: string) => {
    switch (colId) {
      case 'trackingNumber':
        return (
          <td key={colId} className="py-3.5 px-3">
            <div className="font-semibold text-blue-600">{order.trackingNumber}</div>
            <div className="text-[10px] text-gray-400 flex items-center space-x-1 mt-0.5">
              <Clock size={11} />
              <span>{order.createdAt}</span>
            </div>
          </td>
        );
      case 'orderCode':
        return (
          <td key={colId} className="py-3.5 px-3">
            <div className="font-medium text-gray-900">{order.orderCode}</div>
            <div className="text-[10px] text-gray-400 flex items-center space-x-1 mt-0.5">
              <Clock size={11} />
              <span>{order.createdAt}</span>
            </div>
          </td>
        );
      case 'storeName':
        return (
          <td key={colId} className="py-3.5 px-3">
            <div className="font-medium text-gray-900">{order.storeName}</div>
            <div className="text-[10px] text-gray-400">{order.storeId}</div>
          </td>
        );
      case 'customerName':
        return (
          <td key={colId} className="py-3.5 px-3">
            <div className="font-medium text-gray-900">{order.customerName}</div>
            <div className="text-[10px] text-gray-400">{order.customerPhone}</div>
          </td>
        );
      case 'customerAddress':
        return (
          <td key={colId} className="py-3.5 px-3">
            <div className="max-w-[200px] truncate text-gray-700" title={order.customerAddress}>
              {order.customerAddress}
            </div>
          </td>
        );
      case 'customerArea':
        return (
          <td key={colId} className="py-3.5 px-3 text-gray-700">
            <div>Hà Nội</div>
          </td>
        );
      case 'productName':
        return (
          <td key={colId} className="py-3.5 px-3">
            <div className="max-w-[170px] truncate font-medium text-gray-800" title={order.productName}>
              {order.productName}
            </div>
            <div className="text-[10px] text-gray-400">{order.weightKg} kg</div>
          </td>
        );
      case 'itemPrice':
        return (
          <td key={colId} className="py-3.5 px-3 text-right text-gray-700">
            {formatVND(order.itemPrice || 0)}
          </td>
        );
      case 'serviceFee':
        return (
          <td key={colId} className="py-3.5 px-3 text-right font-medium text-gray-900">
            {formatVND(order.serviceFee)}
          </td>
        );
      case 'orderValue':
        return (
          <td key={colId} className="py-3.5 px-3 text-right text-gray-900">
            {formatVND(order.orderValue)}
          </td>
        );
      case 'codAmount':
        return (
          <td key={colId} className="py-3.5 px-3 text-right font-bold text-gray-900">
            {formatVND(order.codAmount)}
          </td>
        );
      case 'status':
        return (
          <td key={colId} className="py-3.5 px-3 text-center">
            {getStatusBadge(order.status)}
          </td>
        );
      case 'printCount':
        return (
          <td key={colId} className="py-3.5 px-3 text-center font-medium text-gray-700">
            <div className="flex items-center justify-center space-x-1.5">
              <span>{order.printCount}</span>
              <button
                onClick={() => incrementPrintCount(order.trackingNumber)}
                className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                title="In phiếu gửi"
              >
                <Printer size={12} />
              </button>
            </div>
          </td>
        );
      case 'notes':
        return (
          <td key={colId} className="py-3.5 px-3 text-gray-500">
            <div className="max-w-[140px] truncate">{order.notes || '-'}</div>
          </td>
        );
      case 'createdAt':
        return (
          <td key={colId} className="py-3.5 px-3 text-gray-600 whitespace-nowrap">
            {order.createdAt}
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Title & Actions Bar matching Screenshot 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Danh sách đơn hàng
          </h2>
          <div className="text-xs text-gray-500 mt-0.5 space-x-1">
            <span>Quản lý đơn hàng</span>
            <span>&gt;</span>
            <span className="text-gray-700 font-medium">Danh sách đơn hàng</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {}}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            title="Làm mới"
          >
            <RotateCw size={16} />
          </button>

          {canCreateOrder && (
            <>
              <button
                onClick={() => setCurrentPage('orders_batch')}
                className="flex items-center space-x-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
                title="Lên đơn hàng loạt bằng file Excel"
              >
                <FileSpreadsheet size={15} />
                <span>Lên đơn hàng loạt</span>
              </button>

              <button
                onClick={() => setCurrentPage('order_create')}
                className="flex items-center space-x-1.5 bg-[#ef4444] hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus size={16} />
                <span>Tạo đơn hàng</span>
              </button>
            </>
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <FileSpreadsheet size={16} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto border-b border-gray-200 pb-1 text-xs">
        {statusTabs.map((tab) => {
          const count = tabCounts[tab.key] || 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 font-medium whitespace-nowrap border-b-2 -mb-[5px] transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'border-gray-900 text-gray-900 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Container Bộ lọc 3 hàng chuẩn Screenshot 2 & 3 */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs space-y-3">
        {/* HÀNG 1: Tên cửa hàng | Mã vận đơn | Ngày tạo đơn | Tìm kiếm | Bộ lọc khác */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tên cửa hàng */}
          <div className="h-[38px] bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium flex items-center min-w-[210px] flex-1">
            <span className="px-3 text-gray-700 whitespace-nowrap">Tên cửa hàng</span>
            <div className="w-[1px] bg-gray-200 self-stretch my-1" />
            <div className="relative flex-1 flex items-center pr-2">
              <select
                value={selectedStoreFilter}
                onChange={(e) => setSelectedStoreFilter(e.target.value)}
                className="w-full h-full bg-transparent pl-3 pr-6 py-2 text-xs text-gray-800 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="all">Chọn cửa hàng</option>
                {filteredStores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {selectedStoreFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setSelectedStoreFilter('all')}
                  className="absolute right-2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  title="Bỏ chọn cửa hàng"
                >
                  <X size={13} />
                </button>
              ) : (
                <ChevronDown size={13} className="absolute right-2 text-gray-400 pointer-events-none" />
              )}
            </div>
          </div>

          {/* Bộ tra cứu thông minh theo chuẩn Ảnh 1 & 2 */}
          <OrderSearchInput
            searchType={orderSearchType}
            onSearchTypeChange={setOrderSearchType}
            searchValue={trackingSearch}
            onSearchValueChange={setTrackingSearch}
          />

          {/* Bộ lọc thời gian khớp chuẩn 100% Ảnh 2 & 3 */}
          <OrderDateRangeFilter
            dateType={dateFilterType}
            onDateTypeChange={setDateFilterType}
            startDate={filterStartDate}
            endDate={filterEndDate}
            onDateRangeChange={(start, end) => {
              setFilterStartDate(start);
              setFilterEndDate(end);
              setIsDateFilterActive(true);
            }}
            onClear={() => setIsDateFilterActive(false)}
            isFiltered={isDateFilterActive}
          />

          {/* Search Button */}
          <button
            type="button"
            className="h-[38px] bg-[#111827] hover:bg-black text-white text-xs font-semibold px-4 rounded-lg transition-colors cursor-pointer"
          >
            Tìm kiếm
          </button>

          {/* Bộ lọc khác Button */}
          <button
            type="button"
            onClick={() => setShowExtraFilters(!showExtraFilters)}
            className={`h-[38px] flex items-center space-x-1.5 border px-3 rounded-lg text-xs font-medium transition-colors relative cursor-pointer ${
              showExtraFilters || activeFiltersList.length > 0
                ? 'border-rose-300 bg-rose-50/70 text-[#ef4444]'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Filter size={14} className={showExtraFilters || activeFiltersList.length > 0 ? 'text-[#ef4444]' : 'text-gray-500'} />
            <span>Bộ lọc khác</span>
            {activeFiltersList.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ef4444] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {activeFiltersList.length}
              </span>
            )}
          </button>
        </div>

        {/* HÀNG 2: Mở rộng bộ lọc (Số lần in đơn, Ký nhận 1 phần, Sửa COD đơn 1 phần, Điểm gửi hàng) */}
        {showExtraFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Số lần in đơn */}
            <div className="h-[38px] bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium flex items-center">
              <span className="px-3 text-gray-700 whitespace-nowrap">Số lần in đơn</span>
              <div className="w-[1px] bg-gray-200 self-stretch my-1" />
              <div className="relative flex-1 flex items-center pr-2">
                <select
                  value={printCountFilter}
                  onChange={(e) => setPrintCountFilter(e.target.value)}
                  className="w-full h-full bg-transparent pl-3 pr-6 py-2 text-xs text-gray-800 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="all">Chọn số lần in đơn</option>
                  <option value="0">Chưa in (0 lần)</option>
                  <option value="printed">Đã in (≥ 1 lần)</option>
                  <option value="1">1 lần</option>
                  <option value="2">2 lần</option>
                  <option value="3_plus">Từ 3 lần trở lên</option>
                </select>
                {printCountFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => setPrintCountFilter('all')}
                    className="absolute right-2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    title="Bỏ lọc số lần in"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <ChevronDown size={13} className="absolute right-2 text-gray-400 pointer-events-none" />
                )}
              </div>
            </div>

            {/* Ký nhận 1 phần */}
            <div className="h-[38px] bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium flex items-center">
              <span className="px-3 text-gray-700 whitespace-nowrap">Ký nhận 1 phần</span>
              <div className="w-[1px] bg-gray-200 self-stretch my-1" />
              <div className="relative flex-1 flex items-center pr-2">
                <select
                  value={partialReceiptFilter}
                  onChange={(e) => setPartialReceiptFilter(e.target.value)}
                  className="w-full h-full bg-transparent pl-3 pr-6 py-2 text-xs text-gray-800 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="all">Chọn có/không</option>
                  <option value="yes">Có ký nhận 1 phần</option>
                  <option value="no">Không ký nhận 1 phần</option>
                </select>
                {partialReceiptFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => setPartialReceiptFilter('all')}
                    className="absolute right-2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    title="Bỏ lọc ký nhận 1 phần"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <ChevronDown size={13} className="absolute right-2 text-gray-400 pointer-events-none" />
                )}
              </div>
            </div>

            {/* Sửa COD đơn 1 phần */}
            <div className="h-[38px] bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium flex items-center">
              <span className="px-3 text-gray-700 whitespace-nowrap">Sửa COD đơn 1 phần</span>
              <div className="w-[1px] bg-gray-200 self-stretch my-1" />
              <div className="relative flex-1 flex items-center pr-2">
                <select
                  value={partialCodFilter}
                  onChange={(e) => setPartialCodFilter(e.target.value)}
                  className="w-full h-full bg-transparent pl-3 pr-6 py-2 text-xs text-gray-800 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="all">Chọn có/không</option>
                  <option value="yes">Có sửa COD đơn 1 phần</option>
                  <option value="no">Không sửa COD đơn 1 phần</option>
                </select>
                {partialCodFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => setPartialCodFilter('all')}
                    className="absolute right-2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    title="Bỏ lọc sửa COD đơn 1 phần"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <ChevronDown size={13} className="absolute right-2 text-gray-400 pointer-events-none" />
                )}
              </div>
            </div>

            {/* Điểm gửi hàng */}
            <div className="h-[38px] bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium flex items-center">
              <span className="px-3 text-gray-700 whitespace-nowrap">Điểm gửi hàng</span>
              <div className="w-[1px] bg-gray-200 self-stretch my-1" />
              <div className="relative flex-1 flex items-center pr-2">
                <select
                  value={pickupPointFilter}
                  onChange={(e) => setPickupPointFilter(e.target.value)}
                  className="w-full h-full bg-transparent pl-3 pr-6 py-2 text-xs text-gray-800 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="all">Chọn điểm gửi hàng</option>
                  {availablePickupPoints.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
                {pickupPointFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => setPickupPointFilter('all')}
                    className="absolute right-2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    title="Bỏ lọc điểm gửi hàng"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <ChevronDown size={13} className="absolute right-2 text-gray-400 pointer-events-none" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* HÀNG 3: Mở rộng bộ lọc (Tiền thu hộ) */}
        {showExtraFilters && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="h-[38px] bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium flex items-center min-w-[210px] max-w-[280px]">
              <span className="px-3 text-gray-700 whitespace-nowrap">Tiền thu hộ</span>
              <div className="w-[1px] bg-gray-200 self-stretch my-1" />
              <div className="relative flex-1 flex items-center pr-2">
                <select
                  value={codAmountFilter}
                  onChange={(e) => setCodAmountFilter(e.target.value)}
                  className="w-full h-full bg-transparent pl-3 pr-6 py-2 text-xs text-gray-800 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="all">0đ</option>
                  <option value="0">0đ (Không thu hộ)</option>
                  <option value="has_cod">Có thu COD (&gt; 0đ)</option>
                  <option value="under_500k">Dưới 500.000đ</option>
                  <option value="500k_1m">500.000đ - 1.000.000đ</option>
                  <option value="over_1m">Trên 1.000.000đ</option>
                </select>
                {codAmountFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => setCodAmountFilter('all')}
                    className="absolute right-2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    title="Bỏ lọc tiền thu hộ"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <ChevronDown size={13} className="absolute right-2 text-gray-400 pointer-events-none" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DÒNG HIỂN THỊ CÁC TRƯỜNG ĐÃ LỌC (Khớp 100% Ảnh 2 & Ảnh 3) */}
      {activeFiltersList.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFiltersList.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center space-x-1.5 bg-[#fef2f2] text-gray-800 border border-rose-200/80 px-2.5 py-1 rounded-md text-xs font-medium"
            >
              <span>{filter.label}</span>
              <button
                type="button"
                onClick={filter.onRemove}
                className="text-gray-500 hover:text-gray-900 cursor-pointer ml-1"
                title="Tắt bộ lọc này"
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {/* Nút Đặt lại mặc định */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-blue-600 hover:text-blue-800 font-medium text-xs ml-1.5 transition-colors cursor-pointer"
          >
            Đặt lại mặc định
          </button>
        </div>
      )}

      {/* Summary Stats Cards Bar & Settings Gear Button matching Screenshot */}
      <div className="flex items-stretch gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
              <span>Tổng số lượng đơn</span>
              <HelpCircle size={13} className="text-gray-400" />
            </div>
            <div className="text-xl font-bold text-gray-900">{totalCount}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
              <span>Tổng giá trị đơn hàng</span>
              <HelpCircle size={13} className="text-gray-400" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {formatVND(totalValue)}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
              <span>Tổng tiền thu hộ</span>
              <HelpCircle size={13} className="text-gray-400" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {formatVND(totalCod)}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
              <span>Tổng phí dịch vụ giao hàng</span>
              <HelpCircle size={13} className="text-gray-400" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {formatVND(totalFee)}
            </div>
          </div>
        </div>

        {/* Nút cài đặt tùy chỉnh cột - Nằm ở ô màu đỏ trong ảnh */}
        <button
          type="button"
          onClick={() => setShowCustomizeModal(true)}
          className="w-16 min-h-[76px] bg-white hover:bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-xs transition-colors cursor-pointer group"
          title="Tùy chỉnh cột hiển thị"
        >
          <Settings size={22} className="text-gray-600 group-hover:rotate-45 transition-transform" />
        </button>
      </div>

      {/* Orders Table matching Screenshot 4 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase bg-gray-50/50">
                <th className="py-3 px-3 text-center w-8">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedOrders.length > 0 &&
                      paginatedOrders.every((o) => selectedOrders.includes(o.trackingNumber))
                    }
                    className="rounded border-gray-300 text-[#ef4444] focus:ring-[#ef4444]"
                  />
                </th>
                {visibleColumns.map((colId) => {
                  const colDef = ALL_ORDER_COLUMNS.find((c) => c.id === colId);
                  if (!colDef) return null;
                  const alignClass =
                    colDef.align === 'right'
                      ? 'text-right'
                      : colDef.align === 'center'
                      ? 'text-center'
                      : 'text-left';
                  return (
                    <th key={colId} className={`py-3 px-3 font-semibold ${alignClass}`}>
                      {colDef.label}
                    </th>
                  );
                })}
                <th className="py-3 px-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.map((order) => {
                const isSelected = selectedOrders.includes(order.trackingNumber);
                return (
                  <tr
                    key={order.trackingNumber}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      isSelected ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(order.trackingNumber)}
                        className="rounded border-gray-300 text-[#ef4444] focus:ring-[#ef4444]"
                      />
                    </td>
                    {visibleColumns.map((colId) => renderCell(order, colId))}
                    <td className="py-3.5 px-2 text-center">
                      <ChevronDown size={14} className="text-gray-400 cursor-pointer" />
                    </td>
                  </tr>
                );
              })}
              {displayedOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 2}
                    className="py-12 text-center text-gray-400"
                  >
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination with dynamic page calculation and page size popover matching Screenshot 2 */}
        <TablePagination
          currentPage={page}
          totalItems={displayedOrders.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Modal: Tạo đơn hàng mới */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Tạo mới đơn giao hàng</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Chọn cửa hàng gửi hàng
                </label>
                <select
                  value={newOrderStoreId}
                  onChange={(e) => setNewOrderStoreId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-[#ef4444]"
                >
                  {filteredStores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Tên người nhận
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#ef4444]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Số điện thoại nhận
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0912345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#ef4444]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Địa chỉ giao hàng chi tiết
                </label>
                <input
                  type="text"
                  required
                  placeholder="Số nhà, đường, phường, quận, tỉnh/TP"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#ef4444]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Tên sản phẩm hàng hóa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Quần áo thể thao, phụ kiện..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#ef4444]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Tiền thu hộ COD (đ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={codAmount}
                    onChange={(e) => setCodAmount(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#ef4444]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Khối lượng (kg)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#ef4444]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ef4444] hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Xác nhận tạo đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Tùy chỉnh cột hiển thị */}
      <ColumnCustomizeModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        visibleColumns={visibleColumns}
        onApply={handleApplyColumns}
      />
    </div>
  );
};
