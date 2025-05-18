import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import * as THREE from "three";
import * as FRAGS from "@thatopen/fragments";
import { InfoTable, InfoUI } from "./bim-components";
import { showLoadingBar } from "./components/LoadingBar/LoadingBarService";

// Configuración inicial
BUI.Manager.init();
const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);

// Configuración del mundo 3D
const world = worlds.create<
  OBC.SimpleScene,
  // The template previously uses the OrthoPerspective camera and the
  // Postproduction renderer
  // But that can introduce visual bugs
  OBC.SimpleCamera,
  OBC.SimpleRenderer
>();
world.name = "Main";

world.scene = new OBC.SimpleScene(components);
world.scene.setup();
world.scene.three.background = null;

// Configuración del viewport
const viewport = BUI.Component.create<BUI.Viewport>(() => {
  return BUI.html`
    <bim-viewport>
      <bim-grid floating></bim-grid>
    </bim-viewport>
  `;
});

// Configuración del renderer y cámara
world.renderer = new OBC.SimpleRenderer(components, viewport);
world.camera = new OBC.SimpleCamera(components);
world.camera.controls.setLookAt(183, 11, -102, 27, -52, -11);

// Configuración del grid
const viewportGrid = viewport.querySelector<BUI.Grid>("bim-grid[floating]")!;
const worldGrid = components.get(OBC.Grids).create(world);
worldGrid.material.uniforms.uColor.value = new THREE.Color(0x424242);
worldGrid.material.uniforms.uSize1.value = 2;
worldGrid.material.uniforms.uSize2.value = 8;

// Eventos y actualizaciones
viewport.addEventListener("resize", () => {
  world.renderer?.resize();
  world.camera.updateAspect();
});

// Configuración de fragmentos
const workerUrl = "/node_modules/@thatopen/fragments/dist/Worker/worker.mjs";
const fragments = new FRAGS.FragmentsModels(workerUrl);

world.camera.controls.addEventListener("update", () => fragments.update(true));

// Inicialización de componentes
components.init();
const infoTable = new InfoTable(components);

// Configuración del modelo
fragments.models.list.onItemSet.add(({ value: model }) => {
  model.useCamera(world.camera.three);
  world.scene.three.add(model.object);
  model.object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeBoundingSphere();
      child.geometry.computeBoundingBox();
      if (child.geometry.attributes.position) {
        child.geometry.attributes.position.needsUpdate = true;
      }
      if (child.geometry.index) {
        child.geometry.index.needsUpdate = true;
      }
    }
  });
  fragments.update(true);
});

// Configuración del serializador
const serializer = new FRAGS.IfcImporter();
serializer.wasm = {
  absolute: true,
  path: "https://unpkg.com/web-ifc@0.0.68/",
};

// Función de carga del modelo
const loadModel = async (file: File | Response) => {
  showLoadingBar(0, 0);
  const ifcBuffer = await file.arrayBuffer();
  showLoadingBar(30, 0);
  const ifcBytes = new Uint8Array(ifcBuffer);
  const fragmentBytes = await serializer.process({
    bytes: ifcBytes,
  });
  showLoadingBar(60, 0);
  const loadedModel = await fragments.load(fragmentBytes, {
    modelId: "example",
  });
  const elementCount = (await loadedModel.getItemsWithGeometry()).length;
  showLoadingBar(100, elementCount);
  return loadedModel;
};

// Inicialización del modelo
const initializeModel = async () => {
  try {
    const response = await fetch("./LON1X1-BIL-BZ-ZZ-M3-S-0002_V20.ifc");
    if (!response.ok) throw new Error("No se pudo cargar el archivo IFC");
    const loadedModel = await loadModel(response);
    await infoTable.init(loadedModel, fragments);
  } catch (error) {
    console.error("Error al cargar el modelo:", error);
    console.error("Hubo un error al cargar el modelo IFC");
  }
};

// Inicialización de la UI
const { elementsTable, dropdown } = InfoUI(components);

const toolbar = BUI.Component.create(() => {
  return BUI.html`
    <bim-tabs floating style="justify-self: center; border-radius: 0.5rem;">
      <bim-tab label="Visibility" icon="">
        <bim-toolbar>
        ${dropdown}
        </bim-toolbar> 
      </bim-tab>
    </bim-tabs>
  `;
});

// Configuración del layout
const app = document.getElementById("app") as BUI.Grid;
app.layouts = {
  main: {
    template: `"viewport" auto`,
    elements: { viewport },
  },
};
app.layout = "main";

viewportGrid.layouts = {
  main: {
    template: `
      "elementsTable" auto
      "empty" 1fr
      "toolbar" auto
      /1fr
    `,
    elements: { toolbar, elementsTable },
  },
};
viewportGrid.layout = "main";

// Iniciar la aplicación
await initializeModel();
