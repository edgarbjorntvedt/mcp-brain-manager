/**
 * Brain Tool Client - Interface to call actual brain tools
 * This will be injected into the BrainManager
 */
export interface BrainToolClient {
    brainInit(): Promise<boolean>;
    brainRemember(key: string, value: any, type?: string): Promise<boolean>;
    brainRecall(query: string, limit?: number): Promise<any[]>;
    stateSet(category: string, key: string, value: any): Promise<boolean>;
    stateGet(category: string, key: string): Promise<any>;
    stateList(category: string, limit?: number): Promise<any[]>;
    obsidianNote(action: string, params: any): Promise<any>;
}
/**
 * Mock implementation for testing
 * In production, this will be replaced with actual tool calls
 */
export declare class MockBrainToolClient implements BrainToolClient {
    private mockStorage;
    brainInit(): Promise<boolean>;
    brainRemember(key: string, value: any, type?: string): Promise<boolean>;
    brainRecall(query: string, limit?: number): Promise<any[]>;
    stateSet(category: string, key: string, value: any): Promise<boolean>;
    stateGet(category: string, key: string): Promise<any>;
    stateList(category: string, limit?: number): Promise<any[]>;
    obsidianNote(action: string, params: any): Promise<any>;
}
//# sourceMappingURL=brain-client.d.ts.map