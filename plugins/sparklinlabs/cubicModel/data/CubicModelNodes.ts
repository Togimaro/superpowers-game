import CubicModelAsset from "./CubicModelAsset";

export interface Node extends SupCore.data.base.TreeNode {
  children: Node[];

  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
  
  shape: {
    type: string;
  }
}

export default class SceneNodes extends SupCore.data.base.TreeById {

  static schema = {
    name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
    children: { type: "array" },

    position: {
      mutable: true,
      type: "hash",
      properties: {
        x: { type: "number", mutable: true },
        y: { type: "number", mutable: true },
        z: { type: "number", mutable: true },
      }
    },

    orientation: {
      mutable: true,
      type: "hash",
      properties: {
        x: { type: "number", mutable: true },
        y: { type: "number", mutable: true },
        z: { type: "number", mutable: true },
        w: { type: "number", mutable: true },
      }
    },

    scale: {
      mutable: true,
      type: "hash",
      properties: {
        x: { type: "number", mutable: true },
        y: { type: "number", mutable: true },
        z: { type: "number", mutable: true },
      }
    },

    shape: {
      type: "hash",
      properties: {
        type: { type: "string" }
      }
    }
  }

  pub: Node[];
  byId: { [id: string]: Node };
  parentNodesById: { [id: string]: Node };

  cubicModelAsset: CubicModelAsset;

  constructor(pub: any, cubicModelAsset: CubicModelAsset) {
    super(pub, SceneNodes.schema);
    this.cubicModelAsset = cubicModelAsset;
  }
}
