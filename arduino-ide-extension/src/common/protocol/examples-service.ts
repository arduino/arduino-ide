import { Sketch } from './sketches-service';

export const ExamplesServicePath = '/services/example-service';
export const ExamplesService = Symbol('ExamplesService');
export interface ExamplesService {
    all(): Promise<ExampleContainer>;
}

export interface ExampleContainer {
    readonly label: string;
    readonly children: ExampleContainer[];
    readonly sketches: Sketch[];
}
