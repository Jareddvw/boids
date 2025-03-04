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
uniform float separationWeight;
uniform float alignmentWeight;
uniform float cohesionWeight;
uniform float sightRadius;
uniform vec2 predatorPosition;
uniform float predatorRadius;
uniform float predatorWeight;

out vec4 fragColor;

// given an index and the canvas width and height, 
// return the xy position of the boid
vec2 decode(float index) {
    float size = sqrt(boidCount);
    vec2 texelSize = 1.0 / vec2(size, size);
    float y = floor(index / size);
    float x = mod(index, size);
    return vec2(x, y) * texelSize + texelSize * 0.5;
}

float random(vec2 coords) {
    return fract(sin(dot(coords, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec4 boid = texture(boids, texCoord);
    vec2 position = boid.xy;
    vec2 velocity = boid.zw;

    // Add a small random initial velocity if starting from zero
    if (length(velocity) < 0.0001) {
        float angle = random(texCoord) * 6.28318;
        velocity += vec2(cos(angle), sin(angle)) * 0.0005;
    }

    vec2 separation = vec2(0.0);
    vec2 alignment = vec2(0.0);
    vec2 cohesion = vec2(0.0);
    vec2 predatorAvoidance = vec2(0.0);
    float neighborCount = 0.0;

    // Calculate predator avoidance with stronger influence
    float distToPredator = distance(position, predatorPosition);
    if (distToPredator < predatorRadius) {
        // Inverse square for stronger close-range avoidance
        float predatorInfluence = 1.0 - (distToPredator / predatorRadius);
        predatorInfluence = predatorInfluence * predatorInfluence; // Square for stronger effect
        predatorAvoidance = normalize(position - predatorPosition) * predatorInfluence * 0.005;
        
        // Immediately adjust velocity away from predator
        velocity += predatorAvoidance * 5.0;
    }

    // Check all potential neighbors. TODO: optimize
    for (float i = 0.0; i < boidCount; i += 1.0) {
        vec2 neighborTexCoord = decode(i);
        if (neighborTexCoord == texCoord) continue;

        vec4 neighborBoid = texture(boids, neighborTexCoord);
        vec2 neighborPos = neighborBoid.xy;
        vec2 neighborVel = neighborBoid.zw;
        
        vec2 diff = position - neighborPos;
        float dist = length(diff);

        if (dist < sightRadius && dist > 0.0) {
            // Separation: steer away from nearby boids
            separation += normalize(diff) / dist;
            
            // Alignment: steer towards average heading
            alignment += neighborVel;
            
            // Cohesion: steer towards center of mass
            cohesion += neighborPos;
            
            neighborCount += 1.0;
        }
    }

    vec2 acceleration = vec2(0.0);
    if (neighborCount > 0.0) {
        separation = normalize(separation) * separationWeight;
        alignment = normalize(alignment / neighborCount) * alignmentWeight;
        cohesion = normalize((cohesion / neighborCount) - position) * cohesionWeight;
        
        acceleration = separation + alignment + cohesion;
    }

    // Add predator influence
    acceleration += predatorAvoidance * predatorWeight;

    // Update velocity
    velocity += acceleration * deltaT;

    // Limit velocity
    float maxSpeed = 0.1;
    float speed = length(velocity);
    if (speed > maxSpeed) {
        velocity = normalize(velocity) * maxSpeed;
    }
    velocity = clamp(velocity, -maxSpeed * 3.0, maxSpeed * 3.0);

    // Update position
    position += velocity * deltaT;

    // Wrap around edges
    if (position.x < 0.0) position.x += 1.0;
    if (position.x > 1.0) position.x -= 1.0;
    if (position.y < 0.0) position.y += 1.0;
    if (position.y > 1.0) position.y -= 1.0;

    fragColor = vec4(position, velocity);
}
`
