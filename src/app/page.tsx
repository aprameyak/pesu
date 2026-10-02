import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MarketingPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect(session.user.onboardingDone ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22><circle cx=%222%22 cy=%222%22 r=%221%22 fill=%22%23e85d0412%22/></svg>')] opacity-70" />

      <header className="relative z-10 mx-auto flex w-full max-w-lg items-center justify-between px-5 pt-6">
        <span className="font-display text-xl font-bold tracking-tight text-ink">Pesu</span>
        <Link href="/login" className="text-sm font-semibold text-ink-muted hover:text-mango">
          Log in
        </Link>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 pb-10 pt-8">
        <p className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Pesu
        </p>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-muted">
          Speak everyday Tamil — starting from Romanized phrases, not the alphabet.
        </p>

        <div className="mt-10 rounded-3xl border border-border/80 bg-white/60 p-6 backdrop-blur-sm">
          <p className="font-display text-2xl font-semibold text-ink">Enakku pasikkuthu</p>
          <p className="mt-1 text-ink-muted">I&apos;m hungry.</p>
          <p className="mt-2 font-tamil text-sm text-ink-faint" lang="ta">
            எனக்கு பசிக்குது
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link href="/signup" className="btn-primary w-full text-center">
            Start learning
          </Link>
          <Link href="/login" className="btn-secondary w-full text-center">
            I already have an account
          </Link>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-ink-faint">
          Built for beginners, heritage learners, partners, and travelers.
          <br />
          Tamil script is shown — never required.
        </p>
      </section>
    </main>
  );
}
