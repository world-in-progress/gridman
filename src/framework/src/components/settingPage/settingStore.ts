import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
    highSpeedMode: boolean
}

interface SettingActions {
    setHighSpeedMode: (highSpeedMode: boolean) => void
}

type SettingsStore = SettingsState & SettingActions

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            highSpeedMode: false,
            setHighSpeedMode: (highSpeedMode: boolean) => set({ highSpeedMode }),
        }),
        {
            name: 'settings-storage',
        }
    )
)