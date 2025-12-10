// api/stats.js
import clientPromise from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic auth (in production use better auth)
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('cevex');
    
    const [keys, sessions, activations, generations] = await Promise.all([
      db.collection('keys').countDocuments(),
      db.collection('sessions').countDocuments(),
      db.collection('activations').countDocuments(),
      db.collection('generations').countDocuments()
    ]);
    
    const usedKeys = await db.collection('keys').countDocuments({ used: true });
    const activeSessions = await db.collection('sessions').countDocuments({ 
      expires: { $gt: new Date() } 
    });
    
    const recentActivations = await db.collection('activations')
      .find()
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    res.json({
      totalKeys: keys,
      usedKeys: usedKeys,
      activeSessions: activeSessions,
      totalSessions: sessions,
      totalActivations: activations,
      totalGenerations: generations,
      recentActivations: recentActivations.map(a => ({
        key: a.key,
        hwid: a.hwid,
        timestamp: a.timestamp,
        ip: a.ip
      }))
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}
