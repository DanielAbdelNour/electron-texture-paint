<template>
  <div id="hello"></div>
</template>

<script>
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default {
  name: "HelloWorld",
  data() {
    return {
      sceneCanvas: null,
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
    };
  },
  mounted() {
    /* **************
       BASIC SETUP
    ************** */
    this.sceneCanvas = document.getElementById("hello");
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.camera.position.set(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener("change", this.animateThreeJs);
    this.renderer.setSize(
      this.sceneCanvas.offsetWidth,
      this.sceneCanvas.offsetHeight
    );
    this.renderer.setClearColor("#212121");
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMapSoft = true;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.sceneCanvas.append(this.renderer.domElement);

    // lighting
    let ambientLight = new THREE.AmbientLight(0xdaccff, 0.5);
    this.scene.add(ambientLight);
    let light = new THREE.PointLight(0xfc831d, 1, 100);
    light.position.set(15, 10, 15);
    light.castShadow = true;
    light.shadow.radius = 1;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    this.scene.add(light);
    const loader = new FBXLoader();
    const fbx_model = require("../assets/angel_statue.fbx");
    loader.load(fbx_model, function (object) {

      object.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(object);
    }.bind(this));
  },

  methods: {
    animateThreeJs() {
      this.renderer.render(this.scene, this.camera);
      this.renderer.shadowMap.needsUpdate = true;
      console.log("je;;p")
    },
  },
};
</script>

<style scoped lang="scss">
#hello {
  width: 100%;
  height: 500px;
}
</style>
