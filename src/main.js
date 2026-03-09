import * as THREE from 'three'
import './styles.css'

import {
  labyrinthHeight,
  labyrinthWidth,
  generateLabyrinth,
  isWall
} from './labyrinth.js'

document.addEventListener("DOMContentLoaded", function () {
  const renderer = new THREE.WebGLRenderer({ antialias: true })

  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping

  if ('useLegacyLights' in renderer) {
    renderer.useLegacyLights = true
  }

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setAnimationLoop(drawFrame)
  document.body.appendChild(renderer.domElement)

  let isTurningLeft = false
  let isTurningRight = false
  let isMovingForward = false
  let playerDirection = 0
  let cosDirection = Math.cos(playerDirection)
  let sinDirection = Math.sin(playerDirection)

  document.body.addEventListener('keydown', onKeyDown)
  document.body.addEventListener('keyup', onKeyUp)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#1b0119')
  scene.fog = new THREE.FogExp2('#422b03', 0.012)
  
  const starGeometry = new THREE.BufferGeometry()
  const starCount = 5000
  const starPositions = new Float32Array(starCount * 3)

  for (let i = 0; i < starCount * 3; i += 3) {
    const radius = 1800 
    const theta = Math.random() * 2 * Math.PI
    const phi = Math.acos((Math.random() * 2) - 1)

    starPositions[i] = radius * Math.sin(phi) * Math.cos(theta)
    starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta)
    starPositions[i + 2] = radius * Math.cos(phi)
  }
  
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))

  const starMaterial = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 2.5,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.5 ,
    depthWrite: true,     
    fog: false           
  })

  const starField = new THREE.Points(starGeometry, starMaterial)
  starField.renderOrder = -9999 // draw behind everything
  scene.add(starField)

  const aspectRatio = window.innerWidth / window.innerHeight
  const camera = new THREE.PerspectiveCamera(80, aspectRatio)

  const innerGround = new THREE.Mesh(
    new THREE.BoxGeometry(
      labyrinthWidth * 2 + 4,   
      0.1,
      labyrinthHeight * 2 + 4 
    ),
    new THREE.MeshPhongMaterial({
      color: '#cc3c07',  
      shininess: 5
    })
  )
  innerGround.position.set(
    labyrinthWidth - 1,   
    -0.4,
    labyrinthHeight
  )
  scene.add(innerGround)

  const outerGround = new THREE.Mesh(
    new THREE.BoxGeometry(2000, 0.1, 2000),
    new THREE.MeshPhongMaterial({
      color: '#d29b05',
      shininess: 0,
      specular: '#000000'
    })
  )

  outerGround.position.set(0, -0.5, 0)
  scene.add(outerGround)

  const goalSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshPhongMaterial({
      color: '#ff9d00',
      shininess: 100,
      emissive: '#ffa500'
    })
  )
  goalSphere.position.set(2 * labyrinthWidth - 3, 1.5, 2 * labyrinthHeight)
  scene.add(goalSphere)

  generateLabyrinth()

  const blockGeometry = new THREE.BoxGeometry(1, 1, 1)
  const labyrinthGroup = new THREE.Group()
  const labyrinthMaterial = new THREE.MeshPhongMaterial({
    color: '#d73e06',
    shininess: 10
  })

  const borderGroup = new THREE.Group()
  const borderMaterial = new THREE.MeshPhongMaterial({
    color: '#510909'
  })

  for (let x = 0; x < 2 * labyrinthWidth + 1; x++) {
    for (let y = 0; y < 2 * labyrinthHeight + 2; y++) {
      if (isWall(x, y)) {
        let wallMesh = new THREE.Mesh(blockGeometry, labyrinthMaterial)
        const wallHeight = 0.4 + 1.2 * Math.random()
        wallMesh.scale.set(1, wallHeight, 1)
        wallMesh.position.set(x, wallHeight / 2 - 0.5, y)
        labyrinthGroup.add(wallMesh)

        if (wallHeight < 0.7) {
          wallMesh = wallMesh.clone()
          wallMesh.scale.set(2, 0.2, 1)
          wallMesh.position.set(x, 0.5, y)
          labyrinthGroup.add(wallMesh)
        }

        const borderMesh = new THREE.Mesh(blockGeometry, borderMaterial)
        borderMesh.scale.set(1.05, 1, 1.05)
        borderMesh.position.set(x, -0.8, y)
        borderGroup.add(borderMesh)
      }
    }
  }

  scene.add(labyrinthGroup, borderGroup)

  let playerX = 1
  let playerZ = 2

  const ambient = new THREE.AmbientLight('#ffe8d0', 0.35)
  scene.add(ambient)

  const hemiLight = new THREE.HemisphereLight(
  '#ffe7b3',   
  '#8b4a00',     
  0.9
)

scene.add(hemiLight)
const keyLight = new THREE.DirectionalLight('#ffe7c2', 1.4)
keyLight.position.set(200, 150, 200)   // high sun angle
keyLight.castShadow = false

  keyLight.position.set(labyrinthWidth, 25, labyrinthHeight)
  keyLight.target.position.set(labyrinthWidth / 2, 0, labyrinthHeight / 2)
  scene.add(keyLight)
  scene.add(keyLight.target)

  const cornerIntensity = 1.8
  const cornerDistance = 90
  const cornerDecay = 2

  const corner1 = new THREE.PointLight('#f8d1b0', cornerIntensity, cornerDistance, cornerDecay)
  corner1.position.set(-labyrinthWidth, 12, -labyrinthHeight)
  scene.add(corner1)

  const corner2 = new THREE.PointLight('#f8d1b0', cornerIntensity, cornerDistance, cornerDecay)
  corner2.position.set(labyrinthWidth, 12, -labyrinthHeight)
  scene.add(corner2)

  const corner3 = new THREE.PointLight('#f8d1b0', cornerIntensity, cornerDistance, cornerDecay)
  corner3.position.set(labyrinthWidth, 12, labyrinthHeight)
  scene.add(corner3)

  const corner4 = new THREE.PointLight('#f8d1b0', cornerIntensity, cornerDistance, cornerDecay)
  corner4.position.set(-labyrinthWidth, 12, labyrinthHeight)
  scene.add(corner4)

  const spotlight = new THREE.SpotLight('#ffffff', 3.2, 18, 0.55, 0.5, 2)
  spotlight.position.set(playerX, 0, playerZ)
  spotlight.target = new THREE.Object3D()
  scene.add(spotlight)
  scene.add(spotlight.target)

  function onKeyDown(event) {
    if (event.code === 'Space' || event.keyCode === 32) {
      jumpTime = time
    }
    if (event.code === 'ArrowLeft' || event.keyCode === 37) {
      isTurningLeft = true
      isTurningRight = false
    }
    if (event.code === 'ArrowRight' || event.keyCode === 39) {
      isTurningLeft = false
      isTurningRight = true
    }
    if (event.code === 'ArrowUp' || event.keyCode === 38) {
      isMovingForward = true
    }
  }

  function onKeyUp(event) {
    if (event.code === 'ArrowLeft' || event.keyCode === 37) {
      isTurningLeft = false
    }
    if (event.code === 'ArrowRight' || event.keyCode === 39) {
      isTurningRight = false
    }
    if (event.code === 'ArrowUp' || event.keyCode === 38) {
      isMovingForward = false
    }
  }

  function canMoveTo(x, y) {
    for (let i = -5; i <= 5; i++) {
      const newX = Math.round(x + 0.3 * Math.cos(playerDirection + i / 5))
      const newY = Math.round(y + 0.3 * Math.sin(playerDirection + i / 5))

      if (isWall(newX, newY)) return false
      return true
    }
  }

  let time = 0
  let jumpTime = -1000

  function drawFrame() {
    starField.rotation.y += 0.0002
    if (isTurningLeft) playerDirection -= 0.01
    if (isTurningRight) playerDirection += 0.01
    cosDirection = Math.cos(playerDirection)
    sinDirection = Math.sin(playerDirection)

    if (isMovingForward) {
      if (canMoveTo(playerX + 0.1 * cosDirection, playerZ + 0.1 * sinDirection)) {
        playerX += 0.015 * cosDirection
        playerZ += 0.015 * sinDirection
      } else if (canMoveTo(playerX - 0.1 * cosDirection, playerZ + 0.05 * sinDirection)) {
        playerZ += 0.015 * sinDirection
      } else if (canMoveTo(playerX + 0.05 * cosDirection, playerZ - 0.1 * sinDirection)) {
        playerX += 0.015 * cosDirection
      }
    }

    time++

    spotlight.position.set(playerX, 0, playerZ)
    spotlight.target.position.set(
      playerX + cosDirection,
      -0.1,
      playerZ + sinDirection
    )

    let playerHeight = 0
    if (time - jumpTime < 450) {
      playerHeight = 2 + 2 * Math.cos(
        ((time - jumpTime) / 450) * 2 * Math.PI - Math.PI
      )
    }
    camera.position.set(
      playerX - 0.1 * cosDirection,
      playerHeight,
      playerZ - 0.1 * sinDirection
    )

    camera.lookAt(new THREE.Vector3(
      playerX + 10.4 * cosDirection,
      0.95 * playerHeight,
      playerZ + 10.4 * sinDirection
    ))

    renderer.render(scene, camera)
  }
})
