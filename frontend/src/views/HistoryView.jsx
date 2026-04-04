import React, { useState, useEffect } from 'react';
import { History, Clock, User, Bot, ChevronLeft, RefreshCw } from 'lucide-react';

const BACKEND = 'http://192.168.0.108:8000';

const HistoryView = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/chat/history`, { headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      } else {
        // Fallback to local mock if endpoint unavailable
        setHistory([]);
      }
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div style={{
          width: '44px', height: '44px', borderRadius: '14px',
          background: 'rgba(223, 184, 108, 0.1)', border: '1px solid rgba(223, 184, 108, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <History size={22} color="#DFB86C" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif" }}>Conversation Archives</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#475569', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {history.length} entries in neural memory
          </p>
        </div>
        <button onClick={fetchHistory} style={{
          marginLeft: 'auto', padding: '8px 16px', borderRadius: '10px',
          background: 'rgba(223, 184, 108, 0.06)', border: '1px solid rgba(223, 184, 108, 0.2)',
          color: '#DFB86C', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
        }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Message List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
          <RefreshCw size={24} color="#DFB86C" className="spin" />
        </div>
      ) : history.length === 0 ? (
        <div style={{
          textAlign: 'center', paddingTop: '80px',
          color: '#475569', fontSize: '0.9rem',
        }}>
          <History size={40} color="#1e293b" style={{ marginBottom: '16px' }} />
          <p>No archived conversations yet.</p>
          <p style={{ fontSize: '0.75rem', marginTop: '8px' }}>Start chatting with Groot to populate your archives.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '820px', paddingBottom: '40px' }}>
          {history.map((item, idx) => {
            const isUser = item.role === 'user';
            return (
              <div key={idx} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                animation: 'fadeIn 0.3s ease-out',
              }}>
                {/* Role label */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  marginBottom: '6px',
                  paddingLeft: isUser ? 0 : '4px',
                  paddingRight: isUser ? '4px' : 0,
                }}>
                  {isUser
                    ? <User size={12} color="#a78bfa" />
                    : <Bot size={12} color="#DFB86C" />}
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: isUser ? '#e2e8f0' : '#DFB86C',
                  }}>
                    {isUser ? 'Operator' : 'Groot'}
                  </span>
                  {item.timestamp && (
                    <>
                      <span style={{ color: '#1e293b', fontSize: '0.6rem' }}>•</span>
                      <Clock size={10} color="#334155" />
                      <span style={{ fontSize: '0.6rem', color: '#334155' }}>{item.timestamp}</span>
                    </>
                  )}
                </div>
                {/* Bubble */}
                <div style={{
                  maxWidth: '78%', padding: '14px 18px', lineHeight: 1.65,
                  fontSize: '0.9rem', color: '#e2e8f0',
                  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isUser ? 'rgba(167, 139, 250, 0.1)' : 'rgba(15, 23, 42, 0.7)',
                  border: `1px solid ${isUser ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
                }}>
                  {item.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
