import { ColorMode, Simulation as FluidSim } from "@red_j/webgl-fluid-sim";
import { Simulation } from "./lib/classes/Simulation";
import { Controls } from "./lib/controls";
import { SimulationSettings } from "./lib/gl/types";
import { getFpsCallback } from "./lib/utils/utils";
import "./style.css";

const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
const fpsCounter = document.getElementById("fpsCounter") as HTMLElement;
const MAX_HEIGHT = 1080 / 1.5;
const MAX_WIDTH = 1920 / 1.5;
const getWidth = () => Math.min(MAX_WIDTH, window.innerWidth);
const getHeight = () => Math.min(MAX_HEIGHT, window.innerHeight);

const setDimensions = () => {
    canvas.width = getWidth();
    canvas.height = getHeight();
    canvas.style.setProperty('width', `${getWidth()}px`);
    canvas.style.setProperty('height', `${getHeight()}px`);
};
setDimensions();

addEventListener('resize', () => {
    setDimensions();
});

if (!canvas) {
    throw new Error('No canvas found');
}

let deltaT = 0;

const fluidSim = new FluidSim(canvas);
fluidSim.updateSettings({
    colorMode: ColorMode.Rainbow,
    visField: 'velocity',
    callbacks: {
        postForce: [() => {
            simulation.updateFluid();
        }],
        postAdvect: [],
        postJacobi: [],
        postColor: []
    }
});

// Default settings
const defaultSettings: Partial<SimulationSettings> = {
    numBoids: 64,
    separationWeight: 0.15,
    alignmentWeight: 0.1,
    cohesionWeight: 0.15,
    sightRadius: 0.05,
    predatorPosition: [-1, -1],
    predatorRadius: 0.2,
    predatorWeight: 0.1,
    wallAvoidanceThreshold: 0.15,
    wallAvoidanceWeight: 0.11,
    pointSize: 4,
    wrap: false,
    fluidWeight: 0.2,
    boidWeight: 3,
    fluidEnabled: true,
};

const getFPS = getFpsCallback();
const simulation = new Simulation(canvas, defaultSettings, fluidSim);

const render = () => {
    if (controls.isPausedState()) {
        return;
    }

    const fps = getFPS();
    fpsCounter.textContent = Math.round(fps).toString();
    deltaT = 2 / fps;

    if (simulation.getSettings().fluidEnabled) {
        fluidSim.step(deltaT);
    }
    simulation.step(deltaT);

    requestAnimationFrame(render);
};

const controls = new Controls(simulation, fluidSim, canvas, defaultSettings, render);
requestAnimationFrame(render);
