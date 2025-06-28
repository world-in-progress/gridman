import Dispatcher from '@/core/message/dispatcher'
import { Callback } from '@/core/types'
import { SceneMeta } from '@/core/apis/types'

export class SceneService {
    private _dispatcher: Dispatcher;

    constructor() {
        this._dispatcher = new Dispatcher(this);
    }

    private get _actor() {
        return this._dispatcher.actor;
    }

    public getSceneMeta(
        node_key: string,
        callback: Callback<SceneMeta>
    ) {
        this._actor.send(
            'getSceneMeta',
            {node_key, child_start_index: 0, child_end_index: 10000},
            (error: Error | null | undefined, result: SceneMeta) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, result);
                }
            }
        );
    }
}