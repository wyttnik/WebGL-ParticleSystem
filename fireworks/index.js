import bengal_vert from './shaders/sparkVS';
import bengal_frag from './shaders/sparkFS';
import tracksVS from './shaders/tracksVS';
import tracksFS from './shaders/tracksFS';
import spark_list from "./textures/*";
import * as glm from "gl-matrix";

/** @type {WebGLRenderingContext} */
let gl;

let positionAttributeLocationSpark, textureLocationSpark, pMatrixUniformLocationSpark,
mvMatrixUniformLocationSpark, positionAttributeLocationTrack, colorAttributeLocationTrack,
pMatrixUniformLocationTrack, mvMatrixUniformLocationTrack, pMatrix, mvMatrix,programSpark,
programTrack, texture1,texture2,texture3, fireworks = [],colorUniformLocationSpark;

let firstTime = true;

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
    colorUniformLocationSpark = gl.getUniformLocation(programSpark, "u_color");
    pMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_pMatrix");
    mvMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_mvMatrix");

    // инициализация программы следов искр
    programTrack = initShaderProgram(tracksVS, tracksFS);
    positionAttributeLocationTrack = gl.getAttribLocation(programTrack, "a_position");
    colorAttributeLocationTrack = gl.getAttribLocation(programTrack, "a_color");
    pMatrixUniformLocationTrack = gl.getUniformLocation(programTrack, "u_pMatrix");
    mvMatrixUniformLocationTrack = gl.getUniformLocation(programTrack, "u_mvMatrix");
    
    setInterval(_=>{setFirework()},1000);
    setupInitTextures();
    requestAnimationFrame(drawScene);
}

function setFirework(){
    fireworks.push(new FireWork());
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
    glm.mat4.translate(model,model,[0,0,-3.5]);
    return model;
}

function drawScene(now){
    gl.viewport(0,0,gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);

    for (let i = 0; i < fireworks.length; ++i) {
        if (fireworks[i].sparksCount != 0) {
            for (let j = 0; j < fireworks[i].sparks.length; ++j) {
                if (!fireworks[i].sparks[j].end) {
                    fireworks[i].sparks[j].move(now, firstTime);
                    if (fireworks[i].sparks[j].end) 
                        --fireworks[i].sparksCount;
                }
            }
        }
        if (fireworks[i].sparksCount != 0){
            drawTracks(fireworks[i], programTrack);
            drawSparks(fireworks[i], programSpark);
        }
        else {
            fireworks.splice(i,1);
            --i;
        }
    }
    firstTime = false;

    requestAnimationFrame(drawScene);
    
    
}

function drawTracks(firework, shaderProgram) {
    gl.useProgram(shaderProgram);

    const colors = [];
    const positionsFromCenter = [];
    firework.sparks.forEach(spark => {
        if (!spark.end) {
            positionsFromCenter.push(spark.initx+firework.offset,spark.inity+firework.offset,0);
            positionsFromCenter.push(spark.x+firework.offset, spark.y+firework.offset, 0);
            colors.push(1, 1, 1, firework.color[0], firework.color[1], firework.color[2]);
        }
    });

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

function drawSparks(firework, shaderProgram) {
    const positions = [];
    firework.sparks.forEach(spark => {
        if (!spark.end) positions.push(spark.x+firework.offset, spark.y+firework.offset, 0);
    });
    gl.useProgram(shaderProgram);

    gl.uniformMatrix4fv(pMatrixUniformLocationSpark, false, pMatrix);
    gl.uniformMatrix4fv(mvMatrixUniformLocationSpark, false, mvMatrix);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.activeTexture(gl.TEXTURE0);
    
    switch(firework.texture) {
        case 0:
            gl.bindTexture(gl.TEXTURE_2D, texture1);
            break;
        case 1:
            gl.bindTexture(gl.TEXTURE_2D, texture2);
            break;
        case 2:
            gl.bindTexture(gl.TEXTURE_2D, texture3);
            break;
    }
    
    gl.uniform1i(textureLocationSpark, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.vertexAttribPointer(positionAttributeLocationSpark, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(positionAttributeLocationSpark);

    gl.uniform3fv(colorUniformLocationSpark,[firework.color[0], firework.color[1], firework.color[2]]);

    gl.drawArrays(gl.POINTS, 0, positions.length / 3);
}

function setupInitTextures() {
    texture1 = gl.createTexture();
    texture2 = gl.createTexture(); 
    texture3 = gl.createTexture(); 
    handleTextureLoad([
        [spark_list['spark.png'], texture1],
        [spark_list['spark1.png'], texture2],
        [spark_list['spark2.png'], texture3]
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
        gl.bindTexture(gl.TEXTURE_2D, null); 
        if (items.length - 1 == index) requestAnimationFrame(drawScene);
        else handleTextureLoad(items,index+1);
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

function FireWork(){
    FireWork.prototype.init = function() {
        this.sparksCount = Math.round(100+Math.random()*100);
        this.sparks = [];
        for (let i = 0; i < this.sparksCount; i++) {
            this.sparks.push(new Spark());
        }
        this.texture = Math.floor(Math.random()*3);
        this.offset = Math.random()*2-1;
        this.color = [Math.random(),Math.random(),Math.random()];
    }

    this.init();
}

function Spark() {
    Spark.prototype.init = function(firstTimeConfig = false) {
        // время создания искры
        if (!firstTimeConfig) this.timeFromCreation = performance.now();

        const radius = Math.random();
        const multiplier = 1250 + Math.random() * 1250;
        // задаём направление полёта искры в градусах, от 0 до 360
        const angle = Math.random() * 2 * Math.PI;
        
        // радиус - это расстояние, которое пролетит искра
        //const radius = Math.random();
        // отмеряем точки на окружности - максимальные координаты искры
        this.xMax = Math.cos(angle) * (radius);
        this.yMax = Math.sin(angle) * (radius);
        this.step = 0;
        this.end = false;

        // dx и dy - приращение искры за вызов отрисовки, то есть её скорость,
        // у каждой искры своя скорость. multiplier подобран экспериментально
        //const multiplier = 1250 + Math.random() * 1250;
        this.dx = this.xMax / multiplier;
        this.dy = this.yMax / multiplier;

        // Для того, чтобы не все искры начинали движение из начала координат,
        // делаем каждой искре свой отступ, но не более максимальных значений.
        //console.log(radius);
        
        this.x = (this.dx * 10) % this.xMax;
        this.y = (this.dy * 10) % this.yMax;
        this.initx = 0;
        this.inity = 0;
        //console.log(this.x + " " + this.y + "\n" + this.initx + " " + this.inity);
    };

    Spark.prototype.move = function(time,firstTime) {
        ++this.step;
        // находим разницу между вызовами отрисовки, чтобы анимация работала
        // одинаково на компьютерах разной мощности
        const timeShift = time - this.timeFromCreation;
        if (!firstTime) this.timeFromCreation = time;
        // приращение зависит от времени между отрисовками
        const speed = timeShift;
        this.x += this.dx * speed;
        this.y += this.dy * speed;
        if (this.step >= 30){
            this.initx += this.dx * speed;
            this.inity += this.dy * speed;
        }

        // если искра достигла конечной точки, запускаем её заново из начала координат
        if (Math.abs(this.x) > Math.abs(this.xMax) || Math.abs(this.y) > Math.abs(this.yMax)) {
            this.end = true;
            if (firstTime) {
                this.init(true);
                this.move(time, firstTime);
            }
        }
    };

    this.init();
};

