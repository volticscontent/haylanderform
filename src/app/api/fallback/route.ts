import { NextResponse } from 'next/server';
import { evolutionSendTextMessage } from '@/lib/evolution';
import { getAgentRouting } from '@/lib/ai/tools/server-tools';

export async function POST(request: Request) {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET) {
        // Allow "Bearer <token>" or just "<token>"
        const token = process.env.CRON_SECRET;
        const isValid = authHeader === `Bearer ${token}` || authHeader === token;
        
        if (!isValid) {
            console.warn(`[Fallback] Unauthorized access attempt. Header: ${authHeader?.substring(0, 10)}...`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const body = await request.json();
        const { phone } = body;

        if (!phone) {
            return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
        }

        // Check if lead is being attended by a bot
        const agentName = await getAgentRouting(phone);
        
        // If agent is 'human', we should NOT send the nudge
        if (agentName === 'human') {
            console.log(`[Fallback] Skipping nudge for ${phone} (Agent is Human)`);
            return NextResponse.json({ message: 'Skipped: Agent is Human' });
        }

        // Send the "Are you still there?" message
        const message = "Oi ainda esta ai?";
        await evolutionSendTextMessage(phone, message);
        
        console.log(`[Fallback] Sent nudge to ${phone}`);
        return NextResponse.json({ message: 'Nudge sent successfully' });

    } catch (error) {
        console.error('[Fallback] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
