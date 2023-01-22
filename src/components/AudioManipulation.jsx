import { useEffect } from 'react';

function AudioManipulator({ videoRef }) {

    const context = new AudioContext();

    function handlePlay() {
        context.resume();
    }

    useEffect(() => {
        const video = videoRef.current;
        video.onplay = handlePlay;
        return () => {
          video.onplay = null;
        }
      }, []);

    useEffect(() => {

        const videoElement = videoRef.current;
        const audioSource = context.createMediaElementSource(videoElement);

        //bitcrush
        var bufferSize = 4096;
        var bitcrush = (function () {
            var node = context.createScriptProcessor(bufferSize, 1, 1);
            node.bits = 7; // between 1 and 16
            node.normfreq = 0.2; // between 0.0 and 1.0
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
        var dist = context.createWaveShaper();
        // 0 bis 100 funktioniert sehr gut, ist aber egal
        dist.curve = makeDistortionCurve(100);

        // create filter
        var filter = context.createBiquadFilter();
        filter.type = "lowshelf";
        filter.frequency.value = 200;
        filter.gain.value = 20;

        // gain
        var gain = context.createGain();
        gain.gain.value = 1;

        // chain effects - first effect in chain is actually last
        audioSource.connect(gain);
        gain.connect(dist);
        dist.connect(bitcrush);
        bitcrush.connect(filter);
        filter.connect(context.destination);

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
    }, []);

//TODO: implement user control for audio filters

    return (
        <div>
            
        </div>

    );
}

export default AudioManipulator;