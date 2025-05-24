import { convertCoordinate } from '../../../core/util/coordinateUtils';
import { PaginationHandlers } from '../types/types';

// Coordinate conversion functionality
export const convertToWGS84 = (
    coordinates: number[],
    fromEpsg: number
): [number, number] => {
    if (!coordinates || coordinates.length < 2 || !fromEpsg) {
        return [0, 0];
    }

    try {
        return convertCoordinate(
            [coordinates[0], coordinates[1]],
            fromEpsg.toString(),
            '4326'
        );
    } catch (error) {
        console.error('坐标转换错误:', error);
        return [0, 0];
    }
};

// Pagination utility functions
export const createPaginationHandlers = (
    currentPage: number,
    totalPages: number,
    setCurrentPage: (page: number) => void
): PaginationHandlers => {
    return {
        handleFirstPage: () => {
            if (currentPage > 1) {
                setCurrentPage(1);
            }
        },
        handlePrevPage: () => {
            if (currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        },
        handleNextPage: () => {
            if (currentPage < totalPages) {
                setCurrentPage(currentPage + 1);
            }
        },
        handleLastPage: () => {
            if (currentPage < totalPages) {
                setCurrentPage(totalPages);
            }
        },
        handleNavigateToPage: (page: number) => {
            if (page > 0 && page <= totalPages && page !== currentPage) {
                setCurrentPage(page);
            }
        },
    };
};
