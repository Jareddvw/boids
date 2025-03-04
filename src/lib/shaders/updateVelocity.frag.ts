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
uniform float wallAvoidanceThreshold;
uniform float wallAvoidanceWeight;
uniform bool wrap;

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
        predatorAvoidance = normalize(position - predatorPosition) * predatorInfluence * predatorWeight;
        
        // Immediately adjust velocity away from predator
        velocity += predatorAvoidance;
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
            // sum everything for now, convert to avg later
            separation += normalize(diff) / dist;
            alignment += neighborVel;
            cohesion += neighborPos;
            
            neighborCount += 1.0;
        }
    }

    vec2 acceleration = vec2(0.0);
    if (neighborCount > 0.0) {
        separation = normalize(separation) * separationWeight;
        alignment = normalize(alignment / neighborCount) * alignmentWeight;
        cohesion = normalize((cohesion / neighborCount) - position) * cohesionWeight;
        
        acceleration = separation + alignment + cohesion; // F=ma=a
    }

    acceleration += predatorAvoidance;

    vec2 wallAvoidance = vec2(0.0);
    if (position.x < wallAvoidanceThreshold || position.x > 1.0 - wallAvoidanceThreshold) {
        wallAvoidance.x = -sign(position.x - 0.5);
    }
    if (position.y < wallAvoidanceThreshold || position.y > 1.0 - wallAvoidanceThreshold) {
        wallAvoidance.y = -sign(position.y - 0.5);
    }
    acceleration += wallAvoidance * wallAvoidanceWeight;

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
    if (wrap) {
        position = mod(position, 1.0);
    } else {
        position = clamp(position, 0.0, 1.0);
        if (position.x == 0.0 || position.x == 1.0) {
            velocity.x = 0.0;
        }
        if (position.y == 0.0 || position.y == 1.0) {
            velocity.y = 0.0;
        }
    }

    fragColor = vec4(position, velocity);
}
`
