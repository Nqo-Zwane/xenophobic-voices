#include ./includes/simplex3Dnoise.glsl;
#include <packing>

varying vec2 vUv;
uniform float time;
uniform float cameraNear;
uniform float cameraFar;
varying float vDepth;
uniform sampler2D depthInfo;
attribute float y;

float readDepth( sampler2D depthSampler, vec2 coord ) {
  float fragCoordZ = texture2D( depthSampler, coord ).x;
  float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
  return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}
void main() {
  vUv = uv;
  vec2 vUv1 = vec2(vUv.x, y);
  
  
  float depth = readDepth( depthInfo, vUv1 );
  vec3 pos = position;
  pos.z += (1.0 - depth);
  pos.y += 0.02*snoise(vec3(vUv1*30.0, time));
  vDepth = depth;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}