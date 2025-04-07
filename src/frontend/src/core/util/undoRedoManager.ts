import RingBuffer from './ringBuffer'

export interface UndoRedoOperation {
    apply: () => void
    inverse: () => void
    action: string // Action name
}

class UndoRedoManager {

    private _undoBuffer: RingBuffer<UndoRedoOperation>
    private _redoBuffer: RingBuffer<UndoRedoOperation>

    constructor(operationCapacity: number) {
        
        this._undoBuffer = new RingBuffer<UndoRedoOperation>(operationCapacity)
        this._redoBuffer = new RingBuffer<UndoRedoOperation>(operationCapacity)
    }

    execute(operation: UndoRedoOperation): void {

        operation.apply()
        this._undoBuffer.push(operation)
        this._redoBuffer.clear()
    }

    undo(): void {

        const operation = this._undoBuffer.pop()
        if (operation) {

            this._redoBuffer.push(operation)
            operation.inverse()
        }
    }

    redo(): void {

        const operation = this._redoBuffer.pop()
        if (operation) {

            this._undoBuffer.push(operation)
            operation.apply()
        }
    }

    getHistory(): { undo: UndoRedoOperation[], redo: UndoRedoOperation[] } {

        return {
            undo: this._undoBuffer.toArray(),
            redo: this._redoBuffer.toArray(),
        }
    }
}

export default UndoRedoManager
