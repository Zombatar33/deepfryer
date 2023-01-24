import { useEffect, useState, useRef } from 'react';

function AudioManipulator({ videoRef }) {
    var [_bitSamples, setBitSamples] = useState(7);
    const [_bitcrushNormFrequency, setBitcrushNormFrequency] = useState(0.2);
    const [_distortion, setDistortion] = useState(0);
    const [_bassBoost, setBassBoost] = useState(0);
    const [_gain, setGain] = useState(1);
    const audioContextRef = useRef(null);
    const mediaElementSourceRef = useRef(null);

    function handleResetClick() {
        setBitSamples(7);
        setBitcrushNormFrequency(1);
        setDistortion(0);
        setBassBoost(0);
        setGain(1);
    }

    function handlePlay() {
        audioContextRef.current.resume();
    }

    useEffect(() => {
        audioContextRef.current = new AudioContext();
        const video = videoRef.current;
        mediaElementSourceRef.current = audioContextRef.current.createMediaElementSource(video);
        return () => {
            audioContextRef.current.close()
        };
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        video.onplay = handlePlay;
        return () => {
            video.onplay = null;
        }
    }, []);

    useEffect(() => {
        if (!audioContextRef.current) return;
        //const audioSource = mediaElementSourceRef.current;
        //const context = audioContextRef.current;

        //bitcrush
        var bufferSize = 4096;
        var bitcrush = (function () {
            var node = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
            node.bits = _bitSamples; // between 1 and 16
            node.normfreq = _bitcrushNormFrequency; // between 0.0 and 1.0
            var step = Math.pow(1 / 2, node.bits);
            var phaser = 0;
            var last = 0;
            node.onaudioprocess = function (e) {
                var input = e.inputBuffer.getChannelData(0);
                var output = e.outputBuffer.getChannelData(0);
                for (var i = 0; i < bufferSize; i++) {
                    phaser += node.normfreq;
                    if (phaser >= 1.0) {
                        phaser -= 1.0;
                        last = step * Math.floor(input[i] / step + 0.5);
                    }
                    output[i] = last;
                }
            };
            return node;
        })();

        // create distortion
        var dist = audioContextRef.current.createWaveShaper();
        // 0 bis 100 funktioniert sehr gut, ist aber egal
        dist.curve = makeDistortionCurve(_distortion);

        // create filter
        var filter = audioContextRef.current.createBiquadFilter();
        filter.type = "lowshelf";
        filter.frequency.value = 200;
        filter.gain.value = _bassBoost;

        // gain
        var gain = audioContextRef.current.createGain();
        gain.gain.value = _gain;

        // chain effects - first effect in chain is actually last
        mediaElementSourceRef.current.connect(gain);
        gain.connect(dist);
        dist.connect(bitcrush);
        bitcrush.connect(filter);
        filter.connect(audioContextRef.current.destination);

        function makeDistortionCurve(amount) {
            var k = typeof amount === 'number' ? amount : 0,
                n_samples = 44100,
                curve = new Float32Array(n_samples),
                deg = Math.PI / 180,
                i = 0,
                x;
            for (; i < n_samples; ++i) {
                x = i * 2 / n_samples - 1;
                curve[i] = (3 + k) * x * 40 * deg / (Math.PI + k * Math.abs(x));
            }
            return curve;
        };
        return () => {
            mediaElementSourceRef.current.disconnect();
            gain.disconnect();
            dist.disconnect()
            bitcrush.disconnect();
            filter.disconnect();
        }
    }, [_bassBoost, _bitSamples, _bitcrushNormFrequency, _distortion, _gain, videoRef]);

    //TODO: implement user control for audio filters

    return (
        <div>
            <label>Bitcrush Bit-Reduction</label>
            <input type="range" min="0" max="16" step="1" value={_bitSamples} onChange={e => { setBitSamples(e.target.value) }} />
            <label>Bitcrush Norm.-Frequency</label>
            <input type="range" min="0" max="1" step="0.01" value={_bitcrushNormFrequency} onChange={e => { setBitcrushNormFrequency(e.target.value) }}/>
            <label>Distortion</label>
            <input type="range" min="0" max="100" step="1" value={_distortion} onChange={e => { setDistortion(e.target.value) }} />
            <label>Bass Boost</label>
            <input type="range" min="0" max="100" step="1" value={_bassBoost} onChange={e => { setBassBoost(e.target.value) }} />
            <label>Gain</label>
            <input type="range" min="0" max="10" step="0.01" value={_gain} onChange={e => { setGain(e.target.value) }}/>
            <label>Reset Sound FX</label>
            <input type="button" value="Reset" onClick={(handleResetClick)}></input>
        </div>
    );
}

export default AudioManipulator;