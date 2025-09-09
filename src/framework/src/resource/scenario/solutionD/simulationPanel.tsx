import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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

  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [totalSteps, setTotalSteps] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isTerrainVisible, setIsTerrainVisible] = useState<boolean>(true);
  const [animationSpeed, setAnimationSpeed] = useState<number>(4);
  const rendererRef = useRef<FloodsRenderer | null>(null)
  const simulationNameRef = useRef<string | null>(null)

  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  const updateStepProgress = (_currentStep: number, _totalSteps: number) => {
    setCurrentStep(_currentStep + 1)
    setTotalSteps(_totalSteps)
  }

  const handleTerrainVisibilityToggle = (checked: boolean) => {
    setIsTerrainVisible(checked);
    if (rendererRef.current) {
      rendererRef.current.setTerrainVisibility(checked);
    }
  };

  const handleAnimationSpeedChange = (speed: number) => {
    setAnimationSpeed(speed);
    if (rendererRef.current) {
      rendererRef.current.setAnimationSpeed(speed);
    }
  };

  const handleStartSimulation = async () => {
    if (rendererRef.current) {
      rendererRef.current.startAnimation()
      setIsSimulationRunning(true)
      setCurrentStep(0)
    } else {
      const simulationName = String(Date.now())
      simulationNameRef.current = simulationName

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

      await apis.simulation.startSimulation.fetch({
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
      rendererRef.current.subscribeStepProgress(updateStepProgress)

      setIsSimulationRunning(true)
      store.get<{ on: Function, off: Function }>('isLoading')!.off()
    }
  };

  const handleStopSimulation = async () => {
    const stopSimulationRes = await apis.simulation.stopSimulation.fetch({
      solution_node_key: solutionNodeKey,
      simulation_node_key: 'root.simulations.' + simulationNameRef.current,
    }, false)
    if (stopSimulationRes.success) {
      setIsSimulationRunning(false)
      rendererRef.current?.stopAll()
      setCurrentStep(0)
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Terrain Layer</span>
            <Switch
              checked={isTerrainVisible}
              onCheckedChange={handleTerrainVisibilityToggle}
              disabled={!isSimulationRunning}
              className="cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-slate-700">Animation Speed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-6 text-right">1</span>
              <Slider
                value={[animationSpeed]}
                min={1}
                max={40}
                step={1}
                className="w-40 cursor-pointer"
                onValueChange={v => handleAnimationSpeedChange(v[0])}
                disabled={!isSimulationRunning}
              />
              <span className="text-xs text-slate-400 w-6 text-left">40</span>
              <Badge variant="secondary" className='text-xs text-gray-800'>{animationSpeed}</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">Simulation Progress</span>
          </div>

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

        <div className="text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSimulationRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
              }`} />
            <span>
              {isSimulationRunning ? 'Simulation Running...' : 'Simulation Stopped'}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className={`flex-1 ${isSimulationRunning
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
              } text-white font-medium cursor-pointer`}
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
      </CardContent>
    </Card>
  );
}
