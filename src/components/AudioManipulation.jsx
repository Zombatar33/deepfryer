import { useEffect, useState, useRef } from 'react';

function AudioManipulator({ videoRef }) {

    const audioCtxContainer = useRef(null);
    const audioSrcContainer = useRef(null);
    const audioScriptContainer = useRef(null)

    const effectBitcrushContainer = useRef(null);
    const effectDistortionContainer = useRef(null);
    const effectBassBoostContainer = useRef(null);
    const effectGainContainer = useRef(null);

    const [_bitSamples, setBitSamples] = useState(2);
    const [_normFrequency, setNormFrequency] = useState(1);
    const [_distortion, setDistortion] = useState(0);
    const [_bassBoost, setBassBoost] = useState(0);
    const [_gain, setGain] = useState(5);

    function handleResetClick() {
        setBitSamples(2);
        setNormFrequency(1)
        setDistortion(0);
        setBassBoost(0);
        setGain(5);
    }

    function handlePlay() {
        audioCtxContainer.current.resume();
    }

    // Ready Video
    useEffect(() => {
        const video = videoRef.current;
        video.onplay = handlePlay;
        return () => {
          video.onplay = null;
        }
      }, []);

      // Create Effects and Audio-API
    useEffect(() => {
        if (!audioCtxContainer.current) {
            audioCtxContainer.current = new AudioContext();
        }
        if (!audioSrcContainer.current) {
            audioSrcContainer.current = audioCtxContainer.current.createMediaElementSource(videoRef.current);
        }
        if (!audioScriptContainer.current) {
            var bufferSize = 4096;
            audioScriptContainer.current = audioCtxContainer.current.createScriptProcessor(bufferSize, 1, 1);
        }

        if (!effectBitcrushContainer.current) {
            effectBitcrushContainer.current = createBitCrush(_bitSamples, _normFrequency)();
        }
        if (!effectDistortionContainer.current) {
            effectDistortionContainer.current = audioCtxContainer.current.createWaveShaper();
        }
        if (!effectBassBoostContainer.current) {
            effectBassBoostContainer.current = audioCtxContainer.current.createBiquadFilter();
            effectBassBoostContainer.current.type = "lowshelf";
            effectBassBoostContainer.current.frequency.value = 200;
        }
        if (!effectGainContainer.current) {
            effectGainContainer.current = audioCtxContainer.current.createGain();
        }
    }, []);

    function createBitCrush(paramSamples, paramNormFrequency) {
        return (function () {
            var bufferSize = 4096;
            var node = audioScriptContainer.current;
            var bits = 16 - paramSamples; // between 0 and 15
            var normfreq = paramNormFrequency; // between 0.0 and 1.0
            console.log(paramNormFrequency + " - " + normfreq);
            var step = Math.pow(1 / 2, bits);
            var phaser = 0;
            var last = 0;
            node.onaudioprocess = function (e) {
                var input = e.inputBuffer.getChannelData(0);
                var output = e.outputBuffer.getChannelData(0);
                for (var i = 0; i < bufferSize; i++) {
                    phaser += normfreq;
                    if (phaser >= 1.0) {
                        phaser -= 1.0;
                        last = step * Math.floor(input[i] / step + 0.5);
                    }
                    output[i] = last;
                }
            };
            return node;
        })
    }

    // Connect FX
    useEffect(() => {
        // First effect connected is last in chain
        audioSrcContainer.current.connect(effectGainContainer.current);
        effectGainContainer.current.connect(effectDistortionContainer.current);
        effectDistortionContainer.current.connect(effectBitcrushContainer.current);
        effectBitcrushContainer.current.connect(effectBassBoostContainer.current);
        effectBassBoostContainer.current.connect(audioCtxContainer.current.destination);
    }, []);

    // Update FX-Parameters
    useEffect(() => {
        // soll nur ein mal ausgeführt werden
        // nur ein mal effekte erstellen und connecten (nicht disconnecten)

        // firefox -> webaudioeditor
        // chrome -> audion
        // https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Tools

        // use effect kann weg


        //bitcrush
        // TODO: CHANGE BITCRUSH SAMPLES
        var constrainedBitSamples = _bitSamples;
        if (constrainedBitSamples < 2) { constrainedBitSamples = 2 }
        if (constrainedBitSamples > 15) { constrainedBitSamples = 15 }
    
        var constrainedNormFrequency = _normFrequency;
        if (constrainedNormFrequency < 0.1) { constrainedNormFrequency = 0.1 }
        if (constrainedNormFrequency > 1) { constrainedNormFrequency = 1 }

        effectBitcrushContainer.current = createBitCrush(constrainedBitSamples, constrainedNormFrequency)();

        // Change distortion curve, 0 - 100
        var constrainedDistortion = _distortion;
        if (constrainedDistortion < 0) { constrainedDistortion = 0 }
        if (constrainedDistortion > 100) { constrainedDistortion = 100 }
        effectDistortionContainer.current.curve = makeDistortionCurve(constrainedDistortion);

        // Change Bass Boost
        effectBassBoostContainer.current.gain.value = _bassBoost;

        // Change Gain
        // Logarithmic scale for easier usabilit<; the middle is loudness = 1 (unchanged)
        var logGain = 0.008 * Math.pow(_gain, 3);
        effectGainContainer.current.gain.value = logGain;

        function makeDistortionCurve(amount) {
            var k = amount,
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
    }, [_bassBoost, _bitSamples, _normFrequency, _distortion, _gain]);

    // TODO: MAKE FUNCTION FOR EACH VALUE UPDATE
    // TODO: CREATE CONTROL CHECKBOX FOR ENABLING/DISABLING FX
    // TODO: REPLACE BITCRUSH-NORM-FREQUENCY WITH A CHECKBOX
    return (
        <div>
            <label>Bitcrush Bit-Reduction</label>
            <input type="range" min="1" max="16" step="1" value={_bitSamples} onChange={e => {setBitSamples(e.target.value)}}/>

            <label>Bitcrush Norm-Frequency</label>
            <input type="range" min="0" max="1" step="1" value={_normFrequency} onChange={e => {setNormFrequency(e.target.value)}}/>

            <label>Distortion</label>
            <input type="range" min="-0.25" max="30.25" step="0.25" value={_distortion} onChange={e => {setDistortion(e.target.value)}}/>

            <label>Bass Boost</label>
            <input type="range" min="0" max="100" step="1" value={_bassBoost} onChange={e => {setBassBoost(e.target.value)}}/>

            <label>Gain</label>
            <input type="range" min="0" max="10" step="0.01" value={_gain} onChange={e => {setGain(e.target.value)}}/>

            <label>Reset Sound FX</label>
            <input type="button" value="Reset" onClick={(handleResetClick)}></input>
        </div>
    );
}

export default AudioManipulator;