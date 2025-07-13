/**
 * Create Project Protocol
 * Automated workflow for creating new projects with proper structure and setup
 */

import { BrainToolInstruction, BrainToolInstructions } from '../brain-instructions.js';
import { ProjectTemplate } from '../template-manager.js';

export interface CreateProjectOptions {
  projectName: string;
  projectType: 'mcp-tool' | 'web-app' | 'cli-tool' | 'library' | 'api' | 'general';
  description?: string;
  visibility?: 'public' | 'private';
  language?: 'typescript' | 'javascript' | 'python';
  features?: {
    typescript?: boolean;
    testing?: boolean;
    linting?: boolean;
    docker?: boolean;
    cicd?: boolean;
    vscode?: boolean;
  };
  dependencies?: string[];
  license?: 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'ISC' | 'None';
  author?: string;
  githubUsername?: string;
}

export interface CreateProjectResult {
  success: boolean;
  projectPath: string;
  steps: StepResult[];
  summary: ProjectSummary;
  instructions: BrainToolInstruction[];
  nextSteps: string[];
}

export interface StepResult {
  step: string;
  status: 'success' | 'failed' | 'skipped';
  output?: string;
  error?: string;
}

export interface ProjectSummary {
  projectName: string;
  projectType: string;
  location: string;
  gitInitialized: boolean;
  githubRepo?: string;
  testsCreated: boolean;
  documentationCreated: boolean;
  dependenciesInstalled: boolean;
  brainIntegrated: boolean;
}

export class CreateProjectProtocol {
  private githubUsername: string | null = null;
  
  /**
   * Set GitHub username for repo creation
   */
  setGitHubUsername(username: string): void {
    this.githubUsername = username;
  }
  
  /**
   * Execute the full project creation protocol
   */
  async executeCreate(options: CreateProjectOptions): Promise<CreateProjectResult> {
    const steps: StepResult[] = [];
    const instructions: BrainToolInstruction[] = [];
    const projectPath = `/Users/bard/Code/${options.projectName}`;
    
    const summary: ProjectSummary = {
      projectName: options.projectName,
      projectType: options.projectType,
      location: projectPath,
      gitInitialized: false,
      testsCreated: false,
      documentationCreated: false,
      dependenciesInstalled: false,
      brainIntegrated: false
    };

    // Step 1: Create project directory
    const dirStep = this.createDirectoryStructure(options, projectPath);
    steps.push(dirStep.result);
    instructions.push(...dirStep.instructions);

    // Step 2: Initialize package.json and core files
    const initStep = this.initializeProject(options, projectPath);
    steps.push(initStep.result);
    instructions.push(...initStep.instructions);

    // Step 3: Create source files with starter code
    const codeStep = this.createStarterCode(options, projectPath);
    steps.push(codeStep.result);
    instructions.push(...codeStep.instructions);

    // Step 4: Set up development environment
    if (options.features?.vscode !== false) {
      const devEnvStep = this.setupDevEnvironment(options, projectPath);
      steps.push(devEnvStep.result);
      instructions.push(...devEnvStep.instructions);
    }

    // Step 5: Initialize Git and create GitHub repo
    const gitStep = this.initializeGit(options, projectPath);
    steps.push(gitStep.result);
    instructions.push(...gitStep.instructions);
    summary.gitInitialized = true;

    // Step 6: Set up CI/CD
    if (options.features?.cicd !== false) {
      const cicdStep = this.setupCICD(options, projectPath);
      steps.push(cicdStep.result);
      instructions.push(...cicdStep.instructions);
    }

    // Step 7: Install dependencies
    const depsStep = this.installDependencies(options, projectPath);
    steps.push(depsStep.result);
    instructions.push(...depsStep.instructions);
    summary.dependenciesInstalled = true;

    // Step 8: Create documentation
    const docsStep = this.createDocumentation(options, projectPath);
    steps.push(docsStep.result);
    instructions.push(...docsStep.instructions);
    summary.documentationCreated = true;

    // Step 9: Set up testing
    if (options.features?.testing !== false) {
      const testStep = this.setupTesting(options, projectPath);
      steps.push(testStep.result);
      instructions.push(...testStep.instructions);
      summary.testsCreated = true;
    }

    // Step 10: Integrate with Brain
    const brainStep = this.integrateBrain(options, projectPath);
    steps.push(brainStep.result);
    instructions.push(...brainStep.instructions);
    summary.brainIntegrated = true;

    // Generate next steps
    const nextSteps = this.generateNextSteps(options, summary);

    return {
      success: steps.every(s => s.status !== 'failed'),
      projectPath,
      steps,
      summary,
      instructions,
      nextSteps
    };
  }

  private createDirectoryStructure(options: CreateProjectOptions, projectPath: string): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    const dirs = [
      projectPath,
      `${projectPath}/src`,
      `${projectPath}/src/tests`,
      `${projectPath}/dist`,
      `${projectPath}/docs`,
      `${projectPath}/scripts`
    ];

    if (options.features?.vscode !== false) {
      dirs.push(`${projectPath}/.vscode`);
    }

    if (options.features?.cicd !== false) {
      dirs.push(`${projectPath}/.github`, `${projectPath}/.github/workflows`);
    }

    // Create all directories
    dirs.forEach(dir => {
      instructions.push({
        tool: 'filesystem:create_directory',
        args: { path: dir },
        description: `Create directory: ${dir}`
      });
    });

    return {
      result: {
        step: 'Create Directory Structure',
        status: 'success'
      },
      instructions
    };
  }

  private initializeProject(options: CreateProjectOptions, projectPath: string): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    // Create package.json
    const packageJson = this.generatePackageJson(options);
    instructions.push({
      tool: 'filesystem:write_file',
      args: {
        path: `${projectPath}/package.json`,
        content: JSON.stringify(packageJson, null, 2)
      },
      description: 'Create package.json'
    });

    // Create tsconfig.json if TypeScript
    if (options.language === 'typescript' || options.features?.typescript !== false) {
      const tsConfig = this.generateTsConfig(options);
      instructions.push({
        tool: 'filesystem:write_file',
        args: {
          path: `${projectPath}/tsconfig.json`,
          content: JSON.stringify(tsConfig, null, 2)
        },
        description: 'Create tsconfig.json'
      });
    }

    // Create .gitignore
    const gitignore = this.generateGitignore(options);
    instructions.push({
      tool: 'filesystem:write_file',
      args: {
        path: `${projectPath}/.gitignore`,
        content: gitignore
      },
      description: 'Create .gitignore'
    });

    // Create .env.example if needed
    if (options.projectType === 'api' || options.projectType === 'web-app') {
      instructions.push({
        tool: 'filesystem:write_file',
        args: {
          path: `${projectPath}/.env.example`,
          content: '# Environment variables\nNODE_ENV=development\nPORT=3000\n'
        },
        description: 'Create .env.example'
      });
    }

    return {
      result: {
        step: 'Initialize Project',
        status: 'success'
      },
      instructions
    };
  }

  private createStarterCode(options: CreateProjectOptions, projectPath: string): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    const isTypeScript = options.language === 'typescript' || options.features?.typescript !== false;
    const ext = isTypeScript ? 'ts' : 'js';
    
    // Generate appropriate starter code based on project type
    let starterCode = '';
    let testCode = '';
    
    switch (options.projectType) {
      case 'mcp-tool':
        starterCode = this.generateMCPStarterCode(options);
        testCode = this.generateMCPTestCode(options);
        break;
      case 'cli-tool':
        starterCode = this.generateCLIStarterCode(options);
        testCode = this.generateCLITestCode(options);
        break;
      case 'web-app':
        starterCode = this.generateWebAppStarterCode(options);
        testCode = this.generateWebAppTestCode(options);
        break;
      case 'api':
        starterCode = this.generateAPIStarterCode(options);
        testCode = this.generateAPITestCode(options);
        break;
      case 'library':
        starterCode = this.generateLibraryStarterCode(options);
        testCode = this.generateLibraryTestCode(options);
        break;
      default:
        starterCode = this.generateGeneralStarterCode(options);
        testCode = this.generateGeneralTestCode(options);
    }

    // Write main source file
    instructions.push({
      tool: 'filesystem:write_file',
      args: {
        path: `${projectPath}/src/index.${ext}`,
        content: starterCode
      },
      description: 'Create main source file'
    });

    // Write test file
    if (options.features?.testing !== false) {
      instructions.push({
        tool: 'filesystem:write_file',
        args: {
          path: `${projectPath}/src/tests/index.test.${ext}`,
          content: testCode
        },
        description: 'Create test file'
      });
    }

    return {
      result: {
        step: 'Create Starter Code',
        status: 'success'
      },
      instructions
    };
  }

  private setupDevEnvironment(options: CreateProjectOptions, projectPath: string): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    // VS Code settings
    const vscodeSettings = {
      "editor.formatOnSave": true,
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
      },
      "typescript.tsdk": "node_modules/typescript/lib",
      "files.exclude": {
        "node_modules": true,
        "dist": true
      }
    };

    instructions.push({
      tool: 'filesystem:write_file',
      args: {
        path: `${projectPath}/.vscode/settings.json`,
        content: JSON.stringify(vscodeSettings, null, 2)
      },
      description: 'Create VS Code settings'
    });

    // Debug configuration
    const debugConfig = {
      "version": "0.2.0",
      "configurations": [
        {
          "type": "node",
          "request": "launch",
          "name": "Debug Program",
          "skipFiles": ["<node_internals>/**"],
          "program": "${workspaceFolder}/src/index.${options.language === 'typescript' ? 'ts' : 'js'}",
          "preLaunchTask": options.language === 'typescript' ? "tsc: build - tsconfig.json" : undefined,
          "outFiles": options.language === 'typescript' ? ["${workspaceFolder}/dist/**/*.js"] : undefined
        }
      ]
    };

    instructions.push({
      tool: 'filesystem:write_file',
      args: {
        path: `${projectPath}/.vscode/launch.json`,
        content: JSON.stringify(debugConfig, null, 2)
      },
      description: 'Create debug configuration'
    });

    // Recommended extensions
    const extensions = {
      "recommendations": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next"
      ]
    };

    instructions.push({
      tool: 'filesystem:write_file',
      args: {
        path: `${projectPath}/.vscode/extensions.json`,
        content: JSON.stringify(extensions, null, 2)
      },
      description: 'Create recommended extensions'
    });

    return {
      result: {
        step: 'Setup Development Environment',
        status: 'success'
      },
      instructions
    };
  }

  private initializeGit(options: CreateProjectOptions, projectPath: string): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    const gitCommands = `
cd ${projectPath}
git init
git add -A
git commit -m "Initial commit: ${options.projectName}

- Project type: ${options.projectType}
- Language: ${options.language || 'typescript'}
- Features: ${Object.entries(options.features || {}).filter(([_, v]) => v).map(([k]) => k).join(', ')}
${options.description ? `\n${options.description}` : ''}"

# Create GitHub repository
gh repo create ${options.projectName} --${options.visibility || 'public'} --source=. --remote=origin --push
`;

    instructions.push({
      tool: 'brain:brain_execute',
      args: {
        code: gitCommands,
        description: 'Initialize Git and create GitHub repository',
        language: 'shell'
      },
      description: 'Git initialization and GitHub repo creation'
    });

    return {
      result: {
        step: 'Initialize Git & GitHub',
        status: 'success'
      },
      instructions
    };
  }

  private setupCICD(options: CreateProjectOptions, projectPath: string): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    const workflow = `name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build --if-present
      
    - name: Run tests
      run: npm test
      
    - name: Run linter
      run: npm run lint --if-present
`;

    instructions.push({
      tool: 'filesystem:write_file',
      args: {
        path: `${projectPath}/.github/workflows/ci.yml`,
        content: workflow
      },
      description: 'Create CI/CD workflow'
    });

    return {
      result: {
        step: 'Setup CI/CD',
        status: 'success'
      },
      instructions
    };
  }

  private installDependencies(options: CreateProjectOptions, projectPath: string): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    instructions.push({
      tool: 'brain:brain_execute',
      args: {
        code: `cd ${projectPath} && npm install`,
        description: 'Install project dependencies',
        language: 'shell'
      },
      description: 'Install npm dependencies'
    });

    return {
      result: {
        step: 'Install Dependencies',
        status: 'success'
      },
      instructions
    };
  }

  private createDocumentation(options: CreateProjectOptions, projectPath: string): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    // Create README.md
    const readme = this.generateReadme(options);
    instructions.push({
      tool: 'filesystem:write_file',
      args: {
        path: `${projectPath}/README.md`,
        content: readme
      },
      description: 'Create README.md'
    });

    // Create LICENSE
    if (options.license && options.license !== 'None') {
      const license = this.generateLicense(options);
      instructions.push({
        tool: 'filesystem:write_file',
        args: {
          path: `${projectPath}/LICENSE`,
          content: license
        },
        description: 'Create LICENSE file'
      });
    }

    // Create CHANGELOG.md
    instructions.push({
      tool: 'filesystem:write_file',
      args: {
        path: `${projectPath}/CHANGELOG.md`,
        content: `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Basic ${options.projectType} functionality
`
      },
      description: 'Create CHANGELOG.md'
    });

    return {
      result: {
        step: 'Create Documentation',
        status: 'success'
      },
      instructions
    };
  }

  private setupTesting(options: CreateProjectOptions, projectPath: string): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    // Jest configuration
    const jestConfig = {
      preset: options.language === 'typescript' ? 'ts-jest' : undefined,
      testEnvironment: 'node',
      roots: ['<rootDir>/src'],
      testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
      transform: options.language === 'typescript' ? {
        '^.+\\.ts$': 'ts-jest'
      } : undefined
    };

    instructions.push({
      tool: 'filesystem:write_file',
      args: {
        path: `${projectPath}/jest.config.js`,
        content: `module.exports = ${JSON.stringify(jestConfig, null, 2)}`
      },
      description: 'Create Jest configuration'
    });

    // Run initial test
    instructions.push({
      tool: 'brain:brain_execute',
      args: {
        code: `cd ${projectPath} && npm test`,
        description: 'Run initial tests',
        language: 'shell'
      },
      description: 'Verify test setup'
    });

    return {
      result: {
        step: 'Setup Testing',
        status: 'success'
      },
      instructions
    };
  }

  private integrateBrain(options: CreateProjectOptions, projectPath: string): { result: StepResult; instructions: BrainToolInstruction[] } {
    const instructions: BrainToolInstruction[] = [];
    
    // Switch to the new project in Brain Manager
    instructions.push(
      BrainToolInstructions.custom(
        'brain-manager:switch_project',
        {
          projectName: options.projectName,
          createIfNotExists: true,
          template: this.mapProjectTypeToTemplate(options.projectType)
        },
        'Switch to new project in Brain Manager'
      )
    );

    // Create initial project context
    const projectContext = {
      projectName: options.projectName,
      status: 'active',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      summary: options.description || `${options.projectType} project`,
      currentFocus: 'Initial setup and configuration',
      openTasks: this.generateInitialTasks(options),
      completedTasks: ['Project initialization', 'Repository setup'],
      keyDecisions: [
        {
          timestamp: new Date().toISOString(),
          decision: `Use ${options.language || 'TypeScript'} as primary language`,
          rationale: 'Modern development with type safety',
          impact: 'Better developer experience and maintainability'
        }
      ],
      milestones: [
        {
          timestamp: new Date().toISOString(),
          title: 'Project Created',
          description: `Successfully created ${options.projectName} with automated setup`,
          artifacts: ['package.json', 'README.md', '.gitignore']
        }
      ],
      keyFiles: ['src/index.ts', 'package.json', 'README.md'],
      metadata: {
        projectType: options.projectType,
        language: options.language || 'typescript',
        repository: `https://github.com/${this.githubUsername || options.githubUsername}/${options.projectName}`,
        techStack: this.getTechStack(options),
        features: options.features
      }
    };

    instructions.push(
      BrainToolInstructions.stateSet('project', options.projectName, projectContext)
    );

    // Create Obsidian note
    const obsidianNote = this.generateObsidianNote(options, projectContext);
    instructions.push({
      tool: 'brain:obsidian_note',
      args: {
        action: 'create',
        title: `${options.projectName} - Project Overview`,
        content: obsidianNote,
        folder: `projects/${options.projectName}`
      },
      description: 'Create project note in Obsidian'
    });

    return {
      result: {
        step: 'Integrate with Brain',
        status: 'success'
      },
      instructions
    };
  }

  // Helper methods for generating content
  private generatePackageJson(options: CreateProjectOptions): any {
    const packageJson: any = {
      name: options.projectName,
      version: '0.1.0',
      description: options.description || `A ${options.projectType} project`,
      main: options.language === 'typescript' ? 'dist/index.js' : 'src/index.js',
      scripts: {
        start: options.projectType === 'cli-tool' ? 'node dist/index.js' : 'node src/index.js',
        dev: options.language === 'typescript' ? 'ts-node src/index.ts' : 'node src/index.js',
        build: options.language === 'typescript' ? 'tsc' : 'echo "No build step required"',
        test: 'jest',
        lint: 'eslint src --ext .ts,.js',
        'lint:fix': 'eslint src --ext .ts,.js --fix'
      },
      keywords: [options.projectType],
      author: options.author || '',
      license: options.license || 'MIT',
      dependencies: {},
      devDependencies: {}
    };

    // Add type-specific dependencies
    if (options.projectType === 'mcp-tool') {
      packageJson.dependencies['@modelcontextprotocol/sdk'] = '^0.5.0';
    }

    if (options.projectType === 'cli-tool') {
      packageJson.dependencies['commander'] = '^11.0.0';
      packageJson.dependencies['chalk'] = '^5.3.0';
      packageJson.bin = {
        [options.projectName]: './dist/index.js'
      };
    }

    if (options.projectType === 'web-app' || options.projectType === 'api') {
      packageJson.dependencies['express'] = '^4.18.0';
      packageJson.dependencies['dotenv'] = '^16.0.0';
    }

    // Add dev dependencies
    if (options.language === 'typescript' || options.features?.typescript) {
      packageJson.devDependencies['typescript'] = '^5.0.0';
      packageJson.devDependencies['@types/node'] = '^20.0.0';
      packageJson.devDependencies['ts-node'] = '^10.9.0';
      packageJson.devDependencies['ts-jest'] = '^29.0.0';
    }

    if (options.features?.testing !== false) {
      packageJson.devDependencies['jest'] = '^29.0.0';
      packageJson.devDependencies['@types/jest'] = '^29.0.0';
    }

    if (options.features?.linting !== false) {
      packageJson.devDependencies['eslint'] = '^8.0.0';
      packageJson.devDependencies['@typescript-eslint/parser'] = '^6.0.0';
      packageJson.devDependencies['@typescript-eslint/eslint-plugin'] = '^6.0.0';
      packageJson.devDependencies['prettier'] = '^3.0.0';
    }

    // Add custom dependencies
    if (options.dependencies) {
      options.dependencies.forEach(dep => {
        packageJson.dependencies[dep] = 'latest';
      });
    }

    return packageJson;
  }

  private generateTsConfig(options: CreateProjectOptions): any {
    return {
      compilerOptions: {
        target: 'ES2022',
        module: 'commonjs',
        lib: ['ES2022'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        removeComments: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.ts']
    };
  }

  private generateGitignore(options: CreateProjectOptions): string {
    return `# Dependencies
node_modules/

# Build output
dist/
build/
*.js
*.js.map
*.d.ts
*.d.ts.map

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
`;
  }

  private generateReadme(options: CreateProjectOptions): string {
    return `# ${options.projectName}

${options.description || `A ${options.projectType} project built with ${options.language || 'TypeScript'}.`}

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
${options.projectType === 'mcp-tool' ? '- MCP-compatible client (e.g., Claude Desktop)' : ''}

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/${this.githubUsername || 'username'}/${options.projectName}.git

# Navigate to project directory
cd ${options.projectName}

# Install dependencies
npm install
\`\`\`

### Running the Project

\`\`\`bash
# Development mode
npm run dev

# Build the project
npm run build

# Run production build
npm start

# Run tests
npm test
\`\`\`

## 📁 Project Structure

\`\`\`
${options.projectName}/
├── src/
│   ├── index.${options.language === 'typescript' ? 'ts' : 'js'}    # Main entry point
│   └── tests/          # Test files
├── dist/               # Compiled output
├── docs/               # Documentation
├── package.json        # Project metadata and dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
\`\`\`

## 🧪 Testing

This project uses Jest for testing. Tests are located in the \`src/tests\` directory.

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
\`\`\`

## 🛠️ Development

### Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run test\` - Run tests
- \`npm run lint\` - Run ESLint
- \`npm run lint:fix\` - Fix ESLint errors

### Making Changes

1. Create a new branch: \`git checkout -b feature/your-feature\`
2. Make your changes
3. Run tests: \`npm test\`
4. Commit changes: \`git commit -m "Add your feature"\`
5. Push to GitHub: \`git push origin feature/your-feature\`
6. Create a Pull Request

## 📝 License

This project is licensed under the ${options.license || 'MIT'} License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you have any questions or need help, please [open an issue](https://github.com/${this.githubUsername || 'username'}/${options.projectName}/issues).
`;
  }

  private generateLicense(options: CreateProjectOptions): string {
    const year = new Date().getFullYear();
    const author = options.author || 'Your Name';
    
    switch (options.license) {
      case 'MIT':
        return `MIT License

Copyright (c) ${year} ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
      
      default:
        return `Copyright (c) ${year} ${author}. All rights reserved.`;
    }
  }

  private generateObsidianNote(options: CreateProjectOptions, context: any): string {
    return `# ${options.projectName}

## 📋 Project Overview

**Type:** ${options.projectType}
**Language:** ${options.language || 'TypeScript'}
**Status:** Active
**Created:** ${new Date().toISOString().split('T')[0]}
**Repository:** [GitHub](https://github.com/${this.githubUsername || 'username'}/${options.projectName})

## 📝 Description

${options.description || `A ${options.projectType} project built with modern tooling and best practices.`}

## 🎯 Goals

- [ ] Complete initial implementation
- [ ] Add comprehensive tests
- [ ] Set up CI/CD pipeline
- [ ] Write documentation
- [ ] Create example usage

## 🛠️ Tech Stack

${context.metadata.techStack.map((tech: string) => `- ${tech}`).join('\n')}

## 🏗️ Architecture

### Project Structure
- \`src/\` - Source code
- \`tests/\` - Test files
- \`dist/\` - Build output
- \`docs/\` - Documentation

### Key Components
- Main entry point: \`src/index.${options.language === 'typescript' ? 'ts' : 'js'}\`
- Test suite: \`src/tests/\`
- Configuration: \`tsconfig.json\`, \`package.json\`

## 📊 Progress Log

### ${new Date().toISOString().split('T')[0]} - Project Created
- ✅ Initialized repository
- ✅ Set up project structure
- ✅ Created starter code
- ✅ Configured development environment
- ✅ Set up testing framework
- ✅ Created documentation

## 💡 Ideas & Notes

- Consider adding Docker support for containerization
- Explore deployment options (Vercel, Netlify, AWS, etc.)
- Add pre-commit hooks for code quality
- Set up semantic versioning

## 🔗 Resources

- [Project Repository](https://github.com/${this.githubUsername || 'username'}/${options.projectName})
- [${options.projectType === 'mcp-tool' ? 'MCP Documentation' : 'Node.js Documentation'}](${options.projectType === 'mcp-tool' ? 'https://modelcontextprotocol.io' : 'https://nodejs.org'})
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🚀 Next Steps

1. Implement core functionality
2. Write unit tests
3. Set up GitHub Actions
4. Add API documentation
5. Create usage examples

---
*This note is automatically updated by the Brain Manager*
`;
  }

  // Starter code generators for different project types
  private generateMCPStarterCode(options: CreateProjectOptions): string {
    const isTS = options.language === 'typescript';
    return `#!/usr/bin/env node
${isTS ? `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';` : 
`const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');`}

const server = new Server(
  {
    name: '${options.projectName}',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'example_tool',
        description: 'An example tool that says hello',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name to greet',
            },
          },
          required: ['name'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'example_tool') {
    const { name } = request.params.arguments${isTS ? ' as { name: string }' : ''};
    return {
      content: [
        {
          type: 'text',
          text: \`Hello, \${name}! This is ${options.projectName}.\`,
        },
      ],
    };
  }
  
  throw new Error(\`Unknown tool: \${request.params.name}\`);
});

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);
console.error('${options.projectName} MCP server running on stdio');
`;
  }

  private generateCLIStarterCode(options: CreateProjectOptions): string {
    const isTS = options.language === 'typescript';
    return `#!/usr/bin/env node
${isTS ? `import { Command } from 'commander';
import chalk from 'chalk';` : 
`const { Command } = require('commander');
const chalk = require('chalk');`}

const program = new Command();

program
  .name('${options.projectName}')
  .description('${options.description || 'CLI tool'}')
  .version('0.1.0');

program
  .command('hello')
  .description('Say hello')
  .argument('<name>', 'name to greet')
  .option('-u, --uppercase', 'convert to uppercase')
  .action((name${isTS ? ': string' : ''}, options${isTS ? ': any' : ''}) => {
    let message = \`Hello, \${name}!\`;
    if (options.uppercase) {
      message = message.toUpperCase();
    }
    console.log(chalk.green(message));
  });

program.parse();
`;
  }

  private generateWebAppStarterCode(options: CreateProjectOptions): string {
    const isTS = options.language === 'typescript';
    return `${isTS ? `import express from 'express';
import dotenv from 'dotenv';` : 
`const express = require('express');
const dotenv = require('dotenv');`}

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req${isTS ? ': express.Request' : ''}, res${isTS ? ': express.Response' : ''}) => {
  res.json({
    message: 'Welcome to ${options.projectName}',
    version: '0.1.0',
  });
});

app.get('/health', (req${isTS ? ': express.Request' : ''}, res${isTS ? ': express.Response' : ''}) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});

${isTS ? 'export default app;' : 'module.exports = app;'}
`;
  }

  private generateAPIStarterCode(options: CreateProjectOptions): string {
    return this.generateWebAppStarterCode(options); // Similar structure
  }

  private generateLibraryStarterCode(options: CreateProjectOptions): string {
    const isTS = options.language === 'typescript';
    return `${isTS ? 'export ' : 'module.exports.'}function greet(name${isTS ? ': string' : ''})${isTS ? ': string' : ''} {
  return \`Hello, \${name}!\`;
}

${isTS ? 'export ' : 'module.exports.'}function add(a${isTS ? ': number' : ''}, b${isTS ? ': number' : ''})${isTS ? ': number' : ''} {
  return a + b;
}

${isTS ? 'export const version = ' : 'module.exports.version = '}'0.1.0';
`;
  }

  private generateGeneralStarterCode(options: CreateProjectOptions): string {
    const isTS = options.language === 'typescript';
    return `// ${options.projectName}
// ${options.description || 'A new project'}

function main()${isTS ? ': void' : ''} {
  console.log('Hello from ${options.projectName}!');
  console.log('Edit src/index.${isTS ? 'ts' : 'js'} to get started.');
}

// Run the main function
main();

${isTS ? 'export { main };' : 'module.exports = { main };'}
`;
  }

  // Test code generators
  private generateMCPTestCode(options: CreateProjectOptions): string {
    const isTS = options.language === 'typescript';
    return `${isTS ? "import { jest } from '@jest/globals';" : ''}

describe('${options.projectName}', () => {
  it('should have tests', () => {
    expect(true).toBe(true);
  });
  
  // Add your MCP tool tests here
});
`;
  }

  private generateCLITestCode(options: CreateProjectOptions): string {
    return this.generateGeneralTestCode(options);
  }

  private generateWebAppTestCode(options: CreateProjectOptions): string {
    const isTS = options.language === 'typescript';
    return `${isTS ? "import request from 'supertest';\nimport app from '../index';" : 
"const request = require('supertest');\nconst app = require('../index');"}

describe('${options.projectName} API', () => {
  it('should return welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Welcome to ${options.projectName}');
  });
  
  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
`;
  }

  private generateAPITestCode(options: CreateProjectOptions): string {
    return this.generateWebAppTestCode(options);
  }

  private generateLibraryTestCode(options: CreateProjectOptions): string {
    const isTS = options.language === 'typescript';
    return `${isTS ? "import { greet, add } from '../index';" : 
"const { greet, add } = require('../index');"}

describe('${options.projectName}', () => {
  describe('greet', () => {
    it('should greet by name', () => {
      expect(greet('World')).toBe('Hello, World!');
    });
  });
  
  describe('add', () => {
    it('should add two numbers', () => {
      expect(add(2, 3)).toBe(5);
    });
  });
});
`;
  }

  private generateGeneralTestCode(options: CreateProjectOptions): string {
    const isTS = options.language === 'typescript';
    return `${isTS ? "import { main } from '../index';" : 
"const { main } = require('../index');"}

describe('${options.projectName}', () => {
  it('should run without errors', () => {
    expect(() => main()).not.toThrow();
  });
  
  // Add your tests here
});
`;
  }

  // Helper methods
  private mapProjectTypeToTemplate(projectType: string): string {
    const mapping: Record<string, string> = {
      'mcp-tool': 'mcp',
      'web-app': 'web',
      'cli-tool': 'cli',
      'library': 'library',
      'api': 'api',
      'general': 'general'
    };
    return mapping[projectType] || 'general';
  }

  private getTechStack(options: CreateProjectOptions): string[] {
    const stack = [options.language === 'typescript' ? 'TypeScript' : 'JavaScript', 'Node.js'];
    
    if (options.projectType === 'mcp-tool') stack.push('MCP SDK');
    if (options.projectType === 'web-app' || options.projectType === 'api') stack.push('Express');
    if (options.projectType === 'cli-tool') stack.push('Commander.js');
    if (options.features?.testing !== false) stack.push('Jest');
    if (options.features?.linting !== false) stack.push('ESLint', 'Prettier');
    if (options.features?.docker) stack.push('Docker');
    
    return stack;
  }

  private generateInitialTasks(options: CreateProjectOptions): string[] {
    const tasks = [
      'Implement core functionality',
      'Write comprehensive tests',
      'Add error handling',
      'Create usage examples'
    ];
    
    if (options.projectType === 'mcp-tool') {
      tasks.push('Define all MCP tools', 'Test with MCP client');
    }
    
    if (options.projectType === 'cli-tool') {
      tasks.push('Add more commands', 'Improve help text');
    }
    
    if (options.projectType === 'web-app' || options.projectType === 'api') {
      tasks.push('Add more routes', 'Implement authentication', 'Add database integration');
    }
    
    return tasks;
  }

  private generateNextSteps(options: CreateProjectOptions, summary: ProjectSummary): string[] {
    const steps = [
      `cd ${options.projectName}`,
      'npm run dev  # Start development',
      'npm test    # Run tests'
    ];
    
    if (summary.githubRepo) {
      steps.push('git push origin main  # Push to GitHub');
    }
    
    steps.push(
      'Open in VS Code: code .',
      `Edit src/index.${options.language === 'typescript' ? 'ts' : 'js'} to start coding`,
      'Check README.md for more information'
    );
    
    return steps;
  }
}
