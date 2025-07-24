import SimulationPanel from "./simulationPanel";
import MapContainer from "../mapContainer/mapContainer";
import ActionPanel from "./actionPanel";
import { useState, useEffect } from "react";
import SimulationManager2 from "./simulationManager2";
import { useTranslation } from "react-i18next";

type TaskStatus = "pending" | "running" | "done" | "error"

// Control center
export default function Simulation() {
    const { t } = useTranslation("simulation")

    const simulationManager = SimulationManager2.getInstance()

    // Workflow UI state
    const [solutionName, setSolutionName] = useState("")
    const [simulationName, setSimulationName] = useState("")
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
    const [workflowStatus, setWorkflowStatus] = useState<{
        [key: string]: TaskStatus
    }>({
        createSolution: "pending",
        createSimulation: "pending",
        startSimulation: "pending",
        simulation: "pending",
    })
    const [workflowProgress, setWorkflowProgress] = useState<{
        [key: string]: number
    }>({
        createSolution: 0,
        createSimulation: 0,
        startSimulation: 0,
    })

    // Simulation UI state
    const [currentStep, setCurrentStep] = useState(0)

    // Action UI state
    const [actionTypes, setActionTypes] = useState<{ value: string; name: string; description: string }[]>([])

    // Subscribe to simulation manager
    useEffect(() => {
        console.log('init')
        // Distribute status to UI
        const updateAllStatus = () => {
            const status = simulationManager.getAllStatus()
            console.log("status", status)
            setSolutionName(status.solutionName)
            setSimulationName(status.simulationName)
            setCurrentTaskIndex(simulationManager.currentTask)
            setWorkflowStatus({
                createSolution: status.workflowStatus[0].status,
                createSimulation: status.workflowStatus[1].status,
                startSimulation: status.workflowStatus[2].status,
                simulation: status.simulationStatus.status,
            })
            setWorkflowProgress({
                createSolution: status.workflowStatus[0].progress,
                createSimulation: status.workflowStatus[1].progress,
                startSimulation: status.workflowStatus[2].progress,
            })
            setCurrentStep(status.simulationStatus.step)
            setActionTypes(status.activeActionTypeList)
        }

        const unsubscribe = simulationManager.subscribe(updateAllStatus)
        return () => {
            simulationManager.reset()
            unsubscribe()
        }
    }, [simulationManager])

    const createSolution = async (solutionName: string, modelType: string, actionTypes: string[]) => {
        await simulationManager.createSolution(solutionName, modelType, actionTypes)
    }

    const createSimulation = async (simulationName: string) => {
        await simulationManager.createSimulation(simulationName)
    }

    const startSimulation = async () => {
        await simulationManager.startSimulation()
    }

    const stopSimulation = async () => {
        await simulationManager.stopSimulation()
    }

    return (
        <div className="flex h-[96vh] w-full bg-slate-900">
            <SimulationPanel
                solutionName={solutionName}
                simulationName={simulationName}
                currentTaskIndex={currentTaskIndex}
                workflowStatus={workflowStatus}
                workflowProgress={workflowProgress}
                currentStep={currentStep}
                createSolution={createSolution}
                createSimulation={createSimulation}
                startSimulation={startSimulation}
                stopSimulation={stopSimulation}
            />
            <div className="flex-1 bg-slate-700 relative">
                <MapContainer node={null} style="w-full h-full" />
            </div>
            <ActionPanel actionTypes={actionTypes} />
        </div>
    );
}