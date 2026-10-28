import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import Crest from "../../_components/Crest";
import { logout } from "../actions";

export default async function BoardLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-full flex-col">
      <header className="text-cream">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 text-sm">
          <Link href="/admin" className="flex items-center gap-3">
            <Crest size={36} />
            <span className="display text-2xl leading-none">SOM Cocktail Club</span>
          </Link>
          <Link href="/admin" className="text-cream/75 hover:text-cream">Events</Link>
          <Link href="/admin/board" className="text-cream/75 hover:text-cream">Leads</Link>
          <span className="ml-auto text-cream/60">{admin.name}</span>
          <form action={logout}>
            <button className="text-cream/60 hover:text-cream">Log out</button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-10">
        <div className="sheet min-h-[60vh]">{children}</div>
      </main>
    </div>
  );
}
