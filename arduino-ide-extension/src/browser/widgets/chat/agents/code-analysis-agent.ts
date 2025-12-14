/**
 * Code Analysis Agent
 * 
 * Analyzes code for errors, patterns, and optimization opportunities.
 * Security: READ-ONLY access - never modifies code.
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
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';
import { SketchesService } from '../../../../common/protocol/sketches-service';
import { LibraryService } from '../../../../common/protocol/library-service';

/**
 * Security: Validates that file paths are within allowed boundaries.
 * Prevents directory traversal attacks.
 */
function validateFilePath(fileUri: string, context: AgentContext): boolean {
  try {
    const uri = new URI(fileUri);
    
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
 * Detects common Arduino code smells and anti-patterns.
 */
interface CodeSmell {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  location?: { file: string; line: number };
  suggestion?: string;
}

function detectCodeSmells(code: string, fileName: string): CodeSmell[] {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const lineNum = index + 1;

    // Check for magic numbers
    if (/\b\d{3,}\b/.test(trimmed) && !trimmed.includes('//') && !trimmed.startsWith('//')) {
      const match = /\b(\d{3,})\b/.exec(trimmed);
      if (match && !match[1].startsWith('0x') && !match[1].startsWith('0b')) {
        smells.push({
          type: 'magic-number',
          severity: 'info',
          message: `Magic number detected: ${match[1]}`,
          location: { file: fileName, line: lineNum },
          suggestion: 'Consider using a named constant instead',
        });
      }
    }

    // Check for missing delay() in loop() (potential infinite loop)
    if (trimmed.includes('void loop()') || trimmed.includes('loop() {')) {
      // Check if loop contains any delay or blocking operations
      const loopStart = index;
      let loopEnd = code.length;
      let braceCount = 0;
      let inLoop = false;

      for (let i = loopStart; i < lines.length; i++) {
        const l = lines[i];
        if (l.includes('{')) braceCount++;
        if (l.includes('}')) braceCount--;
        if (braceCount === 0 && inLoop) {
          loopEnd = i;
          break;
        }
        if (l.includes('loop')) inLoop = true;
      }

      const loopCode = lines.slice(loopStart, loopEnd + 1).join('\n');
      if (
        !loopCode.includes('delay') &&
        !loopCode.includes('millis()') &&
        !loopCode.includes('delayMicroseconds') &&
        loopCode.length > 50
      ) {
        smells.push({
          type: 'missing-delay',
          severity: 'warning',
          message: 'Loop may run too fast without delays',
          location: { file: fileName, line: lineNum },
          suggestion: 'Consider adding delay() or using millis() for non-blocking delays',
        });
      }
    }

    // Check for unused variables (simple heuristic)
    if (trimmed.includes('int ') && !trimmed.includes('=') && !trimmed.includes(';')) {
      const varMatch = /int\s+(\w+)/.exec(trimmed);
      if (varMatch) {
        const varName = varMatch[1];
        // Simple check: see if variable is used elsewhere
        const usageCount = (code.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
        if (usageCount <= 1) {
          smells.push({
            type: 'potentially-unused-variable',
            severity: 'info',
            message: `Variable '${varName}' may be unused`,
            location: { file: fileName, line: lineNum },
            suggestion: 'Remove if unused, or use it in your code',
          });
        }
      }
    }

    // Check for missing pinMode() calls
    if (
      (trimmed.includes('digitalWrite') || trimmed.includes('digitalRead')) &&
      !code.includes('pinMode')
    ) {
      smells.push({
        type: 'missing-pinmode',
        severity: 'warning',
        message: 'Using digital I/O without pinMode()',
        location: { file: fileName, line: lineNum },
        suggestion: 'Add pinMode() calls in setup() to configure pins',
      });
    }

    // Check for Serial.print without Serial.begin
    if (trimmed.includes('Serial.print') && !code.includes('Serial.begin')) {
      smells.push({
        type: 'missing-serial-begin',
        severity: 'warning',
        message: 'Using Serial without Serial.begin()',
        location: { file: fileName, line: lineNum },
        suggestion: 'Add Serial.begin(9600) in setup()',
      });
    }
  });

  return smells;
}

/**
 * Analyzes code structure and dependencies.
 */
interface CodeStructure {
  hasSetup: boolean;
  hasLoop: boolean;
  includes: string[];
  functions: Array<{ name: string; line: number }>;
  variables: Array<{ name: string; type: string; line: number }>;
  totalLines: number;
}

function analyzeCodeStructure(code: string): CodeStructure {
  const lines = code.split('\n');
  const structure: CodeStructure = {
    hasSetup: false,
    hasLoop: false,
    includes: [],
    functions: [],
    variables: [],
    totalLines: lines.length,
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for setup/loop
    if (trimmed.includes('void setup()')) structure.hasSetup = true;
    if (trimmed.includes('void loop()')) structure.hasLoop = true;

    // Extract includes
    if (trimmed.startsWith('#include')) {
      const match = /#include\s*[<"]([^>"]+)[>"]/.exec(trimmed);
      if (match) {
        structure.includes.push(match[1]);
      }
    }

    // Extract function declarations
    const funcMatch = /^(void|int|float|double|bool|char|String|byte|word|long|unsigned)\s+(\w+)\s*\(/.exec(
      trimmed
    );
    if (funcMatch && funcMatch[2] !== 'setup' && funcMatch[2] !== 'loop') {
      structure.functions.push({
        name: funcMatch[2],
        line: index + 1,
      });
    }

    // Extract variable declarations (simple heuristic)
    const varMatch = /^(const\s+)?(int|float|double|bool|char|String|byte|word|long|unsigned)\s+(\w+)/.exec(
      trimmed
    );
    if (varMatch && !trimmed.includes('(')) {
      structure.variables.push({
        name: varMatch[3],
        type: varMatch[2],
        line: index + 1,
      });
    }
  });

  return structure;
}

/**
 * Suggests optimizations based on code analysis.
 */
function suggestOptimizations(
  structure: CodeStructure,
  smells: CodeSmell[]
): string[] {
  const suggestions: string[] = [];

  // Check for missing setup/loop
  if (!structure.hasSetup) {
    suggestions.push('Consider adding a setup() function for initialization');
  }
  if (!structure.hasLoop) {
    suggestions.push('Consider adding a loop() function for main program logic');
  }

  // Check code smells
  const errors = smells.filter(s => s.severity === 'error');
  const warnings = smells.filter(s => s.severity === 'warning');

  if (errors.length > 0) {
    suggestions.push(`Found ${errors.length} error(s) that should be fixed`);
  }
  if (warnings.length > 0) {
    suggestions.push(`Found ${warnings.length} warning(s) to review`);
  }

  // Check for potential optimizations
  if (structure.totalLines > 500) {
    suggestions.push('Consider breaking code into multiple files or functions');
  }

  if (structure.variables.length > 20) {
    suggestions.push('Consider organizing variables into structures or classes');
  }

  return suggestions;
}

@injectable()
export class CodeAnalysisAgent implements Agent {
  id = 'code-analysis';
  name = 'Code Analysis Agent';
  description = 'Analyzes code for errors, patterns, and optimization opportunities';
  capabilities = [
    'Parse compilation errors and warnings',
    'Analyze code structure and dependencies',
    'Detect code smells and anti-patterns',
    'Suggest optimizations',
    'Identify missing includes/libraries',
    'Read sketch files (.ino, .cpp, .h)',
    'Check library dependencies',
  ];
  permissions = [Permission.READ_ONLY];

  @inject(FileService)
  private readonly fileService: FileService;

  @inject(SketchesService)
  private readonly sketchesService: SketchesService;

  @inject(LibraryService)
  private readonly libraryService: LibraryService;

  canHandle(request: UserRequest): boolean {
    const text = request.text.toLowerCase();
    
    // Check for analysis-related keywords
    if (
      text.includes('analyze') ||
      text.includes('analysis') ||
      text.includes('review') ||
      text.includes('check code') ||
      text.includes('code quality') ||
      text.includes('code smell') ||
      text.includes('optimize') ||
      text.includes('optimization') ||
      text.includes('error') ||
      text.includes('warning') ||
      text.includes('pattern') ||
      text.includes('structure')
    ) {
      return true;
    }
    
    return false;
  }

  validate(request: AgentRequest): ValidationResult {
    const { parameters } = request;
    
    if (!request.userIntent) {
      return {
        valid: false,
        errors: ['Missing user intent'],
      };
    }

    // Validate file paths if provided
    if (parameters && parameters.files && Array.isArray(parameters.files)) {
      // Will validate paths in execute method
    }

    return { valid: true };
  }

  async execute(request: AgentRequest, context: AgentContext): Promise<AgentResult> {
    try {
      // Security: Validate context
      let sketchUri = context.sketchUri;
      if (!sketchUri && context.activeFileUri) {
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
      if (!validateFilePath(sketchUri, context)) {
        return {
          success: false,
          errors: ['Invalid or unsafe sketch path'],
        };
      }

      // Get sketch files to analyze
      const sketch = await this.sketchesService.loadSketch(sketchUri);
      if (!sketch) {
        return {
          success: false,
          errors: ['Invalid sketch or sketch not found'],
        };
      }

      // Get all files in sketch
      const filesToAnalyze: string[] = [];
      if (context.sketchFiles && context.sketchFiles.length > 0) {
        filesToAnalyze.push(...context.sketchFiles);
      } else {
        // Load sketch files
        const sketchUriObj = new URI(sketch.uri);
        try {
          const files = await this.fileService.resolve(sketchUriObj);
          if (files.children) {
            for (const child of files.children) {
              if (child.isFile && (child.name.endsWith('.ino') || child.name.endsWith('.cpp') || child.name.endsWith('.h'))) {
                filesToAnalyze.push(child.resource.toString());
              }
            }
          }
        } catch (error) {
          // Fallback: use main sketch file
          filesToAnalyze.push(sketch.mainFileUri);
        }
      }

      // Security: Validate all file paths
      for (const fileUri of filesToAnalyze) {
        if (!validateFilePath(fileUri, context)) {
          return {
            success: false,
            errors: [`Invalid or unsafe file path: ${fileUri}`],
          };
        }
      }

      // Analyze each file
      const analysisResults: Array<{
        file: string;
        structure: CodeStructure;
        smells: CodeSmell[];
        code: string;
      }> = [];

      for (const fileUri of filesToAnalyze) {
        try {
          // Security: Additional path validation
          const uri = new URI(fileUri);
          if (uri.path.toString().includes('..')) {
            continue; // Skip invalid paths
          }

          // Read file content
          const fileContent = await this.fileService.read(uri);
          const code = fileContent.value;

          // Security: Limit file size (prevent reading huge files)
          if (code.length > 1000000) {
            // 1MB limit
            analysisResults.push({
              file: uri.path.base,
              structure: {
                hasSetup: false,
                hasLoop: false,
                includes: [],
                functions: [],
                variables: [],
                totalLines: 0,
              },
              smells: [
                {
                  type: 'file-too-large',
                  severity: 'warning',
                  message: 'File too large to analyze completely',
                },
              ],
              code: '',
            });
            continue;
          }

          // Analyze code
          const structure = analyzeCodeStructure(code);
          const smells = detectCodeSmells(code, uri.path.base);

          analysisResults.push({
            file: uri.path.base,
            structure,
            smells,
            code: code.substring(0, 1000), // Limit code size in response
          });
        } catch (error) {
          // Skip files that can't be read
          console.warn(`Could not analyze file ${fileUri}:`, error);
          continue;
        }
      }

      if (analysisResults.length === 0) {
        return {
          success: false,
          errors: ['No files could be analyzed'],
        };
      }

      // Aggregate results
      const allSmells = analysisResults.flatMap(r => r.smells);
      const allIncludes = new Set<string>();
      analysisResults.forEach(r => {
        r.structure.includes.forEach(inc => allIncludes.add(inc));
      });

      // Check for missing libraries
      const missingLibraries: string[] = [];
      const installedLibraries = await this.libraryService.list({});
      const installedLibraryNames = new Set(
        installedLibraries.map(lib => lib.name.toLowerCase())
      );

      for (const include of allIncludes) {
        const libraryName = include
          .replace(/\.h$/, '')
          .split('/')
          .pop()
          ?.toLowerCase();
        
        if (libraryName && !installedLibraryNames.has(libraryName)) {
          // Check if it's not a standard library
          const standardLibs = ['arduino', 'std', 'stdlib', 'string', 'math', 'stdio'];
          if (!standardLibs.some(std => libraryName.includes(std))) {
            missingLibraries.push(libraryName);
          }
        }
      }

      // Generate suggestions
      const suggestions = suggestOptimizations(
        analysisResults[0]?.structure || {
          hasSetup: false,
          hasLoop: false,
          includes: [],
          functions: [],
          variables: [],
          totalLines: 0,
        },
        allSmells
      );

      if (missingLibraries.length > 0) {
        suggestions.push(
          `Missing libraries detected: ${missingLibraries.join(', ')}. Consider installing them.`
        );
      }

      // Prepare summary
      const errorCount = allSmells.filter(s => s.severity === 'error').length;
      const warningCount = allSmells.filter(s => s.severity === 'warning').length;
      const infoCount = allSmells.filter(s => s.severity === 'info').length;

      return {
        success: true,
        message: `📊 Code analysis complete. Found ${errorCount} error(s), ${warningCount} warning(s), ${infoCount} info(s).`,
        data: {
          filesAnalyzed: analysisResults.length,
          structure: analysisResults.map(r => ({
            file: r.file,
            structure: r.structure,
          })),
          codeSmells: allSmells,
          missingLibraries,
          suggestions,
          summary: {
            errorCount,
            warningCount,
            infoCount,
            totalFiles: analysisResults.length,
          },
        },
        suggestions,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          error instanceof Error ? error.message : 'Failed to execute code analysis',
        ],
      };
    }
  }
}

