type ReturnType = {
    err: Error | null;
    result: any;
};

type AsyncReturnType = Promise<ReturnType>;

export default class SchemaUtils {
    static async deleteSchema(schemaName: string): AsyncReturnType {
        const deleteAPI = `/api/grid/schema/${schemaName}`;
        const response = await fetch(deleteAPI, { method: 'DELETE' });
        if (!response.ok) {
            return {
                err: new Error(`删除模板失败! 状态码: ${response.status}`),
                result: null,
            };
        }

        const responseData = await response.json();
        return {
            err: null,
            result: responseData,
        };
    }

    static async getSchemaByName(schemaName: string): AsyncReturnType {
        const getAPI = `/api/grid/schema/${schemaName}`;
        const response = await fetch(getAPI);
        if (!response.ok) {
            return {
                err: new Error(`获取模板失败! 状态码: ${response.status}`),
                result: null,
            };
        }

        const responseData = await response.json();
        return {
            err: null,
            result: responseData,
        };
    }

    static async updateSchemaDescription(
        schemaName: string,
        description: string
    ): AsyncReturnType {
        const getAPI = `/api/grid/schema/${schemaName}`;
        const putAPI = `/api/grid/schema/${schemaName}`;

        // Step 1: Get schema
        const getResponse = await fetch(getAPI);
        if (!getResponse.ok) {
            return {
                err: new Error(`获取模板失败! 状态码: ${getResponse.status}`),
                result: null,
            };
        }

        const responseData = await getResponse.json();
        let schemaData;
        if (responseData.project_schema) {
            schemaData = { ...responseData.project_schema };
        } else {
            schemaData = { ...responseData };
        }
        schemaData.description = description;

        // Step 2: Update schema
        const putResponse = await fetch(putAPI, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(schemaData),
        });

        if (!putResponse.ok) {
            return {
                err: new Error(`更新描述失败! 状态码: ${putResponse.status}`),
                result: null,
            };
        }

        const updatedData = await putResponse.json();
        return {
            err: null,
            result: updatedData,
        };
    }

    static async updateSchemaStarred(
        schemaName: string,
        starred: boolean
    ): AsyncReturnType {
        const getAPI = `/api/grid/schema/${schemaName}`;
        const putAPI = `/api/grid/schema/${schemaName}`;

        // Step 1: Get schema
        const getResponse = await fetch(getAPI);
        if (!getResponse.ok) {
            return {
                err: new Error(`获取模板失败! 状态码: ${getResponse.status}`),
                result: null,
            };
        }

        const responseData = await getResponse.json();
        let schemaData;
        if (responseData.project_schema) {
            schemaData = { ...responseData.project_schema };
        } else {
            schemaData = { ...responseData };
        }
        schemaData.starred = starred;

        // Step 2: Update schema
        const putResponse = await fetch(putAPI, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(schemaData),
        });

        if (!putResponse.ok) {
            return {
                err: new Error(`更新星级失败! 状态码: ${putResponse.status}`),
                result: null,
            };
        }

        const updatedData = await putResponse.json();
        return {
            err: null,
            result: updatedData,
        };
    }

    static async fetchSchemas(
        startIndex: number,
        endIndex: number
    ): AsyncReturnType {
        const getAPI = `/api/grid/schemas/?startIndex=${startIndex}&endIndex=${endIndex}`;
        const numAPI = `/api/grid/schemas/num`;

        // Step 1: Get schemas
        const getResponse = await fetch(getAPI);
        if (!getResponse.ok) {
            return {
                err: new Error(`获取模板失败! 状态码: ${getResponse.status}`),
                result: null,
            };
        }

        const responseData = await getResponse.json();
        try {
            const countResponse = await fetch(numAPI);
            if (countResponse.ok) {
                const countText = await countResponse.text();
    
                try {
                    const countData = JSON.parse(countText);
    
                    if (typeof countData.count === 'number') {
                        responseData.total_count = countData.count;
                    } else if (typeof countData === 'number') {
                        responseData.total_count = countData;
                    } else if (countData && typeof countData.total === 'number') {
                        responseData.total_count = countData.total;
                    } else {
                        const possibleCountFields = Object.entries(countData).find(
                            ([key, value]) =>
                                typeof value === 'number' &&
                                (key.includes('count') ||
                                    key.includes('total') ||
                                    key.includes('num'))
                        );
    
                        if (possibleCountFields) {
                            responseData.total_count =
                                possibleCountFields[1] as number;
                        } else {
                            const numericValue = parseInt(countText.trim(), 10);
                            if (!isNaN(numericValue)) {
                                responseData.total_count = numericValue;
                            } else {
                                responseData.total_count =
                                    responseData.project_schemas.length;
                            }
                        }
                    }
                } catch (parseError) {
                    const numericValue = parseInt(countText.trim(), 10);
                    if (!isNaN(numericValue)) {
                        responseData.total_count = numericValue;
                    } else {
                        responseData.total_count =
                            responseData.project_schemas.length;
                    }
                }
            } else {
                responseData.total_count = responseData.project_schemas.length;
            }

        } catch (error) {
            responseData.total_count = responseData.project_schemas.length;
        }
        if (responseData.total_count < responseData.project_schemas.length) {
            responseData.total_count = responseData.project_schemas.length;
        }

        return {
            err: null,
            result: responseData,
        };
    }

    static async createSchema(schemaData: any): AsyncReturnType {
        const postAPI = `/api/grid/schema`;
        const response = await fetch(postAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(schemaData),
        });

        if (!response.ok) {
            return {
                err: new Error(`创建模板失败! 状态码: ${response.status}`),
                result: null,
            };
        }

        const responseData = await response.json();
        return {
            err: null,
            result: responseData,
        };
    }
}
