import TWEEN from '@tweenjs/tween.js'
import * as THREE from 'three'

export function animateVector3 (vectorToAnimate, target, options = {}) {
  let to = target || THREE.Vector3()
  let easing = options.easing || TWEEN.Easing.Quadratic.In
  let duration = options.duration || 2000    // create the tween
  let tweenVector3 = new TWEEN.Tween(vectorToAnimate)
    .to({ x: to.x, y: to.y, z: to.z, }, duration)
    .easing(easing)
    .onUpdate(function(d) {
      if(options.update){ 
        options.update(d)
      }
    })
    .onComplete(function(){
      if(options.callback) options.callback()
    }) 
    
  // return the tween in case we want to manipulate it later on
  return tweenVector3
}