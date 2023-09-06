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
    DISPATCH_MULTIPLE = 'DISPATCH_MULTIPLE',
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

        case TransformationActions.DISPATCH_MULTIPLE:
            return {
                ...state,
                aScaleX: action.payload.scaleX ?? state.aScaleX,
                dScaleY: action.payload.scaleY ?? state.dScaleY,
                bSkeyX: action.payload.skewX ?? state.bSkeyX,
                cSkeyY: action.payload.skewY ?? state.cSkeyY,
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

const MAX_ZOOM_SCALE = 15;
const MIN_ZOOM_SCALE = 1;
const ZOOM_STEP = 0.1;

const Canvas = forwardRef<ICanvasApi, IProps>(({ parentRef, dpRatio }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const currentBoxRef = useRef<number>(0);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const [canvasDimensions, setCanvasDimensions] = useState({
        height: Number(styles.canvasHeight),
        width: Number(styles.canvasWidth),
    });

    const [transformationState, dispatchTransformation] = useReducer(
        transformationReducer,
        {
            aScaleX: dpRatio,
            dScaleY: dpRatio,
            bSkeyX: 0,
            cSkeyY: 0,
            eTranslateX: 0,
            fTranslateY: 0,
        },
    );

    const [zoomScale, setZoomScale] = useState<number>(1);

    const handleZoomIn = (e: WheelEvent | null = null) => {
        console.log(
            'LOG:: Canvas -> handleZoomIn event',
            e,
            transformationState.eTranslateX,
            transformationState.fTranslateY,
        );

        const foo = (e: WheelEvent, newZoomVal: number) => {
            console.log(
                'LOG:: handleZoomIn :: foo',
                newZoomVal,
                transformationState.eTranslateX,
                transformationState.fTranslateY,
            );

            const translateX =
                -e.offsetX * dpRatio * (newZoomVal - MIN_ZOOM_SCALE);
            const translateY =
                -e.offsetY * dpRatio * (newZoomVal - MIN_ZOOM_SCALE);

            dispatchTransformation({
                type: TransformationActions.DISPATCH_MULTIPLE,
                payload: {
                    translateX: translateX,
                    translateY: translateY,
                    scaleX: dpRatio * newZoomVal,
                    scaleY: dpRatio * newZoomVal,
                },
            });
        };

        setZoomScale((val) => {
            const newVal = val < MAX_ZOOM_SCALE ? val + ZOOM_STEP : val;
            e && foo(e, newVal);
            return newVal;
        });
    };

    const handleZoomOut = (e: WheelEvent | null = null) => {
        console.log(
            'LOG:: Canvas -> handleZoomOut event',
            e,
            transformationState.eTranslateX,
            transformationState.fTranslateY,
        );

        const foo = (e: WheelEvent, newZoomVal: number) => {
            console.log(
                'LOG:: handleZoomOut -> foo event',
                e.offsetX,
                e.offsetY,
            );

            const translateX =
                -e.offsetX * dpRatio * (newZoomVal - MIN_ZOOM_SCALE);
            const translateY =
                -e.offsetY * dpRatio * (newZoomVal - MIN_ZOOM_SCALE);

            dispatchTransformation({
                type: TransformationActions.DISPATCH_MULTIPLE,
                payload: {
                    translateX: translateX,
                    translateY: translateY,
                    scaleX: dpRatio * newZoomVal,
                    scaleY: dpRatio * newZoomVal,
                },
            });
        };

        setZoomScale((val) => {
            const newZoomScale = val > MIN_ZOOM_SCALE ? val - ZOOM_STEP : val;

            e && foo(e, newZoomScale);
            return newZoomScale;
        });
    };

    const boxes = useMemo(() => {
        const boxesCount = getMaxBoxesInRow(
            canvasDimensions.width,
            canvasDimensions.height,
        );
        const generatedBoxes = generateBoxes(
            boxesCount.horizontalBoxesCount,
            boxesCount.verticalBoxesCount,
        );

        console.log('LOG :: useMemo -> generatedBoxes', generatedBoxes.length);

        return generatedBoxes;
    }, [canvasDimensions]);

    useEffect(() => {
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
                        scaleX: dpRatio,
                        scaleY: dpRatio,
                    },
                });
            });
        }

        if (!wrapperRef.current) return;
        const wrapperEl = wrapperRef.current;
        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY > 0) {
                handleZoomIn(e);
            } else {
                handleZoomOut(e);
            }
        };
        wrapperEl.addEventListener('wheel', handleWheel);

        return () => {
            wrapperEl.removeEventListener('wheel', handleWheel);
        };
    }, [dpRatio]);

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
                    canvasDimensions.width * zoomScale * dpRatio,
                    canvasDimensions.height * zoomScale * dpRatio,
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
                setZoomScale(MIN_ZOOM_SCALE);
                dispatchTransformation({
                    type: TransformationActions.RESET_MATRIX,
                    payload: {
                        scaleX: dpRatio,
                        scaleY: dpRatio,
                    },
                });
            },
        }),
        [transformationState, zoomScale, dpRatio],
    );

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

            console.log(
                'LOG:: Move',
                transformationState.eTranslateX,
                transformationState.fTranslateY,
            );

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
        <div ref={wrapperRef}>
            <canvas
                height={canvasDimensions.height}
                width={canvasDimensions.width}
                className={styles.canvas}
                ref={canvasRef}
                onMouseMove={handleMouseMove}
            ></canvas>
        </div>
    );
});

export default Canvas;
