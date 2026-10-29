import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { MenuHeader } from "../../_components/Crest";
import LoginForm from "./LoginForm";

export const metadata = { title: "Lead Login · SOM Cocktail Club" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="theme-white mx-auto w-full max-w-md px-3 py-10 sm:py-16">
      <div className="sheet">
        <MenuHeader />
        <h1 className="title mt-3 text-center">Lead Login</h1>
        <LoginForm />
      </div>
    </main>
  );
}
