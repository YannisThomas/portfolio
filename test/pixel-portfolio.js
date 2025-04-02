// Main game class
class PixelPortfolio {
    constructor() {
        // Core components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.character = null;
        this.characterModel = null;
        this.characterControls = null;
        this.buildings = [];
        this.interactableObject = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Game state
        this.isLoading = true;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.contentData = {};
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canInteract = false;
        this.clock = new THREE.Clock();
        this.playerVelocity = new THREE.Vector3();
        this.playerDirection = new THREE.Vector3();

        // Asset loaders
        this.modelLoader = new THREE.GLTFLoader ? new THREE.GLTFLoader() : new THREE.GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();

        // Initialize the game
        this.init();
    }

    // Initialize the 3D environment
    async init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.01);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Create renderer with better quality
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true, // Enable antialiasing for smoother edges
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        // Add lights for better visuals
        this.setupLights();

        // Handle window resizing
        window.addEventListener('resize', () => this.onWindowResize());

        // Setup keyboard controls
        this.setupKeyControls();

        // Setup UI event listeners
        this.setupUIEvents();

        // Load character model
        await this.loadCharacter();

        // Load portfolio content data
        this.loadPortfolioContent();

        // Create the world
        this.createWorld();

        // Hide loading screen
        setTimeout(() => {
            document.querySelector('.progress').style.width = '100%';
            setTimeout(() => {
                this.isLoading = false;
                document.getElementById('loading-screen').style.display = 'none';
            }, 500);
        }, 2000);

        // Start animation loop
        this.animate();
    }

    // Set up scene lighting
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // Additional fill light
        const fillLight = new THREE.DirectionalLight(0x8e9eab, 0.3);
        fillLight.position.set(-50, 20, -50);
        this.scene.add(fillLight);
    }

    // Load character model
    async loadCharacter() {
        return new Promise((resolve) => {
            // For simplicity, create a simple character using primitives
            // In a real app, you would load a GLTF model
            const characterGroup = new THREE.Group();

            // Character body
            const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x6C63FF,
                roughness: 0.7,
                metalness: 0.2
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 1;
            body.castShadow = true;
            characterGroup.add(body);

            // Character head
            const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
            const headMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFD1DC,
                roughness: 0.7,
                metalness: 0.1
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 2;
            head.castShadow = true;
            characterGroup.add(head);

            // Add character to scene
            characterGroup.position.set(0, 0, 0);
            this.scene.add(characterGroup);
            this.character = characterGroup;

            // Add a spotlight that follows the character for better visibility
            const characterSpotlight = new THREE.SpotLight(0xffffff, 0.2);
            characterSpotlight.position.set(0, 10, 0);
            characterSpotlight.angle = Math.PI / 6;
            characterSpotlight.penumbra = 0.5;
            characterSpotlight.decay = 2;
            characterSpotlight.distance = 20;
            characterSpotlight.castShadow = true;
            characterSpotlight.shadow.mapSize.width = 1024;
            characterSpotlight.shadow.mapSize.height = 1024;
            characterSpotlight.target = this.character;
            this.scene.add(characterSpotlight);
            this.characterSpotlight = characterSpotlight;

            resolve();
        });
    }

    // Setup keyboard controls for character movement
    setupKeyControls() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'KeyE':
                    if (this.canInteract && this.interactableObject) {
                        this.interactWithBuilding(this.interactableObject);
                    }
                    break;
                case 'Escape':
                    this.toggleMenu();
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        });
    }

    // Create the 3D world with buildings representing portfolio sections
    createWorld() {
        // Create ground
        const groundSize = 100;
        const groundTextureSize = 1024;

        // Load ground textures
        const grassTexture = this.textureLoader.load('textures/grass.jpg');
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(groundSize / 10, groundSize / 10);

        const grassNormal = this.textureLoader.load('textures/grass_normal.jpg');
        grassNormal.wrapS = THREE.RepeatWrapping;
        grassNormal.wrapT = THREE.RepeatWrapping;
        grassNormal.repeat.set(groundSize / 10, groundSize / 10);

        // Create ground plane
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({
            map: grassTexture,
            normalMap: grassNormal,
            roughness: 0.8,
            metalness: 0.1
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Create buildings
        this.createBuilding(
            0, 0,
            5, 3, 5,
            0x6C63FF,
            'Home',
            'Welcome to my interactive portfolio!',
            'index'
        );

        this.createBuilding(
            12, 10,
            4, 4, 4,
            0xFF5733,
            'Projects',
            'Explore my various projects',
            'projects'
        );

        this.createBuilding(
            -12, 10,
            4, 2, 4,
            0x33FF57,
            'Skills',
            'Check out my skills and competencies',
            'competences'
        );

        this.createBuilding(
            12, -10,
            3, 2, 3,
            0x3357FF,
            'Contact',
            'Get in touch with me',
            'contact'
        );

        this.createBuilding(
            -12, -10,
            3, 5, 3,
            0xFFC300,
            'CV',
            'View my professional resume',
            'cv'
        );

        this.createBuilding(
            -20, 0,
            3, 4, 3,
            0x9933FF,
            'Professional Project',
            'Learn about my professional goals',
            'projet-pro'
        );

        this.createBuilding(
            20, 0,
            3, 2, 3,
            0xFF33CC,
            'E4',
            'Explore my E4 project',
            'e4'
        );

        // Add decorations
        this.addDecorations();

        // Add path connections
        this.createPaths();
    }

    // Create a building with more detailed architecture
    createBuilding(x, z, width, height, depth, color, name, description, contentKey) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        // Main building body with beveled edges for smoother look
        const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = height / 2;
        body.castShadow = true;
        body.receiveShadow = true;

        // Roof with smoother geometry
        const roofGeometry = new THREE.ConeGeometry(Math.max(width, depth) * 0.7, height * 0.5, 8);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = height + height * 0.25;
        roof.castShadow = true;

        // Windows with glass effect
        const windowSize = Math.min(width, depth) * 0.2;
        const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x87CEFA,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8,
            emissive: 0x87CEFA,
            emissiveIntensity: 0.5
        });

        // Front windows
        const frontWindow1 = new THREE.Mesh(windowGeometry, windowMaterial);
        frontWindow1.position.set(0, 0, depth / 2 + 0.01);

        const frontWindow2 = new THREE.Mesh(windowGeometry, windowMaterial);
        frontWindow2.position.set(width * 0.3, 0, depth / 2 + 0.01);

        // Add elements to group
        group.add(body);
        group.add(roof);
        group.add(frontWindow1);
        group.add(frontWindow2);

        // Door
        const doorGeometry = new THREE.PlaneGeometry(width * 0.3, height * 0.5);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A2700,
            roughness: 0.9,
            metalness: 0.1
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, height * 0.25, depth / 2 + door.position.set(0, height * 0.25, depth / 2 + 0.02));
        group.add(door);

        // Add interactive properties to the building
        body.userData = {
            type: 'building',
            name: name,
            description: description,
            contentKey: contentKey,
            originalColor: color,
            highlight: false,
            selected: false
        };

        // Add to scene and buildings array
        this.scene.add(group);
        this.buildings.push(body);

        return group;
    }

    // Add decorative elements to the world
    addDecorations() {
        // Trees
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;

            // Don't place trees too close to buildings
            let tooClose = false;
            for (const building of this.buildings) {
                const bx = building.parent.position.x;
                const bz = building.parent.position.z;
                const distance = Math.sqrt(Math.pow(x - bx, 2) + Math.pow(z - bz, 2));
                if (distance < 8) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                this.createTree(x, z, 0.8 + Math.random() * 1.5);
            }
        }

        // Add some rocks
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;

            // Don't place rocks too close to buildings
            let tooClose = false;
            for (const building of this.buildings) {
                const bx = building.parent.position.x;
                const bz = building.parent.position.z;
                const distance = Math.sqrt(Math.pow(x - bx, 2) + Math.pow(z - bz, 2));
                if (distance < 8) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                this.createRock(x, z);
            }
        }

        // Add flowers
        for (let i = 0; i < 100; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;

            // Keep flowers away from buildings
            let tooClose = false;
            for (const building of this.buildings) {
                const bx = building.parent.position.x;
                const bz = building.parent.position.z;
                const distance = Math.sqrt(Math.pow(x - bx, 2) + Math.pow(z - bz, 2));
                if (distance < 5) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                this.createFlower(x, z);
            }
        }
    }

    // Create a nicer, smoother tree
    createTree(x, z, height) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        // Tree trunk - smoother cylinder
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, height, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = height / 2;
        trunk.castShadow = true;

        // Tree leaves - smoother cone
        const leavesGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const leavesMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.8,
            metalness: 0.1
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = height + 0.8;
        leaves.scale.y = 1.2;
        leaves.castShadow = true;

        group.add(trunk);
        group.add(leaves);
        this.scene.add(group);
    }

    // Create a rock
    createRock(x, z) {
        const scale = 0.5 + Math.random() * 0.5;
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        const rockGeometry = new THREE.DodecahedronGeometry(scale, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.1
        });

        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.y = scale / 2;
        rock.rotation.x = Math.random() * Math.PI;
        rock.rotation.y = Math.random() * Math.PI;
        rock.rotation.z = Math.random() * Math.PI;
        rock.scale.set(
            1 + Math.random() * 0.2,
            1 + Math.random() * 0.5,
            1 + Math.random() * 0.2
        );
        rock.castShadow = true;
        rock.receiveShadow = true;

        group.add(rock);
        this.scene.add(group);
    }

    // Create a flower
    createFlower(x, z) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        // Stem
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.25;

        // Flower
        const petalColors = [0xFF69B4, 0xFFD700, 0xFF6347, 0x9932CC, 0x87CEEB];
        const petalColor = petalColors[Math.floor(Math.random() * petalColors.length)];

        const flowerGeometry = new THREE.CircleGeometry(0.1, 8);
        const flowerMaterial = new THREE.MeshStandardMaterial({
            color: petalColor,
            side: THREE.DoubleSide
        });

        // Create petals
        const petals = new THREE.Group();
        for (let i = 0; i < 6; i++) {
            const petal = new THREE.Mesh(flowerGeometry, flowerMaterial);
            petal.position.y = 0.5;
            petal.rotation.x = Math.PI / 2;
            petal.rotation.y = (i / 6) * Math.PI * 2;
            petal.position.z = 0.1;
            petals.add(petal);
        }

        const centerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.5;

        group.add(stem);
        group.add(petals);
        group.add(center);
        this.scene.add(group);
    }

    // Create paths between buildings
    createPaths() {
        // Create paths between the central hub and other buildings
        const homeBuildingPos = this.buildings[0].parent.position;

        for (let i = 1; i < this.buildings.length; i++) {
            const buildingPos = this.buildings[i].parent.position;
            this.createPath(homeBuildingPos.x, homeBuildingPos.z, buildingPos.x, buildingPos.z);
        }

        // Add some additional paths between other buildings
        this.createPath(-12, 10, -20, 0);  // Skills to Professional Project
        this.createPath(12, 10, 20, 0);    // Projects to E4
        this.createPath(-12, -10, -12, 10);  // CV to Skills
        this.createPath(12, -10, 12, 10);    // Contact to Projects
    }

    // Create a path between two points with smoother textures
    createPath(x1, z1, x2, z2) {
        const pathWidth = 1.5;
        const pathColor = 0xD2B48C;

        // Calculate path length and angle
        const dx = x2 - x1;
        const dz = z2 - z1;
        const pathLength = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);

        // Create path segments for a more natural look
        const segmentLength = 1.2;
        const segments = Math.ceil(pathLength / segmentLength);

        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const segX = x1 + t * dx;
            const segZ = z1 + t * dz;

            // Add slight randomness to path for natural look
            const offsetX = (Math.random() - 0.5) * 0.3;
            const offsetZ = (Math.random() - 0.5) * 0.3;

            // Don't offset start and end points
            const finalOffsetX = (i === 0 || i === segments - 1) ? 0 : offsetX;
            const finalOffsetZ = (i === 0 || i === segments - 1) ? 0 : offsetZ;

            const pathGeometry = new THREE.PlaneGeometry(pathWidth, segmentLength);
            const pathMaterial = new THREE.MeshStandardMaterial({
                color: pathColor,
                roughness: 0.9,
                metalness: 0.1,
            });

            const pathSegment = new THREE.Mesh(pathGeometry, pathMaterial);
            pathSegment.position.set(
                segX + finalOffsetX + (segmentLength / 2) * Math.cos(angle),
                0.01,
                segZ + finalOffsetZ + (segmentLength / 2) * Math.sin(angle)
            );
            pathSegment.rotation.x = -Math.PI / 2;
            pathSegment.rotation.z = -angle;
            pathSegment.receiveShadow = true;

            this.scene.add(pathSegment);
        }
    }

    // Handle window resizing
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Update character position based on keyboard input
    updateCharacterMovement(deltaTime) {
        // Only update if character exists
        if (!this.character) return;

        // Calculate movement direction
        this.playerDirection.z = Number(this.moveForward) - Number(this.moveBackward);
        this.playerDirection.x = Number(this.moveRight) - Number(this.moveLeft);
        this.playerDirection.normalize();

        // Apply movement
        const speed = 5.0;
        const velocity = this.playerVelocity;

        if (this.moveForward || this.moveBackward) {
            velocity.z = this.playerDirection.z * speed * deltaTime;
        } else {
            velocity.z = 0;
        }

        if (this.moveLeft || this.moveRight) {
            velocity.x = this.playerDirection.x * speed * deltaTime;
        } else {
            velocity.x = 0;
        }

        // Apply velocity to character position
        this.character.position.x += velocity.x;
        this.character.position.z += velocity.z;

        // Rotate character in movement direction
        if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
            const targetAngle = Math.atan2(velocity.x, velocity.z);
            // Smooth rotation
            const currentAngle = this.character.rotation.y;
            const angleDiff = targetAngle - currentAngle;

            // Handle angle wrapping
            const wrappedDiff = ((angleDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
            this.character.rotation.y += wrappedDiff * 0.1;
        }

        // Update spotlight position
        if (this.characterSpotlight) {
            this.characterSpotlight.position.set(
                this.character.position.x,
                10,
                this.character.position.z
            );
        }

        // Update camera to follow character
        this.updateCamera();
    }

    // Update camera position to follow character
    updateCamera() {
        if (!this.character) return;

        // Desired camera position: behind and above character
        const offsetY = 5;
        const offsetZ = 7;

        // Get character's forward direction (negative z-axis in local space)
        const characterDirection = new THREE.Vector3(0, 0, -1);
        characterDirection.applyQuaternion(this.character.quaternion);

        // Calculate camera position
        const cameraTargetPosition = new THREE.Vector3();
        cameraTargetPosition.copy(this.character.position)
            .add(new THREE.Vector3(0, offsetY, 0))
            .add(characterDirection.multiplyScalar(-offsetZ));

        // Smoothly move camera to target position
        this.camera.position.lerp(cameraTargetPosition, 0.05);

        // Make camera look at character
        const lookAtPosition = new THREE.Vector3();
        lookAtPosition.copy(this.character.position).add(new THREE.Vector3(0, 1.5, 0));
        this.camera.lookAt(lookAtPosition);
    }

    // Check for building interactions
    checkBuildingInteractions() {
        // Reset interaction state
        this.canInteract = false;
        this.interactableObject = null;

        // Hide interaction hint by default
        document.getElementById('interaction-hint').classList.add('hidden');

        // Only check if character exists
        if (!this.character) return;

        // Create a sphere around the character to detect nearby buildings
        const interactionRadius = 5;
        const characterPosition = this.character.position.clone();

        // Check distance to each building
        for (const building of this.buildings) {
            // Reset highlight
            if (building.userData.highlight) {
                building.material.color.setHex(building.userData.originalColor);
                building.userData.highlight = false;
            }

            // Calculate distance to building
            const buildingPosition = new THREE.Vector3();
            buildingPosition.setFromMatrixPosition(building.matrixWorld);
            const distance = characterPosition.distanceTo(buildingPosition);

            // If close enough, enable interaction
            if (distance < interactionRadius) {
                // Highlight building
                building.material.color.setHex(0xFFFFFF);
                building.userData.highlight = true;

                // Enable interaction
                this.canInteract = true;
                this.interactableObject = building;

                // Show interaction hint
                document.getElementById('interaction-hint').classList.remove('hidden');
                break;
            }
        }
    }

    // Interact with a building to show its content
    interactWithBuilding(building) {
        if (!building || !building.userData) return;

        const contentKey = building.userData.contentKey;
        const contentTitle = building.userData.name;

        // Set the content page title
        document.getElementById('page-title').textContent = contentTitle;

        // Load the appropriate content
        const contentData = this.contentData[contentKey] || {
            html: `<div class="portfolio-content"><h2>Content Not Found</h2><p>The content for '${contentTitle}' could not be loaded.</p></div>`
        };

        // Set content
        document.getElementById('page-content').innerHTML = contentData.html;

        // Show the content page
        document.getElementById('content-page').classList.remove('hidden');
    }

    // Setup UI event listeners
    setupUIEvents() {
        // Menu button
        document.getElementById('menu-button').addEventListener('click', () => {
            this.toggleMenu();
        });

        // Resume game
        document.getElementById('resume-game').addEventListener('click', () => {
            document.getElementById('game-menu').classList.add('hidden');
        });

        // Toggle music
        document.getElementById('toggle-music').addEventListener('click', () => {
            this.musicEnabled = !this.musicEnabled;
            document.getElementById('toggle-music').textContent = `MUSIC: ${this.musicEnabled ? 'ON' : 'OFF'}`;
        });

        // Toggle sound
        document.getElementById('toggle-sound').addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            document.getElementById('toggle-sound').textContent = `SOUND: ${this.soundEnabled ? 'ON' : 'OFF'}`;
        });

        // Close content page
        document.getElementById('close-page').addEventListener('click', () => {
            document.getElementById('content-page').classList.add('hidden');
        });
    }

    // Toggle game menu
    toggleMenu() {
        const menu = document.getElementById('game-menu');
        menu.classList.toggle('hidden');
    }

    // Load portfolio content from HTML files for each section
    loadPortfolioContent() {
        this.contentData = {
            'index': {
                html: `
                <div class="portfolio-content">
                    <h2>Welcome to my Interactive Portfolio</h2>
                    <p>Hello! I'm Yannis Thomas, a backend developer with a passion for technology and innovation.</p>
                    <p>This interactive 3D portfolio allows you to explore different aspects of my work and skills. Walk around using WASD or arrow keys and interact with buildings using the E key.</p>
                    
                    <h3>Quick Navigation</h3>
                    <div class="project-cards">
                        <div class="project-card">
                            <h3>Projects</h3>
                            <p>Explore my development projects including web applications, AI models and more.</p>
                        </div>
                        
                        <div class="project-card">
                            <h3>Skills</h3>
                            <p>Learn about my technical skills, programming languages, and expertise.</p>
                        </div>
                        
                        <div class="project-card">
                            <h3>CV</h3>
                            <p>View my professional experience, education, and credentials.</p>
                        </div>
                    </div>
                </div>`
            },
            'projects': {
                html: `
                <div class="portfolio-content">
                    <h2>My Projects</h2>
                    <p>Here are some of the key projects I've worked on:</p>
                    
                    <div class="project-card">
                        <h3>Portfolio</h3>
                        <p>Creation of my portfolio for establishing my professional image.</p>
                        <div class="project-tags">
                            <span>HTML</span>
                            <span>CSS</span>
                            <span>JavaScript</span>
                        </div>
                    </div>
                    
                    <div class="project-card">
                        <h3>AI Internship</h3>
                        <p>Development of an AI model for detecting and classifying road signs.</p>
                        <div class="project-tags">
                            <span>Python</span>
                            <span>CUDA Environment</span>
                            <span>Data Labeling</span>
                            <span>Model Training</span>
                        </div>
                    </div>
                </div>`
            },
            'competences': {
                html: `
                <div class="portfolio-content">
                    <h2>My Skills</h2>
                    
                    <div class="skill-category">
                        <h3>Web Development</h3>
                        <div class="skill-item">
                            <span class="skill-name">HTML</span>
                            <div class="skill-bar">
                                <div class="skill-progress" style="width: 90%"></div>
                            </div>
                        </div>
                        <div class="skill-item">
                            <span class="skill-name">CSS</span>
                            <div class="skill-bar">
                                <div class="skill-progress" style="width: 85%"></div>
                            </div>
                        </div>
                        <div class="skill-item">
                            <span class="skill-name">JavaScript</span>
                            <div class="skill-bar">
                                <div class="skill-progress" style="width: 75%"></div>
                            </div>
                        </div>
                        <div class="skill-item">
                            <span class="skill-name">PHP</span>
                            <div class="skill-bar">
                                <div class="skill-progress" style="width: 80%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="skill-category">
                        <h3>AI & Machine Learning</h3>
                        <div class="skill-item">
                            <span class="skill-name">Python</span>
                            <div class="skill-bar">
                                <div class="skill-progress" style="width: 85%"></div>
                            </div>
                        </div>
                        <div class="skill-item">
                            <span class="skill-name">Data Processing</span>
                            <div class="skill-bar">
                                <div class="skill-progress" style="width: 75%"></div>
                            </div>
                        </div>
                        <div class="skill-item">
                            <span class="skill-name">Model Training</span>
                            <div class="skill-bar">
                                <div class="skill-progress" style="width: 70%"></div>
                            </div>
                        </div>
                    </div>
                </div>`
            },
            'contact': {
                html: `
                <div class="portfolio-content">
                    <h2>Contact Me</h2>
                    <p>Feel free to reach out for collaborations, opportunities, or just to say hello!</p>
                    
                    <div class="contact-info">
                        <div class="contact-item">
                            <h3>Email</h3>
                            <a href="mailto:yannis.thomas22@gmail.com">yannis.thomas22@gmail.com</a>
                        </div>
                        <div class="contact-item">
                            <h3>Phone</h3>
                            <a href="tel:0762358839">07 62 35 88 39</a>
                        </div>
                        <div class="contact-item">
                            <h3>GitLab</h3>
                            <a href="https://gitlab.com/yannis.thomas22" target="_blank">gitlab.com/yannis.thomas22</a>
                        </div>
                    </div>
                    
                    <div class="contact-form">
                        <h3>Send Me a Message</h3>
                        <div class="form-group">
                            <label for="name">Name</label>
                            <input type="text" id="name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="message">Message</label>
                            <textarea id="message" name="message" required></textarea>
                        </div>
                        <button class="form-submit">Send Message</button>
                    </div>
                </div>`
            },
            'cv': {
                html: `
                <div class="portfolio-content">
                    <h2>My Resume</h2>
                    
                    <div class="cv-header">
                        <div class="cv-title">
                            <h3>Yannis Thomas</h3>
                            <p>Backend Developer Junior</p>
                        </div>
                        <div class="cv-contact">
                            <p>yannis.thomas22@gmail.com</p>
                            <p>07 62 35 88 39</p>
                            <p>Rennes, France</p>
                        </div>
                    </div>
                    
                    <div class="cv-section">
                        <h3 class="cv-section-title">Education</h3>
                        <div class="cv-timeline">
                            <div class="cv-item">
                                <div class="cv-item-header">
                                    <div class="cv-item-title">BTS SIO option SLAM</div>
                                    <div class="cv-item-date">2023 - present</div>
                                </div>
                                <div class="cv-item-location">AFTEC Rennes</div>
                                <ul>
                                    <li>Specialization in application development</li>
                                    <li>AI Developer Internship: SmartMoov Solutions - Creating dataset and AI for road signs</li>
                                </ul>
                            </div>
                            
                            <div class="cv-item">
                                <div class="cv-item-header">
                                    <div class="cv-item-title">English LLCER Degree</div>
                                    <div class="cv-item-date">2019 - 2021</div>
                                </div>
                                <div class="cv-item-location">Rennes 2 University</div>
                                <ul>
                                    <li>Two years completed</li>
                                    <li>TOEIC Certification</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="cv-section">
                        <h3 class="cv-section-title">Skills</h3>
                        <div class="skills-grid">
                            <div class="skill-category">
                                <h3>Development</h3>
                                <ul>
                                    <li>Backend programming languages (Python, Java, PHP)</li>
                                    <li>SQL and NoSQL databases</li>
                                    <li>Frontend basics (HTML, CSS, JavaScript)</li>
                                    <li>Agile Methodologies</li>
                                </ul>
                            </div>
                            
                            <div class="skill-category">
                                <h3>Artificial Intelligence</h3>
                                <ul>
                                    <li>Dataset creation and management</li>
                                    <li>Detection model training</li>
                                    <li>Image classification</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>`
            },
            'projet-pro': {
                html: `
                <div class="portfolio-content">
                    <h2>My Professional Project</h2>
                    
                    <div class="vision-section">
                        <h3>Vision and Goals</h3>
                        <p>My ambition is to become an engineer specialized in Artificial Intelligence. This passion was born during my BTS internship where I developed a road sign detection model, and convinced me to pursue a career in this innovative field.</p>
                    </div>
                    
                    <div class="timeline-section">
                        <h3>Career Path</h3>
                        <div class="timeline-item current">
                            <h4>BTS SIO Option SLAM</h4>
                            <p>Current training providing me with solid foundations in development and IT project management.</p>
                        </div>
                        
                        <div class="timeline-item future">
                            <h4>Bachelor's Degree in Computer Science</h4>
                            <p>Next step to deepen my theoretical and practical knowledge in computer science, especially in algorithms and mathematics.</p>
                        </div>
                        
                        <div class="timeline-item future">
                            <h4>Master's in AI - ISTIC Rennes</h4>
                            <p>Excellence program in Artificial Intelligence, allowing me to specialize in my field of passion.</p>
                        </div>
                    </div>
                    
                    <div class="experience-section">
                        <h3>Foundational Experience</h3>
                        <div class="experience-item">
                            <h4>Internship - Detection Model Development</h4>
                            <p>During my second year BTS internship, I had the opportunity to work on a road sign detection project using artificial intelligence. This experience allowed me to:</p>
                            <ul>
                                <li>Discover the practical application of AI in a real-world context</li>
                                <li>Understand the challenges of machine learning and computer vision</li>
                                <li>Develop a strong interest in AI engineering</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="motivation-section">
                        <h3>Why AI?</h3>
                        <div class="motivation-content">
                            <ul>
                                <li>
                                    <span class="highlight">Innovation</span>
                                    <p>AI is at the heart of future technological innovations</p>
                                </li>
                                <li>
                                    <span class="highlight">Impact</span>
                                    <p>Opportunity to develop solutions with concrete impacts on society</p>
                                </li>
                                <li>
                                    <span class="highlight">Challenges</span>
                                    <p>Constantly evolving field offering stimulating intellectual challenges</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>`
            },
            'e4': {
                html: `
                <div class="portfolio-content">
                    <h2>E4 Project</h2>
                    <p>This section presents my E4 project, a key component of my BTS SIO evaluation.</p>
                    
                    <div class="project-showcase">
                        <div class="project-description">
                            <h3>Project Overview</h3>
                            <p>For my E4 project, I developed a comprehensive solution that integrates various aspects of my training including:</p>
                            <ul>
                                <li>Custom software development</li>
                                <li>Database management</li>
                                <li>User interface design</li>
                                <li>System integration</li>
                            </ul>
                        </div>
                        
                        <div class="slideshow-container">
                            <div class="slide">
                                <img src="E4/1.png" alt="E4 Project Slide 1">
                            </div>
                            <div class="slide-navigation">
                                <button class="prev-slide">Previous</button>
                                <button class="next-slide">Next</button>
                            </div>
                        </div>
                    </div>
                </div>`
            }
        };
    }

    // Animation loop
    animate() {
        // Request next frame
        requestAnimationFrame(() => this.animate());

        // Skip if loading
        if (this.isLoading) return;

        // Calculate delta time
        const deltaTime = this.clock.getDelta();

        // Update character movement
        this.updateCharacterMovement(deltaTime);

        // Check for building interactions
        this.checkBuildingInteractions();

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the portfolio when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make sure THREE.js is loaded
    if (typeof THREE !== 'undefined') {
        // Create new portfolio instance
        const portfolio = new PixelPortfolio();

        // Add extra event listeners for slideshow navigation in E4 section
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('prev-slide')) {
                // Handle previous slide
                const slideshowContainer = e.target.closest('.slideshow-container');
                if (slideshowContainer) {
                    const currentSlide = slideshowContainer.querySelector('.slide.active') || slideshowContainer.querySelector('.slide');
                    if (currentSlide) {
                        const prevSlide = currentSlide.previousElementSibling ||
                            slideshowContainer.querySelectorAll('.slide')[slideshowContainer.querySelectorAll('.slide').length - 1];
                        if (prevSlide && prevSlide.classList.contains('slide')) {
                            currentSlide.classList.remove('active');
                            prevSlide.classList.add('active');
                        }
                    }
                }
            } else if (e.target.classList.contains('next-slide')) {
                // Handle next slide
                const slideshowContainer = e.target.closest('.slideshow-container');
                if (slideshowContainer) {
                    const currentSlide = slideshowContainer.querySelector('.slide.active') || slideshowContainer.querySelector('.slide');
                    if (currentSlide) {
                        const nextSlide = currentSlide.nextElementSibling ||
                            slideshowContainer.querySelector('.slide');
                        if (nextSlide && nextSlide.classList.contains('slide')) {
                            currentSlide.classList.remove('active');
                            nextSlide.classList.add('active');
                        }
                    }
                }
            }
        });

        // Initialize tab functionality for content pages
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                const tabButtons = e.target.closest('.content-tabs').querySelectorAll('.tab-button');
                const tabContents = document.querySelectorAll('.tab-content');

                // Get target tab
                const targetId = e.target.getAttribute('data-tab');

                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                // Update active tab content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetId) {
                        content.classList.add('active');
                    }
                });
            }
        });
    } else {
        console.error('THREE.js not loaded. Please include the library before initializing the portfolio.');
    }
});
