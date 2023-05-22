import bengal_vert from './shaders/sparkVS';
import bengal_frag from './shaders/sparkFS';
import spark_texture from "./textures/fog.png";
import * as glm from "gl-matrix";

/** @type {WebGLRenderingContext} */
let gl;

let positionAttributeLocationSpark, textureLocationSpark, pMatrixUniformLocationSpark,
mvMatrixUniformLocationSpark, pMatrix, mvMatrix, programSpark, sparks, texture, trUniformLoc;

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
    trUniformLoc = gl.getUniformLocation(programSpark, "tr");
    
    // количество искр
    Spark.sparksCount = 20;
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
        drawSparks(sparks[i], programSpark);
    }

    requestAnimationFrame(drawScene);
}

function drawSparks(spark, shaderProgram) {
    const positions = [];
    positions.push(spark.x + spark.offset, spark.y + spark.offset, 0);
    gl.useProgram(shaderProgram);

    gl.uniformMatrix4fv(pMatrixUniformLocationSpark, false, pMatrix);
    gl.uniformMatrix4fv(mvMatrixUniformLocationSpark, false, mvMatrix);
    gl.uniform1f(trUniformLoc, Math.sqrt(spark.x*spark.x + spark.y*spark.y));

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

        this.offset = Math.random()*0.2 - 0.1;
        // задаём направление полёта искры в градусах, от 0 до 360
        const angle = Math.random() * 360;
        // радиус - это расстояние, которое пролетит искра
        const radius = Math.random();
        // отмеряем точки на окружности - максимальные координаты искры
        this.xMax = Math.cos(angle) * radius;
        this.yMax = Math.sin(angle) * radius;

        this.dir = true;
        this.steps = 0;
        // dx и dy - приращение искры за вызов отрисовки, то есть её скорость,
        // у каждой искры своя скорость. multiplier подобран экспериментально
        const multiplier = 6000 + Math.random() * 6000;
        this.dx = this.xMax / multiplier;
        this.dy = this.yMax / multiplier;

        // Для того, чтобы не все искры начинали движение из начала координат,
        // делаем каждой искре свой отступ, но не более максимальных значений.
        this.x = (this.dx * 10) % this.xMax;
        this.y = (this.dy * 10) % this.yMax;
    };

    Spark.prototype.move = function(time) {
        ++this.steps;
        const timeShift = time - this.timeFromCreation;
        this.timeFromCreation = time;
        if (this.dir) {

            this.x += this.dx * timeShift;
            this.y += this.dy * timeShift;
        }
        else {
            this.x -= this.dx * timeShift;
            this.y -= this.dy * timeShift;
        }
        // приращение зависит от времени между отрисовками
        
        // если искра достигла конечной точки, запускаем её заново из начала координат
        if (Math.abs(this.x) > Math.abs(this.xMax) || Math.abs(this.y) > Math.abs(this.yMax)) {
            //this.init();
            this.steps = 0;
            this.dir = !this.dir;
            return;
        }
    };

    this.init();
};