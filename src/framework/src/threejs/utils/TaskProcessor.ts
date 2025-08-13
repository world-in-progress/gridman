// 检查是否支持传输 ArrayBuffer
function canTransferArrayBuffer(): boolean {
    if (!TaskProcessor._canTransferArrayBuffer) {
        const worker = new Worker(URL.createObjectURL(new Blob([], { type: 'application/javascript' })));
        const value = 99;
        const array = new Int8Array([value]);

        try {
            worker.postMessage({ array }, [array.buffer]);
            TaskProcessor._canTransferArrayBuffer = true;
        } catch (e) {
            TaskProcessor._canTransferArrayBuffer = false;
        }

        worker.terminate();
    }

    return TaskProcessor._canTransferArrayBuffer;
}

// 创建 Worker
function createWorker(url: string): Worker {
    const uri = new URL(url);
    const isUri = uri.protocol !== '' && uri.hash === '';
    const moduleID = url.replace(/\.js$/, '');

    let workerPath: string;
    let crossOriginUrl: string | undefined;

    if (isCrossOriginUrl(url)) {
        crossOriginUrl = url;
    } else if (!isUri) {
        const moduleAbsoluteUrl = buildModuleUrl(`${TaskProcessor._workerModulePrefix}/${moduleID}.js`);

        if (isCrossOriginUrl(moduleAbsoluteUrl)) {
            crossOriginUrl = moduleAbsoluteUrl;
        }
    }

    if (crossOriginUrl) {
        const script = `import "${crossOriginUrl}";`;
        workerPath = URL.createObjectURL(new Blob([script], { type: 'application/javascript' }));
        return new Worker(workerPath, { type: 'module' });
    }

    workerPath = url;

    if (!isUri) {
        workerPath = buildModuleUrl(`${TaskProcessor._workerModulePrefix}/${moduleID}.js`);
    }

    if (!FeatureDetection.supportsEsmWebWorkers()) {
        throw new RuntimeError('This browser does not support ES Modules in Web Workers.');
    }

    return new Worker(workerPath, { type: 'module' });
}

// 任务完成事件
class Event {
    private listeners: Array<(arg?: any) => void> = [];

    public addListener(listener: (arg?: any) => void): void {
        this.listeners.push(listener);
    }

    public removeListener(listener: (arg?: any) => void): void {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }

    public raiseEvent(arg?: any): void {
        this.listeners.forEach((listener) => listener(arg));
    }
}

// 检查变量是否已定义
export function defined(value: any): boolean {
    return value !== undefined && value !== null;
}

// 销毁对象
function destroyObject(object: any): void {
    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            object[key] = undefined;
        }
    }
}

// 运行时错误
export class RuntimeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RuntimeError';
    }
}

// 构建模块 URL
function buildModuleUrl(modulePath: string): string {
    return `./${modulePath}`;
}

// 检查 URL 是否跨域
function isCrossOriginUrl(url: string): boolean {
    const origin = window.location.origin;
    return new URL(url).origin !== origin;
}

// 检测浏览器特性
export class FeatureDetection {
    static supportsEsmWebWorkers(): boolean {
        return 'Worker' in window && 'type' in Worker;
    }

    static supportsWebAssembly(): boolean {
        return typeof WebAssembly === 'object' && !!WebAssembly;
    }

    static hardwareConcurrency: number = navigator.hardwareConcurrency || 4; // 默认值为 4
}

const taskCompletedEvent = new Event();

// TaskProcessor 类
export class TaskProcessor {
    private _workerPath: string;
    private _maximumActiveTasks: number;
    private _activeTasks: number;
    private _nextID: number;
    private _worker?: Worker;
    private _webAssemblyPromise?: Promise<any>;

    constructor(workerPath: string, maximumActiveTasks: number = Number.POSITIVE_INFINITY) {
        this._workerPath = workerPath;
        this._maximumActiveTasks = maximumActiveTasks;
        this._activeTasks = 0;
        this._nextID = 0;
    }

    private createOnmessageHandler(id: number, resolve: (value: any) => void, reject: (reason?: any) => void): (event: MessageEvent) => void {
        const listener = (event: MessageEvent) => {
            const data = event.data;
            if (data.id !== id) {
                return;
            }

            if (defined(data.error)) {
                let error = data.error;
                if (error.name === 'RuntimeError') {
                    error = new RuntimeError(data.error.message);
                    error.stack = data.error.stack;
                } else if (error.name === 'DeveloperError') {
                    error = new RuntimeError(data.error.message);
                    error.stack = data.error.stack;
                } else if (error.name === 'Error') {
                    error = new Error(data.error.message);
                    error.stack = data.error.stack;
                }
                taskCompletedEvent.raiseEvent(error);
                reject(error);
            } else {
                taskCompletedEvent.raiseEvent();
                resolve(data.result);
            }

            this._worker?.removeEventListener('message', listener);
        };

        return listener;
    }

    private async runTask(parameters: any, transferableObjects: Transferable[] = []): Promise<any> {
        const canTransfer = canTransferArrayBuffer();
        if (!canTransfer) {
            transferableObjects.length = 0;
        }

        const id = this._nextID++;
        const promise = new Promise((resolve, reject) => {
            this._worker?.addEventListener('message', this.createOnmessageHandler(id, resolve, reject));
        });

        this._worker?.postMessage(
            {
                id: id,
                baseUrl: buildModuleUrl('').slice(0, -1), // Remove trailing slash
                parameters: parameters,
                canTransferArrayBuffer: canTransfer,
            },
            transferableObjects,
        );

        return promise;
    }

    public async scheduleTask(parameters: any, transferableObjects: Transferable[] = []): Promise<any> {
        if (!defined(this._worker)) {
            this._worker = createWorker(this._workerPath);
        }

        if (this._activeTasks >= this._maximumActiveTasks) {
            return undefined;
        }

        ++this._activeTasks;

        try {
            const result = await this.runTask(parameters, transferableObjects);
            --this._activeTasks;
            return result;
        } catch (error) {
            --this._activeTasks;
            throw error;
        }
    }

    /**
     * Posts a message to a web worker with configuration to initialize loading
     * and compiling a web assembly module asynchronously, as well as an optional
     * fallback JavaScript module to use if Web Assembly is not supported.
     *
     * @param {object} [webAssemblyOptions] An object with the following properties:
     * @param {string} [webAssemblyOptions.modulePath] The path of the web assembly JavaScript wrapper module.
     * @param {string} [webAssemblyOptions.wasmBinaryFile] The path of the web assembly binary file.
     * @param {string} [webAssemblyOptions.fallbackModulePath] The path of the fallback JavaScript module to use if web assembly is not supported.
     * @returns {Promise<*>} A promise that resolves to the result when the web worker has loaded and compiled the web assembly module and is ready to process tasks.
     *
     * @exception {RuntimeError} This browser does not support Web Assembly, and no backup module was provided
     */
    public async initWebAssemblyModule(webAssemblyOptions: { modulePath?: string; wasmBinaryFile?: string; fallbackModulePath?: string }): Promise<any> {
        if (defined(this._webAssemblyPromise)) {
            return this._webAssemblyPromise;
        }

        const init = async () => {
            const worker = (this._worker = createWorker(this._workerPath));
            const wasmConfig = await getWebAssemblyLoaderConfig(this, webAssemblyOptions);
            const canTransfer = await canTransferArrayBuffer();
            let transferableObjects: Transferable[] | undefined;
            const binary = wasmConfig.wasmBinary;
            if (defined(binary) && canTransfer) {
                transferableObjects = [binary];
            }

            const promise = new Promise((resolve, reject) => {
                worker.onmessage = (event: MessageEvent) => {
                    const data = event.data;
                    if (defined(data)) {
                        resolve(data.result);
                    } else {
                        reject(new RuntimeError('Could not configure wasm module'));
                    }
                };
            });

            worker.postMessage(
                {
                    canTransferArrayBuffer: canTransfer,
                    parameters: { webAssemblyConfig: wasmConfig },
                },
                transferableObjects,
            );

            return promise;
        };

        this._webAssemblyPromise = init();
        return this._webAssemblyPromise;
    }

    public isDestroyed(): boolean {
        return false;
    }

    public destroy(): void {
        if (defined(this._worker)) {
            this._worker.terminate();
        }
        destroyObject(this);
    }

    public static get taskCompletedEvent(): Event {
        return taskCompletedEvent;
    }

    public static _defaultWorkerModulePrefix = 'Workers/';
    public static _workerModulePrefix = TaskProcessor._defaultWorkerModulePrefix;
    public static _canTransferArrayBuffer: boolean | undefined;
}
