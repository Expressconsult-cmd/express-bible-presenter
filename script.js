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
            openObs: { label: 'Send to Projector', fn: () => sendToProjectorAutoDetect() },
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
            toggleMedia: { label: 'Show / Hide Media (flier, image, video)', fn: () => document.getElementById(previewState.displayMode === 'media' ? 'mediaHideBtn' : 'mediaShowBtn').click() }
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
            bgOpacity: 100, textBackingPanel: false, gradientGlowText: false,
            lowerThirdName: "", lowerThirdRole: "Ministering", lowerThirdVisible: false,
            refColor: "", lowerThirdColor: "#ffffff",
            announcementText: "", announcementVisible: false, announcementEffect: "none", announcementPosition: "bottom", announcementBgColor: "#b45309",
            bgTransparent: false,
            displayMode: "text", mediaUrl: "", mediaKind: "", mediaName: "", mediaFit: "contain"
        };

        // SINGLE SCENE: liveState is the SAME object as previewState (not a copy) — there's only
        // one scene now, so both names just refer to it. This keeps every existing "previewState.x = y"
        // and "liveState.x" reference throughout the app working without needing to rename them all.
        let liveState = previewState;

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
            initMediaEngine();
            renderHotkeysList();
            renderOutputSlotsList();
            document.getElementById('addOutputSlotBtn').addEventListener('click', () => {
                const newSlot = { id: 'slot_' + Date.now(), name: 'New Output', sourceMode: 'live', windowRef: null };
                outputSlots.push(newSlot);
                persistOutputSlotsConfig();
                renderOutputSlotsList();
            });
            document.getElementById('detectScreensBtn').addEventListener('click', detectAndListScreens);

            // Desktop companion app only: reveal the experimental native NDI sender controls
            if (window.desktopBridge) {
                const ndiSection = document.getElementById('desktopNdiSection');
                if (ndiSection) ndiSection.style.display = 'block';
                document.getElementById('startDesktopNdiBtn').addEventListener('click', async () => {
                    const statusEl = document.getElementById('desktopNdiStatus');
                    statusEl.innerText = 'Starting...';
                    const result = await window.desktopBridge.startNdiSender('Express Bible Presenter');
                    statusEl.innerText = result.ok ? '● Sending NDI' : `Not available: ${result.reason}`;
                });
                document.getElementById('stopDesktopNdiBtn').addEventListener('click', async () => {
                    await window.desktopBridge.stopNdiSender();
                    document.getElementById('desktopNdiStatus').innerText = 'Not running';
                });
            }
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
                    switchToTextDisplay();
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
            try { localStorage.setItem('ebp_live_sync_state', JSON.stringify(systemSyncPayload)); } catch (e) {}
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
            clearTimeout(voicePendingTimer);
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

                        let cleanText = res.text.replace(/<S>\s*\d+\s*<\/S>/gi, '').replace(/<[^>]*>/g, '').trim();
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
                            forceTextVisibleOnDoubleClick();
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
                    forceTextVisibleOnDoubleClick();
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

        // ===================== MEDIA DISPLAY: flier / image / video (independent of backgrounds) =====================
// Own library, saved permanently in IndexedDB (handles big videos too), shown full-screen on its own.
let mediaLibrary = [];
const mediaDB = (() => {
    let dbPromise = null;
    const open = () => dbPromise || (dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open('ebp_media_library', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('media', { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    }));
    const run = async (mode, action) => {
        const db = await open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('media', mode);
            const request = action(tx.objectStore('media'));
            tx.oncomplete = () => resolve(request.result);
            tx.onerror = tx.onabort = () => reject(tx.error);
        });
    };
    return { all: () => run('readonly', st => st.getAll()), put: rec => run('readwrite', st => st.put(rec)), remove: id => run('readwrite', st => st.delete(id)) };
})();

function updateMediaPanelStatus() {
    const el = document.getElementById('mediaStatus');
    if (!el) return;
    const on = previewState.displayMode === 'media' && previewState.mediaUrl;
    el.innerText = on ? `● On screen: ${previewState.mediaName}` : 'Media hidden — text is showing';
    el.style.color = on ? 'var(--accent-live)' : 'var(--text-muted)';
    const showBtn = document.getElementById('mediaShowBtn');
    if (showBtn) showBtn.classList.toggle('toggle-active', !!on);
}

// Text is chosen (double-click / arrows / Enter) -> media steps aside automatically instead of overlaying.
function switchToTextDisplay() {
    if (previewState.displayMode !== 'media') return;
    previewState.displayMode = 'text';
    const entry = masterVideoRegistry.get(previewState.mediaUrl);
    if (entry) entry.masterEl.pause();
    updateMediaPanelStatus();
}

function refreshMediaDropdown(selectedId) {
    const dd = document.getElementById('mediaLibraryDropdown');
    dd.innerHTML = '<option value="">-- Saved Media (images & videos) --</option>';
    mediaLibrary.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id; opt.innerText = `${m.kind === 'video' ? '🎞' : '🖼'} ${m.name}`;
        dd.appendChild(opt);
    });
    dd.value = selectedId || '';
}

function showMedia(id) {
    const m = mediaLibrary.find(x => x.id === id);
    if (!m) return;
    Object.assign(previewState, { mediaUrl: m.url, mediaKind: m.kind, mediaName: m.name, displayMode: 'media' });
    const entry = masterVideoRegistry.get(m.url);
    if (m.kind === 'video' && entry) { entry.masterEl.currentTime = 0; entry.masterEl.play().catch(() => {}); }
    updateMediaPanelStatus();
    renderPreview();
}

// Draws the media on any canvas (main, OBS, projector, extra outputs). Videos reuse the shared master
// stream so nothing restarts on re-render; media is letterboxed by default so nothing is cropped.
// ===================== NO-BLINK RENDERING HELPERS =====================
// The scene is rebuilt on every control change, and each rebuild used to replay the fade/slide/zoom
// animation, restart the announcement effect and re-create image layers — that was the "blink".
// Now: transitions only play when the CONTENT (text / reference / media) really changes, and image,
// logo and announcement layers that haven't changed are carried over untouched.
function computeSceneContentSig(st) {
    return [st.text, st.ref, st.flierId, st.textBgUrl, st.displayMode, st.mediaUrl].join('\u241F');
}

// Detaches layers worth keeping BEFORE the canvas is rewritten, so they can be put back as-is.
function takeReusableLayers(container) {
    const kept = new Map();
    container.querySelectorAll(':scope > [data-layer-key]').forEach(node => { kept.set(node.dataset.layerKey, node); node.remove(); });
    const banner = container.querySelector(':scope > .canvas-announcement-banner');
    if (banner) { kept.set('__banner__', banner); banner.remove(); }
    return kept;
}

function layerFromCache(reusable, key, create) {
    const cached = reusable && reusable.get(key);
    if (cached) return { node: cached, reused: true };
    const node = create();
    node.dataset.layerKey = key;
    return { node, reused: false };
}

// Keeps the running announcement animation (scroll / breathing / fade) alive when its content is unchanged.
function restoreAnnouncementBanner(container, reusable, annSig) {
    const fresh = container.querySelector(':scope > .canvas-announcement-banner');
    if (!fresh) return;
    const old = reusable && reusable.get('__banner__');
    if (old && old.dataset.annSig === annSig) fresh.replaceWith(old);
    else fresh.dataset.annSig = annSig;
}

function attachMediaLayer(container, ownerDoc, state, existingMediaEl, reusable) {
    if (state.displayMode !== 'media' || !state.mediaUrl) return;
    const fit = state.mediaFit === 'cover' ? 'cover' : 'contain';
    if (state.mediaKind === 'video') {
        const sink = attachSharedVideoSink(container, ownerDoc, state.mediaUrl, existingMediaEl,
            { className: 'canvas-video-bg-node media-layer-node', opacity: 1, muted: false });
        sink.style.objectFit = fit;
    } else {
        const { node: img } = layerFromCache(reusable, 'media:' + state.mediaUrl, () => { const el = ownerDoc.createElement('img'); el.src = state.mediaUrl; return el; });
        img.className = 'media-layer-node'; img.style.objectFit = fit;
        container.appendChild(img);
    }
}

async function initMediaEngine() {
    const $ = id => document.getElementById(id);
    try {
        const stored = await mediaDB.all();
        mediaLibrary = stored.sort((a, b) => b.addedAt - a.addedAt)
            .map(r => ({ id: r.id, name: r.name, kind: r.kind, addedAt: r.addedAt, url: URL.createObjectURL(r.blob) }));
    } catch (err) { console.warn('Media storage unavailable — library will be session-only.', err); }
    refreshMediaDropdown(); updateMediaPanelStatus();

    $('mediaUploadBtn').addEventListener('click', () => $('mediaFilePicker').click());
    $('mediaFilePicker').addEventListener('change', async (e) => {
        let lastId = '';
        for (const file of Array.from(e.target.files || [])) {
            const kind = file.type.startsWith('video/') ? 'video' : (file.type.startsWith('image/') ? 'image' : '');
            if (!kind) continue;
            const rec = { id: 'media_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), name: file.name, kind, addedAt: Date.now(), blob: file };
            mediaLibrary.unshift({ id: rec.id, name: rec.name, kind, addedAt: rec.addedAt, url: URL.createObjectURL(file) });
            try { await mediaDB.put(rec); } catch (err) { console.warn('Could not save media permanently (session-only):', err); }
            lastId = rec.id;
        }
        e.target.value = '';
        if (lastId) { refreshMediaDropdown(lastId); showMedia(lastId); }
    });
    $('mediaLibraryDropdown').addEventListener('change', (e) => { if (e.target.value) showMedia(e.target.value); });
    $('mediaShowBtn').addEventListener('click', () => {
        const current = mediaLibrary.find(m => m.url === previewState.mediaUrl);
        const id = $('mediaLibraryDropdown').value || (current && current.id);
        if (id) showMedia(id);
    });
    $('mediaHideBtn').addEventListener('click', () => { switchToTextDisplay(); renderPreview(); });
    $('mediaFitSelector').addEventListener('change', (e) => { previewState.mediaFit = e.target.value; renderPreview(); });
    $('mediaDeleteBtn').addEventListener('click', async () => {
        const id = $('mediaLibraryDropdown').value;
        const m = mediaLibrary.find(x => x.id === id);
        if (!m || !confirm(`Remove "${m.name}" from the saved media library?`)) return;
        if (previewState.mediaUrl === m.url) {
            switchToTextDisplay();
            Object.assign(previewState, { mediaUrl: '', mediaKind: '', mediaName: '' });
            renderPreview();
        }
        const entry = masterVideoRegistry.get(m.url);
        if (entry) { entry.masterEl.remove(); masterVideoRegistry.delete(m.url); }
        URL.revokeObjectURL(m.url);
        mediaLibrary = mediaLibrary.filter(x => x.id !== id);
        try { await mediaDB.remove(id); } catch (err) {}
        refreshMediaDropdown(); updateMediaPanelStatus();
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

            // Target the single scene's DOM overlay
            const liveOverlay = document.getElementById('liveTimerOverlay') || document.querySelector('#liveCanvas .canvas-timer-node');
            if (liveOverlay) {
                liveOverlay.className = `canvas-timer-node ${liveState.timerPosition} ${liveState.timerSize} ${liveState.timerVisible ? 'timer-visible' : ''}`;
                liveOverlay.innerText = formattedTime;
                
                const originStr = liveState.timerPosition === 'timer-center' ? 'center' : (liveState.timerPosition.includes('left') ? 'left' : 'right');
                liveOverlay.style.transformOrigin = originStr;
                liveOverlay.style.transform = `${liveState.timerPosition === 'timer-center' ? 'translate(-50%, -50%)' : ''} scale(${liveState.timerScale || 1.0})`;
            }

            // Target the projector output window directly
            if (projectorWindowRef && !projectorWindowRef.closed) {
                const projectorOverlay = projectorWindowRef.document.getElementById('directProjectorCanvasOverlayTimer') || projectorWindowRef.document.querySelector('.canvas-timer-node');
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
                document.querySelectorAll('#liveCanvas .canvas-logo-node, #obsCanvas .canvas-logo-node').forEach(logoEl => {
                    logoEl.style.width = `${newSize}%`;
                    logoEl.style.height = `${newSize * 1.5}%`;
                });
                if (projectorWindowRef && !projectorWindowRef.closed) {
                    const projectorLogo = projectorWindowRef.document.querySelector('.canvas-logo-node');
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
                        // Strip markup only (Strong's <S>1234</S> tags, <i>, <br>) — NEVER digits, which are real text (666, 144,000, ages, measurements)
                        parsedText = parsedText.replace(/<S>\s*\d+\s*<\/S>/gi, '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
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
                    forceTextVisibleOnDoubleClick();
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
            switchToTextDisplay();
            let targetIdx = activeChapterVerses.findIndex(v => v.verse === currentVerse);
            if (targetIdx === -1) return;
            targetIdx += direction;
            if (targetIdx >= 0 && targetIdx < activeChapterVerses.length) {
                selectSpecificVerseCoordinate(activeChapterVerses[targetIdx].verse);
            }
        }

        // Moves to the next/previous generated song slide and sends it straight to Live
        function navigateSongSlide(direction) {
            switchToTextDisplay();
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
        // ===================== SHARED VIDEO ENGINE =====================
        // Real broadcast software only shows identical, perfectly synced video across Preview/Live/
        // multiple outputs when they're all watching the SAME actual playing media — not separate
        // copies each trying to mimic the other's position. So instead of an independent <video> per
        // canvas (which caused restarts and drift), we keep ONE hidden "master" video playing per
        // background video file, capture its live output as a MediaStream, and every canvas (including
        // cross-window popups) attaches a lightweight "sink" <video> to that same stream — always
        // frame-identical, never restarted.
        const masterVideoRegistry = new Map(); // videoUrl -> { masterEl, stream }

        function getOrCreateMasterVideo(videoUrl) {
            let entry = masterVideoRegistry.get(videoUrl);
            if (entry) return entry;

            const masterEl = document.createElement('video');
            masterEl.src = videoUrl;
            masterEl.loop = true;
            masterEl.muted = true; // the master itself is always muted — each sink controls its own audibility
            masterEl.autoplay = true;
            masterEl.playsInline = true;
            masterEl.style.cssText = 'position:fixed; width:1px; height:1px; opacity:0; pointer-events:none; left:-9999px;';
            document.body.appendChild(masterEl);
            masterEl.play().catch(() => {});

            entry = { masterEl, stream: null };
            masterVideoRegistry.set(videoUrl, entry);

            const captureWhenReady = () => {
                if (entry.stream) return;
                try {
                    if (masterEl.captureStream) entry.stream = masterEl.captureStream();
                    else if (masterEl.mozCaptureStream) entry.stream = masterEl.mozCaptureStream();
                } catch (e) {}
            };
            masterEl.addEventListener('loadedmetadata', captureWhenReady, { once: true });
            masterEl.addEventListener('playing', captureWhenReady, { once: true });

            return entry;
        }

        // Attaches (or reuses) a sink <video> inside any container — same document or a cross-window
        // popup — that mirrors the shared master stream for the given URL.
        function attachSharedVideoSink(container, ownerDoc, videoUrl, existingVideoEl, opts) {
            const entry = getOrCreateMasterVideo(videoUrl);
            let sinkEl = (existingVideoEl && existingVideoEl.dataset.videoSrc === videoUrl) ? existingVideoEl : null;

            if (!sinkEl) {
                sinkEl = ownerDoc.createElement('video');
                sinkEl.dataset.videoSrc = videoUrl;
                sinkEl.autoplay = true;
                sinkEl.playsInline = true;
            }
            sinkEl.className = opts.className;
            sinkEl.style.opacity = opts.opacity;
            sinkEl.muted = opts.muted;
            sinkEl.dataset.currentOpacity = opts.opacity;
            if (opts.className.includes('ebp-transition-') && !sinkEl.dataset.opacityFixBound) {
                sinkEl.dataset.opacityFixBound = '1';
                sinkEl.addEventListener('animationend', () => { sinkEl.style.opacity = sinkEl.dataset.currentOpacity; });
            }
            container.insertBefore(sinkEl, container.firstChild);

            if (entry.stream) {
                if (sinkEl.srcObject !== entry.stream) {
                    sinkEl.srcObject = entry.stream;
                    const playPromise = sinkEl.play();
                    if (playPromise && playPromise.catch) playPromise.catch(() => {});
                }
            } else if (!sinkEl.dataset.fallbackDirect) {
                let attempts = 0;
                const retry = () => {
                    attempts++;
                    const freshEntry = masterVideoRegistry.get(videoUrl);
                    if (freshEntry && freshEntry.stream) {
                        sinkEl.srcObject = freshEntry.stream;
                        const p = sinkEl.play(); if (p && p.catch) p.catch(() => {});
                    } else if (attempts < 15) {
                        setTimeout(retry, 200);
                    } else if (!sinkEl.srcObject) {
                        sinkEl.dataset.fallbackDirect = '1';
                        sinkEl.src = videoUrl; sinkEl.loop = true;
                        const p = sinkEl.play(); if (p && p.catch) p.catch(() => {});
                    }
                };
                retry();
            }
            return sinkEl;
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
            const existingVideoEl = canvasElement.querySelector('.canvas-video-bg-node:not(.media-layer-node)');
            const existingMediaEl = canvasElement.querySelector('video.media-layer-node');

            canvasElement.className = `display-canvas ${stateObject.layout} size-${stateObject.fontSize}`;
            const contentSig = computeSceneContentSig(stateObject);
            const contentChanged = canvasElement.dataset.contentSig !== contentSig;
            canvasElement.dataset.contentSig = contentSig;
            const transitionClass = (withTransition && contentChanged) ? getDisplayTransitionClass() : '';
            const reusableLayers = takeReusableLayers(canvasElement);
            canvasElement.style.transition = transitionClass ? 'background-color 0.5s ease' : 'none';

            const bgOpacity = stateObject.bgOpacity == null ? 100 : stateObject.bgOpacity;

            canvasElement.style.backgroundImage = 'none';
            canvasElement.style.backgroundColor = stateObject.bgTransparent ? 'transparent' : hexToRgbaWithOpacity(stateObject.bgColor, bgOpacity);

            let contentNode = stateObject.text || '';
            if (stateObject.isScrolling && stateObject.text) {
                contentNode = `<div class="ticker-wrapper"><div class="ticker-text">${contentNode}</div></div>`;
            }

            const boxBgStyleString = stateObject.textBgUrl ? `--box-bg-image: url('${stateObject.textBgUrl}'); --box-bg-opacity: ${bgOpacity / 100};` : '--box-bg-image: none;';
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
            const flierOnlyTextHide = (stateObject.layout === 'mode-flieronly' || (stateObject.displayMode === 'media' && stateObject.mediaUrl)) ? 'display: none !important;' : '';

            const videoAloneHide = ''; // Video BG feature removed — Media tab now covers full-screen video

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

            // Announcement banner — editable, toggleable, shown over the main text (never replaces it)
            const announcementActive = stateObject.announcementVisible && stateObject.announcementText;
            const announcementEffect = stateObject.announcementEffect || 'none';
            const announcementInner = announcementEffect === 'scroll'
                ? `<div class="ticker-wrapper"><div class="ticker-text">${stateObject.announcementText || ''}</div></div>`
                : (stateObject.announcementText || '');
            const announcementPosClass = `announcement-pos-${stateObject.announcementPosition || 'bottom'}`;
            const announcementEffectClass = announcementEffect !== 'none' && announcementEffect !== 'scroll' ? `announcement-effect-${announcementEffect}` : '';
            const announcementHtml = `
                <div class="canvas-announcement-banner ${announcementActive ? 'announcement-visible' : ''} ${announcementPosClass} ${announcementEffectClass}" style="${videoAloneHide} background: ${stateObject.announcementBgColor || '#b45309'};">${announcementInner}</div>
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

            restoreAnnouncementBanner(canvasElement, reusableLayers, announcementHtml.trim());

            // Text stays at the selected size and wraps; this only steps in if wrapped text would actually overflow the frame
            autoFitVerseText(canvasElement);
            const innerTimer = canvasElement.querySelector('.canvas-timer-node');
            if (innerTimer) {
                const originStr = stateObject.timerPosition === 'timer-center' ? 'center' : (stateObject.timerPosition.includes('left') ? 'left' : 'right');
                innerTimer.style.transformOrigin = originStr;
                innerTimer.style.transform = `${stateObject.timerPosition === 'timer-center' ? 'translate(-50%, -50%)' : ''} scale(${stateObject.timerScale || 1.0})`;
            }

            if (stateObject.flierId) {
                const targetAsset = assetLibraryContext.find(a => a.id === stateObject.flierId);
                if (targetAsset) {
                    const { node: flierLayer, reused: flierReused } = layerFromCache(reusableLayers, 'flier:' + targetAsset.id, () => {
                        const el = document.createElement('div');
                        el.style.backgroundImage = `url('${targetAsset.dataUrl}')`;
                        return el;
                    });
                    flierLayer.className = `flier-graphic-layer ${flierReused ? '' : transitionClass}`;
                    flierLayer.style.opacity = bgOpacity / 100;
                    if (!flierReused && transitionClass) flierLayer.addEventListener('animationend', () => { flierLayer.style.opacity = bgOpacity / 100; }, { once: true });
                    canvasElement.appendChild(flierLayer);
                }
            } else if (stateObject.layout === 'mode-flieronly') {
                // If Flier Only Layout is chosen but no flier image is uploaded, display a helpful preview text
                const placeholderLayer = document.createElement('div');
                placeholderLayer.className = `flier-graphic-layer ${transitionClass}`;
                placeholderLayer.innerHTML = `<div class="placeholder-text">[ Flier Only Mode - No Image Selected ]</div>`;
                canvasElement.appendChild(placeholderLayer);
            }

            attachMediaLayer(canvasElement, document, stateObject, existingMediaEl, reusableLayers);

            if (logoBlobContext && stateObject.logoPosition) {
                const { node: logoImg } = layerFromCache(reusableLayers, 'logo:' + logoBlobContext.length + ':' + logoBlobContext.slice(-32), () => { const el = document.createElement('img'); el.src = logoBlobContext; return el; });
                const logoSizeValue = stateObject.logoSize || 6;
                logoImg.className = `canvas-logo-node ${stateObject.logoPosition}`;
                logoImg.style.width = `${logoSizeValue}%`;
                logoImg.style.height = `${logoSizeValue * 1.5}%`;
                canvasElement.appendChild(logoImg);
            }
        }

        // SINGLE SCENE: there is no separate staging step anymore — selecting a verse/song/etc.
        // updates the one visible scene immediately. Freeze Live still has a purpose here: while
        // frozen, the scene keeps responding so you can keep working, but that work is NOT pushed
        // out to the projector, OBS/NDI capture, remote viewers, or any multi-screen output slots
        // until you unfreeze — so a live congregation/stage screen can't be disrupted mid-edit.
        function renderPreview() {
            const liveCanvas = document.getElementById('liveCanvas');
            if (!liveState.text && !liveState.flierId && !liveState.textBgUrl && !(liveState.displayMode === 'media' && liveState.mediaUrl)) {
                delete liveCanvas.dataset.contentSig;
                liveCanvas.innerHTML = `
                    <div class="placeholder-text">Awaiting Selection...</div>
                    <div class="canvas-timer-node" id="liveTimerOverlay">00:00</div>
                `;
                updateTimerDisplays();
                if (!isLiveFrozen) {
                    syncLiveStateToRemoteChannels();
                    renderAllOutputSlots();
                    if (projectorWindowRef && !projectorWindowRef.closed) renderIntoOutputWindow(projectorWindowRef, "directProjectorCanvas", liveState);
                }
                return;
            }
            buildCanvasDOM(liveCanvas, liveState, importedAssetsLibrary, cachedLogoDataUrl, true);
            updateTimerDisplays();
            if (!isLiveFrozen) {
                syncLiveStateToRemoteChannels();
                renderAllOutputSlots();
                if (projectorWindowRef && !projectorWindowRef.closed) renderIntoOutputWindow(projectorWindowRef, "directProjectorCanvas", liveState);
            }
        }

        // Compatibility aliases — older code paths (hotkeys, Enter key, double-click) still call
        // these by name; both simply re-render the single scene now.
        function renderLive() { renderPreview(); }
        // When double-clicking a verse/song/etc. to cut it live, the operator clearly wants text
        // shown NOW — so if video-alone mode or Flier Only was hiding all text, switch that off
        // automatically instead of silently hiding the very thing they just double-clicked.
        function forceTextVisibleOnDoubleClick() {
            switchToTextDisplay();
            if (previewState.layout === 'mode-flieronly') {
                previewState.layout = 'mode-center';
            }
        }

        function sendStagedToLiveView() {
            pushItemToHistoryDropdownLog(liveState);
            renderPreview();
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
            recognition.maxAlternatives = 3; // extra guesses make spoken numbers/commands far more reliable
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                voiceCommitted = { utterance: -1, sig: '' }; // fresh recognition session -> fresh utterance numbering
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
                    document.getElementById('transcriptTrack').innerText = "Microphone access was denied. Allow it in the browser's address-bar prompt, then click Enable Live Voice again. (Inside OBS / vMix embedded browsers this is always denied — use a normal Chrome/Edge tab.)";
                    disableAudioVolumeDetection();
                }
                if (event.error === 'network' || event.error === 'audio-capture') {
                    // Retrying can't fix these — stop, and say exactly why.
                    isListening = false;
                    const failBtn = document.getElementById('listeningBtn');
                    failBtn.innerText = "Enable Live Voice"; failBtn.classList.remove('listening');
                    document.getElementById('statusText').innerText = "Live Voice stopped";
                    document.getElementById('transcriptTrack').innerText = event.error === 'network'
                        ? "Can't reach the speech service. Live Voice needs internet and a normal Chrome/Edge browser (OBS / vMix embedded browsers can't reach it)."
                        : "No microphone found, or another app is using it. Check the Audio Source in Settings.";
                    disableAudioVolumeDetection();
                }
                // 'no-speech' / 'aborted' are transient — onend will already handle a clean, debounced restart.
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

                document.getElementById('transcriptTrack').innerHTML = `<span class="active-words">${finalTranscriptText}</span> <span style="opacity:0.4">${interimTranscriptText}</span>${voiceActionNote ? ` <span class="voice-action-note" style="color: var(--accent-success); font-weight:800;">▶ ${voiceActionNote}</span>` : ''}`;
                processContinuousSpeechForScriptures(event);
            };
        }

// ===================== VOICE ENGINE: Bible-text focus + spoken commands =====================
// Listens for (1) scripture references ("turn to John 3:16", "Psalm one hundred and nineteen verse 105"),
// (2) commands ("next verse", "previous verse", "go to verse 10", "open verse ten", "next chapter"), and
// (3) the preacher reading the loaded chapter aloud — the display follows the verse being read.
// Whatever it recognises is shown immediately as text (any media on screen steps aside).
let voiceActionNote = '';
let voiceCommitted = { utterance: -1, sig: '' };
let voicePendingTimer = null;
let voiceBusy = false;

const VOICE_NUM = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12,
    thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19,
    twenty:20, thirty:30, forty:40, fourty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90 };

// "one hundred and nineteen" -> 119, "twenty three" -> 23, "three sixteen" -> "3 16"
function voiceWordsToDigits(text) {
    const tk = text.trim().split(/\s+/);
    const kindOf = w => w === 'hundred' ? 'h' : (w in VOICE_NUM ? (VOICE_NUM[w] >= 20 ? 't' : (VOICE_NUM[w] >= 10 ? 'n' : 'o')) : '');
    const allowed = { '': ['o', 'n', 't'], o: ['h'], n: [], t: ['o'], h: ['o', 'n', 't'] };
    const out = [];
    for (let i = 0; i < tk.length;) {
        const startKind = kindOf(tk[i]);
        if (!startKind || startKind === 'h') { out.push(tk[i]); i++; continue; }
        let cur = 0, last = '', j = i;
        while (j < tk.length) {
            let w = tk[j];
            if (w === 'and' && last === 'h' && j + 1 < tk.length && kindOf(tk[j + 1]) && kindOf(tk[j + 1]) !== 'h') { j++; continue; }
            const kk = kindOf(w);
            if (!kk || !allowed[last].includes(kk)) break;
            if (kk === 'h') cur = (cur || 1) * 100; else cur += VOICE_NUM[w];
            last = kk; j++;
        }
        out.push(String(cur)); i = j;
    }
    return out.join(' ');
}

function voiceNormalize(raw) {
    let s = ' ' + String(raw || '').toLowerCase() + ' ';
    s = s.replace(/(\d+)\s*:\s*(\d+)/g, '$1 verse $2');                                   // 3:16 -> 3 verse 16
    s = s.replace(/[^a-z0-9\s]/g, ' ');                                                    // speech engines add commas/periods
    s = s.replace(/\b(first|1st)\s+verse\b/g, ' verse 1 ').replace(/\b(second|2nd)\s+verse\b/g, ' verse 2 ')
         .replace(/\b(third|3rd)\s+verse\b/g, ' verse 3 ');
    s = s.replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1');                                        // 10th -> 10, 1st john -> 1 john
    s = s.replace(/\bfirst\b/g, '1').replace(/\bsecond\b/g, '2').replace(/\bthird\b/g, '3');
    s = voiceWordsToDigits(s.replace(/\s+/g, ' '));
    return (' ' + s.replace(/\s+/g, ' ').trim() + ' ').trim();
}

// Whole-word book names only (no loose prefixes) so ordinary words can never trigger a jump.
const VOICE_BOOK_ALIASES = (() => {
    const list = Object.entries(bookBollsIdMap).map(([name, id]) => [name, id]);
    list.push(["revelations", 66], ["songs of solomon", 22], ["psalm of david", 19]);
    return list.sort((a, b) => b[0].length - a[0].length).map(([name, id]) => ({
        id, re: new RegExp(`(?:^|\\s)${name.replace(/\s+/g, '\\s+')}\\s+(?:chapter\\s+)?(\\d{1,3})(?:\\s+(?:verses?|vers|ver|vs)\\s*(?:number\\s+)?(\\d{1,3})|\\s+(\\d{1,3}))?(?=\\s|$)`, 'g')
    }));
})();

const VOICE_FILLER = '(?:(?:ok|okay|and|now|then|please|alright|all right|so)\\s+)*';
const VOICE_PATTERNS = {
    chapter: /(?:^|\s)chapter\s+(\d{1,3})(?:\s+(?:verses?|vers|ver|vs)\s*(?:number\s+)?(\d{1,3}))?(?=\s|$)/g,
    verse: /(?:^|\s)(?:verses?|vers|ver|vs)\s+(?:number\s+)?(\d{1,3})(?=\s|$)/g,
    nextStrong: [/(?:^|\s)(?:next|following)\s+(?:verse|slide|line)(?=\s|$)/g, /(?:^|\s)(?:go|move|skip|jump|turn|proceed)\s+(?:on\s+)?(?:to\s+)?(?:the\s+)?next(?=\s|$)/g],
    prevStrong: [/(?:^|\s)(?:previous|prior|preceding)\s+(?:verse|slide|line|one)(?=\s|$)/g, /(?:^|\s)(?:go|move|skip|jump|turn|step)\s+back\s+(?:one\s+|1\s+)?(?:verse|slide|line)(?=\s|$)/g, /(?:^|\s)back\s+(?:one\s+|1\s+)?verse(?=\s|$)/g, /(?:^|\s)verse\s+before(?=\s|$)/g],
    nextChapter: /(?:^|\s)next\s+chapter(?=\s|$)/g,
    prevChapter: /(?:^|\s)(?:previous|prior|last)\s+chapter(?=\s|$)/g,
    nextWeak: new RegExp(`^${VOICE_FILLER}(?:next|next one|next please|forward)(?:\\s+please)?$`),
    prevWeak: new RegExp(`^${VOICE_FILLER}(?:previous|previous one|previous please|back|back one|go back|go back one|back please)(?:\\s+please)?$`)
};

function voiceCollect(re, s, pri, build, cands) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s)) !== null) {
        cands.push({ start: m.index, end: m.index + m[0].length, pri, intent: build(m) });
        if (m[0].length === 0) re.lastIndex++;
    }
}

// Finds a verse of the LOADED chapter that the preacher is reading aloud (4+ matching words in a row).
function voiceFindQuotedVerse(rawText) {
    if (!activeChapterVerses.length) return null;
    const spoken = String(rawText || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean).slice(-10);
    if (spoken.length < 5) return null;
    const tri = words => { const set = new Set(); for (let i = 0; i + 2 < words.length; i++) set.add(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]); return set; };
    const spokenTri = Array.from(tri(spoken));
    let best = null;
    activeChapterVerses.forEach(v => {
        const verseTri = tri(String(v.text || '').toLowerCase().replace(/<[^>]*>/g, ' ').replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean));
        let score = 0;
        spokenTri.forEach(t => { if (verseTri.has(t)) score++; });
        if (score < 2) return;
        const distance = Math.abs(v.verse - currentVerse);
        if (!best || score > best.score || (score === best.score && distance < best.distance)) best = { verse: v.verse, score, distance };
    });
    return best && best.verse !== currentVerse ? best.verse : null;
}

function interpretSpeech(raw, allowQuote) {
    const s = voiceNormalize(raw);
    if (!s) return null;
    const cands = [];

    VOICE_BOOK_ALIASES.forEach(({ id, re }) => voiceCollect(re, s, 5, m => ({
        type: 'ref', bookId: id, chapter: parseInt(m[1], 10), verse: parseInt(m[2] || m[3] || '1', 10), delay: 450
    }), cands));
    voiceCollect(VOICE_PATTERNS.chapter, s, 4, m => ({ type: 'chapter', chapter: parseInt(m[1], 10), verse: parseInt(m[2] || '1', 10), delay: 450 }), cands);
    voiceCollect(VOICE_PATTERNS.nextChapter, s, 4, () => ({ type: 'chapterStep', dir: 1, delay: 350 }), cands);
    voiceCollect(VOICE_PATTERNS.prevChapter, s, 4, () => ({ type: 'chapterStep', dir: -1, delay: 350 }), cands);
    voiceCollect(VOICE_PATTERNS.verse, s, 3, m => ({ type: 'verse', verse: parseInt(m[1], 10), delay: 350 }), cands);
    VOICE_PATTERNS.nextStrong.forEach(re => voiceCollect(re, s, 2, () => ({ type: 'next', dir: 1, delay: 0 }), cands));
    VOICE_PATTERNS.prevStrong.forEach(re => voiceCollect(re, s, 2, () => ({ type: 'prev', dir: -1, delay: 0 }), cands));
    if (VOICE_PATTERNS.nextWeak.test(s)) cands.push({ start: 0, end: s.length, pri: 1, intent: { type: 'next', dir: 1, delay: 550 } });
    if (VOICE_PATTERNS.prevWeak.test(s)) cands.push({ start: 0, end: s.length, pri: 1, intent: { type: 'prev', dir: -1, delay: 550 } });

    if (cands.length) {
        // The most recently spoken instruction wins; on a tie the more specific pattern (book+chapter+verse) wins.
        cands.sort((a, b) => (b.end - a.end) || (b.pri - a.pri) || (a.start - b.start));
        const intent = cands[0].intent;
        intent.sig = [intent.type, intent.bookId || '', intent.chapter || '', intent.verse || '', intent.dir || ''].join(':');
        return intent;
    }
    if (allowQuote) {
        const quotedVerse = voiceFindQuotedVerse(raw);
        if (quotedVerse) return { type: 'quote', verse: quotedVerse, sig: 'quote:' + quotedVerse, delay: 500 };
    }
    return null;
}

function setVoiceNote(message) {
    voiceActionNote = message;
    const track = document.getElementById('transcriptTrack');
    if (!track) return;
    const old = track.querySelector('.voice-action-note');
    if (old) old.remove();
    track.insertAdjacentHTML('beforeend', ` <span class="voice-action-note" style="color: var(--accent-success); font-weight:800;">▶ ${message}</span>`);
}

// Loads a chapter (if needed) and shows the verse. If the chapter doesn't exist (bad chapter number heard),
// everything is restored exactly as it was instead of leaving the verse list empty.
async function voiceGoToChapterVerse(bookCode, bookName, chapter, verse) {
    const isSameChapter = (bookCode === currentBookCode && chapter === currentChapter);
    if (!isSameChapter) {
        const previous = { code: currentBookCode, name: currentBookName, chapter: currentChapter, verse: currentVerse, verses: activeChapterVerses };
        currentBookCode = bookCode; currentBookName = bookName; currentChapter = chapter; currentVerse = verse;
        await fetchCurrentChapterFromAPI();
        if (activeChapterVerses === previous.verses) {
            currentBookCode = previous.code; currentBookName = previous.name; currentChapter = previous.chapter; currentVerse = previous.verse;
            renderVerseNavigationPanel();
            document.getElementById('statusDot').className = "status-dot active";
            document.getElementById('statusText').innerText = "System Connected";
            return false;
        }
    }
    if (!activeChapterVerses.some(v => v.verse === verse)) verse = activeChapterVerses[0] ? activeChapterVerses[0].verse : verse;
    forceTextVisibleOnDoubleClick();
    selectSpecificVerseCoordinate(verse);
    sendStagedToLiveView();
    return true;
}

async function executeVoiceIntent(intent) {
    if (voiceBusy) return;
    voiceBusy = true;
    try {
        switch (intent.type) {
            case 'next':
            case 'prev': {
                forceTextVisibleOnDoubleClick();
                const songTabActive = document.getElementById('lyrics-tab') && document.getElementById('lyrics-tab').classList.contains('active');
                if (songTabActive) { navigateSongSlide(intent.dir); }
                else { navigateSequentialOffsetVerses(intent.dir); sendStagedToLiveView(); }
                setVoiceNote(intent.dir > 0 ? 'Next verse' : 'Previous verse');
                break;
            }
            case 'verse': {
                if (!activeChapterVerses.some(v => v.verse === intent.verse)) { setVoiceNote(`Verse ${intent.verse} isn't in ${currentBookName} ${currentChapter}`); break; }
                forceTextVisibleOnDoubleClick();
                selectSpecificVerseCoordinate(intent.verse);
                sendStagedToLiveView();
                setVoiceNote(`Verse ${intent.verse}`);
                break;
            }
            case 'quote': {
                forceTextVisibleOnDoubleClick();
                selectSpecificVerseCoordinate(intent.verse);
                sendStagedToLiveView();
                setVoiceNote(`Following your reading — verse ${intent.verse}`);
                break;
            }
            case 'chapter':
            case 'chapterStep': {
                const targetChapter = intent.type === 'chapter' ? intent.chapter : currentChapter + intent.dir;
                if (targetChapter < 1) break;
                const ok = await voiceGoToChapterVerse(currentBookCode, currentBookName, targetChapter, intent.verse || 1);
                setVoiceNote(ok ? `${currentBookName} ${currentChapter}` : `Chapter ${targetChapter} not found in ${currentBookName}`);
                break;
            }
            case 'ref': {
                const bookName = cleanBookNames[intent.bookId];
                const ok = await voiceGoToChapterVerse(intent.bookId, bookName, intent.chapter, intent.verse);
                setVoiceNote(ok ? `${bookName} ${currentChapter}:${currentVerse}` : `${bookName} ${intent.chapter} not found`);
                break;
            }
        }
    } catch (err) {
        console.warn('Voice command failed:', err);
    } finally {
        voiceBusy = false;
    }
}

// Called for every speech-recognition update. Clear commands run instantly; anything that could still be
// changing mid-sentence (verse numbers, bare "next") waits a beat until the words settle — then fires once.
function processContinuousSpeechForScriptures(event) {
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternatives = [];
        for (let a = 0; a < result.length; a++) alternatives.push(result[a].transcript);

        let intent = null;
        for (const alt of alternatives) { intent = interpretSpeech(alt, false); if (intent) break; }   // commands & references: try every guess
        if (!intent && alternatives.length && !songTabIsActive()) intent = interpretSpeech(alternatives[0], true); // then: is the preacher reading the chapter?

        clearTimeout(voicePendingTimer);
        if (!intent) continue;
        if (voiceCommitted.utterance === i && voiceCommitted.sig === intent.sig) continue; // this sentence already acted on

        const run = () => { voiceCommitted = { utterance: i, sig: intent.sig }; executeVoiceIntent(intent); };
        if (result.isFinal || intent.delay <= 0) run();
        else voicePendingTimer = setTimeout(run, intent.delay);
    }
}

function songTabIsActive() {
    const tab = document.getElementById('lyrics-tab');
    return !!(tab && tab.classList.contains('active'));
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
            document.getElementById('freezeLiveBtn').addEventListener('click', () => {
                isLiveFrozen = !isLiveFrozen;
                const btn = document.getElementById('freezeLiveBtn');
                btn.classList.toggle('toggle-active', isLiveFrozen);
                btn.innerHTML = isLiveFrozen ? '🔒 Frozen (click to unfreeze)' : '❄ Freeze Live';
                document.body.classList.toggle('live-is-frozen', isLiveFrozen);
                if (!isLiveFrozen) renderPreview(); // flush whatever changed while frozen out to every output now
            });
            document.getElementById('sendToProjectorBtn').addEventListener('click', sendToProjectorAutoDetect);
            document.getElementById('enableExtendedDisplayBtn').addEventListener('click', enableExtendedDisplayDetection);
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
                previewState.announcementEffect = document.getElementById('announcementEffectSelector').value;
                previewState.announcementPosition = document.getElementById('announcementPositionSelector').value;
                previewState.announcementBgColor = document.getElementById('announcementColorPicker').value;
                document.getElementById('announcementEyeToggleBtn').classList.add('toggle-active');
                renderPreview();
            });

            document.getElementById('announcementEffectSelector').addEventListener('change', (e) => {
                previewState.announcementEffect = e.target.value;
                renderPreview();
            });
            document.getElementById('announcementPositionSelector').addEventListener('change', (e) => {
                previewState.announcementPosition = e.target.value;
                renderPreview();
            });
            document.getElementById('announcementColorPicker').addEventListener('input', (e) => {
                previewState.announcementBgColor = e.target.value;
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
                previewState.announcementEffect = "none";
                document.getElementById('announcementEyeToggleBtn').classList.remove('toggle-active');
                renderPreview();
            });

            document.getElementById('historyDropdown').addEventListener('change', () => {
                const idx = document.getElementById('historyDropdown').value;
                if(idx === "") return;
                const match = executionDisplayHistory[idx];
                if(match) {
                    previewState = { ...match };
                    liveState = previewState; // keep the single-scene link intact
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
                    document.getElementById('bgOpacitySlider').value = previewState.bgOpacity == null ? 100 : previewState.bgOpacity;
                    document.getElementById('bgOpacityValue').innerText = `${previewState.bgOpacity == null ? 100 : previewState.bgOpacity}%`;
                } else if (tabId === 'ribbon-message') {
                    document.getElementById('lowerThirdRoleInput').value = previewState.lowerThirdRole || '';
                    document.getElementById('lowerThirdNameInput').value = previewState.lowerThirdName || '';
                    document.getElementById('lowerThirdVisibleCheckbox').checked = !!previewState.lowerThirdVisible;
                }
            }
            document.querySelectorAll('.ribbon-tab-btn[data-ribbon-tab]').forEach(btn => {
                btn.addEventListener('click', () => switchRibbonTab(btn.dataset.ribbonTab));
            });

            // FILE MENU — dropdown, not a panel-switching tab
            document.getElementById('fileMenuTabBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('fileMenuDropdown').classList.toggle('open');
            });
            document.getElementById('fileMenuDropdown').addEventListener('click', (e) => { e.stopPropagation(); });
            document.addEventListener('click', () => { document.getElementById('fileMenuDropdown').classList.remove('open'); });

            document.getElementById('fileMenuNewBtn').addEventListener('click', () => {
                if (!confirm('Start a new session? Unsaved changes to the current scene will be lost.')) return;
                Object.assign(previewState, {
                    text: "", ref: "", flierId: "", textBgUrl: "", isScrolling: false,
                    announcementText: "", announcementVisible: false,
                    lowerThirdName: "", lowerThirdVisible: false
                });
                document.getElementById('fileMenuDropdown').classList.remove('open');
                renderPreview();
            });
            document.getElementById('fileMenuLyricsImportPicker').addEventListener('change', (e) => {
                document.getElementById('fileMenuDropdown').classList.remove('open');
                document.getElementById('lyricsFilePicker').files = e.target.files;
                document.getElementById('lyricsFilePicker').dispatchEvent(new Event('change'));
            });
            document.getElementById('fileMenuDuplicateBtn').addEventListener('click', () => {
                exportProfileToFile();
                document.getElementById('fileMenuDropdown').classList.remove('open');
            });
            document.getElementById('fileMenuDownloadBtn').addEventListener('click', () => {
                exportProfileToFile();
                document.getElementById('fileMenuDropdown').classList.remove('open');
            });
            document.getElementById('fileMenuRenameBtn').addEventListener('click', () => {
                const currentName = localStorage.getItem('ebp_session_name') || 'My Session';
                const newName = prompt('Session name:', currentName);
                if (newName) { try { localStorage.setItem('ebp_session_name', newName); } catch (e) {} }
                document.getElementById('fileMenuDropdown').classList.remove('open');
            });
            document.getElementById('fileMenuClearBtn').addEventListener('click', () => {
                if (!confirm('Clear ALL saved data (songs, names, hotkeys, theme, output slots)? This cannot be undone.')) return;
                try { localStorage.clear(); } catch (e) {}
                location.reload();
            });
            document.getElementById('fileMenuHistoryToggleBtn').addEventListener('click', () => {
                const panel = document.getElementById('ribbon-history-panel');
                panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
                document.getElementById('fileMenuDropdown').classList.remove('open');
            });
            document.getElementById('fileMenuDetailsBtn').addEventListener('click', () => {
                const savedSongsCount = (JSON.parse(localStorage.getItem('ebp_saved_songs') || '[]')).length;
                const savedNamesCount = (JSON.parse(localStorage.getItem('ebp_saved_names') || '[]')).length;
                alert(`Session: ${localStorage.getItem('ebp_session_name') || 'My Session'}\nBook: ${currentBookName} ${currentChapter}\nVersion: ${document.getElementById('versionSelector').value}\nSaved songs: ${savedSongsCount}\nSaved names: ${savedNamesCount}\nWorks fully offline: Yes`);
                document.getElementById('fileMenuDropdown').classList.remove('open');
            });
            document.getElementById('fileMenuSettingsBtn').addEventListener('click', () => {
                document.getElementById('settingsModal').style.display = 'flex';
                document.getElementById('fileMenuDropdown').classList.remove('open');
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

            // Media transport controls — act on every place the current media video is rendered
            // (Preview, Live, the OBS standalone canvas, and the OBS/NDI popup window) at once,
            // since every sink just mirrors the one shared master stream.
            function getActiveMasterVideoEl() {
                const url = (previewState.displayMode === 'media' && previewState.mediaKind === 'video' && previewState.mediaUrl) ? previewState.mediaUrl
                    : (liveState.displayMode === 'media' && liveState.mediaKind === 'video' && liveState.mediaUrl) ? liveState.mediaUrl : null;
                if (!url) return null;
                const entry = masterVideoRegistry.get(url);
                return entry ? entry.masterEl : null;
            }
            // Keep the media seek slider in sync with whichever media video is currently playing
            setInterval(() => {
                const master = getActiveMasterVideoEl();
                if (master && master.duration) {
                    document.getElementById('mediaSeekSlider').value = (master.currentTime / master.duration) * 100;
                }
            }, 500);

            const activeMediaMaster = () => getActiveMasterVideoEl();
            document.getElementById('mediaPlayPauseBtn').addEventListener('click', () => { const m = activeMediaMaster(); if (m) { if (m.paused) m.play(); else m.pause(); } });
            document.getElementById('mediaSkipBackBtn').addEventListener('click', () => { const m = activeMediaMaster(); if (m) m.currentTime = Math.max(0, m.currentTime - 10); });
            document.getElementById('mediaSkipFwdBtn').addEventListener('click', () => { const m = activeMediaMaster(); if (m) m.currentTime = Math.min(m.duration || m.currentTime + 10, m.currentTime + 10); });
            document.getElementById('mediaSeekSlider').addEventListener('input', (e) => { const m = activeMediaMaster(); if (m && m.duration) m.currentTime = (parseFloat(e.target.value) / 100) * m.duration; });

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
                            switchToTextDisplay();
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

            document.getElementById('liveCanvas').addEventListener('wheel', (e) => {
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

        // Explains WHY voice can't work here, instead of failing silently.
        function getVoiceEnvironmentProblem() {
            if (!(window.SpeechRecognition || window.webkitSpeechRecognition) || !recognition) {
                return "Live Voice needs the Web Speech API, which only Chrome and Edge provide. Embedded browsers (OBS docks / Browser Sources, vMix web pages) don't include it — run Live Voice in a normal Chrome/Edge tab and use OBS only for the output.";
            }
            if (!window.isSecureContext) {
                return "The microphone is blocked on insecure pages. Open this app from https:// or http://localhost (an http://192.168.x.x address does not count), then try again.";
            }
            if (!navigator.onLine) return "Live Voice uses the browser's online speech service — you appear to be offline.";
            return '';
        }

        function toggleListening() {
            const btn = document.getElementById('listeningBtn');
            const dot = document.getElementById('statusDot');
            const txt = document.getElementById('statusText');
            const track = document.getElementById('transcriptTrack');

            if (!isListening) {
                const voiceProblem = getVoiceEnvironmentProblem();
                if (voiceProblem) { track.innerText = voiceProblem; txt.innerText = "Live Voice unavailable"; return; }
                try { recognition.start(); } catch(e) { track.innerText = 'Could not start voice recognition: ' + (e.message || e); }
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

        // Shared HTML template used by every independent output window (OBS popup + any Stage/Monitor outputs)
        function bindOutputResizeRefit(win, containerId, getState) {
            let timer = null;
            win.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(() => renderIntoOutputWindow(win, containerId, getState()), 120); });
        }

        function buildOutputWindowDocument(titleText, canvasElementId) {
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${titleText}</title>
                    <style>
                        body, html { margin:0; padding:0; overflow:hidden; background-color:#000; width:100%; height:100%; display:flex; justify-content:center; align-items:center; }
                        :root { --canvas-font-size: 34px; --accent-primary: #38bdf8; }
                        .display-canvas { width:min(100vw, calc(100vh * 2752 / 1536)); aspect-ratio: 2752 / 1536; display:flex; flex-direction:column; box-sizing:border-box; background-size:cover; background-position:center; background-repeat:no-repeat; position:relative; overflow:hidden; font-family: system-ui, sans-serif; color:#ffffff; container-type: inline-size; margin: auto; box-shadow: 0 0 60px rgba(0,0,0,0.9); }
                        .display-canvas.size-small { --canvas-font-size: 3.2cqw; }
                        .display-canvas.size-medium { --canvas-font-size: 4.8cqw; }
                        .display-canvas.size-large { --canvas-font-size: 6.4cqw; }
                        .display-canvas.size-xlarge { --canvas-font-size: 8.2cqw; }
                        .text-display-box-container { position: relative; padding: 1.5% 4%; border-radius:8px; z-index:4; width:100%; box-sizing:border-box; display: flex; align-items: center; justify-content: center; max-height: 92%; }
                        .text-display-box-container::before { content:''; position:absolute; inset:0; border-radius:inherit; background-image: var(--box-bg-image, none); background-size:cover; background-position:center; background-repeat:no-repeat; opacity: var(--box-bg-opacity, 1); z-index:-1; }
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
                        .canvas-video-bg-node { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1; pointer-events: none; }
                        .media-layer-node { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 3; background: #000; pointer-events: none; object-fit: contain; }
                        .canvas-video-bg-node.media-layer-node { z-index: 3; }
                        .text-out.gradient-glow-active { background: linear-gradient(180deg, #ffffff 0%, var(--dynamic-text-color, #38bdf8) 58%, var(--dynamic-text-color, #38bdf8) 100%); -webkit-background-clip: text; background-clip: text; color: transparent !important; filter: drop-shadow(0 0 10px var(--dynamic-text-color, #38bdf8)) drop-shadow(0 0 22px var(--dynamic-text-color, #38bdf8)); }
                        .text-display-box-container.backing-panel-active { background-color: rgba(2, 6, 15, 0.55) !important; backdrop-filter: blur(2px); }
                        .canvas-namebar-node { position: absolute; left: 4%; bottom: 5%; z-index: 7; display: none; align-items: stretch; border-radius: 6px; overflow: hidden; box-shadow: 0 8px 22px rgba(0,0,0,0.6); }
                        .canvas-namebar-node.namebar-visible { display: flex; }
                        .canvas-namebar-node .namebar-role { background: var(--accent-primary, #38bdf8); color: #04121e; font-weight: 900; font-size: calc(var(--canvas-font-size) * 0.28); text-transform: uppercase; letter-spacing: 0.04em; padding: 0.35em 0.7em; display: flex; align-items: center; white-space: nowrap; }
                        .canvas-namebar-node .namebar-name { background: rgba(4, 10, 20, 0.88); color: #ffffff; font-weight: 800; font-size: calc(var(--canvas-font-size) * 0.32); padding: 0.35em 0.9em; display: flex; align-items: center; white-space: nowrap; }
                        .canvas-announcement-banner { display: none; position: absolute; left: 0; right: 0; z-index: 8; color: #fff8e7; font-weight: 800; font-size: calc(var(--canvas-font-size) * 0.32); padding: 0.5em 1em; text-align: center; text-shadow: 0 2px 6px rgba(0,0,0,0.8); box-shadow: 0 -6px 16px rgba(0,0,0,0.4); overflow: hidden; white-space: nowrap; }
                        .canvas-announcement-banner.announcement-visible { display: block; }
                        .canvas-announcement-banner.announcement-pos-bottom { bottom: 0; top: auto; }
                        .canvas-announcement-banner.announcement-pos-top { top: 0; bottom: auto; box-shadow: 0 6px 16px rgba(0,0,0,0.4); }
                        .canvas-announcement-banner.announcement-pos-center { top: 50%; bottom: auto; transform: translateY(-50%); box-shadow: 0 0 24px rgba(0,0,0,0.5); border-radius: 8px; margin: 0 4%; width: auto; left: 4%; right: 4%; }
                        @keyframes announcementBreathing { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
                        @keyframes announcementFadeInOut { 0%, 100% { opacity: 0; } 15%, 85% { opacity: 1; } }
                        .canvas-announcement-banner.announcement-effect-breathing { animation: announcementBreathing 2.4s ease-in-out infinite; }
                        .canvas-announcement-banner.announcement-effect-fade { animation: announcementFadeInOut 4s ease-in-out infinite; }
                    </style>
                </head>
                <body>
                    <div id="${canvasElementId}" class="display-canvas mode-center size-medium"></div>
                    <div id="fsHint" style="position:fixed; bottom:16px; left:50%; transform:translateX(-50%); z-index:99999; background:rgba(0,0,0,0.78); color:#fff; font:600 14px system-ui,sans-serif; padding:8px 18px; border-radius:20px; cursor:pointer; transition:opacity 0.5s;">⛶ Click anywhere (or press F) for fullscreen · Esc to exit</div>
                    <script>
                    (function () {
                        var hint = document.getElementById('fsHint'), idleTimer = null;
                        function enter() { var el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) { el.requestFullscreen().catch(function () {}); } }
                        function sync() { var on = !!document.fullscreenElement; hint.style.opacity = on ? '0' : '1'; document.body.style.cursor = on ? 'none' : 'default'; }
                        document.addEventListener('fullscreenchange', sync);
                        document.addEventListener('click', enter);
                        document.addEventListener('dblclick', function () { if (document.fullscreenElement) document.exitFullscreen(); });
                        document.addEventListener('keydown', function (e) { if (e.key === 'f' || e.key === 'F' || e.key === 'F11') { e.preventDefault(); if (document.fullscreenElement) document.exitFullscreen(); else enter(); } });
                        document.addEventListener('mousemove', function () { if (!document.fullscreenElement) return; document.body.style.cursor = 'default'; clearTimeout(idleTimer); idleTimer = setTimeout(function () { document.body.style.cursor = 'none'; }, 2000); });
                        setTimeout(function () { if (!document.fullscreenElement) hint.style.opacity = '0'; }, 9000);
                    })();
                    </script>
                </body>
                </html>
            `;
        }

        // DIRECT PROJECTOR OUTPUT — this is the single output window used both for HDMI/extended-display
        // projection AND as the window OBS/NDI Screen Capture should point at (see Settings -> NDI Output).
        // Once your PC's second screen is extended (Windows/Mac "Extend displays"), the OS already routes
        // anything shown on that screen out through its HDMI/wireless-display port — a browser can't skip
        // that step, no application can. What this DOES do differently from a plain browser tab: it
        // detects the extended screen automatically, opens borderless and already positioned there (never
        // visible on your main screen), and snaps to fullscreen immediately, so there's nothing to drag.
        let projectorWindowRef = null;
        let cachedScreenDetailsHandle = null; // set once permission is granted, reused so later clicks need no extra prompt/await

        async function enableExtendedDisplayDetection() {
            const statusEl = document.getElementById('projectorConnectionStatus');
            if (window.desktopBridge) {
                const displays = await window.desktopBridge.listDisplays();
                const extended = displays.find(d => !d.isPrimary);
                if (statusEl) statusEl.innerText = extended ? `Ready — ${extended.label} detected` : 'Ready — only one screen detected. Extend your display to add a second.';
                return true;
            }
            if (!('getScreenDetails' in window)) {
                if (statusEl) statusEl.innerText = '⚠ This browser (Firefox/Safari) can\'t auto-detect screens — use "Send to Projector" anyway, then drag + press F11 once.';
                return false;
            }
            try {
                cachedScreenDetailsHandle = await window.getScreenDetails();
                cachedScreenDetailsHandle.addEventListener('screenschange', updateProjectorConnectionStatusText);
                updateProjectorConnectionStatusText();
                return true;
            } catch (err) {
                if (statusEl) statusEl.innerText = '⚠ Screen access wasn\'t granted — click "Enable Extended Display Detection" and allow it.';
                return false;
            }
        }

        function updateProjectorConnectionStatusText() {
            const statusEl = document.getElementById('projectorConnectionStatus');
            if (!statusEl) return;
            if (!cachedScreenDetailsHandle) { statusEl.innerText = 'Not connected'; return; }
            const extendedScreen = cachedScreenDetailsHandle.screens.find(s => !s.isPrimary);
            if (projectorWindowRef && !projectorWindowRef.closed) {
                statusEl.innerText = extendedScreen
                    ? `● Live — fullscreen on your extended screen (${extendedScreen.width}x${extendedScreen.height})`
                    : '● Live — fullscreen (only one screen detected; extend your display for a true second-screen output)';
            } else {
                statusEl.innerText = extendedScreen
                    ? `Ready — extended screen detected (${extendedScreen.width}x${extendedScreen.height})`
                    : 'Ready — but no second screen detected yet. Extend your display, then click "Detect" again.';
            }
        }

        // ONE-CLICK PROJECTOR: shows Live fullscreen on the extended screen immediately —
        // no manual window dragging, no visible popup on your main screen, and always mirrors
        // Live exactly (same feed as Send Live), so it's inherently in sync.
        async function sendToProjectorAutoDetect() {
            const statusEl = document.getElementById('projectorConnectionStatus');

            // DESKTOP APP PATH: when running inside the Electron companion app, use its native,
            // prompt-free screen detection instead of the browser's Window Management API —
            // more reliable, and works on every OS the desktop app runs on.
            if (window.desktopBridge) {
                const displays = await window.desktopBridge.listDisplays();
                const extended = displays.find(d => !d.isPrimary) || displays[0];
                if (!extended) { if (statusEl) statusEl.innerText = 'No displays detected.'; return; }
                await window.desktopBridge.openOutputOnDisplay(extended.id);
                if (statusEl) statusEl.innerText = `● Live — fullscreen on ${extended.label}`;
                return;
            }

            if (projectorWindowRef && !projectorWindowRef.closed) {
                // Already running — a second click disconnects it, like toggling a real projector output off
                projectorWindowRef.close();
                projectorWindowRef = null;
                updateProjectorConnectionStatusText();
                return;
            }

            let bounds = null;
            if (cachedScreenDetailsHandle) {
                // Permission already granted earlier — no await needed here, so the click's user-gesture
                // is still valid by the time we call requestFullscreen() below.
                const extendedScreen = cachedScreenDetailsHandle.screens.find(s => !s.isPrimary);
                if (extendedScreen) bounds = { left: extendedScreen.left, top: extendedScreen.top, width: extendedScreen.width, height: extendedScreen.height };
            }

            if (!bounds) {
                // No cached permission yet — ask now. This first click may not auto-fullscreen because of
                // the async prompt, but every click after this one will, since the screen list is now cached.
                const granted = await enableExtendedDisplayDetection();
                if (granted && cachedScreenDetailsHandle) {
                    const extendedScreen = cachedScreenDetailsHandle.screens.find(s => !s.isPrimary);
                    if (extendedScreen) bounds = { left: extendedScreen.left, top: extendedScreen.top, width: extendedScreen.width, height: extendedScreen.height };
                }
            }

            const features = bounds
                ? `left=${bounds.left},top=${bounds.top},width=${bounds.width},height=${bounds.height},scrollbars=no,menubar=no,toolbar=no,location=no,status=no`
                : "width=1280,height=720,scrollbars=no,menubar=no,toolbar=no,location=no,status=no";

            projectorWindowRef = window.open("", "EBP_Direct_Projector_Output", features);
            if (!projectorWindowRef) { alert('Pop-up blocked. Please allow pop-ups for this page, then click "Send to Projector" again.'); return; }
            projectorWindowRef.document.open();
            projectorWindowRef.document.write(buildOutputWindowDocument("Express Bible Presenter — Projector (fullscreen)", "directProjectorCanvas"));
            projectorWindowRef.document.close();
            renderIntoOutputWindow(projectorWindowRef, "directProjectorCanvas", liveState);
            bindOutputResizeRefit(projectorWindowRef, "directProjectorCanvas", () => liveState);

            if (bounds) {
                try {
                    const rootEl = projectorWindowRef.document.documentElement;
                    if (rootEl && rootEl.requestFullscreen) await rootEl.requestFullscreen();
                } catch (e) {
                    if (statusEl) statusEl.innerText = 'Projector opened on the extended screen — click once inside it (or press F) to go true fullscreen (hides the browser bar).';
                }
            } else if (statusEl) {
                statusEl.innerText = 'Opened without a detected second screen — drag it onto your projector display, then click once inside it (or press F) for fullscreen.';
            }

            projectorWindowRef.addEventListener('beforeunload', () => { projectorWindowRef = null; updateProjectorConnectionStatusText(); });
            updateProjectorConnectionStatusText();
        }

        function syncLiveStateToRemoteChannels() {
            // Channel 1: BroadcastChannel (Instant Offline Sync)
            const stateSync = { liveState: liveState, cachedLogoDataUrl: cachedLogoDataUrl };
            obsBroadcastChannel.postMessage({ type: "SYSTEM_SYNC_STATE", ...stateSync });

            // Channel 2: Remote WebRTC connections
            activeRemoteDataConnections.forEach(conn => {
                if (conn.open) conn.send({ type: "SYSTEM_SYNC_STATE", ...stateSync });
            });

            // Channel 3: LocalStorage updates (reliable crossover inside same-machine docks/tabs)
            try { localStorage.setItem('ebp_live_sync_state', JSON.stringify({ type: "SYSTEM_SYNC_STATE", ...stateSync })); } catch (e) {}
        }

        function displayPanelFallbackNotice(msg) {
            document.getElementById('statusDot').className = "status-dot";
            document.getElementById('statusText').innerText = "Data Void";
            document.getElementById('verseGridDeck').innerHTML = `<div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.9rem; font-style:italic;">${msg}</div>`;
        }

        // ===================== MULTI-OUTPUT SYSTEM (Stage Screen / Stage Monitor / any extra screen) =====================
        // Renders an arbitrary state object (Live or Preview) into any independent output window —
        // this is what lets you send DIFFERENT content to DIFFERENT physical screens at the same time
        // (e.g. Stage Screen shows Live scripture, while a Stage Monitor shows the upcoming Preview slide).
        function renderIntoOutputWindow(win, containerId, stateObject) {
            if (!win || win.closed) return;
            const targetDoc = win.document;
            const container = targetDoc.getElementById(containerId);
            if (!container) return;

            const existingVideoEl = container.querySelector('.canvas-video-bg-node:not(.media-layer-node)');
            const existingMediaEl = container.querySelector('video.media-layer-node');

            const customFontFamily = document.getElementById('fontStyleOverrideSelector').value;
            const customShadow = document.getElementById('textShadowSelector').value;
            const isTextBold = document.getElementById('fontBoldToggleBtn').classList.contains('toggle-active');
            const isTextItalic = document.getElementById('fontItalicToggleBtn').classList.contains('toggle-active');
            const customFontWeight = isTextBold ? '900' : '400';
            const customFontStyle = isTextItalic ? 'italic' : 'normal';
            const bgOpacity = stateObject.bgOpacity == null ? 100 : stateObject.bgOpacity;

            container.className = `display-canvas ${stateObject.layout} size-${stateObject.fontSize}`;
            container.style.fontFamily = customFontFamily;
            container.style.backgroundImage = 'none';
            container.style.backgroundColor = stateObject.bgTransparent ? 'transparent' : hexToRgbaWithOpacity(stateObject.bgColor, bgOpacity);
            const outContentSig = computeSceneContentSig(stateObject);
            const outContentChanged = container.dataset.contentSig !== outContentSig;
            container.dataset.contentSig = outContentSig;
            const outTransitionClass = outContentChanged ? getDisplayTransitionClass() : '';
            const outReusableLayers = takeReusableLayers(container);
            container.style.transition = outTransitionClass ? 'background-color 0.5s ease' : 'none';

            let contentNode = stateObject.text || '';
            if (stateObject.isScrolling && stateObject.text) {
                contentNode = `<div class="ticker-wrapper"><div class="ticker-text">${contentNode}</div></div>`;
            }

            const boxBgStyleString = stateObject.textBgUrl ? `--box-bg-image: url('${stateObject.textBgUrl}'); --box-bg-opacity: ${bgOpacity / 100};` : '--box-bg-image: none;';
            const textHiddenClass = (stateObject.timerVisible && stateObject.timerSolo) ? 'display: none !important;' : '';
            const flierOnlyTextHide = (stateObject.layout === 'mode-flieronly' || (stateObject.displayMode === 'media' && stateObject.mediaUrl)) ? 'display: none !important;' : '';
            const videoAloneHide = ''; // Video BG feature removed — Media tab now covers full-screen video
            const autoFontScale = 1;
            const gradientGlowClass = stateObject.gradientGlowText ? 'gradient-glow-active' : '';
            const dynamicColorVar = `--dynamic-text-color: ${stateObject.textColor || '#38bdf8'};`;
            const backingPanelClass = stateObject.textBackingPanel ? 'backing-panel-active' : '';

            const nameBarVisible = stateObject.lowerThirdVisible && (stateObject.lowerThirdName || stateObject.lowerThirdRole);
            const nameBarHtml = `
                <div class="canvas-namebar-node ${nameBarVisible ? 'namebar-visible' : ''}" style="${videoAloneHide}">
                    <div class="namebar-role">${stateObject.lowerThirdRole || ''}</div>
                    <div class="namebar-name" style="color: ${stateObject.lowerThirdColor || '#ffffff'};">${stateObject.lowerThirdName || ''}</div>
                </div>
            `;

            const announcementActive = stateObject.announcementVisible && stateObject.announcementText;
            const announcementEffect = stateObject.announcementEffect || 'none';
            const announcementInner = announcementEffect === 'scroll'
                ? `<div class="ticker-wrapper"><div class="ticker-text">${stateObject.announcementText || ''}</div></div>`
                : (stateObject.announcementText || '');
            const announcementPosClass = `announcement-pos-${stateObject.announcementPosition || 'bottom'}`;
            const announcementEffectClass = announcementEffect !== 'none' && announcementEffect !== 'scroll' ? `announcement-effect-${announcementEffect}` : '';
            const announcementHtml = `
                <div class="canvas-announcement-banner ${announcementActive ? 'announcement-visible' : ''} ${announcementPosClass} ${announcementEffectClass}" style="${videoAloneHide} background: ${stateObject.announcementBgColor || '#b45309'};">${announcementInner}</div>
            `;

            container.innerHTML = `
                <div class="text-display-box-container ${outTransitionClass} ${backingPanelClass}" style="${boxBgStyleString} ${textHiddenClass} ${flierOnlyTextHide} ${videoAloneHide}">
                    <div class="text-out ${gradientGlowClass}" style="width:100%; ${dynamicColorVar} color: ${stateObject.textColor || '#ffffff'}; text-shadow: ${customShadow}; font-size: calc(var(--canvas-font-size) * ${autoFontScale}); font-family: ${customFontFamily}; font-weight: ${customFontWeight}; font-style: ${customFontStyle};">${contentNode}</div>
                </div>
                <div class="ref-out ${outTransitionClass}" style="${textHiddenClass} ${flierOnlyTextHide} ${videoAloneHide} text-shadow: ${customShadow}; font-family: ${customFontFamily}; ${stateObject.refColor ? `color: ${stateObject.refColor};` : ''}">${stateObject.ref || ''}</div>
                <div class="canvas-timer-node" id="${containerId}OverlayTimer">00:00</div>
                ${nameBarHtml}
                ${announcementHtml}
            `;

            restoreAnnouncementBanner(container, outReusableLayers, announcementHtml.trim());

            autoFitVerseText(container);

            const innerTimer = container.querySelector(`#${containerId}OverlayTimer`);
            if (innerTimer) {
                innerTimer.className = `canvas-timer-node ${stateObject.timerPosition} ${stateObject.timerSize} ${stateObject.timerVisible ? 'timer-visible' : ''}`;
                innerTimer.innerText = stateObject.timerText || "00:00";
                const originStr = stateObject.timerPosition === 'timer-center' ? 'center' : (stateObject.timerPosition.includes('left') ? 'left' : 'right');
                innerTimer.style.transformOrigin = originStr;
                innerTimer.style.transform = `${stateObject.timerPosition === 'timer-center' ? 'translate(-50%, -50%)' : ''} scale(${stateObject.timerScale || 1.0})`;
            }

            if (stateObject.flierId) {
                const asset = importedAssetsLibrary.find(a => a.id === stateObject.flierId);
                if (asset) {
                    const { node: flierLayer, reused: flierReused } = layerFromCache(outReusableLayers, 'flier:' + asset.id, () => {
                        const el = targetDoc.createElement('div');
                        el.style.backgroundImage = `url('${asset.dataUrl}')`;
                        return el;
                    });
                    flierLayer.className = `flier-graphic-layer ${flierReused ? '' : outTransitionClass}`;
                    flierLayer.style.opacity = bgOpacity / 100;
                    container.appendChild(flierLayer);
                    if (!flierReused && outTransitionClass) flierLayer.addEventListener('animationend', () => { flierLayer.style.opacity = bgOpacity / 100; }, { once: true });
                }
            } else if (stateObject.layout === 'mode-flieronly') {
                const placeholderLayer = targetDoc.createElement('div');
                placeholderLayer.className = `flier-graphic-layer ${outTransitionClass}`;
                placeholderLayer.innerHTML = `<div class="placeholder-text">[ Flier Only Mode - No Image Selected ]</div>`;
                container.appendChild(placeholderLayer);
            }

            attachMediaLayer(container, targetDoc, stateObject, existingMediaEl, outReusableLayers);

            if (cachedLogoDataUrl && stateObject.logoPosition) {
                const { node: logoImg } = layerFromCache(outReusableLayers, 'logo:' + cachedLogoDataUrl.length + ':' + cachedLogoDataUrl.slice(-32), () => { const el = targetDoc.createElement('img'); el.src = cachedLogoDataUrl; return el; });
                const logoSizeValue = stateObject.logoSize || 6;
                logoImg.className = `canvas-logo-node ${stateObject.logoPosition}`;
                logoImg.style.width = `${logoSizeValue}%`;
                logoImg.style.height = `${logoSizeValue * 1.5}%`;
                container.appendChild(logoImg);
            }
        }

        // Output slot registry — each slot is an independent window you can drag to any monitor
        // (HDMI, wireless-extended display, or captured by NDI Screen Capture) and assign to show
        // either the Live output or the Preview (next-up) content, completely independent of the other.
        let outputSlots = [];
        try {
            const savedSlots = JSON.parse(localStorage.getItem('ebp_output_slots_config') || 'null');
            if (Array.isArray(savedSlots) && savedSlots.length) {
                outputSlots = savedSlots.map(s => ({ ...s, windowRef: null }));
            }
        } catch (e) {}
        if (!outputSlots.length) {
            outputSlots = [
                { id: 'slot_stage_screen', name: 'Stage Screen', sourceMode: 'live', windowRef: null },
                { id: 'slot_stage_monitor', name: 'Stage Monitor', sourceMode: 'preview', windowRef: null }
            ];
        }

        function persistOutputSlotsConfig() {
            try {
                const toSave = outputSlots.map(({ windowRef, ...rest }) => rest);
                localStorage.setItem('ebp_output_slots_config', JSON.stringify(toSave));
            } catch (e) {}
        }

        function renderOutputSlot(slot) {
            if (!slot.windowRef || slot.windowRef.closed) return;
            const stateObject = slot.sourceMode === 'preview' ? previewState : liveState;
            renderIntoOutputWindow(slot.windowRef, 'outputCanvas', stateObject);
        }

        function renderAllOutputSlots() {
            outputSlots.forEach(renderOutputSlot);
        }

        async function openOutputSlotWindow(slotId, screenDetails) {
            const slot = outputSlots.find(s => s.id === slotId);
            if (!slot) return;
            if (slot.windowRef && !slot.windowRef.closed) { slot.windowRef.focus(); return; }

            let windowFeatures = "width=1280,height=720,scrollbars=no,menubar=no,toolbar=no,location=no,status=no";
            if (screenDetails) {
                windowFeatures = `left=${screenDetails.left},top=${screenDetails.top},width=${screenDetails.width},height=${screenDetails.height},scrollbars=no,menubar=no,toolbar=no,location=no,status=no`;
            }

            const winName = 'EBP_Output_' + slot.id;
            slot.windowRef = window.open("", winName, windowFeatures);
            if (!slot.windowRef) { alert('Pop-up blocked. Please allow pop-ups for this page and try again.'); return; }
            slot.windowRef.document.open();
            slot.windowRef.document.write(buildOutputWindowDocument(`Express Bible Presenter — ${slot.name}`, 'outputCanvas'));
            slot.windowRef.document.close();
            renderOutputSlot(slot);
            bindOutputResizeRefit(slot.windowRef, 'outputCanvas', () => slot.sourceMode === 'preview' ? previewState : liveState);

            if (screenDetails) {
                setTimeout(() => {
                    try {
                        slot.windowRef.moveTo(screenDetails.left, screenDetails.top);
                        slot.windowRef.resizeTo(screenDetails.width, screenDetails.height);
                    } catch (e) {}
                }, 200);
            }
        }

        function renderOutputSlotsList() {
            const listEl = document.getElementById('outputSlotsList');
            if (!listEl) return;
            listEl.innerHTML = '';
            outputSlots.forEach(slot => {
                const row = document.createElement('div');
                row.className = 'hotkey-row';
                row.innerHTML = `
                    <div style="display:flex; align-items:center; gap:0.5rem; flex:1;">
                        <input type="text" class="output-slot-name-input" data-id="${slot.id}" value="${slot.name}" style="padding:0.35rem 0.5rem; font-size:0.78rem; width:130px;">
                        <select class="output-slot-source-select" data-id="${slot.id}" style="padding:0.35rem; font-size:0.75rem;">
                            <option value="live" ${slot.sourceMode === 'live' ? 'selected' : ''}>Live Output</option>
                            <option value="preview" ${slot.sourceMode === 'preview' ? 'selected' : ''}>Preview (Next Up)</option>
                        </select>
                    </div>
                    <div class="hotkey-row-controls">
                        <button class="btn output-slot-open-btn" data-id="${slot.id}" style="padding: 0.3rem 0.6rem; font-size: 0.7rem; background:#0369a1; border-color:#0284c7;">Open Window</button>
                        <button class="btn output-slot-delete-btn" data-id="${slot.id}" style="padding: 0.3rem 0.6rem; font-size: 0.7rem; background:#7f1d1d; border-color:#991b1b;">Delete</button>
                    </div>
                `;
                listEl.appendChild(row);
            });

            listEl.querySelectorAll('.output-slot-name-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const slot = outputSlots.find(s => s.id === e.target.dataset.id);
                    if (slot) { slot.name = e.target.value; persistOutputSlotsConfig(); }
                });
            });
            listEl.querySelectorAll('.output-slot-source-select').forEach(sel => {
                sel.addEventListener('change', (e) => {
                    const slot = outputSlots.find(s => s.id === e.target.dataset.id);
                    if (slot) { slot.sourceMode = e.target.value; persistOutputSlotsConfig(); renderOutputSlot(slot); }
                });
            });
            listEl.querySelectorAll('.output-slot-open-btn').forEach(btn => {
                btn.addEventListener('click', () => openOutputSlotWindow(btn.dataset.id));
            });
            listEl.querySelectorAll('.output-slot-delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const slot = outputSlots.find(s => s.id === btn.dataset.id);
                    if (slot && slot.windowRef && !slot.windowRef.closed) slot.windowRef.close();
                    outputSlots = outputSlots.filter(s => s.id !== btn.dataset.id);
                    persistOutputSlotsConfig();
                    renderOutputSlotsList();
                });
            });
        }

        async function detectAndListScreens() {
            const screenPickerEl = document.getElementById('outputScreenPicker');
            if (!screenPickerEl) return;
            if (!('getScreenDetails' in window)) {
                screenPickerEl.innerHTML = '<p style="font-size:0.72rem; color: var(--text-muted);">Your browser doesn\'t support automatic screen detection (this works in Chrome/Edge). Just use "Open Window" above, then drag the new window onto your other monitor and press F11 for fullscreen — works the same either way.</p>';
                return;
            }
            try {
                const screenDetails = await window.getScreenDetails();
                screenPickerEl.innerHTML = '<label style="font-size:0.65rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Open a slot directly on a detected screen:</label>';
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; gap:0.4rem; flex-wrap:wrap; margin-top:0.4rem;';
                screenDetails.screens.forEach((scr, idx) => {
                    screenSlotButtonsForEachOutputSlot(row, scr, idx);
                });
                screenPickerEl.appendChild(row);
            } catch (err) {
                screenPickerEl.innerHTML = `<p style="font-size:0.72rem; color: var(--text-muted);">Screen access wasn't granted (${err.message || err}). You can still use "Open Window" above and drag it to the target monitor manually.</p>`;
            }
        }

        function screenSlotButtonsForEachOutputSlot(container, scr, screenIdx) {
            outputSlots.forEach(slot => {
                const btn = document.createElement('button');
                btn.className = 'btn';
                btn.style.cssText = 'padding: 0.35rem 0.6rem; font-size: 0.72rem; background:#166534; border-color:#15803d;';
                btn.innerText = `${slot.name} → Screen ${screenIdx + 1}${scr.isPrimary ? ' (Primary)' : ''}`;
                btn.addEventListener('click', () => {
                    openOutputSlotWindow(slot.id, { left: scr.left, top: scr.top, width: scr.width, height: scr.height });
                });
                container.appendChild(btn);
            });
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
                    // Single scene now: load whichever saved state has content (older exported
                    // profiles may still have separate preview/live states) into the one shared object.
                    const restoredState = importedData.savedLiveState && importedData.savedLiveState.text
                        ? importedData.savedLiveState
                        : (importedData.savedPreviewState || importedData.savedLiveState || previewState);
                    Object.assign(previewState, restoredState);
                    liveState = previewState;
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
