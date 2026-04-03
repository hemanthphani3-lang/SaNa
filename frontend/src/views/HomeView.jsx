import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Shield, Cpu, Zap, Database, CheckCircle, AlertCircle } from 'lucide-react';

const HomeView = ({ setView }) => {
  const [stats, setStats] = useState({ cpu: 0, ram: 0, battery: 0 });
  const [health, setHealth] = useState({ ollama: 'offline', rag: 'offline', scheduler: 'inactive' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await axios.get('http://localhost:8000/api/system/stats');
        setStats(statsRes.data);
        
        const healthRes = await axios.get('http://localhost:8000/api/system/health');
        setHealth(healthRes.data);
      } catch (error) {
        console.error("HomeView polling error:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const StatOrb = ({ label, value, icon: Icon, color }) => (
    <div className="glass p-6 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 border border-white/5">
      <div className={`p-4 rounded-full bg-${color}-500/20 text-${color}-400`}>
        <Icon size={32} />
      </div>
      <div className="text-center">
        <p className="text-sm opacity-50 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-bold">{value}%</p>
      </div>
    </div>
  );

  return (
    <div className="home-view p-12 h-content flex flex-col gap-12 animate-fade-in">
      <header className="home-header">
        <h1 className="text-6xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          SYSTEM ONLINE
        </h1>
        <p className="text-xl opacity-40 mt-2 italic">Neural Processing Unit Active</p>
      </header>

      {/* System Orbs */}
      <div className="grid grid-cols-3 gap-8">
        <StatOrb label="CPU Load" value={stats.cpu} icon={Cpu} color="blue" />
        <StatOrb label="Memory" value={stats.ram} icon={Activity} color="purple" />
        <StatOrb label="Battery" value={stats.battery} icon={Zap} color="orange" />
      </div>

      {/* Service Health */}
      <div className="glass p-8 rounded-3xl border border-white/5">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Shield size={20} className="text-green-400" /> 
          Neural Health Status
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
            <div className="flex items-center gap-3">
              <Database size={20} className="text-cyan-400" />
              <span>Ollama Engine</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${health.ollama === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {health.ollama.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-blue-400" />
              <span>RAG Context Index</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${health.rag === 'initialized' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {health.rag.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Launch */}
      <div className="flex gap-6">
        <button 
          onClick={() => setView('chat')}
          className="flex-1 glass p-6 rounded-3xl hover:bg-white/10 transition-all text-left group"
        >
          <h4 className="text-2xl font-bold group-hover:text-blue-400 transition-colors">Start Neural Sync</h4>
          <p className="opacity-40">Open the chat interface with Groot.</p>
        </button>
        <button 
          onClick={() => setView('schedule')}
          className="flex-1 glass p-6 rounded-3xl hover:bg-white/10 transition-all text-left group"
        >
          <h4 className="text-2xl font-bold group-hover:text-purple-400 transition-colors">Scheduler</h4>
          <p className="opacity-40">Manage reminders and automations.</p>
        </button>
      </div>
    </div>
  );
};

export default HomeView;
