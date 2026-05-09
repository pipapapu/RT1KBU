import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect, Link } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AdminWarga from "@/pages/admin-warga";
import AdminIuran from "@/pages/admin-iuran";
import AdminSurat from "@/pages/admin-surat";
import AdminPengumuman from "@/pages/admin-pengumuman";
import WargaIuran from "@/pages/warga-iuran";
import WargaSurat from "@/pages/warga-surat";
import WargaPengumuman from "@/pages/warga-pengumuman";
import { useGetPendingActions } from "@workspace/api-client-react";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(173 80% 30%)",
    colorForeground: "hsl(180 10% 15%)",
    colorMutedForeground: "hsl(180 10% 45%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(40 20% 95%)",
    colorInputForeground: "hsl(180 10% 15%)",
    colorNeutral: "hsl(40 20% 90%)",
    colorDanger: "hsl(0 84% 60%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-sm border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground text-xl font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:underline",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground bg-white px-2",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-primary",
    alertText: "text-destructive",
  },
};

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center max-w-lg mx-auto">
        <div className="mb-8">
          <img src={`${basePath}/logo.svg`} alt="Logo RT" className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">Sistem Manajemen RT</h1>
          <p className="text-muted-foreground text-lg">Platform administrasi Rukun Tetangga yang mudah, modern, dan aman</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-10 w-full">
          {[
            { title: "Data Warga", desc: "Kelola data penduduk & KK" },
            { title: "Iuran Bulanan", desc: "Pantau dan bayar iuran RT" },
            { title: "Persuratan", desc: "Ajukan surat pengantar" },
          ].map(f => (
            <div key={f.title} className="p-3 rounded-xl bg-card border text-left">
              <div className="font-semibold text-sm">{f.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 w-full">
          <Link href="/sign-in" className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Masuk
          </Link>
          <Link href="/sign-up" className="flex-1 inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold hover:bg-accent transition-colors">
            Daftar
          </Link>
        </div>
      </div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><Home /></Show>
    </>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function NavLink({ href, children, 'data-testid': testId }: { href: string; children: React.ReactNode; 'data-testid'?: string }) {
  const [location] = useLocation();
  const active = location === href || (href !== "/dashboard" && location.startsWith(href));
  return (
    <Link href={href} data-testid={testId} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
      {children}
    </Link>
  );
}

function PendingBadge() {
  const { data } = useGetPendingActions();
  const total = (data?.buktiPembayaran ?? 0) + (data?.permohonanSurat ?? 0);
  if (!total) return null;
  return <Badge className="ml-auto text-xs" variant="destructive">{total}</Badge>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const role = user?.publicMetadata?.role;
  const isAdmin = role === 'admin';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-sidebar p-3 gap-1 flex-shrink-0">
        <div className="flex items-center gap-2 px-2 py-3 mb-2">
          <img src={`${basePath}/logo.svg`} alt="RT" className="w-7 h-7" />
          <div>
            <div className="font-bold text-sm text-sidebar-foreground">Manajemen RT</div>
            <div className="text-xs text-muted-foreground capitalize">{isAdmin ? "Admin" : "Warga"}</div>
          </div>
        </div>

        <NavLink href="/dashboard" data-testid="nav-dashboard">Dashboard</NavLink>

        {isAdmin ? (
          <>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-3 mb-1 px-3">Kelola</div>
            <NavLink href="/admin/warga" data-testid="nav-warga">Data Warga & KK</NavLink>
            <NavLink href="/admin/iuran" data-testid="nav-iuran">Iuran & Pembayaran</NavLink>
            <NavLink href="/admin/surat" data-testid="nav-surat">
              Permohonan Surat
              <PendingBadge />
            </NavLink>
            <NavLink href="/admin/pengumuman" data-testid="nav-pengumuman">Pengumuman</NavLink>
          </>
        ) : (
          <>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-3 mb-1 px-3">Menu</div>
            <NavLink href="/warga/iuran" data-testid="nav-iuran">Iuran Saya</NavLink>
            <NavLink href="/warga/surat" data-testid="nav-surat">Pengajuan Surat</NavLink>
            <NavLink href="/warga/pengumuman" data-testid="nav-pengumuman">Pengumuman</NavLink>
          </>
        )}

        <div className="mt-auto pt-3 border-t">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</div>
          <button
            data-testid="button-keluar"
            onClick={() => signOut()}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex">
        {isAdmin ? (
          <>
            <MobileNavItem href="/dashboard" label="Dashboard" />
            <MobileNavItem href="/admin/warga" label="Warga" />
            <MobileNavItem href="/admin/iuran" label="Iuran" />
            <MobileNavItem href="/admin/surat" label="Surat" />
            <MobileNavItem href="/admin/pengumuman" label="Info" />
          </>
        ) : (
          <>
            <MobileNavItem href="/dashboard" label="Beranda" />
            <MobileNavItem href="/warga/iuran" label="Iuran" />
            <MobileNavItem href="/warga/surat" label="Surat" />
            <MobileNavItem href="/warga/pengumuman" label="Pengumuman" />
          </>
        )}
      </div>

      <main className="flex-1 overflow-auto bg-background pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}

function MobileNavItem({ href, label }: { href: string; label: string }) {
  const [location] = useLocation();
  const active = location === href || (href !== "/dashboard" && location.startsWith(href));
  return (
    <Link href={href} className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
      {label}
    </Link>
  );
}

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) setLocation('/sign-in');
    else if (isLoaded && isSignedIn && adminOnly && user?.publicMetadata?.role !== 'admin') setLocation('/dashboard');
  }, [isLoaded, isSignedIn, adminOnly, user, setLocation]);

  if (!isLoaded || !isSignedIn) return null;
  if (adminOnly && user?.publicMetadata?.role !== 'admin') return null;

  return <AppLayout><Component /></AppLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/admin/warga">{() => <ProtectedRoute component={AdminWarga} adminOnly />}</Route>
      <Route path="/admin/iuran">{() => <ProtectedRoute component={AdminIuran} adminOnly />}</Route>
      <Route path="/admin/surat">{() => <ProtectedRoute component={AdminSurat} adminOnly />}</Route>
      <Route path="/admin/pengumuman">{() => <ProtectedRoute component={AdminPengumuman} adminOnly />}</Route>
      <Route path="/warga/iuran">{() => <ProtectedRoute component={WargaIuran} />}</Route>
      <Route path="/warga/surat">{() => <ProtectedRoute component={WargaSurat} />}</Route>
      <Route path="/warga/pengumuman">{() => <ProtectedRoute component={WargaPengumuman} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      localization={{
        signIn: { start: { title: "Selamat Datang", subtitle: "Masuk untuk mengakses akun Anda" } },
        signUp: { start: { title: "Buat Akun", subtitle: "Bergabung dengan sistem RT Anda" } },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
