import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, FileImage, Sparkles, FolderOpen } from 'lucide-react';
import axios from 'axios';

const AvatarCreator = ({ onClose, onAvatarGenerated }) => {
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  // ── Auto-open file picker as soon as this page loads ──────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      fileInputRef.current?.click();
    }, 200); // small delay so the panel animates in first
    return () => clearTimeout(timer);
  }, []);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.vrm')) {
      setErrorMsg('Please select a .vrm file exported from VRoid Studio.');
      setStatus('error');
      return;
    }

    setFileName(file.name);
    setStatus('uploading');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:8000/api/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      setStatus('success');
      setProgress(100);

      setTimeout(() => {
        const url = '/models/avatar.vrm?t=' + Date.now();
        if (onAvatarGenerated) onAvatarGenerated(url);
        if (onClose) onClose();
      }, 1400);

    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Upload failed.';
      setErrorMsg(detail);
      setStatus('error');
    }
  }, [onAvatarGenerated, onClose]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const onBrowse = (e) => handleFile(e.target.files[0]);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      background: 'transparent',
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Sparkles size={20} color="#a78bfa" />
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
            Avatar Studio
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#7c6fa0' }}>
          Import your VRoid Studio character — saved locally, works 100% offline.
        </p>
      </div>

      {/* ── Steps Guide ── */}
      <div style={{
        background: 'rgba(124,58,237,0.08)',
        border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
      }}>
        <p style={{ margin: '0 0 12px', fontSize: '0.72rem', color: '#7c6fa0', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          How to export from VRoid Studio 2.x
        </p>
        {[
          ['1', 'Open your character in VRoid Studio 2.12.0'],
          ['2', 'Click  Export  →  Export as VRM'],
          ['3', 'Save the .vrm file anywhere on your PC'],
          ['4', 'The file picker opened automatically — select your .vrm'],
        ].map(([n, text]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              minWidth: '22px', height: '22px', borderRadius: '50%',
              background: n === '4' ? 'rgba(110,231,183,0.2)' : 'rgba(124,58,237,0.25)',
              border: `1px solid ${n === '4' ? 'rgba(110,231,183,0.5)' : 'rgba(124,58,237,0.5)'}`,
              color: n === '4' ? '#6ee7b7' : '#c4b5fd',
              fontSize: '0.72rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>{n}</span>
            <span style={{ fontSize: '0.83rem', color: n === '4' ? '#a7f3d0' : '#b0a8cc', lineHeight: '1.5' }}>{text}</span>
          </div>
        ))}
      </div>

      {/* ── Drop Zone / Status ── */}
      {status === 'idle' || status === 'error' ? (
        <>
          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".vrm"
            style={{ display: 'none' }}
            onChange={onBrowse}
          />

          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: 1,
              minHeight: '180px',
              border: `2px dashed ${dragOver ? '#7c3aed' : status === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(124,58,237,0.3)'}`,
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              background: dragOver ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.03)',
              transform: dragOver ? 'scale(1.01)' : 'scale(1)',
              padding: '32px',
            }}
          >
            <FileImage size={48} color={dragOver ? '#a78bfa' : '#4c3888'} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', color: '#c4b5fd', fontWeight: 600, fontSize: '1rem' }}>
                Drop your .vrm file here
              </p>
              <p style={{ margin: 0, color: '#6b5e8a', fontSize: '0.82rem' }}>
                or click anywhere to browse
              </p>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 22px',
              borderRadius: '12px',
              border: '1px solid rgba(124,58,237,0.5)',
              background: 'rgba(124,58,237,0.15)',
              color: '#a78bfa',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginTop: '4px',
            }}>
              <FolderOpen size={15} />
              Browse File
            </div>
            <p style={{ margin: 0, color: '#3a3055', fontSize: '0.72rem' }}>
              Only .vrm files • Saved to frontend/public/models/
            </p>
          </div>

          {status === 'error' && (
            <div style={{
              marginTop: '14px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', alignItems: 'center', gap: '10px',
              color: '#fca5a5', fontSize: '0.82rem',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setStatus('idle'); setErrorMsg(''); }}
                style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  color: '#fca5a5', cursor: 'pointer', fontSize: '0.78rem',
                  textDecoration: 'underline', whiteSpace: 'nowrap',
                }}
              >
                Try again
              </button>
            </div>
          )}
        </>

      ) : status === 'uploading' ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          padding: '40px',
        }}>
          <Upload size={44} color="#a78bfa" />
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '320px' }}>
            <p style={{ margin: '0 0 4px', color: '#fff', fontWeight: 600 }}>
              Importing <span style={{ color: '#a78bfa' }}>{fileName}</span>
            </p>
            <p style={{ margin: '0 0 16px', color: '#6b5e8a', fontSize: '0.8rem' }}>
              Saving to local models folder…
            </p>
            <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
                transition: 'width 0.3s ease',
                boxShadow: '0 0 12px rgba(124,58,237,0.7)',
              }} />
            </div>
            <p style={{ marginTop: '8px', color: '#555', fontSize: '0.75rem' }}>{progress}%</p>
          </div>
        </div>

      ) : (
        // success
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          padding: '40px',
        }}>
          <CheckCircle size={52} color="#6ee7b7" />
          <p style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
            Avatar Imported!
          </p>
          <p style={{ color: '#5a7a6e', fontSize: '0.83rem', margin: 0 }}>
            Applying your new character…
          </p>
        </div>
      )}
    </div>
  );
};

export default AvatarCreator;
