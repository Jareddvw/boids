import { DoubleFBO } from "./DoubleFBO"
import { Program } from "./ShaderProgram"

const ShaderTypes = [
    'copyProgram'
] as const
type ShaderType = typeof ShaderTypes[number]
export type ProgramRecord = { [key in ShaderType]: Program }

export type FBORecord = {
    boidsFBO: DoubleFBO,
}

export type SimulationSettings = {}