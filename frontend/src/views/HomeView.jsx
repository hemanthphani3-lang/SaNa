import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Cpu, Zap, Database, Shield, Terminal, ArrowRight } from 'lucide-react';

const BACKEND = 'http://192.168.0.108:8000';

const HomeView = ({ setView }) => {
  const [stats, setStats] = useState({ cpu: 0, ram: 0, battery: 0 });
  const [health, setHealth] = useState({ ollama: 'offline', rag: 'offline' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, healthRes] = await Promise.all([
          axios.get(`${BACKEND}/api/system/stats`, { timeout: 3000 }),
          axios.get(`${BACKEND}/api/system/health`, { timeout: 3000 }),
        ]);
        setStats(statsRes.data);
        setHealth(healthRes.data);
      } catch (e) {}
    };
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ padding: '48px 40px', height: '100%', overflowY: 'auto', animation: 'fadeIn 0.4s ease-out' }}>

      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{
            display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
            background: '#DFB86C', boxShadow: '0 0 10px #DFB86C',
            animation: 'pulse 2s ease infinite'
          }} />
          <span style={{ fontSize: '11px', color: '#DFB86C', letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase' }}>
            System Online
          </span>
        </div>
        <h1 style={{
          fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '2px',
          background: 'linear-gradient(90deg, #fff 40%, #DFB86C)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontFamily: "'Playfair Display', serif",
        }}>
          GROOT CORE
        </h1>
        <p style={{ color: '#475569', marginTop: '8px', fontSize: '0.9rem', letterSpacing: '1px' }}>
          Neural Processing Unit — All systems nominal
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'CPU Load', value: stats.cpu, icon: Cpu, color: '#DFB86C' },
          { label: 'Memory', value: stats.ram, icon: Activity, color: '#e2e8f0' },
          { label: 'Battery', value: stats.battery, icon: Zap, color: '#DFB86C' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            padding: '24px', borderRadius: '20px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
            transition: 'border-color 0.3s',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${color}30`
            }}>
              <Icon size={22} color={color} />
            </div>
            <div style={{
              fontSize: '2rem', fontWeight: 800, color: color,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {value}<span style={{ fontSize: '1rem', color: '#475569' }}>%</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Service Health */}
      <div style={{
        padding: '24px', borderRadius: '20px',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Shield size={16} color='#DFB86C' />
          <h3 style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
            Neural Service Status
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Ollama Engine', status: health.ollama, icon: Database, ok: 'connected' },
            { label: 'RAG Memory', status: health.rag, icon: Terminal, ok: 'initialized' },
          ].map(({ label, status, icon: Icon, ok }) => {
            const isOk = status === ok;
            return (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} color={isOk ? '#00f2ff' : '#64748b'} />
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>{label}</span>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem',
                  fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                  background: isOk ? 'rgba(223, 184, 108, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: isOk ? '#DFB86C' : '#f87171',
                  border: `1px solid ${isOk ? 'rgba(223, 184, 108, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                }}>
                  {isOk ? 'Active' : status || 'Offline'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Launch */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {[
          { label: 'Neural Chat', sub: 'Start a conversation with Groot', view: 'chat', color: '#DFB86C' },
          { label: 'Scheduler', sub: 'Manage tasks and reminders', view: 'schedule', color: '#e2e8f0' },
          { label: 'Archives', sub: 'Browse conversation history', view: 'history', color: '#DFB86C' },
        ].map(({ label, sub, view, color }) => (
          <button key={view} onClick={() => setView(view)} style={{
            flex: 1, padding: '20px 22px', borderRadius: '18px', border: `1px solid ${color}20`,
            background: `${color}08`, cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.25s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${color}14`; e.currentTarget.style.borderColor = `${color}40`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.borderColor = `${color}20`; }}
          >
            <div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: color }}>{label}</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#475569' }}>{sub}</p>
            </div>
            <ArrowRight size={18} color={color} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeView;
