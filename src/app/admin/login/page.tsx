import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { MenuHeader } from "../../_components/Crest";
import LoginForm from "./LoginForm";

export const metadata = { title: "Board login · SOM Cocktail Club" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="mx-auto w-full max-w-md px-3 py-10 sm:py-16">
      <div className="sheet">
        <MenuHeader />
        <h1 className="display mt-3 text-center text-4xl font-semibold">Board login</h1>
        <LoginForm />
      </div>
    </main>
  );
}
