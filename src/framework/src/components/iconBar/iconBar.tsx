import { cn } from '@/utils/utils'
import { IconBarResourceBinding } from './types'
import { Button } from '@/components/ui/button'
import { ICON_REGISTRY } from '../../resource/iconRegistry'

export default function IconBar({ currentActiveId, clickHandlers }: IconBarResourceBinding) {
    return (
        <div className='w-[40px] bg-slate-900 flex flex-col items-center py-2'>
            {ICON_REGISTRY.map(item => (
                <Button
                    id={item.id}
                    key={item.id}
                    title={item.label}
                    size='icon'
                    variant='ghost'
                    onClick={() => clickHandlers[item.id](item.id)}
                    className={
                        cn(
                            'w-10 h-10 mb-1 hover:bg-gray-700 cursor-pointer', // default styles
                            item.style && item.style,
                            currentActiveId === item.id && 'bg-gray-700 border-l-2 border-blue-500',
                        )
                    }
                >
                    <item.icon className='w-8 h-8 text-white' />
                </Button>
            ))}
        </div>
    )
}
