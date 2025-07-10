import DefaultScenarioNode, { DefaultPageContext } from './scenario/default'
import RootScenarioNode from './scenario/root'
import TopoScenarioNode from './scenario/topo'
import SchemaScenarioNode, { SchemaPageContext } from './scenario/schema/schema'
import SchemasScenarioNode, { SchemasPageContext } from './scenario/schemas/schemas'
import PatchesScenarioNode, { PatchesPageContext } from './scenario/patches/patches'
import PatchScenarioNode, { PatchPageContext } from './scenario/patch/patch'

const _SCENARIO_NODE_REGISTRY: Record<string, typeof DefaultScenarioNode> = {
    [DefaultScenarioNode.classKey]: DefaultScenarioNode,
    [RootScenarioNode.classKey]: RootScenarioNode,
    [TopoScenarioNode.classKey]: TopoScenarioNode,
    [SchemasScenarioNode.classKey]: SchemasScenarioNode,
    [SchemaScenarioNode.classKey]: SchemaScenarioNode,
    [PatchesScenarioNode.classKey]: PatchesScenarioNode,
    [PatchScenarioNode.classKey]: PatchScenarioNode,
}

const _SCENARIO_PAGE_CONTEXT_REGISTRY: Record<string, typeof DefaultPageContext> = {
    [DefaultScenarioNode.classKey]: DefaultPageContext,
    [SchemasScenarioNode.classKey]: SchemasPageContext,
    [SchemaScenarioNode.classKey]: SchemaPageContext,
    [PatchesScenarioNode.classKey]: PatchesPageContext,
    [PatchScenarioNode.classKey]: PatchPageContext,
}

export const SCENARIO_NODE_REGISTRY = new Proxy(_SCENARIO_NODE_REGISTRY, {
    get(target, prop: string) {
        return target[prop] || DefaultScenarioNode
    }
})

export const SCENARIO_PAGE_CONTEXT_REGISTRY = new Proxy(_SCENARIO_PAGE_CONTEXT_REGISTRY, {
    get(target, prop: string) {
        return target[prop] || DefaultPageContext
    }
})