export const resetBoidsFrag = /* glsl */ `#version 300 es

precision highp float;
precision highp sampler2D;

in vec2 texCoord;

out vec4 color;

void main() {
    // Initialize position (xy) and velocity (zw)
    color = vec4(texCoord, 0.0, 0.0);
}
`;
