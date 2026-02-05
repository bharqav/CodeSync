import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Plus, LogIn, LogOut, Trash2, Clock, Users, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import API_URL from '../config';

interface Room {
    id: string;
    code: string;
    name: string | null;
    owner: { id: string; username: string };
    isActive: boolean;
    lastActive: string;
    participantCount: number;
    joinedAt: string;
}

export default function Dashboard() {
    const { user, token, logout } = useAuthStore();
    const navigate = useNavigate();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchRooms();
    }, [token, navigate]);

    const fetchRooms = async () => {
        try {
            const response = await fetch(`${API_URL}/api/rooms/my-rooms`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRooms(data.rooms);
            }
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setActionLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/rooms/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: roomName.trim() || undefined }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create room');
            }

            setShowCreateModal(false);
            setRoomName('');
            await fetchRooms();

            // Navigate to the new room
            navigate(`/workspace/${data.room.code}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setActionLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/rooms/join/${joinCode.toUpperCase()}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to join room');
            }

            setShowJoinModal(false);
            setJoinCode('');
            await fetchRooms();

            // Navigate to the room
            navigate(`/workspace/${data.room.code}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm('Are you sure you want to delete this room?')) return;

        try {
            const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                await fetchRooms();
            }
        } catch (error) {
            console.error('Failed to delete room:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-cream-100">
            {/* Header */}
            <header className="bg-white border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black-primary rounded-lg flex items-center justify-center">
                            <Code2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-text-primary">CodeSync</h1>
                            <p className="text-xs text-text-tertiary">Collaborative Workspace</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-text-primary">{user?.username}</p>
                            <p className="text-xs text-text-tertiary">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5 text-text-secondary" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Actions */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex-1 bg-black-primary hover:bg-black-hover text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create New Room</span>
                    </button>

                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="flex-1 bg-white hover:bg-cream-50 text-text-primary font-semibold py-4 px-6 rounded-xl border-2 border-border transition-all duration-200 hover:border-black-primary flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-5 h-5" />
                        <span>Join Existing Room</span>
                    </button>
                </div>

                {/* Rooms List */}
                <div>
                    <h2 className="text-2xl font-semibold text-text-primary mb-4">Your Rooms</h2>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="bg-white rounded-xl border border-border p-12 text-center">
                            <Code2 className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-text-primary mb-2">No rooms yet</h3>
                            <p className="text-text-secondary mb-4">Create a new room or join an existing one to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {rooms.map((room) => (
                                <div
                                    key={room.id}
                                    className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-all cursor-pointer group"
                                    onClick={() => navigate(`/workspace/${room.code}`)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-text-primary mb-1">
                                                {room.name || 'Untitled Room'}
                                            </h3>
                                            <p className="text-sm font-mono text-accent-warm">
                                                {room.code}
                                            </p>
                                        </div>
                                        {room.owner.id === user?.id && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteRoom(room.id);
                                                }}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete room"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <Users className="w-4 h-4" />
                                            <span>{room.participantCount} participant{room.participantCount !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <Clock className="w-4 h-4" />
                                            <span>Last active {formatDate(room.lastActive)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                                        <span className="text-xs text-text-tertiary">
                                            Owner: {room.owner.username}
                                        </span>
                                        {room.isActive ? (
                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
                                        ) : (
                                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Expired</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create Room Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold text-text-primary mb-4">Create New Room</h3>
                        <form onSubmit={handleCreateRoom} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Room Name (optional)
                                </label>
                                <input
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    className="w-full px-4 py-3 bg-cream-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-black-primary/10 focus:border-black-primary transition-all"
                                    placeholder="My Awesome Project"
                                    maxLength={100}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setRoomName('');
                                        setError('');
                                    }}
                                    className="flex-1 px-4 py-3 border border-border rounded-lg font-medium hover:bg-cream-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 bg-black-primary hover:bg-black-hover text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <span>Create Room</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Room Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold text-text-primary mb-4">Join Room</h3>
                        <form onSubmit={handleJoinRoom} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Room Code
                                </label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-3 bg-cream-50 border border-border rounded-lg font-mono text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-black-primary/10 focus:border-black-primary transition-all"
                                    placeholder="123456"
                                    maxLength={6}
                                    required
                                />
                                <p className="mt-2 text-xs text-text-tertiary">
                                    Enter the 6-digit room code
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowJoinModal(false);
                                        setJoinCode('');
                                        setError('');
                                    }}
                                    className="flex-1 px-4 py-3 border border-border rounded-lg font-medium hover:bg-cream-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 bg-black-primary hover:bg-black-hover text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Joining...</span>
                                        </>
                                    ) : (
                                        <span>Join Room</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
