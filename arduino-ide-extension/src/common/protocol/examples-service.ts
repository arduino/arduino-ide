import { SketchContainer } from './sketches-service';

export const ExamplesServicePath = '/services/example-service';
export const ExamplesService = Symbol('ExamplesService');
export interface ExamplesService {
    builtIns(): Promise<SketchContainer[]>;
    installed(options: { fqbn: string }): Promise<{ user: SketchContainer[], current: SketchContainer[], any: SketchContainer[] }>;
}


