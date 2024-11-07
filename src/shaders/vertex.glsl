#include ./includes/simplex3Dnoise.glsl;
#include <packing>

varying vec2 vUv;
uniform float time;
attribute float y;

void main() {
  vUv = uv;
  vec2 vuv1 = vec2(vUv.x, y);
  vec3 pos = position;
  pos.y += 0.02*snoise(vec3(vuv1*30.0, time));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}