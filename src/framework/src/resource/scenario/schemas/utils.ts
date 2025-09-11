import store from '@/store'
import mapboxgl from 'mapbox-gl'
import { GridLayerInfo, ValidationResult } from './types'

export const validateGridLayers = (gridLayers: GridLayerInfo[]): { errors: Record<number, string>, isValid: boolean } => {
    const errors: Record<number, string> = {}
    let isValid = true

    const errorText = {
        and: () => ` and `,

        empty: () => 'Width and height cannot be empty',

        notPositive: () => 'Width and height must be positive numbers',
        
        notSmaller: (prevWidth: number, prevHeight: number) => `Cell dimensions should be smaller than previous level (${prevWidth}×${prevHeight})`,

        notMultiple: (prevWidth: number, currentWidth: number, prevHeight: number, currentHeight: number) => `Previous level's dimensions (${prevWidth}×${prevHeight}) must be multiples of current level (${currentWidth}×${currentHeight})`,

        widthNotSmaller: (prevWidth: number) => `Width must be smaller than previous level (${prevWidth})`,

        widthNotMultiple: (prevWidth: number, currentWidth: number) => `Previous level's width (${prevWidth}) must be a multiple of current width (${currentWidth})`,

        heightNotSmaller: (prevHeight: number) => `Height must be smaller than previous level (${prevHeight})`,

        heightNotMultiple: (prevHeight: number, currentHeight: number) => `Previous level's height (${prevHeight}) must be a multiple of current height (${currentHeight})`,
    }

    gridLayers.forEach((layer, index) => {
        delete errors[layer.id]
        const width = String(layer.width).trim()
        const height = String(layer.height).trim()

        if (width === '' || height === '') {
            errors[layer.id] = errorText.empty()
            isValid = false
            return
        }

        const currentWidth = Number(width)
        const currentHeight = Number(height)

        if (
            isNaN(currentWidth) ||
            isNaN(currentHeight) ||
            currentWidth <= 0 ||
            currentHeight <= 0
        ) {
            errors[layer.id] = errorText.notPositive()
            isValid = false
            return
        }

        if (index > 0) {
            const prevLayer = gridLayers[index - 1]
            const prevWidth = Number(String(prevLayer.width).trim())
            const prevHeight = Number(String(prevLayer.height).trim())

            let hasWidthError = false
            if (currentWidth >= prevWidth) {
                errors[layer.id] = errorText.widthNotSmaller(prevWidth)
                hasWidthError = true
                isValid = false
            } else if (prevWidth % currentWidth !== 0) {
                errors[layer.id] = errorText.widthNotMultiple(
                    prevWidth,
                    currentWidth
                )
                hasWidthError = true
                isValid = false
            }

            if (currentHeight >= prevHeight) {
                if (hasWidthError) {
                    errors[layer.id] +=
                        errorText.and +
                        errorText.heightNotSmaller(prevHeight)
                } else {
                    errors[layer.id] =
                        errorText.heightNotSmaller(prevHeight)
                }
                isValid = false
            } else if (prevHeight % currentHeight !== 0) {
                if (hasWidthError) {
                    errors[layer.id] +=
                        errorText.and +
                        errorText.heightNotMultiple(
                            prevHeight,
                            currentHeight
                        )   
                } else {
                    errors[layer.id] = errorText.heightNotMultiple(
                        prevHeight,
                        currentHeight
                    )   
                }
                isValid = false 
            }
        }
    })

    return { errors, isValid }
}

export const validateSchemaForm = (
    data: {
        name: string
        epsg: number
        lon: string
        lat: string
        gridLayerInfos: GridLayerInfo[]
        convertedCoord: { x: number, y: number } | null
    },
): ValidationResult => {
    const errors = {
        name: false,
        epsg: false,
        description: false,
        coordinates: false,
    }
    let generalError: string | null = null

    // Validate name
    if (!data.name.trim()) {
        errors.name = true
        generalError = 'Please enter schema name'
        return { isValid: false, errors, generalError }
    }

    // Validate EPSG code
    if (!data.epsg || isNaN(Number(data.epsg))) {
        errors.epsg = true
        generalError = 'Please enter a valid EPSG code'
        return { isValid: false, errors, generalError }
    }

    // Validate coordinates
    if (!data.lon.trim() || !data.lat.trim() || isNaN(Number(data.lon)) || isNaN(Number(data.lat))) {
        errors.coordinates = true
        generalError = 'Please enter valid coordinates'
        return { isValid: false, errors, generalError }
    }

    // Validate grid levels
    if (data.gridLayerInfos.length === 0) {
        generalError = 'Please add at least one grid level'
        return { isValid: false, errors, generalError }
    }
    for (let i = 0; i < data.gridLayerInfos.length; i++) {
        const layer = data.gridLayerInfos[i]
        if (
            !layer.width.toString().trim() ||
            !layer.height.toString().trim() ||
            isNaN(parseInt(layer.width.toString())) ||
            isNaN(parseInt(layer.height.toString()))
        ) {
            generalError = `Please enter valid width and height for grid level ${i + 1}`
            return { isValid: false, errors, generalError }
        }
    }
    const { errors: layerErrors, isValid: gridInfoValid } = validateGridLayers(data.gridLayerInfos)
    if (!gridInfoValid) {
        generalError = 'Please fix errors in grid levels'
        return { isValid: false, errors, generalError }
    }

    // Validate converted coordinates
    if (!data.convertedCoord) {
        generalError = 'Unable to get converted coordinates'
        return { isValid: false, errors, generalError }
    }

    return { isValid: true, errors, generalError }
}

export function pickingFromMap(options?: mapboxgl.MarkerOptions, callback?: (marker: mapboxgl.Marker) => void): () => void {
    const map = store.get<mapboxgl.Map>('map')
    if (!map) {
        console.error('Map instance not found')
        return () => {}
    }

    // Set cursor style
    if (map.getCanvas()) map.getCanvas().style.cursor = 'crosshair'

    // Set picking handler
    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        // Recover cursor style
        if (map.getCanvas()) map.getCanvas().style.cursor = ''

        // Create marker
        const marker = new mapboxgl.Marker({ ...options, anchor: 'center' })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .addTo(map)

        // Call the callback
        callback && callback(marker)
    }

    map.once('click', handleMapClick)

    return () => {
        map.off('click', handleMapClick)
        if (map.getCanvas()) map.getCanvas().style.cursor = ''
    }
}