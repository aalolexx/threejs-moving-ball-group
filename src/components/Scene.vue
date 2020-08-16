<template>
  <div class="scene">
    <button style="position: absolute; top: 5px; left: 5px;" @click="playDissolveAnim">play</button>
    <div id="three-scene-canvas"></div>
  </div>
</template>

<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ballPositionMap } from '../js/ballPositionMap.js'
import AnimationLoopsManager from '../js/AnimationLoopsManager.js'
import { animateVector3 } from '../js/AnimationUtils.js'
import TWEEN from '@tweenjs/tween.js'
import PubSub from 'pubsub-js'

export default {
  name: 'Scene',
  data () {
    return {
      sceneCanvas: null,
      scene: null,
      camera: null,
      renderer: null,
      controls: null,

      cursorX: null,
      cursorY: null,

      animationLoopsManager: new AnimationLoopsManager(),
      isDissolveAnimationActive: false,

      standardBallMaterial: null,

      balls: {},
      pointLight: null
    }
  },


  created () {
    document.onmousemove = (e) => {
      this.cursorX = e.clientX
      this.cursorY = e.clientY
    }
  },


  mounted () {
    /* **************
       BASIC SETUP
    ************** */

    this.sceneCanvas = document.getElementById('three-scene-canvas')
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sceneCanvas.getBoundingClientRect().width / this.sceneCanvas.getBoundingClientRect().height,
      0.1,
      1000
    )
    this.camera.position.set(20, 7, 20)
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    })
    this.renderer.outputEncoding = THREE.sRGBEncoding

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    this.renderer.setSize(this.sceneCanvas.offsetWidth, this.sceneCanvas.offsetHeight)
    this.renderer.setClearColor("#ffffff")
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMapSoft = true
    this.renderer.shadowMap.autoUpdate = false
    this.renderer.shadowMap.needsUpdate = true
    this.sceneCanvas.append(this.renderer.domElement)
    
    // lighting
    let ambientLight = new THREE.AmbientLight (0xdaccff, 0.5)
    this.scene.add(ambientLight)

    this.pointLight = new THREE.PointLight(0xfc831d, 1, 100)
    this.pointLight.position.set(15, 10, 15)
    this.pointLight.castShadow = true
    this.pointLight.shadow.radius = 1
    this.pointLight.shadow.mapSize.width = 2048
    this.pointLight.shadow.mapSize.height = 2048
    this.scene.add(this.pointLight)

    // Adding a cube
    /*let geometry = new THREE.SphereGeometry()
    let material = new THREE.MeshPhysicalMaterial({color: 0x00ff00})
    let cube = new THREE.Mesh(geometry, material)
    this.scene.add(cube)
    cube.position.set(0,0,0)*/

    this.standardBallMaterial = new THREE.MeshPhongMaterial({color: 0xfffff0 })
    this.addBalls()

    this.addAnimationPubSub()

    this.renderThreeJs()
  },


  methods: {

    renderThreeJs (time) {
      requestAnimationFrame(this.renderThreeJs)

      this.animationLoopsManager.animationLoops.filter((item) => item.alive).forEach(loop => {
        loop.loop ? loop.loop(this.balls) : loop(this.balls)
      })

      this.setLightPosition()

      this.renderer.render(this.scene, this.camera)
      this.renderer.shadowMap.needsUpdate = true

      // todo performenace aeh only update if there is smth to update
      TWEEN.update(time)



      //this.animationLoopsManager.cleanAnimationLoops()
    },

    setLightPosition () {
      let maxY = 20
      let maxX = 20

      if (this.cursorX && this.cursorY) {
        this.pointLight.position.x = (maxX / window.innerWidth * this.cursorX) + 5
        this.pointLight.position.y = (maxY / window.innerHeight * -this.cursorY) + 10
      }
    },

    addBalls () {
      // loop trough z layers
      for (let z = 0; z < ballPositionMap.length; z++) {
        // go trough y and x axis on the z layer
        let x = 0
        let y = 0
        for (let i = 0; i < Math.pow(ballPositionMap.length, 2); i++) {
          
          // check if - according to the position map - there should be a ball at this position
          if (ballPositionMap[z][i] == 1) {
            this.createBall(x, y, z)
          }

          if (x == ballPositionMap.length-1) {
            x = 0
            y++
          } else {
            x++
          }
        }
      }

      // add the basic idle animation
      this.initAllIdleAnimation()
    },

    addAnimationPubSub () {
      PubSub.subscribe('dissolveAnimation.finished', () => {
        if (this.isDissolveAnimationActive) {
          this.initAllIdleAnimation()
        }
        this.isDissolveAnimationActive = false
      })
      PubSub.subscribe('dissolveAnimation.start', () => {
        this.playDissolveAnim()
      })
    },

    clearIdleAnimations () {
      this.animationLoopsManager.animationLoops = this.animationLoopsManager.animationLoops.filter((item) =>
        !item.id.includes('ballIdle')
      )
    },

    initAllIdleAnimation () {
      // add the idle animation for each ball
      for (let ballId of Object.keys(this.balls)) {
        this.initIdleAnimation (ballId)
      }
    },

    initIdleAnimation (ballId) {
      let idleAnimLoop = {
        id: `ballIdle-${ballId}`,
        alive: true,
        currentPositionIndex: Math.random() -0.5,
        originPosition: null,
        loop: function (balls) {
          // todo aeh performance, set ball variable in loop object first time
          let ball = balls[ballId]
          if (!this.originPosition) {
            // Object.assign to really copy the obj ect and not just put a ref
            this.originPosition = {... ball.position}
          }
          //ball.position.x = this.originPosition.x + (Math.sin(this.currentPositionIndex* 3) / 4)
          ball.position.y = this.originPosition.y + (Math.sin(this.currentPositionIndex * 3) / 4)
          this.currentPositionIndex += 0.01
        }
      }
      this.animationLoopsManager.addAnimationLoop(idleAnimLoop)
    },

    createBall (_x,_y,_z) {
      // Add group dissolve animation
      let dissolveAnimLoop = {
        id: `ballDissolve-${_x}-${_y}-${_z}`,
        alive: true,
        originPosition: null,
        targetPosition: new THREE.Vector3(0, 0, 0),
        tween: null,
        loop: function (balls) {
          // todo aeh performance, set ball variable in loop object first time
          let ball = balls[`ball-${_x}-${_y}-${_z}`]
          if (!this.originPosition) {
            // Object.assign to really copy the obj ect and not just put a ref
             this.originPosition = {... ball.position}
          }
          if (!this.tween) {
            this.tween = animateVector3(this.originPosition, this.targetPosition, {
              duration: 5000,
              easing : TWEEN.Easing.bounceInOu,
              update: (d) => {
                ball.position.x = d.x
                ball.position.y = d.y
                ball.position.z = d.z
              },
              callback: () => {
                this.alive = false
                PubSub.publish('dissolveAnimation.finished')
              }
            })
            // disable the loop once the tween is initialized
            this.alive = false
          }
          //this.tween.update(time)
        }
      }
      this.animationLoopsManager.addAnimationLoop(dissolveAnimLoop)

      let ballSize = Math.round(Math.random()*10) / 10 + 0.5
      let geometry = new THREE.SphereBufferGeometry(ballSize, 16, 12)
      let ball = new THREE.Mesh(geometry, this.standardBallMaterial)
      let x = _x * 2.4 + Math.random() - 0.5
      let y = _y * 2.6 + Math.random() - 0.5
      let z = _z * 2.4 + Math.random() - 0.5
      ball.position.set(x, y, z)
      this.balls[`ball-${_x}-${_y}-${_z}`] = ball
      this.scene.add(ball)
    },

    playDissolveAnim () {
      this.isDissolveAnimationActive = true

      // get all dissolve anim loops
      let dissolveAnimationLoops = this.animationLoopsManager.animationLoops.filter((item) =>
        item.id.includes('ballDissolve')
      )
      this.clearIdleAnimations()
      dissolveAnimationLoops.forEach(loop => {
        loop.alive = true
        loop.tween.start()
      })
    }
  }
}
</script>
