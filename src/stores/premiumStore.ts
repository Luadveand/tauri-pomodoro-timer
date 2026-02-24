import { create } from 'zustand';
import { PremiumData } from '../types';
import { savePremiumState } from '../utils/storage';
import { activateLicense, validateLicense, deactivateLicense } from '../utils/license';

interface PremiumStore {
  // State
  licenseKey: string | null;
  isActive: boolean;
  activatedAt: string | null;
  lastValidated: string | null;
  customerEmail: string | null;
  activationId: string | null;
  deviceId: string | null;
  isValidating: boolean;
  validationError: string | null;

  // Actions
  loadPremiumState: (data: PremiumData) => void;
  activate: (key: string) => Promise<void>;
  revalidate: () => Promise<void>;
  deactivate: () => Promise<void>;
  checkGracePeriod: () => void;
}

const getPremiumData = (state: PremiumStore): PremiumData => ({
  licenseKey: state.licenseKey,
  isActive: state.isActive,
  activatedAt: state.activatedAt,
  lastValidated: state.lastValidated,
  customerEmail: state.customerEmail,
  activationId: state.activationId,
  deviceId: state.deviceId,
});

export const usePremiumStore = create<PremiumStore>((set, get) => ({
  licenseKey: null,
  isActive: false,
  activatedAt: null,
  lastValidated: null,
  customerEmail: null,
  activationId: null,
  deviceId: null,
  isValidating: false,
  validationError: null,

  loadPremiumState: (data: PremiumData) => {
    let deviceId = data.deviceId;
    if (!deviceId) {
      deviceId = "device-" + crypto.randomUUID();
      const stateWithDevice = { ...data, deviceId };
      set({
        ...data,
        deviceId,
        isValidating: false,
        validationError: null,
      });
      savePremiumState(stateWithDevice).catch(console.error);
      return;
    }
    set({
      ...data,
      isValidating: false,
      validationError: null,
    });
  },

  activate: async (key: string) => {
    set({ isValidating: true, validationError: null });

    const { deviceId } = get();
    const response = await activateLicense(key, deviceId || "unknown");

    if (response.success) {
      if (response.status !== "granted") {
        set({ isValidating: false, validationError: "License key is not active." });
        return;
      }

      const now = new Date().toISOString();
      set({
        licenseKey: key,
        isActive: true,
        activatedAt: now,
        lastValidated: now,
        customerEmail: response.email,
        activationId: response.activationId,
        isValidating: false,
        validationError: null,
      });

      const premiumData = getPremiumData(get());
      await savePremiumState(premiumData).catch(console.error);
    } else {
      set({ isValidating: false, validationError: response.error });
    }
  },

  revalidate: async () => {
    const { isActive, licenseKey, activationId } = get();
    if (!isActive || !licenseKey || !activationId) return;

    const response = await validateLicense(licenseKey, activationId);

    if (response.valid) {
      const now = new Date().toISOString();
      set({ lastValidated: now });
      const premiumData = getPremiumData(get());
      await savePremiumState(premiumData).catch(console.error);
    } else if (!response.offline) {
      // Key revoked or disabled online — clear premium
      set({
        isActive: false,
        licenseKey: null,
        customerEmail: null,
        activationId: null,
        activatedAt: null,
        lastValidated: null,
      });
      const premiumData = getPremiumData(get());
      await savePremiumState(premiumData).catch(console.error);
    }
    // If offline, do nothing — checkGracePeriod handles it
  },

  deactivate: async () => {
    const { licenseKey, activationId } = get();

    if (licenseKey && activationId) {
      const result = await deactivateLicense(licenseKey, activationId);
      if (!result.success) {
        set({ validationError: result.error || "Failed to deactivate." });
        return;
      }
    }

    set({
      licenseKey: null,
      isActive: false,
      activatedAt: null,
      lastValidated: null,
      customerEmail: null,
      activationId: null,
      validationError: null,
      // Keep deviceId — it's per-install, not per-license
    });

    const premiumData = getPremiumData(get());
    await savePremiumState(premiumData).catch(console.error);
  },

  checkGracePeriod: () => {
    const { isActive, lastValidated } = get();
    if (!isActive || !lastValidated) return;

    const daysSinceValidation =
      (Date.now() - new Date(lastValidated).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceValidation > 30) {
      set({ isActive: false });
      const premiumData = getPremiumData(get());
      savePremiumState(premiumData).catch(console.error);
    }
  },
}));
