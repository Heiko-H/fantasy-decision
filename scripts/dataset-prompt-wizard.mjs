#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const rl = createInterface({ input, output });

function printHeader() {
  output.write('\nDND Dataset Prompt Wizard\n');
  output.write('Collects inputs for docs/fragen-prompt.md and validates them.\n');
  output.write('Writes an inputs JSON block to scripts/out/.\n\n');
}

function normalizeMode(raw) {
  const value = (raw ?? '').trim().toLowerCase();
  if (['provided', '1', 'p'].includes(value)) return 'provided';
  if (['invented', '2', 'i'].includes(value)) return 'invented';
  if (['derived', '3', 'd'].includes(value)) return 'derived';
  return null;
}

function isInt(value) {
  return Number.isInteger(value);
}

function slugifyAscii(value) {
  const lower = String(value ?? '').toLowerCase();
  // Replace non a-z0-9 with underscore, collapse underscores.
  return lower
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function validateDatasetId(datasetId) {
  // Rules from fragen-prompt.md: lowercase ASCII, a-z 0-9 _, start with letter, 3-64 chars
  return /^[a-z][a-z0-9_]{2,63}$/.test(datasetId);
}

function validateAnswerTypeId(id) {
  return /^at_[a-z0-9_]+$/.test(id);
}

async function askLine(question, { defaultValue = undefined, allowEmpty = false } = {}) {
  const suffix = defaultValue !== undefined ? ` [default: ${defaultValue}]` : '';
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const answer = (await rl.question(`${question}${suffix}: `)).trim();
    if (answer.length === 0) {
      if (defaultValue !== undefined) return String(defaultValue);
      if (allowEmpty) return '';
    } else {
      return answer;
    }
  }
}

async function askInt(question, { min = undefined, max = undefined, defaultValue = undefined } = {}) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const raw = await askLine(question, { defaultValue });
    const n = Number(raw);
    if (!Number.isFinite(n) || !isInt(n)) {
      output.write('  -> Please enter an integer.\n');
      continue;
    }
    if (min !== undefined && n < min) {
      output.write(`  -> Must be >= ${min}.\n`);
      continue;
    }
    if (max !== undefined && n > max) {
      output.write(`  -> Must be <= ${max}.\n`);
      continue;
    }
    return n;
  }
}

async function askMode() {
  output.write('Mode options:\n');
  output.write('  1) provided  (you provide full answerTypes list + translations)\n');
  output.write('  2) invented  (AI invents answer types)\n');
  output.write('  3) derived   (AI derives answer types from a rule)\n');

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const raw = await askLine('Choose mode (provided/invented/derived or 1/2/3)');
    const mode = normalizeMode(raw);
    if (mode) return mode;
    output.write('  -> Please choose provided, invented, or derived.\n');
  }
}

async function askDatasetId() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const datasetId = await askLine('datasetId (lowercase, a-z0-9_, start with letter, 3-64 chars)');
    if (validateDatasetId(datasetId)) return datasetId;
    output.write('  -> Invalid datasetId. Example: dnd_races_core\n');
  }
}

async function askProvidedAnswerTypes() {
  const count = await askInt('How many answer types?', { min: 2 });

  const seenIds = new Set();
  const answerTypes = [];

  for (let i = 0; i < count; i++) {
    output.write(`\nAnswer type ${i + 1} of ${count}\n`);

    const enName = await askLine('  en.name');
    const deName = await askLine('  de.name');

    const suggested = `at_${slugifyAscii(enName) || 'type'}`;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const id = await askLine('  id (must start with at_)', { defaultValue: suggested });
      if (!validateAnswerTypeId(id)) {
        output.write('    -> Invalid id. Must match ^at_[a-z0-9_]+$\n');
        continue;
      }
      if (seenIds.has(id)) {
        output.write('    -> Duplicate id. Must be unique.\n');
        continue;
      }
      seenIds.add(id);

      answerTypes.push({
        id,
        translations: {
          en: { name: enName },
          de: { name: deName },
        },
      });
      break;
    }
  }

  return { answerTypes, answerTypeCount: answerTypes.length };
}

async function askInventedAnswerTypes() {
  const answerTypeCount = await askInt('answerTypeCount (how many archetypes should be invented)?', {
    min: 2,
  });
  const inventedHint = await askLine('Optional invented theme hint (e.g., "D&D-like adventurer archetypes")', {
    allowEmpty: true,
  });

  return { answerTypeCount, inventedHint };
}

async function askDerivedAnswerTypes() {
  const answerTypeDerivationRule = await askLine(
    'answerTypeDerivationRule (e.g., "all playable races" or "core classes")'
  );
  const answerTypeScopeHint = await askLine('Optional scope hint (e.g., "core/common only")', {
    allowEmpty: true,
  });

  return { answerTypeDerivationRule, answerTypeScopeHint };
}

async function main() {
  printHeader();

  const datasetId = await askDatasetId();
  const mode = await askMode();
  const questionCount = await askInt('questionCount', { min: 1 });
  const fantasyPercent = await askInt('fantasyPercent (0-100)', { min: 0, max: 100, defaultValue: 80 });

  /** @type {any} */
  const result = {
    datasetId,
    mode,
    questionCount,
    fantasyPercent,
    // Keep these fields present (even if empty) to match docs/fragen-prompt.md template
    answerTypes: [],
    answerTypeCount: undefined,
    inventedHint: '',
    answerTypeDerivationRule: '',
    answerTypeScopeHint: '',
  };

  if (mode === 'provided') {
    const { answerTypes, answerTypeCount } = await askProvidedAnswerTypes();
    result.answerTypes = answerTypes;
    result.answerTypeCount = answerTypeCount;
  } else if (mode === 'invented') {
    const { answerTypeCount, inventedHint } = await askInventedAnswerTypes();
    result.answerTypeCount = answerTypeCount;
    result.inventedHint = inventedHint;
  } else if (mode === 'derived') {
    const { answerTypeDerivationRule, answerTypeScopeHint } = await askDerivedAnswerTypes();
    result.answerTypeDerivationRule = answerTypeDerivationRule;
    result.answerTypeScopeHint = answerTypeScopeHint;
  }

  const outDir = join(process.cwd(), 'scripts', 'out');
  await mkdir(outDir, { recursive: true });

  const outPath = join(outDir, `${datasetId}.inputs.json`);
  await writeFile(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');

  output.write(`\nWrote: ${outPath}\n`);
  output.write('\nNext step:\n');
  output.write('1) Open docs/fragen-prompt.md\n');
  output.write('2) Paste the JSON from scripts/out/...inputs.json into the prompt input section\n');
  output.write('3) Give the prompt to your AI; it should reply MISSING_INPUTS or ask CONFIRM_GENERATION\n\n');
}

try {
  await main();
} finally {
  rl.close();
}
