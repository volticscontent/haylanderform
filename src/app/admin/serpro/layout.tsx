import { requirePermission } from '@/lib/require-permission';

export default async function SerproLayout({ children }: { children: React.ReactNode }) {
    await requirePermission('/admin/serpro');
    return <>{children}</>;
}
