import * as THREE from "../resources/three.module.js";
import { OrbitControls } from "../resources/examples/jsm/controls/OrbitControls.js";

const vshader = `
    uniform float mRefractionRatio;
		uniform float mFresnelBias;
		uniform float mFresnelScale;
		uniform float mFresnelPower;

    varying vec3 vReflect;
		varying vec3 vRefract;
    varying float fresnelFactor;


    void main() {

			vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );

      vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
      
      //calculate incidence direction
			vec3 I = worldPosition.xyz - cameraPosition;

      //calculate reflected light
      vReflect = reflect( I, worldNormal );
      
      //calculate refracted light
      vRefract = refract( normalize( I ), worldNormal, mRefractionRatio );
      
      //calculate fresnel effect
      float vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), mFresnelPower );
      fresnelFactor = max(0.0,min( vReflectionFactor, 1.0));

			gl_Position = projectionMatrix * mvPosition;
 
		}


`;
const fshader = `
    uniform samplerCube tCube;

		varying vec3 vReflect;
		varying vec3 vRefract;
    varying float fresnelFactor;

    void main() {

      //sample from skybox texture
      vec4 reflectedColor = textureCube( tCube, vReflect );
     
			vec4 refractedColor = vec4( 1.0 );
      refractedColor.rgb = textureCube( tCube,  vRefract ).rgb;
      
      gl_FragColor = reflectedColor;
    
      gl_FragColor = mix( refractedColor, reflectedColor, fresnelFactor );

		}
`;

const main = () => {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas });
  const scene = new THREE.Scene();

  //set up camera
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    100000
  );
  camera.position.z = 3200;

  //set up orbitcontrol

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.update();

  {
    //load and create skybox
    const urls = [
      "../skybox/right.png",
      "../skybox/left.png",
      "../skybox/top.png",
      "../skybox/bottom.png",
      "../skybox/front.png",
      "../skybox/back.png",
    ];

    const textureCube = new THREE.CubeTextureLoader().load(urls);
    scene.background = textureCube;

    //create shader material and apply to geometry

    const uniforms = {
      mRefractionRatio: { value: 1.2 },
      mFresnelBias: { value: 0.1 },
      mFresnelPower: { value: 1.0 },
      mFresnelScale: { value: 1.0 },
      tCube: { value: textureCube },
    };

    const geometry = new THREE.SphereBufferGeometry(100, 32, 16);
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vshader,
      fragmentShader: fshader,
    });

    for (var i = 0; i < 50; i++) {
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = Math.random() * 10000 - 5000;
      mesh.position.y = Math.random() * 10000 - 5000;
      mesh.position.z = Math.random() * 10000 - 5000;

      mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 3 + 1;
      scene.add(mesh);
    }
  }

  const render = () => {
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);

  const resizeRendererToDisplaySize = (renderer) => {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width != width || canvas.height != height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  };
};

main();
