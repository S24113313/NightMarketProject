// =====================
// SCENE SETUP
// =====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fe8ff);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  300
);
camera.position.set(0, 2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// =====================
// LIGHTING
// =====================
scene.add(new THREE.AmbientLight(0xffffff, 0.9));

const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(10, 20, 10);
scene.add(sun);

// =====================
// PHYSICS
// =====================
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// =====================
// TIMER UI
// =====================
const timerEl = document.createElement("div");
timerEl.style.position = "absolute";
timerEl.style.top = "20px";
timerEl.style.right = "20px";
timerEl.style.color = "white";
timerEl.style.fontSize = "24px";
timerEl.innerText = "Time: 0.00s";
document.body.appendChild(timerEl);

let startTime = null;
let finished = false;

// =====================
// ENVIRONMENT
// =====================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshPhongMaterial({ color: 0x8be68b })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
scene.add(ground);

const track = new THREE.Mesh(
  new THREE.PlaneGeometry(5, 100),
  new THREE.MeshPhongMaterial({ color: 0x4fc3f7 })
);
track.rotation.x = -Math.PI / 2;
track.position.y = -0.45;
scene.add(track);

// Trees (BACK FOR REAL)
function makeTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.4, 4),
    new THREE.MeshPhongMaterial({ color: 0x8d6e63 })
  );
  trunk.position.set(x, 1.8, z);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.6),
    new THREE.MeshPhongMaterial({ color: 0x2e7d32 })
  );
  leaves.position.y = 2.5;
  trunk.add(leaves);
  scene.add(trunk);
}

for (let i = 0; i < 20; i++) {
  makeTree(Math.random() * 40 - 20, -Math.random() * 80);
}

// =====================
// CUP (ACTUALLY LOOKS LIKE CUP)
// =====================
const cupGroup = new THREE.Group();

// Outer cup
const cupOuter = new THREE.Mesh(
  new THREE.CylinderGeometry(0.55, 0.55, 1.1, 32, 1, true),
  new THREE.MeshPhongMaterial({ color: 0xff5252, side: THREE.DoubleSide })
);

// Rim
const rim = new THREE.Mesh(
  new THREE.TorusGeometry(0.55, 0.05, 16, 32),
  new THREE.MeshPhongMaterial({ color: 0xffffff })
);
rim.rotation.x = Math.PI / 2;
rim.position.z = 0.55;

cupGroup.add(cupOuter);
cupGroup.add(rim);
cupGroup.rotation.x = Math.PI / 2;
scene.add(cupGroup);

const cupBody = new CANNON.Body({
  mass: 2,
  shape: new CANNON.Cylinder(0.55, 0.55, 1.1, 16)
});
cupBody.position.set(0, 1.2, -10);
cupBody.gravityFactor = 0;
cupBody.fixedRotation = true;
cupBody.linearFactor = new CANNON.Vec3(0, 0, 1);
world.addBody(cupBody);

// =====================
// FINISH GATE
// =====================
const FINISH_Z = -35;

const gate = new THREE.Group();
const postMat = new THREE.MeshPhongMaterial({ color: 0xffffff });

const postL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 0.2), postMat);
const postR = postL.clone();
postL.position.set(-2.5, 2.5, 0);
postR.position.set(2.5, 2.5, 0);

const banner = new THREE.Mesh(
  new THREE.BoxGeometry(6, 1.5, 0.2),
  new THREE.MeshPhongMaterial({ color: 0xff5252 })
);
banner.position.set(0, 5.3, 0);

gate.add(postL, postR, banner);
gate.position.set(0, -0.5, FINISH_Z);
scene.add(gate);

// =====================
// WATER GUN (FORCED VISIBILITY)
// =====================
const gun = new THREE.Group();

// Big barrel (VISIBLE)
const barrel = new THREE.Mesh(
  new THREE.CylinderGeometry(0.15, 0.15, 2),
  new THREE.MeshPhongMaterial({ color: 0x1e88e5 })
);
barrel.rotation.x = Math.PI / 2;
barrel.position.set(0, 0, -1);
gun.add(barrel);

// Handle
const handle = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.8, 0.4),
  new THREE.MeshPhongMaterial({ color: 0x333333 })
);
handle.position.set(0.4, -0.6, -0.5);
gun.add(handle);

camera.add(gun);
gun.position.set(1.5, -1.2, -3);
gun.rotation.y = Math.PI;

// =====================
// WATER STREAM (CLEAR)
// =====================
let shooting = false;
const droplets = [];

window.addEventListener("mousedown", () => {
  shooting = true;
  if (!startTime) startTime = performance.now();
});
window.addEventListener("mouseup", () => shooting = false);

function shootWater() {
  const drop = new THREE.Mesh(
    new THREE.SphereGeometry(0.12),
    new THREE.MeshPhongMaterial({
      color: 0x80d8ff,
      transparent: true,
      opacity: 0.9
    })
  );
  scene.add(drop);

  drop.position.set(
    camera.position.x + 1.2,
    camera.position.y - 0.6,
    camera.position.z - 3
  );

  droplets.push({ mesh: drop, life: 50 });
  cupBody.velocity.z -= 0.25;
}

// =====================
// ANIMATION LOOP
// =====================
function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);

  cupBody.position.y = 1.2;
  cupGroup.position.copy(cupBody.position);

  if (shooting && !finished) {
    shootWater();
  }

  for (let i = droplets.length - 1; i >= 0; i--) {
    droplets[i].mesh.position.z -= 1;
    droplets[i].life--;
    if (droplets[i].life <= 0) {
      scene.remove(droplets[i].mesh);
      droplets.splice(i, 1);
    }
  }

  if (!finished && startTime) {
    timerEl.innerText = `Time: ${((performance.now() - startTime) / 1000).toFixed(2)}s`;
  }

  if (cupBody.position.z <= FINISH_Z && !finished) {
    finished = true;
    cupBody.position.z = FINISH_Z;
    cupBody.velocity.set(0, 0, 0);
    timerEl.innerText = "FINISHED!";
  }

  renderer.render(scene, camera);
}

animate();
