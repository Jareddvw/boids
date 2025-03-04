import { Renderer } from "../gl/Renderer";
import { SimulationSettings } from "../gl/types";
import { colors } from "../utils/utils";



export class Simulation {
    private gl: WebGL2RenderingContext;
    private renderer: Renderer;

    private settings: SimulationSettings;
    private imageTexture: WebGLTexture | null = null;
    private deltaT = 1 / 60;

    constructor(canvas: HTMLCanvasElement, settings: Partial<SimulationSettings> = {}) {
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            throw new Error('WebGL2 not supported');
        }
        this.gl = gl;
        
        // Default settings
        const defaultSettings: SimulationSettings = {
            numBoids: 10_000,
            separationWeight: 1,
            alignmentWeight: 1,
            cohesionWeight: 1,
            sightRadius: 0.01,
        };

        this.settings = { ...defaultSettings, ...settings };
        this.renderer = new Renderer(gl);
        this.resetAll();
    }

    public updateSettings(settings: Partial<SimulationSettings>) {
        this.settings = { ...this.settings, ...settings };
    }

    public step() {
        this.drawBoids();
        // console.log("Canvas size: ", this.gl.canvas.width, this.gl.canvas.height, this.gl.canvas.width * this.gl.canvas.height)
        this.updateBoids();
    }

    resetBoids() {
        // reset the boids
        const { renderer } = this;
        const { boidsFBO } = renderer.getFBOs();
        const { resetBoidsProgram } = renderer.getPrograms();
        resetBoidsProgram.use()
        renderer.drawQuad(boidsFBO.readFBO)
    }

    private drawBoids() {
        // draw the boids to the screen
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
            1,
        )
    }

    private updateBoids() {
        // update the boids
        const { renderer, settings } = this;
        const { updateVelocityProgram } = renderer.getPrograms();
        const { boidsFBO } = renderer.getFBOs();
        updateVelocityProgram.use()
        updateVelocityProgram.setUniforms({
            boids: boidsFBO.readFBO.texture,
            deltaT: this.deltaT,
            boidCount: settings.numBoids,
            canvasSize: [Math.sqrt(settings.numBoids), Math.sqrt(settings.numBoids)],
            separationWeight: settings.separationWeight,
            alignmentWeight: settings.alignmentWeight,
            cohesionWeight: settings.cohesionWeight,
            sightRadius: settings.sightRadius,
        })
        renderer.drawQuad(boidsFBO.writeFBO)
        boidsFBO.swap()
    }


    private resetAll() {
        this.resetBoids()
    }

}