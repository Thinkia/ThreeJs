// Carl Bateman
// based on original C source by Mateusz Ma³czak
// free to use by one and all, but please give credit
// no warranty express or implied
THREE.HeartGeometry = function (oArg) {
  THREE.Geometry.call(this);
  //planes count and number of points in each layer
  var LAYERS = 10;
  var POINTS_IN_LAYER = 40;

  var textureStyle = "repeat";
  if (oArg !== undefined) {
    LAYERS = Math.ceil(oArg.no_of_layers || 10);
    POINTS_IN_LAYER = Math.ceil(oArg.points_per_layer || 40);
    textureStyle = oArg.textureStyle || false;
  }

  var half = new THREE.Vector3(0.5, 0.5, 0.5);

  // heart function : ( 2x^2 + y^2 + z^2 - 1)^3 - 0.1x^2z^3 - y^2z^3
  function f(x, y, z) {
    var xx = x * x;
    var yy = y * y;
    var zz = z * z;
    var a = 2 * xx + yy + zz - 1;
    return (a * a * a) - (0.1 * xx + yy) * zz * z;
  };

  this.addFace = function (v1, v2, v3) {
    var vt1 = this.vertices[v1].clone();
    var vt2 = this.vertices[v2].clone();
    var vt3 = this.vertices[v3].clone();

    // texture can be applied 1 of 4 ways
    // repeat, project, fold, wrap
    // 1. repeated front and back (default)
    // 2. projected through (like a stick of rock) rear will appear reversed
    // 3. folded / half-and-half - left half of texture on front right half on rear
    // 4. wrap <- not implemented!!!

    // stretch image round heart
    // should back of heart be reversed (wrapped) or not (projected through like stick of rock)
    // are vertices on back of heart?
    var back = vt1.x < 0 || vt2.x < 0 || vt3.x < 0;

    vt1.divide(maxVec); vt1.add(half);
    vt2.divide(maxVec); vt2.add(half);
    vt3.divide(maxVec); vt3.add(half);

    this.faces.push(new THREE.Face3(v1, v2, v3));

    if (textureStyle === "Fold") {
      if (back)
        this.faceVertexUvs[0].push([
          new THREE.Vector2(0.5 + vt1.z / 2, vt1.y),
          new THREE.Vector2(0.5 + vt2.z / 2, vt2.y),
          new THREE.Vector2(0.5 + vt3.z / 2, vt3.y),
        ]);
      else
        this.faceVertexUvs[0].push([
          new THREE.Vector2(0.5 - vt1.z / 2, vt1.y),
          new THREE.Vector2(0.5 - vt2.z / 2, vt2.y),
          new THREE.Vector2(0.5 - vt3.z / 2, vt3.y),
        ]);
    } else if (textureStyle === "Project") {
      this.faceVertexUvs[0].push([
        new THREE.Vector2(1 - vt1.z, vt1.y),
        new THREE.Vector2(1 - vt2.z, vt2.y),
        new THREE.Vector2(1 - vt3.z, vt3.y),
      ]);
    } else { // "Repeat"
      if (back)
        this.faceVertexUvs[0].push([
          new THREE.Vector2(vt1.z, vt1.y),
          new THREE.Vector2(vt2.z, vt2.y),
          new THREE.Vector2(vt3.z, vt3.y),
        ]);
      else
        this.faceVertexUvs[0].push([
          new THREE.Vector2(1 - vt1.z, vt1.y),
          new THREE.Vector2(1 - vt2.z, vt2.y),
          new THREE.Vector2(1 - vt3.z, vt3.y),
        ]);
    }
  }

  var alfa = 0.0;

  //heart surface constrains
  var XMIN = -3.0;
  var XMAX = 3.0;
  var YMIN = XMIN;
  var YMAX = XMAX;
  var ZMIN = XMIN;
  var ZMAX = XMAX;
  var XSIZE = 100.0;
  var YSIZE = XSIZE;

  var p1 = new THREE.Vector3();
  var p2 = new THREE.Vector3();
  var pn = new THREE.Vector3();
  var lX, lZ, lY, f1, f2, fn;
  var finished = false;
  var i, j;

  var alfa = 0.0;
  var dalfa = Math.PI * 2 / POINTS_IN_LAYER;

  var rt = Math.sqrt(0.5) * 0.99;//  - 1.0e-10;// 
  var dx = rt / LAYERS;

  var maxVec = new THREE.Vector3(0, 0, 0);
  var minVec = new THREE.Vector3(0, 0, 0);

  for (var X = -rt, hi = 0; hi <= LAYERS; X += dx, hi++) {
    var alfa = Math.PI / 2;

    for (i = 0; i < POINTS_IN_LAYER; i++) {
      p1 = new THREE.Vector3(X, 0.0, 0.0);
      p2 = new THREE.Vector3(X, Math.cos(alfa) * YMAX, Math.sin(alfa) * ZMAX);

      f1 = f(X, p1.y, p1.z);
      f2 = f(X, p2.y, p2.z);
      finished = !((f1 <= 0.0) && (f2 > 0.0));
      while (!finished) {
        pn.y = (p1.y + p2.y) / 2.0;
        pn.z = (p1.z + p2.z) / 2.0;
        fn = f(X, pn.y, pn.z);
        if (fn <= 0) {
          p1 = pn.clone();
          f1 = fn;
        } else {
          p2 = pn.clone();
          f2 = fn;
        };

        finished = !((f1 <= 0.0) && (f2 > 0.0));
        lZ = p2.y - p1.y;
        lY = p2.z - p1.z;
        if ((lY * lY + lZ * lZ) < 0.000001) finished = true;
      };

      lZ = (p2.y + p1.y) / 2.0;
      lY = (p2.z + p1.z) / 2.0;
      this.vertices.push(new THREE.Vector3(X, lY, -lZ));
      alfa += dalfa;

      if (minVec.y > lY) minVec.y = lY;
      if (maxVec.x < X) maxVec.x = X;
      if (maxVec.y < lY) maxVec.y = lY;
      if (maxVec.z < -lZ) maxVec.z = -lZ;
    };
  };
  // move down to center in y
  var correctiony = (maxVec.y + minVec.y) / 2;
  for (var i = 0; i < this.vertices.length; i++) {
    this.vertices[i].y -= correctiony;
  }
  maxVec.y -= correctiony;
  maxVec.multiplyScalar(2);

  // copy vertices front to back
  // reverse order of layers, preserve order of points in layer
  // don't copy the "last" layer as it'll be shared
  var verts = new Array();
  for (var i = LAYERS - 1; i > -1; i--) {
    for (var j = 0; j < POINTS_IN_LAYER; j++) {
      var idx = i * POINTS_IN_LAYER + j;
      var vtx = this.vertices[idx].clone();

      vtx.x = -vtx.x;
      verts.push(vtx);
    }
  }
  this.vertices = this.vertices.concat(verts);

  // loop through all layers - define faces
  for (var x = 0 ; x < LAYERS * 2 ; x++) {
    // join the points in this layer with the points in the next
    for (var y = 0; y < POINTS_IN_LAYER - 1; y++) {
      var v1 = x * POINTS_IN_LAYER + y;
      var v2 = v1 + 1;
      var v3 = (x + 1) * POINTS_IN_LAYER + y;
      var v4 = v3 + 1;

      // makes faces symmetrical across left and right, front and back
      var q = y > (POINTS_IN_LAYER - 1) / 2 ? 0 : 1;
      q ^= x >= LAYERS ? 0 : 1;
      if (q == 1) {
        this.addFace(v1, v2, v3);
        this.addFace(v4, v3, v2);
      } else {
        this.addFace(v3, v1, v4);
        this.addFace(v2, v4, v1);
      }
    }

    // finish off layer - join first and last
    var v1 = (x + 1) * POINTS_IN_LAYER - 1;
    var v2 = x * POINTS_IN_LAYER;
    var v3 = (x + 2) * POINTS_IN_LAYER - 1;
    var v4 = v1 + 1;

    if (x >= LAYERS) {
      this.addFace(v3, v1, v4);
      this.addFace(v2, v4, v1);
    } else {
      this.addFace(v4, v3, v2);
      this.addFace(v1, v2, v3);
    }
  };

  // caps
  lX = Math.sqrt(0.5) + dx / 5.0;
  lY = this.vertices[0].y / 2;

  // front cap
  i = this.vertices.length;
  this.vertices.push(new THREE.Vector3(lX, lY, 0));
  var y = 0;
  for (y = i - POINTS_IN_LAYER; y < i - 1; y++) {
    this.addFace(i, y, y + 1);
  }
  this.addFace(i, y, i - POINTS_IN_LAYER);

  // back cap
  i = this.vertices.length;
  this.vertices.push(new THREE.Vector3(-lX, lY, 0));
  for (y = 0; y < POINTS_IN_LAYER - 1; y++) {
    this.addFace(y, i, y + 1);
  }
  this.addFace(y, i, 0);

  //this.computeCentroids();
  this.computeFaceNormals();
  this.computeVertexNormals();
}

THREE.HeartGeometry.prototype = Object.create(THREE.Geometry.prototype);