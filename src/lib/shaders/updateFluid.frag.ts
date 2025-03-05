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

    vec2 boidPosition = boid.xy;
    vec2 boidVelocity = boid.zw;

    vec2 diff = boidPosition - texCoord;

    vec4 fluidVelocity = texture(fluidVelocity, texCoord);

    vec2 newVelocity = vec2(fluidVelocity.xy);
    // float r = 0.1;
    // float c = exp(-dot(diff, diff) / r);
    // newVelocity += boidVelocity * c;
    if (length(diff) < 0.01) {
        newVelocity = boidVelocity;
    }

    fragColor = vec4(newVelocity, fluidVelocity.zw);
}
`
