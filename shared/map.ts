
export interface MapData {
    name: string;
    layers: LayerData[][];
    width: number;
    height: number;
    tile_size: number;
    comment: string;
}

export interface LayerData {
    tiles_id_base64: string;
    chipset_id: string;
}

export interface MapCommitData {
    layers: LayerData[][];
    comment: string;
}

export interface ChipsetData {

}
