import { useEffect, useState } from 'react';

function truncateColor(value) {
    if (value < 0) {
        value = 0;
    } else if (value > 255) {
        value = 255;
    }
    return value;
}

function CanvasManipulator({ canvasRef, videoRef }) {

    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [invert, setInvert] = useState(false);
    const [saturation, setSaturation] = useState(10);
    const [noise, setNoise] = useState(0);
    const [hue, setHue] = useState(0);
    const [sharpen, setSharpen] = useState(1);

    function handleResetClick() {
        setBrightness(0);
        setContrast(0);
        setInvert(false);
        setSaturation(10);
        setNoise(0);
        setHue(0);
    }

    useEffect(() => {
        let animationFrame;
        const applyFilter = () => {

            //Setup
            animationFrame = requestAnimationFrame(applyFilter);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            const brightnessFactor = brightness / 100;
            const saturationFactor = saturation / 10;
            const contrastFactor = (259.0 * (contrast + 255.0)) / (255.0 * (259.0 - contrast));
            const noiseFactor = noise / 100;

            for (let i = 0; i < data.length; i += 4) {
                //Invert
                if (invert) {
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }

                //Brightness
                data[i + 0] += 255 * brightnessFactor;
                data[i + 1] += 255 * brightnessFactor;
                data[i + 2] += 255 * brightnessFactor;

                //Contrast
                data[i] = truncateColor(contrastFactor * (data[i] - 128.0) + 128.0);
                data[i + 1] = truncateColor(contrastFactor * (data[i + 1] - 128.0) + 128.0);
                data[i + 2] = truncateColor(contrastFactor * (data[i + 2] - 128.0) + 128.0);

                // noise
                data[i] = data[i] + ((Math.random() * 255) * noiseFactor)
                data[i + 1] = data[i + 1] + ((Math.random() * 255) * noiseFactor)
                data[i + 2] = data[i + 2] + ((Math.random() * 255) * noiseFactor)

                //Saturation
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];
                let max = Math.max(r, g, b);
                data[i] = (r - max) * saturationFactor + max;
                data[i + 1] = (g - max) * saturationFactor + max;
                data[i + 2] = (b - max) * saturationFactor + max;

            }
           
            ctx.filter = `hue-rotate(${hue}deg)`;
            ctx.putImageData(imageData, 0, 0);
        };

        applyFilter();
        return () => cancelAnimationFrame(animationFrame);
    }, [contrast, brightness, invert, saturation, noise, sharpen, hue]);

    return (
        <div>
            <label>Invert</label>
            <input type="checkbox" checked={invert} onChange={e => setInvert(e.target.checked)} />
            <label>Brightness</label>
            <input type="range" min="-100" max="100" value={brightness} onChange={e => setBrightness(e.target.value)} />
            <label>Contrast</label>
            <input type="range" min="-100" max="100" value={contrast} onChange={e => setContrast(e.target.value)} />
            <label>Noise</label>
            <input type="range" min="0" max="100" value={noise} onChange={e => setNoise(e.target.value)} />
            <label>Saturation</label>
            <input type="range" min="0" max="100" value={saturation} onChange={e => setSaturation(e.target.value)} />
            <label>Sharpen</label>
            <input type="range" min="0" max="10" value={sharpen} onChange={e => setSharpen(e.target.value)} />
            <label>Hue</label>
            <input type="range" min="0" max="360" value={hue} onChange={e => setHue(e.target.value)} />
            <label>Reset</label>
            <input type="button" value="Reset" onClick={(handleResetClick)}></input>
        </div>

    );
}

export default CanvasManipulator