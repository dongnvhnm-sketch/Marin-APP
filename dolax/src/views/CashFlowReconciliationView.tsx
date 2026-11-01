import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Plus,
  RotateCw,
  Search,
  CreditCard,
  Printer,
  Eye,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReconciliationBatch, ReconciliationStatus } from '../types';
import { calculateReconciliationTotals, isEligibleForReconciliation } from '../utils/moneyRules';

export const CashFlowReconciliationView: React.FC = () => {
  const {
    filteredReconciliations,
    filteredStores,
    filteredOrders,
    formatVND,
    createReconciliation,
    updateReconciliationStatus,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'batches' | 'history' | 'debt'>('batches');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReconciliationStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ReconciliationBatch | null>(null);

  // New reconciliation batch state
  const [selectedStoreId, setSelectedStoreId] = useState(
    filteredStores[0]?.id || '',
  );
  const [periodTitle, setPeriodTitle] = useState('Kỳ đối soát định kỳ');
  const [bankName, setBankName] = useState('Vietcombank');
  const [bankAccount, setBankAccount] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [note, setNote] = useState('');

  // Cửa hàng đang chọn: nếu chưa chọn thì dùng cửa hàng đầu tiên đúng như ô chọn đang hiển thị
  const activeStoreId = selectedStoreId || filteredStores[0]?.id || '';
  const activeStore = filteredStores.find((s) => s.id === activeStoreId);

  // Đơn giao thành công, chưa đối soát của cửa hàng đang chọn
  const eligibleOrders = filteredOrders.filter((o) => isEligibleForReconciliation(o, activeStoreId));

  // Cùng một hàm tính với AppContext.createReconciliation (phiếu được tính lại khi tạo)
  const totals = calculateReconciliationTotals(eligibleOrders, activeStore);
  const calcCod = totals.totalCod;
  const calcFee = totals.totalServiceFee;
  const calcInsurance = totals.totalInsuranceFee;
  const calcNet = totals.netPayout; // có thể ÂM: cửa hàng còn nợ Dolax

  const changeStatus = (id: string, status: ReconciliationStatus): boolean => {
    const result = updateReconciliationStatus(id, status);
    if (!result.ok) alert(result.error);
    return result.ok;
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) {
      alert('Vui lòng tạo cửa hàng trước khi tạo phiên đối soát.');
      return;
    }

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const result = createReconciliation({
      title: periodTitle,
      period: `Kỳ ${formattedDate}`,
      storeId: activeStore.id,
      storeName: activeStore.name,
      ...totals,
      status: 'pending',
      bankName,
      bankAccount,
      bankHolder,
      note: note || 'Phiên đối soát định kỳ',
      orderTrackingNumbers: eligibleOrders.map((o) => o.trackingNumber),
    });

    if (!result.ok) {
      alert(result.error);
      return;
    }
    setShowCreateModal(false);
  };

  const displayedBatches = filteredReconciliations.filter((batch) => {
    if (statusFilter !== 'all' && batch.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        batch.id.toLowerCase().includes(q) ||
        batch.storeName.toLowerCase().includes(q) ||
        batch.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Summary cashflow metrics
  const totalCodCollected = filteredReconciliations.reduce((s, b) => s + b.totalCod, 0);
  const totalServiceFeeDeducted = filteredReconciliations.reduce((s, b) => s + b.totalServiceFee, 0);
  const totalNetPaid = filteredReconciliations
    .filter((b) => b.status === 'transferred')
    .reduce((s, b) => s + b.netPayout, 0);
  const totalPendingPayout = filteredReconciliations
    .filter((b) => b.status !== 'transferred')
    .reduce((s, b) => s + b.netPayout, 0);

  const getStatusBadge = (status: ReconciliationStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Chờ đối soát
          </span>
        );
      case 'reconciled':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Đã chốt đối soát
          </span>
        );
      case 'transferred':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đã thanh toán
          </span>
        );
      case 'disputed':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Khiếu nại
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Top actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Quản lý dòng tiền và đối soát
            </h2>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Tài chính & COD
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5 space-x-1">
            <span>Dòng tiền & Đối soát</span>
            <span>&gt;</span>
            <span className="text-gray-700 font-medium">Phiên đối soát COD & Phí vận chuyển</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {}}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <RotateCw size={16} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 bg-[#ef4444] hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Plus size={16} />
            <span>Tạo phiên đối soát mới</span>
          </button>
          <button
            onClick={() => alert('Xuất bảng kê thanh toán đối soát ra Excel...')}
            className="flex items-center space-x-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <FileSpreadsheet size={16} />
            <span>Xuất file đối soát</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Tổng COD đã thu</span>
            <ArrowDownLeft size={16} className="text-blue-500" />
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatVND(totalCodCollected)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Từ các đơn giao thành công</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Cước & Bảo hiểm đã trừ</span>
            <ArrowUpRight size={16} className="text-rose-500" />
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatVND(totalServiceFeeDeducted)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Doanh thu cước vận chuyển</p>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 mb-1">
            <span>Đã thanh toán cho Shop</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {formatVND(totalNetPaid)}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Tiền COD thực nhận đã giải ngân</p>
        </div>

        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
            <span>Chờ thanh toán / Chốt</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700">
            {formatVND(totalPendingPayout)}
          </div>
          <p className="text-[11px] text-amber-600 mt-1">Đang trong phiên xử lý</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('batches')}
          className={`py-2.5 px-4 border-b-2 -mb-[1px] transition-colors ${
            activeTab === 'batches'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Phiên đối soát ({filteredReconciliations.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2.5 px-4 border-b-2 -mb-[1px] transition-colors ${
            activeTab === 'history'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Lịch sử dòng tiền & Giao dịch ngân hàng
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Tìm theo mã đối soát (DS-2026...), tên shop, nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-[#ef4444]"
          />
          <Search size={14} className="absolute right-2.5 top-2.5 text-gray-400" />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-500 font-medium">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-[#ef4444]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ đối soát</option>
            <option value="reconciled">Đã chốt đối soát</option>
            <option value="transferred">Đã thanh toán</option>
            <option value="disputed">Khiếu nại</option>
          </select>
        </div>
      </div>

      {/* Main Table: Danh sách phiên đối soát */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase bg-gray-50/50">
                  <th className="py-3 px-4">Mã phiên</th>
                  <th className="py-3 px-4">Cửa hàng & Kỳ đối soát</th>
                  <th className="py-3 px-4 text-center">Số đơn</th>
                  <th className="py-3 px-4 text-right">Tổng COD</th>
                  <th className="py-3 px-4 text-right">Phí cước trừ</th>
                  <th className="py-3 px-4 text-right font-bold text-gray-900">
                    Thực nhận chuyển Shop
                  </th>
                  <th className="py-3 px-4">Tài khoản nhận</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center w-36">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-gray-400">
                      <FileSpreadsheet size={36} className="mx-auto mb-2 text-gray-300 stroke-1" />
                      <p className="text-sm font-semibold text-gray-700">Chưa có phiên đối soát nào</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Hiện tại chưa có dữ liệu đối soát dòng tiền nào trong hệ thống.
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-blue-600">
                        <div>{batch.id}</div>
                        <div className="text-[10px] text-gray-400 font-normal">
                          {batch.createdAt}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{batch.storeName}</div>
                        <div className="text-[11px] text-gray-500">{batch.title}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                        {batch.orderCount}
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-900 font-medium">
                        {formatVND(batch.totalCod)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-600 font-medium">
                        -{formatVND(batch.totalServiceFee + (batch.totalInsuranceFee || 0))}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-black ${batch.netPayout < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {batch.netPayout < 0 ? '-' : ''}{formatVND(Math.abs(batch.netPayout))}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        <div className="font-medium text-[11px]">{batch.bankName}</div>
                        <div className="text-[10px] text-gray-500">
                          {batch.bankAccount} - {batch.bankHolder}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(batch.status)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedBatch(batch)}
                            className="p-1 rounded hover:bg-gray-100 text-blue-600 cursor-pointer"
                            title="Xem biên bản đối soát"
                          >
                            <Eye size={14} />
                          </button>

                          {batch.status === 'pending' && (
                            <button
                              onClick={() => changeStatus(batch.id, 'reconciled')}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Chốt soát
                            </button>
                          )}

                          {batch.status === 'reconciled' && (
                            <button
                              onClick={() => changeStatus(batch.id, 'transferred')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Chi trả
                            </button>
                          )}

                          {batch.status === 'transferred' && (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center space-x-0.5">
                              <CheckCircle2 size={12} />
                              <span>Đã chuyển</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Lịch sử dòng tiền */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
          <h3 className="text-base font-bold text-gray-900">
            Lịch sử giao dịch & Chuyển khoản ngân hàng
          </h3>
          <p className="text-xs text-gray-500">
            Ghi nhận toàn bộ biến động tiền COD và tiền cước khấu trừ giữa đơn vị vận chuyển Dolax và các cửa hàng.
          </p>

          {filteredReconciliations.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CreditCard size={36} className="mx-auto mb-2 text-gray-300 stroke-1" />
              <p className="text-sm font-semibold text-gray-700">Chưa có lịch sử giao dịch</p>
              <p className="text-xs text-gray-400 mt-1">
                Hiện tại chưa có biến động dòng tiền hoặc giao dịch ngân hàng nào phát sinh.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {filteredReconciliations.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-gray-200 hover:bg-gray-50/60 transition-colors text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        b.status === 'transferred'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        Chuyển tiền COD cho {b.storeName}
                      </p>
                      <p className="text-gray-500 text-[11px]">
                        {b.bankName} - {b.bankAccount} ({b.bankHolder}) • Mã phiên {b.id}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-black text-sm ${
                        b.status === 'transferred' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {b.status === 'transferred' ? '-' : ''}
                      {formatVND(b.netPayout)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {b.transferredAt || b.createdAt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Tạo phiên đối soát mới */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Tạo mới phiên đối soát COD & Cước
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Chọn cửa hàng đối soát
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-[#ef4444]"
                >
                  {filteredStores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Tên kỳ đối soát
                </label>
                <input
                  type="text"
                  required
                  value={periodTitle}
                  onChange={(e) => setPeriodTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#ef4444]"
                />
              </div>

              {/* Automatic calculation overview box */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                <p className="font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                  Dữ liệu tạm tính từ đơn hàng
                </p>
                <div className="flex justify-between text-gray-600">
                  <span>Số đơn đủ điều kiện giao thành công:</span>
                  <span className="font-bold text-gray-900">
                    {eligibleOrders.length} đơn
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tổng tiền thu hộ (COD):</span>
                  <span className="font-bold text-gray-900">{formatVND(calcCod)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí dịch vụ vận chuyển trừ:</span>
                  <span className="font-bold text-rose-600">-{formatVND(calcFee)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí bảo hiểm hàng hóa:</span>
                  <span className="font-bold text-rose-600">-{formatVND(calcInsurance)}</span>
                </div>
                <div className="flex justify-between text-gray-900 border-t border-gray-200 pt-2 font-bold text-xs">
                  <span>{calcNet < 0 ? 'Shop còn nợ Dolax:' : 'Tiền thực chuyển cho Shop:'}</span>
                  <span className={`${calcNet < 0 ? 'text-rose-600' : 'text-emerald-600'} text-sm`}>
                    {formatVND(Math.abs(calcNet))}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Ngân hàng thụ hưởng
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#ef4444]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#ef4444]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Tên chủ tài khoản
                </label>
                <input
                  type="text"
                  required
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#ef4444]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Ghi chú kỳ đối soát
                </label>
                <input
                  type="text"
                  placeholder="VD: Phiên đối soát định kỳ..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#ef4444]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={eligibleOrders.length === 0}
                  title={eligibleOrders.length === 0 ? 'Cửa hàng này chưa có đơn giao thành công để đối soát' : undefined}
                  className="px-5 py-2 bg-[#ef4444] hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận tạo phiên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xem biên bản đối soát chi tiết */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Biên bản đối soát thanh toán • {selectedBatch.id}
                </h3>
                <p className="text-xs text-gray-400">
                  Cửa hàng: {selectedBatch.storeName} ({selectedBatch.period})
                </p>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <p className="text-gray-500">Mã phiên:</p>
                  <p className="font-bold text-gray-900">{selectedBatch.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Kỳ đối soát:</p>
                  <p className="font-bold text-gray-900">{selectedBatch.period}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ngân hàng chi trả:</p>
                  <p className="font-bold text-gray-900">
                    {selectedBatch.bankName} - {selectedBatch.bankAccount}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Người thụ hưởng:</p>
                  <p className="font-bold text-gray-900">{selectedBatch.bankHolder}</p>
                </div>
              </div>

              {/* Financial summary */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Tổng tiền thu hộ COD ({selectedBatch.orderCount} đơn):</span>
                  <span className="font-bold text-gray-900">{formatVND(selectedBatch.totalCod)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Khấu trừ phí vận chuyển:</span>
                  <span className="font-bold text-rose-600">-{formatVND(selectedBatch.totalServiceFee)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Khấu trừ bảo hiểm hàng hóa:</span>
                  <span className="font-bold text-rose-600">-{formatVND(selectedBatch.totalInsuranceFee || 0)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-sm text-gray-900">
                  <span>{selectedBatch.netPayout < 0 ? 'Shop còn nợ Dolax:' : 'Số tiền thực chi chuyển khoản:'}</span>
                  <span className={`${selectedBatch.netPayout < 0 ? 'text-rose-600' : 'text-emerald-600'} text-base`}>
                    {formatVND(Math.abs(selectedBatch.netPayout))}
                  </span>
                </div>
              </div>

              {/* Order tracking list */}
              {selectedBatch.orderTrackingNumbers && selectedBatch.orderTrackingNumbers.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-1.5">Danh sách mã vận đơn thuộc phiên:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBatch.orderTrackingNumbers.map((code) => (
                      <span key={code} className="bg-gray-100 text-blue-700 px-2.5 py-1 rounded font-mono text-[11px] font-semibold">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                onClick={() => alert(`In biên bản đối soát ${selectedBatch.id}`)}
                className="flex items-center space-x-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-xs font-semibold"
              >
                <Printer size={14} />
                <span>In biên bản</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedBatch(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-xs"
                >
                  Đóng
                </button>
                {selectedBatch.status === 'reconciled' && (
                  <button
                    onClick={() => {
                      if (changeStatus(selectedBatch.id, 'transferred')) setSelectedBatch(null);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                  >
                    Xác nhận đã chuyển tiền
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
