<template>
  <div id="canvas-wrapper">
    <canvas id="uv-canvas" />
    <canvas id="draw-canvas" />
    <canvas id="tile-canvas" />
    <canvas id="final-canvas" />
  </div>
</template>

<script>
/* eslint-disable */
export default {
  name: "UVCanvas",
  data() {
    return {
      canvas: null,
      ctx: null,
      img: null,
      canvasWidth: 64,
      canvasHeight: 64,
      drawCanvas: null,
      tileCanvas: null,
      finalCanvas: null,
      mouseDown: false,
      tileWidth: 16,
      tileHeight: 16,
      tileSize: 16,
      tileMode: false,
      selectedTileUV: null,
    };
  },
  mounted() {
    this.canvas = document.querySelector("#uv-canvas");
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.img = new Image();
    this.img.src = require("../assets/alien_spider_uv.png");

    this.ctx.drawImage(this.img, 0, 0, this.canvasWidth, this.canvasHeight);

    this.drawCanvas = document.querySelector("#draw-canvas");
    this.drawCanvas.width = this.canvasWidth;
    this.drawCanvas.height = this.canvasHeight;

    this.tileCanvas = document.querySelector("#tile-canvas");
    this.tileCanvas.width = this.canvasWidth;
    this.tileCanvas.height = this.canvasHeight;

    this.finalCanvas = document.querySelector("#final-canvas");
    this.finalCanvas.width = this.canvasWidth;
    this.finalCanvas.height = this.canvasHeight;

    this.$root.$on("uv-update", (data) => {
      this.moveUVCursor(data);
    });

    this.$root.$on("set-pixel", (data) => {
      this.setPixel(data);
    });

    this.$root.$on("tile-mode", () => {
      this.img = new Image();
      this.img.src = require("../assets/uv_debug.png");

      this.img.onload = (x) => this.resizeCanvas(x);
    });

    window.addEventListener(
      "pointermove",
      function (event) {
        let rect = this.canvas.getBoundingClientRect();
        let x = (event.clientX - rect.left) / rect.width;
        let y = (event.clientY - rect.top) / rect.height;

        let coords = {
          x: x,
          y: y,
        };

        if (this.canvas.matches(":hover") || this.drawCanvas.matches(":hover")) {
          this.moveUVCursor(coords);
          this.highlightTile(coords);
        }
      }.bind(this)
    );

    this.drawCanvas.addEventListener("mousedown", (event) => {
      this.mouseDown = true;
      if (!this.tileMode) this.setPixel(this.pointerCoords(this.drawCanvas, event));
      else this.setTile(this.pointerCoords(this.drawCanvas, event));
    });

    this.drawCanvas.addEventListener("mouseup", (event) => {
      this.mouseDown = false;
    });

    this.drawCanvas.addEventListener("mousemove", (event) => {
      if (!this.mouseDown) return;
      if (!this.tileMode) this.setPixel(this.pointerCoords(this.drawCanvas, event));
      else this.setTile(this.pointerCoords(this.drawCanvas, event));
    });

    this.$root.$on("tile-mode", () => {
      this.tileMode = true;
    });
  },

  methods: {
    moveUVCursor(coords) {
      //let ctx = this.canvas.getContext("2d");
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.ctx.drawImage(this.img, 0, 0, this.canvasWidth, this.canvasHeight);

      let x = this.canvasWidth * coords.x;
      let y = this.canvasHeight * coords.y;

      let brushSize = 1; //this.canvasWidth / this.imgWidth;
      let rx = Math.floor(x);
      let ry = Math.floor(y);

      this.ctx.fillRect(rx, ry, brushSize, brushSize);
    },

    setPixel(coords) {
      let ctx = this.drawCanvas.getContext("2d");

      let x = this.canvasWidth * coords.x;
      let y = this.canvasHeight * coords.y;

      let brushSize = 1; //this.canvasWidth / this.imgWidth;
      let rx = Math.floor(x);
      let ry = Math.floor(y);

      ctx.fillRect(rx, ry, brushSize, brushSize);
    },
    resizeCanvas(x) {
      let dimWidth = x.path[0].naturalWidth;
      let dimHeight = x.path[0].naturalHeight;

      this.canvasWidth = dimWidth;
      this.canvasHeight = dimHeight;

      let uv = document.querySelector("#uv-canvas");
      let draw = document.querySelector("#draw-canvas");
      let tile = document.querySelector("#tile-canvas");
      let final = document.querySelector("#final-canvas");

      uv.width = draw.width = tile.width = final.width = dimWidth;
      uv.height = draw.height = final.height = tile.height = dimHeight;
    },
    pointerCoords(canvas, event) {
      let rect = canvas.getBoundingClientRect();
      let x = (event.clientX - rect.left) / rect.width;
      let y = (event.clientY - rect.top) / rect.height;

      let coords = {
        x: x,
        y: y,
      };

      return coords;
    },
    highlightTile(coords) {
      let canvas = document.querySelector("#uv-canvas");
      let ctx = canvas.getContext("2d");

      ctx.beginPath();
      ctx.lineWidth = "1px";
      ctx.strokeStyle = "red";

      let x = this.canvasWidth * coords.x;
      let y = this.canvasHeight * coords.y;
      let rx = Math.floor(x);
      let ry = Math.floor(y);

      //let tx = Math.floor((rx * this.tileSize) / this.canvasWidth / (this.canvasWidth / this.tileSize)) * this.tileSize;
      let tx = Math.floor(rx / this.tileSize) * this.tileSize;
      let ty = Math.floor(ry / this.tileSize) * this.tileSize;

      ctx.rect(tx + 0.5, ty + 0.5, 16 - 1, 16 - 1);
      ctx.stroke();
    },
    setTile(coords) {
      let canvas = document.querySelector("#uv-canvas");
      let ctx = canvas.getContext("2d");

      ctx.beginPath();
      ctx.lineWidth = "1px";
      ctx.strokeStyle = "blue";

      let x = this.canvasWidth * coords.x;
      let y = this.canvasHeight * coords.y;
      let rx = Math.floor(x);
      let ry = Math.floor(y);

      let tx = Math.floor(rx / this.tileSize) * this.tileSize;
      let ty = Math.floor(ry / this.tileSize) * this.tileSize;

      ctx.rect(tx + 0.5, ty + 0.5, 16 - 1, 16 - 1);
      ctx.stroke();

      this.selectedTileUV = {
        x0: tx / this.canvasWidth,
        x1: tx / this.canvasWidth + this.tileSize / this.canvasWidth,
        y0: 1 - ty / this.canvasHeight - this.tileSize / this.canvasHeight,
        y1: 1 - ty / this.canvasHeight,
      };

      this.$root.$emit("set-tile", this.selectedTileUV);
    },
  },
  watch: {},
  computed: {},
};
</script>

<style>
#canvas-wrapper {
  display: grid;
  grid-area: uv-canvas;
  justify-self: center;
  position: relative;
}

#uv-canvas {
  width: 500px;
  height: 500px;
  image-rendering: pixelated;
  cursor: none;
}
#draw-canvas {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 500px;
  height: 500px;
  image-rendering: pixelated;
  cursor: none;
  z-index: 1;
}
#tile-canvas {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 500px;
  height: 500px;
  image-rendering: pixelated;
  cursor: none;
  z-index: -1;
}

#final-canvas {
  width: 500px;
  height: 500px;
  image-rendering: pixelated;
  display: none;
}
</style>
