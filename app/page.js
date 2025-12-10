'use client';

import { useEffect, useState } from 'react';

export default function KeyPage() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    async function fetchKey() {
      try {
        // Берём ВСЕ параметры из URL (включая clickid, subid и т.д.)
        const urlParams = new URLSearchParams(window.location.search);
        
        // Создаём параметры для API
        const apiParams = new URLSearchParams();
        
        // Копируем все параметры из URL в API запрос
        urlParams.forEach((value, key) => {
          apiParams.append(key, value);
        });
        
        // Если нет явного service, ставим lootlabs по умолчанию
        if (!urlParams.has('service')) {
          apiParams.set('service', 'lootlabs');
        }
        
        const response = await fetch(`/api/getKey?${apiParams.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setKey(data.key);
          navigator.clipboard.writeText(data.key);
          
          // Показываем сообщение, если ключ уже был выдан ранее
          if (data.existing) {
            setError('Note: You already received this key earlier');
          }
        } else {
          setError(data.message || 'Failed to generate key');
        }
      } catch (err) {
        setError('Connection error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchKey();
  }, []);
  
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>✅ Task Completed!</h1>
      <p style={styles.subtitle}>Your activation key:</p>
      
      <div style={styles.keyBox}>
        {loading ? (
          <div style={styles.loading}>Generating key...</div>
        ) : error && !key ? (
          <div style={styles.error}>{error}</div>
        ) : (
          <div style={styles.key}>{key}</div>
        )}
      </div>
      
      {key && (
        <>
          <p style={styles.instruction}>✓ Copied to clipboard! Paste into loader.</p>
          <p style={styles.warning}>
            ⚠️ Do not refresh this page - you will not get a new key for 24 hours
          </p>
        </>
      )}
      
      <div style={styles.info}>
        <p>• Key valid for <strong>9 hours</strong> after activation</p>
        <p>• <strong>1 key per 24 hours</strong> per user</p>
        <p>• Key binds to your device (HWID)</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#0a0a0a',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    padding: '50px 20px',
    minHeight: '100vh'
  },
  title: {
    fontSize: '28px',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#aaa',
    marginBottom: '30px'
  },
  keyBox: {
    background: '#1a1a1a',
    padding: '25px',
    border: '2px solid #00ffaa',
    borderRadius: '10px',
    margin: '20px auto',
    width: '100%',
    maxWidth: '400px',
    fontSize: '22px',
    letterSpacing: '2px',
    minHeight: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  key: {
    color: '#00ffaa',
    fontWeight: 'bold'
  },
  loading: {
    color: '#aaa'
  },
  error: {
    color: '#ff5555',
    fontSize: '16px'
  },
  instruction: {
    fontSize: '16px',
    margin: '15px 0',
    color: '#00ffaa'
  },
  warning: {
    fontSize: '14px',
    color: '#ffaa00',
    margin: '10px 0 30px 0',
    padding: '10px',
    background: '#1a1a1a',
    borderRadius: '5px'
  },
  info: {
    color: '#888',
    fontSize: '14px',
    marginTop: '30px',
    lineHeight: '1.6'
  }
};
