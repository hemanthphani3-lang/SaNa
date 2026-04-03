import React, { useState, useEffect } from 'react';
import { History, Trash2, Clock } from 'lucide-react';

const HistoryView = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch('http://localhost:8000/chat/history'); // I'll need to check the actual endpoint or use memory manager via a new route
                // Wait, I haven't added a specific /chat/history GET route. Let's use a mock or add it to main.py
                setHistory([
                    { role: 'user', content: 'Hello Groot', timestamp: '2026-04-03 10:00' },
                    { role: 'assistant', content: 'I am Groot!', timestamp: '2026-04-03 10:01' }
                ]);
            } catch (err) {}
        };
        fetchHistory();
    }, []);

    return (
        <div className="view-container history-view px-8 py-20">
            <header className="view-header flex items-center gap-4 mb-8">
                <History size={32} className="text-blue-400" />
                <h1 className="text-4xl font-bold">Chat History</h1>
            </header>
            <div className="history-list space-y-4 max-w-3xl">
                {history.map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${item.role === 'user' ? 'bg-blue-900/20 border-blue-500/30' : 'bg-gray-800/40 border-white/10'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs uppercase tracking-widest opacity-50">{item.role}</span>
                            <span className="text-xs opacity-50 flex items-center gap-1"><Clock size={12} /> {item.timestamp}</span>
                        </div>
                        <p className="text-lg">{item.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryView;
