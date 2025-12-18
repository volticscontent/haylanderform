import { NextResponse } from 'next/server';
import { evolutionFindChats } from '@/lib/evolution';
import { getUser, updateUser } from '@/lib/ai/tools/server-tools';

export async function POST() {
  try {
    const chats = await evolutionFindChats();
    
    if (!Array.isArray(chats)) {
      return NextResponse.json({ error: 'Failed to fetch chats from Evolution API' }, { status: 500 });
    }

    let created = 0;
    let updated = 0;

    for (const chat of chats) {
      const remoteJid = chat.id || chat.remoteJid || '';
      const phone = remoteJid.replace(/\D/g, '');
      const pushName = chat.pushName || chat.name || '';
      
      if (phone && phone.length >= 10) {
        try {
            const userJson = await getUser(phone);
            const user = JSON.parse(userJson);
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const params: any = { telefone: phone };
            let shouldUpdate = false;

            if (user.status === 'not_found') {
                // Create new
                params.nome_completo = pushName || 'Desconhecido';
                params.situacao = 'aguardando_qualificação';
                params.origem = 'whatsapp_sync';
                await updateUser(params);
                created++;
            } else {
                // Update existing
                // Only update name if it's missing or generic, and we have a better one
                const currentName = user.nome_completo;
                if (pushName && (!currentName || currentName === 'Desconhecido' || currentName.trim() === '')) {
                    params.nome_completo = pushName;
                    shouldUpdate = true;
                }
                
                // Always update 'atualizado_em' (updateUser does this automatically when called)
                // If we have no other changes, we call updateUser just to touch 'atualizado_em'
                // But updateUser only runs SQL if keys > 0 (besides phone).
                // Wait, looking at updateUser implementation:
                // "if (keys.length === 0) return ... no_changes"
                // So if I only pass phone, it won't update 'atualizado_em'.
                // I need to pass at least one field.
                // I can pass 'origem' or just force a dummy update?
                // Or I can rely on 'shouldUpdate'.
                
                // If the user request "data de ultima atualização", they probably want to see *when it was synced*.
                // I will add a field `data_ultima_consulta` or similar if it exists?
                // Record type has `data_ultima_consulta`.
                params.data_ultima_consulta = new Date();
                shouldUpdate = true;

                if (shouldUpdate) {
                    await updateUser(params);
                    updated++;
                }
            }
        } catch (e) {
            console.error(`Error syncing user ${phone}:`, e);
        }
      }
    }

    return NextResponse.json({ success: true, count: chats.length, created, updated });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
