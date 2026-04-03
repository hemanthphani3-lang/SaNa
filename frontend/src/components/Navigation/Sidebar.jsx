import React, { useState } from 'react';
import { 
  Home, 
  MessageSquare, 
  User, 
  History, 
  Settings, 
  Clock, 
  Menu, 
  X 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ currentView, setView }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Home', icon: <Home size={24} /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={24} /> },
    { id: 'avatar', label: 'Avatar', icon: <User size={24} /> },
    { id: 'history', label: 'History', icon: <History size={24} /> },
    { id: 'schedule', label: 'Schedule', icon: <Clock size={24} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={24} /> },
  ];

  return (
    <>
      <button 
        className="hamburger-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>GROOT HUD</h2>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => {
                setView(item.id);
                setIsOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>SANKEYTHIKA v2.0</p>
        </div>
      </div>
      
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default Sidebar;
