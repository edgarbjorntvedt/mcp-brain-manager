/**
 * Automated Project Creator
 * Creates new projects using configuration from brain state table
 */

import { BrainToolInstruction, BrainToolInstructions } from '../brain-instructions.js';
import { ProjectConfiguration, SecureApiKeys, SecureConfigManager } from './secure-config.js';
import { TemplateManager } from '../template-manager.js';

export interface ProjectCreationOptions {
  name: string;
  type?: string;
  description?: string;
  template?: string;
  customConfig?: Partial<ProjectConfiguration>;
}

export interface ProjectCreationResult {
  success: boolean;
  projectPath: string;
  githubUrl?: string;
  instructions: BrainToolInstruction[];
  message: string;
}

export class AutomatedProjectCreator {
  private secureConfig: SecureConfigManager;
  private templateManager: TemplateManager;
  
  constructor() {
    this.secureConfig = new SecureConfigManager();
    this.templateManager = new TemplateManager();
  }
  
  /**
   * Create a new project with all automation
   */
  async createProject(
    options: ProjectCreationOptions,
    sessionToken?: string,
    existingConfig?: ProjectConfiguration
  ): Promise<ProjectCreationResult> {
    const instructions: BrainToolInstruction[] = [];
    
    try {
      // Load configuration
      let config: ProjectConfiguration;
      if (existingConfig) {
        config = existingConfig;
      } else {
        // Need to load from brain state
        instructions.push(
          BrainToolInstructions.stateGet('config', 'project_defaults')
        );
        
        return {
          success: false,
          projectPath: '',
          instructions,
          message: 'Execute state_get to load configuration, then call again with existingConfig'
        };
      }
      
      // Generate project setup commands
      const projectPath = `/Users/bard/Code/${options.name}`;
      const setupCommands = this.generateSetupCommands(options, config, projectPath);
      
      // Create instruction to execute all commands
      instructions.push({
        tool: 'brain:brain_execute',
        args: {
          code: setupCommands.join('\n'),
          description: `Create and set up project ${options.name}`,
          language: 'shell'
        },
        description: `Execute project setup for ${options.name}`
      });
      
      // If we have a session token, add secure operations
      if (sessionToken && this.secureConfig.isSessionValid(sessionToken)) {
        instructions.push(...this.getSecureSetupInstructions(options, config));
      }
      
      // Update brain state with new project
      instructions.push(
        BrainToolInstructions.stateSet('project', options.name, {
          projectName: options.name,
          status: 'active',
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          summary: options.description || `${options.type || 'Python'} project`,
          currentFocus: 'Initial setup',
          openTasks: this.getInitialTasks(options.type),
          completedTasks: [],
          keyDecisions: [],
          milestones: [],
          keyFiles: [
            `${projectPath}/README.md`,
            `${projectPath}/pyproject.toml`,
            `${projectPath}/.github/workflows/ci.yml`
          ],
          metadata: {
            projectPath,
            githubUrl: `https://github.com/${config.author.github_username}/${options.name}`,
            template: options.template || options.type || 'python',
            createdBy: 'automated-project-creator'
          }
        })
      );
      
      return {
        success: true,
        projectPath,
        githubUrl: `https://github.com/${config.author.github_username}/${options.name}`,
        instructions,
        message: `Project ${options.name} ready to create. Execute the instructions to complete setup.`
      };
      
    } catch (error) {
      return {
        success: false,
        projectPath: '',
        instructions,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Generate all setup commands for the project
   */
  private generateSetupCommands(
    options: ProjectCreationOptions,
    config: ProjectConfiguration,
    projectPath: string
  ): string[] {
    const commands: string[] = [];
    
    // Create directory and navigate
    commands.push(
      `mkdir -p ${projectPath}`,
      `cd ${projectPath}`
    );
    
    // Initialize git
    commands.push(
      'git init',
      'git branch -M main'
    );
    
    // Create directory structure
    commands.push(
      'mkdir -p src tests docs scripts',
      'mkdir -p src/{api,core,utils,models}',
      'mkdir -p tests/{unit,integration,e2e}',
      'mkdir -p docs/{api,architecture,guides}',
      'mkdir -p .github/workflows',
      'mkdir -p config/{development,staging,production}'
    );
    
    // Set up Python environment
    commands.push(
      `${config.tools.package_manager} venv`,
      'source .venv/bin/activate',
      `${config.tools.package_manager} pip install --upgrade pip`
    );
    
    // Create all configuration files
    commands.push(
      `echo '${this.generatePyprojectToml(options, config)}' > pyproject.toml`,
      `echo '${this.generateGitignore()}' > .gitignore`,
      `echo '${this.generateReadme(options, config)}' > README.md`,
      `echo '${this.generatePreCommitConfig(config)}' > .pre-commit-config.yaml`,
      `echo '${this.generateCIConfig(config)}' > .github/workflows/ci.yml`,
      `echo '${this.generateMakefile()}' > Makefile`,
      `echo '${this.generateDockerfile(config)}' > Dockerfile`,
      `echo '${this.generateEnvExample()}' > .env.example`,
      `echo '${this.generateLicense(config)}' > LICENSE`
    );
    
    // Create initial Python files
    commands.push(
      'touch src/__init__.py',
      `touch src/${options.name.replace(/-/g, '_')}/__init__.py`,
      `echo '"""${options.description || options.name}"""' > src/${options.name.replace(/-/g, '_')}/main.py`,
      'touch tests/__init__.py',
      `echo '${this.generateConftest()}' > tests/conftest.py`,
      'touch tests/unit/test_main.py'
    );
    
    // Install dependencies
    commands.push(
      `${config.tools.package_manager} pip install -e ".[dev]"`,
      'pre-commit install'
    );
    
    // Initial git commit
    commands.push(
      'git add .',
      'git commit -m "Initial commit: project structure and configuration"'
    );
    
    return commands;
  }
  
  /**
   * Get secure setup instructions (GitHub repo creation, etc.)
   */
  private getSecureSetupInstructions(
    options: ProjectCreationOptions,
    config: ProjectConfiguration
  ): BrainToolInstruction[] {
    return [
      {
        tool: 'brain:brain_execute',
        args: {
          code: `
# This would use the decrypted GitHub token to create the repo
# gh auth login --with-token < $GITHUB_TOKEN
# gh repo create ${config.author.github_username}/${options.name} --private --description "${options.description}"
# git remote add origin git@github.com:${config.author.github_username}/${options.name}.git
# git push -u origin main
echo "Note: GitHub repo creation requires decrypted API token"
          `,
          description: 'Create GitHub repository (requires secure session)',
          language: 'shell'
        },
        description: 'Create GitHub repository with secure credentials'
      }
    ];
  }
  
  /**
   * Generate pyproject.toml content
   */
  private generatePyprojectToml(options: ProjectCreationOptions, config: ProjectConfiguration): string {
    const projectName = options.name.replace(/-/g, '_');
    
    return `[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "${options.name}"
version = "0.1.0"
description = "${options.description || options.name}"
readme = "README.md"
requires-python = ">=${config.defaults.python_version}"
license = {text = "${config.defaults.license}"}
authors = [
    {name = "${config.author.name}", email = "${config.author.email}"},
]
dependencies = []

[project.optional-dependencies]
dev = [
    "${config.tools.test_framework}>=7.0",
    "pytest-cov>=4.0",
    "${config.tools.linter}>=0.1.0",
    "${config.tools.type_checker}>=1.0",
    "pre-commit>=3.0",
]

[project.urls]
"Homepage" = "https://github.com/${config.author.github_username}/${options.name}"
"Bug Tracker" = "https://github.com/${config.author.github_username}/${options.name}/issues"

[tool.setuptools.packages.find]
where = ["src"]

[tool.${config.tools.linter}]
line-length = 88
target-version = "py${config.defaults.python_version.replace('.', '')}"

[tool.${config.tools.linter}.format]
quote-style = "double"
indent-style = "space"

[tool.${config.tools.type_checker}]
python_version = "${config.defaults.python_version}"
warn_return_any = true
disallow_untyped_defs = true`;
  }
  
  /**
   * Generate .gitignore content
   */
  private generateGitignore(): string {
    return `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
dist/
*.egg-info/

# Virtual environments
.venv/
venv/
ENV/

# IDEs
.vscode/
.idea/

# OS
.DS_Store

# Testing
.coverage
htmlcov/
.pytest_cache/

# Environment
.env
.env.*
!.env.example

# Logs
*.log`;
  }
  
  /**
   * Generate README.md content
   */
  private generateReadme(options: ProjectCreationOptions, config: ProjectConfiguration): string {
    return `# ${options.name}

${options.description || 'Project description'}

## Installation

\`\`\`bash
${config.tools.package_manager} venv
source .venv/bin/activate
${config.tools.package_manager} pip install -e ".[dev]"
\`\`\`

## Usage

\`\`\`python
from ${options.name.replace(/-/g, '_')} import main
\`\`\`

## Development

\`\`\`bash
# Run tests
${config.tools.test_framework}

# Format code
${config.tools.formatter} format .

# Lint
${config.tools.linter} check .

# Type check
${config.tools.type_checker} src
\`\`\`

## License

${config.defaults.license}`;
  }
  
  /**
   * Generate other configuration files...
   */
  private generatePreCommitConfig(config: ProjectConfiguration): string {
    return `repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/charliermarsh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
      - id: ruff-format`;
  }
  
  private generateCIConfig(config: ProjectConfiguration): string {
    return `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with:
        python-version: '${config.defaults.python_version}'
    - name: Install dependencies
      run: |
        pip install -e ".[dev]"
    - name: Run tests
      run: pytest`;
  }
  
  private generateMakefile(): string {
    return `.DEFAULT_GOAL := help

help:
	@echo "Available commands:"
	@echo "  install    Install dependencies"
	@echo "  test       Run tests"
	@echo "  lint       Run linting"
	@echo "  format     Format code"

install:
	uv pip install -e ".[dev]"

test:
	pytest

lint:
	ruff check .

format:
	ruff format .`;
  }
  
  private generateDockerfile(config: ProjectConfiguration): string {
    return `FROM python:${config.defaults.python_version}-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install -e .

COPY . .

CMD ["python", "-m", "src.main"]`;
  }
  
  private generateEnvExample(): string {
    return `# Environment variables
DEBUG=false
LOG_LEVEL=INFO`;
  }
  
  private generateLicense(config: ProjectConfiguration): string {
    if (config.defaults.license === 'MIT') {
      return `MIT License

Copyright (c) ${new Date().getFullYear()} ${config.author.name}

Permission is hereby granted, free of charge...`;
    }
    return `${config.defaults.license} License`;
  }
  
  private generateConftest(): string {
    return `"""Pytest configuration."""
import pytest

@pytest.fixture
def sample_data():
    return {"test": "data"}`;
  }
  
  /**
   * Get initial tasks based on project type
   */
  private getInitialTasks(projectType?: string): string[] {
    const baseTasks = [
      'Set up development environment',
      'Create initial documentation',
      'Configure CI/CD pipeline',
      'Write initial tests'
    ];
    
    switch (projectType) {
      case 'ml':
        return [
          ...baseTasks,
          'Set up data pipeline',
          'Create model architecture',
          'Implement training loop',
          'Set up experiment tracking'
        ];
      
      case 'web':
        return [
          ...baseTasks,
          'Design API endpoints',
          'Set up database models',
          'Implement authentication',
          'Create API documentation'
        ];
      
      case 'cli':
        return [
          ...baseTasks,
          'Design command structure',
          'Implement argument parsing',
          'Add help documentation',
          'Create example scripts'
        ];
      
      default:
        return baseTasks;
    }
  }
}
