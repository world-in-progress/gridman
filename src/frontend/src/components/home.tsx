import { useEffect, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { LanguageContext } from '../context';

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { language } = useContext(LanguageContext);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions
        const setCanvasDimensions = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        setCanvasDimensions();
        window.addEventListener('resize', setCanvasDimensions);

        // Grid parameters
        const gridSize = 40;
        const nodeRadius = 2;
        const maxDistance = 150;

        // Create grid nodes
        let nodes: { x: number; y: number; vx: number; vy: number }[] = [];

        const initNodes = () => {
            nodes = [];
            const cols = Math.ceil(canvas.width / gridSize) + 2;
            const rows = Math.ceil(canvas.height / gridSize) + 2;

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    nodes.push({
                        x: i * gridSize,
                        y: j * gridSize,
                        vx: Math.random() * 0.3 - 0.15,
                        vy: Math.random() * 0.3 - 0.15,
                    });
                }
            }
        };

        initNodes();
        window.addEventListener('resize', initNodes);

        // Animation variables
        let animationFrameId: number;
        let hue = 180; // Start with cyan/teal hue

        // Draw function
        const draw = () => {
            // Clear canvas with a solid background
            ctx.fillStyle = '#0a1525';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update hue
            hue = (hue + 0.1) % 360;

            // Draw connections between nodes
            ctx.lineWidth = 0.5;

            for (let i = 0; i < nodes.length; i++) {
                const nodeA = nodes[i];

                // Update node position
                nodeA.x += nodeA.vx;
                nodeA.y += nodeA.vy;

                // Bounce off edges with some randomness
                if (nodeA.x < 0 || nodeA.x > canvas.width) {
                    nodeA.vx *= -1;
                    nodeA.vx += (Math.random() - 0.5) * 0.1;
                }
                if (nodeA.y < 0 || nodeA.y > canvas.height) {
                    nodeA.vy *= -1;
                    nodeA.vy += (Math.random() - 0.5) * 0.1;
                }

                // Draw connections
                for (let j = i + 1; j < nodes.length; j++) {
                    const nodeB = nodes[j];
                    const dx = nodeB.x - nodeA.x;
                    const dy = nodeB.y - nodeA.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < maxDistance) {
                        const opacity = 1 - distance / maxDistance;
                        // Use a gradient of colors based on distance and time
                        const lineHue = (hue + distance * 0.5) % 360;
                        ctx.strokeStyle = `hsla(${lineHue}, 100%, 70%, ${opacity})`;

                        ctx.beginPath();
                        ctx.moveTo(nodeA.x, nodeA.y);
                        ctx.lineTo(nodeB.x, nodeB.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw nodes
            for (const node of nodes) {
                const nodeHue = (hue + 30) % 360;
                ctx.fillStyle = `hsl(${nodeHue}, 100%, 70%)`;
                ctx.beginPath();
                ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Add occasional energy pulses
            if (Math.random() < 0.02) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const pulseRadius = Math.random() * 100 + 50;

                const pulseGrd = ctx.createRadialGradient(
                    x,
                    y,
                    0,
                    x,
                    y,
                    pulseRadius
                );
                pulseGrd.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.3)`);
                pulseGrd.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

                ctx.fillStyle = pulseGrd;
                ctx.beginPath();
                ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        // Cleanup
        return () => {
            window.removeEventListener('resize', setCanvasDimensions);
            window.removeEventListener('resize', initNodes);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Animation variants for entrance animations
    const titleVariants = {
        hidden: { opacity: 0, y: -100 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: 'easeOut',
            },
        },
    };

    const titleSpanVariants = {
        hidden: { opacity: 0, y: -50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: 'easeOut',
                delay: 0.3,
            },
        },
    };

    const descriptionVariants = {
        hidden: { opacity: 0, y: -30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: 'easeOut',
                delay: 0.5,
            },
        },
    };

    const cardContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.7,
            },
        },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: 'easeOut',
            },
        },
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8 overflow-hidden">
            {/* Dynamic animated background */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 -z-10 bg-[#0a1525]"
            />

            {/* Content with solid backgrounds */}
            <div className="relative z-10  w-full max-w-8xl mx-auto">
                <motion.h1
                    className="text-[100px] font-bold mb-12 text-center text-white drop-shadow-lg"
                    initial="hidden"
                    animate="visible"
                    variants={titleVariants}
                >
                    {language === 'zh' ? '欢迎使用' : 'Welcome to use'}{' '}
                    <motion.span
                        className="text-[#00C0FF] animate-pulse"
                        variants={titleSpanVariants}
                    >
                        GridMan
                    </motion.span>
                </motion.h1>

                {/* Redesigned description with frosted glass effect */}
                <motion.div
                    className="relative mb-12 max-w-[1152px] mx-auto"
                    initial="hidden"
                    animate="visible"
                    variants={descriptionVariants}
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#00ccff] to-[#0f8bff] rounded-lg blur"></div>
                    <div className="relative bg-white/10 backdrop-blur-md rounded-lg p-5 border border-white/20">
                        <p className="text-xl text-white text-justify">
                            {language === 'zh'
                                ? 'GridMan是一个强大的智能网格与模拟平台, 专注于地理空间数据的管理与科学模拟分析。无论您是进行城市规划、环境分析还是资源管理, GridMan都为您提供直观的工具和强大的功能。'
                                : 'GridMan is a powerful intelligent grid and simulation platform, focusing on the management of geospatial data and scientific simulation analysis. Whether you are engaged in urban planning, environmental analysis, or resource management, GridMan provides you with intuitive tools and robust functionalities.'}
                        </p>
                    </div>
                </motion.div>
            </div>

            <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full text-center relative z-10"
                initial="hidden"
                animate="visible"
                variants={cardContainerVariants}
            >
                <motion.div
                    className="p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-[0_0_15px_rgba(113,246,255,0.4)] border-[#74DDFF] border-2 transition-all duration-300 hover:shadow-[0_0_25px_rgba(113,246,255,0.6)] hover:scale-105 hover:bg-[#00C0FF]/70 relative overflow-hidden group"
                    whileHover={{ y: -5 }}
                    variants={cardVariants}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#71F6FF]/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <h2 className="text-2xl font-semibold mb-3 text-[#71F6FF] relative z-10">
                        {language === 'zh'
                            ? '智能网格管理'
                            : 'Intelligent Grid Management'}
                    </h2>
                    <p className="text-gray-100 text-justify relative z-10">
                        {language === 'zh'
                            ? '轻松创建、编辑和管理复杂的地理网格系统，为您的数据分析打下坚实基础。'
                            : 'Easily create, edit, and manage complex geographic grid systems, laying a solid foundation for your data analysis.'}
                    </p>
                </motion.div>
                <motion.div
                    className="p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-[0_0_15px_rgba(113,246,255,0.4)] border-2 border-[#74DDFF] transition-all duration-300 hover:shadow-[0_0_25px_rgba(113,246,255,0.6)] hover:scale-105 hover:bg-[#00C0FF]/70 relative overflow-hidden group"
                    whileHover={{ y: -5 }}
                    variants={cardVariants}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#71F6FF]/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <h2 className="text-2xl font-semibold mb-3 text-[#71F6FF] relative z-10">
                        {language === 'zh'
                            ? '高效科学模拟'
                            : 'Efficient & scientific simulation'}
                    </h2>
                    <p className="text-gray-100 text-justify relative z-10">
                        {language === 'zh'
                            ? '集成多种模拟模型，在您的网格数据上运行强大的科学模拟，获取预测结果。'
                            : 'Integrate a variety of simulation models, run powerful scientific simulations on your grid data, and obtain predictive results.'}
                    </p>
                </motion.div>
                <motion.div
                    className="p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-[0_0_15px_rgba(113,246,255,0.4)] border-2 border-[#74DDFF] transition-all duration-300 hover:shadow-[0_0_25px_rgba(113,246,255,0.6)] hover:scale-105 hover:bg-[#00C0FF]/70 relative overflow-hidden group"
                    whileHover={{ y: -5 }}
                    variants={cardVariants}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#71F6FF]/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <h2 className="text-2xl font-semibold mb-3 text-[#71F6FF] relative z-10">
                        {language === 'zh'
                            ? 'AI 辅助分析'
                            : 'AI-assisted analysis'}
                    </h2>
                    <p className="text-gray-100 text-justify relative z-10">
                        {language === 'zh'
                            ? '利用 GridBot AI助手, 加速您的工作流程, 获取智能洞察和建议。'
                            : 'Use the GridBot AI assistant to accelerate your workflow, obtain intelligent insights and recommendations.'}
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}