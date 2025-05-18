import { LoadingBar } from "./LoadingBar";

let loadingBarInstance: HTMLElement | null = null;

export function showLoadingBar(percent = 0, elements = 0) {
  if (!loadingBarInstance) {
    loadingBarInstance = LoadingBar({ percent, elements });
    document.body.appendChild(loadingBarInstance);
  } else {
    document.body.removeChild(loadingBarInstance);
    loadingBarInstance = LoadingBar({ percent, elements });
    document.body.appendChild(loadingBarInstance);
  }
}
