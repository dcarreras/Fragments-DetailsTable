import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import { InfoTable, ElementData } from "..";

// Definición de la interfaz para el estado de la lista de elementos
interface ElementsListState {
  components: OBC.Components;
}

// Componente que renderiza la tabla de elementos
const template: BUI.StatefullComponent<ElementsListState> = (state) => {
  const { components } = state;
  // Obtener la información de la tabla de info
  const info = components.get(InfoTable);

  // Función de carga de datos para la tabla
  const loadFunction: BUI.TableLoadFunction<ElementData> = async () => {
    return info.tableData;
  };

  // Función que se llama cuando el componente es creado
  const onCreated = (e?: Element) => {
    if (!(e instanceof BUI.Table)) return;
    const table = e as BUI.Table<ElementData>;
    // Asignar la función de carga de datos a la tabla
    table.loadFunction = loadFunction;
    // Cargar los datos de la tabla
    table.loadData(true);
  };

  // Retorna el HTML para la tabla
  return BUI.html`<bim-table ${BUI.ref(onCreated)} collapsed></bim-table>`;
};

// Función que exporta la UI de la información
export function InfoUI(components: OBC.Components) {
  // Obtener la información de la tabla de info
  const info = components.get(InfoTable);

  // Crear el componente de la tabla
  const [table, updateTable] = BUI.Component.create<
    BUI.Table,
    ElementsListState
  >(template, { components });

  // Configurar las columnas de la tabla
  table.columns = [
    { name: "category", width: "5rem" },
    { name: "name", width: "15rem" },
    { name: "value", width: "15rem" },
  ];

  // Actualizar la tabla cuando se selecciona una categoría
  info.onSelectedCategory.add(updateTable);

  // Crear el componente del panel de elementos
  const elementsTable = BUI.Component.create<BUI.Panel>(() => {
    return BUI.html`
    <bim-panel style="max-height: 20rem; max-width: 60rem; justify-self: center;">
      <bim-panel-section label="Elements" icon="ix:element" collapsed>
        ${table}
      </bim-panel-section>
    </bim-panel>
    `;
  });

  // Crear el dropdown de categorías
  const categoriesDrop = document.createElement("bim-dropdown");

  function updateDropdownOptions() {
    categoriesDrop.innerHTML = "";
    info.categories?.forEach((category) => {
      const option = document.createElement("bim-option");
      option.value = category;
      option.label = category;
      categoriesDrop.append(option);
    });
  }

  updateDropdownOptions();
  info.onSelectedCategory.add(updateDropdownOptions);

  // Función que se llama cuando se cambia el valor del dropdown
  categoriesDrop.addEventListener("change", async () => {
    BUI.ContextMenu.removeMenus();
    // Modificar la visibilidad basada en la categoría seleccionada
    await info.modifyVisibility(categoriesDrop.value[0]);
  });

  // Configurar el dropdown
  categoriesDrop.label = "Category";
  categoriesDrop.vertical = true;

  // Crear el componente del dropdown
  const dropdown = BUI.Component.create(() => {
    return BUI.html`
    <bim-toolbar-section label="Show" icon="material-symbols:category">
      ${categoriesDrop}
     <bim-button label="Reset" icon="ix:reset" @click=${() =>
       info.reset()}></bim-button> 
    </bim-toolbar-section> 
    `;
  });

  // Retorna los componentes de la tabla de elementos y el dropdown
  return { elementsTable, dropdown };
}
