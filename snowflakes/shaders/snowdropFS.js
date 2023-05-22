const snowdropFS =`
#ifdef GL_ES 
precision highp float;
#endif

uniform sampler2D u_texture0, u_texture1, u_texture2, u_texture3, u_texture4;
uniform vec3 u_color;
varying float v_texture;

void main() {
    vec4 texture;
    if (v_texture == 0.0) texture = texture2D(u_texture0, gl_PointCoord);
    else if (v_texture == 1.0) texture = texture2D(u_texture1, gl_PointCoord);
    else if (v_texture == 2.0) texture = texture2D(u_texture2, gl_PointCoord);
    else if (v_texture == 3.0) texture = texture2D(u_texture3, gl_PointCoord);
    else texture = texture2D(u_texture4, gl_PointCoord);

    gl_FragColor = vec4(u_color,1.0)*texture;
}`;

export default snowdropFS;