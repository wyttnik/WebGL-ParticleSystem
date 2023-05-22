const bengal_frag =`
#ifdef GL_ES 
precision mediump float;
#endif

uniform sampler2D u_texture;
uniform float tr;

void main() {
    gl_FragColor = texture2D(u_texture, gl_PointCoord);
}`;

export default bengal_frag;