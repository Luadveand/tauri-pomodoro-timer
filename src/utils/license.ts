import { Polar } from "@polar-sh/sdk";

const POLAR_ORGANIZATION_ID = "<YOUR_ORG_ID_HERE>"; // Replace after Polar setup

const polar = new Polar();

interface ActivateSuccess {
  success: true;
  activationId: string;
  email: string | null;
  status: string;
}

interface ActivateFailure {
  success: false;
  error: string;
  offline?: boolean;
}

type ActivateResult = ActivateSuccess | ActivateFailure;

interface ValidateSuccess {
  valid: true;
  status: string;
  email: string | null;
  expiresAt: string | null;
}

interface ValidateFailure {
  valid: false;
  error?: string;
  offline?: boolean;
}

type ValidateResult = ValidateSuccess | ValidateFailure;

export const activateLicense = async (
  key: string,
  deviceLabel: string
): Promise<ActivateResult> => {
  try {
    const response = await polar.customerPortal.licenseKeys.activate({
      key,
      organizationId: POLAR_ORGANIZATION_ID,
      label: deviceLabel,
    });

    return {
      success: true,
      activationId: response.id,
      email: response.licenseKey.customer.email,
      status: response.licenseKey.status,
    };
  } catch (error: any) {
    if (error?.statusCode === 403) {
      return {
        success: false,
        error:
          "Activation limit reached (3 devices). Deactivate another device at polar.sh, or contact support.",
      };
    }
    if (error?.statusCode === 404) {
      return { success: false, error: "Invalid license key." };
    }
    // Network error or unknown
    return {
      success: false,
      error: "Unable to connect. Check your internet connection.",
      offline: true,
    };
  }
};

export const validateLicense = async (
  key: string,
  activationId: string
): Promise<ValidateResult> => {
  try {
    const response = await polar.customerPortal.licenseKeys.validate({
      key,
      organizationId: POLAR_ORGANIZATION_ID,
      activationId,
    });

    return {
      valid: response.status === "granted",
      status: response.status,
      email: response.customer.email,
      expiresAt: response.expiresAt?.toISOString() ?? null,
    };
  } catch (error: any) {
    if (error?.statusCode === 404) {
      return { valid: false, error: "License key not found." };
    }
    return { valid: false, offline: true };
  }
};

export const deactivateLicense = async (
  key: string,
  activationId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await polar.customerPortal.licenseKeys.deactivate({
      key,
      organizationId: POLAR_ORGANIZATION_ID,
      activationId,
    });
    return { success: true };
  } catch (error: any) {
    if (error?.statusCode === 404) {
      // Already deactivated, treat as success
      return { success: true };
    }
    return {
      success: false,
      error: "Unable to deactivate. Check your internet connection and try again.",
    };
  }
};
