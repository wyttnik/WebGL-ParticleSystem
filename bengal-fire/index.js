import bengal_vert from './shaders/sparkVS';
import bengal_frag from './shaders/sparkFS';
import tracksVS from './shaders/tracksVS';
import tracksFS from './shaders/tracksFS';
import spark_texture from "./textures/spark.png";
import * as glm from "gl-matrix";

/** @type {WebGLRenderingContext} */
let gl;

let positionAttributeLocationSpark, textureLocationSpark, pMatrixUniformLocationSpark,
mvMatrixUniformLocationSpark, positionAttributeLocationTrack, colorAttributeLocationTrack,
pMatrixUniformLocationTrack, mvMatrixUniformLocationTrack, pMatrix, mvMatrix,programSpark,
programTrack, sparks, texture;

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
    programSpark = initShaderProgram(bengal_vert, bengal_frag);
    positionAttributeLocationSpark = gl.getAttribLocation(programSpark, "a_position");
    textureLocationSpark = gl.getUniformLocation(programSpark, "u_texture");
    pMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_pMatrix");
    mvMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_mvMatrix");

    // инициализация программы следов искр
    programTrack = initShaderProgram(tracksVS, tracksFS);
    positionAttributeLocationTrack = gl.getAttribLocation(programTrack, "a_position");
    colorAttributeLocationTrack = gl.getAttribLocation(programTrack, "a_color");
    pMatrixUniformLocationTrack = gl.getUniformLocation(programTrack, "u_pMatrix");
    mvMatrixUniformLocationTrack = gl.getUniformLocation(programTrack, "u_mvMatrix");
    
    // количество искр
    Spark.sparksCount = 200;
    sparks = [];
    for (let i = 0; i < Spark.sparksCount; i++) {
        sparks.push(new Spark());
    }

    setupInitTextures();
}

function initProjMatrix() {
    const proj = glm.mat4.create();
    glm.mat4.perspective(proj,  Math.PI / 4, 
      gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
    return proj;
    //gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram,"uProj"),false,proj)
}

function initModelMatrix(){
    const model = glm.mat4.create();
    glm.mat4.translate(model,model,[0,0,-3]);
    return model;
}

function drawScene(now){
    gl.viewport(0,0,gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);

    for (let i = 0; i < sparks.length; i++) {
        sparks[i].move(now);
        //console.log(sparks[i].trail)
    }

    const positions = [];
    sparks.forEach(function(item, i, arr) {
        positions.push(item.x);
        positions.push(item.y);
        // искры двигаются только в одной плоскости xy
        positions.push(0);
    });
    //console.log(positions);

    drawTracks(positions, programTrack);
    drawSparks(positions, programSpark);

    requestAnimationFrame(drawScene);
}

function drawTracks(positions, shaderProgram) {
    gl.useProgram(shaderProgram);

    const colors = [];
    const positionsFromCenter = [];
    for (let i = 0; i < positions.length; i += 3) {
        // для каждой координаты добавляем точку начала координат, чтобы получить след искры
        positionsFromCenter.push(0,0,0);
        //console.log(pos);
        positionsFromCenter.push(positions[i], positions[i + 1], positions[i + 2]);
        // цвет в начале координат будет белый (горячий), а дальше будет приближаться к оранжевому
        colors.push(1, 1, 1, 0.47, 0.31, 0.24);
    }

    gl.uniformMatrix4fv(pMatrixUniformLocationTrack, false, pMatrix);
    gl.uniformMatrix4fv(mvMatrixUniformLocationTrack, false, mvMatrix);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsFromCenter), gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionAttributeLocationTrack, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttributeLocationTrack);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    gl.vertexAttribPointer(colorAttributeLocationTrack, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorAttributeLocationTrack);

    gl.drawArrays(gl.LINES, 0, positionsFromCenter.length / 3);
}

function drawSparks(positions, shaderProgram) {
    gl.useProgram(shaderProgram);

    gl.uniformMatrix4fv(pMatrixUniformLocationSpark, false, pMatrix);
    gl.uniformMatrix4fv(mvMatrixUniformLocationSpark, false, mvMatrix);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(textureLocationSpark, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.vertexAttribPointer(positionAttributeLocationSpark, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(positionAttributeLocationSpark);

    gl.drawArrays(gl.POINTS, 0, positions.length / 3);
}

function setupInitTextures() {
    texture = gl.createTexture(); 
    var image = new Image(); 
    image.crossOrigin= "anonymous"; 
    image.src= spark_texture; 
    image.addEventListener('load', function() { 
        gl.bindTexture(gl.TEXTURE_2D, texture); 
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); 
        gl.generateMipmap(gl.TEXTURE_2D); 
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); 
        gl.bindTexture(gl.TEXTURE_2D, null); 
        // отрисовку сцены начинаем только после загрузки изображения
        requestAnimationFrame(drawScene); 
    });
}

function setupWebGL() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.enable(gl.DEPTH_TEST)
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
    return shaderProgram;
    //gl.useProgram(shaderProgram)
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

        // задаём направление полёта искры в градусах, от 0 до 360
        const angle = Math.random() * 360;
        // радиус - это расстояние, которое пролетит искра
        const radius = Math.random();
        // отмеряем точки на окружности - максимальные координаты искры
        this.xMax = Math.cos(angle) * radius;
        this.yMax = Math.sin(angle) * radius;

        // dx и dy - приращение искры за вызов отрисовки, то есть её скорость,
        // у каждой искры своя скорость. multiplier подобран экспериментально
        const multiplier = 125 + Math.random() * 125;
        this.dx = this.xMax / multiplier;
        this.dy = this.yMax / multiplier;

        // Для того, чтобы не все искры начинали движение из начала координат,
        // делаем каждой искре свой отступ, но не более максимальных значений.
        this.x = (this.dx * 10) % this.xMax;
        this.y = (this.dy * 10) % this.yMax;
    };

    Spark.prototype.move = function(time) {
        // находим разницу между вызовами отрисовки, чтобы анимация работала
        // одинаково на компьютерах разной мощности
        const timeShift = time - this.timeFromCreation;
        this.timeFromCreation = time;
        // приращение зависит от времени между отрисовками
        const speed = timeShift;
        this.x += this.dx * speed;
        this.y += this.dy * speed;

        // если искра достигла конечной точки, запускаем её заново из начала координат
        if (Math.abs(this.x) > Math.abs(this.xMax) || Math.abs(this.y) > Math.abs(this.yMax)) {
            this.init();
            return;
        }
    };

    this.init();
};