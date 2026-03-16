import { requirePermission } from '@/lib/require-permission';

export default async function DisparoLayout({ children }: { children: React.ReactNode }) {
    await requirePermission('');
    return <>{children}</>;
}
