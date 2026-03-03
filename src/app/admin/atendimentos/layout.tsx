import { requirePermission } from '@/lib/require-permission';

export default async function AtendimentosLayout({ children }: { children: React.ReactNode }) {
    await requirePermission('/admin/atendimentos');
    return <>{children}</>;
}
