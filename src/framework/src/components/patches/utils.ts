export const formatCoordinate = (coord: [number, number] | undefined) => {
    if (!coord) return '---';
    return `[${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}]`;
};