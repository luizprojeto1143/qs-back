import { motion } from 'framer-motion';
import { Lock, CheckCircle, Play, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrailNode {
    id: string;
    title: string;
    type: 'COURSE';
    status: 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETED';
    data: {
        description: string;
        coverUrl?: string;
        duration: number;
        progress: number;
    };
}

interface LearningTrailMapProps {
    trailId: string;
    title: string;
    description: string;
    nodes: TrailNode[];
    onClose: () => void;
}

export const LearningTrailMap = ({ title, description, nodes, onClose }: LearningTrailMapProps) => {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-5xl">

                {/* Header */}
                <div className="text-center mb-12 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-0 right-0 text-gray-400 hover:text-white"
                    >
                        Fechar
                    </button>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-black text-white mb-4"
                    >
                        {title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 max-w-2xl mx-auto text-lg"
                    >
                        {description}
                    </motion.p>
                </div>

                {/* Map Container */}
                <div className="relative py-10 px-4">
                    {/* Visual Connection Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-blue-500/0 -translate-x-1/2 hidden md:block" />

                    <div className="space-y-24 relative z-10">
                        {nodes.map((node, index) => {
                            const isLeft = index % 2 === 0;
                            const isLocked = node.status === 'LOCKED';
                            const isCompleted = node.status === 'COMPLETED';

                            return (
                                <motion.div
                                    key={node.id}
                                    initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className={`flex flex-col md:flex-row items-center gap-8 ${isLeft ? 'md:flex-row-reverse' : ''}`}
                                >
                                    {/* Text Content */}
                                    <div className={`flex-1 text-center ${isLeft ? 'md:text-left' : 'md:text-right'}`}>
                                        <h3 className={`text-2xl font-bold mb-2 ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                                            {node.title}
                                        </h3>
                                        <p className="text-gray-400 text-sm">{node.data.description}</p>
                                    </div>

                                    {/* Node Point (Center) */}
                                    <div className="relative shrink-0">
                                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center z-20 relative transition-all duration-300 ${isCompleted ? 'bg-green-500 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)]' :
                                                isLocked ? 'bg-gray-800 border-gray-700' :
                                                    'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110'
                                            }`}>
                                            {isCompleted ? <CheckCircle className="text-white h-8 w-8" /> :
                                                isLocked ? <Lock className="text-gray-500 h-6 w-6" /> :
                                                    <Play className="text-white h-6 w-6 fill-current ml-1" />}
                                        </div>

                                        {/* Connector to spine (Desktop only) */}
                                        <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-24 h-0.5 bg-gray-700 -z-10 ${isLeft ? 'right-full bg-gradient-to-l' : 'left-full bg-gradient-to-r'
                                            } from-blue-500/50 to-transparent`} />
                                    </div>

                                    {/* Card Preview */}
                                    <div className="flex-1 w-full max-w-sm">
                                        <div
                                            onClick={() => !isLocked && navigate(`/app/university/course/${node.id}`)}
                                            className={`bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 transition-all duration-300 ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 hover:border-blue-500 cursor-pointer shadow-xl'
                                                }`}
                                        >
                                            <div className="h-32 bg-gray-700 relative">
                                                {node.data.coverUrl && <img src={node.data.coverUrl} className="w-full h-full object-cover" />}
                                                {node.data.progress > 0 && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                                        <div className="h-full bg-blue-500" style={{ width: `${node.data.progress}%` }} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{node.data.duration} MIN</span>
                                                {!isLocked && <button className="text-blue-400 text-sm font-bold">Acessar</button>}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Finish Node */}
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.6)] animate-pulse">
                                <Star className="h-10 w-10 text-white fill-current" />
                            </div>
                            <h3 className="text-yellow-400 font-bold mt-4 text-xl tracking-widest uppercase">Certificação Elite</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
