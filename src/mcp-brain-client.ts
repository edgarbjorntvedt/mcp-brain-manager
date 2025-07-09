/**
 * MCP Brain Tool Client - Actual implementation that calls brain tools
 * This requires the brain tools to be available in the same Claude session
 */

import { BrainToolClient } from './brain-client.js';

export class MCPBrainToolClient implements BrainToolClient {
  private toolCaller: any;

  constructor(toolCaller: any) {
    this.toolCaller = toolCaller;
  }

  async brainInit(): Promise<boolean> {
    try {
      const result = await this.toolCaller.callTool('brain:brain_init', {});
      return true;
    } catch (error) {
      console.error('Error calling brain_init:', error);
      return false;
    }
  }

  async brainRemember(key: string, value: any, type: string = 'general'): Promise<boolean> {
    try {
      await this.toolCaller.callTool('brain:brain_remember', {
        key,
        value,
        type
      });
      return true;
    } catch (error) {
      console.error('Error calling brain_remember:', error);
      return false;
    }
  }

  async brainRecall(query: string, limit: number = 10): Promise<any[]> {
    try {
      const result = await this.toolCaller.callTool('brain:brain_recall', {
        query,
        limit
      });
      // Parse the result - it might be a string that needs parsing
      if (typeof result === 'string') {
        // Extract memories from the formatted string
        const matches = result.match(/Found (\d+) matching memories:/);
        if (matches) {
          // Parse the actual memory content
          // This would need to be adjusted based on actual output format
          return [];
        }
      }
      return result || [];
    } catch (error) {
      console.error('Error calling brain_recall:', error);
      return [];
    }
  }

  async stateSet(category: string, key: string, value: any): Promise<boolean> {
    try {
      await this.toolCaller.callTool('brain:state_set', {
        category,
        key,
        value
      });
      return true;
    } catch (error) {
      console.error('Error calling state_set:', error);
      return false;
    }
  }

  async stateGet(category: string, key: string): Promise<any> {
    try {
      const result = await this.toolCaller.callTool('brain:state_get', {
        category,
        key
      });
      
      // The result might be a string that needs parsing
      if (typeof result === 'string') {
        // Check if it's a "not found" message
        if (result.includes('State not found') || result.includes('❌')) {
          return null;
        }
        // Try to parse JSON from the result
        try {
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.warn('Could not parse JSON from state_get result:', result);
        }
      }
      return result;
    } catch (error) {
      console.error('Error calling state_get:', error);
      return null;
    }
  }

  async stateList(category: string, limit: number = 20): Promise<any[]> {
    try {
      const result = await this.toolCaller.callTool('brain:state_list', {
        category,
        limit
      });
      
      // Parse the result similar to state_get
      if (typeof result === 'string') {
        // Extract the list from the formatted output
        // This would need adjustment based on actual format
        return [];
      }
      return result || [];
    } catch (error) {
      console.error('Error calling state_list:', error);
      return [];
    }
  }

  async obsidianNote(action: string, params: any): Promise<any> {
    try {
      const result = await this.toolCaller.callTool('brain:obsidian_note', {
        action,
        ...params
      });
      return result;
    } catch (error) {
      console.error('Error calling obsidian_note:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

/**
 * Tool caller interface that the MCP server will implement
 */
export interface ToolCaller {
  callTool(toolName: string, args: any): Promise<any>;
}
