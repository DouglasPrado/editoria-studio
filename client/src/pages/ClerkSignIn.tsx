import { SignIn } from "@clerk/react";

export default function ClerkSignIn() {
  return <main className="grain grid min-h-screen place-items-center bg-[#F8F6F2] p-5"><section className="w-full max-w-md"><div className="mb-8 text-center"><p className="label-kicker">Editoria Studio</p><h1 className="serif mt-3 text-4xl tracking-[-.04em] text-[#27211D]">Entre no seu estúdio.</h1><p className="mt-3 text-sm leading-6 text-[#786E64]">Acesse seus roteiros, projetos e direção editorial.</p></div><div className="overflow-hidden rounded-2xl border border-[#E6E0D7] bg-[#FFFEFC] p-3 shadow-[0_20px_50px_rgba(53,41,31,.08)]"><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" /></div></section></main>;
}
