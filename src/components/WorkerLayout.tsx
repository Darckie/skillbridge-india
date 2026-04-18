import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { useWorker } from "@/lib/worker-store";
import { signOut } from "@/lib/auth";

interface Props {
  children: ReactNode;
  showBack?: boolean;
  title?: string;
}

export function WorkerLayout({ children, showBack = true, title }: Props) {
  const t = useT();
  const navigate = useNavigate();
  const router = useRouter();
  const { profile, worker } = useWorker();

  const handleHome = () => navigate({ to: "/worker/home" });
  const handleBack = () => {
    if (window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: "/worker/home" });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="kp-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="kp-container flex h-14 items-center justify-between py-0">
          <div className="flex items-center gap-2">
            {showBack ? (
              <button
                onClick={handleBack}
                className="-ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-muted"
                aria-label={t("back")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleHome}
                className="flex h-9 w-9 items-center justify-center rounded-lg shadow-sm"
                style={{ background: "var(--gradient-navy)" }}
                aria-label="Home"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <span className="text-base font-bold text-foreground">
              {title || "KaamProof"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {profile?.name && (
              <Link
                to="/worker/home"
                className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/70"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[100px] truncate sm:inline">{profile.name}</span>
              </Link>
            )}
            {worker && (
              <button
                onClick={handleLogout}
                className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("logout")}
              </button>
            )}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
