import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { io, Socket } from 'socket.io-client';
import { Code2, Users } from 'lucide-react';
import API_URL from '../config';

export default function EditorDemo() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [code, setCode] = useState('// Welcome to CodeSync!\n// Start typing to see real-time collaboration\n\nfunction hello() {\n  console.log("Hello, CodeSync!");\n}\n\nhello();');
    const [language, setLanguage] = useState('javascript');
    const roomCode = 'DEMO-ROOM';

    useEffect(() => {
        const newSocket = io(API_URL);
        setSocket(newSocket);
        newSocket.emit('join-room', roomCode);

        newSocket.on('code-update', (newCode: string) => {
            setCode(newCode);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setCode(value);
            socket?.emit('code-change', { roomCode, code: value });
        }
    };

    return (
        <div className="h-screen bg-cream-100 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black-primary rounded-lg flex items-center justify-center">
                            <Code2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-text-primary">CodeSync Editor</h1>
                            <p className="text-sm text-text-tertiary">Room: {roomCode}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="px-4 py-2 bg-cream-50 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-black-primary/10"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                        </select>

                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Live</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 p-6">
                <div className="h-full bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                    <Editor
                        height="100%"
                        language={language}
                        value={code}
                        onChange={handleEditorChange}
                        theme="vs-dark"
                        options={{
                            fontSize: 14,
                            minimap: { enabled: true },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            wordWrap: 'on',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
