/**
 * Updates velocities of boids based on their positions and velocities.
 */
export const updateVelocityFrag = /*glsl*/ `#version 300 es

precision highp float;
precision highp sampler2D;

in vec2 texCoord;
uniform sampler2D boids;
uniform float deltaT;
uniform float boidCount;
uniform vec2 canvasSize;
uniform float separationWeight;
uniform float alignmentWeight;
uniform float cohesionWeight;
uniform float sightRadius;

out vec4 fragColor;

// given an index and the canvas width and height, 
// return the xy position of the boid
vec2 decode(float index) {
    // vec2 texelSize = 1.0 / canvasSize;
    // float y = floor(index / canvasSize.x);
    // float x = mod(index, canvasSize.x);
    // return vec2(x, y) * texelSize + texelSize * 0.5;

    float boidDensity = boidCount / (canvasSize.x * canvasSize.y);
    float scaledIndex = (1.0 / boidDensity) * index;
    vec2 texelSize = 1.0 / canvasSize;
    float y = floor(scaledIndex / canvasSize.x);
    float x = mod(scaledIndex, canvasSize.x);
    return vec2(x, y) * texelSize + texelSize * 0.5;
}

void main() {
    vec4 boid = texture(boids, texCoord);
    vec2 position = boid.xy;
    vec2 velocity = boid.zw;

    vec2 separation = vec2(0.0);
    vec2 alignment = vec2(0.0);
    vec2 cohesion = vec2(0.0);

    float neighborCount = 0.0;

    for (float i = 0.0; i < boidCount; i += 1.0) {
        vec2 neighborTexCoord = decode(i);

        if (neighborTexCoord == texCoord) {
            continue;
        }

        vec4 neighborBoid = texture(boids, neighborTexCoord);
        vec2 neighborPosition = neighborBoid.xy;
        vec2 neighborVelocity = neighborBoid.zw;

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
        float maxSpeed = 0.001;
        float speed = length(velocity);
        if (speed > maxSpeed) {
            velocity = normalize(velocity) * maxSpeed;
        }
    }

    velocity = clamp(velocity, -0.1, 0.1);

    // Update position
    position += velocity * deltaT;
    if (position.x < 0.0) {
        position.x = 1.0;
    } else if (position.x > 1.0) {
        position.x = 0.0;
    }
    if (position.y < 0.0) {
        position.y = 1.0;
    } else if (position.y > 1.0) {
        position.y = 0.0;
    }

    fragColor = vec4(position, velocity);
}
`