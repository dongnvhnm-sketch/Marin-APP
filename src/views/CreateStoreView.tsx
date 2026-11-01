import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  Check,
  Copy,
  CheckCircle2,
  ShieldCheck,
  X,
  Loader2,
  Database,
  Layers,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
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
import { ViettelPostLocationModal } from '../components/ViettelPostLocationModal';
import {
  SearchableLocationSelect,
  LocationOption,
} from '../components/SearchableLocationSelect';

export const CreateStoreView: React.FC = () => {
  const { addStore, setCurrentPage, setSelectedStoreIdForDetail } = useApp();

  // Trạng thái thông tin chung của cửa hàng
  const [isActive, setIsActive] = useState<boolean>(true);
  const [storeName, setStoreName] = useState<string>('');
  const [customCode, setCustomCode] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');

  // Chuẩn địa danh ViettelPost: 'v3' (mới - 2 cấp) hoặc 'v2' (cũ - 3 cấp)
  const [locationStandard, setLocationStandard] = useState<'v3' | 'v2'>('v3');
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);

  // Dữ liệu V3 (Mới)
  const [v3Provinces, setV3Provinces] = useState<ViettelProvince[]>([]);
  const [v3Wards, setV3Wards] = useState<ViettelWardV3[]>([]);
  const [selectedV3ProvinceId, setSelectedV3ProvinceId] = useState<number | ''>('');
  const [selectedV3WardId, setSelectedV3WardId] = useState<number | ''>('');

  // Dữ liệu V2 (Cũ)
  const [v2Provinces, setV2Provinces] = useState<ViettelProvince[]>([]);
  const [v2Districts, setV2Districts] = useState<ViettelDistrict[]>([]);
  const [v2Wards, setV2Wards] = useState<ViettelWardV2[]>([]);
  const [selectedV2ProvinceId, setSelectedV2ProvinceId] = useState<number | ''>('');
  const [selectedV2DistrictId, setSelectedV2DistrictId] = useState<number | ''>('');
  const [selectedV2WardId, setSelectedV2WardId] = useState<number | ''>('');

  // Trường địa chỉ chi tiết (số nhà, tên đường, tòa nhà...)
  const [detailAddress, setDetailAddress] = useState<string>('');

  // Trạng thái đang tải dữ liệu từ API ViettelPost
  const [loadingProvinces, setLoadingProvinces] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingWards, setLoadingWards] = useState<boolean>(false);

  // Thông báo lỗi validate
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; email?: string }>({});

  // Modal hiển thị thông tin đăng nhập sau khi tạo thành công
  const [createdModalData, setCreatedModalData] = useState<{
    id: string;
    storeName: string;
    username: string;
    password: string;
    phone: string;
    email: string;
  } | null>(null);

  const [copied, setCopied] = useState<boolean>(false);

  // Sinh mật khẩu tự động ngẫu nhiên độ mạnh cao
  const generateStrongPassword = (): string => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const specials = '@#$%&*!?';
    let pwd = '';
    pwd += uppercase[Math.floor(Math.random() * uppercase.length)];
    pwd += lowercase[Math.floor(Math.random() * lowercase.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += specials[Math.floor(Math.random() * specials.length)];
    const all = uppercase + lowercase + numbers + specials;
    for (let i = 0; i < 8; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    return pwd
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  };

  // Nạp danh sách tỉnh thành ViettelPost khi vào trang hoặc chuyển chuẩn
  useEffect(() => {
    let isMounted = true;
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        if (locationStandard === 'v3') {
          const list = await getV3Provinces();
          if (isMounted) setV3Provinces(list);
        } else {
          const list = await getV2Provinces();
          if (isMounted) setV2Provinces(list);
        }
      } catch (err) {
        console.error('Lỗi tải danh mục Tỉnh ViettelPost:', err);
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    };

    loadProvinces();
    return () => {
      isMounted = false;
    };
  }, [locationStandard]);

  // Chuyển đổi danh mục sang LocationOption
  const v3ProvinceOptions: LocationOption[] = useMemo(
    () =>
      v3Provinces.map((p) => ({
        value: p.PROVINCE_ID,
        label: p.PROVINCE_NAME,
        code: p.PROVINCE_CODE,
      })),
    [v3Provinces]
  );

  const v3WardOptions: LocationOption[] = useMemo(
    () =>
      v3Wards.map((w) => ({
        value: w.WARDS_ID,
        label: w.WARDS_NAME,
      })),
    [v3Wards]
  );

  const v2ProvinceOptions: LocationOption[] = useMemo(
    () =>
      v2Provinces.map((p) => ({
        value: p.PROVINCE_ID,
        label: p.PROVINCE_NAME,
        code: p.PROVINCE_CODE,
      })),
    [v2Provinces]
  );

  const v2DistrictOptions: LocationOption[] = useMemo(
    () =>
      v2Districts.map((d) => ({
        value: d.DISTRICT_ID,
        label: d.DISTRICT_NAME,
        code: d.DISTRICT_VALUE,
      })),
    [v2Districts]
  );

  const v2WardOptions: LocationOption[] = useMemo(
    () =>
      v2Wards.map((w) => ({
        value: w.WARDS_ID,
        label: w.WARDS_NAME,
      })),
    [v2Wards]
  );

  // V3: Khi chọn Tỉnh mới -> nạp Phường/Xã mới trực thuộc
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
      console.error('Lỗi nạp Phường/Xã V3 ViettelPost:', err);
    } finally {
      setLoadingWards(false);
    }
  };

  // V2: Khi chọn Tỉnh cũ -> nạp Quận/Huyện cũ
  const handleV2ProvinceChange = async (val: number | '') => {
    setSelectedV2ProvinceId(val);
    setSelectedV2DistrictId('');
    setV2Districts([]);
    setSelectedV2WardId('');
    setV2Wards([]);

    if (!val) return;

    setLoadingDistricts(true);
    try {
      const districtsList = await getV2Districts(Number(val));
      setV2Districts(districtsList);
    } catch (err) {
      console.error('Lỗi nạp Quận/Huyện V2 ViettelPost:', err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // V2: Khi chọn Quận/Huyện cũ -> nạp Phường/Xã cũ
  const handleV2DistrictChange = async (val: number | '') => {
    setSelectedV2DistrictId(val);
    setSelectedV2WardId('');
    setV2Wards([]);

    if (!val) return;

    setLoadingWards(true);
    try {
      const wardsList = await getV2Wards(Number(val));
      setV2Wards(wardsList);
    } catch (err) {
      console.error('Lỗi nạp Phường/Xã V2 ViettelPost:', err);
    } finally {
      setLoadingWards(false);
    }
  };

  // Kiểm tra tính hợp lệ của biểu mẫu trước khi gửi
  const validateForm = (): boolean => {
    const errors: { phone?: string; email?: string } = {};

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) {
      errors.phone = 'Số điện thoại bắt buộc phải đủ 10 chữ số (bắt đầu bằng số 0)';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Email không đúng định dạng (Ví dụ: shop@gmail.com)';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setErrorMsg(errors.phone || errors.email || 'Thông tin nhập chưa hợp lệ.');
      return false;
    }

    if (!storeName.trim() || !contactName.trim() || !username.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)');
      return false;
    }

    if (locationStandard === 'v3') {
      if (!selectedV3ProvinceId) {
        setErrorMsg('Vui lòng chọn Tỉnh / Thành phố mới');
        return false;
      }
    } else {
      if (!selectedV2ProvinceId) {
        setErrorMsg('Vui lòng chọn Tỉnh / Thành phố');
        return false;
      }
      if (!selectedV2DistrictId) {
        setErrorMsg('Vui lòng chọn Quận / Huyện');
        return false;
      }
    }

    setErrorMsg('');
    return true;
  };

  // Lưu thông tin cửa hàng
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const provinceName = locationStandard === 'v3'
      ? v3Provinces.find((item) => item.PROVINCE_ID === selectedV3ProvinceId)?.PROVINCE_NAME || ''
      : v2Provinces.find((item) => item.PROVINCE_ID === selectedV2ProvinceId)?.PROVINCE_NAME || '';

    const districtName = locationStandard === 'v3'
      ? ''
      : v2Districts.find((item) => item.DISTRICT_ID === selectedV2DistrictId)?.DISTRICT_NAME || '';

    const wardName = locationStandard === 'v3'
      ? v3Wards.find((item) => item.WARDS_ID === selectedV3WardId)?.WARDS_NAME || ''
      : v2Wards.find((item) => item.WARDS_ID === selectedV2WardId)?.WARDS_NAME || '';

    // Chuỗi địa chỉ hoàn chỉnh kết hợp cả Địa chỉ chi tiết và các cấp hành chính
    const administrativeParts = [wardName, districtName, provinceName].filter(Boolean).join(', ');
    const fullAddressString = detailAddress.trim()
      ? `${detailAddress.trim()}, ${administrativeParts}`
      : administrativeParts;

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const autoPassword = generateStrongPassword();

    const newId = addStore({
      name: storeName.trim(),
      contactName: contactName.trim(),
      phone: cleanPhone,
      email: email.trim(),
      status: isActive ? 'active' : 'inactive',
      username: username.trim(),
      address: fullAddressString,
      province: provinceName,
      ward: wardName ? `${wardName}, ${districtName}` : districtName,
      defaultFee: 200000,
      insuranceRate: 0.108,
      volumeRatio: 6000,
      feeBrackets: [
        { id: 'fb1', minWeight: 0.01, maxWeight: 1, fee: 17000, stepWeight: 0, stepFee: 0 },
        { id: 'fb2', minWeight: 1.01, maxWeight: 2, fee: 19000, stepWeight: 1, stepFee: 5000 },
      ],
      pickupPoints: [
        {
          id: 'pp1',
          name: `${storeName.trim()} - Kho Lấy Hàng`,
          phone: cleanPhone,
          address: fullAddressString,
          status: 'active',
        },
      ],
      carriers: [
        { id: 'c1', name: 'J&T Express', code: 'JNT', status: 'connected' },
        { id: 'c2', name: 'Viettel Post', code: 'VTP', status: 'connected' },
      ],
    });

    setSelectedStoreIdForDetail(newId);

    // Hiển thị modal thông tin đăng nhập tự sinh
    setCreatedModalData({
      id: newId,
      storeName: storeName.trim(),
      username: username.trim(),
      password: autoPassword,
      phone: cleanPhone,
      email: email.trim(),
    });
  };

  const handleCopyCredentials = () => {
    if (!createdModalData) return;
    const textToCopy = `THÔNG TIN ĐĂNG NHẬP CỬA HÀNG DOLAX
------------------------------------
Mã cửa hàng: ${createdModalData.id}
Tên cửa hàng: ${createdModalData.storeName}
Tên đăng nhập: ${createdModalData.username}
Mật khẩu: ${createdModalData.password}
Số điện thoại: ${createdModalData.phone}
Email: ${createdModalData.email}
------------------------------------
Đường dẫn đăng nhập: ${window.location.origin}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Tiêu đề & Breadcrumbs */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Tạo mới cửa hàng
        </h2>
        <div className="text-xs text-gray-500 mt-0.5 space-x-1">
          <span>Quản lý cửa hàng</span>
          <span>&gt;</span>
          <span
            onClick={() => setCurrentPage('stores')}
            className="hover:text-gray-900 cursor-pointer"
          >
            Danh sách cửa hàng
          </span>
          <span>&gt;</span>
          <span className="text-gray-700 font-medium">Tạo mới cửa hàng</span>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMsg && (
        <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center space-x-2">
          <span className="font-bold">Lưu ý:</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Phần 1: Thông tin chung */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Thông tin chung</h3>
              <p className="text-xs text-gray-400">Thông tin chung của cửa hàng</p>
            </div>

            {/* Toggle kích hoạt trạng thái */}
            <div className="flex items-center space-x-2 text-xs font-medium text-gray-700">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => setIsActive(!isActive)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
              <span>{isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tên cửa hàng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập tên cửa hàng"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
                required
              />
            </div>

            <div>
              <div className="flex items-center space-x-1 mb-1">
                <label className="text-xs font-semibold text-gray-700">Mã cửa hàng</label>
                <HelpCircle size={13} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Nhập mã cửa hàng (tùy chọn hoặc tự sinh)"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tên người liên hệ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập tên người liên hệ"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Số điện thoại <span className="text-rose-500">* (Đúng 10 số)</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="Ví dụ: 0987654321"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPhone(val);
                  if (!username || username === phone) setUsername(val);
                  if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: undefined });
                }}
                className={`w-full text-xs border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 ${
                  fieldErrors.phone
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-gray-200 focus:border-[#ef4444] focus:ring-[#ef4444]'
                }`}
                required
              />
              {fieldErrors.phone && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email <span className="text-rose-500">* (Đúng định dạng)</span>
              </label>
              <input
                type="email"
                placeholder="Ví dụ: shop@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                }}
                className={`w-full text-xs border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 ${
                  fieldErrors.email
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-gray-200 focus:border-[#ef4444] focus:ring-[#ef4444]'
                }`}
                required
              />
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Phần 2: Thông tin đăng nhập */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900">Thông tin đăng nhập</h3>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tên đăng nhập <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
              required
            />
          </div>
        </div>

        {/* Phần 3: Thông tin địa chỉ (Chuẩn ViettelPost) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-gray-900">Thông tin địa chỉ lấy hàng / Cửa hàng</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-[#ef4444] border border-rose-200">
                  <MapPin size={10} className="mr-1" /> Chuẩn ViettelPost
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Đồng bộ tự động dữ liệu hành chính mới v3 và cũ v2 từ ViettelPost Partner
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Nút chuyển đổi chuẩn V3 / V2 */}
              <div className="inline-flex p-0.5 bg-gray-100 rounded-lg border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setLocationStandard('v3')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center space-x-1 ${
                    locationStandard === 'v3'
                      ? 'bg-white text-[#ef4444] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Layers size={12} />
                  <span>Địa danh mới (v3)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocationStandard('v2')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center space-x-1 ${
                    locationStandard === 'v2'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>Địa danh cũ (v2)</span>
                </button>
              </div>

              {/* Nút mở Modal tra cứu cơ sở dữ liệu ViettelPost */}
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="px-2.5 py-1 text-xs border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg flex items-center space-x-1 transition-colors"
              >
                <Database size={12} className="text-[#ef4444]" />
                <span className="hidden sm:inline">Tra cứu dữ liệu</span>
              </button>
            </div>
          </div>

          {locationStandard === 'v3' ? (
            /* GIAO DIỆN CHUẨN MỚI V3 (2 CẤP) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Dropdown 1: Tỉnh / Thành phố mới */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>
                    Tỉnh / Thành phố mới (v3) <span className="text-rose-500">*</span>
                  </span>
                  {loadingProvinces && (
                    <span className="flex items-center text-[11px] text-gray-400">
                      <Loader2 size={12} className="animate-spin mr-1 text-[#ef4444]" />
                      Đang nạp...
                    </span>
                  )}
                </label>
                <SearchableLocationSelect
                  options={v3ProvinceOptions}
                  value={selectedV3ProvinceId}
                  onChange={handleV3ProvinceChange}
                  placeholder="Chọn hoặc gõ tên Tỉnh / TP mới"
                  isLoading={loadingProvinces}
                  required
                  emptyText="Không tìm thấy Tỉnh / TP nào"
                />
              </div>

              {/* Dropdown 2: Phường / Xã mới trực thuộc */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Phường / Xã mới (v3)</span>
                  {loadingWards && (
                    <span className="flex items-center text-[11px] text-gray-400">
                      <Loader2 size={12} className="animate-spin mr-1 text-[#ef4444]" />
                      Đang nạp...
                    </span>
                  )}
                </label>
                <SearchableLocationSelect
                  options={v3WardOptions}
                  value={selectedV3WardId}
                  onChange={(val) => setSelectedV3WardId(val)}
                  disabled={!selectedV3ProvinceId || loadingWards || v3Wards.length === 0}
                  placeholder={
                    !selectedV3ProvinceId
                      ? '-- Vui lòng chọn Tỉnh trước --'
                      : 'Chọn hoặc gõ tên Phường / Xã mới'
                  }
                  isLoading={loadingWards}
                  emptyText="Không tìm thấy Phường / Xã nào"
                />
              </div>
            </div>
          ) : (
            /* GIAO DIỆN CHUẨN CŨ V2 (3 CẤP) */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Dropdown 1: Tỉnh / TP V2 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>
                    Tỉnh / Thành phố <span className="text-rose-500">*</span>
                  </span>
                  {loadingProvinces && (
                    <span className="flex items-center text-[11px] text-gray-400">
                      <Loader2 size={12} className="animate-spin mr-1 text-[#ef4444]" />
                      Đang nạp...
                    </span>
                  )}
                </label>
                <SearchableLocationSelect
                  options={v2ProvinceOptions}
                  value={selectedV2ProvinceId}
                  onChange={handleV2ProvinceChange}
                  placeholder="Chọn hoặc gõ tên Tỉnh"
                  isLoading={loadingProvinces}
                  required
                  emptyText="Không tìm thấy Tỉnh / TP nào"
                />
              </div>

              {/* Dropdown 2: Quận / Huyện V2 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>
                    Quận / Huyện <span className="text-rose-500">*</span>
                  </span>
                  {loadingDistricts && (
                    <span className="flex items-center text-[11px] text-gray-400">
                      <Loader2 size={12} className="animate-spin mr-1 text-[#ef4444]" />
                      Đang nạp...
                    </span>
                  )}
                </label>
                <SearchableLocationSelect
                  options={v2DistrictOptions}
                  value={selectedV2DistrictId}
                  onChange={handleV2DistrictChange}
                  disabled={!selectedV2ProvinceId || loadingDistricts || v2Districts.length === 0}
                  placeholder={
                    !selectedV2ProvinceId
                      ? '-- Chọn Tỉnh trước --'
                      : 'Chọn hoặc gõ tên Quận / Huyện'
                  }
                  isLoading={loadingDistricts}
                  required
                  emptyText="Không tìm thấy Quận / Huyện nào"
                />
              </div>

              {/* Dropdown 3: Phường / Xã V2 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Phường / Xã</span>
                  {loadingWards && (
                    <span className="flex items-center text-[11px] text-gray-400">
                      <Loader2 size={12} className="animate-spin mr-1 text-[#ef4444]" />
                      Đang nạp...
                    </span>
                  )}
                </label>
                <SearchableLocationSelect
                  options={v2WardOptions}
                  value={selectedV2WardId}
                  onChange={(val) => setSelectedV2WardId(val)}
                  disabled={!selectedV2DistrictId || loadingWards || v2Wards.length === 0}
                  placeholder={
                    !selectedV2DistrictId
                      ? '-- Chọn Huyện trước --'
                      : 'Chọn hoặc gõ tên Phường / Xã'
                  }
                  isLoading={loadingWards}
                  emptyText="Không tìm thấy Phường / Xã nào"
                />
              </div>
            </div>
          )}

          {/* Hàng 2: Mục Địa chỉ chi tiết */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Địa chỉ chi tiết
            </label>
            <input
              type="text"
              placeholder="Nhập số nhà, tên đường, ngõ ngách, tòa nhà... (Ví dụ: Số 20, Ngõ 15 Duy Tân)"
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] bg-white text-gray-800 placeholder-gray-400 transition-all shadow-2xs hover:border-gray-300"
            />
          </div>
        </div>

        {/* Nút hành động Lưu / Hủy */}
        <div className="flex items-center justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={() => setCurrentPage('stores')}
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            Hoàn tất và lưu
          </button>
        </div>
      </form>

      {/* Modal xuất thông tin đăng nhập và mật khẩu tự động */}
      {createdModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            {/* Header modal */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Khởi tạo cửa hàng thành công!
                  </h3>
                  <p className="text-xs text-gray-500">
                    Hệ thống đã tự động tạo tài khoản và mật khẩu bảo mật cao.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCreatedModalData(null);
                  setCurrentPage('stores');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chi tiết tài khoản */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-gray-500">Tên cửa hàng:</span>
                <span className="font-bold text-gray-900">{createdModalData.storeName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-gray-500">Mã cửa hàng:</span>
                <span className="font-bold text-blue-600 font-mono">{createdModalData.id}</span>
              </div>

              {/* Tên đăng nhập */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-gray-500 font-medium">Tên đăng nhập:</span>
                <span className="font-bold text-gray-900 font-mono bg-white px-2 py-1 rounded border border-gray-200">
                  {createdModalData.username}
                </span>
              </div>

              {/* Mật khẩu ngẫu nhiên độ mạnh cao */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <div className="flex items-center space-x-1.5">
                  <span className="text-gray-500 font-medium">Mật khẩu tự động:</span>
                  <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    <ShieldCheck size={11} />
                    <span>Rất mạnh</span>
                  </span>
                </div>
                <span className="font-black text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 text-sm tracking-wide">
                  {createdModalData.password}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Số điện thoại liên hệ:</span>
                <span className="font-semibold text-gray-900">{createdModalData.phone}</span>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-black hover:bg-gray-800 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    <span>Đã sao chép thông tin đăng nhập!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Sao chép thông tin đăng nhập</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatedModalData(null);
                  setCurrentPage('stores');
                }}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Đến danh sách cửa hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tra cứu danh mục địa danh ViettelPost V3 & V2 */}
      <ViettelPostLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};
