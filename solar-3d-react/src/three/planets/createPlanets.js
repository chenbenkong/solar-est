import * as THREE from 'three';
import { planetData } from '../../data/planetData.js';
import { createPlanetTexture, createNormalMap } from './planetTextures.js';
import { createMoon } from './moon.js';

export function createPlanets(solarSystem, manager) {
  const planetMeshes = [];

  planetData.forEach(planet => {
    const geometry = new THREE.SphereGeometry(planet.radius, 64, 64);
    
    let material;
    
    if (planet.name === '木星') {
      material = createJupiterMaterial();
    } else if (planet.name === '土星') {
      material = createSaturnMaterial();
    } else if (planet.name === '地球') {
      material = createEarthMaterial();
    } else if (planet.name === '火星') {
      material = createMarsMaterial();
    } else if (planet.name === '金星') {
      material = createVenusMaterial();
    } else if (planet.name === '水星') {
      material = createMercuryMaterial();
    } else if (planet.name === '天王星') {
      material = createUranusMaterial();
    } else if (planet.name === '海王星') {
      material = createNeptuneMaterial();
    } else if (planet.name === '冥王星') {
      material = createPlutoMaterial();
    } else {
      material = new THREE.MeshPhongMaterial({
        color: planet.color,
        shininess: 30,
        emissive: 0x444444,
        emissiveIntensity: 0.4,
        specular: 0x444444
      });
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = planet.distance;
    mesh.rotation.x = THREE.MathUtils.degToRad(planet.tilt);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    solarSystem.add(mesh);

    // 大气辉光：Fresnel 边缘光，让行星轮廓在黑暗中泛起柔光
    if (planet.atmoColor) {
      mesh.add(createAtmosphere(planet.radius, planet.atmoColor));
    }

    const orbitGeometry = new THREE.RingGeometry(planet.distance - 0.3, planet.distance + 0.3, 256);
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x3366aa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    solarSystem.add(orbit);

    const planetObj = {
      mesh,
      orbit,
      ...planet
    };

    if (planet.hasMoon) {
      const { moon, moonOrbit } = createMoon(planet.radius, manager);
      moon.castShadow = true;
      moon.receiveShadow = true;
      mesh.add(moon);
      mesh.add(moonOrbit);
      planetObj.moon = moon;
    }

    if (planet.hasRings) {
      const ring = createRings(planet);
      mesh.add(ring);
      planetObj.ring = ring;
    }

    planetMeshes.push(planetObj);
  });

  return planetMeshes;
}

// 基于 Fresnel 的边缘辉光：背面渲染 + 叠加混合，中心透明、边缘发亮
function createAtmosphere(radius, color) {
  const geometry = new THREE.SphereGeometry(radius * 1.035, 64, 64);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      coeff: { value: 0.62 },
      power: { value: 3.2 }
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float coeff;
      uniform float power;
      varying vec3 vNormal;
      void main() {
        // 相机空间法线 z 分量：边缘处接近 0，正面接近 1
        float intensity = pow(clamp(coeff - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), power);
        gl_FragColor = vec4(glowColor, intensity);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
  return new THREE.Mesh(geometry, material);
}

function createJupiterMaterial() {
  const loader = new THREE.TextureLoader(manager);
  // 使用用户提供的木星贴图
  const jupiterTexture = loader.load(import.meta.env.BASE_URL + 'textures/jupiter.jpg');
  
  return new THREE.MeshPhongMaterial({
    map: jupiterTexture,
    shininess: 15,
    emissive: 0x332211,
    emissiveIntensity: 0.2,
    specular: 0x333333
  });
}

function createSaturnMaterial() {
  const loader = new THREE.TextureLoader(manager);
  // 使用用户提供的土星贴图
  const saturnTexture = loader.load(import.meta.env.BASE_URL + 'textures/saturn.jpg');
  
  return new THREE.MeshPhongMaterial({
    map: saturnTexture,
    shininess: 15,
    emissive: 0x332b20,
    emissiveIntensity: 0.2,
    specular: 0x333333
  });
}

function createEarthMaterial() {
  const loader = new THREE.TextureLoader(manager);
  const earthTexture = loader.load(import.meta.env.BASE_URL + 'textures/earth.jpg');
  const normalTexture = loader.load(import.meta.env.BASE_URL + 'textures/earth_normal.jpg');
  const specularTexture = loader.load(import.meta.env.BASE_URL + 'textures/earth_specular.jpg');
  
  return new THREE.MeshPhongMaterial({
    map: earthTexture,
    normalMap: normalTexture,
    normalScale: new THREE.Vector2(0.5, 0.5),
    specularMap: specularTexture,
    shininess: 35,
    emissive: 0x003366,
    emissiveIntensity: 0.35,
    specular: 0x333333
  });
}

function createMarsMaterial() {
  const loader = new THREE.TextureLoader(manager);
  // 使用用户提供的火星贴图
  const marsTexture = loader.load(import.meta.env.BASE_URL + 'textures/mars.jpg');
  
  return new THREE.MeshPhongMaterial({
    map: marsTexture,
    shininess: 10,
    emissive: 0x442211,
    emissiveIntensity: 0.2,
    specular: 0x333333
  });
}

function createVenusMaterial() {
  const loader = new THREE.TextureLoader(manager);
  // 使用用户提供的金星贴图
  const venusTexture = loader.load(import.meta.env.BASE_URL + 'textures/venus.jpg');
  
  return new THREE.MeshPhongMaterial({
    map: venusTexture,
    shininess: 60,
    emissive: 0x554433,
    emissiveIntensity: 0.3,
    specular: 0x444444
  });
}

function createMercuryMaterial() {
  const loader = new THREE.TextureLoader(manager);
  // 使用用户提供的水星贴图
  const mercuryTexture = loader.load(import.meta.env.BASE_URL + 'textures/mercury.jpg');
  
  return new THREE.MeshPhongMaterial({
    map: mercuryTexture,
    shininess: 25,
    emissive: 0x444444,
    emissiveIntensity: 0.3,
    specular: 0x555555
  });
}

function createUranusMaterial() {
  const loader = new THREE.TextureLoader(manager);
  // 使用用户提供的天王星贴图
  const uranusTexture = loader.load(import.meta.env.BASE_URL + 'textures/uranus.jpg');
  
  return new THREE.MeshPhongMaterial({
    map: uranusTexture,
    shininess: 50,
    emissive: 0x003355,
    emissiveIntensity: 0.25,
    specular: 0x666666
  });
}

function createNeptuneMaterial() {
  const loader = new THREE.TextureLoader(manager);
  // 使用用户提供的海王星贴图
  const neptuneTexture = loader.load(import.meta.env.BASE_URL + 'textures/neptune.jpg');
  
  return new THREE.MeshPhongMaterial({
    map: neptuneTexture,
    shininess: 70,
    emissive: 0x001855,
    emissiveIntensity: 0.25,
    specular: 0x888888
  });
}

function createPlutoMaterial() {
  const loader = new THREE.TextureLoader(manager);
  // 使用用户提供的冥王星贴图
  const plutoTexture = loader.load(import.meta.env.BASE_URL + 'textures/pluto.jpg');
  
  return new THREE.MeshPhongMaterial({
    map: plutoTexture,
    shininess: 15,
    emissive: 0x332b20,
    emissiveIntensity: 0.2,
    specular: 0x333333
  });
}

function createRings(planet) {
  // 土星使用多个环来模拟真实结构
  if (planet.name === '土星') {
    return createSaturnRingSystem(planet);
  }
  
  // 其他行星简单环
  const innerRadius = planet.radius * 1.4;
  const outerRadius = planet.radius * 2.2;
  const segments = 64;
  const opacity = planet.ringOpacity || 0.5;

  const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, segments);
  const ringMaterial = new THREE.MeshPhongMaterial({
    color: 0x8899aa,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: opacity,
    shininess: 40,
    emissive: 0x444444,
    emissiveIntensity: 0.35,
    specular: 0x555555
  });

  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  return ring;
}

function createSaturnRingSystem(planet) {
  const ringGroup = new THREE.Group();
  const radius = planet.radius;
  
  // 土星真实环结构 (从内到外): D, C, B, 卡西尼缝, A, F, G, E
  // 使用比例来模拟真实距离
  const rings = [
    // D环 - 最内侧，非常暗淡
    { inner: 1.11, outer: 1.19, opacity: 0.15, color: 0xb8a888, name: 'D' },
    // C环 - 暗淡
    { inner: 1.19, outer: 1.53, opacity: 0.25, color: 0xc8b898, name: 'C' },
    // B环 - 最亮最宽
    { inner: 1.53, outer: 1.95, opacity: 0.85, color: 0xe8dcc8, name: 'B' },
    // 卡西尼缝 - 间隙 (不绘制)
    // A环 - 次亮
    { inner: 2.03, outer: 2.27, opacity: 0.65, color: 0xd8ccb8, name: 'A' },
    // F环 - 窄而亮
    { inner: 2.30, outer: 2.33, opacity: 0.75, color: 0xf0e8d8, name: 'F' },
    // G环 - 非常暗淡
    { inner: 2.45, outer: 2.55, opacity: 0.2, color: 0xc0b0a0, name: 'G' },
    // E环 - 非常弥散暗淡
    { inner: 2.8, outer: 4.0, opacity: 0.08, color: 0xd0c8b8, name: 'E' }
  ];
  
  rings.forEach(ringData => {
    const innerR = radius * ringData.inner;
    const outerR = radius * ringData.outer;
    
    const geometry = new THREE.RingGeometry(innerR, outerR, 256);
    
    // 为B环和A环创建纹理
    let material;
    if (ringData.name === 'B' || ringData.name === 'A') {
      const texture = createDetailedRingTexture(ringData.name);
      material = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: ringData.opacity,
        shininess: 60,
        emissive: ringData.color,
        emissiveIntensity: 0.2,
        specular: 0x666666
      });
    } else {
      material = new THREE.MeshPhongMaterial({
        color: ringData.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: ringData.opacity,
        shininess: 40,
        emissive: ringData.color,
        emissiveIntensity: 0.15,
        specular: 0x555555
      });
    }
    
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = Math.PI * (26.7 / 180); // 土星环倾角
    ringGroup.add(ring);
  });
  
  return ringGroup;
}

function createDetailedRingTexture(ringName) {
  const cvs = document.createElement('canvas');
  const size = 2048;
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');
  
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size * 0.48;
  const minRadius = size * 0.25;
  
  // 透明背景
  ctx.clearRect(0, 0, size, size);
  
  if (ringName === 'B') {
    // B环 - 最复杂，有很多小环缝
    const ringCount = 80;
    for (let i = 0; i < ringCount; i++) {
      const t = i / ringCount;
      const r = minRadius + (maxRadius - minRadius) * t;
      const width = 2 + Math.random() * 4;
      
      // 创建环缝效果 - 随机一些间隙
      const isGap = Math.random() > 0.92;
      const opacity = isGap ? 0.1 : 0.7 + Math.random() * 0.25;
      
      const gradient = ctx.createRadialGradient(centerX, centerY, r, centerX, centerY, r + width);
      gradient.addColorStop(0, `rgba(220, 210, 190, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(240, 230, 210, ${opacity * 1.1})`);
      gradient.addColorStop(1, `rgba(200, 190, 170, ${opacity * 0.9})`);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, r + width, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2, true);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  } else if (ringName === 'A') {
    // A环 - 包含恩克缝
    const ringCount = 60;
    for (let i = 0; i < ringCount; i++) {
      const t = i / ringCount;
      const r = minRadius + (maxRadius - minRadius) * t;
      const width = 2 + Math.random() * 3;
      
      // 恩克缝 - 在约0.35位置
      const isEnckeGap = t > 0.32 && t < 0.38;
      const opacity = isEnckeGap ? 0.15 : 0.55 + Math.random() * 0.2;
      
      const gradient = ctx.createRadialGradient(centerX, centerY, r, centerX, centerY, r + width);
      gradient.addColorStop(0, `rgba(200, 190, 175, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(220, 210, 195, ${opacity * 1.1})`);
      gradient.addColorStop(1, `rgba(190, 180, 165, ${opacity * 0.9})`);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, r + width, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2, true);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }
  
  // 添加颗粒感
  for (let i = 0; i < 500; i++) {
    const r = minRadius + Math.random() * (maxRadius - minRadius);
    const angle = Math.random() * Math.PI * 2;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    const size = 0.5 + Math.random() * 2;
    
    ctx.fillStyle = `rgba(${200 + Math.random() * 40}, ${190 + Math.random() * 40}, ${170 + Math.random() * 30}, ${0.2 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  return new THREE.CanvasTexture(cvs);
}

function createSaturnRingsTexture() {
  // 这个函数现在只用于简单的环纹理
  const cvs = document.createElement('canvas');
  const size = 1024;
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, size, size);

  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size * 0.48;
  const innerRadius = size * 0.28;

  const ringColors = [
    { start: 0.0, end: 0.15, color: 'rgba(210, 180, 140, 0.3)' },
    { start: 0.15, end: 0.25, color: 'rgba(180, 150, 110, 0.6)' },
    { start: 0.25, end: 0.35, color: 'rgba(160, 130, 90, 0.2)' },
    { start: 0.35, end: 0.5, color: 'rgba(200, 170, 130, 0.7)' },
    { start: 0.5, end: 0.6, color: 'rgba(140, 110, 80, 0.3)' },
    { start: 0.6, end: 0.75, color: 'rgba(190, 160, 120, 0.8)' },
    { start: 0.75, end: 0.85, color: 'rgba(170, 140, 100, 0.5)' },
    { start: 0.85, end: 1.0, color: 'rgba(150, 120, 90, 0.4)' }
  ];

  ringColors.forEach(ring => {
    const startR = innerRadius + (outerRadius - innerRadius) * ring.start;
    const endR = innerRadius + (outerRadius - innerRadius) * ring.end;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, startR, centerX, centerY, endR);
    gradient.addColorStop(0, ring.color);
    gradient.addColorStop(1, ring.color);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, endR, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, startR, 0, Math.PI * 2, true);
    ctx.fillStyle = gradient;
    ctx.fill();
  });

  for (let i = 0; i < 100; i++) {
    const r = innerRadius + Math.random() * (outerRadius - innerRadius);
    const angle = Math.random() * Math.PI * 2;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    const size = 1 + Math.random() * 3;
    
    ctx.fillStyle = `rgba(${100 + Math.random() * 100}, ${80 + Math.random() * 80}, ${50 + Math.random() * 50}, ${0.3 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(cvs);
}
