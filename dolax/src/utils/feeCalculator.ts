import { FeeBracket } from '../types';

/**
 * Thuật toán tính cước vận chuyển chuẩn xác theo khoảng cân nặng và bước nhảy:
 * 
 * 1. Nếu đơn nằm trong khoảng cân nặng đã cài (minWeight <= weight <= maxWeight):
 *    -> Áp dụng ngay mức phí cơ sở (fb.fee).
 * 
 * 2. Nếu đơn nặng hơn tất cả các mốc cài đặt hoặc nằm ngoài khoảng có bước nhảy:
 *    -> Lấy mốc trọng lượng bên dưới gần nhất (highest maxWeight <= weight hoặc bracket có stepWeight > 0).
 *    -> Số lượng bước nhảy = Math.ceil((weight - baseMaxWeight) / stepWeight).
 *    -> Tổng cước = baseFee + (số bước nhảy * stepFee).
 * 
 * Ví dụ thực tế:
 * - Khoảng 1: 0.01kg - 1kg -> 17.000đ (bước nhảy = 0, cước vượt = 0)
 * - Khoảng 2: 1.01kg - 2kg -> 19.000đ, bước nhảy trọng lượng = 1kg, đơn giá vượt = 5.000đ
 *   + Đơn 0.5kg  -> 17.000đ (thuộc mốc 1)
 *   + Đơn 1.5kg  -> 19.000đ (thuộc mốc 2)
 *   + Đơn 3.0kg  -> Mốc 2kg (19.000đ) + 1 bước nhảy 1kg (1 * 5.000đ) = 24.000đ
 *   + Đơn 3.5kg  -> Mốc 2kg (19.000đ) + 2 bước nhảy 1kg (ceil(1.5/1) * 5.000đ) = 29.000đ
 *   + Đơn 4.0kg  -> Mốc 2kg (19.000đ) + 2 bước nhảy 1kg (ceil(2.0/1) * 5.000đ) = 29.000đ
 */
export const calculateShippingFeeByWeight = (
  weightKg: number,
  feeBrackets: FeeBracket[],
  defaultFee: number = 200000
): { fee: number; calculationDetails: string } => {
  if (!feeBrackets || feeBrackets.length === 0) {
    return { fee: defaultFee, calculationDetails: `Cước mặc định: ${defaultFee.toLocaleString()}đ` };
  }

  // Sắp xếp các khoảng theo trọng lượng tăng dần
  const sorted = [...feeBrackets].sort((a, b) => a.minWeight - b.minWeight);

  // 1. Kiểm tra đơn hàng có rơi vào chính xác khoảng nào đã cài không
  const directMatch = sorted.find(
    (fb) => weightKg >= fb.minWeight && weightKg <= fb.maxWeight
  );

  if (directMatch) {
    return {
      fee: directMatch.fee,
      calculationDetails: `Khớp khoảng [${directMatch.minWeight}kg - ${directMatch.maxWeight}kg]: ${directMatch.fee.toLocaleString()}đ`,
    };
  }

  // 2a. Trọng lượng nằm dưới mốc đầu tiên hoặc rơi vào khoảng hở giữa hai mốc
  //     (ví dụ mốc 1 kết thúc ở 1kg, mốc 2 bắt đầu ở 1.01kg, đơn nặng 1.005kg):
  //     áp mức phí của mốc cao hơn kế tiếp, không để khách được tính rẻ hơn.
  const upperBracket = sorted.find((fb) => weightKg < fb.minWeight);
  if (upperBracket) {
    return {
      fee: upperBracket.fee,
      calculationDetails: `Nằm giữa hai mốc, áp mốc kế tiếp [${upperBracket.minWeight}kg - ${upperBracket.maxWeight}kg]: ${upperBracket.fee.toLocaleString()}đ`,
    };
  }

  // 2b. Vượt quá mốc cao nhất: dùng bước nhảy của mốc cuối nếu có cấu hình
  const baseBracket = sorted[sorted.length - 1];
  if (baseBracket.stepWeight && baseBracket.stepWeight > 0 && baseBracket.stepFee && baseBracket.stepFee > 0) {
    const extraWeight = weightKg - baseBracket.maxWeight;
    const numSteps = Math.ceil(extraWeight / baseBracket.stepWeight);
    const totalExtraFee = numSteps * baseBracket.stepFee;
    const finalFee = baseBracket.fee + totalExtraFee;

    return {
      fee: finalFee,
      calculationDetails: `Mốc ${baseBracket.maxWeight}kg (${baseBracket.fee.toLocaleString()}đ) + ${numSteps} bước nhảy ${baseBracket.stepWeight}kg (${numSteps} x ${baseBracket.stepFee.toLocaleString()}đ) = ${finalFee.toLocaleString()}đ`,
    };
  }

  // 3. Vượt mốc cao nhất mà không có bước nhảy: lấy mức cao hơn giữa cước mặc định và
  //    cước mốc cuối, để đơn nặng hơn không bao giờ rẻ hơn đơn nhẹ hơn.
  const fallbackFee = Math.max(defaultFee, baseBracket.fee);
  return {
    fee: fallbackFee,
    calculationDetails: `Vượt bảng cước, áp mức cao hơn giữa cước mặc định và mốc cuối: ${fallbackFee.toLocaleString()}đ`,
  };
};
