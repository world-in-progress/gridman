export {};

declare global {
    interface Window {
        electronAPI?: {
            openFileDialog: () => Promise<string | null>
        }
    }
}