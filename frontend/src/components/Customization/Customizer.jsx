import React from 'react';
import { Palette, UserCircle, Globe } from 'lucide-react';

const Customizer = ({ customization, setCustomization }) => {
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
        </select>
      </div>
    </div>
  );
};

export default Customizer;
