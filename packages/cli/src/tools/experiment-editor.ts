import { ByteTag, CompoundTag, TagType } from '@serenityjs/nbt';
import { checkbox } from '@inquirer/prompts';
import * as pc from 'picocolors';
import { BedrockServer } from '../server';
import { selectWorld } from '../prompts';

const ignoredExperimentsKey = new Set([
  'experiments_ever_used',
  'saved_with_toggled_experiments'
]);

interface ExperimentEntry {
  name: string;
  key: string;
}

// Last updated: 2025/08/20 - v1.21.101
const experimentList: ExperimentEntry[] = [
  // gameplay
  { name: 'Villager Trade Rebalancing', key: 'villager_trades_rebalance' },
  { name: 'Drop 3 2025', key: 'y_2025_drop_3' },

  // add-on creators
  { name: 'Custom biomes', key: 'data_driven_biomes' },
  { name: 'Upcoming Creator Features', key: 'upcoming_creator_features' },
  { name: 'Beta APIs', key: 'gametest' },
  { name: 'Experimental Creator Camera Features', key: 'experimental_creator_cameras' },
  { name: 'Data-Driven Jigsaw Structures', key: 'jigsaw_structures' },
];

export async function experimentEditor(cwd: string): Promise<void> {
  console.log(pc.bold(pc.green('🛠️  Experimental Settings Editor')));

  const server = new BedrockServer(cwd);

  const world = await selectWorld(server);

  const root = world.levelDat.getRootTag();
  const experimentsTag = root.get<CompoundTag>('experiments');
  if (!experimentsTag) throw new Error('Missing experiments tag');

  const experimentStates: Map<string, ExperimentEntry & { defaultValue: boolean }> = new Map();
  // get existing values
  for (const [key, tag] of experimentsTag.entries()) {
    if (ignoredExperimentsKey.has(key)) continue;
    if (tag.type === TagType.Byte) {
      experimentStates.set(key, {
        key: key,
        name: experimentList.find(exp => exp.key === key)?.name ?? key,
        defaultValue: tag.valueOf() === 1 // use current value
      });
    }
  }
  // get defined values
  for (const exp of experimentList) {
    if (experimentStates.has(exp.key)) continue;
    experimentStates.set(exp.key, {
      key: exp.key,
      name: exp.name,
      defaultValue: false // treat as "false" if not exist in tag
    });
  }

  const checkedKeys = await checkbox({
    message: 'Check experiments to enable:',
    choices: [...experimentStates.values()].map(exp => ({
      name: exp.name,
      value: exp.key,
      checked: exp.defaultValue
    })),
    theme: {
      helpMode: 'always',
      icon: {
        checked: pc.green(' ✓ '),
        unchecked: pc.red(' ✗ '),
      }
    },
    loop: false,
    pageSize: experimentStates.size
  });

  for (const key of experimentStates.keys()) {
    if (checkedKeys.includes(key)) {
      experimentsTag.set(key, new ByteTag(1));
    } else {
      if (experimentsTag.has(key)) {
        experimentsTag.set(key, new ByteTag(0));
      }
    }
  }

  world.levelDat.save();

  console.log();
  console.log(pc.green('Successfully updated experiments!'));
}