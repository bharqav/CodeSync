import { useRef, useEffect, useState } from 'react';
import { Paintbrush, Eraser, Trash2, Type, Square, Circle } from 'lucide-react';

interface WhiteboardProps {
    roomCode: string;
    socket: any;
}

type Tool = 'pen' | 'eraser' | 'text' | 'rectangle' | 'circle';

export function Whiteboard({ roomCode, socket }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(2);
    const [tool, setTool] = useState<Tool>('pen');
    const [textInput, setTextInput] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const [shapeStart, setShapeStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (socket) {
            socket.on('whiteboard-draw', (data: any) => {
                if (data.tool === 'text') {
                    drawText(ctx, data.x, data.y, data.text, data.color, data.size);
                } else if (data.tool === 'rectangle') {
                    drawRectangle(ctx, data.x0, data.y0, data.x1, data.y1, data.color, data.size);
                } else if (data.tool === 'circle') {
                    drawCircle(ctx, data.x0, data.y0, data.x1, data.y1, data.color, data.size);
                } else {
                    drawLine(ctx, data.x0, data.y0, data.x1, data.y1, data.color, data.size, data.tool);
                }
            });

            socket.on('whiteboard-clear', () => {
                clearCanvas();
            });
        }

        return () => {
            if (socket) {
                socket.off('whiteboard-draw');
                socket.off('whiteboard-clear');
            }
        };
    }, [socket]);

    const drawLine = (
        ctx: CanvasRenderingContext2D,
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        color: string,
        size: number,
        drawTool: string
    ) => {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = drawTool === 'eraser' ? 'white' : color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.closePath();
    };

    const drawText = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        text: string,
        color: string,
        size: number
    ) => {
        ctx.font = `${size * 8}px Arial`;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    };

    const drawRectangle = (
        ctx: CanvasRenderingContext2D,
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        color: string,
        size: number
    ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    };

    const drawCircle = (
        ctx: CanvasRenderingContext2D,
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        color: string,
        size: number
    ) => {
        const radius = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        ctx.beginPath();
        ctx.arc(x0, y0, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.stroke();
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (tool === 'text') {
            setTextPosition({ x, y });
            setShowTextInput(true);
        }
    };

    const handleTextSubmit = () => {
        if (!textInput.trim()) {
            setShowTextInput(false);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawText(ctx, textPosition.x, textPosition.y, textInput, color, brushSize);

        if (socket) {
            socket.emit('whiteboard-draw', {
                roomCode,
                tool: 'text',
                x: textPosition.x,
                y: textPosition.y,
                text: textInput,
                color,
                size: brushSize,
            });
        }

        setTextInput('');
        setShowTextInput(false);
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool === 'text') return;

        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (tool === 'rectangle' || tool === 'circle') {
            setShapeStart({ x, y });
        }

        canvas.dataset.lastX = x.toString();
        canvas.dataset.lastY = y.toString();
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || tool === 'text') return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x1 = e.clientX - rect.left;
        const y1 = e.clientY - rect.top;
        const x0 = parseFloat(canvas.dataset.lastX || '0');
        const y0 = parseFloat(canvas.dataset.lastY || '0');

        if (tool === 'pen' || tool === 'eraser') {
            drawLine(ctx, x0, y0, x1, y1, color, brushSize, tool);

            if (socket) {
                socket.emit('whiteboard-draw', {
                    roomCode,
                    x0,
                    y0,
                    x1,
                    y1,
                    color,
                    size: brushSize,
                    tool,
                });
            }

            canvas.dataset.lastX = x1.toString();
            canvas.dataset.lastY = y1.toString();
        }
    };

    const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        if (tool === 'rectangle' || tool === 'circle') {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const rect = canvas.getBoundingClientRect();
            const x1 = e.clientX - rect.left;
            const y1 = e.clientY - rect.top;

            if (tool === 'rectangle') {
                drawRectangle(ctx, shapeStart.x, shapeStart.y, x1, y1, color, brushSize);
            } else if (tool === 'circle') {
                drawCircle(ctx, shapeStart.x, shapeStart.y, x1, y1, color, brushSize);
            }

            if (socket) {
                socket.emit('whiteboard-draw', {
                    roomCode,
                    tool,
                    x0: shapeStart.x,
                    y0: shapeStart.y,
                    x1,
                    y1,
                    color,
                    size: brushSize,
                });
            }
        }

        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (socket) {
            socket.emit('whiteboard-clear', { roomCode });
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Paintbrush className="w-5 h-5" />
                    Whiteboard
                </h3>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTool('pen')}
                        className={`p-2 rounded ${tool === 'pen' ? 'bg-black-primary text-white' : 'bg-cream-50'}`}
                        title="Pen"
                    >
                        <Paintbrush className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-2 rounded ${tool === 'eraser' ? 'bg-black-primary text-white' : 'bg-cream-50'}`}
                        title="Eraser"
                    >
                        <Eraser className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTool('text')}
                        className={`p-2 rounded ${tool === 'text' ? 'bg-black-primary text-white' : 'bg-cream-50'}`}
                        title="Text"
                    >
                        <Type className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTool('rectangle')}
                        className={`p-2 rounded ${tool === 'rectangle' ? 'bg-black-primary text-white' : 'bg-cream-50'}`}
                        title="Rectangle"
                    >
                        <Square className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTool('circle')}
                        className={`p-2 rounded ${tool === 'circle' ? 'bg-black-primary text-white' : 'bg-cream-50'}`}
                        title="Circle"
                    >
                        <Circle className="w-4 h-4" />
                    </button>

                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                    />

                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-20"
                        title="Brush size"
                    />

                    <button
                        onClick={clearCanvas}
                        className="p-2 rounded bg-red-50 hover:bg-red-100 text-red-600"
                        title="Clear canvas"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 p-4 relative">
                <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-full border border-border rounded-lg cursor-crosshair bg-white"
                />

                {/* Text Input Modal */}
                {showTextInput && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-black-primary rounded-lg p-4 shadow-lg">
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                            placeholder="Enter text..."
                            className="px-3 py-2 border border-border rounded-lg mb-2 w-64"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleTextSubmit}
                                className="flex-1 px-4 py-2 bg-black-primary text-white rounded-lg"
                            >
                                Add Text
                            </button>
                            <button
                                onClick={() => {
                                    setShowTextInput(false);
                                    setTextInput('');
                                }}
                                className="flex-1 px-4 py-2 bg-cream-100 text-text-primary rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
