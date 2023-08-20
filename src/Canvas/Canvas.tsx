// libs

import {
    MouseEventHandler,
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useReducer,
    useRef,
    useState,
} from 'react';
import { generateBoxes, getMaxBoxesInRow, getObjectFitSize } from '../helpers';

// styles
import styles from './Canvas.module.scss';

interface IProps {
    parentRef: React.MutableRefObject<HTMLDivElement | null>;
    dpRatio: number;
}

interface ITransformationState {
    aScaleX: number;
    dScaleY: number;
    bSkeyX: number;
    cSkeyY: number;
    eTranslateX: number;
    fTranslateY: number;
}

export interface ICanvasApi {
    zoomIn: () => void;
    zoomOut: () => void;
    move: (x: number, y: number) => void;
    reset: () => void;
}

enum TransformationActions {
    UPDATE_SCALE = 'UPDATE_SCALE',
    UPDATE_SKEW = 'UPDATE_SKEW',
    UPDATE_TRANSLATE = 'UPDATE_TRANSLATE',
    RESET_MATRIX = 'RESET_MATRIX',
}

interface ITransformationAction {
    type: TransformationActions;
    payload: {
        scaleX?: number;
        scaleY?: number;
        skewX?: number;
        skewY?: number;
        translateX?: number;
        translateY?: number;
    };
}

const transformationReducer = (
    state: ITransformationState,
    action: ITransformationAction,
) => {
    switch (action.type) {
        case TransformationActions.UPDATE_SCALE:
            return {
                ...state,
                aScaleX: action.payload.scaleX ?? state.aScaleX,
                dScaleY: action.payload.scaleY ?? state.dScaleY,
            };

        case TransformationActions.UPDATE_SKEW:
            return {
                ...state,
                bSkeyX: action.payload.skewX ?? state.bSkeyX,
                cSkeyY: action.payload.skewY ?? state.cSkeyY,
            };

        case TransformationActions.UPDATE_TRANSLATE:
            return {
                ...state,
                eTranslateX: action.payload.translateX ?? state.eTranslateX,
                fTranslateY: action.payload.translateY ?? state.fTranslateY,
            };

        case TransformationActions.RESET_MATRIX:
            return {
                ...state,
                aScaleX: action.payload.scaleX ?? 1,
                dScaleY: action.payload.scaleY ?? 1,
                bSkeyX: 0,
                cSkeyY: 0,
                eTranslateX: 0,
                fTranslateY: 0,
            };
    }
};

const MAX_ZOOM_SCALE = 5;
const MIN_ZOOM_SCALE = 1;
const ZOOM_STEP = 1;
const ANIMATION_ZOOM_STEP = 0.1;

const Canvas = forwardRef<ICanvasApi, IProps>(({ parentRef, dpRatio }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const currentBoxRef = useRef<number>(0);
    const called = useRef<boolean>(false);

    const [canvasDimensions, setCanvasDimensions] = useState({
        height: Number(styles.canvasHeight),
        width: Number(styles.canvasWidth),
    });

    const [transformationState, dispatchTransformation] = useReducer(
        transformationReducer,
        {
            aScaleX: 1,
            dScaleY: 1,
            bSkeyX: 0,
            cSkeyY: 0,
            eTranslateX: 0,
            fTranslateY: 0,
        },
    );

    const [zoomScale, setZoomScale] = useState<number>(1);

    const handleZoomIn = () => {
        const newZoomScale =
            zoomScale < MAX_ZOOM_SCALE ? zoomScale + ZOOM_STEP : zoomScale;
        setZoomScale(newZoomScale);
    };

    const handleZoomOut = () => {
        const newZoomScale =
            zoomScale > MIN_ZOOM_SCALE ? zoomScale - ZOOM_STEP : zoomScale;
        setZoomScale(newZoomScale);
        dispatchTransformation({
            type: TransformationActions.UPDATE_TRANSLATE,
            payload: {
                translateX:
                    transformationState.eTranslateX *
                    ((newZoomScale - 1) / MAX_ZOOM_SCALE),
                translateY:
                    transformationState.fTranslateY *
                    ((newZoomScale - 1) / MAX_ZOOM_SCALE),
            },
        });
    };

    const boxes = useMemo(() => {
        console.warn('LOG:: boxes -> useMemo');
        const boxesCount = getMaxBoxesInRow(
            canvasDimensions.width,
            canvasDimensions.height,
        );
        return generateBoxes(
            boxesCount.horizontalBoxesCount,
            boxesCount.verticalBoxesCount,
        );
    }, [canvasDimensions]);

    const ratio = useMemo(() => {
        if (!canvasRef.current) {
            return 1;
        }

        const canvasEl = canvasRef.current;
        return Math.min(
            (canvasEl.clientWidth / Number(styles.canvasWidth)) * dpRatio,
            (canvasEl.clientHeight / Number(styles.canvasHeight)) * dpRatio,
        );
    }, [canvasRef.current, dpRatio]);

    useImperativeHandle(
        ref,
        () => ({
            zoomIn: () => {
                handleZoomIn();
            },
            zoomOut: () => {
                handleZoomOut();
            },
            move: (x: number, y: number) => {
                const [scaledUpWidth, scaledUpHeight] = [
                    canvasDimensions.width * zoomScale,
                    canvasDimensions.height * zoomScale,
                ];

                const newX = -x + transformationState.eTranslateX;
                const translateX =
                    newX < 0 && scaledUpWidth + newX > canvasDimensions.width
                        ? newX
                        : transformationState.eTranslateX;

                const newY = -y + transformationState.fTranslateY;
                const translateY =
                    newY < 0 && scaledUpHeight + newY > canvasDimensions.height
                        ? newY
                        : transformationState.fTranslateY;

                dispatchTransformation({
                    type: TransformationActions.UPDATE_TRANSLATE,
                    payload: {
                        translateX,
                        translateY,
                    },
                });
            },
            reset: () => {
                setZoomScale(1);
                dispatchTransformation({
                    type: TransformationActions.RESET_MATRIX,
                    payload: {
                        scaleX: ratio * dpRatio * zoomScale,
                        scaleY: ratio * dpRatio * zoomScale,
                    },
                });
            },
        }),
        [transformationState, zoomScale, dpRatio, ratio],
    );

    useEffect(() => {
        if (called.current) {
            return;
        }

        called.current = true;
        if (canvasRef.current) {
            const canvasEl = canvasRef.current;

            const dimensions = getObjectFitSize(
                true,
                canvasEl.clientWidth,
                canvasEl.clientHeight,
                canvasEl.width,
                canvasEl.height,
            );

            setCanvasDimensions({
                height: dimensions.height * dpRatio,
                width: dimensions.width * dpRatio,
            });

            requestAnimationFrame(() => {
                dispatchTransformation({
                    type: TransformationActions.UPDATE_SCALE,
                    payload: {
                        scaleX: ratio * dpRatio,
                        scaleY: ratio * dpRatio,
                    },
                });
            });
        }
    }, [dpRatio, ratio]);

    useEffect(() => {
        console.log(
            'LOG:: Canvas -> zoomScale',
            zoomScale,
            ratio,
            dpRatio,
            zoomScale * ratio * dpRatio,
        );
        dispatchTransformation({
            type: TransformationActions.UPDATE_SCALE,
            payload: {
                scaleX: ratio * dpRatio * zoomScale,
                scaleY: ratio * dpRatio * zoomScale,
            },
        });
    }, [zoomScale, ratio, dpRatio]);

    useEffect(() => {
        applyTransformations();
        renderBoxes();
    }, [transformationState]);

    const handleMouseMove = useCallback<MouseEventHandler<HTMLCanvasElement>>(
        (e) => {
            if (!canvasRef.current) {
                return;
            }
            const hoveredBoxIndex = boxes.findIndex((box) => {
                const x =
                    box.x * zoomScale +
                    transformationState.eTranslateX / dpRatio;
                const y =
                    box.y * zoomScale +
                    transformationState.fTranslateY / dpRatio;
                const width = box.width * zoomScale;
                const height = box.height * zoomScale;

                return (
                    e.nativeEvent.offsetX > x &&
                    e.nativeEvent.offsetX < x + width &&
                    e.nativeEvent.offsetY > y &&
                    e.nativeEvent.offsetY < y + height
                );
            });

            if (hoveredBoxIndex === -1) {
                parentRef.current?.style.setProperty('cursor', 'default');
                boxes[currentBoxRef.current].fillColor = '';
                window.requestAnimationFrame(() => renderBoxes());
                return;
            }

            parentRef.current?.style.setProperty('cursor', 'pointer');

            boxes[currentBoxRef.current].fillColor = '';

            currentBoxRef.current = hoveredBoxIndex;

            boxes[hoveredBoxIndex].fillColor =
                boxes[hoveredBoxIndex].strokeColor;

            window.requestAnimationFrame(() => renderBoxes());
            return;
        },
        [boxes, zoomScale, transformationState],
    );

    const applyTransformations = () => {
        if (!canvasRef.current) {
            return;
        }

        const canvasEl = canvasRef.current;
        const ctx = canvasEl.getContext('2d');
        if (!ctx) {
            return;
        }

        ctx.setTransform(
            transformationState.aScaleX,
            transformationState.bSkeyX,
            transformationState.cSkeyY,
            transformationState.dScaleY,
            transformationState.eTranslateX,
            transformationState.fTranslateY,
        );
    };

    const handleOnClick: MouseEventHandler<HTMLCanvasElement> = (e) => {
        if (!canvasRef.current) {
            return;
        }

        const clickedBoxIndex = boxes.findIndex((box) => {
            const x =
                box.x * zoomScale + transformationState.eTranslateX / dpRatio;
            const y =
                box.y * zoomScale + transformationState.fTranslateY / dpRatio;

            const width = box.width * zoomScale;
            const height = box.height * zoomScale;

            return (
                e.nativeEvent.offsetX > x &&
                e.nativeEvent.offsetX < x + width &&
                e.nativeEvent.offsetY > y &&
                e.nativeEvent.offsetY < y + height
            );
        });

        if (clickedBoxIndex === -1) {
            return;
        }

        console.log('LOG:: Canvas -> clickedBoxIndex', clickedBoxIndex);

        const clickedBox = boxes[clickedBoxIndex];

        const scaledX = -clickedBox.x * (MAX_ZOOM_SCALE - 1);
        const scaledY = -clickedBox.y * (MAX_ZOOM_SCALE - 1);

        const translateX = scaledX;
        const translateY = scaledY;

        const step = (MAX_ZOOM_SCALE - zoomScale) / ANIMATION_ZOOM_STEP;

        const translateXStep = translateX / step;
        const translateYStep = translateY / step;

        animationMoveHelper(
            zoomScale,
            translateX,
            translateY,
            translateXStep,
            translateYStep,
            translateXStep,
            translateYStep,
        );
    };

    const animationMoveHelper = (
        targettedZoomScale: number,
        targetX: number,
        targetY: number,
        stepX: number,
        stepY: number,
        currentX: number,
        currentY: number,
    ) => {
        const nextZoomScale = Number(
            (targettedZoomScale + ANIMATION_ZOOM_STEP).toFixed(2),
        );
        const nextX = currentX + stepX;
        const nextY = currentY + stepY;

        if (nextZoomScale > MAX_ZOOM_SCALE) {
            return;
        }

        setZoomScale(nextZoomScale);
        dispatchTransformation({
            type: TransformationActions.UPDATE_TRANSLATE,
            payload: {
                translateX: nextX,
                translateY: nextY,
            },
        });

        window.requestAnimationFrame(() => {
            animationMoveHelper(
                nextZoomScale,
                targetX,
                targetY,
                stepX,
                stepY,
                nextX,
                nextY,
            );
        });
    };

    const renderBoxes = () => {
        if (!canvasRef.current) {
            return;
        }

        const canvasEl = canvasRef.current;
        const ctx = canvasEl?.getContext('2d');
        if (!ctx) {
            return;
        }

        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        const boxesCount = getMaxBoxesInRow(
            canvasDimensions.width,
            canvasDimensions.height,
        );

        let count = 0;

        for (let i = 0; i < boxesCount.horizontalBoxesCount; i++) {
            for (let j = 0; j < boxesCount.verticalBoxesCount; j++) {
                const currentBox = boxes[count++];
                ctx.strokeStyle = currentBox.strokeColor;
                if (currentBox.fillColor) {
                    ctx.fillStyle = currentBox.fillColor;
                    ctx.fillRect(
                        currentBox.x,
                        currentBox.y,
                        currentBox.width,
                        currentBox.height,
                    );
                } else {
                    ctx.strokeRect(
                        currentBox.x,
                        currentBox.y,
                        currentBox.width,
                        currentBox.height,
                    );
                }

                // if (zoomScale >= 3) {
                const text = `${count}`;
                const textHeight = ctx.measureText(text);

                ctx.strokeText(
                    text,
                    currentBox.x,
                    currentBox.y +
                        Math.round(textHeight.actualBoundingBoxAscent),
                );
                // }
            }
        }
    };

    return (
        <canvas
            height={canvasDimensions.height}
            width={canvasDimensions.width}
            className={styles.canvas}
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onClick={handleOnClick}
        ></canvas>
    );
});

export default Canvas;
