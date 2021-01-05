<template>
  <div id="three-scene"></div>
</template>

<script>
/* eslint-disable */
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";

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
      intersects: null,
      line: null,
      line2: null,
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

    this.marker = new THREE.Mesh(
      new THREE.BoxBufferGeometry(0.005, 0.005, 0.005),
      new THREE.MeshStandardMaterial({ color: 0xce2121 })
    );
    this.marker.visible = true;
    //this.scene.add(this.marker);

    this.camera.position.set(1, 0, 0);

    // controls
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener("change", this.animateThreeJs);
    this.controls.mouseButtons = { MIDDLE: 0 }; // make middle mouse button control rotation

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
      if (event.button != 0) return;
      this.mouseDown = true;
      this.$root.$emit("set-pixel", this.currentCoord);
      this.setFace();
    });

    this.renderer.domElement.addEventListener("pointerup", (event) => {
      this.mouseDown = false;
    });

    this.renderer.domElement.addEventListener("pointermove", (event) => {
      if (!this.mouseDown) return;
      this.$root.$emit("set-pixel", this.currentCoord);
    });

    // face hover line
    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6 * 3), 3));
    let material = new THREE.LineBasicMaterial({ color: "black", transparent: false, linewidth: 1 });
    this.line = new THREE.Line(geometry, material);
    this.line.scale.set(1 / 1000, 1 / 1000, 1 / 1000);
    this.line2 = new Line2();
    this.line2.material.linewidth = 0.01;
    this.line2.scale.set(1 / 1000, 1 / 1000, 1 / 1000);
    this.scene.add(this.line2);

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
              material.skinning = true;

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
    setFace() {
      // select face
      if (this.intersects.length > 0 && this.intersects[0].faceIndex && this.mouseDown) {
        let geometry = new THREE.Geometry().fromBufferGeometry(this.intersects[0].object.geometry);
        let faceIdx1 = this.intersects[0].faceIndex;
        let faceIdx2 = faceIdx1 % 2 === 0 ? faceIdx1 + 1 : faceIdx1 - 1;

        if (faceIdx1 % 2 === 0) {
          geometry.faceVertexUvs[0][faceIdx2][0].copy(new THREE.Vector2(1, 0));
          geometry.faceVertexUvs[0][faceIdx2][1].copy(new THREE.Vector2(0, 1));
          geometry.faceVertexUvs[0][faceIdx2][2].copy(new THREE.Vector2(0, 0));

          geometry.faceVertexUvs[0][faceIdx1][0].copy(new THREE.Vector2(1, 0));
          geometry.faceVertexUvs[0][faceIdx1][1].copy(new THREE.Vector2(1, 1));
          geometry.faceVertexUvs[0][faceIdx1][2].copy(new THREE.Vector2(0, 1));
        } else {
          geometry.faceVertexUvs[0][faceIdx1][0].copy(new THREE.Vector2(1, 0));
          geometry.faceVertexUvs[0][faceIdx1][1].copy(new THREE.Vector2(0, 1));
          geometry.faceVertexUvs[0][faceIdx1][2].copy(new THREE.Vector2(0, 0));

          geometry.faceVertexUvs[0][faceIdx2][0].copy(new THREE.Vector2(1, 0));
          geometry.faceVertexUvs[0][faceIdx2][1].copy(new THREE.Vector2(1, 1));
          geometry.faceVertexUvs[0][faceIdx2][2].copy(new THREE.Vector2(0, 1));
        }

        geometry.uvsNeedUpdate = true;
        this.intersects[0].object.geometry.fromGeometry(geometry);
        this.renderer.render(this.scene, this.camera);
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
      this.intersects = this.raycaster.intersectObjects(this.mainObjects);

      if (this.intersects.length > 0) {
        this.marker.position.copy(this.intersects[0].point);
      }

      // set uv coordinate of raycast intersection
      if (this.intersects.length > 0 && this.intersects[0].uv) {
        const uv = this.intersects[0].uv;
        this.currentCoord = uv;
        this.intersects[0].object.material.map.transformUv(uv);
        this.$root.$emit("uv-update", uv);
      }

      if (this.intersects.length > 0) {
        const intersect = this.intersects[0];
        const face = intersect.face;

        let mesh = intersect.object;

        const linePosition = this.line.geometry.attributes.position;
        const meshPosition = mesh.geometry.attributes.position;

        let directGeometry = new THREE.Geometry();
        directGeometry.fromBufferGeometry(mesh.geometry);
        let faceIdx1 = this.intersects[0].faceIndex
        let faceIdx2 = faceIdx1 % 2 === 0 ? faceIdx1 + 1 : faceIdx1 - 1;

        const face2 = directGeometry.faces[faceIdx2];

        // render a thick line representing the selected face
        if(faceIdx1 % 2 === 0){
          linePosition.copyAt(0, meshPosition, face.a);
          linePosition.copyAt(1, meshPosition, face.b);
          linePosition.copyAt(2, meshPosition, face.c);

          linePosition.copyAt(3, meshPosition, face2.b);
          linePosition.copyAt(4, meshPosition, face2.c);
          linePosition.copyAt(5, meshPosition, face2.a);
        }else{
          linePosition.copyAt(0, meshPosition, face2.a);
          linePosition.copyAt(1, meshPosition, face2.b);
          linePosition.copyAt(2, meshPosition, face2.c);

          linePosition.copyAt(3, meshPosition, face.b);
          linePosition.copyAt(4, meshPosition, face.c);
          linePosition.copyAt(5, meshPosition, face.a);
        }



        mesh.updateMatrix();
        this.line.geometry.applyMatrix4(mesh.matrix);

        this.line2.geometry.fromLine(this.line);


       // debugger;
      }

      // setup combined canvas
      let _canvas = document.querySelector("#final-canvas");
      let _ctx = _canvas.getContext("2d");
      _ctx.drawImage(document.querySelector("#uv-canvas"), 0, 0);
      _ctx.drawImage(document.querySelector("#draw-canvas"), 0, 0);

      // set uv to the combined canvas for every mesh in the object
      this.mainObjects.forEach((obj) => {
        const material = new THREE.MeshBasicMaterial();
        material.map = new THREE.CanvasTexture(_canvas);
        material.map.magFilter = THREE.NearestFilter;
        material.skinning = true;
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
