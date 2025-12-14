/**
 * Compilation Agent
 * 
 * Handles code compilation and error analysis.
 * Based on AGENT_ARCHITECTURE.md specifications.
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import {
  Agent,
  AgentRequest,
  AgentContext,
  AgentResult,
  ValidationResult,
  UserRequest,
  Permission,
} from '../agent-types';
import { CoreService } from '../../../../common/protocol/core-service';
import { SketchesService } from '../../../../common/protocol/sketches-service';
import { BoardsServiceProvider } from '../../../boards/boards-service-provider';
import { BoardsDataStore } from '../../../boards/boards-data-store';
import { ArduinoPreferences } from '../../../arduino-preferences';
import { CommandService } from '@theia/core/lib/common/command';
import { CancellationTokenSource } from '@theia/core/lib/common/cancellation';
import { CurrentSketch } from '../../../sketches-service-client-impl';
import URI from '@theia/core/lib/common/uri';
import { CoreError } from '../../../../common/protocol/core-service';

/**
 * Security: Validates that the sketch path is within allowed boundaries.
 * Prevents directory traversal attacks.
 */
function validateSketchPath(sketchUri: string, context: AgentContext): boolean {
  try {
    const uri = new URI(sketchUri);
    
    // Ensure it's a file URI
    if (!uri.scheme || (uri.scheme !== 'file' && !uri.path.isAbsolute)) {
      return false;
    }

    // If we have a context sketch URI, ensure the target is within the sketch
    if (context.sketchUri) {
      const contextUri = new URI(context.sketchUri);
      const sketchPath = contextUri.path.toString();
      const targetPath = uri.path.toString();
      
      // Ensure target path starts with sketch path
      if (!targetPath.startsWith(sketchPath)) {
        return false;
      }
    }

    // Check for directory traversal attempts
    if (uri.path.toString().includes('..')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Security: Validates that compilation options are safe.
 */
function validateCompilationOptions(options: any): boolean {
  // Ensure sourceOverride keys are valid file paths
  if (options.sourceOverride && typeof options.sourceOverride === 'object') {
    for (const key in options.sourceOverride) {
      if (key.includes('..') || key.startsWith('/') || key.includes('\\')) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Classifies error types from compilation output.
 */
function classifyErrorType(error: { message: string; location?: any }): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('undefined reference') || message.includes('undefined reference to')) {
    return 'linker';
  }
  if (message.includes('multiple definition') || message.includes('already defined')) {
    return 'multiple-definition';
  }
  if (message.includes('expected') || message.includes('missing') || message.includes('parse error')) {
    return 'syntax';
  }
  if (message.includes('no such file') || message.includes('cannot find')) {
    return 'missing-file';
  }
  if (message.includes('not declared') || message.includes('was not declared')) {
    return 'undeclared-identifier';
  }
  if (message.includes('redefinition') || message.includes('redefinition of')) {
    return 'redefinition';
  }
  
  return 'unknown';
}

@injectable()
export class CompilationAgent implements Agent {
  id = 'compilation';
  name = 'Compilation Agent';
  description = 'Handles code compilation and error analysis';
  capabilities = [
    'Trigger compilation via CoreService',
    'Parse compilation output',
    'Extract error messages and line numbers',
    'Classify error types (syntax, linker, etc.)',
    'Provide error context to other agents',
    'Handle compilation flags',
  ];
  permissions = [Permission.SYSTEM_OPERATIONS];

  @inject(CoreService)
  private readonly coreService: CoreService;

  @inject(SketchesService)
  private readonly sketchesService: SketchesService;

  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;

  @inject(BoardsDataStore)
  private readonly boardsDataStore: BoardsDataStore;

  @inject(ArduinoPreferences)
  private readonly preferences: ArduinoPreferences;

  @inject(CommandService)
  private readonly commandService: CommandService;

  canHandle(request: UserRequest): boolean {
    const text = request.text.toLowerCase();
    
    // Check for compilation-related keywords
    if (
      text.includes('compile') ||
      text.includes('build') ||
      text.includes('verify') ||
      text.includes('compilation') ||
      text.includes('compiling') ||
      (text.includes('error') && (text.includes('compile') || text.includes('build'))) ||
      (text.includes('fix') && text.includes('compile'))
    ) {
      return true;
    }
    
    return false;
  }

  validate(request: AgentRequest): ValidationResult {
    const { parameters } = request;
    
    // Validate that we have a sketch context
    if (!request.userIntent) {
      return {
        valid: false,
        errors: ['Missing user intent'],
      };
    }

    // Validate parameters if provided
    if (parameters) {
      if (parameters.sketchUri && typeof parameters.sketchUri === 'string') {
        // Will validate path security in execute
      }
      if (parameters.compilationOptions && typeof parameters.compilationOptions === 'object') {
        if (!validateCompilationOptions(parameters.compilationOptions)) {
          return {
            valid: false,
            errors: ['Invalid or unsafe compilation options'],
          };
        }
      }
    }

    return { valid: true };
  }

  async execute(request: AgentRequest, context: AgentContext): Promise<AgentResult> {
    try {
      // Security: Validate sketch context
      let sketchUri = context.sketchUri;
      if (!sketchUri && context.activeFileUri) {
        // Try to load sketch from active file
        try {
          const sketch = await this.sketchesService.maybeLoadSketch(context.activeFileUri);
          if (sketch) {
            sketchUri = sketch.uri;
          }
        } catch (error) {
          return {
            success: false,
            errors: ['Could not determine sketch location'],
          };
        }
      }

      if (!sketchUri) {
        return {
          success: false,
          errors: ['No sketch context available. Please open a sketch first.'],
        };
      }

      // Security: Validate sketch path
      if (!validateSketchPath(sketchUri, context)) {
        return {
          success: false,
          errors: ['Invalid or unsafe sketch path'],
        };
      }

      // Load sketch
      const sketch = await this.sketchesService.loadSketch(sketchUri);
      if (!sketch || !CurrentSketch.isValid(sketch)) {
        return {
          success: false,
          errors: ['Invalid sketch or sketch not found'],
        };
      }

      // Security: Double-check sketch path is valid
      const sketchUriObj = new URI(sketch.uri);
      if (sketchUriObj.path.toString().includes('..')) {
        return {
          success: false,
          errors: ['Invalid sketch path detected'],
        };
      }

      // Get compilation options
      const compileOptions = await this.buildCompilationOptions(sketch);
      if (!compileOptions) {
        return {
          success: false,
          errors: ['Could not determine compilation options. Please select a board first.'],
        };
      }

      // Security: Validate compilation options
      if (!validateCompilationOptions(compileOptions)) {
        return {
          success: false,
          errors: ['Invalid or unsafe compilation options'],
        };
      }

      // Create cancellation token with timeout (30 seconds)
      const cancellationTokenSource = new CancellationTokenSource();
      const timeout = setTimeout(() => {
        cancellationTokenSource.cancel();
      }, 30000); // 30 second timeout for security

      try {
        // Execute compilation
        const compileSummary = await this.coreService.compile(
          compileOptions,
          cancellationTokenSource.token
        );

        clearTimeout(timeout);

        // Compilation successful
        return {
          success: true,
          message: `✅ Compilation successful!`,
          data: {
            compilationSuccessful: true,
            compileSummary,
            buildPath: compileSummary?.buildPath,
            executableSections: compileSummary?.executableSectionsSize,
            usedLibraries: compileSummary?.usedLibraries,
          },
        };
      } catch (error: any) {
        clearTimeout(timeout);

        // Handle cancellation
        if (error && error.message && error.message.includes('cancelled')) {
          return {
            success: false,
            errors: ['Compilation was cancelled or timed out'],
          };
        }

        // Parse errors from exception
        let errorMessages: string[] = [];
        let classifiedErrors: Array<{ type: string; message: string; location?: any; details?: string }> = [];
        
        if (CoreError.is(error)) {
          // CoreError format with ErrorLocation[]
          const errorLocations = error.data || [];
          classifiedErrors = errorLocations.map(loc => ({
            type: classifyErrorType(loc),
            message: loc.message,
            location: loc.location,
            details: loc.details,
          }));
          errorMessages = classifiedErrors.map(e => `${e.type}: ${e.message}`);
        } else if (error?.message) {
          errorMessages = [error.message];
          classifiedErrors = [{
            type: 'unknown',
            message: error.message,
          }];
        } else {
          errorMessages = ['Compilation failed with unknown error'];
        }

        // Group errors by type
        const errorsByType: Record<string, typeof classifiedErrors> = {};
        classifiedErrors.forEach(error => {
          if (!errorsByType[error.type]) {
            errorsByType[error.type] = [];
          }
          errorsByType[error.type].push(error);
        });

        return {
          success: false,
          errors: errorMessages,
          data: {
            compilationSuccessful: false,
            errorCount: classifiedErrors.length,
            errors: classifiedErrors,
            errorsByType,
            error: error?.message || 'Unknown error',
          },
          suggestions: [
            'Check the error messages above for details',
            'Syntax errors: Check for missing semicolons, brackets, or parentheses',
            'Linker errors: Check for missing libraries or undefined references',
            'Missing file errors: Ensure all included files exist',
          ],
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [
          error instanceof Error ? error.message : 'Failed to execute compilation',
        ],
      };
    }
  }

  /**
   * Builds compilation options from sketch and preferences.
   * Security: Validates all options before returning.
   */
  private async buildCompilationOptions(
    sketch: any
  ): Promise<CoreService.Options.Compile | undefined> {
    try {
      const { boardsConfig } = this.boardsServiceProvider;
      
      if (!boardsConfig.selectedBoard?.fqbn) {
        return undefined;
      }

      // Get FQBN with board configuration
      const fqbn = await this.boardsDataStore.appendConfigToFqbn(
        boardsConfig.selectedBoard.fqbn
      );

      if (!fqbn) {
        return undefined;
      }

      // Get source overrides (user modifications to build)
      const sourceOverride = await this.commandService.executeCommand<
        Record<string, string>
      >('arduino-get-source-override');

      // Security: Validate source overrides
      if (sourceOverride && typeof sourceOverride === 'object') {
        for (const key in sourceOverride) {
          if (key.includes('..') || key.startsWith('/') || key.includes('\\')) {
            // Invalid path, skip this override
            delete sourceOverride[key];
          }
        }
      }

      // Get optimize for debug setting
      const optimizeForDebug = await this.commandService.executeCommand<boolean>(
        'arduino-is-optimize-for-debug'
      );

      // Get preferences
      const verbose = this.preferences.get('arduino.compile.verbose');
      const compilerWarnings = this.preferences.get('arduino.compile.warnings');

      return {
        sketch,
        fqbn,
        optimizeForDebug: Boolean(optimizeForDebug),
        verbose,
        sourceOverride: sourceOverride || {},
        compilerWarnings,
      };
    } catch (error) {
      console.error('Failed to build compilation options:', error);
      return undefined;
    }
  }
}

