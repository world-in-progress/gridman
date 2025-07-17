import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Play, Square } from "lucide-react"
import MapContainer from "../mapContainer/mapContainer"

interface WorkflowStep {
    id: string
    title: string
    completed: boolean
    value: string
    placeholder: string
}

export default function Simulation() {
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
        {
            id: "solution",
            title: "Create Solution",
            completed: false,
            value: "",
            placeholder: "Enter solution name",
        },
        {
            id: "simulation",
            title: "Create Simulation",
            completed: false,
            value: "",
            placeholder: "Enter simulation name",
        },
        {
            id: "start",
            title: "Start Simulation",
            completed: false,
            value: "",
            placeholder: "Confirm to start",
        },
    ])

    const [simulationProgress, setSimulationProgress] = useState(0)
    const [currentStep, setCurrentStep] = useState(0)
    const [maxSteps] = useState(200)
    const [isRunning, setIsRunning] = useState(false)
    const [dialogOpen, setDialogOpen] = useState<string | null>(null)
    const [inputValue, setInputValue] = useState("")

    const handleStepClick = (stepId: string, index: number) => {
        // Check if previous steps are completed
        if (index > 0 && !workflowSteps[index - 1].completed) {
            return
        }

        setDialogOpen(stepId)
        setInputValue(workflowSteps[index].value)
    }

    const handleStepConfirm = () => {
        if (!dialogOpen || !inputValue.trim()) return

        const stepIndex = workflowSteps.findIndex((step) => step.id === dialogOpen)
        if (stepIndex === -1) return

        const updatedSteps = [...workflowSteps]
        updatedSteps[stepIndex] = {
            ...updatedSteps[stepIndex],
            completed: true,
            value: inputValue.trim(),
        }

        setWorkflowSteps(updatedSteps)
        setDialogOpen(null)
        setInputValue("")
    }

    const startSimulation = () => {
        // Interface for simulation start logic
        setIsRunning(true)
        console.log("Starting simulation...")
        // TODO: Implement actual simulation logic
    }

    const stopSimulation = () => {
        // Interface for simulation termination logic
        setIsRunning(false)
        setSimulationProgress(0)
        setCurrentStep(0)

        // Clear workflow
        const clearedSteps = workflowSteps.map((step) => ({
            ...step,
            completed: false,
            value: "",
        }))
        setWorkflowSteps(clearedSteps)

        console.log("Simulation terminated and workflow cleared")
        // TODO: Implement actual termination logic
    }

    const updateProgress = (progress: number) => {
        // Interface for external progress updates
        setSimulationProgress(progress)
        setCurrentStep(Math.floor((progress / 100) * maxSteps))
    }

    const canStartSimulation = workflowSteps.slice(0, 2).every((step) => step.completed)

    return (
        <div className="flex h-[96vh] w-full bg-slate-900 text-white">
            {/* Left Sidebar */}
            <div className="w-80 bg-slate-800 p-6 flex flex-col">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-white">Flood Simulation System</h1>
                </div>

                {/* Model Workflow */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 text-white">Model Workflow</h2>
                    <div className="space-y-4">
                        {workflowSteps.map((step, index) => (
                            <div key={step.id} className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center ${step.completed
                                                ? "bg-green-500"
                                                : index === 0 || workflowSteps[index - 1]?.completed
                                                    ? "bg-green-500"
                                                    : "bg-slate-600"
                                            }`}
                                    >
                                        {step.completed ? (
                                            <Check className="w-4 h-4 text-white" />
                                        ) : (
                                            <Play className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <span className="text-white font-medium">{step.title}</span>
                                </div>

                                {step.completed && step.value && (
                                    <div className="ml-9 text-sm text-slate-400">
                                        {step.id === "solution" ? "Solution: " : "Simulation: "}
                                        {step.value}
                                    </div>
                                )}

                                {step.id !== "start" ? (
                                    <Dialog open={dialogOpen === step.id} onOpenChange={(open) => !open && setDialogOpen(null)}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="ml-9 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                                                onClick={() => handleStepClick(step.id, index)}
                                                disabled={index > 0 && !workflowSteps[index - 1].completed}
                                            >
                                                {step.completed ? "Edit" : "Configure"}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-slate-800 border-slate-700">
                                            <DialogHeader>
                                                <DialogTitle className="text-white">{step.title}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="stepInput" className="text-white">
                                                        Name
                                                    </Label>
                                                    <Input
                                                        id="stepInput"
                                                        value={inputValue}
                                                        onChange={(e) => setInputValue(e.target.value)}
                                                        placeholder={step.placeholder}
                                                        className="bg-slate-700 border-slate-600 text-white"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleStepConfirm}
                                                    className="w-full bg-green-600 hover:bg-green-700"
                                                    disabled={!inputValue.trim()}
                                                >
                                                    Confirm
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <Button
                                        className="ml-9 bg-green-600 hover:bg-green-700 disabled:bg-slate-600"
                                        onClick={startSimulation}
                                        disabled={!canStartSimulation || isRunning}
                                    >
                                        Start Simulation
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Simulation Progress */}
                <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-4 text-white">Simulation Progress</h2>
                    <div className="space-y-4">
                        <div className="text-sm text-slate-300">
                            <div>
                                当前步长: {currentStep} / {maxSteps}
                            </div>
                            <div className="mt-1">{isRunning ? "运行中" : simulationProgress > 0 ? "已完成" : "未开始"}</div>
                        </div>

                        <Progress value={simulationProgress} className="w-full bg-slate-700" />

                        <div className="text-right text-sm text-slate-400">{simulationProgress.toFixed(0)}%</div>

                        <Button variant="destructive" className="w-full bg-green-600 hover:bg-green-700" onClick={stopSimulation}>
                            <Square className="w-4 h-4 mr-2" />
                            Stop Simulation
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Map Container */}
            <div className="flex-1 bg-slate-700 relative">
                {/* <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-slate-400">
                        <div className="w-24 h-24 bg-slate-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                            <div className="w-12 h-12 bg-slate-500 rounded"></div>
                        </div>
                        <p className="text-lg">Map Container</p>
                        <p className="text-sm">Map integration placeholder</p>
                    </div>
                </div> */}
                <MapContainer node={null} style='w-full h-full' />
            </div>
        </div>
    )
}
