
export const colors = {
    black: [0.0, 0.0, 0.0, 1.0],
    empty: [0.0, 0.0, 0.0, 0.0],
    white: [1.0, 1.0, 1.0, 1.0],
}

export const getFpsCallback = () => {
    let lastCalledTime = 0
    let totalFrameTimes = 0
    const deltaArray: number[] = []
    const getFPS = () => {
        // use a sliding window to calculate the average fps over the last 60 frames
        const now = performance.now()
        const delta = now - lastCalledTime
        lastCalledTime = now
        deltaArray.push(delta)
        totalFrameTimes += delta
        if (deltaArray.length > 60) {
            totalFrameTimes -= deltaArray.shift() as number
        }
        return 1000 / (totalFrameTimes / deltaArray.length)
    }
    return getFPS
}
