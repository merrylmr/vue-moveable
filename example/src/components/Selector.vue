<template>
  <div class="movable"
       @mousedown.stop="mouseDownHandle"
       :style="{
          width:areas.width+'px',
          height:areas.height+'px',
          left:areas.x+'px',
          top:areas.y+'px',
          transform:`rotate(${areas.rotate}deg)`
       }"
  >
    <div class="handle"
         v-for="(item,index) in handles"
         :class="`handle-${item}`"
         :key="index"
         @mousedown.stop="resizeMouseDownHandle($event,item)"
         :style="{'cursor':cursors[index]}">
    </div>
    <div class="rotate"
         @mousedown.stop="rotateMouseDownHandle">

    </div>
    <div class="center">
      {{parseInt(areas.rotate)}}
    </div>
  </div>
</template>
<script lang="ts">
  import {defineComponent, reactive, toRefs, watch, onMounted} from 'vue'
  import {Rect} from '@/types/index.d.ts'

  interface DataProps {
    handles: string[];
    areas: Rect;
    cursors: string[];
    centerPos: {
      x: number;
      y: number;
    };
  }

  export default defineComponent({
    name: "selector",
    props: {
      selectedArea: {
        type: Object,
        default: () => {
          return {
            width: 200,
            height: 200,
            x: 0,
            y: 0
          }
        }
      }
    },
    setup(props) {
      const data: DataProps = reactive({
        handles: ['tl', 'tc', 'tr', 'l', 'br', 'bc', 'bl', 'r'],
        cursors: ['nw-resize', 'n-resize', 'ne-resize', 'w-resize', 'nw-resize', 's-resize', 'sw-resize', 'e-resize'],
        areas: {
          width: 200,
          height: 200,
          y: 0,
          x: 0,
          rotate: 0
        },
        centerPos: {
          x: 0,
          y: 0
        }
      })

      const mouseDownHandle = (e: MouseEvent) => {
        const pos = {
          x: e.clientX,
          y: e.clientY
        }
        const diff = {
          x: 0,
          y: 0
        }
        console.log('selector mousedown', e.clientX, e.clientY)

        const mouseMoveHandle = (e: MouseEvent) => {
          diff.x = e.clientX - pos.x
          diff.y = e.clientY - pos.y
          console.log('diff', diff)

          data.areas.x += diff.x
          data.areas.y += diff.y

          pos.x = e.clientX
          pos.y = e.clientY
          console.log('selector moveHandle', e.clientX, e.clientY)
        }
        const mouseupHandle = (e: MouseEvent) => {
          console.log('diff', diff)
          e.stopPropagation()
          // todo 发生改变
          console.log('selector mouseUp', e)
          document.body.removeEventListener("mousemove", mouseMoveHandle)
          document.body.removeEventListener("mouseup", mouseupHandle)
        }
        document.body.addEventListener("mousemove", mouseMoveHandle)
        document.body.addEventListener("mouseup", mouseupHandle)
      }

      const rotateMouseDownHandle = (e: MouseEvent) => {
        e.preventDefault()
        data.centerPos = {
          x: data.areas.x + data.areas.width / 2,
          y: data.areas.y + data.areas.height / 2
        }
        console.log('rotateMouseDownHandle', e)

        const mouseMoveHandle = (e: MouseEvent) => {
          // Math.atan2(e.clientY - centerPos.y, e.clientX - centerPos.x):算出来是一个弧度
          // PI=180度 1度=PI/180
          // 垂直坐标系下半轴
          let deg: number = Math.atan2(e.clientY - data.centerPos.y, e.clientX - data.centerPos.x) * (180 / Math.PI) - 90
          // 处理度数（y的下半轴为0度，顺时针）
          if (deg < 0) {
            deg += 360
          }
          data.areas.rotate = deg
        }
        // 根据传入的两个点，求角度，及起始点是x轴的真半轴、负半轴、y轴的正半轴、y轴的负半轴，顺时针or逆时针
        // const getAngle = (px: number, py: number, mx: number, my: number, options: { clockwise: boolean, x: boolean }) => {
        //
        // }

        const mouseUpHandle = (e: MouseEvent) => {
          console.log('mouseUpHandle', e.clientX, e.clientY)
          document.body.removeEventListener("mousemove", mouseMoveHandle)
          document.body.removeEventListener("mouseup", mouseUpHandle)
        }
        document.body.addEventListener("mousemove", mouseMoveHandle)
        document.body.addEventListener("mouseup", mouseUpHandle)
      }

      const resizeMouseDownHandle = (e: MouseEvent, dir: string): void => {
        console.log('resizeMouseDownHandle', e, dir)
        const pos = {
          x: e.clientX,
          y: e.clientY
        }
        const diff = {
          x: 0,
          y: 0
        }
        // const fPoint = {
        //   x: data.areas.x + data.areas.width / 2,
        //   y: data.areas.y + data.areas.height / 2
        // }
        // const ePoint = {
        //   x: data.areas.x,
        //   y: data.areas.height + data.areas.y
        // }
        const mouseMoveHandle = (e: MouseEvent): void => {
          console.log("mouseMoveHandle", e)
          diff.x = e.clientX - pos.x
          diff.y = e.clientY - pos.y

          const rotate = data.areas.rotate || 0
          switch (dir) {
            case 'tc': // // 上中
              // if (rotate) {
              //   data.areas.x = (data.areas.x + diff.x) * Math.cos(rotate) + (data.areas.y + diff.y) * Math.sin(rotate)
              // }
              // const rotatedEPoint = {
              //   x: ePoint.x * Math.cos(rotate) + ePoint.y * Math.sign(rotate),
              //   y: ePoint.y * Math.cos(rotate) - ePoint.x * Math.sign(rotate),
              // }
              // const ef = data.areas.width / 2

              data.areas.y = (data.areas.y + diff.y) * Math.cos(rotate) - (data.areas.x + diff.x) * Math.sin(rotate)
              data.areas.height -= diff.y
              // data.areas.x += (diff.y * Math.sin(data.areas.rotate || 0))
              break
            case 'tl':
              data.areas.x += diff.x
              data.areas.y += diff.y

              data.areas.width -= diff.x
              data.areas.height -= diff.y
              break
            case 'tr': // 上右
              data.areas.y += diff.y

              data.areas.width += diff.x
              data.areas.height -= diff.y
              break
            case "l": // 左中
              // 修改left
              data.areas.x += diff.x
              data.areas.width -= diff.x
              break
            case "r": // 右中
              data.areas.width += diff.x
              break
            case 'bc': // 下中
              data.areas.height += diff.y
              break
            case 'br': // 下右
              data.areas.width += diff.x
              data.areas.height += diff.y
              break
            case 'bl':
              data.areas.x += diff.x
              data.areas.width -= diff.x
              data.areas.height += diff.y
              break
            default:
              break
          }

          pos.x = e.clientX
          pos.y = e.clientY
        }
        const mouseUpHandle = (e: MouseEvent): void => {
          console.log("mouseUpHandle", e)
          document.body.removeEventListener("mousemove", mouseMoveHandle)
          document.body.removeEventListener("mouseup", mouseUpHandle)
        }
        document.body.addEventListener("mousemove", mouseMoveHandle)
        document.body.addEventListener("mouseup", mouseUpHandle)
      }
      const toRefsData = toRefs(data)
      watch(props.selectedArea, (n, o) => {
        console.log('watch selectedArea', n, o)

      })
      onMounted(() => {
        data.areas = {
          rotate: 0,
          ...(props.selectedArea as Rect)
        }
      })
      return {
        ...toRefsData,
        mouseDownHandle,
        rotateMouseDownHandle,
        resizeMouseDownHandle
      }
    }
  })
</script>

<style scoped lang="scss">
  .movable {
    position: absolute;
    /*min-width: 200px;*/
    /*min-height: 200px;*/
    border: 1px solid #48a0db;
    display: inline-block;

    .center {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 10px;
      height: 10px;
      background-color: red;
      border-radius: 50%;
      transform: translate(-50, -50%);
    }
  }

  .handle {
    box-sizing: border-box;
    position: absolute;
    width: 10px;
    height: 10px;
    font-size: 1px;
    background: #fff;
    border: 1px solid #1ba9e1;

    &-tl {
      top: -5px;
      left: -5px;
    }

    &-tc {
      top: -5px;
      left: 50%;
      margin-left: -5px;
    }

    &-tr {
      top: -5px;
      right: -5px;
    }

    &-l {
      top: 50%;
      margin-top: -5px;
      left: -5px;
    }

    &-r {
      top: 50%;
      margin-top: -5px;
      right: -5px;
    }

    &-bl {
      bottom: -5px;
      left: -5px;
    }

    &-bc {
      bottom: -5px;
      left: 50%;
      margin-left: -5px;
    }

    &-br {
      bottom: -5px;
      right: -5px;
    }
  }

  .rotate {
    width: 0;
    height: 40px;
    margin: 0 auto;
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    cursor: pointer;

    &:hover {
      &::before {
        background: url(//s-116.f.cdn-static.cn/editor.svg) -30px -192px;
      }
    }

    &::before {
      content: "";
      position: absolute;
      top: 16px;
      left: -10px;
      width: 20px;
      height: 20px;
      border-radius: 10px;
      background: url(//s-116.f.cdn-static.cn/editor.svg) 0 -192px;

    }

    &::after {
      content: "";
      display: block;
      position: absolute;
      left: 50%;
      height: 16px;
      border-left: 1px dashed #9b9b9b;
      pointer-events: none;
    }
  }

</style>