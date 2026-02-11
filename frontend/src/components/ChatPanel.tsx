import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, MessageSquare } from 'lucide-react';
import { webSocketService } from '../services/WebSocketService';

interface ChatMessage {
    sessionId: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
}

interface ChatPanelProps {
    sessionId: string;
    user: any;
    isMyTurn: boolean;
}

export default function ChatPanel({ sessionId, user, isMyTurn }: ChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isOpenRef = useRef(isOpen);

    // Sync ref with state for use in the WebSocket callback
    useEffect(() => {
        isOpenRef.current = isOpen;
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!sessionId) return;

        const unsubscribe = webSocketService.subscribeToChat(sessionId, (message) => {
            setMessages((prev) => [...prev, message]);
            if (!isOpenRef.current) {
                setUnreadCount((prev) => prev + 1);
            }
        });

        // Cleanup on unmount or sessionId change
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [sessionId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || !user) return;

        const payload = {
            sessionId,
            senderId: user.id,
            senderName: user.username || "ANONYME",
            content: inputValue.trim()
        };

        webSocketService.sendMessage(sessionId, payload);
        setInputValue('');
    };

    return (
        <div className={`fixed bottom-24 right-8 z-40 flex flex-col transition-all duration-300 ${isOpen ? 'w-96 h-[500px]' : 'w-12 h-12'}`}>
            {/* TOGGLE BUTTON */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative w-12 h-12 bg-slate-950 border-t border-b border-l-4 border-r border-cyan-500 flex items-center justify-center text-cyan-400 hover:bg-slate-900 shadow-2xl transition-all"
                >
                    <MessageSquare className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_10px_rgba(225,29,72,0.5)]">
                            <span className="text-[10px] font-black text-white leading-none">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </div>
                    )}
                </button>
            )}

            {/* CHAT WINDOW */}
            {isOpen && (
                <div className="flex-1 flex flex-col bg-slate-950/95 border-l-4 border-cyan-500 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
                    {/* Header */}
                    <div className="p-3 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-cyan-500" />
                            <span className="font-cyber font-bold text-xs tracking-[0.2em] text-white uppercase">COMM_LINK</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-500 hover:text-white text-xs font-mono"
                        >
                            [RÉDUIRE]
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-cyan-500/20"
                    >
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20">
                                <Terminal className="w-8 h-8 mb-2" />
                                <span className="text-[8px] font-mono tracking-widest uppercase">Canal Sécurisé Établi</span>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = String(msg.senderId) === String(user?.id);
                                return (
                                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-mono font-bold uppercase ${isMe ? 'text-cyan-400' : 'text-amber-400'}`}>
                                                {msg.senderName}
                                            </span>
                                            <span className="text-[8px] font-mono text-slate-700">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`
                      px-3 py-2 text-sm font-mono border-l-2
                      ${isMe ? 'bg-cyan-500/5 border-cyan-500 text-cyan-100' : 'bg-slate-900 border-slate-700 text-slate-300'}
                    `}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSendMessage}
                        className="p-3 border-t border-white/5 bg-black/40"
                    >
                        <div className="relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="TRANSMETTRE..."
                                className="w-full bg-slate-900 border border-white/10 px-3 py-2 pr-10 text-sm font-mono text-cyan-400 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/50 transition-all uppercase"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-white disabled:text-slate-700 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex justify-between items-center mt-2 px-1 text-[8px] font-mono tracking-tighter uppercase">
                            <div className="flex items-center gap-1.5 ">
                                <div className={`w-1 h-1 rounded-full animate-pulse ${messages.length > 0 ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                                <span className="text-slate-600">Liaison Active // {isMyTurn ? "TRANSMISSION_PRIORITAIRE" : "RECEPTION_UNITÉ"}</span>
                            </div>
                            <span className="text-slate-800">Encrypt_AES_256</span>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
