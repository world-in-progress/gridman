"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Check, Play, Square, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SimulationManager2 from "./simulationManager2"
import { useTranslation } from "react-i18next"

type TaskStatus = "pending" | "running" | "done" | "error"

export default function SimulationPanel({
  solutionName = "",
  simulationName = "",
  currentTaskIndex = 0,
  currentStep = 0,
  workflowStatus = {
    createSolution: "pending",
    createSimulation: "pending",
    startSimulation: "pending",
    simulation: "pending",
  },
  workflowProgress = {
    createSolution: 0,
    createSimulation: 0,
    startSimulation: 0,
  },
  createSolution,
  createSimulation,
  startSimulation,
  stopSimulation,
}: {
  solutionName: string
  simulationName: string
  currentTaskIndex: number
  workflowStatus: { [key: string]: TaskStatus }
  workflowProgress: { [key: string]: number }
  currentStep: number
  createSolution: (solutionName: string, modelType: string, actionTypes: string[]) => void
  createSimulation: (simulationName: string) => void
  startSimulation: () => void
  stopSimulation: () => void
}) {
  const maxSteps = 200
  const [currentStepResult, setCurrentStepResult] = useState<string | null>(null)
  const simulationProgress = (currentStep / maxSteps) * 100

  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [solutionInputValue, setSolutionInputValue] = useState("")
  const [simulationInputValue, setSimulationInputValue] = useState("")

  const [actionTypeList, setActionTypeList] = useState<{ value: string; name: string; description: string }[]>([])
  const [selectedActionTypes, setSelectedActionTypes] = useState<string[]>([])
  const [modelTypeList, setModelTypeList] = useState<{ value: string; name: string }[]>([])
  const [modelType, setModelType] = useState("")
  const [modelParams, setModelParams] = useState<
    {
      name: string
      parameters: { name: string; type: string }[]
    }[]
  >([])
  const [modelParamValues, setModelParamValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const getActionTypeList = () => {
      const actionTypeList = SimulationManager2.getInstance().getActionTypeList()
      setActionTypeList(actionTypeList)
    }
    const getModelTypeList = () => {
      const modelTypeList = SimulationManager2.getInstance().getModelTypeList()
      setModelTypeList(modelTypeList)
    }
    getActionTypeList()
    getModelTypeList()
  }, [])

  useEffect(() => {
    if (modelType) {
      const params = SimulationManager2.getInstance().getModelParamsByType(modelType)
      setModelParams(params)
      setModelParamValues({})
    } else {
      setModelParams([])
      setModelParamValues({})
    }
  }, [modelType])

  const handleCreateSolution = () => {
    setDialogOpen(null)
    createSolution(solutionInputValue.trim(), modelType, selectedActionTypes)
  }

  const handleCreateSimulation = () => {
    setDialogOpen(null)
    createSimulation(simulationInputValue.trim())
  }

  const handleStartSimulation = () => {
    startSimulation()
  }

  const handleStopSimulation = () => {
    stopSimulation()
  }

  const handleOpenDialog = (taskName: string) => {
    setDialogOpen(taskName)
    if (taskName === "createSolution") {
      setSolutionInputValue("")
    } else if (taskName === "createSimulation") {
      setSimulationInputValue("")
    }
  }

  const handleParamValueChange = (paramName: string, value: string) => {
    setModelParamValues((prev) => ({
      ...prev,
      [paramName]: value,
    }))
  }

  const { t } = useTranslation("simulation")

  return (
    <div className="w-70 bg-slate-800 p-6 flex flex-col h-[96vh] text-white">
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-white">{t('Model Workflow')}</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${currentTaskIndex === 0 ? "bg-slate-600" : "bg-green-500"
                  }`}
              >
                {currentTaskIndex === 0 ? (
                  <Play className="w-3 h-3 text-white" />
                ) : (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-white font-medium">{t('Create Solution')}</span>
            </div>

            {workflowStatus.createSolution === "done" ? (
              <div className="ml-9 text-sm text-slate-400">{t('Solution')}: {solutionName}</div>
            ) : workflowStatus.createSolution === "running" ? (
              <div className="ml-9 w-[160px] flex items-center">
                <Progress value={workflowProgress.createSolution} className="bg-slate-700 flex-1" />
                <div className="text-xs text-slate-400 ml-2" style={{ minWidth: 32 }}>
                  {workflowProgress.createSolution}%
                </div>
              </div>
            ) : (
              <Dialog open={dialogOpen === "createSolution"} onOpenChange={(open) => !open && setDialogOpen(null)}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-9 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    onClick={() => handleOpenDialog("createSolution")}
                  >
                    {t('Configure')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">{t('Create Solution')}</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto pr-2">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">{t('Solution Name')}</label>
                        <Input
                          id="stepInputSolution"
                          value={solutionInputValue}
                          onChange={(e) => setSolutionInputValue(e.target.value)}
                          placeholder={t('Enter solution name')}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">{t('Model Type')}</label>
                        <Select value={modelType} onValueChange={setModelType}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder={t('Select model type')} />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {modelTypeList.map((model) => (
                              <SelectItem key={model.value} value={model.value} className="text-white">
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Model Parameters Section */}
                      {modelParams.length > 0 && (
                        <div className="space-y-4">
                          <label className="text-sm font-medium text-slate-300 block">{t('Model Parameters')}</label>
                          <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 space-y-4">
                            {modelParams.map((process, processIndex) => (
                              <div key={processIndex} className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-200 capitalize border-b border-slate-600 pb-1">
                                  {process.name}
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                  {process.parameters.map((param, paramIndex) => (
                                    <div key={paramIndex} className="space-y-1">
                                      <label className="text-xs text-slate-400 capitalize">{param.name}</label>
                                      <div className="flex items-center space-x-2">
                                        <div className="relative flex-1">
                                          <Input
                                            type="file"
                                            className="bg-slate-800 border-slate-600 text-white text-xs opacity-0 absolute inset-0 cursor-pointer"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0]
                                              if (file) {
                                                handleParamValueChange(`${process.name}_${param.name}`, file.name)
                                              }
                                            }}
                                          />
                                          <div className="bg-slate-800 border border-slate-600 rounded px-3 py-2 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors">
                                            <Upload className="w-4 h-4 text-slate-400" />
                                          </div>
                                        </div>
                                        {modelParamValues[`${process.name}_${param.name}`] && (
                                          <span className="text-xs text-slate-400 truncate max-w-20">
                                            {modelParamValues[`${process.name}_${param.name}`]}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}


                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">{t('Action Types')}</label>
                        <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {actionTypeList.map((type) => (
                            <label key={type.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedActionTypes.includes(type.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedActionTypes([...selectedActionTypes, type.value])
                                  } else {
                                    setSelectedActionTypes(selectedActionTypes.filter((t) => t !== type.value))
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-sm text-slate-300 capitalize">{type.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateSolution}
                    className="w-full bg-green-600 hover:bg-green-700 mt-4"
                    disabled={!solutionInputValue.trim() || selectedActionTypes.length === 0 || !modelType}
                  >
                    {t('Confirm')}
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${currentTaskIndex <= 1 ? "bg-slate-600" : "bg-green-500"
                  }`}
              >
                {currentTaskIndex <= 1 ? (
                  <Play className="w-3 h-3 text-white" />
                ) : (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-white font-medium">{t('Create Simulation')}</span>
            </div>

            {currentTaskIndex === 0 && simulationName && (
              <div className="ml-9 text-sm text-slate-400">{t('Simulation')}: {simulationName}</div>
            )}

            {workflowStatus.createSimulation === "done" ? (
              <div className="ml-9 text-sm text-slate-400">{t('Simulation')}: {simulationName}</div>
            ) : workflowStatus.createSimulation === "running" ? (
              <div className="ml-9 w-[160px] flex items-center">
                <Progress value={workflowProgress.createSimulation} className="bg-slate-700 flex-1" />
                <div className="text-xs text-slate-400 ml-2" style={{ minWidth: 32 }}>
                  {workflowProgress.createSimulation}%
                </div>
              </div>
            ) : (
              <Dialog open={dialogOpen === "createSimulation"} onOpenChange={(open) => !open && setDialogOpen(null)}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-9 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    onClick={() => handleOpenDialog("createSimulation")}
                    disabled={currentTaskIndex !== 1}
                  >
                    {t('Configure')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">{t('Create Simulation')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      id="stepInputSimulation"
                      value={simulationInputValue}
                      onChange={(e) => setSimulationInputValue(e.target.value)}
                      placeholder={t('Enter simulation name')}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Button
                      onClick={handleCreateSimulation}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!simulationInputValue.trim()}
                    >
                      {t('Confirm')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${currentTaskIndex <= 2 ? "bg-slate-600" : "bg-green-500"
                  }`}
              >
                {currentTaskIndex <= 2 ? (
                  <Play className="w-3 h-3 text-white" />
                ) : (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-white font-medium">{t('Start Simulation')}</span>
            </div>

            {workflowStatus.startSimulation === "running" ? (
              <div className="ml-9 w-[160px] flex items-center">
                <Progress value={workflowProgress.startSimulation} className="bg-slate-700 flex-1" />
                <div className="text-xs text-slate-400 ml-2" style={{ minWidth: 32 }}>
                  {workflowProgress.startSimulation}%
                </div>
              </div>
            ) : (
              <Button
                className="ml-9 bg-green-600 hover:bg-green-700 disabled:bg-slate-600"
                onClick={handleStartSimulation}
                disabled={currentTaskIndex !== 2}
              >
                {t('Start Simulation')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Simulation Progress */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold mb-4 text-white">{t('Simulation Progress')}</h2>
        <div className="space-y-4">
          <div className="text-sm text-slate-300">
            <div>
              {t('Current Step')}: {currentStep} / {maxSteps}
            </div>
            <div className="mt-1">
              {workflowStatus.simulation === "running" ? t('Running') : simulationProgress > 0 ? t('Completed') : t('Not Started')}
            </div>
          </div>

          <Progress value={simulationProgress} className="w-full bg-slate-700" />

          <div className="text-right text-sm text-slate-400">{simulationProgress.toFixed(0)}%</div>

          <Button
            variant="destructive"
            className="w-full bg-red-500 hover:bg-red-600"
            onClick={handleStopSimulation}
            disabled={workflowStatus.simulation !== "running"}
          >
            <Square className="w-4 h-4 mr-2" />
            {t('Stop Simulation')}
          </Button>
        </div>
      </div>
    </div>
  )
}
