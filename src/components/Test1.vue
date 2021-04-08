<template>
  <div id="gltf"></div>
</template>

<script>
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default {
  name: "test1",
  mounted() {
    let camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );
		camera.position.set( - 1.8, 0.6, 2.7 );
    let scene = new THREE.Scene();
    let renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer;

    let gltf_model = require("../assets/box.glb");
    const loader = new GLTFLoader()
    loader.load(gltf_model, function (gltf) {
      gltf.scene.traverse(function (child) {
        console.log(child);
      });
      scene.add(gltf.scene);
    });
  },
  data() {
    return {};
  },
  methods: {},
};
</script>



<style>
</style>