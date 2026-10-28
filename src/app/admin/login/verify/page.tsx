import Link from "next/link";
import VerifyButton from "./VerifyButton";

export const metadata = { title: "Sign in · Cocktail Club Board" };

export default async function VerifyPage(props: PageProps<"/admin/login/verify">) {
  const { token } = await props.searchParams;
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">🍸 Board sign-in</h1>
      {typeof token === "string" && token ? (
        <VerifyButton token={token} />
      ) : (
        <p className="mt-4 text-stone-600">
          This link is missing its code. <Link href="/admin/login" className="text-rose-700 underline">Request a new one</Link>.
        </p>
      )}
    </main>
  );
}
