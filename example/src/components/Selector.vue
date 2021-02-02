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

          console.log('r', r, 'rotate:', rotate)


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


      const resizeMouseDownHandle = (e: MouseEvent, dir: string): void => {
        // 角度转幅度
        const rotate = (data.areas.rotate || 0) * Math.PI / 180
        const angle = (data.areas.rotate || 0)
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
        const x = beforeData.x
        const y = beforeData.y
        const width = beforeData.width
        const height = beforeData.height

        const r = ((data.areas.rotate || 0)) * Math.PI / 180
        const a = {
          x: (width / 2) * Math.cos(r) + (height / 2) * Math.sin(r) + x,
          y: y - ((height / 2) * Math.cos(r) - (width / 2) * Math.sin(r))
        }
        data.debug = [a]
        // slopeAO
        const slopeAO = (y - a.y) / (x - a.x)
        const slope = slopeAO ? -1 / slopeAO : 0
        // b=y-kx
        const b2 = a.y - slope * a.x
        console.log('pointA:', a, 'slope:', slope, 'b2:', b2)

        const mouseMoveHandle = (e: MouseEvent): void => {
          switch (dir) {
            case 'tc': // 上中
              h = Math.abs(k * e.clientX - e.clientY + b) / Math.sqrt(k * k + 1)
              // 需要判断是拉伸还是压缩（即h的正负问题，转换成判断点在直线上方还是下方，）
              // 在直线"上方"：k * e.clientX + b>=e.clientY,取"+"即可
              // 在直线"下方"：k * e.clientX + b<e.clientY,取"-"即可
              // y=kx+b
              // 但是由于旋转了之后，发生了变化，以上的伸缩与拉伸不成立
              if (angle < 90 || angle > 270) {
                if (k * e.clientX + b < e.clientY) {
                  h = -h
                }
              } else {
                if (k * e.clientX + b > e.clientY) {
                  h = -h
                }
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
            {
              console.log('in tr case')
              h = Math.abs(slope * e.clientX - e.clientY + b2) / Math.sqrt(slope * slope + 1)

              if (angle < 90 || angle > 270) {
                // 判断在直线的左方还是右方，右方则变大，左方缩小
                // y=kx+b =>x=(y-b)/k
                if (k * e.clientX + b < e.clientY) {
                  h = -h
                }
              } else {
                if (k * e.clientX + b >= e.clientY) {
                  h = -h
                }
              }
              // todo:放大缩小处理
              const a = height / width
              console.log('a', a, Math.atan(a))
              detaY = h / 2 * Math.sin(Math.atan(a))
              detaX = h / 2 * Math.cos(Math.atan(a))

              const oaAngle = Math.atan(slopeAO)
              console.log('oaAngle', oaAngle)
              let diffY = h / 2 * Math.sin(oaAngle)
              let diffX = h / 2 * Math.cos(oaAngle)

              if ((rotate - oaAngle) >= Math.PI / 2 && (rotate - oaAngle) <= Math.PI * 3 / 2) {
                console.log('diffX,diffY取反')
                diffY = -diffY
                diffX = -diffX
              }

              console.log('h', h, 'detaY:', detaY, 'detaX:', detaX, 'diffX', diffX, 'diffY', diffY)

              copyData = copy(beforeData)
              copyData.x += diffX
              copyData.y += diffY

              copyData.height += 2 * detaY
              copyData.width += 2 * detaX
              data.areas = copyData
            }
              break
            case "l": // 左中
              if (rotate) {
                w = Math.abs(k1 * e.clientX - e.clientY + b1) / Math.sqrt(k1 * k1 + 1)
                // 需要判断是拉伸还是压缩（即w的正负问题，转换成判断"点"在直线的左方还是右方，）
                // y=kx+b =>x=(y-b)/k
                // 在直线"左方"：(e.clientY-b)/k1>e.clientX,取"+"即可
                // 在直线"右方"：(e.clientY-b1)/k1<e.clientX,取"-"即可
                if (angle < 90 || angle > 270) {
                  if ((e.clientY - b1) / k1 < e.clientX) {
                    w = -w
                  }
                } else {
                  if ((e.clientY - b1) / k1 > e.clientX) {
                    w = -w
                  }
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
                if (angle < 90 || angle > 270) {
                  if ((e.clientY - b1) / k1 > e.clientX) {
                    w = -w
                  }
                } else {
                  if ((e.clientY - b1) / k1 < e.clientX) {
                    w = -w
                  }
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

              if (angle < 90 || angle > 270) {
                if (k * e.clientX + b > e.clientY) {
                  h = -h
                }
              } else {
                if (k * e.clientX + b < e.clientY) {
                  h = -h
                }
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

  .debug {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: red;
    pointer-events: none;
  }
</style>