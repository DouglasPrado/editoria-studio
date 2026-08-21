import { ClerkProvider } from "@clerk/react";
import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

const queryClient = new QueryClient();
const externalRuntime = import.meta.env.VITE_APP_RUNTIME === "external";
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError) || typeof window === "undefined" || error.message !== UNAUTHED_ERR_MSG) return;
  startLogin();
};
queryClient.getQueryCache().subscribe(event => { if (event.type === "updated" && event.action.type === "error") { redirectToLoginIfUnauthorized(event.query.state.error); console.error("[API Query Error]", event.query.state.error); } });
queryClient.getMutationCache().subscribe(event => { if (event.type === "updated" && event.action.type === "error") { redirectToLoginIfUnauthorized(event.mutation.state.error); console.error("[API Mutation Error]", event.mutation.state.error); } });

const trpcClient = trpc.createClient({ links: [httpBatchLink({
  url: "/api/trpc", transformer: superjson,
  headers() {
    if (externalRuntime) return {};
    try { const raw = sessionStorage.getItem("manus-cookie"); const pair = raw?.split(";").find(s => s.trim().startsWith(`${COOKIE_NAME}=`)); const token = pair?.trim().slice(`${COOKIE_NAME}=`.length); return token ? { Authorization: `Bearer ${token}` } : {}; } catch { return {}; }
  },
  fetch(input, init) { return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" }); },
})] });

function Application() { return <trpc.Provider client={trpcClient} queryClient={queryClient}><QueryClientProvider client={queryClient}><App /></QueryClientProvider></trpc.Provider>; }
const root = createRoot(document.getElementById("root")!);
root.render(externalRuntime && clerkPublishableKey ? <ClerkProvider publishableKey={clerkPublishableKey}><Application /></ClerkProvider> : <Application />);
