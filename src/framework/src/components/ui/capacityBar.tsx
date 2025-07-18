import { Progress } from './progressBar';
import { cn } from '@/utils/utils';
import { Database, DatabaseZap, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface CapacityBarProps {
    className?: string
    animateOnChange?: boolean;
    animationDuration?: number;
    gridCore: any; // GridCore类型
}

export default function CapacityBar({
    className,
    animateOnChange = true,
    animationDuration = 1000,
    gridCore
}: CapacityBarProps) {
    // 直接追踪gridNum和maxGridNum值而非gridCore对象
    const [gridNum, setGridNum] = useState(gridCore?.gridNum || 0);
    const [maxGridNum, setMaxGridNum] = useState(gridCore?.maxGridNum || 100);
    
    // 监听gridCore内部数值变化
    useEffect(() => {
        // 初始化值
        setGridNum(gridCore?.gridNum || 0);
        setMaxGridNum(gridCore?.maxGridNum || 100);
        
        // 设置轮询检查gridNum变化
        const intervalId = setInterval(() => {
            if (gridCore && (gridCore.gridNum !== gridNum || gridCore.maxGridNum !== maxGridNum)) {
                setGridNum(gridCore.gridNum);
                setMaxGridNum(gridCore.maxGridNum);
            }
        }, 500); // 每500ms检查一次
        
        return () => clearInterval(intervalId);
    }, [gridCore]);
    
    const normalizedValue = Math.max(0, Math.min(gridNum, maxGridNum));
    const targetPercentage = Math.round((normalizedValue / maxGridNum) * 100);

    // 用于动画的当前显示值
    const [displayPercentage, setDisplayPercentage] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // 当目标值变化时，触发动画
    useEffect(() => {
        if (!animateOnChange) {
            setDisplayPercentage(targetPercentage);
            return;
        }

        setIsAnimating(true);

        // 初始加载或值变化时的动画处理
        const startValue = displayPercentage;
        const valueChange = targetPercentage - startValue;
        let startTime: number | null = null;

        const animateChange = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / animationDuration, 1);
            const currentValue = Math.round(startValue + valueChange * percentage);

            setDisplayPercentage(currentValue);

            if (percentage < 1) {
                requestAnimationFrame(animateChange);
            } else {
                setIsAnimating(false);
            }
        };

        requestAnimationFrame(animateChange);
        
    }, [targetPercentage, animateOnChange, animationDuration]);

    // 修改 getColorClass 函数，为背景和指示器分别返回不同深度的颜色
    const getColorClass = (percentage: number) => {
        if (percentage < 40) {
            return {
                text: 'text-green-600',
                bg: 'bg-green-100',
                indicator: 'bg-green-600',
            };
        }
        if (percentage < 80) {
            return {
                text: 'text-amber-600',
                bg: 'bg-amber-100',
                indicator: 'bg-amber-600',
            };
        }
        return {
            text: 'text-red-600',
            bg: 'bg-red-100',
            indicator: 'bg-red-600',
        };
    };

    // 修改 getIcon 函数，使用新的 getColorClass 返回值
    const getIcon = (percentage: number) => {
        const colors = getColorClass(percentage);

        if (percentage < 40) {
            return (
                <Database
                    className={cn(
                        'h-5 w-5 transition-colors duration-300',
                        colors.text
                    )}
                />
            );
        } else if (percentage < 80) {
            return (
                <DatabaseZap
                    className={cn(
                        'h-5 w-5 transition-colors duration-300',
                        colors.text
                    )}
                />
            );
        } else {
            return (
                <AlertCircle
                    className={cn(
                        'h-5 w-5 transition-colors duration-300',
                        colors.text
                    )}
                />
            );
        }
    };

    return (
        <div className="absolute flex flex-row gap-4 top-0 left-0 z-5">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="p-2 w-[200px] bg-white/50  backdrop-blur-md rounded-br-lg rounded-tl-lg space-y-6 z-200">
                            <div
                                className={cn(
                                    'flex items-center gap-3',
                                    className
                                )}
                            >
                                <div className="flex-shrink-0 relative">
                                    {getIcon(displayPercentage)}
                                    {isAnimating && (
                                        <span
                                            className="absolute inset-0 animate-ping opacity-75 rounded-full bg-current"
                                            style={{ backgroundColor: 'currentColor' }}
                                        />
                                    )}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-bold">
                                            Capacity
                                        </span>
                                        <span
                                            className={cn('text-sm font-medium transition-colors duration-300',
                                                getColorClass(displayPercentage).text)}
                                        >
                                            {displayPercentage}%
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <Progress
                                            value={displayPercentage}
                                            className={cn(
                                                'h-2 overflow-hidden transition-colors duration-300',
                                                getColorClass(displayPercentage).bg
                                            )}
                                            indicatorClassName={cn('transition-all duration-300 ease-out',
                                                getColorClass(displayPercentage).indicator,
                                                isAnimating && 'after:absolute after:inset-0 after:bg-white after:opacity-30 after:animate-[shimmer_2s_infinite]'
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <div className="text-sm text-center justify-between p-1">
                            <p className="font-bold mb-1 text-black">
                                Current Grid Number : {gridCore?.gridNum}
                            </p>
                            <p className="font-bold text-red-500">
                                Max Grid Number : {gridCore?.maxGridNum}
                            </p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
