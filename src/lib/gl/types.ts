import { DoubleFBO } from "./DoubleFBO"
import { Program } from "./ShaderProgram"

const ShaderTypes = [
    'copyProgram',
    'updateVelocityProgram',
    'drawBoidsProgram',
    'fillColorProgram',
    'resetBoidsProgram',
    'advectBoidsProgram',
] as const
type ShaderType = typeof ShaderTypes[number]
export type ProgramRecord = { [key in ShaderType]: Program }

export type FBORecord = {
    boidsFBO: DoubleFBO,
    velocitiesFBO: DoubleFBO,
}

export type SimulationSettings = {}