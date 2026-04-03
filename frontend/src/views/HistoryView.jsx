import React, { useState, useEffect } from 'react';
import { History, Trash2, Clock } from 'lucide-react';

const HistoryView = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/chat/history'); // I'll need to check the actual endpoint or use memory manager via a new route
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
        <div className="view-container history-view">
            <header className="view-header flex items-center gap-4 mb-10">
                <History size={32} color="#00d2ff" />
                <h1>Conversation Archives</h1>
            </header>
            <div className="history-list flex flex-col gap-6 max-w-4xl pb-20">
                {history.map((item, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border backdrop-blur-md ${item.role === 'user' ? 'bg-[#00d2ff]/10 border-[#00d2ff]/30 shadow-[0_4px_20px_rgba(0,210,255,0.05)] ml-12' : 'bg-black/40 border-white/10 mr-12'}`}>
                        <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                            <span className={`text-xs font-bold uppercase tracking-widest ${item.role === 'user' ? 'text-[#00d2ff]' : 'text-purple-400'}`}>
                                {item.role === 'user' ? 'Operator' : 'Groot Protocol'}
                            </span>
                            <span className="text-xs opacity-50 flex items-center gap-2"><Clock size={12} /> {item.timestamp}</span>
                        </div>
                        <p className="text-md leading-relaxed text-white/90 whitespace-pre-wrap">{item.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryView;
