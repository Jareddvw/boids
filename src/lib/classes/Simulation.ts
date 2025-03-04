import { Renderer } from "../gl/Renderer";
import { SimulationSettings } from "../gl/types";
import { colors } from "../utils/utils";



export class Simulation {
    private renderer: Renderer;

    private settings: SimulationSettings;
    private deltaT = 1 / 60;

    constructor(canvas: HTMLCanvasElement, settings: Partial<SimulationSettings> = {}) {
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            throw new Error('WebGL2 not supported');
        }
        
        // Default settings
        const defaultSettings: SimulationSettings = {
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
        };

        this.settings = { ...defaultSettings, ...settings };
        this.renderer = new Renderer(gl);
        this.resetAll();
    }

    public updateSettings(settings: Partial<SimulationSettings>) {
        this.settings = { ...this.settings, ...settings };
    }

    public step() {
        this.renderer.maybeResize();
        this.drawBoids();
        this.updateBoids();
    }

    resetBoids() {
        const { renderer } = this;
        const { boidsFBO } = renderer.getFBOs();
        const { resetBoidsProgram } = renderer.getPrograms();
        resetBoidsProgram.use()
        renderer.drawQuad(boidsFBO.readFBO)
    }

    private drawBoids() {
        const { renderer, settings } = this;
        const { fillColorProgram, drawBoidsProgram } = renderer.getPrograms();
        const { boidsFBO } = renderer.getFBOs();
        fillColorProgram.use()
        fillColorProgram.setVec4('color', colors.black)
        renderer.drawQuad(null)
        renderer.drawBoids(
            boidsFBO.readFBO.texture,
            drawBoidsProgram,
            0,
            null,
            settings.numBoids,
            settings.pointSize,
        )
    }

    private updateBoids() {
        const { renderer, settings } = this;
        const { updateVelocityProgram } = renderer.getPrograms();
        const { boidsFBO } = renderer.getFBOs();
        updateVelocityProgram.use();
        updateVelocityProgram.setUniforms({
            boids: boidsFBO.readFBO.texture,
            deltaT: this.deltaT,
            boidCount: settings.numBoids,
            separationWeight: settings.separationWeight,
            alignmentWeight: settings.alignmentWeight,
            cohesionWeight: settings.cohesionWeight,
            sightRadius: settings.sightRadius,
            predatorPosition: settings.predatorPosition,
            predatorRadius: settings.predatorRadius,
            predatorWeight: settings.predatorWeight,
            wallAvoidanceThreshold: settings.wallAvoidanceThreshold,
            wallAvoidanceWeight: settings.wallAvoidanceWeight,
            wrap: settings.wrap,
        });
        renderer.drawQuad(boidsFBO.writeFBO);
        boidsFBO.swap();
    }


    private resetAll() {
        this.resetBoids()
    }

}
