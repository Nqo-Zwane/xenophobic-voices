import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import Three from '../src/js/three';

describe('Three Class', () => {
  let three;
  let canvas;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    document.body.append(canvas);
    three = new Three(canvas);
  });

  afterEach(() => {
    canvas.remove();
    three = undefined;
  });

  test('should initialize with default values', () => {
    expect(three.canvas).toBe(canvas);
    expect(three.scene).toBeInstanceOf(T.Scene);
    expect(three.camera).toBeInstanceOf(T.PerspectiveCamera);
    expect(three.renderer).toBeInstanceOf(T.WebGLRenderer);
    expect(three.controls).toBeInstanceOf(OrbitControls);
  });

  test('should set up ambient light in setLights', () => {
    three.setLights();
    expect(three.scene.children).toHaveLength(1); // only the ambient light
    expect(three.ambientLight).toBeInstanceOf(T.AmbientLight);
  });

  test('should update camera aspect ratio and size on window resize', () => {
    const newWidth = 800;
    const newHeight = 600;
    window.innerWidth = newWidth;
    window.innerHeight = newHeight;

    three.onResize();

    expect(three.camera.aspect).toBe(newWidth / newHeight);
    expect(three.renderer.size.width).toBe(newWidth);
    expect(three.renderer.size.height).toBe(newHeight);
  });
});
