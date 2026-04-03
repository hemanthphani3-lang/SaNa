import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Avatar from './components/Avatar/Avatar';
import Customizer from './components/Customization/Customizer';
import AvatarCreator from './components/Avatar/AvatarCreator';
import Sidebar from './components/Navigation/Sidebar';
import ScheduleView from './views/ScheduleView';
import HistoryView from './views/HistoryView';
import useLipSync from './hooks/useLipSync';
import { Mic, Send, Settings, User, Volume2, Gamepad2 } from 'lucide-react';
import './App.css';

const App = () => {
  const [currentView, setCurrentView] = useState('chat');
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
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleVoiceSend(transcript);
      };
      recognitionRef.current.onend = () => setIsRecording(false);
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
    utterance.pitch = customization.voicePitch || 1;
    utterance.rate = customization.voiceRate || 1;
    
    if (timeline && timeline.length > 0) {
      setVisemeTimeline(timeline);
    } else {
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
  }, [messages, currentView]);

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
      speak(response.data.response, response.data.viseme_timeline);

    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="home-view flex flex-col items-center justify-center h-full text-center p-10 animate-fade-in">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">WELCOME BACK</h1>
            <p className="text-xl opacity-60 max-w-xl">I am Groot. Your offline neural assistant is ready to help you with tasks, reminders, and system automation.</p>
            <div className="mt-10 grid grid-cols-2 gap-4">
               <button onClick={() => setCurrentView('chat')} className="glass p-6 rounded-2xl hover:bg-white/10 transition-all flex flex-col items-center gap-4">
                 <Send size={32} className="text-cyan-400" />
                 <span>Start Chatting</span>
               </button>
               <button onClick={() => setCurrentView('schedule')} className="glass p-6 rounded-2xl hover:bg-white/10 transition-all flex flex-col items-center gap-4">
                 <Clock size={32} className="text-purple-400" />
                 <span>View Schedule</span>
               </button>
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="chat-interface-wrapper flex flex-col h-full animate-fade-in">
            <div className="avatar-section flex-1">
              <Avatar viseme={currentViseme} customization={customization} />
            </div>
            <div className="chat-section glass m-4 mb-20">
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
          </div>
        );
      case 'schedule':
        return <ScheduleView />;
      case 'history':
        return <HistoryView />;
      case 'avatar':
        return (
          <div className="avatar-studio-view h-full flex items-center justify-center animate-fade-in">
             <AvatarCreator 
                onClose={() => setCurrentView('home')} 
                onAvatarGenerated={(url) => {
                  setCustomization({...customization, avatarUrl: url + '?t=' + new Date().getTime()});
                  setCurrentView('chat');
                }} 
              />
          </div>
        );
      case 'settings':
        return (
          <div className="settings-view h-full flex items-center justify-center animate-fade-in">
            <Customizer 
              customization={{...customization, onOpenStudio: () => setCurrentView('avatar')}} 
              setCustomization={setCustomization} 
            />
          </div>
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="app-main">
      <div className="scanline"></div>
      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="content-root h-screen w-screen overflow-hidden">
        {renderContent()}
      </main>

      {/* Legacy overlays for modal-style sub-screens if needed */}
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
