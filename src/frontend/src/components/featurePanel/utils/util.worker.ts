import * as api from "@/core/apis/apis";
import {
  FeatureProperty,
  FeatureSaveResponse,
  FeatureUpdatePropertyBody,
} from "@/core/feature/types";
import { Callback, WorkerSelf } from "@/core/types";

export async function saveFeature(
  this: WorkerSelf,
  params: {
    featureProperty: FeatureProperty;
    featureJson: Record<string, any>;
  },
  callback: Callback<any>
) {
  const { featureProperty, featureJson } = params;
  try {
    const response = await api.feature.saveFeature.fetch({
      feature_property: featureProperty,
      feature_json: featureJson,
    });

    callback(null, {
      resource_path: response.resource_path,
    } as FeatureSaveResponse);
  } catch (error) {
    callback(new Error(`保存要素失败! 错误信息: ${error}`), null);
  }
}

export async function deleteFeature(
  this: WorkerSelf,
  params: { id: string },
  callback: Callback<void>
) {
  const { id } = params;
  try {
    await api.feature.deleteFeature.fetch({ id });
    callback(null, null);
  } catch (error) {
    callback(new Error(`删除要素失败! 错误信息: ${error}`), null);
  }
}

export async function updateFeatureProperty(
  this: WorkerSelf,
  params: { id: string; featureProperty: FeatureUpdatePropertyBody },
  callback: Callback<void>
) {
  const { id, featureProperty } = params;
  try {
    await api.feature.updateFeatureProperty.fetch({ id, featureProperty });
    callback(null, null);
  } catch (error) {
    callback(new Error(`更新要素属性失败! 错误信息: ${error}`), null);
  }
}

export async function getFeatureJson(
  this: WorkerSelf,
  params: { feature_name: string },
  callback: Callback<any>
) {
  const { feature_name } = params;
  try {
    const response = await api.feature.getFeatureJson.fetch({
      feature_name,
    });

    callback(null, {
      feature_json: response,
    });
  } catch (error) {
    callback(new Error(`获取要素失败! 错误信息: ${error}`), null);
  }
}

export async function setFeature(
  this: WorkerSelf,
  params: { projectName: string; patchName: string },
  callback: Callback<any>
) {
  const { projectName, patchName } = params;
  try {
    // Step 1: Set current feature
    await api.feature.setCurrentPatchFeature.fetch({
      projectName,
      patchName,
    });

    // Step 2: Poll until feature is ready
    while (true) {
      const isReady = await api.feature.isFeatureReady.fetch();
      if (isReady) break;
      setTimeout(() => {}, 1000);
    }

    // Step 3: Get feature info
    const featureMeta = await api.feature.getFeatureMeta.fetch();
    callback(null, featureMeta);
  } catch (error) {
    callback(new Error(`设置要素失败! 错误信息: ${error}`), null);
  }
}

export async function getFeatureMeta(
  this: WorkerSelf,
  params: {},
  callback: Callback<any>
) {
  try {
    const response = await api.feature.getFeatureMeta.fetch();
    callback(null, response);
  } catch (error) {
    callback(new Error(`获取要素列表失败! 错误信息: ${error}`), null);
  }
}
