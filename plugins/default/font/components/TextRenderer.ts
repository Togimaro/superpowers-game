const THREE = SupEngine.THREE;

import TextRendererUpdater from "./TextRendererUpdater";
import TextRendererGeometry from "./TextRendererGeometry";
import { FontPub } from "../data/FontAsset";

export default class TextRenderer extends SupEngine.ActorComponent {
  /* tslint:disable:variable-name */
  static Updater = TextRendererUpdater;
  /* tslint:enable:variable-name */

  texture: THREE.Texture;
  threeMeshes: THREE.Mesh[] = [];

  text: string;
  font: FontPub;
  options: {
    alignment: string;
    verticalAlignment: string;
    size?: number;
    color?: string;
  };
  opacity: number;

  constructor(actor: SupEngine.Actor) {
    super(actor, "TextRenderer");
  }

  setText(text: string) {
    this.text = text;
    this._createMesh();
  }
  setFont(font: FontPub) {
    this.font = font;
    this._createMesh();
  }
  setOptions(options: { alignment: string; verticalAlignment: string; size?: number; color?: string; }) {
    if (options.alignment == null) options.alignment = "center";
    if (options.verticalAlignment == null) options.verticalAlignment = "center";
    this.options = options;
    this._createMesh();
  }

  setOpacity(opacity: number) {
    this.opacity = opacity;

    for (const mesh of this.threeMeshes) {
      let mat = mesh.material as THREE.Material;
      if (this.opacity != null) {
        mat.transparent = true;
        mat.depthWrite = false;
        mat.opacity = this.opacity;
      } else {
        mat.transparent = false;
        mat.depthWrite = true;
        mat.opacity = 1;
      }
      mat.needsUpdate = true;
    }
  }

  _createMesh() {
    this.clearMesh();
    if (this.text == null || this.font == null) return;

    if (!this.font.isBitmap) this._createFontMesh();
    else if (this.font.texture != null) this._createBitmapMesh();

    for (const threeMesh of this.threeMeshes) {
      this.actor.threeObject.add(threeMesh);
      const scale = 1 / this.font.pixelsPerUnit;
      threeMesh.scale.set(scale, scale, scale);
      threeMesh.updateMatrixWorld(false);
    }
  }

  _createFontMesh() {
    const fontSize = (this.options.size != null) ? this.options.size : this.font.size;
    const texts = this.text.split("\n");

    const canvas = document.createElement("canvas");
    const ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
    ctx.font = `${fontSize}px ${this.font.name}`;
    let width = 1;
    for (const text of texts) width = Math.max(width, ctx.measureText(text).width);

    width += 10;
    // Arbitrary value that should be enough for most fonts
    // We might want to make it configurable in the future
    const heightBorder = fontSize * 0.3;

    const heightWithoutBorder = fontSize * texts.length;
    const height = heightWithoutBorder + heightBorder * 2;
    canvas.width = width;
    canvas.height = height;

    const color = (this.options.color != null) ? this.options.color : this.font.color;
    this.texture = new THREE.CanvasTexture(canvas);
    if (this.font.filtering === "pixelated") {
      this.texture.magFilter = SupEngine.THREE.NearestFilter;
      this.texture.minFilter = SupEngine.THREE.NearestFilter;
    }
    else{
      this.texture.minFilter = SupEngine.THREE.LinearFilter;
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.01)`; // remove the black fringe
      ctx.fillRect(0, 0, width, height);
    }
    ctx.fillStyle = `#${color}`;
    ctx.font = `${fontSize}px ${this.font.name}`;
    ctx.textBaseline = "middle";

    ctx.textAlign = this.options.alignment as CanvasTextAlign;
    let x = width / 2;
    switch (this.options.alignment) {
      case "left" : x = 5; break;
      case "right": x = width - 5; break;
    }

    for (let index = 0; index < texts.length; index++) {
      ctx.fillText(texts[index], x, heightBorder + (0.5 + (index - (texts.length - 1) / 2) / texts.length) * heightWithoutBorder);
    }

    const geometry = new THREE.PlaneBufferGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      alphaTest: 0.02,
      side: THREE.DoubleSide
    });

    this.threeMeshes[0] = new THREE.Mesh(geometry, material);
    this.setOpacity(this.opacity);
    switch (this.options.alignment) {
      case "left":  this.threeMeshes[0].position.setX( (width - 10) / 2 / this.font.pixelsPerUnit); break;
      case "right": this.threeMeshes[0].position.setX(-(width - 10) / 2 / this.font.pixelsPerUnit); break;
    }
    switch (this.options.verticalAlignment) {
      case "top":    this.threeMeshes[0].position.setY(-height / 2 / this.font.pixelsPerUnit); break;
      case "bottom": this.threeMeshes[0].position.setY( height / 2 / this.font.pixelsPerUnit); break;
    }
  }

  _createBitmapMesh() {
    const texts = this.text.split("\n");
    for (let index = 0; index < texts.length; index++) {
      const text = texts[index];

      const geometry = new TextRendererGeometry(this.font.gridWidth * text.length, this.font.gridHeight, text.length, 1);
      const material = new THREE.MeshBasicMaterial({
        map: this.font.texture,
        alphaTest: 0.1,
        side: THREE.DoubleSide
      });
      const color = (this.options.color != null) ? this.options.color : this.font.color;
      material.color.setHex(parseInt(color, 16));
      this.threeMeshes[index] = new THREE.Mesh(geometry, material);
      switch (this.options.alignment) {
        case "center":  this.threeMeshes[index].position.setX(-geometry.width / 2 / this.font.pixelsPerUnit); break;
        case "right":   this.threeMeshes[index].position.setX(-geometry.width / this.font.pixelsPerUnit); break;
      }

      let y: number;
      switch (this.options.verticalAlignment) {
        case "center": y = (0.5 + (index - (texts.length - 1) / 2 )) * this.font.gridHeight / this.font.pixelsPerUnit; break;
        case "top":    y = (1 + index) * this.font.gridHeight / this.font.pixelsPerUnit; break;
        case "bottom": y = (index - texts.length + 1) * this.font.gridHeight / this.font.pixelsPerUnit; break;
      }
      this.threeMeshes[index].position.setY(-y);

      const uvs = <THREE.BufferAttribute>geometry.getAttribute("uv");
      uvs.needsUpdate = true;

      const charsByRow = this.font.texture.image.width / this.font.gridWidth;
      for (let x = 0; x < text.length; x++) {
        let index: number;
        if (this.font.charset == null) index = text.charCodeAt(x) - this.font.charsetOffset;
        else index = this.font.charset.indexOf(text[x]);

        const tileX = index % charsByRow;
        const tileY = Math.floor(index / charsByRow);

        const left   = (tileX * this.font.gridWidth + 0.2) / this.font.texture.image.width;
        const right  = ((tileX + 1) * this.font.gridWidth - 0.2) / this.font.texture.image.width;
        const bottom = 1 - ((tileY + 1) * this.font.gridHeight - 0.2) / this.font.texture.image.height;
        const top    = 1 - (tileY * this.font.gridHeight + 0.2) / this.font.texture.image.height;

        const uvsArray = uvs.array as number[];
        uvsArray[x * 8 + 0] = left;
        uvsArray[x * 8 + 1] = bottom;

        uvsArray[x * 8 + 2] = right;
        uvsArray[x * 8 + 3] = bottom;

        uvsArray[x * 8 + 4] = right;
        uvsArray[x * 8 + 5] = top;

        uvsArray[x * 8 + 6] = left;
        uvsArray[x * 8 + 7] = top;
      }
    }
    this.setOpacity(this.opacity);
  }

  clearMesh() {
    for (const threeMesh of this.threeMeshes) {
      this.actor.threeObject.remove(threeMesh);
      threeMesh.geometry.dispose();
      (threeMesh.material as THREE.Material).dispose();
    }
    this.threeMeshes.length = 0;

    if (this.texture != null) {
      this.texture.dispose();
      this.texture = null;
    }
  }

  _destroy() {
    this.clearMesh();
    super._destroy();
  }

  setIsLayerActive(active: boolean) { for (const threeMesh of this.threeMeshes) threeMesh.visible = active; }
}
