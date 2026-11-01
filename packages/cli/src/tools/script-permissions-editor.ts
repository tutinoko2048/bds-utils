import * as fs from 'node:fs';
import * as path from 'node:path';
import * as jsonc from 'jsonc-parser';
import { checkbox, input, Separator } from '@inquirer/prompts';
import figures from '@inquirer/figures';
import pc from 'picocolors';
import { tryReadFileSync } from '../util';

const CUSTOM_MODULES_CHOICE = '__custom_modules__';

interface PermissionsJson {
  allowed_modules?: string[];
}

// Last updated: 2026/11/02
const knownModules: string[] = [
  '@minecraft/server',
  '@minecraft/server-ui',
  '@minecraft/server-admin',
  '@minecraft/server-net',
  '@minecraft/server-gametest',
  '@minecraft/server-editor',
  '@minecraft/server-graphics',
  '@minecraft/debug-utilities',
  '@minecraft/diagnostics',
  '@minecraft/common',
];

export async function scriptPermissionsEditor(cwd: string): Promise<void> {
  console.log(pc.bold(pc.green('📜  Script Permissions Editor')));

  const filePath = path.join(cwd, 'config', 'default', 'permissions.json');
  const content = tryReadFileSync(filePath);
  const permissions: PermissionsJson = content ? jsonc.parse(content) ?? {} : {};
  const allowedModules = new Set(permissions.allowed_modules ?? []);

  // modules only in permissions.json come after the known ones
  const modules = [...new Set([...knownModules, ...allowedModules])];

  const checkedModules = await checkbox({
    message: 'Check script modules to allow:',
    choices: [
      ...modules.map(name => ({
        name,
        value: name,
        checked: allowedModules.has(name)
      })),
      new Separator(pc.whiteBright('--- Other ---')),
      {
        name: 'Add custom modules...',
        value: CUSTOM_MODULES_CHOICE,
        checked: false
      }
    ],
    theme: {
      icon: {
        checked: ` ${(pc.green(figures.tick))} `,
        unchecked: ` ${(pc.red(figures.cross))} `,
      }
    },
    loop: false,
    pageSize: modules.length + 3
  });

  const customModules = checkedModules.includes(CUSTOM_MODULES_CHOICE)
    ? (await input({ message: 'Module names to allow (comma-separated):' }))
      .split(',')
      .map(name => name.trim())
      .filter(Boolean)
    : [];

  const allowed_modules = [...new Set([
    ...checkedModules.filter(name => name !== CUSTOM_MODULES_CHOICE),
    ...customModules
  ])];

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify({ ...permissions, allowed_modules }, null, 2));

  const added = allowed_modules.filter(name => !allowedModules.has(name));
  const removed = [...allowedModules].filter(name => !allowed_modules.includes(name));

  console.log();
  for (const name of added) console.log(pc.greenBright(`+ ${name}`));
  for (const name of removed) console.log(pc.redBright(`- ${name}`));
  if (!added.length && !removed.length) console.log(pc.dim('No changes'));

  console.log();
  console.log(pc.green('Successfully updated config/default/permissions.json!'));
}
