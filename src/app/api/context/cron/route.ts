import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getChatHistory } from '@/lib/chat-history';
import { evolutionSendTextMessage } from '@/lib/evolution';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Basic auth check for Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        const tenMinutesAgo = now - (10 * 60 * 1000);

        // --- PART 1: 5-Minute Nudge ---
        const potentialNudgeUsers = await redis.zrangebyscore('context_sync_queue', '-inf', fiveMinutesAgo);
        
        // Process nudges (limit to 20 per run to be safe)
        for (const phone of potentialNudgeUsers.slice(0, 20)) {
            const hasNudged = await redis.get(`context_nudge_sent:${phone}`);
            if (!hasNudged) {
                // Verify if still inactive
                const scoreStr = await redis.zscore('context_sync_queue', phone);
                if (scoreStr && parseFloat(scoreStr) <= fiveMinutesAgo) {
                    try {
                        console.log(`[Context Cron] Sending 5-min nudge event to n8n for ${phone}`);
                        
                        // Envia evento de "nudge" para o n8n
                        if (process.env.N8N_CONTEXT_WEBHOOK_URL) {
                            await fetch(process.env.N8N_CONTEXT_WEBHOOK_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    phone,
                                    event_type: '5_min_nudge',
                                    timestamp: new Date().toISOString(),
                                    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/context/callback`
                                })
                            });
                        }

                        // Mark as sent (expires in 1 hour)
                        await redis.set(`context_nudge_sent:${phone}`, 'true', 'EX', 3600);
                    } catch (err) {
                        console.error(`[Context Cron] Failed to process nudge for ${phone}:`, err);
                    }
                }
            }
        }

        // --- PART 2: 10-Minute Context Sync ---
        // 1. Get inactive users (last message > 10 mins ago)
        // Score is timestamp. We want everything BEFORE (NOW - 10 min)
        const inactiveUsers = await redis.zrangebyscore('context_sync_queue', '-inf', tenMinutesAgo);

        if (!inactiveUsers || inactiveUsers.length === 0) {
            return NextResponse.json({ message: 'No inactive users to process' });
        }

        const results = [];
        const BATCH_SIZE = 5; // Process in small batches to avoid timeouts

        // 2. Process each user
        for (const phone of inactiveUsers.slice(0, BATCH_SIZE)) {
            try {
                console.log(`[Context Cron] Processing inactive user: ${phone}`);
                
                // Fetch recent history
                const history = await getChatHistory(phone); // Last 20 messages (default limit in getChatHistory)
                
                // Send to n8n Webhook
                if (process.env.N8N_CONTEXT_WEBHOOK_URL) {
                    const response = await fetch(process.env.N8N_CONTEXT_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            phone,
                            event_type: '10_min_sync',
                            history,
                            timestamp: new Date().toISOString(),
                            callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/context/callback`
                        })
                    });
                    
                    if (response.ok) {
                        results.push({ phone, status: 'sent_to_n8n' });
                        
                        // Remove from queue ONLY if still inactive (score hasn't changed)
                        const currentScoreStr = await redis.zscore('context_sync_queue', phone);
                        const currentScore = currentScoreStr ? parseFloat(currentScoreStr) : 0;

                        if (currentScore <= tenMinutesAgo) {
                            await redis.zrem('context_sync_queue', phone);
                        } else {
                            console.log(`[Context Cron] User ${phone} became active again. Skipping removal.`);
                        }
                    } else {
                        console.error(`[Context Cron] n8n error for ${phone}: ${response.status}`);
                        results.push({ phone, status: 'error_n8n', code: response.status });
                        // Keep in queue but maybe update score to try later? 
                        // For now, let it be retried next run (score unchanged)
                    }
                } else {
                    console.warn('[Context Cron] N8N_CONTEXT_WEBHOOK_URL not set');
                    results.push({ phone, status: 'skipped_no_webhook' });
                }

            } catch (err) {
                console.error(`[Context Cron] Error processing ${phone}:`, err);
                results.push({ phone, status: 'error_internal' });
            }
        }

        return NextResponse.json({ 
            processed: results.length, 
            details: results,
            remaining: Math.max(0, inactiveUsers.length - BATCH_SIZE)
        });

    } catch (error) {
        console.error('[Context Cron] Critical Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
