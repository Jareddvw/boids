import { DoubleFBO } from "./DoubleFBO"
import { Program } from "./ShaderProgram"

const ShaderTypes = [
    'copyProgram',
    'updateVelocityProgram',
    'drawBoidsProgram',
    'fillColorProgram',
    'resetBoidsProgram',
    'updateFluidProgram',
    // boids are stored in a texture as a 2d array of vec4s
    // but we need to draw them to a quad in order to sample them for the fluid sim
    'boidLayoutProgram',
] as const
type ShaderType = typeof ShaderTypes[number]
export type ProgramRecord = { [key in ShaderType]: Program }

export type FBORecord = {
    boidsFBO: DoubleFBO,
    boidLayoutFBO: DoubleFBO,
}

export interface SimulationSettings {
    numBoids: number,
    separationWeight: number,
    alignmentWeight: number,
    cohesionWeight: number,
    sightRadius: number,
    predatorPosition: [number, number],  
    predatorRadius: number,  
    predatorWeight: number,  
    wallAvoidanceThreshold: number,
    wallAvoidanceWeight: number,
    pointSize: number,
    wrap: boolean, // whether boids wrap around the edges
    fluidWeight: number,
    boidWeight: number,
    fluidEnabled: boolean,
}
