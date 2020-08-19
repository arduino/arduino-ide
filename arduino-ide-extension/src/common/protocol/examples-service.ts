import { Sketch } from './sketches-service';

export const ExamplesServicePath = '/services/example-service';
export const ExamplesService = Symbol('ExamplesService');
export interface ExamplesService {
    builtIns(): Promise<ExampleContainer[]>;
    installed(options: { fqbn: string }): Promise<{ user: ExampleContainer[], current: ExampleContainer[], any: ExampleContainer[] }>;
}

export interface ExampleContainer {
    readonly label: string;
    readonly children: ExampleContainer[];
    readonly sketches: Sketch[];
}
