import { Program } from "./ShaderProgram";

export class BoidBuffer {
    private gl: WebGL2RenderingContext;
    // Two sets of buffers for ping-pong
    private positionBuffers: [WebGLBuffer, WebGLBuffer];
    private velocityBuffers: [WebGLBuffer, WebGLBuffer];
    private transformFeedback: WebGLTransformFeedback;
    private numBoids: number;
    private currentBuffer = 0; // Track which buffer is current

    constructor(gl: WebGL2RenderingContext, numBoids: number) {
        this.gl = gl;
        this.numBoids = numBoids;
        
        // Create two buffers for each attribute
        this.positionBuffers = [
            gl.createBuffer()!,
            gl.createBuffer()!
        ];
        this.velocityBuffers = [
            gl.createBuffer()!,
            gl.createBuffer()!
        ];
        this.transformFeedback = gl.createTransformFeedback()!;
        
        this.resize(numBoids);
    }

    resize(newNumBoids: number) {
        const { gl } = this;
        this.numBoids = newNumBoids;
        
        // Initialize both position buffers
        const positions = new Float32Array(newNumBoids * 4);
        for (let i = 0; i < newNumBoids; i++) {
            positions[i * 4] = Math.random() * 2 - 1;     // x
            positions[i * 4 + 1] = Math.random() * 2 - 1; // y
            positions[i * 4 + 2] = 0;                     // z
            positions[i * 4 + 3] = 1;                     // w
        }
        
        this.positionBuffers.forEach(buffer => {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_COPY);
        });
        
        // Initialize both velocity buffers
        const velocities = new Float32Array(newNumBoids * 4);
        for (let i = 0; i < newNumBoids; i++) {
            velocities[i * 4] = (Math.random() - 0.5) * 0.1;     // vx
            velocities[i * 4 + 1] = (Math.random() - 0.5) * 0.1; // vy
            velocities[i * 4 + 2] = 0;                           // vz
            velocities[i * 4 + 3] = 0;                           // unused
        }
        
        this.velocityBuffers.forEach(buffer => {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, velocities, gl.DYNAMIC_COPY);
        });
    }

    bindSourceBuffers(program: Program) {
        const { gl } = this;
        
        // Bind current buffers as source
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffers[this.currentBuffer]);
        const posLoc = gl.getAttribLocation(program.getProgram(), 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 4, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.velocityBuffers[this.currentBuffer]);
        const velLoc = gl.getAttribLocation(program.getProgram(), 'velocity');
        gl.enableVertexAttribArray(velLoc);
        gl.vertexAttribPointer(velLoc, 4, gl.FLOAT, false, 0, 0);
    }

    bindDestBuffers() {
        const { gl } = this;
        const nextBuffer = (this.currentBuffer + 1) % 2;
        
        // Bind transform feedback
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.transformFeedback);
        
        // Bind next buffers as destination
        gl.bindBufferBase(
            gl.TRANSFORM_FEEDBACK_BUFFER, 
            0, 
            this.positionBuffers[nextBuffer]
        );
        gl.bindBufferBase(
            gl.TRANSFORM_FEEDBACK_BUFFER, 
            1, 
            this.velocityBuffers[nextBuffer]
        );
    }

    swap() {
        this.currentBuffer = (this.currentBuffer + 1) % 2;
    }

    beginTransformFeedback() {
        const { gl } = this;
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);
    }

    endTransformFeedback() {
        const { gl } = this;
        gl.endTransformFeedback();
        gl.disable(gl.RASTERIZER_DISCARD);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        
        // Important: unbind feedback buffers
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
    }

    getCurrentPositionBuffer() {
        return this.positionBuffers[this.currentBuffer];
    }

    getCurrentVelocityBuffer() {
        return this.velocityBuffers[this.currentBuffer];
    }
}