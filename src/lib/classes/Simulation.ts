import { Simulation as FluidSim } from "@red_j/webgl-fluid-sim";
import { Renderer } from "../gl/Renderer";
import { SimulationSettings } from "../gl/types";

export class Simulation {
    private renderer: Renderer;

    private settings: SimulationSettings;
    private deltaT = 1 / 60;
    private fluidSim?: FluidSim;

    private defaultSettings: SimulationSettings = {
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

    constructor(canvas: HTMLCanvasElement, settings: Partial<SimulationSettings> = {}, fluidSim?: FluidSim) {
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            throw new Error('WebGL2 not supported');
        }
        this.fluidSim = fluidSim
        
        this.settings = { ...this.defaultSettings, ...settings };
        this.renderer = new Renderer(gl);
        this.resetAll();
    }

    public updateSettings(settings: Partial<SimulationSettings>) {
        this.settings = { ...this.settings, ...settings };
    }

    public getSettings() {
        return this.settings;
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
        const { boidLayoutProgram, drawBoidsProgram, fillColorProgram } = renderer.getPrograms();
        const { boidsFBO, boidLayoutFBO } = renderer.getFBOs();
        const size = Math.ceil(Math.sqrt(settings.numBoids));

        if (settings.fluidEnabled) {
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
        } else {
            fillColorProgram.use();
            fillColorProgram.setUniforms({
                color: [0, 0, 0, 1.0],
            });
            renderer.drawQuad(null);
        }

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
        const { renderer, settings, fluidSim } = this;
        const { updateVelocityProgram } = renderer.getPrograms();
        const { boidsFBO } = renderer.getFBOs();
        updateVelocityProgram.use();
        updateVelocityProgram.setUniforms({
            boids: boidsFBO.readFBO.texture,
            fluidVelocity: settings.fluidEnabled ? fluidSim?.getFBOs().velocityFBO.readFBO.texture : null,
            fluidWeight: settings.fluidEnabled ? settings.fluidWeight : 0,
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
        if (!fluidSim || !settings.fluidEnabled) return;
        const { updateFluidProgram } = renderer.getPrograms();
        const { boidLayoutFBO } = renderer.getFBOs();

        updateFluidProgram.use();
        updateFluidProgram.setUniforms({
            boidPositions: boidLayoutFBO.readFBO.texture,
            fluidVelocity: fluidSim.getFBOs().velocityFBO.readFBO.texture,
            boidWeight: settings.boidWeight,
        });
        renderer.drawQuad(fluidSim.getFBOs().velocityFBO.writeFBO);
        fluidSim.getFBOs().velocityFBO.swap();
    }


    resetAll() {
        this.fluidSim?.resetAll()
        this.resetBoids()

        const { renderer } = this;
        const { fillColorProgram } = renderer.getPrograms();
        const { boidLayoutFBO } = renderer.getFBOs();
        fillColorProgram.use();
        fillColorProgram.setUniforms({
            color: [0, 0, 0, 1.0],
        });
        renderer.drawQuad(boidLayoutFBO.readFBO)
        renderer.drawQuad(boidLayoutFBO.writeFBO)
        renderer.drawQuad(null);
    }
}
