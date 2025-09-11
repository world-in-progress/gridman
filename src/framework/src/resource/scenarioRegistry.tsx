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
import LumsScenarioNode, { LumsPageContext } from './scenario/lums/lums'
import VectorScenarioNode, { VectorPageContext } from './scenario/vector/vector'
import LumScenarioNode, { LumPageContext } from './scenario/lum/lum'
import DemScenarioNode, { DemPageContext } from './scenario/dem/dem'
import SolutionsScenariNode, { SolutionsPageContext } from './scenario/solutions/solutions'
import GatesScenariNode, { GatesPageContext } from './scenario/gates/gates'
import InpsScenariNode, { InpsPageContext } from './scenario/inps/inps'
import RainfallsScenariNode, { RainfallsPageContext } from './scenario/rainfalls/rainfalls'
import TidesScenariNode, { TidesPageContext } from './scenario/tides/tides'
import GridScenarioNode, { GridPageContext } from './scenario/grid/grid'
import SolutionScenarioNode, { SolutionPageContext } from './scenario/solution/solution'
import SimulationsScenarioNode, { SimulationsPageContext } from './scenario/simulations/simulations'
import RainfallScenarioNode, { RainfallPageContext } from './scenario/rainfall/rainfall'
import TideScenarioNode, { TidePageContext } from './scenario/tide/tide'
import InpScenariNode, { InpPageContext } from './scenario/inp/inp'
import GateScenarioNode, { GatePageContext } from './scenario/gate/gate'

const _SCENARIO_NODE_REGISTRY: Record<string, typeof DefaultScenarioNode> = {
    [DefaultScenarioNode.classKey]: DefaultScenarioNode,
    [RootScenarioNode.classKey]: RootScenarioNode,
    [TopoScenarioNode.classKey]: TopoScenarioNode,
    [SchemasScenarioNode.classKey]: SchemasScenarioNode,
    [SchemaScenarioNode.classKey]: SchemaScenarioNode,
    [PatchesScenarioNode.classKey]: PatchesScenarioNode,
    [PatchScenarioNode.classKey]: PatchScenarioNode,
    [GridsScenariNode.classKey]: GridsScenariNode,
    [GridScenarioNode.classKey]: GridScenarioNode,
    [IconScenarioNode.classKey]: IconScenarioNode,
    [SettingsScenarioNode.classKey]: SettingsScenarioNode,
    [SimulationsScenarioNode.classKey]: SimulationsScenarioNode,
    [SimulationScenarioNode.classKey]: SimulationScenarioNode,
    [VectorsScenarioNode.classKey]: VectorsScenarioNode,
    [VectorScenarioNode.classKey]: VectorScenarioNode,
    [DemsScenariNode.classKey]: DemsScenariNode,
    [DemScenarioNode.classKey]: DemScenarioNode,
    [LumsScenarioNode.classKey]: LumsScenarioNode,
    [LumScenarioNode.classKey]: LumScenarioNode,
    [SolutionsScenariNode.classKey]: SolutionsScenariNode,
    [SolutionScenarioNode.classKey]: SolutionScenarioNode,
    [GatesScenariNode.classKey]: GatesScenariNode,
    [GateScenarioNode.classKey]: GateScenarioNode,
    [InpsScenariNode.classKey]: InpsScenariNode,
    [InpScenariNode.classKey]: InpScenariNode,
    [RainfallsScenariNode.classKey]: RainfallsScenariNode,
    [RainfallScenarioNode.classKey]: RainfallScenarioNode,
    [TidesScenariNode.classKey]: TidesScenariNode,
    [TideScenarioNode.classKey]: TideScenarioNode,
}

const _SCENARIO_PAGE_CONTEXT_REGISTRY: Record<string, typeof DefaultPageContext> = {
    [DefaultScenarioNode.classKey]: DefaultPageContext,
    [SchemasScenarioNode.classKey]: SchemasPageContext,
    [SchemaScenarioNode.classKey]: SchemaPageContext,
    [PatchesScenarioNode.classKey]: PatchesPageContext,
    [PatchScenarioNode.classKey]: PatchPageContext,
    [GridsScenariNode.classKey]: GridsPageContext,
    [GridScenarioNode.classKey]: GridPageContext,
    [SettingsScenarioNode.classKey]: SettingsPageContext,
    [SimulationsScenarioNode.classKey]: SimulationsPageContext,
    [SimulationScenarioNode.classKey]: SimulationPageContext,
    [VectorsScenarioNode.classKey]: VectorsPageContext,
    [VectorScenarioNode.classKey]: VectorPageContext,
    [DemsScenariNode.classKey]: DemsPageContext,
    [DemScenarioNode.classKey]: DemPageContext,
    [LumsScenarioNode.classKey]: LumsPageContext,
    [LumScenarioNode.classKey]: LumPageContext,
    [SolutionsScenariNode.classKey]: SolutionsPageContext,
    [SolutionScenarioNode.classKey]: SolutionPageContext,
    [GatesScenariNode.classKey]: GatesPageContext,
    [GateScenarioNode.classKey]: GatePageContext,
    [InpsScenariNode.classKey]: InpsPageContext,
    [InpScenariNode.classKey]: InpPageContext,
    [RainfallsScenariNode.classKey]: RainfallsPageContext,
    [RainfallScenarioNode.classKey]: RainfallPageContext,
    [TidesScenariNode.classKey]: TidesPageContext,
    [TideScenarioNode.classKey]: TidePageContext
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