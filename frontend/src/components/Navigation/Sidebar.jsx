import React from 'react';
import { 
  Home, 
  User, 
  History, 
  Settings, 
  Clock,
  X 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ currentView, setView, isOpen, onClose }) => {
  const menuItems = [
    { id: 'chat', label: 'Home', icon: <Home size={24} /> },
    { id: 'avatar', label: 'Avatar', icon: <User size={24} /> },
    { id: 'history', label: 'History', icon: <History size={24} /> },
    { id: 'schedule', label: 'Schedule', icon: <Clock size={24} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={24} /> },
  ];

  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <button 
             onClick={onClose} 
             style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, padding: '5px' }}
             onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
             onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
          >
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => {
                setView(item.id);
                onClose();
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>Groot AI v2.0</p>
        </div>
      </div>
      
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    </>
  );
};

export default Sidebar;
