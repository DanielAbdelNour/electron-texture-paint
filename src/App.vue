<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <ThreeScene />
    <UVCanvas/>
  </div>
</template>

<script>
import ThreeScene from "./components/ThreeScene.vue";
import UVCanvas from "./components/UVCanvas.vue";

export default {
  name: "App",
  components: {
    ThreeScene,
    UVCanvas
  }
};
</script>

<style>
#app {
  display: grid;
  grid-template-columns: 600px 600px;
  justify-content: center;
}
</style>
