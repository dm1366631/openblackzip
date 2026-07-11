import path from 'path';
import fs from 'fs';
import os from 'os';

let uploadsDir: string | null = null;
let outputDir: string | null = null;

export function getUploadsDir(): string {
  if (!uploadsDir) {
    uploadsDir = path.join(os.tmpdir(), 'openblackzip-uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  }
  return uploadsDir;
}

export function getOutputDir(): string {
  if (!outputDir) {
    outputDir = path.join(os.tmpdir(), 'openblackzip-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }
  return outputDir;
}

export function validateFilePath(filename: string, baseDir: string): string | null {
  const basename = path.basename(filename);
  const resolvedPath = path.resolve(baseDir, basename);
  const normalizedBase = path.resolve(baseDir) + path.sep;
  if (resolvedPath.startsWith(normalizedBase)) {
    return resolvedPath;
  }
  return null;
}