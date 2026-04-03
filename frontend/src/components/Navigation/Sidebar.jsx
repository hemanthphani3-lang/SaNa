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
        <div className="sidebar-header flex justify-between items-center">
          <h2 className="flex-1">GROOT HUD</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full lg:hidden">
            <X size={20} />
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
          <p>SANKEYTHIKA v2.0</p>
        </div>
      </div>
      
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    </>
  );
};

export default Sidebar;
