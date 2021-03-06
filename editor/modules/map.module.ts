import {NgModule} from '@angular/core';
import {SharedModule} from '../components/shared.module';

import {MapManager} from '../models/map';

import {EditorState} from './map/editor-state';

import {ChipsetModal} from './map/chipset-upload';
import {CreateNewMapModal} from './map/createnewmap';
import {OpenMap} from './map/open-map.component';
import {MapEditor} from './map/editor';
import {LayersPanel} from './map/layers-panel';
import {MapSettings} from './map/map-settings';
import {PanelState} from './map/panel-state';

@NgModule({
    imports: [SharedModule],
    declarations: [
        MapEditor,
        LayersPanel,
        MapSettings,
        ChipsetModal,
        CreateNewMapModal,
        OpenMap,
    ],
    providers: [
        MapManager,
        EditorState,
        PanelState,
    ],
    exports: [
        MapEditor,
    ],
})
export class MapModule {}
