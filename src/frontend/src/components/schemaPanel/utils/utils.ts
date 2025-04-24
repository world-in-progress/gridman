import { convertCoordinate } from '../../operatePanel/utils/coordinateUtils';

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