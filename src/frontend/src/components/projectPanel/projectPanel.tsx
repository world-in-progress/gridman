import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../context';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import { SearchForm } from '../ui/search-form';
import { SubNavPanel } from './components/SubNavPanel';
import { Pagination } from '../schemaPanel/components/Pagination';
import { Project, ProjectPanelProps } from './types/types';
import store from '@/store';

export default function ProjectPanel({
    onCreateNew,
    onCreatePatch,
    ...props
}: ProjectPanelProps) {
    const { language } = useContext(LanguageContext);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const itemsPerPage = 5;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    
    store.set('updateProjectCurrentPage', {
        on: () => {
            setCurrentPage(1);
        }
    })

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleTotalItemsChange = (total: number) => {
        setTotalItems(total);
    };

    const handleFirstPage = () => {
        if (currentPage > 1) {
            setCurrentPage(1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            const newPage = currentPage - 1;
            setCurrentPage(newPage);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
        }
    };

    const handleLastPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(totalPages);
        }
    };

    const handleNavigateToPage = (page: number) => {
        if (page > 0 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleCreatePatch = (
        project: Project,
        schemaName?: string,
        epsg?: string,
        gridInfo?: string
    ) => {
        if (onCreatePatch) {
            onCreatePatch(project, schemaName, epsg, gridInfo);
        }
    };

    return (
        <Sidebar {...props}>
            <SidebarContent>
                <h1 className="text-4xl font-semibold p-3 text-center">
                    {language === 'zh' ? '项目列表' : 'Project List'}
                </h1>
                <SearchForm
                    className="flex flex-col gap-2 mb-1 p-1 -mt-2"
                    onSearch={handleSearch}
                    placeholder={
                        language === 'zh' ? '搜索项目...' : 'Search projects...'
                    }
                />
                <SubNavPanel
                    currentPage={currentPage}
                    onTotalItemsChange={handleTotalItemsChange}
                    itemsPerPage={itemsPerPage}
                    onNavigateToPage={handleNavigateToPage}
                    searchQuery={searchQuery}
                    onCreatePatch={handleCreatePatch}
                />

                {/* Pagination Component */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onFirstPage={handleFirstPage}
                    onPrevPage={handlePrevPage}
                    onNextPage={handleNextPage}
                    onLastPage={handleLastPage}
                />
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
