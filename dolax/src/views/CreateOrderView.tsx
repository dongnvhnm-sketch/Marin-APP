import React, { useState } from 'react';
import {
  User,
  Scissors,
  ChevronDown,
  RotateCw,
  Plus,
  Calendar,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CreateOrderView: React.FC = () => {
  const { filteredStores, addOrder, setCurrentPage } = useApp();

  // 1. Thông tin khách hàng
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [adminType, setAdminType] = useState<'new' | 'old'>('new'); // Đơn vị hành chính mới (2 cấp) | cũ (3 cấp)
  const [fullAddress, setFullAddress] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(''); // Quận/Huyện (dùng khi chọn Đơn vị hành chính cũ)
  const [selectedWard, setSelectedWard] = useState('');

  // 2. Thông tin sản phẩm
  const [productType, setProductType] = useState<'custom' | 'existing'>('custom'); // Nhập tên hàng hóa | Sử dụng tên sp có sẵn
  const [deductStock, setDeductStock] = useState(false); // Bán hàng có khấu trừ tồn kho
  const [productDescription, setProductDescription] = useState('');

  // 3. Thông tin vận chuyển
  const [codAmount, setCodAmount] = useState<number>(0);
  const [shippingNote, setShippingNote] = useState('');
  const [weightKg, setWeightKg] = useState<number>(1);
  const [lengthCm, setLengthCm] = useState<number>(0);
  const [widthCm, setWidthCm] = useState<number>(0);
  const [heightCm, setHeightCm] = useState<number>(0);

  // Cấu hình đơn vị vận chuyển
  const [carrierPayer, setCarrierPayer] = useState<'recipient' | 'sender' | 'sender_monthly'>('sender_monthly');
  const [pickupType, setPickupType] = useState<'home' | 'post_office'>('home');
  const [allowPartial, setAllowPartial] = useState(true);
  const [packagesCount, setPackagesCount] = useState<number>(1);
  const [enableInsurance, setEnableInsurance] = useState(false);
  const [insuranceValue, setInsuranceValue] = useState<number>(0);
  const [exchangeGoods, setExchangeGoods] = useState(false);
  const [pickupFromTime, setPickupFromTime] = useState('');
  const [pickupToTime, setPickupToTime] = useState('');

  // 4. Thông tin bổ sung (Right Column)
  const [selectedStoreId, setSelectedStoreId] = useState<string>(filteredStores[0]?.id || '');
  const [orderSource, setOrderSource] = useState('store');
  const [customOrderCode, setCustomOrderCode] = useState('');
  const [shippingFeePaidByCustomer, setShippingFeePaidByCustomer] = useState<number>(0);
  const [orderNote, setOrderNote] = useState('');

  // 5. Hình thức thanh toán (Right Column Bottom)
  const [paymentMethod, setPaymentMethod] = useState<'prepaid' | 'cod' | 'postpaid'>('cod');

  // Submit handler
  const handleSaveOrder = (isDraft: boolean = false) => {
    if (!phone.trim() || !customerName.trim()) {
      alert('Vui lòng nhập số điện thoại và họ tên khách hàng!');
      return;
    }

    const currentStore = filteredStores.find((s) => s.id === selectedStoreId) || filteredStores[0];
    if (!currentStore) {
      alert('Vui lòng tạo cửa hàng trước khi tạo đơn hàng.');
      return;
    }

    // Đơn đã thanh toán trước thì không thu hộ, dù ô COD còn giá trị cũ
    const finalCod = paymentMethod === 'prepaid' ? 0 : Number(codAmount) || 0;
    // Giá trị hàng hóa dùng tính phí bảo hiểm: ưu tiên giá trị khai báo, nếu không có thì lấy tiền COD
    const declaredValue = enableInsurance && Number(insuranceValue) > 0 ? Number(insuranceValue) : finalCod;
    const finalAddress =
      [
        fullAddress,
        adminType === 'old' ? selectedWard : selectedWard,
        adminType === 'old' ? selectedDistrict : undefined,
        selectedProvince,
      ]
        .filter(Boolean)
        .join(', ') || 'Hà Nội';

    const result = addOrder({
      storeId: currentStore.id,
      storeName: currentStore.name,
      customerName: customerName.trim(),
      customerPhone: phone.trim(),
      customerAddress: finalAddress,
      productName: productDescription.trim() || 'Sản phẩm thời trang',
      codAmount: finalCod,
      weightKg: Number(weightKg) || 1,
      // Không truyền serviceFee và actualShippingCost: addOrder tự tính phí theo bảng cước
      // của cửa hàng và gắn cờ "cước ước tính" cho đến khi có cước thật từ đối tác.
      orderValue: declaredValue,
      status: isDraft ? 'draft' : 'sent',
    });

    if (!result.ok) {
      alert(result.error);
      return;
    }

    alert(isDraft ? 'Đã lưu đơn hàng vào danh sách nháp!' : 'Đã tạo và gửi đơn hàng thành công!');
    setCurrentPage('orders');
  };

  // Helper tách địa chỉ
  const handleSplitAddress = () => {
    if (!fullAddress) return;
    const parts = fullAddress.split(',').map((p) => p.trim());
    if (adminType === 'old') {
      if (parts.length >= 3) {
        setSelectedProvince(parts[parts.length - 1]);
        setSelectedDistrict(parts[parts.length - 2]);
        setSelectedWard(parts[parts.length - 3]);
      } else if (parts.length === 2) {
        setSelectedProvince(parts[parts.length - 1]);
        setSelectedDistrict(parts[parts.length - 2]);
      }
    } else {
      // 2 cấp: Tỉnh/Thành phố & Phường/Xã
      if (parts.length >= 2) {
        setSelectedProvince(parts[parts.length - 1]);
        setSelectedWard(parts[parts.length - 2]);
      }
    }
  };

  const sampleQuickNotes = [
    'Cho khách xem...',
    'Hàng dễ vỡ, vui...',
    'Cho khách thử...',
    'Không cho xem...',
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Breadcrumb matching Screenshot */}
      <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
        <span className="hover:text-gray-800 cursor-pointer" onClick={() => setCurrentPage('orders')}>
          Đơn hàng
        </span>
        <span>›</span>
        <span className="hover:text-gray-800 cursor-pointer" onClick={() => setCurrentPage('orders')}>
          Quản lý đơn hàng
        </span>
        <span>›</span>
        <span className="text-gray-900 font-bold">Tạo mới đơn hàng</span>
      </div>

      {/* Main Grid: 2 Columns (Left 8 cols, Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* CỘT TRÁI (8 COLS): KHÁCH HÀNG + SẢN PHẨM + THÔNG TIN VẬN CHUYỂN */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          {/* BOX 1: THÔNG TIN KHÁCH HÀNG */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Thông tin khách hàng</h3>

            {/* Row 1: Điện thoại + Họ và tên */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại khách hàng"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-teal-500 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập tên khách hàng"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-8 text-xs text-gray-900 focus:outline-none focus:border-teal-500 placeholder:text-gray-400"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal-600 bg-teal-50 p-1 rounded-md">
                    <User size={13} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Chọn Đơn vị hành chính mới / cũ */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setAdminType('new')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  adminType === 'new'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Đơn vị hành chính mới
              </button>
              <button
                type="button"
                onClick={() => setAdminType('old')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  adminType === 'old'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Đơn vị hành chính cũ
              </button>
            </div>

            {/* Row 3: Địa chỉ đầy đủ + Nút Tách */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Địa chỉ đầy đủ <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Nhập Số nhà, Tên đường, Phường/Xã, Tỉnh/Thành phố"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-teal-500 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={handleSplitAddress}
                  className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Scissors size={13} />
                  <span>Tách</span>
                </button>
              </div>
            </div>

            {/* Row 4: Tỉnh/Thành phố & Quận/Huyện & Phường/Xã dropdowns (2 cấp hoặc 3 cấp theo lựa chọn) */}
            {adminType === 'new' ? (
              /* Đơn vị hành chính mới: Chỉ có 2 cấp Tỉnh/Thành phố và Phường/Xã */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tỉnh/Thành phố <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 pr-8 text-xs text-gray-800 bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="">Chọn Tỉnh/ Thành phố</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Hải Phòng">Hải Phòng</option>
                      <option value="Cần Thơ">Cần Thơ</option>
                      <option value="Bình Dương">Bình Dương</option>
                      <option value="Đồng Nai">Đồng Nai</option>
                      <option value="Bắc Ninh">Bắc Ninh</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phường/Xã <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 pr-8 text-xs text-gray-800 bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="">Chọn Phường/ Xã</option>
                      <option value="Phường Cầu Giấy">Phường Cầu Giấy</option>
                      <option value="Phường Dịch Vọng">Phường Dịch Vọng</option>
                      <option value="Phường Mỹ Đình 1">Phường Mỹ Đình 1</option>
                      <option value="Phường Bến Nghé">Phường Bến Nghé</option>
                      <option value="Phường 1">Phường 1</option>
                      <option value="Xã Thanh Liệt">Xã Thanh Liệt</option>
                      <option value="Xã Tân Triều">Xã Tân Triều</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Đơn vị hành chính cũ: Có 3 cấp Tỉnh/Thành phố, Quận/Huyện, Phường/Xã */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tỉnh/Thành phố <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedProvince}
                      onChange={(e) => {
                        setSelectedProvince(e.target.value);
                        setSelectedDistrict('');
                        setSelectedWard('');
                      }}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 pr-8 text-xs text-gray-800 bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="">Chọn Tỉnh/ Thành phố</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Hải Phòng">Hải Phòng</option>
                      <option value="Cần Thơ">Cần Thơ</option>
                      <option value="Bình Dương">Bình Dương</option>
                      <option value="Đồng Nai">Đồng Nai</option>
                      <option value="Bắc Ninh">Bắc Ninh</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Quận/Huyện <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                        setSelectedWard('');
                      }}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 pr-8 text-xs text-gray-800 bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="">Chọn Quận/ Huyện</option>
                      <option value="Quận Cầu Giấy">Quận Cầu Giấy</option>
                      <option value="Quận Nam Từ Liêm">Quận Nam Từ Liêm</option>
                      <option value="Quận Ba Đình">Quận Ba Đình</option>
                      <option value="Quận Đống Đa">Quận Đống Đa</option>
                      <option value="Quận 1">Quận 1</option>
                      <option value="Quận 3">Quận 3</option>
                      <option value="Thành phố Thủ Đức">Thành phố Thủ Đức</option>
                      <option value="Huyện Thanh Trì">Huyện Thanh Trì</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phường/Xã <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 pr-8 text-xs text-gray-800 bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="">Chọn Phường/ Xã</option>
                      <option value="Phường Dịch Vọng">Phường Dịch Vọng</option>
                      <option value="Phường Dịch Vọng Hậu">Phường Dịch Vọng Hậu</option>
                      <option value="Phường Quan Hoa">Phường Quan Hoa</option>
                      <option value="Phường Mỹ Đình 1">Phường Mỹ Đình 1</option>
                      <option value="Phường Mỹ Đình 2">Phường Mỹ Đình 2</option>
                      <option value="Phường Bến Nghé">Phường Bến Nghé</option>
                      <option value="Phường Bến Thành">Phường Bến Thành</option>
                      <option value="Xã Thanh Liệt">Xã Thanh Liệt</option>
                      <option value="Xã Tân Triều">Xã Tân Triều</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOX 2: THÔNG TIN SẢN PHẨM */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Thông tin sản phẩm</h3>
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deductStock}
                  onChange={(e) => setDeductStock(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                />
                <span>Bán hàng có khấu trừ tồn kho</span>
              </label>
            </div>

            {/* Radio: Nhập tên hàng hóa | Sử dụng tên sản phẩm có sẵn */}
            <div className="flex items-center space-x-6 text-xs text-gray-700">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    productType === 'custom' ? 'border-teal-600' : 'border-gray-300'
                  }`}
                >
                  {productType === 'custom' && <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />}
                </div>
                <input
                  type="radio"
                  name="productType"
                  checked={productType === 'custom'}
                  onChange={() => setProductType('custom')}
                  className="sr-only"
                />
                <span className="flex items-center space-x-1">
                  <span className="font-semibold text-gray-900">Nhập tên hàng hóa</span>
                  <HelpCircle size={12} className="text-gray-400" />
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    productType === 'existing' ? 'border-teal-600' : 'border-gray-300'
                  }`}
                >
                  {productType === 'existing' && <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />}
                </div>
                <input
                  type="radio"
                  name="productType"
                  checked={productType === 'existing'}
                  onChange={() => setProductType('existing')}
                  className="sr-only"
                />
                <span className="flex items-center space-x-1">
                  <span>Sử dụng tên sản phẩm có sẵn</span>
                  <HelpCircle size={12} className="text-gray-400" />
                </span>
              </label>
            </div>

            {/* Textarea nhập sản phẩm */}
            <div>
              <textarea
                rows={3}
                placeholder="Tên sản phẩm | Số lượng sản phẩm.&#10;Mỗi dòng 1 sản phẩm. VD: Sản phẩm ABC | 2"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-teal-500 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* BOX 3: THÔNG TIN VẬN CHUYỂN */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 tracking-tight">Thông tin vận chuyển</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Tùy thuộc vào gói cước bạn đã thỏa thuận với đối tác vận chuyển, phí vận chuyển dự kiến có thể thay đổi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {}}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Tải lại giá cước"
              >
                <RotateCw size={15} />
              </button>
            </div>

            {/* Row: Tiền thu hộ & Ghi chú giao hàng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center space-x-1.5 mb-1">
                    <label className="text-xs font-semibold text-gray-700">Tiền thu hộ</label>
                    <HelpCircle size={12} className="text-gray-400" />
                    <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      COD (Cash on Delivery)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={codAmount || ''}
                      onChange={(e) => setCodAmount(Number(e.target.value))}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs text-gray-900 focus:outline-none focus:border-teal-500 font-medium"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      đ
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Trọng lượng (kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kích thước (cm)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Dài</span>
                      <input
                        type="number"
                        min="0"
                        value={lengthCm || ''}
                        onChange={(e) => setLengthCm(Number(e.target.value))}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-teal-500 text-center font-medium"
                      />
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Rộng</span>
                      <input
                        type="number"
                        min="0"
                        value={widthCm || ''}
                        onChange={(e) => setWidthCm(Number(e.target.value))}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-teal-500 text-center font-medium"
                      />
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Cao</span>
                      <input
                        type="number"
                        min="0"
                        value={heightCm || ''}
                        onChange={(e) => setHeightCm(Number(e.target.value))}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-teal-500 text-center font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ghi chú giao hàng with quick chips */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-1 mb-1">
                  <label className="text-xs font-semibold text-gray-700">Ghi chú giao hàng</label>
                  <HelpCircle size={12} className="text-gray-400" />
                </div>
                <textarea
                  rows={4}
                  placeholder="Nhập ghi chú hoặc sử dụng cú pháp: '/Nội dung ghi chú' để chọn nhanh mẫu ghi chú"
                  value={shippingNote}
                  onChange={(e) => setShippingNote(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-teal-500 placeholder:text-gray-400"
                />

                {/* Quick chip buttons below note matching screenshot */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {sampleQuickNotes.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setShippingNote((prev) => (prev ? `${prev}, ${chip}` : chip))}
                      className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="p-1 text-teal-700 hover:bg-teal-50 rounded border border-teal-200"
                    title="Mẫu ghi chú"
                  >
                    <Layers size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Đơn vị vận chuyển Box (Matching green bordered card in screenshot) */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-gray-700">Đơn vị vận chuyển</label>

              <div className="border border-teal-600 rounded-2xl p-4 sm:p-5 bg-white space-y-4 shadow-2xs">
                {/* Header carrier card: Radio + Logo J&T + Pricing info */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3">
                    {/* Radio selected */}
                    <div className="w-4 h-4 rounded-full border border-teal-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-teal-600" />
                    </div>
                    {/* Carrier Badge */}
                    <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      J&T
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">J&T Express</h4>
                      <p className="text-[10px] text-gray-400">Giao hàng 2-3 ngày</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-right">
                    <div>
                      <span className="text-xs font-bold text-gray-900">N/A</span>
                      <p className="text-[10px] text-gray-400">Phí dự kiến</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-800">Gói tiêu chuẩn</span>
                    </div>
                    <ChevronDown size={14} className="text-gray-400 rotate-180" />
                  </div>
                </div>

                {/* Sub details: Người trả phí & Yêu cầu lấy hàng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Người trả phí */}
                  <div className="space-y-2">
                    <span className="font-semibold text-gray-800">Người trả phí</span>
                    <div className="space-y-1.5 text-gray-600">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="carrierPayer"
                          checked={carrierPayer === 'recipient'}
                          onChange={() => setCarrierPayer('recipient')}
                          className="w-3.5 h-3.5 text-teal-600"
                        />
                        <span>Người nhận</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="carrierPayer"
                          checked={carrierPayer === 'sender'}
                          onChange={() => setCarrierPayer('sender')}
                          className="w-3.5 h-3.5 text-teal-600"
                        />
                        <span>Người gửi</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="carrierPayer"
                          checked={carrierPayer === 'sender_monthly'}
                          onChange={() => setCarrierPayer('sender_monthly')}
                          className="w-3.5 h-3.5 text-teal-600"
                        />
                        <span className="font-semibold text-gray-900">Người gửi cuối tháng trả phí</span>
                      </label>
                    </div>
                  </div>

                  {/* Yêu cầu lấy hàng */}
                  <div className="space-y-2">
                    <span className="font-semibold text-gray-800">Yêu cầu lấy hàng</span>
                    <div className="space-y-1.5 text-gray-600">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pickupType"
                          checked={pickupType === 'home'}
                          onChange={() => setPickupType('home')}
                          className="w-3.5 h-3.5 text-teal-600"
                        />
                        <span className="font-semibold text-gray-900">Đến lấy hàng tại nhà</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pickupType"
                          checked={pickupType === 'post_office'}
                          onChange={() => setPickupType('post_office')}
                          className="w-3.5 h-3.5 text-teal-600"
                        />
                        <span>Gửi tại bưu cục</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Sub row: Ký nhận 1 phần & Số kiện hàng & Bảo hiểm hàng hóa */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                  <div>
                    <span className="block font-semibold text-gray-800 mb-1.5">Ký nhận 1 phần</span>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowPartial}
                        onChange={(e) => setAllowPartial(e.target.checked)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                      />
                      <span className="text-gray-700">Cho phép ký nhận 1 phần</span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-800 mb-1">
                      Số kiện hàng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={packagesCount}
                      onChange={(e) => setPackagesCount(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800">Bảo hiểm hàng hóa</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableInsurance}
                          onChange={(e) => setEnableInsurance(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>
                    <input
                      type="number"
                      disabled={!enableInsurance}
                      value={insuranceValue || ''}
                      onChange={(e) => setInsuranceValue(Number(e.target.value))}
                      placeholder="Nhập giá trị bảo hiểm"
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-teal-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Sub row: Đổi trả hàng hóa (dashed border box like screenshot) */}
                <div className="border border-dashed border-teal-500/80 bg-teal-50/20 rounded-xl p-3">
                  <label className="flex items-center space-x-2 text-xs text-gray-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={exchangeGoods}
                      onChange={(e) => setExchangeGoods(e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium">Đổi trả hàng hóa</span>
                    <HelpCircle size={12} className="text-gray-400" />
                  </label>
                </div>

                {/* Sub row: Thời gian hẹn lấy hàng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-800 mb-1">
                      Thời gian lấy hàng dự kiến
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Chọn thời gian hẹn bắt đầu lấy ..."
                        value={pickupFromTime}
                        onChange={(e) => setPickupFromTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-8 text-xs text-gray-900 focus:outline-none focus:border-teal-500 placeholder:text-gray-400"
                      />
                      <Calendar
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-800 mb-1">
                      Thời gian hẹn trễ nhất có thể lấy hàng
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Chọn thời gian hẹn trễ nhất có ..."
                        value={pickupToTime}
                        onChange={(e) => setPickupToTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-8 text-xs text-gray-900 focus:outline-none focus:border-teal-500 placeholder:text-gray-400"
                      />
                      <Calendar
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút Thêm đơn vị vận chuyển */}
              <button
                type="button"
                onClick={() => alert('Đã có đơn vị J&T Express, Viettel Post, GHN.')}
                className="mt-2 px-3 py-1.5 border border-teal-700 text-teal-700 hover:bg-teal-50 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Plus size={13} />
                <span>Thêm đơn vị vận chuyển</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT PHẢI (4 COLS): THÔNG TIN BỔ SUNG & HÌNH THỨC THANH TOÁN */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* BOX 4: THÔNG TIN BỔ SUNG */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Thông tin bổ sung</h3>

            {/* Điểm gửi hàng */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Điểm gửi hàng</label>
              <div className="relative">
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-xs text-gray-900 bg-white focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
                >
                  {filteredStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Người tạo */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Người tạo</label>
              <input
                type="text"
                disabled
                value="Công ty TNHH Dolax"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-gray-50/80 font-medium"
              />
            </div>

            {/* Nguồn đơn hàng & Mã đơn hàng riêng */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nguồn đơn hàng</label>
                <div className="relative">
                  <select
                    value={orderSource}
                    onChange={(e) => setOrderSource(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs text-gray-800 bg-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="store">Cửa hàng</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                    <option value="shopee">Shopee</option>
                    <option value="hotline">Hotline</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Mã đơn hàng riêng</label>
                <input
                  type="text"
                  placeholder="Nhập mã đơn hàng ..."
                  value={customOrderCode}
                  onChange={(e) => setCustomOrderCode(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-teal-500 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Nhập phí giao hàng hộ */}
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <label className="font-semibold text-gray-700">Nhập phí giao hàng hộ</label>
                <HelpCircle size={12} className="text-gray-400" />
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={shippingFeePaidByCustomer || ''}
                  onChange={(e) => setShippingFeePaidByCustomer(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-7 text-xs text-gray-900 focus:outline-none focus:border-teal-500 font-medium"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  đ
                </span>
              </div>
            </div>

            {/* Ghi chú đơn hàng */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Ghi chú đơn hàng</label>
              <textarea
                rows={2}
                placeholder="Ghi chú đơn hàng"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-teal-500 placeholder:text-gray-400"
              />
            </div>

            {/* Thêm ảnh đính kèm (0/5) */}
            <div>
              <button
                type="button"
                onClick={() => alert('Chọn ảnh đính kèm hóa đơn / sản phẩm (tối đa 5 ảnh).')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1 cursor-pointer"
              >
                <Plus size={13} />
                <span>Thêm ảnh đính kèm (0/5)</span>
              </button>
            </div>
          </div>

          {/* BOX 5: HÌNH THỨC THANH TOÁN */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3.5 text-xs">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Hình thức thanh toán</h3>

            <div className="space-y-2.5">
              {/* Option 1: Khách hàng thanh toán trước */}
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    paymentMethod === 'prepaid' ? 'border-teal-600' : 'border-gray-300'
                  }`}
                >
                  {paymentMethod === 'prepaid' && <div className="w-2 h-2 rounded-full bg-teal-600" />}
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'prepaid'}
                  onChange={() => setPaymentMethod('prepaid')}
                  className="sr-only"
                />
                <span className="text-gray-700">Khách hàng thanh toán trước</span>
              </label>

              {/* Option 2: Thu COD sau khi giao hàng thành công (checked) */}
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    paymentMethod === 'cod' ? 'border-teal-600' : 'border-gray-300'
                  }`}
                >
                  {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-teal-600" />}
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="sr-only"
                />
                <span className="font-semibold text-gray-900">Thu COD sau khi giao hàng thành công</span>
              </label>

              {/* Option 3: Thanh toán sau */}
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    paymentMethod === 'postpaid' ? 'border-teal-600' : 'border-gray-300'
                  }`}
                >
                  {paymentMethod === 'postpaid' && <div className="w-2 h-2 rounded-full bg-teal-600" />}
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'postpaid'}
                  onChange={() => setPaymentMethod('postpaid')}
                  className="sr-only"
                />
                <span className="text-gray-700">Thanh toán sau</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR MATCHING SCREENSHOT: Hủy, Lưu nháp, Lưu và gửi giao hàng */}
      <div className="flex items-center justify-center space-x-3 pt-4 pb-8">
        <button
          type="button"
          onClick={() => setCurrentPage('orders')}
          className="px-6 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors bg-white shadow-2xs cursor-pointer"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={() => handleSaveOrder(true)}
          className="px-6 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors bg-white shadow-2xs cursor-pointer"
        >
          Lưu nháp
        </button>
        <button
          type="button"
          onClick={() => handleSaveOrder(false)}
          className="px-6 py-2.5 bg-blue-50/70 hover:bg-teal-700 text-slate-500 hover:text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          Lưu và gửi giao hàng
        </button>
      </div>
    </div>
  );
};
