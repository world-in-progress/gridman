export {};

declare global {
    interface Window {
        electronAPI?: {
            openFileDialog: () => Promise<string | null>,
            openTiffFileDialog: () => Promise<string | null>,
            openTxtFileDialog: () => Promise<string | null>,
            openInpFileDialog: () => Promise<string | null>,
            openCsvFileDialog: () => Promise<string | null>
        }
    }
}