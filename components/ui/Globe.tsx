"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Color, PerspectiveCamera, MeshStandardMaterial } from "three";
import ThreeGlobe from "three-globe";
import { useThree, Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "@/data/globe.json";

// Fix: Use ReactThreeFiber.Node instead of Object3DNode// Manually extend ReactThreeFiber
declare module "@react-three/fiber" {
  interface ThreeElements {
    threeGlobe: any; // Fallback if types are missing
  }
}

// Register ThreeGlobe in R3F
extend({ ThreeGlobe });
type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  arcTime?: number;
  arcLength?: number;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

export function Globe({ globeConfig, data }: WorldProps) {
  const [globeData, setGlobeData] = useState<
    | {
        size: number;
        order: number;
        color: (t: number) => string;
        lat: number;
        lng: number;
      }[]
    | null
  >(null);

  const globeRef = useRef<ThreeGlobe | null>(null);

  const defaultProps = useMemo(
    () => ({
      pointSize: 1,
      atmosphereColor: "#ffffff",
      showAtmosphere: true,
      atmosphereAltitude: 0.1,
      polygonColor: "rgba(255,255,255,0.7)",
      globeColor: "#1d072e",
      emissive: "#000000",
      emissiveIntensity: 0.1,
      shininess: 0.9,
      arcTime: 2000,
      arcLength: 0.9,
      ...globeConfig,
    }),
    [globeConfig]
  );

  const _buildMaterial = useCallback(() => {
    if (!globeRef.current) return;
    
    // Fix: Cast the material to MeshStandardMaterial (since shininess doesn't exist on MeshStandardMaterial)
    const globeMaterial = globeRef.current.globeMaterial() as MeshStandardMaterial;
    
    globeMaterial.color = new Color(defaultProps.globeColor);
    globeMaterial.emissive = new Color(defaultProps.emissive);
    globeMaterial.emissiveIntensity = defaultProps.emissiveIntensity;
  }, [defaultProps]);

  const _buildData = useCallback(() => {
    const points = data
      .map((arc) => {
        const rgb = hexToRgb(arc.color);
        return rgb
          ? [
              {
                size: defaultProps.pointSize,
                order: arc.order,
                color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
                lat: arc.startLat,
                lng: arc.startLng,
              },
              {
                size: defaultProps.pointSize,
                order: arc.order,
                color: (t: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - t})`,
                lat: arc.endLat,
                lng: arc.endLng,
              },
            ]
          : [];
      })
      .flat();

    setGlobeData(points);
  }, [data, defaultProps.pointSize]);

  useEffect(() => {
    if (globeRef.current) {
      _buildData();
      _buildMaterial();
    }
  }, [_buildData, _buildMaterial]);

  useEffect(() => {
    if (globeRef.current && globeData) {
      globeRef.current
        .hexPolygonsData(countries.features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.7)
        .showAtmosphere(defaultProps.showAtmosphere)
        .atmosphereColor(defaultProps.atmosphereColor)
        .atmosphereAltitude(defaultProps.atmosphereAltitude)
        .hexPolygonColor(() => defaultProps.polygonColor);
    }
  }, [globeData, defaultProps]);

  return <threeGlobe ref={globeRef} />;
}

// Fix: Add missing hexToRgb function
function hexToRgb(hex: string) {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return match
    ? {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
      }
    : null;
}

export function WebGLRendererConfig() {
  const { gl, size } = useThree();

  useEffect(() => {
    gl.setPixelRatio(window.devicePixelRatio);
    gl.setSize(size.width, size.height);
    gl.setClearColor(0xffaaff, 0);
  }, [gl, size]);

  return null;
}

export function World(props: WorldProps) {
  return (
    <Canvas camera={new PerspectiveCamera(50, 1.2, 180, 1800)}>
      <WebGLRendererConfig />
      <Globe {...props} />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={1} />
    </Canvas>
  );
}
