randomNumber = function (min, max) {
        if (min == max) {
        return (min)
    }
    var random = Math.random()
    return ((random * (max - min)) + min)
};


getHeightAtPoint = function(x, z, show = false) {

    var origin = new BABYLON.Vector3(x, -1, z)
    var forward = new BABYLON.Vector3(0, 1, 0)

    var length = 1000

    var ray = new BABYLON.Ray(origin, forward, length)

    if(show) {
        let rayHelper = new BABYLON.RayHelper(ray);
        rayHelper.show(scene);
    }

    var hit = scene.pickWithRay(ray)

    return hit.distance - 1
}

getPointsAroundCircle = function(n, radius) {
    let points = []

    if( n === 1)
        return [(0, 0, 0)]

    for (let k = 0; k < n; k++) {
        x = radius * Math.cos(k * 2 * Math.PI / n)
        y = 0
        z = radius * Math.sin(k * 2 * Math.PI / n)
        points.push(new BABYLON.Vector3(x, y, z))
    }

    return points
}

getPointsAroundCar = function(n, width, length, nAxes) {
    let points = []

    if( n === 1)
        return [new BABYLON.Vector3(0, 0, 0)]

    let axes = []
    if (nAxes === 1) {
        axes.push(0)
    } else {
        axes.push(-width)
        axes.push(width)
    }

    nSideWheels = Math.floor(n / nAxes)
    sideWheels = []

    for(let j = 0; j < nAxes; j++){
        if(j < n % nAxes) {
            sideWheels.push(nSideWheels + 1)
        } else {
            sideWheels.push(nSideWheels)
        }

    }

    // to propery align with the motorcycle wheel holders
    let hackyConst = 2
    if (nAxes === 1){
        hackyConst = 2.4
    }

    let y = 0
    for(let i = 0; i < axes.length; i++) {
        for (let k = 0; k < sideWheels[i]; k++) {
            let lengthSegment = hackyConst * length / sideWheels[i]
            let z = -length + k * lengthSegment + lengthSegment / 2
            points.push(new BABYLON.Vector3(axes[i] , y, z))
        }
    }
    

    if (n % 2 === 1) {
        points.push(new BABYLON.Vector3(axes[0], y, 0))
    }

    return points

}