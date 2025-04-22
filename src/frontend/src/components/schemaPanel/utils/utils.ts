import { convertCoordinate } from '../../operatePanel/utils/coordinateUtils';
import { Schema } from '../types/types';

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

// Find which page the schema is on
export const findSchemaPage = (
  schemaName: string, 
  allSchemasList: Schema[],
  itemsPerPage: number
): number => {
  if (!allSchemasList || allSchemasList.length === 0) return 1;
  
  // Sorted schema list (starred items first)
  const sortedSchemas = [...allSchemasList].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    return 0;
  });
  
  // Find schema index
  const index = sortedSchemas.findIndex(schema => schema.name === schemaName);
  if (index === -1) return 1;
  
  // Calculate page number
  return Math.floor(index / itemsPerPage) + 1;
}; 