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

        vec3 I = worldPosition.xyz - cameraPosition;

        vReflect = reflect( I, worldNormal );
        vRefract = refract( normalize( I ), worldNormal, mRefractionRatio );
  
        float vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), mFresnelPower );
        fresnelFactor = max(0.0,min( vReflectionFactor, 1.0));
        gl_Position = projectionMatrix * mvPosition;

  }`;

const fshader = `
    uniform samplerCube tCube;

    varying vec3 vReflect;
    varying vec3 vRefract;
    varying float fresnelFactor;

    void main() {

      vec4 reflectedColor = textureCube( tCube, vReflect );

      vec4 refractedColor = vec4( 1.0 );

      refractedColor.rgb = textureCube( tCube, vRefract ).rgb;
  

      gl_FragColor = mix( refractedColor, reflectedColor, fresnelFactor );
  
 
  }`;

const main = () => {
  const canvas = document.querySelector("#c");

  const renderer = new THREE.WebGLRenderer({ canvas });

  // set up camera
  const fov = 45;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 10000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, -200);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.update();

  //set up scene

  const scene = new THREE.Scene();
  let bSphereCamera = new THREE.CubeCamera(0.1, 500, 1000);
  scene.add(bSphereCamera);

  //add a ambient light

  {
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);

    scene.add(light);
  }

  //load and creat skybox

  {
    const skyLoader = new THREE.CubeTextureLoader();
    const texture = skyLoader.load([
      "../skybox-2/BrightMorning01_LF.png",
      "../skybox-2/BrightMorning01_RT.png",
      "../skybox-2/BrightMorning01_UP.png",
      "../skybox-2/BrightMorning01_DN.png",
      "../skybox-2/BrightMorning01_FR.png",
      "../skybox-2/BrightMorning01_BK.png",
    ]);
    scene.background = texture;
  }

  // -----------------------------------------

  {
    const cubeSize = 25;
    const cubeGeo = new THREE.BoxBufferGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMat = new THREE.MeshPhongMaterial({ color: "#8AC" });
    const mesh = new THREE.Mesh(cubeGeo, cubeMat);
    mesh.position.set(75, 0, 0);
    scene.add(mesh);
  }

  // ----------------------------------------------------------------------
  {
    let uniforms = {
      mRefractionRatio: { value: 1.02 },
      mFresnelBias: { value: 0.1 },
      mFresnelPower: { value: 2.0 },
      mFresnelScale: { value: 1.0 },
      tCube: { type: "t", value: bSphereCamera.renderTarget },
    };

    // create custom material for the shader

    let customMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vshader,
      fragmentShader: fshader,
    });
    let bSphere = new THREE.Mesh(
      new THREE.SphereGeometry(50, 32, 32),
      customMaterial
    );

    bSphere.position.set(0, 0, 0);
    scene.add(bSphere);
    bSphereCamera.position.set(0, 0, 0);
  }

  //add animation loop

  function render() {
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    bSphereCamera.update(renderer, scene);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  //responsive resize of canvas

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width != width || canvas.height != height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }
};

main();
