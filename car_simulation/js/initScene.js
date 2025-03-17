var canvas
var engine
var ground
var camera
var scene
var shadowGenerator
var assetsManager

var raceTrack
var dirtL
var dirtR

var vehicules = []
var isSimulationRunning = false
var updateTime = 10

var winnerName = ""
var winnerMessage = ""

// Resize the babylon engine when the window is resized
window.addEventListener("resize", function () {
        if (engine) {
                engine.resize();
        }
}, false);


window.onload = function () {

        canvas = document.getElementById("renderCanvas"); // Get the canvas element
        engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

        var targetNode = document.getElementById('splashscreen');
        var observer = new MutationObserver(function () {
                if (targetNode.style.display == 'none') {
                        addUI();
                }
        });

        observer.observe(targetNode, { attributes: true, childList: true });

        setupScene(); //Call the createScene function
        assetsManager = new BABYLON.AssetsManager(scene);
        //setTimeout(runSimulation, updateTime)

        // Register a render loop to repeatedly render the scene
        engine.runRenderLoop(function () {
                scene.render();
        });

        scene.registerBeforeRender(function () {
                if(isSimulationRunning) {
                        success = false
                        for (let i = 0; i < vehicules.length; i++) {
                                outcome = vehicules[i].toNextState();
                                success |= outcome
                        }

                        isSimulationRunning = success

                        if (!isSimulationRunning) {
                                let simBtn = document.getElementById("simBtn")
                                simBtn.disabled = true
                                showWinnerBanner()
                        }
                }
        });

        // Watch for browser/canvas resize events
        window.addEventListener("resize", function () {
                engine.resize();
        });
}

var setupScene = function () {

        // Create the scene space
        scene = new BABYLON.Scene(engine);

        scene.executeWhenReady(function () {
                // Remove loader
                var loader = document.querySelector("#splashscreen");
                loader.style.display = "none";
        });

        // Add a camera to the scene and attach it to the canvas
        setupCamera();

        // Add lights to the scene
        var hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
        hemi.intensity = 0.6;
        hemi.diffuse = new BABYLON.Color3(1, 0.78, 0.51);
        hemi.specular = new BABYLON.Color3(1, 0.89, 0.65);
        hemi.groundColor = new BABYLON.Color3(0.94, 0.6, 0.43);

        var dir = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-1, -1, 1), scene);
        dir.position = new BABYLON.Vector3(500, 250, -500);
        dir.intensity = 0.6

        shadowGenerator = new BABYLON.ShadowGenerator(4096, dir);
        shadowGenerator.normalBias = 0.02;
        shadowGenerator.usePercentageCloserFiltering = true;

        scene.shadowsEnabled = true;

        createTerrain()
        createRaceTrack()
        createSkyBox()
}

var setupCamera = function () {

        camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 20, new BABYLON.Vector3(0, 0, 0), scene);
        camera.setPosition(new BABYLON.Vector3(-96, 65, -245));

        camera.lowerBetaLimit = 0.1;
        camera.upperBetaLimit = (Math.PI / 2) * 0.9;

        camera.lowerRadiusLimit = 25;
        camera.upperRadiusLimit = 300;

        camera.collisionRadius = new BABYLON.Vector3(1, 1, 1);
        camera.checkCollisions = true;
        camera.useBouncingBehavior = true;
        camera.attachControl(canvas, true);
}

var createTerrain = function () {

        BABYLON.SceneLoader.ImportMesh("", "assets/scenes/terrain_tunnels/", "terrain.obj", scene, function (newMeshes) {
                ground = newMeshes[0]
                ground.position = new BABYLON.Vector3(0, 0, 0);
                ground.receiveShadows = true;

                ground.collisionsEnabled = true
                ground.checkCollisions = true

                let pg = new PineGenerator(scene, shadowGenerator, ground, -512, 512, 0, 500);
        });
}

var createSkyBox = function () {
        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 2000.0 }, scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/textures/cute_skybox/skybox", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;
}

var createRaceTrack = function () {

        let x = 0
        let z = 200
        let y = getHeightAtPoint(x, z)


        BABYLON.SceneLoader.ImportMesh("", "assets/scenes/finish/", "finish_line.obj", scene, function (newMeshes) {
                newMeshes.forEach(mesh => {
                        mesh.position = new BABYLON.Vector3(x, y, z)
                        mesh.receiveShadows = true;
                        mesh.material.backFaceCulling = false;
                        shadowGenerator.getShadowMap().renderList.push(mesh);
                });

                raceTrack = newMeshes
        });
}

var placeRaceTrack = function (length) {
        let startLinePos = -95

        let x = 0
        let z = startLinePos + length
        let y = getHeightAtPoint(x, z)

        raceTrack.forEach(mesh => {
                mesh.position = new BABYLON.Vector3(x, y, z)
        });
}

var addUI = function () {
        let input = document.getElementById("input");

        if (!input) {
                input = document.createElement("input");
                input.type = "file";
                input.style.position = "absolute";
                input.style.right = "20px";
                input.style.top = "60px";
                input.style.zIndex = "2"
                input.accept = ".json,.png";
                document.body.appendChild(input);
        }

        // Files input
        var filesInput = new BABYLON.FilesInput(engine, null, null, null, null, null, function () { BABYLON.Tools.ClearLogCache() }, function () { }, null);
        filesInput.onProcessFileCallback = (function (file, name, extension) {
                if (filesInput._filesToLoad && filesInput._filesToLoad.length === 1 && extension) {
                        BABYLON.Tools.ReadFile(file, function (dataText) {
                                let simBtn = document.getElementById("simBtn")
                                simBtn.disabled = false
                                var data = JSON.parse(dataText);
                                setupSimulation(data);
                        });
                }
                return false;
        }).bind(this);

        input.addEventListener('click', function(event) {
                event.target.files = null
                event.target.value = null
                filesToLoad = null
        }, false);

        input.addEventListener('change', function (event) {
                isSimulationRunning = false
                let simBtn = document.getElementById("simBtn")
                simBtn.disabled = true
                cleanSimulation()
                var filestoLoad;
                // Handling files from input files
                if (event && event.target && event.target.files) {
                        filesToLoad = event.target.files;
                }
                filesInput.loadFiles(event);
        }, false);

        let simBtn = document.getElementById("simBtn")
        if (!simBtn) {
                simBtn = document.createElement("button");
                simBtn.id = "simBtn"
                simBtn.type = "button";
                simBtn.textContent = "Simulate!"
                simBtn.style.zIndex = "2"
                simBtn.disabled = true
                document.body.appendChild(simBtn);
                simBtn.style.right = `${5 + input.getBoundingClientRect().width - simBtn.getBoundingClientRect().width}px`
                simBtn.style.top = `${simBtn.getBoundingClientRect().top + 20}px`
        }

        simBtn.addEventListener("click", function () {
                isSimulationRunning = true
        });
}

var setupSimulation = function (data) {
        // Simulation
        let simulation = data.simulation
        if (simulation == null) {
                console.log("No simulation found :(")
                return;
        }

        // Place track
        let track = simulation.track
        if (track == null) {
                console.log("No track found :(")
                return;
        }

        let trackLength = track.length
        if (trackLength == null) {
                console.log("No track length found :(")
                return;
        }

        if (trackLength <= 0 || isNaN(trackLength)) {
                console.log("Invalid track length! >:(")
                return;
        }

        if (trackLength > 230) {
                console.log("Track length max value is 230 >:(")
                return;
        }

        placeRaceTrack(trackLength);

        winnerMessage = simulation.winning_msg;
        winnerName = simulation.winner;

        if (winnerMessage == null || winnerName == null) {
                console.log("Missing information about the winner :(")
                return;
        }

        // Build vehicules
        let vehiculesData = simulation.vehicules
        if (vehiculesData == null || vehiculesData.length === 0) {
                console.log("No vehicules to simulate :(")
                return;
        }

        cmpt = 0
        for (const vehicule of vehiculesData) {
                cmpt++

                let simBtn = document.getElementById("simBtn")
                simBtn.disabled = true

                let name = vehicule.name
                if (name == null) {
                        console.log("Vehicule has no name :(")
                        continue;
                }

                let components = vehicule.components
                if (components == null || components.length === 0) {
                        console.log(`Vehicule ${name} has no components :(`)
                        continue;
                }

                let movements = vehicule.movements
                if (movements == null || movements.length === 0) {
                        console.log(`No movements found for vehicule ${name} :(`)
                        continue;
                }

                isLastVehicule = cmpt == vehiculesData.length
                vehicules.push(new Vehicule(name, components, movements, scene, shadowGenerator, -95))
        }

}

var cleanSimulation = function () {
        for (let i = 0; i < vehicules.length; i++) {
                vehicules[i].vehicule.dispose()
                vehicules[i].vehicule = null
        }
        vehicules = []

        var element = document.getElementById("banner");
        if (element) {
                element.parentNode.removeChild(element);
        }

        var element = document.getElementById("winner-text");
        if (element) {
                element.parentNode.removeChild(element);
        }
}


var showWinnerBanner = function () {
        let winnerBanner = document.getElementById("banner")
        if (!winnerBanner) {
                winnerBanner = document.createElement("p");
                winnerBanner.id = "banner";
                winnerBanner.className = "banner";
                winnerBanner.textContent = winnerName;
                document.body.appendChild(winnerBanner);
        }

        let winnerText = document.getElementById("winner-text")
        if (!winnerText) {
                winnerText = document.createElement("p");
                winnerText.id = "winner-text";
                winnerText.className = "winnerText";
                winnerText.textContent = winnerMessage;
                document.body.appendChild(winnerText);
        }
}