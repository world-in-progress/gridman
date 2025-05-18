'use client';

import { Progress } from '@/components/ui/capacityBar';
import { cn } from '@/utils/utils';
import { Database, DatabaseZap, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState, useContext } from 'react';
import {
    LanguageContext,
} from '../context';
import store from '@/store';
import GridRecorder from '@/core/grid/NHGridRecorder';

interface CapacityBarProps {
    className?: string;
    showPercentage?: boolean; // 是否显示百分比
    showIcon?: boolean; // 是否显示图标
    isLoading?: boolean; // 是否显示加载状态
    animateOnChange?: boolean; // 是否在值变化时添加动画
    animationDuration?: number; // 动画持续时间（毫秒）
}

export function CapacityBar({
    className,
    showPercentage = true,
    showIcon = true,
    isLoading = false,
    animateOnChange = true,
    animationDuration = 1000,
}: CapacityBarProps) {
    console.log(store.get<GridRecorder>('gridRecorder')?.maxGridNum);
    // 确保值在0-max范围内
    // const normalizedValue = Math.max(0, Math.min(value, max));
    // const targetPercentage = Math.round((normalizedValue / max) * 100);
    // console.log(targetPercentage)
    const gridCore = store.get<GridRecorder>('gridRecorder')
    const { language } = useContext(LanguageContext);

    console.log(gridCore?.gridNum)
    const normalizedValue1 = Math.max(0, Math.min(gridCore?.gridNum || 0, gridCore?.maxGridNum || 100));
    const targetPercentage1 = Math.round((normalizedValue1 / (gridCore?.maxGridNum || 100)) * 100);
    console.log(targetPercentage1)

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
        if (percentage < 50) {
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
        if (isLoading) {
            return (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            );
        }

        const colors = getColorClass(percentage);

        if (percentage < 50) {
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
        <div className={cn('flex items-center gap-3', className)}>
            {showIcon && (
                <div className="flex-shrink-0 relative">
                    {getIcon(displayPercentage)}
                    {isAnimating && (
                        <span
                            className="absolute inset-0 animate-ping opacity-75 rounded-full bg-current"
                            style={{ backgroundColor: 'currentColor' }}
                        />
                    )}
                </div>
            )}
            <div className="flex-grow">
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold">{language === 'zh' ? '容量' : 'Capacity'}</span>
                    {showPercentage && (
                        <span
                            className={cn(
                                'text-sm font-medium transition-colors duration-300',
                                getColorClass(displayPercentage).text
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
                            getColorClass(displayPercentage).bg,
                            isLoading && 'animate-pulse'
                        )}
                        indicatorClassName={cn(
                            'transition-all duration-300 ease-out',
                            getColorClass(displayPercentage).indicator,
                            isAnimating &&
                                'after:absolute after:inset-0 after:bg-white after:opacity-30 after:animate-[shimmer_2s_infinite]'
                        )}
                    />
                    {isLoading && (
                        <div className="absolute inset-0 w-full h-full">
                            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-[shimmer_1.5s_infinite]" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
