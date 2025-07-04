import type { VersionInfo, VersionList } from './types';
import cliSelect from 'cli-select';
import chalk from 'chalk';
import { askUntilValid } from '../utils/ask';

export interface UpdaterOptions {
  cwd: string;
  debug: boolean;
  help: boolean;
}

export function printHelp(): void {
  console.log('Bedrock Server Updater');
  console.log('Usage: bds-updater [options]');
  console.log('Options:');
  console.log('  --cwd, -c <path>    Set the working directory (default: current directory)');
  console.log('  --debug             Enable debug mode');
  console.log('  --help, -h          Show this help message');
  console.log('Examples:');
  console.log('  bds-updater');
  console.log('  bds-updater --cwd /path/to/server');
  console.log('  bds-updater -c "C:\\MinecraftServer" --debug');
}

export function parseCliArgs(): UpdaterOptions {
  const args = process.argv.slice(2);
  let cwd = process.cwd();
  let debug = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--cwd' || arg === '-c') {
      if (i + 1 < args.length) {
        const cwdValue = args[i + 1];
        if (cwdValue) {
          cwd = cwdValue;
        }
        i++; // Skip next argument as it's the value for cwd
      } else {
        throw new Error('--cwd option requires a directory path');
      }
    } else if (arg === '--debug') {
      debug = true;
    }
  }

  return { cwd, debug, help };
}

export async function askLicense(): Promise<boolean> {
  console.log('Do you agree to the Minecraft EULA? (https://minecraft.net/eula)');
  const res_ = await cliSelect({
    values: ['yes', 'no'],
    selected: '[x]',
    unselected: '[ ]',
    defaultValue: 1,
    valueRenderer: (value, selected) => selected ? chalk.underline(value) : value,
  });
  return res_.value === 'yes';
}

export async function askSwitchVersion() {
  const res = await cliSelect({
    values: ['yes', 'no'],
    selected: '[x]',
    unselected: '[ ]',
    valueRenderer: (value, selected) => selected ? chalk.underline(value) : value,
  });
  return res.value === 'yes';
}

const typeOptions = {
  "stable": "stable-latest",
  "preview": "preview-latest",
  "stable-select": "stable (select version)",
  "preview-select": "preview (select version)"
}

export async function askVersion(versionEntry: VersionList): Promise<VersionInfo> {
  console.log('install options:');
  const res = await cliSelect({
    values: typeOptions,
    selected: '[x]',
    unselected: '[ ]',
    valueRenderer: (value, selected) => selected ? chalk.underline(value) : value,
  });
  const selected = res.id;
  console.log(`-- ${selected}`);

  let version: string;
  let isPreview: boolean;
  if (selected === 'stable' || selected === 'preview') {
    // @ts-ignore
    version = versionEntry[selected];
    isPreview = selected === 'preview';
  } else {
    const versions = versionEntry.versions;
    const previewVersions = versionEntry.preview_versions;
    const allVersions = selected === 'stable-select' ? versions : previewVersions;
    version = await selectVersion(allVersions);
    isPreview = selected === 'preview-select';
  }
  return { version, isPreview };
}

async function selectVersion(versions: string[]) {
  const options = {
    ...Object.fromEntries(versions.toReversed().slice(0, 10).map((v) => [v, v])),
    'enter': 'Enter a version manually'
  }

  console.log('versions:');
  const res = await cliSelect({
    values: options,
    selected: '[x]',
    unselected: '[ ]',
    valueRenderer: (value, selected) => selected ? chalk.underline(value) : value,
  });
  if (res.id === 'enter') {
    const answer = await askUntilValid({
      question: 'Enter a version',
      validValues: (v) => versions.includes(v),
      invalidMessage: 'Invalid version, please try again\n'
    });
    return answer;
  }
  console.log(`-- ${res.id}`);
  return res.id as string;
}
