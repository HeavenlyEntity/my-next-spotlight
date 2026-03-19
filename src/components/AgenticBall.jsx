/* eslint-disable */
'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
    return twMerge(clsx(inputs))
}

const vertSrc = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragSrc = `
precision highp float;

uniform float uTime;
uniform vec2  uRes;
uniform float uSpeed;
uniform float uComplexity;
uniform float uSwirl;
uniform float uZoom;
uniform vec3  uTint;
uniform float uHueRotation;
uniform float uSaturation;
uniform float uBrightness;
uniform vec3  uBg;
uniform float uAlpha;

varying vec2 vUv;

vec2 spin(vec2 v, float a) {
  return cos(a) * v + sin(a) * vec2(-v.y, v.x);
}

float sfrac(float x, float k) {
  float f = fract(x);
  return f * smoothstep(1.0, k, f);
}

vec3 hueRotate(vec3 col, float angle) {
  return mix(vec3(dot(vec3(0.333), col)), col, cos(angle))
       + cross(vec3(0.577), col) * sin(angle);
}

vec3 computeOrb(vec3 p, float t) {
  vec3 v = vec3(0);
  float x = 0.0;
  float y = 0.0;
  float it = uComplexity;
  float halo = smoothstep(0.5, 0.0, p.z);
  vec3 c = vec3(0);

  for (float i = 1.0; i < 9.0; i += 1.0) {
    if (i > it) break;

    p.xy = spin(p.xy, p.z * uSwirl + t / i * 0.4);
    v = v * 0.5 + 0.5;
    v.xz = spin(v.xz, v.y - x + t / i + p.y);
    p.xy = spin(p.xy, length(v.xy) - x);

    x += sfrac(v.z, 0.9 - sin(y * 1.5) * 0.2 + p.z * 0.1) / it / (1.0 + x + x * x);
    y += sfrac(-v.z, 0.9 + sin(x) * 0.1) / it;

    c += exp(vec3(0.7, 1.9, 4.0) * log(max(x, 1e-8)));
  }

  float xy = (x - y) * (x - y);
  c += xy * sqrt(max(c, 0.0));
  c = clamp(c, 0.0, 1.0);

  c = hueRotate(c, uHueRotation);

  c = mix(vec3(dot(c, vec3(0.2, 0.7, 0.1))), c, uSaturation * (1.0 + y));
  c = max(c, 0.0);

  float bgLum = dot(uBg, vec3(0.2, 0.7, 0.1));
  float rimLift = bgLum * 0.5;
  c = mix(c, sqrt(max(c, 0.0)) * 0.7 + rimLift * 0.6, halo);
  c = mix(c, sqrt(max(c, 0.0)) * 0.5 + rimLift, sqrt(halo));

  c *= uTint;

  return c;
}

void main() {
  vec4 bg = vec4(uBg, 0.0);
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y) * uZoom;
  float t = uTime * uSpeed;

  float l2 = dot(uv, uv);
  float l = sqrt(l2);

  if (l > 1.0) {
    gl_FragColor = bg;
    return;
  }

  vec3 sn = vec3(uv, sqrt(1.0 - l2));
  vec3 n = computeOrb(sn, t) * uBrightness;

  float f = length(vec2(dFdx(l), dFdy(l)));
  float edge = smoothstep(1.0 - f, 1.0 - f * 3.0, l);

  gl_FragColor = mix(bg, vec4(sqrt(max(n, 0.0)), uAlpha), edge);
}
`

const Scene = ({
    speed,
    complexity,
    swirl,
    zoom,
    tintRgb,
    hueRotation,
    saturation,
    brightness,
    bgRgb,
    opacity,
}) => {
    const meshRef = useRef(null)
    const { size, viewport } = useThree()

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uRes: { value: new THREE.Vector2() },
            uSpeed: { value: speed },
            uComplexity: { value: complexity },
            uSwirl: { value: swirl },
            uZoom: { value: zoom },
            uTint: { value: new THREE.Vector3(...tintRgb) },
            uHueRotation: { value: hueRotation },
            uSaturation: { value: saturation },
            uBrightness: { value: brightness },
            uBg: { value: new THREE.Vector3(...bgRgb) },
            uAlpha: { value: opacity },
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    useFrame((state) => {
        const mat = meshRef.current?.material
        if (!mat) return
        mat.uniforms.uTime.value = state.clock.elapsedTime
        mat.uniforms.uRes.value.set(
            size.width * viewport.dpr,
            size.height * viewport.dpr
        )
        mat.uniforms.uSpeed.value = speed
        mat.uniforms.uComplexity.value = complexity
        mat.uniforms.uSwirl.value = swirl
        mat.uniforms.uZoom.value = zoom
        mat.uniforms.uTint.value.set(...tintRgb)
        mat.uniforms.uHueRotation.value = hueRotation
        mat.uniforms.uSaturation.value = saturation
        mat.uniforms.uBrightness.value = brightness
        mat.uniforms.uBg.value.set(...bgRgb)
        mat.uniforms.uAlpha.value = opacity
    })

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                vertexShader={vertSrc}
                fragmentShader={fragSrc}
                uniforms={uniforms}
                transparent
            />
        </mesh>
    )
}

const hexToRgb = (hex) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return m
        ? [
            parseInt(m[1], 16) / 255,
            parseInt(m[2], 16) / 255,
            parseInt(m[3], 16) / 255,
        ]
        : [0, 0, 0]
}

const AgenticBall = ({
    width = '100%',
    height = '100%',
    className,
    children,
    speed = 0.5,
    complexity = 3,
    swirl = 2.0,
    zoom = 1.75,
    color = '#FFFFFF',
    hueRotation = 4.3,
    saturation = 0,
    brightness = 2.0,
    backgroundColor = '#000000',
    opacity = 1,
}) => {
    const tintRgb = useMemo(() => hexToRgb(color), [color])
    const bgRgb = useMemo(() => hexToRgb(backgroundColor), [backgroundColor])

    return (
        <div
            className={cn('relative overflow-hidden', className)}
            style={{
                width,
                height,
            }}
        >
            <Canvas
                orthographic
                camera={{
                    position: [0, 0, 1],
                    zoom: 1,
                    left: -1,
                    right: 1,
                    top: 1,
                    bottom: -1,
                }}
                gl={{ antialias: true, alpha: true }}
                style={{ width, height }}
                className="!absolute top-0 left-0"
            >
                <Scene
                    speed={speed}
                    complexity={complexity}
                    swirl={swirl}
                    zoom={zoom}
                    tintRgb={tintRgb}
                    hueRotation={hueRotation}
                    saturation={saturation}
                    brightness={brightness}
                    bgRgb={bgRgb}
                    opacity={opacity}
                />
            </Canvas>
            {children && (
                <div className="z-1 pointer-events-none relative">{children}</div>
            )}
        </div>
    )
}

AgenticBall.displayName = 'AgenticBall'

export default AgenticBall
