import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Bell } from 'lucide-react';
import './ScheduleView.css';

const ScheduleView = () => {
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({ title: '', message: '', time: '' });
  const [loading, setLoading] = useState(false);

  const fetchReminders = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/schedule/all');
      const data = await response.json();
      setReminders(data);
    } catch (err) {
      console.error("Failed to fetch reminders", err);
    }
  };

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newReminder.title || !newReminder.time) return;

    setLoading(true);
    try {
      await fetch('http://localhost:8000/api/schedule/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReminder)
      });
      setNewReminder({ title: '', message: '', time: '' });
      fetchReminders();
    } catch (err) {
      alert("Failed to add reminder");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/schedule/${id}`, { method: 'DELETE' });
      fetchReminders();
    } catch (err) {
      alert("Failed to delete reminder");
    }
  };

  return (
    <div className="view-container schedule-view">
      <header className="view-header">
        <Clock size={32} color="#00d2ff" />
        <h1>Task Scheduler</h1>
      </header>

      <section className="add-reminder-card bg-black/30 p-6 rounded-2xl border border-white/10 mb-8 backdrop-blur-xl">
        <h3 className="text-lg font-bold mb-4 opacity-90">New Task Parameter</h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <input 
              type="text" 
              className="glass-input flex-1"
              placeholder="Task Title (e.g. Security Sweep)" 
              value={newReminder.title}
              onChange={e => setNewReminder({...newReminder, title: e.target.value})}
            />
            <input 
              type="datetime-local" 
              className="glass-input w-1/3 text-white/50"
              value={newReminder.time}
              onChange={e => setNewReminder({...newReminder, time: e.target.value})}
            />
          </div>
          <div className="flex gap-4">
            <input 
              type="text" 
              className="glass-input flex-1"
              placeholder="Detailed Message (optional)" 
              value={newReminder.message}
              onChange={e => setNewReminder({...newReminder, message: e.target.value})}
            />
            <button type="submit" disabled={loading} className="submit-btn text-black bg-[#00ffff] font-bold rounded-xl py-3 px-6 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all">
              <Plus size={20} />
              {loading ? 'Committing...' : 'Establish Task'}
            </button>
          </div>
        </form>
      </section>

      <section className="reminders-list">
        <h3 className="text-lg font-bold mb-4 opacity-90">Active Protocol Timers</h3>
        {reminders.length === 0 ? (
          <div className="bg-black/20 p-6 rounded-2xl border border-white/5 text-center text-white/40">
            No pending tasks detected in queue.
          </div>
        ) : (
          <div className="reminders-grid flex flex-col gap-4">
            {reminders.map(rem => (
              <div key={rem.id} className={`reminder-item flex justify-between items-center p-5 rounded-2xl border backdrop-blur-md ${rem.status === 'completed' ? 'bg-white/5 border-white/5 opacity-50' : 'bg-[#00ffff]/10 border-[#00ffff]/30 shadow-[0_4px_20px_rgba(0,255,255,0.05)]'}`}>
                <div className="rem-info flex items-center gap-4">
                  <div className={`p-3 rounded-full ${rem.status === 'completed' ? 'bg-white/10' : 'bg-[#00ffff]/20 text-[#00ffff]'}`}>
                     <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{rem.title}</h4>
                    <p className="text-sm opacity-60 mt-1 uppercase tracking-widest">{new Date(rem.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                    {rem.message && <span className="block mt-2 text-sm text-white/70 italic p-2 bg-black/30 rounded-lg">{rem.message}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(rem.id)} className="delete-btn p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(255,0,0,0.5)] transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ScheduleView;
