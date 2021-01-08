<template>
  <div id="app">
    <ThreeScene />
    <UVCanvas v-if="uv_mode==0"/>
    <TileCanvas v-if="uv_mode==1"/>
    <!-- <button @click="$root.$emit('tile-mode')" style="display:grid; grid-area:footer">tile mode</button> -->
    <button @click="setTileMode()" style="display:grid; grid-area:footer">tile mode</button>
  </div>
</template>

<script>
import ThreeScene from "./components/ThreeScene.vue";
import UVCanvas from "./components/UVCanvas.vue";
import TileCanvas from "./components/TileCanvas.vue";

const UV_MODE = {
  DRAW: 0,
  TILE: 1
}


export default {
  name: "App",
  data(){
    return{
      uv_mode: UV_MODE.DRAW
    }
  },
  components: {
    ThreeScene,
    UVCanvas,
    TileCanvas,
  },
  methods:{
    setTileMode(){
      this.uv_mode = UV_MODE.TILE
    }
  }
};
</script>

<style>
#app {
  display: grid;
  grid-template-areas: 
                      "header   header      header    header"
                      "left-bar three-scene uv-canvas right-bar"
                      "footer   footer      footer    footer";
  grid-template-columns: 200px 600px 600px 200px;
  justify-content: center;
}
</style>
