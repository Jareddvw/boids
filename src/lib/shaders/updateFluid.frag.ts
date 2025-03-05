/**
 * Updates velocity of fluid based on particle positions.
 * We are writing to the fluid velocity texture.
 */
export const updateFluidFrag = /*glsl*/ `#version 300 es

precision highp float;
precision highp sampler2D;

in vec2 texCoord;
uniform sampler2D boidPositions;
uniform sampler2D fluidVelocity;

out vec4 fragColor;

void main() {
    vec4 boid = texture(boidPositions, texCoord);
    vec4 fluidVelocity = texture(fluidVelocity, texCoord);

    vec2 boidVelocity = boid.xy;
    if (abs(boidVelocity.x) < 0.0001 && abs(boidVelocity.y) < 0.0001) {
        fragColor = fluidVelocity;
        return;
    }
    vec2 newVelocity = fluidVelocity.xy + boidVelocity * 0.1;
    fragColor = vec4(newVelocity, fluidVelocity.zw);
}
`
