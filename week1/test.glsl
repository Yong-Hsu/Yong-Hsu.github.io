attribute vec4 vPosition;
varying vec4 fColor;

void main()
{
    // a red, green and blue vertex
    // how this vertex shader and fragment shader interact with each other 
    fColor = vec4((1.0+vPosition.xyz)/2.0, 1.0);
    gl_Position = vPosition;
}