import LeadForm from "@/components/LeadForm";

export default async function PhoneObservacaoPage({ params }: { params: Promise<{ phone: string; observacao: string }> }) {
  const { phone, observacao } = await params;
  let decodedObservacao = observacao;
  
  try {
    decodedObservacao = decodeURIComponent(observacao);
  } catch (error) {
    console.error("Erro ao decodificar observacao:", error);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-zinc-100 to-zinc-100 dark:from-blue-950/20 dark:via-zinc-950 dark:to-zinc-950">
      <div className="w-full max-w-2xl">
        <LeadForm phone={phone} observacao={decodedObservacao} />
      </div>
    </main>
  );
}
