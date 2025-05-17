interface MultiGridRenderInfo {
  levels: Uint8Array;
  globalIds: Uint32Array;
  vertices: Float32Array;
}

export class MultiGridInfo {
  constructor(public levels: Uint8Array, public globalIds: Uint32Array) {
    this.levels = levels;
    this.globalIds = globalIds;
  }

  get renderInfo(): MultiGridRenderInfo {
    // Calculate vertices of multi grids

    return {
      levels: this.levels,
      globalIds: this.globalIds,
      vertices: new Float32Array(1),
    };
  }

  static fromBuffer(buffer: ArrayBuffer): MultiGridInfo {
    const prefixView = new DataView(buffer, 0, 4);
    const uint8Length = prefixView.getUint32(0, true);
    const alignedOffset = 4 + uint8Length + ((4 - (uint8Length % 4 || 4)) % 4);

    const uint8Array = new Uint8Array(buffer, 4, uint8Length);
    const uint32Array = new Uint32Array(buffer, alignedOffset);

    return new MultiGridInfo(uint8Array, uint32Array);
  }

  static async fromGetUrl(url: string): Promise<MultiGridInfo> {
    // try {
      const response = await fetch(url, { method: "GET" });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();

      const prefixView = new DataView(buffer, 0, 4);
      const uint8Length = prefixView.getUint32(0, true);
      const alignedOffset =
        4 + uint8Length + ((4 - (uint8Length % 4 || 4)) % 4);

      const uint8Array = new Uint8Array(buffer, 4, uint8Length);
      const uint32Array = new Uint32Array(buffer, alignedOffset);

      return new MultiGridInfo(uint8Array, uint32Array);
    // } catch (error) {
    //   console.error("Failed to fetch MultiGridInfo:", error);
    //   throw error;
    // }
  }

  static async fromPostUrl(url: string, data: any): Promise<MultiGridInfo> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();

      const prefixView = new DataView(buffer, 0, 4);
      const uint8Length = prefixView.getUint32(0, true);
      const alignedOffset =
        4 + uint8Length + ((4 - (uint8Length % 4 || 4)) % 4);

      const uint8Array = new Uint8Array(buffer, 4, uint8Length);
      const uint32Array = new Uint32Array(buffer, alignedOffset);

      return new MultiGridInfo(uint8Array, uint32Array);
    } catch (error) {
      console.error("Failed to fetch MultiGridInfo:", error);
      throw error;
    }
  }
}
