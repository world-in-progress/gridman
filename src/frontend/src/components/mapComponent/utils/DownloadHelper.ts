import axios from "axios"

/**  
* Example:
* const fileDownloader = new FileDownloader({
*     url: 'http.....',
*     fileName: 'res.zip',
*     chunkSize: 1024 * 1024 * 128,
*     cb: (done: boolean, current: number, total: number) => {
*         if (done) {
*             console.log('Download complete!')
*             return;
*         }
*         console.log(`Downloading... ${Math.round(current / total * 100)}%`)
*     }
* })
* fileDownloader.download()
*/
export default class FileDownloader {

    url: string
    fileName: string
    fileSize: number

    chunks: Array<unknown>
    chunkSize: number
    chunkNum: number
    currentChunk: number

    downloadedSize: number
    abortController: AbortController

    done: boolean
    err: boolean

    callback: Function | null
    intervalID: number | null

    threadNum: number
    fullfilledFlags: Array<boolean>

    constructor({ url, fileName, chunkSize = 64 * 1024 * 1024, threadNum = 4, cb }: {
        url: string,
        fileName: string,
        chunkSize?: number,
        threadNum?: number,
        cb?: Function
    }) {
        this.url = url
        this.done = false
        this.err = false
        this.fileName = fileName
        this.fileSize = 0
        this.chunks = []
        this.chunkNum = 0
        this.chunkSize = chunkSize
        this.currentChunk = 0
        this.downloadedSize = 0
        this.abortController = new AbortController()
        this.callback = cb ? cb : null;
        this.intervalID = null

        this.threadNum = threadNum
        this.fullfilledFlags = []
    }

    getNextChunckID(nowChunkID: number) {
        let nextID = nowChunkID + this.threadNum
        nextID >= this.chunkNum && (nextID = -1)
        return nextID
    }

    async download() {

        console.time("download")

        await this.prepare()
        this.intervalID = window.setInterval(async () => {
            this.callback && this.callback(!(this.downloadedSize < this.fileSize), this.downloadedSize, this.fileSize)
        }, 1000)
        for (let i = 0; i < this.threadNum && i < this.chunkNum; i++) {
            this.downloadChunk(i)
        }
    }

    async prepare() {
        
        try {
            const res = await axios.head(this.url, { signal: this.abortController.signal })
            this.fileSize = parseInt(res.headers['content-length'])
            this.chunkNum = Math.ceil(this.fileSize / this.chunkSize)
            this.chunks = new Array<unknown>(this.chunkNum)
            this.currentChunk = 0
            this.fullfilledFlags = Array.from({ length: Math.min(this.threadNum, this.chunkNum) }, _ => false)

        } catch (e) {
            this.err = true
            this.destroy()
            console.error("FileDownloader Prepare Error:" + e)
        }
    }

    async downloadChunk(chunkIndex: number) {
        try {
            if (this.err) return

            const start = chunkIndex * this.chunkSize
            const end = Math.min(start + this.chunkSize - 1, this.fileSize - 1);
            const res = await axios.get(this.url, {
                headers: { "Range": `bytes=${start}-${end}` },
                responseType: "blob",
                signal: this.abortController.signal
            })

            if (res.status !== 206) throw 'HTTP-Request Error'

            const blob = new Blob([res.data])
            this.chunks[chunkIndex] = blob
            this.downloadedSize += blob.size

            const nextChunkID = this.getNextChunckID(chunkIndex)
            if (nextChunkID != -1) {
                this.downloadChunk(nextChunkID)
            } else {
                const threadID = chunkIndex % this.threadNum // this thread done.
                this.fullfilledFlags[threadID] = true
                // Merge chuncks when all thread done.
                this.fullfilledFlags.every(flag => flag === true) && this.mergeChunks()
            }

        } catch (e) {
            this.err = true
            this.destroy()
            console.error("FileDownloader DownloadChunk Error:" + e)
        }
    }

    mergeChunks() {
        if (this.downloadedSize !== this.fileSize) throw "File size mismatch"
        if (this.err) return

        this.intervalID && clearInterval(this.intervalID)
        const blob = new Blob(this.chunks as BlobPart[])
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = this.fileName
        link.click()
        this.done = true
        setTimeout(() => {
            console.timeEnd("download")
            this.callback && this.callback(true, this.downloadedSize, this.fileSize) // for progress
            link.remove()
            URL.revokeObjectURL(url)
            this.destroy()
        })
    }

    destroy() {

        this.fileName = ''
        this.fileSize = 0
        this.chunks = []
        this.chunkNum = 0
        this.currentChunk = 0
        this.downloadedSize = 0
        this.intervalID && clearInterval(this.intervalID)
        this.abortController.abort()
    }
}
