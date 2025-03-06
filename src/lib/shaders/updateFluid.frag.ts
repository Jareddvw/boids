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
uniform float boidWeight;

out vec4 fragColor;

void main() {
    vec4 boid = texture(boidPositions, texCoord);
    vec4 fluidVelocity = texture(fluidVelocity, texCoord);

    vec2 boidAcceleration = boid.xy;
    if (abs(boidAcceleration.x) < 0.0001 && abs(boidAcceleration.y) < 0.0001) {
        fragColor = fluidVelocity;
        return;
    }
    vec2 newVelocity = fluidVelocity.xy - boidAcceleration * boidWeight;
    fragColor = vec4(newVelocity, fluidVelocity.zw);
}
`
