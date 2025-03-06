import { SimulationSettings } from "./gl/types";
import { Simulation } from "./classes/Simulation";
import { Simulation as FluidSim, ImpulseType } from "@red_j/webgl-fluid-sim";

const nearestSquare = (num: number) => {
    const root = Math.sqrt(num);
    const floor = Math.floor(root);
    const ceil = Math.ceil(root);
    return Math.abs(floor * floor - num) < Math.abs(ceil * ceil - num) ? floor * floor : ceil * ceil;
};

type ControlId = Exclude<keyof SimulationSettings, 'predatorPosition'>;

export class Controls {
    private controls: Record<ControlId, HTMLInputElement>;
    private pauseButton: HTMLButtonElement;
    private resetButton: HTMLButtonElement;
    private isPaused: boolean = false;
    private lastMousePos: [number, number] = [0, 0];
    private lastClickedTime: number = 0;
    private prevSpeed: number = 0;
    private lastMovedTime: number = 0;

    constructor(
        private simulation: Simulation,
        private fluidSim: FluidSim,
        private canvas: HTMLCanvasElement,
        private defaultSettings: Partial<SimulationSettings>,
        private render: () => void
    ) {
        this.pauseButton = document.getElementById("pauseButton") as HTMLButtonElement;
        this.resetButton = document.getElementById("resetButton") as HTMLButtonElement;

        this.controls = {
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
            fluidWeight: document.getElementById('fluidWeight') as HTMLInputElement,
            boidWeight: document.getElementById('boidWeight') as HTMLInputElement,
            fluidEnabled: document.getElementById('fluidEnabled') as HTMLInputElement,
        } as const;

        this.initializeControls();
        this.setupEventListeners();
    }

    private initializeControls() {
        Object.entries(this.defaultSettings).forEach(([id, value]) => {
            const control = this.controls[id as ControlId];
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
        this.initializeValues();
    }

    private initializeValues() {
        Object.entries(this.controls).forEach(([_, input]) => {
            const valueDisplay = input.parentElement?.querySelector('.value');
            if (valueDisplay && input.type === 'range') {
                valueDisplay.textContent = input.value;
            }
        });
    }

    private setupEventListeners() {
        this.controls.numBoids.addEventListener('input', (e) => {
            const input = e.target as HTMLInputElement;
            const value = nearestSquare(Number(input.value));
            input.value = String(value);
            this.simulation.updateSettings({ numBoids: value });
            this.initializeValues();
        });

        Object.entries(this.controls).forEach(([id, input]) => {
            if (id === 'numBoids') return; // already handled
            
            input.addEventListener('input', () => {
                const value = input.type === 'checkbox' ? input.checked : Number(input.value);
                this.simulation.updateSettings({ [id]: value });
                this.initializeValues();
            });
        });

        this.pauseButton.addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            this.pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
            this.pauseButton.classList.toggle('active', this.isPaused);
            
            if (!this.isPaused) {
                requestAnimationFrame(this.render);
            }
        });

        this.resetButton.addEventListener('click', () => {
            this.simulation.resetAll();
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('pointerdown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('pointermove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('pointerup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('pointerleave', this.onMouseUp.bind(this));

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;
            this.updatePredatorPosition(x, y);
        });

        this.canvas.onmouseleave = () => {
            this.simulation.updateSettings({
                predatorPosition: [-1, -1]
            });
        };

        this.controls.fluidEnabled.addEventListener('input', () => {
            const isEnabled = this.controls.fluidEnabled.checked;
            this.simulation.updateSettings({ fluidEnabled: isEnabled });
            if (!isEnabled) {
                this.fluidSim.updateSettings({ reset: true });
            }
        });
    }

    private onMouseDown(e: PointerEvent) {
        const doubleClick = performance.now() - this.lastClickedTime < 300;
        if (
            (e instanceof MouseEvent && e.button === 2) ||
            doubleClick
        ) {
            if (doubleClick) {
                e.preventDefault();
            }
        }
        
        const x = (e as MouseEvent).offsetX / this.canvas.width;
        const y = 1 - (e as MouseEvent).offsetY / this.canvas.height;
        this.lastMousePos = [x, y];
        this.canvas.setPointerCapture(e.pointerId);
        this.lastClickedTime = performance.now();
    }

    private onMouseMove(e: PointerEvent) {
        const x = e.offsetX / this.canvas.width;
        const y = 1 - e.offsetY / this.canvas.height;
        this.updatePredatorPosition(x, y);

        if (this.canvas.hasPointerCapture(e.pointerId)) {
            const diff = [x - this.lastMousePos[0], y - this.lastMousePos[1]];
            
            const len = Math.sqrt(diff[0] * diff[0] + diff[1] * diff[1]);
            const normalizedDiff: [number, number] = (len === 0 || len < 0.002) ? [0, 0] : [diff[0] / len, diff[1] / len];

            const [lastX, lastY] = this.lastMousePos;
            const currSpeed = Math.sqrt((x - lastX)**2 + (y - lastY)**2);
            const now = performance.now();
            const acceleration = Math.max(currSpeed - this.prevSpeed, 0) / (now - Math.max(this.lastClickedTime, this.lastMovedTime));

            this.lastMousePos = [x, y];
            this.lastMovedTime = now;
            
            this.fluidSim.updateSettings({
                externalForces: [{
                    impulseDirection: normalizedDiff,
                    impulsePosition: [x, y],
                    impulseRadius: 0.0001,
                    impulseMagnitude: acceleration * 300,
                    impulseType: ImpulseType.GaussianSplat,
                }]
            });
        }
    }

    private onMouseUp(e: PointerEvent) {
        this.fluidSim.updateSettings({
            externalForces: [{
                impulseDirection: [0, 0],
                impulsePosition: [0, 0],
                impulseRadius: 0,
                impulseMagnitude: 0,
                impulseType: ImpulseType.GaussianSplat,
            }]
        });
        this.canvas.releasePointerCapture(e.pointerId);
    }

    private updatePredatorPosition(x: number, y: number) {
        this.simulation.updateSettings({
            predatorPosition: [
                x,
                y
            ]
        });
    }

    public isPausedState() {
        return this.isPaused;
    }
}
