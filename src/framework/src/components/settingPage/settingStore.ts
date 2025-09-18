import { create } from 'zustand'
// 移除persist导入
// import { persist } from 'zustand/middleware'

interface SettingsState {
    highSpeedMode: boolean
}

interface SettingActions {
    setHighSpeedMode: (highSpeedMode: boolean) => void
}

type SettingsStore = SettingsState & SettingActions

// 直接使用create，不包装persist
export const useSettingsStore = create<SettingsStore>((set) => ({
    highSpeedMode: false,
    setHighSpeedMode: (highSpeedMode: boolean) => set({ highSpeedMode }),
}))