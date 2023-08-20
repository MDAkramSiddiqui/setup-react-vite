export const BOX_HEIGHT = 20;
export const BOX_WIDTH = 20;
export const GAP = 10;
const MARGIN_ERROR = 0.000099;

export class Box {
    x: number;
    y: number;
    width: number;
    height: number;
    fillColor: string;
    strokeColor: string;

    constructor(x: number, y: number, fillColor: string, strokeColor: string) {
        this.x = x;
        this.y = y;
        this.width = BOX_WIDTH;
        this.height = BOX_HEIGHT;
        this.fillColor = fillColor;
        this.strokeColor = strokeColor;
    }
}

// adapted from: https://www.npmjs.com/package/intrinsic-scale
export function getObjectFitSize(
    contains: boolean /* true = contain, false = cover */,
    containerWidth: number,
    containerHeight: number,
    width: number,
    height: number,
) {
    const doRatio = width / height;
    const cRatio = containerWidth / containerHeight;
    let targetWidth = 0;
    let targetHeight = 0;
    const test = contains ? doRatio > cRatio : doRatio < cRatio;

    if (test) {
        targetWidth = containerWidth;
        targetHeight = targetWidth / doRatio;
    } else {
        targetHeight = containerHeight;
        targetWidth = targetHeight * doRatio;
    }

    return {
        width: targetWidth,
        height: targetHeight,
        x: (containerWidth - targetWidth) / 2,
        y: (containerHeight - targetHeight) / 2,
    };
}

export const getMaxBoxesInRow = (totalWidth: number, totalHeight: number) => {
    return {
        horizontalBoxesCount: Math.floor(
            (totalWidth - GAP) / (BOX_WIDTH + GAP),
        ),
        verticalBoxesCount: Math.floor(
            (totalHeight - GAP) / (BOX_HEIGHT + GAP),
        ),
    };
};

export const generateBoxes = (
    horizontalBoxesCount: number,
    verticalBoxesCount: number,
) => {
    const boxes = [];
    const initialX = 10;
    const initialY = 10;
    let currentX = initialX;
    let currentY = initialY;

    for (let i = 0; i < verticalBoxesCount; i++) {
        currentX = initialX;
        for (let j = 0; j < horizontalBoxesCount; j++) {
            boxes.push(
                new Box(
                    currentX,
                    currentY,
                    '',
                    colors[Math.floor((Math.random() - MARGIN_ERROR) * 4)],
                ),
            );

            currentX += BOX_WIDTH + GAP;
        }
        currentY += BOX_HEIGHT + GAP;
    }

    return boxes;
};

const colors = ['#35A29F', '#7A9D54', '#4682A9', '#4FC0D0'];
