import IAPI, { BaseResponse, FeatureStatus, FeatureMeta } from "./types";
import {
	FeatureSaveBody,
	FeatureSaveResponse,
	FeatureGetJsonBody,
	FeatureGetJsonResponse,
	FeatureUpdatePropertyBody,
	FeatureDataResponse,
	FeatureUpdateBody,
} from "../feature/types";
import getPrefix from "./prefix";

const API_PREFIX = "/api/feature"

export const createFeature: IAPI<FeatureMeta, BaseResponse> = {
	api: `${API_PREFIX}`,
	fetch: async (featureMeta: FeatureMeta, isRemote: boolean): Promise<BaseResponse> => {
		try {
			const api = getPrefix(isRemote) + createFeature.api + '/create'
			const response = await fetch(api, {
				method: 'POST',
				body: JSON.stringify(featureMeta),
				headers: { 'Content-Type': 'application/json' }
			})

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseData: BaseResponse = await response.json();
			return responseData;
		} catch (error) {
			throw new Error(`Failed to create feature: ${error}`);
		}
	}
}

export const saveFeature: IAPI<FeatureSaveBody, FeatureSaveResponse> = {
	api: `${API_PREFIX}`,
	fetch: async (featureInfo: FeatureSaveBody, isRemote: boolean): Promise<FeatureSaveResponse> => {
		try {
			const api = getPrefix(isRemote) + saveFeature.api + '/save'
			const response = await fetch(api, {
				method: "POST",
				body: JSON.stringify(featureInfo),
				headers: { "Content-Type": "application/json" },
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseData: FeatureSaveResponse = await response.json()
			return responseData;
		} catch (error) {
			throw new Error(`Failed to save feature: ${error}`)
		}
	},
}

export const getFeatureData: IAPI<string, FeatureDataResponse> = {
	api: `${API_PREFIX}`,
	fetch: async (node_key: string, isRemote: boolean): Promise<FeatureDataResponse> => {
		try {
			const api = getPrefix(isRemote) + getFeatureData.api + `/${node_key}`
			const response = await fetch(api, { method: "GET" })
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseData: FeatureDataResponse = await response.json();
			return responseData;
		} catch (error) {
			throw new Error(`Failed to get feature data: ${error}`);
		}
	}
}

export const deleteFeature: IAPI<string, BaseResponse> = {
	api: `${API_PREFIX}`,
	fetch: async (node_key: string, isRemote: boolean): Promise<BaseResponse> => {
		try {
			const api = getPrefix(isRemote) + deleteFeature.api + `/${node_key}`
			const response = await fetch(api, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseData: BaseResponse = await response.json()
			return responseData
		} catch (error) {
			throw new Error(`Failed to delete feature: ${error}`);
		}
	},
}

export const updateFeature: IAPI<FeatureUpdateBody, BaseResponse> = {
	api: `${API_PREFIX}`,
	fetch: async (featureUpdateData: FeatureUpdateBody, isRemote: boolean): Promise<BaseResponse> => {
		try {
			const api = getPrefix(isRemote) + updateFeature.api + `/${featureUpdateData.node_key}`
			const response = await fetch(api, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(featureUpdateData.data),
			})
			
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseData: BaseResponse = await response.json()
			return responseData
		} catch (error) {
			throw new Error(`Failed to update feature: ${error}`);
		}
	}
}

export const updateFeatureProperty: IAPI<{ id: string; featureProperty: FeatureUpdatePropertyBody }, void> = {
	api: `${API_PREFIX}`,
	fetch: async (query: {
		id: string;
		featureProperty: FeatureUpdatePropertyBody;
	}): Promise<void> => {
		const response = await fetch(`${updateFeatureProperty.api}/${query.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(query.featureProperty),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const responseData: BaseResponse = await response.json();
		if (!responseData.success) {
			throw new Error(
				`Failed to update feature property: ${responseData.message}`
			);
		}
	},
};



export const setCurrentPatchFeature: IAPI<
	{ projectName: string; patchName: string },
	void
> = {
	api: `${API_PREFIX}/`,
	fetch: async (query: {
		projectName: string;
		patchName: string;
	}): Promise<void> => {
		try {
			const { projectName, patchName } = query;

			const response = await fetch(
				`${setCurrentPatchFeature.api}/${projectName}/${patchName}`,
				{ method: "GET" }
			);
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseData: BaseResponse = await response.json();
			if (!responseData.success) {
				throw new Error(
					`Failed to set current feature: ${responseData.message}`
				);
			}
		} catch (error) {
			throw new Error(`Failed to set current feature: ${error}`);
		}
	},
};

export const isFeatureReady: IAPI<void, boolean> = {
	api: `${API_PREFIX}`,
	fetch: async (): Promise<boolean> => {
		try {
			const response = await fetch(isFeatureReady.api, { method: "GET" });
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseData: FeatureStatus = await response.json();
			return responseData.is_ready;
		} catch (error) {
			throw new Error(`Failed to check feature readiness: ${error}`);
		}
	},
};

export const getFeatureMeta: IAPI<void, FeatureMeta> = {
	api: `${API_PREFIX}/meta`,
	fetch: async (): Promise<FeatureMeta> => {
		const response = await fetch(getFeatureMeta.api, { method: "GET" });
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const responseData: FeatureMeta = await response.json();
		return responseData;
	},
};

export const getFeatureJsonComputation: IAPI<string, FeatureGetJsonResponse> = {
	api: `${API_PREFIX}`,
	fetch: async (node_key: string, isRemote: boolean): Promise<FeatureGetJsonResponse> => {
		try {
			const api = getPrefix(isRemote) + getFeatureJsonComputation.api + `/feature_json_computation/${node_key}`
			const response = await fetch(api, { method: "GET" })

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const responseData: FeatureGetJsonResponse = await response.json();
			return responseData;
		} catch (error) {
			throw new Error(`Failed to get feature json computation: ${error}`);
		}
	}
}