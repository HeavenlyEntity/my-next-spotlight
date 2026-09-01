'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cn } from '@/lib/utils'

/**
 * ContourField — animated topographic isolines.
 *
 * A domain-warped value-noise height field rendered as survey contours:
 * thin lines every band, heavier "index" lines every nth. The pointer
 * raises a local hill so the lines bunch and bend around the cursor
 * instead of lighting up a glow.
 */

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uRes;
uniform float uScale;
uniform float uBands;
uniform float uIndexEvery;
uniform float uWidth;
uniform float uWarp;
uniform vec3 uColor;
uniform vec3 uBg;
uniform float uAlpha;
uniform float uFill;
uniform vec2 uPointer;
uniform float uCursor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * vnoise(p);
    p = p * 2.03 + vec2(11.3, 7.7);
    amp *= 0.5;
  }
  return sum;
}

// Height field. Cheap sinusoidal domain warp keeps the terrain organic
// without paying for a second fbm per sample.
float height(vec2 p, float t) {
  p += uWarp * vec2(
    sin(p.y * 1.3 + t * 0.20),
    cos(p.x * 1.1 - t * 0.17)
  );
  float h = fbm(p * 0.9 + vec2(0.0, t * 0.035));

  vec2 d = p - uPointer;
  h += uCursor * 0.32 * exp(-dot(d, d) * 1.1);

  return h;
}

void main() {
  float ar = uRes.x / uRes.y;
  vec2 coord = (vUv * 2.0 - 1.0) * vec2(ar, 1.0);
  vec2 p = coord * uScale;

  // One-pixel step expressed in field space, so line weight stays
  // constant in screen space regardless of resolution or aspect.
  float texel = (2.0 / uRes.y) * uScale;

  float h = height(p, uTime);
  float hx = height(p + vec2(texel, 0.0), uTime);
  float hy = height(p + vec2(0.0, texel), uTime);

  float v = h * uBands;
  float gradPx = max(length(vec2(hx - h, hy - h)) * uBands, 1e-5);

  // Distance to the nearest contour, measured in pixels.
  float distPix = abs(fract(v) - 0.5) / gradPx;

  // Index contours: every nth line is heavier and brighter, the way a
  // survey map marks its major elevations.
  float indexLine = step(mod(floor(v), uIndexEvery), 0.5);
  float width = uWidth * mix(1.0, 1.9, indexLine);

  float line = 1.0 - smoothstep(width - 0.6, width + 0.6, distPix);

  // Steep terrain packs contours together; fade them out before they
  // collapse into moire.
  line *= smoothstep(3.0, 9.0, 1.0 / gradPx);

  float intensity = line * mix(0.42, 1.0, indexLine);

  // Faint elevation wash so the panel is not flat between lines.
  float wash = smoothstep(0.35, 0.72, h) * uFill;

  vec3 result = uBg;
  result = mix(result, uColor, wash * 0.16);
  result = mix(result, uColor, intensity);

  gl_FragColor = vec4(result, uAlpha);
}
`

function parseHexColor(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!match) return [0, 0, 0]
  return [
    parseInt(match[1], 16) / 255,
    parseInt(match[2], 16) / 255,
    parseInt(match[3], 16) / 255,
  ]
}

function ContourScene({
  scale,
  bands,
  indexEvery,
  lineWidth,
  warp,
  speed,
  fill,
  colorRgb,
  bgRgb,
  opacity,
  pointerRef,
  cursorInteraction,
  cursorIntensity,
  animate,
}) {
  const meshRef = useRef(null)
  const { size, invalidate } = useThree()
  const clock = useRef(0)
  const smoothPointer = useRef(new THREE.Vector2(0, 0))
  const cursorAmount = useRef(0)

  const shaderUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uScale: { value: scale },
      uBands: { value: bands },
      uIndexEvery: { value: indexEvery },
      uWidth: { value: lineWidth },
      uWarp: { value: warp },
      uColor: { value: new THREE.Vector3(...colorRgb) },
      uBg: { value: new THREE.Vector3(...bgRgb) },
      uAlpha: { value: opacity },
      uFill: { value: fill },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uCursor: { value: 0 },
    }),
    // Uniform object is created once; values are pushed every frame below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material

    // Own clock so `speed` can scale time without snapping on change.
    clock.current += delta * speed
    mat.uniforms.uTime.value = clock.current
    // CSS pixels, so line weights below are authored in CSS pixels too.
    mat.uniforms.uRes.value.set(size.width, size.height)
    mat.uniforms.uScale.value = scale
    mat.uniforms.uBands.value = bands
    mat.uniforms.uIndexEvery.value = Math.max(indexEvery, 1)
    mat.uniforms.uWidth.value = lineWidth
    mat.uniforms.uWarp.value = warp
    mat.uniforms.uColor.value.set(...colorRgb)
    mat.uniforms.uBg.value.set(...bgRgb)
    mat.uniforms.uAlpha.value = opacity
    mat.uniforms.uFill.value = fill

    const target = cursorInteraction ? cursorIntensity : 0
    const ease = 1 - Math.exp(-delta / 0.18)
    cursorAmount.current += (target - cursorAmount.current) * ease
    mat.uniforms.uCursor.value = cursorAmount.current

    const ar = size.width / Math.max(size.height, 1)
    const px = (pointerRef.current[0] * 2 - 1) * ar * scale
    const py = (pointerRef.current[1] * 2 - 1) * scale
    smoothPointer.current.x += (px - smoothPointer.current.x) * ease
    smoothPointer.current.y += (py - smoothPointer.current.y) * ease
    mat.uniforms.uPointer.value.copy(smoothPointer.current)
  })

  // Static mode still needs one paint after layout settles.
  useEffect(() => {
    if (!animate) invalidate()
  }, [animate, invalidate, size.width, size.height])

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={shaderUniforms}
        transparent
      />
    </mesh>
  )
}

const ContourField = ({
  width = '100%',
  height = '100%',
  className,
  scale = 1.8,
  bands = 7,
  indexEvery = 3,
  lineWidth = 0.8,
  warp = 0.42,
  speed = 1,
  fill = 1,
  color = '#3ce8ce',
  backgroundColor = '#0b0b0f',
  opacity = 1,
  cursorInteraction = false,
  cursorIntensity = 1,
  listenToWindow = false,
  animate = true,
}) => {
  const colorRgb = useMemo(() => parseHexColor(color), [color])
  const bgRgb = useMemo(() => parseHexColor(backgroundColor), [backgroundColor])

  const containerRef = useRef(null)
  const pointerRef = useRef([0.5, 0.5])

  const updatePointer = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    pointerRef.current = [
      (e.clientX - rect.left) / rect.width,
      1 - (e.clientY - rect.top) / rect.height,
    ]
  }, [])

  const handlePointerMove = useCallback(
    (e) => {
      if (!cursorInteraction || listenToWindow) return
      updatePointer(e)
    },
    [cursorInteraction, listenToWindow, updatePointer]
  )

  // Window-level tracking lets the terrain react even when hero copy sits
  // above the canvas and swallows pointer events.
  useEffect(() => {
    if (!cursorInteraction || !listenToWindow || !animate) return
    const onMove = (e) => updatePointer(e)
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [cursorInteraction, listenToWindow, animate, updatePointer])

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height, backgroundColor }}
      onPointerMove={handlePointerMove}
    >
      <Canvas
        className="absolute inset-0 h-full w-full"
        orthographic
        frameloop={animate ? 'always' : 'demand'}
        dpr={[1, 1.75]}
        camera={{
          position: [0, 0, 1],
          zoom: 1,
          left: -1,
          right: 1,
          top: 1,
          bottom: -1,
        }}
        gl={{ antialias: false, alpha: true }}
      >
        <ContourScene
          scale={scale}
          bands={bands}
          indexEvery={indexEvery}
          lineWidth={lineWidth}
          warp={warp}
          speed={speed}
          fill={fill}
          colorRgb={colorRgb}
          bgRgb={bgRgb}
          opacity={opacity}
          pointerRef={pointerRef}
          cursorInteraction={cursorInteraction}
          cursorIntensity={cursorIntensity}
          animate={animate}
        />
      </Canvas>
    </div>
  )
}

ContourField.displayName = 'ContourField'

export default ContourField
