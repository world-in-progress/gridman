import * as React from 'react';
import { Plus } from 'lucide-react';
import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../App';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import { SearchForm } from '../ui/search-form';
import { SubNavPanel } from './components/subNavPanel';
import { Pagination } from './components/Pagination';

interface SchemaPanelProps extends React.ComponentProps<typeof Sidebar> {
    onCreateNew?: () => void;
    onCreateProject?: (schemaName: string, epsg: string, level: string) => void;
}

export default function SchemaPanel({
    onCreateNew,
    onCreateProject,
    ...props
}: SchemaPanelProps) {
    const { language } = useContext(LanguageContext);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const itemsPerPage = 5;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

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

    return (
        <Sidebar {...props}>
            <SidebarContent>
                <h1 className="text-4xl font-semibold p-3 text-center">
                    {language === 'zh' ? '模板列表' : 'Schema List'}
                </h1>
                <div className="left-0 right-0 mb-2 flex justify-center">
                    <button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg cursor-pointer"
                        onClick={onCreateNew}
                    >
                        <span>
                            {language === 'zh'
                                ? '创建新模板'
                                : 'Create New Schema'}
                        </span>
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                <SearchForm
                    className="flex flex-col gap-2 mb-2"
                    onSearch={handleSearch}
                    placeholder={
                        language === 'zh' ? '搜索模板...' : 'Search schemas...'
                    }
                />
                <SubNavPanel
                    currentPage={currentPage}
                    onTotalItemsChange={handleTotalItemsChange}
                    itemsPerPage={itemsPerPage}
                    onNavigateToPage={handleNavigateToPage}
                    onCreateProject={onCreateProject}
                    searchQuery={searchQuery}
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
