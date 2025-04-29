import {
  type Map as MapboxMap,
  MercatorCoordinate,
  LngLatLike,
} from "mapbox-gl";

import {
  Scene,
  DirectionalLight,
  AmbientLight,
  WebGLRenderer,
  PerspectiveCamera,
  Vector3,
  Quaternion,
  Euler,
  Matrix4,
  Group,
} from "three";

export default class ThreejsSceneHelper {
    
  // 创建 threejs 实例， 需要传入 map 和 gl 上下文
  getThreejsInstance({
    map,
    gl,
  }: {
    map: MapboxMap & { __threejs?: WebGLRenderer | null };
    gl: WebGL2RenderingContext;
  }): WebGLRenderer {
    // Only create one threejs instance per context
    if (map.__threejs) {
      return map.__threejs;
    }

    let renderer: WebGLRenderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: map.getCanvas(),
      context: gl,
    });

    renderer.shadowMap.enabled = true;
    renderer.autoClear = false;

    map.__threejs = renderer;

    return renderer;
  }

  // 移除 threejs 实例
  private removeThreejsInstance(
    map: MapboxMap & { __threejs?: WebGLRenderer | null }
  ) {
    map.__threejs = null;
  }

  // 创建场景
  createScene(): Scene {
    const scene = new Scene();
    
	// lights
	const dirLight = new DirectionalLight( 0xffffff, 4 );
	dirLight.position.set( 1, 2, 3 );
	scene.add( dirLight );

	const ambLight = new AmbientLight( 0xffffff, 0.2 );
	scene.add( ambLight );

    return scene;
  }

  // 创建渲染组
  createGroup(parent: Scene | Group, name: string): Group {
    const group = new Group();
    group.name = name;
    parent.add(group);
    return group;
  }

  // 创建相机， 默认使用 PerspectiveCamera
  createCamera(
    sceneRoot: Group,
    name: string
  ): PerspectiveCamera {
    const camera = new PerspectiveCamera();
    camera.name = name;

    const group = new Group();
    group.name = name + "-parent";
    group.add(camera);

    sceneRoot.add(group);
    return camera;
  }

  // 更新世界矩阵， 需要根据 map 的中心点计算世界矩阵，将相对中心的坐标转换到墨卡托坐标系中
  updateWorldMatrix(
    map: MapboxMap,
    refCenter: LngLatLike | null = null
  ): Matrix4 | null {
    if (!map) return null;

    const mapCenter = refCenter ? refCenter : map.getCenter();

    // Calculate mercator coordinates and scale
    const worldOriginMercator = MercatorCoordinate.fromLngLat(mapCenter);
    const worldScale = worldOriginMercator.meterInMercatorCoordinateUnits();
    const worldRotate = [0, 0, 0];

    // Calculate world matrix
    const worldMatrix = new Matrix4();
    worldMatrix.compose(
      new Vector3(
        worldOriginMercator.x,
        worldOriginMercator.y,
        worldOriginMercator.z
      ),
      new Quaternion().setFromEuler(
        new Euler(worldRotate[0], worldRotate[1], worldRotate[2])
      ),
      new Vector3(worldScale, -worldScale, worldScale)
    );

    return worldMatrix;
  }

  private toScenePositionMercator(
    positionMercator: MercatorCoordinate,
    worldMatrixInv: Matrix4
  ): Vector3 {
    const positionRef = new Vector3(
      positionMercator.x,
      positionMercator.y,
      positionMercator.z
    ).applyMatrix4(worldMatrixInv);
    return positionRef;
  }

  private toMapPositionMercator(
    position: Vector3,
    worldMatrix: Matrix4
  ): MercatorCoordinate {
    const positionMercator = position.applyMatrix4(worldMatrix);

    return new MercatorCoordinate(
      positionMercator.x,
      positionMercator.y,
      positionMercator.z
    );
  }

  toScenePosition(position: LngLatLike, worldMatrixInv: Matrix4): Vector3 {
    const positionMercator = MercatorCoordinate.fromLngLat(position);
    return this.toScenePositionMercator(positionMercator, worldMatrixInv);
  }

  toMapPosition(
    position: Vector3,
    worldMatrix: Matrix4
  ): [number, number, number] {
    const positionMercator = this.toMapPositionMercator(position, worldMatrix);
    const lngLat = positionMercator.toLngLat();
    const altitude = positionMercator.toAltitude();
    return [lngLat.lng, lngLat.lat, altitude];
  }

  // 更新相机矩阵，需要将 mapbox 的矩阵转换为 threejs 的矩阵
  // 转换过程中，需要将 viewMatrix 和 projectionMatrix 拆分， 以便设置正确的 view 和 projection 矩阵
  updateCameraForRender(
    camera: PerspectiveCamera,
    map: MapboxMap,
    matrix: number[],
    worldMatrix: Matrix4,
    worldMatrixInv: Matrix4
  ) {
    const mapMatrix = new Matrix4().fromArray(matrix);
    const mvpMatrix = new Matrix4().multiplyMatrices(mapMatrix, worldMatrix);

    // 计算投影矩阵
    camera.fov = map.transform.fov;
    camera.aspect = map.transform.aspect;
    camera.near = map.transform._nearZ;
    camera.far = map.transform._farZ;
    camera.updateProjectionMatrix();
    const projectionMatrixInverse = camera.projectionMatrixInverse;

    // 计算相机矩阵
    const viewMatrix = new Matrix4().multiplyMatrices(projectionMatrixInverse, mvpMatrix);
    const viewMatrixInvert = viewMatrix.clone().invert();
    camera.matrixWorld.copy(viewMatrixInvert);
    camera.matrixWorldInverse.copy(viewMatrix);
    camera.matrixAutoUpdate = false;
    camera.matrixWorldAutoUpdate = false;
  }
}
