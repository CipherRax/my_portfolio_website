"use client";

import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

// Main CanvasRevealEffect component
export const CanvasRevealEffect = ({
  animationSpeed = 0.4,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: [number, number, number][]; // Ensure colors is an array of 3-element tuples
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
}) => {
  return (
    <div className={cn("h-full relative bg-white w-full", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
          shader={`
              float animation_speed_factor = ${animationSpeed.toFixed(1)};
              float intro_offset = distance(u_resolution / 2.0 / u_total_size, st2) * 0.01 + (random(st2) * 0.15);
              opacity *= step(intro_offset, u_time * animation_speed_factor);
              opacity *= clamp((1.0 - step(intro_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            `}
        />
      </div>
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-[84%]" />
      )}
    </div>
  );
};

// DotMatrixProps interface with refined types
interface DotMatrixProps {
  colors?: [number, number, number][]; // Ensure colors are 3-element tuples
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
}

// DotMatrix component
const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 4,
  dotSize = 2,
  shader = "",
}) => {
  const uniforms = useMemo(() => {
    let colorsArray: [number, number, number][] = new Array(6).fill([0, 0, 0]);

    if (colors.length === 1) {
      colorsArray = new Array(6).fill(colors[0]);
    } else if (colors.length === 2) {
      colorsArray = [
        colors[0], colors[0], colors[0],
        colors[1], colors[1], colors[1]
      ];
    } else if (colors.length === 3) {
      colorsArray = [
        colors[0], colors[0],
        colors[1], colors[1],
        colors[2], colors[2]
      ];
    }

    return {
      u_colors: {
        value: colorsArray.map((color) => new THREE.Vector3().fromArray(color)),
      },
      u_opacities: { value: new Float32Array(opacities) },
      u_total_size: { value: totalSize },
      u_dot_size: { value: dotSize },
    };
  }, [colors, opacities, totalSize, dotSize]);

  return <Shader source={shader} uniforms={uniforms} maxFps={60} />;
};

// Refined Uniforms type for more specificity
type Uniforms = {
  [key: string]: {
    value: number | number[] | Float32Array | THREE.Vector2 | THREE.Vector3 | THREE.Vector3[];
  };
};

// ShaderProps interface
interface ShaderProps {
  source: string;
  uniforms: Uniforms;
  maxFps?: number;
}

// ShaderMaterial component
const ShaderMaterial = ({ source, uniforms, maxFps = 60 }: ShaderProps) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  let lastFrameTime = 0;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const timestamp = clock.getElapsedTime();
    if (timestamp - lastFrameTime < 1 / maxFps) return;
    lastFrameTime = timestamp;

    const material = ref.current.material as THREE.ShaderMaterial;
    material.uniforms.u_time.value = timestamp;
  });

  const getUniforms = useMemo(() => {
    const preparedUniforms: Uniforms = {};

    for (const [uniformName, uniform] of Object.entries(uniforms)) {
      preparedUniforms[uniformName] = { value: uniform.value };
    }

    preparedUniforms["u_time"] = { value: 0 };
    preparedUniforms["u_resolution"] = {
      value: new THREE.Vector2(size.width * 2, size.height * 2),
    };

    return preparedUniforms;
  }, [uniforms, size.width, size.height]);

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={new THREE.ShaderMaterial({ vertexShader: "", fragmentShader: source, uniforms: getUniforms })} attach="material" />
    </mesh>
  );
};

// Shader component
const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  );
};