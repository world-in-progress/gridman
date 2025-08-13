import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Combine, Play, Square, X } from "lucide-react";
import FloodsRenderer from './floods/renderer'
import * as apis from '@/core/apis/apis'
import { toast } from 'sonner'
import store from '@/store'

interface SimulationPanelProps {
  solutionNodeKey: string
  proxyAddress: string
  onClose: () => void
}

export default function SimulationPanel({
  solutionNodeKey,
  proxyAddress,
  onClose
}: SimulationPanelProps) {

  // 模拟状态管理 - 所有业务逻辑都在组件内部
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [totalSteps, setTotalSteps] = useState<number>(100);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const rendererRef = useRef<FloodsRenderer | null>(null)
  const simulationNodeKey = useRef<string | null>(null)

  // 动画状态管理
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // 组件挂载时触发动画
  useEffect(() => {
    // 延迟一小段时间后开始动画，确保组件已渲染
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 计算进度百分比
  const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  const updateStepProgress = (_currentStep: number, _totalSteps: number) => {
    setCurrentStep(_currentStep + 1)
    setTotalSteps(_totalSteps + 1)
  }

  // 处理启动模拟
  const handleStartSimulation = async () => {
    const simulationName = String(Date.now())
    console.log(simulationName)

    store.get<{ on: Function, off: Function }>('isLoading')!.on()

    const buildProcessGroupRes = await apis.simulation.buildProcessGroup.fetch({
      solution_node_key: solutionNodeKey,
      simulation_name: simulationName,
      group_type: 'flood_pipe',
      solution_address: proxyAddress,
    }, false)
    if (!buildProcessGroupRes.success) {
      toast.error('Failed to build process group')
      store.get<{ on: Function, off: Function }>('isLoading')!.off()
      return
    }

    simulationNodeKey.current = await apis.simulation.startSimulation.fetch({
      solution_node_key: solutionNodeKey,
      simulation_name: simulationName,
    }, false)

    // const discoveryRes = await apis.simulation.discoverProxy.fetch('node.simulations.' + simulationName, false)
    // if (!discoveryRes.success) {
    //   toast.error('Failed to discover proxy')
    //   return
    // }
    const simulationAddress = import.meta.env.VITE_MODEL_API_URL + '/api/proxy/relay?node_key=root.simulations.' + simulationName

    const map = store.get<mapboxgl.Map>('map')!
    rendererRef.current = new FloodsRenderer(map, solutionNodeKey, simulationName, simulationAddress)
    await rendererRef.current.init()

    setIsSimulationRunning(true)
    store.get<{ on: Function, off: Function }>('isLoading')!.off()
  };

  // 处理停止模拟 - 停止时直接重置
  const handleStopSimulation = async () => {
    if (!simulationNodeKey.current) return
    const stopSimulationRes = await apis.simulation.stopSimulation.fetch({
      solution_node_key: solutionNodeKey,
      simulation_node_key: simulationNodeKey.current,
    }, false)
    if (stopSimulationRes.success) {
      setIsSimulationRunning(false)
      toast.success('Simulation stopped')
    } else {
      toast.error('Failed to stop simulation')
    }
  };

  return (
    <Card
      className={`fixed bottom-6 right-6 w-80 z-50 border-slate-200 shadow-lg bg-white transition-all duration-700 ease-out ${isVisible
        ? 'translate-x-0 opacity-100'
        : 'translate-x-full opacity-0'
        }`}
      style={{
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Combine className="w-5 h-5 text-slate-500" />
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Simulation Control</span>
          <button
            className="ml-auto p-1 rounded hover:bg-slate-200"
            onClick={() => {
              setIsVisible(false)
              onClose()
            }}
            title="Close"
          >
            <X className="w-4 h-4 text-slate-400 cursor-pointer" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 控制按钮区域 */}
        <div className="flex gap-3">
          <Button
            className={`flex-1 ${isSimulationRunning
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
              } text-white font-medium`}
            onClick={isSimulationRunning ? handleStopSimulation : handleStartSimulation}
            disabled={false}
          >
            {isSimulationRunning ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Simulation
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Simulation
              </>
            )}
          </Button>
        </div>

        {/* 步长信息显示 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">Simulation Progress</span>
          </div>

          {/* 进度条 - 明确显示含义 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500">
                Current Step / Total Steps
              </span>
              <span className="text-xs text-slate-400">
                {currentStep} / {totalSteps}
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-2 bg-slate-200"
            />
          </div>
        </div>

        {/* 状态信息 */}
        <div className="text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSimulationRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
              }`} />
            <span>
              {isSimulationRunning ? 'Simulation Running...' : 'Simulation Stopped'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
