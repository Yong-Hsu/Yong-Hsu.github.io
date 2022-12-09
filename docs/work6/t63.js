console.trace("Started");

/** @type {WebGLRenderingContext} */
var gl;
var program;

// initial vertices 
var pointsArray = [];
var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);
// lighting information
var normalsArray = [];

// subdivision level of the sphere
var divisionLevel = 1;

// light information
var lightPos = vec4(-1.0, 0.0, -1.0, 0, 0);
var emission_le = vec3(1.0, 1.0, 1.0);
var diffuse_kd = vec3(0.7, 0.7, 0.7); // diffuse reflection coefficient

var ambient_la = vec3(0.2, 0.2, 0.2);

// animation effect
var isOrbit = true;
var radius = 3;
var alpha = 0;
var eye = vec3(radius * Math.sin(alpha), 0.0, radius * Math.cos(alpha));
var up, at, V, viewMatrixLoc;

init();
function init() {
	const toggleOrbit = document.getElementById('orbit');

	const canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas);
	gl.enable(gl.DEPTH_TEST);
	// gl.enable(gl.CULL_FACE);
	// todo: does it depend on where I view the object

	// setup
	gl.viewport(0.0, 0.0, canvas.width, canvas.height);
	gl.clearColor(0.1, 0.1, 0.1, 1.0);
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// m0del matrix
	// M  = transform(0, [1, 1, 1], [1, 1, 1], [0.0, 0.0, 0.0]);
	M = mat4();
	// view matrix
	at = vec3(0, 0, 0);
	up = vec3(0.0, 1.0, 0.0);
	V = lookAt(eye, at, up);
	// projection matrix
	var P = perspective(45, 1, 0.1, 4);

	// pass matrices 
	var modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(M));
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(V));
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(P));

	// pass lighting parameters
	var lightPosLoc = gl.getUniformLocation(program, "lightPos");
	var emission_leLoc = gl.getUniformLocation(program, "emission_le");
	var diffuse_kdLoc = gl.getUniformLocation(program, "diffuse_kd");
	var ambient_laLoc = gl.getUniformLocation(program, "ambient_la");
	gl.uniform4fv(lightPosLoc, flatten(lightPos));
	gl.uniform3fv(emission_leLoc, flatten(emission_le));
	gl.uniform3fv(diffuse_kdLoc, flatten(diffuse_kd));
	gl.uniform3fv(ambient_laLoc, flatten(ambient_la));

	// tentrahendron drawing 
	gl.vBuffer = null;
	gl.nBuffer = null;
	initSphere(divisionLevel = 6);


	// load local images
	var image = document.createElement('img');
	image.crossorigin = 'anonymous';
	image.onload = function () {
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		// gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		// todo : why using mag and min together
	};
	image.src = '../res/earth.jpg';
	
	gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

	toggleOrbit.addEventListener("click", function () {
		isOrbit = !isOrbit;
		render();
	});

	setTimeout(() => {
		render();
	}, 600);
}

function render() {
	if (isOrbit) {
		setTimeout(() => {
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			alpha += 0.02;
			V = lookAt(eye, at, up);
			eye = vec3(radius * Math.sin(alpha), 0.0, radius * Math.cos(alpha));

			gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(V));
			gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length)
			requestAnimationFrame(render);
		}, 12);
	} else {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
	}
}

function initSphere(numSubdivs) {
	tetrahedron(va, vb, vc, vd, numSubdivs);

	gl.deleteBuffer(gl.vBuffer);
	gl.deleteBuffer(gl.nBuffer);

	gl.vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
	var vPosition = gl.getAttribLocation(program, 'vPosition');
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	// give errors if shader is not using the attributes
	gl.nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.nBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
	var vNormal = gl.getAttribLocation(program, 'vNormal');
	gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);
	// https://stackoverflow.com/questions/3665671/is-vertexattribpointer-needed-after-each-bindbuffer
}

function tetrahedron(v1, v2, v3, v4, numSubdivs) {
	if (numSubdivs == 0) {
		push_triangle(v1, v2, v3);
		push_triangle(v1, v4, v2);
		push_triangle(v1, v3, v4);
		push_triangle(v2, v3, v4);
	} else {
		divideTriangle(v1, v2, v3, numSubdivs);
		divideTriangle(v1, v4, v2, numSubdivs);
		divideTriangle(v1, v3, v4, numSubdivs);
		divideTriangle(v2, v3, v4, numSubdivs);
	}
}

function divideTriangle(v1, v2, v3, numSubdivs) {
	var v12 = normalize(scale(0.5, add(v1, v2)), true);
	var v23 = normalize(scale(0.5, add(v2, v3)), true);
	var v31 = normalize(scale(0.5, add(v3, v1)), true);

	push_triangle(v1, v12, v31);
	push_triangle(v12, v23, v31);
	push_triangle(v12, v2, v23);
	push_triangle(v31, v23, v3);

	if (numSubdivs - 1 != 0) {
		divideTriangle(v1, v12, v31, numSubdivs - 1);
		divideTriangle(v12, v23, v31, numSubdivs - 1);
		divideTriangle(v12, v2, v23, numSubdivs - 1);
		divideTriangle(v31, v23, v3, numSubdivs - 1);
	}
}

function push_triangle(v1, v2, v3) {
	pointsArray.push(v1, v2, v3);
	normalsArray.push(v1, v2, v3);
}

function transform(angle, direction, s, t) {
	var R = rotate(angle, direction);
	var Rx = rotateX(angle);
	var Ry = rotateY(angle);
	var Rz = rotateZ(angle);
	var T = translate(t[0], t[1], t[2]);
	var S = scalem(s[0], s[1], s[2]);

	return mult(mult(T, R), S);
}