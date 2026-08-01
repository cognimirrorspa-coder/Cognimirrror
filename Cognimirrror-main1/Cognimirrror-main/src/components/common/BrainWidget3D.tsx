import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createNoise3D } from 'simplex-noise';

export const BrainWidget3D = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const frameIdRef = useRef<number>(0);
    const brainSystemRef = useRef<THREE.Points | null>(null);
    const brainMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const noise3D = createNoise3D();
        const clock = new THREE.Clock();

        // Params
        const params = {
            particleCount: 15000,
            particleSize: 2.5,
            color: '#a78bfa',
            glowColor: '#ffffff',
            rotationSpeed: 0.002
        };

        // 1. Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // 2. Camera
        const aspect = container.clientWidth / container.clientHeight;
        const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
        camera.position.set(0, 0, 9);
        cameraRef.current = camera;

        // 3. Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 4. Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2.0;
        controls.enableZoom = false;
        controls.enablePan = false;
        controlsRef.current = controls;

        // 5. Create Brain Particles
        const createBrainParticles = () => {
            const geometry = new THREE.BufferGeometry();
            const positions = [];
            const randomness = [];
            const sizes = [];

            for (let i = 0; i < params.particleCount; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos((Math.random() * 2) - 1);
                const r = 2.8;

                let x = r * Math.sin(phi) * Math.cos(theta);
                let y = r * Math.sin(phi) * Math.sin(theta);
                let z = r * Math.cos(phi);

                // Brain shape deformation
                x *= 0.95; y *= 0.85; z *= 1.1;

                const gapFactor = Math.abs(x);
                if (gapFactor < 0.5) x *= Math.pow(gapFactor * 2, 0.5);

                const noise = noise3D(x * 0.8, y * 0.8, z * 0.8);
                const displacement = 1 + (noise * 0.4);

                x *= displacement; y *= displacement; z *= displacement;

                if (y < -0.5 && Math.abs(x) > 1.2) { y -= 0.2; x *= 1.1; }
                if (z < -1.8 && y < -0.8) { z -= 0.5; x *= 0.8; }

                positions.push(x, y, z);
                randomness.push(Math.random());
                sizes.push(Math.random() * 0.5 + 0.5);
            }

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randomness, 1));
            geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uColor: { value: new THREE.Color(params.color) },
                    uGlowColor: { value: new THREE.Color(params.glowColor) },
                    uSize: { value: params.particleSize * window.devicePixelRatio },
                },
                vertexShader: `
          uniform float uTime;
          uniform float uSize;
          attribute float aRandom;
          attribute float aSize;
          varying float vAlpha;
          varying vec3 vColor;
          uniform vec3 uColor;
          uniform vec3 uGlowColor;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float pulse = sin(uTime * 1.5 + aRandom * 5.0);
            gl_PointSize = uSize * aSize * (12.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            float brightness = 0.6 + 0.4 * pulse;
            vColor = mix(uColor, uGlowColor, brightness * 0.5);
            vAlpha = brightness;
          }
        `,
                fragmentShader: `
          varying float vAlpha;
          varying vec3 vColor;
          void main() {
            float r = distance(gl_PointCoord, vec2(0.5));
            if (r > 0.5) discard;
            float glow = 1.0 - (r * 2.0);
            glow = pow(glow, 1.5);
            gl_FragColor = vec4(vColor, glow * vAlpha);
          }
        `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            const brainSystem = new THREE.Points(geometry, material);
            scene.add(brainSystem);
            brainSystemRef.current = brainSystem;
            brainMaterialRef.current = material;
        };

        createBrainParticles();

        // Animation Loop
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);

            if (brainMaterialRef.current) {
                brainMaterialRef.current.uniforms.uTime.value = clock.getElapsedTime();
            }

            if (brainSystemRef.current) {
                brainSystemRef.current.rotation.y += params.rotationSpeed;
            }

            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        // Resize Handler
        const handleResize = () => {
            if (!container || !camera || !renderer) return;
            const width = container.clientWidth;
            const height = container.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);

            if (brainMaterialRef.current) {
                brainMaterialRef.current.uniforms.uSize.value = params.particleSize * window.devicePixelRatio;
            }
        };

        window.addEventListener('resize', handleResize);
        // Initial resize to ensure correct size
        handleResize();

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameIdRef.current);

            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement);
            }

            renderer.dispose();
            controls.dispose();

            if (brainSystemRef.current) {
                brainSystemRef.current.geometry.dispose();
                (brainSystemRef.current.material as THREE.Material).dispose();
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-[280px] h-[280px] rounded-full overflow-hidden bg-[radial-gradient(circle_at_center,#2e1065_0%,#0f0529_100%)] shadow-[0_0_30px_rgba(139,92,246,0.3)] mx-auto relative"
        />
    );
};
