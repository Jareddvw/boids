/**
 * Takes a boid index, draws it based on its position in the texture
 * or its initial position, colors it based on the colorMode.
 */
export const drawBoidsFrag = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 texCoord;
in float indexOut;

uniform vec2 canvasSize;
uniform float colorMode;

out vec4 fragColor;

// given an index and the canvas width and height, 
// return the xy position of the boid
vec2 decode(float index, vec2 canvasSize) {
    vec2 texelSize = 1.0 / canvasSize;
    float y = floor(index / canvasSize.x);
    float x = mod(index, canvasSize.x);
    return vec2(x, y) * texelSize + texelSize * 0.5;
}

// Color the boid based on the velocity at its position.
void main() {
    if (colorMode == 0.0) {
        // rainbow
        // vec2 initialPos = decode(indexOut, canvasSize);
        // float blue = length(initialPos - vec2(1.0, 1.0));
        // blue = max(blue, 0.0);
        // fragColor = vec4(abs(initialPos.xy), blue, 1.0);
        fragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
        fragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
}
`;