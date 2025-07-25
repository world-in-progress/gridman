import { AutoReleaseWorkerPool } from '../../utils/workerPool';

// 在使用 Fetch 时，可能会产生数据量较大，在数据交换过程中产生对主线程的阻塞，
// 因此需要使用 WorkerPool 处理，以提高效率。
export class FetchDataPlugin {
    private _WorkerPool?: AutoReleaseWorkerPool;

    private static _CreateWorker = function (self: Worker) {

        self.onmessage = async function (event) {
            const { url, options } = event.data;
            try {
                const response = await fetch(url, options);

                // 将 Response 对象转换为可传递的格式
                const isJson = url.endsWith('.json');
                let data;

                if (isJson) {
                    data = await response.json();
                } else {
                    data = await response.arrayBuffer();
                }

                // 发送响应结果
                self.postMessage({
                    url,
                    success: true,
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    data: data,
                });
            } catch (error) {
                // 发送错误信息
                self.postMessage({
                    url,
                    success: false,
                    error: error.message,
                });
            }
        };
    };

    init(tiles) {
        const workerContent = `(${FetchDataPlugin._CreateWorker.toString()})(self)`;
        const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: 'application/javascript' }));
        // this.worker = new Worker(new URL(workerBlobUrl));

        const numberOfWorkers = tiles.downloadQueue.maxJobs;    

        this._WorkerPool = new AutoReleaseWorkerPool(numberOfWorkers, (): Promise<Worker> => {
            const worker = new Worker(workerBlobUrl);
            return Promise.resolve(worker);
        });
    }

    async fetchData(url, options) {
        return new Promise((resolve, reject) => {
            this._WorkerPool.push((worker, onComplete) => {
                
                const onError = (error: ErrorEvent) => {
                    worker.removeEventListener('error', onError);
                    worker.removeEventListener('message', onMessage);
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject(error);
                    onComplete();
                };

                const onMessage = (event: MessageEvent) => {
                    worker.removeEventListener('error', onError);
                    worker.removeEventListener('message', onMessage);

                    try {
                                
                        const { success, status, statusText, ok, data, error } = event.data;

                        if (success) {
                            resolve(data);
                        } else {
                            reject({ message: error });
                        }
                    } catch (error) {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject({ message: error });
                    }
                    

                    onComplete();
                    
                };
                worker.addEventListener('error', onError);
                worker.addEventListener('message', onMessage);

                worker.postMessage({ url, options: { ...options, signal: undefined } });
            });

        });
    }
}
