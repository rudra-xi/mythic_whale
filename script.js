import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lighting
const light = new THREE.DirectionalLight(0xee82ee, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);

// Create a particle system for the moving starfield
const starCount = 5000;
const starsGeometry = new THREE.BufferGeometry();
const starsPositions = new Float32Array(starCount * 10);

// Randomize star positions
for (let i = 0; i < starCount; i++) {
	const x = (Math.random() - 0.5) * 1000;
	const y = (Math.random() - 0.5) * 1500;
	const z = (Math.random() - 0.5) * 2000;
	starsPositions[i * 3] = x;
	starsPositions[i * 3 + 1] = y;
	starsPositions[i * 3 + 2] = z;
}

// Add positions to the geometry
starsGeometry.setAttribute(
	"position",
	new THREE.BufferAttribute(starsPositions, 3)
);

// Create a material for the stars with a bluish color
const starsMaterial = new THREE.PointsMaterial({
	color: 0xee82ee,
	size: 0.5,
	transparent: true,
	opacity: 1,
});

// Create the particle system
const starfield = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starfield);

// Animation mixer
let mixer;
let model;

// Load the GLTF model
const loader = new GLTFLoader();
loader.load(
	"./assets/mythic_whale_model/scene.gltf",
	function (gltf) {
		model = gltf.scene;
		scene.add(model);

		model.position.set(-1, -1.2, 2.2);
		model.scale.set(4.5, 4.5, 4.5);

		model.rotation.x = 0.4;
		model.rotation.y = -50;
		model.rotation.z = -0.7;

		if (gltf.animations && gltf.animations.length > 0) {
			mixer = new THREE.AnimationMixer(model);
			gltf.animations.forEach((clip) => {
				mixer.clipAction(clip).play();
			});
		} else {
			console.warn("No animations found in the GLTF file.");
		}
	},
	undefined,
	function (error) {
		console.error("An error occurred while loading the model:", error);
	}
);

camera.position.set(4.7, -1, 4);
camera.lookAt(0, 0, 0);

// Mouse rotation variables
let isRotating = false;
let previousMousePosition = {
	x: 0,
	y: 0,
};

// Mouse event listeners for rotation
renderer.domElement.addEventListener("mousedown", (event) => {
	isRotating = true;
});

renderer.domElement.addEventListener("mousemove", (event) => {
	if (isRotating && model) {
		const deltaMove = {
			x: event.offsetX - previousMousePosition.x,
			y: event.offsetY - previousMousePosition.y,
		};

		const rotationSpeed = 0.01;
		model.rotation.y += deltaMove.x * rotationSpeed;
		model.rotation.x += deltaMove.y * rotationSpeed;
	}

	previousMousePosition = {
		x: event.offsetX,
		y: event.offsetY,
	};
});

renderer.domElement.addEventListener("mouseup", () => {
	isRotating = false;
});

renderer.domElement.addEventListener("mouseleave", () => {
	isRotating = false;
});

// Mouse wheel event listener for scaling
renderer.domElement.addEventListener("wheel", (event) => {
	if (model) {
		const scaleSpeed = 0.001;
		model.scale.x += event.deltaY * scaleSpeed;
		model.scale.y += event.deltaY * scaleSpeed;
		model.scale.z += event.deltaY * scaleSpeed;

		model.scale.x = Math.max(0.1, Math.min(5, model.scale.x));
		model.scale.y = Math.max(0.1, Math.min(5, model.scale.y));
		model.scale.z = Math.max(0.1, Math.min(5, model.scale.z));
	}
});

// Animation loop
const clock = new THREE.Clock();
function animate() {
	requestAnimationFrame(animate);

	if (mixer) {
		const delta = clock.getDelta();
		mixer.update(delta);
	}

	const positions = starfield.geometry.attributes.position.array;
	for (let i = 0; i < positions.length; i += 3) {
		positions[i + 2] += 0.5;
		if (positions[i + 2] > 1000) {
			positions[i + 2] = -1000;
		}
	}
	starfield.geometry.attributes.position.needsUpdate = true;

	renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});
