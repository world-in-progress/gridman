import RootScenarioNode from './scenario/root'
import TopoScenarioNode from './scenario/topo'
import DefaultPageContext from '@/core/context/default'
import DefaultScenarioNode from '@/core/scenario/default'
import SchemaScenarioNode, { SchemaPageContext } from './scenario/schema/schema'
import SchemasScenarioNode, { SchemasPageContext } from './scenario/schemas/schemas'
import PatchesScenarioNode, { PatchesPageContext } from './scenario/patches/patches'
import PatchScenarioNode, { PatchPageContext } from './scenario/patch/patch'
import IconScenarioNode from './scenario/icon'
import SettingsScenarioNode, { SettingsPageContext } from './scenario/settings/settings'
import SimulationScenarioNode, { SimulationPageContext } from './scenario/simulation/simulation'
import VectorsScenarioNode, { VectorsPageContext } from './scenario/vectors/vectors'
import GridsScenariNode, { GridsPageContext } from './scenario/grids/grids'
import DemsScenariNode, { DemsPageContext } from './scenario/dems/dems'

const _SCENARIO_NODE_REGISTRY: Record<string, typeof DefaultScenarioNode> = {
    [DefaultScenarioNode.classKey]: DefaultScenarioNode,
    [RootScenarioNode.classKey]: RootScenarioNode,
    [TopoScenarioNode.classKey]: TopoScenarioNode,
    [SchemasScenarioNode.classKey]: SchemasScenarioNode,
    [SchemaScenarioNode.classKey]: SchemaScenarioNode,
    [PatchesScenarioNode.classKey]: PatchesScenarioNode,
    [PatchScenarioNode.classKey]: PatchScenarioNode,
    [GridsScenariNode.classKey]: GridsScenariNode,
    [IconScenarioNode.classKey]: IconScenarioNode,
    [SettingsScenarioNode.classKey]: SettingsScenarioNode,
    [SimulationScenarioNode.classKey]: SimulationScenarioNode,
    [VectorsScenarioNode.classKey]: VectorsScenarioNode,
    [DemsScenariNode.classKey]: DemsScenariNode
}

const _SCENARIO_PAGE_CONTEXT_REGISTRY: Record<string, typeof DefaultPageContext> = {
    [DefaultScenarioNode.classKey]: DefaultPageContext,
    [SchemasScenarioNode.classKey]: SchemasPageContext,
    [SchemaScenarioNode.classKey]: SchemaPageContext,
    [PatchesScenarioNode.classKey]: PatchesPageContext,
    [PatchScenarioNode.classKey]: PatchPageContext,
    [GridsScenariNode.classKey]: GridsPageContext,
    [SettingsScenarioNode.classKey]: SettingsPageContext,
    [SimulationScenarioNode.classKey]: SimulationPageContext,
    [VectorsScenarioNode.classKey]: VectorsPageContext,
    [DemsScenariNode.classKey]: DemsPageContext
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