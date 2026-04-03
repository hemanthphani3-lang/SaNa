import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Avatar from './components/Avatar/Avatar';
import Customizer from './components/Customization/Customizer';
import Sidebar from './components/Navigation/Sidebar';
import AvatarCreator from './components/Avatar/AvatarCreator';

import ChatView from './views/ChatView';
import ScheduleView from './views/ScheduleView';
import HistoryView from './views/HistoryView';
import useLipSync from './hooks/useLipSync';
import { Menu, X } from 'lucide-react';
import './App.css';

const App = () => {
  const [currentView, setCurrentView] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
    // Moved to ChatView, but kept here if we want App to maintain global state.
    // However, since ChatView handles messages internally now, we don't need processMessage here.
  };

  const renderRightPanel = () => {
    switch (currentView) {
      case 'chat':
        return (
          <ChatView 
            setVisemeTimeline={setVisemeTimeline} 
            customization={customization} 
            speak={speak} 
          />
        );
      case 'schedule':
        return <ScheduleView />;
      case 'history':
        return <HistoryView />;
      case 'avatar':
        return (
          <div className="avatar-studio-view h-full flex items-center justify-center animate-fade-in">
             <AvatarCreator 
                onClose={() => setCurrentView('chat')} 
                onAvatarGenerated={(url) => {
                  setCustomization({...customization, avatarUrl: url + '?t=' + new Date().getTime()});
                  setCurrentView('chat');
                }} 
              />
          </div>
        );
      case 'settings':
        return (
          <div className="settings-view h-full flex flex-col p-8 animate-fade-in custom-scrollbar overflow-y-auto">
             <h2 className="text-3xl font-bold mb-6">Neural Link Customization</h2>
             <Customizer 
               customization={customization} 
               setCustomization={setCustomization} 
             />
          </div>
        );
      default:
        return (
          <ChatView 
            setVisemeTimeline={setVisemeTimeline} 
            customization={customization} 
            speak={speak} 
          />
        );
    }
  };

  return (
    <div className={`app-main ${isSidebarOpen ? 'drawer-open' : ''}`}>
      <div className="scanline"></div>
      
      {/* Hamburger Menu Trigger */}
      <button 
        className="hamburger-btn"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar as an overlay drawer */}
      <Sidebar 
        currentView={currentView} 
        setView={(view) => {
          setCurrentView(view);
          setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="content-root h-screen w-screen overflow-hidden flex flex-row">
        {/* Persistent Avatar Panel (Left Side, 50% width) */}
        <div className="avatar-side w-1/2 h-full relative border-r border-white/5 bg-black/20">
            <Avatar viseme={currentViseme} customization={customization} />
            <div className="avatar-badge">
              <h2 className="avatar-badge-title">Groot</h2>
              <p className="avatar-badge-subtitle">{customization.personality} Protocol</p>
            </div>
        </div>

        {/* Dynamic Content Panel (Right Side, 50% width) */}
        <div className="content-side w-1/2 h-full relative overflow-hidden bg-gradient-to-br from-[#0a0f19] to-[#0d1424]">
           {renderRightPanel()}
        </div>
      </main>
    </div>
  );
};

export default App;
