import { Renderer } from "../gl/Renderer";
import { SimulationSettings } from "../gl/types";
import { colors } from "../utils/utils";



export class Simulation {
    private texelDims = [0, 0];

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
        this.texelDims = [1 / canvas.width, 1 / canvas.height];
        
        // Default settings
        const defaultSettings: SimulationSettings = {
        };

        this.settings = { ...defaultSettings, ...settings };
        this.renderer = new Renderer(gl);
        this.resetAll();
    }

    public step() {
        this.drawBoids();
        this.updateVelocities();
        this.updatePositions();
    }

    private updateVelocities() {
        const { renderer } = this;
        const { updateVelocityProgram } = renderer.getPrograms();
        const { boidsFBO, velocitiesFBO } = renderer.getFBOs();

        const boidDensity = 0.001

        updateVelocityProgram.use();
        updateVelocityProgram.setUniforms({
            positions: boidsFBO.readFBO.texture,
            velocities: velocitiesFBO.readFBO.texture,
            boidCount: this.gl.canvas.width * this.gl.canvas.height * boidDensity,
            canvasSize: [this.gl.canvas.width, this.gl.canvas.height],
            separationWeight: 1,
            alignmentWeight: 1,
            cohesionWeight: 1,
            sightRadius: 0.01,
        })
        renderer.drawQuad(velocitiesFBO.writeFBO)
        velocitiesFBO.swap()
    }

    private updatePositions() {
        const { renderer } = this;
        const { advectBoidsProgram } = renderer.getPrograms();
        const { boidsFBO, velocitiesFBO } = renderer.getFBOs();
        advectBoidsProgram.use();
        advectBoidsProgram.setUniforms({
            velocity: velocitiesFBO.readFBO.texture,
            quantity: boidsFBO.readFBO.texture,
            dt: this.deltaT,
            gridScale: 1,
            texelDims: this.texelDims,
        })
        renderer.drawQuad(boidsFBO.writeFBO)
        boidsFBO.swap()
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
        const { renderer } = this;
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
            0.001,
            1,
        )
    }


    private resetAll() {
        this.resetBoids()
    }

}