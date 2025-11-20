import { expect } from 'chai';
import {
  compactChatHistory,
  getHistoryStats,
  ChatMessage,
  CompactionConfig,
} from '../../../../browser/widgets/chat/chat-history';

describe('chat-history', () => {
  describe('compactChatHistory', () => {
    it('should return empty array for empty input', () => {
      const result = compactChatHistory([]);
      expect(result).to.be.an('array').that.is.empty;
    });

    it('should filter out welcome messages', () => {
      const messages: ChatMessage[] = [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Welcome! Please configure your API key.',
          timestamp: new Date(),
        },
        {
          id: 'msg1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: 'msg2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date(),
        },
      ];

      const result = compactChatHistory(messages);
      expect(result).to.have.length(2);
      expect(result[0].parts[0].text).to.equal('Hello');
      expect(result[1].parts[0].text).to.equal('Hi there!');
    });

    it('should convert roles correctly', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg1',
          role: 'user',
          content: 'User message',
          timestamp: new Date(),
        },
        {
          id: 'msg2',
          role: 'assistant',
          content: 'Assistant message',
          timestamp: new Date(),
        },
      ];

      const result = compactChatHistory(messages);
      expect(result).to.have.length(2);
      expect(result[0].role).to.equal('user');
      expect(result[1].role).to.equal('model');
    });

    it('should keep recent messages in full', () => {
      const messages: ChatMessage[] = [];
      for (let i = 0; i < 15; i++) {
        messages.push({
          id: `msg${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: new Date(),
        });
      }

      const config: Partial<CompactionConfig> = { maxRecentMessages: 5 };
      const result = compactChatHistory(messages, config);

      // Should have all messages, but older ones might be truncated
      expect(result.length).to.be.greaterThan(0);
      // Last 5 messages should be in full
      const lastMessages = result.slice(-5);
      expect(lastMessages[lastMessages.length - 1].parts[0].text).to.include('Message 14');
    });

    it('should truncate very long messages', () => {
      const longContent = 'A'.repeat(10000);
      const messages: ChatMessage[] = [
        {
          id: 'msg1',
          role: 'user',
          content: longContent,
          timestamp: new Date(),
        },
      ];

      const config: Partial<CompactionConfig> = { maxMessageChars: 1000 };
      const result = compactChatHistory(messages, config);

      expect(result).to.have.length(1);
      expect(result[0].parts[0].text.length).to.be.lessThan(1000);
      expect(result[0].parts[0].text).to.include('...');
    });

    it('should preserve code blocks when truncating', () => {
      const codeBlock = '```cpp\nvoid setup() {}\nvoid loop() {}\n```';
      const longContent = 'A'.repeat(5000) + codeBlock + 'B'.repeat(5000);
      const messages: ChatMessage[] = [
        {
          id: 'msg1',
          role: 'user',
          content: longContent,
          timestamp: new Date(),
        },
      ];

      const config: Partial<CompactionConfig> = { maxMessageChars: 2000 };
      const result = compactChatHistory(messages, config);

      expect(result).to.have.length(1);
      expect(result[0].parts[0].text).to.include('```cpp');
      expect(result[0].parts[0].text).to.include('void setup()');
    });

    it('should respect maxHistoryChars limit', () => {
      const messages: ChatMessage[] = [];
      for (let i = 0; i < 20; i++) {
        messages.push({
          id: `msg${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: 'X'.repeat(2000), // Each message is 2000 chars
          timestamp: new Date(),
        });
      }

      const config: Partial<CompactionConfig> = {
        maxHistoryChars: 10000, // Only 10k chars total
        maxRecentMessages: 5,
      };
      const result = compactChatHistory(messages, config);

      const totalChars = result.reduce(
        (sum, msg) => sum + msg.parts[0].text.length,
        0
      );
      expect(totalChars).to.be.lessThanOrEqual(10000);
    });

    it('should handle messages with special characters', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg1',
          role: 'user',
          content: 'Hello! How are you? 🚀',
          timestamp: new Date(),
        },
        {
          id: 'msg2',
          role: 'assistant',
          content: 'I\'m doing great! "Thanks" for asking.',
          timestamp: new Date(),
        },
      ];

      const result = compactChatHistory(messages);
      expect(result).to.have.length(2);
      expect(result[0].parts[0].text).to.include('🚀');
      expect(result[1].parts[0].text).to.include('"Thanks"');
    });
  });

  describe('getHistoryStats', () => {
    it('should calculate correct statistics', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: 'msg2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date(),
        },
      ];

      const compacted = compactChatHistory(messages);
      const stats = getHistoryStats(messages, compacted);

      expect(stats.originalCount).to.equal(2);
      expect(stats.compactedCount).to.equal(2);
      expect(stats.originalChars).to.equal(15); // "Hello" + "Hi there!"
      expect(stats.compactedChars).to.equal(15);
      expect(stats.estimatedTokens).to.be.greaterThan(0);
    });

    it('should show compression when messages are truncated', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg1',
          role: 'user',
          content: 'A'.repeat(10000),
          timestamp: new Date(),
        },
      ];

      const config: Partial<CompactionConfig> = { maxMessageChars: 1000 };
      const compacted = compactChatHistory(messages, config);
      const stats = getHistoryStats(messages, compacted);

      expect(stats.originalChars).to.equal(10000);
      expect(stats.compactedChars).to.be.lessThan(10000);
      expect(stats.compactedChars).to.be.lessThanOrEqual(1000);
    });
  });
});

