import { useEffect, useState, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import type { Message } from '../shared/types';
import { Send, MessageCircle } from 'lucide-react';
import API_URL from '../config';

interface ChatProps {
    socket: Socket | null;
    workspaceId: string;
}

export function Chat({ socket, workspaceId }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const { user } = useAuthStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load history
        fetch(`${API_URL}/api/workspace/${workspaceId}`, {
            headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.messages) setMessages(data.messages);
            });

        if (!socket) return;

        socket.on("chat:message", (message: Message) => {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
        });

        return () => {
            socket.off("chat:message");
        };
    }, [socket, workspaceId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !socket || !user) return;

        socket.emit("chat:send", {
            content: input,
            workspaceId,
            userId: user.id
        });
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="h-12 border-b border-border bg-cream-50 flex items-center px-4">
                <MessageCircle className="w-4 h-4 text-text-tertiary mr-2" />
                <h3 className="font-semibold text-sm text-text-primary">Team Chat</h3>
                <span className="ml-auto text-xs text-text-tertiary">
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                        <div className="max-w-xs">
                            <MessageCircle className="w-12 h-12 text-text-muted mx-auto mb-3" />
                            <p className="text-sm text-text-tertiary">
                                No messages yet. Start the conversation!
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.userId === user?.id;
                        return (
                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isMe
                                    ? 'bg-black-primary text-white'
                                    : 'bg-cream-100 text-text-primary border border-border'
                                    }`}>
                                    {!isMe && (
                                        <div className="text-[10px] font-semibold mb-1 opacity-70">
                                            {msg.user?.name}
                                        </div>
                                    )}
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-border bg-white">
                <div className="relative">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full bg-cream-50 border border-border rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black-primary/10 focus:border-black-primary transition-all placeholder:text-text-tertiary"
                        placeholder="Type a message..."
                    />
                    <button
                        type="submit"
                        className="absolute right-1.5 top-1.5 p-2 bg-black-primary hover:bg-black-hover rounded-md text-white transition-colors disabled:opacity-50"
                        disabled={!input.trim()}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
