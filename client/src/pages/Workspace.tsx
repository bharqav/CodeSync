import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Editor from '@monaco-editor/react';
import { io, Socket } from 'socket.io-client';
import { Code2, Users, GripVertical, GripHorizontal } from 'lucide-react';
import { ChatPanel } from '../components/ChatPanel';
import { Whiteboard } from '../components/Whiteboard';
import { OutputPanel } from '../components/OutputPanel';
import { languageTemplates } from '../utils/languageTemplates';
import API_URL from '../config';

export default function Workspace() {
    const { code: routeParamCode } = useParams<{ code: string }>();
    const roomCode = routeParamCode || 'default-room';
    const { user, token } = useAuthStore();

    const [socket, setSocket] = useState<Socket | null>(null);
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(languageTemplates.javascript);

    // Use the logged-in username or fallback
    const currentUser = user?.username || 'Guest';

    // Resizable state
    const [editorHeight, setEditorHeight] = useState(65); // percentage
    const [leftWidth, setLeftWidth] = useState(50); // percentage
    const [whiteboardHeight, setWhiteboardHeight] = useState(55); // percentage

    useEffect(() => {
        if (!token || !roomCode) return;

        const newSocket = io(API_URL, {
            auth: { token }
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join-room', roomCode);
        });

        newSocket.on('code-update', (newCode: string) => {
            setCode(newCode);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [token, roomCode]);

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setCode(value);
            socket?.emit('code-change', { roomCode, code: value });
        }
    };

    const handleLanguageChange = (newLang: string) => {
        setLanguage(newLang);
        setCode(languageTemplates[newLang as keyof typeof languageTemplates] || '');
    };

    if (!token) return <div>Access Denied</div>;

    return (
        <div className="h-screen bg-cream-100 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-border px-6 py-3 relative">
                <div className="flex items-center justify-between">
                    {/* Left: Brand */}
                    <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-black-primary rounded-lg flex items-center justify-center">
                            <Code2 className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-text-primary">CodeSync</h1>
                    </Link>

                    {/* Center: Room Code */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">Room Code</span>
                        <span className="text-lg font-mono font-bold text-black-primary bg-cream-100 px-3 py-0.5 rounded border border-border/50">
                            {roomCode}
                        </span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4">
                        {/* Users Pill */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default">
                            <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-text-secondary" />
                                <span className="text-sm font-semibold text-text-primary">Users</span>
                            </div>
                            <div className="w-px h-4 bg-border"></div>
                            <div className="flex -space-x-1.5">
                                <div className="w-6 h-6 rounded-full bg-black-primary text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                                    {currentUser.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>

                        {/* End Button */}
                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="px-4 py-2 bg-white border-2 border-black-primary text-black-primary text-sm font-bold rounded-lg hover:bg-black-primary hover:text-white transition-all uppercase shadow-sm active:translate-y-px"
                        >
                            End
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Custom Resizable Grid */}
            <div className="flex-1 p-4 flex gap-4 overflow-hidden">
                {/* Left Side: Code Editor + Output */}
                <div className="flex flex-col gap-4" style={{ width: `${leftWidth}%` }}>
                    {/* Code Editor */}
                    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col" style={{ height: `${editorHeight}%` }}>
                        <div className="px-4 py-2 border-b border-border bg-cream-50 flex items-center justify-between">
                            <span className="text-sm font-semibold text-text-primary">Code Editor</span>
                            <select
                                value={language}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="px-3 py-1 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black-primary/10"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="typescript">TypeScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                                <option value="html">HTML</option>
                                <option value="css">CSS</option>
                            </select>
                        </div>
                        <div className="flex-1 min-h-0">
                            <Editor
                                height="100%"
                                language={language}
                                value={code}
                                onChange={handleEditorChange}
                                theme="vs-dark"
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    tabSize: 2,
                                    wordWrap: 'on',
                                }}
                            />
                        </div>
                    </div>

                    {/* Horizontal Resize Handle */}
                    <div
                        className="h-2 bg-cream-200 rounded-full hover:bg-cream-300 transition-colors cursor-row-resize flex items-center justify-center -my-3"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            const startY = e.clientY;
                            const startHeight = editorHeight;

                            const handleMouseMove = (e: MouseEvent) => {
                                const deltaY = e.clientY - startY;
                                const containerHeight = window.innerHeight - 200; // approximate
                                const deltaPercent = (deltaY / containerHeight) * 100;
                                const newHeight = Math.max(30, Math.min(80, startHeight + deltaPercent));
                                setEditorHeight(newHeight);
                            };

                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                    >
                        <GripHorizontal className="w-4 h-4 text-cream-400" />
                    </div>

                    {/* Output */}
                    <div className="flex-1 rounded-xl border border-border shadow-sm overflow-hidden min-h-0">
                        <OutputPanel code={code} language={language} />
                    </div>
                </div>

                {/* Vertical Resize Handle */}
                <div
                    className="w-2 bg-cream-200 rounded-full hover:bg-cream-300 transition-colors cursor-col-resize flex items-center justify-center -mx-3"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        const startX = e.clientX;
                        const startWidth = leftWidth;

                        const handleMouseMove = (e: MouseEvent) => {
                            const deltaX = e.clientX - startX;
                            const containerWidth = window.innerWidth - 100; // approximate
                            const deltaPercent = (deltaX / containerWidth) * 100;
                            const newWidth = Math.max(30, Math.min(70, startWidth + deltaPercent));
                            setLeftWidth(newWidth);
                        };

                        const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    }}
                >
                    <GripVertical className="w-4 h-4 text-cream-400" />
                </div>

                {/* Right Side: Whiteboard + Chat */}
                <div className="flex-1 flex flex-col gap-4">
                    {/* Whiteboard */}
                    <div className="rounded-xl border border-border shadow-sm overflow-hidden" style={{ height: `${whiteboardHeight}%` }}>
                        <Whiteboard roomCode={roomCode} socket={socket} />
                    </div>

                    {/* Horizontal Resize Handle */}
                    <div
                        className="h-2 bg-cream-200 rounded-full hover:bg-cream-300 transition-colors cursor-row-resize flex items-center justify-center -my-3"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            const startY = e.clientY;
                            const startHeight = whiteboardHeight;

                            const handleMouseMove = (e: MouseEvent) => {
                                const deltaY = e.clientY - startY;
                                const containerHeight = window.innerHeight - 200; // approximate
                                const deltaPercent = (deltaY / containerHeight) * 100;
                                const newHeight = Math.max(30, Math.min(80, startHeight + deltaPercent));
                                setWhiteboardHeight(newHeight);
                            };

                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                    >
                        <GripHorizontal className="w-4 h-4 text-cream-400" />
                    </div>

                    {/* Chat */}
                    <div className="flex-1 rounded-xl border border-border shadow-sm overflow-hidden min-h-0">
                        <ChatPanel roomCode={roomCode} socket={socket} currentUser={currentUser} />
                    </div>
                </div>
            </div>
        </div>
    );
}
