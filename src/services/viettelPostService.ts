/**
 * Service quản lý nạp và tra cứu dữ liệu địa danh hành chính Việt Nam từ ViettelPost
 * - Chuẩn cũ (v2): 3 cấp gồm Tỉnh/Thành phố, Quận/Huyện, Phường/Xã
 *   + listProvince: https://partnerdev.viettelpost.vn/v2/categories/listProvince
 *   + listDistrict: https://partnerdev.viettelpost.vn/v2/categories/listDistrict?provinceId={id}
 *   + listWards: https://partnerdev.viettelpost.vn/v2/categories/listWards?districtId=-1
 * 
 * - Chuẩn mới (v3): 2 cấp theo cơ cấu sáp nhập hành chính mới của ViettelPost
 *   + listProvinceNew: https://partnerdev.viettelpost.vn/v3/categories/listProvinceNew
 *   + listWardsNew: https://partnerdev.viettelpost.vn/v3/categories/listWardsNew?provinceId={id}
 */

export interface ViettelProvince {
  PROVINCE_ID: number;
  PROVINCE_CODE: string;
  PROVINCE_NAME: string;
}

export interface ViettelDistrict {
  DISTRICT_ID: number;
  DISTRICT_VALUE: string;
  DISTRICT_NAME: string;
  PROVINCE_ID: number;
}

export interface ViettelWardV2 {
  WARDS_ID: number;
  WARDS_NAME: string;
  DISTRICT_ID: number;
}

export interface ViettelWardV3 {
  WARDS_ID: number;
  WARDS_NAME: string;
  PROVINCE_ID: number;
}

export type LocationStandard = 'v3' | 'v2';

// Cache nội bộ để phản hồi tức thì
let cachedV2Provinces: ViettelProvince[] | null = null;
let cachedV2Districts: ViettelDistrict[] | null = null;
let cachedV2Wards: ViettelWardV2[] | null = null;

let cachedV3Provinces: ViettelProvince[] | null = null;
let cachedV3Wards: ViettelWardV3[] | null = null;

/**
 * Nạp danh sách Tỉnh/TP chuẩn cũ V2
 */
export async function getV2Provinces(): Promise<ViettelProvince[]> {
  if (cachedV2Provinces && cachedV2Provinces.length > 0) {
    return cachedV2Provinces;
  }

  // Thử gọi proxy hoặc file nạp sẵn
  try {
    const res = await fetch('/api/viettelpost/v2/categories/listProvince');
    if (res.ok) {
      const data = await res.json();
      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        cachedV2Provinces = data.data;
        return data.data;
      }
    }
  } catch {
    // ignore
  }

  // Fallback sang file JSON lưu trữ sẵn
  try {
    const res = await fetch('/data/viettelpost/v2_provinces.json');
    const data = await res.json();
    if (data && data.data) {
      cachedV2Provinces = data.data;
      return data.data;
    }
  } catch (err) {
    console.error('Không thể nạp dữ liệu Tỉnh V2:', err);
  }

  return [];
}

/**
 * Nạp danh sách Quận/Huyện chuẩn cũ V2 (lọc theo provinceId)
 */
export async function getV2Districts(provinceId?: number): Promise<ViettelDistrict[]> {
  // Nếu có provinceId và muốn gọi API trực tiếp
  if (provinceId && provinceId > 0) {
    try {
      const res = await fetch(`/api/viettelpost/v2/categories/listDistrict?provinceId=${provinceId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          return data.data;
        }
      }
    } catch {
      // ignore
    }
  }

  // Nạp toàn bộ quận huyện từ cache hoặc file nạp sẵn
  if (!cachedV2Districts) {
    try {
      const res = await fetch('/data/viettelpost/v2_districts.json');
      const data = await res.json();
      if (data && data.data) {
        cachedV2Districts = data.data;
      }
    } catch (err) {
      console.error('Không thể nạp dữ liệu Quận/Huyện V2:', err);
      cachedV2Districts = [];
    }
  }

  if (provinceId && provinceId > 0 && cachedV2Districts) {
    return cachedV2Districts.filter((d) => d.PROVINCE_ID === provinceId);
  }

  return cachedV2Districts || [];
}

/**
 * Nạp danh sách Phường/Xã chuẩn cũ V2 (lọc theo districtId)
 */
export async function getV2Wards(districtId?: number): Promise<ViettelWardV2[]> {
  if (districtId && districtId > 0) {
    try {
      const res = await fetch(`/api/viettelpost/v2/categories/listWards?districtId=${districtId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          return data.data;
        }
      }
    } catch {
      // ignore
    }
  }

  // Fallback sang cache / file nạp sẵn listWards?districtId=-1
  if (!cachedV2Wards) {
    try {
      const res = await fetch('/data/viettelpost/v2_wards.json');
      const data = await res.json();
      if (data && data.data) {
        cachedV2Wards = data.data;
      }
    } catch (err) {
      console.error('Không thể nạp dữ liệu Phường/Xã V2:', err);
      cachedV2Wards = [];
    }
  }

  if (districtId && districtId > 0 && cachedV2Wards) {
    return cachedV2Wards.filter((w) => w.DISTRICT_ID === districtId);
  }

  return cachedV2Wards || [];
}

/**
 * Nạp danh sách Tỉnh/TP chuẩn mới V3
 */
export async function getV3Provinces(): Promise<ViettelProvince[]> {
  if (cachedV3Provinces && cachedV3Provinces.length > 0) {
    return cachedV3Provinces;
  }

  try {
    const res = await fetch('/api/viettelpost/v3/categories/listProvinceNew');
    if (res.ok) {
      const data = await res.json();
      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        cachedV3Provinces = data.data;
        return data.data;
      }
    }
  } catch {
    // ignore
  }

  try {
    const res = await fetch('/data/viettelpost/v3_provinces.json');
    const data = await res.json();
    if (data && data.data) {
      cachedV3Provinces = data.data;
      return data.data;
    }
  } catch (err) {
    console.error('Không thể nạp dữ liệu Tỉnh V3:', err);
  }

  return [];
}

/**
 * Nạp danh sách Phường/Xã trực thuộc chuẩn mới V3
 */
export async function getV3Wards(provinceId?: number): Promise<ViettelWardV3[]> {
  if (provinceId && provinceId > 0) {
    try {
      const res = await fetch(`/api/viettelpost/v3/categories/listWardsNew?provinceId=${provinceId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          return data.data;
        }
      }
    } catch {
      // ignore
    }
  }

  if (!cachedV3Wards) {
    try {
      const res = await fetch('/data/viettelpost/v3_wards.json');
      const data = await res.json();
      if (data && data.data) {
        cachedV3Wards = data.data;
      }
    } catch (err) {
      console.error('Không thể nạp dữ liệu Phường/Xã V3:', err);
      cachedV3Wards = [];
    }
  }

  if (provinceId && provinceId > 0 && cachedV3Wards) {
    return cachedV3Wards.filter((w) => w.PROVINCE_ID === provinceId);
  }

  return cachedV3Wards || [];
}
