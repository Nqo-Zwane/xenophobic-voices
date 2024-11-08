import Stats from 'stats.js';
import * as T from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

const MODEL_PATH = '../src/assets/model/hi.gltf';
const MODEL_SCALE = 50;
const MODEL_POSITION = { x: -45, y: -100, z: -180 };
const MODEL_ROTATION = { x: 0, y: 0, z: 0 };
const MODEL_COLOR_IF_NO_MATERIAL = 0x00_00_00;

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new T.Scene();

    this.camera = new T.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      100
    );
    this.depthCamera = new T.PerspectiveCamera(
      70,
      device.width / device.height,
      1,
      2
    );
    this.camera.position.set(0, 0, 2);
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

    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new T.Clock();

    this.FBOTarget = this.getFBO();

    this.setStats();

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
      setModel: this.setModel.bind(this)
    };
  }

  setStats() {
    this.stats = new Stats();
    document.body.append(this.stats.dom);
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

    try {
      const gltf = await new Promise((resolve, reject) => {
        this.loader.load(MODEL_PATH, resolve, undefined, reject);
      });

      this.model = gltf.scene;

      this.model.traverse((node) => {
        if (node.isMesh && !(node.material instanceof T.MeshBasicMaterial)) {
          node.material = new T.MeshBasicMaterial({
            color: MODEL_COLOR_IF_NO_MATERIAL
          });
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
      this.stats.update();
      const elapsedTime = this.clock.getElapsedTime();
      if (this.model) {
        this.model.position.z = -180 + 4 * Math.sin(elapsedTime);
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
