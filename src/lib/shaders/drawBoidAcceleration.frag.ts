// We call this with drawArrays to color the quad with the 
// acceleration of the boid at the given index.
export const drawBoidAccelerationFrag = /* glsl */ `#version 300 es

precision highp float;
precision highp sampler2D;

in vec2 texCoord;
in vec4 boidData;
in vec4 prevBoidData;

out vec4 fragColor;

void main() {
    vec4 boid = boidData;
    vec4 prevBoid = prevBoidData;
    vec2 acceleration = (boid.zw - prevBoid.zw);
    fragColor = vec4(acceleration, 0.0, 1.0);
}
`;