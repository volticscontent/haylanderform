'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { getContactProfilePicture } from '@/app/admin/atendimento/actions';

// Módulo que atua como cache global temporário no frontend
const avatarCache = new Map<string, string | null>();
const pendingRequests = new Set<string>();

interface ChatAvatarProps {
    chatId: string;
    name: string;
    fallbackImage?: string | null;
    className?: string;
    size?: number;
}

export function ChatAvatar({ chatId, name, fallbackImage, className = '', size = 48 }: ChatAvatarProps) {
    const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
    const [initials, setInitials] = useState<string>('');
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Reseta a imagem buscada ao trocar de chat
    useEffect(() => {
        setFetchedUrl(null);
    }, [chatId]);

    const imageUrl = useMemo(() => {
        return fetchedUrl || fallbackImage || avatarCache.get(chatId) || null;
    }, [fetchedUrl, fallbackImage, chatId]);

    useEffect(() => {
        // Definir as iniciais baseadas no nome
        if (name) {
            setInitials(name.substring(0, 2).toUpperCase());
        }
    }, [name]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { rootMargin: '150px' });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return; // Aguarda até o componente de fato aparecer (lazy)

        // Se já passou a imagem original com sucesso, ignora
        if (imageUrl && imageUrl !== fallbackImage) return;

        // Se já temos a resposta cacheada para null, não tenta mais
        if (avatarCache.has(chatId) && avatarCache.get(chatId) === null) {
            return;
        }

        // Se já estiver buscando nesse exato momento, evita concorrência dupla
        if (pendingRequests.has(chatId)) return;

        let isMounted = true;

        async function fetchPicture() {
            // Se não tem no cache, avise que estamos buscando
            pendingRequests.add(chatId);

            try {
                const res = await getContactProfilePicture(chatId);

                if (isMounted) {
                    if (res.success && res.url) {
                        setFetchedUrl(res.url);
                        avatarCache.set(chatId, res.url);
                    } else {
                        // Salva como nulo no cache para não dar retry novamente em re-renders
                        avatarCache.set(chatId, null);
                        // Força a atualização do useMemo disparando um setState vazio caso dependa de re-render
                        setFetchedUrl(null);
                    }
                } else {
                    // Se desmontou antes de terminar, salva no cache de qualquer forma pros irmãos acharem
                    if (res.success && res.url) {
                        avatarCache.set(chatId, res.url);
                    } else {
                        avatarCache.set(chatId, null);
                    }
                }
            } catch (error) {
                avatarCache.set(chatId, null);
            } finally {
                pendingRequests.delete(chatId);
            }
        }

        fetchPicture();

        return () => {
            isMounted = false;
        };
    }, [chatId, imageUrl, fallbackImage, isVisible]);

    return (
        <div
            ref={containerRef}
            className={`rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 font-bold overflow-hidden relative shrink-0 border border-zinc-100 dark:border-zinc-700 ${className}`}
            style={{ width: size, height: size }}
        >
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={name || 'Avatar'}
                    fill
                    className="object-cover"
                    unoptimized
                />
            ) : (
                <span className="text-sm">{initials}</span>
            )}
        </div>
    );
}
