import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useContext } from 'react';
import { LanguageContext } from '../../../context';
import { PaginationProps } from '../types/types';

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onFirstPage,
  onPrevPage,
  onNextPage,
  onLastPage,
}) => {
  const { language } = useContext(LanguageContext);

  if (totalPages <= 1 && totalItems <= itemsPerPage) {
    return null;
  }

  return (
    <div className="mx-3 -mt-4 mb-2">
      <div className="flex justify-center items-center mt-2 mb-2 mx-auto px-4 py-2 bg-background/90 backdrop-blur-sm rounded-full shadow-md border border-gray-200 w-fit">
        <button
          onClick={onFirstPage}
          disabled={currentPage === 1}
          className={`p-1.5 rounded-full cursor-pointer ${
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
          onClick={onPrevPage}
          disabled={currentPage === 1}
          className={`p-1.5 rounded-full cursor-pointer ${
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
            ? `第 ${currentPage}/${totalPages || 1} 页 (共${totalItems}项)`
            : `Page ${currentPage} of ${totalPages || 1} (${totalItems} items)`}
        </span>
        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`p-1.5 rounded-full cursor-pointer ${
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
          onClick={onLastPage}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`p-1.5 rounded-full cursor-pointer ${
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
    </div>
  );
};
