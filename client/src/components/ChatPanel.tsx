import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

interface Message {
    id: string;
    user: string;
    text: string;
    timestamp: Date;
}

interface ChatPanelProps {
    roomCode: string;
    socket: any;
    currentUser: string;
}

export function ChatPanel({ roomCode, socket, currentUser }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('new-message', (data: { user: string; message: string }) => {
            const newMessage: Message = {
                id: Date.now().toString(),
                user: data.user,
                text: data.message,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, newMessage]);
        });

        return () => {
            socket.off('new-message');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (!inputText.trim() || !socket) return;

        const message = {
            user: currentUser,
            message: inputText,
            roomCode,
        };

        socket.emit('chat-message', message);
        setInputText('');
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-text-primary" />
                <h3 className="font-semibold text-text-primary">Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-text-tertiary text-sm mt-8">
                        No messages yet. Start chatting!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-sm text-text-primary">
                                    {msg.user}
                                </span>
                                <span className="text-xs text-text-tertiary">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="text-sm text-text-secondary bg-cream-50 rounded-lg px-3 py-2">
                                {msg.text}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-cream-50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black-primary/10"
                    />
                    <button
                        onClick={sendMessage}
                        className="px-4 py-2 bg-black-primary hover:bg-black-hover text-white rounded-lg transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
