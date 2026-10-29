import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import Crest from "../../_components/Crest";
import { logout } from "../actions";

export default async function BoardLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="theme-white flex min-h-full flex-col">
      <header className="text-cream">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 text-sm">
          <Link href="/admin" className="flex items-center gap-3">
            <Crest size={36} />
            <span className="heading leading-none">SOM Cocktail Club</span>
          </Link>
          <Link href="/admin" className="hidden text-cream/75 hover:text-cream sm:block">Events</Link>
          <Link href="/admin/board" className="hidden text-cream/75 hover:text-cream sm:block">Leads</Link>
          <span className="ml-auto hidden text-cream/60 sm:block">{admin.name}</span>
          <form action={logout} className="hidden sm:block">
            <button className="text-cream/60 hover:text-cream">Log out</button>
          </form>

          {/* On phones the links fold into a menu so the bar stays on one line. */}
          <details className="relative ml-auto sm:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center text-2xl leading-none text-cream [&::-webkit-details-marker]:hidden" aria-label="Menu">
              ≡
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-sm bg-white py-1 text-base text-ink shadow-lg">
              <Link href="/admin" className="block px-4 py-3 hover:bg-navy/5">Events</Link>
              <Link href="/admin/board" className="block px-4 py-3 hover:bg-navy/5">Leads</Link>
              <div className="border-t border-navy/10 px-4 pt-3 pb-1 text-sm text-ink/55">{admin.name}</div>
              <form action={logout}>
                <button className="block w-full px-4 py-3 text-left hover:bg-navy/5">Log out</button>
              </form>
            </div>
          </details>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-10">
        <div className="sheet min-h-[60vh]">{children}</div>
      </main>
    </div>
  );
}
