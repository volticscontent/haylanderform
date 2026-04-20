'use client';

import { SerproDocumentosTab } from '@/components/serpro/SerproDocumentosTab';
import { useRouter } from 'next/navigation';

export default function SerproDocumentosPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Documentos Fiscais</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gestão de documentos gerados via Serpro — PDFs armazenados com controle de validade.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
        <SerproDocumentosTab
          onSelectCnpj={(cnpj) => {
            router.push(`/serpro?cnpj=${cnpj}`);
          }}
        />
      </div>
    </div>
  );
}
