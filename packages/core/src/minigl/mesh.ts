import type {
  MiniGlMesh as MiniGlMeshIface,
  MiniGlMaterial as MiniGlMaterialIface,
  MiniGlPlaneGeometry as MiniGlPlaneGeometryIface,
  MiniGlAttribute as MiniGlAttributeIface,
  MiniGlUniform as MiniGlUniformIface,
} from '../types';
import type { MiniGlRuntime } from './runtime';

export class MiniGlMesh implements MiniGlMeshIface {
  geometry: MiniGlPlaneGeometryIface;
  material: MiniGlMaterialIface;
  wireframe: boolean = false;
  attributeInstances: Array<{
    attribute: MiniGlAttributeIface;
    location: number;
  }> = [];

  private readonly gl: WebGLRenderingContext;
  private readonly host: MiniGlRuntime;
  private readonly debugFn: (...args: string[]) => void;

  constructor(host: MiniGlRuntime, geometry: MiniGlPlaneGeometryIface, material: MiniGlMaterialIface) {
    this.host = host;
    this.gl = host.gl;
    this.debugFn = host.debug;

    this.geometry = geometry;
    this.material = material;
    this.wireframe = false;
    this.attributeInstances = [];

    Object.entries(this.geometry.attributes).forEach(([e, attribute]) => {
      this.attributeInstances.push({
        attribute,
        location: attribute.attach(e, this.material.program),
      });
    });

    this.host.meshes.push(this);
    this.debugFn('Mesh.constructor');
  }

  draw(): void {
    const gl = this.gl;

    gl.useProgram(this.material.program);
    this.material.uniformInstances.forEach((item: { uniform: MiniGlUniformIface; location: WebGLUniformLocation | null }) =>
      item.uniform.update(item.location),
    );
    this.attributeInstances.forEach(({ attribute, location }) => attribute.use(location));
    gl.drawElements(this.wireframe ? gl.LINES : gl.TRIANGLES, this.geometry.attributes.index.values?.length || 0, gl.UNSIGNED_SHORT, 0);
  }

  remove(): void {
    this.host.meshes = this.host.meshes.filter((m) => m !== this);
  }
}
