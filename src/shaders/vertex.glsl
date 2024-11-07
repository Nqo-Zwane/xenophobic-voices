#include ./includes/simplex3Dnoise.glsl;
#include <packing>

varying vec2 vUv;
uniform float time;

void main() {
  vUv = uv;
  vec3 pos = position;
  pos.y += 0.01*snoise(vec3(vUv*30.0, time));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}