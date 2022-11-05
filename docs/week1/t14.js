console.trace("Started");

var gl;
var theta;
var thetaLoc;
var vertices;

init();

function init() {
	// initialize_the_system
	const canvas = document.getElementById('gl-canvas');
	/** @type {WebGLRenderingContext} */
	gl = WebGLUtils.setupWebGL(canvas); //found in
	
	// 1
	// gl.viewport(0.0, 0.0, canvas.width, canvas.height)
	// gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
	// gl.clear(gl.COLOR_BUFFER_BIT);
	// console.trace("Ended");

	// 2
	if (!gl) {
		alert("WebGL isn't available");
	}
	
	vertices = [
		vec2(0.0, 1.0),
		vec2(1.0, 0.0),
		vec2(-1.0, 0.0),
		vec2(0.0, -1.0)
	];

	// var vertices2 = [
	// 	vec2(0.0, -1.0),
	// 	vec2(0.0, 0.0),
	// 	vec2(1.0, 0.0)
	// ];

	// a rectangular area of the display window
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	// load shaders and initialize attribute buffers
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	// Load the data into the GPU, put data into VBO(vertex buffer object)
	var buffer = gl.createBuffer();
	// gl.ARRAY_BUFFER parameter indicates that the data in the buffer will be vertex attribute data rather than indices to the data
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	// flatten: put the data into types that the GPU needs, put data into the VBO
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

	// Associate out shader variables with our data buffer
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	// must describe the form of the data in the vertex array (gl.vertexAttribPointer), link the shader program with the vertices
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	// We have to enable the vertex attributes that are in the shaders   
	gl.enableVertexAttribArray(vPosition);

	theta = 0.0;
	thetaLoc = gl.getUniformLocation(program, "theta");
	
	render();
}

function render()
{	
	setTimeout(() => {
		// give color to the frame
		gl.clear(gl.COLOR_BUFFER_BIT);
		theta += 0.05;
		gl.uniform1f(thetaLoc, theta);
		// display the vertices after those data has been on the GPU
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length);
		// or TRIANGLES with 6 points in vertices

		requestAnimationFrame(render);
	}, 12);
}