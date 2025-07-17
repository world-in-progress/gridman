import IAPI, { BaseResponse, SimulationEnv, DiscoverBaseResponse, GetSimulationResultBaseRequest, ProcessGroupMeta, SimulationMeta, SimulationResultMeta, SolutionMeta } from "./types";
import { getResourcePrefix } from './prefix'

const API_PREFIX = "/api/"

// Step 1: Create Solution: /api/solution/create
export const createSolution: IAPI<SolutionMeta, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (solution: SolutionMeta, isResource: boolean): Promise<BaseResponse> => {
        try {
            const api = getResourcePrefix(isResource) + createSolution.api + 'solution/create'
            console.log(api)
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
            throw new Error(`Failed to create solution: ${error}`)
        }
    }
}

// Step 2: Discover: /api/proxy/discover
export const discoverProxy: IAPI<string, DiscoverBaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (node_key: string, isResource: boolean): Promise<DiscoverBaseResponse> => {
        try {
            const api = getResourcePrefix(isResource) + discoverProxy.api + 'proxy/discover'
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

// Step 3: Clone env: /api/model/clone_env
export const cloneEnv: IAPI<SimulationEnv, string> = {
    api: `${API_PREFIX}`,
    fetch: async (solution: SimulationEnv, isResource: boolean): Promise<string> => {
        try {
            const api = getResourcePrefix(isResource) + cloneEnv.api + 'model/clone_env'
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

            const responseData: string = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to clone env: ${error}`)
        }
    }
}

// Step 4: Build Process Group: /api/model/build_process_group
export const buildProcessGroup: IAPI<ProcessGroupMeta, string> = {
    api: `${API_PREFIX}`,
    fetch: async (process_group: ProcessGroupMeta, isResource: boolean): Promise<string> => {
        try {
            const api = getResourcePrefix(isResource) + buildProcessGroup.api + 'model/build_process_group'
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

            const responseData: string = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to build process group: ${error}`)
        }
    }
}

// Step 5: Start Simulation: /api/model/start_simulation
export const startSimulation: IAPI<SimulationMeta, string> = {
    api: `${API_PREFIX}`,
    fetch: async (simulation: SimulationMeta, isResource: boolean): Promise<string> => {
        try {
            const api = getResourcePrefix(isResource) + startSimulation.api + 'model/start_simulation'
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

            const responseData: string = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to start simulation: ${error}`)
        }
    }
}

// Step 6: Get Result: /api/simulation/result/{simulation_name}/{step}
export const getSimulationResult: IAPI<GetSimulationResultBaseRequest, SimulationResultMeta> = {
    api: `${API_PREFIX}`,
    fetch: async (request: GetSimulationResultBaseRequest, isResource: boolean): Promise<SimulationResultMeta> => {
        try {
            const api = getResourcePrefix(isResource) + getSimulationResult.api + 'simulation/result'
            const response = await fetch(`${api}/${request.simulation_name}/${request.step}`, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const simulationResult: SimulationResultMeta = await response.json()
            return simulationResult
        } catch (error) {
            throw new Error(`Failed to get simulation result: ${error}`)
        }
    }
}
// Step 7: Stop Simulation: /api/model/stop_simulation
export const stopSimulation: IAPI<SimulationEnv, string> = {
    api: `${API_PREFIX}`,
    fetch: async (simulation_env: SimulationEnv, isResource: boolean): Promise<string> => {
        try {
            const api = getResourcePrefix(isResource) + stopSimulation.api + 'model/stop_simulation'
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

            const responseData: string = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to stop simulation: ${error}`)
        }
    }
}