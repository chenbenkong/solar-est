import * as THREE from 'three';

export function createStarfield() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 20000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    
    const radius = 3000 + Math.random() * 3000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    const color = new THREE.Color();
    const starType = Math.random();
    
    if (starType < 0.1) {
      color.setRGB(1.0, 0.8, 0.6);
    } else if (starType < 0.2) {
      color.setRGB(0.8, 0.9, 1.0);
    } else if (starType < 0.3) {
      color.setRGB(1.0, 0.95, 0.8);
    } else if (starType < 0.35) {
      color.setRGB(1.0, 0.6, 0.5);
    } else {
      const brightness = 0.7 + Math.random() * 0.3;
      color.setRGB(brightness, brightness, brightness);
    }

    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
    
    sizes[i] = 0.5 + Math.random() * 2.5;
  }

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
      varying float vSize;
      uniform float time;
      
      void main() {
        vColor = color;
        vSize = size;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float twinkle = 0.8 + 0.2 * sin(time * 2.0 + position.x * 0.01 + position.y * 0.01);
        gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vSize;
      
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha = pow(alpha, 1.5);
        
        vec3 finalColor = vColor * (1.0 + alpha * 0.5);
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
