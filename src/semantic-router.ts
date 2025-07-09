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

export class SemanticRouter {
  private modes = [
    'project_continuation',
    'project_management', 
    'research',
    'analysis',
    'help',
    'tarot',
    'general_assistant'
  ];

  private modeDescriptions: Record<string, string> = {
    project_continuation: 'Continuing work on an existing project',
    project_management: 'Starting new development or coding tasks',
    research: 'Learning, exploring, or investigating topics',
    analysis: 'Finding patterns, insights, or connections',
    help: 'Getting help with the system or tools',
    tarot: 'Tarot reading or divination related',
    general_assistant: 'General conversation or assistance'
  };

  async classify(
    message: string,
    context?: ConversationContext
  ): Promise<ClassificationResult> {
    // In production, this would call Claude for classification
    // For now, we'll implement a sophisticated pattern-based approach
    
    const messageLower = message.toLowerCase();
    const classification = this.performClassification(messageLower, context);
    
    // Add reasoning based on the classification
    classification.reasoning = this.generateReasoning(
      message,
      classification.mode,
      classification.confidence,
      context
    );

    return classification;
  }

  private performClassification(
    messageLower: string,
    context?: ConversationContext
  ): ClassificationResult {
    // Check for explicit mode switches
    if (messageLower.includes('switch to')) {
      for (const mode of this.modes) {
        if (messageLower.includes(mode.replace('_', ' '))) {
          return {
            mode,
            confidence: 0.95,
            reasoning: 'Explicit mode switch requested'
          };
        }
      }
    }

    // Check for project continuation signals
    if (context?.lastProject) {
      const continuationSignals = [
        'continue', 'let\'s', 'keep', 'next', 'now', 
        'then', 'also', 'resume', 'back to', 'where were we'
      ];
      
      const hasContinuationSignal = continuationSignals.some(
        signal => messageLower.includes(signal)
      );
      
      if (hasContinuationSignal) {
        return {
          mode: 'project_continuation',
          confidence: 0.85,
          reasoning: 'Continuation signal detected with active project'
        };
      }
    }

    // Analyze message for mode indicators
    const modeScores = this.calculateModeScores(messageLower);
    
    // Find the highest scoring mode
    let bestMode = 'general_assistant';
    let bestScore = 0;
    
    for (const [mode, score] of Object.entries(modeScores)) {
      if (score > bestScore) {
        bestMode = mode;
        bestScore = score;
      }
    }

    // Calculate confidence based on score distribution
    const confidence = this.calculateConfidence(modeScores, bestMode);

    return {
      mode: bestMode,
      confidence,
      reasoning: ''
    };
  }

  private calculateModeScores(message: string): Record<string, number> {
    const scores: Record<string, number> = {};

    // Project management indicators
    const projectKeywords = [
      'project', 'build', 'create', 'implement', 'develop',
      'code', 'fix', 'debug', 'feature', 'bug', 'deploy',
      'test', 'refactor', 'architecture', 'design'
    ];
    scores.project_management = this.scoreKeywords(message, projectKeywords);

    // Research indicators
    const researchKeywords = [
      'research', 'learn', 'explore', 'investigate', 'study',
      'how does', 'what is', 'explain', 'understand', 'compare',
      'pros and cons', 'best practices', 'tutorial'
    ];
    scores.research = this.scoreKeywords(message, researchKeywords);

    // Analysis indicators
    const analysisKeywords = [
      'analyze', 'analysis', 'pattern', 'insight', 'trend',
      'connection', 'relationship', 'correlation', 'statistics',
      'metrics', 'performance', 'optimize'
    ];
    scores.analysis = this.scoreKeywords(message, analysisKeywords);

    // Help indicators
    const helpKeywords = [
      'help', 'how do i', 'how to', 'guide', 'documentation',
      'confused', 'stuck', 'problem', 'issue', 'error'
    ];
    scores.help = this.scoreKeywords(message, helpKeywords);

    // Tarot indicators
    const tarotKeywords = [
      'tarot', 'reading', 'spread', 'cards', 'divination',
      'fortune', 'future', 'guidance', 'spiritual'
    ];
    scores.tarot = this.scoreKeywords(message, tarotKeywords);

    // General assistant gets a base score
    scores.general_assistant = 0.1;

    return scores;
  }

  private scoreKeywords(message: string, keywords: string[]): number {
    let score = 0;
    const words = message.split(/\s+/);
    
    for (const keyword of keywords) {
      if (keyword.includes(' ')) {
        // Multi-word phrase
        if (message.includes(keyword)) {
          score += 2;
        }
      } else {
        // Single word
        if (words.some(word => word.includes(keyword))) {
          score += 1;
        }
      }
    }

    // Normalize by message length
    return score / Math.sqrt(words.length);
  }

  private calculateConfidence(
    scores: Record<string, number>,
    bestMode: string
  ): number {
    const values = Object.values(scores);
    const bestScore = scores[bestMode];
    
    // If no clear winner
    if (bestScore === 0) {
      return 0.3;
    }

    // Calculate how much better the best score is
    const secondBest = Math.max(
      ...values.filter(v => v !== bestScore)
    );
    
    const margin = bestScore - secondBest;
    const relative = bestScore / (secondBest + 0.01);

    // Confidence based on margin and relative difference
    if (margin > 1 && relative > 2) {
      return 0.9;
    } else if (margin > 0.5 && relative > 1.5) {
      return 0.75;
    } else if (margin > 0.25) {
      return 0.6;
    } else {
      return 0.45;
    }
  }

  private generateReasoning(
    message: string,
    mode: string,
    confidence: number,
    context?: ConversationContext
  ): string {
    const reasons: string[] = [];

    // Add context-based reasoning
    if (mode === 'project_continuation' && context?.lastProject) {
      reasons.push(`Detected continuation intent for project '${context.lastProject}'`);
    }

    // Add keyword-based reasoning
    const keywords = this.getDetectedKeywords(message, mode);
    if (keywords.length > 0) {
      reasons.push(`Found ${mode} indicators: ${keywords.join(', ')}`);
    }

    // Add confidence reasoning
    if (confidence > 0.8) {
      reasons.push('High confidence based on clear intent signals');
    } else if (confidence < 0.5) {
      reasons.push('Low confidence - consider clarifying intent');
    }

    // Add context history reasoning
    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      reasons.push('Considered conversation history for context');
    }

    return reasons.join('. ');
  }

  private getDetectedKeywords(message: string, mode: string): string[] {
    const messageLower = message.toLowerCase();
    const detected: string[] = [];

    const keywordMap: Record<string, string[]> = {
      project_management: ['build', 'create', 'implement', 'code', 'fix'],
      research: ['learn', 'explore', 'how does', 'what is'],
      analysis: ['analyze', 'pattern', 'insight', 'trend'],
      help: ['help', 'how do i', 'guide'],
      tarot: ['tarot', 'reading', 'cards']
    };

    const keywords = keywordMap[mode] || [];
    for (const keyword of keywords) {
      if (messageLower.includes(keyword)) {
        detected.push(keyword);
      }
    }

    return detected.slice(0, 3); // Return top 3
  }

  async improveClassification(
    message: string,
    context: ConversationContext,
    feedback: {
      correctMode: string;
      userReasoning?: string;
    }
  ): Promise<void> {
    // In production, this would store training data
    // to improve future classifications
    console.log('Storing classification feedback for improvement:', {
      message,
      predicted: await this.classify(message, context),
      correct: feedback.correctMode,
      reasoning: feedback.userReasoning
    });
  }

  getModeDescription(mode: string): string {
    return this.modeDescriptions[mode] || 'Unknown mode';
  }

  getAllModes(): Array<{ mode: string; description: string }> {
    return this.modes.map(mode => ({
      mode,
      description: this.getModeDescription(mode)
    }));
  }
}
