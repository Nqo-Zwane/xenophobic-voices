import { expect, test } from '@playwright/test';
import * as T from 'three';

test('Three.js scene should load with correct objects', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const canvas = await page.locator('canvas');
  await expect(canvas).toBeVisible();

  const contextType = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgl');
    return context ? 'webgl' : undefined;
  });
  expect(contextType).toBe('webgl');

  const meshExists = await page.evaluate(() => {
    const scene = window.three.scene;
    return scene.children.some((child) => child instanceof T.Mesh);
  });
  expect(meshExists).toBe(true);
});

test('Three.js camera should have default position', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const cameraPosition = await page.evaluate(() => {
    const camera = window.three.camera;
    return camera.position;
  });

  expect(cameraPosition.x).toBeCloseTo(0);
  expect(cameraPosition.y).toBeCloseTo(0);
  expect(cameraPosition.z).toBeCloseTo(5);
});

test('Three.js scene should resize correctly', async ({ page }) => {
  await page.goto('http://localhost:3000');

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
});
