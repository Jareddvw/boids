import { Simulation as FluidSim } from "@red_j/webgl-fluid-sim";
import { Renderer } from "../gl/Renderer";
import { SimulationSettings } from "../gl/types";

export class Simulation {
    private renderer: Renderer;

    private settings: SimulationSettings;
    private deltaT = 1 / 60;
    private fluidSim?: FluidSim;

    constructor(canvas: HTMLCanvasElement, settings: Partial<SimulationSettings> = {}, fluidSim?: FluidSim) {
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            throw new Error('WebGL2 not supported');
        }
        this.fluidSim = fluidSim
        
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

    public step(deltaT = 1 / 60) {
        this.deltaT = deltaT;
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
        const { boidLayoutProgram, copyProgram, drawBoidsProgram, fillColorProgram } = renderer.getPrograms();
        const { boidsFBO, boidLayoutFBO } = renderer.getFBOs();
        const size = Math.ceil(Math.sqrt(settings.numBoids));

        fillColorProgram.use();
        fillColorProgram.setUniforms({
            color: [0, 0, 0, 0.0],
        });
        renderer.drawQuad(boidLayoutFBO.writeFBO);
        boidLayoutProgram.use();
        boidLayoutProgram.setUniforms({
            prevPositions: boidsFBO.writeFBO.texture,
            positions: boidsFBO.readFBO.texture,
            canvasSize: [size, size],
            pointSize: settings.pointSize,
        });
        renderer.drawPoints(
            boidLayoutFBO.writeFBO,
            settings.numBoids,
        )
        boidLayoutFBO.swap();
        // copyProgram.use()
        // copyProgram.setTexture('tex', boidLayoutFBO.readFBO.texture, 0)
        // renderer.drawQuad(null);



        // copyProgram.use();
        // copyProgram.setUniforms({
        //     tex: boidsFBO.readFBO.texture,
        // });
        // renderer.drawQuad(null)
        drawBoidsProgram.use();
        drawBoidsProgram.setUniforms({
            positions: boidsFBO.readFBO.texture,
            canvasSize: [size, size],
            pointSize: settings.pointSize,
            colorMode: 0,
        });
        renderer.drawPoints(
            null,
            settings.numBoids,
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

    updateFluid() {
        const { renderer, fluidSim, settings } = this;
        if (!fluidSim) return;
        console.log('updateFluid')
        const { updateFluidProgram, boidLayoutProgram, copyProgram } = renderer.getPrograms();
        const { boidsFBO, boidLayoutFBO } = renderer.getFBOs();

        updateFluidProgram.use();
        updateFluidProgram.setUniforms({
            boidPositions: boidLayoutFBO.readFBO.texture,
            fluidVelocity: fluidSim.getFBOs().velocityFBO.readFBO.texture,
        });
        renderer.drawQuad(fluidSim.getFBOs().velocityFBO.writeFBO);
        fluidSim.getFBOs().velocityFBO.swap();
    }


    resetAll() {
        this.resetBoids()

        const { renderer } = this;
        const { fillColorProgram } = renderer.getPrograms();
        const { boidLayoutFBO } = renderer.getFBOs();
        // fillColorProgram.use();
        // fillColorProgram.setUniforms({
        //     color: [0, 0, 0, 0],
        // });
        // renderer.drawQuad(boidLayoutFBO.readFBO)
        // renderer.drawQuad(boidLayoutFBO.writeFBO)
        // renderer.drawQuad(null);
    }
}
