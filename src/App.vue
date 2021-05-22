<template>
  <div id="app">
    <ThreeScene />
    <UVCanvas/>
    <button id="tile-mode-btn" @click="$root.$emit('tile-mode')" style="display:grid; grid-area:footer">tile mode</button>
    <button id="export-gltf-btn" @click="$root.$emit('export-gltf')" style="display:grid; grid-area:footer">export gltf</button>
  </div>
</template>

<script>
import ThreeScene from "./components/ThreeScene.vue";
import UVCanvas from "./components/UVCanvas.vue";

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
  },
  methods:{
    setTileMode(){
      this.uv_mode = UV_MODE.TILE
    }
  }
};
</script>

<style>
#tile-mode-btn{
  display: grid;
  margin-top: 10px;
  justify-self: right;
  width:60%
}

#export-gltf-btn{
  display: grid;
  width:30%;
   justify-self: left;
}

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
