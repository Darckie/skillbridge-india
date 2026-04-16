import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { I18nProvider } from "@/lib/i18n";
import { WorkerProvider } from "@/lib/worker-store";

function NotFoundComponent() {
  return (
    <div className="kp-screen items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="mt-3 text-muted-foreground">Page not found</p>
        <div className="mt-6">
          <Link to="/" className="kp-btn kp-btn-primary inline-flex w-auto">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "KaamProof — Skill Passport for Trades Workers" },
      { name: "description", content: "Get your skills verified and share your Skill Passport with employers." },
      { property: "og:title", content: "KaamProof — Skill Passport" },
      { property: "og:description", content: "Get your skills verified and share your Skill Passport with employers." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <I18nProvider>
      <WorkerProvider>
        <Outlet />
      </WorkerProvider>
    </I18nProvider>
  );
}
