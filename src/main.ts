// import { getFpsCallback, Simulation } from "@red_j/webgl-fluid-sim";
// import { getSettings, setSettings } from "./controls";
import "./style.css"

const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
const MAX_HEIGHT = 1080 / 1.5
const MAX_WIDTH = 1920 / 1.5
const getWidth = () => Math.min(MAX_WIDTH, window.innerWidth)
const getHeight = () => Math.min(MAX_HEIGHT, window.innerHeight)

const setDimensions = () => {
    canvas.width = getWidth()
    canvas.height = getHeight()

    canvas.style.setProperty('width', `${getWidth()}px`)
    canvas.style.setProperty('height', `${getHeight()}px`)
}
setDimensions()

addEventListener('resize', () => {
    setDimensions()
})

if (!canvas) {
    throw new Error('No canvas found')
}
