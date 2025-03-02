import { Renderer } from "../gl/Renderer";
import { SimulationSettings } from "../gl/types";



export class Simulation {
    private texelDims = [0, 0];

    private gl: WebGL2RenderingContext;
    private renderer: Renderer;

    private settings: SimulationSettings;
    private imageTexture: WebGLTexture | null = null;
    private deltaT = 1 / 60;

    constructor(canvas: HTMLCanvasElement, settings: Partial<SimulationSettings> = {}) {
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            throw new Error('WebGL2 not supported');
        }
        this.gl = gl;
        this.texelDims = [1 / canvas.width, 1 / canvas.height];
        
        // Default settings
        const defaultSettings: SimulationSettings = {
        };

        this.settings = { ...defaultSettings, ...settings };
        this.renderer = new Renderer(gl);
        this.resetAll();
    }



    private resetAll() {
        // TODO
    }

}