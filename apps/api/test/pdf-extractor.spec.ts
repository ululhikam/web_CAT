import { describe, expect, it } from 'vitest';
import { splitColumns } from '../src/modules/imports/pdf-extractor';

interface Item {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

function item(str: string, x: number, y: number, width = 60): Item {
  return { str, x, y, width, height: 10, fontSize: 11 };
}

describe('splitColumns', () => {
  it('mempertahankan halaman satu kolom', () => {
    const items = Array.from({ length: 12 }, (_, index) =>
      item(`baris ${index}`, 40, 800 - index * 18),
    );
    const columns = splitColumns(items);
    expect(columns).toHaveLength(1);
    expect(columns[0]).toHaveLength(items.length);
  });

  it('memisahkan dua kolom dan membaca kolom kiri lebih dulu', () => {
    const left = Array.from({ length: 8 }, (_, index) =>
      item(`kiri ${index}`, 40, 800 - index * 18),
    );
    const right = Array.from({ length: 8 }, (_, index) =>
      item(`kanan ${index}`, 320, 800 - index * 18),
    );
    const columns = splitColumns([...left, ...right].sort((a, b) => b.y - a.y));

    expect(columns).toHaveLength(2);
    expect(columns[0]!.every((entry) => entry.x === 40)).toBe(true);
    expect(columns[1]!.every((entry) => entry.x === 320)).toBe(true);
    // Kolom kiri dibaca dari atas ke bawah.
    expect(columns[0]![0]!.y).toBeGreaterThan(columns[0]![1]!.y);
  });

  it('tidak memecah tabel lebar yang melewati batas', () => {
    const left = Array.from({ length: 8 }, (_, index) =>
      item(`sel ${index}`, 40, 800 - index * 18, 240),
    );
    const right = Array.from({ length: 8 }, (_, index) =>
      item(`nilai ${index}`, 320, 800 - index * 18, 240),
    );
    expect(splitColumns([...left, ...right])).toHaveLength(1);
  });
});
