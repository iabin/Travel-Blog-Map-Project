export class ScenePanelControl {
    constructor(buttons = []) {
        this.buttonsConfig = buttons;
        this.container = null;
        this.buttonElements = {};
    }

    onAdd() {
        this.container = document.createElement("div");
        this.container.className = "maplibregl-ctrl map-control-panel card";

        const body = document.createElement("div");
        body.className = "card-body";

        const title = document.createElement("h6");
        title.className = "card-title mb-2";
        title.textContent = "Map controls";
        body.appendChild(title);

        this.buttonsConfig.forEach(buttonConfig => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "btn btn-sm btn-outline-secondary map-control-button";
            button.addEventListener("click", () => {
                buttonConfig.onToggle();
                this.render();
            });

            this.buttonElements[buttonConfig.key] = button;
            body.appendChild(button);
        });

        this.container.appendChild(body);
        this.render();
        return this.container;
    }

    onRemove() {
        this.container?.remove();
        this.container = null;
        this.buttonElements = {};
    }

    render() {
        this.buttonsConfig.forEach(buttonConfig => {
            const button = this.buttonElements[buttonConfig.key];
            if (!button) {
                return;
            }

            const isEnabled = buttonConfig.isEnabled();
            button.classList.toggle("active", isEnabled);
            button.setAttribute("aria-pressed", String(isEnabled));
            button.textContent = `${buttonConfig.label}: ${isEnabled ? "On" : "Off"}`;
        });
    }
}
