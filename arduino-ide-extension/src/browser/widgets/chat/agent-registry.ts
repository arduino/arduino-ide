/**
 * Agent Registry
 * 
 * Manages registration and discovery of agents in the agentic IDE system.
 */

import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Agent, UserRequest, AgentRequest, AgentContext, AgentResult } from './agent-types';
import { InlineEditingAgent } from './agents/inline-editing-agent';
import { MultiFileEditingAgent } from './agents/multi-file-editing-agent';
import { LibraryManagementAgent } from './agents/library-management-agent';
import { CompilationAgent } from './agents/compilation-agent';
import { CodeAnalysisAgent } from './agents/code-analysis-agent';

@injectable()
export class AgentRegistry {
  private agents: Map<string, Agent> = new Map();

  @inject(InlineEditingAgent)
  private readonly inlineEditingAgent: InlineEditingAgent;

  @inject(MultiFileEditingAgent)
  private readonly multiFileEditingAgent: MultiFileEditingAgent;

  @inject(LibraryManagementAgent)
  private readonly libraryManagementAgent: LibraryManagementAgent;

  @inject(CompilationAgent)
  private readonly compilationAgent: CompilationAgent;

  @inject(CodeAnalysisAgent)
  private readonly codeAnalysisAgent: CodeAnalysisAgent;

  @postConstruct()
  protected init(): void {
    // Register all agents
    this.registerAgent(this.inlineEditingAgent);
    this.registerAgent(this.multiFileEditingAgent);
    this.registerAgent(this.libraryManagementAgent);
    this.registerAgent(this.compilationAgent);
    this.registerAgent(this.codeAnalysisAgent);
  }

  /**
   * Registers an agent in the registry.
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Gets an agent by ID.
   */
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  /**
   * Gets all registered agents.
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Finds agents that can handle the given user request.
   */
  findAgentsForRequest(request: UserRequest): Agent[] {
    return this.getAllAgents().filter(agent => agent.canHandle(request));
  }

  /**
   * Executes a request using the appropriate agent.
   * Returns the first agent that can handle the request and successfully executes it.
   */
  async executeRequest(
    request: UserRequest,
    context: AgentContext
  ): Promise<AgentResult> {
    const agents = this.findAgentsForRequest(request);
    
    if (agents.length === 0) {
      return {
        success: false,
        errors: ['No agent found that can handle this request'],
      };
    }

    // Try agents in order of priority (more specific agents first)
    // Multi-file editing agent should be tried before inline editing agent
    // since it can handle both single and multi-file edits
    const sortedAgents = agents.sort((a, b) => {
      if (a.id === 'multi-file-editing' && b.id === 'inline-editing') return -1;
      if (a.id === 'inline-editing' && b.id === 'multi-file-editing') return 1;
      return 0;
    });

    for (const agent of sortedAgents) {
      const agentRequest: AgentRequest = {
        action: request.intent || 'edit',
        parameters: { text: request.text },
        userIntent: request.text,
      };

      // Validate request
      const validation = agent.validate(agentRequest);
      if (!validation.valid) {
        continue; // Try next agent
      }

      // Execute agent
      try {
        const result = await agent.execute(agentRequest, context);
        if (result.success) {
          return result;
        }
      } catch (error) {
        // Continue to next agent on error
        continue;
      }
    }

    return {
      success: false,
      errors: ['All agents failed to execute the request'],
    };
  }
}

