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
          x: data.areas.x,
          y: data.areas.y
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

      const copy = (data: any) => {
        return JSON.parse(JSON.stringify(data))
      }

      const resizeMouseDownHandle = (e: MouseEvent, dir: string): void => {
        // 角度转幅度
        const rotate = (data.areas.rotate || 0) * Math.PI / 180
        // 上下斜率
        const k = Math.tan(rotate)
        const b = e.clientY - k * e.clientX
        //  左右两边的斜率
        const k1 = k === 0 ? 0 : -1 / k
        const b1 = e.clientY - k1 * e.clientX


        console.log('k:', k, 'b:', b, 'rotate:', rotate)
        // 点到直线的距离
        let h = 0
        let w = 0
        let detaX = 0
        let detaY = 0

        // 拖拽之前的大小
        const beforeData = copy(data.areas)
        let copyData: Rect = {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
        const pos = {
          x: e.clientX,
          y: e.clientY
        }

        // try {
        //
        // } catch (e) {
        //   console.error('e', e)
        // }

        const a = {
          x: (beforeData.x + beforeData.width) * Math.cos(rotate) + beforeData.y * Math.sin(rotate),
          y: beforeData.y * Math.cos(rotate) - (beforeData.x + beforeData.width) * Math.sin(rotate)
        }
        const c = {
          x: beforeData.x * Math.cos(rotate) + (beforeData.y + beforeData.height) * Math.sin(rotate),
          y: (beforeData.y + beforeData.height) * Math.cos(rotate) - beforeData.x * Math.sin(rotate)
        }

        const slope = c.y - a.y ? -(c.x - a.x) / (c.y - a.y) : 0
        const b2 = a.y - slope * a.x
        console.log('pointA', a, 'pointC', c, slope, b2)

        const mouseMoveHandle = (e: MouseEvent): void => {
          switch (dir) {
            case 'tc': // 上中
              h = Math.abs(k * e.clientX - e.clientY + b) / Math.sqrt(k * k + 1)
              // 需要判断是拉伸还是压缩（即h的正负问题，转换成判断点在直线上方还是下方，）
              // 在直线"上方"：k * e.clientX + b>=e.clientY,取"+"即可
              // 在直线"下方"：k * e.clientX + b<e.clientY,取"-"即可
              // y=kx+b
              if (k * e.clientX + b < e.clientY) {
                h = -h
              }
              detaX = h / 2 * Math.sin(rotate)
              detaY = h / 2 * Math.cos(rotate)
              console.log('h', h, 'detaX:', detaX, 'detaY:', detaY, pos.y - e.clientY)
              copyData = copy(beforeData)
              copyData.x += detaX
              copyData.y -= detaY
              copyData.height += h
              data.areas = copyData
              break
            case 'tl':
              break
            case 'tr': // 上右
              console.log('in tr case')
              h = Math.abs(slope * e.clientX - e.clientY + b2) / Math.sqrt(slope * slope + 1)

              detaY = h / 2 * Math.sin(Math.atan(slope))
              detaX = h / 2 * Math.cos(Math.atan(slope))
              console.log('h', h, 'detaY:', detaY, 'detaX:', detaX)

              copyData = copy(beforeData)
              copyData.x += detaX
              copyData.y -= detaY
              copyData.height += 2 * detaY
              copyData.width += 2 * detaX
              data.areas = copyData
              break
            case "l": // 左中
              if (rotate) {
                w = Math.abs(k1 * e.clientX - e.clientY + b1) / Math.sqrt(k1 * k1 + 1)
                // 需要判断是拉伸还是压缩（即w的正负问题，转换成判断"点"在直线的左方还是右方，）
                // y=kx+b =>x=(y-b)/k
                // 在直线"左方"：(e.clientY-b)/k1>e.clientX,取"+"即可
                // 在直线"右方"：(e.clientY-b1)/k1<e.clientX,取"-"即可
                if ((e.clientY - b1) / k1 < e.clientX) {
                  w = -w
                }
              } else {
                w = pos.x - e.clientX
              }
              detaY = w / 2 * Math.sin(rotate)
              detaX = w / 2 * Math.cos(rotate)

              copyData = copy(beforeData)
              copyData.x -= detaX
              copyData.y -= detaY
              copyData.width += w
              data.areas = copyData

              break
            case "r": // 右中
              if (rotate) {
                w = Math.abs(k1 * e.clientX - e.clientY + b1) / Math.sqrt(k1 * k1 + 1)

                // 需要判断是拉伸还是压缩（即w的正负问题，转换成判断"点"在直线的左方还是右方，）
                // y=kx+b =>x=(y-b)/k
                // 在直线"右边"：(e.clientY-b)/k1<e.clientX,取"+"即可
                // 在直线"右方"：(e.clientY-b1)/k1>e.clientX,取"-"即可
                if ((e.clientY - b1) / k1 > e.clientX) {
                  w = -w
                }
              } else {
                w = e.clientX - pos.x
              }
              detaY = w / 2 * Math.sin(rotate)
              detaX = w / 2 * Math.cos(rotate)

              copyData = copy(beforeData)
              copyData.x += detaX
              copyData.y += detaY
              copyData.width += w
              data.areas = copyData
              break
            case 'bc': // 下中
              h = Math.abs(k * e.clientX - e.clientY + b) / Math.sqrt(k * k + 1)

              // 需要判断是拉伸还是压缩（即h的正负问题，转换成判断点在直线上方还是下方）
              // 在直线"上方"：k * e.clientX + b>e.clientY,取"-"即可
              // 在直线"下方"：k * e.clientX + b<=e.clientY,取"+"即可
              // y=kx+b
              if (k * e.clientX + b > e.clientY) {
                h = -h
              }
              detaX = h / 2 * Math.sin(rotate)
              detaY = h / 2 * Math.cos(rotate)
              console.log('h', h, 'detaX:', detaX, 'detaY:', detaY, pos.y - e.clientY)

              copyData = copy(beforeData)
              copyData.x -= detaX
              copyData.y += detaY
              copyData.height += h
              data.areas = copyData
              break
            case 'br': // 下右

              break
            case 'bl':
              break
            default:
              break
          }
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