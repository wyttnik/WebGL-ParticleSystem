const bengal_frag =`
#ifdef GL_ES 
precision mediump float;
#endif

uniform vec3 u_color;
uniform sampler2D u_texture;

void main() {
    gl_FragColor = vec4(u_color,1.0)*texture2D(u_texture, gl_PointCoord);
}`;

export default bengal_frag;