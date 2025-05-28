import { Sidebar } from '@/components/ui/sidebar';

export interface FeaturePanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}