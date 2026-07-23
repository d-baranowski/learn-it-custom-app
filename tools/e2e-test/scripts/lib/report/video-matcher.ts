import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import type { EnrichedTestResult } from './aggregator.js';

interface VideoFile {
  absPath: string;
  relNoExt: string; // path under the run's videos/ dir, '.mp4' stripped, posix
  run: number;
}

function normSpec(spec: string): string {
  return spec.replace(/\\/g, '/').replace(/^\.?\//, '');
}

// Score how well a video's path matches a test's spec: 2 for an exact/suffix
// path match, 1 for a bare filename match, 0 for no match.
function matchScore(specNorm: string, video: VideoFile): number {
  const rel = video.relNoExt;
  if (rel === specNorm || rel.endsWith('/' + specNorm) || specNorm.endsWith('/' + rel)) {
    return 2;
  }
  if (basename(rel) === basename(specNorm)) return 1;
  return 0;
}

export class VideoMatcher {
  // Match failure videos (recorded per run under shard-*/run-*/videos) to failed
  // tests by spec, copy them into <outputDir>/videos, and return testId → path.
  match(inputDir: string, failedTests: EnrichedTestResult[], outputDir: string): Map<string, string> {
    const result = new Map<string, string>();
    if (!existsSync(inputDir) || failedTests.length === 0) return result;

    const videos = this.collectVideos(inputDir);
    if (videos.length === 0) return result;

    const outVideosDir = resolve(outputDir, 'videos');
    const copied = new Map<string, string>(); // absPath → relative dest path

    for (const test of failedTests) {
      const specNorm = normSpec(test.spec);

      let best: VideoFile | null = null;
      let bestScore = 0;
      for (const v of videos) {
        const score = matchScore(specNorm, v);
        // Higher score wins; ties break to the later run (latest failing attempt).
        if (score > bestScore || (score > 0 && score === bestScore && best && v.run > best.run)) {
          best = v;
          bestScore = score;
        }
      }
      if (!best || bestScore === 0) continue;

      let dest = copied.get(best.absPath);
      if (!dest) {
        mkdirSync(outVideosDir, { recursive: true });
        const destName = `${best.relNoExt.replace(/\//g, '__')}.mp4`;
        copyFileSync(best.absPath, resolve(outVideosDir, destName));
        dest = `videos/${destName}`;
        copied.set(best.absPath, dest);
      }
      result.set(test.id, dest);
    }

    return result;
  }

  private collectVideos(inputDir: string): VideoFile[] {
    const videos: VideoFile[] = [];

    for (const shardDir of readdirSync(inputDir).filter((d) => d.startsWith('shard-'))) {
      const shardPath = resolve(inputDir, shardDir);
      if (!statSync(shardPath).isDirectory()) continue;

      for (const runDir of readdirSync(shardPath).filter((d) => d.startsWith('run-'))) {
        const run = parseInt(runDir.replace('run-', ''), 10);
        const videosRoot = resolve(shardPath, runDir, 'videos');
        if (!existsSync(videosRoot)) continue;

        for (const abs of this.walkMp4s(videosRoot)) {
          const relNoExt = abs
            .slice(videosRoot.length + 1)
            .replace(/\\/g, '/')
            .replace(/\.mp4$/, '');
          videos.push({ absPath: abs, relNoExt, run: isNaN(run) ? 0 : run });
        }
      }
    }

    return videos;
  }

  private walkMp4s(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        out.push(...this.walkMp4s(full));
      } else if (entry.endsWith('.mp4')) {
        out.push(full);
      }
    }
    return out;
  }
}
