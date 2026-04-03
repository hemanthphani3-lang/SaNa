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

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (customization.voiceUri) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.voiceURI === customization.voiceUri);
      if (selectedVoice) {
         utterance.voice = selectedVoice;
      }
    }

    utterance.pitch = customization.voicePitch || 1;
    utterance.rate = customization.voiceRate || 1;

    utterance.onstart = () => {
      setVisemeTimeline([{ viseme: 'A', time: 0 }]);
    };
    
    // Dynamic phonetics exactly synced with the browser's audio word-boundaries
    utterance.onboundary = (event) => {
        if (event.name !== 'word') return;
        const word = text.slice(event.charIndex, event.charIndex + event.charLength).toLowerCase();
        
        const miniTimeline = [];
        let timeOffset = 0;
        const timePerViseme = 0.08; // 80ms per phonetic sound
        
        // Strip out roughly silent/complex clusters for cleaner phonetic mapping
        const phoneticStr = word.replace(/e$/, '').replace(/ght/g, 't').replace(/sh/g, 's').replace(/th/g, 't').replace(/ll/g, 'l');
        
        for (let i = 0; i < phoneticStr.length; i++) {
            const char = phoneticStr[i];
            let v = null;
            
            // Map character to physical Phonetic Viseme
            if ('bmp'.includes(char)) v = 'Neutral'; // Closed lips for bilabials
            else if ('ouqw'.includes(char)) v = 'O'; // Rounded lips
            else if ('eiy'.includes(char)) v = 'E';  // Slight open
            else if ('ah'.includes(char)) v = 'A';   // Wide open
            
            if (v) {
                if (miniTimeline.length === 0 || miniTimeline[miniTimeline.length - 1].viseme !== v) {
                     miniTimeline.push({ viseme: v, time: timeOffset });
                }
                timeOffset += timePerViseme;
            }
        }
        
        // Fallback if no specific vowels/bilabials were caught
        if (miniTimeline.length === 0) {
             miniTimeline.push({ viseme: 'E', time: 0 });
             timeOffset = 0.1;
        }

        // Snap mouth closed at the exact end of the phonetic word trajectory
        miniTimeline.push({ viseme: 'Neutral', time: timeOffset + 0.05 });
        setVisemeTimeline(miniTimeline);
    };

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

  useEffect(() => {
    // Background listener for Scheduled Tasks triggered from the Python Backend
    const notifyTimer = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/notifications");
        if (res.ok) {
           const data = await res.json();
           if (data.alerts && data.alerts.length > 0) {
               data.alerts.forEach(alert => {
                   speak(`Scheduled task triggered. Title: ${alert.title}. Due at: ${new Date(alert.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`);
               });
           }
        }
      } catch (err) {}
    }, 4000);
    
    return () => clearInterval(notifyTimer);
  }, [customization]);

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
          <div className="view-container settings-view custom-scrollbar" style={{ paddingTop: '100px', paddingBottom: '120px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', maxWidth: '450px', margin: '0 auto' }}>
               <h2 className="text-3xl font-bold" style={{ fontSize: '1.8rem', background: 'linear-gradient(90deg, #fff, #00ffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Neural Link Customization</h2>
               <button 
                 onClick={() => setCurrentView('chat')} 
                 style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', color: '#00ffff', border: '1px solid rgba(0,255,255,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                 X Close
               </button>
             </div>
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
