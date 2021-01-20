<template>
  <div class="stage"
       @mousedown.stop="clickStageHandle">
    <div
      v-for="(item) in elements"
      :key="item.id"
      :style="{width:item.width+'px',
      height:item.height+'px',
      left:item.x+'px',
      top:item.y+'px'
      }"
      class="move-item"
      @click.stop="clickElemHandle"
    ></div>
    <Selector
      :selectedArea="selectedArea"
      v-show="selectedElements.length"></Selector>
  </div>
</template>

<script lang="ts">
  import {defineComponent, reactive, toRefs} from 'vue'
  import Selector from "@/components/Selector.vue"
  import {Comp, Rect} from '@/types/index.d.ts'


  interface DataProps {
    elements: Comp[];
    selectedElements: Comp[];
    selectedArea: Rect;
  }

  export default defineComponent({
    name: 'home',
    components: {Selector},
    setup() {
      const data: DataProps = reactive({
        elements: [
          {
            id: 1,
            x: 0,
            y: 0,
            rotate: 0,
            width: 200,
            height: 200,
          }
        ],
        selectedElements: [],
        selectedArea: {
          width: 200,
          height: 200,
          x: 0,
          y: 0
        }
      })
      const toRefsData = toRefs(data)
      const clickElemHandle = (item: Comp) => {
        data.selectedElements = [item]
      }
      const clickStageHandle = () => {
        console.log('stage click 111111111111')
        data.selectedElements = []
      }
      return {
        ...toRefsData,
        clickElemHandle,
        clickStageHandle
      }
    }
  })
</script>
<style scoped lang="scss">
  .stage {
    position: relative;
    width: 100%;
    height: 100vh;
  }

  .move-item {
    width: 100px;
    height: 100px;
    border: 1px solid #2c3e50;
    position: absolute;
  }
</style>