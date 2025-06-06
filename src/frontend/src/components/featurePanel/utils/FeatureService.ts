import Dispatcher from "@/core/message/dispatcher";
import { Callback } from "@/core/types";

export class FeatureService {
  private language: string;
  private _dispatcher: Dispatcher;

  constructor(language: string) {
    this.language = language;
    this._dispatcher = new Dispatcher(this);
  }

  private get _actor() {
    return this._dispatcher.actor;
  }

  public saveFeature(
    feature_name: string,
    feature_type: string,
    feature_json: Record<string, any>,
    callback?: Callback<any>
  ) {
    this._actor.send(
      "saveFeature",
      { feature_name, feature_type, feature_json },
      (err, result) => {
        if (callback) callback(err, { resource_path: result.resource_path });
      }
    );
  }

  public getFeatureJson(
    feature_name: string,
    feature_type: string,
    callback?: Callback<any>
  ) {
    this._actor.send(
      "getFeatureJson",
      { feature_name, feature_type },
      (err, result) => {
        if (callback) callback(err, { feature_json: result.feature_json });
      }
    );
  }
}

