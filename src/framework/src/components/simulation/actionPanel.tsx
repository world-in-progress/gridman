"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Edit, Trash2, X, Check, Eye, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"

interface Action {
  id: string
  type: string
  name: string
  parameters: Record<string, any>
}

interface ActionFormData {
  type: string
  name: string
  parameters: Record<string, any>
}

export default function ActionPanel({
  actionTypes = [],
}: { actionTypes?: { value: string; name: string; description: string }[] }) {
  // Mock data for demonstration
  const [actions, setActions] = useState<Action[]>([
    {
      id: "1",
      type: "flood_control",
      name: "Main Dam Control",
      parameters: {
        capacity: 1000,
        location: "River North",
        activation_time: 2,
      },
    },
    {
      id: "2",
      type: "evacuation",
      name: "Downtown Evacuation",
      parameters: {
        population: 5000,
        area: "Downtown District",
        duration: 6,
      },
    },
    {
      id: "3",
      type: "emergency_response",
      name: "Emergency Team Alpha",
      parameters: {
        response_time: 15,
        resources: 10,
        priority: "high",
      },
    },
  ])

  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAction, setEditingAction] = useState<Action | null>(null)
  const [viewingAction, setViewingAction] = useState<Action | null>(null)
  const [formData, setFormData] = useState<ActionFormData>({
    type: "",
    name: "",
    parameters: {},
  })

  // Animation states
  const [isPanelVisible, setIsPanelVisible] = useState(false)
  const [showActionTypes, setShowActionTypes] = useState(false)
  const [showActionList, setShowActionList] = useState(false)
  const [showConfigArea, setShowConfigArea] = useState(false)

  // Watch for actionTypes changes to trigger animations
  useEffect(() => {
    if (actionTypes.length > 0 && !isPanelVisible) {
      // Start the animation sequence
      setIsPanelVisible(true)

      // Stagger the animations
      setTimeout(() => setShowActionTypes(true), 200)
      setTimeout(() => setShowActionList(true), 1000)
      setTimeout(() => setShowConfigArea(true), 1500)
    } else if (actionTypes.length === 0) {
      // Reset all states when actionTypes becomes empty
      setIsPanelVisible(false)
      setShowActionTypes(false)
      setShowActionList(false)
      setShowConfigArea(false)
    }
  }, [actionTypes.length, isPanelVisible])

  const getParameterFields = (actionType: string) => {
    const parameterConfigs: Record<string, Array<{ name: string; type: string; label: string; options?: string[] }>> = {
      flood_control: [
        { name: "capacity", type: "number", label: "Capacity (m³/s)" },
        { name: "location", type: "text", label: "Location" },
        { name: "activation_time", type: "number", label: "Activation Time (hours)" },
      ],
      evacuation: [
        { name: "population", type: "number", label: "Population Count" },
        { name: "area", type: "text", label: "Evacuation Area" },
        { name: "duration", type: "number", label: "Duration (hours)" },
      ],
      emergency_response: [
        { name: "response_time", type: "number", label: "Response Time (minutes)" },
        { name: "resources", type: "number", label: "Resource Count" },
        { name: "priority", type: "select", label: "Priority", options: ["low", "medium", "high"] },
      ],
      infrastructure_repair: [
        { name: "repair_time", type: "number", label: "Repair Time (hours)" },
        { name: "cost", type: "number", label: "Cost (USD)" },
        { name: "infrastructure_type", type: "text", label: "Infrastructure Type" },
      ],
      resource_allocation: [
        { name: "resource_type", type: "text", label: "Resource Type" },
        { name: "quantity", type: "number", label: "Quantity" },
        { name: "allocation_area", type: "text", label: "Allocation Area" },
      ],
    }

    return parameterConfigs[actionType] || []
  }

  const handleAddActionClick = () => {
    setShowTypeSelector(true)
  }

  const handleTypeSelected = (type: string) => {
    setEditingAction(null)
    setFormData({ type, name: "", parameters: {} })
    setShowTypeSelector(false)
    setShowAddForm(true)
  }

  const handleEditAction = (action: Action) => {
    setEditingAction(action)
    setFormData({
      type: action.type,
      name: action.name,
      parameters: { ...action.parameters },
    })
    setShowAddForm(true)
  }

  const handleViewAction = (action: Action) => {
    setViewingAction(action)
  }

  const handleDeleteAction = (actionId: string) => {
    setActions(actions.filter((action) => action.id !== actionId))
  }

  const handleSaveAction = () => {
    if (!formData.type || !formData.name) return

    if (editingAction) {
      setActions(actions.map((action) => (action.id === editingAction.id ? { ...action, ...formData } : action)))
    } else {
      const newAction = {
        id: Date.now().toString(),
        ...formData,
      }
      setActions([...actions, newAction])
    }

    setShowAddForm(false)
    setFormData({ type: "", name: "", parameters: {} })
    setEditingAction(null)
  }

  const handleCancelForm = () => {
    setShowAddForm(false)
    setFormData({ type: "", name: "", parameters: {} })
    setEditingAction(null)
  }

  const handleParameterChange = (paramName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [paramName]: value,
      },
    }))
  }

  const renderParameterInput = (param: { name: string; type: string; label: string; options?: string[] }) => {
    const value = formData.parameters[param.name] || ""

    switch (param.type) {
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleParameterChange(param.name, Number.parseFloat(e.target.value) || 0)}
            className="bg-slate-700 border-slate-500 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
          />
        )
      case "select":
        return (
          <Select value={value} onValueChange={(val) => handleParameterChange(param.name, val)}>
            <SelectTrigger className="bg-slate-700 border-slate-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-500 shadow-xl">
              {param.options?.map((option) => (
                <SelectItem key={option} value={option} className="text-white hover:bg-slate-600 focus:bg-slate-600">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            className="bg-slate-700 border-slate-500 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
          />
        )
    }
  }

  const { t } = useTranslation("simulation")

  return (
    <div
      className={`w-80 h-[96vh] fixed right-0 bg-slate-800 text-white overflow-y-auto shadow-2xl border-l border-slate-700 transition-all duration-800 ease-out origin-right ${isPanelVisible ? "translate-x-0" : "translate-x-full"
        }`}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Settings className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">{t('Action Management')}</h2>
        </div>

        {/* Selected Action Types */}
        <div
          className={`transition-all duration-600 ease-out ${showActionTypes ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
        >
          <div className="text-sm font-medium mb-2 text-slate-300">{t('Active Action Types')}</div>
          <div className="flex flex-wrap gap-2">
            {actionTypes.map((type) => (
              <span
                key={type.value}
                className={`px-3 py-1.5 bg-slate-600 rounded-full text-xs font-medium text-white shadow-md capitalize transition-all duration-300 ease-out ${showActionTypes ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  }`}
              >
                {type.name}
              </span>
            ))}
          </div>
        </div>

        {/* Action List */}
        <div
          className={`bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-600 transition-all duration-600 ease-out ${showActionList ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-slate-300">{t('Configured Actions')}</div>
            {!showAddForm && (
              <Button size="sm" onClick={handleAddActionClick} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-1" />
                {t('Add Action')}
              </Button>
            )}
          </div>

          <ScrollArea className="h-48 overflow-y-auto">
            <div className="space-y-3 pr-2">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className={`bg-slate-700 border border-slate-500 rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-300 ease-out ${showActionList ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white mb-1">{action.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-600 rounded text-xs text-slate-400 capitalize">
                          {action.type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewAction(action)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditAction(action)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all duration-200"
                        disabled={showAddForm}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAction(action.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                        disabled={showAddForm}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {actions.length === 0 && (
                <div className="text-center text-slate-400 py-8 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-600">
                  <div className="text-sm">{t('No actions configured yet')}</div>
                  <div className="text-xs mt-1">{t('Click Add Action to get started')}</div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Add/Edit Form Area */}
        {showAddForm && (
          <div
            className={`bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-600 transition-all duration-600 ease-out ${showConfigArea ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${editingAction ? "bg-yellow-400" : "bg-emerald-400"}`}></div>
                {editingAction ? t('Edit Action') : t('Add New Action')}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelForm}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-slate-300 font-medium">{t('Action Type')}</Label>
                <div className="mt-2 px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg text-sm text-white font-medium capitalize shadow-md">
                  {formData.type.replace("_", " ")}
                </div>
              </div>

              <div>
                <Label className="text-sm text-slate-300 font-medium">{t('Action Name')}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t('Enter action name')}
                  className="mt-2 bg-slate-700 border-slate-500 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                />
              </div>

              {formData.type && (
                <div className="space-y-4">
                  <Label className="text-sm text-slate-300 font-medium">{t('Parameters')}</Label>
                  <div className="space-y-3 bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                    {getParameterFields(formData.type).map((param) => (
                      <div key={param.name}>
                        <Label className="text-sm text-slate-300">{param.label}</Label>
                        <div className="mt-1">{renderParameterInput(param)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Map Drawing Area Placeholder */}
                  {(formData.type === "evacuation" || formData.type === "flood_control") && (
                    <div>
                      <Label className="text-sm text-slate-300 font-medium">{t('Map Drawing')}</Label>
                      <div className="mt-2 h-32 bg-slate-700 border-2 border-dashed border-slate-500 rounded-lg flex items-center justify-center hover:border-blue-400 transition-all duration-200 cursor-pointer group">
                        <span className="text-sm text-slate-400 group-hover:text-blue-400 transition-colors duration-200">
                          {t('Click to draw on map')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-600">
                <Button
                  onClick={handleSaveAction}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all duration-200 transform hover:scale-105"
                  disabled={!formData.type || !formData.name}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {editingAction ? t('Update') : t('Add Action')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelForm}
                  className="border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-white bg-transparent transition-all duration-200"
                >
                  {t('Cancel')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state when no form is shown */}
        {!showAddForm && (
          <div
            className={`flex flex-col items-center justify-center text-slate-400 py-8 bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-600 transition-all duration-600 ease-out ${showConfigArea ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
          >
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-3">
              <Settings className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-sm text-center">
              <div>{t('Ready for action configuration')}</div>
              <div className="text-xs mt-1">{t('Select an action to edit or add a new one')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Action Type Selector Dialog */}
      <Dialog open={showTypeSelector} onOpenChange={setShowTypeSelector}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">{t('Select Action Type')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {actionTypes.map((type) => (
              <Button
                key={type.value}
                variant="outline"
                className="w-full justify-start bg-gradient-to-r from-slate-700 to-slate-600 border-slate-500 text-white hover:from-slate-600 hover:to-slate-500 hover:border-blue-400 transition-all duration-200 transform hover:scale-105"
                onClick={() => handleTypeSelected(type.value)}
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-600 to-slate-500 mr-3"></div>
                <span className="capitalize">{type.name}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Details Dialog */}
      <Dialog open={!!viewingAction} onOpenChange={() => setViewingAction(null)}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">{t('Action Details')}</DialogTitle>
          </DialogHeader>
          {viewingAction && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                <Label className="text-sm text-slate-300">{t('Name')}</Label>
                <div className="text-white font-medium mt-1">{viewingAction.name}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                <Label className="text-sm text-slate-300">{t('Type')}</Label>
                <div className="mt-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-slate-600 to-slate-500 rounded-full text-sm font-medium text-white capitalize">
                    {viewingAction.type.replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                <Label className="text-sm text-slate-300">{t('Parameters')}</Label>
                <div className="space-y-2 mt-2">
                  {Object.entries(viewingAction.parameters).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center py-1 border-b border-slate-700 last:border-b-0"
                    >
                      <span className="text-slate-300 capitalize text-sm">{key.replace("_", " ")}:</span>
                      <span className="text-white font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
