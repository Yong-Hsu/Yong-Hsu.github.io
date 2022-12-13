*s220058 Yang Xu; Code repositry*
## Table of Contents
1. [Worksheet 1](#worksheet-1)
1. [Worksheet 2](#worksheet-2)
1. [Worksheet 3](#worksheet-3)
1. [Worksheet 4](#worksheet-4)
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




## Worksheet 2
## Worksheet 3
## Worksheet 4
## Worksheet 5
## Worksheet 6
## Worksheet 7
## Worksheet 8
## Worksheet 9
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