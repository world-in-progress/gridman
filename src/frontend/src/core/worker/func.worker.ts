import GridManager from '../grid/NHGridManager';
import { SubdivideRules } from '../grid/NHGrid';
import { Callback, WorkerSelf } from '../types';

export function checkIfReady(
  this: WorkerSelf,
  _: unknown,
  callback: Callback<any>
) {
  callback();
}

export function init(
  this: WorkerSelf & Record<'nodeManager', GridManager>,
  subdivideRules: SubdivideRules,
  callback: Callback<any>
) {
  this.nodeManager = new GridManager(subdivideRules);
  callback();
}

export function updateSubdividerules(
  this: WorkerSelf & Record<'nodeManager', GridManager>,
  subdivideRules: SubdivideRules,
  callback: Callback<any>
) {
  this.nodeManager.subdivideRules = subdivideRules;
  callback();
}

export async function subdivideGrid(
  this: WorkerSelf & Record<'nodeManager', GridManager>,
  [level, globalId]: [level: number, globalId: number],
  callback: Callback<any>
) {
  callback(null, this.nodeManager.subdivideGrid(level, globalId));
}

export async function subdivideGrids(
  this: WorkerSelf & Record<'nodeManager', GridManager>,
  subdivideInfos: Array<[level: number, globalId: number]>,
  callback: Callback<any>
) {
  callback(null, this.nodeManager.subdivideGrids(subdivideInfos));
}

export async function parseTopology(
  this: WorkerSelf & Record<'nodeManager', GridManager>,
  storageId_gridInfo_cache: Array<number>,
  callback: Callback<any>
) {
  callback(null, this.nodeManager.parseTopology(storageId_gridInfo_cache));
}

export async function calcEdgeRenderInfos(
  this: WorkerSelf & Record<'nodeManager', GridManager>,
  edgeInfos: { index: number; keys: string[] },
  callback: Callback<any>
) {
  const { index: actorIndex, keys: edgeKeys } = edgeInfos;
  callback(null, {
    actorIndex,
    vertexBuffer: this.nodeManager.getEdgeRenderInfos(edgeKeys),
  });
}

export async function initializeGrid(
  this: WorkerSelf,
  jsonData: any,
  callback: Callback<any>
) {
  if (!jsonData) {
    callback(new Error('No JSON data provided'), false);
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/grid/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    callback(null, responseData);
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function createSchema(
  this: WorkerSelf,
  schemaData: any,
  callback: Callback<any>
) {
  if (!schemaData) {
    callback(new Error('无数据提供'), false);
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schemaData),
    });

    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    const responseData = await response.json();
    
    if (responseData && responseData.success === false) {
      throw new Error(responseData.message || '创建Schema失败');
    }

    callback(null, responseData);
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function fetchSchemas(
  this: WorkerSelf,
  params: { startIndex: number; endIndex: number },
  callback: Callback<any>
) {
  try {
    const { startIndex, endIndex } = params;
    const response = await fetch(
      `http://localhost:8000/schemas/?startIndex=${startIndex}&endIndex=${endIndex}`
    );

    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    const responseData = await response.json();
    try {
      const countResponse = await fetch('http://localhost:8000/schemas/num');

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
              responseData.total_count = possibleCountFields[1] as number;
            } else {
              const numericValue = parseInt(countText.trim(), 10);
              if (!isNaN(numericValue)) {
                responseData.total_count = numericValue;
              } else {
                responseData.total_count = responseData.grid_schemas.length;
              }
            }
          }
        } catch (parseError) {
          const numericValue = parseInt(countText.trim(), 10);
          if (!isNaN(numericValue)) {
            responseData.total_count = numericValue;
          } else {
            responseData.total_count = responseData.grid_schemas.length;
          }
        }
      } else {
        responseData.total_count = responseData.grid_schemas.length;
      }
    } catch (error) {
      responseData.total_count = responseData.grid_schemas.length;
    }
    if (responseData.total_count < responseData.grid_schemas.length) {
      responseData.total_count = responseData.grid_schemas.length;
    }

    callback(null, responseData);
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function updateSchemaStarred(
  this: WorkerSelf,
  params: { name: string; starred: boolean },
  callback: Callback<any>
) {
  if (!params || !params.name) {
    callback(new Error('Invalid schema name'), false);
    return;
  }

  try {
    const { name, starred } = params;

    const getResponse = await fetch(`http://localhost:8000/schema/${name}`);

    if (!getResponse.ok) {
      throw new Error(
        `Failed to get schema! Status code: ${getResponse.status}`
      );
    }

    const responseData = await getResponse.json();

    let schemaData;
    if (responseData.grid_schema) {
      schemaData = { ...responseData.grid_schema };
    } else {
      schemaData = { ...responseData };
    }

    schemaData.starred = starred;

    const putResponse = await fetch(`http://localhost:8000/schema/${name}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schemaData),
    });

    if (!putResponse.ok) {
      throw new Error(
        `Failed to update starred status! Status code: ${putResponse.status}`
      );
    }

    const updatedData = await putResponse.json();
    callback(null, updatedData);
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function updateSchemaDescription(
  this: WorkerSelf,
  params: { name: string; description: string },
  callback: Callback<any>
) {
  if (!params || !params.name) {
    callback(new Error('无效的模板名称'), false);
    return;
  }

  try {
    const { name, description } = params;

    const getResponse = await fetch(`http://localhost:8000/schema/${name}`);

    if (!getResponse.ok) {
      throw new Error(`获取模板失败! 状态码: ${getResponse.status}`);
    }

    const responseData = await getResponse.json();

    let schemaData;
    if (responseData.grid_schema) {
      schemaData = { ...responseData.grid_schema };
    } else {
      schemaData = { ...responseData };
    }

    schemaData.description = description;

    const putResponse = await fetch(`http://localhost:8000/schema/${name}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schemaData),
    });

    if (!putResponse.ok) {
      throw new Error(`更新描述失败! 状态码: ${putResponse.status}`);
    }

    const updatedData = await putResponse.json();
    callback(null, updatedData);
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function getSchemaByName(
  this: WorkerSelf,
  params: { name: string },
  callback: Callback<any>
) {

  if (!params || !params.name) {
    console.error('[Worker] 无效的模板名称');
    callback(new Error('无效的模板名称'), false);
    return;
  }

  try {
    const { name } = params;

    const response = await fetch(`http://localhost:8000/schema/${name}`);

    if (!response.ok) {
      const errorMsg = `获取模板失败! 状态码: ${response.status}`;
      console.error('[Worker]', errorMsg);
      throw new Error(errorMsg);
    }

    const responseData = await response.json();
    callback(null, responseData);
  } catch (error) {
    console.error('[Worker] 获取模板出错:', error);
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function fetchProjects(
  this: WorkerSelf,
  params: { startIndex: number; endIndex: number },
  callback: Callback<any>
) {
  try {
    const { startIndex, endIndex } = params;
    const response = await fetch(
      `http://localhost:8000/project-metas/?startIndex=${startIndex}&endIndex=${endIndex}`
    );

    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    const responseData = await response.json();
    try {
      const countResponse = await fetch('http://localhost:8000/project-metas/num');

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
              responseData.total_count = possibleCountFields[1] as number;
            } else {
              const numericValue = parseInt(countText.trim(), 10);
              if (!isNaN(numericValue)) {
                responseData.total_count = numericValue;
              } else {
                responseData.total_count = responseData.project_metas.length;
              }
            }
          }
        } catch (parseError) {
          const numericValue = parseInt(countText.trim(), 10);
          if (!isNaN(numericValue)) {
            responseData.total_count = numericValue;
          } else {
            responseData.total_count = responseData.project_metas.length;
          }
        }
      } else {
        responseData.total_count = responseData.project_metas.length;
      }
    } catch (error) {
      responseData.total_count = responseData.project_metas.length;
    }
    if (responseData.total_count < responseData.project_metas.length) {
      responseData.total_count = responseData.project_metas.length;
    }

    callback(null, responseData);
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function getProjectByName(
  this: WorkerSelf,
  params: { name: string },
  callback: Callback<any>
) {
  console.log('[Worker] getProjectByName 被调用，参数:', params);

  if (!params || !params.name) {
    console.error('[Worker] 无效的模板名称');
    callback(new Error('无效的模板名称'), false);
    return;
  }

  try {
    const { name } = params;

    const response = await fetch(`http://localhost:8000/project-meta/${name}`);

    if (!response.ok) {
      const errorMsg = `获取模板失败! 状态码: ${response.status}`;
      throw new Error(errorMsg);
    }

    const responseData = await response.json();
    console.log('[Worker] 获取到响应数据:', responseData);
    callback(null, responseData);
  } catch (error) {
    console.error('[Worker] 获取模板出错:', error);
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function updateProjectStarred(
  this: WorkerSelf,
  params: { name: string; starred: boolean },
  callback: Callback<any>
) {
  if (!params || !params.name) {
    callback(new Error('Invalid project name'), false);
    return;
  }

  try {
    const { name, starred } = params;

    const getResponse = await fetch(`http://localhost:8000/project-meta/${name}`);

    if (!getResponse.ok) {
      throw new Error(
        `Failed to get project! Status code: ${getResponse.status}`
      );
    }

    const responseData = await getResponse.json();

    let projectData;
    if (responseData.project_meta) {
      projectData = { ...responseData.project_meta };
    } else {
      projectData = { ...responseData };
    }

    projectData.starred = starred;

    const putResponse = await fetch(`http://localhost:8000/project-meta/${name}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!putResponse.ok) {
      throw new Error(
        `Failed to update project starred status! Status code: ${putResponse.status}`
      );
    }

    const updatedData = await putResponse.json();
    callback(null, updatedData);
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function updateProjectDescription(
  this: WorkerSelf,
  params: { name: string; description: string },
  callback: Callback<any>
) {
  if (!params || !params.name) {
    callback(new Error('无效的项目名称'), false);
    return;
  }

  try {
    const { name, description } = params;

    const getResponse = await fetch(`http://localhost:8000/project-meta/${name}`);

    if (!getResponse.ok) {
      throw new Error(`获取项目失败! 状态码: ${getResponse.status}`);
    }

    const responseData = await getResponse.json();

    let projectData;
    if (responseData.project_meta) {
      projectData = { ...responseData.project_meta };
    } else {
      projectData = { ...responseData };
    }

    projectData.description = description;

    const putResponse = await fetch(`http://localhost:8000/project-meta/${name}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!putResponse.ok) {
      throw new Error(`更新项目描述失败! 状态码: ${putResponse.status}`);
    }

    const updatedData = await putResponse.json();
    callback(null, updatedData);
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function createProject(
  this: WorkerSelf,
  projectData: any,
  callback: Callback<any>
) {
  if (!projectData) {
    callback(new Error('无数据提供'), false);
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/project-meta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    const responseData = await response.json();

    callback(null, responseData);
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function deleteSchema(
  this: WorkerSelf,
  params: { name: string },
  callback: Callback<any>
) {
  if (!params || !params.name) {
    callback(new Error('无效的模板名称'), false);
    return;
  }

  try {
    const { name } = params;
    const response = await fetch(`http://localhost:8000/schema/${name}`, {
      method: 'DELETE',
    });

    // 尝试解析响应为 JSON
    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      console.error('解析响应 JSON 失败:', jsonError);
      // 如果 JSON 解析失败，但状态码正常，假定成功
      if (response.ok) {
        callback(null, { success: true, message: '操作成功' });
      } else {
        callback(new Error(`删除模板失败! 状态码: ${response.status}`), false);
      }
      return;
    }

    if (!response.ok) {
      // 接口返回错误，尝试根据响应体格式提取错误信息
      if (responseData.detail) {
        // 格式为 { detail: "错误信息" }
        callback(null, { success: false, detail: responseData.detail });
      } else if (responseData.message) {
        // 格式为 { success: false, message: "错误信息" }
        callback(null, responseData);
      } else {
        // 其他未知格式，直接返回状态码错误
        callback(null, { success: false, detail: `删除模板失败! 状态码: ${response.status}` });
      }
      return;
    }

    // 请求成功，返回响应数据（可能包含 success 和 message 字段）
    if (responseData.success !== undefined) {
      // 已经有 success 字段
      callback(null, responseData);
    } else {
      // 没有 success 字段，添加它
      callback(null, { ...responseData, success: true });
    }
  } catch (error) {
    console.error('删除模板时发生错误:', error);
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}