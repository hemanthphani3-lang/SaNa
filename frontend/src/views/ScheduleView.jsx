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

      <section className="add-reminder-card">
        <h3>Add New Reminder</h3>
        <form onSubmit={handleAdd}>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Title (e.g. Drink Water)" 
              value={newReminder.title}
              onChange={e => setNewReminder({...newReminder, title: e.target.value})}
            />
          </div>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Message (optional)" 
              value={newReminder.message}
              onChange={e => setNewReminder({...newReminder, message: e.target.value})}
            />
          </div>
          <div className="input-group">
            <input 
              type="datetime-local" 
              value={newReminder.time}
              onChange={e => setNewReminder({...newReminder, time: e.target.value})}
            />
          </div>
          <button type="submit" disabled={loading} className="submit-btn text-white bg-blue-600 rounded-lg py-2 px-4 flex items-center justify-center gap-2">
            <Plus size={20} />
            {loading ? 'Setting...' : 'Schedule Task'}
          </button>
        </form>
      </section>

      <section className="reminders-list">
        <h3>Active Reminders</h3>
        {reminders.length === 0 ? (
          <p className="empty-msg">No pending tasks</p>
        ) : (
          <div className="reminders-grid">
            {reminders.map(rem => (
              <div key={rem.id} className={`reminder-item ${rem.status}`}>
                <div className="rem-info">
                  <Bell size={18} className="rem-icon" />
                  <div>
                    <h4>{rem.title}</h4>
                    <p>{new Date(rem.time).toLocaleString()}</p>
                    {rem.message && <span className="rem-msg">{rem.message}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(rem.id)} className="delete-btn">
                  <Trash2 size={18} />
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
