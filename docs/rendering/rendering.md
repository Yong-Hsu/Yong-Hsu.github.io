*s220058 Yang Xu
## Table of Contents
1. [Worksheet 1 - Ray Casting](#worksheet-1)
1. [Worksheet 2 - Ray-Object Intersection and Shading Diffuse Surfaces](#worksheet-2)
1. [Worksheet 3 - texture](#worksheet-3)
1. [Worksheet 4 - Triangle Meshes and Smooth Shading](#worksheet-4)
1. [Worksheet 5](#worksheet-5)
1. [Worksheet 6](#worksheet-6)
1. [Worksheet 7](#worksheet-7)
1. [Worksheet 8](#worksheet-8)
1. [Worksheet 9](#worksheet-9)
1. [Worksheet 10](#worksheet-10)

<!--  
all the deliverables listed in the worksheets. 
relevant code snippets, 
rendered images, 
answers to the occasional questions in the worksheets. 
-->

<!-- ----------------------------------------------------------------------------------------------------------- -->
## Worksheet 1
---
| ![preview](res/w1-preview.png) | ![flat](/res/w1-flat.png) | ![diffuse shade](/res/w1-diffuse_shade.png) |
|:--:|:--:|:--:|
| <b>Fig.1 Preview</b> | <b>Fig.2 flat reflectance shading</b> | <b>Fig.3 Diffuse shading</b> |

As shown in Fig.1-3, ray generation, ray-object intersection and shading of diffuse surfaces all work as expected. Below are some relevant code snippets.


```cpp
float3 RayCaster::compute_pixel(unsigned int x, unsigned int y) const {
  Ray ray = scene -> get_camera() -> get_ray(make_float2(x, y) * win_to_ip + lower_left);
  HitInfo hit;

  if (scene -> closest_hit(ray, hit)) {
    return get_shader(hit) -> shade(ray, hit);
  } else {
    return get_background();
  }
}
```

```cpp
bool Triangle::intersect(const Ray& r, HitInfo& hit, unsigned int prim_idx) const {
  const float3 v0_minus_0 = v0 - r.origin;
  const float3 normal = cross((v1 - v0), (v2 - v0));
  const float omega_mul_n = dot(r.direction, normal);

  const float beta = dot(cross(v0_minus_0, r.direction), (v2 - v0)) / omega_mul_n;
  const float gamma = -dot(cross(v0_minus_0, r.direction), (v1 - v0)) / omega_mul_n;

  if (beta >= 0 && gamma >= 0 && beta + gamma <= 1) {
    const float t = dot(v0_minus_0, normal) / omega_mul_n;
    if (t > r.tmin && t < r.tmax) {
      hit.has_hit = true;
      hit.dist = t;
      hit.position = r.origin + t * r.direction;
      hit.shading_normal = normal;
      hit.geometric_normal = normal;
      hit.material = &material;
      return true;
    }
  }
  return false;
}
```

```cpp
float3 Lambertian::shade(const Ray& r, HitInfo& hit, bool emit) const {
  const float3 rho_d = get_diffuse(hit);
  float3 result, dir, L = make_float3(0.0f);

  for (int i = 0; i < lights.size(); i++) {
    if (lights[i]->sample(hit.position, dir, L)) {
      const float cos_angle = dot(hit.shading_normal, dir);
      if (cos_angle > 0)    result += rho_d * M_1_PIf * L * cos_angle;
    }
  }
  return result + Emission::shade(r, hit, emit);
}
```



<!-- ----------------------------------------------------------------------------------------------------------- -->
## Worksheet 2

<!-- 
shading of diffuse objects, mirror ball, glass ball, Phong ball, and glossy ball
Include relevant code snippets. Explain the helper function  and your final glossy shader (Glossy::shade).
-->

| ![diffuse shade](/res/w1-diffuse_shade.png) | ![mirror shading](/res/mirror.png) | ![Glass ball](/res/glass.png) |
|:--:|:--:|:--:|
| <b>Fig.4 Diffuse shading</b> | <b>Fig.5 Mirror ball</b> | <b>Fig.6 Glass ball</b> |

| ![Phong ball](/res/phong.png) | ![Glossy ball](/res/glossy.png) | 
|:--:|:--:|
| <b>Fig.7 Phong ball</b> | <b>Fig.8 Glossy ball</b> |

```cpp
float3 Glossy::shade(const Ray& r, HitInfo& hit, bool emit) const
{
  if (hit.trace_depth >= max_depth)
    return make_float3(0.0f);

  float R;
  Ray reflected, refracted;
  HitInfo hit_reflected, hit_refracted;
  tracer -> trace_reflected(r, hit, reflected, hit_reflected);
  tracer -> trace_refracted(r, hit, refracted, hit_refracted, R);

  return R * shade_new_ray(reflected, hit_reflected) + (1.0f - 2*R) * shade_new_ray(refracted, hit_refracted) + R * Phong::shade(r, hit, emit);
}
```
This function above calculates three parts: the reflection of a mirror ball, the refraction of a transparent ball and the highlight of phong model. All the shading are then weighted averaged.

The function `get_ior_out` is used to calculate the Refractive index of the material. if the ray hits the material from outside, then the normal is reversed for later calculation and the ior returned is the Refractive index of air, 1.0. Otherwise the material's Refractive index is returned.

```cpp
bool RayTracer::trace_reflected(const Ray& in, const HitInfo& in_hit, Ray& out, HitInfo& out_hit) const
{
  const float3 w_in = -normalize(in.direction);
  const float3 normal = in_hit.geometric_normal;

  const float cos = dot(w_in, normal);
  if (in_hit.has_hit) {

    out.direction = 2.0f * cos * normal - w_in;
    out.origin = in_hit.position;
    out.tmax = RT_DEFAULT_MAX;
    out.tmin = 1e-3;

    out_hit.ray_ior = in_hit.ray_ior;
    out_hit.trace_depth = in_hit.trace_depth + 1;
    
    return trace_to_closest(out, out_hit);
  } else  return false;
}

bool RayTracer::trace_refracted(const Ray& in, const HitInfo& in_hit, Ray& out, HitInfo& out_hit) const
{
  const float3 w_in = -normalize(in.direction);
  const float w_mul_n = dot(w_in, in_hit.geometric_normal);

  const bool refract_test = optix::refract(out.direction, in.direction, in_hit.geometric_normal, in_hit.ray_ior);

  if (in_hit.has_hit && refract_test) {
    out.origin = in_hit.position;
    out.tmax = RT_DEFAULT_MAX;
    out.tmin = 1e-3;

    out_hit.ray_ior = in_hit.ray_ior;
    out_hit.trace_depth = in_hit.trace_depth + 1;

    return trace_to_closest(out, out_hit);
  }

  return false;
}
```
```cpp
float3 Phong::shade(const Ray& r, HitInfo& hit, bool emit) const
{
  float3 rho_d = get_diffuse(hit);
  float3 rho_s = get_specular(hit);
  float s = get_shininess(hit);

  float3 dir, L, result = make_float3(0);
  const float3 coef_1 = rho_d * M_1_PIf;
  const float3 coef_2 = rho_s * M_1_PIf * (s + 2) / 2;
  const float3 w_r = r.direction - 2 * dot(r.direction, hit.shading_normal) * hit.shading_normal;
  const float3 w_0 = normalize(r.origin - hit.position);

  for (int i = 0; i < lights.size(); i++) {
    if (lights[i]->sample(hit.position, dir, L)) {
      const float angle = dot(dir, hit.shading_normal);
      if (angle > 0)
        result += (coef_1 + coef_2 * pow(fmax(dot(dir, w_r), 0.0), s)) * L * angle;
    }
  }

  return result + Emission::shade(r, hit, emit);
}
```




<!-- ----------------------------------------------------------------------------------------------------------- -->
## Worksheet 3

<!-- 
Renderings of the default scene with a textured plane 
(e.g. using look-up of nearest texel, 
bilinear magnification filtering,
and using nearest texel or bilinear filtering with a 10-fold magnified texture). 
Rendering of the default scene with a different choice of texture. 
In addition, provide the explanations and comparisons mentioned above. 
Include relevant code snippets. Please insert all this into your lab journal. -->
<!-- Explain how texture colour is used in a rendering. Look at the functions in the file Textured.cpp and consider how these functions are used in the shade functions in Emission.h and Lambertian.cpp. -->


> In the function `get_emission`, if the texture is not set, then it goes to the function `get_emmision` in `Emission.h`, which will return the material's ambient color; Then if there is a texture loaded, the emission will be reduced by being divided by the diffuse parameter of the material. And it will be multiplied with texture color linealy sampled. The reason of the division is that it can balance the overall color of direct and indirect lighting, while this part still requires more thoughts.
> 
> In the function `get_diffuse`, if the texture is not set, the material's diffuse value will be returned. If the texture is loaded, the linearly sampled texture color is returned. Then both two of these functions will return value to `Emission.h` and `Lambertian.cpp`.

| ![preview](res/uv-preview.png) | ![nearest](/res/nearest.png) | ![bilinear](/res/bilinear.png) |
|:--:|:--:|:--:|
| <b>Fig.9 Preview</b> | <b>Fig.10 look-up of nearest</b> | <b>Fig.11 bilinear filter</b> |
| ![bilinear-10](res/bilinear-10.png) | ![stone1](/res/stone1.png) | ![stone2](/res/stone2.png) |
| <b>Fig.12 bilinear 10-fold</b> | <b>Fig.13 another texture-1</b> | <b>Fig.14 another texture-2</b> |

*texture source: https://www.textures.com/download/PBR1079/143527*

> Compared to preview, the nearest sampler makes the texture more clear as it chooses the color for every oixel.
> 
> Compared to nearest sampler, the linear look-up smooth the textures, scaling the textures would cause those close to the eye position to sample more densely. A bigger local patch of pixels would choose close colors, which is not perfect for grassland.

```cpp
void Plane::get_uv(const float3& hit_pos, float& u, float& v) const 
{ 
  // x = x0 + u~b1 + v~b2,
  // u = b1(x-x0)
  // v = b2(x-x0)
  u = dot(get_tangent(), hit_pos - get_origin()) * tex_scale;
  v = dot(get_binormal(), hit_pos - get_origin()) * tex_scale;
}
```

```cpp
float4 Texture::sample_nearest(const float3& texcoord) const
{
  if(!fdata)
    return make_float4(0.0f);

  const float s = texcoord.x - floor(texcoord.x);
  const float t = texcoord.y - floor(texcoord.y);
   
  const float a = s * width;
  const float b = t * height;

  const int U = static_cast <int>  (a + 0.5f) % width;
  const int V = static_cast <int>  (b + 0.5f) % height;
  const int i = U + (height - V - 1) * width;

  return fdata[i];
}

float4 Texture::sample_linear(const float3& texcoord) const
{
  if(!fdata)
    return make_float4(0.0f);

  const float s = texcoord.x - floor(texcoord.x);
  const float t = texcoord.y - floor(texcoord.y);

  const float a = s * width;
  const float b = t * height;

  const int U = static_cast <int> (a);
  const int V = static_cast <int> (b);
  const float c1 = a - U;
  const float c2 = b - V;

  const int i00 = U + (height - V - 1) * width;
  const int i01 = U + (height - (V + 1) % height - 1) * width;
  const int i10 = (U + 1) % width + (height - V - 1) * width;
  const int i11 = (U + 1) % width + (height - (V + 1) % height - 1) * width;

  return bilerp(fdata[i00], fdata[i01], fdata[i10], fdata[i11], c1, c2);
}
```



<!-- ----------------------------------------------------------------------------------------------------------- -->
## Worksheet 4
<!-- Renderings of the Cornell box, the Utah teapot, and the Stanford bunny. 
Also provide the explanations, comparisons, and performance measurements mentioned above. Include relevant code snippets. Please insert all this into your lab journal. -->


| ![Cornell](res/4-cornell.png) | ![Teapot](/res/4-teapot.png) | ![bunny](/res/4-bunny.png) |
|:--:|:--:|:--:|
| <b>Fig.15 Cornell Box</b> | <b>Fig.16 Teapot</b> | <b>Fig.17 Stanford bunny</b> |

> The cornell box works well with mesh intersection and arealight implemented. 
> 
> `BspTree.cpp`



<!-- Investigate the implementation of this spatial data structure in BspTree.cpp. 
Explain how it works and modify the functions closest_hit and any_hit 
so that they use the BSP tree instead of the simple looping from Worksheet 1. -->



| Models                  | Number of triangles | Time for looping |  Time for BSP |
|:--:|:--:|:--:|:--:|
| Cornell box and blocks: |36     |0.025s   | 0.01s  |
| Utah teapot:            | 6320  | 5.43s   | 0.019s |
| Stanford bunny          | 69451 | 68.457s | 0.032s |


<!-- Find the speed-up factors and describe the relation between number of triangles and speed-up factors for looping versus axis-aligned BSP tree. -->


```








<!-- ----------------------------------------------------------------------------------------------------------- -->
## Worksheet 5
<!-- ----------------------------------------------------------------------------------------------------------- -->
## Worksheet 6
<!-- ----------------------------------------------------------------------------------------------------------- -->
## Worksheet 7
<!-- ----------------------------------------------------------------------------------------------------------- -->
## Worksheet 8
<!-- ----------------------------------------------------------------------------------------------------------- -->
## Worksheet 9
<!-- ----------------------------------------------------------------------------------------------------------- -->
## Worksheet 10



| ![](/res/) |
|:--:|
| <b>Fig.</b> | 

| ![](res/) | ![](/res/) | ![](/res/) |
|:--:|:--:|:--:|
| <b>Fig.</b> | <b>Fig.</b> | <b>Fig.</b> |


| ![](/res/) | ![](/res/) | 
|:--:|:--:|
| <b>Fig.</b> | <b>Fig.</b> |