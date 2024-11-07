import Stats from 'stats.js';
import * as T from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

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
      FBO: this.FBOTarget
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

  setGeometry(
    gridSize = 100,
    planeHeight = 0.008,
    planeWidth = 5,
    divisions = 50
  ) {
    try {
      this.planeMaterial = new T.ShaderMaterial({
        side: T.DoubleSide,
        wireframe: true,
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

      this.planeMesh.rotation.x = 0.2 * elapsedTime;
      this.planeMesh.rotation.y = 0.1 * elapsedTime;

      requestAnimationFrame(this.render.bind(this));
      this.renderer.setRenderTarget(this.FBOTarget);
      this.renderer.render(this.scene, this.depthCamera);

      this.planeMaterial.uniforms.time.value = elapsedTime;
      this.planeMaterial.uniforms.depthInfo.value = this.target.depthTexture;

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
