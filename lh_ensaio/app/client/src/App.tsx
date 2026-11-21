import { createBrowserRouter, RouterProvider, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  useIsMobile,
} from '@databricks/appkit-ui/react';
import { Bot, Database, LayoutDashboard, ListChecks, Menu, MessageSquareText, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LeadSearch } from './components/LeadSearch';
import { initials } from './lib/format';
import { RefreshProvider } from './lib/refresh-context';
import { useWhoAmI } from './lib/use-whoami';
import { GestorPage } from './pages/gestor/GestorPage';
import { FilaPage } from './pages/fila/FilaPage';
import { AgentePage } from './pages/agente/AgentePage';
import { PlataformaPage } from './pages/plataforma/PlataformaPage';

interface NavItem {
  to: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  title: string;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Visão do Gestor', hint: 'funil e canais', icon: LayoutDashboard, title: 'Visão do Gestor' },
  { to: '/fila', label: 'Fila do Dia', hint: 'gold.fila_do_dia', icon: ListChecks, title: 'Fila do Dia' },
  { to: '/agente', label: 'Agente', hint: 'Genie', icon: Bot, title: 'Agente comercial' },
  { to: '/plataforma', label: 'Plataforma', hint: 'medalhão + IA', icon: Database, title: 'Plataforma' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const me = useWhoAmI();

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Target className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold leading-tight text-foreground">Lead Score</p>
          <p className="truncate text-xs text-muted-foreground">{me?.email ?? 'Atlas Software'}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5" aria-label="Menu principal">
        {NAV.map(({ to, label, hint, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0">
                  <span className="block leading-tight">{label}</span>
                  <span className={`block text-[11px] font-normal ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {hint}
                  </span>
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl bg-primary p-5 text-center text-primary-foreground">
        <MessageSquareText className="mx-auto h-10 w-10 opacity-90" />
        <p className="mt-3 font-semibold">Pergunte ao agente</p>
        <p className="mt-1 text-xs text-primary-foreground/80">“Quais leads quentes ficaram fora da fila hoje?”</p>
        <Button
          size="sm"
          className="mt-4 bg-warning text-warning-foreground hover:bg-warning/90"
          onClick={() => {
            onNavigate?.();
            void navigate('/agente');
          }}
        >
          Abrir o agente
        </Button>
      </div>
    </div>
  );
}

function Layout() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const me = useWhoAmI();
  const current = NAV.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to))) ?? NAV[0];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      <div className="min-w-0 flex-1">
        {/* Faixa azul do topo (referência): busca, ações e título grande */}
        <header className="relative overflow-hidden bg-primary px-4 pb-24 pt-6 text-primary-foreground md:px-8">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Sheet open={open && isMobile} onOpenChange={setOpen}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/15"
                  onClick={() => setOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
                <SheetContent side="left" className="p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <SidebarContent onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>
            <LeadSearch />
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-full bg-primary-foreground/15 px-3 py-1 text-xs md:inline">
                Demo · dados 100% sintéticos
              </span>
              <Avatar className="h-11 w-11 border-2 border-primary-foreground/40">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                  {initials(me?.email?.split('@')[0]?.replace(/[._]/g, ' ') ?? 'LS')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight md:text-4xl">{current.title}</h1>
        </header>

        {/* Conteúdo sobe sobre a faixa azul, como os cards de KPI da referência */}
        <main className="relative -mt-16 px-4 pb-10 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <GestorPage /> },
      { path: '/fila', element: <FilaPage /> },
      { path: '/agente', element: <AgentePage /> },
      { path: '/plataforma', element: <PlataformaPage /> },
    ],
  },
]);

export default function App() {
  return (
    <RefreshProvider>
      <RouterProvider router={router} />
    </RefreshProvider>
  );
}
