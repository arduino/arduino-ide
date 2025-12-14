/**
 * Agent Architecture Types
 * 
 * Defines the base interfaces and types for the agentic IDE system.
 * Based on AGENT_ARCHITECTURE.md specifications.
 */

export enum Permission {
  READ_ONLY = 'read-only',
  SINGLE_FILE_EDIT = 'single-file-edit',
  MULTI_FILE_EDIT = 'multi-file-edit',
  SYSTEM_OPERATIONS = 'system-operations',
}

export interface AgentRequest {
  action: string;
  parameters: Record<string, any>;
  userIntent: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface AgentResult {
  success: boolean;
  data?: any;
  errors?: string[];
  suggestions?: string[];
  requiresConfirmation?: boolean;
  message?: string;
}

export interface AgentContext {
  sketchUri?: string;
  activeFileUri?: string;
  cursorPosition?: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  sketchFiles?: string[];
}

export interface UserRequest {
  text: string;
  intent?: string;
  context?: AgentContext;
}

/**
 * Base interface for all agents in the agentic IDE system.
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  permissions: Permission[];

  /**
   * Determines if this agent can handle the given user request.
   */
  canHandle(request: UserRequest): boolean;

  /**
   * Executes the agent's action based on the request.
   */
  execute(request: AgentRequest, context: AgentContext): Promise<AgentResult>;

  /**
   * Validates the request before execution.
   */
  validate(request: AgentRequest): ValidationResult;
}

