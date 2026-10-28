import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Board login · Cocktail Club" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">🍸 Board login</h1>
      <LoginForm />
    </main>
  );
}
