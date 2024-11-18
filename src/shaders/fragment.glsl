#include <packing>
varying float vDepth;

void main() {
  float tomix = smoothstep(0.2, 1.0, vDepth);
  gl_FragColor.rgb = mix(vec3(0.495, 0.165, 0.234), vec3(0.000, 0.001, 0.242), tomix);

	gl_FragColor.a = 1.0;
}