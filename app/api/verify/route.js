// api/verify.js
import clientPromise from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { key, hwid } = req.query;
  
  // Normalize key
  const normalizedKey = key.toUpperCase().replace(/\s+/g, '');
  
  // Validate format
  const keyRegex = /^(LL|LV)-[A-Z0-9]{4}-[A-Z0-9]{2}$/;
  
  if (!keyRegex.test(normalizedKey)) {
    return res.json({ 
      valid: false, 
      reason: "Invalid key format. Use LL-XXXX-XX or LV-XXXX-XX" 
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db('cevex');
    
    // Find key in database
    const keyData = await db.collection('keys').findOne({ 
      key: normalizedKey 
    });

    if (!keyData) {
      return res.json({ 
        valid: false, 
        reason: "Key not found in database" 
      });
    }

    // Check if key is expired
    if (new Date() > new Date(keyData.expires)) {
      return res.json({ 
        valid: false, 
        reason: "Key expired" 
      });
    }

    // Check if key already used with different HWID
    if (keyData.used && keyData.hwid !== hwid) {
      return res.json({ 
        valid: false, 
        reason: "Key already used on different device" 
      });
    }

    // Mark key as used if not already used
    if (!keyData.used) {
      await db.collection('keys').updateOne(
        { key: normalizedKey },
        { 
          $set: { 
            used: true,
            hwid: hwid,
            usedAt: new Date(),
            usedBy: hwid
          }
        }
      );
    }

    // Generate session token
    const crypto = require('crypto');
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save session to database
    await db.collection('sessions').insertOne({
      token: sessionToken,
      hwid: hwid,
      key: normalizedKey,
      expires: sessionExpires,
      createdAt: new Date(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    // Save activation log
    await db.collection('activations').insertOne({
      key: normalizedKey,
      hwid: hwid,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    return res.json({
      valid: true,
      session: sessionToken,
      hwid: hwid,
      expires: sessionExpires.getTime()
    });

  } catch (error) {
    console.error('Verify error:', error);
    return res.json({ 
      valid: false, 
      reason: "Server error. Please try again later." 
    });
  }
}
