import Dispatcher from "@/core/message/dispatcher"; 
import { Callback } from "@/core/types";

export class RasterService {
    private language: string;
    private _dispatcher: Dispatcher;

    constructor(language: string) {
        this.language = language;
        this._dispatcher = new Dispatcher(this);
    }

    private get _actor() {
        return this._dispatcher.actor;
    }

    public saveRaster() {
        
    }
}