import Actor from '../../../core/message/actor';
import { Callback } from '../../../core/types';
import { Schema } from '../types/types';
import { clearMapMarkers } from './SchemaCoordinateService';

/**
 * 下载Schema数据为JSON文件
 */
export const downloadSchemaAsJson = (data: Schema, filename: string): void => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * 提交Schema数据
 */
export const submitSchemaData = (
  schemaData: Schema,
  language: string,
  onSuccess: () => void,
  onError: (error: string) => void,
  isSelectingPoint: boolean,
  cleanupFn?: () => void
): void => {
  try {
    // 创建Worker
    const worker = new Worker(
      new URL('../../../core/worker/base.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // 创建Actor用于和Worker通信
    const actor = new Actor(worker, {});

    // 发送任务到Worker
    actor.send('createSchema', schemaData, ((error, result) => {
      if (error) {
        console.error('Worker错误:', error);
        onError(
          language === 'zh'
            ? `提交失败: ${error.message}`
            : `Submission failed: ${error.message}`
        );

        // 即使出错，也清理地图标记
        clearMapMarkers();

        if (isSelectingPoint && window.mapInstance) {
          if (window.mapInstance.getCanvas()) {
            window.mapInstance.getCanvas().style.cursor = '';
          }
          if (cleanupFn) cleanupFn();
        }
      } else {
        console.log('提交成功:', result);
        
        // 成功后清理地图标记
        clearMapMarkers();

        if (isSelectingPoint && window.mapInstance) {
          if (window.mapInstance.getCanvas()) {
            window.mapInstance.getCanvas().style.cursor = '';
          }
          if (cleanupFn) cleanupFn();
        }

        // 成功后重定向到第一页（确保显示新创建的模板）
        window.location.hash = '#/schemas?page=1';
        
        // 调用成功回调
        onSuccess();
      }

      // 任务完成后终止worker
      setTimeout(() => {
        actor.remove();
        worker.terminate();
      }, 100);
    }) as Callback<any>);
  } catch (error) {
    console.error('创建Worker出错:', error);
    onError(
      language === 'zh'
        ? `创建Worker出错: ${
            error instanceof Error ? error.message : String(error)
          }`
        : `Error creating worker: ${
            error instanceof Error ? error.message : String(error)
          }`
    );

    // 即使出错，也清理地图标记
    clearMapMarkers();

    if (isSelectingPoint && window.mapInstance) {
      if (window.mapInstance.getCanvas()) {
        window.mapInstance.getCanvas().style.cursor = '';
      }
      if (cleanupFn) cleanupFn();
    }

    // 即使出错，也重定向到第一页
    window.location.hash = '#/schemas?page=1';
  }
}; 