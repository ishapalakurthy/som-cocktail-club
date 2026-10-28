import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

export default async function BoardLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-stone-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center gap-5 px-4 py-3 text-sm">
          <Link href="/admin" className="font-bold">🍸 Cocktail Club Board</Link>
          <Link href="/admin" className="text-stone-600 hover:text-stone-900">Events</Link>
          <Link href="/admin/board" className="text-stone-600 hover:text-stone-900">Board members</Link>
          <span className="ml-auto text-stone-500">{admin.name}</span>
          <form action={logout}>
            <button className="text-stone-500 hover:text-rose-700">Log out</button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
