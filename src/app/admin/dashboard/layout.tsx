import { requirePermission } from '@/lib/require-permission';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    await requirePermission('/admin/dashboard');
    return <>{children}</>;
}
