/**
 * Runs the quick checks for `pnpm commit:check` in 2 stages, with the checks in each stage at the
 * same time, rather than one after another. The code checks go first. The tests go second, on their
 * own, as some time out if the computer is too busy. Each check's output is shown in one piece when
 * it finishes, rather than mixed together, then a summary says which passed and how long each took.
 * It stops after the first stage if anything fails.
 */
import { spawn } from 'node:child_process';

const STAGES = [
  ['format:check', 'lint:css', 'lint', 'typecheck'],
  ['test:coverage', 'test:storybook'],
];

interface Result {
  name: string;
  passed: boolean;
  seconds: number;
}

function run(name: string): Promise<Result> {
  const start = Date.now();
  return new Promise((resolve) => {
    const child = spawn('pnpm', ['run', '--silent', name], {
      env: { ...process.env, FORCE_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.on('close', (code) => {
      const result = { name, passed: code === 0, seconds: (Date.now() - start) / 1000 };
      process.stdout.write(
        `\n── ${name} ${result.passed ? 'passed' : 'FAILED'} ──\n${output.trimEnd()}\n`,
      );
      resolve(result);
    });
  });
}

const results: Result[] = [];
for (const stage of STAGES) {
  results.push(...(await Promise.all(stage.map(run))));
  if (results.some(({ passed }) => !passed)) break;
}

console.log('\nQuick checks:');
for (const { name, passed, seconds } of results) {
  console.log(`  ${passed ? 'passed' : 'FAILED'}  ${name} (${seconds.toFixed(0)}s)`);
}
if (results.some(({ passed }) => !passed)) process.exit(1);
