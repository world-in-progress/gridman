export class MultiGridInfo {
    constructor(
        public levels: Uint8Array,
        public globalIds: Uint32Array
    ) {
        this.levels = levels
        this.globalIds = globalIds
    }

    static fromBuffer(buffer: ArrayBuffer): MultiGridInfo {
        const prefixView = new DataView(buffer, 0, 4)
        const uint8Length = prefixView.getUint32(0, true)
        
        const uint8Array = new Uint8Array(buffer, 4, uint8Length)
        const uint32Array = new Uint32Array(buffer, 4 + uint8Length)
        
        return new MultiGridInfo(uint8Array, uint32Array)
    }

    static async fromGetUrl(url: string): Promise<MultiGridInfo> {
        try {
          const response = await fetch(url, { method: 'GET' })
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }
          
          const buffer = await response.arrayBuffer()
          
          const prefixView = new DataView(buffer, 0, 4)
          const uint8Length = prefixView.getUint32(0, true)
          
          const uint8Array = new Uint8Array(buffer, 4, uint8Length)
          const uint32Array = new Uint32Array(buffer, 4 + uint8Length)
          
            return new MultiGridInfo(uint8Array, uint32Array)
          
        } catch (error) {
          console.error('Failed to fetch MultiGridInfo:', error)
          throw error
        }
    }
}
