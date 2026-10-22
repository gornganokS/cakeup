import './style.css'
import * as THREE from 'three'

// ฉาก
const scene = new THREE.Scene()
scene.background = new THREE.Color('#f9e8ef')

// กล้องมุมเฉียง
const camera = new THREE.PerspectiveCamera(
  40, //มุมมองแนวตั้ง 40 องศา ค่ามากเห็นมุมกว้างขึ้น
  window.innerWidth / window.innerHeight, //สัดส่วนความกว้างต่อความสูงของภาพ เพื่อไม่ให้ภาพยืด
  0.1, //ระยะตัดภาพด้านใกล้
  100 //ระยะตัดภาพด้านไกล
)
camera.position.set(5, 4, 7)
/* X: ไปทางขวา 5 หน่วย
Y: สูงขึ้น 4 หน่วย
Z: อยู่ทางด้านบวกของแกน Z 7 หน่วย */
camera.lookAt(0, 0.5, 0)
/* สั่งให้กล้องหันไปมองจุด X = 0, Y = 0.5, Z = 0 ซึ่งอยู่บริเวณเค้ก */

// ตัววาดภาพ 3D
const renderer = new THREE.WebGLRenderer({ antialias: true }) //antialias: true ช่วยลดรอยหยักตามขอบวัตถุ เช่น ขอบเค้กวงกลม
renderer.setSize(window.innerWidth, window.innerHeight) //กำหนดขนาดพื้นที่วาดภาพให้เท่ากับพื้นที่แสดงผลของหน้าต่างเบราว์เซอร์
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) //ปรับความละเอียดให้เหมาะกับจอ โดยจำกัดอัตราส่วนไว้ไม่เกิน 2
document.querySelector('#app').appendChild(renderer.domElement) //นำพื้นที่วาดภาพของ renderer ซึ่งเป็นแท็ก <canvas> ไปใส่ใน <div id="app"> ของหน้าเว็บ

// แสง
scene.add(new THREE.HemisphereLight('#ffffff', '#b88698', 2))
/* '#ffffff'	แสงจากด้านบนเป็นสีขาว
'#b88698'	แสงจากด้านล่างเป็นสีชมพูหม่น
2	ความเข้มของแสง */
const light = new THREE.DirectionalLight('#ffffff', 3) //สร้างแสงสีขาว ความเข้ม 3 เป็นแสงที่ส่องไปในทิศทางเดียว
light.position.set(3, 6, 4) //วางแสงไว้ที่ (3, 6, 4) แล้วเพิ่มลงในฉาก โดยเป้าหมายเริ่มต้นของแสงอยู่ที่ (0, 0, 0) จึงส่องจากด้านบนเฉียงลงมายังเค้ก
scene.add(light)

// สร้างทรงกระบอก โดยระบุตำแหน่งจากขอบล่าง
function cylinder(radius, height, color, bottom) {
  const geometry = new THREE.CylinderGeometry(
    radius, radius, height, 64 //รัศมีด้านบน, รัศมีด้านล่าง, ความสูง, จำนวนส่วนรอบวง, 64 คือแบ่งรอบวงเป็น 64 ส่วน
  )
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8
  }) //กำหนดว่าผิวของวัตถุมีหน้าตาอย่างไร โดยวัสดุชนิดนี้ตอบสนองต่อแสงในฉาก
/* ส่วน roughness คือความหยาบของผิว มีค่าตั้งแต่ 0 ถึง 1:
- ใกล้ 0 → ผิวเรียบ เงาสะท้อนคม
- ใกล้ 1 → ผิวด้าน เงาสะท้อนกระจาย */
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = bottom + height / 2 //ทรงกระบอกของ Three.js มีจุดศูนย์กลางอยู่กลางความสูง
  return mesh
}

// จานรอง
scene.add(cylinder(1.85, 0.12, '#ffffff', 0))

// เค้กหนึ่งชั้น ประกอบด้วยเนื้อเค้ก ครีม และหน้าเค้ก
const cake = new THREE.Group()
cake.add(cylinder(1.4, 0.22, '#e6b582', 0)) //cylinder(รัศมี, ความสูง, สี, ตำแหน่งขอบล่าง)
cake.add(cylinder(1.41, 0.10, '#fff5df', 0.22))
cake.add(cylinder(1.4, 0.22, '#e6b582', 0.32))
cake.add(cylinder(1.43, 0.10, '#ed91ae', 0.54))
cake.position.y = 0.12
scene.add(cake)

// ปรับภาพเมื่อขนาดหน้าจอเปลี่ยน
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// สร้างเค้กชั้นที่สองจากต้นแบบ
// ข้อความคะแนน
const hud = document.createElement('div')
hud.style.cssText = `
  position: fixed;
  top: 24px;
  left: 0;
  width: 100%;
  text-align: center;
  font-family: sans-serif;
  color: #754355;
  pointer-events: none;
`
document.body.appendChild(hud)

const HEIGHT = 0.64
const BASE_RADIUS = 1.4

let score = 0
let radius = BASE_RADIUS
let topCake = cake
let movingCake
let state = 'moving'
let phase = -Math.PI / 2
let landingY = 0
let velocity = 0
let previousTime = null
let cameraY = 0.5
let message = 'แตะหน้าจอ หรือกด Space เพื่อวาง'
let placedCakes = []

function updateHud() {
  hud.innerHTML = `
    <div style="font-size: 42px; font-weight: bold">
      ${score} ชั้น
    </div>
    <div style="margin-top: 8px">${message}</div>
  `
}

function spawnCake() {
  movingCake = cake.clone()
  // ย่อเฉพาะความกว้างและความลึก ความสูงคงเดิม
  const scale = radius / BASE_RADIUS
  movingCake.scale.set(scale, 1, scale)

  landingY = topCake.position.y + HEIGHT
  phase = -Math.PI / 2

  movingCake.position.set(
    topCake.position.x - 2.5,
    landingY + 0.9,
    topCake.position.z
  )

  scene.add(movingCake)
  velocity = 0
  state = 'moving'
}

function dropCake() {
  if (state !== 'moving') return

  const distance = Math.abs(
    movingCake.position.x - topCake.position.x
  )

  // กฎเกม: จุดศูนย์กลางเลยขอบชั้นล่าง ถือว่าพลาด
  const supportRadius = topCake.scale.x * BASE_RADIUS

  if (distance >= supportRadius) {
    state = 'falling'
    message = 'พลาดแล้ว! รอดูผลอีกนิด'
    updateHud()
    return
  }

  // วางใกล้จุดศูนย์กลางพอ จะจัดให้ตรงพอดี
  if (distance <= radius * 0.12) {
    movingCake.position.x = topCake.position.x
    message = 'Perfect! 🎯 ขนาดเท่าเดิม'
  } else {
    // ขนาดนี้ใช้กับชั้นถัดไป
    const nextRadius = Math.max(0.18, radius - distance * 0.3)
    const shrinkPercent = Math.round(
      (1 - nextRadius / radius) * 100
    )

    radius = nextRadius
    message = `ชั้นถัดไปเล็กลง ${shrinkPercent}%`
  }

  state = 'dropping'
  updateHud()
}

function finishLanding() {
  movingCake.position.y = landingY
  topCake = movingCake
  placedCakes.push(topCake)

  score += 1
  updateHud()
  spawnCake()
}

function restartGame() {
  // clone() ใช้ geometry/material ร่วมกับต้นแบบ
  // จึงนำออกจากฉากโดยไม่ dispose ทรัพยากรเหล่านั้น
  if (movingCake) scene.remove(movingCake)

  for (const layer of placedCakes) {
    scene.remove(layer)
  }

  placedCakes = []
  score = 0
  radius = BASE_RADIUS
  topCake = cake
  cameraY = 0.5
  message = 'แตะหน้าจอ หรือกด Space เพื่อวาง'

  updateHud()
  spawnCake()
}

function handleInput() {
  if (state === 'gameover') {
    restartGame()
  } else {
    dropCake()
  }
}

renderer.domElement.style.touchAction = 'none'

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.button !== 0) return
  handleInput()
})

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') return

  event.preventDefault()
  if (event.repeat) return

  handleInput()
})

// เริ่มเกม
updateHud()
spawnCake()

renderer.setAnimationLoop((time) => {
  const delta = previousTime === null
    ? 0
    : Math.min((time - previousTime) / 1000, 0.05) //เงื่อนไข ? ค่าถ้าจริง : ค่าถ้าเท็จ

  previousTime = time //เก็บเวลาปัจจุบันไว้ใช้เป็น “เวลาก่อนหน้า” ของเฟรมถัดไป
//เฟรมแรก: ยังไม่มีเวลาก่อนหน้า จึงใช้ 0
//เฟรมถัดไป: เอาเวลาปัจจุบันลบเวลาก่อนหน้า
//หาร 1000 เพื่อแปลงมิลลิวินาทีเป็นวินาที
//Math.min(..., 0.05) จำกัดไม่ให้เกิน 0.05 วินาที เพื่อป้องกันการขยับกระโดดไกลเมื่อเฟรมสะดุด
  if (state === 'moving') {
    // เพิ่มความเร็วตามคะแนน โดยจำกัดความเร็วสูงสุด
    const speed = Math.min(1.8 + score * 0.06, 3.2) //คะแนนยิ่งมาก เค้กยิ่งเคลื่อนเร็วขึ้น โดยจำกัดไว้ที่ 3.2
    phase += delta * speed //phase — ตอนนี้อยู่ช่วงไหนของการแกว่ง
// delta = เฟรมนี้ห่างจากเฟรมก่อนกี่วินาที, speed = ความเร็วในการเพิ่มมุม หน่วยเรเดียนต่อวินาที
    movingCake.position.x =
      topCake.position.x + Math.sin(phase) * 2.5
  }

  if (state === 'dropping' || state === 'falling') {
    velocity += 12 * delta //เพิ่มความเร็วตก โดยใช้ความเร่ง 12
    movingCake.position.y -= velocity * delta //ลดความสูงตามความเร็วตก

    if (state === 'dropping') {
      if (movingCake.position.y <= landingY) {
        finishLanding()
      }
    } else {
      // ชั้นที่พลาดเอียงและร่วงลงไป
      movingCake.rotation.z += 1.8 * delta //ทำให้เค้กหมุนเอียงรอบแกน Z โดยค่ามุมใช้หน่วยเรเดียน

      if (movingCake.position.y < landingY - 6) {
        scene.remove(movingCake)
        state = 'gameover'
        message = 'แตะ หรือกด Space เพื่อแก้มือ 🍰'
        updateHud()
      }
    }
  }

  // กล้องติดตามยอดเค้กอย่างนุ่มนวล
  const targetY = Math.max(0.5, topCake.position.y) //ให้กล้องตามความสูงของเค้กชั้นบนสุด แต่เป้าหมายต้องไม่ต่ำกว่า 0.5
  const smoothing = 1 - Math.exp(-5 * delta) //ทำให้กล้องเคลื่อนนุ่มนวลใกล้เคียงกัน แม้แต่ละเครื่องมีอัตราเฟรมต่างกัน ที่ประมาณ 60 เฟรมต่อวินาที จะได้ smoothing ≈ 0.08
  cameraY += (targetY - cameraY) * smoothing //ความสูงใหม่ = ความสูงเดิม + ระยะที่ยังห่างจากเป้าหมาย × สัดส่วนที่ขยับ
 
  camera.position.set(
    topCake.position.x + 5,
    cameraY + 3.5,
    7
  )
  camera.lookAt(topCake.position.x, cameraY, 0)

  renderer.render(scene, camera)
})