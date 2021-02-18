<template>
  <div class="movable"
       @mousedown.stop="mouseDownHandle"
       :style="{
          width:areas.width+'px',
          height:areas.height+'px',
          left:areas.x-areas.width/2+'px',
          top:areas.y-areas.height/2+'px',
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

  <div class="debug"
       v-for="(item,index) in debug"
       :key="index"
       :style="{left:item.x +'px',top:item.y+'px'}">

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
    debug: { x: number; y: number }[];
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
        },
        debug: []
      })
      const copy = (data: any) => {
        return JSON.parse(JSON.stringify(data))
      }
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
        const beforeData = copy(data.areas)
        let copyData: Rect = {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
        data.centerPos = {
          x: data.areas.x,
          y: data.areas.y
        }
        const center = data.centerPos
        const pos = {
          x: e.clientX,
          y: e.clientY
        }
        const a = Math.sqrt((pos.x - data.centerPos.x) * (pos.x - data.centerPos.x) + (pos.y - data.centerPos.y) * (pos.y - data.centerPos.y))
        console.log('rotateMouseDownHandle', e)


        const mouseMoveHandle = (e: MouseEvent) => {
          // 余弦定理
          const b = Math.sqrt((e.clientX - data.centerPos.x) * (e.clientX - data.centerPos.x) + (e.clientY - data.centerPos.y) * (e.clientY - data.centerPos.y))
          const c = Math.sqrt((e.clientX - pos.x) * (e.clientX - pos.x) + (e.clientY - pos.y) * (e.clientY - pos.y))
          const r = (a * a + b * b - c * c) / (2 * a * b)
          let rotate = Math.acos(r) * 180 / Math.PI

          // 判断是顺时针还是逆时针：逆时针的话，需要用360-rotate
          if (((pos.x - center.x) * (e.clientY - center.y) - (pos.y - center.y) * (e.clientX - center.x)) < 0) {
            rotate = 360 - rotate
          }

          copyData = copy(beforeData)
          copyData.rotate = ((copyData.rotate || 0) + rotate) % 360
          data.areas = copyData
        }
        const mouseUpHandle = (e: MouseEvent) => {
          console.log('mouseUpHandle', e.clientX, e.clientY)
          document.body.removeEventListener("mousemove", mouseMoveHandle)
          document.body.removeEventListener("mouseup", mouseUpHandle)
        }
        document.body.addEventListener("mousemove", mouseMoveHandle)
        document.body.addEventListener("mouseup", mouseUpHandle)
      }

      // 点到直线的距离
      const getDistance = (a: number, b: number, c: number, point: { x: number; y: number }) => {
        return Math.abs(a * point.x + b * point.y + c) / Math.sqrt(a * a + b * b)
      }


      // 左边
      const leftResizeHandle = (e: MouseEvent): void => {
        const down = {
          x: e.clientX,
          y: e.clientY
        }
        const rotate = (data.areas.rotate || 0) * Math.PI / 180
        const k = Math.tan(rotate) === 0 ? 0 : -1 / Math.tan(rotate)
        const b = e.clientY - k * e.clientX
        let d = 0

        const beforeData = copy(data.areas)
        let copyData: Rect = {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }

        let detaY, detaX
        const mouseMoveHandle = (e: MouseEvent): void => {
          if (rotate) {
            d = getDistance(k, -1, b, {x: e.clientX, y: e.clientY})
            if (rotate < Math.PI / 2 || rotate > Math.PI * 3 / 2) {
              if ((e.clientY - b) / k < e.clientX) {
                d = -d
              }
            } else {
              if ((e.clientY - b) / k > e.clientX) {
                d = -d
              }
            }
          } else {
            d = down.x - e.clientX
          }

          detaY = d / 2 * Math.sin(rotate)
          detaX = d / 2 * Math.cos(rotate)

          copyData = copy(beforeData)
          copyData.x -= detaX
          copyData.y -= detaY
          copyData.width += d
          data.areas = copyData
        }
        const mouseUpHandle = (): void => {
          document.body.removeEventListener('mousemove', mouseMoveHandle)
          document.body.removeEventListener('mouseup', mouseUpHandle)
        }
        document.body.addEventListener('mousemove', mouseMoveHandle)
        document.body.addEventListener('mouseup', mouseUpHandle)
      }
      // 右边
      const RightResizeHandle = (e: MouseEvent): void => {
        const down = {
          x: e.clientX,
          y: e.clientY
        }
        const rotate = (data.areas.rotate || 0) * Math.PI / 180
        const k = Math.tan(rotate) === 0 ? 0 : -1 / Math.tan(rotate)
        const b = e.clientY - k * e.clientX
        let d = 0

        const beforeData = copy(data.areas)
        let copyData: Rect = {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }

        let detaY, detaX
        const mouseMoveHandle = (e: MouseEvent): void => {
          if (rotate) {
            d = getDistance(k, -1, b, {x: e.clientX, y: e.clientY})
            if (rotate < Math.PI / 2 || rotate > Math.PI * 3 / 2) {
              if ((e.clientY - b) / k > e.clientX) {
                d = -d
              }
            } else {
              if ((e.clientY - b) / k < e.clientX) {
                d = -d
              }
            }
          } else {
            d = e.clientX - down.x
          }

          detaY = d / 2 * Math.sin(rotate)
          detaX = d / 2 * Math.cos(rotate)

          copyData = copy(beforeData)
          copyData.x += detaX
          copyData.y += detaY
          copyData.width += d
          data.areas = copyData
        }
        const mouseUpHandle = (): void => {
          document.body.removeEventListener('mousemove', mouseMoveHandle)
          document.body.removeEventListener('mouseup', mouseUpHandle)
        }
        document.body.addEventListener('mousemove', mouseMoveHandle)
        document.body.addEventListener('mouseup', mouseUpHandle)
      }
      // 下方
      const bottomResizeHandle = (e: MouseEvent): void => {
        const rotate = (data.areas.rotate || 0) * Math.PI / 180
        const k = Math.tan(rotate) === 0 ? 0 : Math.tan(rotate)
        const b = e.clientY - k * e.clientX
        let d = 0

        const beforeData = copy(data.areas)
        let copyData: Rect = {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }

        let detaY, detaX
        const mouseMoveHandle = (e: MouseEvent): void => {
          d = getDistance(k, -1, b, {x: e.clientX, y: e.clientY})

          if (rotate < Math.PI / 2 || rotate > Math.PI * 3 / 2) {
            if (k * e.clientX + b > e.clientY) {
              d = -d
            }
          } else {
            if (k * e.clientX + b < e.clientY) {
              d = -d
            }
          }
          detaX = d / 2 * Math.sin(rotate)
          detaY = d / 2 * Math.cos(rotate)

          copyData = copy(beforeData)
          copyData.x -= detaX
          copyData.y += detaY
          copyData.height += d
          data.areas = copyData
        }
        const mouseUpHandle = (): void => {
          document.body.removeEventListener('mousemove', mouseMoveHandle)
          document.body.removeEventListener('mouseup', mouseUpHandle)
        }
        document.body.addEventListener('mousemove', mouseMoveHandle)
        document.body.addEventListener('mouseup', mouseUpHandle)
      }

      const topResizeHandle = (e: MouseEvent): void => {
        const rotate = (data.areas.rotate || 0) * Math.PI / 180
        const k = Math.tan(rotate) === 0 ? 0 : Math.tan(rotate)
        const b = e.clientY - k * e.clientX
        let d = 0

        const beforeData = copy(data.areas)
        let copyData: Rect = {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }

        let detaY, detaX
        const mouseMoveHandle = (e: MouseEvent): void => {
          d = getDistance(k, -1, b, {x: e.clientX, y: e.clientY})

          if (rotate < Math.PI / 2 || rotate > Math.PI * 3 / 2) {
            if (k * e.clientX + b < e.clientY) {
              d = -d
            }
          } else {
            if (k * e.clientX + b > e.clientY) {
              d = -d
            }
          }
          detaX = d / 2 * Math.sin(rotate)
          detaY = d / 2 * Math.cos(rotate)

          copyData = copy(beforeData)
          copyData.x += detaX
          copyData.y -= detaY
          copyData.height += d
          data.areas = copyData
        }
        const mouseUpHandle = (): void => {
          document.body.removeEventListener('mousemove', mouseMoveHandle)
          document.body.removeEventListener('mouseup', mouseUpHandle)
        }
        document.body.addEventListener('mousemove', mouseMoveHandle)
        document.body.addEventListener('mouseup', mouseUpHandle)
      }
      // 右上
      const topRightResizeHandle = (): void => {
        const rotate = (data.areas.rotate || 0) * Math.PI / 180
        // 拖拽之前的大小
        const beforeData = copy(data.areas)
        let copyData: Rect = {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
        const x = beforeData.x
        const y = beforeData.y
        const width = beforeData.width
        const height = beforeData.height
        // 右上角旋转之后的角度
        const a = {
          x: (width / 2) * Math.cos(rotate) + (height / 2) * Math.sin(rotate) + x,
          y: y - ((height / 2) * Math.cos(rotate) - (width / 2) * Math.sin(rotate))
        }
        let d, detaX, detaY
        data.debug = [a]

        const slopeAO = (y - a.y) / (x - a.x)
        const k = slopeAO ? -1 / slopeAO : 0
        const b = a.y - k * a.x

        const mouseMoveHandle = (e: MouseEvent): void => {
          const oaAngle = Math.atan(slopeAO)
          d = getDistance(k, -1, b, {x: e.clientX, y: e.clientY})

          // 在第三、第四象限
          if (a.y - y < 0) {
            // 在直线的下方：y的值越大，上方：y的值越小
            if (k * e.clientX + b < e.clientY) {
              d = -d
            }
          } else {
            // 在1、2象限：y的值越小越大，越大越小（直角坐标系）
            if (k * e.clientX + b > e.clientY) {
              d = -d
            }
          }

          // 对角线的斜率
          const slopeA = height / width
          detaY = d / 2 * Math.sin(Math.atan(slopeA))
          detaX = d / 2 * Math.cos(Math.atan(slopeA))

          let diffY = d / 2 * Math.sin(oaAngle)
          let diffX = d / 2 * Math.cos(oaAngle)

          if ((rotate - oaAngle) >= Math.PI / 2 && (rotate - oaAngle) <= Math.PI * 3 / 2) {
            console.log('diffX,diffY取反')
            diffY = -diffY
            diffX = -diffX
          }

          copyData = copy(beforeData)
          copyData.x += diffX
          copyData.y += diffY

          copyData.height += 2 * detaY
          copyData.width += 2 * detaX
          data.areas = copyData
        }
        const mouseUpHandle = (): void => {
          document.body.removeEventListener('mousemove', mouseMoveHandle)
          document.body.removeEventListener('mouseup', mouseUpHandle)
        }
        document.body.addEventListener('mousemove', mouseMoveHandle)
        document.body.addEventListener('mouseup', mouseUpHandle)
      }
      const resizeMouseDownHandle = (e: MouseEvent, dir: string): void => {
        switch (dir) {
          case 'l':
            leftResizeHandle(e)
            break
          case 'r':
            RightResizeHandle(e)
            break
          case 'bc':
            bottomResizeHandle(e)
            break
          case 'tc':
            topResizeHandle(e)
            break
          case 'tr':
            topRightResizeHandle()
            break
          default:
            break
        }
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

  .debug {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: red;
    pointer-events: none;
  }
</style>