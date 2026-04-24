import { describe, it, expect } from 'vitest';
import { detectHardware } from '../../src/detectors/hardware.js';

describe('detectHardware', () => {
  it('returns an os matching process.platform (or linux fallback)', () => {
    const hw = detectHardware();
    if (process.platform === 'darwin' || process.platform === 'linux' || process.platform === 'win32') {
      expect(hw.os).toBe(process.platform);
    } else {
      expect(hw.os).toBe('linux');
    }
    expect(hw.arch).toBe(process.arch);
    expect(typeof hw.shell).toBe('string');
    expect(hw.shell.length).toBeGreaterThan(0);
  });
});
