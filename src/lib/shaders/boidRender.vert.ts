export const boidRenderVert = /*glsl*/ `#version 300 es
precision highp float;

in vec4 position;

void main() {
    gl_Position = position;
    gl_PointSize = 4.0;
}
`;