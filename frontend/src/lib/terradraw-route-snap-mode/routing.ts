// Adapted from https://github.com/JamesLMilner/terra-draw-route-snap-mode
/*
 * Copyright 2022 James Milner
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { KDBush } from "./kdbush/kdbush";
import { around } from "./kdbush/geokdbush";
import type {
  FeatureCollection,
  LineString,
  Position,
  Feature,
  Point,
} from "geojson";
import { type RoutingInterface } from "./terra-draw-route-snap-mode";

type RouteFinder = {
  getRoute: (
    positionA: Feature<Point>,
    positionB: Feature<Point>
  ) => Feature<LineString> | null;
};
/**
 * Routing class for finding routes on a network of LineStrings.
 * The LineString network must have coordinates that are shared between
 * the LineStrings in order to find a route.
 */
export class Routing implements RoutingInterface {
  constructor(options: {
    network: FeatureCollection<LineString>;
    useCache?: boolean;
    routeFinder: RouteFinder;
  }) {
    this.useCache = options.useCache || true;
    this.network = options.network;

    this.routeFinder = options.routeFinder;

    this.network.features.forEach((feature) => {
      feature.geometry.coordinates.forEach((coordinate) => {
        this.points.push(coordinate);
      });
    });

    this.indexedNetworkPoints = new KDBush(this.points.length);

    this.points.forEach((coordinate) => {
      this.indexedNetworkPoints.add(coordinate[0], coordinate[1]);
    });

    this.indexedNetworkPoints.finish();
  }
  private useCache: boolean = true;
  private indexedNetworkPoints: KDBush;
  private points: Position[] = [];
  private routeFinder: RouteFinder;
  private network: FeatureCollection<LineString>;
  private routeCache: Record<string, Feature<LineString> | null> = {};

  /**
   * Return the closest network coordinate to the input coordinate
   * @param inputCoordinate The coordinate to find the closest network coordinate to
   * @returns a coordinate on the network or null if no coordinate is found
   */
  public getClosestNetworkCoordinate(inputCoordinate: Position) {
    const aroundInput: number[] = around(
      this.indexedNetworkPoints,
      inputCoordinate[0],
      inputCoordinate[1],
      1
    );

    const nearest = this.points[aroundInput[0]];
    return nearest ? nearest : null;
  }

  /**
   * Get the route between two coordinates returned as a GeoJSON LineString
   * @param startCoord start coordinate
   * @param endCoord end coordinate
   * @returns The route as a GeoJSON LineString
   */
  public getRoute(
    startCoord: Position,
    endCoord: Position
  ): Feature<LineString> | null {
    // Check if caching is enabled, and if the coordinates are already in the cache
    if (this.useCache) {
      const routeKey = `${startCoord}-${endCoord}`;

      if (this.routeCache[routeKey]) {
        return this.routeCache[routeKey];
      }
    }

    const start = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: startCoord,
      },
      properties: {},
    } as Feature<Point>;

    const end = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: endCoord,
      },
      properties: {},
    } as Feature<Point>;

    const route = this.routeFinder.getRoute(start, end);

    // If caching is enabled, store the route in the cache
    if (this.useCache) {
      const routeKey = `${startCoord}-${endCoord}`;
      this.routeCache[routeKey] = route;
      return route;
    }

    return route;
  }
}
