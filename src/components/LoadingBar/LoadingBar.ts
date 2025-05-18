import * as BUI from "@thatopen/ui";

export function LoadingBar({ percent = 0, elements = 0 }) {
  return BUI.Component.create(() => {
    return BUI.html`
      <div style="
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 40px;
        background: rgba(30,30,30,0.95);
        display: flex;
        align-items: center;
        z-index: 9999;
        font-family: sans-serif;
        color: #fff;
        ">
        <div style="flex:1; margin: 0 1rem;">
          <div style="height: 8px; background: #444; border-radius: 4px; overflow: hidden;">
            <div style="
              width: ${percent}%;
              height: 100%;
              background: linear-gradient(90deg, #6c63ff 0%, #48c6ef 100%);
              transition: width 0.3s;
            "></div>
          </div>
          <div style="margin-top: 4px; font-size: 0.9rem;">
            Cargando modelo: <b>${percent}%</b> &nbsp; | &nbsp; Elementos: <b>${elements}</b>
          </div>
        </div>
      </div>
    `;
  });
}
