import {ViewChild, Component} from '@angular/core';
import {Output, EventEmitter} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Dialog} from '../../components';
import {MapService} from './map.service';
import {MapStatusExtra} from '../../../shared/map';

let openMapTemplate = require<string>('./open-map.html');
let openMapScss = require<Webpack.Scss>('./open-map.scss');

interface MapDetails extends MapStatusExtra {
    preview: string;
};

@Component({
    selector: 'open-map',
    styles: [openMapScss.toString()],
    templateUrl: openMapTemplate,
})
export class OpenMap {

    @ViewChild('openmapdialog')
    private dialog: Dialog;

    @Output('openMap')
    private emitter = new EventEmitter<MapDetails>();

    // Used to solve a bug with Firefox (the animation was invisible)
    private is_shown: boolean = false;
    private selected_map: MapDetails = undefined;
    private list_of_maps: Observable<MapDetails[]>;
    reset = () => {
        this.is_shown = false;
        this.selected_map = undefined;
    };

    constructor(private manager: MapService) {
        this.list_of_maps = manager.getMapList().map(l => l.map(m => {
            let a = m as MapDetails;
            a.preview = manager.getMapPreview(a.id);
            return a;
        }));
    }

    selectMap(map: MapDetails) {
        this.selected_map = map;
        setTimeout(() => this.is_shown = true, 10);
    }

    openMap() {
        if (this.selected_map) {
            this.emitter.emit(this.selected_map);
            this.hide();
        }
    }

    show() {
        this.dialog.show();
    }

    hide(event?: Event) {
        this.dialog.hide(event);
    }
}
