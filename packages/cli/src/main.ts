import * as path from 'node:path';
import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import * as pc from 'picocolors';
import { experimentEditor, serverUpdater } from './tools';

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

  console.error('');
  console.error(pc.red(`❌ ${error.message}`));
  if (debug) {
    console.error(pc.dim('\nStack trace:'));
    console.error(pc.dim(error.stack));
  }
}

async function selectTool(): Promise<void> {
  const tool = await select({
    message: 'Select a tool to use:',
    choices: [
      {
        name: 'Server Updater',
        description: 'Change/update the version of Bedrock Server',
        value: serverUpdater
      },
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

