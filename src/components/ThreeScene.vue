<template>
  <div id="three-scene"></div>
</template>

<script>
/* eslint-disable */
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default {
  name: "ThreeScene",
  data() {
    return {
      sceneCanvas: null,
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      raycaster: null,
      mouse: null,
      mainObjects: [],
      marker: null,
      shiftDown: false,
      currentCoord: null,
      mouseDown: false,
    };
  },
  mounted() {
    /* **************
       BASIC SETUP
    ************** */
    this.sceneCanvas = document.getElementById("three-scene");
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.marker = new THREE.Mesh(new THREE.BoxBufferGeometry(0.005, 0.005, 0.1), new THREE.MeshPhongMaterial());
    this.marker.visible = true;
    //this.scene.add(this.marker);

    this.camera.position.set(1, 0, 0);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener("change", this.animateThreeJs);
    this.controls.enableRotate = false;
    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key == "Shift") {
          this.shiftDown = true;
        }
      }.bind(this)
    );

    document.addEventListener(
      "keyup",
      function (event) {
        if (event.key == "Shift") {
          this.shiftDown = false;
        }
      }.bind(this)
    );

    // renderer
    this.renderer.setSize(this.sceneCanvas.offsetWidth, this.sceneCanvas.offsetHeight);
    this.renderer.setClearColor("#212121");
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMapSoft = true;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.setSize(500, 500);
    this.sceneCanvas.append(this.renderer.domElement);

    // lighting
    let ambientLight = new THREE.AmbientLight(0xdaccff, 0.5);
    this.scene.add(ambientLight);
    let light = new THREE.PointLight(0xfc831d, 1, 100);
    light.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.radius = 1;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    this.scene.add(light);

    this.renderer.domElement.addEventListener("pointerdown", (event) => {
      if(event.button != 0) return;
      this.mouseDown = true;
      this.$root.$emit("set-pixel", this.currentCoord);
    });

    this.renderer.domElement.addEventListener("pointerup", (event) => {
      this.mouseDown = false;
    });

    this.renderer.domElement.addEventListener("pointermove", (event) => {
      if(!this.mouseDown) return;
      this.$root.$emit("set-pixel", this.currentCoord);
    });

    // load in a model
    const loader = new FBXLoader();
    const fbx_model = require("../assets/alien_spider.fbx");

    loader.load(
      fbx_model,
      function (object) {
        object.traverse(
          function (child) {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              const texture = new THREE.TextureLoader().load(require("../assets/alien_spider_uv.png"));
              texture.magFilter = THREE.NearestFilter;

              const material = new THREE.MeshBasicMaterial({ map: texture });
              material.map = new THREE.CanvasTexture(document.querySelector("#uv-canvas"));
              material.skinning = false;

              child.material = material;
              child.material.needsUpdate = true;
              this.mainObjects.push(child);
            }
          }.bind(this)
        );
        object.scale.set(1 / 1000, 1 / 1000, 1 / 1000);
        object.name = "hilbert";
        this.scene.add(object);
      }.bind(this)
    );

    window.addEventListener("pointermove", this.onPointerMove);
  },

  methods: {
    animateThreeJs() {
      this.renderer.render(this.scene, this.camera);
      this.renderer.shadowMap.needsUpdate = true;
    },
    onPointerMove(event) {
      if (event.isPrimary) {
        this.checkIntersection(event.clientX, event.clientY);
        this.animateThreeJs();
      }
    },
    checkIntersection(x, y) {
      let offsetLeft = this.renderer.domElement.offsetLeft;
      let offsetTop = this.renderer.domElement.offsetTop;
      let clientWidth = this.renderer.domElement.clientWidth;
      let clientHeight = this.renderer.domElement.clientHeight;

      this.mouse.x = ((x - offsetLeft) / clientWidth) * 2 - 1;
      this.mouse.y = -((y - offsetTop) / clientHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      let intersects = this.raycaster.intersectObjects(this.mainObjects);

      if (intersects.length > 0) {
        this.marker.position.set(0, 0, 0);

        const n = intersects[0].face.normal.clone();
        n.transformDirection(intersects[0].object.matrixWorld);

        this.marker.lookAt(n);
        this.marker.position.copy(intersects[0].point);
      }

      if (intersects.length > 0 && intersects[0].uv) {
        const uv = intersects[0].uv;
        this.currentCoord = uv;
        intersects[0].object.material.map.transformUv(uv);
        this.$root.$emit("uv-update", uv);
      }

      // setup combined canvas
      let _canvas = document.querySelector("#final-canvas");
      let _ctx = _canvas.getContext("2d");
      _ctx.drawImage(document.querySelector("#uv-canvas"), 0, 0);
      _ctx.drawImage(document.querySelector("#draw-canvas"), 0, 0);

      this.mainObjects.forEach((obj) => {
        const material = new THREE.MeshBasicMaterial();
        material.map = new THREE.CanvasTexture(_canvas);
        material.map.magFilter = THREE.NearestFilter;
        material.skinning = false;
        obj.material = material;
        obj.material.needsUpdate = true;
      });
    },
  },
  watch: {
    shiftDown() {
      if (this.shiftDown === true) {
        this.controls.enableRotate = true;
      } else {
        this.controls.enableRotate = false;
      }
    },
  },
};
</script>

<style>
#three-scene {
  display: grid;
  justify-self: center;
  width: 500px;
  height: 500px;
}
</style>
