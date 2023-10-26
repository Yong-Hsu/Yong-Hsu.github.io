<!-- Rendering of transparent and metal material in cornell box
![preview](resource/box1.png) -->

Rendering of elephant and bunny in optix path tracing framework and cuda, with multiple scattering shader implemented from [Eric Heitz's Research Page (wordpress.com)](https://eheitzresearch.wordpress.com/240-2/)

![flat](resource/box2.png)

Testing of energy conservative for microfacet models.

![flat](resource/box_energy.png)

Rendering of realistic steel bottle from my life:

|![preview](resource/bottle1.jpg) | ![flat](resource/bottle2.png) |  ![flat](resource/bottle3.png) |
|:--:|:--:|:--:|

A more detail look:
![flat](resource/detail1.png)

This comprises several parts to put them together
1. Real life ior values for metal (steel and copper)
2. microfacet models for realistic objects, also with anisotropic parameters.
3. noise functions for varying values of anisotropy.

future plans:
4. scratches and etches with generated normal map

Here lists some experiments images when I was trying to make this work:

|![preview](resource/ball3.png) | ![flat](resource/ball1.png) |  ![flat](resource/bunnym.png) | ![flat](resource/bottle_4.png) |
|:--:|:--:|:--:|:--:|
