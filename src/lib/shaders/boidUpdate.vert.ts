export const boidUpdateVert = /*glsl*/ `#version 300 es
precision highp float;

in vec4 position;
in vec4 velocity;

out vec4 newPosition;
out vec4 newVelocity;

uniform float deltaTime;

void main() {
    // Simple update for now - just move in the direction of velocity
    newVelocity = velocity;
    newPosition = position + velocity * deltaTime;
    
    // Keep boids within bounds (-1 to 1)
    if (newPosition.x > 1.0) newPosition.x = -1.0;
    if (newPosition.x < -1.0) newPosition.x = 1.0;
    if (newPosition.y > 1.0) newPosition.y = -1.0;
    if (newPosition.y < -1.0) newPosition.y = 1.0;
}
`;