// libs
import { useRef, useState } from 'react';
import cx from 'classnames';

// styles
import styles from './App.module.scss';

// widgets
import Canvas, { ICanvasApi } from './Canvas/Canvas';
import JoyStick from './JoyStick/JoyStick';

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

    const handeJoyStickMove = (x: number, y: number) => {
        canvasRef.current?.move(x / 10, y / 10);
    };

    const reset = () => {
        setZoomScale(1);
        canvasRef.current?.reset();
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
                className={cx(styles.button, styles.buttonReset)}
                onClick={reset}
            >
                reset
            </button>
            <JoyStick onMove={handeJoyStickMove} />
        </div>
    );
}

export default App;
