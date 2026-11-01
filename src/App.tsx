/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { StoreListView } from './views/StoreListView';
import { CreateStoreView } from './views/CreateStoreView';
import { StoreDetailView } from './views/StoreDetailView';
import { OrderListView } from './views/OrderListView';
import { CreateOrderView } from './views/CreateOrderView';
import { BatchOrderListView } from './views/BatchOrderListView';
import { DeliveryFeeReportView } from './views/DeliveryFeeReportView';
import { ProfitMarginReportView } from './views/ProfitMarginReportView';
import { CashFlowReconciliationView } from './views/CashFlowReconciliationView';
import { LoginView } from './views/LoginView';
import { MessageSquarePlus } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentPage, isAuthenticated } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  // If user is not authenticated, render LoginView
  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderCurrentView = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardView />;
      case 'stores':
        return <StoreListView />;
      case 'store_create':
        return <CreateStoreView />;
      case 'store_detail':
        return <StoreDetailView />;
      case 'orders':
        return <OrderListView />;
      case 'order_create':
        return <CreateOrderView />;
      case 'orders_batch':
        return <BatchOrderListView />;
      case 'delivery_fee_report':
        return <DeliveryFeeReportView />;
      case 'profit_report':
        return <ProfitMarginReportView />;
      case 'cash_flow':
        return <CashFlowReconciliationView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-gray-900 font-sans antialiased relative selection:bg-rose-500 selection:text-white">
      {/* Dolax Left Navigation Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 pb-16 overflow-y-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Floating "Góp ý" Tab on Right Edge matching Screenshots 1-10 */}
      <button
        onClick={() => setShowFeedbackModal(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#ef4444] hover:bg-rose-700 text-white rounded-l-lg py-3 px-1.5 flex flex-col items-center space-y-1.5 shadow-lg z-40 transition-transform hover:-translate-x-0.5 cursor-pointer"
        title="Góp ý cho hệ thống Dolax"
      >
        <MessageSquarePlus size={14} />
        <span
          className="text-[11px] font-bold tracking-wider"
          style={{ writingMode: 'vertical-rl' }}
        >
          Góp ý
        </span>
      </button>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">
              Góp ý và phản hồi về hệ thống Dolax
            </h3>
            <p className="text-xs text-gray-500">
              Ý kiến đóng góp của bạn giúp chúng tôi cải thiện chất lượng phục vụ và vận hành đơn vị vận chuyển tốt hơn.
            </p>
            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Nhập nội dung góp ý của bạn tại đây..."
              className="w-full text-xs border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[#ef4444]"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  alert('Cảm ơn bạn đã gửi phản hồi!');
                  setFeedbackText('');
                  setShowFeedbackModal(false);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-[#ef4444] hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Gửi góp ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
