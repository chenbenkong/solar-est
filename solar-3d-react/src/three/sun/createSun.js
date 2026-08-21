import * as THREE from 'three';
import { createMagmaEffect } from './magmaEffect.js';
import { createSolarParticleSystem } from './solarParticles.js';

export function createSun(manager) {
  const sunRadius = 50;
  
  const sunGeometry = new THREE.SphereGeometry(sunRadius, 128, 128);
  
  // 使用用户提供的太阳贴图
  const textureLoader = new THREE.TextureLoader(manager);
  const sunTexture = textureLoader.load(import.meta.env.BASE_URL + 'textures/sun.jpg');
  
  const sunMaterial = new THREE.MeshBasicMaterial({
    map: sunTexture,
    color: 0xffffff
  });
  
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(0, 0, 0);
  sun.rotation.z = 0.126;
  
  const glowGeometry = new THREE.SphereGeometry(sunRadius * 1.2, 64, 64);
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      viewVector: { value: new THREE.Vector3() }
    },
    vertexShader: `
      uniform vec3 viewVector;
      varying float intensity;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vNormel = normalize(normalMatrix * viewVector);
        intensity = pow(0.7 - dot(vNormal, vNormel), 2.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float intensity;
      void main() {
        vec3 glow = vec3(1.0, 0.6, 0.2) * intensity;
        gl_FragColor = vec4(glow, intensity * 0.8);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });
  
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  sun.add(glowMesh);
  sun.userData.glow = glowMesh;
  
  const innerGlowGeometry = new THREE.SphereGeometry(sunRadius * 1.05, 64, 64);
  const innerGlowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        vec3 color = mix(
          vec3(1.0, 0.8, 0.3),
          vec3(1.0, 0.4, 0.1),
          intensity
        );
        float alpha = intensity * 0.6;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
  });
  
  const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
  sun.add(innerGlow);
  sun.userData.innerGlow = innerGlow;
  
  const coronaGeometry = new THREE.SphereGeometry(sunRadius * 1.8, 64, 64);
  const coronaMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        float dist = length(vPosition) / 90.0;
        float alpha = (1.0 - dist) * 0.15;
        alpha *= 0.5 + 0.5 * sin(time * 2.0 + vPosition.x * 0.1);
        vec3 color = vec3(1.0, 0.7, 0.3);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
  
  const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
  sun.add(corona);
  sun.userData.corona = corona;
  
  const magmaEffect = createMagmaEffect();
  sun.add(magmaEffect);
  
  const solarParticles = createSolarParticleSystem();
  sun.add(solarParticles);
  
  sun.userData.magma = magmaEffect;
  sun.userData.particles = solarParticles;
  sun.userData.radius = sunRadius;
  
  return sun;
}
