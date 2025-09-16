import * as path from 'node:path';
import * as pc from 'picocolors';
import { select } from '@inquirer/prompts';
import figures from '@inquirer/figures';
import sortableCheckbox from 'inquirer-sortable-checkbox';
import { Addon, AddonType, BedrockServer, PackData, Uuid } from '../server';
import { selectWorldPrompt } from '../prompts';
import { normalizeVersion } from '../util';

const orange = (str: unknown) => `\x1b[38;5;214m${str}\x1b[0m`;

export async function addonManager(cwd: string): Promise<void> {
  console.log(pc.bold(orange('📦  Addon Manager')));

  const action = await select({
    message: 'Select an action:',
    choices: [
      {
        name: 'Edit behavior packs',
        value: () => editAddon(cwd, 'behavior'),
      },
      {
        name: 'Edit resource packs',
        value: () => editAddon(cwd, 'resource'),
      },
    ]
  });

  await action();
}

async function editAddon(serverPath: string, type: AddonType) {
  const server = new BedrockServer(serverPath);
  const world = await selectWorldPrompt(server);
  const addons = await world.addons.getAddons(type);
  const enabledPacks = world.addons.getEnabledPacks(type);
  
  const choices = new Map<
    `${Uuid}@${string}`,
    { name: string, value: { addon?: Addon, pack: PackData }, checked: boolean }
  >();

  for (const pack of enabledPacks) {
    const addon = addons.find(addon => addon.equals(pack));
    choices.set(`${pack.pack_id}@${normalizeVersion(pack.version)}`, {
      name: formatName(addon ?? pack, serverPath),
      value: { addon, pack },
      checked: true
    });
  }

  for (const addon of addons) {
    const key = `${addon.uuid}@${addon.normalizedVersion}` as const;
    if (choices.has(key)) continue;
    choices.set(key, {
      name: formatName(addon, serverPath),
      value: {
        addon,
        pack: { pack_id: addon.uuid, version: addon.version },
      },
      checked: false
    });
  }

  if (choices.size === 0) throw new Error(pc.red('No addons available.'));

  const result = await sortableCheckbox({
    message: `Check ${type} packs to enable:`,
    choices: Array.from(choices.values()),
    theme: {
      helpMode: 'always',
      icon: {
        checked: ` ${pc.green(figures.tick)} `,
        unchecked: ` ${pc.red(figures.cross)} `,
      }
    },
    pageSize: choices.size
  });

  world.addons.setEnabledPacks(type, result.map(r => r.pack));
  world.addons.saveEnabledPacks(type);

  console.log('\n=== Pack Stack ===');
  console.log(result.map((value, i) => (
    `${i + 1}. ${formatName(value.addon ?? value.pack, serverPath)}`
  )).join('\n'))

  console.log(`\n${pc.green('Successfully saved enabled packs!')}`);
}

function formatName(addon: Addon | PackData, serverPath: string): string {
  return addon instanceof Addon
    ? `${addon.name} @ ${addon.normalizedVersion} ${pc.dim(`(${path.relative(serverPath, addon.addonPath)})`)}`
    : `${addon.pack_id} @ ${normalizeVersion(addon.version)} ${pc.dim('(failed to locate)')}`;
}
