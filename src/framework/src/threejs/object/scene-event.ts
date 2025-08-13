export const SceneUpdateEventType = 'scene-update';
export type SceneUpdateEvent = {
    time: number;
    delta: number;
};

export const SceneRecenterEventType = 'scene-recenter';
export type SceneRecenterEvent = {};
