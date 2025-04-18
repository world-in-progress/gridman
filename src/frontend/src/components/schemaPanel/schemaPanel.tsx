import * as React from 'react';
import { Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../../App';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import { SearchForm } from '../ui/search-form';
import { SubNavPanel } from './components/subNavPanel';

interface SchemaPanelProps extends React.ComponentProps<typeof Sidebar> {
  onCreateNew?: () => void;
}

export default function SchemaPanel({
  onCreateNew,
  ...props
}: SchemaPanelProps) {
  const { language } = useContext(LanguageContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    const getPageFromURL = () => {
      const hash = window.location.hash;
      const pageMatch = /page=(\d+)/.exec(hash);
      if (pageMatch && pageMatch[1]) {
        const page = parseInt(pageMatch[1], 10);
        if (!isNaN(page) && page > 0) {
          return page;
        }
      }
      return 1;
    };

    setCurrentPage(getPageFromURL());

    const handleHashChange = () => {
      setCurrentPage(getPageFromURL());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleTotalItemsChange = (total: number) => {
    setTotalItems(total);
  };

  const handleFirstPage = () => {
    if (currentPage > 1) {
      setCurrentPage(1);
      window.location.hash = window.location.hash.includes('?')
        ? window.location.hash.replace(/page=\d+/, `page=1`)
        : `${window.location.hash.split('?')[0]}?page=1`;
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      window.location.hash = window.location.hash.includes('?')
        ? window.location.hash.replace(/page=\d+/, `page=${newPage}`)
        : `${window.location.hash.split('?')[0]}?page=${newPage}`;
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      window.location.hash = window.location.hash.includes('?')
        ? window.location.hash.replace(/page=\d+/, `page=${newPage}`)
        : `${window.location.hash.split('?')[0]}?page=${newPage}`;
    }
  };

  const handleLastPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(totalPages);
      window.location.hash = window.location.hash.includes('?')
        ? window.location.hash.replace(/page=\d+/, `page=${totalPages}`)
        : `${window.location.hash.split('?')[0]}?page=${totalPages}`;
    }
  };

  // 处理导航到指定页面的请求
  const handleNavigateToPage = (page: number) => {
    if (page > 0 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      window.location.hash = window.location.hash.includes('?')
        ? window.location.hash.replace(/page=\d+/, `page=${page}`)
        : `${window.location.hash.split('?')[0]}?page=${page}`;
    }
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
              {language === 'zh' ? '创建新模板' : 'Create New Schema'}
            </span>
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <SearchForm className="flex flex-col gap-2 mb-2" />
        <SubNavPanel
          currentPage={currentPage}
          onTotalItemsChange={handleTotalItemsChange}
          itemsPerPage={itemsPerPage}
          onNavigateToPage={handleNavigateToPage}
        />

        {/* 分页控制 */}
        <div className="mx-3 -mt-4">
          {(totalPages > 1 || totalItems > itemsPerPage) && (
            <div className="flex justify-center items-center mt-2 mb-2 mx-auto px-4 py-2 bg-background/90 backdrop-blur-sm rounded-full shadow-md border border-gray-200 w-fit">
              <button
                onClick={handleFirstPage}
                disabled={currentPage === 1}
                className={`p-1.5 rounded-full ${
                  currentPage === 1
                    ? 'text-gray-400'
                    : 'text-primary hover:bg-primary/10'
                }`}
                title={language === 'zh' ? '首页' : 'First Page'}
                aria-label={language === 'zh' ? '首页' : 'First Page'}
              >
                <ChevronsLeft size={18} />
              </button>
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`p-1.5 rounded-full ${
                  currentPage === 1
                    ? 'text-gray-400'
                    : 'text-primary hover:bg-primary/10'
                }`}
                title={language === 'zh' ? '上一页' : 'Previous Page'}
                aria-label={language === 'zh' ? '上一页' : 'Previous Page'}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="mx-3 text-sm font-medium">
                {language === 'zh'
                  ? `第 ${currentPage}/${
                      totalPages || 1
                    } 页 (共${totalItems}项)`
                  : `Page ${currentPage} of ${
                      totalPages || 1
                    } (${totalItems} items)`}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`p-1.5 rounded-full ${
                  currentPage === totalPages || totalPages === 0
                    ? 'text-gray-400'
                    : 'text-primary hover:bg-primary/10'
                }`}
                title={language === 'zh' ? '下一页' : 'Next Page'}
                aria-label={language === 'zh' ? '下一页' : 'Next Page'}
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={handleLastPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`p-1.5 rounded-full ${
                  currentPage === totalPages || totalPages === 0
                    ? 'text-gray-400'
                    : 'text-primary hover:bg-primary/10'
                }`}
                title={language === 'zh' ? '尾页' : 'Last Page'}
                aria-label={language === 'zh' ? '尾页' : 'Last Page'}
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          )}
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
