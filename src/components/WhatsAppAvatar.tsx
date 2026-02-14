'use client';

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface WhatsAppAvatarProps {
  phone?: string | null;
  alt?: string;
  className?: string;
}

export default function WhatsAppAvatar({ phone, alt, className = '' }: WhatsAppAvatarProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return;

    fetch('/api/whatsapp/profile-pic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
    })
    .then(r => r.json())
    .then(d => {
        if(d.url) setSrc(d.url);
    })
    .catch(() => {});
  }, [phone]);

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-full ${className}`}>
        <User className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img 
      src={src} 
      className={`rounded-full object-cover ${className}`} 
      alt={alt || "Avatar"} 
    />
  );
}
