import GridManager from "../grid/NHGridManager";
import { GridContext, MultiGridBaseInfo } from "../grid/types";
import { Callback, WorkerSelf } from "../types";
import ProjectUtils from "../../components/projectPanel/utils/util.worker";
import SchemaUtils from "../../components/schemaPanel/utils/util.worker";
import GridUtils from "../grid/util.worker";

export function checkIfReady(
    this: WorkerSelf,
    _: unknown,
    callback: Callback<any>
) {
    callback();
}

export function init(
    this: WorkerSelf & Record<"nodeManager", GridManager>,
    context: GridContext,
    callback: Callback<any>
) {
    this.nodeManager = new GridManager(context);
    callback();
}

export function updateGridContext(
    this: WorkerSelf & Record<"nodeManager", GridManager>,
    context: GridContext,
    callback: Callback<any>
) {
    this.nodeManager.context = context;
    callback();
}

export async function parseTopology(
    this: WorkerSelf & Record<"nodeManager", GridManager>,
    storageId_gridInfo_cache: Array<number>,
    callback: Callback<any>
) {
    callback(null, this.nodeManager.parseTopology(storageId_gridInfo_cache));
}

export async function calcEdgeRenderInfos(
    this: WorkerSelf & Record<"nodeManager", GridManager>,
    edgeInfos: { index: number; keys: string[] },
    callback: Callback<any>
) {
    const { index: actorIndex, keys: edgeKeys } = edgeInfos;
    callback(null, {
    actorIndex,
    vertexBuffer: this.nodeManager.getEdgeRenderInfos(edgeKeys),
    });
}

export async function createSchema(
    this: WorkerSelf,
    schemaData: any,
    callback: Callback<any>
) {
    const { err, result } = await SchemaUtils.createSchema(schemaData);
    callback(err, result);
}

export async function fetchSchemas(
    this: WorkerSelf,
    params: { startIndex: number; endIndex: number },
    callback: Callback<any>
) {
    const { startIndex, endIndex } = params;
    const { err, result } = await SchemaUtils.fetchSchemas(startIndex, endIndex);
    callback(err, result);
}

export async function updateSchemaStarred(
    this: WorkerSelf,
    params: { name: string; starred: boolean },
    callback: Callback<any>
) {
    const { name, starred } = params;
    const { err, result } = await SchemaUtils.updateSchemaStarred(name, starred);
    callback(err, result);
}
export async function updateSchemaDescription(
    this: WorkerSelf,
    params: { name: string; description: string },
    callback: Callback<any>
) {
    const { name, description } = params;
    const { err, result } = await SchemaUtils.updateSchemaDescription(
    name,
    description
    );
    callback(err, result);
}

export async function getSchemaByName(
    this: WorkerSelf,
    schemaName: string,
    callback: Callback<any>
) {
    const { err, result } = await SchemaUtils.getSchemaByName(schemaName);
    callback(err, result);
}

export async function fetchProjects(
    this: WorkerSelf,
    params: { startIndex: number; endIndex: number },
    callback: Callback<any>
) {
    const { startIndex, endIndex } = params;
    const { err, result } = await ProjectUtils.fetchProjects(
    startIndex,
    endIndex
    );
    callback(err, result);
}

export async function getProjectByName(
    this: WorkerSelf,
    projectName: string,
    callback: Callback<any>
) {
    const { err, result } = await ProjectUtils.getProjectByName(projectName);
    callback(err, result);
}

export async function updateProjectStarred(
    this: WorkerSelf,
    params: { name: string; starred: boolean },
    callback: Callback<any>
) {
    const { name, starred } = params;
    const { err, result } = await ProjectUtils.updateProjectStarred(
    name,
    starred
    );
    callback(err, result);
}

export async function updateProjectDescription(
    this: WorkerSelf,
    params: { name: string; description: string },
    callback: Callback<any>
) {
    const { name, description } = params;
    const { err, result } = await ProjectUtils.updateProjectDescription(
    name,
    description
    );
    callback(err, result);
}

export async function createProject(
    this: WorkerSelf,
    projectData: any,
    callback: Callback<any>
) {
    const { err, result } = await ProjectUtils.createProject(projectData);
    callback(err, result);
}

export async function deleteSchema(
    this: WorkerSelf,
    schemaName: string,
    callback: Callback<any>
) {
    const { err, result } = await SchemaUtils.deleteSchema(schemaName);
    callback(err, result);
}

export async function deleteProject(
    this: WorkerSelf,
    projectName: string,
    callback: Callback<any>
) {
    const { err, result } = await ProjectUtils.deleteProject(projectName);
    callback(err, result);
}

export async function fetchPatches(
    this: WorkerSelf,
    params: { projectName: string },
    callback: Callback<any>
) {
    const { err, result } = await ProjectUtils.fetchPatches(
    params.projectName
    );
    callback(err, result);
}

export async function createPatch(
    this: WorkerSelf,
    PatchData: any,
    callback: Callback<any>
) {
    const { err, result } = await ProjectUtils.createPatch(PatchData);
    callback(err, result);
}

export async function updatePatchStarred(
    this: WorkerSelf,
    params: { projectName: string; patchName: string; starred: boolean },
    callback: Callback<any>
) {
    const { projectName, patchName, starred } = params;
    const { err, result } = await ProjectUtils.updatePatchStarred(
        projectName,
        patchName,
        starred
    );
    callback(err, result);
}

export async function updatePatchDescription(
    this: WorkerSelf,
    params: { projectName: string; patchName: string; description: string },
    callback: Callback<any>
) {
    const { projectName, patchName, description } = params;
    const { err, result } = await ProjectUtils.updatePatchDescription(
        projectName,
        patchName,
        description
    );
    callback(err, result);
}

export async function setPatch(
    this: WorkerSelf,
    {
        projectName,
        patchName,
    }: { projectName: string; patchName: string },
    callback: Callback<any>
) {
    const { err, result } = await ProjectUtils.setPatch(
    projectName,
    patchName
    );
    callback(err, result);
}

export function setGridManager(
    this: WorkerSelf & Record<"gridManager", GridManager>,
    context: GridContext,
    callback: Callback<any>
) {
    GridUtils.setGridManager(this, context);
    callback();
}

export async function getGridInfo(
    this: WorkerSelf & Record<"gridManager", GridManager>,
    _: any,
    callback: Callback<any>
) {
    const renderInfo = await GridUtils.getGridInfo(this);
    callback(null, renderInfo);
}

export async function subdivideGrids(
    this: WorkerSelf & Record<"gridManager", GridManager>,
    gridInfo: { levels: Uint8Array; globalIds: Uint32Array },
    callback: Callback<any>
) {
    const renderInfo = await GridUtils.subdivideGrids(this, gridInfo);
    callback(null, renderInfo);
}

export async function mergeGrids(
    this: WorkerSelf & Record<"gridManager", GridManager>,
    gridInfo: { levels: Uint8Array; globalIds: Uint32Array },
    callback: Callback<any>
) {
    const renderInfo = await GridUtils.mergeGrids(this, gridInfo);
    callback(null, renderInfo);
}

export async function removeGrids(
    gridInfo: { levels: Uint8Array; globalIds: Uint32Array },
    callback: Callback<any>
) {
    await GridUtils.removeGrids(gridInfo);
    callback();
}

export async function recoverGrids(
    gridInfo: { levels: Uint8Array; globalIds: Uint32Array },
    callback: Callback<any>
) {
    await GridUtils.recoverGrids(gridInfo);
    callback();
}

export async function getGridInfoByFeature(
    path: string,
    callback: Callback<any>
) {
    const result = await GridUtils.getGridInfoByFeature(path);
    callback(null, {
        levels: result.levels,
        globalIds: result.globalIds
    });
}

export async function saveGrids(_: any, callback: Callback<any>) {
    const result = await GridUtils.saveGrids();
    callback(null, result);
}

export async function getMultiGridRenderVertices(
    this: WorkerSelf & Record<"gridManager", GridManager>,
    gridInfo: MultiGridBaseInfo, 
    callback: Callback<any>
) {
    const result = GridUtils.getMultiGridRenderVertices(this, gridInfo.levels, gridInfo.globalIds);
    callback(null, result);
}