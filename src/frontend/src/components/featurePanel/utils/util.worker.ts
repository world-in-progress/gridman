import * as api from "@/core/apis/apis";
import { FeatureSaveResponse } from "@/core/feature/types";
import { Callback, WorkerSelf } from "@/core/types";

export async function saveFeature(
  this: WorkerSelf,
  params: {
    feature_name: string;
    feature_type: string;
    feature_json: Record<string, any>;
  },
  callback: Callback<any>
) {
  const { feature_name, feature_type, feature_json } = params;
  try {
    const response = await api.feature.operation.saveFeature.fetch({
      feature_name,
      feature_type,
      feature_json,
    });

    callback(null, {
      resource_path: response.resource_path,
    } as FeatureSaveResponse);
  } catch (error) {
    callback(new Error(`保存要素失败! 错误信息: ${error}`), null);
  }
}

export async function getFeatureJson(
  this: WorkerSelf,
  params: { feature_name: string; feature_type: string },
  callback: Callback<any>
) {
  const { feature_name, feature_type } = params;
  try {
    const response = await api.feature.operation.getFeatureJson.fetch({
      feature_name,
      feature_type,
    });

    callback(null, {
      feature_json: response,
    });
  } catch (error) {
    callback(new Error(`获取要素失败! 错误信息: ${error}`), null);
  }
}

