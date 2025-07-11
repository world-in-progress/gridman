import * as React from 'react';
import { Plus } from 'lucide-react';
import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../context';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import { SearchForm } from '../ui/search-form';
import { SubNavPanel } from './components/subNavPanel';
import { Pagination } from './components/Pagination';
import { createPaginationHandlers } from './utils/utils';
import store from '@/store';
import Loader from '../../../../framework/src/components/ui/loader';

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

    const [isSchemaLoading, setIsSchemaLoading] = useState(false);

    store.set('schemaLoadingMethods', {
        on: () => {
            setIsSchemaLoading(true);
        },
        off: () => {
            setIsSchemaLoading(false);
        },
    });

    store.set('updateSchemaCurrentPage', {
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

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const paginationHandlers = createPaginationHandlers(
        currentPage,
        totalPages,
        setCurrentPage
    );

    return (
        <Sidebar {...props}>
            <SidebarContent>

                <h1 className="text-4xl font-semibold p-3 text-center">
                    {language === 'zh' ? '模板列表' : 'Schema List'}
                </h1>
                <div className="left-0 right-0 -mt-2 flex justify-center">
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
                    className="flex flex-col gap-2 p-1"
                    onSearch={handleSearch}
                    placeholder={
                        language === 'zh' ? '搜索模板...' : 'Search schemas...'
                    }
                />
                <SubNavPanel
                    currentPage={currentPage}
                    onTotalItemsChange={handleTotalItemsChange}
                    itemsPerPage={itemsPerPage}
                    onNavigateToPage={paginationHandlers.handleNavigateToPage}
                    onCreateProject={onCreateProject}
                    searchQuery={searchQuery}
                />

                {/* Pagination Component */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onFirstPage={paginationHandlers.handleFirstPage}
                    onPrevPage={paginationHandlers.handlePrevPage}
                    onNextPage={paginationHandlers.handleNextPage}
                    onLastPage={paginationHandlers.handleLastPage}
                />
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
