import { useEffect, useState, useRef } from 'react';

function AudioManipulator({ videoRef }) {

    const audioCtxContainer = useRef(null);
    const audioSrcContainer = useRef(null);
    const audioScriptContainer = useRef(null)

    var [_bitSamples, setBitSamples] = useState(7);
    const [_bitcrushNormFrequency, setBitcrushNormFrequency] = useState(0.2);
    const [_distortion, setDistortion] = useState(0);
    const [_bassBoost, setBassBoost] = useState(0);
    const [_gain, setGain] = useState(1);

    function handleResetClick() {
        setBitSamples(0);
        setBitcrushNormFrequency(1);
        setDistortion(0);
        setBassBoost(0);
        setGain(1);
    }

    function handlePlay() {
        if (audioCtxContainer.current.state === "running") {
            audioCtxContainer.current.suspend();
        }else {
            audioCtxContainer.current.resume();
        }
    }

    useEffect(() => {
        const video = videoRef.current;
        video.onplay = handlePlay;
        return () => {
          video.onplay = null;
        }
      }, []);

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


        //bitcrush
        var bitcrush = (function () {
            var bufferSize = 4096;
            var node = audioScriptContainer.current;
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
        var dist = audioCtxContainer.current.createWaveShaper();
        // 0 bis 100 funktioniert sehr gut, ist aber egal
        dist.curve = makeDistortionCurve(_distortion);

        // create filter
        var filter = audioCtxContainer.current.createBiquadFilter();
        filter.type = "lowshelf";
        filter.frequency.value = 200;
        filter.gain.value = _bassBoost;

        // gain
        var gain = audioCtxContainer.current.createGain();
        gain.gain.value = _gain;

        // chain effects - first effect in chain is actually last
        audioSrcContainer.current.connect(gain);
        gain.connect(dist);
        dist.connect(bitcrush);
        bitcrush.connect(filter);
        filter.connect(audioCtxContainer.current.destination);

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
            audioSrcContainer.current.disconnect();
            gain.disconnect();
            dist.disconnect()
            bitcrush.disconnect();
            filter.disconnect();
        }
    }, [_bassBoost, _bitSamples, _bitcrushNormFrequency, _distortion, _gain, videoRef, audioCtxContainer]);

//TODO: implement user control for audio filters

    return (
        <div>
            <label>Bitcrush Bit-Reduction</label>
            <input type="range" min="0" max="16" step="1" value={_bitSamples} onChange={e => {setBitSamples(e.target.value)}}/>
            <label>Bitcrush Norm.-Frequency</label>
            <input type="range" min="0" max="1" step="0.01" value={_bitcrushNormFrequency} onChange={e => {setBitcrushNormFrequency(e.target.value)}}/>
            <label>Distortion</label>
            <input type="range" min="0" max="100" step="0.1" value={_distortion} onChange={e => {setDistortion(e.target.value)}}/>
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