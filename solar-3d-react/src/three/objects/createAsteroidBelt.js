import * as THREE from 'three';

// 火星与木星之间的小行星带：用 InstancedMesh 一次性绘制数千颗岩石，性能友好
export function createAsteroidBelt(innerRadius = 305, outerRadius = 348, count = 3500) {
  const group = new THREE.Group();

  // 低面数岩石，开启 flatShading 呈现棱角质感
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0x8a7f76,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true
  });

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const r = innerRadius + Math.random() * (outerRadius - innerRadius);
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 14; // 带状厚度

    dummy.position.set(r * Math.cos(theta), y, r * Math.sin(theta));
    dummy.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    const s = 0.5 + Math.random() * 2.6;
    dummy.scale.set(s, s * (0.6 + Math.random() * 0.8), s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  group.add(mesh);

  return group;
}
