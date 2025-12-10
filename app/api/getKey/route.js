import { NextResponse } from 'next/server';
import crypto from 'crypto';

const keysDB = new Map(); // Все ключи
const userSessions = new Map(); // Кто уже получил ключ

function getUserId(request) {
  const url = new URL(request.url);
  const clickId = url.searchParams.get('clickid'); // LootLabs передаёт clickid
  const subId = url.searchParams.get('subid'); // Linkvertise иногда передаёт subid
  
  // Если CPA сеть дала уникальный ID - используем его
  if (clickId) return `click:${clickId}`;
  if (subId) return `sub:${subId}`;
  
  // Иначе создаём ID из IP и браузера (менее надёжно, но лучше чем ничего)
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const agent = request.headers.get('user-agent') || 'unknown';
  const hash = crypto.createHash('md5').update(`${ip}${agent}`).digest('hex').substring(0, 12);
  return `ip:${hash}`;
}

export async function GET(request) {
  const userId = getUserId(request);
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service') || 'direct';
  
  // Проверяем, получал ли этот пользователь ключ в последние 24 часа
  const now = new Date();
  const userSession = userSessions.get(userId);
  
  if (userSession) {
    const lastIssued = new Date(userSession.timestamp);
    const hoursSinceLast = (now - lastIssued) / (1000 * 60 * 60);
    
    if (hoursSinceLast < 24) { // Один ключ в 24 часа на пользователя
      const existingKey = userSession.key;
      const keyData = keysDB.get(existingKey);
      
      if (keyData && now < keyData.expiresAt) {
        return NextResponse.json({
          success: true,
          key: existingKey,
          expires: keyData.expiresAt.toISOString(),
          message: 'Your existing key (already issued)',
          existing: true
        });
      }
    }
  }
  
  // Генерация нового ключа
  const prefix = service === 'lootlabs' ? 'LL-' : 
                 service === 'linkvertise' ? 'LV-' : 'CEVEX-';
  const key = prefix + 
              crypto.randomBytes(3).toString('hex').toUpperCase() + '-' +
              crypto.randomBytes(2).toString('hex').toUpperCase();
  
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 9 * 60 * 60 * 1000); // 9 часов
  
  keysDB.set(key, {
    service,
    createdAt,
    expiresAt,
    hwid: null,
    activated: false,
    usesLeft: 1,
    userId: userId
  });
  
  // Запоминаем, что этот пользователь получил ключ
  userSessions.set(userId, {
    key: key,
    timestamp: now.toISOString(),
    service: service
  });
  
  // Очистка старых сессий (старше 48 часов)
  for (const [uid, session] of userSessions.entries()) {
    const sessionTime = new Date(session.timestamp);
    if ((now - sessionTime) > 48 * 60 * 60 * 1000) {
      userSessions.delete(uid);
    }
  }
  
  console.log(`[${service}] Issued key: ${key} to user: ${userId}`);
  
  return NextResponse.json({
    success: true,
    key: key,
    expires: expiresAt.toISOString(),
    message: 'Valid for 9 hours',
    existing: false
  });
}
