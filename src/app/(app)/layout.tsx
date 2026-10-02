import Link from "next/link";
import { Home, Map, BookOpen, BarChart3, RotateCcw } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/learn", label: "Path", icon: Map },
  { href: "/review", label: "Review", icon: RotateCcw },
  { href: "/vocabulary", label: "Words", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: BarChart3 },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <div className="flex-1 pb-24">{children}</div>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-semibold text-ink-muted hover:text-mango"
              >
                <Icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
