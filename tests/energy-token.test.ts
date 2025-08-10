import { describe, it, expect, beforeEach } from 'vitest';


const mockContract = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  paused: false,
  totalSupply: 0n,
  balances: new Map<string, bigint>(),
  allowances: new Map<string, bigint>(),
  MAX_SUPPLY: 1_000_000_000n,

  isAdmin(caller: string): boolean {
    return caller === this.admin;
  },

  setPaused(caller: string, pause: boolean) {
    if (!this.isAdmin(caller)) return { error: 100 };
    this.paused = pause;
    return { value: pause };
  },

  mint(caller: string, recipient: string, amount: bigint) {
    if (!this.isAdmin(caller)) return { error: 100 };
    if (this.totalSupply + amount > this.MAX_SUPPLY) return { error: 103 };
    this.balances.set(recipient, (this.balances.get(recipient) || 0n) + amount);
    this.totalSupply += amount;
    return { value: true };
  },

  burn(caller: string, amount: bigint) {
    if (this.paused) return { error: 104 };
    const balance = this.balances.get(caller) || 0n;
    if (balance < amount) return { error: 101 };
    this.balances.set(caller, balance - amount);
    this.totalSupply -= amount;
    return { value: true };
  },

  transfer(caller: string, recipient: string, amount: bigint) {
    if (this.paused) return { error: 104 };
    const balance = this.balances.get(caller) || 0n;
    if (balance < amount) return { error: 101 };
    this.balances.set(caller, balance - amount);
    this.balances.set(recipient, (this.balances.get(recipient) || 0n) + amount);
    return { value: true };
  },

  approve(caller: string, spender: string, amount: bigint) {
    if (this.paused) return { error: 104 };
    this.allowances.set(`${caller}:${spender}`, amount);
    return { value: true };
  },

  transferFrom(caller: string, owner: string, recipient: string, amount: bigint) {
    if (this.paused) return { error: 104 };
    const allowance = this.allowances.get(`${owner}:${caller}`) || 0n;
    const balance = this.balances.get(owner) || 0n;
    if (allowance < amount) return { error: 102 };
    if (balance < amount) return { error: 101 };
    this.allowances.set(`${owner}:${caller}`, allowance - amount);
    this.balances.set(owner, balance - amount);
    this.balances.set(recipient, (this.balances.get(recipient) || 0n) + amount);
    return { value: true };
  },

  getBalance(account: string) {
    return { value: this.balances.get(account) || 0n };
  },
};

describe('EnergyToken Contract', () => {
  beforeEach(() => {
    mockContract.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockContract.paused = false;
    mockContract.totalSupply = 0n;
    mockContract.balances = new Map();
    mockContract.allowances = new Map();
  });

  it('should mint tokens when called by admin', () => {
    const result = mockContract.mint(mockContract.admin, 'ST2CY5...', 1000n);
    expect(result).toEqual({ value: true });
    expect(mockContract.balances.get('ST2CY5...')).toBe(1000n);
    expect(mockContract.totalSupply).toBe(1000n);
  });

  it('should fail to mint over max supply', () => {
    const result = mockContract.mint(mockContract.admin, 'ST2CY5...', 2_000_000_000n);
    expect(result).toEqual({ error: 103 });
  });

  it('should transfer tokens', () => {
    mockContract.mint(mockContract.admin, 'ST2CY5...', 500n);
    const result = mockContract.transfer('ST2CY5...', 'ST3NB...', 200n);
    expect(result).toEqual({ value: true });
    expect(mockContract.balances.get('ST2CY5...')).toBe(300n);
    expect(mockContract.balances.get('ST3NB...')).toBe(200n);
  });

  it('should burn tokens', () => {
    mockContract.mint(mockContract.admin, 'ST2CY5...', 500n);
    const result = mockContract.burn('ST2CY5...', 200n);
    expect(result).toEqual({ value: true });
    expect(mockContract.balances.get('ST2CY5...')).toBe(300n);
    expect(mockContract.totalSupply).toBe(300n);
  });

  it('should approve and transfer-from tokens', () => {
    mockContract.mint(mockContract.admin, 'ST2CY5...', 500n);
    mockContract.approve('ST2CY5...', 'ST3NB...', 300n);
    const result = mockContract.transferFrom('ST3NB...', 'ST2CY5...', 'ST4RE...', 200n);
    expect(result).toEqual({ value: true });
    expect(mockContract.balances.get('ST2CY5...')).toBe(300n);
    expect(mockContract.balances.get('ST4RE...')).toBe(200n);
    expect(mockContract.allowances.get('ST2CY5...:ST3NB...')).toBe(100n);
  });

  it('should fail transfer when paused', () => {
    mockContract.setPaused(mockContract.admin, true);
    const result = mockContract.transfer('ST2CY5...', 'ST3NB...', 10n);
    expect(result).toEqual({ error: 104 });
  });
});