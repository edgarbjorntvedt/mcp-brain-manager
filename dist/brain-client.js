/**
 * Brain Tool Client - Interface to call actual brain tools
 * This will be injected into the BrainManager
 */
/**
 * Mock implementation for testing
 * In production, this will be replaced with actual tool calls
 */
export class MockBrainToolClient {
    mockStorage = new Map();
    async brainInit() {
        console.log('🧠 Mock: Initializing Brain...');
        return true;
    }
    async brainRemember(key, value, type = 'general') {
        console.log(`💾 Mock: Storing ${type} memory: ${key}`);
        this.mockStorage.set(`brain:${key}`, value);
        return true;
    }
    async brainRecall(query, limit = 10) {
        console.log(`🔍 Mock: Searching for: ${query}`);
        // Return empty for now
        return [];
    }
    async stateSet(category, key, value) {
        console.log(`📊 Mock: Setting ${category}/${key}`);
        this.mockStorage.set(`state:${category}:${key}`, value);
        return true;
    }
    async stateGet(category, key) {
        console.log(`📊 Mock: Getting ${category}/${key}`);
        return this.mockStorage.get(`state:${category}:${key}`) || null;
    }
    async stateList(category, limit = 20) {
        console.log(`📊 Mock: Listing ${category} (limit: ${limit})`);
        const results = [];
        for (const [k, v] of this.mockStorage.entries()) {
            if (k.startsWith(`state:${category}:`)) {
                results.push({ key: k.replace(`state:${category}:`, ''), value: v });
            }
        }
        return results.slice(0, limit);
    }
    async obsidianNote(action, params) {
        console.log(`📝 Mock: Obsidian ${action}`, params);
        return { success: true };
    }
}
//# sourceMappingURL=brain-client.js.map