import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchCreditBalance,
  fetchCreditTransactions,
  fetchWalletBalance,
  fetchWalletTransactions,
  initiateMobileMoneyDeposit,
  pollPaymentStatus,
  purchaseCreditsFromWallet,
  requestWithdrawal,
  validatePhone,
} from '../services/api/payments';
import { useAuthStore } from '../store/auth-store';

export function useWalletBalance() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => fetchWalletBalance(token!),
    enabled: Boolean(token),
    staleTime: 30_000,
  });
}

export function useCreditBalance() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['credit-balance'],
    queryFn: () => fetchCreditBalance(token!),
    enabled: Boolean(token),
    staleTime: 30_000,
  });
}

export function useWalletTransactions(page = 1) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['wallet-transactions', page],
    queryFn: () => fetchWalletTransactions(token!, page),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}

export function useCreditTransactions(page = 1) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['credit-transactions', page],
    queryFn: () => fetchCreditTransactions(token!, page),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}

export function useValidatePhone() {
  const token = useAuthStore((state) => state.token);
  return useMutation({
    mutationFn: (phone: string) => validatePhone(token!, phone),
  });
}

export function useInitiateTopup() {
  const token = useAuthStore((state) => state.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amount: number; phone: string; purpose: 'wallet_topup' | 'credits_purchase'; credits_amount?: number }) =>
      initiateMobileMoneyDeposit(token!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
  });
}

export function usePollPaymentStatus() {
  const token = useAuthStore((state) => state.token);
  return useMutation({
    mutationFn: (reference: string) => pollPaymentStatus(token!, reference),
  });
}

export function usePurchaseCredits() {
  const token = useAuthStore((state) => state.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ugxAmount: number) => purchaseCreditsFromWallet(token!, ugxAmount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['credit-balance'] });
    },
  });
}

export function useRequestWithdrawal() {
  const token = useAuthStore((state) => state.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amount: number; phone: string }) => requestWithdrawal(token!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
  });
}
