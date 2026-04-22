'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Globe, FileText, X, Book, ArrowLeft, Database, ChevronDown, ChevronRight, MessageCircle, Moon, Sun, Workflow, GitBranch, Settings, Send, Calendar, Bot, Mail, Building2, DollarSign } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AdminSidebarProps {
  isOpen?: boolean
  isDesktopOpen?: boolean
  onClose?: () => void
  permissoes?: string[]
}

// Mapa: nome do link → quais permissões dão acesso
const LINK_PERMISSIONS: Record<string, string[]> = {
  'Dashboard': ['admin', 'vendas', 'atendimento', 'financeiro'],
  'Chat': ['admin', 'atendimento'],
  'Lista': ['admin', 'vendas', 'atendimento'],
  'Serpro': ['admin', 'serpro'],
  'Integra Contador': ['admin', 'serpro'],
  'Documentação': [],
  'Configurações': ['admin'],
}

type NavItem = {
  name: string
  href?: string
  icon: React.ElementType
  children?: NavItem[]
}

const adminLinks: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Chat', href: '/atendimento', icon: MessageCircle },
  { name: 'Reuniões', href: '/reuniao', icon: Calendar },
  { name: 'Lista', href: '/lista', icon: Users },
  // { name: 'Disparo', href: '/disparo', icon: Send }, // em desenvolvimento
  {
    name: 'Serpro / Integra',
    icon: Globe,
    children: [
      { name: 'Consulta Simples', href: '/serpro', icon: Globe },
      { name: 'Documentos', href: '/serpro/documentos', icon: FileText },
      { name: 'Dashboard Integra', href: '/serpro/integra/dashboard', icon: LayoutDashboard },
      { name: 'Empresas Integra', href: '/serpro/integra/empresas', icon: Building2 },
      { name: 'Robôs Integra', href: '/serpro/integra/robos', icon: Bot },
      { name: 'Guias Integra', href: '/serpro/integra/guias', icon: FileText },
      { name: 'Caixa Postal', href: '/serpro/integra/caixa-postal', icon: Mail },
      { name: 'Billing', href: '/serpro/integra/billing', icon: DollarSign },
    ]
  },
  { name: 'Documentação', href: '/docs', icon: Book },
  {
    name: 'Configurações',
    icon: Settings,
    children: [
      { name: 'Geral', href: '/configuracoes', icon: Settings },
      { name: 'Serviços', href: '/configuracoes/servico', icon: Settings },
      { name: 'Colaboradores', href: '/configuracoes/colaboradores', icon: Users },
    ]
  },
]

const docsLinks: NavItem[] = [
  { name: 'Introdução', href: '/docs', icon: Book },
  {
    name: 'Arquitetura',
    icon: Workflow,
    children: [
      { name: 'Diagrama de Dados', href: '/docs/diagrama-dados', icon: Database },
      { name: 'Ciclo de Vida', href: '/docs/ciclo-vida-lead', icon: GitBranch },
    ]
  },
  {
    name: 'Formulários',
    icon: FileText,
    children: [
      { name: 'Visão Geral', href: '/docs/forms#visao-geral', icon: FileText },
      { name: 'Qualificação (Lead)', href: '/docs/forms#lead-form', icon: FileText },
      { name: 'Abertura MEI', href: '/docs/forms#mei-form', icon: FileText },
      { name: 'Cadastro e-CAC', href: '/docs/forms#ecac-form', icon: FileText },
      { name: 'Administrativos', href: '/docs/forms#admin-forms', icon: FileText },
    ]
  },
  {
    name: 'Banco de Dados',
    icon: Database,
    children: [
      { name: 'Diagrama e SQL', href: '/docs/diagrama-dados', icon: Database },
      { name: 'Arquitetura do Bot', href: '/docs/bot-architecture', icon: Book },
    ]
  },
  {
    name: 'Painel Admin',
    icon: LayoutDashboard,
    children: [
      { name: 'Visão Geral', href: '/docs/dashboard-panel#visao-geral', icon: LayoutDashboard },
      { name: 'Estrutura', href: '/docs/dashboard-panel#estrutura-do-dashboard', icon: LayoutDashboard },
      { name: 'Autenticação', href: '/docs/dashboard-panel#fluxo-de-autenticacao', icon: LayoutDashboard },
      { name: 'Tecnologias', href: '/docs/dashboard-panel#tecnologias-e-componentes', icon: LayoutDashboard },
      { name: 'Resumo Técnico', href: '/docs/dashboard-panel#resumo-tecnico-painel-admin', icon: LayoutDashboard },
    ]
  },
  {
    name: 'API Serpro',
    icon: Globe,
    children: [
      { name: 'Visão Geral', href: '/docs/serpro-api#visao-geral', icon: Globe },
      { name: 'Autenticação', href: '/docs/serpro-api#fluxo-de-autenticacao-e-consulta', icon: Globe },
      { name: 'Configuração', href: '/docs/serpro-api#configuracao-de-ambiente', icon: Globe },
      { name: 'Endpoints', href: '/docs/serpro-api#endpoints-da-api-interna', icon: Globe },
      { name: 'Resumo Técnico', href: '/docs/serpro-api#resumo-tecnico-serpro-integration', icon: Globe },
    ]
  },
  {
    name: 'API Lista',
    icon: Users,
    children: [
      { name: 'Visão Geral', href: '/docs/list-api#visao-geral', icon: Users },
      { name: 'Bulk Actions', href: '/docs/list-api#endpoints-em-massa-bulk', icon: Users },
      { name: 'CRUD Individual', href: '/docs/list-api#endpoints-individuais-crud', icon: Users },
      { name: 'Filtros', href: '/docs/list-api#estrutura-de-filtros-where', icon: Users },
      { name: 'Resumo Técnico', href: '/docs/list-api#resumo-tecnico-list-api', icon: Users },
    ]
  },
]

function hasAccess(linkName: string, permissoes: string[]): boolean {
  // Se não tem restrição, todos acessam
  const required = LINK_PERMISSIONS[linkName]
  if (!required || required.length === 0) return true
  // Se o colaborador tem alguma das permissões necessárias
  return permissoes.some(p => required.includes(p))
}

export default function AdminSidebar({ isOpen = false, isDesktopOpen = true, onClose, permissoes = [] }: AdminSidebarProps) {
  const pathname = usePathname()
  const isDocs = pathname?.startsWith('/docs')

  const [activeHash, setActiveHash] = useState('')

  useEffect(() => {
    // Initial hash
    if (typeof window !== 'undefined') {
      // Use requestAnimationFrame to avoid synchronous state update warning during render phase (if that's the issue)
      // or just to defer it slightly.
      requestAnimationFrame(() => {
        const hash = window.location.hash
        if (hash && hash !== activeHash) {
          setActiveHash(hash)
        }
      })
    }

    const handleHashChange = () => {
      setActiveHash(window.location.hash)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll Spy Effect
  useEffect(() => {
    if (typeof window === 'undefined' || !isDocs) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Activate when element is near top
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          if (id) {
            // Update active hash only if we are not currently scrolling due to a click
            // (But for simplicity, just update it, it should be fine)
            setActiveHash(`#${id}`);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Collect all target IDs from docsLinks
    const idsToObserve = new Set<string>();
    const traverse = (items: NavItem[]) => {
      items.forEach(item => {
        if (item.href?.includes('#')) {
          const [path, hash] = item.href.split('#');
          // Check if this link belongs to current page
          if (path === pathname || path === pathname + '/' || (pathname === '' && path === '')) {
            if (hash) idsToObserve.add(hash);
          }
        }
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(docsLinks);

    // Observe elements
    // We need a small timeout to ensure DOM is ready if we just navigated
    const timeoutId = setTimeout(() => {
      idsToObserve.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          observer.observe(element);
        }
      });
    }, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [pathname, isDocs]); // Re-run when path changes

  useEffect(() => {
    // Update hash when pathname changes (e.g. navigation)
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        const hash = window.location.hash
        // Only update if different to avoid loops, and don't depend on activeHash to avoid effect loop
        setActiveHash(prev => {
          if (hash !== prev) return hash;
          return prev;
        })
      })
    }
  }, [pathname])

  // Filtrar links com base nas permissões
  const filteredAdminLinks = adminLinks.filter(link => hasAccess(link.name, permissoes))
  const links = isDocs ? docsLinks : filteredAdminLinks

  // State for expanded sections
  // Default to expanding sections if current path matches one of the children
  const [expandedSection, setExpandedSection] = useState<string | null>(() => {
    if (!isDocs) return null;
    // Check if any children match current path
    const activeParent = docsLinks.find(link =>
      link.children?.some(child => pathname === child.href?.split('#')[0])
    );
    return activeParent ? activeParent.name : null;
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    const timer = setTimeout(() => {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleToggle = (name: string) => {
    setExpandedSection(prev => prev === name ? null : name);
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isDesktopOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {isDocs ? 'Docs' : 'Admin Panel'}
          </h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {isDocs && (
            <Link
              href="/dashboard"
              onClick={() => onClose?.()}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-4 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Admin
            </Link>
          )}

          {links.map((link) => {
            const Icon = link.icon
            const hasChildren = link.children && link.children.length > 0
            const isExpanded = expandedSection === link.name

            // Check if active (for parents, check children)
            const isActive = link.href === pathname || link.children?.some(child => pathname === child.href?.split('#')[0])

            if (hasChildren) {
              return (
                <div key={link.name}>
                  <button
                    onClick={() => handleToggle(link.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'text-black dark:text-white bg-gray-100/50 dark:bg-white/10'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {link.name}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {/* Submenu */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    {link.children?.map(child => {
                      // const ChildIcon = child.icon (unused)
                      const childHref = child.href || '';
                      const [childPath, childHash] = childHref.split('#');
                      const targetHash = childHash ? `#${childHash}` : '';
                      const isSamePage = pathname === childPath;
                      // Active if paths match AND hashes match (or both empty)
                      // If activeHash is empty, we only match if targetHash is also empty (or handle default logic later)
                      const isChildActive = isSamePage && (targetHash === activeHash);

                      return (
                        <Link
                          key={child.name}
                          href={child.href || '#'}
                          onClick={() => {
                            onClose?.();
                            // Optimistic update
                            if (child.href?.includes('#')) {
                              setActiveHash(`#${child.href.split('#')[1]}`);
                            } else {
                              setActiveHash('');
                            }
                          }}
                          className={`flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isChildActive
                            ? 'text-black dark:text-white bg-gray-100/50 dark:bg-white/10'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full bg-current ${isChildActive ? 'opacity-100' : 'opacity-40'}`} />
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={link.name}
                href={link.href || '#'}
                onClick={() => onClose?.()}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer with Theme Toggle */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {isDark ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </div>
      </div>
    </>
  )
}
