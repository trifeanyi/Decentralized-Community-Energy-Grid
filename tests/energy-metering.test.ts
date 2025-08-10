import { describe, it, expect, beforeEach } from 'vitest';

interface EnergyRecord {
  produced: bigint;
  consumed: bigint;
}

const mockContract = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  paused: false,
  authorizedReporters: ['ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'],
  records: new Map<string, EnergyRecord>(),
  totals: new Map<string, EnergyRecord>(),

  isAdmin(caller: string): boolean {
    return caller === this.admin;
  },

  isAuthorizedReporter(reporter: string): boolean {
    return this.authorizedReporters.includes(reporter);
  },

  setPaused(caller: string, pause: boolean) {
    if (!this.isAdmin(caller)) return { error: 100 };
    this.paused = pause;
    return { value: pause };
  },

  addReporter(caller: string, reporter: string) {
    if (!this.isAdmin(caller)) return { error: 100 };
    if (this.authorizedReporters.includes(reporter)) return { value: true };
    this.authorizedReporters.push(reporter);
    return { value: true };
  },

  removeReporter(caller: string, reporter: string) {
    if (!this.isAdmin(caller)) return { error: 100 };
    this.authorizedReporters = this.authorizedReporters.filter((r: string) => r !== reporter);
    return { value: true };
  },

  reportEnergy(caller: string, user: string, produced: bigint, consumed: bigint, timestamp: bigint) {
    if (this.paused) return { error: 102 };
    if (!this.isAuthorizedReporter(caller)) return { error: 104 };
    if (produced === 0n && consumed === 0n) return { error: 101 };
    this.records.set(`${user}:${timestamp}`, { produced, consumed });
    const current = this.totals.get(user) || { produced: 0n, consumed: 0n };
    this.totals.set(user, {
      produced: current.produced + produced,
      consumed: current.consumed + consumed,
    });
    return { value: true };
  },

  getEnergyRecord(user: string, timestamp: bigint) {
    return { value: this.records.get(`${user}:${timestamp}`) || { produced: 0n, consumed: 0n } };
  },

  getTotalEnergy(user: string) {
    return { value: this.totals.get(user) || { produced: 0n, consumed: 0n } };
  },
};

describe('EnergyMetering Contract', () => {
  beforeEach(() => {
    mockContract.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockContract.paused = false;
    mockContract.authorizedReporters = ['ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'];
    mockContract.records = new Map();
    mockContract.totals = new Map();
  });

  it('should report energy data', () => {
    const result = mockContract.reportEnergy(mockContract.admin, 'ST2CY5...', 1000n, 500n, 123n);
    expect(result).toEqual({ value: true });
    expect(mockContract.records.get('ST2CY5...:123')).toEqual({ produced: 1000n, consumed: 500n });
    expect(mockContract.totals.get('ST2CY5...')).toEqual({ produced: 1000n, consumed: 500n });
  });

  it('should fail to report zero energy', () => {
    const result = mockContract.reportEnergy(mockContract.admin, 'ST2CY5...', 0n, 0n, 123n);
    expect(result).toEqual({ error: 101 });
  });

  it('should add authorized reporter', () => {
    const result = mockContract.addReporter(mockContract.admin, 'ST3NB...');
    expect(result).toEqual({ value: true });
    expect(mockContract.authorizedReporters).toContain('ST3NB...');
  });

  it('should remove authorized reporter', () => {
    mockContract.addReporter(mockContract.admin, 'ST3NB...');
    const result = mockContract.removeReporter(mockContract.admin, 'ST3NB...');
    expect(result).toEqual({ value: true });
    expect(mockContract.authorizedReporters).not.toContain('ST3NB...');
  });

  it('should fail to report by unauthorized reporter', () => {
    const result = mockContract.reportEnergy('ST3NB...', 'ST2CY5...', 1000n, 500n, 123n);
    expect(result).toEqual({ error: 104 });
  });

  it('should fail to report when paused', () => {
    mockContract.setPaused(mockContract.admin, true);
    const result = mockContract.reportEnergy(mockContract.admin, 'ST2CY5...', 1000n, 500n, 123n);
    expect(result).toEqual({ error: 102 });
  });
});