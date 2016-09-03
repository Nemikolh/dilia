import {Output, EventEmitter} from '@angular/core';
import {Component, Input} from '@angular/core';
import {PanelState, Panel} from './panel-state';
import {LayersPanelSettings} from './layers-panel.store';
import {Map, Layer} from '../../models/map';


let layerPanelCss = require<Webpack.Scss>('./layers-panel.scss');
let layerPanelTemplate = require<string>('./layers-panel.html');

@Component({
    selector: 'layer-panel',
    styles: [layerPanelCss.toString()],
    templateUrl: layerPanelTemplate,
})
export class LayersPanel {

    private is_visible: boolean = false;
    private is_shown: boolean = false;
    private selected_layer: number = 0;

    @Input('currentMap') current_map: Map;
    @Output('selectLayer') select_layer = new EventEmitter<number>();

    constructor(
        private state: PanelState,
        private settings: LayersPanelSettings
    ) {}

    ngOnChanges() {
        if (this.current_map) {
            this.selected_layer = this.current_map.currentLayer();
        }
    }

    isShown(): boolean {
        let is_shown = this.state.activePanel() === Panel.Layers;
        if (this.is_shown !== is_shown && !is_shown) {
            setTimeout(() => {
                this.is_visible = false;
                this.settings.is_visible = false;
            }, 500);
        }
        else if (this.is_shown !== is_shown && is_shown) {
            this.is_visible = true;
            this.settings.is_visible = true;
        }
        this.is_shown = is_shown;
        return is_shown;
    }

    layerList(): any[] {
        return this.current_map.layers;
    }

    isMapValid(): boolean {
        return this.current_map !== undefined;
    }

    selectLayer(layer: Layer, event: Event) {
        event.preventDefault();
        let index = layer.select();
        if (index >= 0) {
            this.selected_layer = index;
            this.select_layer.emit(index);
        }
    }

    hide() {
        this.state.activatePanel('');
    }
}
