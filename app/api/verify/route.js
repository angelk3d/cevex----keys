import { NextResponse } from 'next/server';

const keysDB = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const hwid = searchParams.get('hwid');
  
  if (!key || !hwid) {
    return NextResponse.json({
      success: false,
      message: 'Missing key or HWID'
    });
  }
  
  const keyData = keysDB.get(key.toUpperCase());
  if (!keyData) {
    return NextResponse.json({
      success: false,
      message: 'Invalid key'
    });
  }
  
  const now = new Date();
  
  if (now > keyData.expiresAt) {
    keysDB.delete(key);
    return NextResponse.json({
      success: false,
      message: 'Key expired (9h limit)'
    });
  }
  
  // ЕСЛИ ключ уже был активирован другим HWID
  if (keyData.hwid && keyData.hwid !== hwid) {
    return NextResponse.json({
      success: false,
      message: 'Key already activated on another device'
    });
  }
  
  // Первая активация
  if (!keyData.hwid) {
    keyData.hwid = hwid;
    keyData.activated = true;
    keyData.activatedAt = now;
    keyData.usesLeft -= 1;
    
    return NextResponse.json({
      success: true,
      message: 'Key activated!',
      expires: keyData.expiresAt.toISOString(),
      timeLeft: Math.round((keyData.expiresAt - now) / (1000 * 60 * 60)) + 'h'
    });
  }
  
  // Повторная активация на том же устройстве
  if (keyData.hwid === hwid) {
    return NextResponse.json({
      success: true,
      message: 'Access granted'
    });
  }
  
  // Не должно сюда дойти
  return NextResponse.json({
    success: false,
    message: 'Unknown error'
  });
}
