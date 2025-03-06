import { ColorMode, Simulation as FluidSim, ImpulseType } from "@red_j/webgl-fluid-sim";
import { Simulation } from "./lib/classes/Simulation";
import { SimulationSettings } from "./lib/gl/types";
import { getFpsCallback } from "./lib/utils/utils";
import "./style.css";

const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
const fpsCounter = document.getElementById("fpsCounter") as HTMLElement;
const pauseButton = document.getElementById("pauseButton") as HTMLButtonElement;
const resetButton = document.getElementById("resetButton") as HTMLButtonElement;
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

let deltaT = 0;

const fluidSim = new FluidSim(canvas)
fluidSim.updateSettings({
    colorMode: ColorMode.BlackAndWhite,
    visField: 'velocity',
    callbacks: {
        postForce: [() => {
            simulation.updateFluid()
        }],
        postAdvect: [],
        postJacobi: [],
        postColor: []
    }
})

// gets the nearest square number to a given number
const nearestSquare = (num: number) => {
    const root = Math.sqrt(num);
    const floor = Math.floor(root);
    const ceil = Math.ceil(root);
    return Math.abs(floor * floor - num) < Math.abs(ceil * ceil - num) ? floor * floor : ceil * ceil;
}

// Default settings
const defaultSettings: Partial<SimulationSettings> = {
    numBoids: 64,
    separationWeight: 0.15,
    alignmentWeight: 0.1,
    cohesionWeight: 0.15,
    sightRadius: 0.05,
    predatorRadius: 0.2,
    predatorWeight: 0.1,
    wallAvoidanceThreshold: 0.12,
    wallAvoidanceWeight: 0.15,
    pointSize: 4,
    wrap: false,
};

// Animation state
let isPaused = false;
let animationFrameId: number | null = null;

// Control handling
type ControlId = Exclude<keyof SimulationSettings, 'predatorPosition'>;
const controls: Record<ControlId, HTMLInputElement> = {
    numBoids: document.getElementById('numBoids') as HTMLInputElement,
    separationWeight: document.getElementById('separationWeight') as HTMLInputElement,
    alignmentWeight: document.getElementById('alignmentWeight') as HTMLInputElement,
    cohesionWeight: document.getElementById('cohesionWeight') as HTMLInputElement,
    sightRadius: document.getElementById('sightRadius') as HTMLInputElement,
    predatorRadius: document.getElementById('predatorRadius') as HTMLInputElement,
    predatorWeight: document.getElementById('predatorWeight') as HTMLInputElement,
    wallAvoidanceThreshold: document.getElementById('wallAvoidanceThreshold') as HTMLInputElement,
    wallAvoidanceWeight: document.getElementById('wallAvoidanceWeight') as HTMLInputElement,
    pointSize: document.getElementById('pointSize') as HTMLInputElement,
    wrap: document.getElementById('wrap') as HTMLInputElement,
} as const;

Object.entries(defaultSettings).forEach(([id, value]) => {
    const control = controls[id as ControlId];
    if (control) {
        if (control.type === 'checkbox') {
            control.checked = value as boolean;
        } else if (id === 'numBoids') {
            control.value = String(nearestSquare(Number(value)));
        } else {
            control.value = String(value);
        }
    }
});

const initializeValues = () => {
    Object.entries(controls).forEach(([_, input]) => {
        const valueDisplay = input.parentElement?.querySelector('.value');
        if (valueDisplay && input.type === 'range') {
            valueDisplay.textContent = input.value;
        }
    });
};

const getFPS = getFpsCallback()
const simulation = new Simulation(
    canvas, 
    defaultSettings,
    fluidSim
);

initializeValues();

// Add event listener specifically for numBoids
controls.numBoids.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    const value = nearestSquare(Number(input.value));
    input.value = String(value);
    simulation.updateSettings({ numBoids: value });
    initializeValues();
});

// Modify the general control event listeners to exclude numBoids
Object.entries(controls).forEach(([id, input]) => {
    if (id === 'numBoids') return; // Skip numBoids as it's handled separately
    
    input.addEventListener('input', () => {
        const value = input.type === 'checkbox' ? input.checked : Number(input.value);
        simulation.updateSettings({ [id]: value });
        initializeValues();
    });
});

pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
    pauseButton.classList.toggle('active', isPaused);
    
    if (!isPaused && !animationFrameId) {
        requestAnimationFrame(render);
    }
});

resetButton.addEventListener('click', () => {
    simulation.resetAll();
});

const render = () => {
    if (isPaused) {
        animationFrameId = null;
        return;
    }

    const fps = getFPS();
    fpsCounter.textContent = Math.round(fps).toString();
    deltaT = 2 / fps;

    fluidSim.step(deltaT);
    simulation.step(deltaT);

    animationFrameId = requestAnimationFrame(render);
};
requestAnimationFrame(render);

let mouseDown = false;
canvas.onmouseup = () => {
    mouseDown = false;
    fluidSim.updateSettings({externalForces: [
        {
            impulseDirection: [0, 0],
            impulsePosition: [0, 0],
            impulseRadius: 0,
            impulseMagnitude: 0,
            impulseType: ImpulseType.GaussianSplat,
        }
    ]})
}

canvas.onmousedown = () => {
    mouseDown = true;
}

const handleFluidMouseMove = (e: MouseEvent) => {
    if (mouseDown) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1.0 - (e.clientY - rect.top) / rect.height;
        
        // Calculate velocity based on mouse movement
        const dx = (e.movementX / rect.width);
        const dy = (-e.movementY / rect.height);
        const norm = Math.sqrt(dx * dx + dy * dy);
        const velocity = (norm > 0 ? [dx / norm, dy / norm] : [0, 0]) as [number, number];

        fluidSim.updateSettings({
            externalForces: [
                {
                  "impulseDirection": velocity,
                  "impulsePosition": [
                    x, y
                  ],
                  "impulseRadius": 0.0001,
                  "impulseMagnitude": 0.15165441176470706,
                  "impulseType": 0
                }
              ]
        });
    }
}

canvas.addEventListener('mousemove', (e) => {
    handleFluidMouseMove(e);
    
    // Update predator position for boids
    const x = e.offsetX / canvas.width;
    const y = 1 - e.offsetY / canvas.height;
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
