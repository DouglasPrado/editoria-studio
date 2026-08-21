import { useClerk, useUser } from "@clerk/react";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = { redirectOnUnauthenticated?: boolean; redirectPath?: string; };
const externalRuntime = import.meta.env.VITE_APP_RUNTIME === "external";

function useManusAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => utils.auth.me.setData(undefined, null) });
  const logout = useCallback(async () => { try { await logoutMutation.mutateAsync(); } catch (error: unknown) { if (!(error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED")) throw error; } finally { try { sessionStorage.removeItem("manus-cookie"); } catch {} utils.auth.me.setData(undefined, null); await utils.auth.me.invalidate(); } }, [logoutMutation, utils]);
  const state = useMemo(() => ({ user: meQuery.data ?? null, loading: meQuery.isLoading || logoutMutation.isPending, error: meQuery.error ?? logoutMutation.error ?? null, isAuthenticated: Boolean(meQuery.data) }), [meQuery.data, meQuery.error, meQuery.isLoading, logoutMutation.error, logoutMutation.isPending]);
  useEffect(() => { if (!redirectOnUnauthenticated || meQuery.isLoading || logoutMutation.isPending || state.user || typeof window === "undefined") return; if (redirectPath && window.location.pathname === redirectPath) return; if (redirectPath) window.location.href = redirectPath; else startLogin(); }, [redirectOnUnauthenticated, redirectPath, logoutMutation.isPending, meQuery.isLoading, state.user]);
  return { ...state, refresh: () => meQuery.refetch(), logout, startLogin };
}

function useExternalAuth(options?: UseAuthOptions) {
  const { isLoaded, isSignedIn, user } = useUser();
  const clerk = useClerk();
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const startExternalLogin = useCallback(() => clerk.redirectToSignIn(), [clerk]);
  useEffect(() => { if (redirectOnUnauthenticated && isLoaded && !isSignedIn) startExternalLogin(); }, [redirectOnUnauthenticated, isLoaded, isSignedIn, startExternalLogin]);
  return {
    user: user ? { id: 0, openId: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Criadora", email: user.primaryEmailAddress?.emailAddress ?? null, loginMethod: "clerk", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null,
    loading: !isLoaded,
    error: null,
    isAuthenticated: Boolean(isSignedIn),
    refresh: async () => undefined,
    logout: () => clerk.signOut(),
    startLogin: startExternalLogin,
  };
}

export function useAuth(options?: UseAuthOptions) { return externalRuntime ? useExternalAuth(options) : useManusAuth(options); }
