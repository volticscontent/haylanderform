import { requirePermission } from '@/lib/require-permission';
import SerproNav from './SerproNav';

export default async function SerproLayout({ children }: { children: React.ReactNode }) {
    await requirePermission('/serpro');
    return (
        <div className="flex flex-col h-full">
            <SerproNav />
            <div className="flex-1 overflow-auto">{children}</div>
        </div>
    );
}
