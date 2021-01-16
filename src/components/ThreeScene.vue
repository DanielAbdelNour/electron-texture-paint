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
      tileMode: false,
      selectedTileUV: null,
      uvArr1: null,
      uvArr2: null,
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

      if (this.tileMode) this.setFace();
      else this.$root.$emit("set-pixel", this.currentCoord);
    });

    this.renderer.domElement.addEventListener("pointerup", (event) => {
      this.mouseDown = false;
    });

    this.renderer.domElement.addEventListener("pointermove", (event) => {
      if (!this.mouseDown) return;
      if (this.tileMode) this.setFace();
      else this.$root.$emit("set-pixel", this.currentCoord);
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
    const fbx_model = require("../assets/cube.fbx");

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

    this.$root.$on("tile-mode", () => {
      this.tileMode = true;
    });

    this.$root.$on("set-tile", (coords) => {
      this.selectedTileUV = coords;
      this.uvArr = [
        { x: coords.x1, y: coords.y0 },
        { x: coords.x1, y: coords.y1 },
        { x: coords.x0, y: coords.y1 },
        { x: coords.x0, y: coords.y0 },
      ];
    });

    window.addEventListener("keydown", (event) => {
      if (event.key == "r") this.rotateUV();
    });
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
        let face1 = geometry.faces[faceIdx1];
        let face2 = geometry.faces[faceIdx2];
        let faceVerts1 = [geometry.vertices[face1.a], geometry.vertices[face1.b], geometry.vertices[face1.c]];
        let faceVerts2 = [geometry.vertices[face2.a], geometry.vertices[face2.b], geometry.vertices[face2.c]];

        let sharedVerts = 0;
        faceVerts1.forEach((x, xi) => {
          faceVerts2.forEach((y, yi) => {
            if (x.equals(y)) {
              sharedVerts++;
            }
          });
        });

        // the second face does not have enough shared verts. find the ones that do
        let uv = this.uvArr;

        let faceList = [];
        if (sharedVerts < 2) {
          geometry.faces.forEach((fc, i) => {
            // 3 Vec3s corrosponding to the face verts
            let query = [geometry.vertices[fc.a], geometry.vertices[fc.b], geometry.vertices[fc.c]];
            let vcount = 0;
            // how many verts from query are in faceVerts1?
            faceVerts1.forEach((f, fi) => {
              query.forEach((g, gi) => {
                if (f.equals(g)) {
                  vcount++;
                }
              });
            });
            if (vcount >= 2 && i != faceIdx1) {
              faceList.push({ face_idx: i, face: fc, vcount: vcount });
            }
          });

          console.log(faceIdx1);
          console.log(faceList);

          //faceIdx2 = faceIdx1 % 2 === 0 ? faceIdx1 - 1 : faceIdx1 + 1;
          faceIdx2 = faceList
            .map((z) => z.face_idx)
            .reduce((a, b) => {
              return Math.abs(b - faceIdx1) < Math.abs(a - faceIdx1) ? b : a;
            });
          // faceidx2 = closest idx to faceidx1 in facelist idxs

          if (faceIdx1 % 2 === 0) {
            geometry.faceVertexUvs[0][faceIdx1][0].copy(new THREE.Vector2(uv[0].x, uv[0].y)); //bottom-right
            geometry.faceVertexUvs[0][faceIdx1][1].copy(new THREE.Vector2(uv[2].x, uv[2].y)); //top-left
            geometry.faceVertexUvs[0][faceIdx1][2].copy(new THREE.Vector2(uv[3].x, uv[3].y)); //bottom-left

            geometry.faceVertexUvs[0][faceIdx2][0].copy(new THREE.Vector2(uv[0].x, uv[0].y)); //bottom-right
            geometry.faceVertexUvs[0][faceIdx2][1].copy(new THREE.Vector2(uv[1].x, uv[1].y)); //top-right
            geometry.faceVertexUvs[0][faceIdx2][2].copy(new THREE.Vector2(uv[2].x, uv[2].y)); //top-left
          } else {
            geometry.faceVertexUvs[0][faceIdx2][0].copy(new THREE.Vector2(uv[0].x, uv[0].y));
            geometry.faceVertexUvs[0][faceIdx2][1].copy(new THREE.Vector2(uv[2].x, uv[2].y));
            geometry.faceVertexUvs[0][faceIdx2][2].copy(new THREE.Vector2(uv[3].x, uv[3].y));

            geometry.faceVertexUvs[0][faceIdx1][0].copy(new THREE.Vector2(uv[0].x, uv[0].y));
            geometry.faceVertexUvs[0][faceIdx1][1].copy(new THREE.Vector2(uv[1].x, uv[1].y));
            geometry.faceVertexUvs[0][faceIdx1][2].copy(new THREE.Vector2(uv[2].x, uv[2].y));
          }
        } else {
          if (faceIdx1 % 2 === 0) {
            geometry.faceVertexUvs[0][faceIdx2][0].copy(new THREE.Vector2(uv[0].x, uv[0].y)); //bottom-right
            geometry.faceVertexUvs[0][faceIdx2][1].copy(new THREE.Vector2(uv[2].x, uv[2].y)); //top-left
            geometry.faceVertexUvs[0][faceIdx2][2].copy(new THREE.Vector2(uv[3].x, uv[3].y)); //bottom-left

            geometry.faceVertexUvs[0][faceIdx1][0].copy(new THREE.Vector2(uv[0].x, uv[0].y)); //bottom-right
            geometry.faceVertexUvs[0][faceIdx1][1].copy(new THREE.Vector2(uv[1].x, uv[1].y)); //top-right
            geometry.faceVertexUvs[0][faceIdx1][2].copy(new THREE.Vector2(uv[2].x, uv[2].y)); //top-left
          } else {
            geometry.faceVertexUvs[0][faceIdx1][0].copy(new THREE.Vector2(uv[0].x, uv[0].y));
            geometry.faceVertexUvs[0][faceIdx1][1].copy(new THREE.Vector2(uv[2].x, uv[2].y));
            geometry.faceVertexUvs[0][faceIdx1][2].copy(new THREE.Vector2(uv[3].x, uv[3].y));

            geometry.faceVertexUvs[0][faceIdx2][0].copy(new THREE.Vector2(uv[0].x, uv[0].y));
            geometry.faceVertexUvs[0][faceIdx2][1].copy(new THREE.Vector2(uv[1].x, uv[1].y));
            geometry.faceVertexUvs[0][faceIdx2][2].copy(new THREE.Vector2(uv[2].x, uv[2].y));
          }
        }

        geometry.uvsNeedUpdate = true;
        this.intersects[0].object.geometry.fromGeometry(geometry);
        this.renderer.render(this.scene, this.camera);
      }
    },
    rotateUV(reverse = false) {
      let arr = this.uvArr; //pointer to this.uvarr
      if (reverse) arr.unshift(arr.pop());
      else arr.push(arr.shift());
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
        const face1 = intersect.face;

        let mesh = intersect.object;

        const linePosition = this.line.geometry.attributes.position;
        const meshPosition = mesh.geometry.attributes.position;

        let directGeometry = new THREE.Geometry();
        directGeometry.fromBufferGeometry(mesh.geometry);
        let faceIdx1 = this.intersects[0].faceIndex;
        let faceIdx2 = faceIdx1 % 2 === 0 ? faceIdx1 + 1 : faceIdx1 - 1;

        ////
        let faceList = [];
        let faceVerts1 = [
          directGeometry.vertices[face1.a],
          directGeometry.vertices[face1.b],
          directGeometry.vertices[face1.c],
        ];

        directGeometry.faces.forEach((fc, i) => {
          // 3 Vec3s corrosponding to the face verts
          let query = [directGeometry.vertices[fc.a], directGeometry.vertices[fc.b], directGeometry.vertices[fc.c]];
          let vcount = 0;
          // how many verts from query are in faceVerts1?
          faceVerts1.forEach((f, fi) => {
            query.forEach((g, gi) => {
              if (f.equals(g)) {
                vcount++;
              }
            });
          });
          if (vcount >= 2 && i != faceIdx1) {
            faceList.push({ face_idx: i, face: fc, vcount: vcount });
          }
        });
        faceIdx2 = faceList
          .map((z) => z.face_idx)
          .reduce((a, b) => {
            return Math.abs(b - faceIdx1) < Math.abs(a - faceIdx1) ? b : a;
          });
        //////

        const face2 = directGeometry.faces[faceIdx2];

        // render a thick line representing the selected face
        if (faceIdx1 % 2 === 0) {
          linePosition.copyAt(0, meshPosition, face1.a);
          linePosition.copyAt(1, meshPosition, face1.b);
          linePosition.copyAt(2, meshPosition, face1.c);

          linePosition.copyAt(3, meshPosition, face2.b);
          linePosition.copyAt(4, meshPosition, face2.c);
          linePosition.copyAt(5, meshPosition, face2.a);
        } else {
          linePosition.copyAt(0, meshPosition, face2.a);
          linePosition.copyAt(1, meshPosition, face2.b);
          linePosition.copyAt(2, meshPosition, face2.c);

          linePosition.copyAt(3, meshPosition, face1.b);
          linePosition.copyAt(4, meshPosition, face1.c);
          linePosition.copyAt(5, meshPosition, face1.a);
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
  grid-area: three-scene;
  justify-self: center;
  width: 500px;
  height: 500px;
}
</style>
