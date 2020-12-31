<template>
  <canvas id="uv-canvas"></canvas>
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
      canvasSize: 64,
      imgSize: 64,
    };
  },
  mounted() {
    this.canvas = document.querySelector("#uv-canvas");
    this.canvas.width = this.canvas.height = this.canvasSize;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.img = new Image();
    this.img.src = require("../assets/alien_spider_uv.png");
    console.log(this.img.naturalWidth);

    this.ctx.drawImage(this.img, 0, 0, this.canvasSize, this.canvasSize);

    this.$root.$on("uv-update", (data) => {
      this.moveUVCursor(data);
    });

    window.addEventListener(
      "pointermove",
      function (event) {
        let offsetLeft = this.canvas.offsetLeft;
        let offsetTop = this.canvas.offsetTop;
        let clientWidth = this.canvas.clientWidth;
        let clientHeight = this.canvas.clientHeight;

        let x = (event.clientX - offsetLeft) / clientWidth;
        let y = (event.clientY - offsetTop) / clientHeight;

        let coords = {
          x: x,
          y: y,
        };

        if (this.canvas.matches(":hover")) {
          this.moveUVCursor(coords);
        }
      }.bind(this)
    );
  },

  methods: {
    moveUVCursor(coords) {
      //let ctx = this.canvas.getContext("2d");
      this.ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
      this.ctx.drawImage(this.img, 0, 0, this.canvasSize, this.canvasSize);

      let x = this.canvasSize * coords.x;
      let y = this.canvasSize * coords.y;

      let brushSize = this.canvasSize / this.imgSize;
      let rx = Math.floor(x);
      let ry = Math.floor(y);

      this.ctx.fillRect(rx, ry, brushSize, brushSize);
    },
  },
  watch: {},
};
</script>

<style>
#uv-canvas {
  display: grid;
  width: 500px;
  height: 500px;
  image-rendering: pixelated;
  cursor: none;
}
</style>
