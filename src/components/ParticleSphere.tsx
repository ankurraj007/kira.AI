import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================
// Types
// ============================================

export type SphereState = 'idle' | 'listening' | 'processing' | 'speaking';

interface ParticleSphereProps {
    state: SphereState;
    amplitude?: number;
    bassLevel?: number;
    midLevel?: number;
    highLevel?: number;
    config?: Partial<SphereConfig>;
}

interface SphereConfig {
    dotCount: number;
    baseRadius: number;
    glowIntensity: number;
    audioSensitivity: number;
    dotSize: number;
}

interface ParticleSystemProps {
    state: SphereState;
    amplitude: number;
    bassLevel: number;
    midLevel: number;
    highLevel: number;
    config: SphereConfig;
}

// ============================================
// Default Config
// ============================================

const DEFAULT_CONFIG: SphereConfig = {
    dotCount: 800,
    baseRadius: 2,
    glowIntensity: 1.0,
    audioSensitivity: 1.0,
    dotSize: 0.03,
};

// ============================================
// Fibonacci Sphere Distribution
// ============================================

function generateFibonacciSphere(count: number, radius: number): Float32Array {
    const positions = new Float32Array(count * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i;

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        positions[i * 3] = x * radius;
        positions[i * 3 + 1] = y * radius;
        positions[i * 3 + 2] = z * radius;
    }

    return positions;
}

// ============================================
// Particle System Component
// ============================================

function ParticleSystem({ state, amplitude, bassLevel, midLevel, highLevel, config }: ParticleSystemProps) {
    const pointsRef = useRef<THREE.Points>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const timeRef = useRef(0);

    // Smoothed values for lerping
    const smoothedRotationSpeed = useRef(0.001);

    // Store original positions
    const originalPositions = useMemo(
        () => generateFibonacciSphere(config.dotCount, config.baseRadius),
        [config.dotCount, config.baseRadius]
    );

    // Create geometry with positions
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(originalPositions.slice(), 3));

        // Add random offset attribute for variation
        const offsets = new Float32Array(config.dotCount);
        for (let i = 0; i < config.dotCount; i++) {
            offsets[i] = Math.random();
        }
        geo.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));

        return geo;
    }, [originalPositions, config.dotCount]);

    // Custom shader material for glow effect
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uAmplitude: { value: 0 },
                uBass: { value: 0 },
                uMid: { value: 0 },
                uHigh: { value: 0 },
                uGlowIntensity: { value: config.glowIntensity },
                uColor: { value: new THREE.Color(0x00D4FF) },
                uSize: { value: config.dotSize },
                uState: { value: 0 }, // 0: idle, 1: listening, 2: processing, 3: speaking
            },
            vertexShader: `
        attribute float offset;
        uniform float uTime;
        uniform float uAmplitude;
        uniform float uBass;
        uniform float uMid;
        uniform float uHigh;
        uniform float uSize;
        uniform float uState;
        
        varying float vIntensity;
        varying float vOffset;
        
        void main() {
          vOffset = offset;
          vec3 pos = position;
          
          // Calculate distance from center for effects
          float dist = length(position);
          float normalizedY = position.y / dist;
          
          // Base breathing animation
          float breathe = sin(uTime * 0.5) * 0.02 + 1.0;
          
          // Voice-reactive displacement
          float displacement = 0.0;
          
          if (uState == 1.0) { // Listening
            // Expand based on amplitude
            displacement += uAmplitude * 0.5;
            
            // Add ripples based on frequency bands
            displacement += uBass * sin(dist * 4.0 + uTime * 2.0) * 0.15;
            displacement += uMid * sin(normalizedY * 6.0 + uTime * 3.0) * 0.1;
            displacement += uHigh * cos(offset * 10.0 + uTime * 4.0) * 0.08;
          } else if (uState == 2.0) { // Processing
            // Pulsing effect
            displacement = sin(uTime * 3.0 + offset * 6.28) * 0.1;
          } else if (uState == 3.0) { // Speaking
            // Gentle waves
            displacement = sin(uTime * 1.5 + dist * 2.0) * 0.05;
          }
          
          // Apply displacement outward
          vec3 normal = normalize(position);
          pos += normal * displacement * dist;
          pos *= breathe;
          
          // Calculate intensity for fragment shader
          vIntensity = 0.5 + displacement * 2.0;
          vIntensity = clamp(vIntensity, 0.3, 1.0);
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size attenuation
          float sizeMultiplier = 1.0 + uAmplitude * 0.5;
          gl_PointSize = uSize * sizeMultiplier * (300.0 / -mvPosition.z);
        }
      `,
            fragmentShader: `
        uniform vec3 uColor;
        uniform float uGlowIntensity;
        uniform float uState;
        
        varying float vIntensity;
        varying float vOffset;
        
        void main() {
          // Create circular point with soft edge
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          // Soft glow falloff
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= alpha; // Quadratic falloff for softer glow
          
          // Apply intensity
          vec3 color = uColor * vIntensity * uGlowIntensity;
          
          // Add subtle color variation
          color += vec3(vOffset * 0.1, 0.0, vOffset * 0.05);
          
          gl_FragColor = vec4(color, alpha * 0.9);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
    }, [config.glowIntensity, config.dotSize]);

    // Animation frame update
    useFrame((_, delta) => {
        if (!pointsRef.current || !materialRef.current) return;

        timeRef.current += delta;

        // Update uniforms
        const mat = materialRef.current;
        mat.uniforms.uTime.value = timeRef.current;

        // Smooth amplitude changes
        const targetAmplitude = amplitude * config.audioSensitivity;
        mat.uniforms.uAmplitude.value = THREE.MathUtils.lerp(
            mat.uniforms.uAmplitude.value,
            targetAmplitude,
            0.15
        );

        mat.uniforms.uBass.value = THREE.MathUtils.lerp(mat.uniforms.uBass.value, bassLevel, 0.1);
        mat.uniforms.uMid.value = THREE.MathUtils.lerp(mat.uniforms.uMid.value, midLevel, 0.1);
        mat.uniforms.uHigh.value = THREE.MathUtils.lerp(mat.uniforms.uHigh.value, highLevel, 0.1);

        // Update state
        const stateMap: Record<SphereState, number> = {
            idle: 0,
            listening: 1,
            processing: 2,
            speaking: 3,
        };
        mat.uniforms.uState.value = THREE.MathUtils.lerp(
            mat.uniforms.uState.value,
            stateMap[state],
            0.1
        );

        // Rotation based on state
        const targetRotationSpeed = state === 'listening'
            ? 0.003 + amplitude * 0.01
            : state === 'processing'
                ? 0.005
                : 0.001;

        smoothedRotationSpeed.current = THREE.MathUtils.lerp(
            smoothedRotationSpeed.current,
            targetRotationSpeed,
            0.05
        );

        pointsRef.current.rotation.y += smoothedRotationSpeed.current;
        pointsRef.current.rotation.x = Math.sin(timeRef.current * 0.2) * 0.1;
    });

    return (
        <points ref={pointsRef} geometry={geometry}>
            <primitive ref={materialRef} object={material} attach="material" />
        </points>
    );
}

// ============================================
// Main Component
// ============================================

export function ParticleSphere({
    state = 'idle',
    amplitude = 0,
    bassLevel = 0,
    midLevel = 0,
    highLevel = 0,
    config: configOverrides = {},
}: ParticleSphereProps) {
    const config: SphereConfig = { ...DEFAULT_CONFIG, ...configOverrides };

    return (
        <div className="sphere-container" style={{ width: '100%', height: '100%' }}>
            <Canvas
                camera={{ position: [0, 0, 6], fov: 45 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance',
                }}
                style={{ background: 'transparent' }}
            >
                {/* Ambient light for base visibility */}
                <ambientLight intensity={0.2} />

                {/* Point light for rim effect */}
                <pointLight position={[5, 5, 5]} intensity={0.5} color="#00D4FF" />
                <pointLight position={[-5, -5, -5]} intensity={0.3} color="#00E5FF" />

                {/* Main particle system */}
                <ParticleSystem
                    state={state}
                    amplitude={amplitude}
                    bassLevel={bassLevel}
                    midLevel={midLevel}
                    highLevel={highLevel}
                    config={config}
                />
            </Canvas>
        </div>
    );
}
