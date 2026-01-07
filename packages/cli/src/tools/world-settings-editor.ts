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
  isRemoved?: boolean;
}

interface Choice<T> {
  name: string;
  value: T;
  checked: boolean;
  description?: string;
}

// Last updated: 2025/12/30
const LAST_UPDATED_VERSION = '1.21.131';

const experimentList: Record<string, ExperimentEntry> = {
  // gameplay
  villager_trades_rebalance: { name: 'Villager Trade Rebalancing' },

  // add-on creators
  upcoming_creator_features: { name: 'Upcoming Creator Features' },
  gametest: { name: 'Beta APIs' },
  experimental_creator_cameras: { name: 'Experimental Creator Camera Features' },

  // removed
  y_2025_drop_3: { name: 'Drop 3 2025', isRemoved: true }, // removed in 1.21.131
  data_driven_biomes: { name: 'Custom biomes', isRemoved: true }, // removed in 1.21.131
  jigsaw_structures: { name: 'Data-Driven Jigsaw Structures', isRemoved: true }, // removed in 1.21.131
};

export async function worldSettingsEditor(cwd: string): Promise<void> {
  console.log(pc.bold(pc.green('🌏  World Settings Editor')));

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
      const listEntry = experimentList[key];
      experimentStates.set(key, {
        name: listEntry ? listEntry.name : key,
        defaultValue: tag.valueOf() === 1, // use current value
        isRemoved: listEntry ? listEntry.isRemoved : true // treat as removed if not in list
      });
    }
  }
  // get defined values
  for (const [key, exp] of Object.entries(experimentList)) {
    if (experimentStates.has(key)) continue;
    if (exp.isRemoved) continue; // skip removed experiments

    experimentStates.set(key, {
      name: exp.name,
      defaultValue: false // treat as "false" if not exist in tag
    });
  }

  const experimentChoices: Choice<string>[] = [...experimentStates.entries()]
    .toSorted(([_, x]) => x.isRemoved ? 1 : -1)
    .map(([key, exp]) => ({
      name: exp.name + (exp.isRemoved ? pc.dim(' (removed)') : ''),
      value: key,
      checked: exp.defaultValue,
      description: exp.isRemoved
        ? `${pc.yellow(figures.warning)}  ${pc.dim(pc.italic(`This experiment has been removed in the current version: ${LAST_UPDATED_VERSION}`))}`
        : undefined
    }));

  const checkedKeys = await checkbox({
    message: 'Check experiments to enable:',
    choices: [
      new Separator(pc.whiteBright('--- Common ---')),
      {
        name: 'Minecraft Education Features',
        value: EDUCATION_FEATURE_KEY,
        checked: root.get<ByteTag>(EDUCATION_FEATURE_KEY)?.valueOf() === 1
      },
      new Separator(pc.whiteBright('--- Experiments ---')),
      ...experimentChoices
    ],
    theme: {
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
