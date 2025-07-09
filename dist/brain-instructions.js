/**
 * Brain Tool Instructions Generator
 * Since MCP tools can't call each other directly, this generates
 * instructions for Claude to execute the brain tools
 */
export class BrainToolInstructions {
    static brainInit() {
        return {
            tool: 'brain:brain_init',
            args: {},
            description: 'Initialize brain session'
        };
    }
    static stateGet(category, key) {
        return {
            tool: 'brain:state_get',
            args: { category, key },
            description: `Get ${category}/${key} from state`
        };
    }
    static stateSet(category, key, value) {
        return {
            tool: 'brain:state_set',
            args: { category, key, value },
            description: `Set ${category}/${key} in state`
        };
    }
    static brainRemember(key, value, type = 'general') {
        return {
            tool: 'brain:brain_remember',
            args: { key, value, type },
            description: `Remember ${key} as ${type}`
        };
    }
    static brainRecall(query, limit = 10) {
        return {
            tool: 'brain:brain_recall',
            args: { query, limit },
            description: `Recall memories matching "${query}"`
        };
    }
    static obsidianNote(action, params) {
        return {
            tool: 'brain:obsidian_note',
            args: { action, ...params },
            description: `Obsidian ${action} operation`
        };
    }
}
//# sourceMappingURL=brain-instructions.js.map