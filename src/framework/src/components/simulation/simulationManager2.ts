type Status = "pending" | "running" | "done" | "error"

export default class SimulationManager2 {
    private static instance: SimulationManager2
    private solutionName = ""
    private simulationName = ""
    private solutionAddress = ""
    private simulationAddress = ""
    private _workflowStatus: {
        name: string
        status: Status
        progress: number
    }[] = [
            {
                name: "createSolution",
                status: "pending",
                progress: 0,
            },
            {
                name: "createSimulation",
                status: "pending",
                progress: 0,
            },
            {
                name: "startSimulation",
                status: "pending",
                progress: 0,
            },
        ]
    private _simulationStatus: { status: Status; step: number } = {
        status: "pending",
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

    public static getInstance(): SimulationManager2 {
        if (!SimulationManager2.instance) {
            SimulationManager2.instance = new SimulationManager2()
        }
        return SimulationManager2.instance
    }

    public getAllStatus() {
        return {
            solutionName: this.solutionName,
            simulationName: this.simulationName,
            activeActionTypeList: this.activeActionTypeList,
            modelType: this.modelType,
            workflowStatus: this._workflowStatus,
            simulationStatus: this._simulationStatus,
        }
    }

    public reset() {
        this.solutionName = "";
        this.simulationName = "";
        this.solutionAddress = "";
        this.simulationAddress = "";
        this._workflowStatus = [
            { name: "createSolution", status: "pending", progress: 0 },
            { name: "createSimulation", status: "pending", progress: 0 },
            { name: "startSimulation", status: "pending", progress: 0 },
        ];
        this._simulationStatus = { status: "pending", step: 0 };
        this.actions = [];
        this.actionTypes = [];
        this.modelType = "";
        this.notifySubscribers()
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
        if (!this._workflowStatus || this._workflowStatus.length === 0) return 0
        for (let i = 0; i < this._workflowStatus.length; i++) {
            if (this._workflowStatus[i].status !== "done") {
                if (i === 0 || this._workflowStatus[i - 1].status === "done") {
                    return i
                }
            }
        }
        // 全部完成，返回最后一个的下一个
        return this._workflowStatus.length
    }

    public async createSolution(solutionName: string, modelType: string, actionTypes: string[]) {

        this._workflowStatus[0].status = "running"
        this._workflowStatus[0].progress = 0
        this.notifySubscribers()
        // 模拟进度
        await this.simulateProgress(0, 100, 30, (p) => {
            this._workflowStatus[0].progress = p
            this.notifySubscribers()
        })
        this.solutionName = solutionName
        this.modelType = modelType
        this.actionTypes = actionTypes
        this._workflowStatus[0].status = "done"
        this._workflowStatus[0].progress = 100
        this.notifySubscribers()
    }

    public async createSimulation(simulationName: string) {
        this._workflowStatus[1].status = "running"
        this._workflowStatus[1].progress = 0
        this.notifySubscribers()
        // 模拟进度
        await this.simulateProgress(0, 100, 20, (p) => {
            this._workflowStatus[1].progress = p
            this.notifySubscribers()
        })
        this.simulationName = simulationName
        this._workflowStatus[1].status = "done"
        this._workflowStatus[1].progress = 100
        this.notifySubscribers()
    }

    public async startSimulation() {
        this._workflowStatus[2].status = "running"
        this._workflowStatus[2].progress = 0
        this.notifySubscribers()
        await this.simulateProgress(0, 100, 10, (p) => {
            this._workflowStatus[2].progress = p
            this.notifySubscribers()
        })
        this._workflowStatus[2].status = "done"
        this._workflowStatus[2].progress = 100
        this.notifySubscribers()
        this.simulationProcess()
    }

    public async simulationProcess() {
        this._simulationStatus.status = "running"
        this._simulationStatus.step = 0
        this.notifySubscribers()
        const maxStep = 200
        while (
            (this._simulationStatus.status === "running" || this._simulationStatus.status === "done") &&
            this._simulationStatus.step < maxStep
        ) {
            await new Promise((resolve) => setTimeout(resolve, 100))
            this._simulationStatus.step++
            this.notifySubscribers()
        }
        this._simulationStatus.status = "done"
        this.notifySubscribers()
    }

    public async stopSimulation() {
        this._workflowStatus[0].status = "pending"
        this._workflowStatus[0].progress = 0
        this._workflowStatus[1].status = "pending"
        this._workflowStatus[1].progress = 0
        this._workflowStatus[2].status = "pending"
        this._workflowStatus[2].progress = 0
        this._simulationStatus.status = "pending"
        this._simulationStatus.step = 0
        this.notifySubscribers()
    }

    public async getSimulationResult(step: number) {
        // 模拟等待数据准备
        await new Promise((resolve) => setTimeout(resolve, 100))
        return `模拟结果数据 result.dat (step ${step})`
    }

    private async simulateProgress(start: number, end: number, steps: number, onProgress: (p: number) => void) {
        for (let i = 0; i <= steps; i++) {
            await new Promise((resolve) => setTimeout(resolve, 50))
            const p = Math.round(start + ((end - start) * i) / steps)
            onProgress(p)
        }
    }

    public addAction(action: { type: string; name: string; parameters: Record<string, any> }) {
        const newAction = {
            id: Date.now().toString(),
            ...action,
        }
        this.actions.push(newAction)
        return newAction.id
    }

    public updateAction(id: string, updates: Partial<{ type: string; name: string; parameters: Record<string, any> }>) {
        const index = this.actions.findIndex((action) => action.id === id)
        if (index !== -1) {
            this.actions[index] = { ...this.actions[index], ...updates }
        }
    }

    public deleteAction(id: string) {
        this.actions = this.actions.filter((action) => action.id !== id)
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
