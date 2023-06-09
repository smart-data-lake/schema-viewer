import { D3ZoomEvent, ZoomBehavior } from "d3";
import * as d3 from 'd3';

const minScale = 0.3;
const maxScale = 3;

export default class D3Zoom {
  private readonly zoomBehaviour: ZoomBehavior<SVGSVGElement, any>;
  private readonly zoomTarget: SVGSVGElement;
  private readonly zoomPane: SVGSVGElement;

  /**
   * @param zoomPane the element on which the zoom will be recorded
   * @param zoomTarget the element which will be transformed according to the zoom
   */
  constructor(zoomPane: SVGSVGElement, zoomTarget: SVGSVGElement) {
    this.zoomTarget = zoomTarget;
    this.zoomPane = zoomPane;
    this.zoomBehaviour = d3.zoom<SVGSVGElement, any>()
      .scaleExtent([minScale, maxScale])
      .on('zoom', (e: D3ZoomEvent<SVGSVGElement, any>) => {
        d3.select(this.zoomTarget).attr('transform', e.transform.toString());
      })
    d3.select(zoomPane).call(this.zoomBehaviour)
      .on('dblclick.zoom', null); // disable double click zoom because it leads to a lot of accidental zooms
  }

  zoomIn(): void {
    const {x, y} = this.getPosition();
    const newScale = Math.min(this.getScale() + 0.2, maxScale);
    this.transform(x, y, newScale, 200);
  }

  zoomOut(): void {
    const {x, y} = this.getPosition();
    const newScale = Math.max(this.getScale() - 0.2, minScale);
    this.transform(x, y, newScale, 200);
  }

  resetScale(): void {
    this.zoomBehaviour.scaleTo(d3.select(this.zoomPane), 1);
  }

  private transform(x: number, y: number, scale: number, duration: number): void {
    d3.select(this.zoomPane)
      .transition().duration(duration)
      .call(this.zoomBehaviour.transform, d3.zoomIdentity.translate(x, y).scale(scale));
  }

  center(x: number, y: number, duration: number): void {
    const scale = this.getScale();
    const xCenter = -x * scale + this.getViewerWidth() / 2;
    const yCenter = -y * scale + this.getViewerHeight() / 2;
    this.transform(xCenter, yCenter, this.getScale(), duration);
  }

  private getScale(): number {
    return d3.zoomTransform(this.zoomPane).k
  }

  private getPosition(): { x: number, y: number } {
    const transform = d3.zoomTransform(this.zoomPane);
    return {x: transform.x, y: transform.y};
  }

  getViewerHeight(): number {
    return this.zoomPane.clientHeight;
  }

  getViewerWidth(): number {
    return this.zoomPane.clientWidth;
  }
}