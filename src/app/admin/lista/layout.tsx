import { requirePermission } from '@/lib/require-permission';

export default async function ListaLayout({ children }: { children: React.ReactNode }) {
    await requirePermission('/admin/lista');
    return <>{children}</>;
}
