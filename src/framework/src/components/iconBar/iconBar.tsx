import { cn } from '@/utils/utils'
import { IconBarResourceBinding } from './types'
import { Button } from '@/components/ui/button'
import { ICON_REGISTRY } from '../../resource/iconRegistry'

export default function IconBar({ currentActiveId, clickHandlers }: IconBarResourceBinding) {
    return (
        <div className='w-[40px] bg-[#22222B] flex flex-col items-center py-2'>
            {ICON_REGISTRY.map(item => (
                <button
                    type='button'
                    id={item.id}
                    key={item.id}
                    title={item.label}
                    onClick={() => clickHandlers[item.id](item.id)}
                    className={
                        cn(
                            'w-10 h-10 mb-1 cursor-pointer flex items-center justify-center', // default styles
                            item.style && item.style,
                            currentActiveId === item.id && 'border-r-2 border-gray-200',
                        )
                    }
                >
                    <item.icon className={cn(
                        'w-5 h-5',
                        currentActiveId === item.id ? 'text-gray-200' : 'text-gray-400 hover:text-gray-200',
                    )} />
                </button>
            ))}
        </div>
    )
}
