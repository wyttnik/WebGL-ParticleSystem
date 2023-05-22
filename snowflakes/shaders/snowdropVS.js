const snowdropVS =`
    attribute vec3 a_position;
    attribute float a_texture;

    uniform mat4 u_mvMatrix;
    uniform mat4 u_pMatrix;

    varying float v_texture;

    void main() {
        vec4 mvp = u_mvMatrix * vec4(a_position, 1.0);
        gl_PointSize = 32.0 / abs(mvp.z);
        gl_Position = u_pMatrix * mvp;
        v_texture = a_texture;
    }
`;

export default snowdropVS;