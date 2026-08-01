import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const Brain3D = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) return;

    const scene = new THREE.Scene();
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clear any existing children (React StrictMode might double-mount)
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 2);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    let brainMesh: THREE.Object3D | null = null;
    
    // Configurar OrbitControls para rotación interactiva
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false; // Prevenir conflicto con el scroll de la página
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true; // El cerebro rota solo si el usuario no lo está agarrando
    controls.autoRotateSpeed = 1.5;
    
    // Textura premium: Núcleo blanco caliente con halo cyan/azul suave (holográfico)
    const createGlowTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');      // Hot core
        gradient.addColorStop(0.1, 'rgba(186, 230, 253, 0.9)');  // Light blue inner
        gradient.addColorStop(0.4, 'rgba(14, 165, 233, 0.3)');   // Cyan soft halo
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');            // Fade to transparent
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const loader = new OBJLoader();
    loader.load('/models/brain.obj', (obj) => {
      // Material base más fino y elegante (estilo polvo/holograma)
      const pointsMaterial = new THREE.PointsMaterial({
        color: 0xd1d5db, // Original light gray/white
        size: 0.015,
        transparent: true,
        opacity: 0.35,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
      });

      const pointsGroup = new THREE.Group();
      const spritesGroup = new THREE.Group();
      const activeSprites: any[] = [];
      const glowTexture = createGlowTexture();
      
      let maxDim = 1;

      obj.traverse((child: any) => {
        if (child.isMesh) {
          const points = new THREE.Points(child.geometry, pointsMaterial);
          pointsGroup.add(points);
          
          child.geometry.computeBoundingBox();
          const box = child.geometry.boundingBox;
          if (box) {
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            maxDim = Math.max(size.x, size.y, size.z);
            
            const positions = child.geometry.attributes.position.array;
            const validPositions: THREE.Vector3[] = [];
            
            // Seleccionamos puntos de todo el cerebro, priorizando la corteza externa
            for (let i = 0; i < positions.length; i += 3) {
               // Tomar 1 de cada N puntos para evaluar
               if (Math.random() < 0.1) {
                 const x = positions[i];
                 const y = positions[i+1];
                 const z = positions[i+2];
                 validPositions.push(new THREE.Vector3(x, y, z));
               }
            }
            
            // Elegir ~150 nodos para formar la constelación principal
            validPositions.sort(() => 0.5 - Math.random());
            const selected = validPositions.slice(0, 150);
            
            selected.forEach(pos => {
                  const spriteMat = new THREE.SpriteMaterial({
                    map: glowTexture,
                    color: 0xffffff, // La textura ya tiene el color cyan
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    opacity: 1
                  });
                  const sprite = new THREE.Sprite(spriteMat);
                  sprite.position.copy(pos);
                  
                  // Escala elegante (pequeños chispazos)
                  const s = maxDim * 0.02 * (0.5 + Math.random() * 0.5);
                  sprite.scale.setScalar(s);
                  
                  sprite.userData = {
                    baseOpacity: 0.5 + Math.random() * 0.5,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.01 + Math.random() * 0.02
                  };
                  
                  spritesGroup.add(sprite);
                  activeSprites.push(sprite);
            });
            
            // Red neuronal: Conectar los nodos luminosos entre sí
            const linePositions: number[] = [];
            selected.forEach((pos, i) => {
              // Buscar los 3-4 vecinos más cercanos DENTRO de los nodos seleccionados
              const distances = selected
                .map((target, index) => ({ target, index, dist: pos.distanceTo(target) }))
                .filter(item => item.index !== i)
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 4); // Conectar a los 4 más cercanos

              distances.forEach(d => {
                // Solo conectar si están razonablemente cerca
                if (d.dist < maxDim * 0.25) {
                  linePositions.push(pos.x, pos.y, pos.z);
                  linePositions.push(d.target.x, d.target.y, d.target.z);
                }
              });
            });

            if (linePositions.length > 0) {
              const lineGeo = new THREE.BufferGeometry();
              lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
              const lineMat = new THREE.LineBasicMaterial({
                color: 0x38bdf8, // Original cyan/blue
                transparent: true,
                opacity: 0.25,
                blending: THREE.AdditiveBlending
              });
              const lines = new THREE.LineSegments(lineGeo, lineMat);
              spritesGroup.add(lines);
            }
          }
        }
      });
      
      pointsGroup.add(spritesGroup);
      brainMesh = pointsGroup;
      brainMesh.userData.activeSprites = activeSprites;
      
      const box = new THREE.Box3().setFromObject(brainMesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      const finalMaxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 3.2; 
      const scale = targetSize / finalMaxDim;
      
      brainMesh.scale.setScalar(scale);
      
      brainMesh.position.x = -center.x * scale;
      brainMesh.position.y = -center.y * scale;
      brainMesh.position.z = -center.z * scale;
      
      scene.add(brainMesh);
    }, undefined, (error) => {
      console.error('Error loading brain model:', error);
      const geometry = new THREE.IcosahedronGeometry(1.2, 2);
      const fallbackMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        wireframe: true,
        emissive: 0x000000,
        transparent: true,
        opacity: 0.8
      });
      brainMesh = new THREE.Mesh(geometry, fallbackMat);
      scene.add(brainMesh);
    });

    let animationFrameId: number;
    let isVisible = false;

    // Observer to pause rendering when off-screen
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.1 }); // Trigger when 10% visible
    
    observer.observe(container);

    // Paleta de colores: verde claro -> verde normal -> verde oscuro -> azul oscuro -> azul claro
    const colorPalette = [
      new THREE.Color(0x86efac), // verde claro
      new THREE.Color(0x22c55e), // verde normal
      new THREE.Color(0x14532d), // verde oscuro
      new THREE.Color(0x1e3a8a), // azul oscuro
      new THREE.Color(0x7dd3fc)  // azul claro
    ];

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      if (!isVisible) return; // Skip rendering and heavy calculations if not on screen

      if (brainMesh) {
        // Leer el scroll directamente de Lenis (a 60fps sin React)
        const scrollY = (window as any).lenis?.scroll || window.scrollY || 0;
        
        // El scroll afecta directamente la rotación y elevación del cerebro
        // Añadimos la inercia del scroll a la rotación base del OrbitControls
        brainMesh.rotation.y = scrollY * 0.001; 
        
        // Animación sutil de levitación combinada con el scroll
        brainMesh.position.y = (Math.sin(Date.now() * 0.001) * 0.05) + (scrollY * 0.0005);
        
        if (brainMesh.userData.activeSprites) {
          brainMesh.userData.activeSprites.forEach((sprite: any) => {
            sprite.userData.phase += sprite.userData.speed;
            const pulse = (Math.sin(sprite.userData.phase) + 1) / 2;
            sprite.material.opacity = sprite.userData.baseOpacity * (0.3 + pulse * 0.7);
          });
        }
      }
      
      controls.update(); // Requerido para damping y autoRotate
      renderer.render(scene, camera);
    };

    const handleMouseEnter = () => {

      if (brainMesh) {
        brainMesh.traverse((child: any) => {
          if (child.isPoints) {
            child.material.color = new THREE.Color(0xd1d5db); // Gray a bit lighter on hover
            child.material.opacity = 1.0;
          }
        });
      }
    };

    const handleMouseLeave = () => {

      if (brainMesh) {
        brainMesh.traverse((child: any) => {
          if (child.isPoints) {
            child.material.color = new THREE.Color(0x9ca3af); // Back to base gray
            child.material.opacity = 0.6;
          }
        });
      }
    };

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[400px] relative overflow-visible pointer-events-auto"
      style={{ outline: 'none' }}
    />
  );
};
