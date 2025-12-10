'use client';

import { useEffect, useState } from 'react';

export default function KeyPage() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    async function fetchKey() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const service = urlParams.get('service') || 'lootlabs';
        
        const response = await fetch(`/api/getKey?service=${service}`);
        const data = await response.json();
        
        if (data.success) {
          setKey(data.key);
          navigator.clipboard.writeText(data.key);
        } else {
          setError('Failed to generate key');
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
        ) : error ? (
          <div style={styles.error}>{error}</div>
        ) : (
          <div style={styles.key}>{key}</div>
        )}
      </div>
      
      <p style={styles.instruction}>Copied to clipboard! Paste into loader.</p>
      
      <div style={styles.info}>
        <p>• Key valid for <strong>9 hours</strong></p>
        <p>• Automatically copied</p>
        <p>• Do not share this page</p>
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
    color: '#ff5555'
  },
  instruction: {
    fontSize: '16px',
    margin: '25px 0',
    color: '#ccc'
  },
  info: {
    color: '#888',
    fontSize: '14px',
    marginTop: '40px',
    lineHeight: '1.6'
  }
};
