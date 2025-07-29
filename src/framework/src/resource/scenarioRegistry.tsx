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
import LumsScenariNode, { LumsPageContext } from './scenario/lums/lums'
import VectorScenarioNode, { VectorPageContext } from './scenario/vector/vector'
import LumScenarioNode, { LumPageContext } from './scenario/lum/lum'
import DemScenarioNode, { DemPageContext } from './scenario/dem/dem'
import SolutionsScenariNode, { SolutionsPageContext } from './scenario/solutions/solutions'
import GatesScenariNode, { GatesPageContext } from './scenario/gates/gates'
import InpsScenariNode, { InpsPageContext } from './scenario/inps/inps'
import RainfallsScenariNode, { RainfallsPageContext } from './scenario/rainfalls/rainfalls'
import TidesScenariNode, { TidesPageContext } from './scenario/tides/tides'

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
    [VectorScenarioNode.classKey]: VectorScenarioNode,
    [DemsScenariNode.classKey]: DemsScenariNode,
    [DemScenarioNode.classKey]: DemScenarioNode,
    [LumsScenariNode.classKey]: LumsScenariNode,
    [LumScenarioNode.classKey]: LumScenarioNode,
    [SolutionsScenariNode.classKey]: SolutionsScenariNode,
    [GatesScenariNode.classKey]: GatesScenariNode,
    [InpsScenariNode.classKey]: InpsScenariNode,
    [RainfallsScenariNode.classKey]: RainfallsScenariNode,
    [TidesScenariNode.classKey]: TidesScenariNode,
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
    [VectorScenarioNode.classKey]: VectorPageContext,
    [DemsScenariNode.classKey]: DemsPageContext,
    [DemScenarioNode.classKey]: DemPageContext,
    [LumsScenariNode.classKey]: LumsPageContext,
    [LumScenarioNode.classKey]: LumPageContext,
    [SolutionsScenariNode.classKey]: SolutionsPageContext,
    [GatesScenariNode.classKey]: GatesPageContext,
    [InpsScenariNode.classKey]: InpsPageContext,
    [RainfallsScenariNode.classKey]: RainfallsPageContext,
    [TidesScenariNode.classKey]: TidesPageContext
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