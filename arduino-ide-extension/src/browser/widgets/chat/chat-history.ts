/**
 * Chat history management and compaction utilities
 * Handles efficient context management for LLM conversations
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface CompactedMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * Configuration for chat history compaction
 */
export interface CompactionConfig {
  /** Maximum number of recent messages to keep in full detail */
  maxRecentMessages: number;
  /** Maximum total characters for chat history (rough token estimate: 1 token ≈ 4 chars) */
  maxHistoryChars: number;
  /** Maximum characters for a single message before truncation */
  maxMessageChars: number;
  /** Whether to summarize older messages or just truncate */
  summarizeOlder: boolean;
}

const DEFAULT_CONFIG: CompactionConfig = {
  maxRecentMessages: 10, // Keep last 10 messages in full
  maxHistoryChars: 30000, // ~7500 tokens for history
  maxMessageChars: 5000, // Truncate very long messages
  summarizeOlder: false, // For now, just truncate (summarization would require LLM call)
};

/**
 * Roughly estimate token count from character count
 * Gemini uses ~4 characters per token on average
 */
function estimateTokens(charCount: number): number {
  return Math.ceil(charCount / 4);
}

/**
 * Truncate a message if it's too long, preserving important parts
 */
function truncateMessage(content: string, maxChars: number): string {
  if (content.length <= maxChars) {
    return content;
  }
  
  // Try to preserve code blocks if present
  const codeBlockMatch = content.match(/```[\s\S]*?```/);
  if (codeBlockMatch) {
    const codeBlock = codeBlockMatch[0];
    const codeBlockLength = codeBlock.length;
    const remainingChars = maxChars - codeBlockLength - 100; // Reserve space for truncation notice
    
    if (remainingChars > 0) {
      const beforeCode = content.substring(0, content.indexOf(codeBlock));
      const afterCode = content.substring(content.indexOf(codeBlock) + codeBlockLength);
      
      const truncatedBefore = beforeCode.length > remainingChars / 2
        ? '...' + beforeCode.slice(-Math.floor(remainingChars / 2) + 3)
        : beforeCode;
      
      const truncatedAfter = afterCode.length > remainingChars / 2
        ? afterCode.slice(0, Math.floor(remainingChars / 2) - 3) + '...'
        : afterCode;
      
      return truncatedBefore + codeBlock + truncatedAfter;
    }
  }
  
  // Simple truncation with ellipsis
  return content.slice(0, maxChars - 3) + '...';
}

/**
 * Compact chat history for efficient LLM context
 * 
 * Strategy:
 * 1. Keep the most recent N messages in full detail
 * 2. For older messages, truncate if needed
 * 3. Ensure total history stays within character limits
 * 4. Convert to Gemini API format
 */
export function compactChatHistory(
  messages: ChatMessage[],
  config: Partial<CompactionConfig> = {}
): CompactedMessage[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Filter out welcome/system messages (they're not part of conversation history)
  const conversationMessages = messages.filter(
    msg => msg.role !== 'assistant' || !msg.content.includes('Welcome') && !msg.content.includes('Chat cleared')
  );
  
  if (conversationMessages.length === 0) {
    return [];
  }
  
  // Separate recent and older messages
  const recentMessages = conversationMessages.slice(-finalConfig.maxRecentMessages);
  const olderMessages = conversationMessages.slice(0, -finalConfig.maxRecentMessages);
  
  // Process older messages: truncate if needed
  const processedOlder: CompactedMessage[] = olderMessages.map(msg => {
    let content = msg.content;
    
    // Truncate if too long
    if (content.length > finalConfig.maxMessageChars) {
      content = truncateMessage(content, finalConfig.maxMessageChars);
    }
    
    return {
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: content }],
    };
  });
  
  // Process recent messages: keep in full (but still truncate if extremely long)
  const processedRecent: CompactedMessage[] = recentMessages.map(msg => {
    let content = msg.content;
    
    // Still truncate if extremely long (safety measure)
    if (content.length > finalConfig.maxMessageChars * 2) {
      content = truncateMessage(content, finalConfig.maxMessageChars * 2);
    }
    
    return {
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: content }],
    };
  });
  
  // Combine and check total size
  const allProcessed = [...processedOlder, ...processedRecent];
  const totalChars = allProcessed.reduce((sum, msg) => 
    sum + msg.parts[0].text.length, 0
  );
  
  // If still too large, progressively remove oldest messages
  if (totalChars > finalConfig.maxHistoryChars) {
    const result: CompactedMessage[] = [];
    let currentChars = 0;
    
    // Add messages from newest to oldest until we hit the limit
    for (let i = allProcessed.length - 1; i >= 0; i--) {
      const msg = allProcessed[i];
      const msgChars = msg.parts[0].text.length;
      
      if (currentChars + msgChars <= finalConfig.maxHistoryChars) {
        result.unshift(msg); // Add to beginning
        currentChars += msgChars;
      } else {
        // Try to fit a truncated version
        const remainingChars = finalConfig.maxHistoryChars - currentChars;
        if (remainingChars > 100) { // Only if there's meaningful space
          const truncated = truncateMessage(msg.parts[0].text, remainingChars);
          result.unshift({
            role: msg.role,
            parts: [{ text: truncated }],
          });
        }
        break; // Can't fit more
      }
    }
    
    return result;
  }
  
  return allProcessed;
}

/**
 * Get statistics about the compacted history (for debugging/monitoring)
 */
export function getHistoryStats(
  messages: ChatMessage[],
  compacted: CompactedMessage[]
): {
  originalCount: number;
  compactedCount: number;
  originalChars: number;
  compactedChars: number;
  estimatedTokens: number;
} {
  const originalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  const compactedChars = compacted.reduce((sum, msg) => sum + msg.parts[0].text.length, 0);
  
  return {
    originalCount: messages.length,
    compactedCount: compacted.length,
    originalChars,
    compactedChars,
    estimatedTokens: estimateTokens(compactedChars),
  };
}

