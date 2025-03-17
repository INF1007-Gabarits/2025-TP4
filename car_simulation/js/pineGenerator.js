PineGenerator = function (scene, shadowGenerator, ground, minxz, maxxz, miny, quantity) {
    this.quantity = quantity;
    this._trees = [];
    this.scene = scene;

    this.minXZ = minxz;
    this.maxXZ = maxxz;
    this.minY = miny;

    this.ground = ground;
    this.shadowGenerator = shadowGenerator;
    this.generate();
};

PineGenerator.prototype.generate = function () {

    this.clean();

    let minXZ = this.minXZ
    let maxXZ = this.maxXZ
    let minY = this.minY

    for (let j = 0; j < this.quantity; j++) {
        BABYLON.SceneLoader.ImportMesh("", "assets/scenes/pine_tree/", "pine.obj", scene, function (newMeshes) {
            let x, y, z = 0
            do {
                x = randomNumber(minXZ, maxXZ);
                if (x < 50 && x > 0) x += 50
                else if (x < 0 && x > -50) x -= 50
                
                z = randomNumber(minXZ, maxXZ);
                y = getHeightAtPoint(x, z);
            } while (y < minY);

            newMeshes.forEach(mesh => {
                this.shadowGenerator.getShadowMap().renderList.push(mesh);
                mesh.receiveShadows = true;
                mesh.position = new BABYLON.Vector3(x, y, z);
            });
        })
    }
};

PineGenerator.prototype.clean = function () {
    this._trees.forEach(function (t) {
        t.dispose();
    });

    this._trees = [];
};
