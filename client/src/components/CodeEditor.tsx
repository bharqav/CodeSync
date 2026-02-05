import { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { Socket } from 'socket.io-client';

interface CodeEditorProps {
    socket: Socket | null;
    workspaceId: string;
}

export function CodeEditor({ socket, workspaceId }: CodeEditorProps) {
    const [code, setCode] = useState<string>("// Start coding together...\n\n");
    const [language, setLanguage] = useState<string>("typescript");
    const isLocalChange = useRef(false);

    useEffect(() => {
        if (!socket) return;

        socket.on("editor:content", (content) => {
            isLocalChange.current = true;
            setCode(content);
            setTimeout(() => isLocalChange.current = false, 100);
        });

        socket.on("editor:update", (content) => {
            isLocalChange.current = true;
            setCode(content);
            setTimeout(() => isLocalChange.current = false, 100);
        });

        return () => {
            socket.off("editor:content");
            socket.off("editor:update");
        };
    }, [socket]);

    const handleEditorChange = (value: string | undefined) => {
        if (isLocalChange.current) return;
        if (value === undefined) return;

        setCode(value);
        socket?.emit("editor:change", { workspaceId, content: value });
    };

    return (
        <div className="h-full w-full flex flex-col">
            {/* Toolbar */}
            <div className="h-12 border-b border-border bg-cream-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="px-3 py-1.5 text-sm font-medium bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-black-primary/10 cursor-pointer"
                    >
                        <option value="typescript">TypeScript</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                    </select>
                    <div className="h-4 w-px bg-border"></div>
                    <span className="text-xs text-text-tertiary">Collaborative editing enabled</span>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={language}
                    theme="light"
                    value={code}
                    onChange={handleEditorChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                        padding: { top: 16, bottom: 16 },
                        scrollBeyondLastLine: false,
                        lineNumbers: 'on',
                        renderLineHighlight: 'line',
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                    }}
                />
            </div>
        </div>
    );
}
