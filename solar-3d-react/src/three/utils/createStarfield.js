import * as THREE from 'three';

// 程序化星空：随机散布的恒星 + 沿"银河带"加密的彩色星簇
export function createStarfield() {
  const starCount = 30000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);

  const color = new THREE.Color();

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;

    const radius = 4000 + Math.random() * 3500;

    // 约 35% 的恒星集中在赤道附近的"银河带"，模拟银河
    let theta, phi;
    if (Math.random() < 0.35) {
      theta = Math.random() * Math.PI * 2;
      // 高斯式集中在赤道平面
      const band = (Math.random() + Math.random() + Math.random() - 1.5) * 0.35;
      phi = Math.acos(THREE.MathUtils.clamp(band, -1, 1));
    } else {
      theta = Math.random() * Math.PI * 2;
      phi = Math.acos(2 * Math.random() - 1);
    }

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    // 恒星颜色：以白为主，混入暖黄、冷蓝与少量红巨星
    const starType = Math.random();
    if (starType < 0.12) {
      color.setRGB(1.0, 0.82, 0.55);       // 暖黄
    } else if (starType < 0.24) {
      color.setRGB(0.75, 0.85, 1.0);        // 冷蓝
    } else if (starType < 0.30) {
      color.setRGB(1.0, 0.6, 0.5);          // 红巨星
    } else {
      const b = 0.75 + Math.random() * 0.25;
      color.setRGB(b, b, b * 0.98);         // 白
    }

    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    sizes[i] = 0.6 + Math.random() * 3.0;
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const starMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;

      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        // 每颗星独立的微弱闪烁
        float twinkle = 0.75 + 0.25 * sin(time * 1.5 + position.x * 0.01 + position.y * 0.013);
        gl_PointSize = size * twinkle * (320.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;

      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha = pow(alpha, 1.5);
        vec3 finalColor = vColor * (1.0 + alpha * 0.6);
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  stars.userData.material = starMaterial;

  return stars;
}
