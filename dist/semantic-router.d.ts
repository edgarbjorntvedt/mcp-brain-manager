/**
 * Semantic Router - Intelligent intent classification
 */
export interface ClassificationResult {
    mode: string;
    confidence: number;
    reasoning: string;
    suggestedContext?: any;
}
export interface ConversationContext {
    lastProject?: string;
    conversationHistory?: Array<{
        role: string;
        content: string;
    }>;
    recentDecisions?: string[];
}
export declare class SemanticRouter {
    private modes;
    private modeDescriptions;
    classify(message: string, context?: ConversationContext): Promise<ClassificationResult>;
    private performClassification;
    private calculateModeScores;
    private scoreKeywords;
    private calculateConfidence;
    private generateReasoning;
    private getDetectedKeywords;
    improveClassification(message: string, context: ConversationContext, feedback: {
        correctMode: string;
        userReasoning?: string;
    }): Promise<void>;
    getModeDescription(mode: string): string;
    getAllModes(): Array<{
        mode: string;
        description: string;
    }>;
}
//# sourceMappingURL=semantic-router.d.ts.map