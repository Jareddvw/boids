/**
 * Updates velocities of boids based on their positions and velocities.
 */
export const updateVelocityFrag = /*glsl*/ `#version 300 es

precision highp float;
precision highp sampler2D;

in vec2 texCoord;
uniform sampler2D velocities;
uniform sampler2D positions;
uniform float boidCount;
uniform vec2 canvasSize;
uniform float separationWeight;
uniform float alignmentWeight;
uniform float cohesionWeight;
uniform float sightRadius;

out vec4 fragColor;

// given an index and the canvas width and height, 
// return the xy position of the boid
vec2 decode(float index, vec2 canvasSize) {
    vec2 texelSize = 1.0 / canvasSize;
    float y = floor(index / canvasSize.x);
    float x = mod(index, canvasSize.x);
    return vec2(x, y) * texelSize + texelSize * 0.5;
}

void main() {
    vec2 position = texture(positions, texCoord).xy;
    vec2 velocity = texture(velocities, texCoord).xy;

    vec2 separation = vec2(0.0);
    vec2 alignment = vec2(0.0);
    vec2 cohesion = vec2(0.0);

    float neighborCount = 0.0;

    for (float i = 0.0; i < boidCount; i += 1.0) {
        vec2 neighborTexCoord = decode(i, canvasSize);

        if (neighborTexCoord == texCoord) {
            continue;
        }

        vec2 neighborPosition = texture(positions, neighborTexCoord).xy;
        vec2 neighborVelocity = texture(velocities, neighborTexCoord).xy;

        float dist = distance(position, neighborPosition);

        if (dist < sightRadius) {
            separation += normalize(position - neighborPosition) / dist;
            alignment += neighborVelocity;
            cohesion += neighborPosition;
            neighborCount += 1.0;
        }
    }

    if (neighborCount > 0.0) {
        // Normalize and weight the forces
        separation = normalize(separation) * separationWeight;
        alignment = normalize(alignment / neighborCount) * alignmentWeight;
        cohesion = normalize((cohesion / neighborCount) - position) * cohesionWeight;
        
        // Update velocity
        velocity += separation + alignment + cohesion;
        
        // Limit velocity
        float maxSpeed = 0.01;
        float speed = length(velocity);
        if (speed > maxSpeed) {
            velocity = normalize(velocity) * maxSpeed;
        }
    }

    fragColor = vec4(velocity, 0.0, 1.0);
}
`