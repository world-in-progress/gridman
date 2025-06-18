import {
  FeatureProperty,
  FeatureUpdatePropertyBody,
} from "@/core/feature/types";
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
    featureProperty: FeatureProperty,
    featureJson: Record<string, any>,
    callback?: Callback<any>
  ) {
    this._actor.send(
      "saveFeature",
      {
        featureProperty,
        featureJson,
      },
      (err, result) => {
        if (callback) callback(err, { resource_path: result.resource_path });
      }
    );
  }

  public deleteFeature(id: string, callback?: Callback<void>) {
    this._actor.send("deleteFeature", { id }, (err, result) => {
      if (callback) callback(err, result);
    });
  }

  public updateFeatureProperty(
    id: string,
    featureProperty: FeatureUpdatePropertyBody,
    callback?: Callback<void>
  ) {
    this._actor.send(
      "updateFeatureProperty",
      { id, featureProperty },
      (err, result) => {
        if (callback) callback(err, result);
      }
    );
  }

  public getFeatureJson(feature_name: string, callback?: Callback<any>) {
    this._actor.send("getFeatureJson", { feature_name }, (err, result) => {
      if (callback) callback(err, { feature_json: result.feature_json });
    });
  }

  public setFeature(
    projectName: string,
    patchName: string,
    callback?: Callback<any>
  ) {
    this._actor.send(
      "setFeature",
      { projectName, patchName },
      (err, result) => {
        if (callback) callback(err, { feature_path: result.feature_path });
      }
    );
  }

  public getFeatureMeta(callback?: Callback<any>) {
    this._actor.send("getFeatureMeta", {}, (err, result) => {
      if (callback) callback(err, result.feature_meta);
    });
  }
}
