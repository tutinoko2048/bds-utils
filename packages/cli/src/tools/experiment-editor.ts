import { ByteTag, CompoundTag, TagType } from '@serenityjs/nbt';
import { checkbox, Separator } from '@inquirer/prompts';
import figures from '@inquirer/figures';
import pc from 'picocolors';
import { BedrockServer } from '../server';
import { selectWorldPrompt } from '../prompts';

const ignoredExperimentsKey = new Set([
  'experiments_ever_used',
  'saved_with_toggled_experiments'
]);

const EDUCATION_FEATURE_KEY = 'educationFeaturesEnabled';

interface ExperimentEntry {
  name: string;
  key: string;
}

// Last updated: 2025/12/30 - v1.21.131
const experimentList: ExperimentEntry[] = [
  // gameplay
  { name: 'Villager Trade Rebalancing', key: 'villager_trades_rebalance' },
  // { name: 'Drop 3 2025', key: 'y_2025_drop_3' }, // removed in 1.21.131

  // add-on creators
  // { name: 'Custom biomes', key: 'data_driven_biomes' }, // removed in 1.21.131
  { name: 'Upcoming Creator Features', key: 'upcoming_creator_features' },
  { name: 'Beta APIs', key: 'gametest' },
  { name: 'Experimental Creator Camera Features', key: 'experimental_creator_cameras' },
  // { name: 'Data-Driven Jigsaw Structures', key: 'jigsaw_structures' }, // removed in 1.21.131
];

export async function experimentEditor(cwd: string): Promise<void> {
  console.log(pc.bold(pc.green('🧪  Experimental Settings Editor')));

  const server = new BedrockServer(cwd);

  const world = await selectWorldPrompt(server);

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
    choices: [
      new Separator('--- Common ---'),
      {
        name: 'Minecraft Education Features',
        value: EDUCATION_FEATURE_KEY,
        checked: root.get<ByteTag>(EDUCATION_FEATURE_KEY)?.valueOf() === 1
      },
      new Separator('--- Experiments ---'),
      ...[...experimentStates.values()].map(exp => ({
        name: exp.name,
        value: exp.key,
        checked: exp.defaultValue
      }))
    ],
    theme: {
      helpMode: 'always',
      icon: {
        checked: ` ${(pc.green(figures.tick))} `,
        unchecked: ` ${(pc.red(figures.cross))} `,
      }
    },
    loop: false,
    pageSize: experimentStates.size + 3
  });

  // common settings
  if (checkedKeys.includes(EDUCATION_FEATURE_KEY)) {
    root.set(EDUCATION_FEATURE_KEY, new ByteTag(1));
  } else {
    root.set(EDUCATION_FEATURE_KEY, new ByteTag(0));
  }

  // experiment settings
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
