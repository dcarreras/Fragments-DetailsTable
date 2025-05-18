import * as FRAGS from "@thatopen/fragments";
import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";

export type ElementData = {
  name: string;
  category: string;
  value?: string;
};

export class InfoTable extends OBC.Component {
  enabled = false;
  static readonly uuid = "ac82b753-4a82-4b12-8947-5445e529c2d9";

  model: FRAGS.FragmentsModel | null = null;
  fragments: FRAGS.FragmentsModels | null = null;
  categories: Set<string> | null = null;
  tableData: BUI.TableGroupData<ElementData>[] = [];

  onSelectedCategory: OBC.Event<void> = new OBC.Event();

  constructor(components: OBC.Components) {
    super(components);
    components.add(InfoTable.uuid, this);
  }

  async init(model: FRAGS.FragmentsModel, fragments: FRAGS.FragmentsModels) {
    this.model = model;
    this.fragments = fragments;
    await this.organizeCategories();
  }

  async organizeCategories() {
    if (!this.model) return;
    const elementsWithGeometry = await this.model.getItemsWithGeometry();
    const categories = (
      await Promise.all(
        elementsWithGeometry.map((element) => element.getCategory()),
      )
    ).filter((element) => element !== null);

    this.categories = new Set(categories);
  }

  async modifyVisibility(category: string) {
    if (!(this.model && this.fragments)) return;
    const categoryItems = await this.model.getItemsOfCategory(category);
    const elements = (
      await Promise.all(categoryItems.map((element) => element.getLocalId()))
    ).filter((element) => element !== null);

    await this.model.setVisible(undefined, false);
    await this.model.setVisible(elements, true);

    await this.fragments.update(true);
    await this.buildTableData(elements);
  }

  async buildTableData(itemsToDisplay: number[]) {
    this.tableData = [];
    const elementsData = await this.model?.getItemsData(itemsToDisplay, {
      attributesDefault: false,
      attributes: ["Name", "NominalValue"],
      relations: {
        IsDefinedBy: {
          attributes: true,
          relations: true,
        },
      },
    });

    if (!elementsData) return;

    const parsedData = elementsData.map((content) => {
      const { Name, _category, _localId, IsDefinedBy } = content;

      if (
        !(
          Name &&
          !Array.isArray(Name) &&
          _category &&
          !Array.isArray(_category) &&
          _localId &&
          !Array.isArray(_localId) &&
          IsDefinedBy
        )
      )
        return null;

      const name = Name.value;
      const category = _category.value;
      const localId = _localId.value;

      return { name, category, localId, IsDefinedBy };
    });

    const tableData: { [key: string]: any } = {};
    for (const element of parsedData) {
      if (!element) continue;

      if (element.category in tableData) {
        tableData[element.category].push(element);
      } else {
        tableData[element.category] = [element];
      }
    }

    for (const [category, elements] of Object.entries(tableData)) {
      const categoryRow: BUI.TableGroupData<ElementData> = {
        data: {
          name: "",
          category,
        },
      };

      const matches = this.tableData.find(
        (row) => row.data.category === category,
      );
      if (!matches) {
        this.tableData.push(categoryRow);
      }

      if (!categoryRow.children) categoryRow.children = [];

      for (const element of elements) {
        const elementRow: BUI.TableGroupData<ElementData> = {
          data: {
            name: element.name,
          },
        };

        categoryRow.children.push(elementRow);

        if (!elementRow.children) elementRow.children = [];

        for (const pset of element.IsDefinedBy) {
          const psetRow: BUI.TableGroupData<ElementData> = {
            data: {
              name: pset.Name.value,
            },
          };

          elementRow.children.push(psetRow);

          if (!psetRow.children) psetRow.children = [];

          if (!pset.HasProperties) continue;

          for (const prop of pset.HasProperties) {
            if (!prop.Name || !prop.NominalValue) continue;

            const propertyRow: BUI.TableGroupData<ElementData> = {
              data: {
                name: prop.Name.value,
                value: prop.NominalValue.value || "-",
              },
            };
            psetRow.children.push(propertyRow);
          }
        }
      }
    }
    this.onSelectedCategory.trigger();
  }

  async reset() {
    await this.model?.setVisible(undefined, true);
    this.fragments?.update(true);

    this.tableData = [];
    this.onSelectedCategory.trigger();
  }
}

export * from "./src";
