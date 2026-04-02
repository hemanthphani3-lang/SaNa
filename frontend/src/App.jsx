import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Avatar from './components/Avatar/Avatar';
import useLipSync from './hooks/useLipSync';
import { Mic, Send, Settings, User, Volume2 } from 'lucide-react';
import './App.css';

const App = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'I am Groot!' }
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
  const recognitionRef = useRef(null);

  useEffect(() => {
    // 1. Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        // Automatic Send
        handleVoiceSend(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Viseme Sync: Randomly move mouth while speaking
    const interval = setInterval(() => {
      const visemes = ['A', 'E', 'O', 'I', 'U'];
      setVisemeTimeline([{ viseme: visemes[Math.floor(Math.random() * visemes.length)], time: 1 }]);
    }, 150);

    utterance.onend = () => {
      clearInterval(interval);
      setVisemeTimeline([{ viseme: 'Neutral', time: 1 }]);
    };

    window.speechSynthesis.speak(utterance);
  };

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    setInput('');
    await processMessage(currentInput);
  };

  const handleVoiceSend = async (transcript) => {
    await processMessage(transcript);
  };

  const processMessage = async (text) => {
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await axios.post('http://localhost:8000/chat', {
        message: text,
        personality: customization.personality,
        language: customization.language
      });

      const assistantMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, assistantMessage]);

      // 2. Groot Speaks
      speak(response.data.response);

      // 3. Sync Visemes from Backend (if provided)
      if (response.data.viseme_timeline && response.data.viseme_timeline.length > 0) {
        setVisemeTimeline(response.data.viseme_timeline);
      }

    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="app-main">
      <div className="scanline"></div>
      <header className="glass draggable">
        <div className="logo clickable">Groot AI</div>
        <button onClick={() => setShowSettings(!showSettings)} className="icon-btn clickable">
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
            <button className={`icon-btn ${isRecording ? 'recording' : ''}`} onClick={toggleListening}>
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
