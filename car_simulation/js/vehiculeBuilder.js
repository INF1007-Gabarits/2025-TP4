Vehicule = function (name, components, movements, scene, shadowGenerator, startZ) {
    this.name = name;
    this.components = components;
    this.movements = movements;
    this.scene = scene
    this.shadowGenerator = shadowGenerator
    this.startZ = startZ
    this.generate();
};

Vehicule.prototype.generate = function () {

    // welcome to callback hell lol
    this.loadFrame()
};

Vehicule.prototype.loadFrame = function() {
    let _this = this
    const frameComponent = this.components.filter(s => s.includes('_frame'))[0];

    BABYLON.SceneLoader.ImportMesh("", componentsMap[frameComponent], `${frameComponent}.obj`, _this.scene, function (newMeshes) {
        newMeshes.forEach(mesh => {
            mesh.receiveShadows = true;
            _this.shadowGenerator.getShadowMap().renderList.push(mesh);
            mesh.material.backFaceCulling = false;
        });

        frame = BABYLON.Mesh.MergeMeshes(newMeshes, true, true, false, false, true)
        _this.loadWheels(_this, frame)
    });
}

Vehicule.prototype.loadWheels = function(_this, frame) {

    let size = frame.getBoundingInfo().boundingBox.extendSize;
    const wheels = _this.components.filter(s => s.includes('_wheel'));
    let frameName = _this.components.filter(s => s.includes('_frame'))[0];
    let points = getPointsAroundCar(wheels.length, size.x, size.z, axesMap[frameName])
    let height = 0
    let loadedWheels = 0
    let toMerge = [frame]

    for (let i = 0; i < wheels.length; i++) {

        let simBtn = document.getElementById("simBtn")
        simBtn.disabled = true

        BABYLON.SceneLoader.ImportMesh("", componentsMap[wheels[i]], `${wheels[i]}.obj`, _this.scene, function (newMeshes) {
            newMeshes.forEach(mesh => {
                    mesh.position = points[i]
                });

            let wheel = BABYLON.Mesh.MergeMeshes(newMeshes, true, true, false, false, true)
            let wheelSize = wheel.getBoundingInfo().boundingBox.extendSize
            toMerge.push(wheel)
            height = Math.max(height, wheelSize._y)

            loadedWheels += 1
            
            if (loadedWheels === wheels.length) {
                completeVehicule = BABYLON.Mesh.MergeMeshes(toMerge, true, true, false, false, true)
                let size = completeVehicule.getBoundingInfo().boundingBox.extendSize
                completeVehicule.position.z = _this.startZ - size.z
                completeVehicule.position.y = height
                _this.vehicule = completeVehicule
                startMvmnt = _this.movements[0]
                completeVehicule.position.x += startMvmnt.position[0]
                completeVehicule.position.y += startMvmnt.position[1]
                completeVehicule.position.z += startMvmnt.position[2]
                _this.startPos = completeVehicule.position
                completeVehicule.receiveShadows = true;
                _this.shadowGenerator.getShadowMap().renderList.push(completeVehicule);
                let simBtn = document.getElementById("simBtn")
                simBtn.disabled = false
                
            }

        });
    }
}

Vehicule.prototype.toNextState = function() {

    nextState = this.movements.shift()

    if (nextState === undefined) {
        return false
    }

    nextPosition = nextState.position

    let x = nextPosition[0]
    let y = nextPosition[1] + this.vehicule.position.y
    let z = nextPosition[2] + this.startPos.z

    this.vehicule.position = new BABYLON.Vector3(x, y, z)

    return true
}