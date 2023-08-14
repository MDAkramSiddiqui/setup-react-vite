import { useRef, useState } from 'react';
import cx from 'classnames';

// styles
import styles from './App.module.scss';
import Canvas, { ICanvasApi } from './Canvas/Canvas';

function App() {
    const dpRatio = window.devicePixelRatio || 1;
    const parentRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<ICanvasApi>(null);
    const [zoomScale, setZoomScale] = useState<number>(1);

    const handleZoomIn = () => {
        setZoomScale((s) => {
            if (s < 3) {
                return s + 1;
            }

            return s;
        });
    };

    const handleZoomOut = () => {
        setZoomScale((s) => {
            if (s > 1) {
                return s - 1;
            }

            return s;
        });
    };

    const handleMoveLeft = () => {
        canvasRef.current?.moveLeft();
    };

    const handleMoveRight = () => {
        canvasRef.current?.moveRight();
    };

    return (
        <div ref={parentRef} className={styles.container}>
            <Canvas
                ref={canvasRef}
                zoomScale={zoomScale}
                parentRef={parentRef}
                dpRatio={dpRatio}
            />
            <button
                className={cx(styles.button, styles.buttonZoomIn)}
                onClick={handleZoomIn}
            >
                zoom in
            </button>
            <button
                className={cx(styles.button, styles.buttonZoomOut)}
                onClick={handleZoomOut}
            >
                zoom out
            </button>
            <button
                className={cx(styles.button, styles.buttonMoveLeft)}
                onClick={handleMoveLeft}
            >
                {'<'}
            </button>
            <button
                className={cx(styles.button, styles.buttonMoveRight)}
                onClick={handleMoveRight}
            >
                {'>'}
            </button>
        </div>
    );
}

export default App;
