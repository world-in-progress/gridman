import { CapacityBar } from '@/components/capacityBar';
import store from '../store';
import GridRecorder from '@/core/grid/NHGridRecorder';

export default function CapacityTest() {
    return (
        <div className="p-2 w-[200px] bg-white/50 backdrop-blur-xs rounded-br-lg space-y-6 shadow-sm z-200">
            <CapacityBar
                isLoading={false}
                animateOnChange={true}
                animationDuration={1000}
            />
        </div>
    );
}
