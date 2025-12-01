// src/rng.ts
export class SeededRNG {
	private _seed: number;
	constructor(seed: string | number = Math.random()) {
		this._seed = typeof seed === "string" ? hashString(seed) : seed >>> 0;
	}
	get seed(): number {
		return this._seed;
	}
	next() {
		// mulberry32 — tiny, excellent distribution
		this._seed += 0x6d2b79f5;
		let t = this._seed;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}
	gaussian(mean = 0, stdDev = 1) {
		const u = 1 - this.next();
		const v = this.next();
		const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
		return z * stdDev + mean;
	}
}

function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const chr = str.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0;
	}
	return hash >>> 0;
}
