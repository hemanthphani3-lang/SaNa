import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Send, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import axios from 'axios';

const BACKEND = 'http://192.168.0.108:8000';
const POLL_INTERVAL_MS = 5000; // check backend every 5s when offline

const ChatView = ({ setVisemeTimeline, customization, speak, setAction, setEmotion }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Greetings. I am Groot, your neural assistant. How may I be of service today?' }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null); // null=checking, true, false
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const recognitionRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pollTimerRef = useRef(null);

  const _classifyEmotion = (text) => {
    const t = text.toLowerCase();
    if (t.match(/\b(happy|great|awesome|perfect|good news|wonderful|delight|smile|joy|funny|haha|lol)\b/)) return 'Happy';
    if (t.match(/\b(wow|excited|amazing|incredible|love|unbelievable|super|epic|brilliant|!|whoa)\b/)) return 'Excited';
    if (t.match(/\b(sorry|sad|unfortunate|unhappy|regret|pity|grief|depress|lonely|hard day|tough|pain)\b/)) return 'Sad';
    if (t.match(/\b(stop|don't|refuse|never|unfair|annoy|frustrat|wrong|hate|mad|angry|shut up)\b/)) return 'Angry';
    if (t.match(/\b(what\?|really\?|can't believe|unexpected|surprise|unusual|shock)\b/)) return 'Surprised';
    return 'Neutral';
  };

  // ── Backend health check ──────────────────────────────────────────────────
  const checkBackend = useCallback(async (silent = false) => {
    try {
      await axios.get(`${BACKEND}/`, { timeout: 2000 });
      setBackendOnline(true);
      return true;
    } catch {
      setBackendOnline(false);
      return false;
    }
  }, []);

  // Start polling when offline, stop when online
  useEffect(() => {
    checkBackend();
  }, []);

  useEffect(() => {
    if (backendOnline === false) {
      pollTimerRef.current = setInterval(() => checkBackend(true), POLL_INTERVAL_MS);
    } else {
      clearInterval(pollTimerRef.current);
    }
    return () => clearInterval(pollTimerRef.current);
  }, [backendOnline, checkBackend]);

  const langMapping = {
    'English': 'en-US',
    'Hindi': 'hi-IN',
    'Telugu': 'te-IN',
    'Tamil': 'ta-IN',
    'Malayalam': 'ml-IN',
    'Kannada': 'kn-IN',
    'Bengali': 'bn-IN',
    'Marathi': 'mr-IN',
    'Gujarati': 'gu-IN'
  };

  // ── Speech recognition ────────────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        processMessage(transcript);
      };
      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.onerror = (event) => {
        console.error("Speech Rec Error:", event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // Apply the currently selected language right before starting
      const selectedLang = customization?.language || 'English';
      recognitionRef.current.lang = langMapping[selectedLang] || 'en-US';
      
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping]);

  // ── Message handling ──────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    setInput('');
    await processMessage(currentInput);
  };

  const processMessage = async (text) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    
    // UI Feedback: Detect if we're likely triggered a deep search
    const deepSearchTriggers = ["news", "today", "current", "latest", "price", "stock", "weather", "who is", "what is happening", "score"];
    if (deepSearchTriggers.some(t => text.toLowerCase().includes(t))) {
      setIsSearching(true);
    }
    
    // Check for greetings (hi, hey, hello)
    const lowerText = text.toLowerCase();
    if (lowerText.match(/\b(hi|hey|hello)\b/)) {
        if (setAction) {
            setAction('wave');
            setTimeout(() => setAction('idle'), 2500); // Stop waving after 2.5s
        }
    }
    
    // Add empty assistant shell for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    // Check backend first
    const alive = await checkBackend(true);

    if (!alive) {
      setMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = {
           role: 'assistant',
           content: '⚡ Backend is offline. Launch the app via Groot.bat.',
           isOfflineNote: true
        };
        return newArr;
      });
      return;
    }

    try {
      const response = await fetch(`${BACKEND}/chat_stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          personality: customization?.personality || 'Friendly',
          language: customization?.language || 'English',
          temperature: customization?.temperature || 0.7,
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullReply += chunk;
        
        setMessages(prev => {
          const newArr = [...prev];
          newArr[newArr.length - 1].content = fullReply;
          return newArr;
        });
      }
      
      const detectedEmotion = _classifyEmotion(fullReply);
      setIsSearching(false);
      if (setEmotion) setEmotion(detectedEmotion);
      
      // Trigger Waving Animation on Greeting
      const isGreeting = fullReply.toLowerCase().match(/\b(hi|hello|hey|greetings|namaste|vanakkam|namaskara)\b/);
      if (isGreeting && setAction) {
        setAction('wave');
        setTimeout(() => setAction(null), 3000);
      }
      
      if (speak) speak(fullReply, customization.language, detectedEmotion);

    } catch (error) {
      console.error("Streaming error:", error);
      setIsSearching(false);
      setMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = {
          role: 'assistant',
          content: `⚠️ Network error`,
          isError: true,
        };
        return newArr;
      });
    }
  };

  // ── Status bar color/icon ─────────────────────────────────────────────────
  const statusColor = backendOnline === null ? '#f59e0b' : backendOnline ? '#DFB86C' : '#f87171';
  const statusLabel = backendOnline === null ? 'Connecting…' : backendOnline ? 'AI Online' : 'AI Offline';
  const StatusIcon = backendOnline ? Wifi : WifiOff;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      margin: '16px',
      marginBottom: '80px',
      borderRadius: '24px',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
      background: 'rgba(10, 8, 30, 0.6)',
      backdropFilter: 'blur(20px)',
      overflow: 'hidden',
    }}>

      {/* ── Status bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.2)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Pulsing dot */}
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: statusColor,
            boxShadow: backendOnline ? `0 0 6px ${statusColor}` : 'none',
            animation: backendOnline === null ? 'pulse 1.5s infinite' : 'none',
          }} />
          <StatusIcon size={14} color={statusColor} />
          <span style={{ fontSize: '12px', color: statusColor, fontWeight: 600, letterSpacing: '0.04em' }}>
            {statusLabel}
          </span>
        </div>

        {backendOnline === false && (
          <button
            onClick={() => checkBackend()}
            title="Retry connection"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '4px 10px',
              color: '#94a3b8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        )}
      </div>

      {/* Offline banner removed per user request */}

      {/* ── Message Feed ── */}
      <div
        ref={scrollContainerRef}
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '4px',
              color: m.role === 'user' ? '#e2e8f0' : (m.isError || m.isOfflineNote) ? '#f87171' : '#DFB86C',
              paddingLeft: m.role === 'user' ? 0 : '4px',
              paddingRight: m.role === 'user' ? '4px' : 0,
            }}>
              {m.role === 'user' ? 'You' : 'Groot'}
            </span>

            <div style={{
              maxWidth: '82%',
              padding: '14px 18px',
              borderRadius: m.role === 'user'
                ? '20px 20px 4px 20px'
                : '20px 20px 20px 4px',
              fontSize: '15px',
              lineHeight: '1.6',
              ...(m.role === 'user' ? {
                background: 'linear-gradient(135deg, #0A1128 0%, #02040A 100%)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(223,184,108,0.2)',
              } : m.isError || m.isOfflineNote ? {
                background: 'rgba(248,113,113,0.08)',
                color: '#fca5a5',
                border: '1px solid rgba(248,113,113,0.25)',
              } : {
                background: 'rgba(255,255,255,0.06)',
                color: '#e2e8f0',
                border: '1px solid rgba(223,184,108,0.2)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }),
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {isSearching && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(0, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.1)',
            borderRadius: '20px',
            width: 'fit-content',
            marginBottom: '10px',
            color: '#DFB86C',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}>
            <RefreshCw className="spin" size={12} />
            Neural RESEARCHING LIVE DATA...
          </div>
        )}

        {/* Typing indicator */}
        {isSearching === false && isTyping && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#DFB86C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', paddingLeft: '4px' }}>
              Groot
            </span>
            <div style={{
              padding: '14px 20px',
              borderRadius: '20px 20px 20px 4px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(223,184,108,0.2)',
              display: 'flex', gap: '5px', alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#DFB86C',
                  display: 'inline-block',
                  animation: `bounce 1.2s ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Input Bar ── */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <button
          onClick={toggleListening}
          title={isRecording ? 'Stop recording' : 'Voice input'}
          style={{
            flexShrink: 0,
            width: '48px', height: '48px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: isRecording ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
            color: isRecording ? '#ef4444' : '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
        >
          <Mic size={22} />
        </button>

        <input
          style={{
            flex: 1, height: '48px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '14px',
            padding: '0 16px',
            fontSize: '15px', color: '#fff', outline: 'none',
            transition: 'border-color 0.2s ease',
            opacity: backendOnline === false ? 0.6 : 1,
          }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder={backendOnline === false ? 'Backend offline — reconnecting…' : 'Type your message…'}
          onFocus={e => e.target.style.borderColor = '#DFB86C'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            flexShrink: 0,
            width: '48px', height: '48px',
            borderRadius: '14px', border: 'none',
            background: input.trim() ? 'linear-gradient(135deg, #DFB86C, #B8860B)' : 'rgba(255,255,255,0.05)',
            color: input.trim() ? '#fff' : '#555',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            boxShadow: input.trim() ? '0 4px 16px rgba(223,184,108,0.2)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Send size={22} />
        </button>
      </div>

      {/* Keyframes injected inline via style tag */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default ChatView;
