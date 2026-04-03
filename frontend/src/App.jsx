import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Avatar from './components/Avatar/Avatar';
import Customizer from './components/Customization/Customizer';
import AvatarCreator from './components/Avatar/AvatarCreator';
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
  
  const [customization, setCustomization] = useState({
    avatarUrl: '/models/avatar.vrm',
    temperature: 0.9,
    voicePitch: 1.0,
    voiceRate: 1.0,
    personality: 'Friendly',
    language: 'English'
  });

  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAvatarStudio, setShowAvatarStudio] = useState(false);
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

  const speak = (text, timeline = []) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice settings
    utterance.pitch = customization.voicePitch || 1;
    utterance.rate = customization.voiceRate || 1;
    
    // 1. If backend provided a timeline, use it. 
    // 2. If not, don't fallback to a mock interval (let useLipSync handle it)
    if (timeline && timeline.length > 0) {
      setVisemeTimeline(timeline);
    } else {
      // Small fallback animation if no timeline is provided
      setVisemeTimeline([
        { viseme: 'A', time: 0.1 },
        { viseme: 'E', time: 0.3 },
        { viseme: 'Neutral', time: 0.5 }
      ]);
    }

    utterance.onend = () => {
      setVisemeTimeline([{ viseme: 'Neutral', time: 0 }]);
    };

    window.speechSynthesis.speak(utterance);
  };

  const scrollContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
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
        language: customization.language,
        temperature: customization.temperature
      });

      const assistantMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, assistantMessage]);

      // 2. Groot Speaks with Timeline
      speak(response.data.response, response.data.viseme_timeline);

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
          <div className="messages" ref={scrollContainerRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className="msg-content">{m.content}</div>
              </div>
            ))}
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
        <Customizer customization={{...customization, onOpenStudio: () => setShowAvatarStudio(true)}} setCustomization={setCustomization} />
      )}
      
      {showAvatarStudio && (
        <AvatarCreator 
          onClose={() => setShowAvatarStudio(false)} 
          onAvatarGenerated={(url) => {
            setCustomization({...customization, avatarUrl: url + '?t=' + new Date().getTime()});
          }} 
        />
      )}
    </div>
  );
};

export default App;
