export interface Rect {
  width: number;
  height: number;
  x: number;
  y: number;
  rotate?: number;
}


export interface Comp extends Rect {
  id: number;
}