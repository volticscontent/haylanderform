import React from "react";
import MEIForm from "@/components/MEIForm";

export const metadata = {
  title: "Abertura de MEI",
  description: "Formulário para abertura de MEI - Haylander Martins Contabilidade",
};

export default function AbrirMEIPage() {
  return (
    <main className="min-h-screen w-full flex items-start justify-center px-4 py-12 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-3xl">
        <MEIForm />
      </div>
    </main>
  );
}