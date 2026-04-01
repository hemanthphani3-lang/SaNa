import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Avatar from './components/Avatar/Avatar';
import useLipSync from './hooks/useLipSync';
import { Mic, Send, Settings, User, Volume2 } from 'lucide-react';
import './App.css';

const App = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am SANKEYTHIKA. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [visemeTimeline, setVisemeTimeline] = useState([]);
  const { currentViseme } = useLipSync(visemeTimeline);
  
  // Customization State
  const [customization, setCustomization] = useState({
    skinColor: '#FFE0BD',
    hairColor: '#4A3728',
    clothesColor: '#3498db',
    personality: 'Friendly',
    language: 'English'
  });

  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // 1. Generate Response
      const response = await axios.post('http://localhost:8000/chat', {
        message: input,
        personality: customization.personality,
        language: customization.language
      });

      const assistantMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, assistantMessage]);

      // 2. Fetch Lip Sync Data
      // (Mocked for now - backend would provide timeline)
      const mockTimeline = [
        { viseme: 'A', time: 0.1 },
        { viseme: 'O', time: 0.3 },
        { viseme: 'M', time: 0.5 },
        { viseme: 'Neutral', time: 0.7 }
      ];
      setVisemeTimeline(mockTimeline);

    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="app-main">
      <header className="glass">
        <div className="logo">SANKEYTHIKA AI</div>
        <button onClick={() => setShowSettings(!showSettings)} className="icon-btn">
          <Settings size={20} />
        </button>
      </header>

      <main className="content">
        <div className="avatar-section">
          <Avatar viseme={currentViseme} customization={customization} />
        </div>

        <div className="chat-section glass">
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className="msg-content">{m.content}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="input-area">
            <button className={`icon-btn ${isRecording ? 'active' : ''}`} onClick={() => setIsRecording(!isRecording)}>
              <Mic size={20} />
            </button>
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
            />
            <button onClick={handleSend} className="send-btn">
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>

      {showSettings && (
        <div className="settings-panel glass">
          <h3>Customization</h3>
          <div className="setting-item">
            <label>Skin</label>
            <input type="color" value={customization.skinColor} onChange={(e) => setCustomization({...customization, skinColor: e.target.value})} />
          </div>
          <div className="setting-item">
            <label>Personality</label>
            <select value={customization.personality} onChange={(e) => setCustomization({...customization, personality: e.target.value})}>
              <option>Friendly</option>
              <option>Professional</option>
              <option>Teacher</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Language</label>
            <select value={customization.language} onChange={(e) => setCustomization({...customization, language: e.target.value})}>
              <option>English</option>
              <option>Hindi</option>
              <option>Telugu</option>
              <option>Tamil</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
