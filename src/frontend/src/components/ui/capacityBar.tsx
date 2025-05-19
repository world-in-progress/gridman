import { Progress } from '@/components/ui/progressBar';
import { cn } from '@/utils/utils';
import { Database, DatabaseZap, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState, useContext } from 'react';
import { LanguageContext } from '../../context';
import store from '@/store';
import GridCore from '@/core/grid/NHGridCore';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

interface CapacityBarProps {
    className?: string;
    showPercentage?: boolean; // 是否显示百分比
    showIcon?: boolean; // 是否显示图标
    animateOnChange?: boolean; // 是否在值变化时添加动画
    animationDuration?: number; // 动画持续时间（毫秒）
}

export default function CapacityBar({
    className,
    showPercentage = true,
    showIcon = true,
    animateOnChange = true,
    animationDuration = 1000,
}: CapacityBarProps) {
    // 确保值在0-max范围内
    // const normalizedValue = Math.max(0, Math.min(value, max));
    // const targetPercentage = Math.round((normalizedValue / max) * 100);

    const gridCore = store.get<GridCore>('gridCore');
    const { language } = useContext(LanguageContext);

    const normalizedValue1 = Math.max(
        0,
        Math.min(gridCore?.gridNum || 0, gridCore?.maxGridNum || 100)
    );
    const targetPercentage1 = Math.round(
        (normalizedValue1 / (gridCore?.maxGridNum || 100)) * 100
    );

    // 用于动画的当前显示值
    const [displayPercentage, setDisplayPercentage] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // 当目标值变化时，触发动画
    useEffect(() => {
        if (!animateOnChange) {
            setDisplayPercentage(targetPercentage1);
            return;
        }

        setIsAnimating(true);

        // 初始加载时的动画
        if (displayPercentage === 0 && targetPercentage1 > 0) {
            let startTime: number | null = null;
            const animateInitial = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const progress = timestamp - startTime;
                const percentage = Math.min(progress / animationDuration, 1);
                const currentValue = Math.round(targetPercentage1 * percentage);

                setDisplayPercentage(currentValue);

                if (percentage < 1) {
                    requestAnimationFrame(animateInitial);
                } else {
                    setIsAnimating(false);
                }
            };

            requestAnimationFrame(animateInitial);
        }
        // 值变化时的动画
        else if (displayPercentage !== targetPercentage1) {
            const startValue = displayPercentage;
            const valueChange = targetPercentage1 - startValue;
            let startTime: number | null = null;

            const animateChange = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const progress = timestamp - startTime;
                const percentage = Math.min(progress / animationDuration, 1);
                const currentValue = Math.round(
                    startValue + valueChange * percentage
                );

                setDisplayPercentage(currentValue);

                if (percentage < 1) {
                    requestAnimationFrame(animateChange);
                } else {
                    setIsAnimating(false);
                }
            };

            requestAnimationFrame(animateChange);
        } else {
            setIsAnimating(false);
        }
    }, [targetPercentage1, animateOnChange, animationDuration]);

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
                        <div className="p-2 w-[200px] bg-white/50  backdrop-blur-md rounded-br-lg space-y-6 z-200">
                            <div
                                className={cn(
                                    'flex items-center gap-3',
                                    className
                                )}
                            >
                                {showIcon && (
                                    <div className="flex-shrink-0 relative">
                                        {getIcon(displayPercentage)}
                                        {isAnimating && (
                                            <span
                                                className="absolute inset-0 animate-ping opacity-75 rounded-full bg-current"
                                                style={{
                                                    backgroundColor:
                                                        'currentColor',
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-bold">
                                            {language === 'zh'
                                                ? '容量'
                                                : 'Capacity'}
                                        </span>
                                        {showPercentage && (
                                            <span
                                                className={cn(
                                                    'text-sm font-medium transition-colors duration-300',
                                                    getColorClass(
                                                        displayPercentage
                                                    ).text
                                                )}
                                            >
                                                {displayPercentage}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Progress
                                            value={displayPercentage}
                                            className={cn(
                                                'h-2 overflow-hidden transition-colors duration-300',
                                                getColorClass(displayPercentage)
                                                    .bg
                                            )}
                                            indicatorClassName={cn(
                                                'transition-all duration-300 ease-out',
                                                getColorClass(displayPercentage)
                                                    .indicator,
                                                isAnimating &&
                                                    'after:absolute after:inset-0 after:bg-white after:opacity-30 after:animate-[shimmer_2s_infinite]'
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent
                        side="bottom"
                        className="bg-white"
                        arrowClassName="fill-white bg-white z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]"
                    >
                        <div className="text-sm text-center justify-between p-1">
                            <p className="font-bold mb-1 text-black">
                                {language === 'zh'
                                    ? '当前网格数'
                                    : 'Current Grid Number'}
                                : {gridCore?.gridNum}
                            </p>
                            <p className="font-bold text-red-500">
                                {language === 'zh'
                                    ? '最大网格数'
                                    : 'Max Grid Number'}
                                : {gridCore?.maxGridNum}
                            </p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
