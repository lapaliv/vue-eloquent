<template>
  <div id="app">
    <img src="./assets/logo.png">
    <HelloWorld/>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld'
import {Test} from "./Test";
import {Simple} from "./Simple";

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  mounted() {
    // let test = new Test({
    //   test: 444,
    //   name: 123
    // })
    //
    // // test.test = 123
    // console.log(test)

    console.log(Simple.find(74))
    // let simple = new Simple()
    // simple.id = 74
    // console.log(simple.find())
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
