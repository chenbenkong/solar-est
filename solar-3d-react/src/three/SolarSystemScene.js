import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createSun } from './sun/createSun.js';
import { createPlanets } from './planets/createPlanets.js';
import { createStarfield } from './utils/createStarfield.js';

export class SolarSystemScene {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.sun = null;
    this.solarSystem = null;
    this.starField = null;
    this.planetMeshes = [];
    this.sunLight = null;
    
    this.isPaused = false;
    this.timeSpeed = 1;
    this.showOrbits = true;
    this.showStars = true;
    this.showNames = false;
    this.globalScale = 1.0;
    
    this.currentTargetPlanet = null;
    this.targetDistance = 300;
    this.cameraMoveSpeed = 0.05;
    
    this.animationId = null;
    this.onPlanetClick = null;
    this.onSunClick = null;
    this.onMoonClick = null;
    this.onCharonClick = null;
    
    this.raycaster = null;
    this.mouse = null;
  }

  init() {
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      20000
    );
    this.camera.position.set(0, 300, 800);
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = true;
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 3000;
    
    // 监听鼠标/触摸事件来区分操作类型
    let isZooming = false;
    
    this.renderer.domElement.addEventListener('wheel', () => {
      isZooming = true;
      setTimeout(() => { isZooming = false; }, 100);
    }, { passive: true });
    
    this.controls.addEventListener('start', () => {
      // 只有在非缩放操作时取消追踪
      if (this.currentTargetPlanet && !isZooming) {
        this.currentTargetPlanet = null;
      }
    });
    
    this.setupLighting();
    
    this.starField = createStarfield();
    this.scene.add(this.starField);
    
    this.solarSystem = new THREE.Group();
    this.scene.add(this.solarSystem);
    
    this.sun = createSun();
    this.sun.castShadow = false;
    this.solarSystem.add(this.sun);
    
    this.planetMeshes = createPlanets(this.solarSystem);
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.setupResize();
    this.setupClick();
    
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xaaccdd, 0.75);
    this.scene.add(ambientLight);
    
    this.sunLight = new THREE.PointLight(0xffffee, 0.8, 0, 0.3);
    this.sunLight.position.set(0, 0, 0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 2000;
    this.sunLight.shadow.bias = -0.0001;
    this.scene.add(this.sunLight);
    
    const sunGlowLight = new THREE.PointLight(0xffaa66, 0.25, 800, 0.5);
    sunGlowLight.position.set(0, 0, 0);
    this.scene.add(sunGlowLight);
    
    const fillLight = new THREE.DirectionalLight(0xbbddff, 0.4);
    fillLight.position.set(-300, 100, -300);
    this.scene.add(fillLight);
    
    const rimLight = new THREE.DirectionalLight(0xcceeff, 0.25);
    rimLight.position.set(0, 200, -400);
    this.scene.add(rimLight);
    
    const backLight = new THREE.DirectionalLight(0x6688aa, 0.35);
    backLight.position.set(0, 0, 500);
    this.scene.add(backLight);
  }

  setupClick() {
    this.renderer.domElement.addEventListener('click', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // 首先检测月球（因为它是子对象，需要优先检测）
      const moonMeshes = [];
      this.planetMeshes.forEach(planet => {
        if (planet.moon) moonMeshes.push(planet.moon);
      });
      const moonIntersects = this.raycaster.intersectObjects(moonMeshes);
      if (moonIntersects.length > 0 && this.onMoonClick) {
        const planet = this.planetMeshes.find(p => p.moon === moonIntersects[0].object);
        if (planet) {
          const moonTarget = {
            name: '月球',
            mesh: planet.moon,
            radius: planet.moon.geometry.parameters.radius,
            isMoon: true,
            parentPlanet: planet
          };
          this.currentTargetPlanet = moonTarget;
          this.moveCameraToPlanet(moonTarget);
          this.onMoonClick();
        }
        return;
      }
      
      // 然后检测行星
      const planetIntersects = this.raycaster.intersectObjects(
        this.planetMeshes.map(p => p.mesh)
      );
      
      if (planetIntersects.length > 0) {
        const planet = this.planetMeshes.find(
          p => p.mesh === planetIntersects[0].object
        );
        if (planet && this.onPlanetClick) {
          this.currentTargetPlanet = planet;
          this.moveCameraToPlanet(planet);
          this.onPlanetClick(planet);
        }
        return;
      }
      
      // 最后检测太阳
      const sunIntersects = this.raycaster.intersectObject(this.sun);
      if (sunIntersects.length > 0 && this.onSunClick) {
        const sunTarget = {
          name: '太阳',
          mesh: this.sun,
          radius: 50
        };
        this.currentTargetPlanet = sunTarget;
        this.moveCameraToPlanet(sunTarget);
        this.onSunClick();
        return;
      }
    });
  }

  moveCameraToPlanet(planet) {
    const worldPosition = new THREE.Vector3();
    planet.mesh.getWorldPosition(worldPosition);
    
    // 计算特写距离 - 根据星球大小调整
    let closeUpDistance;
    if (planet.name === '太阳') {
      closeUpDistance = 120; // 太阳特写距离
    } else if (planet.name === '月球') {
      closeUpDistance = 15; // 月球特写距离
    } else if (planet.name === '土星') {
      closeUpDistance = planet.radius * 4; // 土星要考虑环
    } else if (planet.name === '木星') {
      closeUpDistance = planet.radius * 2.5;
    } else {
      closeUpDistance = planet.radius * 3; // 其他行星
    }
    
    // 设置相机目标位置（星球前方）
    const targetCameraPos = new THREE.Vector3(
      worldPosition.x + closeUpDistance,
      worldPosition.y + closeUpDistance * 0.3,
      worldPosition.z + closeUpDistance
    );
    
    // 平滑移动相机
    this.animateCameraToPosition(targetCameraPos, worldPosition);
  }
  
  animateCameraToPosition(targetPos, lookAtPos) {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const duration = 1000; // 1秒动画
    const startTime = Date.now();
    
    // 动画过程中暂时禁用控制器更新，避免冲突
    const wasTracking = this.currentTargetPlanet !== null;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数 (ease-out cubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // 插值相机位置
      this.camera.position.lerpVectors(startPos, targetPos, easeProgress);
      
      // 插值目标点
      this.controls.target.lerpVectors(startTarget, lookAtPos, easeProgress);
      
      // 更新控制器
      this.controls.update();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const time = Date.now() * 0.001;
    
    if (!this.isPaused) {
      this.updatePlanets();
      this.updateSun();
    }
    
    if (this.starField && this.starField.userData.material) {
      this.starField.userData.material.uniforms.time.value = time;
    }
    
    if (this.currentTargetPlanet) {
      this.updateCameraTracking();
    } else {
      this.controls.update();
    }
    
    // 防止相机进入星球内部
    this.preventCameraInsidePlanets();
    
    this.renderer.render(this.scene, this.camera);
  }

  updatePlanets() {
    const time = Date.now();
    
    this.planetMeshes.forEach(planet => {
      if (planet.name === '土星') {
        planet.mesh.rotation.y += 0.0008 * this.timeSpeed;
      } else if (planet.name === '火星') {
        planet.mesh.rotation.y += 0.0002 * this.timeSpeed;
      } else if (planet.name === '金星') {
        planet.mesh.rotation.y -= 0.0001 * this.timeSpeed;
      } else {
        planet.mesh.rotation.y += planet.rotationSpeed * this.timeSpeed;
      }
      
      const angle = time * 0.0001 * planet.orbitSpeed * this.timeSpeed;
      const x = Math.cos(angle) * planet.distance;
      const z = Math.sin(angle) * planet.distance;
      planet.mesh.position.set(x, 0, z);
      
      if (planet.moon) {
        const moonAngle = time * 0.001 * 2 * this.timeSpeed;
        const moonRadius = planet.radius * 2;
        planet.moon.position.x = moonRadius * Math.cos(moonAngle);
        planet.moon.position.z = moonRadius * Math.sin(moonAngle);
        planet.moon.rotation.y += 0.0003 * this.timeSpeed;
      }
    });
  }

  updateSun() {
    if (this.sun) {
      this.sun.rotation.y += 0.005 * this.timeSpeed;
      
      const pulseFactor = Math.sin(Date.now() * 0.001) * 0.02 + 1;
      this.sun.scale.set(pulseFactor, pulseFactor, pulseFactor);
      
      if (this.sunLight) {
        this.sunLight.intensity = 3 + Math.sin(Date.now() * 0.002) * 0.3;
      }
      
      const time = Date.now() * 0.001;
      
      if (this.sun.userData) {
        if (this.sun.userData.glow && this.sun.userData.glow.material.uniforms) {
          this.sun.userData.glow.material.uniforms.viewVector.value = 
            new THREE.Vector3().subVectors(this.camera.position, this.sun.position);
        }
        
        if (this.sun.userData.innerGlow && this.sun.userData.innerGlow.material.uniforms) {
          this.sun.userData.innerGlow.material.uniforms.time.value = time;
        }
        
        if (this.sun.userData.corona && this.sun.userData.corona.material.uniforms) {
          this.sun.userData.corona.material.uniforms.time.value = time;
        }
        
        if (this.sun.userData.magma) {
          const magma = this.sun.userData.magma;
          
          if (magma.userData && magma.userData.spots) {
            magma.userData.spots.forEach(spot => {
              const phase = spot.userData.phase + time * spot.userData.speed;
              const scale = 1 + Math.sin(phase) * 0.3;
              spot.scale.setScalar(scale);
            });
          }
        }
      }
    }
  }

  updateCameraTracking() {
    const worldPosition = new THREE.Vector3();
    this.currentTargetPlanet.mesh.getWorldPosition(worldPosition);
    
    // 根据时间速度动态调整相机跟随速度
    // 基础速度0.08，时间速度越快，跟随速度也越快
    const adaptiveSpeed = Math.min(0.08 * Math.max(this.timeSpeed, 1), 0.3);
    
    // 计算相机相对于目标的位置偏移
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    
    // 更新目标点到行星位置（使用自适应速度）
    this.controls.target.lerp(worldPosition, adaptiveSpeed);
    
    // 保持相机相对位置跟随目标
    const newCameraPosition = new THREE.Vector3().addVectors(worldPosition, offset);
    this.camera.position.lerp(newCameraPosition, adaptiveSpeed);
    
    this.controls.update();
  }

  setPaused(paused) {
    this.isPaused = paused;
  }

  setTimeSpeed(speed) {
    this.timeSpeed = speed;
  }

  preventCameraInsidePlanets() {
    const cameraPos = this.camera.position.clone();
    
    // 检查太阳
    const sunDistance = cameraPos.distanceTo(this.sun.position);
    const sunMinDistance = 55; // 太阳半径50 + 缓冲5
    if (sunDistance < sunMinDistance) {
      const direction = cameraPos.clone().sub(this.sun.position).normalize();
      this.camera.position.copy(this.sun.position.clone().add(direction.multiplyScalar(sunMinDistance)));
    }
    
    // 检查所有行星
    this.planetMeshes.forEach(planet => {
      const worldPosition = new THREE.Vector3();
      planet.mesh.getWorldPosition(worldPosition);
      const distance = cameraPos.distanceTo(worldPosition);
      const minDistance = planet.radius * 1.2; // 行星半径 + 20%缓冲
      
      if (distance < minDistance) {
        const direction = cameraPos.clone().sub(worldPosition).normalize();
        this.camera.position.copy(worldPosition.clone().add(direction.multiplyScalar(minDistance)));
      }
      
      // 检查月球
      if (planet.moon) {
        const moonWorldPosition = new THREE.Vector3();
        planet.moon.getWorldPosition(moonWorldPosition);
        const moonDistance = cameraPos.distanceTo(moonWorldPosition);
        const moonMinDistance = planet.radius * 0.27 * 1.2; // 月球半径 + 缓冲
        
        if (moonDistance < moonMinDistance) {
          const direction = cameraPos.clone().sub(moonWorldPosition).normalize();
          this.camera.position.copy(moonWorldPosition.clone().add(direction.multiplyScalar(moonMinDistance)));
        }
      }
    });
  }

  setShowOrbits(show) {
    this.showOrbits = show;
    this.planetMeshes.forEach(planet => {
      if (planet.orbit) {
        planet.orbit.visible = show;
      }
    });
  }

  setShowStars(show) {
    this.showStars = show;
    if (this.starField) {
      this.starField.visible = show;
    }
  }

  setShowNames(show) {
    this.showNames = show;
  }

  setGlobalScale(scale) {
    this.globalScale = scale;
    if (this.solarSystem) {
      this.solarSystem.scale.set(scale, scale, scale);
    }
  }

  resetView() {
    this.camera.position.set(0, 300, 800);
    this.controls.reset();
    this.currentTargetPlanet = null;
  }

  cancelTracking() {
    this.currentTargetPlanet = null;
  }

  getPlanetScreenPositions() {
    const positions = {};
    
    this.planetMeshes.forEach(planet => {
      const vector = new THREE.Vector3();
      vector.setFromMatrixPosition(planet.mesh.matrixWorld);
      vector.project(this.camera);
      
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
      
      positions[planet.name] = { x, y, visible: this.showNames };
    });
    
    if (this.sun) {
      const vector = new THREE.Vector3();
      vector.setFromMatrixPosition(this.sun.matrixWorld);
      vector.project(this.camera);
      
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
      
      positions['太阳'] = { x, y, visible: this.showNames };
    }
    
    return positions;
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
    
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}
