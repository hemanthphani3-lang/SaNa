import React, { useEffect, useRef } from 'react';
import { X, Loader } from 'lucide-react';
import axios from 'axios';

const AVATAR_STUDIO_URL = "https://demo.readyplayer.me/avatar?frameApi&clearCache";

const AvatarCreator = ({ onClose, onAvatarGenerated }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    // Subscribe to Ready Player Me iframe postMessages
    const handleIframeMessage = async (event) => {
      // Only accept messages from readyplayer.me
      if (!event.origin.includes('readyplayer.me')) return;

      const data = event.data;
      if (!data) return;

      // RPM sends the GLB URL as a plain string ending in .glb
      // OR as a JSON object with a 'url' field
      let avatarUrl = null;
      
      if (typeof data === 'string' && data.endsWith('.glb')) {
        avatarUrl = data;
      } else if (typeof data === 'object') {
        // Handle object-based event formats
        if (data.data?.url?.endsWith('.glb')) {
          avatarUrl = data.data.url;
        } else if (data.url?.endsWith('.glb')) {
          avatarUrl = data.url;
        }
      }

      if (!avatarUrl) return;

      console.log('Avatar URL received:', avatarUrl);

      try {
        // Tell the backend to download it locally for offline use
        await axios.post('http://localhost:8000/api/download-avatar', { url: avatarUrl });
        if (onAvatarGenerated) onAvatarGenerated(avatarUrl);
      } catch (error) {
        console.warn("Could not save avatar locally (backend may be offline). Loading from URL instead.");
        if (onAvatarGenerated) onAvatarGenerated(avatarUrl);
      } finally {
        onClose();
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [onClose, onAvatarGenerated]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.92)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0, 242, 255, 0.08)',
        borderBottom: '1px solid rgba(0, 242, 255, 0.2)',
        flexShrink: 0,
      }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#00ffff', letterSpacing: '1px' }}>
          Avatar Studio — Design Your Character
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', borderRadius: '8px', padding: '6px 12px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
          <X size={16} /> Close
        </button>
      </div>

      {/* Instructions banner */}
      <div style={{
        padding: '8px 20px',
        background: 'rgba(0, 242, 255, 0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontSize: '0.8rem',
        color: '#a0c0ff',
        flexShrink: 0,
      }}>
        Design your avatar, then click <strong style={{ color: '#00ffff' }}>Next →</strong> to save it to your assistant.
      </div>

      {/* Iframe fills the rest */}
      <iframe
        ref={iframeRef}
        src={AVATAR_STUDIO_URL}
        style={{ flex: 1, border: 'none', width: '100%' }}
        allow="camera *; microphone *; clipboard-write"
        title="Ready Player Me Avatar Studio"
      />
    </div>
  );
};

export default AvatarCreator;
