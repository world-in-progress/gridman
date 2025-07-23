import * as apis from '@/core/apis/apis'

type Status = 'pending' | 'running' | 'done' | 'error';

export default class SimulationManager {
    private static instance: SimulationManager;
    private solutionName: string = "";
    private simulationName: string = "";
    private solutionAddress: string = "";
    private simulationAddress: string = "";
    private _workflowStatus: {
        name: string;
        status: Status;
        progress: number;
    }[] = [{
        name: "createSolution",
        status: 'pending',
        progress: 0,
    }, {
        name: "createSimulation",
        status: 'pending',
        progress: 0,
    }, {
        name: "startSimulation",
        status: 'pending',
        progress: 0,
    }];
    private _simulationStatus: { status: Status; step: number } = {
        status: 'pending',
        step: 0,
    }

    private actions: { id: string; type: string; name: string; parameters: Record<string, any> }[] = []
    private actionTypes: string[] = []
    private modelType: string = ""

    private actionTypeList: {
        value: string
        name: string
        description: string
        param_schema: Record<string, any>
    }[] = []
    private modelTypeList: {
        group_type: string
        description: string
        processes: {
            name: string
            parameters: {
                name: string
                type: string
            }[]
        }[]
    }[] = []

    private updateCallbacks: Set<() => void> = new Set()

    private constructor() {
        this.initActionTypeList()
        this.initModelTypeList()
    }

    public static getInstance(): SimulationManager {
        if (!SimulationManager.instance) {
            SimulationManager.instance = new SimulationManager();
        }
        return SimulationManager.instance;
    }

    public getAllStatus() {
        return {
            solutionName: this.solutionName,
            simulationName: this.simulationName,
            actionTypes: this.activeActionTypeList,
            modelType: this.modelType,
            workflowStatus: this._workflowStatus,
            simulationStatus: this._simulationStatus,
        }
    }

    public subscribe(callback: () => void) {
        this.updateCallbacks.add(callback)
        return () => {
            this.updateCallbacks.delete(callback)
        }
    }

    private notifySubscribers() {
        this.updateCallbacks.forEach(callback => callback())
    }

    public get currentTask() {
        if (!this._workflowStatus || this._workflowStatus.length === 0) return 0;
        for (let i = 0; i < this._workflowStatus.length; i++) {
            if (this._workflowStatus[i].status !== 'done') {
                if (i === 0 || this._workflowStatus[i - 1].status === 'done') {
                    return i;
                }
            }
        }
        // 全部完成，返回最后一个的下一个
        return this._workflowStatus.length;
    }

    public async createSolution(solutionName: string, modelType: string, actionTypes: string[]) {
        this._workflowStatus[0].status = 'running';
        this._workflowStatus[0].progress = 0;
        this.notifySubscribers()
        // Step 1: Create Solution
        const createSolutionRes = await apis.simulation.createSolution.fetch(
            {
                name: solutionName.trim(),
                env: {
                    ne_path: "E:/test_data/ne.txt",
                    ns_path: "E:/test_data/ns.txt",
                    inp_path: "E:/test_data/0610.inp",
                    rainfall_path: "E:/test_data/test_rain.csv",
                    gate_path: "E:/test_data/max_gate7_ne.txt",
                    tide_path: "E:/test_data/test_tide.csv",
                },
            },
            true
        );
        if (createSolutionRes.success === false) {
            console.error(createSolutionRes.message);
            return;
        }
        this.solutionName = solutionName;
        this.modelType = modelType
        this.actionTypes = actionTypes
        const nodeKey = createSolutionRes.message;

        // Step 2: Discover
        const discoverRes = await apis.simulation.discoverProxy.fetch(nodeKey, true);
        if (discoverRes.success === false) {
            console.error(discoverRes.message);
            return;
        }
        this.solutionAddress = discoverRes.address;
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Step 3: Clone Env
        const taskId = await apis.simulation.cloneEnv.fetch(
            {
                solution_name: this.solutionName,
                solution_address: this.solutionAddress,
            },
            false
        );
        console.log(taskId);
        await this.waitForCloneProgress(taskId);
        this._workflowStatus[0].status = 'done';
        this._workflowStatus[0].progress = 100;
        this.notifySubscribers()
    }

    public async createSimulation(simulationName: string) {
        this._workflowStatus[1].status = 'running';
        this._workflowStatus[1].progress = 0;
        this.notifySubscribers()
        const createSimulationRes = await apis.simulation.createSimulation.fetch({
            name: simulationName,
            solution_name: this.solutionName,
        }, true);
        if (createSimulationRes.success === false) {
            console.error(createSimulationRes.message);
            return;
        }
        this.simulationName = simulationName;
        const nodeKey = createSimulationRes.message;
        const discoverRes = await apis.simulation.discoverProxy.fetch(nodeKey, true);
        if (discoverRes.success === false) {
            console.error(discoverRes.message);
            return;
        }
        this.simulationAddress = discoverRes.address;
        await new Promise(resolve => setTimeout(resolve, 3000));
        const buildProcessGroupRes = await apis.simulation.buildProcessGroup.fetch({
            solution_name: this.solutionName,
            simulation_name: this.simulationName,
            group_type: "flood_pipe",
            solution_address: this.solutionAddress,
        }, false);
        if (buildProcessGroupRes.result !== 'success') {
            console.error('Failed to build process group');
            return;
        }

        this._workflowStatus[1].status = 'done';
        this._workflowStatus[1].progress = 100;
        this.notifySubscribers()
    }

    public async startSimulation() {
        this._workflowStatus[2].status = 'running';
        this._workflowStatus[2].progress = 0;
        this.notifySubscribers()
        const startSimulationRes = await apis.simulation.startSimulation.fetch({
            solution_name: this.solutionName,
            simulation_name: this.simulationName,
            simulation_address: this.simulationAddress,
        }, false);
        if (startSimulationRes !== 'started') {
            console.error('Failed to start simulation');
            return;
        }
        this._workflowStatus[2].status = 'done';
        this._workflowStatus[2].progress = 100;
        this.notifySubscribers()
        this.simulationProcess();
    }

    public async simulationProcess() {
        this._simulationStatus.status = 'running';
        this._simulationStatus.step = 0;
        this.notifySubscribers()
        while (true) {
            if ((this._simulationStatus.status as Status) === 'pending') {
                return;
            }
            const step = this._simulationStatus.step;
            const res = await apis.simulation.getSimulationResult.fetch({
                simulation_name: this.simulationName,
                step: step,
            }, true);
            if (res.is_ready) {
                this._simulationStatus.step = step + 1;
                this.notifySubscribers()
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this._simulationStatus.status = 'done';
        this.notifySubscribers()
    }

    public async stopSimulation() {
        const stopSimulationRes = await apis.simulation.stopSimulation.fetch({
            solution_name: this.solutionName,
            simulation_name: this.simulationName,
        }, false);
        if (stopSimulationRes !== 'stopped') {
            console.error('Failed to stop simulation');
            return;
        }
        this._workflowStatus[0].status = 'pending';
        this._workflowStatus[0].progress = 0;
        this._workflowStatus[1].status = 'pending';
        this._workflowStatus[1].progress = 0;
        this._workflowStatus[2].status = 'pending';
        this._workflowStatus[2].progress = 0;
        this._simulationStatus.status = 'pending';
        this._simulationStatus.step = 0;
        this.notifySubscribers()
    }

    public async getSimulationResult(step: number) {
        while (true) {
            const res = await apis.simulation.getSimulationResult.fetch({
                simulation_name: this.simulationName,
                step: step,
            }, true);
            if (res.is_ready) {
                return res.files["result.dat"];
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    private async waitForCloneProgress(taskId: string): Promise<void> {
        while (true) {
            try {
                const res = await apis.simulation.cloneProgress.fetch(taskId, false);
                const progress = parseInt(res);
                this._workflowStatus[0].progress = progress;
                this.notifySubscribers()
                console.log(progress);
                if (progress === 100) {
                    break;
                }
            } catch (e) {
                console.error(e);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    
    private initActionTypeList() {
        //TODO: get from backend
        this.actionTypeList = [
            {
                value: "add_fence",
                name: "添加基围",
                description: "绘制区域以添加基围结构修改网格属性",
                param_schema: {
                    fields: {
                        elevation_delta: {
                            required: false,
                            type: "float",
                            optional: true,
                        },
                        landuse_type: {
                            required: false,
                            type: "enum",
                            enum_options: ["pond", "fence", "drain", "dam"],
                            optional: true,
                        },
                        feature: {
                            required: true,
                            type: "object",
                            format: "geojson",
                        },
                    },
                    required: ["feature"],
                },
            },
            {
                value: "transfer_water",
                name: "调水",
                description: "指定两个网格进行水量调配",
                param_schema: {
                    fields: {
                        from_grid: {
                            required: true,
                            type: "int",
                        },
                        to_grid: {
                            required: true,
                            type: "int",
                        },
                        q: {
                            required: true,
                            type: "float",
                        },
                    },
                    required: ["from_grid", "to_grid", "q"],
                },
            },
            {
                value: "add_gate",
                name: "添加闸门",
                description: "绘制区域以添加闸门结构并指定闸门高度和上下游网格",
                param_schema: {
                    fields: {
                        ud_stream: {
                            required: true,
                            type: "int",
                        },
                        gate_height: {
                            required: true,
                            type: "int",
                        },
                        feature: {
                            required: true,
                            type: "object",
                            format: "geojson",
                        },
                    },
                    required: ["ud_stream", "gate_height", "feature"],
                },
            },
        ]
    }

    private async initModelTypeList() {
        //TODO: get from backend
        this.modelTypeList = [
            {
                group_type: "flood_pipe",
                description: "洪水-管道联合模拟",
                processes: [
                    {
                        name: "flood",
                        parameters: [
                            {
                                name: "ne",
                                type: "str",
                            },
                            {
                                name: "ns",
                                type: "str",
                            },
                            {
                                name: "inp",
                                type: "str",
                            },
                            {
                                name: "rainfall",
                                type: "str",
                            },
                            {
                                name: "gate",
                                type: "str",
                            },
                            {
                                name: "tide",
                                type: "str",
                            },
                        ],
                    },
                    {
                        name: "pipe",
                        parameters: [
                            {
                                name: "inp",
                                type: "str",
                            },
                        ],
                    },
                ],
            },
        ]
    }

    public getActionTypeList() {
        return this.actionTypeList.map((actionType) => {
            return {
                value: actionType.value,
                name: actionType.name,
                description: actionType.description,
            }
        })
    }

    public getModelTypeList() {
        return this.modelTypeList.map((modelType) => {
            return {
                value: modelType.group_type,
                name: modelType.description,
            }
        })
    }

    public getModelParamsByType(groupType: string) {
        const modelType = this.modelTypeList.find((model) => model.group_type === groupType)
        return modelType ? modelType.processes : []
    }

    public get activeActionTypeList() {
        return this.getActionTypeList().filter((actionType) => this.actionTypes.includes(actionType.value))
    }
}
