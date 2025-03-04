import { DoubleFBO } from "./DoubleFBO"
import { Program } from "./ShaderProgram"

const ShaderTypes = [
    'copyProgram',
    'updateVelocityProgram',
    'drawBoidsProgram',
    'fillColorProgram',
    'resetBoidsProgram',
] as const
type ShaderType = typeof ShaderTypes[number]
export type ProgramRecord = { [key in ShaderType]: Program }

export type FBORecord = {
    boidsFBO: DoubleFBO,
}

export type SimulationSettings = {
    numBoids: number,
    separationWeight: number,
    alignmentWeight: number,
    cohesionWeight: number,
    sightRadius: number,
}