import { describe, test, expect } from "vitest";
import { calculateFees } from "../../convex/domains/partners/utils";

describe("Partner Fee Calculations", () => {
  describe("calculateFees", () => {
    test("should calculate fees correctly for standard transaction", () => {
      const result = calculateFees({
        amount: 10000, // R$ 100,00
        feePercentage: 15, // 15%
      });

      expect(result.transactionAmount).toBe(10000);
      expect(result.stripeFee).toBe(319); // 2.9% + 29¢
      expect(result.platformFee).toBe(1500); // 15% of 10000
      expect(result.partnerAmount).toBe(8181); // 10000 - 319 - 1500
    });

    test("should handle zero fee percentage", () => {
      const result = calculateFees({
        amount: 10000,
        feePercentage: 0,
      });

      expect(result.platformFee).toBe(0);
      expect(result.partnerAmount).toBe(9681); // 10000 - 319 (stripe fee)
    });

    test("should handle 100% fee percentage", () => {
      const result = calculateFees({
        amount: 10000,
        feePercentage: 100,
      });

      expect(result.platformFee).toBe(10000);
      expect(result.partnerAmount).toBe(-319); // Platform takes everything, partner owes stripe fee
    });

    test("should handle small amounts", () => {
      const result = calculateFees({
        amount: 100, // R$ 1,00
        feePercentage: 15,
      });

      expect(result.stripeFee).toBe(31); // floor(100 * 0.029) + 29
      expect(result.platformFee).toBe(15); // 15% of 100
      expect(result.partnerAmount).toBe(54); // 100 - 31 - 15
    });

    test("should handle large amounts", () => {
      const result = calculateFees({
        amount: 1000000, // R$ 10.000,00
        feePercentage: 10,
      });

      expect(result.stripeFee).toBe(29029); // floor(1000000 * 0.029) + 29
      expect(result.platformFee).toBe(100000); // 10% of 1000000
      expect(result.partnerAmount).toBe(870971); // 1000000 - 29029 - 100000
    });

    test("should round down consistently", () => {
      const result = calculateFees({
        amount: 9999, // R$ 99,99
        feePercentage: 15.5,
      });

      expect(result.stripeFee).toBe(318); // floor(9999 * 0.029) + 29
      expect(result.platformFee).toBe(1549); // floor(9999 * 0.155)
      expect(result.partnerAmount).toBe(8132); // 9999 - 318 - 1549
    });

    test("should handle different fee percentages", () => {
      const amounts = [5000, 10000, 25000];
      const percentages = [5, 10, 15, 20, 25];

      amounts.forEach(amount => {
        percentages.forEach(percentage => {
          const result = calculateFees({ amount, feePercentage: percentage });
          
          // Verify totals always match
          expect(result.stripeFee + result.platformFee + result.partnerAmount).toBe(amount);
          
          // Verify platform fee is correct
          expect(result.platformFee).toBe(Math.floor(amount * (percentage / 100)));
        });
      });
    });

    test("should handle edge case with very small percentage", () => {
      const result = calculateFees({
        amount: 100,
        feePercentage: 0.1,
      });

      expect(result.platformFee).toBe(0); // floor(100 * 0.001) = 0
      expect(result.partnerAmount).toBe(69); // 100 - 31 - 0
    });

    test("should validate fee percentage range", () => {
      expect(() => calculateFees({
        amount: 10000,
        feePercentage: -1,
      })).toThrow("Fee percentage must be between 0 and 100");

      expect(() => calculateFees({
        amount: 10000,
        feePercentage: 101,
      })).toThrow("Fee percentage must be between 0 and 100");
    });

    test("should validate amount is positive", () => {
      expect(() => calculateFees({
        amount: -100,
        feePercentage: 15,
      })).toThrow("Amount must be positive");

      expect(() => calculateFees({
        amount: 0,
        feePercentage: 15,
      })).toThrow("Amount must be positive");
    });
  });

  describe("Real-world scenarios", () => {
    test("should handle typical accommodation booking", () => {
      const accommodationPrice = 150000; // R$ 1.500,00
      const result = calculateFees({
        amount: accommodationPrice,
        feePercentage: 18, // Higher fee for accommodations
      });

      expect(result.stripeFee).toBe(4379); // floor(150000 * 0.029) + 29
      expect(result.platformFee).toBe(27000); // 18% of 150000
      expect(result.partnerAmount).toBe(118621); // 150000 - 4379 - 27000
    });

    test("should handle typical activity booking", () => {
      const activityPrice = 25000; // R$ 250,00
      const result = calculateFees({
        amount: activityPrice,
        feePercentage: 12, // Lower fee for activities
      });

      expect(result.stripeFee).toBe(754); // floor(25000 * 0.029) + 29
      expect(result.platformFee).toBe(3000); // 12% of 25000
      expect(result.partnerAmount).toBe(21246); // 25000 - 754 - 3000
    });

    test("should handle package deal", () => {
      const packagePrice = 500000; // R$ 5.000,00
      const result = calculateFees({
        amount: packagePrice,
        feePercentage: 15, // Standard fee for packages
      });

      expect(result.stripeFee).toBe(14529); // floor(500000 * 0.029) + 29
      expect(result.platformFee).toBe(75000); // 15% of 500000
      expect(result.partnerAmount).toBe(410471); // 500000 - 14529 - 75000
    });
  });
}); 