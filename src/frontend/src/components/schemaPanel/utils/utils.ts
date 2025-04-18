import { convertCoordinate } from '../../operatePanel/utils/coordinateUtils';
import { Schema } from '../types/types';

// 坐标转换功能
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

// 查找Schema在哪一页
export const findSchemaPage = (
  schemaName: string, 
  allSchemasList: Schema[],
  itemsPerPage: number
): number => {
  if (!allSchemasList || allSchemasList.length === 0) return 1;
  
  // 排序后的schema列表（先标星的在前面）
  const sortedSchemas = [...allSchemasList].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    return 0;
  });
  
  // 找到schema的索引
  const index = sortedSchemas.findIndex(schema => schema.name === schemaName);
  if (index === -1) return 1;
  
  // 计算页码
  return Math.floor(index / itemsPerPage) + 1;
}; 