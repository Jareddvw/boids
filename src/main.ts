// import { getFpsCallback, Simulation } from "@red_j/webgl-fluid-sim";
// import { getSettings, setSettings } from "./controls";
import { Simulation } from "./lib/classes/Simulation";
import { getFpsCallback } from "./lib/utils/utils";
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

const getFPS = getFpsCallback()

const simulation = new Simulation(canvas, {});
let prev = performance.now();
const render = (now: number) => {
    const fps = getFPS();
    console.log("FPS: ", fps)

    prev = now;
    simulation.step();

    requestAnimationFrame(render);
}
requestAnimationFrame(render);

const button = document.getElementById('btn') as HTMLButtonElement
let numBoids = 10_000
button.addEventListener('click', () => {
    if (numBoids === 10_000) {
        numBoids = 25
    } else {
        numBoids = 10_000
    }
    simulation.updateSettings({ numBoids })
})

canvas.addEventListener('mousemove', (e) => {
    const x = e.offsetX / canvas.width
    const y = 1 - e.offsetY / canvas.height
    simulation.updateSettings({
        predatorPosition: [x, y]
    });
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const x = e.touches[0].clientX / canvas.width
    const y = 1 - e.touches[0].clientY / canvas.height
    simulation.updateSettings({
        predatorPosition: [x, y]
    });
});

canvas.onmouseleave = () => {
    simulation.updateSettings({
        predatorPosition: [-1, -1]
    });
}
