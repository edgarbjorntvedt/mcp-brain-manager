/**
 * Brain Tool Instructions Generator
 * Since MCP tools can't call each other directly, this generates
 * instructions for Claude to execute the brain tools
 */
export interface BrainToolInstruction {
    tool: string;
    args: any;
    description: string;
}
export declare class BrainToolInstructions {
    static brainInit(): BrainToolInstruction;
    static stateGet(category: string, key: string): BrainToolInstruction;
    static stateSet(category: string, key: string, value: any): BrainToolInstruction;
    static brainRemember(key: string, value: any, type?: string): BrainToolInstruction;
    static brainRecall(query: string, limit?: number): BrainToolInstruction;
    static obsidianNote(action: string, params: any): BrainToolInstruction;
}
//# sourceMappingURL=brain-instructions.d.ts.map