import { expect, test } from '@playwright/test';
import * as T from 'three';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
});

test('Three.js scene should have a canvas element named "canvas"', async ({
  page
}) => {
  const canvas = await page.locator('canvas');
  await expect(canvas).toBeVisible();
  expect(await canvas.count()).toBeGreaterThan(0);

  const canvasId = await canvas.getAttribute('id');
  expect(canvasId).toBe('canvas');
});

test('Three.js scene should load with correct objects', async ({ page }) => {
  const canvas = await page.locator('canvas');
  await expect(canvas).toBeVisible();

  const contextType = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const context =
      canvas.getContext('webgl2') || canvas.getContext('experimental-webgl');

    return context ? 'webgl' : undefined;
  });

  expect(contextType).toBe('webgl');

  const meshExists = await page.evaluate(() => {
    const scene = window.three.scene;
    return (
      scene &&
      scene.children.some((child) => child instanceof window.three.three.Mesh)
    );
  });
  expect(meshExists).toBe(true);
});

test('Three.js camera should have default position', async ({ page }) => {
  const cameraPosition = await page.evaluate(() => {
    const camera = window.three.camera;
    return camera.position;
  });

  expect(cameraPosition.x).toBeCloseTo(0);
  expect(cameraPosition.y).toBeCloseTo(0);
  expect(cameraPosition.z).toBeCloseTo(2);
});

test('Three.js scene should resize correctly', async ({ page }) => {
  const initialWidth = await page
    .locator('canvas')
    .boundingBox()
    .then((box) => box.width);
  const initialHeight = await page
    .locator('canvas')
    .boundingBox()
    .then((box) => box.height);

  await page.setViewportSize({ width: 800, height: 600 });

  await page.waitForTimeout(100);

  const newWidth = await page
    .locator('canvas')
    .boundingBox()
    .then((box) => box.width);
  const newHeight = await page
    .locator('canvas')
    .boundingBox()
    .then((box) => box.height);

  expect(newWidth).toBe(800);
  expect(newHeight).toBe(600);
  expect(newWidth).not.toBe(initialWidth);
  expect(newHeight).not.toBe(initialHeight);
});
test('getFBO should return a WebGLRenderTarget instance', async ({ page }) => {
  const isFBOInstance = await page.evaluate(() => {
    const target = window.three.FBO;
    return target instanceof window.three.three.WebGLRenderTarget
      ? true
      : false;
  });

  expect(isFBOInstance).not.toBeNull();
  expect(isFBOInstance).toBe(true);
});
