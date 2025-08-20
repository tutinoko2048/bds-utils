import * as path from 'node:path';
import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import { experimentEditor } from './tools';

import packageJson from '../package.json' with { type: "json" };
import { levelDatRestorer } from './tools/leveldat-restorer';

const program = createProgram();
program.parse(process.argv);

const { cwd, debug } = program.opts();
const options: CommandOptions = {
  cwd: path.resolve(cwd),
  debug
};

// console.debug(options);
try {
  await selectTool();
} catch (error: any) {
  if (error.name === 'ExitPromptError') {
    process.exit(0);
  }

  console.error('Error occurred while using the tool:', debug ? error : error.message);
}

async function selectTool(): Promise<void> {
  const tool = await select({
    message: 'Select a tool to use:',
    choices: [
      {
        name: 'Experimental Settings Editor',
        description: 'Edit experimental settings for world',
        value: experimentEditor,
      },
      {
        name: 'Level.dat Restorer',
        description: 'Restore the level.dat file from level.dat_old',
        value: levelDatRestorer,
      }
    ],
  });

  console.log();

  await tool(options.cwd);
}

export interface CommandOptions {
  debug: boolean;
  cwd: string;
}

function createProgram() {
  const command = new Command()
    .name('bds-utils')
    .description('Utility CLI for Bedrock Dedicated Server')
    .version(packageJson.version, '-v --version')
    .helpOption('-h, --help', 'Show this help message')
    .option('-d, --debug', 'Enable debug mode')
    .option('-c, --cwd <path>', 'Set the working directory', process.cwd())

  return command;
}

