// Apply saved interface theme immediately (before first paint) so there's no flash on load.
        // This only ever touches document.documentElement — it never touches the display-canvas output.
        (function () {
            try {
                const savedTheme = localStorage.getItem('ebp_ui_theme');
                if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
                const savedSidebarPosition = localStorage.getItem('ebp_sidebar_position');
                if (savedSidebarPosition === 'right') {
                    const suite = document.querySelector('.main-production-suite');
                    if (suite) suite.classList.add('sidebar-right');
                }
            } catch (e) {}
        })();

        // Welcome splash: scatter dim stars and remove the overlay once its animation finishes
        (function initWelcomeSplash() {
            const starsContainer = document.getElementById('splashStars');
            const splash = document.getElementById('welcomeSplashScreen');
            if (!starsContainer || !splash) return;
            const starCount = 60;
            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div');
                star.className = 'splash-star';
                star.style.left = (Math.random() * 100).toFixed(2) + '%';
                star.style.top = (Math.random() * 100).toFixed(2) + '%';
                const size = (Math.random() * 2 + 1.4).toFixed(1);
                star.style.width = size + 'px';
                star.style.height = size + 'px';
                star.style.animationDuration = (Math.random() * 2.2 + 1.6).toFixed(2) + 's';
                star.style.animationDelay = (Math.random() * 3).toFixed(2) + 's';
                starsContainer.appendChild(star);
            }
            setTimeout(() => {
                if (splash && splash.parentNode) splash.remove();
                // Ask for microphone access only once the welcome animation has fully finished —
                // and never on the OBS output itself, which should never prompt for a mic.
                const isObsOutput = new URLSearchParams(window.location.search).get('mode') === 'obs';
                if (!isObsOutput && typeof enumerateAudioDevices === 'function') {
                    enumerateAudioDevices();
                }
            }, 5500);
        })();

        // Official Bolls Life Integer Book Mapping Database (Genesis = 1, John = 43)
        const bookBollsIdMap = {
            "genesis": 1, "exodus": 2, "leviticus": 3, "numbers": 4, "deuteronomy": 5,
            "joshua": 6, "judges": 7, "ruth": 8, "1 samuel": 9, "2 samuel": 10,
            "1 kings": 11, "2 kings": 12, "1 chronicles": 13, "2 chronicles": 14,
            "ezra": 15, "nehemiah": 16, "esther": 17, "job": 18, "psalms": 19, "psalm": 19,
            "proverbs": 20, "ecclesiastes": 21, "song of solomon": 22, "song of songs": 22,
            "isaiah": 23, "jeremiah": 24, "lamentations": 25, "ezekiel": 26, "daniel": 27,
            "hosea": 28, "joel": 29, "amos": 30, "obadiah": 31, "jonah": 32,
            "micah": 33, "nahum": 34, "habakkuk": 35, "zephaniah": 36, "haggai": 37,
            "zechariah": 38, "malachi": 39, "matthew": 40, "mark": 41, "luke": 42,
            "john": 43, "acts": 44, "romans": 45, "1 corinthians": 46, "2 corinthians": 47,
            "galatians": 48, "ephesians": 49, "philippians": 50, "colossians": 51,
            "1 thessalonians": 52, "2 thessalonians": 53, "1 timothy": 54, "2 timothy": 55,
            "titus": 56, "philemon": 57, "hebrews": 58, "james": 59, "1 peter": 60,
            "2 peter": 61, "1 john": 62, "2 john": 63, "3 john": 64, "jude": 65, "revelation": 66
        };

        const cleanBookNames = {
            1: "Genesis", 2: "Exodus", 3: "Leviticus", 4: "Numbers", 5: "Deuteronomy",
            6: "Joshua", 7: "Judges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
            11: "1 Kings", 12: "2 Kings", 13: "1 Chronicles", 14: "2 Chronicles",
            15: "Ezra", 16: "Nehemiah", 17: "Esther", 18: "Job", 19: "Psalms",
            20: "Proverbs", 21: "Ecclesiastes", 22: "Song of Solomon",
            23: "Isaiah", 24: "Jeremiah", 25: "Lamentations", 26: "Ezekiel", 27: "Daniel",
            28: "Hosea", 29: "Joel", 30: "Amos", 31: "Obadiah", 32: "Jonah",
            33: "Micah", 34: "Nahum", 35: "Habakkuk", 36: "Zephaniah", 37: "Haggai",
            38: "Zechariah", 39: "Malachi", 40: "Matthew", 41: "Mark", 42: "Luke",
            43: "John", 44: "Acts", 45: "Romans", 46: "1 Corinthians", 47: "2 Corinthians",
            48: "Galatians", 49: "Ephesians", 50: "Philippians", 51: "Colossians",
            52: "1 Thessalonians", 53: "2 Thessalonians", 54: "1 Timothy", 55: "2 Timothy",
            56: "Titus", 57: "Philemon", 58: "Hebrews", 59: "James", 60: "1 Peter",
            61: "2 Peter", 62: "1 John", 63: "2 John", 64: "3 John", 65: "Jude",
            66: "Revelation"
        };

        const bookAbbrevMap = {
            "genesis": "Gen", "exodus": "Exo", "leviticus": "Lev", "numbers": "Num", "deuteronomy": "Deu",
            "joshua": "Jos", "judges": "Jud", "ruth": "Rut", "1 samuel": "1Sa", "2 samuel": "2Sa",
            "1 kings": "1Ki", "2 kings": "2Ki", "1 chronicles": "1Ch", "2 chronicles": "2Ch",
            "ezra": "Ezr", "nehemiah": "Neh", "esther": "Est", "job": "Job", "psalms": "Psa", "psalm": "Psa",
            "proverbs": "Pro", "ecclesiastes": "Ecc", "song of solomon": "Sol", "song of songs": "Sol",
            "isaiah": "Isa", "jeremiah": "Jer", "lamentations": "Lam", "ezekiel": "Eze", "daniel": "Dan",
            "hosea": "Hos", "joel": "Joe", "amos": "Amo", "obadiah": "Oba", "jonah": "Jon",
            "micah": "Mic", "nahum": "Nah", "habakkuk": "Hab", "zephaniah": "Zep", "haggai": "Hag",
            "zechariah": "Zec", "malachi": "Mal", "matthew": "Mat", "mark": "Mar", "luke": "Luk",
            "john": "Joh", "acts": "Act", "romans": "Rom", "1 corinthians": "1Co", "2 corinthians": "2Co",
            "galatians": "Gal", "ephesians": "Eph", "philippians": "Phi", "colossians": "Col",
            "1 thessalonians": "1Th", "2 thessalonians": "2Th", "1 timothy": "1Ti", "2 timothy": "2Ti",
            "titus": "Tit", "philemon": "Phm", "hebrews": "Heb", "james": "Jas", "1 peter": "1Pe",
            "2 peter": "2Pe", "1 john": "1Jo", "2 john": "2Jo", "3 john": "3Jo", "jude": "Jud", "revelation": "Rev"
        };

        // Network & Communication States
        let hostPeerNode = null;
        let activeRemoteDataConnections = [];
        let peerClientConnection = null;
        const obsBroadcastChannel = new BroadcastChannel('obs_presenter_live');

        // Dynamic State Engine Setup
        let isListening = false;
        let recognition = null;
        let activeChapterVerses = []; 
        let generatedLyricSlides = [];
        let obsWindowRef = null;
        let isLiveFrozen = false; // FREEZE: when true, Live/OBS/Projector output is locked and ignores Send Live

        // CUSTOM HOTKEYS: optional, per-feature, user-assignable — like OBS hotkeys
        let customHotkeys = {};
        try { customHotkeys = JSON.parse(localStorage.getItem('ebp_custom_hotkeys') || '{}'); } catch (e) { customHotkeys = {}; }

        const HOTKEY_ACTIONS = {
            sendLive: { label: 'Send Live', fn: () => sendStagedToLiveView() },
            freezeLive: { label: 'Freeze / Unfreeze Live', fn: () => document.getElementById('freezeLiveBtn').click() },
            openObs: { label: 'Open OBS Window', fn: () => spawnObsProjectorWindow() },
            toggleVoice: { label: 'Toggle Live Voice', fn: () => document.getElementById('listeningBtn').click() },
            nextSlide: { label: 'Next Verse / Song Slide', fn: () => {
                const isSongTabActive = document.getElementById('lyrics-tab') && document.getElementById('lyrics-tab').classList.contains('active');
                if (isSongTabActive) { navigateSongSlide(1); } else { navigateSequentialOffsetVerses(1); sendStagedToLiveView(); }
            } },
            prevSlide: { label: 'Previous Verse / Song Slide', fn: () => {
                const isSongTabActive = document.getElementById('lyrics-tab') && document.getElementById('lyrics-tab').classList.contains('active');
                if (isSongTabActive) { navigateSongSlide(-1); } else { navigateSequentialOffsetVerses(-1); sendStagedToLiveView(); }
            } },
            stageAnnouncement: { label: 'Stage Announcement', fn: () => document.getElementById('stageAnnouncementBtn').click() },
            clearAnnouncement: { label: 'Clear Announcement', fn: () => document.getElementById('clearAnnouncementBtn').click() },
            timerStartStop: { label: 'Start / Stop Broadcast Timer', fn: () => document.getElementById('timerToggleStartBtn').click() },
            timerReset: { label: 'Reset Broadcast Timer', fn: () => document.getElementById('timerResetBtn').click() },
            videoPlayPause: { label: 'Play / Pause Video Background', fn: () => document.getElementById('videoPlayPauseBtn').click() }
        };

        function persistHotkeys() {
            try { localStorage.setItem('ebp_custom_hotkeys', JSON.stringify(customHotkeys)); } catch (e) {}
        }

        function renderHotkeysList() {
            const container = document.getElementById('hotkeysList');
            if (!container) return;
            container.innerHTML = '';
            Object.keys(HOTKEY_ACTIONS).forEach(actionKey => {
                const row = document.createElement('div');
                row.className = 'hotkey-row';
                const currentKey = customHotkeys[actionKey] || '';
                row.innerHTML = `
                    <span class="hotkey-row-label">${HOTKEY_ACTIONS[actionKey].label}</span>
                    <div class="hotkey-row-controls">
                        <span class="hotkey-key-display" data-action="${actionKey}">${currentKey || '— none —'}</span>
                        <button class="btn hotkey-set-btn" data-action="${actionKey}" style="padding: 0.3rem 0.6rem; font-size: 0.7rem;">Set</button>
                        <button class="btn hotkey-clear-btn" data-action="${actionKey}" style="padding: 0.3rem 0.6rem; font-size: 0.7rem; background:#7f1d1d; border-color:#991b1b;">Clear</button>
                    </div>
                `;
                container.appendChild(row);
            });

            container.querySelectorAll('.hotkey-set-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const actionKey = btn.dataset.action;
                    const display = container.querySelector(`.hotkey-key-display[data-action="${actionKey}"]`);
                    display.innerText = 'Press a key...';
                    display.classList.add('listening');
                    function captureKey(e) {
                        e.preventDefault();
                        // Prevent assigning a key already used by another action
                        const conflict = Object.keys(customHotkeys).find(k => customHotkeys[k] === e.key && k !== actionKey);
                        if (conflict) {
                            alert(`"${e.key}" is already assigned to "${HOTKEY_ACTIONS[conflict].label}". Clear that one first.`);
                        } else {
                            customHotkeys[actionKey] = e.key;
                            persistHotkeys();
                        }
                        document.removeEventListener('keydown', captureKey, true);
                        renderHotkeysList();
                    }
                    document.addEventListener('keydown', captureKey, true);
                });
            });
            container.querySelectorAll('.hotkey-clear-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    delete customHotkeys[btn.dataset.action];
                    persistHotkeys();
                    renderHotkeysList();
                });
            });
        }

        let importedAssetsLibrary = [];
        let executionDisplayHistory = [];
        let cachedLogoDataUrl = ""; 

        // Microphone & Volume Tracking Parameters
        let audioCtx = null;
        let audioAnalyser = null;
        let audioMicStream = null;
        let audioSourceNode = null;
        let spectrumAnimId = null;
        let lastAutoMatchedRef = ""; 

        // BROADCAST COUNTDOWN STATE PARAMETERS
        let countdownValueSeconds = 300; 
        let isTimerActive = false;
        let countdownTimerInterval = null;

        // STATE PARAMS INCLUDING LOGO SIZE AND THEME DETAILS
        let previewState = { 
            text: "", ref: "", layout: "mode-center", fontSize: "medium", bgColor: "#0f172a", textColor: "#ffffff",
            flierId: "", textBgUrl: "", isScrolling: false, logoPosition: "", logoSize: 6,
            timerVisible: false, timerSolo: false, timerText: "05:00", timerPosition: "timer-top-right", timerSize: "timer-size-medium",
            timerScale: 1.0,
            videoBgUrl: "", videoBgEnabled: false, bgOpacity: 100, textBackingPanel: false, gradientGlowText: false,
            lowerThirdName: "", lowerThirdRole: "Ministering", lowerThirdVisible: false,
            refColor: "", lowerThirdColor: "#ffffff",
            videoOverlayMode: true,
            announcementText: "", announcementVisible: false, announcementScrolling: false,
            bgTransparent: false
        };
        
        let liveState = { 
            text: "", ref: "", layout: "mode-center", fontSize: "medium", bgColor: "#0f172a", textColor: "#ffffff",
            flierId: "", textBgUrl: "", isScrolling: false, logoPosition: "", logoSize: 6,
            timerVisible: false, timerSolo: false, timerText: "05:00", timerPosition: "timer-top-right", timerSize: "timer-size-medium",
            timerScale: 1.0,
            videoBgUrl: "", videoBgEnabled: false, bgOpacity: 100, textBackingPanel: false, gradientGlowText: false,
            lowerThirdName: "", lowerThirdRole: "Ministering", lowerThirdVisible: false,
            refColor: "", lowerThirdColor: "#ffffff",
            videoOverlayMode: true,
            announcementText: "", announcementVisible: false, announcementScrolling: false,
            bgTransparent: false
        };

        let currentBookCode = 46; 
        let currentBookName = "1 Corinthians";
        let currentChapter = 3;
        let currentVerse = 2;

        // DISPLAY TRANSITION STYLE (interface-only setting; the projected canvas colors are never affected)
        let displayTransitionStyle = "none";
        try {
            const savedTransitionStyle = localStorage.getItem('ebp_display_transition');
            if (savedTransitionStyle) displayTransitionStyle = savedTransitionStyle;
        } catch (e) {}

        function getDisplayTransitionClass() {
            switch (displayTransitionStyle) {
                case 'fade': return 'ebp-transition-fade';
                case 'slide': return 'ebp-transition-slide';
                case 'zoom': return 'ebp-transition-zoom';
                default: return '';
            }
        }

        function applyUiTheme(theme) {
            if (theme === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            try { localStorage.setItem('ebp_ui_theme', theme); } catch (e) {}
        }

        function applySidebarPosition(position) {
            const suite = document.querySelector('.main-production-suite');
            if (!suite) return;
            suite.classList.toggle('sidebar-right', position === 'right');
            try { localStorage.setItem('ebp_sidebar_position', position); } catch (e) {}
        }

        const urlParameters = new URLSearchParams(window.location.search);
        const isObsMode = urlParameters.get('mode') === 'obs';

        // Conditional Entrypoint Initialization
        window.onload = () => {
            if (isObsMode) {
                document.body.classList.add('is-obs-mode');
                bootObsSourceApplication();
            } else {
                bootMainStudioPresentationSuite();
            }
        };

        function bootMainStudioPresentationSuite() {
            initSpeechEngine();
            setupStudioEventBindings();
            initializeHostNetworkingMatrix();
            fetchCurrentChapterFromAPI();
            initTimerEngine();
            initLogoSizerEngine();
            renderHotkeysList();
        }

        async function enumerateAudioDevices() {
            const selector = document.getElementById('audioSourceSelector');
            try {
                const tempPermissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                tempPermissionStream.getTracks().forEach(track => track.stop());
                selector.innerHTML = '';
                devices.forEach(device => {
                    if (device.kind === 'audioinput') {
                        const opt = document.createElement('option');
                        opt.value = device.deviceId;
                        opt.innerText = device.label || `Mic Channel (${device.deviceId.substring(0, 5)})`;
                        selector.appendChild(opt);
                    }
                });
            } catch (err) {
                selector.innerHTML = '<option value="default">Default Input Hardware</option>';
            }
        }

        function initializeHostNetworkingMatrix() {
            const hostId = 'ebp-' + Math.floor(100000 + Math.random() * 900000);
            hostPeerNode = new Peer(hostId);

            hostPeerNode.on('open', (id) => {
                const baseHref = window.location.origin + window.location.pathname;
                
                document.getElementById('obsDockLinkInput').value = `${baseHref}?sessionToken=${id}`;
                document.getElementById('obsBrowserSourceInput').value = `${baseHref}?mode=obs&sessionToken=${id}`;

                document.getElementById('statusText').innerText = "System Ready";
                document.getElementById('statusDot').className = "status-dot active";
            });

            hostPeerNode.on('connection', (conn) => {
                activeRemoteDataConnections.push(conn);
                conn.on('data', (incomingPayload) => {
                    handleIncomingRemoteDataPayload(incomingPayload);
                });
                conn.on('open', () => {
                    transmitStatePacketToRemoteClients();
                });
            });
        }

        function handleIncomingRemoteDataPayload(packet) {
            if (!packet || !packet.type) return;
            switch (packet.type) {
                case "REMOTE_NAVIGATE_OFFSET":
                    navigateSequentialOffsetVerses(packet.offsetValue);
                    sendStagedToLiveView(); // Arrow navigation from remote now maps live immediately
                    break;
                case "REMOTE_SELECT_INDEX":
                    selectSpecificVerseCoordinate(packet.verseNum);
                    break;
                case "REMOTE_TRIGGER_LIVE":
                    sendStagedToLiveView();
                    break;
            }
        }

        function transmitStatePacketToRemoteClients() {
            const systemSyncPayload = {
                type: "SYSTEM_SYNC_STATE",
                activeChapterVerses: activeChapterVerses,
                bookName: currentBookName,
                chapter: currentChapter,
                verse: currentVerse,
                previewState: previewState,
                liveState: liveState,
                importedAssetsLibrary: importedAssetsLibrary, 
                cachedLogoDataUrl: cachedLogoDataUrl
            };
            activeRemoteDataConnections.forEach(conn => {
                if (conn.open) conn.send(systemSyncPayload);
            });
            
            // Triple-Redundancy Sync Channel 1: BroadcastChannel
            obsBroadcastChannel.postMessage(systemSyncPayload);

            // Triple-Redundancy Sync Channel 2: LocalStorage Events (OBS IFrame Fix)
            localStorage.setItem('ebp_live_sync_state', JSON.stringify(systemSyncPayload));
        }

        function updateVuMeterStatus(state) {
            const dot = document.getElementById('vuStatusDot');
            const text = document.getElementById('vuStatusText');
            if (!dot || !text) return;
            dot.classList.remove('vu-connected', 'vu-disconnected');
            if (state === 'connected') {
                dot.classList.add('vu-connected');
                text.innerText = 'Connected';
            } else if (state === 'disconnected') {
                dot.classList.add('vu-disconnected');
                text.innerText = 'Disconnected';
                const mask = document.getElementById('vuBarMask');
                if (mask) mask.style.height = '100%';
            } else {
                text.innerText = 'Idle';
            }
        }

        async function runAudioContextVolumeDetection() {
            if (audioMicStream && audioMicStream.active) {
                return;
            }
            const chosenDeviceId = document.getElementById('audioSourceSelector').value;
            const liveConstraints = {
                audio: chosenDeviceId ? { deviceId: { exact: chosenDeviceId } } : true
            };
            try {
                if (audioMicStream) {
                    audioMicStream.getTracks().forEach(track => track.stop());
                }
                audioMicStream = await navigator.mediaDevices.getUserMedia(liveConstraints);

                if (!audioCtx) {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                if (audioCtx.state === 'suspended') {
                    await audioCtx.resume();
                }

                audioAnalyser = audioCtx.createAnalyser();
                audioAnalyser.fftSize = 256;

                audioSourceNode = audioCtx.createMediaStreamSource(audioMicStream);
                audioSourceNode.connect(audioAnalyser);

                updateVuMeterStatus('connected');
                drawActiveHardwareSpectralSignal();
            } catch (err) {
                console.warn("Speech diagnostics interface warning:", err);
                updateVuMeterStatus('disconnected');
            }
        }

        function disableAudioVolumeDetection() {
            if (spectrumAnimId) cancelAnimationFrame(spectrumAnimId);
            if (audioMicStream) {
                audioMicStream.getTracks().forEach(track => track.stop());
                audioMicStream = null;
            }
            resetSignalSpectrumLEDBars();
            updateVuMeterStatus('disconnected');
        }

        function drawActiveHardwareSpectralSignal() {
            if (!audioAnalyser) return;
            const dataFrequencyArray = new Uint8Array(audioAnalyser.frequencyBinCount);

            function loop() {
                spectrumAnimId = requestAnimationFrame(loop);
                audioAnalyser.getByteFrequencyData(dataFrequencyArray);

                let accum = 0;
                for (let idx = 0; idx < dataFrequencyArray.length; idx++) {
                    accum += dataFrequencyArray[idx];
                }
                let realTimeAmplitudeAvg = accum / dataFrequencyArray.length;
                let activeBarLevels = Math.min(8, Math.floor(realTimeAmplitudeAvg / 10)); 

                const dynamicBars = document.querySelectorAll('.signal-bar');
                dynamicBars.forEach((barElement, currentBarIdx) => {
                    if (currentBarIdx < activeBarLevels) {
                        if (currentBarIdx < 4) {
                            barElement.style.backgroundColor = "var(--accent-success)";
                        } else if (currentBarIdx < 6) {
                            barElement.style.backgroundColor = "#fbbf24";
                        } else {
                            barElement.style.backgroundColor = "var(--accent-live)";
                        }
                    } else {
                        barElement.style.backgroundColor = "#1e293b";
                    }
                });

                // Floating VU meter widget — mirrors the same live level, connected while the stream is active
                const vuMask = document.getElementById('vuBarMask');
                if (vuMask) {
                    const levelPct = Math.max(0, Math.min(100, (realTimeAmplitudeAvg / 160) * 100));
                    vuMask.style.height = `${100 - levelPct}%`;
                }
                if (audioMicStream && audioMicStream.active) {
                    updateVuMeterStatus('connected');
                } else {
                    updateVuMeterStatus('disconnected');
                }
            }
            loop();
        }

        function resetSignalSpectrumLEDBars() {
            document.querySelectorAll('.signal-bar').forEach(bar => {
                bar.style.backgroundColor = "#1e293b";
            });
        }

        function switchTab(tabId) {
            document.querySelectorAll('.panel-tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.panel-tab-content').forEach(content => content.classList.remove('active'));

            const targetBtn = Array.from(document.querySelectorAll('.panel-tab-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
            if (targetBtn) targetBtn.classList.add('active');
            
            const targetContent = document.getElementById(tabId);
            if (targetContent) targetContent.classList.add('active');
        }

        // DEBOUNCED WORD SEARCH SYSTEM
        let searchDebounceTimeout = null;
        document.getElementById('instantWordSearchInput').addEventListener('input', () => {
            clearTimeout(searchDebounceTimeout);
            searchDebounceTimeout = setTimeout(executeWordSearchQuery, 350);
        });

        // SONG LYRICS WEB SEARCH: opens direct search links on the sites requested.
        // Note: these sites don't offer a free public API for pulling lyrics text directly into the app
        // (Musixmatch/Genius/Spotify require paid/auth API access, and scraping them isn't reliable or permitted),
        // so this gives one-click search links instead of pretending to embed results.
        function runLyricsWebSearch() {
            const query = document.getElementById('lyricsWebSearchInput').value.trim();
            const resultsBox = document.getElementById('lyricsWebSearchResults');
            resultsBox.innerHTML = '';
            if (!query) return;
            const encoded = encodeURIComponent(query + ' lyrics');
            const sources = [
                { name: 'Genius', url: `https://genius.com/search?q=${encoded}` },
                { name: 'AZLyrics (via Google)', url: `https://www.google.com/search?q=${encoded}+site:azlyrics.com` },
                { name: 'Musixmatch', url: `https://www.musixmatch.com/search/${encodeURIComponent(query)}` },
                { name: 'YouTube (lyric video)', url: `https://www.youtube.com/results?search_query=${encoded}` },
                { name: 'Google Search', url: `https://www.google.com/search?q=${encoded}` }
            ];
            sources.forEach(src => {
                const link = document.createElement('a');
                link.href = src.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'verse-row';
                link.style.textDecoration = 'none';
                link.style.borderLeft = '3px solid #8b5cf6';
                link.innerHTML = `<span class="verse-num-badge" style="background: rgba(139, 92, 246, 0.15); color: #c084fc;">🔗</span><div class="verse-preview-text">Search "${query}" on ${src.name}</div>`;
                resultsBox.appendChild(link);
            });
        }
        document.getElementById('lyricsWebSearchBtn').addEventListener('click', runLyricsWebSearch);
        document.getElementById('lyricsWebSearchInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); runLyricsWebSearch(); }
        });


        async function executeWordSearchQuery() {
            const query = document.getElementById('instantWordSearchInput').value.trim();
            const counterText = document.getElementById('wordSearchResultCount');
            const resultContainer = document.getElementById('wordSearchResultDeck');

            if (!query) {
                counterText.innerText = "Type at least 3 characters...";
                resultContainer.innerHTML = '<div class="placeholder-text">Query results will render automatically.</div>';
                return;
            }

            if (query.length < 3) {
                counterText.innerText = "Type at least 3 characters...";
                return;
            }

            counterText.innerText = "Scanning Database...";
            resultContainer.innerHTML = '<div class="placeholder-text">Searching...</div>';

            try {
                const currentTranslation = document.getElementById('versionSelector').value;
                const searchUrl = `https://bolls.life/v2/find/${currentTranslation}?search=${encodeURIComponent(query)}&match_case=false&match_whole=false&limit=40&page=1`;
                const response = await fetch(searchUrl);
                if (!response.ok) throw new Error("Database network failure");

                const data = await response.json();
                if (data && data.results && data.results.length > 0) {
                    counterText.innerText = `Found ${data.total} matches`;
                    resultContainer.innerHTML = "";

                    data.results.forEach(res => {
                        const bookName = cleanBookNames[res.book] || `Book ${res.book}`;
                        const locationRef = `${bookName} ${res.chapter}:${res.verse}`;

                        const row = document.createElement('div');
                        row.className = "verse-row";
                        row.style.borderLeft = "3px solid var(--accent-primary)";

                        let cleanText = res.text.replace(/<[^>]*>/g, '').trim();
                        let highlightedHTML = cleanText;
                        try {
                            const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                            const regex = new RegExp(`(${escapedQuery})`, 'gi');
                            highlightedHTML = cleanText.replace(regex, '<mark style="background-color: rgba(56, 189, 248, 0.35); color: #fff; padding: 1px 3px; border-radius: 3px;">$1</mark>');
                        } catch(e) {}

                        row.innerHTML = `
                            <span class="verse-num-badge">${locationRef}</span>
                            <div class="verse-preview-text" style="font-size: 0.75rem; margin-top: 0.25rem;">${highlightedHTML}</div>
                        `;

                        // SINGLE CLICK: Stage in Preview Monitor
                        row.addEventListener('click', async () => {
                            currentBookCode = res.book;
                            currentBookName = bookName;
                            currentChapter = res.chapter;
                            currentVerse = res.verse;

                            await fetchCurrentChapterFromAPI();

                            previewState.text = cleanText;
                            previewState.ref = `${locationRef} (${getVersionDisplayLabel(currentTranslation)})`;
                            previewState.isScrolling = false;
                            renderPreview();
                        });

                        // DOUBLE CLICK: Load Staging and Direct Live Cast
                        row.addEventListener('dblclick', async () => {
                            currentBookCode = res.book;
                            currentBookName = bookName;
                            currentChapter = res.chapter;
                            currentVerse = res.verse;

                            await fetchCurrentChapterFromAPI();

                            previewState.text = cleanText;
                            previewState.ref = `${locationRef} (${getVersionDisplayLabel(currentTranslation)})`;
                            previewState.isScrolling = false;
                            renderPreview();
                            sendStagedToLiveView();
                        });

                        resultContainer.appendChild(row);
                    });
                } else {
                    counterText.innerText = "0 matches found";
                    resultContainer.innerHTML = '<div class="placeholder-text">No matches found. Try another translation.</div>';
                }
            } catch (err) {
                console.error(err);
                counterText.innerText = "Scan timeout";
                resultContainer.innerHTML = '<div class="placeholder-text" style="color:var(--accent-live);">Scan failed. Network offline.</div>';
            }
        }

        // SONG LYRICS CONSOLE INTEGRATION ENGINE
        document.getElementById('processLyricsBtn').addEventListener('click', generateLyricSlides);

        // SONG LIBRARY: saved songs list (title + lyrics + split mode), persisted locally
        let savedSongsLibrary = [];
        try { savedSongsLibrary = JSON.parse(localStorage.getItem('ebp_saved_songs') || '[]'); } catch (e) { savedSongsLibrary = []; }

        function persistSavedSongs() {
            try { localStorage.setItem('ebp_saved_songs', JSON.stringify(savedSongsLibrary)); } catch (e) {}
        }

        function refreshSavedSongsDropdown() {
            const dd = document.getElementById('savedSongsDropdown');
            if (!dd) return;
            const currentVal = dd.value;
            dd.innerHTML = '<option value="">-- Select a Saved Song --</option>';
            savedSongsLibrary
                .slice()
                .sort((a, b) => a.title.localeCompare(b.title))
                .forEach(song => {
                    const opt = document.createElement('option');
                    opt.value = song.id;
                    opt.innerText = song.title;
                    dd.appendChild(opt);
                });
            dd.value = currentVal;
        }

        document.getElementById('saveSongBtn').addEventListener('click', () => {
            const title = document.getElementById('lyricsSongLabelInput').value.trim();
            const lyrics = document.getElementById('lyricsTextInput').value.trim();
            if (!title) { alert('Please enter a Slide Label (this becomes the song title) before saving.'); return; }
            if (!lyrics) { alert('Please paste the song lyrics before saving.'); return; }
            const splitMode = document.getElementById('lyricsSplitSelector').value;
            const existing = savedSongsLibrary.find(s => s.title.toLowerCase() === title.toLowerCase());
            if (existing) {
                existing.lyrics = lyrics;
                existing.splitMode = splitMode;
            } else {
                savedSongsLibrary.push({ id: 'song_' + Date.now(), title, lyrics, splitMode });
            }
            persistSavedSongs();
            refreshSavedSongsDropdown();
            document.getElementById('savedSongsDropdown').value = (existing ? existing.id : savedSongsLibrary[savedSongsLibrary.length - 1].id);

            // Visible confirmation feedback
            const saveBtn = document.getElementById('saveSongBtn');
            const originalLabel = saveBtn.dataset.originalLabel || saveBtn.innerText;
            saveBtn.dataset.originalLabel = originalLabel;
            saveBtn.innerText = '✓ Saved!';
            saveBtn.classList.add('toggle-active');
            clearTimeout(saveBtn._resetTimer);
            saveBtn._resetTimer = setTimeout(() => {
                saveBtn.innerText = originalLabel;
                saveBtn.classList.remove('toggle-active');
            }, 1600);
        });

        document.getElementById('loadSavedSongBtn').addEventListener('click', () => {
            const id = document.getElementById('savedSongsDropdown').value;
            if (!id) return;
            const song = savedSongsLibrary.find(s => s.id === id);
            if (!song) return;
            document.getElementById('lyricsSongLabelInput').value = song.title;
            document.getElementById('lyricsTextInput').value = song.lyrics;
            document.getElementById('lyricsSplitSelector').value = song.splitMode || '2';
            generateLyricSlides();
        });

        document.getElementById('deleteSavedSongBtn').addEventListener('click', () => {
            const id = document.getElementById('savedSongsDropdown').value;
            if (!id) return;
            const song = savedSongsLibrary.find(s => s.id === id);
            if (!song) return;
            if (!confirm(`Delete "${song.title}" from the Song Library? This cannot be undone.`)) return;
            savedSongsLibrary = savedSongsLibrary.filter(s => s.id !== id);
            persistSavedSongs();
            refreshSavedSongsDropdown();
        });

        document.getElementById('lyricsFileLoadBtn').addEventListener('click', () => {
            document.getElementById('lyricsFilePicker').click();
        });
        document.getElementById('lyricsFilePicker').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const statusEl = document.getElementById('lyricsFileLoadStatus');
            statusEl.innerText = `Reading ${file.name}...`;
            const ext = file.name.split('.').pop().toLowerCase();

            try {
                let extractedText = '';
                if (ext === 'txt') {
                    extractedText = await file.text();
                } else if (ext === 'docx' || ext === 'doc') {
                    if (typeof mammoth === 'undefined') throw new Error('Document reader library did not load (no internet access?).');
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    extractedText = result.value;
                } else if (ext === 'pdf') {
                    if (typeof pdfjsLib === 'undefined') throw new Error('PDF reader library did not load (no internet access?).');
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    const pageTexts = [];
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const content = await page.getTextContent();
                        const pageText = content.items.map(item => item.str).join(' ');
                        pageTexts.push(pageText);
                    }
                    extractedText = pageTexts.join('\n\n');
                } else {
                    throw new Error('Unsupported file type. Please use .pdf, .docx, or .txt.');
                }

                document.getElementById('lyricsTextInput').value = extractedText.trim();
                if (!document.getElementById('lyricsSongLabelInput').value.trim()) {
                    document.getElementById('lyricsSongLabelInput').value = file.name.replace(/\.[^.]+$/, '');
                }
                statusEl.innerText = `Loaded "${file.name}". Review the text, then click Generate.`;
            } catch (err) {
                console.error(err);
                statusEl.innerText = `Could not read file: ${err.message || err}`;
            } finally {
                e.target.value = '';
            }
        });


        document.getElementById('lyricsSongLabelInput').addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            const box = document.getElementById('songTitleSuggestions');
            if (!query) { box.classList.remove('open'); box.innerHTML = ''; return; }
            const matches = savedSongsLibrary.filter(s => s.title.toLowerCase().includes(query)).slice(0, 6);
            if (!matches.length) { box.classList.remove('open'); box.innerHTML = ''; return; }
            box.innerHTML = '';
            matches.forEach(song => {
                const item = document.createElement('div');
                item.className = 'song-title-suggestion-item';
                item.innerText = song.title;
                item.addEventListener('mousedown', (evt) => {
                    evt.preventDefault(); // keep focus so blur doesn't close before click registers
                    document.getElementById('lyricsSongLabelInput').value = song.title;
                    document.getElementById('lyricsTextInput').value = song.lyrics;
                    document.getElementById('lyricsSplitSelector').value = song.splitMode || '2';
                    box.classList.remove('open');
                    box.innerHTML = '';
                    generateLyricSlides();
                });
                box.appendChild(item);
            });
            box.classList.add('open');
        });
        document.getElementById('lyricsSongLabelInput').addEventListener('blur', () => {
            setTimeout(() => {
                const box = document.getElementById('songTitleSuggestions');
                box.classList.remove('open');
                box.innerHTML = '';
            }, 150);
        });

        function generateLyricSlides() {
            const rawLyrics = document.getElementById('lyricsTextInput').value.trim();
            const splitMode = document.getElementById('lyricsSplitSelector').value;
            const outputDeck = document.getElementById('lyricsSlidesDeck');

            if (!rawLyrics) {
                outputDeck.innerHTML = '<div class="placeholder-text" style="color: var(--accent-live)">Paste song text before generating.</div>';
                return;
            }

            outputDeck.innerHTML = '<div class="placeholder-text">Splitting verses...</div>';
            generatedLyricSlides = [];

            let slideBlocks = [];

            if (splitMode === 'blank') {
                slideBlocks = rawLyrics.split(/\n\s*\n/).map(block => block.trim()).filter(block => block.length > 0);
            } else {
                const targetLinesCount = parseInt(splitMode);
                const lines = rawLyrics.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                
                for (let i = 0; i < lines.length; i += targetLinesCount) {
                    const chunk = lines.slice(i, i + targetLinesCount);
                    slideBlocks.push(chunk.join('\n'));
                }
            }

            if (slideBlocks.length === 0) {
                outputDeck.innerHTML = '<div class="placeholder-text">Failed to group text lines.</div>';
                return;
            }

            outputDeck.innerHTML = "";

            slideBlocks.forEach((textBlock, idx) => {
                const slideNum = idx + 1;
                const linesPreview = textBlock.replace(/\n/g, ' / ');
                const displaySnippet = linesPreview.length > 70 ? linesPreview.substring(0, 67) + '...' : linesPreview;

                const row = document.createElement('div');
                row.className = "verse-row";
                row.style.borderLeft = "3px solid #8b5cf6";
                row.innerHTML = `
                    <span class="verse-num-badge" style="background: rgba(139, 92, 246, 0.15); color: #c084fc;">Slide ${slideNum}</span>
                    <div class="verse-preview-text" style="font-family: monospace; font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displaySnippet}</div>
                `;

                // Single Click: Stage inside preview
                row.addEventListener('click', () => {
                    document.querySelectorAll('#lyricsSlidesDeck .verse-row').forEach(r => r.classList.remove('active'));
                    row.classList.add('active');

                    const liveSongLabel = document.getElementById('lyricsSongLabelInput').value.trim(); // No label shown at all unless the operator typed one
                    previewState.text = textBlock;
                    previewState.ref = liveSongLabel; // Displayed without the slide number — the number is only for internal navigation
                    previewState.isScrolling = false;
                    renderPreview();
                });

                // Double Click: Stage and force live immediately
                row.addEventListener('dblclick', () => {
                    document.querySelectorAll('#lyricsSlidesDeck .verse-row').forEach(r => r.classList.remove('active'));
                    row.classList.add('active');

                    const liveSongLabel = document.getElementById('lyricsSongLabelInput').value.trim(); // No label shown at all unless the operator typed one
                    previewState.text = textBlock;
                    previewState.ref = liveSongLabel; // Displayed without the slide number — the number is only for internal navigation
                    previewState.isScrolling = false;
                    renderPreview();
                    sendStagedToLiveView();
                });

                outputDeck.appendChild(row);
            });
        }

        // BROADCAST CHRONOMETER TIMER SERVICE MODULE
        function initTimerEngine() {
            const minInput = document.getElementById('timerMinInput');
            const secInput = document.getElementById('timerSecInput');
            const toggleStartBtn = document.getElementById('timerToggleStartBtn');
            const resetBtn = document.getElementById('timerResetBtn');
            const visCheck = document.getElementById('timerVisibilityCheck');
            const soloCheck = document.getElementById('timerSoloCheck');
            const posSelector = document.getElementById('timerPosSelector');
            const sizeSelector = document.getElementById('timerSizeSelector');
            const scaleDecBtn = document.getElementById('timerScaleDecBtn');
            const scaleIncBtn = document.getElementById('timerScaleIncBtn');
            const scaleValueSpan = document.getElementById('timerScaleValue');

            function applyTimerScale(newScale) {
                newScale = Math.max(0.4, Math.min(4.0, parseFloat(newScale.toFixed(2))));
                previewState.timerScale = newScale;
                scaleValueSpan.innerText = `${Math.round(newScale * 100)}%`;
                renderPreview();
                transmitStatePacketToRemoteClients();
            }

            scaleDecBtn.addEventListener('click', () => {
                const current = previewState.timerScale || 1.0;
                applyTimerScale(current - 0.1);
            });

            scaleIncBtn.addEventListener('click', () => {
                const current = previewState.timerScale || 1.0;
                applyTimerScale(current + 0.1);
            });

            toggleStartBtn.addEventListener('click', () => {
                if (isTimerActive) {
                    pauseTimer();
                } else {
                    startTimer();
                }
            });

            resetBtn.addEventListener('click', () => {
                pauseTimer();
                const m = parseInt(minInput.value) || 0;
                const s = parseInt(secInput.value) || 0;
                countdownValueSeconds = (m * 60) + s;
                updateTimerDisplays();
                transmitStatePacketToRemoteClients();
            });

            visCheck.addEventListener('change', () => {
                previewState.timerVisible = visCheck.checked;
                updateTimerDisplays();
                transmitStatePacketToRemoteClients();
            });

            soloCheck.addEventListener('change', () => {
                previewState.timerSolo = soloCheck.checked;
                renderPreview();
                transmitStatePacketToRemoteClients();
            });

            posSelector.addEventListener('change', () => {
                previewState.timerPosition = posSelector.value;
                updateTimerDisplays();
                transmitStatePacketToRemoteClients();
            });

            sizeSelector.addEventListener('change', () => {
                previewState.timerSize = sizeSelector.value;
                updateTimerDisplays();
                transmitStatePacketToRemoteClients();
            });

            // Initial Display Sync
            const m = parseInt(minInput.value) || 0;
            const s = parseInt(secInput.value) || 0;
            countdownValueSeconds = (m * 60) + s;
            updateTimerDisplays();
        }

        function startTimer() {
            const toggleStartBtn = document.getElementById('timerToggleStartBtn');
            isTimerActive = true;
            toggleStartBtn.innerText = "Pause";
            toggleStartBtn.style.backgroundColor = "var(--accent-live)";
            toggleStartBtn.style.borderColor = "#b91c1c";

            countdownTimerInterval = setInterval(() => {
                if (countdownValueSeconds > 0) {
                    countdownValueSeconds--;
                    updateTimerDisplays();
                    transmitStatePacketToRemoteClients();
                } else {
                    pauseTimer();
                }
            }, 1000);
        }

        function pauseTimer() {
            const toggleStartBtn = document.getElementById('timerToggleStartBtn');
            isTimerActive = false;
            clearInterval(countdownTimerInterval);
            toggleStartBtn.innerText = "Start";
            toggleStartBtn.style.backgroundColor = "#0284c7";
            toggleStartBtn.style.borderColor = "#0369a1";
        }

        function updateTimerDisplays() {
            const mins = Math.floor(countdownValueSeconds / 60);
            const secs = countdownValueSeconds % 60;
            const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            previewState.timerText = formattedTime;
            if (liveState.timerVisible) {
                liveState.timerText = formattedTime;
            }

            // Target Staged Preview DOM Overlays
            const previewOverlay = document.getElementById('previewTimerOverlay') || document.querySelector('#previewCanvas .canvas-timer-node');
            if (previewOverlay) {
                previewOverlay.className = `canvas-timer-node ${previewState.timerPosition} ${previewState.timerSize} ${previewState.timerVisible ? 'timer-visible' : ''}`;
                previewOverlay.innerText = formattedTime;
                
                // Dynamic Sizing Transforms
                const originStr = previewState.timerPosition === 'timer-center' ? 'center' : (previewState.timerPosition.includes('left') ? 'left' : 'right');
                previewOverlay.style.transformOrigin = originStr;
                previewOverlay.style.transform = `${previewState.timerPosition === 'timer-center' ? 'translate(-50%, -50%)' : ''} scale(${previewState.timerScale || 1.0})`;
            }

            // Target Broadcast Live DOM Overlays
            const liveOverlay = document.getElementById('liveTimerOverlay') || document.querySelector('#liveCanvas .canvas-timer-node');
            if (liveOverlay) {
                liveOverlay.className = `canvas-timer-node ${liveState.timerPosition} ${liveState.timerSize} ${liveState.timerVisible ? 'timer-visible' : ''}`;
                liveOverlay.innerText = formattedTime;
                
                const originStr = liveState.timerPosition === 'timer-center' ? 'center' : (liveState.timerPosition.includes('left') ? 'left' : 'right');
                liveOverlay.style.transformOrigin = originStr;
                liveOverlay.style.transform = `${liveState.timerPosition === 'timer-center' ? 'translate(-50%, -50%)' : ''} scale(${liveState.timerScale || 1.0})`;
            }

            // Target local OBS / projector screens directly
            if (obsWindowRef && !obsWindowRef.closed) {
                const projectorOverlay = obsWindowRef.document.getElementById('projectorCanvasOverlayTimer') || obsWindowRef.document.querySelector('.canvas-timer-node');
                if (projectorOverlay) {
                    projectorOverlay.className = `canvas-timer-node ${liveState.timerPosition} ${liveState.timerSize} ${liveState.timerVisible ? 'timer-visible' : ''}`;
                    projectorOverlay.innerText = formattedTime;
                    
                    const originStr = liveState.timerPosition === 'timer-center' ? 'center' : (liveState.timerPosition.includes('left') ? 'left' : 'right');
                    projectorOverlay.style.transformOrigin = originStr;
                    projectorOverlay.style.transform = `${liveState.timerPosition === 'timer-center' ? 'translate(-50%, -50%)' : ''} scale(${liveState.timerScale || 1.0})`;
                }
            }
        }

        // LOGO MICRO-SIZING ADJUSTMENT ENGINE
        function initLogoSizerEngine() {
            const slider = document.getElementById('logoSizeSlider');
            const valueSpan = document.getElementById('logoSizeValue');
            const decBtn = document.getElementById('logoSizeDecBtn');
            const incBtn = document.getElementById('logoSizeIncBtn');

            function applySize(newSize) {
                newSize = Math.max(2, Math.min(30, newSize));
                slider.value = newSize;
                valueSpan.innerText = `${newSize}%`;
                previewState.logoSize = newSize;
                liveState.logoSize = newSize;

                // Resize only the logo image itself, directly, everywhere it currently exists —
                // this never touches or rebuilds the rest of the live scene, so nothing blinks.
                document.querySelectorAll('#previewCanvas .canvas-logo-node, #liveCanvas .canvas-logo-node, #obsCanvas .canvas-logo-node').forEach(logoEl => {
                    logoEl.style.width = `${newSize}%`;
                    logoEl.style.height = `${newSize * 1.5}%`;
                });
                if (obsWindowRef && !obsWindowRef.closed) {
                    const projectorLogo = obsWindowRef.document.querySelector('.canvas-logo-node');
                    if (projectorLogo) {
                        projectorLogo.style.width = `${newSize}%`;
                        projectorLogo.style.height = `${newSize * 1.5}%`;
                    }
                }

                transmitStatePacketToRemoteClients();
            }

            slider.addEventListener('input', () => {
                applySize(parseInt(slider.value));
            });

            decBtn.addEventListener('click', () => {
                applySize(parseInt(slider.value) - 1);
            });

            incBtn.addEventListener('click', () => {
                applySize(parseInt(slider.value) + 1);
            });
        }

        // Maps an exact API translation code to the short label shown on the display (e.g. NIV2011 -> "NIV")
        function getVersionDisplayLabel(code) {
            const labels = { NIV2011: 'NIV' };
            return labels[code] || code;
        }

        async function fetchCurrentChapterFromAPI() {
            const targetVersion = document.getElementById('versionSelector').value;
            const dot = document.getElementById('statusDot');
            const statusText = document.getElementById('statusText');
            
            dot.className = "status-dot loading";
            statusText.innerText = "Syncing Cloud...";
            document.getElementById('panelNavHeader').innerText = `Verse Directory: Loading...`;

            try {
                const response = await fetch(`https://bolls.life/get-text/${targetVersion}/${currentBookCode}/${currentChapter}/`);
                if (!response.ok) throw new Error("Cloud database failure");
                
                let data = await response.json();
                if (data && data.length > 0) {
                    activeChapterVerses = data.map(v => {
                        let parsedText = v.text;
                        if (targetVersion === "KJV" || parsedText.match(/\d{3,}/)) {
                            parsedText = parsedText.replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
                        }
                        return { ...v, text: parsedText };
                    });

                    renderVerseNavigationPanel();
                    transmitStatePacketToRemoteClients();
                    selectSpecificVerseCoordinate(currentVerse);
                    dot.className = "status-dot active";
                    statusText.innerText = "System Connected";
                } else {
                    throw new Error("No data returned");
                }
            } catch (error) {
                console.warn("Primary API timeout, engaging backup translation...", error);
                try {
                    const fallbackData = await fetchFallbackBibleApi(currentBookName, currentChapter);
                    activeChapterVerses = fallbackData;
                    renderVerseNavigationPanel();
                    transmitStatePacketToRemoteClients();
                    selectSpecificVerseCoordinate(currentVerse);
                    dot.className = "status-dot active";
                    statusText.innerText = "Connected (Backup)";
                } catch (fallbackError) {
                    console.error("Critical API Failure:", fallbackError);
                    displayPanelFallbackNotice("Offline database. Verify active networks.");
                }
            }
        }

        async function fetchFallbackBibleApi(bookName, chapter) {
            const sanitizedBook = bookName.toLowerCase().replace(/\s+/g, '+');
            const response = await fetch(`https://bible-api.com/${sanitizedBook}+${chapter}`);
            if (!response.ok) throw new Error("Fallback API offline");
            const data = await response.json();
            
            return data.verses.map(v => ({
                verse: v.verse,
                text: v.text.trim()
            }));
        }

        function renderVerseNavigationPanel() {
            document.getElementById('panelNavHeader').innerText = `Verse Directory: ${currentBookName} ${currentChapter}`;
            const deck = document.getElementById('verseGridDeck');
            deck.innerHTML = "";

            activeChapterVerses.forEach((vObj) => {
                const row = document.createElement('div');
                row.className = `verse-row ${vObj.verse === currentVerse ? 'active' : ''}`;
                row.id = `vRow-${vObj.verse}`;
                row.innerHTML = `<span class="verse-num-badge">Verse ${vObj.verse}</span><div class="verse-preview-text">${vObj.text}</div>`;
                
                row.addEventListener('click', () => { 
                    selectSpecificVerseCoordinate(vObj.verse); 
                });

                row.addEventListener('dblclick', () => {
                    selectSpecificVerseCoordinate(vObj.verse); 
                    sendStagedToLiveView();
                });

                deck.appendChild(row);
            });
        }

        function selectSpecificVerseCoordinate(verseNum) {
            currentVerse = verseNum;
            const foundVerse = activeChapterVerses.find(v => v.verse === verseNum) || activeChapterVerses[0];
            if (!foundVerse) return;

            const rows = document.getElementById('verseGridDeck').querySelectorAll('.verse-row');
            rows.forEach(r => r.classList.remove('active'));
            const activeRow = document.getElementById(`vRow-${foundVerse.verse}`);
            if (activeRow) { activeRow.classList.add('active'); activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }

            previewState.text = foundVerse.text;
            previewState.ref = `${currentBookName} ${currentChapter}:${foundVerse.verse} (${getVersionDisplayLabel(document.getElementById('versionSelector').value)})`;
            previewState.isScrolling = false; 

            renderPreview();
            transmitStatePacketToRemoteClients();
        }

        function navigateSequentialOffsetVerses(direction) {
            let targetIdx = activeChapterVerses.findIndex(v => v.verse === currentVerse);
            if (targetIdx === -1) return;
            targetIdx += direction;
            if (targetIdx >= 0 && targetIdx < activeChapterVerses.length) {
                selectSpecificVerseCoordinate(activeChapterVerses[targetIdx].verse);
            }
        }

        // Moves to the next/previous generated song slide and sends it straight to Live
        function navigateSongSlide(direction) {
            const rows = Array.from(document.querySelectorAll('#lyricsSlidesDeck .verse-row'));
            if (!rows.length) return;
            let currentIdx = rows.findIndex(r => r.classList.contains('active'));
            let targetIdx = currentIdx === -1 ? 0 : currentIdx + direction;
            if (targetIdx < 0) targetIdx = 0;
            if (targetIdx >= rows.length) targetIdx = rows.length - 1;
            rows[targetIdx].click();
            sendStagedToLiveView();
        }

        // Converts a #rrggbb hex color into an rgba() string at the given opacity (0-100)
        function hexToRgbaWithOpacity(hex, opacityPct) {
            if (!hex || typeof hex !== 'string' || hex[0] !== '#') return hex;
            const alpha = Math.max(0, Math.min(100, opacityPct == null ? 100 : opacityPct)) / 100;
            const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        // Responsive font scaling: shrinks/grows the text size based on how much text is on the slide
        function computeAutoFontScale(text) {
            const len = (text || '').length;
            if (len <= 40) return 1.15;
            if (len <= 80) return 1.0;
            if (len <= 130) return 0.85;
            if (len <= 190) return 0.72;
            if (len <= 260) return 0.6;
            if (len <= 340) return 0.5;
            if (len <= 430) return 0.42;
            return 0.36;
        }

        // Shrinks the verse text just enough that it always fully fits inside its frame,
        // no matter which size preset is chosen or how long the verse is — never cut off.
        function autoFitVerseText(canvasElement) {
            const textOutEl = canvasElement.querySelector('.text-out');
            if (!textOutEl) return;
            const canvasHeight = canvasElement.clientHeight;
            if (!canvasHeight) return; // not laid out / not visible yet — nothing to measure
            const refOutEl = canvasElement.querySelector('.ref-out');
            const refReserved = (refOutEl && refOutEl.offsetHeight) ? refOutEl.offsetHeight : 0;
            const maxAllowedHeight = (canvasHeight - refReserved) * 0.86;

            const ownerWindow = (canvasElement.ownerDocument && canvasElement.ownerDocument.defaultView) || window;
            let currentSizePx = parseFloat(ownerWindow.getComputedStyle(textOutEl).fontSize);
            let guard = 0;
            while (textOutEl.scrollHeight > maxAllowedHeight && currentSizePx > 8 && guard < 60) {
                currentSizePx -= Math.max(1, currentSizePx * 0.05);
                textOutEl.style.fontSize = currentSizePx + 'px';
                guard++;
            }
        }

        function buildCanvasDOM(canvasElement, stateObject, assetLibraryContext = importedAssetsLibrary, logoBlobContext = cachedLogoDataUrl, withTransition = false) {
            // Capture any existing background video BEFORE anything rebuilds this canvas's DOM,
            // so playback (position, paused/playing state) survives unrelated text/style changes
            // instead of restarting from 0 every time.
            const existingVideoEl = canvasElement.querySelector('.canvas-video-bg-node');

            canvasElement.className = `display-canvas ${stateObject.layout} size-${stateObject.fontSize}`;
            const transitionClass = withTransition ? getDisplayTransitionClass() : '';
            canvasElement.style.transition = transitionClass ? 'background-color 0.5s ease' : 'none';

            const bgOpacity = stateObject.bgOpacity == null ? 100 : stateObject.bgOpacity;

            canvasElement.style.backgroundImage = 'none';
            canvasElement.style.backgroundColor = stateObject.bgTransparent ? 'transparent' : hexToRgbaWithOpacity(stateObject.bgColor, bgOpacity);

            let contentNode = stateObject.text || '';
            if (stateObject.isScrolling && stateObject.text) {
                contentNode = `<div class="ticker-wrapper"><div class="ticker-text">${contentNode}</div></div>`;
            }

            const boxBgStyleString = stateObject.textBgUrl ? `background-image: url('${stateObject.textBgUrl}');` : '';
            const customFontFamily = document.getElementById('fontStyleOverrideSelector').value;
            const customShadow = document.getElementById('textShadowSelector').value;
            const isTextBold = document.getElementById('fontBoldToggleBtn').classList.contains('toggle-active');
            const isTextItalic = document.getElementById('fontItalicToggleBtn').classList.contains('toggle-active');
            const customFontWeight = isTextBold ? '900' : '400';
            const customFontStyle = isTextItalic ? 'italic' : 'normal';

            // Apply custom styling modifications
            canvasElement.style.fontFamily = customFontFamily;

            // Timer Solo Configuration: If timer is visible and in solo-mode, do not render text
            const textHiddenClass = (stateObject.timerVisible && stateObject.timerSolo) ? 'display: none !important;' : '';

            // Handle Flier Only Layout logic completely
            const flierOnlyTextHide = stateObject.layout === 'mode-flieronly' ? 'display: none !important;' : '';

            // Video-alone mode: when a video background is enabled and overlay is turned off,
            // hide text/reference/name-tag so the video plays without anything on top of it
            const isVideoAloneMode = stateObject.videoBgEnabled && stateObject.videoBgUrl && stateObject.videoOverlayMode === false;
            const videoAloneHide = isVideoAloneMode ? 'display: none !important;' : '';

            // Responsive font scaling — bigger/smaller automatically based on how much text is on the slide
            // Auto-resizing disabled per request — text now stays at the selected size and wraps to fit instead
            const autoFontScale = 1;

            // Gradient + glow text style
            const gradientGlowClass = stateObject.gradientGlowText ? 'gradient-glow-active' : '';
            const dynamicColorVar = `--dynamic-text-color: ${stateObject.textColor || '#38bdf8'};`;

            // Text backing panel (readability box behind text over busy backgrounds)
            const backingPanelClass = stateObject.textBackingPanel ? 'backing-panel-active' : '';

            // Lower third name tag (e.g. "Ministering: Pastor Ade")
            const nameBarVisible = stateObject.lowerThirdVisible && (stateObject.lowerThirdName || stateObject.lowerThirdRole);
            const nameBarHtml = `
                <div class="canvas-namebar-node ${nameBarVisible ? 'namebar-visible' : ''}" style="${videoAloneHide}">
                    <div class="namebar-role">${stateObject.lowerThirdRole || ''}</div>
                    <div class="namebar-name" style="color: ${stateObject.lowerThirdColor || '#ffffff'};">${stateObject.lowerThirdName || ''}</div>
                </div>
            `;

            // Announcement banner — editable, toggleable, shown UNDER the main text (never replaces it)
            const announcementActive = stateObject.announcementVisible && stateObject.announcementText;
            const announcementInner = stateObject.announcementScrolling
                ? `<div class="ticker-wrapper"><div class="ticker-text">${stateObject.announcementText || ''}</div></div>`
                : (stateObject.announcementText || '');
            const announcementHtml = `
                <div class="canvas-announcement-banner ${announcementActive ? 'announcement-visible' : ''}" style="${videoAloneHide}">${announcementInner}</div>
            `;

            canvasElement.innerHTML = `
                <div class="text-display-box-container ${transitionClass} ${backingPanelClass}" style="${boxBgStyleString} ${textHiddenClass} ${flierOnlyTextHide} ${videoAloneHide}">
                    <div class="text-out ${gradientGlowClass}" style="width:100%; ${dynamicColorVar} color: ${stateObject.textColor || '#ffffff'}; text-shadow: ${customShadow}; font-size: calc(var(--canvas-font-size) * ${autoFontScale}); font-family: ${customFontFamily}; font-weight: ${customFontWeight}; font-style: ${customFontStyle};">${contentNode}</div>
                </div>
                <div class="ref-out ${transitionClass}" style="${textHiddenClass} ${flierOnlyTextHide} ${videoAloneHide} text-shadow: ${customShadow}; font-family: ${customFontFamily}; ${stateObject.refColor ? `color: ${stateObject.refColor};` : ''}">${stateObject.ref || ''}</div>
                <div class="canvas-timer-node ${stateObject.timerPosition || 'timer-top-right'} ${stateObject.timerSize || 'timer-size-medium'} ${stateObject.timerVisible ? 'timer-visible' : ''}" id="${canvasElement.id}OverlayTimer">${stateObject.timerText || '00:00'}</div>
                ${nameBarHtml}
                ${announcementHtml}
            `;

            // Text stays at the selected size and wraps; this only steps in if wrapped text would actually overflow the frame
            autoFitVerseText(canvasElement);
            const innerTimer = canvasElement.querySelector('.canvas-timer-node');
            if (innerTimer) {
                const originStr = stateObject.timerPosition === 'timer-center' ? 'center' : (stateObject.timerPosition.includes('left') ? 'left' : 'right');
                innerTimer.style.transformOrigin = originStr;
                innerTimer.style.transform = `${stateObject.timerPosition === 'timer-center' ? 'translate(-50%, -50%)' : ''} scale(${stateObject.timerScale || 1.0})`;
            }

            // Video background takes precedence over a static flier image when enabled
            if (stateObject.videoBgEnabled && stateObject.videoBgUrl) {
                if (existingVideoEl && existingVideoEl.dataset.videoSrc === stateObject.videoBgUrl) {
                    // SAME video already playing — reuse the exact element so playback position,
                    // paused/playing state, and buffering are never disturbed by unrelated changes.
                    existingVideoEl.className = `canvas-video-bg-node ${transitionClass}`;
                    existingVideoEl.style.opacity = bgOpacity / 100;
                    existingVideoEl.muted = stateObject.videoOverlayMode !== false;
                    canvasElement.insertBefore(existingVideoEl, canvasElement.firstChild);
                } else {
                    // Different (or first-time) video — create fresh
                    const videoBg = document.createElement('video');
                    videoBg.className = `canvas-video-bg-node ${transitionClass}`;
                    videoBg.dataset.videoSrc = stateObject.videoBgUrl;
                    videoBg.src = stateObject.videoBgUrl;
                    videoBg.autoplay = true; videoBg.loop = true; videoBg.playsInline = true; videoBg.muted = stateObject.videoOverlayMode !== false;
                    videoBg.style.opacity = bgOpacity / 100;
                    if (transitionClass) videoBg.addEventListener('animationend', () => { videoBg.style.opacity = bgOpacity / 100; }, { once: true });
                    canvasElement.insertBefore(videoBg, canvasElement.firstChild);
                    const playPromise = videoBg.play();
                    if (playPromise && playPromise.catch) playPromise.catch(() => {});
                }
            } else if (stateObject.flierId) {
                const targetAsset = assetLibraryContext.find(a => a.id === stateObject.flierId);
                if (targetAsset) {
                    const flierLayer = document.createElement('div');
                    flierLayer.className = `flier-graphic-layer ${transitionClass}`;
                    flierLayer.style.backgroundImage = `url('${targetAsset.dataUrl}')`;
                    flierLayer.style.opacity = bgOpacity / 100;
                    if (transitionClass) flierLayer.addEventListener('animationend', () => { flierLayer.style.opacity = bgOpacity / 100; }, { once: true });
                    canvasElement.appendChild(flierLayer);
                }
            } else if (stateObject.layout === 'mode-flieronly') {
                // If Flier Only Layout is chosen but no flier image is uploaded, display a helpful preview text
                const placeholderLayer = document.createElement('div');
                placeholderLayer.className = `flier-graphic-layer ${transitionClass}`;
                placeholderLayer.innerHTML = `<div class="placeholder-text">[ Flier Only Mode - No Image Selected ]</div>`;
                canvasElement.appendChild(placeholderLayer);
            }

            if (logoBlobContext && stateObject.logoPosition) {
                const logoImg = document.createElement('img');
                const logoSizeValue = stateObject.logoSize || 6;
                logoImg.src = logoBlobContext; 
                logoImg.className = `canvas-logo-node ${stateObject.logoPosition}`;
                logoImg.style.width = `${logoSizeValue}%`;
                logoImg.style.height = `${logoSizeValue * 1.5}%`;
                canvasElement.appendChild(logoImg);
            }
        }

        function renderPreview() {
            const previewCanvas = document.getElementById('previewCanvas');
            if (!previewState.text && !previewState.flierId && !previewState.textBgUrl) {
                previewCanvas.innerHTML = `
                    <div class="placeholder-text">Awaiting Selection...</div>
                    <div class="canvas-timer-node" id="previewTimerOverlay">00:00</div>
                `;
                updateTimerDisplays();
                return;
            }
            buildCanvasDOM(previewCanvas, previewState);
        }

        function renderLive() {
            const liveCanvas = document.getElementById('liveCanvas');
            if (!liveState.text && !liveState.flierId && !liveState.textBgUrl) {
                liveCanvas.innerHTML = `
                    <div class="placeholder-text">Canvas Screen Clear</div>
                    <div class="canvas-timer-node" id="liveTimerOverlay">00:00</div>
                `;
                updateTimerDisplays();
                updateObsProjectorDOM(); 
                return;
            }
            buildCanvasDOM(liveCanvas, liveState, importedAssetsLibrary, cachedLogoDataUrl, true);
            updateTimerDisplays();
            updateObsProjectorDOM(); 
        }

        function sendStagedToLiveView() {
            if (isLiveFrozen) return; // FROZEN: Live output is locked, ignore Send Live until unfrozen
            if (!previewState.text && !previewState.flierId && !previewState.textBgUrl && !previewState.timerVisible) return;

            // If a background video is currently playing on Preview, carry its exact playback
            // position over to Live so it continues in sync instead of restarting from 0.
            const previewVideoEl = document.querySelector('#previewCanvas .canvas-video-bg-node');
            const liveVideoElBefore = document.querySelector('#liveCanvas .canvas-video-bg-node');
            const isSameVideoAlreadyLive = previewVideoEl && liveVideoElBefore &&
                liveVideoElBefore.dataset.videoSrc === previewState.videoBgUrl;
            const pendingVideoSyncTime = (previewVideoEl && !isSameVideoAlreadyLive) ? previewVideoEl.currentTime : null;

            liveState = { ...previewState };
            pushItemToHistoryDropdownLog(liveState);
            renderLive();

            if (pendingVideoSyncTime != null) {
                const liveVideoEl = document.querySelector('#liveCanvas .canvas-video-bg-node');
                if (liveVideoEl) {
                    const applySync = () => { try { liveVideoEl.currentTime = pendingVideoSyncTime; } catch (e) {} };
                    if (liveVideoEl.readyState >= 1) applySync();
                    else liveVideoEl.addEventListener('loadedmetadata', applySync, { once: true });
                }
            }

            transmitStatePacketToRemoteClients();
        }

        function initSpeechEngine() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                document.getElementById('transcriptTrack').innerText = "Web Speech API is not natively supported in this browser instance.";
                return;
            }

            recognition = new SpeechRecognition();
            recognition.continuous = true; 
            recognition.interimResults = true; 
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                isListening = true; 
                const btn = document.getElementById('listeningBtn');
                btn.innerText = "Disable Live Voice"; 
                btn.classList.add('listening');
                document.getElementById('statusDot').className = "status-dot active"; 
                document.getElementById('statusText').innerText = "Monitoring Audio Device...";
                runAudioContextVolumeDetection(); 
            };

            recognition.onend = () => { 
                if (isListening) {
                    // Small delay before restarting avoids a tight restart loop that can
                    // repeatedly re-trigger the browser's microphone access indicator.
                    setTimeout(() => {
                        if (isListening) {
                            try { recognition.start(); } catch(e) {}
                        }
                    }, 350);
                } else {
                    disableAudioVolumeDetection();
                }
            };

            recognition.onerror = (event) => {
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    // Permission was actually denied — stop trying instead of looping and re-prompting.
                    isListening = false;
                    const btn = document.getElementById('listeningBtn');
                    btn.innerText = "Enable Live Voice";
                    btn.classList.remove('listening');
                    document.getElementById('statusDot').className = "status-dot";
                    document.getElementById('statusText').innerText = "Microphone access denied.";
                    document.getElementById('transcriptTrack').innerText = "Microphone access was denied. Please allow it once, then click Enable Live Voice again.";
                    disableAudioVolumeDetection();
                }
                // 'no-speech' / 'aborted' / 'network' are transient — onend will already handle a clean, debounced restart.
            };

            recognition.onresult = (event) => {
                let interimTranscriptText = ''; 
                let finalTranscriptText = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscriptText += event.results[i][0].transcript;
                    } else {
                        interimTranscriptText += event.results[i][0].transcript;
                    }
                }

                document.getElementById('transcriptTrack').innerHTML = `<span class="active-words">${finalTranscriptText}</span> <span style="opacity:0.4">${interimTranscriptText}</span>`;
                let speechStreamInput = (finalTranscriptText + " " + interimTranscriptText).trim();
                
                if (speechStreamInput) {
                    processContinuousSpeechForScriptures(speechStreamInput);
                }
            };
        }

        function processContinuousSpeechForScriptures(speechText) {
            let normalizedInputStr = speechText.toLowerCase()
                .replace(/\bchapter\b/g, ' ')
                .replace(/\bverse\b/g, ' ')
                .replace(/\bcolons?\b/g, ' ')
                .replace(/\bto\b/g, ' ')
                .replace(/\band\b/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            const wordToNumberDictionary = {
                "first": "1", "second": "2", "third": "3", "fourth": "4", "fifth": "5",
                "1st": "1", "2nd": "2", "3rd": "3",
                "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
                "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10"
            };

            Object.keys(wordToNumberDictionary).forEach(word => {
                normalizedInputStr = normalizedInputStr.replace(new RegExp(`\\b${word}\\b`, 'g'), wordToNumberDictionary[word]);
            });

            const contextMarkers = ["open the bible to", "open to", "turn with me to", "read", "book of", "look at"];
            contextMarkers.forEach(marker => {
                if (normalizedInputStr.includes(marker)) {
                    normalizedInputStr = normalizedInputStr.substring(normalizedInputStr.indexOf(marker) + marker.length).trim();
                }
            });

            const parsingPatternQuery = /(?:(?:(\d)\s*)?([a-zA-Z]+))\s*(\d+)(?:\s*[:\s]\s*(\d+))?/;
            const patternMatchResult = normalizedInputStr.match(parsingPatternQuery);

            if (patternMatchResult) {
                let leadingBookNumber = patternMatchResult[1] ? patternMatchResult[1].trim() : "";
                let spokenBookLetters = patternMatchResult[2].trim();
                let chapterNumber = parseInt(patternMatchResult[3]);
                let verseNumber = patternMatchResult[4] ? parseInt(patternMatchResult[4]) : 1;

                let reconstructedBookStr = (leadingBookNumber ? leadingBookNumber + " " : "") + spokenBookLetters;
                let resolvedSystemBollsId = null;
                let resolvedSystemBookName = null;

                for (let [fullName, id] of Object.entries(bookBollsIdMap)) {
                    let code = bookAbbrevMap[fullName] || "";
                    if (fullName === reconstructedBookStr || fullName.startsWith(reconstructedBookStr) || code.toLowerCase() === reconstructedBookStr) {
                        resolvedSystemBollsId = id;
                        resolvedSystemBookName = fullName.charAt(0).toUpperCase() + fullName.slice(1);
                        break;
                    }
                }

                if (resolvedSystemBollsId) {
                    let calculatedReferenceKey = `${resolvedSystemBollsId} ${chapterNumber}:${verseNumber}`;
                    
                    if (calculatedReferenceKey !== lastAutoMatchedRef) {
                        lastAutoMatchedRef = calculatedReferenceKey;

                        const isNewChapterRequired = (resolvedSystemBollsId !== currentBookCode || chapterNumber !== currentChapter);
                        currentBookCode = resolvedSystemBollsId;
                        currentBookName = resolvedSystemBookName;
                        currentChapter = chapterNumber;
                        currentVerse = verseNumber;

                        if (isNewChapterRequired) {
                            fetchCurrentChapterFromAPI();
                        } else {
                            selectSpecificVerseCoordinate(currentVerse);
                        }
                    }
                }
            }
        }

        async function parseAndRouteInput(rawText, forceFetch = false) {
            if (!rawText.trim()) return;
            let clean = rawText.toLowerCase().trim();
            const wordsToNums = { "one":"1","two":"2","three":"3","four":"4","five":"5","six":"6","seven":"7","eight":"8","nine":"9","ten":"10" };
            Object.keys(wordsToNums).forEach(k => clean = clean.replace(new RegExp(`\\b${k}\\b`, 'g'), wordsToNums[k]));

            const universalPattern = /([1-3]?\s*[a-zA-Z]+)\s*(\d+)[\s:]*(\d+)?/;
            const match = clean.match(universalPattern);

            if (match) {
                let textInput = match[1].replace(/\s+/g, ' ').trim();
                let chapterInput = parseInt(match[2]);
                let verseInput = match[3] ? parseInt(match[3]) : 1;
                
                let resolvedBollsId = null;
                let resolvedName = null;

                for (let [fullName, id] of Object.entries(bookBollsIdMap)) {
                    let code = bookAbbrevMap[fullName] || "";
                    if (fullName === textInput || fullName.startsWith(textInput) || code.toLowerCase() === textInput) {
                        resolvedBollsId = id;
                        resolvedName = fullName.charAt(0).toUpperCase() + fullName.slice(1);
                        break;
                    }
                }

                if (resolvedBollsId) {
                    const alteredChapter = (resolvedBollsId !== currentBookCode || chapterInput !== currentChapter);
                    currentBookCode = resolvedBollsId; currentBookName = resolvedName; currentChapter = chapterInput; currentVerse = verseInput;
                    if (alteredChapter || forceFetch) { 
                        await fetchCurrentChapterFromAPI(); 
                    } else { 
                        selectSpecificVerseCoordinate(currentVerse); 
                    }
                }
            }
        }

        function setupStudioEventBindings() {
            listeningBtn.addEventListener('click', toggleListening);
            sendLiveBtn.addEventListener('click', sendStagedToLiveView);
            document.getElementById('freezeLiveBtn').addEventListener('click', () => {
                isLiveFrozen = !isLiveFrozen;
                const btn = document.getElementById('freezeLiveBtn');
                btn.classList.toggle('toggle-active', isLiveFrozen);
                btn.innerHTML = isLiveFrozen ? '🔒 Live Frozen (click to unfreeze)' : '❄ Freeze Live';
                document.body.classList.toggle('live-is-frozen', isLiveFrozen);
            });
            openObsBtn.addEventListener('click', spawnObsProjectorWindow);
            manualSearchInput.addEventListener('input', () => { parseAndRouteInput(manualSearchInput.value, false); });
            versionSelector.addEventListener('change', () => { fetchCurrentChapterFromAPI(); });
            layoutSelector.addEventListener('change', () => { previewState.layout = layoutSelector.value; renderPreview(); });

            document.getElementById('fontSizeInput').addEventListener('change', () => {
                previewState.fontSize = document.getElementById('fontSizeInput').value;
                renderPreview();
            });

            document.getElementById('bgColorPicker').addEventListener('input', () => { previewState.bgColor = document.getElementById('bgColorPicker').value; renderPreview(); });
            document.getElementById('bgTransparentCheckbox').addEventListener('change', (e) => { previewState.bgTransparent = e.target.checked; renderPreview(); });
            document.getElementById('textColorPicker').addEventListener('input', () => { previewState.textColor = document.getElementById('textColorPicker').value; renderPreview(); });
            document.getElementById('refColorPicker').addEventListener('input', () => { previewState.refColor = document.getElementById('refColorPicker').value; renderPreview(); });
            
            document.getElementById('masterImagePicker').addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const targetAssignment = document.getElementById('imageAssetAssignmentSelector').value;
                        const assetObj = {
                            id: 'img_' + Date.now(),
                            name: `[${targetAssignment === "textBgContainer" ? "BOX BG" : "FLIER"}] ${file.name}`,
                            type: targetAssignment,
                            dataUrl: event.target.result
                        };
                        importedAssetsLibrary.push(assetObj);
                        repopulateAssetDropdownUI();
                        document.getElementById('assetLibraryDropdown').value = assetObj.id;
                        applySelectedDropdownAssetToPreviewState(assetObj.id);
                    };
                    reader.readAsDataURL(file);
                }
            });

            document.getElementById('assetLibraryDropdown').addEventListener('change', () => {
                applySelectedDropdownAssetToPreviewState(document.getElementById('assetLibraryDropdown').value);
            });

            document.getElementById('deleteAssetBtn').addEventListener('click', () => {
                const dd = document.getElementById('assetLibraryDropdown');
                const assetId = dd.value;
                if (!assetId) return;
                const asset = importedAssetsLibrary.find(a => a.id === assetId);
                if (!asset) return;
                if (!confirm(`Delete "${asset.name}" from your uploaded backgrounds? This cannot be undone.`)) return;
                importedAssetsLibrary = importedAssetsLibrary.filter(a => a.id !== assetId);
                if (previewState.flierId === assetId) previewState.flierId = "";
                if (previewState.textBgUrl === asset.dataUrl) previewState.textBgUrl = "";
                repopulateAssetDropdownUI();
                dd.value = "";
                renderPreview();
            });

            document.getElementById('stageAnnouncementBtn').addEventListener('click', () => {
                const txt = document.getElementById('announcementInput').value.trim();
                if (!txt) return;
                previewState.announcementText = txt;
                previewState.announcementVisible = true;
                previewState.announcementScrolling = document.getElementById('announcementScrollToggle').checked;
                document.getElementById('announcementEyeToggleBtn').classList.add('toggle-active');
                renderPreview();
            });

            document.getElementById('announcementEyeToggleBtn').addEventListener('click', () => {
                previewState.announcementVisible = !previewState.announcementVisible;
                document.getElementById('announcementEyeToggleBtn').classList.toggle('toggle-active', previewState.announcementVisible);
                renderPreview();
            });

            document.getElementById('clearAnnouncementBtn').addEventListener('click', () => {
                document.getElementById('announcementInput').value = "";
                previewState.announcementText = "";
                previewState.announcementVisible = false;
                previewState.announcementScrolling = false;
                document.getElementById('announcementEyeToggleBtn').classList.remove('toggle-active');
                renderPreview();
            });

            document.getElementById('historyDropdown').addEventListener('change', () => {
                const idx = document.getElementById('historyDropdown').value;
                if(idx === "") return;
                const match = executionDisplayHistory[idx];
                if(match) {
                    previewState = { ...match };
                    document.getElementById('layoutSelector').value = previewState.layout;
                    document.getElementById('fontSizeInput').value = previewState.fontSize;
                    document.getElementById('bgColorPicker').value = previewState.bgColor;
                    document.getElementById('textColorPicker').value = previewState.textColor || '#ffffff';
                    document.getElementById('assetLibraryDropdown').value = previewState.flierId ? previewState.flierId : "";
                    renderPreview();
                }
            });

            document.getElementById('logoImagePicker').addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        cachedLogoDataUrl = event.target.result;
                        previewState.logoPosition = document.getElementById('logoPositionSelector').value || "logo-top-right";
                        if(!document.getElementById('logoPositionSelector').value) document.getElementById('logoPositionSelector').value = "logo-top-right";
                        renderPreview(); renderLive();
                    };
                    reader.readAsDataURL(file);
                }
            });

            document.getElementById('logoPositionSelector').addEventListener('change', () => { previewState.logoPosition = document.getElementById('logoPositionSelector').value; renderPreview(); });

            // SETTINGS MODAL INTERACTION TRIGGERS
            document.getElementById('openSettingsModalBtn').addEventListener('click', () => {
                document.getElementById('settingsModal').style.display = 'flex';
            });
            document.getElementById('closeSettingsModalBtn').addEventListener('click', () => {
                document.getElementById('settingsModal').style.display = 'none';
            });

            // RIBBON TABS (Text / Background / Message / Edit) — swaps the visible toolbar panel
            function switchRibbonTab(tabId) {
                document.querySelectorAll('.ribbon-tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.ribbonTab === tabId));
                document.querySelectorAll('.ribbon-panel').forEach(panel => panel.classList.toggle('active', panel.id === tabId));
                // Reflect the current slide's settings whenever their tab becomes visible
                if (tabId === 'ribbon-text') {
                    document.getElementById('textBackingPanelCheckbox').checked = !!previewState.textBackingPanel;
                    document.getElementById('gradientGlowTextCheckbox').checked = !!previewState.gradientGlowText;
                } else if (tabId === 'ribbon-background') {
                    document.getElementById('videoBgEnabledCheckbox').checked = !!previewState.videoBgEnabled;
                    document.getElementById('bgOpacitySlider').value = previewState.bgOpacity == null ? 100 : previewState.bgOpacity;
                    document.getElementById('bgOpacityValue').innerText = `${previewState.bgOpacity == null ? 100 : previewState.bgOpacity}%`;
                } else if (tabId === 'ribbon-message') {
                    document.getElementById('lowerThirdRoleInput').value = previewState.lowerThirdRole || '';
                    document.getElementById('lowerThirdNameInput').value = previewState.lowerThirdName || '';
                    document.getElementById('lowerThirdVisibleCheckbox').checked = !!previewState.lowerThirdVisible;
                }
            }
            document.querySelectorAll('.ribbon-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => switchRibbonTab(btn.dataset.ribbonTab));
            });

            // TEXT STYLE dropdown (Display Transition / Font Style / Bold-Italic / Text Shadow) — under the Text tab
            document.getElementById('textStyleToggleBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('textStyleDropdown').classList.toggle('open');
            });
            document.getElementById('textStyleDropdown').addEventListener('click', (e) => { e.stopPropagation(); });
            document.addEventListener('click', () => {
                document.getElementById('textStyleDropdown').classList.remove('open');
            });

            // Aesthetic selectors inside settings
            document.getElementById('fontStyleOverrideSelector').addEventListener('change', () => {
                renderPreview();
                renderLive();
            });
            document.getElementById('textShadowSelector').addEventListener('change', () => {
                renderPreview();
                renderLive();
            });
            document.getElementById('fontBoldToggleBtn').addEventListener('click', (e) => {
                e.target.classList.toggle('toggle-active');
                renderPreview();
                renderLive();
            });
            document.getElementById('fontItalicToggleBtn').addEventListener('click', (e) => {
                e.target.classList.toggle('toggle-active');
                renderPreview();
                renderLive();
            });

            // Appearance: Interface Theme (UI chrome only — never touches the live/OBS/projector display colors)
            const uiThemeSelectorEl = document.getElementById('uiThemeSelector');
            try {
                uiThemeSelectorEl.value = localStorage.getItem('ebp_ui_theme') === 'light' ? 'light' : 'dark';
            } catch (e) {}
            uiThemeSelectorEl.addEventListener('change', () => {
                applyUiTheme(uiThemeSelectorEl.value);
            });

            // Appearance: Display Transition (applies only to the live/OBS/projector output)
            const displayTransitionSelectorEl = document.getElementById('displayTransitionSelector');
            displayTransitionSelectorEl.value = displayTransitionStyle;
            displayTransitionSelectorEl.addEventListener('change', () => {
                displayTransitionStyle = displayTransitionSelectorEl.value;
                try { localStorage.setItem('ebp_display_transition', displayTransitionStyle); } catch (e) {}
            });

            // Appearance: Chapters/Songs/Word Search panel side (left or right)
            const sidebarPositionSelectorEl = document.getElementById('sidebarPositionSelector');
            try {
                sidebarPositionSelectorEl.value = localStorage.getItem('ebp_sidebar_position') === 'right' ? 'right' : 'left';
            } catch (e) {}
            sidebarPositionSelectorEl.addEventListener('change', () => {
                applySidebarPosition(sidebarPositionSelectorEl.value);
            });

            // Background & Text Effects: Video Background
            // NOTE: saved videos live only in this session's memory (not localStorage) — video files
            // are too large to persist safely in browser storage, so this list resets on page reload.
            let savedVideosLibrary = [];

            function refreshSavedVideosDropdown() {
                const dd = document.getElementById('savedVideosDropdown');
                const currentVal = dd.value;
                dd.innerHTML = '<option value="">-- Saved Videos --</option>';
                savedVideosLibrary.forEach(v => {
                    const opt = document.createElement('option');
                    opt.value = v.id;
                    opt.innerText = v.name;
                    dd.appendChild(opt);
                });
                dd.value = currentVal;
            }

            document.getElementById('videoBgUploadBtn').addEventListener('click', () => {
                document.getElementById('videoBgPicker').click();
            });
            document.getElementById('videoBgPicker').addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const objectUrl = URL.createObjectURL(file);
                const videoEntry = { id: 'video_' + Date.now(), name: file.name, url: objectUrl };
                savedVideosLibrary.push(videoEntry);
                refreshSavedVideosDropdown();
                document.getElementById('savedVideosDropdown').value = videoEntry.id;
                previewState.videoBgUrl = objectUrl;
                previewState.videoBgEnabled = true;
                document.getElementById('videoBgEnabledCheckbox').checked = true;
                document.getElementById('videoBgFileName').innerText = `Loaded: ${file.name} (session-only)`;
                renderPreview();
            });
            document.getElementById('savedVideosDropdown').addEventListener('change', (e) => {
                const id = e.target.value;
                if (!id) return;
                const entry = savedVideosLibrary.find(v => v.id === id);
                if (!entry) return;
                previewState.videoBgUrl = entry.url;
                previewState.videoBgEnabled = true;
                document.getElementById('videoBgEnabledCheckbox').checked = true;
                document.getElementById('videoBgFileName').innerText = `Loaded: ${entry.name} (session-only)`;
                renderPreview();
            });
            document.getElementById('deleteSavedVideoBtn').addEventListener('click', () => {
                const dd = document.getElementById('savedVideosDropdown');
                const id = dd.value;
                if (!id) return;
                const entry = savedVideosLibrary.find(v => v.id === id);
                if (!entry) return;
                if (!confirm(`Remove "${entry.name}" from this session's saved videos?`)) return;
                if (previewState.videoBgUrl === entry.url) {
                    previewState.videoBgUrl = "";
                    previewState.videoBgEnabled = false;
                    document.getElementById('videoBgEnabledCheckbox').checked = false;
                    document.getElementById('videoBgFileName').innerText = "No video selected (session-only).";
                    renderPreview();
                }
                URL.revokeObjectURL(entry.url);
                savedVideosLibrary = savedVideosLibrary.filter(v => v.id !== id);
                refreshSavedVideosDropdown();
            });
            document.getElementById('videoBgEnabledCheckbox').addEventListener('change', (e) => {
                previewState.videoBgEnabled = e.target.checked;
                renderPreview();
            });
            document.getElementById('videoBgClearBtn').addEventListener('click', () => {
                previewState.videoBgUrl = "";
                previewState.videoBgEnabled = false;
                document.getElementById('videoBgEnabledCheckbox').checked = false;
                document.getElementById('videoBgFileName').innerText = "No video selected. Videos are session-only and won't be saved to exports.";
                document.getElementById('videoBgPicker').value = "";
                document.getElementById('savedVideosDropdown').value = "";
                renderPreview();
            });

            // Video overlay mode: overlay (text on top, video muted) vs video-alone (video plays with sound, nothing overlays it)
            document.getElementById('videoOverlayModeCheckbox').addEventListener('change', (e) => {
                previewState.videoOverlayMode = e.target.checked;
                renderPreview();
            });

            // Video transport controls — act on whichever background video is currently rendered on Preview
            function getActivePreviewVideoEl() {
                return document.querySelector('#previewCanvas .canvas-video-bg-node');
            }
            document.getElementById('videoPlayPauseBtn').addEventListener('click', () => {
                const vid = getActivePreviewVideoEl();
                if (!vid) return;
                if (vid.paused) vid.play(); else vid.pause();
            });
            document.getElementById('videoSkipBackBtn').addEventListener('click', () => {
                const vid = getActivePreviewVideoEl();
                if (!vid) return;
                vid.currentTime = Math.max(0, vid.currentTime - 10);
            });
            document.getElementById('videoSkipFwdBtn').addEventListener('click', () => {
                const vid = getActivePreviewVideoEl();
                if (!vid) return;
                vid.currentTime = Math.min(vid.duration || vid.currentTime + 10, vid.currentTime + 10);
            });
            document.getElementById('videoSeekSlider').addEventListener('input', (e) => {
                const vid = getActivePreviewVideoEl();
                if (!vid || !vid.duration) return;
                vid.currentTime = (parseFloat(e.target.value) / 100) * vid.duration;
            });
            // Keep the seek slider in sync with whichever video is currently playing on Preview
            setInterval(() => {
                const vid = getActivePreviewVideoEl();
                const slider = document.getElementById('videoSeekSlider');
                if (vid && vid.duration) {
                    slider.value = (vid.currentTime / vid.duration) * 100;
                }
            }, 500);

            // Background & Text Effects: Opacity
            document.getElementById('bgOpacitySlider').addEventListener('input', (e) => {
                previewState.bgOpacity = parseInt(e.target.value, 10);
                document.getElementById('bgOpacityValue').innerText = `${previewState.bgOpacity}%`;
                renderPreview();
            });

            // Background & Text Effects: Text Backing Panel + Gradient Glow
            document.getElementById('textBackingPanelCheckbox').addEventListener('change', (e) => {
                previewState.textBackingPanel = e.target.checked;
                renderPreview();
            });
            document.getElementById('gradientGlowTextCheckbox').addEventListener('change', (e) => {
                previewState.gradientGlowText = e.target.checked;
                renderPreview();
            });

            // Background & Text Effects: Lower Third Name Tag
            document.getElementById('lowerThirdRoleInput').addEventListener('input', (e) => {
                previewState.lowerThirdRole = e.target.value;
                renderPreview();
            });
            document.getElementById('lowerThirdNameInput').addEventListener('input', (e) => {
                previewState.lowerThirdName = e.target.value;
                renderPreview();
            });
            document.getElementById('lowerThirdVisibleCheckbox').addEventListener('change', (e) => {
                previewState.lowerThirdVisible = e.target.checked;
                renderPreview();
            });
            document.getElementById('lowerThirdColorPicker').addEventListener('input', (e) => {
                previewState.lowerThirdColor = e.target.value;
                renderPreview();
            });

            // Lower Third Name Tag — saved names library (add/select/delete, like the media asset dropdown)
            let savedNamesLibrary = [];
            try { savedNamesLibrary = JSON.parse(localStorage.getItem('ebp_saved_names') || '[]'); } catch (e) { savedNamesLibrary = []; }

            function persistSavedNames() {
                try { localStorage.setItem('ebp_saved_names', JSON.stringify(savedNamesLibrary)); } catch (e) {}
            }
            function refreshSavedNamesDropdown() {
                const dd = document.getElementById('savedNamesDropdown');
                const currentVal = dd.value;
                dd.innerHTML = '<option value="">-- Saved Names --</option>';
                savedNamesLibrary.forEach(entry => {
                    const opt = document.createElement('option');
                    opt.value = entry.id;
                    opt.innerText = entry.role ? `${entry.role}: ${entry.name}` : entry.name;
                    dd.appendChild(opt);
                });
                dd.value = currentVal;
            }
            document.getElementById('addSavedNameBtn').addEventListener('click', () => {
                const role = document.getElementById('lowerThirdRoleInput').value.trim();
                const name = document.getElementById('lowerThirdNameInput').value.trim();
                if (!name) { alert('Please enter a name before adding it to the saved list.'); return; }
                const existing = savedNamesLibrary.find(e => e.role.toLowerCase() === role.toLowerCase() && e.name.toLowerCase() === name.toLowerCase());
                if (!existing) {
                    savedNamesLibrary.push({ id: 'name_' + Date.now(), role, name });
                    persistSavedNames();
                    refreshSavedNamesDropdown();
                }
            });
            document.getElementById('savedNamesDropdown').addEventListener('change', (e) => {
                const id = e.target.value;
                if (!id) return;
                const entry = savedNamesLibrary.find(en => en.id === id);
                if (!entry) return;
                document.getElementById('lowerThirdRoleInput').value = entry.role;
                document.getElementById('lowerThirdNameInput').value = entry.name;
                previewState.lowerThirdRole = entry.role;
                previewState.lowerThirdName = entry.name;
                renderPreview();
            });
            document.getElementById('deleteSavedNameBtn').addEventListener('click', () => {
                const id = document.getElementById('savedNamesDropdown').value;
                if (!id) return;
                savedNamesLibrary = savedNamesLibrary.filter(en => en.id !== id);
                persistSavedNames();
                refreshSavedNamesDropdown();
            });
            refreshSavedNamesDropdown();

            // KEYBOARD NAVIGATION: Navigating via Left/Right Arrow Keys sends directly to Live
            window.addEventListener('keydown', (e) => {
                const activeTag = document.activeElement.tagName;
                const isWriting = (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT');

                // CUSTOM HOTKEYS: user-assigned keys (Settings -> Hotkeys), never active while typing in a field
                if (!isWriting) {
                    const matchedAction = Object.keys(customHotkeys).find(actionKey => customHotkeys[actionKey] === e.key);
                    if (matchedAction && HOTKEY_ACTIONS[matchedAction]) {
                        e.preventDefault();
                        HOTKEY_ACTIONS[matchedAction].fn();
                        return;
                    }
                }

                if (e.key === 'Enter') {
                    if (document.activeElement === document.getElementById('manualSearchInput')) {
                        e.preventDefault();
                        const inputVal = document.activeElement.value;
                        document.getElementById('statusDot').className = "status-dot loading";
                        document.getElementById('statusText').innerText = "Syncing Cloud...";
                        
                        parseAndRouteInput(inputVal, false).then(() => {
                            sendStagedToLiveView();
                        }).catch(err => {
                            console.error("Keyboard routing error:", err);
                        });
                        return;
                    }
                    if (!isWriting || document.activeElement === document.getElementById('announcementInput')) {
                        e.preventDefault();
                        sendStagedToLiveView();
                    }
                }

                if (!isWriting) {
                    const isSongTabActive = document.getElementById('lyrics-tab') && document.getElementById('lyrics-tab').classList.contains('active');

                    if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        if (isSongTabActive) {
                            navigateSongSlide(1);
                        } else {
                            navigateSequentialOffsetVerses(1);
                            sendStagedToLiveView(); // Navigate and project directly live
                        }
                    }
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        if (isSongTabActive) {
                            navigateSongSlide(-1);
                        } else {
                            navigateSequentialOffsetVerses(-1);
                            sendStagedToLiveView(); // Navigate and project directly live
                        }
                    }
                    if (e.key === ' ') { e.preventDefault(); document.getElementById('manualSearchInput').focus(); document.getElementById('manualSearchInput').select(); }
                }
            });

            document.getElementById('previewCanvas').addEventListener('wheel', (e) => {
                if (e.ctrlKey) {
                    e.preventDefault();
                    const sizes = ["small", "medium", "large", "xlarge"];
                    let currentIdx = sizes.indexOf(previewState.fontSize);
                    if (e.deltaY < 0) {
                        currentIdx = Math.min(3, currentIdx + 1);
                    } else {
                        currentIdx = Math.max(0, currentIdx - 1);
                    }
                    const selectedSize = sizes[currentIdx];
                    document.getElementById('fontSizeInput').value = selectedSize;
                    previewState.fontSize = selectedSize;
                    renderPreview();
                }
            }, { passive: false });

            document.getElementById('exportProfileBtn').addEventListener('click', exportProfileToFile);
            document.getElementById('importProfilePicker').addEventListener('change', importProfileFromFile);
        }

        function repopulateAssetDropdownUI() {
            const dropdown = document.getElementById('assetLibraryDropdown');
            dropdown.innerHTML = '<option value="">-- No Image Asset --</option>';
            importedAssetsLibrary.forEach(asset => {
                const opt = document.createElement('option');
                opt.value = asset.id; opt.innerText = asset.name;
                dropdown.appendChild(opt);
            });
        }

        function applySelectedDropdownAssetToPreviewState(assetId) {
            if (!assetId) {
                previewState.flierId = "";
                previewState.textBgUrl = "";
            } else {
                const asset = importedAssetsLibrary.find(a => a.id === assetId);
                if (asset) {
                    if (asset.type === "textBgContainer") {
                        previewState.textBgUrl = asset.dataUrl;
                        previewState.flierId = "";
                    } else {
                        previewState.flierId = asset.id;
                        previewState.textBgUrl = "";
                    }
                }
            }
            renderPreview();
        }

        function pushItemToHistoryDropdownLog(stateObj) {
            if(executionDisplayHistory.length > 0 && executionDisplayHistory[0].text === stateObj.text) return;
            executionDisplayHistory.unshift({ ...stateObj });
            if(executionDisplayHistory.length > 30) executionDisplayHistory.pop();

            const dropdown = document.getElementById('historyDropdown');
            dropdown.innerHTML = '<option value="">-- Past Lines --</option>';
            executionDisplayHistory.forEach((item, index) => {
                const opt = document.createElement('option');
                opt.value = index; opt.innerText = `[${item.ref}] ${item.text.substring(0, 18)}...`;
                dropdown.appendChild(opt);
            });
        }

        function toggleListening() {
            const btn = document.getElementById('listeningBtn');
            const dot = document.getElementById('statusDot');
            const txt = document.getElementById('statusText');
            const track = document.getElementById('transcriptTrack');

            if (!isListening) { 
                try { recognition.start(); } catch(e) {} 
            } else { 
                isListening = false; 
                recognition.stop(); 
                btn.innerText = "Enable Live Voice"; 
                btn.classList.remove('listening'); 
                dot.className = "status-dot active"; 
                txt.innerText = "System Ready"; 
                track.innerText = "Microphone tracking pipeline idle."; 
                disableAudioVolumeDetection();
            }
        }

        function spawnObsProjectorWindow() {
            if (obsWindowRef && !obsWindowRef.closed) { obsWindowRef.focus(); return; }
            obsWindowRef = window.open("", "OBS_Projector_Window", "width=1376,height=768,scrollbars=no,menubar=no,toolbar=no,location=no,status=no");
            obsWindowRef.document.open();
            obsWindowRef.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Express Bible Presenter — Output (capture this window for OBS / NDI)</title>
                    <style>
                        body, html { margin:0; padding:0; overflow:hidden; background-color:#000; width:100%; height:100%; display:flex; justify-content:center; align-items:center; }
                        :root { --canvas-font-size: 34px; --accent-primary: #38bdf8; }
                        .display-canvas { width:100%; aspect-ratio: 2752 / 1536; max-width: 100%; max-height: 100%; display:flex; flex-direction:column; box-sizing:border-box; background-size:cover; background-position:center; background-repeat:no-repeat; position:relative; overflow:hidden; font-family: system-ui, sans-serif; color:#ffffff; container-type: inline-size; margin: auto; box-shadow: 0 0 60px rgba(0,0,0,0.9); }
                        .display-canvas.size-small { --canvas-font-size: 3.2cqw; }
                        .display-canvas.size-medium { --canvas-font-size: 4.8cqw; }
                        .display-canvas.size-large { --canvas-font-size: 6.4cqw; }
                        .display-canvas.size-xlarge { --canvas-font-size: 8.2cqw; }
                        .text-display-box-container { padding: 1.5% 4%; border-radius:8px; background-size:cover; background-position:center; background-repeat:no-repeat; z-index:4; width:100%; box-sizing:border-box; display: flex; align-items: center; justify-content: center; max-height: 92%; }
                        .ticker-wrapper { width: 100%; overflow: hidden; white-space: nowrap; box-sizing: border-box; }
                        .ticker-text { display: inline-block; padding-left: 100%; animation: translateMarquee 20s linear infinite; }
                        @keyframes translateMarquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }
                        .text-out { font-size: var(--canvas-font-size); font-weight: 900; line-height: 1.35; text-shadow: 0 4px 12px rgba(0,0,0,0.98); word-wrap: break-word; overflow-wrap: break-word; text-align: center; width:100%; white-space: pre-wrap; }
                        .ref-out { font-size: calc(var(--canvas-font-size) * 0.45); font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent-primary); text-shadow: 0 3px 6px rgba(0,0,0,0.98); z-index: 4; margin-top: 0.35rem; text-align: center;}
                        .flier-graphic-layer { position: absolute; inset: 0; z-index: 3; display: flex; align-items: center; justify-content: center; background-size: contain; background-position: center; background-repeat: no-repeat; width: 100%; height: 100%; }
                        .canvas-logo-node { position: absolute; z-index: 5; margin: 2%; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6)); object-fit: contain; }
                        .logo-top-left { top: 0; left: 0; } .logo-top-right { top: 0; right: 0; } .logo-bottom-left { bottom: 0; left: 0; } .logo-bottom-right { bottom: 0; right: 0; }
                        .canvas-timer-node { position: absolute; z-index: 6; background: rgba(0,0,0,0.75); border: 1.5px solid rgba(255,255,255,0.15); color:#fff; font-family: monospace; font-weight:900; border-radius:6px; padding: 0.2rem 0.5rem; letter-spacing:0.05em; display:none; align-items:center; justify-content:center; }
                        .canvas-timer-node.timer-visible { display:flex; }
                        .timer-top-left { top: 4%; left: 4%; } .timer-top-right { top: 4%; right: 4%; } .timer-bottom-left { bottom: 4%; left: 4%; } .timer-bottom-right { bottom: 4%; right: 4%; } 
                        .timer-center { top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 12px; background: rgba(0,0,0,0.85); }
                        .timer-size-small { font-size: calc(var(--canvas-font-size) * 0.45); } .timer-size-medium { font-size: calc(var(--canvas-font-size) * 0.75); padding: 0.4rem 0.8rem; } .timer-size-large { font-size: calc(var(--canvas-font-size) * 1.3); padding: 0.6rem 1.2rem; border-width: 3px; font-weight:950; }
                        .timer-center.timer-size-small { font-size: 6cqw; }
                        .timer-center.timer-size-medium { font-size: 10cqw; }
                        .timer-center.timer-size-large { font-size: 16cqw !important; padding: 1rem 2rem; border-width: 4px; }
                        .display-canvas.mode-center { justify-content: center; align-items: center; text-align: center; padding: 2.5%; }
                        .display-canvas.mode-center .text-display-box-container { margin-bottom: 1.5%; }
                        .display-canvas.mode-fullscreen { justify-content: center; align-items: center; text-align: center; padding: 2%; }
                        .display-canvas.mode-lowerthird { justify-content: flex-end; align-items: center; text-align: center; padding: 0 4% 4% 4% !important; }
                        .display-canvas.mode-lowerthird .text-display-box-container { background: #0f172a; border: 2px solid rgba(255, 255, 255, 0.1); border-left: 6px solid var(--accent-primary); margin-bottom: 1%; text-shadow: none; box-shadow: 0 10px 30px rgba(0,0,0,0.7); padding: 1.2% 2%; }
                        .display-canvas.mode-lowerthird .text-out { font-size: calc(var(--canvas-font-size) * 0.85); text-shadow: none; }
                        .display-canvas.mode-lowerthird .ref-out { background: rgba(0,0,0,0.8); padding: 0.4% 1.2%; border-radius: 4px; }
                        .display-canvas.mode-flieronly .text-display-box-container, .display-canvas.mode-flieronly .ref-out { display: none !important; }
                        @keyframes ebpTransFade { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes ebpTransSlide { from { opacity: 0; transform: translateX(18%); } to { opacity: 1; transform: translateX(0); } }
                        @keyframes ebpTransZoom { from { opacity: 0; transform: scale(0.72); } to { opacity: 1; transform: scale(1); } }
                        .ebp-transition-fade { animation: ebpTransFade 0.85s ease both; }
                        .ebp-transition-slide { animation: ebpTransSlide 0.75s cubic-bezier(0.22, 1, 0.36, 1) both; }
                        .ebp-transition-zoom { animation: ebpTransZoom 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
                        .canvas-video-bg-node { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; pointer-events: none; }
                        .text-out.gradient-glow-active { background: linear-gradient(180deg, #ffffff 0%, var(--dynamic-text-color, #38bdf8) 58%, var(--dynamic-text-color, #38bdf8) 100%); -webkit-background-clip: text; background-clip: text; color: transparent !important; filter: drop-shadow(0 0 10px var(--dynamic-text-color, #38bdf8)) drop-shadow(0 0 22px var(--dynamic-text-color, #38bdf8)); }
                        .text-display-box-container.backing-panel-active { background-color: rgba(2, 6, 15, 0.55) !important; backdrop-filter: blur(2px); }
                        .canvas-namebar-node { position: absolute; left: 4%; bottom: 5%; z-index: 7; display: none; align-items: stretch; border-radius: 6px; overflow: hidden; box-shadow: 0 8px 22px rgba(0,0,0,0.6); }
                        .canvas-namebar-node.namebar-visible { display: flex; }
                        .canvas-namebar-node .namebar-role { background: var(--accent-primary, #38bdf8); color: #04121e; font-weight: 900; font-size: calc(var(--canvas-font-size) * 0.28); text-transform: uppercase; letter-spacing: 0.04em; padding: 0.35em 0.7em; display: flex; align-items: center; white-space: nowrap; }
                        .canvas-namebar-node .namebar-name { background: rgba(4, 10, 20, 0.88); color: #ffffff; font-weight: 800; font-size: calc(var(--canvas-font-size) * 0.32); padding: 0.35em 0.9em; display: flex; align-items: center; white-space: nowrap; }
                        .canvas-announcement-banner { display: none; position: absolute; left: 0; right: 0; bottom: 0; z-index: 8; background: linear-gradient(0deg, rgba(180, 83, 9, 0.92) 0%, rgba(180, 83, 9, 0.78) 100%); color: #fff8e7; font-weight: 800; font-size: calc(var(--canvas-font-size) * 0.32); padding: 0.5em 1em; text-align: center; text-shadow: 0 2px 6px rgba(0,0,0,0.8); box-shadow: 0 -6px 16px rgba(0,0,0,0.4); overflow: hidden; white-space: nowrap; }
                        .canvas-announcement-banner.announcement-visible { display: block; }
                    </style>
                </head>
                <body><div id="projectorCanvas" class="display-canvas mode-center size-medium"></div></body>
                </html>
            `);
            obsWindowRef.document.close(); updateObsProjectorDOM();
        }

        function updateObsProjectorDOM() {
            // Channel 1 Sync: BroadcastChannel (Instant Offline Sync)
            const stateSync = { liveState: liveState, cachedLogoDataUrl: cachedLogoDataUrl };
            obsBroadcastChannel.postMessage({ type: "SYSTEM_SYNC_STATE", ...stateSync });
            
            // Channel 2 Sync: Remote WebRTC connections
            activeRemoteDataConnections.forEach(conn => {
                if (conn.open) conn.send({ type: "SYSTEM_SYNC_STATE", ...stateSync });
            });

            // Channel 3 Sync: LocalStorage updates (Reliable crossover inside same-machine OBS docks)
            localStorage.setItem('ebp_live_sync_state', JSON.stringify({ type: "SYSTEM_SYNC_STATE", ...stateSync }));

            if (!obsWindowRef || obsWindowRef.closed) return;
            const targetDoc = obsWindowRef.document;
            const container = targetDoc.getElementById('projectorCanvas'); if (!container) return;

            // Preserve any currently-playing background video across this update, same as the main canvas
            const existingVideoEl = container.querySelector('.canvas-video-bg-node');

            const customFontFamily = document.getElementById('fontStyleOverrideSelector').value;
            const customShadow = document.getElementById('textShadowSelector').value;
            const isTextBold = document.getElementById('fontBoldToggleBtn').classList.contains('toggle-active');
            const isTextItalic = document.getElementById('fontItalicToggleBtn').classList.contains('toggle-active');
            const customFontWeight = isTextBold ? '900' : '400';
            const customFontStyle = isTextItalic ? 'italic' : 'normal';
            const bgOpacity = liveState.bgOpacity == null ? 100 : liveState.bgOpacity;

            container.className = `display-canvas ${liveState.layout} size-${liveState.fontSize}`;
            container.style.fontFamily = customFontFamily;

            container.style.backgroundImage = 'none';
            container.style.backgroundColor = liveState.bgTransparent ? 'transparent' : hexToRgbaWithOpacity(liveState.bgColor, bgOpacity);
            container.style.transition = getDisplayTransitionClass() ? 'background-color 0.5s ease' : 'none';

            let contentNode = liveState.text || '';
            if (liveState.isScrolling && liveState.text) {
                contentNode = `<div class="ticker-wrapper"><div class="ticker-text">${contentNode}</div></div>`;
            }

            const boxBgStyleString = liveState.textBgUrl ? `background-image: url('${liveState.textBgUrl}');` : '';
            const textHiddenClass = (liveState.timerVisible && liveState.timerSolo) ? 'display: none !important;' : '';
            
            // Apply Flier Only Layout on Projector Out
            const flierOnlyTextHide = liveState.layout === 'mode-flieronly' ? 'display: none !important;' : '';

            // Video-alone mode: hide text/reference/name-tag when video background overlay is turned off
            const isVideoAloneMode = liveState.videoBgEnabled && liveState.videoBgUrl && liveState.videoOverlayMode === false;
            const videoAloneHide = isVideoAloneMode ? 'display: none !important;' : '';

            // Responsive font scaling, gradient glow, and text backing panel — mirrored from the main canvas
            // Auto-resizing disabled per request — text now stays at the selected size and wraps to fit instead
            const autoFontScale = 1;
            const gradientGlowClass = liveState.gradientGlowText ? 'gradient-glow-active' : '';
            const dynamicColorVar = `--dynamic-text-color: ${liveState.textColor || '#38bdf8'};`;
            const backingPanelClass = liveState.textBackingPanel ? 'backing-panel-active' : '';

            // Lower third name tag
            const nameBarVisible = liveState.lowerThirdVisible && (liveState.lowerThirdName || liveState.lowerThirdRole);
            const nameBarHtml = `
                <div class="canvas-namebar-node ${nameBarVisible ? 'namebar-visible' : ''}" style="${videoAloneHide}">
                    <div class="namebar-role">${liveState.lowerThirdRole || ''}</div>
                    <div class="namebar-name" style="color: ${liveState.lowerThirdColor || '#ffffff'};">${liveState.lowerThirdName || ''}</div>
                </div>
            `;

            // Announcement banner — mirrored from the main canvas
            const announcementActive = liveState.announcementVisible && liveState.announcementText;
            const announcementInner = liveState.announcementScrolling
                ? `<div class="ticker-wrapper"><div class="ticker-text">${liveState.announcementText || ''}</div></div>`
                : (liveState.announcementText || '');
            const announcementHtml = `
                <div class="canvas-announcement-banner ${announcementActive ? 'announcement-visible' : ''}" style="${videoAloneHide}">${announcementInner}</div>
            `;

            const projectorTransitionClass = getDisplayTransitionClass();
            container.innerHTML = `
                <div class="text-display-box-container ${projectorTransitionClass} ${backingPanelClass}" style="${boxBgStyleString} ${textHiddenClass} ${flierOnlyTextHide} ${videoAloneHide}">
                    <div class="text-out ${gradientGlowClass}" style="width:100%; ${dynamicColorVar} color: ${liveState.textColor || '#ffffff'}; text-shadow: ${customShadow}; font-size: calc(var(--canvas-font-size) * ${autoFontScale}); font-family: ${customFontFamily}; font-weight: ${customFontWeight}; font-style: ${customFontStyle};">${contentNode}</div>
                </div>
                <div class="ref-out ${projectorTransitionClass}" style="${textHiddenClass} ${flierOnlyTextHide} ${videoAloneHide} text-shadow: ${customShadow}; font-family: ${customFontFamily}; ${liveState.refColor ? `color: ${liveState.refColor};` : ''}">${liveState.ref || ''}</div>
                <div class="canvas-timer-node" id="projectorCanvasOverlayTimer">00:00</div>
                ${nameBarHtml}
                ${announcementHtml}
            `;

            // Text stays at the selected size and wraps; this only steps in if wrapped text would actually overflow the frame
            autoFitVerseText(container);

            // Render scaled coordinates on the standalone OBS Projector
            const innerTimer = container.querySelector('#projectorCanvasOverlayTimer');
            if (innerTimer) {
                innerTimer.className = `canvas-timer-node ${liveState.timerPosition} ${liveState.timerSize} ${liveState.timerVisible ? 'timer-visible' : ''}`;
                innerTimer.innerText = liveState.timerText || "00:00";
                
                const originStr = liveState.timerPosition === 'timer-center' ? 'center' : (liveState.timerPosition.includes('left') ? 'left' : 'right');
                innerTimer.style.transformOrigin = originStr;
                innerTimer.style.transform = `${liveState.timerPosition === 'timer-center' ? 'translate(-50%, -50%)' : ''} scale(${liveState.timerScale || 1.0})`;
            }

            if (liveState.videoBgEnabled && liveState.videoBgUrl) {
                if (existingVideoEl && existingVideoEl.dataset.videoSrc === liveState.videoBgUrl) {
                    existingVideoEl.className = `canvas-video-bg-node ${projectorTransitionClass}`;
                    existingVideoEl.style.opacity = bgOpacity / 100;
                    existingVideoEl.muted = liveState.videoOverlayMode !== false;
                    container.insertBefore(existingVideoEl, container.firstChild);
                } else {
                    const videoBg = targetDoc.createElement('video');
                    videoBg.className = `canvas-video-bg-node ${projectorTransitionClass}`;
                    videoBg.dataset.videoSrc = liveState.videoBgUrl;
                    videoBg.src = liveState.videoBgUrl;
                    videoBg.autoplay = true; videoBg.loop = true; videoBg.playsInline = true; videoBg.muted = liveState.videoOverlayMode !== false;
                    videoBg.style.opacity = bgOpacity / 100;
                    if (projectorTransitionClass) videoBg.addEventListener('animationend', () => { videoBg.style.opacity = bgOpacity / 100; }, { once: true });
                    container.insertBefore(videoBg, container.firstChild);
                    const playPromise = videoBg.play();
                    if (playPromise && playPromise.catch) playPromise.catch(() => {});
                }
            } else if (liveState.flierId) {
                const asset = importedAssetsLibrary.find(a => a.id === liveState.flierId);
                if (asset) {
                    const flierLayer = targetDoc.createElement('div'); flierLayer.className = `flier-graphic-layer ${projectorTransitionClass}`;
                    flierLayer.style.backgroundImage = `url('${asset.dataUrl}')`; flierLayer.style.opacity = bgOpacity / 100; container.appendChild(flierLayer);
                    if (projectorTransitionClass) flierLayer.addEventListener('animationend', () => { flierLayer.style.opacity = bgOpacity / 100; }, { once: true });
                }
            } else if (liveState.layout === 'mode-flieronly') {
                const placeholderLayer = targetDoc.createElement('div');
                placeholderLayer.className = `flier-graphic-layer ${projectorTransitionClass}`;
                placeholderLayer.innerHTML = `<div class="placeholder-text">[ Flier Only Mode - No Image Selected ]</div>`;
                container.appendChild(placeholderLayer);
            }

            if (cachedLogoDataUrl && liveState.logoPosition) {
                const logoImg = targetDoc.createElement('img');
                const logoSizeValue = liveState.logoSize || 6;
                logoImg.src = cachedLogoDataUrl; 
                logoImg.className = `canvas-logo-node ${liveState.logoPosition}`;
                logoImg.style.width = `${logoSizeValue}%`;
                logoImg.style.height = `${logoSizeValue * 1.5}%`;
                container.appendChild(logoImg);
            }
        }

        function displayPanelFallbackNotice(msg) {
            document.getElementById('statusDot').className = "status-dot";
            document.getElementById('statusText').innerText = "Data Void";
            document.getElementById('verseGridDeck').innerHTML = `<div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.9rem; font-style:italic;">${msg}</div>`;
        }

        function copyIntegrationLink(elementId) {
            const inputEl = document.getElementById(elementId);
            if (inputEl) {
                inputEl.select();
                document.execCommand('copy');
            }
        }

        function exportProfileToFile() {
            const profilePackage = {
                generator: "EXPRESS BIBLE PRESENTER", timestamp: Date.now(), version: document.getElementById('versionSelector').value, bookCode: currentBookCode, bookName: currentBookName, chapter: currentChapter, verse: currentVerse, assetsLibraryCache: importedAssetsLibrary, cachedLogoBlobData: cachedLogoDataUrl, savedPreviewState: previewState, savedLiveState: liveState, historyLogSnapshot: executionDisplayHistory
            };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profilePackage));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr); downloadAnchor.setAttribute("download", `ExpressProfile_Master_${Date.now()}.json`);
            document.body.appendChild(downloadAnchor); downloadAnchor.click(); downloadAnchor.remove();
        }

        function importProfileFromFile(e) {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const importedData = JSON.parse(event.target.result);
                    if (importedData.generator !== "EXPRESS BIBLE PRESENTER") return;
                    if (importedData.assetsLibraryCache) { importedAssetsLibrary = importedData.assetsLibraryCache; repopulateAssetDropdownUI(); }
                    if (importedData.cachedLogoBlobData) { cachedLogoDataUrl = importedData.cachedLogoBlobData; }
                    document.getElementById('versionSelector').value = importedData.version || "KJV";
                    currentBookCode = importedData.bookCode; currentBookName = importedData.bookName; currentChapter = importedData.chapter; currentVerse = importedData.verse;
                    previewState = importedData.savedPreviewState; liveState = importedData.savedLiveState;
                    document.getElementById('layoutSelector').value = previewState.layout; document.getElementById('fontSizeInput').value = previewState.fontSize; document.getElementById('bgColorPicker').value = previewState.bgColor; document.getElementById('textColorPicker').value = previewState.textColor || '#ffffff'; document.getElementById('assetLibraryDropdown').value = previewState.flierId || ""; document.getElementById('logoPositionSelector').value = previewState.logoPosition || "";
                    fetchCurrentChapterFromAPI(); renderPreview();
                } catch (err) { console.error("Import failure: ", err); }
            };
            reader.readAsText(file);
        }

        // STANDALONE DECOUPLED OBS VIEWPORT MANAGER
        function bootObsSourceApplication() {
            const obsCanvas = document.getElementById('obsCanvas');
            obsCanvas.innerHTML = `
                <div class="placeholder-text" style="color: #10b981; font-size: 1.5rem;">OBS Standby Connection...</div>
                <div class="canvas-timer-node" id="obsTimerOverlay">00:00</div>
            `;
            
            const targetToken = urlParameters.get('sessionToken');

            function syncViewportState(data) {
                if (data && data.liveState) {
                    buildCanvasDOM(obsCanvas, data.liveState, [], data.cachedLogoDataUrl, true);
                    
                    const innerTimer = obsCanvas.querySelector('.canvas-timer-node');
                    if (innerTimer) {
                        innerTimer.className = `canvas-timer-node ${data.liveState.timerPosition} ${data.liveState.timerSize} ${data.liveState.timerVisible ? 'timer-visible' : ''}`;
                        innerTimer.innerText = data.liveState.timerText || "00:00";
                        
                        const originStr = data.liveState.timerPosition === 'timer-center' ? 'center' : (data.liveState.timerPosition.includes('left') ? 'left' : 'right');
                        innerTimer.style.transformOrigin = originStr;
                        innerTimer.style.transform = `${data.liveState.timerPosition === 'timer-center' ? 'translate(-50%, -50%)' : ''} scale(${data.liveState.timerScale || 1.0})`;
                    }
                }
            }
            
            // REDUNDANCY LEVEL 1: BroadcastChannel Events
            obsBroadcastChannel.onmessage = (event) => {
                syncViewportState(event.data);
            };

            // REDUNDANCY LEVEL 2: LocalStorage Storage Events (Saves Cross-Iframe blocks inside OBS docks)
            window.addEventListener('storage', (e) => {
                if (e.key === 'ebp_live_sync_state' && e.newValue) {
                    try {
                        const parsedData = JSON.parse(e.newValue);
                        syncViewportState(parsedData);
                    } catch(err) {}
                }
            });

            // Init load fallback from storage
            try {
                const cachedVal = localStorage.getItem('ebp_live_sync_state');
                if (cachedVal) {
                    syncViewportState(JSON.parse(cachedVal));
                }
            } catch(e) {}

            // REDUNDANCY LEVEL 3: WebRTC Client fallback
            if (targetToken) {
                const clientPeer = new Peer();
                clientPeer.on('open', () => {
                    peerClientConnection = clientPeer.connect(targetToken);
                    peerClientConnection.on('data', (data) => {
                        syncViewportState(data);
                    });
                });
            }
        }
