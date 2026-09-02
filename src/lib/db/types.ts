import { customType } from "drizzle-orm/pg-core";

/**
 * PostGIS geography(Point, 4326) column. Values are exchanged as { lng, lat }.
 * Stored as geography so ST_DWithin measures true metres (handoff §9.4).
 */
export type LngLat = { lng: number; lat: number };

export const geographyPoint = customType<{ data: LngLat; driverData: string }>({
  dataType() {
    return "geography(Point,4326)";
  },
  toDriver(value: LngLat) {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  fromDriver(value: string): LngLat {
    // postgres.js returns geography as hex EWKB unless cast; we cast in selects (see queries.ts).
    const m = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(value);
    if (m) return { lng: Number(m[1]), lat: Number(m[2]) };
    return parseEwkbPoint(value);
  },
});

/** Minimal EWKB parser for a 2-D point (hex, little-endian). */
export function parseEwkbPoint(hex: string): LngLat {
  const buf = Buffer.from(hex, "hex");
  const little = buf.readUInt8(0) === 1;
  const type = little ? buf.readUInt32LE(1) : buf.readUInt32BE(1);
  const hasSrid = (type & 0x20000000) !== 0;
  let off = 5 + (hasSrid ? 4 : 0);
  const x = little ? buf.readDoubleLE(off) : buf.readDoubleBE(off);
  off += 8;
  const y = little ? buf.readDoubleLE(off) : buf.readDoubleBE(off);
  return { lng: x, lat: y };
}
