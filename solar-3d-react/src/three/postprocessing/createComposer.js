import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// 后期处理管线：场景渲染 -> 辉光 -> 输出（负责色彩空间与色调映射）
export function createComposer(renderer, scene, camera) {
  const size = new THREE.Vector2();
  renderer.getSize(size);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  // strength 辉光强度 / radius 扩散半径 / threshold 仅高亮区域发光
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(size.x, size.y),
    0.85, // strength
    0.55, // radius
    0.82  // threshold：太阳与亮星超过此值才会发光，行星不会被整体洗白
  );
  composer.addPass(bloomPass);

  // OutputPass 统一做 ACES 色调映射 + sRGB 转换，避免双重映射
  composer.addPass(new OutputPass());

  return { composer, bloomPass };
}
