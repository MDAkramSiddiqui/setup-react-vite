// libs
import { MouseEventHandler, useRef } from 'react';

// styles
import styles from './JoyStick.module.scss';

interface IProps {
    onMove: (x: number, y: number) => void;
}

const JoyStick = ({ onMove }: IProps) => {
    const controllerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragInProgress = useRef<boolean>(false);
    const previousPos = useRef<{ x: number; y: number }>({
        x: 0,
        y: 0,
    });

    const handleMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
        console.log('handleMouseDown');

        isDragInProgress.current = true;
        previousPos.current = {
            x: e.clientX,
            y: e.clientY,
        };
    };

    const handleMouseUp: MouseEventHandler<HTMLDivElement> = (e) => {
        isDragInProgress.current = false;
        console.log('handleMouseUp', e.nativeEvent.type);

        const controllerXPos = Number(styles.controllerWidth) / 2;
        const controllerYPos = Number(styles.controllerHeight) / 2;
        performTranslation(
            -controllerXPos,
            -controllerYPos,
            'transform 0.2s ease-in-out',
        );
    };

    const handleMouseMove: MouseEventHandler<HTMLDivElement> = (e) => {
        console.log('handleMouseMove');

        if (!isDragInProgress.current) {
            return;
        }

        const newX =
            -Number(styles.controllerWidth) / 2 +
            e.clientX -
            previousPos.current.x;

        const newY =
            -Number(styles.controllerHeight) / 2 +
            e.clientY -
            previousPos.current.y;

        performTranslation(newX, newY);

        // callback for canvas movement
        const diffX = e.clientX - previousPos.current.x;
        const diffY = e.clientY - previousPos.current.y;
        onMove(diffX, diffY);
    };

    const performTranslation = (
        x: number,
        y: number,
        transition: string = 'none',
    ) => {
        window.requestAnimationFrame(() => {
            if (!controllerRef.current || !containerRef.current) {
                return;
            }

            controllerRef.current.style.transition = transition;
            controllerRef.current.style.transform = `translate(${x}px, ${y}px)`;
        });
    };

    return (
        <div className={styles.container} ref={containerRef}>
            <div
                className={styles.controller}
                ref={controllerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseUp}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            ></div>
        </div>
    );
};

export default JoyStick;
