export {};

declare global {
    interface Window {
        electronAPI?: {
            openFileDialog: () => Promise<string | null>
            openTiffFileDialog: () => Promise<string | null>
        }
    }
}