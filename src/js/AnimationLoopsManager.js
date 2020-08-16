import PubSub from 'pubsub-js'

export default class AnimationLoopsManager  {
  constructor () {
    this.animationLoops = []

    // declare a subscriber to remove loops
    PubSub.subscribe('loops.remove', (msg, loop) => this.removeAnimationLoop(loop))
    // declare a subscriber to add a loop
    PubSub.subscribe('loops.push', (msg, loop) => this.animationLoops.push(loop))
    // declare a subscriber to add a loop that will be executed first
    PubSub.subscribe('loops.unshift', (msg, loop) => this.animationLoops.unshift(loop))
  }

  addAnimationLoop(loop) {
    PubSub.publish('loops.push', loop)
  }

  removeAnimationLoop(loop) {
    this.animationLoops = this.animationLoops.filter(item => item.id !== loop.id)
  }
  
  getAnimationLoop(loopId) {
    return this.animationLoops.find(item => item.id == loopId)
  }

  cleanAnimationLoops() {
    /*this.animationLoops.forEach(loop => {
      if (loop.alive !== undefined && loop.alive === false && loop.object) {
        scene.remove(loop.object)
      }
    })*/
    this.animationLoops = this.animationLoops.filter(loop => loop.alive === undefined || loop.alive === true)
  }
}