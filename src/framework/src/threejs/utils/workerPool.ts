import { generateUUID } from './MathUtils';

export interface IDisposable {
    /**
     * Releases all held resources
     */
    dispose(): void;
}

interface WorkerInfo {
    workerPromise: Promise<Worker>;
    idle: boolean;
    timeoutId?: ReturnType<typeof setTimeout>;
    actionId: string;
    cancelAction: boolean; // 添加一个标志，用于取消当前正在执行的 action
}

/**
 * Helper class to push actions to a pool of workers.
 */
export class WorkerPool implements IDisposable {
    protected _workerInfos: Array<WorkerInfo>;
    protected _pendingActions = new Map<string, (worker: Worker, onComplete: () => void) => void>(); // 使用 Map 存储 actionId 和 action
    protected _actionIdCounter = 0; // 用于生成唯一的 actionId

    /**
     * Constructor
     * @param workers Array of workers to use for actions
     */
    constructor(workers: Array<Worker>) {
        this._workerInfos = workers.map((worker) => ({
            workerPromise: Promise.resolve(worker),
            idle: true,
            actionId: '',
            cancelAction: false, // 初始化 cancelAction 标志
        }));
    }

    /**
     * Terminates all workers and clears any pending actions.
     */
    public dispose(): void {
        for (const workerInfo of this._workerInfos) {
            workerInfo.workerPromise.then((worker) => {
                worker.terminate();
            });
        }

        this._workerInfos.length = 0;
        this._pendingActions.clear();
    }

    /**
     * Pushes an action to the worker pool. If all the workers are active, the action will be
     * pended until a worker has completed its action.
     * @param action The action to perform. Call onComplete when the action is complete.
     * @returns A unique actionId that can be used to cancel the action.
     */
    public push(action: (worker: Worker, onComplete: () => void) => void): string {
        const actionId = this._generateActionId(); // 生成唯一的 actionId
        if (!this._executeOnIdleWorker(actionId, action)) {
            this._pendingActions.set(actionId, action);
        }
        return actionId;
    }

    /**
     * Cancels an action by its actionId.
     * @param actionId The unique actionId returned by the push method.
     */
    public cancel(actionId: string): void {
        if (this._pendingActions.has(actionId)) {
            this._pendingActions.delete(actionId); // 从待处理队列中移除 action
        }

        // 遍历所有 worker，检查是否有正在执行的 action 可以取消
        for (const workerInfo of this._workerInfos) {
            if (workerInfo.cancelAction) {
                workerInfo.cancelAction = true; // 设置取消标志
                workerInfo.workerPromise.then((worker) => {
                    worker.terminate(); // 终止当前 worker
                });
            }
        }
    }

    /**
     * Generates a unique actionId.
     * @returns A unique actionId.
     */
    protected _generateActionId(): string {
        return generateUUID(); // 使用 uuid 生成唯一的 actionId
    }

    /**
     * Executes an action on an idle worker.
     * @param actionId The unique actionId for the action.
     * @param action The action to perform.
     * @returns True if an idle worker was found and the action was executed, false otherwise.
     */
    protected _executeOnIdleWorker(actionId: string, action: (worker: Worker, onComplete: () => void) => void): boolean {
        for (const workerInfo of this._workerInfos) {
            if (workerInfo.idle) {
                this._execute(workerInfo, actionId, action);
                return true;
            }
        }

        return false;
    }

    /**
     * Executes an action on a worker.
     * @param workerInfo The worker info.
     * @param actionId The unique actionId for the action.
     * @param action The action to perform.
     */
    protected _execute(workerInfo: WorkerInfo, actionId: string, action: (worker: Worker, onComplete: () => void) => void): void {
        workerInfo.idle = false;
        workerInfo.actionId = actionId;
        workerInfo.cancelAction = false; // 重置取消标志
        workerInfo.workerPromise.then((worker) => {
            action(worker, () => {
                if (workerInfo.cancelAction) {
                    worker.terminate(); // 如果设置了取消标志，终止当前 worker
                } else {
                    this._pendingActions.delete(actionId); // 从待处理队列中移除已完成的 action
                    const nextActionEntry = this._pendingActions.entries().next().value;
                    if (nextActionEntry) {
                        const [nextActionId, nextAction] = nextActionEntry;
                        this._execute(workerInfo, nextActionId, nextAction);
                    } else {
                        workerInfo.actionId = '';
                        workerInfo.idle = true;
                    }
                }
            });
        });
    }
}

/**
 * Options for AutoReleaseWorkerPool
 */
export interface AutoReleaseWorkerPoolOptions {
    /**
     * Idle time elapsed before workers are terminated.
     */
    idleTimeElapsedBeforeRelease: number;
}

/**
 * Similar to the WorkerPool class except it creates and destroys workers automatically with a maximum of `maxWorkers` workers.
 * Workers are terminated when it is idle for at least `idleTimeElapsedBeforeRelease` milliseconds.
 */
export class AutoReleaseWorkerPool extends WorkerPool {
    /**
     * Default options for the constructor.
     * Override to change the defaults.
     */
    public static DefaultOptions: AutoReleaseWorkerPoolOptions = {
        idleTimeElapsedBeforeRelease: 1000,
    };

    private readonly _maxWorkers: number;
    private readonly _createWorkerAsync: () => Promise<Worker>;
    private readonly _options: AutoReleaseWorkerPoolOptions;

    constructor(maxWorkers: number, createWorkerAsync: () => Promise<Worker>, options = AutoReleaseWorkerPool.DefaultOptions) {
        super([]);

        this._maxWorkers = maxWorkers;
        this._createWorkerAsync = createWorkerAsync;
        this._options = options;
    }

    public override push(action: (worker: Worker, onComplete: () => void) => void): string {
        const actionId = this._generateActionId(); // 生成唯一的 actionId
        if (!this._executeOnIdleWorker(actionId, action)) {
            if (this._workerInfos.length < this._maxWorkers) {
                const workerInfo: WorkerInfo = {
                    workerPromise: this._createWorkerAsync(),
                    idle: false,
                    actionId: actionId,
                    cancelAction: false, // 初始化取消标志
                };
                this._workerInfos.push(workerInfo);
                this._execute(workerInfo, actionId, action);
            } else {
                this._pendingActions.set(actionId, action);
            }
        }
        return actionId;
    }

    protected override _execute(workerInfo: WorkerInfo, actionId: string, action: (worker: Worker, onComplete: () => void) => void): void {
        // Reset the idle timeout.
        if (workerInfo.timeoutId) {
            clearTimeout(workerInfo.timeoutId);
            delete workerInfo.timeoutId;
        }

        super._execute(workerInfo, actionId, (worker, onComplete) => {
            action(worker, () => {
                onComplete();

                if (workerInfo.idle) {
                    // Schedule the worker to be terminated after the elapsed time.
                    workerInfo.timeoutId = setTimeout(() => {
                        workerInfo.workerPromise.then((worker) => {
                            worker.terminate();
                        });

                        const indexOf = this._workerInfos.indexOf(workerInfo);
                        if (indexOf !== -1) {
                            this._workerInfos.splice(indexOf, 1);
                        }
                    }, this._options.idleTimeElapsedBeforeRelease);
                }
            });
        });
    }
}
