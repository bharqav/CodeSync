import { useState } from 'react';
import { Play, Terminal } from 'lucide-react';

interface OutputPanelProps {
    code: string;
    language: string;
}

export function OutputPanel({ code, language }: OutputPanelProps) {
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    const runCode = () => {
        setIsRunning(true);
        setOutput('Running...\n');

        try {
            if (language === 'javascript' || language === 'typescript') {
                const logs: string[] = [];
                const originalLog = console.log;
                console.log = (...args) => {
                    logs.push(args.map(String).join(' '));
                };

                try {
                    eval(code);
                    setOutput(logs.length > 0 ? logs.join('\n') : 'Code executed successfully (no output)');
                } catch (error: any) {
                    setOutput(`Error: ${error.message}`);
                } finally {
                    console.log = originalLog;
                }
            } else {
                setOutput(`Output panel currently supports JavaScript/TypeScript only.\nOther languages coming soon!`);
            }
        } catch (error: any) {
            setOutput(`Error: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-text-primary" />
                    <h3 className="font-semibold text-text-primary">Output</h3>
                </div>
                <button
                    onClick={runCode}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    <Play className="w-4 h-4" />
                    Run Code
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {output ? (
                    <pre className="text-sm font-mono text-text-primary whitespace-pre-wrap">
                        {output}
                    </pre>
                ) : (
                    <div className="text-center text-text-tertiary text-sm mt-8">
                        Click "Run Code" to see the output here
                    </div>
                )}
            </div>
        </div>
    );
}
