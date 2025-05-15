import TopologyLayer from '../layers/TopologyLayer'

export class MapEventManager {
    private layer: TopologyLayer

    constructor(layer: TopologyLayer) {
        this.layer = layer
        this.initializeEventListeners()
    }

    private initializeEventListeners() {
        // 透明度切换事件
        document.addEventListener('keydown', this.handleTransparencyToggle.bind(this))
        
        // 清除选择事件
        window.addEventListener('keydown', this.handleClearSelection.bind(this))
        
        // 网格细分事件
        window.addEventListener('keydown', this.handleGridSubdivision.bind(this))
        
        // 删除网格事件
        window.addEventListener('keydown', this.handleGridDeletion.bind(this))
        
        // 撤销/重做事件
        document.addEventListener('keydown', this.handleUndoRedo.bind(this))
    }

    private handleTransparencyToggle = (e: KeyboardEvent) => {
        if (e.shiftKey && e.key === 'T') {
            this.layer.isTransparent = !this.layer.isTransparent
            console.log(`Grid Transparent: ${this.layer.isTransparent ? 'ON' : 'OFF'}`)
            this.layer.map.triggerRepaint()
        }
    }

    private handleClearSelection = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.layer.executeClearSelection()
        }
    }

    private handleGridSubdivision = (e: KeyboardEvent) => {
        if (e.key === '1') {
            this.layer.executeSubdivideGrids()
        }
    }

    private handleGridDeletion = (e: KeyboardEvent) => {
        if (e.key === '2') {
            this.layer.executeDeleteGrids()
        }
    }

    private handleUndoRedo = (e: KeyboardEvent) => {
        const ctrlOrCmd = this.isMacOS() ? e.metaKey : e.ctrlKey

        if (ctrlOrCmd && e.key.toLowerCase() === 'z') {
            e.preventDefault()
            if (e.shiftKey) {
                // Redo
                this.layer.gridRecorder.redo()
            } else {
                // Undo
                this.layer.gridRecorder.undo()
            }
        }
    }

    private isMacOS(): boolean {
        return navigator.userAgent.includes('Mac')
    }

    public removeEventListeners() {
        document.removeEventListener('keydown', this.handleTransparencyToggle)
        window.removeEventListener('keydown', this.handleClearSelection)
        window.removeEventListener('keydown', this.handleGridSubdivision)
        window.removeEventListener('keydown', this.handleGridDeletion)
        document.removeEventListener('keydown', this.handleUndoRedo)
    }
}