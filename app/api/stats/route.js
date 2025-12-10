import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
    try {
        const db = await getDB();
        
        const totalKeys = await db.get('SELECT COUNT(*) as count FROM keys');
        const activeKeys = await db.get('SELECT COUNT(*) as count FROM keys WHERE activated_at IS NOT NULL');
        const sessions = await db.get('SELECT COUNT(*) as count FROM sessions WHERE expires_at > CURRENT_TIMESTAMP');
        
        return NextResponse.json({
            success: true,
            stats: {
                totalKeys: totalKeys.count,
                activeKeys: activeKeys.count,
                activeSessions: sessions.count
            }
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ success: false, message: "Server error" });
    }
}
