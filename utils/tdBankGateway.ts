export interface TDBankPaymentRequest {
  bookingId: string;
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  paymentToken?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface TDBankVerifyRequest {
  bookingId?: string;
  orderNumber?: string;
  transactionId?: string;
  approvedHint?: string | number | boolean;
  statusHint?: string;
}

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface TDBankPaymentSession {
  provider: 'td-bank';
  configured: boolean;
  paymentSessionId: string;
  checkoutUrl: string | null;
  approved?: boolean;
  transactionId?: string | number | null;
  orderNumber?: string;
  amount?: number;
  currency?: string;
  raw?: unknown;
  message?: string;
}

export const TD_BANK_PAYMENT_METHOD = 'TD Bank Card';
export const TD_BANK_PAYMENT_FEE_RATE = 0.025;

export const PAYMENT_METHOD_OPTIONS = [
  'Cash',
  TD_BANK_PAYMENT_METHOD,
  'Credit Card',
  'Debit Card',
  'PayPal',
  'Email Transfer',
];

export const isTDBankPaymentMethod = (paymentMethod: string): boolean => {
  const normalized = paymentMethod.trim().toLowerCase();
  return normalized.includes('td bank') || normalized.includes('credit') || normalized.includes('debit');
};

export const calculateTDBankFee = (amount: number): number => {
  return Math.round(amount * TD_BANK_PAYMENT_FEE_RATE * 100) / 100;
};

const getPaymentEndpoints = (): string[] => {
  const extra = (Constants.expoConfig?.extra || Constants.manifest2?.extra || {}) as {
    tdPaymentEndpoint?: string;
    tdPaymentEndpointAndroid?: string;
    tdPaymentEndpointFallback?: string;
  };

  const primary = process.env.EXPO_PUBLIC_TD_PAYMENT_ENDPOINT;
  const androidOverride = process.env.EXPO_PUBLIC_TD_PAYMENT_ENDPOINT_ANDROID;
  const fallback = process.env.EXPO_PUBLIC_TD_PAYMENT_ENDPOINT_FALLBACK;

  const configPrimary = extra.tdPaymentEndpoint;
  const configAndroidOverride = extra.tdPaymentEndpointAndroid;
  const configFallback = extra.tdPaymentEndpointFallback;

  const orderedCandidates = [
    Platform.OS === 'android' ? androidOverride : undefined,
    Platform.OS === 'android' ? configAndroidOverride : undefined,
    primary,
    fallback,
    configPrimary,
    configFallback,
  ];

  const unique = Array.from(new Set(orderedCandidates.filter((value): value is string => Boolean(value))));

  if (unique.length === 0) {
    throw new Error(
      'TD payment endpoint is not configured. Set EXPO_PUBLIC_TD_PAYMENT_ENDPOINT (and optionally EXPO_PUBLIC_TD_PAYMENT_ENDPOINT_ANDROID / EXPO_PUBLIC_TD_PAYMENT_ENDPOINT_FALLBACK).'
    );
  }

  return unique;
};

export const getTDBankProxyOrigin = (): string => {
  const endpoints = getPaymentEndpoints();

  for (const endpoint of endpoints) {
    try {
      const parsed = new URL(endpoint);
      if (parsed.protocol && parsed.host) {
        return `${parsed.protocol}//${parsed.host}`;
      }
    } catch {
      // Try next endpoint candidate.
    }
  }

  return '';
};

const getVerifyEndpoints = (): string[] => {
  const extra = (Constants.expoConfig?.extra || Constants.manifest2?.extra || {}) as {
    tdPaymentVerifyEndpoint?: string;
    tdPaymentVerifyEndpointAndroid?: string;
    tdPaymentVerifyEndpointFallback?: string;
  };

  const primary = process.env.EXPO_PUBLIC_TD_PAYMENT_VERIFY_ENDPOINT;
  const androidOverride = process.env.EXPO_PUBLIC_TD_PAYMENT_VERIFY_ENDPOINT_ANDROID;
  const fallback = process.env.EXPO_PUBLIC_TD_PAYMENT_VERIFY_ENDPOINT_FALLBACK;

  const configPrimary = extra.tdPaymentVerifyEndpoint;
  const configAndroidOverride = extra.tdPaymentVerifyEndpointAndroid;
  const configFallback = extra.tdPaymentVerifyEndpointFallback;

  const derivedFromPaymentEndpoint = getPaymentEndpoints().map((endpoint) => {
    try {
      const parsed = new URL(endpoint);
      parsed.pathname = parsed.pathname.replace(/\/api\/td-payment\/?$/i, '/api/td-verify');
      return parsed.toString();
    } catch {
      return endpoint.replace(/\/api\/td-payment\/?$/i, '/api/td-verify');
    }
  });

  const orderedCandidates = [
    Platform.OS === 'android' ? androidOverride : undefined,
    Platform.OS === 'android' ? configAndroidOverride : undefined,
    primary,
    fallback,
    configPrimary,
    configFallback,
    ...derivedFromPaymentEndpoint,
  ];

  return Array.from(new Set(orderedCandidates.filter((value): value is string => Boolean(value))));
};

const positivePaymentStates = new Set([
  '1',
  'true',
  'approved',
  'approve',
  'success',
  'succeeded',
  'ok',
  'yes',
  'y',
  'complete',
  'completed',
  'paid',
]);

const negativePaymentStates = new Set(['0', 'false', 'cancelled', 'canceled', 'declined', 'failed', 'error', 'no', 'n']);

const readPaymentState = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (positivePaymentStates.has(normalized)) {
    return true;
  }

  if (negativePaymentStates.has(normalized)) {
    return false;
  }

  return undefined;
};

const extractApprovedFromPayload = (payload: any): boolean | undefined => {
  return (
    readPaymentState(payload?.approved) ??
    readPaymentState(payload?.status) ??
    readPaymentState(payload?.trnApproved) ??
    readPaymentState(payload?.trnResponse) ??
    readPaymentState(payload?.transaction_status) ??
    readPaymentState(payload?.payment_status) ??
    readPaymentState(payload?.data?.approved) ??
    readPaymentState(payload?.data?.status)
  );
};

const extractCheckoutUrl = (payload: any): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return (
    payload?.checkoutUrl ||
    payload?.checkout_url ||
    payload?.url ||
    payload?.redirect_url ||
    payload?.checkout?.url ||
    payload?.checkout?.checkout_url ||
    payload?.data?.checkoutUrl ||
    payload?.data?.checkout_url ||
    payload?.data?.url ||
    payload?.data?.redirect_url ||
    payload?.raw?.checkoutUrl ||
    payload?.raw?.checkout_url ||
    payload?.raw?.url ||
    payload?.raw?.redirect_url ||
    null
  );
};

export const createTDBankPaymentSession = async (
  request: TDBankPaymentRequest
): Promise<TDBankPaymentSession> => {
  const endpoints = getPaymentEndpoints();
  let lastPayload: any = null;
  let lastStatus = 0;
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const payload = await response.json().catch(() => ({}));
      const checkoutUrl = extractCheckoutUrl(payload);

      lastPayload = payload;
      lastStatus = response.status;

      if (checkoutUrl) {
        return {
          provider: 'td-bank',
          configured: Boolean(payload?.configured ?? true),
          paymentSessionId: payload?.paymentSessionId || payload?.payment_session_id || `td_${request.bookingId}`,
          checkoutUrl,
          approved: payload?.approved,
          transactionId: payload?.transactionId ?? payload?.transaction_id ?? null,
          orderNumber: payload?.orderNumber || payload?.order_number || request.bookingId,
          amount: payload?.amount ?? request.amount,
          currency: payload?.currency || request.currency,
          raw: payload,
          message: payload?.message,
        };
      }

      if (!response.ok) {
        const message = payload?.error || payload?.message || 'Unable to create TD payment session.';
        throw new Error(message);
      }
    } catch (error) {
      lastError = error;
    }
  }

  const details = [
    `status=${lastStatus || 'n/a'}`,
    `message=${lastPayload?.message || lastPayload?.error || 'missing checkoutUrl from payment endpoint'}`,
  ].join(', ');

  if (lastError instanceof Error) {
    throw new Error(`${lastError.message} (${details})`);
  }

  throw new Error(`Unable to create TD payment session (${details}).`);
};

export const verifyTDBankPayment = async (request: TDBankVerifyRequest): Promise<boolean> => {
  const endpoints = getVerifyEndpoints();

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: request.bookingId,
          orderNumber: request.orderNumber || request.bookingId,
          transactionId: request.transactionId,
          approved: request.approvedHint,
          status: request.statusHint,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        const verified = payload?.verified === true;
        const approved = extractApprovedFromPayload(payload);

        if (verified && approved === true) {
          return true;
        }

        if (approved === true && (request.transactionId || request.orderNumber || request.bookingId)) {
          return true;
        }
      }
    } catch (error) {
      // Try fallback endpoint.
    }
  }

  return readPaymentState(request.approvedHint) === true || readPaymentState(request.statusHint) === true;
};