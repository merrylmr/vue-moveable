<template>
  <div class="about">
    <h1>This is an about page</h1>
    xxxxxxx
    <div class="img"
         style="transform:matrix(0.866025,0.500000,-0.500000,0.866025,30,30)">
      <img src="http://p.cdn-static.cn/1360_15852888825962.jpeg" alt="">
    </div>
  </div>
</template>

<script>
  import {defineComponent} from 'vue'

  export default defineComponent({
    name: 'matrix',
    setup() {
      // const rotate = Math.PI / 2
      // const cos = Math.cos(rotate);
      // const sin = Math.sin(rotate);
      // const A = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
      // const B = [[cos, -sin, 0], [sin, cos, 0], [0, 0, 1]]
      // const C = [[1, 0, 30], [0, 1, 30], [0, 0, 1]]

      return {}
    }
  })
</script>
<style scoped>
  .img {
    width: 100px;
    height: 100px;
  }

  .img img {
    width: 100%;
    height: 100%;
  }
</style>