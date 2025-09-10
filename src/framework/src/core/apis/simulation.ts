import IAPI, { BaseResponse, SimulationEnv, DiscoverBaseResponse, GetSimulationResultBaseRequest, ProcessGroupMeta, SimulationResultMeta, SolutionMeta, StartSimulationMeta, StopSimulationMeta, WaterDataResponse, GetWaterDataMeta } from "./types";
import getPrefix, { getResourcePrefix } from './prefix'

const API_PREFIX = "/api/model/"

// Step 1: Create Solution: /api/solution/create
// export const createSolution: IAPI<SolutionMeta, BaseResponse> = {
//     api: `${API_PREFIX}`,
//     fetch: async (solution: SolutionMeta, isResource: boolean): Promise<BaseResponse> => {
//         try {
//             const api = getResourcePrefix(isResource) + createSolution.api + 'solution/create'
//             const response = await fetch(api, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(solution)
//             })

//             if (!response.ok) {
//                 throw new Error(`HTTP error! Status: ${response.status}`)
//             }

//             const responseData: BaseResponse = await response.json()
//             return responseData
//         } catch (error) {
//             throw new Error(`Failed to create solution: ${error}`)
//         }
//     }
// }

// Step 2: Discover: /api/proxy/discover
export const discoverProxy: IAPI<string, DiscoverBaseResponse> = {
    api: '/api/',
    fetch: async (node_key: string, isRemote: boolean): Promise<DiscoverBaseResponse> => {
        try {
            const api = getPrefix(isRemote) + discoverProxy.api + 'proxy/discover'
            const response = await fetch(api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ node_key })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: DiscoverBaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to discover proxy: ${error}`)
        }
    }
}

// Step 3: Clone package: /api/model/clone_package
export const clonePackage: IAPI<SimulationEnv, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (solution: SimulationEnv, isResource: boolean): Promise<BaseResponse> => {
        try {
            const api = getResourcePrefix(isResource) + clonePackage.api + 'clone_package'
            const response = await fetch(api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(solution)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to clone package: ${error}`)
        }
    }
}

// Step 4: Get Clone Progress: /api/model/clone_progress/{task_id}
export const cloneProgress: IAPI<string, string> = {
    api: `${API_PREFIX}`,
    fetch: async (task_id: string, isResource: boolean): Promise<string> => {
        try {
            const api = getResourcePrefix(isResource) + cloneProgress.api + 'clone_progress/' + task_id
            const response = await fetch(api, {
                method: 'GET',
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: string = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to get clone progress: ${error}`)
        }
    }
}

// Step 5: Create Simulation: /api/simulation/create
// export const createSimulation: IAPI<CreateSimulationMeta, BaseResponse> = {
//     api: `${API_PREFIX}`,
//     fetch: async (simulation: CreateSimulationMeta, isResource: boolean): Promise<BaseResponse> => {
//         try {
//             const api = getResourcePrefix(isResource) + createSimulation.api + 'simulation/create'
//             console.log(api)
//             const response = await fetch(api, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(simulation)
//             })

//             if (!response.ok) {
//                 throw new Error(`HTTP error! Status: ${response.status}`)
//             }

//             const responseData: BaseResponse = await response.json()
//             return responseData
//         } catch (error) {
//             throw new Error(`Failed to create simulation: ${error}`)
//         }
//     }
// }

// Step 6: Build Process Group: /api/model/build_process_group
export const buildProcessGroup: IAPI<ProcessGroupMeta, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (process_group: ProcessGroupMeta, isResource: boolean): Promise<BaseResponse> => {
        try {
            const api = getResourcePrefix(isResource) + buildProcessGroup.api + 'build_process_group'
            const response = await fetch(api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(process_group)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to build process group: ${error}`)
        }
    }
}

// Step 7: Start Simulation: /api/model/start_simulation
export const startSimulation: IAPI<StartSimulationMeta, string> = {
    api: `${API_PREFIX}`,
    fetch: async (simulation: StartSimulationMeta, isResource: boolean): Promise<string> => {
        try {
            const api = getResourcePrefix(isResource) + startSimulation.api + 'start_simulation'
            const response = await fetch(api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(simulation)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: string = (await response.json()).result
            return responseData
        } catch (error) {
            throw new Error(`Failed to start simulation: ${error}`)
        }
    }
}

// Step 8: Get Result: /api/simulation/step_result
export const getSimulationResult: IAPI<GetSimulationResultBaseRequest, BaseResponse> = {
    api: `/api/simulation/`,
    fetch: async (simulation: GetSimulationResultBaseRequest, isResource: boolean): Promise<BaseResponse> => {
        try {
            const api = getResourcePrefix(isResource) + getSimulationResult.api + 'step_result'
            const response = await fetch(api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(simulation)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const simulationResult: BaseResponse = await response.json()
            return simulationResult
        } catch (error) {
            throw new Error(`Failed to get simulation result: ${error}`)
        }
    }
}
// Step 9: Stop Simulation: /api/model/stop_simulation
export const stopSimulation: IAPI<StopSimulationMeta, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (simulation_env: StopSimulationMeta, isResource: boolean): Promise<BaseResponse> => {
        try {
            const api = getResourcePrefix(isResource) + stopSimulation.api + 'stop_simulation'
            const response = await fetch(api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(simulation_env)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to stop simulation: ${error}`)
        }
    }
}

export const getWaterData: IAPI<GetWaterDataMeta, WaterDataResponse> = {
    api: `/api/simulation/`,
    fetch: async (params: GetWaterDataMeta, isResource: boolean): Promise<WaterDataResponse> => {
        try {
            const api = getResourcePrefix(isResource) + getWaterData.api + `get_water_data/${params.simulation_name}/${params.step}`
            const response = await fetch(api, {
                method: 'GET',
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: WaterDataResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to get water data: ${error}`)
        }
    }
}