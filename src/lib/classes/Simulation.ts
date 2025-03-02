import { BoidBuffer } from "../gl/BoidBuffer";
import { Renderer } from "../gl/Renderer";
import { SimulationSettings } from "../gl/types";

export class Simulation {
    private texelDims = [0, 0];

    private gl: WebGL2RenderingContext;
    private renderer: Renderer;

    private settings: SimulationSettings;
    private imageTexture: WebGLTexture | null = null;
    private deltaT = 1 / 60;
    private boidBuffer: BoidBuffer;

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
        this.boidBuffer = new BoidBuffer(gl, this.settings.numBoids || 1000);
        this.renderer = new Renderer(gl);
        this.resetAll();
    }

    public step() {
        this.updateBoids();
        this.drawBoids();
    }

    resetBoids() {
        // reset the boids
    }

    private updateBoids() {
        const { gl, boidBuffer } = this;
        const { updateProgram } = this.renderer.getPrograms();
        
        updateProgram.use();
        
        // Bind source buffers (current positions and velocities)
        boidBuffer.bindSourceBuffers(updateProgram);
        
        // Bind destination buffers for transform feedback
        boidBuffer.bindDestBuffers();
        
        // Set uniforms
        updateProgram.setFloat('deltaTime', this.deltaT);
        // ... other uniforms ...
        
        // Perform transform feedback
        boidBuffer.beginTransformFeedback();
        gl.drawArrays(gl.POINTS, 0, this.settings.numBoids || 1000);
        boidBuffer.endTransformFeedback();
        
        // Swap buffers for next frame
        boidBuffer.swap();
    }

    private drawBoids() {
        const { gl, boidBuffer } = this;
        const { renderProgram } = this.renderer.getPrograms();
        
        renderProgram.use();
        
        // Use current position buffer for rendering
        gl.bindBuffer(gl.ARRAY_BUFFER, boidBuffer.getCurrentPositionBuffer());
        const posLoc = gl.getAttribLocation(renderProgram.getProgram(), 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);
        
        // Draw boids
        gl.drawArrays(gl.POINTS, 0, this.settings.numBoids || 1000);
    }


    private resetAll() {
        this.resetBoids()
    }

}
