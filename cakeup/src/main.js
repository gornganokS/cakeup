import './style.css'
import * as THREE from 'three'


// ==========================================================
// 1. Setup ฉาก (Scene), กล้อง (Camera) และ ตัววาดภาพ (Renderer)
// ==========================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color('#fff4d6'); // พื้นหลังสีชมพูอ่อนละมุนแบบในรูป

const camera = new THREE.PerspectiveCamera(
  45, //มุมมองแนวตั้ง 45 องศา
  window.innerWidth / window.innerHeight, //สัดส่วนภาพให้ตรงกับหน้าจอ
  0.1, //ระนาบตัดภาพด้านใกล้
  100 //ระนาบตัดภาพด้านไกล
);
camera.position.set(5, 4, 7); 
camera.lookAt(0, 0.5, 0);
//วางกล้องที่ (5, 4, 7) แล้วหันไปมอง (0, 0.5, 0)
const renderer = new THREE.WebGLRenderer({ antialias: true });//สร้าง renderer สำหรับวาดฉาก 3D ส่วน antialias ช่วยให้ขอบวัตถุมีรอยหยักน้อยลง
renderer.setSize(window.innerWidth, window.innerHeight);//กำหนดขนาดพื้นที่วาดภาพให้เท่ากับหน้าต่างเบราว์เซอร์
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));//ปรับความละเอียดให้เข้ากับจอ โดยจำกัดอัตราส่วนไม่เกิน 2 เพื่อไม่ให้ต้องวาดพิกเซลมากเกินไป
renderer.outputColorSpace = THREE.SRGBColorSpace; //ใช้เพื่อให้ภาพoutputอยู่ในระบบสี sRGB ซึ่งใช้แสดงภาพบนหน้าจอทั่วไป

// นำพื้นที่วาดภาพไปใส่ใน <div id="app"> ของหน้าเว็บ
const appContainer = document.querySelector('#app');
if (appContainer) {
    appContainer.appendChild(renderer.domElement);
} else {
    document.body.appendChild(renderer.domElement);
}
/*- ถ้าเจอ #app → ใส่พื้นที่วาดภาพไว้ข้างใน
- ถ้าไม่เจอ → ใส่ไว้ใน <body> โดยตรง
renderer.domElement คือแท็ก <canvas> ที่ renderer ใช้วาดภาพ ส่วน appendChild() คือการนำ element ไปต่อเป็นลูกของ element อีกตัว */

// ==========================================================
// 2. ระบบแสงสว่าง (Lighting)
// ==========================================================
scene.add(new THREE.HemisphereLight('#ffffff', '#b88698', 2));

const light = new THREE.DirectionalLight('#ffffff', 3);
light.position.set(3, 6, 4);
scene.add(light);

// ==========================================================
// 3. ฟังก์ชันสร้างวัตถุทรงกลม/รูปทรงพื้นฐาน
// ==========================================================
function ball(radius, color) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 16),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0
    })
  );
}

function cylinder(radius, height, color, bottom) {
  const round = Math.min(0.09, height * 0.45, radius * 0.2);
  const points = [];
  const segments = 10;

  points.push(new THREE.Vector2(0, 0));
  points.push(new THREE.Vector2(radius - round, 0));

  for (let i = 1; i <= segments; i++) {
    const angle = -Math.PI / 2 + (i / segments) * Math.PI / 2;
    points.push(new THREE.Vector2(
      radius - round + Math.cos(angle) * round,
      round + Math.sin(angle) * round
    ));
  }

  points.push(new THREE.Vector2(radius, height - round));

  for (let i = 1; i <= segments; i++) {
    const angle = (i / segments) * Math.PI / 2;
    points.push(new THREE.Vector2(
      radius - round + Math.cos(angle) * round,
      height - round + Math.sin(angle) * round
    ));
  }

  points.push(new THREE.Vector2(0, height));

  const geometry = new THREE.LatheGeometry(points, 64);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = bottom;
  return mesh;
}

// สร้างกลุ่มวัตถุสำหรับตัวเค้กหลัก
const cake = new THREE.Group();

// จานรองเค้กสีขาวด้านล่างสุด
scene.add(cylinder(1.85, 0.12, '#ffffff', 0));

// ==========================================================
// 4. ฟังก์ชันสร้างเนื้อเค้ก (สีชมพูพาสเทลสลับแถบครีมขาว)
// ==========================================================
function createCakeBody() {
  const radius = 1.4; //รัศมีเค้ก
  const height = 0.64; //ความสูงรวม
  const round = 0.09;//รัศมีความโค้งของขอบ
  const points = []; //เก็บจุดที่ใช้วาดหน้าตัดของเค้ก

  points.push(new THREE.Vector2(0, 0)); //จุดแรกที่กึ่งกลางด้านล่าง, new THREE.Vector2(ระยะจากแกนกลาง, ความสูง)

  for (let i = 0; i <= 12; i++) { //ลูปนี้สร้างจุด 13 จุดตามส่วนโค้งหนึ่งในสี่วงกลม ตั้งแต่มุม −90° ถึง 0°
    const angle = -Math.PI / 2 + (i / 12) * Math.PI / 2;
    points.push(new THREE.Vector2(
      radius - round + Math.cos(angle) * round,
      round + Math.sin(angle) * round
    ));
  }/* x = จุดศูนย์กลางวงกลมแนวนอน + Math.cos(angle) * รัศมี
y = จุดศูนย์กลางวงกลมแนวตั้ง + Math.sin(angle) * รัศมี */

  // เพิ่มจุดตามความสูงถี่ขึ้นเพื่อให้การตัดขอบสีคมชัด ไม่เบลอหากัน
  for (const y of [
    0.160, 0.2, 
    0.320, 0.360, 
    0.480, 0.5, 
    height - round
  ]) {
    points.push(new THREE.Vector2(radius, y));
  }
  /* จุดถูกวางเป็นคู่ใกล้รอยต่อสี
  0.159  สีขาว
  0.160  ← จุดเปลี่ยนสีที่ต้องการ
  0.161  สีชมพู */

  for (let i = 1; i <= 12; i++) {
    const angle = (i / 12) * Math.PI / 2;
    points.push(new THREE.Vector2(
      radius - round + Math.cos(angle) * round,
      height - round + Math.sin(angle) * round
    ));
  }//ทำโค้งจากผนังเข้าหาหน้าเค้ก โดยจุดเริ่มต้นของโค้งมีอยู่แล้วจาก height - round จึงเริ่มที่ i = 1 เพื่อไม่เพิ่มจุดซ้ำ
  
  points.push(new THREE.Vector2(0, height));//เพิ่มจุดกลางหน้าเค้กที่ความสูง 0.64 เพื่อปิดด้านบน

  const geometry = new THREE.LatheGeometry(points, 96);
  /*LatheGeometry นำเส้นหน้าตัดที่สร้างไว้ไปหมุนรอบแกน Y คล้ายการกลึงหรือปั้นหม้อ
  96 คือจำนวนส่วนรอบวง ยิ่งมาก ขอบวงกลมยิ่งดูเรียบ แต่ใช้รายละเอียดมากขึ้น */
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  //position เก็บตำแหน่งจุดยอดทั้งหมดของโมเดล ส่วน position.count คือจำนวนจุดยอด
  //แต่ละจุดต้องใช้สี 3 ค่า คือ R, G, B จึงจองพื้นที่เท่ากับจำนวนจุดคูณ 3
  const pinkColor = new THREE.Color('#f7c0ca');  // ชมพูพาสเทล
  const whiteColor = new THREE.Color('#ffffff'); // ครีมขาว

  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    //วนผ่านทุกจุดยอด แล้วอ่านความสูง Y ของจุดนั้น
    // คำนวณความสูงแบ่งเป็น 4 ชั้นเท่า ๆ กัน (ชั้นละ ~0.16 หน่วย)
    let color;
    if (y < 0.16) {
      color = whiteColor;  // ชั้นที่ 1 (ล่างสุด): ขาว
    } else if (y >= 0.16 && y < 0.32) {
      color = pinkColor;   // ชั้นที่ 2: ชมพู
    } else if (y >= 0.32 && y < 0.48) {
      color = whiteColor;  // ชั้นที่ 3: ขาว
    } else {
      color = pinkColor;   // ชั้นที่ 4 (บนสุด): ชมพู
    }
//บันทึกค่าสีลงช่องของจุดที่ i เช่น จุดที่ 2 จะใช้ช่อง 6, 7, 8
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
//แนบข้อมูลสีเข้ากับรูปทรง โดยเลข 3 บอกว่าแต่ละชุดประกอบด้วย 3 ค่า คือ RGB
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,//ใช้สีที่กำหนดไว้ตามจุดยอด
    roughness: 0.1,//1 = ผิวด้าน, 0 = ผิวเงา
    metalness: 0 //ให้ผิวเป็นวัสดุที่ไม่ใช่โลหะ
  });

  return new THREE.Mesh(geometry, material);//รวมรูปทรงและวัสดุ แล้วส่งวัตถุกลับออกจากฟังก์ชัน
}
cake.add(createCakeBody());

// ==========================================================
// 6. หน้าเค้ก: ตกแต่งด้วยเม็ดช็อกโกแลตทรงกลมแบน สีเข้ม/น้ำเงิน (ไม่มีเทียน)
// ==========================================================
const sprinkleColors = [
  '#ef7796',
  '#5fcbd1',
  '#f3ce51',
  '#b49add'
]

for (let i = 0; i < 28; i++) {
  const angle = i * 2.39996
  const distance = 0.35 + 0.87 * Math.sqrt(i / 27)

  const sprinkle = ball(
    0.04,
    sprinkleColors[i % sprinkleColors.length]
  )

  sprinkle.scale.y = 0.65
  sprinkle.position.set(
    Math.cos(angle) * distance,
    0.65,
    Math.sin(angle) * distance
  )

  cake.add(sprinkle)
}

// ปรับระดับความสูงกลุ่มเค้กให้อยู่เหนือจานรอง แล้วใส่เข้าในฉาก
cake.position.y = 0.12;
scene.add(cake);

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
  font-family: 'Mali', cursive;
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
let cameraX = 0;
let cameraY = 0.5
let lastPlacementPerfect = false
let cameraDelay = 0
let cameraFromX = 0
let cameraFromY = 0.5
let cameraToX = 0
let cameraToY = 0.5
let cameraElapsed = 0
let message = 'แตะหน้าจอ หรือกด Space เพื่อวาง'
let placedCakes = []

const CAMERA_DELAY = 0.2
const CAMERA_DURATION = 0.55

function moveCameraToTop() {
  // เริ่มจากตำแหน่งปัจจุบันของกล้อง
  cameraFromX = cameraX
  cameraFromY = cameraY

  cameraToX = topCake.position.x 
  cameraToY = Math.max(0.5, topCake.position.y)
  // แนวนอน: ตามตำแหน่ง X ของเค้กชั้นบนสุด
  // แนวตั้ง: ตามตำแหน่ง Y แต่ไม่ให้ต่ำกว่า 0.5

  cameraElapsed = 0 
  // ตั้งเวลาที่เคลื่อนมาแล้วกลับเป็นศูนย์ ทำให้สูตร:
  // const t = cameraElapsed / CAMERA_DURATION
  // เริ่มที่ t = 0 หรือจุดเริ่มต้นของการเลื่อนรอบนี้
  cameraDelay = lastPlacementPerfect ? 0 : CAMERA_DELAY
  /* if (lastPlacementPerfect) {
  cameraDelay = 0
} else {
  cameraDelay = CAMERA_DELAY
}
- Perfect: ไม่ต้องรอ เริ่มเลื่อนในลูปได้เลย
- ไม่ Perfect: รอ เช่น 0.2 วินาที แล้วค่อยเริ่มเลื่อน */
}

function updateHud() {
  hud.innerHTML = `
    <div style="font-size: 35px; font-weight: bold">
      ${score} ชั้น
    </div>
    <div>${message}</div>
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
    message = 'try again'
    updateHud()
    return
  }

  // วางใกล้จุดศูนย์กลางพอ จะจัดให้ตรงพอดี
  if (distance <= radius * 0.12) {
    lastPlacementPerfect = true
    movingCake.position.x = topCake.position.x
    message = 'Perfect!'
  } else {
    // ขนาดนี้ใช้กับชั้นถัดไป
    lastPlacementPerfect = false
    const nextRadius = Math.max(0.18, radius - distance * 0.3)
    const shrinkPercent = Math.round(
      (1 - nextRadius / radius) * 100
    )

    radius = nextRadius
    message = `🍰🍰🍰🍰🍰🍰`
  }

  state = 'dropping'
  updateHud()
}

function finishLanding() {
  movingCake.position.y = landingY
  topCake = movingCake
  placedCakes.push(topCake)
  moveCameraToTop()
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
  cameraX = 0;
  cameraY = 0.5
  message = 'แตะหน้าจอ หรือกด Space เพื่อวาง'

  cameraFromX = cameraToX = cameraX
  cameraFromY = cameraToY = cameraY
  cameraElapsed = CAMERA_DURATION
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
  // ใช้เวลากับช่วงหน่วงก่อน
  const waitingTime = Math.min(cameraDelay, delta)
  cameraDelay -= waitingTime

  // เวลาที่เหลือจึงใช้เลื่อนกล้อง
  cameraElapsed = Math.min( //กล้องเคลื่อนมาแล้วกี่วินาที
    cameraElapsed + delta - waitingTime,//delta = เวลาที่ผ่านไปในเฟรมนี้, waitingTime = เวลาของเฟรมนี้ที่ใช้รอ ยังไม่ขยับกล้อง
    CAMERA_DURATION //เวลารวมที่ต้องการให้กล้องเลื่อน เช่น 0.55 วินาที
  )

const t = cameraElapsed / CAMERA_DURATION

// Smootherstep: ค่อย ๆ เร่งและค่อย ๆ หยุด เปลี่ยนความคืบหน้าของเวลาให้เป็นความคืบหน้าของการเคลื่อนที่
const eased = t * t * t * (t * (t * 6 - 15) + 10)
//lerp() หาค่าระหว่างจุดเริ่มต้นกับจุดปลายทาง ค่าเริ่มต้น + (ค่าปลายทาง - ค่าเริ่มต้น) * สัดส่วน
cameraX = THREE.MathUtils.lerp(cameraFromX, cameraToX, eased) //lerp(ค่าเริ่มต้น, ค่าปลายทาง, สัดส่วน)
cameraY = THREE.MathUtils.lerp(cameraFromY, cameraToY, eased)

const distanceScale = Math.max(1, 1.09 / camera.aspect)
/* camera.aspect คือ ความกว้าง ÷ ความสูงหน้าจอ
- จอกว้าง เช่น aspect = 1.6 → ได้ distanceScale = 1
- จอแนวตั้ง เช่น aspect = 0.5 → ได้ distanceScale = 2.18 */

// ย้ายตำแหน่งกล้องและจุดมองไปพร้อมกัน
// เพื่อรักษามุมเฉียงเดิม
camera.position.set(
  cameraX + 5 * distanceScale,
  cameraY + 3.5 * distanceScale,
  7 * distanceScale
)

camera.lookAt(cameraX, cameraY, 0)

  renderer.render(scene, camera)
})