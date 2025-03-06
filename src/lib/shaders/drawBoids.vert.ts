/**
 * Vertex shader which transforms the point given by the boid index
 * to a position encoded in the positions texture.
 */
export const drawBoidsVert = /* glsl */ `#version 300 es

precision highp float;

layout(location=0) in float index;

uniform sampler2D positions;
uniform sampler2D prevPositions;
uniform vec2 canvasSize;
uniform float pointSize;

out vec2 texCoord;
out float indexOut;

out vec4 boidData;
out vec4 prevBoidData;

void main() {
    float size = canvasSize.x;
    float y = floor(index / size);
    float x = mod(index, size);
    vec2 texPos = (vec2(x, y) + 0.5) / size;
    
    boidData = texture(positions, texPos);
    prevBoidData = texture(prevPositions, texPos);
    texCoord = boidData.xy;
    indexOut = index;
    
    gl_PointSize = pointSize;
    gl_Position = vec4(boidData.xy * 2.0 - 1.0, 0.0, 1.0);
}`;
