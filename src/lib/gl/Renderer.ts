import { drawBoidsFrag } from "../shaders/drawBoids.frag";
import { drawBoidsVert } from "../shaders/drawBoids.vert";
import { fillColorFrag } from "../shaders/fillColor.frag";
import { passThroughFrag } from "../shaders/passThrough.frag";
import { passThroughVert } from "../shaders/passThrough.vert";
import { resetBoidsFrag } from "../shaders/resetBoids.frag";
import { updateVelocityFrag } from "../shaders/updateVelocity.frag";
import { DoubleFBO } from "./DoubleFBO";
import { FBO } from "./FBO";
import { Shader } from "./Shader";
import { Program } from "./ShaderProgram";
import { FBORecord, ProgramRecord } from "./types";

/**
 * Class responsible for making draw calls and 
 * managing fbos and programs.
 */
export class Renderer {
    private gl: WebGL2RenderingContext;
    private fbos: FBORecord;
    private programs: ProgramRecord;
    private numBoids = 10_000;

    private quadObjects: {
        quadIndexBuffer: WebGLBuffer | null;
        quadVertexBuffer: WebGLBuffer | null;
        quadIndices: Uint16Array;
        quadVertices: Float32Array;
    }

    private particleObjects: {
        particleBuffer: WebGLBuffer | null;
        particleIndices: Float32Array;
    }

    private prevWidth = 0;
    private prevHeight = 0;

    constructor(gl: WebGL2RenderingContext) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        this.gl = gl;
        this.fbos = this.getFBOs();
        this.programs = this.getPrograms();
        this.prevHeight = gl.canvas.height;
        this.prevWidth = gl.canvas.width;

        this.quadObjects = {
            quadIndexBuffer: gl.createBuffer(),
            quadVertexBuffer: gl.createBuffer(),
            quadIndices: new Uint16Array([3, 2, 0, 0, 1, 2]),
            quadVertices: new Float32Array([
                -1, -1,
                -1, 1,
                1, 1,
                1, -1,
            ])
        }


        this.particleObjects = {
            particleBuffer: gl.createBuffer(),
            particleIndices: new Float32Array(0)
        }
        if (!this.particleObjects.particleBuffer) {
            throw new Error('Failed to create particle buffer')
        }
    }

    public getFBOs(): FBORecord {
        if (this.fbos) {
            return this.fbos;
        }
        const { gl } = this;
        return {
            boidsFBO: new DoubleFBO(gl, Math.sqrt(this.numBoids), Math.sqrt(this.numBoids)),
        }
    }

    public getPrograms(): ProgramRecord {
        if (this.programs) {
            return this.programs;
        }
        const { gl } = this;
        // vertex shaders: TODO
        const passThroughV = new Shader(gl, gl.VERTEX_SHADER, passThroughVert)
        const drawBoidsV = new Shader(gl, gl.VERTEX_SHADER, drawBoidsVert)

        // programs: TODO
        const passThroughF = new Shader(gl, gl.FRAGMENT_SHADER, passThroughFrag)
        const copyProgram = new Program(gl, [passThroughV, passThroughF])

        const drawBoidsF = new Shader(gl, gl.FRAGMENT_SHADER, drawBoidsFrag);
        const drawBoidsProgram = new Program(gl, [drawBoidsV, drawBoidsF])

        const updateVelocityF = new Shader(gl, gl.FRAGMENT_SHADER, updateVelocityFrag)
        const updateVelocityProgram = new Program(gl, [passThroughV, updateVelocityF])

        const fillColorF = new Shader(gl, gl.FRAGMENT_SHADER, fillColorFrag)
        const fillColorProgram = new Program(gl, [passThroughV, fillColorF])

        const resetBoidsF = new Shader(gl, gl.FRAGMENT_SHADER, resetBoidsFrag)
        const resetBoidsProgram = new Program(gl, [passThroughV, resetBoidsF])

        return {
            copyProgram,
            drawBoidsProgram,
            updateVelocityProgram,
            fillColorProgram,
            resetBoidsProgram,
        }
    }

    /**
     * Draws a full-screen quad.
     * @param target The FBO to draw to, or null to draw to the screen.
     */
    public drawQuad(target: FBO | null = null) {
        if (target) {
            target.bind()
        } else {
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
        }
        const { gl, quadObjects } = this;
        const { quadIndexBuffer, quadVertexBuffer, quadIndices, quadVertices } = quadObjects;
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIndexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndices, gl.STATIC_DRAW)

        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
    }

    /**
     * Draws boids.
     * @param boidTexture The texture containing the boids.
     * @param boidProgram The program to use for drawing the boids.
     * @param colorMode The color mode for the boids.
     * @param target The FBO to draw to, or null to draw to the screen.
     * @param numBoids The number of boids to draw.
     * @param pointSize The size of each boid.
     */
    public drawBoids(
        boidTexture: WebGLTexture,
        boidProgram: Program,
        colorMode: number,
        target: FBO | null,
        numBoids = this.numBoids,
        pointSize = 2,
    ) {
        const { gl } = this;
        this.numBoids = numBoids;
        
        if (target) {
            target.bind();
        } else {
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const size = Math.ceil(Math.sqrt(numBoids));
        boidProgram.use();
        boidProgram.setUniforms({
            positions: boidTexture,
            canvasSize: [size, size],
            pointSize,
            colorMode,
        });

        const { particleBuffer } = this.particleObjects;
        gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
        
        if (this.particleObjects.particleIndices.length !== numBoids) {
            const indices = new Float32Array(numBoids);
            for (let i = 0; i < numBoids; i++) {
                indices[i] = i;
            }
            this.particleObjects.particleIndices = indices;
            gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        } else {
            gl.bufferData(gl.ARRAY_BUFFER, this.particleObjects.particleIndices, gl.STATIC_DRAW);
        }

        gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        
        gl.drawArrays(gl.POINTS, 0, numBoids);

        gl.disable(gl.BLEND);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    public maybeResize() {
        if (this.gl.canvas.width === this.prevWidth && this.gl.canvas.height === this.prevHeight) {
            return false
        }
        const { gl, fbos, programs: { copyProgram } } = this;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        // copy the fbos to new ones with the new size
        const newFbos = {
            boidsFBO: new DoubleFBO(gl, Math.sqrt(this.numBoids), Math.sqrt(this.numBoids)),
        }
        if (Object.values(newFbos).some(fbo => !fbo)) {
            throw new Error('Failed to create FBOs')
        }
        Object.keys(fbos).forEach((fboType) => {
            const prevFBO = fbos[fboType as keyof FBORecord]
            const newFBO = newFbos[fboType as keyof FBORecord]
            copyProgram.use()
            if (prevFBO instanceof DoubleFBO && newFBO instanceof DoubleFBO) {
                copyProgram.setTexture('tex', prevFBO.readFBO.texture, 0)
                this.drawQuad(newFBO.readFBO)
                copyProgram.setTexture('tex', prevFBO.writeFBO.texture, 0)
                this.drawQuad(newFBO.writeFBO)
            } else if (prevFBO instanceof FBO && newFBO instanceof FBO) {
                copyProgram.setTexture('tex', prevFBO.texture, 0)
                this.drawQuad(newFBO)
            }
        })

        this.fbos = newFbos
        this.prevWidth = gl.canvas.width
        this.prevHeight = gl.canvas.height
        return true;
    }
}
