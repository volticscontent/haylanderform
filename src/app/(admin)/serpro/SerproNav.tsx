'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Users, FileText } from 'lucide-react';

const TABS = [
    { label: 'Consulta', href: '/serpro', icon: Globe },
    { label: 'Carteira', href: '/serpro/carteira', icon: Users },
    { label: 'Documentos', href: '/serpro/documentos', icon: FileText },
];

export default function SerproNav() {
    const pathname = usePathname();

    return (
        <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 mb-5">
            <div className="flex gap-1">
                {TABS.map(({ label, href, icon: Icon }) => {
                    const isActive = href === '/serpro' ? pathname === '/serpro' : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${isActive
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
