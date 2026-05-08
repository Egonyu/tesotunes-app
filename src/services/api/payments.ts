import { apiGet, apiPost } from './client';
import type {
  CreditBalance,
  CreditTransaction,
  PaymentInitiateResponse,
  PaymentStatusResponse,
  SongPurchaseResponse,
  SubscriptionPlan,
  TipResponse,
  WalletBalance,
  WalletTransaction,
} from '../../types/api';

export async function fetchWalletBalance(token: string): Promise<WalletBalance> {
  const res = await apiGet<{ data?: WalletBalance } | WalletBalance>('/payments/wallet', token);
  return 'data' in res && res.data ? res.data : (res as WalletBalance);
}

export async function fetchWalletTransactions(token: string, page = 1): Promise<{ data: WalletTransaction[]; meta?: Record<string, unknown> }> {
  const res = await apiGet<{ data?: WalletTransaction[]; meta?: Record<string, unknown> } | WalletTransaction[]>(
    `/payments/wallet/transactions?page=${page}`,
    token,
  );
  if (Array.isArray(res)) {
    return { data: res };
  }
  return { data: res.data ?? [], meta: res.meta };
}

export async function fetchCreditBalance(token: string): Promise<CreditBalance> {
  const res = await apiGet<{ data?: CreditBalance } | CreditBalance>('/credits/balance', token);
  return 'data' in res && res.data ? res.data : (res as CreditBalance);
}

export async function fetchCreditTransactions(token: string, page = 1): Promise<{ data: CreditTransaction[]; meta?: Record<string, unknown> }> {
  const res = await apiGet<{ data?: CreditTransaction[]; meta?: Record<string, unknown> } | CreditTransaction[]>(
    `/credits/transactions?page=${page}`,
    token,
  );
  if (Array.isArray(res)) {
    return { data: res };
  }
  return { data: res.data ?? [], meta: res.meta };
}

export async function validatePhone(token: string, phone: string): Promise<{ valid: boolean; provider?: string; normalized?: string; message?: string }> {
  return apiPost('/payments/mobile-money/validate-phone', { phone }, token);
}

export async function initiateMobileMoneyDeposit(
  token: string,
  payload: { amount: number; phone: string; purpose: 'wallet_topup' | 'credits_purchase'; credits_amount?: number },
): Promise<PaymentInitiateResponse> {
  return apiPost('/payments/mobile-money/initiate', payload, token);
}

export async function pollPaymentStatus(token: string, reference: string): Promise<PaymentStatusResponse> {
  return apiGet(`/payments/mobile-money/status/${reference}`, token);
}

export async function purchaseCreditsFromWallet(token: string, ugxAmount: number): Promise<{ success: boolean; credits_purchased: number; wallet_balance: number; message?: string }> {
  return apiPost('/credits/purchase', { ugx_amount: ugxAmount }, token);
}

export async function sendTip(
  token: string,
  payload: { recipient_id: number | string; recipient_type: 'artist' | 'song'; amount: number },
): Promise<TipResponse> {
  return apiPost('/tips', payload, token);
}

export async function purchaseSong(
  token: string,
  songId: number | string,
  paymentMethod: 'wallet' | 'credits',
): Promise<SongPurchaseResponse> {
  return apiPost(`/songs/${songId}/purchase`, { payment_method: paymentMethod }, token);
}

export async function fetchSubscriptionPlans(token?: string): Promise<SubscriptionPlan[]> {
  const res = await apiGet<{ data?: SubscriptionPlan[] } | SubscriptionPlan[]>('/subscriptions/plans', token);
  if (Array.isArray(res)) return res;
  return res.data ?? [];
}

export async function requestWithdrawal(
  token: string,
  payload: { amount: number; phone: string },
): Promise<{ success: boolean; reference?: string; message?: string }> {
  return apiPost('/payments/wallet/withdraw', payload, token);
}
