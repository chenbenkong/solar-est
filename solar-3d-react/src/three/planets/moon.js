import * as THREE from 'three';

export function createMoon(planetRadius, manager) {
  const moonGeometry = new THREE.SphereGeometry(planetRadius * 0.27, 128, 64);
  
  // 使用用户提供的月球贴图
  const textureLoader = new THREE.TextureLoader(manager);
  const moonTexture = textureLoader.load(import.meta.env.BASE_URL + 'textures/moon.jpg');
  
  const moonMaterial = new THREE.MeshPhongMaterial({
    map: moonTexture,
    shininess: 10,
    emissive: 0x222222,
    emissiveIntensity: 0.15,
    specular: 0x444444
  });
  
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.x = planetRadius * 2;
  
  const moonOrbitGeometry = new THREE.RingGeometry(planetRadius * 2, planetRadius * 2 + 0.5, 64);
  const moonOrbitMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
  });
  const moonOrbit = new THREE.Mesh(moonOrbitGeometry, moonOrbitMaterial);
  moonOrbit.rotation.x = Math.PI / 2;
  
  return { moon, moonOrbit };
}
