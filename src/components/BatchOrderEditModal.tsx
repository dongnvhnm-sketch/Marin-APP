import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import {
  ViettelProvince,
  ViettelDistrict,
  ViettelWardV2,
  ViettelWardV3,
  getV2Provinces,
  getV2Districts,
  getV2Wards,
  getV3Provinces,
  getV3Wards,
} from '../services/viettelPostService';
import {
  SearchableLocationSelect,
  LocationOption,
} from './SearchableLocationSelect';

export interface BatchOrderRow {
  id: string;
  rowNumber: number;
  orderCode: string; // "---" or code
  recipientName: string;
  phone: string;
  address: string;
  area: string; // e.g. "Lâm Đồng/Xã Bảo Lâm 1" or "Chưa hợp lệ"
  productName: string;
  itemPrice: number;
  insuranceValue?: number;
  serviceFee: number;
  totalOrderValue: number;
  cod: number;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  note?: string;
  carrier?: string;
  isValid: boolean;
  errorReason?: string; // e.g. "Khu vực chưa đầy đủ"
  provinceName?: string;
  districtName?: string;
  wardName?: string;
  locationStandard?: 'new' | 'old';
}

interface BatchOrderEditModalProps {
  isOpen: boolean;
  order: BatchOrderRow | null;
  onClose: () => void;
  onSave: (updated: BatchOrderRow) => void;
}

export const BatchOrderEditModal: React.FC<BatchOrderEditModalProps> = ({
  isOpen,
  order,
  onClose,
  onSave,
}) => {
  // Form state
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [locationStandard, setLocationStandard] = useState<'new' | 'old'>('new');
  const [fullAddress, setFullAddress] = useState('');

  // Location data & selection
  const [v3Provinces, setV3Provinces] = useState<ViettelProvince[]>([]);
  const [v3Wards, setV3Wards] = useState<ViettelWardV3[]>([]);
  const [selectedV3ProvinceId, setSelectedV3ProvinceId] = useState<number | ''>('');
  const [selectedV3WardId, setSelectedV3WardId] = useState<number | ''>('');

  const [v2Provinces, setV2Provinces] = useState<ViettelProvince[]>([]);
  const [v2Districts, setV2Districts] = useState<ViettelDistrict[]>([]);
  const [v2Wards, setV2Wards] = useState<ViettelWardV2[]>([]);
  const [selectedV2ProvinceId, setSelectedV2ProvinceId] = useState<number | ''>('');
  const [selectedV2DistrictId, setSelectedV2DistrictId] = useState<number | ''>('');
  const [selectedV2WardId, setSelectedV2WardId] = useState<number | ''>('');

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Product info
  const [orderCode, setOrderCode] = useState('');
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [insuranceValue, setInsuranceValue] = useState<string>('');
  const [weightKg, setWeightKg] = useState<number>(1);
  const [lengthCm, setLengthCm] = useState<string>('');
  const [widthCm, setWidthCm] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [note, setNote] = useState('');

  // Validation state
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load provinces on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const load = async () => {
      setLoadingProvinces(true);
      try {
        const [p3, p2] = await Promise.all([getV3Provinces(), getV2Provinces()]);
        if (isMounted) {
          setV3Provinces(p3);
          setV2Provinces(p2);
        }
      } catch (err) {
        console.error('Lỗi tải danh mục tỉnh:', err);
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    };
    load();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Sync form when order changes
  useEffect(() => {
    if (!order || !isOpen) return;

    setRecipientName(order.recipientName || '');
    setPhone(order.phone || '');
    setFullAddress(order.address || '');
    setOrderCode(order.orderCode === '---' ? '' : order.orderCode || '');
    setItemPrice(order.itemPrice || 0);
    setInsuranceValue(order.insuranceValue ? String(order.insuranceValue) : '');
    setWeightKg(order.weightKg || 1);
    setLengthCm(order.lengthCm ? String(order.lengthCm) : '');
    setWidthCm(order.widthCm ? String(order.widthCm) : '');
    setHeightCm(order.heightCm ? String(order.heightCm) : '');
    setProductName(order.productName || '');
    setNote(order.note || '1');
    setAttemptedSave(false);
    setLocationStandard(order.locationStandard || 'new');

    // Tự động tìm kiếm tỉnh tương ứng với địa chỉ (nếu có)
    const findMatchingProvince = (provName?: string, fullAddr?: string) => {
      const textToSearch = (provName || fullAddr || '').toLowerCase();
      if (textToSearch.includes('hồ chí minh') || textToSearch.includes('tp hcm') || textToSearch.includes('tphcm')) {
        return 79; // HCM ID
      }
      if (textToSearch.includes('hà nội') || textToSearch.includes('ha noi')) {
        return 1; // HN ID
      }
      if (textToSearch.includes('đà nẵng') || textToSearch.includes('da nang')) {
        return 48; // DN ID
      }
      if (textToSearch.includes('hải phòng') || textToSearch.includes('hai phong')) {
        return 31;
      }
      if (textToSearch.includes('lâm đồng') || textToSearch.includes('lam dong')) {
        return 68;
      }
      if (textToSearch.includes('đồng nai') || textToSearch.includes('dong nai')) {
        return 75;
      }
      if (textToSearch.includes('hải dương') || textToSearch.includes('hai duong')) {
        return 30;
      }
      if (textToSearch.includes('yên bái') || textToSearch.includes('yen bai')) {
        return 15;
      }
      if (textToSearch.includes('nghệ an') || textToSearch.includes('nghe an')) {
        return 40;
      }
      if (textToSearch.includes('long an')) {
        return 80;
      }
      return '';
    };

    const provId = findMatchingProvince(order.provinceName, order.address);
    if (provId) {
      setSelectedV3ProvinceId(provId);
      setSelectedV2ProvinceId(provId);
      // Nạp wards V3
      getV3Wards(Number(provId)).then((wList) => {
        setV3Wards(wList);
        // Nếu có sẵn tên phường thì match
        if (order.wardName) {
          const matched = wList.find((w) =>
            order.wardName?.toLowerCase().includes(w.WARDS_NAME.toLowerCase())
          );
          if (matched) setSelectedV3WardId(matched.WARDS_ID);
        }
      });
      // Nạp districts V2
      getV2Districts(Number(provId)).then((dList) => {
        setV2Districts(dList);
      });
    } else {
      setSelectedV3ProvinceId('');
      setSelectedV3WardId('');
      setSelectedV2ProvinceId('');
      setSelectedV2DistrictId('');
      setSelectedV2WardId('');
    }
  }, [order, isOpen]);

  // Handler khi đổi tỉnh mới V3
  const handleV3ProvinceChange = async (val: number | '') => {
    setSelectedV3ProvinceId(val);
    setSelectedV3WardId('');
    setV3Wards([]);
    if (!val) return;

    setLoadingWards(true);
    try {
      const wardsList = await getV3Wards(Number(val));
      setV3Wards(wardsList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWards(false);
    }
  };

  // Handler khi đổi tỉnh cũ V2
  const handleV2ProvinceChange = async (val: number | '') => {
    setSelectedV2ProvinceId(val);
    setSelectedV2DistrictId('');
    setV2Districts([]);
    setSelectedV2WardId('');
    setV2Wards([]);
    if (!val) return;

    setLoadingDistricts(true);
    try {
      const dList = await getV2Districts(Number(val));
      setV2Districts(dList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Handler khi đổi quận/huyện V2
  const handleV2DistrictChange = async (val: number | '') => {
    setSelectedV2DistrictId(val);
    setSelectedV2WardId('');
    setV2Wards([]);
    if (!val) return;

    setLoadingWards(true);
    try {
      const wList = await getV2Wards(Number(val));
      setV2Wards(wList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWards(false);
    }
  };

  // Nút [Tách địa chỉ] thông minh: phân tích chuỗi địa chỉ
  const handleParseAddress = async () => {
    if (!fullAddress.trim()) return;

    const lower = fullAddress.toLowerCase();

    // 1. Tìm tỉnh
    let matchedProv = v3Provinces.find((p) =>
      lower.includes(p.PROVINCE_NAME.toLowerCase())
    );
    if (!matchedProv) {
      if (lower.includes('hcm') || lower.includes('hồ chí minh') || lower.includes('tp hcm')) {
        matchedProv = v3Provinces.find((p) => p.PROVINCE_NAME.includes('Hồ Chí Minh'));
      } else if (lower.includes('hà nội') || lower.includes('ha noi')) {
        matchedProv = v3Provinces.find((p) => p.PROVINCE_NAME.includes('Hà Nội'));
      } else if (lower.includes('đà nẵng') || lower.includes('da nang')) {
        matchedProv = v3Provinces.find((p) => p.PROVINCE_NAME.includes('Đà Nẵng'));
      }
    }

    if (matchedProv) {
      setSelectedV3ProvinceId(matchedProv.PROVINCE_ID);
      setLoadingWards(true);
      try {
        const wards = await getV3Wards(matchedProv.PROVINCE_ID);
        setV3Wards(wards);

        // Thử tìm phường xã trong chuỗi địa chỉ
        const matchedWard = wards.find((w) =>
          lower.includes(w.WARDS_NAME.toLowerCase())
        );
        if (matchedWard) {
          setSelectedV3WardId(matchedWard.WARDS_ID);
        }
      } finally {
        setLoadingWards(false);
      }
    }

    setToastMessage('Đã tự động nhận diện tỉnh và chuẩn hóa địa chỉ!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tính trọng lượng quy đổi (Dài x Rộng x Cao / 6000)
  const convertedWeight = (() => {
    const l = parseFloat(lengthCm) || 0;
    const w = parseFloat(widthCm) || 0;
    const h = parseFloat(heightCm) || 0;
    if (l <= 0 || w <= 0 || h <= 0) return '0,00';
    return ((l * w * h) / 6000).toFixed(2).replace('.', ',');
  })();

  // Kiểm tra lỗi phường/xã
  const isWardEmpty =
    locationStandard === 'new'
      ? selectedV3WardId === ''
      : selectedV2WardId === '';

  // Xử lý Cập nhật đơn hàng
  const handleSave = () => {
    setAttemptedSave(true);

    if (!recipientName.trim() || !phone.trim() || !fullAddress.trim() || isWardEmpty) {
      return;
    }

    let finalArea: string;
    let pName: string;
    let wName: string;
    let dName: string;

    if (locationStandard === 'new') {
      const p = v3Provinces.find((item) => item.PROVINCE_ID === selectedV3ProvinceId);
      const w = v3Wards.find((item) => item.WARDS_ID === selectedV3WardId);
      pName = p?.PROVINCE_NAME || 'Hồ Chí Minh';
      wName = w?.WARDS_NAME || '';
      dName = '';
      finalArea = wName ? `${pName}/${wName}` : pName;
    } else {
      const p = v2Provinces.find((item) => item.PROVINCE_ID === selectedV2ProvinceId);
      const d = v2Districts.find((item) => item.DISTRICT_ID === selectedV2DistrictId);
      const w = v2Wards.find((item) => item.WARDS_ID === selectedV2WardId);
      pName = p?.PROVINCE_NAME || 'Hồ Chí Minh';
      dName = d?.DISTRICT_NAME || '';
      wName = w?.WARDS_NAME || '';
      finalArea = [pName, dName, wName].filter(Boolean).join('/');
    }

    const updatedRow: BatchOrderRow = {
      ...(order as BatchOrderRow),
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      address: fullAddress.trim(),
      area: finalArea,
      orderCode: orderCode.trim() || '---',
      itemPrice: Number(itemPrice) || 0,
      cod: Number(itemPrice) || 0,
      insuranceValue: insuranceValue ? Number(insuranceValue) : undefined,
      weightKg: Number(weightKg) || 1,
      lengthCm: lengthCm ? Number(lengthCm) : undefined,
      widthCm: widthCm ? Number(widthCm) : undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      productName: productName.trim(),
      note: note.trim(),
      provinceName: pName,
      districtName: dName,
      wardName: wName,
      locationStandard,
      isValid: true, // Đã được sửa thành công và hợp lệ!
      errorReason: undefined,
    };

    onSave(updatedRow);
    onClose();
  };

  if (!isOpen || !order) return null;

  // Options cho combobox
  const v3ProvOptions: LocationOption[] = v3Provinces.map((p) => ({
    value: p.PROVINCE_ID,
    label: p.PROVINCE_NAME,
    code: p.PROVINCE_CODE,
  }));

  const v3WardOptions: LocationOption[] = v3Wards.map((w) => ({
    value: w.WARDS_ID,
    label: w.WARDS_NAME,
  }));

  const v2ProvOptions: LocationOption[] = v2Provinces.map((p) => ({
    value: p.PROVINCE_ID,
    label: p.PROVINCE_NAME,
    code: p.PROVINCE_CODE,
  }));

  const v2DistOptions: LocationOption[] = v2Districts.map((d) => ({
    value: d.DISTRICT_ID,
    label: d.DISTRICT_NAME,
    code: d.DISTRICT_VALUE,
  }));

  const v2WardOptions: LocationOption[] = v2Wards.map((w) => ({
    value: w.WARDS_ID,
    label: w.WARDS_NAME,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            Chỉnh sửa đơn hàng
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
          {toastMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
              <Sparkles size={14} className="text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PHẦN 1: THÔNG TIN NGƯỜI NHẬN */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900">
              Thông tin người nhận
            </h3>

            {/* Grid 2 cột: Người nhận & Số điện thoại */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Người nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#ef4444]"
                  placeholder="Nhập tên người nhận"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#ef4444]"
                  placeholder="Số điện thoại"
                />
              </div>
            </div>

            {/* Chuyển đổi chuẩn hành chính */}
            <div className="pt-1 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setLocationStandard('new')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  locationStandard === 'new'
                    ? 'bg-[#ef4444] text-white shadow-2xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Đơn vị hành chính mới
              </button>
              <button
                type="button"
                onClick={() => setLocationStandard('old')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  locationStandard === 'old'
                    ? 'bg-[#ef4444] text-white shadow-2xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Đơn vị hành chính cũ
              </button>
            </div>

            {/* Địa chỉ đầy đủ + Nút Tách địa chỉ */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Địa chỉ đầy đủ <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#ef4444]"
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/tp"
                />
                <button
                  type="button"
                  onClick={handleParseAddress}
                  className="px-3.5 py-2 bg-[#111827] hover:bg-black text-white text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer shadow-xs"
                >
                  Tách địa chỉ
                </button>
              </div>
            </div>

            {/* Lựa chọn Tỉnh / Phường theo chuẩn */}
            {locationStandard === 'new' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Tỉnh/Thành phố <span className="text-rose-500">*</span>
                  </label>
                  <SearchableLocationSelect
                    options={v3ProvOptions}
                    value={selectedV3ProvinceId}
                    onChange={handleV3ProvinceChange}
                    placeholder="Chọn Tỉnh / Thành phố"
                    isLoading={loadingProvinces}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Phường/Xã <span className="text-rose-500">*</span>
                  </label>
                  <SearchableLocationSelect
                    options={v3WardOptions}
                    value={selectedV3WardId}
                    onChange={(val) => setSelectedV3WardId(val)}
                    disabled={!selectedV3ProvinceId || loadingWards}
                    placeholder={
                      !selectedV3ProvinceId
                        ? '-- Chọn Tỉnh trước --'
                        : 'Chọn phường / xã'
                    }
                    isLoading={loadingWards}
                  />
                  {attemptedSave && isWardEmpty && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center space-x-1">
                      <AlertCircle size={11} />
                      <span>Phường/Xã không được để trống</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Tỉnh/Thành phố <span className="text-rose-500">*</span>
                  </label>
                  <SearchableLocationSelect
                    options={v2ProvOptions}
                    value={selectedV2ProvinceId}
                    onChange={handleV2ProvinceChange}
                    placeholder="Chọn Tỉnh"
                    isLoading={loadingProvinces}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Quận/Huyện <span className="text-rose-500">*</span>
                  </label>
                  <SearchableLocationSelect
                    options={v2DistOptions}
                    value={selectedV2DistrictId}
                    onChange={handleV2DistrictChange}
                    disabled={!selectedV2ProvinceId || loadingDistricts}
                    placeholder={!selectedV2ProvinceId ? '-- Chọn Tỉnh --' : 'Chọn Quận/Huyện'}
                    isLoading={loadingDistricts}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Phường/Xã <span className="text-rose-500">*</span>
                  </label>
                  <SearchableLocationSelect
                    options={v2WardOptions}
                    value={selectedV2WardId}
                    onChange={(val) => setSelectedV2WardId(val)}
                    disabled={!selectedV2DistrictId || loadingWards}
                    placeholder={!selectedV2DistrictId ? '-- Chọn Huyện --' : 'Chọn Phường/Xã'}
                    isLoading={loadingWards}
                  />
                  {attemptedSave && isWardEmpty && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center space-x-1">
                      <AlertCircle size={11} />
                      <span>Phường/Xã không được để trống</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 my-2"></div>

          {/* ========================================================================= */}
          {/* PHẦN 2: THÔNG TIN SẢN PHẨM */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900">
              Thông tin sản phẩm
            </h3>

            {/* Row 1: Mã đơn hàng riêng, Tiền hàng, Giá trị bảo hiểm */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Mã đơn hàng riêng
                </label>
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="Nhập mã đơn hàng riêng"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#ef4444]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Tiền hàng
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    className="w-full text-xs border border-gray-200 rounded-lg pl-3 pr-7 py-2 bg-white focus:outline-none focus:border-[#ef4444]"
                  />
                  <span className="absolute right-2.5 top-2 text-gray-400 text-xs">
                    đ
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Giá trị bảo hiểm hàng hóa
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={insuranceValue}
                    onChange={(e) => setInsuranceValue(e.target.value)}
                    placeholder="Nhập giá trị hàng hóa"
                    className="w-full text-xs border border-gray-200 rounded-lg pl-3 pr-7 py-2 bg-white focus:outline-none focus:border-[#ef4444]"
                  />
                  <span className="absolute right-2.5 top-2 text-gray-400 text-xs">
                    đ
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Trọng lượng & Kích thước */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Trọng lượng (kg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#ef4444]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Kích thước (cm)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="number"
                    placeholder="Dài"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white text-center focus:outline-none focus:border-[#ef4444]"
                  />
                  <input
                    type="number"
                    placeholder="Rộng"
                    value={widthCm}
                    onChange={(e) => setWidthCm(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white text-center focus:outline-none focus:border-[#ef4444]"
                  />
                  <input
                    type="number"
                    placeholder="Cao"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white text-center focus:outline-none focus:border-[#ef4444]"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Trọng lượng quy đổi gợi ý: <span className="font-semibold text-gray-700">{convertedWeight}</span> (Kg)
                </p>
              </div>
            </div>

            {/* Row 3: Nội dung hàng hóa & Ghi chú */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Nội dung hàng hóa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#ef4444]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Ghi chú giao hàng
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#ef4444]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
              isWardEmpty
                ? 'bg-gray-200 text-gray-400 cursor-pointer'
                : 'bg-[#111827] hover:bg-black text-white cursor-pointer'
            }`}
          >
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
};
