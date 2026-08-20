import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { CalendarDays, Grid2X2, Image, LayoutDashboard, LogOut, PanelLeft, Sparkles } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Visão geral", path: "/" },
  { icon: CalendarDays, label: "Planejamento", path: "/planejamento" },
  { icon: Grid2X2, label: "Linha editorial", path: "/editorial" },
  { icon: Image, label: "Moodboards", path: "/moodboards" },
  { icon: Sparkles, label: "Assistente", path: "/assistente" },
];

const SIDEBAR_WIDTH_KEY = "editoria-sidebar-width";
const DEFAULT_WIDTH = 262;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH);
  const { loading, user } = useAuth();
  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)), [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <SignInScreen />;
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><LayoutContent setSidebarWidth={setSidebarWidth}>{children}</LayoutContent></SidebarProvider>;
}

function SignInScreen() {
  return (
    <div className="grain min-h-screen bg-[#211B19] p-5 text-[#FBF7F0] sm:p-8">
      <main className="relative mx-auto grid min-h-[calc(100vh-40px)] max-w-6xl overflow-hidden rounded-[30px] border border-white/10 bg-[#2A2320] lg:grid-cols-[1.12fr_.88fr]">
        <div className="relative flex flex-col justify-between overflow-hidden p-8 sm:p-12">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#B6895D]/20 blur-3xl" />
          <div className="relative flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D3AF7C]/60 text-sm font-semibold">E</span><span className="text-sm font-semibold tracking-[0.18em] uppercase">Editoria</span></div>
          <div className="relative max-w-xl py-16 lg:py-0">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#D3AF7C]">Estratégia que ganha forma</p>
            <h1 className="serif text-5xl leading-[0.95] tracking-[-0.04em] sm:text-7xl">Conteúdo com <em className="font-normal text-[#D9B687]">intenção</em>, todos os dias.</h1>
            <p className="mt-7 max-w-md text-base leading-7 text-[#D8CCC0]">Organize o ritmo da sua marca, transforme referências em direção criativa e publique com a certeza de que tudo conversa.</p>
          </div>
          <div className="relative flex items-center gap-3 text-xs text-[#BDAEA2]"><span className="h-px w-10 bg-[#B48A62]" />Planejamento. Direção. Presença.</div>
        </div>
        <div className="flex items-center bg-[#F3EEE7] p-6 sm:p-12 text-[#27211D]">
          <div className="w-full max-w-sm mx-auto">
            <p className="label-kicker">Seu espaço de criação</p>
            <h2 className="serif mt-4 text-4xl tracking-[-0.035em]">Bem-vinda ao seu estúdio.</h2>
            <p className="mt-4 text-sm leading-6 text-[#766D65]">Entre para acessar seus projetos, linhas editoriais e calendário de conteúdo.</p>
            <Button onClick={() => startLogin()} className="mt-9 h-12 w-full rounded-xl bg-[#27211D] text-sm hover:bg-[#463A32]">Entrar na Editoria</Button>
            <p className="mt-6 text-center text-xs leading-5 text-[#93897F]">Um ambiente seguro para o universo editorial da sua marca.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function LayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const [resizing, setResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const active = menuItems.find(item => item.path === location);
  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!resizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - left;
      if (width >= 210 && width <= 380) setSidebarWidth(width);
    };
    const stop = () => setResizing(false);
    if (resizing) { document.addEventListener("mousemove", move); document.addEventListener("mouseup", stop); }
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", stop); };
  }, [resizing, setSidebarWidth]);
  return <>
    <div className="relative" ref={sidebarRef}>
      <Sidebar collapsible="icon" className="border-r border-[#E7E0D7] bg-[#FBF9F5]" disableTransition={resizing}>
        <SidebarHeader className="h-[78px] justify-center px-3">
          <div className="flex w-full items-center gap-3"><button onClick={toggleSidebar} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-[#EEE8DD]" aria-label="Alternar menu"><PanelLeft className="h-4 w-4" /></button>{!collapsed && <div className="min-w-0"><p className="serif text-xl leading-none">Editoria</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-[.16em] text-[#A07D5A]">Creative studio</p></div>}</div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-4"><SidebarMenu className="gap-1">{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className={`h-11 rounded-xl px-3 text-[13px] font-medium hover:bg-[#F0EAE1] ${location === item.path ? "nav-active" : ""}`}><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent>
        <SidebarFooter className="p-3"><div className="rounded-2xl bg-[#F1ECE4] p-2"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-2.5 rounded-xl p-1 text-left"><Avatar className="h-8 w-8 border border-[#DCD3C8]"><AvatarFallback className="bg-[#E6D6C0] text-xs font-semibold text-[#5A4635]">{user?.name?.charAt(0).toUpperCase() || "E"}</AvatarFallback></Avatar>{!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{user?.name || "Seu estúdio"}</p><p className="mt-0.5 truncate text-[10px] text-[#887C71]">Conta pessoal</p></div>}</button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sair da conta</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></SidebarFooter>
      </Sidebar>
      {!collapsed && <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#B58C61]/30" onMouseDown={() => setResizing(true)} />}
    </div>
    <SidebarInset className="bg-[#F8F6F2]">{isMobile && <div className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b bg-[#FBF9F5]/95 px-4 backdrop-blur"><SidebarTrigger className="rounded-xl" /><span className="serif text-lg">{active?.label ?? "Editoria"}</span></div>}<main className="min-h-screen">{children}</main></SidebarInset>
  </>;
}
