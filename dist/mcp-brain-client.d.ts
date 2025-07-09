/**
 * MCP Brain Tool Client - Actual implementation that calls brain tools
 * This requires the brain tools to be available in the same Claude session
 */
import { BrainToolClient } from './brain-client.js';
export declare class MCPBrainToolClient implements BrainToolClient {
    private toolCaller;
    constructor(toolCaller: any);
    brainInit(): Promise<boolean>;
    brainRemember(key: string, value: any, type?: string): Promise<boolean>;
    brainRecall(query: string, limit?: number): Promise<any[]>;
    stateSet(category: string, key: string, value: any): Promise<boolean>;
    stateGet(category: string, key: string): Promise<any>;
    stateList(category: string, limit?: number): Promise<any[]>;
    obsidianNote(action: string, params: any): Promise<any>;
}
/**
 * Tool caller interface that the MCP server will implement
 */
export interface ToolCaller {
    callTool(toolName: string, args: any): Promise<any>;
}
//# sourceMappingURL=mcp-brain-client.d.ts.map