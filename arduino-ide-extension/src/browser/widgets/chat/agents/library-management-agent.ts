/**
 * Library Management Agent
 * 
 * Manages Arduino library installation and dependencies.
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
import { LibraryService } from '../../../../common/protocol/library-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';

/**
 * Extracts library names from #include statements in code.
 * Returns a set of library names (without .h extension).
 */
function extractRequiredLibraries(code: string): Set<string> {
  const libraries = new Set<string>();
  const lines = code.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Match #include <LibraryName.h> or #include "LibraryName.h"
    const includeMatch = /^\s*#include\s*[<"]([^>"]+)[>"]/.exec(trimmed);
    if (includeMatch) {
      const includePath = includeMatch[1];
      // Extract library name (remove .h extension and path)
      const libraryName = includePath
        .replace(/\.h$/, '')
        .split('/')
        .pop() || includePath.replace(/\.h$/, '');
      
      // Skip standard C/C++ libraries
      if (!isStandardLibrary(libraryName)) {
        libraries.add(libraryName);
      }
    }
  }
  
  return libraries;
}

/**
 * Checks if a library name is a standard C/C++ library (not an Arduino library).
 */
function isStandardLibrary(name: string): boolean {
  const standardLibs = [
    'stdio', 'stdlib', 'string', 'math', 'time', 'ctype', 'stdint',
    'inttypes', 'stdbool', 'stddef', 'limits', 'float', 'errno',
    'assert', 'signal', 'setjmp', 'locale', 'stdarg', 'iso646',
    'wchar', 'wctype', 'complex', 'fenv', 'tgmath', 'stdalign',
    'stdatomic', 'stdnoreturn', 'threads', 'uchar', 'iostream',
    'vector', 'string', 'algorithm', 'map', 'set', 'list', 'deque',
    'queue', 'stack', 'array', 'tuple', 'utility', 'memory', 'iterator',
    'functional', 'numeric', 'random', 'chrono', 'regex', 'fstream',
    'sstream', 'iomanip', 'locale', 'codecvt', 'bitset', 'valarray',
    'complex', 'exception', 'stdexcept', 'new', 'typeinfo', 'type_traits',
    'limits', 'cstddef', 'cstdlib', 'cstring', 'cctype', 'cwctype',
    'cstdint', 'cinttypes', 'cstdbool', 'cfloat', 'climits', 'cstdarg',
    'cassert', 'cerrno', 'csignal', 'csetjmp', 'cstdalign', 'cstdatomic',
    'cstdnoreturn', 'ctime', 'cstdio', 'cstdlib', 'cmath', 'cstring',
    'cctype', 'cwchar', 'cwctype', 'cstdint', 'cinttypes', 'cstdbool',
    'cfloat', 'climits', 'cstdarg', 'cassert', 'cerrno', 'csignal',
    'csetjmp', 'cstdalign', 'cstdatomic', 'cstdnoreturn', 'ctime',
  ];
  
  return standardLibs.includes(name.toLowerCase());
}

/**
 * Normalizes library name for searching (handles common variations).
 */
function normalizeLibraryName(name: string): string {
  // Remove common prefixes/suffixes and normalize
  return name
    .replace(/^arduino[_-]?/i, '')
    .replace(/[_-]/g, ' ')
    .trim();
}

@injectable()
export class LibraryManagementAgent implements Agent {
  id = 'library-management';
  name = 'Library Management Agent';
  description = 'Manages Arduino library installation and dependencies';
  capabilities = [
    'Check installed libraries',
    'Identify required libraries from code',
    'Search for libraries',
    'Install missing libraries',
    'Resolve library dependencies',
    'Check library compatibility',
  ];
  permissions = [Permission.SYSTEM_OPERATIONS];

  @inject(LibraryService)
  private readonly libraryService: LibraryService;

  @inject(FileService)
  private readonly fileService: FileService;

  canHandle(request: UserRequest): boolean {
    const text = request.text.toLowerCase();
    
    // Check for library-related keywords
    if (
      text.includes('library') ||
      text.includes('install') ||
      text.includes('missing') ||
      text.includes('include') ||
      text.includes('dependency') ||
      text.includes('libraries')
    ) {
      return true;
    }
    
    // Check if code contains #include statements
    if (request.text.includes('#include')) {
      return true;
    }
    
    // Check if context has sketch files (we can analyze them)
    if (request.context?.sketchFiles && request.context.sketchFiles.length > 0) {
      return true;
    }
    
    return false;
  }

  validate(request: AgentRequest): ValidationResult {
    const { parameters } = request;
    
    if (!parameters.text || typeof parameters.text !== 'string') {
      return {
        valid: false,
        errors: ['Missing or invalid text parameter'],
      };
    }

    return { valid: true };
  }

  async execute(request: AgentRequest, context: AgentContext): Promise<AgentResult> {
    try {
      const { parameters } = request;
      const action = parameters.action as string || 'check-and-install';
      
      switch (action) {
        case 'check-and-install':
          return await this.checkAndInstallLibraries(context);
        case 'list-installed':
          return await this.listInstalledLibraries();
        case 'search':
          return await this.searchLibraries(parameters.query as string || '');
        default:
          return await this.checkAndInstallLibraries(context);
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to execute library management operation'],
      };
    }
  }

  /**
   * Checks for missing libraries in the sketch and installs them.
   */
  private async checkAndInstallLibraries(context: AgentContext): Promise<AgentResult> {
    try {
      // Collect all code from sketch files
      let allCode = '';
      
      if (context.sketchFiles && context.sketchFiles.length > 0) {
        for (const fileUri of context.sketchFiles) {
          try {
            const fileContent = await this.fileService.read(new URI(fileUri));
            allCode += '\n' + fileContent.value;
          } catch {
            // Skip files that can't be read
            continue;
          }
        }
      } else if (context.activeFileUri) {
        try {
          const fileContent = await this.fileService.read(new URI(context.activeFileUri));
          allCode = fileContent.value;
        } catch {
          return {
            success: false,
            errors: ['Could not read active file to analyze libraries'],
          };
        }
      } else {
        return {
          success: false,
          errors: ['No sketch files available to analyze'],
        };
      }

      // Extract required libraries
      const requiredLibraries = extractRequiredLibraries(allCode);
      
      if (requiredLibraries.size === 0) {
        return {
          success: true,
          message: '✅ No libraries required in the code',
          data: { librariesChecked: 0, librariesInstalled: 0 },
        };
      }

      // Get installed libraries
      const installedLibraries = await this.libraryService.list({});
      const installedLibraryNames = new Set(
        installedLibraries.map(lib => lib.name.toLowerCase())
      );

      // Find missing libraries
      const missingLibraries: string[] = [];
      for (const libName of requiredLibraries) {
        const normalized = libName.toLowerCase();
        if (!installedLibraryNames.has(normalized)) {
          missingLibraries.push(libName);
        }
      }

      if (missingLibraries.length === 0) {
        return {
          success: true,
          message: `✅ All required libraries are installed (${requiredLibraries.size} libraries)`,
          data: {
            librariesChecked: requiredLibraries.size,
            librariesInstalled: 0,
            requiredLibraries: Array.from(requiredLibraries),
          },
        };
      }

      // Search for and install missing libraries
      const installationResults: Array<{ library: string; success: boolean; error?: string }> = [];
      
      for (const libName of missingLibraries) {
        try {
          // Search for the library
          const searchResults = await this.libraryService.search({
            query: libName,
            type: 'All',
          });

          if (searchResults.length === 0) {
            // Try normalized name
            const normalized = normalizeLibraryName(libName);
            const normalizedResults = await this.libraryService.search({
              query: normalized,
              type: 'All',
            });

            if (normalizedResults.length === 0) {
              installationResults.push({
                library: libName,
                success: false,
                error: 'Library not found in repository',
              });
              continue;
            }

            // Install first matching library
            const libraryToInstall = normalizedResults[0];
            await this.libraryService.install({
              item: libraryToInstall,
              installDependencies: true,
            });
            installationResults.push({
              library: libName,
              success: true,
            });
          } else {
            // Install first matching library
            const libraryToInstall = searchResults[0];
            await this.libraryService.install({
              item: libraryToInstall,
              installDependencies: true,
            });
            installationResults.push({
              library: libName,
              success: true,
            });
          }
        } catch (error) {
          installationResults.push({
            library: libName,
            success: false,
            error: error instanceof Error ? error.message : 'Installation failed',
          });
        }
      }

      const successCount = installationResults.filter(r => r.success).length;
      const failureCount = installationResults.filter(r => !r.success).length;

      if (failureCount === 0) {
        return {
          success: true,
          message: `✅ Installed ${successCount} missing library/libraries`,
          data: {
            librariesChecked: requiredLibraries.size,
            librariesInstalled: successCount,
            requiredLibraries: Array.from(requiredLibraries),
            installedLibraries: installationResults.filter(r => r.success).map(r => r.library),
          },
        };
      } else if (successCount > 0) {
        return {
          success: true,
          message: `⚠️ Installed ${successCount} library/libraries, ${failureCount} failed`,
          errors: installationResults
            .filter(r => !r.success)
            .map(r => `${r.library}: ${r.error}`),
          data: {
            librariesChecked: requiredLibraries.size,
            librariesInstalled: successCount,
            librariesFailed: failureCount,
            requiredLibraries: Array.from(requiredLibraries),
            installedLibraries: installationResults.filter(r => r.success).map(r => r.library),
            failedLibraries: installationResults.filter(r => !r.success).map(r => ({ name: r.library, error: r.error })),
          },
        };
      } else {
        return {
          success: false,
          errors: installationResults.map(r => `${r.library}: ${r.error}`),
          data: {
            librariesChecked: requiredLibraries.size,
            librariesInstalled: 0,
            librariesFailed: failureCount,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to check and install libraries'],
      };
    }
  }

  /**
   * Lists all installed libraries.
   */
  private async listInstalledLibraries(): Promise<AgentResult> {
    try {
      const installedLibraries = await this.libraryService.list({});
      
      return {
        success: true,
        message: `✅ Found ${installedLibraries.length} installed library/libraries`,
        data: {
          libraries: installedLibraries.map(lib => ({
            name: lib.name,
            version: lib.installedVersion,
            author: lib.author,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to list installed libraries'],
      };
    }
  }

  /**
   * Searches for libraries.
   */
  private async searchLibraries(query: string): Promise<AgentResult> {
    try {
      if (!query || query.trim().length === 0) {
        return {
          success: false,
          errors: ['Search query is required'],
        };
      }

      const results = await this.libraryService.search({
        query: query.trim(),
        type: 'All',
      });

      return {
        success: true,
        message: `✅ Found ${results.length} library/libraries matching "${query}"`,
        data: {
          libraries: results.map(lib => ({
            name: lib.name,
            author: lib.author,
            summary: lib.summary,
            availableVersions: lib.availableVersions,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to search libraries'],
      };
    }
  }
}

