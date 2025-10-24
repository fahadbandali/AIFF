import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ExchangeTokenRequest } from "../lib/api";

/**
 * Hook to fetch a Plaid Link token
 */
export function useLinkToken() {
  return useQuery({
    queryKey: ["plaid", "link-token"],
    queryFn: () => api.plaid.createLinkToken(),
    staleTime: 1000 * 60 * 20, // 20 minutes (tokens expire in 30)
    retry: 2,
  });
}

/**
 * Hook to exchange public token for access token
 */
export function useExchangeToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExchangeTokenRequest) => api.plaid.exchangeToken(data),
    onSuccess: () => {
      // Invalidate accounts query to refetch with new data
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

/**
 * Hook to fetch all accounts
 */
export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.accounts.getAll(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to delete an account
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade?: boolean }) =>
      api.accounts.delete(id, cascade),
    onSuccess: () => {
      // Invalidate accounts query to refetch data
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      // Also invalidate transactions in case they were cascade deleted
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
