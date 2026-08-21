import { SignUp } from "@clerk/react";

export default function ClerkSignUp() {
  return <main className="grain grid min-h-screen place-items-center bg-[#F8F6F2] p-5"><section className="w-full max-w-md"><div className="mb-8 text-center"><p className="label-kicker">Editoria Studio</p><h1 className="serif mt-3 text-4xl tracking-[-.04em] text-[#27211D]">Crie seu estúdio.</h1><p className="mt-3 text-sm leading-6 text-[#786E64]">Comece a planejar sua linha editorial em minutos.</p></div><div className="overflow-hidden rounded-2xl border border-[#E6E0D7] bg-[#FFFEFC] p-3 shadow-[0_20px_50px_rgba(53,41,31,.08)]"><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" /></div></section></main>;
}
