"use client";

import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

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

interface DotMatrixProps {
  colors?: [number, number, number][]; // Ensure colors are 3-element tuples
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
}

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
      colorsArray = new Array(6).fill(colors[0] as [number, number, number]);
    } else if (colors.length === 2) {
      colorsArray = [
        colors[0] ?? [0, 0, 0], // Ensure each color is a 3-element array
        colors[0] ?? [0, 0, 0],
        colors[0] ?? [0, 0, 0],
        colors[1] ?? [0, 0, 0],
        colors[1] ?? [0, 0, 0],
        colors[1] ?? [0, 0, 0],
      ];
    } else if (colors.length === 3) {
      colorsArray = [
        colors[0] ?? [0, 0, 0],
        colors[0] ?? [0, 0, 0],
        colors[1] ?? [0, 0, 0],
        colors[1] ?? [0, 0, 0],
        colors[2] ?? [0, 0, 0],
        colors[2] ?? [0, 0, 0],
      ];
    }

    return {
      u_colors: {
        value: colorsArray.map((color) =>
          color.map((c: number) => c / 255)
        ),
      },
      u_opacities: {
        value: opacities,
      },
      u_total_size: {
        value: totalSize,
      },
      u_dot_size: {
        value: dotSize,
      },
    };
  }, [colors, opacities, totalSize, dotSize]);

  return <Shader source={shader} uniforms={uniforms} maxFps={60} />;
};

type Uniforms = {
  [key: string]: {
    value: number | number[] | number[][];
  };
};

interface ShaderProps {
  source: string;
  uniforms: Uniforms;
  maxFps?: number;
}

const ShaderMaterial = ({
  source,
  uniforms,
  maxFps = 60,
}: {
  source: string;
  maxFps?: number;
  uniforms: Uniforms;
}) => {
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
    const preparedUniforms: { [key: string]: THREE.IUniform<any> } = {};

    for (const [uniformName, uniform] of Object.entries(uniforms)) {
      switch (typeof uniform.value) {
        case "number":
          preparedUniforms[uniformName] = { value: uniform.value };
          break;
        case "object":
          if (Array.isArray(uniform.value[0])) {
            preparedUniforms[uniformName] = {
              value: (uniform.value as number[][]).map((v) =>
                new THREE.Vector3().fromArray(v)
              ),
            };
          } else {
            preparedUniforms[uniformName] = {
              value: new THREE.Vector3().fromArray(uniform.value as number[]),
            };
          }
          break;
        default:
          console.error(`Invalid uniform type for '${uniformName}'.`);
      }
    }

    preparedUniforms["u_time"] = { value: 0 };
    preparedUniforms["u_resolution"] = {
      value: new THREE.Vector2(size.width * 2, size.height * 2),
    };

    return preparedUniforms;
  }, [uniforms, size.width, size.height]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
      precision mediump float;
      in vec2 coordinates;
      uniform vec2 u_resolution;
      out vec2 fragCoord;
      void main(){
        float x = position.x;
        float y = position.y;
        gl_Position = vec4(x, y, 0.0, 1.0);
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
        fragCoord.y = u_resolution.y - fragCoord.y;
      }
      `,
      fragmentShader: source,
      uniforms: getUniforms,
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });
  }, [getUniforms, source]);

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  );
};
