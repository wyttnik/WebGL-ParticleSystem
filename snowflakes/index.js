import snowdropVS from './shaders/snowdropVS';
import snowdropFS from './shaders/snowdropFS';
import snowflakes from "./textures/*";
import * as glm from "gl-matrix";

/** @type {WebGLRenderingContext} */
let gl;

let positionAttributeLocationSpark, pMatrixUniformLocationSpark,
mvMatrixUniformLocationSpark, pMatrix, mvMatrix, programSpark, sparks, 
texture0, texture1, texture2, texture3, texture4,
colorUniformLoc, colors = [0.5,0.5,0.5], dir = true, textureLoc;

main();

function main() {
    gl = document.getElementById("test").getContext("webgl2");

    if (gl === null) {
        alert(
        "Unable to initialize WebGL. Your browser or machine may not support it."
        );
        return;
    }

    setupWebGL();
    pMatrix = initProjMatrix();
    mvMatrix = initModelMatrix();

    // инициализация программы искр
    programSpark = initShaderProgram(snowdropVS, snowdropFS);
    positionAttributeLocationSpark = gl.getAttribLocation(programSpark, "a_position");
    pMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_pMatrix");
    mvMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_mvMatrix");
    textureLoc = gl.getAttribLocation(programSpark, "a_texture");
    colorUniformLoc = gl.getUniformLocation(programSpark, "u_color");
    
    // количество снежинок
    Spark.sparksCount = 1000;
    sparks = [];
    for (let i = 0; i < Spark.sparksCount; i++) {
        sparks.push(new Spark(false));
    }

    setupInitTextures();
}

function initProjMatrix() {
    const proj = glm.mat4.create();
    glm.mat4.perspective(proj,  Math.PI / 10, 
      gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
    return proj;
}

function initModelMatrix(){
    const model = glm.mat4.create();
    glm.mat4.translate(model,model,[0,0,-2.0]);
    return model;
}

function drawScene(now){
    gl.viewport(0,0,gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);

    for (let i = 0; i < sparks.length; ++i) {
        sparks[i].move(now);
    }

    let positions = [];
    let textures = [];
    sparks.forEach(spark => {
        positions.push(spark.x, spark.y, spark.z);
        textures.push(spark.texture);
    });
    drawSparks(positions,textures);

    requestAnimationFrame(drawScene);
}

function drawSparks(positions,textures) {
    const k = 0.001;
    const bound = 0.5;
    if (dir){
        if (colors[0] >= 1){
            if (colors[1] >= 1){
                if (colors[2] >= 1){
                    dir = !dir;
                }
                else colors[2] += k;
            }
            else colors[1] += k;
        }
        else colors[0] += k;
    }
    else{
        if (colors[0] <= bound){
            if (colors[1] <= bound){
                if (colors[2] <= bound){
                    dir = !dir;
                }
                else colors[2] -= k;
            }
            else colors[1] -= k;
        }
        else colors[0] -= k;
    }

    gl.uniformMatrix4fv(pMatrixUniformLocationSpark, false, pMatrix);
    gl.uniformMatrix4fv(mvMatrixUniformLocationSpark, false, mvMatrix);
    gl.uniform3fv(colorUniformLoc,[colors[0], colors[1], colors[2]])
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texture3);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, texture4);
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionAttributeLocationSpark, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttributeLocationSpark);

    const textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STATIC_DRAW);
    gl.vertexAttribPointer(textureLoc, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(textureLoc);
    
    gl.drawArrays(gl.POINTS, 0, positions.length / 3);
}

function setupInitTextures() {
    texture0 = gl.createTexture();
    texture1 = gl.createTexture();
    texture2 = gl.createTexture();
    texture3 = gl.createTexture();
    texture4 = gl.createTexture();
    handleTextureLoad([
        [snowflakes['snowflake1.png'], texture0],
        [snowflakes['snowflake2.png'], texture1],
        [snowflakes['snowflake3.png'], texture2],
        [snowflakes['snowflake4.png'], texture3],
        [snowflakes['snowflake5.png'], texture4]
    ],0);
}
    
function handleTextureLoad(items, index) {
    const bundle = items[index];
    const image = new Image(); 
    image.crossOrigin= "anonymous"; 
    image.src = bundle[0]; 
    image.addEventListener('load', function() { 
        gl.bindTexture(gl.TEXTURE_2D, bundle[1]); 
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); 
        gl.generateMipmap(gl.TEXTURE_2D); 
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); 
        gl.uniform1i(gl.getUniformLocation(programSpark, "u_texture"+index), index);
        gl.bindTexture(gl.TEXTURE_2D, null); 
        
        if (items.length - 1 == index) requestAnimationFrame(drawScene);
        else handleTextureLoad(items,index+1);
    });
}

function setupWebGL() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.depthFunc(gl.LEQUAL)
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
}

function initShaderProgram(vsSource, fsSource) {
    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource)
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource)
  
    // Create the shader program
    const shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)
  
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram)}`)
      return null
    }
    gl.useProgram(shaderProgram);
    return shaderProgram;
}
  
// creates a shader of the given type, uploads the source and compiles it.
function loadShader(type, source) {
    const shader = gl.createShader(type)

    // Send the source to the shader object
    gl.shaderSource(shader, source)

    // Compile the shader program
    gl.compileShader(shader)

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(
        `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
        gl.deleteShader(shader)
        return null
    }

    return shader
}

function Spark() {
    Spark.prototype.init = function() {
        // время создания искры
        this.timeFromCreation = performance.now();
        this.texture = Math.floor(Math.random()*5);
        const boundPoint = initBoundPoint();
        this.x = boundPoint[0];
        this.y = boundPoint[1];
        // console.log("start: " + this.x + " " + this.y)
        this.stat = "anotherOne";
        
        if (this.x == 0.6){
            this.xMax = -0.6;
            this.yMax = Math.random()*1 - 0.5;
        }
        else if (this.x == -0.6) {
            this.xMax = 0.6;
            this.yMax = Math.random()*1 - 0.5;
        }
        else {
            if (this.y == 0.5){
                this.yMax = -0.5;
                this.xMax = Math.random()*1.2 - 0.6;
            }
            else if (this.y == -0.5) {
                this.yMax = 0.5;
                this.xMax = Math.random()*1.2 - 0.6;
            }
        }
        const multiplier = 10000 + Math.random() * 10000;
        this.dx = (this.xMax - this.x) / multiplier;
        this.dy = (this.yMax - this.y) / multiplier;
        this.z = Math.random()*2-1;
    };

    Spark.prototype.move = function(time) {
        const timeShift = time - this.timeFromCreation;
        this.timeFromCreation = time;
        this.x += this.dx * timeShift;
        this.y += this.dy * timeShift;

        // если искра достигла конечной точки, запускаем её заново из начала координат
        if (Math.abs(Math.abs(this.x) - Math.abs(this.xMax)) <= 0.01
         && Math.abs(Math.abs(this.y) - Math.abs(this.yMax)) <= 0.01) {
            this.init();
        }
    };

    this.init();
};

function initBoundPoint(){
    const randomX = Math.floor(Math.random()*3);
    const randomY = Math.floor(Math.random()*2);
    switch(randomX){
        case 0:
            return [-0.6, Math.random()*1 - 0.5];
        case 1:
            if (randomY == 0) return [Math.random()*1.2 - 0.6, -0.5];
            else return [Math.random()*1.2 - 0.6, 0.5];
        case 2:
            return [0.6, Math.random()*1 - 0.5];
    }
}