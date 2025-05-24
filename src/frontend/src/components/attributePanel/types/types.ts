import { Sidebar } from '@/components/ui/sidebar';

export interface AttributePanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}