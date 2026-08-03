import { isAfter, parseISO } from 'date-fns';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  verificationNeeded: boolean;
}

/**
 * Validates the extracted fields according to business rules.
 * Returns `verificationNeeded` true if any rule fails – the frontend will show a verification banner.
 */
export async function validateExtraction(data: Record<string, string>): Promise<ValidationResult> {
  const errors: string[] = [];

  // Policy Number must not be empty
  if (!data.policyNumber?.trim()) {
    errors.push('Policy Number cannot be empty');
  }

  // Vehicle Number Indian registration format: e.g., MH01AB1234
  const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
  if (data.vehicleNumber && !vehicleRegex.test(data.vehicleNumber.trim())) {
    errors.push('Vehicle Number must match Indian registration format');
  }

  // Policy dates validation
  const start = data.policyStartDate?.trim();
  const expiry = data.policyExpiryDate?.trim();
  if (start && expiry) {
    try {
      const startDate = parseISO(start);
      const expiryDate = parseISO(expiry);
      if (!isAfter(expiryDate, startDate)) {
        errors.push('Policy Expiry Date must be after Policy Start Date');
      }
    } catch {
      errors.push('Policy dates must be valid ISO date strings');
    }
  }

  // Premium must be numeric
  if (data.premiumAmount) {
    const premiumNum = Number(data.premiumAmount);
    if (Number.isNaN(premiumNum) || premiumNum < 0) {
      errors.push('Premium Amount must be a positive number');
    }
  }

  const verificationNeeded = errors.length > 0;
  return {
    isValid: !verificationNeeded,
    errors,
    verificationNeeded,
  };
}
