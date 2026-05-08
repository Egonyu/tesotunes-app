import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost } from '../services/api/client';
import { useAuthStore } from '../store/auth-store';

export type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  priceUgx: number;
  priceLabel: string;
  period: string;
  features: string[];
  isCurrent: boolean;
  isPopular: boolean;
};

type ApiPlan = {
  id?: number | string;
  name?: string;
  slug?: string;
  price?: number | string;
  price_ugx?: number | string;
  billing_period?: string;
  period?: string;
  features?: string[];
  is_current?: boolean;
  is_popular?: boolean;
};

type ApiPlansResponse =
  | ApiPlan[]
  | { data?: ApiPlan[]; plans?: ApiPlan[] };

const PLAN_FEATURES: Record<string, string[]> = {
  free: ['10 downloads/day', 'Standard 128kbps audio', 'Ad-supported listening', 'Basic search and discovery'],
  premium: ['Unlimited downloads', 'High quality 320kbps audio', 'Ad-free experience', 'Offline listening', 'Priority support'],
  artist: ['Everything in Premium', 'Upload and distribute music', 'Artist analytics dashboard', 'Revenue tracking', 'Fan engagement tools'],
  label: ['Everything in Artist', 'Multi-artist management', 'Label analytics', 'Bulk uploads', 'Dedicated account manager'],
};

function mapPlan(plan: ApiPlan, index: number): SubscriptionPlan {
  const slug = plan.slug ?? plan.name?.toLowerCase().replace(/\s+/g, '-') ?? `plan-${index}`;
  const priceUgx = Number(plan.price_ugx ?? plan.price ?? 0);
  const period = plan.billing_period ?? plan.period ?? 'month';

  return {
    id: String(plan.id ?? index),
    name: plan.name ?? 'Plan',
    slug,
    priceUgx,
    priceLabel: priceUgx === 0 ? 'Free' : `UGX ${priceUgx.toLocaleString()} / ${period}`,
    period,
    features: plan.features?.length ? plan.features : (PLAN_FEATURES[slug] ?? PLAN_FEATURES.free),
    isCurrent: Boolean(plan.is_current),
    isPopular: Boolean(plan.is_popular),
  };
}

const FALLBACK_PLANS: SubscriptionPlan[] = [
  { id: 'free', name: 'Free', slug: 'free', priceUgx: 0, priceLabel: 'Free', period: 'month', features: PLAN_FEATURES.free, isCurrent: true, isPopular: false },
  { id: 'premium', name: 'Premium', slug: 'premium', priceUgx: 15000, priceLabel: 'UGX 15,000 / month', period: 'month', features: PLAN_FEATURES.premium, isCurrent: false, isPopular: true },
  { id: 'artist', name: 'Artist', slug: 'artist', priceUgx: 25000, priceLabel: 'UGX 25,000 / month', period: 'month', features: PLAN_FEATURES.artist, isCurrent: false, isPopular: false },
];

export function useSubscriptionPlans() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      try {
        const response = await apiGet<ApiPlansResponse>('/subscriptions/plans', token ?? undefined);
        const items: ApiPlan[] = Array.isArray(response) ? response : (response.data ?? response.plans ?? []);
        if (items.length === 0) return FALLBACK_PLANS;
        return items.map(mapPlan);
      } catch {
        return FALLBACK_PLANS;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubscribe() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      if (!token) throw new Error('Sign in to subscribe.');
      await apiPost(`/subscriptions/${planId}/subscribe`, {}, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}
