import * as React from 'react';
import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../App';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import { ArrowLeft } from 'lucide-react';

interface TopologyPanelProps extends React.ComponentProps<typeof Sidebar> {
    onBack?: () => void;
}

export default function TopologyPanel({
    onBack,
    ...props
}: TopologyPanelProps) {
    const { language } = useContext(LanguageContext);
    const [projectInfo, setProjectInfo] = useState<{
        projectName?: string;
        subprojectName?: string;
    }>({});

    const handleBack = () => {
        if (onBack) {
            onBack();
        }
    };

    useEffect(() => {
        const handleSwitchToTopology = (event: any) => {
            const { projectName, subprojectName } = event.detail;
            setProjectInfo({ projectName, subprojectName });
        };

        window.addEventListener(
            'switchToTopologyPanel',
            handleSwitchToTopology
        );

        return () => {
            window.removeEventListener(
                'switchToTopologyPanel',
                handleSwitchToTopology
            );
        };
    }, []);

    return (
        <Sidebar {...props}>
            <SidebarContent>
                <div className="flex items-center p-3 mb-0 justify-between">
                    <button
                        onClick={handleBack}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                        aria-label="返回"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-4xl font-semibold text-center flex-1">
                        {language === 'zh' ? '拓扑操作' : 'Topology Edit'}
                    </h1>
                </div>

                {projectInfo.projectName && projectInfo.subprojectName && (
                    <div className="p-4">
                        <div className="bg-blue-50 p-3 rounded-md mb-4">
                            <h2 className="text-lg font-medium text-blue-900">
                                {language === 'zh'
                                    ? '当前项目'
                                    : 'Current Project'}
                            </h2>
                            <div className="text-sm text-blue-800 mt-1">
                                <div>
                                    <span className="font-medium">
                                        {language === 'zh'
                                            ? '项目名称：'
                                            : 'Project: '}
                                    </span>
                                    {projectInfo.projectName}
                                </div>
                                <div className="mt-1">
                                    <span className="font-medium">
                                        {language === 'zh'
                                            ? '子项目：'
                                            : 'Subproject: '}
                                    </span>
                                    {projectInfo.subprojectName}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-md font-medium mb-2">
                                {language === 'zh'
                                    ? '拓扑工具'
                                    : 'Topology Tools'}
                            </h3>
                            {/* 这里可以添加拓扑编辑工具 */}
                        </div>
                    </div>
                )}
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
