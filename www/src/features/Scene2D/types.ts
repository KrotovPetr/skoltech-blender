export interface Coordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type Furniture =
    "TV stand" |
    "bar counter" |
    "bench" |
    "bookshelf" |
    "cabinet" |
    "chair" |
    "chair-bed" |
    "coffee table" |
    "desk" |
    "dining table" |
    "fireplace" |
    "floor lamp" |
    "floor plant" |
    "floor vase" |
    "kitchen island" |
    "modular kitchen" |
    "ottoman" |
    "rocking chair" |
    "rug" |
    "shelves" |
    "side table" |
    "sideboard" |
    "sofa" |
    "stool" |
    "wardrobe" |
    "window";

export interface PlainSVGObjectData {
    label: Furniture;
    coordinates: Coordinates;
}

export interface RoomLayoutProps {
    initialObjects: PlainSVGObjectData[];
}

export interface PlainSVGDataResponse {
    image: string;
    annotations: PlainSVGObjectData[];
}

export type ColorsDisctionary = Record<Furniture, string>;
