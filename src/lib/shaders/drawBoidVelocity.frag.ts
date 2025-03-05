// We call this with drawArrays to color the quad with the 
// velocity of the boid at the given index.
export const drawBoidVelocityFrag = /* glsl */ `#version 300 es

precision highp float;
precision highp sampler2D;

in vec2 texCoord;
in vec4 boidData;

out vec4 fragColor;

void main() {
    vec4 boid = boidData;
    fragColor = vec4(boid.zw, 0.0, 1.0);
}
`;