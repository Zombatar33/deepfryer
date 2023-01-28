import { useEffect, useState, useRef } from 'react';

/**
 * AudioManipulator element, responsible for handling SFX
 * @param {*} _ video reference 
 * @returns the element
 */
function AudioManipulator({ videoRef }) {
    // buffer size results in slight delay; can't be helped...
    const bufferSize = 4096;

    // Container for Web-Audio-API elements
    const audioCtxContainer = useRef(null);
    const audioSrcContainer = useRef(null);
    const audioScriptContainer = useRef(null)

    // Containers for effects
    const effectBitcrushContainer = useRef(null);
    const effectDistortionContainer = useRef(null);
    const effectBassBoostContainer = useRef(null);
    const effectGainContainer = useRef(null);

    // Settings for effects
    const [_bitSamples, setBitSamples] = useState(-1);
    const [_normFrequency, setNormFrequency] = useState(true);
    const [_distortion, setDistortion] = useState(0);
    const [_bassBoost, setBassBoost] = useState(0);
    const [_gain, setGain] = useState(5);

    // Reset effect settings to default
    function handleResetClick() {
        setBitSamples(-1);
        setNormFrequency(true)
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

    // Create effects and ready Audio-API
    useEffect(() => {
        // Create AudioContext
        if (!audioCtxContainer.current) {
            audioCtxContainer.current = new AudioContext();
        }

        // Create AudioSource
        if (!audioSrcContainer.current) {
            audioSrcContainer.current = audioCtxContainer.current.createMediaElementSource(videoRef.current);
        }

        // Create ScriptProcessor for Bitcrush
        if (!audioScriptContainer.current) {
            audioScriptContainer.current = audioCtxContainer.current.createScriptProcessor(bufferSize, 1, 1);
        }

        // Create Bitcrush
        if (!effectBitcrushContainer.current) {
            var normFrequency = _normFrequency ? 1 : 0.1;
            effectBitcrushContainer.current = createBitCrush(_bitSamples, normFrequency)();
        }

        // Create Distortion
        if (!effectDistortionContainer.current) {
            effectDistortionContainer.current = audioCtxContainer.current.createWaveShaper();
        }

        // Create Bass Boost (it's a simple lowshelf EQ)
        if (!effectBassBoostContainer.current) {
            effectBassBoostContainer.current = audioCtxContainer.current.createBiquadFilter();
            effectBassBoostContainer.current.type = "lowshelf";
            effectBassBoostContainer.current.frequency.value = 200;
        }

        // Create Gain
        if (!effectGainContainer.current) {
            effectGainContainer.current = audioCtxContainer.current.createGain();
        }
    }, []);

    /**
     * (Re-)Create the bitcrush effect; else the parameters can't be changed
     * @param {*} paramSamples Bit-Reduction
     * @param {*} paramNormFrequency Phaser-Step value
     * @returns a Bit-Crush effect node
     */
    function createBitCrush(paramSamples, paramNormFrequency) {
        return (function () {
            var node = audioScriptContainer.current;
            var bits = 16 - paramSamples; // between 0 and 15
            var normfreq = paramNormFrequency; // between 0.0 and 1.0
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
    // it would be a lot more optimal  to update the values when only moving the sliders, this resulted in a weird behaviour with the bit-crush though
    // where the program would just freeze; so instead of splitting it into two parts, we decided to keep the parameter-updating code in a useEffect hook
    useEffect(() => {
        //bitcrush - parameters are constrained because html sliders are weird.
        var constrainedBitSamples = _bitSamples;
        if (constrainedBitSamples < 0) { constrainedBitSamples = 0 }
        if (constrainedBitSamples > 15) { constrainedBitSamples = 15 }

        var normFrequency = _normFrequency ? 1 : 0.1;
        effectBitcrushContainer.current = createBitCrush(constrainedBitSamples, normFrequency)();

        // Change distortion curve, 0 - 100
        var constrainedDistortion = _distortion;
        if (constrainedDistortion < 0) { constrainedDistortion = 0 }
        if (constrainedDistortion > 100) { constrainedDistortion = 100 }
        effectDistortionContainer.current.curve = makeDistortionCurve(constrainedDistortion);

        // Change Bass Boost
        effectBassBoostContainer.current.gain.value = _bassBoost;

        // Change Gain
        // Cubic scale for easier usability; the center of the slider is loudness = 1 (unchanged)
        var logGain = 0.008 * Math.pow(_gain, 3);
        effectGainContainer.current.gain.value = logGain;

        // recalculate distortion curve
        // it would be a lot more optimized to pre-calculate the distortion curves and save them in an array, then change it depending on the users liking
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

    return (
        <div className="audio-manipulation-sliders">
            <h1>SFX</h1>
            <div className='control-element'>
                <label className='control-element-label'>Bitcrush</label>
                <input className='control-element-input' type="range" min="-1" max="16" step="1" value={_bitSamples} onChange={e => {setBitSamples(e.target.value)}}/>
            </div>

            <div className='control-element'>
                <label className='control-element-label'>Squeeze Mode</label>
                <input className='control-element-input' type="checkbox" checked={_normFrequency} onChange={e => {setNormFrequency(e.target.checked)}}/>
            </div>

            <div className='control-element'>
                <label className='control-element-label'>Distortion</label>
                <input className='control-element-input' type="range" min="-0.25" max="30.25" step="0.25" value={_distortion} onChange={e => {setDistortion(e.target.value)}}/>
            </div>

            <div className='control-element'>
                <label className='control-element-label'>Bass Boost</label>
                <input className='control-element-input' type="range" min="0" max="100" step="1" value={_bassBoost} onChange={e => {setBassBoost(e.target.value)}}/>
            </div>

            <div className='control-element'>
                <label className='control-element-label'>Gain</label>
                <input className='control-element-input' type="range" min="0" max="10" step="0.01" value={_gain} onChange={e => {setGain(e.target.value)}}/>
            </div>

            <div className='control-element'>
                <label>Reset Sound FX</label>
                <input className='control-element-input' type="button" value="Reset" onClick={(handleResetClick)}></input>
            </div>
        </div>
    );
}

export default AudioManipulator;