import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Endpoint to receive callback from n8n after processing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { disparo_id, results } = body;

    if (!disparo_id || !results || !Array.isArray(results)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let successCount = 0;
    let failCount = 0;

    for (const res of results) {
        const { phone, status, error } = res;
        
        // Map external status to internal status
        // n8n should send 'sent', 'failed', 'skipped', etc.
        const dbStatus = status === 'success' ? 'sent' : (status === 'error' ? 'failed' : status);

        await pool.query(`
            INSERT INTO disparo_logs (disparo_id, phone, status) 
            VALUES ($1, $2, $3)
            ON CONFLICT (disparo_id, phone) 
            DO UPDATE SET status = $3, sent_at = NOW()
        `, [disparo_id, phone, dbStatus]);

        if (dbStatus === 'sent') successCount++;
        else failCount++;
    }

    // Update stats
    const statsQuery = `
        SELECT 
            COUNT(*) FILTER (WHERE status = 'sent') as sent,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            COUNT(*) FILTER (WHERE status LIKE 'skipped%') as skipped,
            COUNT(*) as total_processed
        FROM disparo_logs 
        WHERE disparo_id = $1
    `;
    const statsRes = await pool.query(statsQuery, [disparo_id]);
    const stats = statsRes.rows[0];

    await pool.query(`
      UPDATE disparos 
      SET stats = $1, updated_at = NOW() 
      WHERE id = $2
    `, [JSON.stringify(stats), disparo_id]);

    return NextResponse.json({ message: 'Callback processed', stats });

  } catch (err) {
    console.error('Callback Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
