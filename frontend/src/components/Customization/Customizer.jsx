import React, { useState, useEffect } from 'react';
import { Palette, UserCircle, Globe, Mic2, PlayCircle } from 'lucide-react';

const Customizer = ({ customization, setCustomization }) => {
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    const fetchVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Show all voices & prefer offline (localService)
      const allVoices = voices;
      setAvailableVoices(allVoices.slice(0, 25)); // Show a few more

    };
    
    fetchVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = fetchVoices;
    }
  }, []);

  const playDemo = (voiceUri) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    setTimeout(() => {
        const demoUtterance = new SpeechSynthesisUtterance("Hello, I am Groot. This is a designated voice test.");
        const targetVoice = availableVoices.find(v => v.voiceURI === voiceUri);
        if (targetVoice) {
            demoUtterance.voice = targetVoice;
        } else {
            const freshVoices = window.speechSynthesis.getVoices();
            demoUtterance.voice = freshVoices.find(v => v.voiceURI === voiceUri) || null;
        }
        demoUtterance.pitch = customization.voicePitch || 1;
        demoUtterance.rate = customization.voiceRate || 1;
        demoUtterance.lang = targetVoice?.lang || 'en-US';
        window.speechSynthesis.speak(demoUtterance);
    }, 100);
  };

  return (
    <div className="settings-panel glass">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
        <Palette size={18} /> Appearance & Logic
      </h3>
      
      <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px' }}>
        <button 
          onClick={customization.onOpenStudio} 
          style={{ width: '100%', padding: '8px', background: '#00ffff', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
        >
          Open Avatar Studio
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '5px' }}>
          <label><UserCircle size={14} style={{ marginRight: '5px' }} /> Skin Tone</label>
          <input type="color" value={customization.skinColor || '#FFE0BD'} onChange={(e) => setCustomization({...customization, skinColor: e.target.value})} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '5px' }}>
          <label><Palette size={14} style={{ marginRight: '5px' }} /> Hair Tint</label>
          <input type="color" value={customization.hairColor || '#4A3728'} onChange={(e) => setCustomization({...customization, hairColor: e.target.value})} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <label><Palette size={14} style={{ marginRight: '5px' }} /> Clothes Tint</label>
          <input type="color" value={customization.clothesColor || '#3498db'} onChange={(e) => setCustomization({...customization, clothesColor: e.target.value})} />
        </div>
      </div>

      <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <label style={{ marginBottom: '10px' }}><Mic2 size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> OS Neural Voices</label>
        <div style={{ width: '100%', maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '5px' }} className="custom-scrollbar">
          {availableVoices.length === 0 && <span style={{fontSize: '12px', color: '#999', padding: '5px'}}>Scanning local neural engines...</span>}
          {availableVoices.map((voice, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '140px' }}>
                 <span style={{ fontSize: '13px', color: customization.voiceUri === voice.voiceURI ? '#00ffff' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {voice.name.replace('Microsoft ', '').replace('Online', '')}
                 </span>
                 <span style={{ fontSize: '10px', color: '#888' }}>{voice.lang} {!voice.localService ? '(Cloud)' : '(Offline)'}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                 <button onClick={() => playDemo(voice.voiceURI)} style={{ background: 'transparent', border: '1px solid #00ffff', color: '#00ffff', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                   <PlayCircle size={14} />
                 </button>
                 <button 
                   onClick={() => setCustomization({...customization, voiceUri: voice.voiceURI})}
                   style={{ background: customization.voiceUri === voice.voiceURI ? '#00ffff' : 'rgba(255,255,255,0.1)', color: customization.voiceUri === voice.voiceURI ? '#000' : '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                   {customization.voiceUri === voice.voiceURI ? 'Equipped' : 'Select'}
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="setting-item">
        <label>LLM Temp ({(customization.temperature || 0.9).toFixed(1)})</label>
        <input 
          type="range" min="0.1" max="1.5" step="0.1"
          value={customization.temperature || 0.9} 
          onChange={(e) => setCustomization({...customization, temperature: parseFloat(e.target.value)})} 
        />
      </div>

      <div className="setting-item">
        <label>Voice Pitch ({(customization.voicePitch || 1).toFixed(1)})</label>
        <input 
          type="range" min="0.1" max="2" step="0.1"
          value={customization.voicePitch || 1} 
          onChange={(e) => setCustomization({...customization, voicePitch: parseFloat(e.target.value)})} 
        />
      </div>

      <div className="setting-item">
        <label>Voice Rate ({(customization.voiceRate || 1).toFixed(1)})</label>
        <input 
          type="range" min="0.5" max="2" step="0.1"
          value={customization.voiceRate || 1} 
          onChange={(e) => setCustomization({...customization, voiceRate: parseFloat(e.target.value)})} 
        />
      </div>

      <div className="setting-item">
        <label><UserCircle size={14} style={{ marginRight: '5px' }} /> Personality</label>
        <select 
          value={customization.personality} 
          onChange={(e) => setCustomization({...customization, personality: e.target.value})}
          className="glass-select"
        >
          <option>Friendly</option>
          <option>Professional</option>
          <option>Teacher</option>
          <option>Strict</option>
        </select>
      </div>

      <div className="setting-item">
        <label><Globe size={14} style={{ marginRight: '5px' }} /> Language</label>
        <select 
          value={customization.language} 
          onChange={(e) => setCustomization({...customization, language: e.target.value})}
          className="glass-select"
        >
          <option>English</option>
          <option>Hindi</option>
          <option>Telugu</option>
          <option>Tamil</option>
          <option>Malayalam</option>
          <option>Kannada</option>
          <option>Bengali</option>
          <option>Marathi</option>
          <option>Gujarati</option>
        </select>
      </div>
    </div>
  );
};

export default Customizer;
