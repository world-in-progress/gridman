
import { createContext } from 'react'
import { SidebarType } from './components/page'

export const SidebarContext = createContext<{
    activeNavbar: SidebarType
    setActiveNavbar: (type: SidebarType) => void
}>({
    activeNavbar: 'aggregation',
    setActiveNavbar: () => {},
})

export const LanguageContext = createContext<{
    language: 'zh' | 'en'
    setLanguage: (lang: 'zh' | 'en') => void
}>({
    language: 'en',
    setLanguage: () => {},
})

export const AIDialogContext = createContext<{
    aiDialogEnabled: boolean
    setAIDialogEnabled: (enabled: boolean) => void
}>({
    aiDialogEnabled: false,
    setAIDialogEnabled: () => {},
})

export class CheckingSwitch {
    isOn = false
    ons: Function[] = []
    offs: Function[] = []

    addEventListener(event: 'on' | 'off', callback: Function) {
        switch (event) {
            case 'on':
                this.ons.push(callback)
                break
        
            case 'off':
                this.offs.push(callback)
                break
        }
    }

    removeEventListener(event: 'on' | 'off', callback: Function) {
        const events = event === 'on' ? this.ons : this.offs
        for (let i = 0; i < events.length; i++) {
            if (events[i] === callback) {
                events.splice(i, 1)
                break
            }
        }
    }

    switch() {
        this.isOn = !this.isOn 
        if (this.isOn) {
            this.ons.forEach(callback => callback())
        } else {
            this.offs.forEach(callback => callback())
        }
    }
}