var Music = function (a, b) {
    var audio, context;
    try {
        context = new(window.AudioContext || window.webAudioContext || window.webkitAudioContext)();
    } catch (e) {
        throw new Error('The Web Audio API is unavailable');
    }
    let progressCallback;
    var processor = context.createScriptProcessor(1024),
        analyser = context.createAnalyser();
    processor.connect(context.destination);
    analyser.connect(processor);
    var data = new Uint8Array(analyser.frequencyBinCount);
    var Sound = {
        element: undefined,
        play: function () {
            var sound = context.createMediaElementSource(this.element);
            var duration = this.element.duration;
            this.element.onended = function () {
                sound.disconnect();
                sound = null;
                processor.onaudioprocess = function () {};
                resetAll();
                if (progressCallback) {
                    progressCallback("end", 100)
                }
            };
            this.element.ontimeupdate = function (t) {
                if (progressCallback) {
                    var currentTime = this.currentTime;
                    var percent = (currentTime / duration) * 100;
                    progressCallback("playing", percent)
                }
            };
            sound.connect(analyser);
            sound.connect(context.destination);
            processor.onaudioprocess = function () {
                analyser.getByteTimeDomainData(data);
            };
            this.element.play();
            if (progressCallback) {
                progressCallback("play", 0)
            }
        },
        pause: function () {
            this.element.pause();
            if (progressCallback) {
                progressCallback("pause", 0)
            }
        },
        stop: function () {
            this.element.pause();
            sound = null;
            processor.onaudioprocess = function () {};
            resetAll();
            if (progressCallback) {
                progressCallback("stop", 0)
            }
        },
        continue: function () {
            if (this.element.paused) {
                this.element.play();
                if (progressCallback) {
                    progressCallback("continue", 0)
                }
            }
        }
    };

    function loadAudioElement(url) {
        return new Promise(function (resolve, reject) {
            var audio = new Audio();
            audio.addEventListener('canplay', function () {
                resolve(audio);
            });
            audio.addEventListener('error', reject);
            audio.src = url;
        });
    };

    var NUM_OF_SLICES = b.slicesnum,
        STEP = Math.floor(data.length / NUM_OF_SLICES),
        NO_SIGNAL = 256,
        slices = [],
        music = document.getElementById(a),
        height = music.offsetHeight,
        width = music.offsetWidth,
        widthPerSlice = width / NUM_OF_SLICES;
    var timer;

    function continuePlay() {
        audio.continue();
        timer = setInterval(function () {
            render();
        }, b.interval);
    };

    function pausePlay() {
        audio.pause();
        clearInterval(timer);
        for (var i = 0, n = 0; i < NUM_OF_SLICES; i++, n += STEP) {
            var slice = slices[i],
                mask = slice.elem;
            mask.style.height = 0 + "px";
        }
    };

    function stopPlay() {
        audio.stop();
        resetAll()
    }

    function startPlay() {
        for (var i = 0; i < NUM_OF_SLICES; i++) {
            var offset = i * widthPerSlice;
            var mask = document.createElement('div');
            mask.style.width = widthPerSlice + 'px';
            mask.className = "mask";
            mask.style.left = i * widthPerSlice + "px";
            mask.style.background = b.background;
            music.appendChild(mask);
            slices.push({
                offset: offset,
                elem: mask
            });
        }

        timer = setInterval(function () {
            render();
        }, b.interval);
        loadAudioElement(b.musicurl).then(function (elem) {
            audio = Object.create(Sound);
            audio.element = elem;
            audio.play();
        }, function (elem) {
            throw elem.error;
        });
    };

    function resetAll() {
        clearInterval(timer);
        for (var i = 0, n = 0; i < NUM_OF_SLICES; i++, n += STEP) {
            var slice = slices[i],
                mask = slice.elem;
            if (mask && mask.parentNode) {
                mask.parentNode.removeChild(mask);
            }

        }
    }

    function render() {
        for (var i = 0, n = 0; i < NUM_OF_SLICES; i++, n += STEP) {
            var slice = slices[i],
                mask = slice.elem,
                val = Math.floor(data[n] / NO_SIGNAL * height);
            mask.style.height = val + "px";
        }
    };

    return {
        startPlay: function () {
            startPlay()
        },
        pausePlay: function () {
            pausePlay()
        },
        continuePlay: function () {
            continuePlay()
        },
        stopPlay: function () {
            progressCallback = undefined
            stopPlay()
        },
        onPlayProgress: function (callback) {
            progressCallback = callback
        }
    }

}