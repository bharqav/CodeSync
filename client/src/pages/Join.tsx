import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Code2, ArrowRight, Sparkles } from 'lucide-react';

import API_BASE_URL from '../config';

const API_URL = `${API_BASE_URL}/api`;

export function Join() {
    const [nickname, setNickname] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/guest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname }),
            });
            const data = await res.json();
            if (res.ok) {
                setAuth(data.user, data.token);
                createWorkspace(data.token);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to join workspace. Check if Backend is running and Docker is up. Error: " + err);
        } finally {
            setIsLoading(false);
        }
    };

    const createWorkspace = async (token: string) => {
        const res = await fetch(`${API_URL}/workspace`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            navigate(`/w/${data.id}`);
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-cream-100 px-4">
            <div className="w-full max-w-md animate-slide-up">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-black-primary rounded-xl mb-5 shadow-sm">
                        <Code2 className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <h1 className="text-4xl font-semibold text-text-primary mb-3 tracking-tight">
                        CodeSync
                    </h1>
                    <p className="text-text-secondary text-base">
                        Code together in real-time. Join or create a workspace to get started.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-xl border border-border shadow-md p-8">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-1">
                            Enter your name
                        </h2>
                        <p className="text-sm text-text-tertiary">
                            Choose a display name to join the workspace
                        </p>
                    </div>

                    <form onSubmit={handleJoin} className="space-y-5">
                        <div>
                            <label htmlFor="nickname" className="block text-sm font-medium text-text-secondary mb-2">
                                Display name
                            </label>
                            <input
                                id="nickname"
                                type="text"
                                required
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-green-primary/20 focus:border-green-primary transition-all text-base"
                                placeholder="e.g. John Doe"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black-primary hover:bg-black-hover text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isLoading ? (
                                <>
                                    <Sparkles className="w-4 h-4 animate-spin" />
                                    Creating workspace...
                                </>
                            ) : (
                                <>
                                    Join Workspace
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex items-start gap-2 text-sm text-text-tertiary">
                            <Sparkles className="w-4 h-4 mt-0.5 text-black-primary flex-shrink-0" />
                            <p>
                                Real-time collaboration with Monaco editor, live chat, and shared whiteboard.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-text-tertiary mt-6">
                    Powered by WebSocket technology for instant synchronization
                </p>
            </div>
        </div>
    );
}
