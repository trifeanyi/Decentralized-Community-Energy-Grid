import { describe, it, expect, beforeEach } from 'vitest';

interface EnergyOffer {
  seller: string;
  amount: bigint;
  pricePerKwh: bigint;
  active: boolean;
}

const mockContract = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  paused: false,
  offerCount: 0n,
  offers: new Map<bigint, EnergyOffer>(),
  tokenContract: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.energy-token',
  tokenBalances: new Map<string, bigint>(), // Mock token contract state

  isAdmin(caller: string): boolean {
    return caller === this.admin;
  },

  setPaused(caller: string, pause: boolean) {
    if (!this.isAdmin(caller)) return { error: 100 };
    this.paused = pause;
    return { value: pause };
  },

  createOffer(caller: string, amount: bigint, pricePerKwh: bigint) {
    if (this.paused) return { error: 105 };
    if (amount <= 0n) return { error: 104 };
    if (pricePerKwh <= 0n) return { error: 104 };
    const offerId = this.offerCount + 1n;
    this.offers.set(offerId, { seller: caller, amount, pricePerKwh, active: true });
    this.offerCount = offerId;
    return { value: offerId };
  },

  cancelOffer(caller: string, offerId: bigint) {
    const offer = this.offers.get(offerId);
    if (!offer) return { error: 107 };
    if (caller !== offer.seller) return { error: 100 };
    if (!offer.active) return { error: 103 };
    this.offers.set(offerId, { ...offer, active: false });
    return { value: true };
  },

  buyEnergy(caller: string, offerId: bigint, amount: bigint) {
    if (this.paused) return { error: 105 };
    const offer = this.offers.get(offerId);
    if (!offer) return { error: 107 };
    if (!offer.active) return { error: 103 };
    if (offer.amount < amount) return { error: 101 };
    if (amount <= 0n) return { error: 104 };
    const totalCost = amount * offer.pricePerKwh;
    const buyerBalance = this.tokenBalances.get(caller) || 0n;
    if (buyerBalance < totalCost) return { error: 102 };
    this.tokenBalances.set(caller, buyerBalance - totalCost);
    this.tokenBalances.set(offer.seller, (this.tokenBalances.get(offer.seller) || 0n) + totalCost);
    this.offers.set(offerId, {
      ...offer,
      amount: offer.amount - amount,
      active: offer.amount - amount === 0n ? false : true,
    });
    return { value: true };
  },

  getOffer(offerId: bigint) {
    const offer = this.offers.get(offerId);
    return offer ? { value: offer } : { error: 107 };
  },

  getOfferCount() {
    return { value: this.offerCount };
  },
};

describe('EnergyMarketplace Contract', () => {
  beforeEach(() => {
    mockContract.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockContract.paused = false;
    mockContract.offerCount = 0n;
    mockContract.offers = new Map();
    mockContract.tokenBalances = new Map();
  });

  it('should create an energy offer', () => {
    const result = mockContract.createOffer('ST2CY5...', 1000n, 10n);
    expect(result).toEqual({ value: 1n });
    expect(mockContract.offers.get(1n)).toEqual({
      seller: 'ST2CY5...',
      amount: 1000n,
      pricePerKwh: 10n,
      active: true,
    });
  });

  it('should fail to create offer with zero amount', () => {
    const result = mockContract.createOffer('ST2CY5...', 0n, 10n);
    expect(result).toEqual({ error: 104 });
  });

  it('should buy energy from an offer', () => {
    mockContract.createOffer('ST2CY5...', 1000n, 10n);
    mockContract.tokenBalances.set('ST3NB...', 10000n);
    const result = mockContract.buyEnergy('ST3NB...', 1n, 500n);
    expect(result).toEqual({ value: true });
    expect(mockContract.offers.get(1n)?.amount).toBe(500n);
    expect(mockContract.tokenBalances.get('ST3NB...')).toBe(5000n);
    expect(mockContract.tokenBalances.get('ST2CY5...')).toBe(5000n);
  });

  it('should fail to buy energy when paused', () => {
    mockContract.setPaused(mockContract.admin, true);
    const result = mockContract.buyEnergy('ST3NB...', 1n, 500n);
    expect(result).toEqual({ error: 105 });
  });

  it('should cancel an offer', () => {
    mockContract.createOffer('ST2CY5...', 1000n, 10n);
    const result = mockContract.cancelOffer('ST2CY5...', 1n);
    expect(result).toEqual({ value: true });
    expect(mockContract.offers.get(1n)?.active).toBe(false);
  });

  it('should fail to cancel offer by non-seller', () => {
    mockContract.createOffer('ST2CY5...', 1000n, 10n);
    const result = mockContract.cancelOffer('ST3NB...', 1n);
    expect(result).toEqual({ error: 100 });
  });

  it('should return offer details', () => {
    mockContract.createOffer('ST2CY5...', 1000n, 10n);
    const result = mockContract.getOffer(1n);
    expect(result).toEqual({
      value: { seller: 'ST2CY5...', amount: 1000n, pricePerKwh: 10n, active: true },
    });
  });
});