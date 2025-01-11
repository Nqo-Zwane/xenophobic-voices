//import * as dat from 'dat.gui';
import Stats from 'stats.js';
import * as T from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const mouthShapeToViseme = {
  A: 'aPose',
  B: 'iPose',
  C: 'oPose',
  D: 'uPose',
  E: 'ePose',
  F: 'smile',
  G: 'squiff',
  H: 'tiltF',
  X: 'aPose'
};

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

const MODEL_PATH = '../src/assets/model/headFin_compressed.glb';
const MODEL_SCALE = 1.6;
const MODEL_POSITION = { x: 0, y: 0.5, z: -1.9 };
const MODEL_ROTATION = { x: -0.1, y: -1.5, z: 0 };
const MODEL_COLOR_IF_NO_MATERIAL = 0x00_00_00;

export default class Three {
  constructor(canvas, audio) {
    this.canvas = canvas;
    this.audio = audio;

    this.scene = new T.Scene();

    this.camera = new T.PerspectiveCamera(
      75,
      device.width / device.height,
      0.05,
      100
    );
    this.depthCamera = new T.PerspectiveCamera(
      70,
      device.width / device.height,
      1,
      2
    );
    this.camera.position.set(0, 0, 1);
    this.depthCamera.position.set(0, 0, 1);
    this.scene.add(this.camera);

    this.renderer = new T.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    this.renderer.toneMapping = T.ACESFilmicToneMapping;

    this.clock = new T.Clock();

    this.FBOTarget = this.getFBO();

    //this.setStats();

    this.setModel();

    this.setLights();
    this.setGeometry();
    this.render();
    this.setResize();
    window.three = {
      depthCamera: this.depthCamera,
      camera: this.camera,
      scene: this.scene,
      renderer: this.renderer,
      three: T,
      FBO: this.FBOTarget,
      stats: this.stats,
      setModel: this.setModel.bind(this),
      model: this.model
    };
    //this.gui = new dat.GUI();
    this.audios = this.loadAudios(20);
    this.lipSyncData = this.loadLipSyncData();
    this.morphTargetParams = {};
    this.isMouseDown = false;

    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    window.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: false
    });
    window.addEventListener('touchmove', this.handleTouchMove.bind(this), {
      passive: false
    });
    window.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: false
    });
    this.isHeadAtRest = true;
  }
  fadeAudioVolume(from, to, duration = 3) {
    const fadeSteps = 100;
    let currentStep = 0;
    const stepInterval = duration / fadeSteps;

    const fadeInterval = setInterval(() => {
      const newVolume = from + (to - from) * (currentStep / fadeSteps);
      this.audio.volume = newVolume;

      if (currentStep >= fadeSteps) {
        clearInterval(fadeInterval);
      }
      currentStep++;
    }, stepInterval);
  }

  handleMouseDown() {
    this.isMouseDown = true;
    this.moveHead(true);
    this.isHeadAtRest = false;
    this.currentAudioIndex = Math.floor(Math.random() * 20);
    this.fadeAudioVolume(0.5, 0.1);
    this.playAudio(this.currentAudioIndex);
  }

  handleMouseUp() {
    this.isMouseDown = false;
    this.isHeadAtRest = false;
    this.moveHead(false);
    this.stopAudio(this.currentAudioIndex);
    this.fadeAudioVolume(0.1, 0.5);
  }

  handleTouchStart(event) {
    event.preventDefault();
    this.handleMouseDown();
  }
  handleTouchMove(event) {
    event.preventDefault();
  }

  handleTouchEnd(event) {
    event.preventDefault();
    this.handleMouseUp();
  }
  moveHead(isForward) {
    if (this.model) {
      const targetPosition = isForward ? -1.3 : -1.9;
      this.model.position.z = T.MathUtils.lerp(
        this.model.position.z,
        targetPosition,
        0.1
      );
    }
  }

  playAudio(index) {
    if (this.audios[index]) {
      this.audios[index].currentTime = 0;
      this.audios[index].play();
    }
  }

  stopAudio(index) {
    if (this.audios[index]) {
      this.audios[index].pause();
      this.audios[index].currentTime = 0;
    }
  }

  setStats() {
    this.stats = new Stats();
    document.body.append(this.stats.dom);
  }

  async loadLipSyncData() {
    const lipSyncData = [];
    for (let index = 1; index <= 20; index++) {
      try {
        const data = await import(`../assets/audio/${index}.json`);
        lipSyncData.push(data);
      } catch (error) {
        console.error(`Error loading lip sync data for ${index}:`, error);
      }
    }
    return lipSyncData;
  }
  loadAudios(numberAudios) {
    const audios = [];

    for (let index = 1; index <= numberAudios; index++) {
      const audio = new Audio(`src/assets/audio/${index}.wav`);
      audio.preload = 'auto';
      audios.push(audio);
    }

    return audios;
  }

  setLights() {
    this.ambientLight = new T.AmbientLight(new T.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }
  async setModel(
    scale = MODEL_SCALE,
    position = MODEL_POSITION,
    rotation = MODEL_ROTATION
  ) {
    this.loader = new GLTFLoader();
    this.ktx2Loader = await new KTX2Loader()
      .setTranscoderPath('jsm/libs/basis/')
      .detectSupport(this.renderer);

    try {
      const gltf = await new Promise((resolve, reject) => {
        this.loader.setKTX2Loader(this.ktx2Loader);
        this.loader.setMeshoptDecoder(MeshoptDecoder);

        this.loader.load(MODEL_PATH, resolve, undefined, reject);
      });

      this.model = gltf.scene.children[0];

      this.model.traverse((node) => {
        if (node.isMesh && !(node.material instanceof T.MeshBasicMaterial)) {
          node.material = new T.MeshBasicMaterial({
            color: MODEL_COLOR_IF_NO_MATERIAL
          });
        }
        if (
          node.morphTargetDictionary &&
          node.morphTargetInfluences &&
          node.name === 'polySurface1Shape'
        ) {
          for (const targetName of Object.keys(node.morphTargetDictionary)) {
            this.morphTargetParams[targetName] = 0;
          }
        }
      });
      this.model.scale.set(scale, scale, scale);
      this.model.position.set(position.x, position.y, position.z);
      this.model.rotation.set(rotation.x, rotation.y, rotation.z);

      this.scene.add(this.model);
    } catch (error) {
      console.error('Error loading GLTF model:', error);
    }
  }
  setGeometry(
    gridSize = 100,
    planeHeight = 0.008,
    planeWidth = 5,
    divisions = 50
  ) {
    try {
      this.planeMaterial = new T.ShaderMaterial({
        side: T.DoubleSide,
        wireframe: false,
        fragmentShader: fragment,
        vertexShader: vertex,
        uniforms: {
          time: { type: 'f', value: 0 },
          progress: { type: 'f', value: 0 },
          resolution: { value: new T.Vector4() },
          depthInfo: { value: undefined },
          cameraNear: { value: this.depthCamera.near },
          cameraFar: { value: this.depthCamera.far }
        }
      });

      // Loop for creating the grid of planes
      for (let index = 0; index <= gridSize; index++) {
        this.planeGeometry1 = new T.PlaneGeometry(
          planeWidth,
          planeHeight,
          divisions,
          1
        );
        let y = [];

        let length_ = this.planeGeometry1.attributes.position.array.length;

        for (let index_ = 0; index_ < length_ / 3; index_++) {
          y.push(index / 100);
        }
        this.planeGeometry1.setAttribute(
          'y',
          new T.Float32BufferAttribute(y, 1)
        );
        this.planeMesh = new T.Mesh(this.planeGeometry1, this.planeMaterial);
        this.planeMesh.position.y = (index - gridSize / 2) / (gridSize / 2);
        this.scene.add(this.planeMesh);
      }
    } catch (error) {
      console.error('Error creating plane geometry:', error);
    }
  }
  async driveMorphTargets() {
    if (!this.lipSyncData || this.lipSyncData.length === 0) {
      console.warn('Lip sync data is not loaded yet!');
      return;
    }

    const currentAudio = this.audios.find(
      (audio) => audio.currentTime > 0 && !audio.paused
    );

    if (!currentAudio) {
      console.warn('No audio is currently playing');
      return;
    }

    const currentAudioTime = currentAudio.currentTime;
    const lipSyncData = await this.lipSyncData;

    const audioIndex = this.audios.indexOf(currentAudio);
    const lipSync = lipSyncData[audioIndex];
    if (lipSync && lipSync.mouthCues) {
      for (let cueIndex = 0; cueIndex < lipSync.mouthCues.length; cueIndex++) {
        if (this.model) {
          this.model.traverse((node) => {
            if (
              node.morphTargetDictionary &&
              node.morphTargetInfluences &&
              node.name === 'polySurface1Shape'
            ) {
              const mouthCue = lipSync.mouthCues[cueIndex];
              const viseme = mouthShapeToViseme[mouthCue.value];

              if (
                currentAudioTime >= mouthCue.start &&
                currentAudioTime <= mouthCue.end
              ) {
                const visemeIndex = node.morphTargetDictionary[viseme];
                const currentInfluence =
                  node.morphTargetInfluences[visemeIndex];
                node.morphTargetInfluences[visemeIndex] = T.MathUtils.lerp(
                  currentInfluence,
                  1,
                  0.5
                );
              } else {
                const visemeIndex = node.morphTargetDictionary[viseme];
                const currentInfluence =
                  node.morphTargetInfluences[visemeIndex];
                node.morphTargetInfluences[visemeIndex] = T.MathUtils.lerp(
                  currentInfluence,
                  0,
                  0.01
                );
              }
            }
          });
        }
      }
    }
  }

  getFBO() {
    try {
      const target = new T.WebGLRenderTarget(device.width, device.height);
      target.texture.format = T.RGBAFormat;
      target.texture.minFilter = T.NearestFilter;
      target.texture.magFilter = T.NearestFilter;
      target.stencilBuffer = false;
      target.texture.generateMipmaps = false;
      target.depthBuffer = true;

      target.depthTexture = new T.DepthTexture();
      target.depthTexture.format = T.DepthFormat;
      target.depthTexture.type = T.UnsignedShortType;

      return target;
    } catch (error) {
      console.error('Error creating FBO:', error);
      return;
    }
  }

  render() {
    try {
      //this.stats.update();
      const elapsedTime = this.clock.getElapsedTime();
      this.driveMorphTargets();
      if (!this.isHeadAtRest) {
        this.moveHead(this.isMouseDown);
      }

      requestAnimationFrame(this.render.bind(this));
      this.renderer.setRenderTarget(this.FBOTarget);
      this.renderer.render(this.scene, this.depthCamera);

      this.planeMaterial.uniforms.time.value = elapsedTime;
      this.planeMaterial.uniforms.depthInfo.value = this.FBOTarget.depthTexture;

      // eslint-disable-next-line unicorn/no-null
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('Error during render:', error);
    }
  }

  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    device.width = window.innerWidth;
    device.height = window.innerHeight;

    this.camera.aspect = device.width / device.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}
