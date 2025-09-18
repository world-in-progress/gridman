export interface FeatureSaveBody {
	node_key: string;
	feature_json: Record<string, any>;
}

export interface FeatureUpdateBody {
	node_key: string
	data: {
		name: string
		type: string
		color: string
		epsg: string
		feature_json: Record<string, any>
	}
}

export interface FeatureUpdatePropertyBody {
	name: string;
	icon: string;
	symbology: string;
}

export interface FeatureSaveResponse {
	success: boolean;
	message: string;
	resource_path: string;
}

export interface FeatureGetJsonBody {
	feature_name: string;
}

export interface FeatureGetJsonResponse {
	success: boolean;
	message: string;
	feature_json: Record<string, any>;
}

export interface FeatureDataResponse {
	success: boolean;
	message: string;
	data: Record<string, any>;
}

export interface FeatureList {
	success: boolean;
	message: string;
	feature_list: string[];
}
