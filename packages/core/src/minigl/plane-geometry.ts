import type { MiniGlPlaneGeometry as MiniGlPlaneGeometryIface, MiniGlAttribute as MiniGlAttributeIface } from '../types';
import type { MiniGlRuntime } from './runtime';

import { MiniGlAttribute } from './attribute';

export class MiniGlPlaneGeometry implements MiniGlPlaneGeometryIface {
  attributes: {
    position: MiniGlAttributeIface;
    uv: MiniGlAttributeIface;
    uvNorm: MiniGlAttributeIface;
    index: MiniGlAttributeIface;
    [k: string]: MiniGlAttributeIface;
  };
  xSegCount!: number;
  ySegCount!: number;
  vertexCount!: number;
  quadCount!: number;
  width!: number;
  height!: number;
  orientation!: string;

  private readonly gl: WebGLRenderingContext;
  private readonly debugFn: (...args: string[]) => void;

  constructor(host: MiniGlRuntime, width: number = 1, height: number = 1, n: number = 1, i: number = 1, orientation: string = 'xz') {
    this.gl = host.gl;
    this.debugFn = host.debug;
    const gl = this.gl;

    this.attributes = {
      position: new MiniGlAttribute(gl, {
        target: gl.ARRAY_BUFFER,
        size: 3,
      }),
      uv: new MiniGlAttribute(gl, {
        target: gl.ARRAY_BUFFER,
        size: 2,
      }),
      uvNorm: new MiniGlAttribute(gl, {
        target: gl.ARRAY_BUFFER,
        size: 2,
      }),
      index: new MiniGlAttribute(gl, {
        target: gl.ELEMENT_ARRAY_BUFFER,
        size: 3,
        type: gl.UNSIGNED_SHORT,
      }),
    };
    this.setTopology(n, i);
    this.setSize(width, height, orientation);
  }

  setTopology(e: number = 1, t: number = 1): void {
    this.xSegCount = e;
    this.ySegCount = t;
    this.vertexCount = (this.xSegCount + 1) * (this.ySegCount + 1);
    this.quadCount = this.xSegCount * this.ySegCount * 2;
    this.attributes.uv.values = new Float32Array(2 * this.vertexCount);
    this.attributes.uvNorm.values = new Float32Array(2 * this.vertexCount);
    this.attributes.index.values = new Uint16Array(3 * this.quadCount);

    for (let yy = 0; yy <= this.ySegCount; yy++) {
      for (let xx = 0; xx <= this.xSegCount; xx++) {
        const vi = yy * (this.xSegCount + 1) + xx;

        this.attributes.uv.values[2 * vi] = xx / this.xSegCount;
        this.attributes.uv.values[2 * vi + 1] = 1 - yy / this.ySegCount;

        this.attributes.uvNorm.values[2 * vi] = (xx / this.xSegCount) * 2 - 1;
        this.attributes.uvNorm.values[2 * vi + 1] = 1 - (yy / this.ySegCount) * 2;

        if (xx < this.xSegCount && yy < this.ySegCount) {
          const s = yy * this.xSegCount + xx;

          this.attributes.index.values[6 * s] = vi;
          this.attributes.index.values[6 * s + 1] = vi + 1 + this.xSegCount;
          this.attributes.index.values[6 * s + 2] = vi + 1;
          this.attributes.index.values[6 * s + 3] = vi + 1;
          this.attributes.index.values[6 * s + 4] = vi + 1 + this.xSegCount;
          this.attributes.index.values[6 * s + 5] = vi + 2 + this.xSegCount;
        }
      }
    }

    this.attributes.uv.update();
    this.attributes.uvNorm.update();
    this.attributes.index.update();
    this.debugFn('Geometry.setTopology');
  }

  setSize(width: number = 1, height: number = 1, orientation: string = 'xz'): void {
    this.width = width;
    this.height = height;
    this.orientation = orientation;

    if (!(this.attributes.position.values && this.attributes.position.values.length === 3 * this.vertexCount)) {
      this.attributes.position.values = new Float32Array(3 * this.vertexCount);
    }

    const o = width / -2;
    const r = height / -2;
    const segmentWidth = width / this.xSegCount;
    const segmentHeight = height / this.ySegCount;

    for (let yIndex = 0; yIndex <= this.ySegCount; yIndex++) {
      const ty = r + yIndex * segmentHeight;

      for (let xIndex = 0; xIndex <= this.xSegCount; xIndex++) {
        const rx = o + xIndex * segmentWidth;
        const l = yIndex * (this.xSegCount + 1) + xIndex;

        this.attributes.position.values[3 * l + 'xyz'.indexOf(orientation[0])] = rx;
        this.attributes.position.values[3 * l + 'xyz'.indexOf(orientation[1])] = -ty;
      }
    }

    this.attributes.position.update();
    this.debugFn('Geometry.setSize');
  }
}
