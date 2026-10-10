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
            text: "", ref: "", layout: "mode-center", lowerThirdPosition: "bottom", fontSize: "medium", bgColor: "#0f172a", textColor: "#ffffff",
            fontFamilyOverride: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontBold: false, fontItalic: false,
            textShadowStyle: "0 4px 12px rgba(0,0,0,0.98)", textNudgeX: 0, textNudgeY: 0,
            flierId: "", textBgUrl: "", isScrolling: false, logoPosition: "", logoSize: 6,
            timerVisible: false, timerSolo: false, timerText: "05:00", timerPosition: "timer-top-right", timerSize: "timer-size-medium",
            timerScale: 1.0,
            bgOpacity: 100, textBackingPanel: false, gradientGlowText: false,
            lowerThirdName: "", lowerThirdRole: "Ministering", lowerThirdVisible: false,
            refColor: "", refVisible: true, lowerThirdColor: "#ffffff",
            announcementText: "", announcementVisible: false, announcementEffect: "none", announcementPosition: "bottom", announcementBgColor: "#b45309",
            bgTransparent: false,
            displayMode: "text", mediaUrl: "", mediaKind: "", mediaName: "", mediaFit: "contain",
            mediaPdfId: "", mediaPdfPage: 1, mediaPdfPageCount: 0,
            bgPreset: ""
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
                document.documentElement.classList.add('obs-html');
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
            initOutputsBar();
            try { initLowerThirdTemplates(); } catch (e) { console.warn(e); }
            try { initNameTagOverlay(); } catch (e) { console.warn(e); }
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
                cachedLogoDataUrl: cachedLogoDataUrl,
                overlay: (typeof ovPayload === 'function') ? ovPayload() : undefined
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

            const meterBars = Array.from(document.querySelectorAll('.signal-bar'));
            let lastMeterLevel = -1, lastFrameTime = 0;
            function loop(now) {
                spectrumAnimId = requestAnimationFrame(loop);
                if (now - lastFrameTime < 33) return; // ~30 fps is plenty for a level meter
                lastFrameTime = now;
                audioAnalyser.getByteFrequencyData(dataFrequencyArray);

                let accum = 0;
                for (let idx = 0; idx < dataFrequencyArray.length; idx++) {
                    accum += dataFrequencyArray[idx];
                }
                let realTimeAmplitudeAvg = accum / dataFrequencyArray.length;
                let activeBarLevels = Math.min(8, Math.floor(realTimeAmplitudeAvg / 10)); 

                const dynamicBars = meterBars;
                if (activeBarLevels !== lastMeterLevel) dynamicBars.forEach((barElement, currentBarIdx) => {
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
                lastMeterLevel = activeBarLevels;

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
            loop(performance.now());
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
                let data;
                if (blibIsLocal(currentTranslation)) {
                    data = await blibSearch(currentTranslation, query); // downloaded Bibles are searched on this device
                } else {
                    const searchUrl = `https://bolls.life/v2/find/${currentTranslation}?search=${encodeURIComponent(query)}&match_case=false&match_whole=false&limit=40&page=1`;
                    const response = await fetch(searchUrl);
                    if (!response.ok) throw new Error("Database network failure");
                    data = await response.json();
                }
                if (data && data.results && data.results.length > 0) {
                    counterText.innerText = `Found ${data.total} matches`;
                    resultContainer.innerHTML = "";

                    data.results.forEach(res => {
                        const bookName = cleanBookNames[res.book] || `Book ${res.book}`;
                        const locationRef = `${blibBookName(res.book, bookName)} ${res.chapter}:${res.verse}`;

                        const row = document.createElement('div');
                        row.className = "verse-row";
                        row.style.borderLeft = "3px solid var(--accent-primary)";

                        let cleanText = cleanBibleText(res.text);
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
    const isPagedKind = previewState.mediaKind === 'pdf' || previewState.mediaKind === 'pptx';
    const pageSuffix = (on && isPagedKind && previewState.mediaPdfPageCount) ? ` (page ${previewState.mediaPdfPage}/${previewState.mediaPdfPageCount})` : '';
    el.innerText = on ? `● On screen: ${previewState.mediaName}${pageSuffix}` : 'Media hidden — text is showing';
    el.style.color = on ? 'var(--accent-live)' : 'var(--text-muted)';
    const showBtn = document.getElementById('mediaShowBtn');
    if (showBtn) showBtn.classList.toggle('toggle-active', !!on);
    updateMediaPdfNavUI();
}

// Shows/hides the Prev/Next Page controls and keeps the "Page X / Y" indicator current — only relevant while a PDF is on screen.
function updateMediaPdfNavUI() {
    const wrap = document.getElementById('mediaPdfNavGroup');
    const indicator = document.getElementById('mediaPdfPageIndicator');
    if (!wrap || !indicator) return;
    const showingPaged = previewState.displayMode === 'media' && (previewState.mediaKind === 'pdf' || previewState.mediaKind === 'pptx') && previewState.mediaPdfPageCount > 0;
    wrap.style.display = showingPaged ? '' : 'none';
    if (showingPaged) indicator.innerText = `${previewState.mediaKind === 'pptx' ? 'Slide' : 'Page'} ${previewState.mediaPdfPage} / ${previewState.mediaPdfPageCount}`;
}

// Text is chosen (double-click / arrows / Enter) -> media steps aside automatically instead of overlaying.
// Stops every OTHER video's sound the instant new media is selected — pass the URL that should keep
// playing (or nothing to stop everything). Without this, every video ever shown kept looping and
// playing its audio in the background forever, since only "Hide Media" used to pause anything.
function pauseAllMasterVideosExcept(exceptUrl) {
    masterVideoRegistry.forEach((entry, url) => {
        if (url !== exceptUrl && !entry.masterEl.paused) entry.masterEl.pause();
    });
}

function switchToTextDisplay() {
    if (typeof slidesNoteExternalChange === 'function') slidesNoteExternalChange();
    if (previewState.displayMode !== 'media') return;
    previewState.displayMode = 'text';
    pauseAllMasterVideosExcept(null);
    updateMediaPanelStatus();
}

function refreshMediaDropdown(selectedId) {
    const dd = document.getElementById('mediaLibraryDropdown');
    dd.innerHTML = '<option value="">-- Saved Media (images, videos &amp; PDFs) --</option>';
    mediaLibrary.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id; opt.innerText = `${m.kind === 'video' ? '🎞' : (m.kind === 'pdf' ? '📄' : (m.kind === 'pptx' ? '📽' : '🖼'))} ${m.name}`;
        dd.appendChild(opt);
    });
    dd.value = selectedId || '';
}

function showMedia(id) {
    const m = mediaLibrary.find(x => x.id === id);
    if (!m) return;
    if (typeof slidesNoteExternalChange === 'function') slidesNoteExternalChange();
    previewState.slideTransition = ''; previewState.slidePrevUrl = '';
    if (m.kind === 'pdf') { showPdfMediaPage(m, 1); return; }
    if (m.kind === 'pptx') { showPptxMediaPage(m, 1); return; }
    pauseAllMasterVideosExcept(m.kind === 'video' ? m.url : null);
    Object.assign(previewState, { mediaUrl: m.url, mediaKind: m.kind, mediaName: m.name, displayMode: 'media', mediaPdfId: '', mediaPdfPage: 1, mediaPdfPageCount: 0 });
    const entry = masterVideoRegistry.get(m.url);
    if (m.kind === 'video' && entry) { entry.masterEl.currentTime = 0; entry.masterEl.play().catch(() => {}); }
    updateMediaPanelStatus();
    renderPreview();
}

// ===================== PDF MEDIA (presentations, slide handouts, etc. — shown page by page) =====================
// Each page is rendered to an image once (cached per document) and displayed exactly like an
// uploaded image, so it reuses all the existing display/fit/output-window plumbing untouched.
const pdfDocCache = new Map(); // media library id -> loaded pdf.js document
let currentPagedMediaObjectUrl = ''; // the previous PDF page / PPTX slide's rendered image, revoked once replaced

async function getPdfDocument(m) {
    let doc = pdfDocCache.get(m.id);
    if (doc) return doc;
    if (typeof pdfjsLib === 'undefined') throw new Error('PDF reader library did not load (no internet access?).');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    const arrayBuffer = await (await fetch(m.url)).arrayBuffer();
    doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    pdfDocCache.set(m.id, doc);
    return doc;
}

async function renderPdfPageToObjectUrl(doc, pageNum) {
    const page = await doc.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.max(0.5, Math.min(1600 / baseViewport.width, 1600 / baseViewport.height, 3));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return await new Promise(resolve => canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), 'image/jpeg', 0.92));
}

async function showPdfMediaPage(m, pageNum) {
    pauseAllMasterVideosExcept(null);
    const statusEl = document.getElementById('mediaStatus');
    if (statusEl) { statusEl.innerText = `Loading "${m.name}"…`; statusEl.style.color = 'var(--text-muted)'; }
    try {
        const doc = await getPdfDocument(m);
        const clampedPage = Math.max(1, Math.min(pageNum, doc.numPages));
        const pageUrl = await renderPdfPageToObjectUrl(doc, clampedPage);
        const oldUrl = currentPagedMediaObjectUrl;
        currentPagedMediaObjectUrl = pageUrl;
        Object.assign(previewState, {
            mediaUrl: pageUrl, mediaKind: 'pdf', mediaName: m.name, displayMode: 'media',
            mediaPdfId: m.id, mediaPdfPage: clampedPage, mediaPdfPageCount: doc.numPages
        });
        updateMediaPanelStatus();
        renderPreview();
        if (oldUrl && oldUrl !== pageUrl) URL.revokeObjectURL(oldUrl);
    } catch (err) {
        console.warn('Could not display PDF page:', err);
        if (statusEl) { statusEl.innerText = `Could not open "${m.name}" — ${err.message || err}`; statusEl.style.color = '#f87171'; }
    }
}

function navigatePagedMedia(direction) {
    if (!previewState.mediaPdfId) return;
    const m = mediaLibrary.find(x => x.id === previewState.mediaPdfId);
    if (!m) return;
    if (m.kind === 'pdf') showPdfMediaPage(m, previewState.mediaPdfPage + direction);
    else if (m.kind === 'pptx') showPptxMediaPage(m, previewState.mediaPdfPage + direction);
}

// ===================== PPTX MEDIA (PowerPoint files — shown slide by slide) =====================
// A .pptx is a ZIP of XML files. There is no lightweight, reliable way to reproduce PowerPoint's exact
// visual design in the browser (fonts, master-slide themes, animations), so each slide is rendered as a
// clean, readable image built from that slide's own text and embedded pictures — same page-by-page
// display as PDF, just not a pixel-perfect copy of the original design. For an exact visual match,
// exporting the deck to PDF from PowerPoint first (File > Export > Create PDF) and uploading that works
// through the PDF path above instead.
const pptxDocCache = new Map(); // media library id -> { zip, slidePaths, numPages, cx, cy }

async function getPptxDocument(m) {
    let doc = pptxDocCache.get(m.id);
    if (doc) return doc;
    if (typeof JSZip === 'undefined') throw new Error('Presentation reader library did not load (no internet access?).');
    const arrayBuffer = await (await fetch(m.url)).arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slidePaths = Object.keys(zip.files)
        .filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p))
        .sort((a, b) => parseInt(a.match(/(\d+)/)[1], 10) - parseInt(b.match(/(\d+)/)[1], 10));
    if (!slidePaths.length) throw new Error('No slides found in this file.');
    let cx = 12192000, cy = 6858000; // EMUs — standard 16:9 fallback if presentation.xml can't be read
    try {
        const presXml = await zip.file('ppt/presentation.xml').async('string');
        const sizeMatch = presXml.match(/<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
        if (sizeMatch) { cx = parseInt(sizeMatch[1], 10); cy = parseInt(sizeMatch[2], 10); }
    } catch (e) {}
    doc = { zip, slidePaths, numPages: slidePaths.length, cx, cy };
    pptxDocCache.set(m.id, doc);
    return doc;
}

function decodeXmlEntities(text) {
    return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

// Text grouped by shape (<p:sp>), so a title and body still read as separate blocks even though their
// exact on-slide position/styling isn't reproduced.
function extractSlideTextBlocks(slideXmlText) {
    const blocks = [];
    const shapeRegex = /<p:sp>[\s\S]*?<\/p:sp>/g;
    let shapeMatch;
    while ((shapeMatch = shapeRegex.exec(slideXmlText)) !== null) {
        const paraRegex = /<a:p>([\s\S]*?)<\/a:p>/g;
        const lines = [];
        let paraMatch;
        while ((paraMatch = paraRegex.exec(shapeMatch[0])) !== null) {
            const runRegex = /<a:t>([\s\S]*?)<\/a:t>/g;
            let runMatch, text = '';
            while ((runMatch = runRegex.exec(paraMatch[1])) !== null) text += runMatch[1];
            lines.push(decodeXmlEntities(text));
        }
        const joined = lines.join('\n').trim();
        if (joined) blocks.push(joined);
    }
    return blocks;
}

async function extractSlideImageUrls(zip, slidePath) {
    const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
    const relsFile = zip.file(relsPath);
    if (!relsFile) return [];
    const relsXml = await relsFile.async('string');
    const urls = [];
    const relRegex = /<Relationship[^>]*Type="[^"]*\/image"[^>]*Target="([^"]+)"[^>]*\/?>/g;
    let m;
    while ((m = relRegex.exec(relsXml)) !== null) {
        const target = m[1].replace(/^\.\.\//, 'ppt/');
        const imgFile = zip.file(target);
        if (imgFile) urls.push(URL.createObjectURL(await imgFile.async('blob')));
    }
    return urls;
}

async function renderPptxPageToObjectUrl(doc, pageNum) {
    const slidePath = doc.slidePaths[pageNum - 1];
    const slideXmlText = await doc.zip.file(slidePath).async('string');
    const [textBlocks, imageUrls] = await Promise.all([
        Promise.resolve(extractSlideTextBlocks(slideXmlText)),
        extractSlideImageUrls(doc.zip, slidePath)
    ]);

    const W = 1280, H = Math.max(1, Math.round(1280 * (doc.cy / doc.cx)));
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);

    let cursorY = 50;
    if (imageUrls.length) {
        try {
            const img = await new Promise((resolve, reject) => { const el = new Image(); el.onload = () => resolve(el); el.onerror = reject; el.src = imageUrls[0]; });
            const maxW = W - 100, maxH = H * 0.55;
            const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
            const dw = img.width * ratio, dh = img.height * ratio;
            ctx.drawImage(img, (W - dw) / 2, cursorY, dw, dh);
            cursorY += dh + 35;
        } catch (e) { /* image failed to decode — continue with text only */ }
        imageUrls.forEach(u => URL.revokeObjectURL(u));
    }

    ctx.fillStyle = '#111111'; ctx.textAlign = 'center';
    textBlocks.forEach((block, blockIndex) => {
        const fontSize = blockIndex === 0 ? 50 : 30;
        ctx.font = `${blockIndex === 0 ? '700' : '400'} ${fontSize}px system-ui, -apple-system, sans-serif`;
        const maxWidth = W - 140;
        block.split('\n').forEach(paragraph => {
            const words = paragraph.split(/\s+/).filter(Boolean);
            let line = '';
            words.forEach(word => {
                const testLine = line ? line + ' ' + word : word;
                if (ctx.measureText(testLine).width > maxWidth && line) {
                    ctx.fillText(line, W / 2, cursorY); cursorY += fontSize * 1.25; line = word;
                } else line = testLine;
            });
            if (line) { ctx.fillText(line, W / 2, cursorY); cursorY += fontSize * 1.25; }
        });
        cursorY += fontSize * 0.5;
    });

    if (!imageUrls.length && !textBlocks.length) {
        ctx.fillStyle = '#9ca3af'; ctx.font = '400 26px system-ui, sans-serif';
        ctx.fillText('(This slide has no extractable text or images)', W / 2, H / 2);
    }

    return await new Promise(resolve => canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), 'image/png'));
}

async function showPptxMediaPage(m, pageNum) {
    pauseAllMasterVideosExcept(null);
    const statusEl = document.getElementById('mediaStatus');
    if (statusEl) { statusEl.innerText = `Loading "${m.name}"…`; statusEl.style.color = 'var(--text-muted)'; }
    try {
        const doc = await getPptxDocument(m);
        const clampedPage = Math.max(1, Math.min(pageNum, doc.numPages));
        const pageUrl = await renderPptxPageToObjectUrl(doc, clampedPage);
        const oldUrl = currentPagedMediaObjectUrl;
        currentPagedMediaObjectUrl = pageUrl;
        Object.assign(previewState, {
            mediaUrl: pageUrl, mediaKind: 'pptx', mediaName: m.name, displayMode: 'media',
            mediaPdfId: m.id, mediaPdfPage: clampedPage, mediaPdfPageCount: doc.numPages
        });
        updateMediaPanelStatus();
        renderPreview();
        if (oldUrl && oldUrl !== pageUrl) URL.revokeObjectURL(oldUrl);
    } catch (err) {
        console.warn('Could not display PowerPoint slide:', err);
        if (statusEl) { statusEl.innerText = `Could not open "${m.name}" — ${err.message || err}`; statusEl.style.color = '#f87171'; }
    }
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
            { className: 'canvas-video-bg-node media-layer-node', opacity: 1, muted: true });
        sink.style.objectFit = fit;
    } else {
        const slideAnim = state.slideTransition && state.slideTransition !== 'cut' ? state.slideTransition : '';
        if (slideAnim && state.slidePrevUrl && state.slidePrevUrl !== state.mediaUrl) {
            const { node: prevImg } = layerFromCache(reusable, 'media:' + state.slidePrevUrl, () => { const el = ownerDoc.createElement('img'); el.src = state.slidePrevUrl; return el; });
            prevImg.className = 'media-layer-node'; prevImg.style.objectFit = fit;
            container.appendChild(prevImg); // the outgoing slide stays underneath so transitions blend instead of flashing black
        }
        const { node: img } = layerFromCache(reusable, 'media:' + state.mediaUrl, () => { const el = ownerDoc.createElement('img'); el.src = state.mediaUrl; return el; });
        img.className = 'media-layer-node'; img.style.objectFit = fit;
        if (slideAnim && String(state.slideSeq || '') !== img.dataset.slSeq) { // play the entry animation once per slide change
            img.dataset.slSeq = String(state.slideSeq || '');
            const cls = 'ebp-sl-' + slideAnim;
            img.classList.add(cls);
            img.addEventListener('animationend', () => img.classList.remove(cls), { once: true });
        }
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
            const kind = file.type.startsWith('video/') ? 'video' : (file.type.startsWith('image/') ? 'image' : ((file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) ? 'pdf' : ((file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || /\.pptx$/i.test(file.name)) ? 'pptx' : '')));
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
    $('mediaPdfPrevBtn').addEventListener('click', () => navigatePagedMedia(-1));
    $('mediaPdfNextBtn').addEventListener('click', () => navigatePagedMedia(1));
    $('mediaFitSelector').addEventListener('change', (e) => { previewState.mediaFit = e.target.value; renderPreview(); });
    $('mediaDeleteBtn').addEventListener('click', async () => {
        const id = $('mediaLibraryDropdown').value;
        const m = mediaLibrary.find(x => x.id === id);
        if (!m || !confirm(`Remove "${m.name}" from the saved media library?`)) return;
        if (previewState.mediaUrl === m.url || ((m.kind === 'pdf' || m.kind === 'pptx') && previewState.mediaPdfId === m.id)) {
            switchToTextDisplay();
            Object.assign(previewState, { mediaUrl: '', mediaKind: '', mediaName: '', mediaPdfId: '', mediaPdfPage: 1, mediaPdfPageCount: 0 });
            if (currentPagedMediaObjectUrl) { URL.revokeObjectURL(currentPagedMediaObjectUrl); currentPagedMediaObjectUrl = ''; }
            renderPreview();
        }
        const entry = masterVideoRegistry.get(m.url);
        if (entry) { entry.masterEl.remove(); masterVideoRegistry.delete(m.url); }
        if (pdfDocCache.has(m.id)) { try { pdfDocCache.get(m.id).destroy(); } catch (e) {} pdfDocCache.delete(m.id); }
        if (pptxDocCache.has(m.id)) pptxDocCache.delete(m.id);
        URL.revokeObjectURL(m.url);
        mediaLibrary = mediaLibrary.filter(x => x.id !== id);
        try { await mediaDB.remove(id); } catch (err) {}
        refreshMediaDropdown(); updateMediaPanelStatus();
    });
    initSlidesDisplay();
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

            // Keep the timer on every multi-screen output window ticking too
            try { updateOutputSlotTimers(); } catch (e) {}
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

        // Clean a verse from the Bible source: drop Strong's numbers, translator footnotes (<sup>…</sup>), bold section headings and all tags.
        function cleanBibleText(t) {
            return String(t || '')
                .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
                .replace(/<b>[\s\S]*?<\/b>\s*<br\s*\/?>/gi, '')
                .replace(/<S>\s*\d+(?:\s*,\s*\d+)*\s*<\/S>/gi, '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }

        // Maps an exact API translation code to the short label shown on the display (e.g. NIV2011 -> "NIV")
        function getVersionDisplayLabel(code) {
            const labels = { NIV2011: 'NIV' };
            return labels[code] || code;
        }

        // Chapter cache + prefetch: a chapter that was already fetched (or prefetched while a match was only a suggestion) opens instantly.
        const bollsChapterCache = new Map();
        function bollsChapterJson(ver, book, ch) {
            const key = ver + '|' + book + '|' + ch;
            if (bollsChapterCache.has(key)) return bollsChapterCache.get(key);
            const p = fetch(`https://bolls.life/get-text/${ver}/${book}/${ch}/`)
                .then(r => { if (!r.ok) throw new Error("Cloud database failure"); return r.json(); })
                .then(data => {
                    // Some publishers (e.g. Biblica / NIV) forced the free source to replace the text with a protest message — never show that as scripture.
                    if (Array.isArray(data) && data.some(v => /Biblica,?\s*Inc\.?\s+has prohibited|prohibited me from using the/i.test(String(v && v.text || '')))) {
                        const e = new Error('Translation blocked by publisher'); e.ebpBlocked = true; throw e;
                    }
                    return data;
                })
                .catch(err => { bollsChapterCache.delete(key); throw err; });
            bollsChapterCache.set(key, p);
            if (bollsChapterCache.size > 60) bollsChapterCache.delete(bollsChapterCache.keys().next().value);
            return p;
        }
        function bollsPrefetch(book, ch) {
            try { const sel = document.getElementById('versionSelector'); if (sel) bollsChapterJson(sel.value, book, ch).catch(() => {}); } catch (e) {}
        }

        let chapterRequestSeq = 0; // only the newest chapter request may update the screen (a slow older reply must never overwrite a newer one)
        async function fetchCurrentChapterFromAPI() {
            const requestId = ++chapterRequestSeq;
            const targetVersion = document.getElementById('versionSelector').value;
            const dot = document.getElementById('statusDot');
            const statusText = document.getElementById('statusText');
            
            dot.className = "status-dot loading";
            statusText.innerText = "Syncing Cloud...";
            document.getElementById('panelNavHeader').innerText = `Verse Directory: Loading...`;

            try {
                let data = await bollsChapterJson(targetVersion, currentBookCode, currentChapter);
                if (requestId !== chapterRequestSeq) return; // superseded by a newer request
                if (data && data.length > 0) {
                    activeChapterVerses = data.map(v => {
                        // Strip markup only (Strong's numbers, footnotes, headings, <i>, <br>) — NEVER digits, which are real text (666, 144,000, ages, measurements)
                        let parsedText = cleanBibleText(v.text);
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
                if (requestId !== chapterRequestSeq) return;
                if (error && (error.ebpBlocked || error.ebpNotice)) {
                    displayPanelFallbackNotice(error.ebpNotice || `${targetVersion} is not available from the free Bible source (the publisher blocked it). Please choose another version, e.g. NKJV, KJV or WEB.`);
                    return;
                }
                console.warn("Primary API timeout, engaging backup translation...", error);
                try {
                    const fallbackData = await fetchFallbackBibleApi(currentBookName, currentChapter);
                    if (requestId !== chapterRequestSeq) return;
                    activeChapterVerses = fallbackData;
                    renderVerseNavigationPanel();
                    transmitStatePacketToRemoteClients();
                    selectSpecificVerseCoordinate(currentVerse);
                    dot.className = "status-dot active";
                    statusText.innerText = "Backup source (WEB text) — not " + targetVersion;
                } catch (fallbackError) {
                    if (requestId !== chapterRequestSeq) return;
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
            document.getElementById('panelNavHeader').innerText = `Verse Directory: ${blibBookName(currentBookCode, currentBookName)} ${currentChapter}`;
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
            previewState.ref = `${blibBookName(currentBookCode, currentBookName)} ${currentChapter}:${foundVerse.verse} (${getVersionDisplayLabel(document.getElementById('versionSelector').value)})`;
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
            masterEl.muted = false; // the master is the single authoritative audio source — every visible sink stays muted so the same video's sound is never played twice at once (which was causing the echoed/off "tone")
            masterEl.autoplay = true;
            masterEl.playsInline = true;
            masterEl.style.cssText = 'position:fixed; width:1px; height:1px; opacity:0; pointer-events:none; left:-9999px;';
            document.body.appendChild(masterEl);
            masterEl.play().catch(() => {});

            entry = { masterEl, stream: null, readyCallbacks: [] };
            masterVideoRegistry.set(videoUrl, entry);

            const captureWhenReady = () => {
                if (entry.stream) return;
                try {
                    if (masterEl.captureStream) entry.stream = masterEl.captureStream();
                    else if (masterEl.mozCaptureStream) entry.stream = masterEl.mozCaptureStream();
                } catch (e) {}
                // Hand the now-ready stream to every sink that started playing directly while waiting for it.
                if (entry.stream && entry.readyCallbacks.length) {
                    const callbacks = entry.readyCallbacks.splice(0);
                    callbacks.forEach(cb => { try { cb(entry.stream); } catch (e) {} });
                }
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
            } else {
                // The shared stream isn't captured yet (unavoidable on the very first play — the source
                // has to start loading first) — play this sink directly, right now, so it starts
                // immediately without losing the click that triggered it, then hand it over to the
                // perfectly-synced shared stream the instant that becomes ready (see readyCallbacks above).
                if (!sinkEl.dataset.directPlaybackActive && !sinkEl.srcObject) {
                    sinkEl.dataset.directPlaybackActive = '1';
                    sinkEl.src = videoUrl; sinkEl.loop = true;
                    const p = sinkEl.play(); if (p && p.catch) p.catch(() => {});
                }
                if (!sinkEl.dataset.awaitingStream) {
                    sinkEl.dataset.awaitingStream = '1';
                    entry.readyCallbacks.push((stream) => {
                        delete sinkEl.dataset.awaitingStream;
                        delete sinkEl.dataset.directPlaybackActive;
                        sinkEl.srcObject = stream;
                        const p = sinkEl.play(); if (p && p.catch) p.catch(() => {});
                    });
                }
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

        // ===================== DEFAULT BACKGROUNDS (ready-made gradients, no upload needed) =====================
        // A quick set of good-looking backgrounds anyone can pick straight from the dropdown, as an
        // alternative to always having to choose a plain Solid BG color.
        const DEFAULT_BG_PRESETS = {
            ocean:    { angle: 135, stops: ['#0f2027', '#203a43', '#2c5364'] },
            midnight: { angle: 160, stops: ['#0f0c29', '#302b63', '#24243e'] },
            royal:    { angle: 135, stops: ['#41295a', '#2f0743'] },
            sunset:   { angle: 120, stops: ['#ff512f', '#dd2476'] },
            golden:   { angle: 135, stops: ['#f2994a', '#f2c94c'] },
            forest:   { angle: 135, stops: ['#134e5e', '#71b280'] },
            crimson:  { angle: 135, stops: ['#c94b4b', '#4b134f'] },
            aurora:   { angle: 135, stops: ['#43cea2', '#185a9d'] },
            cosmic:   { angle: 135, stops: ['#1a1a2e', '#16213e', '#0f3460'] },
            ember:    { angle: 135, stops: ['#8e0e00', '#1f1c18'] }
        };
        // Builds the gradient CSS for a preset, baking the Opacity slider into each color stop —
        // same visual effect the slider already has on Solid BG and Box Fill.
        function buildPresetBackgroundCss(presetId, opacityPct) {
            const preset = DEFAULT_BG_PRESETS[presetId];
            if (!preset) return '';
            const stops = preset.stops.map(hex => hexToRgbaWithOpacity(hex, opacityPct)).join(', ');
            return `linear-gradient(${preset.angle}deg, ${stops})`;
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

            canvasElement.className = `display-canvas ${stateObject.layout} size-${stateObject.fontSize} lt-pos-${stateObject.lowerThirdPosition || 'bottom'} ${lttBgT(stateObject) ? 'bg-is-transparent' : ''}`;
            const contentSig = computeSceneContentSig(stateObject);
            const contentChanged = canvasElement.dataset.contentSig !== contentSig;
            canvasElement.dataset.contentSig = contentSig;
            const transitionClass = (withTransition && contentChanged) ? getDisplayTransitionClass() : '';
            const reusableLayers = takeReusableLayers(canvasElement);
            canvasElement.style.transition = transitionClass ? 'background-color 0.5s ease' : 'none';

            const bgOpacity = stateObject.bgOpacity == null ? 100 : stateObject.bgOpacity;

            if (!lttBgT(stateObject) && stateObject.bgPreset && DEFAULT_BG_PRESETS[stateObject.bgPreset]) {
                canvasElement.style.backgroundColor = 'transparent';
                canvasElement.style.backgroundImage = buildPresetBackgroundCss(stateObject.bgPreset, bgOpacity);
            } else {
                canvasElement.style.backgroundImage = 'none';
                canvasElement.style.backgroundColor = lttBgT(stateObject) ? 'transparent' : hexToRgbaWithOpacity(stateObject.bgColor, bgOpacity);
            }

            let contentNode = stateObject.text || '';
            if (stateObject.isScrolling && stateObject.text) {
                contentNode = `<div class="ticker-wrapper"><div class="ticker-text">${contentNode}</div></div>`;
            }

            const boxBgStyleString = stateObject.textBgUrl ? `--box-bg-image: url('${stateObject.textBgUrl}'); --box-bg-opacity: ${bgOpacity / 100};` : '--box-bg-image: none;';
            // Nudge only applies in Lower Third. Uses the CSS "translate" property in canvas-width units (cqw), applied
            // identically to the text AND the reference so they always move together, with no limit on distance.
            const nudgeIsActive = stateObject.layout === 'mode-lowerthird' && (stateObject.textNudgeX || stateObject.textNudgeY);
            const nudgeTransformStyle = nudgeIsActive ? `translate: ${stateObject.textNudgeX || 0}cqw ${stateObject.textNudgeY || 0}cqw;` : '';
            const customFontFamily = stateObject.fontFamilyOverride || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            const customShadow = stateObject.textShadowStyle != null ? stateObject.textShadowStyle : "0 4px 12px rgba(0,0,0,0.98)";
            const isTextBold = !!stateObject.fontBold;
            const isTextItalic = !!stateObject.fontItalic;
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
            const backingPanelClass = (stateObject.textBackingPanel && !lttBgT(stateObject)) ? 'backing-panel-active' : ''; // Transparent background is a master override — nothing shows behind the text, so it keys/overlays cleanly

            // Lower third name tag (e.g. "Ministering: Pastor Ade")
            const nameBarVisible = false; // the name tag is now its own overlay (Message tab → Send Name Tag), never part of the scene
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
                <div class="text-display-box-container ${transitionClass} ${backingPanelClass}" style="${boxBgStyleString} ${nudgeTransformStyle} ${textHiddenClass} ${flierOnlyTextHide} ${videoAloneHide}">
                    <div class="text-out ${gradientGlowClass}" style="width:100%; ${dynamicColorVar} color: ${stateObject.textColor || '#ffffff'}; text-shadow: ${customShadow}; font-size: calc(var(--canvas-font-size) * ${autoFontScale}); font-family: ${customFontFamily}; font-weight: ${customFontWeight}; font-style: ${customFontStyle};">${contentNode}</div>
                </div>
                <div class="ref-out ${transitionClass}" style="${nudgeTransformStyle} ${stateObject.refVisible === false ? 'display: none !important;' : ''} ${textHiddenClass} ${flierOnlyTextHide} ${videoAloneHide} text-shadow: ${customShadow}; font-family: ${customFontFamily}; ${stateObject.refColor ? `color: ${stateObject.refColor};` : ''}">${stateObject.ref || ''}</div>
                <div class="canvas-timer-node ${stateObject.timerPosition || 'timer-top-right'} ${stateObject.timerSize || 'timer-size-medium'} ${stateObject.timerVisible ? 'timer-visible' : ''}" id="${canvasElement.id}OverlayTimer">${stateObject.timerText || '00:00'}</div>
                ${nameBarHtml}
                ${announcementHtml}
            `;

            restoreAnnouncementBanner(canvasElement, reusableLayers, announcementHtml.trim());
            try { lttApply(canvasElement, stateObject, logoBlobContext, transitionClass); } catch (e) { console.warn('Lower third template:', e); }
            try { ovSceneApply(canvasElement, stateObject); } catch (e) {}

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
            recognition.maxAlternatives = 5; // more guesses per phrase = far better accuracy for version names and spoken numbers
            recognition.lang = (function () { try { return localStorage.getItem('ebpVoiceLang') || 'en-US'; } catch (e) { return 'en-US'; } })();

            recognition.onstart = () => {
                voiceCommitted = { utterance: -1, sig: '' }; // fresh recognition session -> fresh utterance numbering
                if (typeof aiState !== 'undefined') aiState.results = {};
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

                renderTranscriptLog(finalTranscriptText, interimTranscriptText);
                processContinuousSpeechForScriptures(event);
                aiOnSpeech(event);
            };
        }

// ===================== VOICE ENGINE: Bible-text focus + spoken commands =====================
// Listens for (1) scripture references ("turn to John 3:16", "Psalm one hundred and nineteen verse 105"),
// (2) commands ("next verse", "previous verse", "go to verse 10", "open verse ten", "next chapter"), and
// (3) the preacher reading the loaded chapter aloud — the display follows the verse being read.
// Whatever it recognises is shown immediately as text (any media on screen steps aside).
let voiceActionNote = '';
let transcriptLines = [];
const escapeHtmlText = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Voice Diagnostics: finished sentences stay listed (newest at the bottom), the line being spoken updates live.
function renderTranscriptLog(finalText, interimText) {
    const track = document.getElementById('transcriptTrack');
    if (!track) return;
    const f = String(finalText || '').trim();
    if (f) { transcriptLines.push(f); if (transcriptLines.length > 40) transcriptLines.shift(); }
    const nearBottom = track.scrollHeight - track.scrollTop - track.clientHeight < 40;
    track.innerHTML = transcriptLines.map(l => `<div class="tline">${escapeHtmlText(l)}</div>`).join('')
        + (interimText ? `<div class="tline live">${escapeHtmlText(interimText)}</div>` : '')
        + (voiceActionNote ? `<div class="tline voice-action-note" style="color: var(--accent-success); font-weight:800;">▶ ${escapeHtmlText(voiceActionNote)}</div>` : '');
    if (nearBottom) track.scrollTop = track.scrollHeight;
}

// ---- Scripture Matches: finds the verse the preacher is quoting, WHILE he is still speaking ----
// How it works: every ~0.5s (throttled — it never waits for a pause) the last ~30 spoken words are turned into a few
// keyword searches against the Bolls Bible database (same source as Word Search). The candidate verses that come back
// are then ranked locally by how many of the spoken words — and spoken word-pairs — they actually contain.
const SUGGEST_STOP = new Set(('a an the and or but if of to in on at by for with from as is are was were be been being am it its he she they them his her their we us our you your i me my this that these those there here not no so then than too very can will just do does did done have has had what which who whom whose when where why how all any each some more most other into out up down over about also would could should shall may might must said say says saith unto upon yet one now like because going gonna want get got let know see come came go goes make made even still only really thing things people amen church god lord jesus christ').split(' '));
let suggestSearching = false, suggestTimer = null, suggestLastRun = 0, suggestSeq = 0, suggestShownSeq = 0, suggestBuffer = [], suggestItems = [];
const suggestCache = new Map();
const suggestStem = w => (w.length > 5 ? w.replace(/(ing|eth|est|ed|es|s)$/, '') : w);
const suggestWords = t => String(t || '').toLowerCase().replace(/[^a-z'\s]/g, ' ').split(/\s+/).filter(Boolean);

function updateScriptureSuggestions(event) {
    if (!event || !event.results) return;
    let text = '';
    for (let i = Math.max(0, event.results.length - 12); i < event.results.length; i++) text += ' ' + event.results[i][0].transcript;
    const words = suggestWords(text).slice(-48);
    if (words.length < 3) return;
    suggestBuffer = words;
    const live = document.getElementById('suggestStatus');
    if (live && !suggestSearching) live.innerText = 'Reading along: “…' + words.slice(-9).join(' ') + '”';
    if (suggestTimer) return; // a search is already scheduled — it will use the newest words when it fires
    const wait = Math.max(0, 300 - (Date.now() - suggestLastRun));
    suggestTimer = setTimeout(() => { suggestTimer = null; suggestLastRun = Date.now(); runScriptureSuggestionSearch(suggestBuffer.slice()); }, wait);
}

async function suggestFetch(version, query) {
    const key = version + '|' + query;
    if (suggestCache.has(key)) return suggestCache.get(key);
    const res = await fetch(`https://bolls.life/v2/find/${version}?search=${encodeURIComponent(query)}&match_case=false&match_whole=false&limit=40&page=1`);
    if (!res.ok) return [];
    const data = await res.json();
    const list = (data && data.results) ? data.results : [];
    suggestCache.set(key, list);
    if (suggestCache.size > 120) suggestCache.delete(suggestCache.keys().next().value);
    return list;
}

async function runScriptureSuggestionSearch(words) {
    const seq = ++suggestSeq;
    const status = document.getElementById('suggestStatus');
    const version = document.getElementById('versionSelector').value;
    if (blibIsLocal(version)) { suggestSearching = false; if (status) status.innerText = 'Scripture suggestions work with English Bibles only.'; return; }
    const content = w => !SUGGEST_STOP.has(w) && w.length >= 3;
    const longest = (arr, n) => Array.from(new Set(arr.filter(content))).sort((x, y) => y.length - x.length).slice(0, n);
    const queries = [longest(words.slice(-20), 4), longest(words.slice(-10), 3), longest(words.slice(-48, -20), 3), longest(words.slice(-6), 2), longest(words.slice(-30, -10), 3)]
        .filter(q => q.length >= 2).map(q => q.join(' '));
    if (!queries.length) return;
    suggestSearching = true;
    try {
        const batches = await Promise.all(Array.from(new Set(queries)).map(q => suggestFetch(version, q).catch(() => [])));
        suggestSearching = false;
        if (seq < suggestShownSeq) return; // a newer search already displayed
        const spokenContent = words.filter(content);
        const spokenStems = new Set(spokenContent.map(suggestStem));
        const freshStems = new Set(words.slice(-16).filter(content).map(suggestStem)); // the latest words count extra
        const pairs = new Set();
        for (let i = 0; i + 1 < words.length; i++) pairs.add(words[i] + ' ' + words[i + 1]);
        const seen = new Map();
        batches.flat().forEach(r => {
            if (!r || r.book > 66) return; // Bible only (the database also holds Apocrypha)
            const key = r.book + ':' + r.chapter + ':' + r.verse;
            if (seen.has(key)) return;
            const text = cleanBibleText(r.text);
            const vw = suggestWords(text);
            const vStems = new Set(vw.filter(content).map(suggestStem));
            let matched = 0, score = 0;
            spokenStems.forEach(st => { if (vStems.has(st)) { matched++; score += (st.length >= 6 ? 1.5 : 1) * (freshStems.has(st) ? 1.5 : 1); } });
            let pairHits = 0;
            for (let i = 0; i + 1 < vw.length; i++) if (pairs.has(vw[i] + ' ' + vw[i + 1])) pairHits++;
            score += pairHits * 2;
            const coverage = vStems.size ? matched / Math.min(vStems.size, spokenStems.size || 1) : 0;
            score += coverage * 2 + (vStems.size ? (matched / vStems.size) * 4 : 0); // verses that are mostly what was said rank higher
            if (matched >= 3 || (matched >= 2 && pairHits >= 1)) seen.set(key, { book: r.book, chapter: r.chapter, verse: r.verse, text, score });
        });
        const ranked = Array.from(seen.values()).sort((a, b) => b.score - a.score).slice(0, 8);
        suggestShownSeq = seq;
        if (ranked.length) {
            suggestItems = ranked;
            renderScriptureSuggestions(spokenStems);
            if (status) status.innerText = 'Live matches — click to preview, double-click to display';
        } else if (status) {
            status.innerText = suggestItems.length ? 'Keeping last matches — listening…' : 'Listening… no matching scripture yet.';
        }
    } catch (e) { suggestSearching = false; if (status) status.innerText = 'Suggestions unavailable (offline?).'; }
}

function renderScriptureSuggestions(spokenStems) {
    const box = document.getElementById('suggestList');
    if (!box) return;
    box.innerHTML = '';
    suggestItems.forEach((item, idx) => {
        const ref = `${cleanBookNames[item.book] || 'Book ' + item.book} ${item.chapter}:${item.verse}`;
        const row = document.createElement('div');
        row.className = 'ws-item';
        const snippet = String(item.text).split(/([A-Za-z']+)/).map((part, i) => {
            const safe = escapeHtmlText(part);
            if (i % 2 === 0) return safe;
            const lw = part.toLowerCase();
            return (spokenStems && !SUGGEST_STOP.has(lw) && lw.length >= 3 && spokenStems.has(suggestStem(lw))) ? `<mark>${safe}</mark>` : safe;
        }).join('');
        const confBadge = item.conf != null ? `<span class="ws-conf ${item.conf >= 90 ? 'hi' : (item.conf >= 80 ? 'mid' : 'lo')}">${item.conf}%</span>` : '';
        row.innerHTML = `<span class="ws-ref">${confBadge}${ref}${idx === 0 ? ' · best match' : ''}${item.autoShown ? ' · ✓ shown automatically' : ''}</span><span class="ws-snippet">${snippet}</span>`
            + `<span class="ws-actions"><button type="button" class="btn" data-act="show">▶ Display</button></span>`;
        const open = (live) => openSuggestedScripture(item, live);
        row.addEventListener('click', (e) => { if (e.target.dataset && e.target.dataset.act === 'show') open(true); else open(false); });
        row.addEventListener('dblclick', () => open(true));
        box.appendChild(row);
    });
}

// ---- Scripture History panel (mirrors the Logs dropdown; click to bring a past scripture back) ----
function renderScriptureHistoryPanel() {
    const box = document.getElementById('historyPanelList');
    if (!box) return;
    if (!executionDisplayHistory.length) { box.innerHTML = '<div class="placeholder-text">Scriptures you display will be listed here. Click one to bring it back.</div>'; return; }
    box.innerHTML = '';
    executionDisplayHistory.forEach((item, index) => {
        if (!item || !item.text) return;
        const row = document.createElement('div');
        row.className = 'ws-item' + (index === 0 ? ' is-current' : '');
        row.innerHTML = `<span class="ws-ref">${escapeHtmlText(item.ref || '')}</span><span class="ws-snippet">${escapeHtmlText(String(item.text).replace(/<[^>]*>/g, '').substring(0, 110))}</span>`;
        row.addEventListener('click', () => {
            const dd = document.getElementById('historyDropdown');
            dd.value = String(index);
            dd.dispatchEvent(new Event('change'));
        });
        box.appendChild(row);
    });
}

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

// Bible-version switch commands — "let's read from NKJV", "switch to the ESV", "read in the message", etc.
// Matched only after a clear trigger phrase (never a bare acronym on its own) so ordinary reading is never
// mistaken for a version change. Codes must match the <option value="..."> list in the Version selector.
const VOICE_VERSION_ALIASES = [
    ['NKJV', 'new king james version'], ['NKJV', 'new king james'], ['NKJV', 'n k j v'], ['NKJV', 'nkjv'],
    ['BSB', 'berean standard bible'], ['BSB', 'berean standard'], ['BSB', 'b s b'], ['BSB', 'bsb'],
    ['AMP', 'amplified bible'], ['AMP', 'amplified'], ['AMP', 'amp'],
    ['NLT', 'new living translation'], ['NLT', 'n l t'], ['NLT', 'nlt'],
    ['MSG', 'the message bible'], ['MSG', 'the message'], ['MSG', 'message bible'], ['MSG', 'msg'],
    ['ESV', 'english standard version'], ['ESV', 'e s v'], ['ESV', 'esv'],
    ['NASB', 'new american standard bible'], ['NASB', 'new american standard'], ['NASB', 'n a s b'], ['NASB', 'nasb'],
    ['LSB', 'legacy standard bible'], ['LSB', 'l s b'], ['LSB', 'lsb'],
    ['MEV', 'modern english version'], ['MEV', 'm e v'], ['MEV', 'mev'],
    ['WEB', 'world english bible'], ['WEB', 'w e b'],
    ['ASV', 'american standard version'], ['ASV', 'a s v'], ['ASV', 'asv'],
    ['YLT', "young's literal translation"], ['YLT', 'youngs literal translation'], ['YLT', 'y l t'], ['YLT', 'ylt'],
    ['DRB', 'douay rheims bible'], ['DRB', 'douay rheims'],
    ['KJV', 'king james version'], ['KJV', 'king james'], ['KJV', 'k j v'], ['KJV', 'kjv']
];
const VOICE_VERSION_MAP = new Map(VOICE_VERSION_ALIASES.map(([code, phrase]) => [phrase, code]));
const VOICE_VERSION_TRIGGER = "(?:let s read from|lets read from|let s use|lets use|reading from|read from|read in|read|switch the version to|switch version to|switch to|change the version to|change version to|change to|use the|use|turn to|go to|move to)";
const VOICE_VERSION_REGEX = new RegExp(
    `(?:^|\\s)${VOICE_VERSION_TRIGGER}\\s+(?:the\\s+)?(${VOICE_VERSION_ALIASES.map(a => a[1]).sort((a, b) => b.length - a.length).map(p => p.replace(/\s+/g, '\\s+')).join('|')})(?=\\s|$)`, 'g'
);

function voiceCollect(re, s, pri, build, cands, skipIfNumberBefore) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s)) !== null) {
        // "4 verse 1" = the book name was missed/not yet recognised -> never treat it as "verse 1 of the current chapter"
        if (skipIfNumberBefore && /\d\s*$/.test(s.slice(0, m.index))) { if (m[0].length === 0) re.lastIndex++; continue; }
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

    voiceCollect(VOICE_VERSION_REGEX, s, 6, m => ({ type: 'version', code: VOICE_VERSION_MAP.get(m[1].replace(/\s+/g, ' ')), delay: 0 }), cands);
    VOICE_BOOK_ALIASES.forEach(({ id, re }) => voiceCollect(re, s, 5, m => ({
        type: 'ref', bookId: id, chapter: parseInt(m[1], 10), verse: parseInt(m[2] || m[3] || '1', 10), hasVerse: !!(m[2] || m[3]), delay: (m[2] || m[3]) ? 120 : 650
    }), cands));
    voiceCollect(VOICE_PATTERNS.chapter, s, 4, m => ({ type: 'chapter', chapter: parseInt(m[1], 10), verse: parseInt(m[2] || '1', 10), delay: m[2] ? 400 : 900 }), cands);
    voiceCollect(VOICE_PATTERNS.nextChapter, s, 4, () => ({ type: 'chapterStep', dir: 1, delay: 0 }), cands);
    voiceCollect(VOICE_PATTERNS.prevChapter, s, 4, () => ({ type: 'chapterStep', dir: -1, delay: 0 }), cands);
    voiceCollect(VOICE_PATTERNS.verse, s, 3, m => ({ type: 'verse', verse: parseInt(m[1], 10), delay: 220 }), cands, true);
    VOICE_PATTERNS.nextStrong.forEach(re => voiceCollect(re, s, 2, () => ({ type: 'next', dir: 1, delay: 0 }), cands));
    VOICE_PATTERNS.prevStrong.forEach(re => voiceCollect(re, s, 2, () => ({ type: 'prev', dir: -1, delay: 0 }), cands));
    if (VOICE_PATTERNS.nextWeak.test(s)) cands.push({ start: 0, end: s.length, pri: 1, intent: { type: 'next', dir: 1, delay: 450 } });
    if (VOICE_PATTERNS.prevWeak.test(s)) cands.push({ start: 0, end: s.length, pri: 1, intent: { type: 'prev', dir: -1, delay: 450 } });

    if (cands.length) {
        // The most recently spoken instruction wins; on a tie the more specific pattern (book+chapter+verse) wins.
        cands.sort((a, b) => (b.end - a.end) || (b.pri - a.pri) || (a.start - b.start));
        const intent = cands[0].intent;
        intent.sig = [intent.type, intent.bookId || '', intent.chapter || '', intent.verse || '', intent.dir || '', intent.code || ''].join(':');
        return intent;
    }
    if (allowQuote) {
        const quotedVerse = voiceFindQuotedVerse(raw);
        if (quotedVerse) return { type: 'quote', verse: quotedVerse, sig: 'quote:' + quotedVerse, delay: 350 };
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
                if (intent.verse === currentVerse) { setVoiceNote(`Verse ${intent.verse}`); break; }
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
                if (intent.bookId === currentBookCode && intent.chapter === currentChapter && intent.verse === currentVerse) { setVoiceNote(`${bookName} ${currentChapter}:${currentVerse}`); break; }
                const ok = await voiceGoToChapterVerse(intent.bookId, bookName, intent.chapter, intent.verse);
                setVoiceNote(ok ? `${bookName} ${currentChapter}:${currentVerse}` : `${bookName} ${intent.chapter} not found`);
                break;
            }
            case 'version': {
                const versionSel = document.getElementById('versionSelector');
                if (!intent.code || ![...versionSel.options].some(o => o.value === intent.code)) { setVoiceNote(`That version isn't available`); break; }
                if (versionSel.value === intent.code) { setVoiceNote(`Already reading ${getVersionDisplayLabel(intent.code)}`); break; }
                versionSel.value = intent.code;
                await fetchCurrentChapterFromAPI(); // reloads the current chapter in the new version — same as picking it from the dropdown
                forceTextVisibleOnDoubleClick();
                selectSpecificVerseCoordinate(currentVerse);
                sendStagedToLiveView();
                setVoiceNote(`Switched to ${getVersionDisplayLabel(intent.code)}`);
                break;
            }
        }
    } catch (err) {
        console.warn('Voice command failed:', err);
    } finally {
        voiceBusy = false;
    }
}

// "Genesis one three" said quickly sounds exactly like "Genesis thirteen", and the speech engine delivers it as "Genesis 13"
// ("two one" -> 21, "three one" -> 31 …). Sound alone cannot separate them, so:
//  1. if any of the engine's other guesses reads it as chapter + verse ("1 3", "one three", "1:3") that guess wins;
//  2. otherwise, with "Spoken Bible numbers = chapter and verse" (Settings, on by default), a two-digit number with no verse is read as
//     chapter + verse (13 -> 1:3, 21 -> 2:1) — unless the preacher said the word "chapter" ("Genesis chapter thirteen"), or the book is
//     Psalms (Psalm 23, 91 … are chapter numbers), or the first digit is not a real chapter of that book.
const REF_STYLE_STORE = 'ebpRefNumberStyle';
let refNumberStyle = 'split';
try { const v = localStorage.getItem(REF_STYLE_STORE); if (v === 'split' || v === 'chapter') refNumberStyle = v; } catch (e) {}
function voiceFixAmbiguousChapter(intent, altIntents, rawTop) {
    if (!intent || intent.type !== 'ref' || intent.hasVerse || intent.chapter < 11 || intent.chapter > 99) return intent;
    const tens = Math.floor(intent.chapter / 10), units = intent.chapter % 10;
    if (!units) return intent;                                   // 20, 30, 40… cannot be two separate digits
    const split = altIntents.find(it => it && it.type === 'ref' && it.bookId === intent.bookId && it.hasVerse && it.chapter === tens && it.verse === units);
    if (split) return split;
    if (refNumberStyle !== 'split') return intent;
    if (intent.bookId === 19) return intent;                     // Psalms: "Psalm 23" is a chapter
    if (/\bchapter\b/i.test(String(rawTop || ''))) return intent;   // "chapter thirteen" is a chapter
    if (typeof AI_CHAPTERS !== 'undefined' && AI_CHAPTERS[intent.bookId - 1] && (tens > AI_CHAPTERS[intent.bookId - 1] || AI_CHAPTERS[intent.bookId - 1] === 1)) return intent;   // one-chapter books (Jude 13 = verse 13) are left alone
    const out = Object.assign({}, intent, { chapter: tens, verse: units, hasVerse: true, delay: 120 });
    out.sig = [out.type, out.bookId || '', out.chapter || '', out.verse || '', out.dir || '', out.code || ''].join(':');
    return out;
}

// Called for every speech-recognition update. Clear commands run instantly; anything that could still be
// changing mid-sentence (verse numbers, bare "next") waits a beat until the words settle — then fires once.
function processContinuousSpeechForScriptures(event) {
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternatives = [];
        for (let a = 0; a < result.length; a++) alternatives.push(result[a].transcript);

        let intent = null;
        const altIntents = alternatives.map(alt => interpretSpeech(alt, false));
        for (const it of altIntents) { if (it) { intent = it; break; } }   // commands & references: try every guess
        intent = voiceFixAmbiguousChapter(intent, altIntents, alternatives[0]);
        if (!intent && alternatives.length && !songTabIsActive()) intent = interpretSpeech(alternatives[0], true); // then: is the preacher reading the chapter?

        clearTimeout(voicePendingTimer);
        if (!intent) continue;
        if (voiceCommitted.utterance === i && voiceCommitted.sig === intent.sig) continue; // this sentence already acted on

        if (intent.type === 'ref' || intent.type === 'chapter') bollsPrefetch(intent.type === 'ref' ? intent.bookId : currentBookCode, intent.chapter);   // start loading the chapter while the verse number is still being said
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

        function updateLowerThirdControlsVisibility() {
            const isLowerThird = previewState.layout === 'mode-lowerthird';
            const posGroup = document.getElementById('lowerThirdPositionGroup');
            const nudgeGroup = document.getElementById('nudgeControlGroup');
            if (posGroup) posGroup.style.display = isLowerThird ? '' : 'none';
            if (nudgeGroup) nudgeGroup.style.display = isLowerThird ? '' : 'none';
            const refEye = document.getElementById('refEyeToggleBtn');
            if (refEye) refEye.classList.toggle('toggle-active', previewState.refVisible !== false);
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
            layoutSelector.addEventListener('change', () => { previewState.layout = layoutSelector.value; updateLowerThirdControlsVisibility(); renderPreview(); });
            document.getElementById('lowerThirdPositionSelector').addEventListener('change', (e) => { previewState.lowerThirdPosition = e.target.value; renderPreview(); });

            // Fine nudge — small, clamped percentage offsets so text can never be pushed fully off-frame
            const NUDGE_STEP = 1; // no limit — move as far up/down/left/right as you like
            const clampNudge = (v) => v;
            document.getElementById('nudgeUpBtn').addEventListener('click', () => { previewState.textNudgeY = clampNudge((previewState.textNudgeY || 0) - NUDGE_STEP); renderPreview(); });
            document.getElementById('nudgeDownBtn').addEventListener('click', () => { previewState.textNudgeY = clampNudge((previewState.textNudgeY || 0) + NUDGE_STEP); renderPreview(); });
            document.getElementById('nudgeLeftBtn').addEventListener('click', () => { previewState.textNudgeX = clampNudge((previewState.textNudgeX || 0) - NUDGE_STEP); renderPreview(); });
            document.getElementById('nudgeRightBtn').addEventListener('click', () => { previewState.textNudgeX = clampNudge((previewState.textNudgeX || 0) + NUDGE_STEP); renderPreview(); });
            document.getElementById('nudgeResetBtn').addEventListener('click', () => { previewState.textNudgeX = 0; previewState.textNudgeY = 0; renderPreview(); });

            document.getElementById('fontSizeInput').addEventListener('change', () => {
                previewState.fontSize = document.getElementById('fontSizeInput').value;
                renderPreview();
            });

            document.getElementById('bgColorPicker').addEventListener('input', () => { previewState.bgColor = document.getElementById('bgColorPicker').value; previewState.bgPreset = ""; document.getElementById('bgPresetSelector').value = ""; renderPreview(); });
            document.getElementById('bgPresetSelector').addEventListener('change', (e) => { previewState.bgPreset = e.target.value; renderPreview(); });
            document.getElementById('bgTransparentCheckbox').addEventListener('change', (e) => { previewState.bgTransparent = e.target.checked; renderPreview(); });
            document.getElementById('textColorPicker').addEventListener('input', () => { previewState.textColor = document.getElementById('textColorPicker').value; renderPreview(); });
            document.getElementById('refColorPicker').addEventListener('input', () => { previewState.refColor = document.getElementById('refColorPicker').value; renderPreview(); });
            document.getElementById('refEyeToggleBtn').addEventListener('click', () => {
                previewState.refVisible = previewState.refVisible === false;
                updateLowerThirdControlsVisibility();
                renderPreview();
            });
            
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
                    pauseAllMasterVideosExcept(previewState.mediaKind === 'video' ? previewState.mediaUrl : null);
                    document.getElementById('layoutSelector').value = previewState.layout;
                    document.getElementById('lowerThirdPositionSelector').value = previewState.lowerThirdPosition || 'bottom';
                    updateLowerThirdControlsVisibility();
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
            document.getElementById('fontStyleOverrideSelector').addEventListener('change', (e) => {
                previewState.fontFamilyOverride = e.target.value;
                renderPreview();
            });
            document.getElementById('textShadowSelector').addEventListener('change', (e) => {
                previewState.textShadowStyle = e.target.value;
                renderPreview();
            });
            document.getElementById('fontBoldToggleBtn').addEventListener('click', (e) => {
                previewState.fontBold = !previewState.fontBold;
                e.target.classList.toggle('toggle-active', previewState.fontBold);
                renderPreview();
            });
            document.getElementById('fontItalicToggleBtn').addEventListener('click', (e) => {
                previewState.fontItalic = !previewState.fontItalic;
                e.target.classList.toggle('toggle-active', previewState.fontItalic);
                renderPreview();
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
            renderScriptureHistoryPanel();
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
                        .display-canvas.mode-lowerthird.lt-pos-top { justify-content: flex-start; padding: 4% 4% 0 4% !important; }
                        .display-canvas.mode-lowerthird.lt-pos-center { justify-content: center; padding: 0 4% !important; }
                        .display-canvas.mode-lowerthird .text-display-box-container { margin-bottom: 1%; }
                        .display-canvas.mode-lowerthird .text-out { font-size: calc(var(--canvas-font-size) * 0.85); }
                        .display-canvas.mode-flieronly .text-display-box-container, .display-canvas.mode-flieronly .ref-out { display: none !important; }
                        @keyframes ebpTransFade { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes ebpTransSlide { from { opacity: 0; transform: translateX(18%); } to { opacity: 1; transform: translateX(0); } }
                        @keyframes ebpTransZoom { from { opacity: 0; transform: scale(0.72); } to { opacity: 1; transform: scale(1); } }
                        .ebp-transition-fade { animation: ebpTransFade 0.85s ease both; }
                        .ebp-transition-slide { animation: ebpTransSlide 0.75s cubic-bezier(0.22, 1, 0.36, 1) both; }
                        .ebp-transition-zoom { animation: ebpTransZoom 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
                        @keyframes ebpSlFade { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes ebpSlLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
                        @keyframes ebpSlRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
                        @keyframes ebpSlUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                        @keyframes ebpSlZoomIn { from { opacity: 0; transform: scale(0.75); } to { opacity: 1; transform: scale(1); } }
                        @keyframes ebpSlZoomOut { from { opacity: 0; transform: scale(1.3); } to { opacity: 1; transform: scale(1); } }
                        @keyframes ebpSlBlur { from { opacity: 0; filter: blur(28px); } to { opacity: 1; filter: blur(0); } }
                        @keyframes ebpSlFlip { from { opacity: 0; transform: perspective(1400px) rotateY(88deg); } to { opacity: 1; transform: perspective(1400px) rotateY(0); } }
                        @keyframes ebpSlWipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
                        .ebp-sl-fade { animation: ebpSlFade 0.9s ease both; }
                        .ebp-sl-left { animation: ebpSlLeft 0.8s cubic-bezier(0.22,1,0.36,1) both; }
                        .ebp-sl-right { animation: ebpSlRight 0.8s cubic-bezier(0.22,1,0.36,1) both; }
                        .ebp-sl-up { animation: ebpSlUp 0.8s cubic-bezier(0.22,1,0.36,1) both; }
                        .ebp-sl-zoomin { animation: ebpSlZoomIn 0.8s cubic-bezier(0.22,1,0.36,1) both; }
                        .ebp-sl-zoomout { animation: ebpSlZoomOut 0.8s cubic-bezier(0.22,1,0.36,1) both; }
                        .ebp-sl-blur { animation: ebpSlBlur 0.9s ease both; }
                        .ebp-sl-flip { animation: ebpSlFlip 0.9s ease both; }
                        .ebp-sl-wipe { animation: ebpSlWipe 0.8s ease both; }
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
                        var hint = document.getElementById('fsHint'), idleTimer = null, userExited = false, resumeTimer = null;
                        function enter() { var el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) { el.requestFullscreen().catch(function () {}); } }
                        function sync() {
                            var on = !!document.fullscreenElement;
                            hint.style.opacity = on ? '0' : '1';
                            document.body.style.cursor = on ? 'none' : 'default';
                            // A file/print dialog opened elsewhere in the browser forces every fullscreen window
                            // to drop out — not something this app or an Esc key press did. Snap straight back.
                            if (!on && !userExited) { clearTimeout(resumeTimer); resumeTimer = setTimeout(enter, 60); }
                            userExited = false;
                        }
                        document.addEventListener('fullscreenchange', sync);
                        document.addEventListener('click', enter);
                        document.addEventListener('dblclick', function () { if (document.fullscreenElement) { userExited = true; document.exitFullscreen(); } });
                        document.addEventListener('keydown', function (e) {
                            if (e.key === 'Escape') { userExited = true; return; }
                            if (e.key === 'f' || e.key === 'F' || e.key === 'F11') { e.preventDefault(); if (document.fullscreenElement) { userExited = true; document.exitFullscreen(); } else enter(); }
                        });
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
            try { ovApplyToWindow(projectorWindowRef, 'projector'); } catch (e) {}

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
            const stateSync = { liveState: liveState, cachedLogoDataUrl: cachedLogoDataUrl, overlay: (typeof ovPayload === 'function') ? ovPayload() : undefined };
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

            const customFontFamily = stateObject.fontFamilyOverride || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            const customShadow = stateObject.textShadowStyle != null ? stateObject.textShadowStyle : "0 4px 12px rgba(0,0,0,0.98)";
            const isTextBold = !!stateObject.fontBold;
            const isTextItalic = !!stateObject.fontItalic;
            const customFontWeight = isTextBold ? '900' : '400';
            const customFontStyle = isTextItalic ? 'italic' : 'normal';
            const bgOpacity = stateObject.bgOpacity == null ? 100 : stateObject.bgOpacity;

            container.className = `display-canvas ${stateObject.layout} size-${stateObject.fontSize} lt-pos-${stateObject.lowerThirdPosition || 'bottom'} ${lttBgT(stateObject) ? 'bg-is-transparent' : ''}`;
            container.style.fontFamily = customFontFamily;
            if (!lttBgT(stateObject) && stateObject.bgPreset && DEFAULT_BG_PRESETS[stateObject.bgPreset]) {
                container.style.backgroundColor = 'transparent';
                container.style.backgroundImage = buildPresetBackgroundCss(stateObject.bgPreset, bgOpacity);
            } else {
                container.style.backgroundImage = 'none';
                container.style.backgroundColor = lttBgT(stateObject) ? 'transparent' : hexToRgbaWithOpacity(stateObject.bgColor, bgOpacity);
            }
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
            // Nudge only applies in Lower Third. Uses the CSS "translate" property in canvas-width units (cqw), applied
            // identically to the text AND the reference so they always move together, with no limit on distance.
            const nudgeIsActive = stateObject.layout === 'mode-lowerthird' && (stateObject.textNudgeX || stateObject.textNudgeY);
            const nudgeTransformStyle = nudgeIsActive ? `translate: ${stateObject.textNudgeX || 0}cqw ${stateObject.textNudgeY || 0}cqw;` : '';
            const textHiddenClass = (stateObject.timerVisible && stateObject.timerSolo) ? 'display: none !important;' : '';
            const flierOnlyTextHide = (stateObject.layout === 'mode-flieronly' || (stateObject.displayMode === 'media' && stateObject.mediaUrl)) ? 'display: none !important;' : '';
            const videoAloneHide = ''; // Video BG feature removed — Media tab now covers full-screen video
            const autoFontScale = 1;
            const gradientGlowClass = stateObject.gradientGlowText ? 'gradient-glow-active' : '';
            const dynamicColorVar = `--dynamic-text-color: ${stateObject.textColor || '#38bdf8'};`;
            const backingPanelClass = (stateObject.textBackingPanel && !lttBgT(stateObject)) ? 'backing-panel-active' : ''; // Transparent background is a master override — nothing shows behind the text, so it keys/overlays cleanly

            const nameBarVisible = false; // the name tag is now its own overlay (Message tab → Send Name Tag), never part of the scene
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
                <div class="text-display-box-container ${outTransitionClass} ${backingPanelClass}" style="${boxBgStyleString} ${nudgeTransformStyle} ${textHiddenClass} ${flierOnlyTextHide} ${videoAloneHide}">
                    <div class="text-out ${gradientGlowClass}" style="width:100%; ${dynamicColorVar} color: ${stateObject.textColor || '#ffffff'}; text-shadow: ${customShadow}; font-size: calc(var(--canvas-font-size) * ${autoFontScale}); font-family: ${customFontFamily}; font-weight: ${customFontWeight}; font-style: ${customFontStyle};">${contentNode}</div>
                </div>
                <div class="ref-out ${outTransitionClass}" style="${nudgeTransformStyle} ${stateObject.refVisible === false ? 'display: none !important;' : ''} ${textHiddenClass} ${flierOnlyTextHide} ${videoAloneHide} text-shadow: ${customShadow}; font-family: ${customFontFamily}; ${stateObject.refColor ? `color: ${stateObject.refColor};` : ''}">${stateObject.ref || ''}</div>
                <div class="canvas-timer-node" id="${containerId}OverlayTimer">00:00</div>
                ${nameBarHtml}
                ${announcementHtml}
            `;

            restoreAnnouncementBanner(container, outReusableLayers, announcementHtml.trim());
            try { lttApply(container, stateObject, cachedLogoDataUrl, outTransitionClass); } catch (e) { console.warn('Lower third template:', e); }
            try { ovSceneApply(container, stateObject); } catch (e) {}

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

        // What each output can show. 'live' and 'preview' behave exactly as they always did.
        const OUTPUT_FEED_MODES = [
            { value: 'congregation', label: 'Congregation (no timer)' },
            { value: 'timer', label: 'Preacher: timer only' },
            { value: 'timerverse', label: 'Preacher: timer + verse' },
            { value: 'live', label: 'Live Output (everything)' },
            { value: 'preview', label: 'Preview (Next Up)' }
        ];
        function outputFeedLabel(mode) {
            const m = OUTPUT_FEED_MODES.find(x => x.value === mode);
            return m ? m.label : 'Live Output (everything)';
        }
        function outputFeedShort(mode) {
            return ({ congregation: 'Congregation', timer: 'Timer only', timerverse: 'Timer + verse', live: 'Live', preview: 'Preview' })[mode] || 'Live';
        }
        // The scene each output window actually draws, based on what that output is set to show.
        function getSlotState(slot) {
            switch (slot.sourceMode) {
                case 'preview': return previewState;
                case 'congregation':
                    return { ...liveState, timerVisible: false, timerSolo: false };
                case 'timerverse':
                    return { ...liveState, timerVisible: !!liveState.timerVisible, timerSolo: false };
                case 'timer':
                    return { ...liveState, text: '', ref: '', flierId: null, displayMode: 'text', mediaUrl: null, layout: 'mode-center',
                        bgTransparent: false, bgPreset: '', bgColor: '#000000', bgOpacity: 100, textBgUrl: '',
                        lowerThirdVisible: false, announcementVisible: false, logoPosition: '', isScrolling: false,
                        timerVisible: !!liveState.timerVisible, timerSolo: true, timerPosition: 'timer-center', timerSize: 'timer-size-large', timerScale: 1.5 };
                default: return liveState;
            }
        }

        // Called every timer tick: updates only the timer box inside each open output window (no rebuild, no flicker).
        function updateOutputSlotTimers() {
            outputSlots.forEach(slot => {
                if (!slot.windowRef || slot.windowRef.closed) return;
                const st = getSlotState(slot);
                const node = slot.windowRef.document.getElementById('outputCanvasOverlayTimer');
                if (!node) return;
                node.className = `canvas-timer-node ${st.timerPosition} ${st.timerSize} ${st.timerVisible ? 'timer-visible' : ''}`;
                node.innerText = st.timerText || '00:00';
                const originStr = st.timerPosition === 'timer-center' ? 'center' : (st.timerPosition.includes('left') ? 'left' : 'right');
                node.style.transformOrigin = originStr;
                node.style.transform = `${st.timerPosition === 'timer-center' ? 'translate(-50%, -50%)' : ''} scale(${st.timerScale || 1.0})`;
            });
        }

        function renderOutputSlot(slot) {
            if (!slot.windowRef || slot.windowRef.closed) return;
            renderIntoOutputWindow(slot.windowRef, 'outputCanvas', getSlotState(slot));
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
            bindOutputResizeRefit(slot.windowRef, 'outputCanvas', () => getSlotState(slot));
            try { ovApplyToWindow(slot.windowRef, 's:' + slot.id); } catch (e) {}

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
                            ${OUTPUT_FEED_MODES.map(m => `<option value="${m.value}" ${slot.sourceMode === m.value ? 'selected' : ''}>${m.label}</option>`).join('')}
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
                    if (slot) { slot.name = e.target.value; persistOutputSlotsConfig(); renderOutputsBar(); }
                });
            });
            listEl.querySelectorAll('.output-slot-source-select').forEach(sel => {
                sel.addEventListener('change', (e) => {
                    const slot = outputSlots.find(s => s.id === e.target.dataset.id);
                    if (slot) { slot.sourceMode = e.target.value; persistOutputSlotsConfig(); renderOutputSlot(slot); updateOutputSlotTimers(); renderOutputsBar(); }
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
            renderOutputsBar();
        }

        // ===================== OUTPUTS BAR (dashboard) =====================
        // One chip per output: click the name to open/focus its window, click the tag to choose what that screen shows.
        let outputsBarOpenMenuId = null;
        function outputsBarEnabled() {
            try { return localStorage.getItem('ebpOutputsBarVisible') !== '0'; } catch (e) { return true; }
        }
        function setOutputsBarEnabled(on) {
            try { localStorage.setItem('ebpOutputsBarVisible', on ? '1' : '0'); } catch (e) {}
            outputsBarOpenMenuId = null;
            renderOutputsBar();
        }
        function syncOutputsBarToggleBtn() {
            const btn = document.getElementById('outputsBarToggleBtn');
            if (!btn) return;
            const on = outputsBarEnabled();
            btn.innerText = on ? 'Outputs bar on dashboard: ON' : 'Outputs bar on dashboard: OFF';
            btn.style.background = on ? '#166534' : '#475569';
            btn.style.borderColor = on ? '#15803d' : '#64748b';
        }
        function renderOutputsBar() {
            syncOutputsBarToggleBtn();
            const bar = document.getElementById('outputsBar');
            if (!bar) return;
            if (!outputsBarEnabled()) { bar.style.display = 'none'; bar.innerHTML = ''; return; }
            bar.style.display = 'flex';
            bar.innerHTML = '';
            const title = document.createElement('span');
            title.className = 'outputs-bar-title';
            title.innerText = 'Outputs';
            bar.appendChild(title);
            if (!outputSlots.length) {
                const empty = document.createElement('span');
                empty.className = 'outputs-bar-empty';
                empty.innerText = 'No outputs yet — add one in Settings';
                bar.appendChild(empty);
            }
            outputSlots.forEach(slot => {
                const isOpen = !!(slot.windowRef && !slot.windowRef.closed);
                const chip = document.createElement('div');
                chip.className = 'outputs-chip';
                chip.dataset.slot = slot.id;
                const nameBtn = document.createElement('button');
                nameBtn.type = 'button';
                nameBtn.className = 'outputs-chip-name';
                nameBtn.title = isOpen ? 'Window is open — click to bring it forward' : 'Click to open this output window';
                const dot = document.createElement('span');
                dot.className = 'outputs-dot' + (isOpen ? ' on' : '');
                nameBtn.appendChild(dot);
                nameBtn.appendChild(document.createTextNode(slot.name || 'Output'));
                nameBtn.addEventListener('click', () => { openOutputSlotWindow(slot.id); setTimeout(renderOutputsBar, 400); });
                const tag = document.createElement('button');
                tag.type = 'button';
                tag.className = 'outputs-chip-tag mode-' + (OUTPUT_FEED_MODES.some(m => m.value === slot.sourceMode) ? slot.sourceMode : 'live');
                tag.title = 'Choose what this screen shows';
                tag.innerText = outputFeedShort(slot.sourceMode) + ' ▾';
                tag.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    outputsBarOpenMenuId = outputsBarOpenMenuId === slot.id ? null : slot.id;
                    renderOutputsBar();
                });
                chip.appendChild(nameBtn);
                chip.appendChild(tag);
                if (outputsBarOpenMenuId === slot.id) {
                    const menu = document.createElement('div');
                    menu.className = 'outputs-menu';
                    OUTPUT_FEED_MODES.forEach(m => {
                        const item = document.createElement('button');
                        item.type = 'button';
                        item.className = 'outputs-menu-item' + (slot.sourceMode === m.value ? ' sel' : '');
                        item.innerText = (slot.sourceMode === m.value ? '✓ ' : '') + m.label;
                        item.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            slot.sourceMode = m.value;
                            persistOutputSlotsConfig();
                            outputsBarOpenMenuId = null;
                            renderOutputSlot(slot);
                            updateOutputSlotTimers();
                            renderOutputSlotsList();
                        });
                        menu.appendChild(item);
                    });
                    chip.appendChild(menu);
                }
                bar.appendChild(chip);
            });
            const gear = document.createElement('button');
            gear.type = 'button';
            gear.className = 'outputs-gear';
            gear.title = 'Output settings';
            gear.innerText = '⚙';
            gear.addEventListener('click', () => { const b = document.getElementById('openSettingsModalBtn'); if (b) b.click(); });
            bar.appendChild(gear);
        }
        function initOutputsBar() {
            const toggleBtn = document.getElementById('outputsBarToggleBtn');
            if (toggleBtn) toggleBtn.addEventListener('click', () => setOutputsBarEnabled(!outputsBarEnabled()));
            document.addEventListener('click', () => { if (outputsBarOpenMenuId) { outputsBarOpenMenuId = null; renderOutputsBar(); } });
            document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && outputsBarOpenMenuId) { outputsBarOpenMenuId = null; renderOutputsBar(); } });
            // Keep the green "window open" dots honest when a window is closed by hand
            let lastSig = '';
            setInterval(() => {
                const sig = outputSlots.map(s => (s.windowRef && !s.windowRef.closed) ? '1' : '0').join('');
                if (sig !== lastSig) { lastSig = sig; renderOutputsBar(); }
            }, 1500);
            renderOutputsBar();
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
                    blibEnsureEnabled(importedData.version);
                    document.getElementById('versionSelector').value = importedData.version || "KJV";
                    if (!document.getElementById('versionSelector').value) document.getElementById('versionSelector').value = 'KJV'; // saved profile used a version that is no longer offered (e.g. NIV)
                    currentBookCode = importedData.bookCode; currentBookName = importedData.bookName; currentChapter = importedData.chapter; currentVerse = importedData.verse;
                    // Single scene now: load whichever saved state has content (older exported
                    // profiles may still have separate preview/live states) into the one shared object.
                    const restoredState = importedData.savedLiveState && importedData.savedLiveState.text
                        ? importedData.savedLiveState
                        : (importedData.savedPreviewState || importedData.savedLiveState || previewState);
                    Object.assign(previewState, restoredState);
                    liveState = previewState;
                    try { lttSyncUI(); } catch (e) {}
                    document.getElementById('layoutSelector').value = previewState.layout; document.getElementById('lowerThirdPositionSelector').value = previewState.lowerThirdPosition || 'bottom'; updateLowerThirdControlsVisibility(); document.getElementById('fontSizeInput').value = previewState.fontSize; document.getElementById('bgColorPicker').value = previewState.bgColor; document.getElementById('bgPresetSelector').value = previewState.bgPreset || ""; document.getElementById('textColorPicker').value = previewState.textColor || '#ffffff'; document.getElementById('assetLibraryDropdown').value = previewState.flierId || ""; document.getElementById('logoPositionSelector').value = previewState.logoPosition || ""; document.getElementById('fontStyleOverrideSelector').value = previewState.fontFamilyOverride || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"; document.getElementById('textShadowSelector').value = previewState.textShadowStyle != null ? previewState.textShadowStyle : "0 4px 12px rgba(0,0,0,0.98)"; document.getElementById('fontBoldToggleBtn').classList.toggle('toggle-active', !!previewState.fontBold); document.getElementById('fontItalicToggleBtn').classList.toggle('toggle-active', !!previewState.fontItalic);
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
                    try { ovObsApply(data); } catch (e) {}
                    
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


// ===================== WORKSPACE PANEL POSITIONS (Settings -> Workspace Panels) =====================
(function () {
    const KEYS = ['voice', 'matches', 'history'];
    const LABELS = { voice: 'Voice Diagnostics', matches: 'Scripture Matches', history: 'Scripture History' };
    const SLOT_IDS = ['wsSlotLeft', 'wsSlotBottom', 'wsSlotRight'];
    const STORE = 'ebpWorkspacePanelOrder';
    const DEFAULT = ['voice', 'matches', 'history'];
    let order = DEFAULT.slice();

    const valid = o => Array.isArray(o) && o.length === 3 && KEYS.every(k => o.includes(k));
    function apply() {
        SLOT_IDS.forEach((slotId, i) => {
            const slot = document.getElementById(slotId);
            const panel = document.querySelector(`.ws-panel[data-panel="${order[i]}"]`);
            if (slot && panel && panel.parentElement !== slot) slot.appendChild(panel);
        });
        document.querySelectorAll('.ws-slot-select').forEach(sel => { sel.value = order[Number(sel.dataset.slot)]; });
    }
    function save() { try { localStorage.setItem(STORE, JSON.stringify(order)); } catch (e) {} }
    function init() {
        try { const saved = JSON.parse(localStorage.getItem(STORE)); if (valid(saved)) order = saved; } catch (e) {}
        document.querySelectorAll('.ws-slot-select').forEach(sel => {
            sel.innerHTML = KEYS.map(k => `<option value="${k}">${LABELS[k]}</option>`).join('');
            sel.addEventListener('change', () => {
                const slot = Number(sel.dataset.slot), wanted = sel.value, other = order.indexOf(wanted);
                if (other !== -1 && other !== slot) { order[other] = order[slot]; }
                order[slot] = wanted;
                apply(); save();
            });
        });
        const reset = document.getElementById('wsResetLayoutBtn');
        if (reset) reset.addEventListener('click', () => { order = DEFAULT.slice(); apply(); save(); });
        apply();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

// ===================== SLIDES DISPLAY (Media tab): many images, one after another, with transitions + timing =====================
const slides = { items: [], index: 0, visible: false, playing: true, internal: false, timer: null, seq: 0,
                 interval: 6, transition: 'fade', fit: 'contain', auto: true, loop: true };
const SLIDES_STORE = 'ebpSlidesConfig';

function slidesSave() {
    try { localStorage.setItem(SLIDES_STORE, JSON.stringify({ items: slides.items, interval: slides.interval, transition: slides.transition, fit: slides.fit, auto: slides.auto, loop: slides.loop })); } catch (e) {}
}
function slidesMedia(id) { return mediaLibrary.find(m => m.id === id && m.kind === 'image'); }

// Any other media / text taking over the screen stops the slideshow (so it never fights the operator).
function slidesNoteExternalChange() {
    if (slides.internal || !slides.visible) return;
    slides.visible = false; clearTimeout(slides.timer);
    slidesRefreshUI();
}

function slidesStopTimer() { clearTimeout(slides.timer); slides.timer = null; }
function slidesScheduleNext() {
    slidesStopTimer();
    if (!slides.visible || !slides.auto || !slides.playing || slides.items.length < 2) return;
    slides.timer = setTimeout(() => {
        const last = slides.index >= slides.items.length - 1;
        if (last && !slides.loop) { slides.playing = false; slidesRefreshUI(); return; }
        slidesGo((slides.index + 1) % slides.items.length);
    }, Math.max(1, slides.interval) * 1000);
}

function slidesGo(i) {
    const n = slides.items.length;
    if (!n) return;
    slides.index = ((i % n) + n) % n;
    const m = slidesMedia(slides.items[slides.index]);
    if (!m) { slidesRefreshUI(); return; }
    const wasShowingSlide = previewState.displayMode === 'media' && previewState.mediaKind === 'image';
    const prevUrl = wasShowingSlide ? previewState.mediaUrl : '';
    slides.internal = true;
    try {
        pauseAllMasterVideosExcept(null);
        slides.seq++;
        Object.assign(previewState, { mediaUrl: m.url, mediaKind: 'image', mediaName: m.name, displayMode: 'media', mediaFit: slides.fit,
            mediaPdfId: '', mediaPdfPage: 1, mediaPdfPageCount: 0, slideTransition: slides.transition, slideSeq: slides.seq, slidePrevUrl: prevUrl });
        slides.visible = true;
        updateMediaPanelStatus();
        renderPreview();
        const seq = slides.seq;
        if (prevUrl) setTimeout(() => { if (slides.seq === seq && previewState.mediaUrl === m.url) { previewState.slidePrevUrl = ''; renderPreview(); } }, 1100);
    } finally { slides.internal = false; }
    slidesRefreshUI();
    slidesScheduleNext();
}

function slidesSetVisible(on) {
    if (on) {
        if (!slides.items.length) { slidesRefreshUI(); return; }
        slides.playing = true;
        slidesGo(Math.min(slides.index, slides.items.length - 1));
    } else {
        slidesStopTimer();
        slides.visible = false;
        slides.internal = true;
        try { switchToTextDisplay(); previewState.slideTransition = ''; previewState.slidePrevUrl = ''; renderPreview(); } finally { slides.internal = false; }
        slidesRefreshUI();
    }
}

function slidesRefreshUI() {
    const $ = id => document.getElementById(id);
    if (!$('slidesList')) return;
    const eye = $('slidesEyeBtn');
    eye.classList.toggle('toggle-active', slides.visible);
    eye.style.opacity = slides.visible ? '1' : '0.6';
    $('slidesStatus').innerText = !slides.items.length ? 'No slides yet' : (slides.visible ? `● Slide ${slides.index + 1} / ${slides.items.length} on screen` : `${slides.items.length} slide${slides.items.length > 1 ? 's' : ''} ready (eye is closed)`);
    $('slidesStatus').style.color = slides.visible ? 'var(--accent-live)' : 'var(--text-muted)';
    $('slidesCounter').innerText = slides.items.length ? `${slides.index + 1} / ${slides.items.length}` : '— / —';
    $('slidesPlayBtn').innerText = slides.playing ? '⏸ Pause' : '▶ Play';
    const list = $('slidesList');
    list.innerHTML = '';
    if (!slides.items.length) { list.innerHTML = '<div style="font-size:0.72rem; color:var(--text-muted);">Add several pictures, choose a transition and the time per slide, then open the eye to show them.</div>'; }
    slides.items.forEach((id, i) => {
        const m = slidesMedia(id);
        const row = document.createElement('div');
        row.className = 'slide-row' + (i === slides.index ? ' is-current' : '');
        row.innerHTML = `<span style="font-size:0.7rem; color:var(--text-muted); width:1.2rem;">${i + 1}</span><img src="${m ? m.url : ''}" alt=""><span class="slide-name">${m ? escapeHtmlText(m.name) : 'Missing image'}</span>`
            + `<button type="button" class="btn" data-act="up" title="Move up">↑</button><button type="button" class="btn" data-act="down" title="Move down">↓</button><button type="button" class="btn" data-act="del" title="Remove" style="background:#7f1d1d; border-color:#991b1b;">✕</button>`;
        row.addEventListener('click', (e) => {
            const act = e.target.dataset && e.target.dataset.act;
            if (act === 'up' && i > 0) { [slides.items[i - 1], slides.items[i]] = [slides.items[i], slides.items[i - 1]]; if (slides.index === i) slides.index--; else if (slides.index === i - 1) slides.index++; }
            else if (act === 'down' && i < slides.items.length - 1) { [slides.items[i + 1], slides.items[i]] = [slides.items[i], slides.items[i + 1]]; if (slides.index === i) slides.index++; else if (slides.index === i + 1) slides.index--; }
            else if (act === 'del') { slides.items.splice(i, 1); if (slides.index >= slides.items.length) slides.index = Math.max(0, slides.items.length - 1); if (!slides.items.length && slides.visible) { slidesSave(); slidesSetVisible(false); return; } }
            else if (!act) { slidesSave(); slidesGo(i); return; }
            slidesSave(); slidesRefreshUI();
        });
        list.appendChild(row);
    });
    const sel = $('slidesLibrarySelect');
    sel.innerHTML = '<option value="">Add from saved media…</option>' + mediaLibrary.filter(m => m.kind === 'image').map(m => `<option value="${m.id}">🖼 ${escapeHtmlText(m.name)}</option>`).join('');
}

function initSlidesDisplay() {
    const $ = id => document.getElementById(id);
    if (!$('slidesToggleBtn')) return;
    try {
        const saved = JSON.parse(localStorage.getItem(SLIDES_STORE) || 'null');
        if (saved) Object.assign(slides, { items: Array.isArray(saved.items) ? saved.items : [], interval: saved.interval || 6, transition: saved.transition || 'fade', fit: saved.fit || 'contain', auto: saved.auto !== false, loop: saved.loop !== false });
    } catch (e) {}
    slides.items = slides.items.filter(id => slidesMedia(id)); // drop images that were deleted from the library
    $('slidesIntervalInput').value = slides.interval; $('slidesTransitionSelect').value = slides.transition; $('slidesFitSelect').value = slides.fit;
    $('slidesAutoCheck').checked = slides.auto; $('slidesLoopCheck').checked = slides.loop;

    $('slidesToggleBtn').addEventListener('click', (e) => { e.stopPropagation(); $('slidesDropdown').classList.toggle('open'); });
    $('slidesDropdown').addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => $('slidesDropdown').classList.remove('open'));
    $('slidesEyeBtn').addEventListener('click', () => slidesSetVisible(!slides.visible));

    $('slidesAddBtn').addEventListener('click', () => $('slidesFilePicker').click());
    $('slidesFilePicker').addEventListener('change', async (e) => {
        for (const file of Array.from(e.target.files || [])) {
            if (!file.type.startsWith('image/')) continue;
            const rec = { id: 'media_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), name: file.name, kind: 'image', addedAt: Date.now(), blob: file };
            mediaLibrary.unshift({ id: rec.id, name: rec.name, kind: 'image', addedAt: rec.addedAt, url: URL.createObjectURL(file) });
            try { await mediaDB.put(rec); } catch (err) { console.warn('Could not save image permanently (session-only):', err); }
            slides.items.push(rec.id);
        }
        e.target.value = '';
        refreshMediaDropdown($('mediaLibraryDropdown').value);
        slidesSave(); slidesRefreshUI();
    });
    $('slidesLibrarySelect').addEventListener('change', (e) => {
        if (e.target.value) { slides.items.push(e.target.value); slidesSave(); }
        slidesRefreshUI();
    });
    $('slidesClearBtn').addEventListener('click', () => {
        if (!slides.items.length || !confirm('Remove all images from the slideshow? (They stay in your saved media.)')) return;
        slides.items = []; slides.index = 0; slidesSave();
        if (slides.visible) slidesSetVisible(false); else slidesRefreshUI();
    });
    $('slidesTransitionSelect').addEventListener('change', (e) => { slides.transition = e.target.value; slidesSave(); });
    $('slidesIntervalInput').addEventListener('change', (e) => { slides.interval = Math.max(1, Math.min(600, parseInt(e.target.value, 10) || 6)); e.target.value = slides.interval; slidesSave(); slidesScheduleNext(); });
    $('slidesFitSelect').addEventListener('change', (e) => {
        slides.fit = e.target.value; slidesSave();
        if (slides.visible) { previewState.mediaFit = slides.fit; const fitSel = $('mediaFitSelector'); if (fitSel) fitSel.value = slides.fit; renderPreview(); }
    });
    $('slidesAutoCheck').addEventListener('change', (e) => { slides.auto = e.target.checked; slidesSave(); slidesScheduleNext(); });
    $('slidesLoopCheck').addEventListener('change', (e) => { slides.loop = e.target.checked; slidesSave(); });
    $('slidesPrevBtn').addEventListener('click', () => { if (slides.items.length) slidesGo(slides.index - 1); });
    $('slidesNextBtn').addEventListener('click', () => { if (slides.items.length) slidesGo(slides.index + 1); });
    $('slidesPlayBtn').addEventListener('click', () => {
        slides.playing = !slides.playing;
        slidesRefreshUI();
        if (slides.playing) slidesScheduleNext(); else slidesStopTimer();
    });
    slidesRefreshUI();
}

// ===================== AI SCRIPTURE DETECTION (offline Bible index + confidence-scored matching) =====================
// Pipeline: microphone -> browser speech engine -> rolling transcript (last N seconds) -> local Bible index
//           -> confidence % -> auto-display / operator suggestion. After the one-time index download it needs no internet.
const AI_STORE = 'ebpAiConfig';
const AI_SURE_THRESHOLD = 95;   // at or above this, a match is displayed automatically
const aiConfig = { enabled: false, auto: false, autoThreshold: 90, suggestThreshold: 70, windowSeconds: 20 };
const AI_CHAPTERS = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
const aiIndex = { ready: false, building: false, version: '', verses: [], seqs: [], sets: [], idf: new Map(), post: new Map(), vIdfTotal: [] };
const aiState = { results: {}, floor: 0, lastKey: '', stableCount: 0, lastAutoKey: '', lastAutoTime: 0, timer: null, lastRun: 0 };

const AI_SYN = (() => {
    const g = (canon, words) => words.split(' ').reduce((o, w) => (o[w] = canon, o), {});
    return Object.assign({},
        { thou: 'you', thee: 'you', ye: 'you', thy: 'your', thine: 'your', hath: 'have', hast: 'have', doth: 'do', dost: 'do', art: 'are', wilt: 'will', shalt: 'shall', unto: 'to', saith: 'say', said: 'say', says: 'say', lord: 'god', jehovah: 'god', yahweh: 'god', dont: 'not', cant: 'not', wont: 'not', nor: 'not', neither: 'not', never: 'not', 'no': 'not' },
        g('weary', 'tired exhausted labour labor labours laboured toil toiling worn fatigued'),
        g('burden', 'burdens burdened burdensome laden loaded load loads weight weights carrying'),
        g('fear', 'afraid scared frightened terrified fearful dread dismayed anxious worry worried worry'),
        g('lean', 'depend depends rely relies rest'),
        g('understand', 'understanding wisdom insight'),
        g('forsak', 'abandon abandoned abandons forsake forsaken forsook desert deserted'),
        g('leav', 'leave leaves leaving left'),
        g('promis', 'promise promised promises pledged'),
        g('strong', 'strength strengthen strengthens mighty power powerful courage courageous'),
        g('help', 'helper helps helped assist aid'),
        g('save', 'saved saves saving savior saviour salvation rescue rescued deliver delivered'),
        g('peace', 'calm calmness quiet tranquil'),
        g('joy', 'joyful rejoice rejoicing glad gladness happy happiness'),
        g('forgiv', 'forgive forgave forgiven forgiveness pardon'),
        g('sin', 'sins sinned sinner sinners wrongdoing transgression transgressions iniquity trespass trespasses'),
        g('father', 'dad daddy abba'),
        g('whosoev', 'whoever anyone everyone whomever'),
        g('believ', 'believe believes believed believing faith trust trusts trusted'),
        g('everlast', 'eternal forever endless perpetual'),
        g('perish', 'die dies destroyed destroy destruction'),
        g('begotten', 'only unique'),
        g('hope', 'hopes hoped hopeful expectation'),
        g('path', 'paths way ways road roads direct directs guide guides lead leads'),
        g('wait', 'waits waited patient patience'),
        g('heal', 'heals healed healing healer cure cured'),
        g('creat', 'create created creator made make makes'),
        g('beginn', 'beginning start started origin'),
        g('shepherd', 'shepherds pastor'),
        g('mind', 'thoughts thinking intellect'),
        g('child', 'children kids kid son sons'),
        g('righteous', 'righteousness upright just justice'),
        g('prais', 'praise worship worships worshipped exalt glorify')
    );
})();
const AI_STOP = new Set('a an the and or of to in on at by for with from as is are was were be been being am it its he him she her they them their we us our you your i me my this that these those there here which who whom what when then so but if do does did will would shall should can could may might must have has had also all-the'.split(' '));
function aiStem(w) {
    if (w.length > 4) w = w.replace(/(ing|eth|est|ed|es|s)$/, '');
    return w;
}
function aiCanon(raw) {
    let w = raw;
    if (AI_SYN[w]) w = AI_SYN[w];
    else { const s = aiStem(w); w = AI_SYN[s] || s; }
    return w;
}
// text -> ordered list of canonical content stems (function words dropped)
function aiTokens(text) {
    let t = String(text || '').toLowerCase().replace(/[‘’']/g, "'")
        .replace(/n't\b/g, ' not').replace(/'(ll|ve|re|d|s|m)\b/g, ' ').replace(/[^a-z\s]/g, ' ');
    return t.split(/\s+/).filter(Boolean).map(aiCanon).filter(w => w && !AI_STOP.has(w));
}

// ---- storage (IndexedDB) so the Bible is only downloaded once per version ----
const aiDB = (() => {
    const open = () => new Promise((res, rej) => { const r = indexedDB.open('ebpBibleIndex', 1); r.onupgradeneeded = () => r.result.createObjectStore('idx', { keyPath: 'version' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const run = (mode, fn) => open().then(db => new Promise((res, rej) => { const tx = db.transaction('idx', mode); const rq = fn(tx.objectStore('idx')); tx.oncomplete = () => res(rq.result); tx.onerror = tx.onabort = () => rej(tx.error); }));
    return { get: v => run('readonly', s => s.get(v)), put: rec => run('readwrite', s => s.put(rec)), keys: () => run('readonly', s => s.getAllKeys()) };
})();

function aiBuildStructures(version, verses) {
    aiIndex.version = version; aiIndex.verses = verses;
    aiIndex.seqs = new Array(verses.length); aiIndex.sets = new Array(verses.length);
    const df = new Map();
    verses.forEach((v, i) => {
        const seq = aiTokens(v[3]); aiIndex.seqs[i] = seq;
        const set = new Set(seq); aiIndex.sets[i] = set;
        set.forEach(s => df.set(s, (df.get(s) || 0) + 1));
    });
    const N = verses.length;
    aiIndex.idf = new Map(); aiIndex.post = new Map();
    df.forEach((d, s) => aiIndex.idf.set(s, Math.log(1 + N / d)));
    aiIndex.sets.forEach((set, i) => set.forEach(s => { if (df.get(s) <= 1500) { let p = aiIndex.post.get(s); if (!p) aiIndex.post.set(s, p = []); p.push(i); } }));
    aiIndex.vIdfTotal = aiIndex.sets.map(set => { let t = 0; set.forEach(s => t += aiIndex.idf.get(s)); return t; });
    aiIndex.ready = verses.length > 1000 || verses._test === true;
}

async function aiLoadSavedIndex(preferVersion) {
    try {
        const keys = await aiDB.keys();
        if (!keys.length) return false;
        const pick = keys.includes(preferVersion) ? preferVersion : (keys.includes('KJV') ? 'KJV' : keys[0]);
        const rec = await aiDB.get(pick);
        if (rec && rec.verses && rec.verses.length) { aiBuildStructures(pick, rec.verses); return true; }
    } catch (e) { console.warn('AI index unavailable:', e); }
    return false;
}

async function aiBuildIndex(version, onProgress) {
    if (blibIsLocal(version)) throw new Error('AI Scripture Detection works with English Bibles only. Switch to an English version to use it.');
    if (aiIndex.building) return;
    aiIndex.building = true;
    const jobs = [];
    AI_CHAPTERS.forEach((n, b) => { for (let c = 1; c <= n; c++) jobs.push([b + 1, c]); });
    const verses = []; let done = 0, failed = 0;
    const worker = async () => {
        while (jobs.length) {
            const [book, chap] = jobs.shift();
            let data = null;
            for (let attempt = 0; attempt < 3 && !data; attempt++) {
                try { if (blibIsLocal(version)) data = await blibChapter(version, book, chap); else { const r = await fetch(`https://bolls.life/get-text/${version}/${book}/${chap}/`); if (r.ok) data = await r.json(); } } catch (e) {}
                if (Array.isArray(data) && data.some(v => /prohibited me from using the/i.test(String(v && v.text || '')))) { data = null; attempt = 9; }
            }
            if (Array.isArray(data)) data.forEach(v => verses.push([book, chap, v.verse, cleanBibleText(v.text)]));
            else failed++;
            done++;
            if (onProgress) onProgress(done, AI_CHAPTERS.reduce((a, b) => a + b, 0), failed);
        }
    };
    try {
        await Promise.all(Array.from({ length: 6 }, worker));
        if (failed > 40) throw new Error(`${failed} chapters could not be downloaded — check your internet and try again.`);
        verses.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
        try { await aiDB.put({ version, verses, builtAt: Date.now() }); } catch (e) { console.warn('Could not save index (it will work this session only):', e); }
        aiBuildStructures(version, verses);
    } finally { aiIndex.building = false; }
}

// ---- the matching engine ----
function aiMatch(contextText, maxResults = 3) {
    if (!aiIndex.ready) return [];
    const ctx = aiTokens(contextText);
    if (ctx.length < 3) return [];
    const ctxSet = new Set(ctx);
    const acc = new Map();
    ctxSet.forEach(s => { const p = aiIndex.post.get(s); if (!p) return; const w = aiIndex.idf.get(s); for (let k = 0; k < p.length; k++) acc.set(p[k], (acc.get(p[k]) || 0) + w); });
    const cand = Array.from(acc.entries()).sort((a, b) => b[1] - a[1]).slice(0, 80);
    const out = [];
    for (const [vi] of cand) {
        const set = aiIndex.sets[vi], seq = aiIndex.seqs[vi];
        if (!set.size) continue;
        let matchedIdf = 0, matched = 0;
        set.forEach(s => { if (ctxSet.has(s)) { matched++; matchedIdf += aiIndex.idf.get(s); } });
        if (matched < Math.min(3, set.size) || matchedIdf < 6) continue;
        const cov = matchedIdf / aiIndex.vIdfTotal[vi];
        // longest run of verse words that also appear back-to-back (in order) in what was said
        let best = 0, prev = new Array(ctx.length + 1).fill(0);
        for (let i = 1; i <= seq.length; i++) {
            const cur = new Array(ctx.length + 1).fill(0);
            for (let j = 1; j <= ctx.length; j++) if (seq[i - 1] === ctx[j - 1]) { cur[j] = prev[j - 1] + 1; if (cur[j] > best) best = cur[j]; }
            prev = cur;
        }
        const runFrac = Math.min(1, best / Math.max(3, Math.ceil(seq.length * 0.7)));
        let conf = 100 * (0.55 * cov + 0.35 * runFrac + 0.10 * Math.min(1, matchedIdf / 20));
        conf = Math.min(cov >= 0.999 && runFrac >= 0.999 ? 100 : 99, conf);
        const v = aiIndex.verses[vi];
        out.push({ book: v[0], chapter: v[1], verse: v[2], text: v[3], conf: Math.round(conf), version: aiIndex.version });
    }
    return out.sort((a, b) => b.conf - a.conf).slice(0, maxResults);
}

// ---- rolling transcript (last N seconds) ----
function aiTouchResults(event) {
    const now = Date.now();
    for (let i = event.resultIndex; i < event.results.length; i++) aiState.results[i] = { t: now, text: event.results[i][0].transcript };
}
function aiContextText() {
    const now = Date.now(), min = Math.max(now - aiConfig.windowSeconds * 1000, aiState.floor);
    return Object.keys(aiState.results).map(Number).sort((a, b) => a - b).map(i => aiState.results[i]).filter(r => r.t >= min).map(r => r.text).join(' ');
}

// ---- display / approval ----
async function openSuggestedScripture(item, live) {
    if (live) forceTextVisibleOnDoubleClick();
    currentBookCode = item.book; currentBookName = cleanBookNames[item.book]; currentChapter = item.chapter; currentVerse = item.verse;
    await fetchCurrentChapterFromAPI();
    selectSpecificVerseCoordinate(item.verse);
    if (live) sendStagedToLiveView();
}
function aiIsCurrent(item) { return item.book === currentBookCode && item.chapter === currentChapter && item.verse === currentVerse; }

function aiOnSpeech(event) {
    if (!(aiConfig.enabled && aiIndex.ready)) { updateScriptureSuggestions(event); return; }
    aiTouchResults(event);
    let anyFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) if (event.results[i].isFinal) anyFinal = true;
    aiState.finalSeen = anyFinal;
    if (aiState.timer) return;
    const wait = Math.max(0, 150 - (Date.now() - aiState.lastRun));
    aiState.timer = setTimeout(() => { aiState.timer = null; aiState.lastRun = Date.now(); aiDetectNow(); }, wait);
}

function aiDetectNow() {
    const status = document.getElementById('suggestStatus');
    const ctx = aiContextText();
    const results = aiMatch(ctx, 3);
    const good = results.filter(r => r.conf >= aiConfig.suggestThreshold);
    if (status) status.innerText = good.length ? `AI detection — ${good[0].conf}% best match` : `AI listening… no match above ${aiConfig.suggestThreshold}% yet`;
    if (!good.length) { aiState.lastKey = ''; aiState.stableCount = 0; return; }
    const top = good[0], key = `${top.book}:${top.chapter}:${top.verse}`;
    aiState.stableCount = (key === aiState.lastKey) ? aiState.stableCount + 1 : 1;
    aiState.lastKey = key;
    const eligible = top.conf >= AI_SURE_THRESHOLD || (aiConfig.auto && top.conf >= aiConfig.autoThreshold);
    bollsPrefetch(top.book, top.chapter);                                   // warm the chapter so display is instant
    if (good[1]) bollsPrefetch(good[1].book, good[1].chapter);
    // Needs to stay on top for 2 checks — but the second check must not wait for MORE speech (the old delay):
    // if the preacher has paused, re-check the same context 220ms later instead.
    if (eligible && aiState.stableCount < 2 && !aiState.finalSeen && key !== aiState.lastAutoKey && !aiState.timer) {
        aiState.timer = setTimeout(() => { aiState.timer = null; aiState.lastRun = Date.now(); aiDetectNow(); }, 220);
    }
    if (eligible && (aiState.stableCount >= 2 || (aiState.finalSeen && top.conf >= AI_SURE_THRESHOLD)) && key !== aiState.lastAutoKey && Date.now() - aiState.lastAutoTime > 2000 && !aiIsCurrent(top)) {
        aiState.lastAutoKey = key; aiState.lastAutoTime = Date.now(); aiState.floor = Date.now(); aiState.finalSeen = false;
        top.autoShown = true;
        openSuggestedScripture(top, true);
        if (typeof setVoiceNote === 'function') setVoiceNote(`AI matched ${cleanBookNames[top.book]} ${top.chapter}:${top.verse} (${top.conf}%)`);
    }
    suggestItems = good;
    renderScriptureSuggestions(null);
}

// ---- Settings UI ----
function aiSaveConfig() { try { localStorage.setItem(AI_STORE, JSON.stringify(aiConfig)); } catch (e) {} }
function aiRefreshStatus(extra) {
    const el = document.getElementById('aiIndexStatus');
    if (!el) return;
    el.innerText = extra || (aiIndex.building ? 'Building index…' : (aiIndex.ready ? `Offline index ready — ${aiIndex.version}, ${aiIndex.verses.length.toLocaleString()} verses` : 'No offline index yet — build it once (needs internet), then detection works offline.'));
    ['aiEnableCheck', 'aiQuickToggle'].forEach(id => { const c = document.getElementById(id); if (c) c.checked = aiConfig.enabled; });
}
function initAiScriptureDetection() {
    const $ = id => document.getElementById(id);
    if (!$('aiEnableCheck')) return;
    try { Object.assign(aiConfig, JSON.parse(localStorage.getItem(AI_STORE) || '{}')); } catch (e) {}
    $('aiAutoCheck').checked = aiConfig.auto; $('aiAutoThreshold').value = aiConfig.autoThreshold;
    $('aiSuggestThreshold').value = aiConfig.suggestThreshold; $('aiWindowSeconds').value = aiConfig.windowSeconds;
    const setEnabled = on => { aiConfig.enabled = on; aiSaveConfig(); aiRefreshStatus(); if (on && !aiIndex.ready) { const st = $('suggestStatus'); if (st) st.innerText = 'AI detection needs the offline index — Settings → AI Scripture Detection → Build.'; } };
    $('aiEnableCheck').addEventListener('change', e => setEnabled(e.target.checked));
    $('aiQuickToggle').addEventListener('change', e => setEnabled(e.target.checked));
    $('aiAutoCheck').addEventListener('change', e => { aiConfig.auto = e.target.checked; aiSaveConfig(); });
    const num = (id, key, lo, hi) => $(id).addEventListener('change', e => { let v = parseInt(e.target.value, 10); if (isNaN(v)) v = aiConfig[key]; v = Math.max(lo, Math.min(hi, v)); aiConfig[key] = v; e.target.value = v; if (aiConfig.autoThreshold < aiConfig.suggestThreshold) { aiConfig.autoThreshold = aiConfig.suggestThreshold; $('aiAutoThreshold').value = aiConfig.autoThreshold; } aiSaveConfig(); });
    num('aiAutoThreshold', 'autoThreshold', 50, 100); num('aiSuggestThreshold', 'suggestThreshold', 30, 100); num('aiWindowSeconds', 'windowSeconds', 5, 60);
    $('aiBuildBtn').addEventListener('click', async () => {
        const version = $('versionSelector').value;
        $('aiBuildBtn').disabled = true;
        try { await aiBuildIndex(version, (d, t, f) => aiRefreshStatus(`Downloading ${version}… ${Math.round(d / t * 100)}% (${d}/${t} chapters${f ? ', ' + f + ' failed' : ''})`)); }
        catch (err) { aiRefreshStatus('Index failed: ' + (err.message || err)); $('aiBuildBtn').disabled = false; return; }
        $('aiBuildBtn').disabled = false; aiRefreshStatus();
    });
    aiRefreshStatus();
    aiLoadSavedIndex($('versionSelector').value).then(() => aiRefreshStatus());
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAiScriptureDetection); else initAiScriptureDetection();

(function initRefNumberStyle() {
    const sel = document.getElementById('refNumberStyleSelect');
    if (!sel) return;
    sel.value = refNumberStyle;
    sel.addEventListener('change', () => { refNumberStyle = sel.value === 'chapter' ? 'chapter' : 'split'; try { localStorage.setItem(REF_STYLE_STORE, refNumberStyle); } catch (e) {} });
})();

// ===================== SPLIT LONG VERSES =====================
// A verse that is too long for the scene at the chosen size would normally be shrunk by autoFitVerseText. For exactly those verses
// the verse list shows a small "✂ Split" button. It cuts the verse at natural phrase breaks into the fewest parts that each show at
// FULL size; next/previous (buttons, arrow keys, voice "next") step through the parts, then carry on to the next verse.
// Verses that fit are never touched and get no button.
const splitState = { active: false, verse: 0, parts: [], index: 0 };
const splitProbe = { el: null, textOut: null, baseStyle: '', baseFs: 0, sig: '', timer: null, run: 0, shrinks: new Map() };
let splitApplying = false;

function splitSceneSignature() {
    const c = document.getElementById('liveCanvas');
    if (!c || !c.clientWidth) return '';
    return [c.className, c.clientWidth, c.clientHeight, previewState.fontFamilyOverride, previewState.fontBold, previewState.fontItalic,
        previewState.textBackingPanel, previewState.refVisible, previewState.gradientGlowText, currentBookCode, currentChapter,
        (document.getElementById('versionSelector') || {}).value, activeChapterVerses.length].join('|');
}
function splitRefFor(verse) {
    const ver = document.getElementById('versionSelector');
    return `${blibBookName(currentBookCode, currentBookName)} ${currentChapter}:${verse} (${getVersionDisplayLabel(ver ? ver.value : '')})`;
}
// Hidden twin of the scene (same size, same styles) used only to measure whether a text would be shrunk.
function splitEnsureProbe() {
    const live = document.getElementById('liveCanvas');
    if (!live || !live.clientWidth || !live.clientHeight) return false;
    if (!splitProbe.el) {
        const el = document.createElement('div');
        el.setAttribute('aria-hidden', 'true');
        el.style.cssText = 'position:absolute; left:-20000px; top:0; visibility:hidden; pointer-events:none; aspect-ratio:auto; border:2px solid transparent;';
        (live.parentElement || document.body).appendChild(el);
        splitProbe.el = el;
    }
    const el = splitProbe.el;
    el.style.width = live.offsetWidth + 'px'; el.style.height = live.offsetHeight + 'px';
    const st = Object.assign({}, previewState, { text: 'x', ref: splitRefFor(currentVerse), displayMode: 'text', mediaUrl: '', flierId: '', isScrolling: false,
        timerVisible: false, announcementVisible: false, lowerThirdVisible: false, textNudgeX: 0, textNudgeY: 0, slidePrevUrl: '' });
    buildCanvasDOM(el, st, importedAssetsLibrary, cachedLogoDataUrl, false);
    const t = el.querySelector('.text-out');
    if (!t) return false;
    t.style.fontSize = '';                      // buildCanvasDOM may have shrunk it; restore the selected size
    splitProbe.textOut = t;
    splitProbe.baseStyle = 'calc(var(--canvas-font-size) * 1)';
    t.style.fontSize = splitProbe.baseStyle;
    splitProbe.baseFs = parseFloat(getComputedStyle(t).fontSize) || 0;
    return splitProbe.baseFs > 0;
}
function splitTextShrinks(text) {
    const t = splitProbe.textOut;
    if (!t || !splitProbe.baseFs) return false;
    t.style.fontSize = splitProbe.baseStyle;
    t.textContent = text;
    autoFitVerseText(splitProbe.el);
    const fs = parseFloat(getComputedStyle(t).fontSize) || splitProbe.baseFs;
    t.style.fontSize = splitProbe.baseStyle;
    return fs < splitProbe.baseFs * 0.98;
}

function splitIntoParts(text, n) {
    const total = text.length;
    const punct = [], words = [];
    const reP = /[,;:.!?]["”’')\]]*\s+/g; let m;
    while ((m = reP.exec(text)) !== null) punct.push(m.index + m[0].length);
    const reW = /\s+/g;
    while ((m = reW.exec(text)) !== null) words.push(m.index + m[0].length);
    const cuts = []; let prev = 0;
    for (let k = 1; k < n; k++) {
        const target = total * k / n, tol = total / n * 0.3;
        const pick = (arr) => arr.filter(p => p > prev + 8 && p < total - 8).sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0];
        let c = pick(punct);
        if (c == null || Math.abs(c - target) > tol) { const w = pick(words); if (w != null) c = w; }
        if (c == null || c <= prev) continue;
        cuts.push(c); prev = c;
    }
    const parts = []; let from = 0;
    cuts.forEach(c => { parts.push(text.slice(from, c).trim()); from = c; });
    parts.push(text.slice(from).trim());
    return parts.filter(Boolean);
}
function splitComputeParts(text) {
    if (!splitEnsureProbe()) return [text];
    const wordCount = text.split(/\s+/).length;
    let best = [text];
    for (let n = 2; n <= Math.min(8, wordCount); n++) {
        const parts = splitIntoParts(text, n);
        best = parts;
        if (parts.length >= 2 && parts.every(p => !splitTextShrinks(p))) return parts;
    }
    return best;
}

function splitRenderRowControls(verse) {
    const row = document.getElementById('vRow-' + verse);
    if (!row) return;
    let ctl = row.querySelector('.verse-split-ctl');
    const isActive = splitState.active && splitState.verse === verse;
    if (!isActive && !splitProbe.shrinks.get(verse)) { if (ctl) ctl.remove(); return; }
    if (!ctl) { ctl = document.createElement('div'); ctl.className = 'verse-split-ctl'; row.appendChild(ctl); }
    ['click', 'dblclick', 'mousedown'].forEach(ev => ctl.addEventListener(ev, e => e.stopPropagation()));
    if (!isActive) {
        ctl.innerHTML = '<button type="button" class="verse-split-btn" title="This verse is long, so the scene shrinks it. Split it into parts that show at full size.">✂ Split</button>';
        ctl.querySelector('button').addEventListener('click', e => { e.stopPropagation(); splitStart(verse); });
    } else {
        ctl.innerHTML = `<button type="button" class="verse-split-btn" data-d="-1" title="Previous part">‹</button><span class="verse-split-count">${splitState.index + 1}/${splitState.parts.length}</span><button type="button" class="verse-split-btn" data-d="1" title="Next part">›</button><button type="button" class="verse-split-btn" data-d="x" title="Show the whole verse again">✕</button>`;
        ctl.querySelectorAll('button').forEach(b => b.addEventListener('click', e => {
            e.stopPropagation();
            if (b.dataset.d === 'x') splitCancel(true);
            else splitStep(parseInt(b.dataset.d, 10), true);
        }));
    }
}
function splitApply() {
    const part = splitState.parts[splitState.index];
    splitApplying = true;
    previewState.text = part;
    previewState.ref = `${splitRefFor(splitState.verse)} · ${splitState.index + 1}/${splitState.parts.length}`;
    previewState.isScrolling = false;
    renderPreview();
    transmitStatePacketToRemoteClients();
    splitApplying = false;
    splitRenderRowControls(splitState.verse);
}
function splitStart(verse) {
    const vObj = activeChapterVerses.find(v => v.verse === verse);
    if (!vObj) return;
    if (currentVerse !== verse || !(splitState.active && splitState.verse === verse)) selectSpecificVerseCoordinate(verse);
    const parts = splitComputeParts(vObj.text);
    if (parts.length < 2) return;
    splitState.active = true; splitState.verse = verse; splitState.parts = parts; splitState.index = 0;
    splitApply();
}
// Moves between parts. Returns true when it handled the move (so the caller must not also change verse).
function splitStep(dir, fromButton) {
    if (!splitState.active || splitState.verse !== currentVerse) return false;
    const ni = splitState.index + dir;
    if (ni < 0 || ni >= splitState.parts.length) { if (fromButton) return true; splitCancel(false); return false; }
    splitState.index = ni;
    splitApply();
    return true;
}
function splitCancel(rerender) {
    if (!splitState.active) return;
    const v = splitState.verse;
    splitState.active = false; splitState.parts = [];
    splitRenderRowControls(v);
    if (rerender && v === currentVerse) { selectSpecificVerseCoordinate(v); }
}

// Probe all verses of the open chapter in small slices (never blocks the screen) and show a Split button on the long ones.
function splitScanChapter() {
    const run = ++splitProbe.run;
    splitProbe.shrinks = new Map();
    document.querySelectorAll('#verseGridDeck .verse-split-ctl').forEach(n => { if (!(splitState.active && n.parentElement && n.parentElement.id === 'vRow-' + splitState.verse)) n.remove(); });
    if (!splitEnsureProbe()) return;
    const verses = activeChapterVerses.slice();
    let i = 0;
    const slice = () => {
        if (run !== splitProbe.run) return;
        const end = Math.min(verses.length, i + 8);
        for (; i < end; i++) {
            const v = verses[i];
            const s = splitTextShrinks(v.text);
            splitProbe.shrinks.set(v.verse, s);
            splitRenderRowControls(v.verse);
        }
        if (i < verses.length) setTimeout(slice, 0);
    };
    slice();
}
function splitScheduleCheck(force) {
    const sig = splitSceneSignature();
    if (!sig || (!force && sig === splitProbe.sig)) return;
    splitProbe.sig = sig;
    clearTimeout(splitProbe.timer);
    splitProbe.timer = setTimeout(splitScanChapter, 250);
}

// ---- hooks (wrap the existing functions; their own code is untouched) ----
(function hookSplitLongVerses() {
    const origRender = renderVerseNavigationPanel;
    renderVerseNavigationPanel = function () { const r = origRender.apply(this, arguments); splitProbe.sig = ''; splitScheduleCheck(true); return r; };
    const origSelect = selectSpecificVerseCoordinate;
    selectSpecificVerseCoordinate = function () { if (!splitApplying && splitState.active) splitCancel(false); return origSelect.apply(this, arguments); };
    const origNav = navigateSequentialOffsetVerses;
    navigateSequentialOffsetVerses = function (direction) { if (splitState.active && splitStep(direction, false)) { switchToTextDisplay(); return; } return origNav.apply(this, arguments); };
    const origPreview = renderPreview;
    renderPreview = function () { const r = origPreview.apply(this, arguments); if (!splitApplying) splitScheduleCheck(false); return r; };
    window.addEventListener('resize', () => splitScheduleCheck(false));
})();


// ===================== BIBLE LIBRARY =====================
// Settings → Bible Library: every Bible is listed there with Add / Remove. Only the Bibles a user has ADDED appear in the
// version dropdown. "Live" Bibles are read from the online source on demand (Add just shows them in the dropdown);
// eBible Bibles are downloaded once, unzipped in the browser, saved in IndexedDB and then work offline.
const BLIB = [
    { code: 'KJV',  label: 'KJV (King James Version)', group: 'English', src: 'live' },
    { code: 'NKJV', label: 'NKJV (New King James Version)', group: 'English', src: 'live' },
    { code: 'AMP',  label: 'AMP (Amplified Bible)', group: 'English', src: 'live' },
    { code: 'NLT',  label: 'NLT (New Living Translation)', group: 'English', src: 'live' },
    { code: 'MSG',  label: 'MSG (The Message)', group: 'English', src: 'live' },
    { code: 'ESV',  label: 'ESV (English Standard Version)', group: 'English', src: 'live' },
    { code: 'NASB', label: 'NASB (New American Standard Bible)', group: 'English', src: 'live' },
    { code: 'LSB',  label: 'LSB (Legacy Standard Bible)', group: 'English', src: 'live' },
    { code: 'MEV',  label: 'MEV (Modern English Version)', group: 'English', src: 'live' },
    { code: 'WEB',  label: 'WEB (World English Bible)', group: 'English', src: 'live' },
    { code: 'BSB',  label: 'BSB (Berean Standard Bible)', group: 'English', src: 'live' },
    { code: 'ASV',  label: 'ASV (American Standard Version)', group: 'English', src: 'live' },
    { code: 'YLT',  label: "YLT (Young's Literal Translation)", group: 'English', src: 'live' },
    { code: 'DRB',  label: 'DRB (Douay-Rheims Bible)', group: 'English', src: 'live' },
    { code: 'EB:yor',   label: 'Yorùbá — Yoruba Contemporary Version', short: 'YOR', group: 'Nigeria', src: 'ebible', id: 'yor', credit: 'Biblica' },
    { code: 'EB:hausa', label: 'Hausa — Hausa Open Bible', short: 'HAU', group: 'Nigeria', src: 'ebible', id: 'hausa', credit: 'Biblica' },
    { code: 'EB:ibo', label: 'Igbo — Igbo Contemporary Bible', short: 'IBO', group: 'Nigeria', src: 'ebible', id: 'ibo', credit: 'Biblica' },
    { code: 'EB:pcm', label: 'Nigerian Pidgin', short: 'PCM', group: 'Nigeria', src: 'ebible', id: 'pcm', credit: 'eBible.org' }
];
const BLIB_DEFAULTS = ['KJV', 'NKJV'];
function blibIsLocal(code) { return /^(EB|IM):/.test(String(code || '')); }
(function blibLoadCustom() {
    try { (JSON.parse(localStorage.getItem('ebpCustomBibles') || '[]') || []).forEach(c => { if (c && c.code && !BLIB.some(b => b.code === c.code)) BLIB.push({ code: c.code, label: c.label, short: c.short, group: 'Imported', src: 'import' }); }); } catch (e) {}
})();
function blibSaveCustom() {
    try { localStorage.setItem('ebpCustomBibles', JSON.stringify(BLIB.filter(b => b.src === 'import').map(b => ({ code: b.code, label: b.label, short: b.short })))); } catch (e) {}
}
const blibNames = new Map();
function blibBookName(bookCode, fallback) {
    try { const sel = document.getElementById('versionSelector'); const n = sel && blibNames.get(sel.value); if (n && n[bookCode]) return n[bookCode]; } catch (e) {}
    return fallback;
}
const BLIB_BOOKS = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split(' ');
const BLIB_ALIASES = { SOS: 'SNG', SON: 'SNG', EZE: 'EZK', JOE: 'JOL', NAH: 'NAM', PHI: 'PHP', PHL: 'PHP', MRC: 'MRK', MAR: 'MRK', JHN: 'JHN', JOH: 'JHN', JAM: 'JAS', JUDE: 'JUD', REVE: 'REV', PSM: 'PSA', PS: 'PSA' };
const blibMem = new Map();
const blibBusy = new Set();
const blibNeedFile = new Set();
let blibFilter = 'all';

function blibEntry(code) { return BLIB.find(b => b.code === code); }
function blibEnabled() {
    let list = null;
    try { list = JSON.parse(localStorage.getItem('ebpEnabledVersions') || 'null'); } catch (e) {}
    if (!Array.isArray(list) || !list.length) list = BLIB_DEFAULTS.slice();
    return list.filter(c => blibEntry(c));
}
function blibSaveEnabled(list) { try { localStorage.setItem('ebpEnabledVersions', JSON.stringify(list)); } catch (e) {} }
function blibEnsureEnabled(code) {
    if (!code || !blibEntry(code)) return;
    const list = blibEnabled();
    if (!list.includes(code)) { list.push(code); blibSaveEnabled(list); blibRebuildDropdown(); }
}

// ---- IndexedDB (downloaded Bibles) ----
function blibDb() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) return reject(new Error('This browser cannot save Bibles offline.'));
        const req = indexedDB.open('ebpBibleLibrary', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('bibles', { keyPath: 'code' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('Storage error'));
    });
}
async function blibDbOp(mode, fn) {
    const db = await blibDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('bibles', mode);
        const r = fn(tx.objectStore('bibles'));
        tx.oncomplete = () => resolve(r && r.result);
        tx.onerror = () => reject(tx.error || new Error('Storage error'));
    });
}
const blibDbGet = code => blibDbOp('readonly', s => s.get(code));
const blibDbPut = rec => blibDbOp('readwrite', s => s.put(rec));
const blibDbDel = code => blibDbOp('readwrite', s => s.delete(code));
const blibDbKeys = () => blibDbOp('readonly', s => s.getAllKeys()).then(k => k || []);

async function blibLoad(code) {
    if (blibMem.has(code)) return blibMem.get(code);
    const rec = await blibDbGet(code);
    if (!rec || !rec.verses) return null;
    if (rec.names) blibNames.set(code, rec.names);
    const m = new Map();
    for (const [b, c, v, t] of rec.verses) { const k = b + ':' + c; if (!m.has(k)) m.set(k, []); m.get(k).push({ verse: v, text: t }); }
    m.forEach(arr => arr.sort((a, b) => a.verse - b.verse));
    blibMem.set(code, m);
    return m;
}
async function blibChapter(code, book, ch) {
    let m = null;
    try { m = await blibLoad(code); } catch (e) {}
    const arr = m && m.get(book + ':' + ch);
    if (!arr || !arr.length) {
        const e = new Error('Chapter not saved');
        const ent = blibEntry(code);
        e.ebpNotice = `${ent ? ent.label : code} is not saved on this device, or has no text for this chapter. Open Settings → Bible Library to add it again, or choose another version.`;
        throw e;
    }
    return arr;
}

// ---- zip + verse-per-line reading (all in the browser, no libraries) ----
async function blibUnzip(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf);
    let e = u8.length - 22;
    while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('The downloaded file is not a zip.');
    const n = dv.getUint16(e + 10, true);
    let p = dv.getUint32(e + 16, true);
    const list = [];
    for (let i = 0; i < n; i++) {
        if (dv.getUint32(p, true) !== 0x02014b50) break;
        const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
        const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
        const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl));
        list.push({ name, method, csize, usize, lho });
        p += 46 + nl + xl + cl;
    }
    const read = async ent => {
        const ln = dv.getUint16(ent.lho + 26, true), lx = dv.getUint16(ent.lho + 28, true);
        const start = ent.lho + 30 + ln + lx, data = u8.subarray(start, start + ent.csize);
        if (ent.method === 0) return data;
        if (ent.method !== 8 || typeof DecompressionStream === 'undefined') throw new Error('This browser cannot unpack the file. Please update your browser.');
        const ds = new DecompressionStream('deflate-raw');
        const w = ds.writable.getWriter(); w.write(data); w.close();
        return new Uint8Array(await new Response(ds.readable).arrayBuffer());
    };
    return { list, read };
}
function blibParseVpl(text) {
    const verses = [], re = /^\s*([1-3]?[A-Z]{2,4})\s+(\d+):(\d+)\s+(.+?)\s*$/;
    for (const line of text.split(/\r?\n/)) {
        const m = re.exec(line);
        if (!m) continue;
        const code = BLIB_ALIASES[m[1]] || m[1];
        const bi = BLIB_BOOKS.indexOf(code);
        if (bi < 0) continue;
        const t = m[4].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        if (t) verses.push([bi + 1, +m[2], +m[3], t]);
    }
    return verses;
}
async function blibIngestZip(ent, buf, onProgress) {
    return blibSaveParsed(ent, await blibParseZip(buf), onProgress);
}
async function blibSaveParsed(ent, parsed, onProgress) {
    const verses = parsed.verses || [];
    if (verses.length < 1000) throw new Error('That file did not look like a full Bible, so it was not saved.' + (parsed.hint ? ' (First lines read: "' + parsed.hint + '")' : ''));
    await blibDbPut({ code: ent.code, verses, names: parsed.names || null, savedAt: Date.now() });
    blibMem.delete(ent.code); blibNames.delete(ent.code);
    if (onProgress) onProgress(100);
    return verses.length;
}
async function blibDownloadEbible(ent, onProgress) {
    const url = `https://ebible.org/Scriptures/${ent.id}_vpl.zip`;
    let resp;
    try { resp = await fetch(url); } catch (e) { const er = new Error("eBible.org does not allow this app to download directly from the browser."); er.needFile = true; throw er; }
    if (!resp.ok) throw new Error(`eBible.org did not return the file (error ${resp.status}).`);
    const total = +resp.headers.get('content-length') || 0;
    let buf;
    if (resp.body && resp.body.getReader) {
        const rd = resp.body.getReader(), chunks = []; let got = 0;
        for (;;) { const { done, value } = await rd.read(); if (done) break; chunks.push(value); got += value.length; if (onProgress && total) onProgress(Math.min(95, Math.round(got / total * 95))); }
        const all = new Uint8Array(got); let o = 0; chunks.forEach(c => { all.set(c, o); o += c.length; }); buf = all.buffer;
    } else buf = await resp.arrayBuffer();
    if (onProgress) onProgress(96);
    return blibIngestZip(ent, buf, onProgress);
}

// ---- version dropdown shows only added Bibles ----
function blibRebuildDropdown() {
    const sel = document.getElementById('versionSelector');
    if (!sel) return;
    const keep = sel.value, enabled = blibEnabled();
    sel.innerHTML = '';
    [...new Set(BLIB.filter(x => !x.soon).map(x => x.group))].forEach(g => {
        const items = BLIB.filter(b => b.group === g && !b.soon && enabled.includes(b.code));
        if (!items.length) return;
        const og = document.createElement('optgroup'); og.label = g;
        items.forEach(b => { const o = document.createElement('option'); o.value = b.code; o.textContent = b.label; og.appendChild(o); });
        sel.appendChild(og);
    });
    if ([...sel.options].some(o => o.value === keep)) sel.value = keep;
    else if ([...sel.options].some(o => o.value === 'KJV')) sel.value = 'KJV';
}

// ---- Settings card ----
function blibRenderList() {
    const box = document.getElementById('blibList');
    if (!box) return;
    const enabled = blibEnabled();
    box.innerHTML = '';
    BLIB.filter(b => blibFilter === 'all' || b.group === blibFilter).forEach(b => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:.6rem;padding:.45rem 0;border-top:1px solid rgba(255,255,255,.08);';
        const info = document.createElement('div'); info.style.cssText = 'flex:1;min-width:0;';
        const t = document.createElement('div'); t.style.cssText = 'font-weight:700;color:var(--text-main,#fff);font-size:.8rem;'; t.textContent = b.label;
        const s = document.createElement('div'); s.style.cssText = 'font-size:.7rem;color:var(--text-muted);';
        s.textContent = b.soon ? 'To be confirmed' : (b.src === 'ebible' ? `${b.group} · from eBible.org · ${b.credit}` : (b.src === 'import' ? 'Imported from a file on this device' : b.group + ' · online source'));
        info.append(t, s);
        const act = document.createElement('div'); act.style.cssText = 'display:flex;align-items:center;gap:.5rem;';
        const mkBtn = (txt, fn) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'btn'; x.style.cssText = 'padding:.25rem .7rem;font-size:.72rem;'; x.textContent = txt; x.addEventListener('click', fn); return x; };
        if (b.soon) { const n = document.createElement('span'); n.style.cssText = 'font-size:.72rem;color:var(--text-muted);font-style:italic;'; n.textContent = 'Not available yet'; act.append(n); }
        else if (blibBusy.has(b.code)) { const n = document.createElement('span'); n.id = 'blibProg-' + b.code; n.style.cssText = 'font-size:.72rem;color:#38bdf8;'; n.textContent = 'Downloading… 0%'; act.append(n); }
        else if (enabled.includes(b.code)) {
            const n = document.createElement('span'); n.style.cssText = 'font-size:.72rem;color:#4ade80;'; n.textContent = (b.src === 'ebible' || b.src === 'import') ? '✓ Saved on this device' : '✓ Added';
            act.append(n, mkBtn('Remove', () => blibRemove(b)));
        } else if (b.src === 'ebible' && blibNeedFile.has(b.code)) {
            const lk = document.createElement('a'); lk.href = `https://ebible.org/Scriptures/${b.id}_vpl.zip`; lk.target = '_blank'; lk.rel = 'noopener'; lk.style.cssText = 'font-size:.72rem;color:#38bdf8;'; lk.textContent = '1. Download file';
            act.append(lk, mkBtn('2. Choose file…', () => blibPickFile(b)));
        } else act.append(mkBtn(b.src === 'ebible' ? '⬇ Add' : '＋ Add', () => blibAdd(b)));
        row.append(info, act); box.appendChild(row);
    });
}
function blibNote(msg, bad) {
    const n = document.getElementById('blibNote'); if (!n) return;
    n.textContent = msg || ''; n.style.color = bad ? '#f87171' : 'var(--text-muted)';
}
async function blibAdd(b) {
    if (b.src === 'live') {
        const list = blibEnabled(); if (!list.includes(b.code)) list.push(b.code);
        blibSaveEnabled(list); blibRebuildDropdown(); blibRenderList(); blibNote(`${b.code} added to the version list.`);
        return;
    }
    blibBusy.add(b.code); blibNote(''); blibRenderList();
    try {
        const count = await blibDownloadEbible(b, p => { const e = document.getElementById('blibProg-' + b.code); if (e) e.textContent = `Downloading… ${p}%`; });
        const list = blibEnabled(); if (!list.includes(b.code)) list.push(b.code);
        blibSaveEnabled(list); blibRebuildDropdown(); blibNote(`${b.label} saved (${count.toLocaleString()} verses). It is now in the version list.`);
    } catch (err) {
        if (err.needFile) { blibNeedFile.add(b.code); blibNote(err.message + ' Use the two steps shown: download the file from eBible.org, then choose it here.', true); }
        else blibNote(err.message || String(err), true);
    }
    blibBusy.delete(b.code); blibRenderList();
}
async function blibSearch(code, query) {
    const norm = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const q = norm(query).trim();
    const rec = await blibDbGet(code);
    if (!rec || !rec.verses) return { total: 0, results: [] };
    const results = []; let total = 0;
    for (const [book, chapter, verse, text] of rec.verses) {
        if (norm(text).includes(q)) { total++; if (results.length < 40) results.push({ book, chapter, verse, text }); }
    }
    return { total, results };
}
function blibPickFile(b) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.zip,application/zip';
    inp.addEventListener('change', async () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        blibBusy.add(b.code); blibNote(''); blibRenderList();
        try {
            const count = await blibIngestZip(b, await f.arrayBuffer(), p => { const e = document.getElementById('blibProg-' + b.code); if (e) e.textContent = `Saving… ${p}%`; });
            const list = blibEnabled(); if (!list.includes(b.code)) list.push(b.code);
            blibSaveEnabled(list); blibNeedFile.delete(b.code); blibRebuildDropdown(); blibNote(`${b.label} saved (${count.toLocaleString()} verses). It is now in the version list.`);
        } catch (err) { blibNote(err.message || String(err), true); }
        blibBusy.delete(b.code); blibRenderList();
    });
    inp.click();
}
async function blibRemove(b) {
    const list = blibEnabled();
    if (list.length <= 1) { blibNote('Keep at least one Bible in the list.', true); return; }
    const sel = document.getElementById('versionSelector'), wasCurrent = sel && sel.value === b.code;
    blibSaveEnabled(list.filter(c => c !== b.code));
    if (b.src === 'ebible' || b.src === 'import') { try { await blibDbDel(b.code); } catch (e) {} blibMem.delete(b.code); blibNames.delete(b.code); }
    if (b.src === 'import') { const ix = BLIB.indexOf(b); if (ix >= 0) BLIB.splice(ix, 1); blibSaveCustom(); }
    blibRebuildDropdown(); blibRenderList(); blibNote(`${b.src === 'live' ? b.code : (b.short || b.label)} removed.`);
    if (wasCurrent && typeof fetchCurrentChapterFromAPI === 'function') fetchCurrentChapterFromAPI();
}

// ---- hooks: local Bibles read from storage; label for the on-screen reference ----
(function hookBibleLibrary() {
    const origJson = bollsChapterJson;
    bollsChapterJson = function (ver, book, ch) { if (blibIsLocal(ver)) return blibChapter(ver, book, ch); return origJson.apply(this, arguments); };
    const origLabel = getVersionDisplayLabel;
    getVersionDisplayLabel = function (code) { const e = blibEntry(code); return (e && e.short) || origLabel.apply(this, arguments); };
})();
function initBibleLibrary() {
    blibRebuildDropdown();
    const f = document.getElementById('blibFilter');
    if (f) f.addEventListener('change', () => { blibFilter = f.value; blibRenderList(); });
    blibRenderList();
    // a downloaded Bible removed from browser storage (e.g. site data cleared) must not stay in the list
    blibDbKeys().then(keys => {
        BLIB.filter(x => x.src === 'import' && !keys.includes(x.code)).forEach(x => BLIB.splice(BLIB.indexOf(x), 1)); blibSaveCustom();
        const list = blibEnabled(), fixed = list.filter(c => { const e = blibEntry(c); return !(e && (e.src === 'ebible' || e.src === 'import')) || keys.includes(c); });
        if (fixed.length !== list.length && fixed.length) blibSaveEnabled(fixed);
        blibRebuildDropdown(); blibRenderList();
    }).catch(() => {});
}
initBibleLibrary();


// ===================== BIBLE LIBRARY: IMPORT FROM FILES =====================
const BLIB_OSIS = 'Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev'.split(' ');
let blibNameMap = null;
function blibKey(s) {
    return String(s == null ? '' : s).toLowerCase().trim().replace(/^(first|1st|i)\b\s*/, '1').replace(/^(second|2nd|ii)\b\s*/, '2').replace(/^(third|3rd|iii)\b\s*/, '3').replace(/[^a-z0-9]/g, '');
}
function blibBookIdx(x) {
    if (typeof x === 'number') return x >= 1 && x <= 66 ? x : 0;
    if (!blibNameMap) {
        blibNameMap = new Map();
        const add = (k, i) => { k = blibKey(k); if (k && !blibNameMap.has(k)) blibNameMap.set(k, i); };
        for (let i = 1; i <= 66; i++) { add(cleanBookNames[i], i); add(BLIB_BOOKS[i - 1], i); add(BLIB_OSIS[i - 1], i); add(String(i), i); }
        Object.entries(BLIB_ALIASES).forEach(([k, v]) => add(k, BLIB_BOOKS.indexOf(v) + 1));
        add('psalm', 19); add('songofsongs', 22); add('canticles', 22); add('revelations', 66); add('apocalypse', 66);
        const ab = 'Gn Ge Gen|Ex Exo Exod|Lv Le Lev|Nm Nu Num|Dt De Deu Deut|Jos Josh|Jdg Jg Judg Jud|Ru Rut|1Sa 1Sm 1Sam|2Sa 2Sm 2Sam|1Ki 1Kg 1Kgs|2Ki 2Kg 2Kgs|1Ch 1Chr|2Ch 2Chr|Ezr|Ne Neh|Es Est Esth|Jb Job|Ps Psa Pss Psm|Pr Pro Prv Prov|Ec Ecc Eccl Qoh|So Sg Song SS SOS|Is Isa|Je Jer|La Lam|Eze Ezk Ezek|Da Dn Dan|Ho Hos|Joe Jl|Am Amo|Ob Oba Obad|Jon Jnh|Mi Mic|Na Nah|Hab Hb|Zep Zph Zeph|Hag Hg|Zec Zch Zech|Mal Ml|Mt Mat Matt|Mk Mr Mar Mrk|Lk Lu Luk|Jn Joh|Ac Act|Ro Rom|1Co 1Cor|2Co 2Cor|Ga Gal|Eph Ep|Php Phi Phil Pp|Col|1Th 1Thes 1Thess|2Th 2Thes 2Thess|1Ti 1Tim|2Ti 2Tim|Tit Ti|Phm Phlm Pm|He Heb|Jas Jam Jm|1Pe 1Pet|2Pe 2Pet|1Jn 1Jo 1Joh|2Jn 2Jo 2Joh|3Jn 3Jo 3Joh|Jude Jd|Re Rev Rv'.split('|');
        ab.forEach((grp, i) => grp.split(' ').forEach(k => add(k, i + 1)));
    }
    const k = blibKey(x);
    if (blibNameMap.has(k)) return blibNameMap.get(k);
    if (k.length >= 3) { let hit = 0, n = 0; blibNameMap.forEach((i, key) => { if (key.length > 2 && key.startsWith(k) && !/^\d+$/.test(key) && hit !== i) { hit = i; n++; } }); if (n === 1) return hit; }
    return 0;
}
const blibHint = t => String(t).replace(/^\uFEFF/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 3).map(l => l.slice(0, 60)).join(' ⏎ ');
const blibClean = t => String(t == null ? '' : t).replace(/¶/g, '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

function blibParseVerseLines(text) {
    const verses = [], re = /^\s*\[?(.+?)\s+(\d+)[:.](\d+)\]?[\s|:-]+(.+?)\s*$/;
    for (const line of text.split(/\r?\n/)) {
        const m = re.exec(line); if (!m) continue;
        const bi = blibBookIdx(m[1]); const t = blibClean(m[4]);
        if (bi && t) verses.push([bi, +m[2], +m[3], t]);
    }
    return verses;
}
function blibParseChapterText(text) {
    // Layout:  Genesis / Chapter 1 (or Psalm 1) / "1 In the beginning…" with long verses wrapped over several lines.
    const lines = text.replace(/^﻿/, '').split(/\r?\n/).map(l => l.trim());
    const out = []; let book = 0, chap = 0, last = 0, buf = null;
    const isHead = l => /^(?:chapter|psalm)\s+\d+$/i.test(l);
    const flush = () => { if (buf) { const t = blibClean(buf.t); if (t) out.push([buf.b, buf.c, buf.v, t]); buf = null; } };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]; if (!line) continue;
        let m = /^(?:chapter|psalm)\s+(\d+)$/i.exec(line);
        if (m && book) { flush(); chap = +m[1]; last = 0; continue; }
        if (line.length < 30 && !/\d/.test(line.replace(/^[1-3]\s/, ''))) {
            const bi = blibBookIdx(line);
            if (bi) { let j = i + 1; while (j < lines.length && !lines[j]) j++; if (j < lines.length && isHead(lines[j])) { flush(); book = bi; chap = 0; last = 0; continue; } }
        }
        if (!book || !chap) continue;
        m = /^(\d+)\s+(.*)$/.exec(line);
        if (m && +m[1] === last + 1) { flush(); last = +m[1]; buf = { b: book, c: chap, v: last, t: m[2] }; continue; }
        if (buf) buf.t += ' ' + line;
    }
    flush();
    return out;
}
function blibParseCsv(text) {
    const probe = text.split(/\r?\n/).filter(l => l.trim()).slice(0, 12);
    const count = (l, d) => l.split(d).length - 1;
    let delim = ',', bestScore = -1;
    for (const d of [',', '\t', ';', '|']) { const sc = probe.filter(l => count(l, d) >= 3).length; if (sc > bestScore) { bestScore = sc; delim = d; } }
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
        else if (ch === '"' && cur === '') q = true;
        else if (ch === delim) { row.push(cur); cur = ''; }
        else if (ch === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
        else cur += ch;
    }
    if (cur || row.length) { row.push(cur.replace(/\r$/, '')); rows.push(row); }
    const data = rows.filter(r => r.length >= 4);
    if (!data.length) return [];
    let bi = -1, ci = -1, vi = -1, ti = -1, start = 0;
    const head = data[0].map(h => blibKey(h));
    if (head.some(h => h === 'chapter' || h === 'verse' || h === 'text' || h === 'book' || h === 'bookname')) {
        start = 1;
        const f = (...n) => { for (const name of n) { const k = head.indexOf(name); if (k >= 0) return k; } return -1; };   // first name in priority order wins (so "Verse ID" is never taken as the verse number)
        bi = f('bookname', 'book', 'bookid', 'booknumber', 'b'); ci = f('chapter', 'chapterid', 'c'); vi = f('verse', 'versenumber', 'verseid', 'v'); ti = f('text', 'versetext', 'content', 't', 'scripture');
        if (bi < 0 || ci < 0 || vi < 0 || ti < 0) return [];
    }
    const out = [];
    for (let r = start; r < data.length; r++) {
        const x = data[r]; let b = bi, c = ci, v = vi, t = ti;
        if (b < 0) {   // no header: find "book, chapter, verse, text…" anywhere in the row
            for (let k = 0; k + 3 < x.length; k++) { if (/^\d+$/.test(x[k + 1].trim()) && /^\d+$/.test(x[k + 2].trim()) && blibBookIdx(/^\d+$/.test(x[k].trim()) ? +x[k] : x[k])) { b = k; c = k + 1; v = k + 2; t = k + 3; break; } }
            if (b < 0) continue;
        }
        const bk = blibBookIdx(/^\d+$/.test((x[b] || '').trim()) ? +x[b] : x[b]); const tx = blibClean(t === ti ? x[t] : x.slice(t).join(delim));
        if (bk && +x[c] > 0 && +x[v] > 0 && tx) out.push([bk, +x[c], +x[v], tx]);
    }
    return out;
}
function blibParseJson(text) {
    let j; try { j = JSON.parse(text); } catch (e) { return []; }
    const out = [];
    const push = (b, c, v, t) => { const bi = blibBookIdx(typeof b === 'string' && /^\d+$/.test(b) ? +b : b); const tt = blibClean(t); if (bi && +c > 0 && +v > 0 && tt) out.push([bi, +c, +v, tt]); };
    const eachChap = (bi, c, node) => {
        if (Array.isArray(node)) node.forEach((vt, vi) => { if (typeof vt === 'string') push(bi, c, vi + 1, vt); else if (vt && typeof vt === 'object') push(bi, c, vt.verse != null ? vt.verse : (vt.number != null ? vt.number : vi + 1), vt.text != null ? vt.text : vt.t); });
        else if (node && typeof node === 'object') { if (Array.isArray(node.verses)) return eachChap(bi, c, node.verses); Object.entries(node).forEach(([vk, vt]) => { if (typeof vt === 'string' && +vk > 0) push(bi, c, +vk, vt); }); }
    };
    const walkBook = (node, hint) => {
        let name = hint, chapters = node;
        if (node && !Array.isArray(node) && typeof node === 'object') { name = node.name || node.book || node.abbrev || node.title || hint; chapters = node.chapters || node.Chapters || node.chapter || node; }
        const bi = blibBookIdx(name) || blibBookIdx(hint); if (!bi) return;
        if (Array.isArray(chapters)) chapters.forEach((cn, ci) => { if (cn && !Array.isArray(cn) && typeof cn === 'object' && cn.verses) eachChap(bi, cn.chapter || cn.number || ci + 1, cn.verses); else eachChap(bi, ci + 1, cn); });
        else if (chapters && typeof chapters === 'object') Object.entries(chapters).forEach(([ck, cn]) => { if (+ck > 0) eachChap(bi, +ck, cn); });
    };
    let list = Array.isArray(j) ? j : (Array.isArray(j.verses) ? j.verses : null);
    if (list) {
        list.forEach(o => { if (o && typeof o === 'object' && !Array.isArray(o)) { const g = (...k) => { for (const x of k) if (o[x] != null) return o[x]; }; push(g('book', 'book_id', 'bookId', 'book_name', 'bookName', 'b'), g('chapter', 'chapter_id', 'chapterId', 'c'), g('verse', 'verse_id', 'verseId', 'v'), g('text', 't', 'content', 'verse_text')); } });
        if (out.length) return out;
        list.forEach((bk, i) => walkBook(bk, i + 1));
        return out;
    }
    const books = j.books || j.Books || j.bible || null;
    if (Array.isArray(books)) { books.forEach((bk, i) => walkBook(bk, i + 1)); return out; }
    Object.entries(books && typeof books === 'object' ? books : j).forEach(([k, val]) => {
        const m = /^(.+?)\s+(\d+):(\d+)$/.exec(k);
        if (m && typeof val === 'string') push(m[1], m[2], m[3], val); else walkBook(val, k);
    });
    return out;
}
function blibParseXml(text) {
    const doc = new DOMParser().parseFromString(text, 'text/xml'); const out = [];
    if (doc.querySelector('parsererror')) return out;
    doc.querySelectorAll('BIBLEBOOK, biblebook').forEach((bk, i) => {
        const bi = blibBookIdx(+bk.getAttribute('bnumber') || bk.getAttribute('bname') || bk.getAttribute('bsname') || i + 1) || (i + 1 <= 66 ? i + 1 : 0); if (!bi) return;
        bk.querySelectorAll('CHAPTER, chapter').forEach(ch => { const c = +ch.getAttribute('cnumber'); ch.querySelectorAll('VERS, vers').forEach(v => { const t = blibClean(v.textContent); if (c > 0 && +v.getAttribute('vnumber') > 0 && t) out.push([bi, c, +v.getAttribute('vnumber'), t]); }); });
    });
    if (out.length) return out;
    // generic: any element carrying book / chapter / verse attributes (e.g. <verse book="GEN" chapter="1" verse="1">…</verse>)
    const attr = (el, ...n) => { for (const k of n) { const x = el.getAttribute(k); if (x != null && x !== '') return x; } return null; };
    doc.querySelectorAll('*').forEach(el => {
        const b = attr(el, 'book', 'bk', 'b', 'bookid', 'bookId'), c = attr(el, 'chapter', 'ch', 'c', 'chapterid'), v = attr(el, 'verse', 'vs', 'v', 'number', 'verseid');
        if (b == null || c == null || v == null || el.children.length) return;
        const bi = blibBookIdx(/^\d+$/.test(b) ? +b : (BLIB_BOOKS.indexOf(BLIB_ALIASES[b] || b.toUpperCase()) + 1 || b)); const t = blibClean(el.textContent);
        if (bi && +c > 0 && +v > 0 && t) out.push([bi, +c, +v, t]);
    });
    if (out.length) return out;
    doc.querySelectorAll('verse').forEach(v => {
        const id = (v.getAttribute('osisID') || '').split(/\s+/)[0]; const m = /^([^.]+)\.(\d+)\.(\d+)/.exec(id); if (!m) return;
        const bi = blibBookIdx(m[1]); const clone = v.cloneNode(true); clone.querySelectorAll('note').forEach(n => n.remove());
        const t = blibClean(clone.textContent); if (bi && t) out.push([bi, +m[2], +m[3], t]);
    });
    return out;
}
function blibParseUsfm(text, names) {
    const out = []; let book = 0, chap = 0, verse = 0, buf = '';
    const strip = t => t.replace(/\\(f|fe|x)\s.*?\\\1\*/g, '').replace(/\|[^\\|]*?(?=\\\+?\w+\*)/g, '').replace(/\\\+?\w+\*/g, '').replace(/\\\+?\w+\s?/g, '').replace(/\s+/g, ' ').trim();
    const flush = () => { if (book && chap && verse) { const t = strip(buf); if (t) out.push([book, chap, verse, t]); } buf = ''; verse = 0; };
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim(); let m;
        if ((m = /^\\id\s+(\S+)/.exec(line))) { flush(); book = BLIB_BOOKS.indexOf(BLIB_ALIASES[m[1]] || m[1]) + 1; chap = 0; continue; }
        if (!book) continue;
        if ((m = /^\\h\s+(.+)/.exec(line))) { if (names && !names[book]) names[book] = strip(m[1]); continue; }
        if ((m = /^\\toc2\s+(.+)/.exec(line))) { if (names && !names[book]) names[book] = strip(m[1]); continue; }
        if ((m = /^\\c\s+(\d+)/.exec(line))) { flush(); chap = +m[1]; continue; }
        if ((m = /^\\v\s+(\d+)(?:[-,]\d+)?\s*(.*)$/.exec(line))) { flush(); verse = +m[1]; buf = m[2]; continue; }
        if (/^\\(s\d?|r|d|ms\d?|mr|mt\d?|sp|cl|cd|toc\d|rem|ide|sts|h\d|imt\d?|is\d?|ip|ie|b)\b/.test(line)) continue;
        if (verse && line) buf += ' ' + line.replace(/^\\(p|m|mi|pi\d?|q\d?|qr|qc|li\d?|nb|pmo|pm|pc|pr)\b\s*/, '');
    }
    flush();
    return out;
}
function blibSniffAndParse(text, nameHint) {
    const ext = (nameHint.match(/\.([a-z0-9]+)$/i) || [])[1] || ''; const t = text.replace(/^﻿/, '');
    const head = t.trimStart().slice(0, 400);
    const names = {};
    let v = [];
    if (/^<\?xml|^<(XMLBIBLE|osis|usx|bible)/i.test(head) || /^xml$/i.test(ext)) v = blibParseXml(t);
    else if (/^[\[{]/.test(head) || /^json$/i.test(ext)) v = blibParseJson(t);
    else if (/\\id\s+[A-Z0-9]{3}/.test(t.slice(0, 2000)) || /^(usfm|sfm|ptx)$/i.test(ext)) v = blibParseUsfm(t, names);
    if (!v.length) { v = blibParseVerseLines(t); if (v.length < 1000) { const ct = blibParseChapterText(t); if (ct.length > v.length) v = ct; } if (v.length < 1000) { const c = blibParseCsv(t); if (c.length > v.length) v = c; } }
    return { verses: v, names: Object.keys(names).length ? names : null, hint: blibHint(t) };
}
async function blibParseZip(buf) {
    const zip = await blibUnzip(buf);
    const dec = new TextDecoder('utf-8');
    const usfm = zip.list.filter(f => /\.(usfm|sfm|ptx)$/i.test(f.name));
    if (usfm.length) {
        const names = {}, verses = [];
        for (const f of usfm) verses.push(...blibParseUsfm(dec.decode(await zip.read(f)), names));
        if (verses.length) return { verses, names: Object.keys(names).length ? names : null };
    }
    // Try the plain-text (verse-per-line) files first, then everything else, until one reads as a full Bible.
    const cands = zip.list.filter(f => /\.(txt|vpl|json|xml|csv|tsv)$/i.test(f.name) && !/copr|licen|readme/i.test(f.name))
        .sort((a, b) => ((/\.(txt|vpl)$/i.test(b.name) ? 1 : 0) - (/\.(txt|vpl)$/i.test(a.name) ? 1 : 0)) || (b.usize - a.usize));
    if (!cands.length) throw new Error('That file has no readable Bible text.');
    let best = { verses: [], hint: '' };
    for (const f of cands) {
        const text = dec.decode(await zip.read(f));
        let verses = blibParseVpl(text), res = { verses, hint: blibHint(text) };
        if (verses.length < 1000) res = blibSniffAndParse(text, f.name);
        if (res.verses.length >= 1000) return res;
        if (res.verses.length > best.verses.length || !best.hint) best = res;
    }
    return best;
}
async function blibParseFiles(files) {
    if (files.length === 1 && /\.zip$/i.test(files[0].name)) return blibParseZip(await files[0].arrayBuffer());
    const names = {}, verses = []; let hint = '';
    for (const f of files) {
        if (/\.zip$/i.test(f.name)) { const z = await blibParseZip(await f.arrayBuffer()); verses.push(...z.verses); if (z.names) Object.assign(names, z.names); continue; }
        const r = blibSniffAndParse(new TextDecoder('utf-8').decode(await f.arrayBuffer()), f.name);
        verses.push(...r.verses); if (r.names) Object.assign(names, r.names); hint = hint || r.hint;
    }
    return { verses, names: Object.keys(names).length ? names : null, hint };
}
async function blibImportFiles(files, label) {
    const code = 'IM:' + blibKey(label).slice(0, 24) + '-' + Date.now().toString(36);
    const ent = { code, label, short: label.replace(/[^\p{L}\p{N}]+/gu, '').slice(0, 6).toUpperCase() || 'IMP', group: 'Imported', src: 'import' };
    const count = await blibSaveParsed(ent, await blibParseFiles(files), null);
    BLIB.push(ent); blibSaveCustom();
    const list = blibEnabled(); list.push(code); blibSaveEnabled(list);
    return { ent, count };
}
function initBibleImport() {
    const btn = document.getElementById('blibImportBtn'), nameIn = document.getElementById('blibImportName'); if (!btn || !nameIn) return;
    btn.addEventListener('click', () => {
        const label = nameIn.value.trim();
        if (!label) { blibNote('Type a name for this Bible first (for example: My Yoruba Bible).', true); nameIn.focus(); return; }
        const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.accept = '.zip,.json,.txt,.csv,.tsv,.xml,.usfm,.sfm,.vpl';
        inp.addEventListener('change', async () => {
            const files = [...(inp.files || [])]; if (!files.length) return;
            btn.disabled = true; blibNote('Reading file…');
            try {
                const r = await blibImportFiles(files, label);
                nameIn.value = ''; blibRebuildDropdown(); blibRenderList();
                blibNote(`${r.ent.label} imported (${r.count.toLocaleString()} verses). It is now in the version list under “Imported”.`);
            } catch (err) { blibNote(err.message || String(err), true); }
            btn.disabled = false;
        });
        inp.click();
    });
}
initBibleImport();


// ---- Voice accent (opt-in; default stays en-US so nothing changes unless you pick another) ----
(function initVoiceAccent() {
    const sel = document.getElementById('voiceAccentSelect'); if (!sel) return;
    try { sel.value = localStorage.getItem('ebpVoiceLang') || 'en-US'; } catch (e) {}
    if (!sel.value) sel.value = 'en-US';
    sel.addEventListener('change', () => {
        try { localStorage.setItem('ebpVoiceLang', sel.value); } catch (e) {}
        const n = document.getElementById('voiceAccentNote'); if (n) n.textContent = 'Saved. It applies the next time you turn Live Voice on.';
    });
})();


// ===================== LOWER THIRD TEMPLATES (verse + name tag) =====================
// Ready-made lower-third looks. Every part is a CSS shape (not a picture), so every colour, the gradient and the
// font can be changed. When a template is active in the Lower Third layout the canvas background becomes
// transparent, so the bar overlays cleanly on camera / video (OBS, projector, extra screens).
var LTT_SAMPLE_V = 'For God so loved the world, that he gave his only begotten Son…';
var LTT_SAMPLE_R = 'John 3:16 · KJV';
var LTT_LOGO_PH = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><text x="60" y="70" font-family="Arial" font-weight="900" font-size="30" fill="#ffffff" text-anchor="middle">LOGO</text></svg>');
var LTT_ORDER = ['broadcast', 'logo', 'capsule', 'slant', 'wave', 'glass', 'outline', 'church'];
var LTT_COLOR_LABELS = { c1: 'Main bar colour', c1b: 'Gradient end colour', c2: 'Accent / tab colour', c3: 'Verse text colour', c4: 'Reference strip colour', c5: 'Reference text colour', c6: 'Border / outline colour' };
var LTT_BASE = { c1: '#f5b800', c1b: '#e09a00', c2: '#e8a400', c3: '#ffffff', c4: '#ffffff', c5: '#222222', c6: '#ffffff', grad: true, dir: '180deg', opacity: 100, showRef: true, showLogo: true, font: '' };
function lttImg(u) { return u ? `<img src="${u}" alt="">` : ''; }
var LTT = {
    broadcast: { name: 'Broadcast Bar', nameAcc: 'c2', uses: ['c1', 'c1b', 'c2', 'c3', 'c4', 'c5', 'c6'], d: {},
        html: c => `<div class="q-tab"></div><div class="q-main"><div class="q-bar"><div class="ltt-verse">${c.v}</div></div>${c.r ? `<div class="q-strip"><div class="ltt-ref">${c.r}</div></div>` : ''}</div>` },
    logo: { name: 'Logo Block', nameAcc: 'c2', uses: ['c1', 'c1b', 'c2', 'c3', 'c4', 'c5', 'c6'], d: { c1: '#ffd000', c1b: '#f0b800', c2: '#1c1c1c', c3: '#1c1c1c', c4: '#1c1c1c', c5: '#ffffff', c6: '#ffffff', grad: false },
        html: c => `${c.logo ? `<div class="q-logo">${lttImg(c.logo)}</div>` : ''}<div class="q-frame"><div class="q-bar"><div class="ltt-verse">${c.v}</div></div></div>${c.r ? `<div class="q-sub"><div class="ltt-ref">${c.r}</div></div>` : ''}` },
    capsule: { name: 'Capsule', nameAcc: 'c4', uses: ['c1', 'c1b', 'c3', 'c4', 'c5', 'c6'], d: { c1: '#f5a623', c1b: '#e8901a', c3: '#ffffff', c4: '#f5a623', c5: '#ffffff', c6: '#5d7a99' },
        html: c => `<div class="q-pill"><div class="ltt-verse">${c.v}</div></div>${c.r ? `<div class="q-pill2"><div class="ltt-ref">${c.r}</div></div>` : ''}` },
    slant: { name: 'Slant', nameAcc: 'c2', uses: ['c1', 'c1b', 'c2', 'c3', 'c4', 'c5'], d: { c1: '#ffffff', c1b: '#d9deea', c2: '#12409a', c3: '#12409a', c4: '#12409a', c5: '#ffffff' },
        html: c => `<div class="q-a"><div class="q-blk">${c.logo ? lttImg(c.logo) : ''}</div><div class="q-bar"><div class="ltt-verse">${c.v}</div></div></div>${c.r ? `<div class="q-b"><div class="q-blk2"></div><div class="q-bar2"><div class="ltt-ref">${c.r}</div></div></div>` : ''}` },
    wave: { name: 'Wave Gradient', nameAcc: 'c1b', uses: ['c1', 'c1b', 'c3', 'c4', 'c5'], d: { c1: '#f26a21', c1b: '#f9a825', c3: '#555555', c4: '#ffffff', c5: '#f26a21', dir: '90deg' },
        html: c => `<div class="q-capl"></div><div class="q-txt"><div class="ltt-verse">${c.v}</div>${c.r ? `<div class="ltt-ref">${c.r}</div>` : ''}</div><div class="q-capr">${lttImg(c.logo)}</div>` },
    glass: { name: 'Clean Glass', nameAcc: 'c2', uses: ['c1', 'c2', 'c3', 'c5'], d: { c1: '#060c18', c2: '#38bdf8', c3: '#ffffff', c5: '#38bdf8', opacity: 78, grad: false },
        html: c => `<div class="q-glass"><div class="ltt-verse">${c.v}</div>${c.r ? `<div class="ltt-ref">${c.r}</div>` : ''}</div>` },
    outline: { name: 'Outline Frame', nameAcc: 'c4', uses: ['c1', 'c3', 'c4', 'c5', 'c6'], d: { c1: '#000000', c1b: '#000000', c3: '#ffffff', c4: '#ffffff', c5: '#111111', c6: '#ffffff', opacity: 35, grad: false },
        html: c => `<div class="q-wrap"><div class="q-box"><div class="ltt-verse">${c.v}</div></div>${c.r ? `<div class="q-tab2"><div class="ltt-ref">${c.r}</div></div>` : ''}</div>` },
    church: { name: 'Classic Gold', nameAcc: 'c2', uses: ['c1', 'c1b', 'c2', 'c3', 'c5', 'c6'], d: { c1: '#1a1f33', c1b: '#0e1220', c2: '#d4af37', c3: '#ffffff', c5: '#d4af37', c6: '#d4af37' },
        html: c => `<div class="q-panel"><div class="q-in"><div class="ltt-verse">${c.v}</div>${c.r ? `<div class="q-rule"></div><div class="ltt-ref">${c.r}</div>` : ''}</div></div>` }
};
LTT_ORDER.forEach(id => { LTT[id].d = Object.assign({}, LTT_BASE, LTT[id].d); });

var LTT_CSS = `
.ltt{position:absolute;left:5%;right:5%;bottom:7%;z-index:5;box-sizing:border-box;color:var(--t)}
.lt-pos-top > .ltt{top:6%;bottom:auto}
.lt-pos-center > .ltt{top:50%;bottom:auto;transform:translateY(-50%)}
.ltt *{box-sizing:border-box}
.ltt-verse{font-weight:800;line-height:1.25;font-size:calc(var(--canvas-font-size,4.8cqw)*.78);color:var(--t);word-wrap:break-word;overflow-wrap:break-word;white-space:pre-wrap}
.ltt-ref{font-weight:800;letter-spacing:.05em;text-transform:uppercase;font-size:calc(var(--canvas-font-size,4.8cqw)*.46);color:var(--rt)}
.tpl-broadcast{display:flex;gap:.8cqw}
.tpl-broadcast .q-tab{width:2.4cqw;flex:none;background:var(--a);border:1px solid var(--b)}
.tpl-broadcast .q-main{flex:1;min-width:0}
.tpl-broadcast .q-bar{background:var(--f);padding:1.5cqw 2.6cqw;border:1px solid var(--b);box-shadow:0 .4cqw 1cqw rgba(0,0,0,.45)}
.tpl-broadcast .q-strip{width:78%;background:var(--s);padding:.55cqw 2.6cqw;box-shadow:0 .3cqw .8cqw rgba(0,0,0,.35)}
.tpl-logo{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto}
.tpl-logo .q-logo{grid-row:1;grid-column:1;width:13cqw;min-height:9cqw;background:var(--a);display:flex;align-items:center;justify-content:center;padding:1.2cqw;z-index:2}
.tpl-logo .q-logo img{max-width:100%;max-height:100%;object-fit:contain}
.tpl-logo .q-frame{grid-row:1;grid-column:2;position:relative;padding-top:1.3cqw}
.tpl-logo .q-frame:before{content:'';position:absolute;inset:0;border:.25cqw solid var(--b)}
.tpl-logo .q-bar{position:relative;background:var(--f);margin:.8cqw -1.4cqw 0 -.9cqw;padding:1.4cqw 2.6cqw;text-align:center;box-shadow:0 .4cqw 1cqw rgba(0,0,0,.35)}
.tpl-logo .q-sub{grid-row:2;grid-column:2;width:62%;margin:0 auto;background:var(--s);padding:.55cqw 1cqw;text-align:center;position:relative}
.tpl-capsule .q-pill{background:var(--f);border:.5cqw solid var(--b);border-radius:6cqw;padding:1.5cqw 5cqw;text-align:center;box-shadow:0 .5cqw 1.2cqw rgba(0,0,0,.5),inset 0 .25cqw .5cqw rgba(255,255,255,.35)}
.tpl-capsule .q-pill2{width:max-content;min-width:32%;white-space:nowrap;margin:1cqw auto 0;background:var(--s);border:.5cqw solid var(--b);border-radius:3cqw;padding:.35cqw 1cqw;text-align:center;box-shadow:0 .3cqw .8cqw rgba(0,0,0,.4)}
.tpl-slant .q-a{display:flex;transform:skewX(-18deg);margin-bottom:1cqw;transform-origin:left bottom}
.tpl-slant .q-blk{width:10cqw;flex:none;background:var(--a);margin-right:1cqw;display:flex;align-items:center;justify-content:center;overflow:hidden}
.tpl-slant .q-blk img{max-width:80%;max-height:80%;transform:skewX(18deg);object-fit:contain}
.tpl-slant .q-bar{flex:1;background:var(--f);border-bottom:.45cqw solid var(--a);padding:1.4cqw 3cqw;box-shadow:0 .4cqw .8cqw rgba(0,0,0,.35)}
.tpl-slant .q-bar > *,.tpl-slant .q-bar2 > *{transform:skewX(18deg);display:block}
.tpl-slant .q-b{display:flex;transform:skewX(-18deg);width:64%;transform-origin:left bottom}
.tpl-slant .q-blk2{width:5cqw;flex:none;background:var(--f);margin-right:1cqw}
.tpl-slant .q-bar2{flex:1;background:var(--s);padding:.5cqw 3cqw}
.tpl-wave{display:grid;grid-template-columns:20cqw 1fr 24cqw;align-items:stretch;background:var(--s);box-shadow:0 .5cqw 1.2cqw rgba(0,0,0,.5);overflow:hidden;left:3%;right:3%;min-height:14cqw}
.tpl-wave .q-capl{background:var(--f);position:relative}
.tpl-wave .q-capr{background:var(--fr);position:relative;display:flex;align-items:center;justify-content:center;padding:1.5cqw 1.5cqw 1.5cqw 5cqw}
.tpl-wave .q-capr img{max-width:100%;max-height:11cqw;object-fit:contain;position:relative;z-index:2}
.tpl-wave .q-capl:after{content:'';position:absolute;top:0;bottom:0;right:-2cqw;width:10cqw;background:radial-gradient(circle at 80% 20%,var(--s) 3.2cqw,transparent 3.4cqw),radial-gradient(circle at 80% 58%,var(--s) 4.2cqw,transparent 4.4cqw),radial-gradient(circle at 80% 92%,var(--s) 3cqw,transparent 3.2cqw)}
.tpl-wave .q-capr:before{content:'';position:absolute;top:0;bottom:0;left:-2cqw;width:10cqw;z-index:1;background:radial-gradient(circle at 20% 22%,var(--s) 3.2cqw,transparent 3.4cqw),radial-gradient(circle at 20% 62%,var(--s) 4.2cqw,transparent 4.4cqw),radial-gradient(circle at 20% 94%,var(--s) 3cqw,transparent 3.2cqw)}
.tpl-wave .q-txt{display:flex;flex-direction:column;justify-content:center;text-align:center;padding:1.4cqw 2cqw;position:relative;z-index:2}
.tpl-wave .ltt-verse{font-size:calc(var(--canvas-font-size,4.8cqw)*.7)}
.tpl-glass .q-glass{background:var(--f);border-left:1.1cqw solid var(--a);padding:1.6cqw 3cqw;border-radius:0 1cqw 1cqw 0;box-shadow:0 .6cqw 1.6cqw rgba(0,0,0,.55);backdrop-filter:blur(4px)}
.tpl-glass .ltt-ref{margin-top:.6cqw}
.tpl-outline .q-wrap{position:relative;padding-bottom:1.6cqw}
.tpl-outline .q-box{background:var(--f);border:.3cqw solid var(--b);padding:1.6cqw 3cqw;text-align:center}
.tpl-outline .q-tab2{position:absolute;right:3cqw;bottom:0;background:var(--s);padding:.4cqw 1.6cqw;box-shadow:0 .3cqw .8cqw rgba(0,0,0,.4)}
.tpl-church .q-panel{background:var(--f);border:.45cqw solid var(--b);padding:.6cqw;box-shadow:0 .6cqw 1.6cqw rgba(0,0,0,.55)}
.tpl-church .q-in{border:.12cqw solid var(--a);padding:1.4cqw 3cqw;text-align:center}
.tpl-church .q-rule{width:12cqw;height:.2cqw;background:var(--a);margin:.8cqw auto .6cqw}
/* matching name tag ("Ministering: Pastor Ade") */
.canvas-namebar-node.ltn{background:none;border-radius:0;overflow:visible;box-shadow:0 .5cqw 1.4cqw rgba(0,0,0,.45);font-family:var(--n-font,inherit)}
.canvas-namebar-node.ltn .namebar-role{background:var(--n-acc);color:var(--n-rt)}
.canvas-namebar-node.ltn .namebar-name{background:var(--n-fill);color:var(--n-nt) !important}
.ltn-broadcast .namebar-role,.ltn-broadcast .namebar-name,.ltn-logo .namebar-role,.ltn-logo .namebar-name,.ltn-outline .namebar-role,.ltn-outline .namebar-name{border:1px solid var(--n-b)}
.ltn-capsule .namebar-role{border-radius:999px 0 0 999px;border:.3cqw solid var(--n-b);border-right:0}
.ltn-capsule .namebar-name{border-radius:0 999px 999px 0;border:.3cqw solid var(--n-b);border-left:0}
.ltn-slant .namebar-role{clip-path:polygon(0 0,100% 0,88% 100%,0 100%);padding-right:1.2em}
.ltn-slant .namebar-name{clip-path:polygon(6% 0,100% 0,100% 100%,0 100%);padding-left:1.3em;margin-left:-.6em}
.ltn-wave .namebar-role{border-radius:.8cqw 0 0 .8cqw}.ltn-wave .namebar-name{border-radius:0 .8cqw .8cqw 0}
.ltn-glass .namebar-role{border-radius:0}.ltn-glass .namebar-name{border-radius:0 .8cqw .8cqw 0}
.ltn-church .namebar-role,.ltn-church .namebar-name{border:.3cqw solid var(--n-b)}
.ltn-church .namebar-name{border-left:0}
/* settings panel */
#ltTemplateDropdown{left:auto;right:0;width:500px;max-width:92vw;z-index:80}
.ltu-sec{font-size:.65rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin:.7rem 0 .35rem}
.ltu-sec:first-child{margin-top:0}
.ltu-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem}
.ltu-thumb{cursor:pointer;border:2px solid var(--bg-accent);border-radius:7px;padding:3px;background:var(--bg-main);text-align:center;font-size:.62rem;color:var(--text-muted)}
.ltu-thumb.sel{border-color:#38bdf8;color:#fff}
.ltu-tc{position:relative;aspect-ratio:16/9;border-radius:4px;overflow:hidden;background:radial-gradient(ellipse at 30% 20%,#27406b,#0c1424 70%);container-type:size;--canvas-font-size:5.4cqw;margin-bottom:3px}
.ltu-row{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin:.3rem 0;font-size:.74rem}
.ltu-row input[type=color]{width:38px;height:24px;padding:0;border:1px solid var(--bg-accent);background:none}
.ltu-row select,.ltu-row input[type=text]{padding:.3rem;font-size:.72rem;max-width:230px}
.ltu-prev{max-width:300px;margin:0 auto;position:relative;aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:radial-gradient(ellipse at 30% 20%,#27406b,#0c1424 70%);container-type:size;--canvas-font-size:4.6cqw;font-family:sans-serif}
.ltu-mine{display:flex;flex-wrap:wrap;gap:.35rem}
.ltu-chip{display:flex;align-items:center;gap:.3rem;border:1px solid var(--bg-accent);border-radius:6px;padding:.2rem .45rem;font-size:.7rem;cursor:pointer}
.ltu-chip b{color:#f87171;cursor:pointer}
`;

function lttEnsureStyle(doc) {
    try {
        if (!doc || doc.getElementById('ltt-style')) return;
        const st = doc.createElement('style'); st.id = 'ltt-style'; st.textContent = LTT_CSS;
        (doc.head || doc.documentElement).appendChild(st);
    } catch (e) {}
}
function lttActive(st) { return !!(st && st.ltTemplate && st.ltTemplate !== 'none' && LTT && LTT[st.ltTemplate]); }
// A template in the Lower Third layout always renders with a transparent background so it overlays cleanly
function lttBgT(st) { return !!(st && (st.bgTransparent || (st.layout === 'mode-lowerthird' && lttActive(st)))); }
function lttStyleOf(st) { return Object.assign({}, LTT[st.ltTemplate].d, st.ltStyle || {}); }
function lttLum(hex) {
    const h = (hex || '#000000').replace('#', ''); const n = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
    const f = i => { const v = parseInt(n.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4);
}
function lttRatio(a, b) { const x = lttLum(a), y = lttLum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function lttAutoText(bg) { return lttLum(bg) > 0.45 ? '#111111' : '#ffffff'; }
function lttFlipDir(d) { const m = { '180deg': '0deg', '90deg': '270deg', '135deg': '315deg' }; return m[d] || '0deg'; }
function lttFill(s, rev) {
    const a = hexToRgbaWithOpacity(s.c1, s.opacity), b = hexToRgbaWithOpacity(s.c1b, s.opacity);
    if (!s.grad) return a;
    return rev ? `linear-gradient(${s.dir},${b},${a})` : `linear-gradient(${s.dir},${a},${b})`;
}
function lttMarkup(id, style, text, ref, logo, extraClass, extraStyle) {
    const T = LTT[id]; const s = Object.assign({}, T.d, style || {});
    const vars = `--f:${lttFill(s, false)};--fr:${lttFill(s, true)};--a:${s.c2};--t:${s.c3};--s:${s.c4};--rt:${s.c5};--b:${s.c6};`;
    const font = s.font ? `font-family:${s.font};` : '';
    return `<div class="ltt tpl-${id} ${extraClass || ''}" style="${vars}${font}${extraStyle || ''}">${T.html({ v: text, r: (s.showRef && ref) ? ref : '', logo: (s.showLogo && logo) ? logo : '', s })}</div>`;
}
function lttNameVars(id, s) {
    const T = LTT[id]; const acc = s[T.nameAcc] || s.c2;
    const nameBg = s.c1;
    const nt = s.nt || (lttRatio(s.c3, nameBg) >= 3 ? s.c3 : lttAutoText(nameBg));
    return `--n-fill:${lttFill(s, false)};--n-acc:${acc};--n-rt:${s.rt || lttAutoText(acc)};--n-nt:${nt};--n-b:${s.c6};${s.font ? `--n-font:${s.font};` : ''}`;
}
// Applies the active template to a freshly-built canvas (main preview, OBS, projector, extra output windows)
function lttApply(canvas, st, logoUrl, transitionClass) {
    if (!lttActive(st)) return;
    lttEnsureStyle(canvas.ownerDocument);
    const s = lttStyleOf(st);
    const id = st.ltTemplate;
    const hasVerse = st.layout === 'mode-lowerthird' && !!st.text && !(st.timerVisible && st.timerSolo) && !(st.displayMode === 'media' && st.mediaUrl);
    if (hasVerse) {
        canvas.querySelectorAll(':scope > .text-display-box-container, :scope > .ref-out').forEach(el => el.style.setProperty('display', 'none', 'important'));
        const nx = st.textNudgeX || 0, ny = st.textNudgeY || 0;
        const nudge = (nx || ny) ? `translate:${nx}cqw ${ny}cqw;` : '';
        const refText = st.refVisible === false ? '' : (st.ref || '');
        canvas.insertAdjacentHTML('afterbegin', lttMarkup(id, st.ltStyle, st.text, refText, logoUrl, transitionClass || '', nudge));
        lttFit(canvas);
    }
    const nb = canvas.querySelector(':scope > .canvas-namebar-node');
    if (nb) {
        nb.classList.add('ltn', 'ltn-' + id);
        lttNameVars(id, s).split(';').forEach(p => { const i = p.indexOf(':'); if (i > 0) nb.style.setProperty(p.slice(0, i), p.slice(i + 1)); });
        if (hasVerse && (st.lowerThirdPosition || 'bottom') !== 'top') { nb.style.top = '5%'; nb.style.bottom = 'auto'; } // keep the name tag clear of the verse bar
    }
}
function lttFit(canvas) {
    const el = canvas.querySelector(':scope > .ltt'); const v = el && el.querySelector('.ltt-verse');
    const h = canvas.clientHeight; if (!el || !v || !h) return;
    const win = (canvas.ownerDocument && canvas.ownerDocument.defaultView) || window;
    let px = parseFloat(win.getComputedStyle(v).fontSize), g = 0;
    while (el.offsetHeight > h * 0.42 && px > 8 && g < 60) { px -= Math.max(1, px * 0.05); v.style.fontSize = px + 'px'; g++; }
}

// ---------- Settings panel ----------
var lttCustom = {}, lttUser = [];
function lttLoad(k, fb) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } }
function lttSave(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function lttCurrentStyle() { return previewState.ltTemplate && LTT[previewState.ltTemplate] ? lttStyleOf(previewState) : null; }
function lttLogoForPreview() { return (typeof cachedLogoDataUrl === 'string' && cachedLogoDataUrl) ? cachedLogoDataUrl : LTT_LOGO_PH; }
function lttSelect(id) {
    previewState.ltTemplate = id;
    previewState.ltStyle = id === 'none' ? {} : Object.assign({}, LTT[id].d, lttCustom[id] || {});
    lttSave('ebpLtLast', id);
    lttSyncUI(); renderPreview();
}
function lttSet(k, v) {
    const id = previewState.ltTemplate; if (!LTT[id]) return;
    previewState.ltStyle = Object.assign({}, previewState.ltStyle || {}, { [k]: v });
    lttCustom[id] = Object.assign({}, previewState.ltStyle); lttSave('ebpLtCustom', lttCustom);
    lttSyncUI(true); renderPreview();
}
function lttFontOptionsHtml() {
    const src = document.getElementById('fontStyleOverrideSelector'); let html = '<option value="">Same as main text font</option>';
    if (src) src.querySelectorAll('optgroup').forEach(g => { html += `<optgroup label="${g.label}">` + Array.from(g.children).map(o => `<option value="${o.value.replace(/"/g, '&quot;')}">${o.textContent}</option>`).join('') + '</optgroup>'; });
    return html;
}
function lttSyncUI(light) {
    const dd = document.getElementById('ltTemplateDropdown'); if (!dd || !dd.dataset.built) return;
    const cur = previewState.ltTemplate && LTT[previewState.ltTemplate] ? previewState.ltTemplate : 'none';
    const btn = document.getElementById('ltTemplateToggleBtn');
    if (btn) btn.innerText = cur === 'none' ? 'LT STYLE ▾' : 'LT: ' + LTT[cur].name.toUpperCase() + ' ▾';
    // thumbnails
    const grid = document.getElementById('lttThumbs');
    if (!light) {
        grid.innerHTML = LTT_ORDER.map(id => `<div class="ltu-thumb ${cur === id ? 'sel' : ''}" data-id="${id}"><div class="ltu-tc">${lttMarkup(id, lttCustom[id], LTT_SAMPLE_V, LTT_SAMPLE_R, lttLogoForPreview())}</div>${LTT[id].name}</div>`).join('');
        grid.querySelectorAll('.ltu-thumb').forEach(t => t.addEventListener('click', () => lttSelect(t.dataset.id)));
        const mine = document.getElementById('lttMine');
        mine.innerHTML = lttUser.length ? lttUser.map(u => `<span class="ltu-chip" data-u="${u.id}">${u.name.replace(/</g, '&lt;')} <b data-del="${u.id}" title="Delete">✕</b></span>`).join('') : '<span style="font-size:.7rem;color:var(--text-muted)">None saved yet</span>';
        mine.querySelectorAll('.ltu-chip').forEach(c => c.addEventListener('click', (e) => {
            if (e.target.dataset.del) { lttUser = lttUser.filter(u => u.id !== e.target.dataset.del); lttSave('ebpLtUser', lttUser); lttSyncUI(); return; }
            const u = lttUser.find(x => x.id === c.dataset.u); if (!u || !LTT[u.base]) return;
            previewState.ltTemplate = u.base; previewState.ltStyle = Object.assign({}, LTT[u.base].d, u.style); lttSave('ebpLtLast', u.base); lttSyncUI(); renderPreview();
        }));
    } else {
        const t = grid.querySelector(`.ltu-thumb[data-id="${cur}"] .ltu-tc`);
        if (t) t.innerHTML = lttMarkup(cur, previewState.ltStyle, LTT_SAMPLE_V, LTT_SAMPLE_R, lttLogoForPreview());
    }
    document.getElementById('lttNoneBtn').classList.toggle('toggle-active', cur === 'none');
    const edit = document.getElementById('lttEditor'); edit.style.display = cur === 'none' ? 'none' : '';
    if (cur === 'none') return;
    const s = lttStyleOf(previewState), T = LTT[cur];
    Object.keys(LTT_COLOR_LABELS).forEach(k => {
        const row = document.getElementById('lttRow_' + k); const inp = document.getElementById('lttIn_' + k);
        row.style.display = T.uses.includes(k) && (k !== 'c1b' || true) ? '' : 'none';
        if (document.activeElement !== inp) inp.value = s[k];
        if (k === 'c1b') inp.disabled = !s.grad;
    });
    document.getElementById('lttGradRow').style.display = T.uses.includes('c1b') ? '' : 'none';
    document.getElementById('lttGrad').checked = !!s.grad;
    document.getElementById('lttDir').value = s.dir; document.getElementById('lttDir').disabled = !s.grad;
    document.getElementById('lttOpacity').value = s.opacity; document.getElementById('lttOpacityVal').innerText = s.opacity + '%';
    document.getElementById('lttShowRef').checked = !!s.showRef;
    document.getElementById('lttShowLogo').checked = !!s.showLogo;
    document.getElementById('lttFont').value = s.font || '';
    // live preview: verse bar + matching name tag
    const logo = lttLogoForPreview();
    document.getElementById('lttPrev').innerHTML = lttMarkup(cur, previewState.ltStyle, LTT_SAMPLE_V, LTT_SAMPLE_R, logo)
        + `<div class="canvas-namebar-node namebar-visible ltn ltn-${cur}" style="${lttNameVars(cur, s)}top:6%;bottom:auto;left:4%"><div class="namebar-role">Ministering</div><div class="namebar-name">Pastor Ade</div></div>`;
}
function initLowerThirdTemplates() {
    const dd = document.getElementById('ltTemplateDropdown'), btn = document.getElementById('ltTemplateToggleBtn');
    if (!dd || !btn) return;
    lttEnsureStyle(document);
    lttCustom = lttLoad('ebpLtCustom', {}) || {}; lttUser = lttLoad('ebpLtUser', []) || [];
    const last = lttLoad('ebpLtLast', 'none');
    if (last && LTT[last]) { previewState.ltTemplate = last; previewState.ltStyle = Object.assign({}, LTT[last].d, lttCustom[last] || {}); }
    dd.innerHTML = `
        <div class="ltu-sec">Template <button id="lttNoneBtn" type="button" class="btn" style="padding:.15rem .5rem;font-size:.65rem;margin-left:.5rem;">None (plain text)</button></div>
        <div class="ltu-grid" id="lttThumbs"></div>
        <div id="lttEditor">
            <div class="ltu-sec">Live preview (verse + name tag)</div><div class="ltu-prev" id="lttPrev"></div>
            <div class="ltu-sec">Colours</div>
            ${Object.keys(LTT_COLOR_LABELS).map(k => `<div class="ltu-row" id="lttRow_${k}"><span>${LTT_COLOR_LABELS[k]}</span><input type="color" id="lttIn_${k}"></div>`).join('')}
            <div class="ltu-row" id="lttGradRow"><label><input type="checkbox" id="lttGrad"> Use gradient (main → gradient end)</label>
                <select id="lttDir"><option value="180deg">Top → bottom</option><option value="90deg">Left → right</option><option value="135deg">Diagonal</option></select></div>
            <div class="ltu-row"><span>Bar opacity <b id="lttOpacityVal"></b></span><input type="range" id="lttOpacity" min="10" max="100" step="1" style="width:160px"></div>
            <div class="ltu-row"><label><input type="checkbox" id="lttShowRef"> Show reference</label><label><input type="checkbox" id="lttShowLogo"> Show logo (where the design has one)</label></div>
            <div class="ltu-row"><span>Font</span><select id="lttFont">${lttFontOptionsHtml()}</select></div>
            <div class="ltu-sec">My templates</div><div class="ltu-mine" id="lttMine"></div>
            <div class="ltu-row" style="margin-top:.5rem"><input type="text" id="lttSaveName" placeholder="Name this style…" style="flex:1"><button id="lttSaveBtn" type="button" class="btn" style="padding:.3rem .6rem;font-size:.72rem;background:#166534;border-color:#15803d;">Save as my template</button></div>
            <div class="ltu-row"><button id="lttResetBtn" type="button" class="btn" style="padding:.3rem .6rem;font-size:.72rem;background:#475569;border-color:#64748b;">Reset this template's colours</button></div>
            <div style="font-size:.65rem;color:var(--text-muted);margin-top:.4rem">Used by the Lower Third layout and by the Name Tag. The background becomes transparent so it overlays on video.</div>
        </div>`;
    dd.dataset.built = '1';
    btn.addEventListener('click', (e) => { e.stopPropagation(); lttSyncUI(); dd.classList.toggle('open'); });
    dd.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => dd.classList.remove('open'));
    document.getElementById('lttNoneBtn').addEventListener('click', () => lttSelect('none'));
    Object.keys(LTT_COLOR_LABELS).forEach(k => document.getElementById('lttIn_' + k).addEventListener('input', (e) => lttSet(k, e.target.value)));
    document.getElementById('lttGrad').addEventListener('change', (e) => lttSet('grad', e.target.checked));
    document.getElementById('lttDir').addEventListener('change', (e) => lttSet('dir', e.target.value));
    document.getElementById('lttOpacity').addEventListener('input', (e) => lttSet('opacity', parseInt(e.target.value, 10)));
    document.getElementById('lttShowRef').addEventListener('change', (e) => lttSet('showRef', e.target.checked));
    document.getElementById('lttShowLogo').addEventListener('change', (e) => lttSet('showLogo', e.target.checked));
    document.getElementById('lttFont').addEventListener('change', (e) => lttSet('font', e.target.value));
    document.getElementById('lttResetBtn').addEventListener('click', () => { const id = previewState.ltTemplate; if (!LTT[id]) return; delete lttCustom[id]; lttSave('ebpLtCustom', lttCustom); previewState.ltStyle = Object.assign({}, LTT[id].d); lttSyncUI(); renderPreview(); });
    document.getElementById('lttSaveBtn').addEventListener('click', () => {
        const id = previewState.ltTemplate; if (!LTT[id]) return;
        const nameEl = document.getElementById('lttSaveName'); const name = (nameEl.value || '').trim() || (LTT[id].name + ' (mine)');
        lttUser.push({ id: 'u' + Date.now(), name, base: id, style: Object.assign({}, previewState.ltStyle) }); lttSave('ebpLtUser', lttUser);
        nameEl.value = ''; lttSyncUI();
    });
    lttSyncUI();
}


// ===================== NAME TAG OVERLAY ("Ministering: Pastor Ade") =====================
// The name tag is no longer part of the verse scene. It has its own style (same families as the lower third),
// its own position/size, and is sent on its own as a transparent layer on top of whatever a screen is already showing
// (Projector and/or any extra output window). Nothing else (verse, background, timer) is sent with it.
var NT_CSS = `
.ntl{position:fixed;inset:0;pointer-events:none;z-index:2147483000;display:flex;align-items:center;justify-content:center}
.ntl-frame{position:relative;width:min(100vw,calc(100vh*2752/1536));aspect-ratio:2752/1536;container-type:inline-size;--canvas-font-size:4.8cqw}
.ntl-pos{position:absolute;left:4%}
.ntl-bottom{bottom:6%}.ntl-top{top:6%}.ntl-center{top:50%;transform:translateY(-50%)}
.ntw .canvas-namebar-node{position:static;display:flex;align-items:stretch;border-radius:0}
.ntw .namebar-role{font-weight:900;font-size:calc(var(--canvas-font-size,4.8cqw)*.46*var(--nt-s,1));text-transform:uppercase;letter-spacing:.04em;padding:.35em .7em;display:flex;align-items:center;white-space:nowrap}
.ntw .namebar-name{font-weight:800;font-size:calc(var(--canvas-font-size,4.8cqw)*.54*var(--nt-s,1));padding:.35em .9em;display:flex;align-items:center;white-space:nowrap}
#ntStyleDropdown{left:0;right:auto;width:470px;max-width:92vw;z-index:80}
.ntu-menu{position:absolute;top:calc(100% + 6px);right:0;min-width:300px;z-index:90;background:var(--bg-panel);border:1px solid var(--accent-primary);border-radius:9px;padding:6px;box-shadow:0 12px 30px rgba(0,0,0,.6);display:none}
.ntu-menu.open{display:block}
.ntu-item{display:block;width:100%;text-align:left;background:none;border:none;color:var(--text-main,inherit);font-family:inherit;font-size:.76rem;font-weight:600;padding:.45rem .6rem;border-radius:6px;cursor:pointer}
.ntu-item:hover{background:rgba(56,189,248,.12)}
.ntu-item small{display:block;font-weight:400;color:var(--text-muted);font-size:.66rem}
.ntu-sep{height:1px;background:var(--bg-accent);margin:4px 0}
`;
LTT_CSS += NT_CSS;
var ntState = { tpl: 'broadcast', pos: 'bottom', scale: 100 };
var ntCustom = {};
var ntTargets = { projector: false, slots: {} };
var NT_ROWS = [['c1', 'Name background colour'], ['c1b', 'Gradient end colour'], ['ACC', 'Role label colour'], ['rt', 'Role text colour'], ['nt', 'Name text colour'], ['c6', 'Border colour']];
function ntStyle() { return Object.assign({}, LTT[ntState.tpl].d, ntCustom[ntState.tpl] || {}); }
function ntSaveAll() { lttSave('ebpNtState', ntState); lttSave('ebpNtCustom', ntCustom); }
function ntTagHtml(id, s, role, name) {
    return `<div class="canvas-namebar-node namebar-visible ltn ltn-${id}" style="${lttNameVars(id, s)}"><div class="namebar-role">${role || ''}</div><div class="namebar-name">${name || ''}</div></div>`;
}
function ntLayerHtml() {
    const s = ntStyle();
    return `<div class="ntl ntw" id="ebpNtLayer"><div class="ntl-frame" style="--nt-s:${ntState.scale / 100}"><div class="ntl-pos ntl-${ntState.pos}">${ntTagHtml(ntState.tpl, s, previewState.lowerThirdRole, previewState.lowerThirdName)}</div></div></div>`;
}
function ntApplyToWindow(win, on) {
    try {
        if (!win || win.closed) return;
        const doc = win.document; const old = doc.getElementById('ebpNtLayer'); if (old) old.remove();
        if (!on || !(previewState.lowerThirdRole || previewState.lowerThirdName)) return;
        lttEnsureStyle(doc);
        doc.body.insertAdjacentHTML('beforeend', ntLayerHtml());
    } catch (e) {}
}
function ntAnyActive() { return ntTargets.projector || Object.keys(ntTargets.slots).some(k => ntTargets.slots[k]); }
function ntRefreshAll() {
    try { ovApplyToWindow(projectorWindowRef, 'projector'); } catch (e) {}
    outputSlots.forEach(sl => ntApplyToWindow(sl.windowRef, !!ntTargets.slots[sl.id]));
    ntSyncUI();
}
function ntTurnOn(kind, slotId) {
    if (!(previewState.lowerThirdRole || previewState.lowerThirdName)) { ntNote('Type a role or name first.'); return false; }
    if (kind === 'projector') {
        ntTargets.projector = true;
        if (!projectorWindowRef || projectorWindowRef.closed) sendToProjectorAutoDetect(); // opens the projector (it re-applies the tag when ready)
    } else {
        ntTargets.slots[slotId] = true;
        const sl = outputSlots.find(s => s.id === slotId);
        if (sl && (!sl.windowRef || sl.windowRef.closed)) openOutputSlotWindow(slotId);
    }
    ntNote('');
    return true;
}
function ntNote(t) { const e = document.getElementById('ntStatus'); if (e) e.innerText = t || ''; }
function ntHideAll() { ntTargets.projector = false; ntTargets.slots = {}; ntRefreshAll(); }
function ntSyncUI() {
    const s = document.getElementById('ntSendBtn'); if (!s) return;
    const on = ntAnyActive();
    s.innerText = on ? '⏹ Hide Name Tag' : '▶ Send Name Tag';
    s.style.background = on ? '#b91c1c' : '#1d4ed8'; s.style.borderColor = on ? '#dc2626' : '#2563eb';
    const sb = document.getElementById('ntStyleBtn'); if (sb) sb.innerText = 'NAME TAG: ' + LTT[ntState.tpl].name.toUpperCase() + ' ▾';
    const pos = document.getElementById('ntPosition'); if (pos) pos.value = ntState.pos;
    const sv = document.getElementById('ntSizeVal'); if (sv) sv.innerText = ntState.scale + '%';
    // preview of the tag in the style panel
    const prev = document.getElementById('ntPrev'); if (prev) prev.innerHTML = ntTagHtml(ntState.tpl, ntStyle(), previewState.lowerThirdRole || 'Ministering', previewState.lowerThirdName || 'Pastor Ade');
}
function ntBuildSendMenu() {
    const m = document.getElementById('ntSendMenu'); if (!m) return;
    const row = (label, active, key) => `<button type="button" class="ntu-item" data-k="${key}">${active ? '✓ ' : '○ '}${label}<small>${active ? 'showing — click to remove' : 'overlay only'}</small></button>`;
    m.innerHTML = row('Projector', ntTargets.projector, 'projector') + outputSlots.map(sl => row(sl.name || 'Output', !!ntTargets.slots[sl.id], 's:' + sl.id)).join('')
        + '<div class="ntu-sep"></div><button type="button" class="ntu-item" data-k="hide" style="color:#fca5a5">⏹ Hide name tag from all screens</button>';
    m.querySelectorAll('.ntu-item').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation(); const k = b.dataset.k;
        if (k === 'hide') ntHideAll();
        else if (k === 'projector') { if (ntTargets.projector) ntTargets.projector = false; else if (!ntTurnOn('projector')) return; ntRefreshAll(); }
        else { const id = k.slice(2); if (ntTargets.slots[id]) delete ntTargets.slots[id]; else if (!ntTurnOn('slot', id)) return; ntRefreshAll(); }
        m.classList.remove('open');
    }));
}
function ntBuildStylePanel() {
    const dd = document.getElementById('ntStyleDropdown');
    const grid = LTT_ORDER.map(id => `<div class="ltu-thumb ${ntState.tpl === id ? 'sel' : ''}" data-id="${id}"><div class="ltu-tc ntw" style="--canvas-font-size:13cqw;--nt-s:1;display:flex;align-items:center;padding-left:6px">${ntTagHtml(id, Object.assign({}, LTT[id].d, ntCustom[id] || {}), 'MINISTERING', 'Pastor Ade')}</div>${LTT[id].name}</div>`).join('');
    dd.innerHTML = `<div class="ltu-sec">Name tag style (own colours &amp; font, separate from the verse lower third)</div><div class="ltu-grid" id="ntThumbs">${grid}</div>
        <div class="ltu-sec">Preview</div><div class="ltu-prev ntw" style="display:flex;align-items:center;padding-left:6%;--canvas-font-size:5cqw;--nt-s:1" id="ntPrevBox"><span id="ntPrev"></span></div>
        <div class="ltu-sec">Colours</div>
        ${NT_ROWS.map(([k, l]) => `<div class="ltu-row" id="ntRow_${k}"><span>${l}</span><input type="color" id="ntIn_${k}"></div>`).join('')}
        <div class="ltu-row" id="ntGradRow"><label><input type="checkbox" id="ntGrad"> Use gradient</label><select id="ntDir"><option value="180deg">Top → bottom</option><option value="90deg">Left → right</option><option value="135deg">Diagonal</option></select></div>
        <div class="ltu-row"><span>Opacity <b id="ntOpacityVal"></b></span><input type="range" id="ntOpacity" min="10" max="100" style="width:160px"></div>
        <div class="ltu-row"><span>Font</span><select id="ntFont">${lttFontOptionsHtml()}</select></div>
        <div class="ltu-row"><button id="ntResetBtn" type="button" class="btn" style="padding:.3rem .6rem;font-size:.72rem;background:#475569;border-color:#64748b;">Reset this style's colours</button></div>`;
    dd.querySelectorAll('.ltu-thumb').forEach(t => t.addEventListener('click', () => { ntState.tpl = t.dataset.id; ntSaveAll(); ntBuildStylePanel(); ntSyncPanel(); ntRefreshAll(); }));
    const set = (k, v) => { ntCustom[ntState.tpl] = Object.assign({}, ntCustom[ntState.tpl] || {}, { [k]: v }); ntSaveAll(); ntSyncPanel(true); ntRefreshAll(); };
    NT_ROWS.forEach(([k]) => document.getElementById('ntIn_' + k).addEventListener('input', (e) => set(k === 'ACC' ? LTT[ntState.tpl].nameAcc : k, e.target.value)));
    document.getElementById('ntGrad').addEventListener('change', (e) => set('grad', e.target.checked));
    document.getElementById('ntDir').addEventListener('change', (e) => set('dir', e.target.value));
    document.getElementById('ntOpacity').addEventListener('input', (e) => set('opacity', parseInt(e.target.value, 10)));
    document.getElementById('ntFont').addEventListener('change', (e) => set('font', e.target.value));
    document.getElementById('ntResetBtn').addEventListener('click', () => { delete ntCustom[ntState.tpl]; ntSaveAll(); ntBuildStylePanel(); ntSyncPanel(); ntRefreshAll(); });
}
function ntSyncPanel(keepThumbs) {
    const dd = document.getElementById('ntStyleDropdown'); if (!dd || !document.getElementById('ntIn_c1')) return;
    const s = ntStyle(), T = LTT[ntState.tpl]; const acc = T.nameAcc;
    NT_ROWS.forEach(([k]) => {
        const row = document.getElementById('ntRow_' + k), inp = document.getElementById('ntIn_' + k);
        let show = true, val;
        if (k === 'c1b') { show = true; val = s.c1b; inp.disabled = !s.grad; }
        else if (k === 'ACC') { show = acc !== 'c1b'; val = s[acc]; }
        else if (k === 'rt') val = s.rt || lttAutoText(s[acc]);
        else if (k === 'nt') val = s.nt || (lttRatio(s.c3, s.c1) >= 3 ? s.c3 : lttAutoText(s.c1));
        else if (k === 'c6') show = T.uses.includes('c6'), val = s.c6;
        else val = s[k];
        row.style.display = show ? '' : 'none'; if (document.activeElement !== inp) inp.value = val;
    });
    document.getElementById('ntGrad').checked = !!s.grad; document.getElementById('ntDir').value = s.dir; document.getElementById('ntDir').disabled = !s.grad;
    document.getElementById('ntOpacity').value = s.opacity; document.getElementById('ntOpacityVal').innerText = s.opacity + '%';
    document.getElementById('ntFont').value = s.font || '';
    dd.querySelectorAll('.ltu-thumb').forEach(t => t.classList.toggle('sel', t.dataset.id === ntState.tpl));
    if (keepThumbs) { const th = dd.querySelector(`.ltu-thumb[data-id="${ntState.tpl}"] .ltu-tc`); if (th) th.innerHTML = ntTagHtml(ntState.tpl, s, 'MINISTERING', 'Pastor Ade'); }
    ntSyncUI();
}
function initNameTagOverlay() {
    const styleBtn = document.getElementById('ntStyleBtn'); if (!styleBtn) return;
    const saved = lttLoad('ebpNtState', null); if (saved && LTT[saved.tpl]) ntState = Object.assign(ntState, saved);
    ntCustom = lttLoad('ebpNtCustom', {}) || {};
    lttEnsureStyle(document);
    ntBuildStylePanel(); ntSyncPanel();
    const dd = document.getElementById('ntStyleDropdown'), menu = document.getElementById('ntSendMenu');
    styleBtn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.remove('open'); ntBuildStylePanel(); ntSyncPanel(); dd.classList.toggle('open'); });
    dd.addEventListener('click', (e) => e.stopPropagation());
    document.getElementById('ntPosition').addEventListener('change', (e) => { ntState.pos = e.target.value; ntSaveAll(); ntRefreshAll(); });
    const size = d => { ntState.scale = Math.max(50, Math.min(250, ntState.scale + d)); ntSaveAll(); ntRefreshAll(); };
    document.getElementById('ntSizeDec').addEventListener('click', () => size(-10));
    document.getElementById('ntSizeInc').addEventListener('click', () => size(10));
    document.getElementById('ntSendBtn').addEventListener('click', () => {
        if (ntAnyActive()) { ntHideAll(); return; }
        ovDefaultSend('nt');
    });
    document.getElementById('ntSendCaret').addEventListener('click', (e) => { e.stopPropagation(); dd.classList.remove('open'); ntBuildSendMenu(); menu.classList.toggle('open'); });
    menu.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => { menu.classList.remove('open'); dd.classList.remove('open'); });
    ['lowerThirdRoleInput', 'lowerThirdNameInput'].forEach(id => document.getElementById(id).addEventListener('input', () => ntRefreshAll()));
    document.getElementById('savedNamesDropdown').addEventListener('change', () => ntRefreshAll());
    ntSyncUI();
    try { initAnnOverlay(); } catch (e) { console.warn(e); }
}


// ===================== OVERLAY CHANNELS (Name Tag + Announcement banner) =====================
// Each channel can be sent "overlay only" (alone, on top of whatever a screen is already showing) to: the Projector,
// any extra output window, the OBS browser source (over its verse scene) and the OBS overlay-only source (transparent,
// nothing else). The name tag can also be sent "with the scene" (drawn inside the verse scene, reaching every screen).
// Later definitions below intentionally replace the first-version name-tag helpers above.
var OV_CSS = `
.ntl-solid{background:#000}
html.ov-alone,html.ov-alone body{background:transparent!important}
html.ov-alone #outputCanvas,html.ov-alone #directProjectorCanvas,html.ov-alone #obsCanvas,html.ov-alone #outputCanvasOverlayTimer{visibility:hidden!important}
.ov-scene{position:absolute!important;z-index:9}
.ov-scene .ntl-frame{width:100%}
.ov-ann{position:absolute;left:0;right:0;color:#fff8e7;font-weight:800;font-size:calc(var(--canvas-font-size,4.8cqw)*.5);padding:.45em 1em;text-align:center;text-shadow:0 2px 6px rgba(0,0,0,.8);overflow:hidden;white-space:nowrap;box-shadow:0 0 16px rgba(0,0,0,.4);pointer-events:none}
.ov-ann-top{top:0}.ov-ann-bottom{bottom:0}
.ov-ann-center{top:50%;transform:translateY(-50%);left:4%;right:4%;border-radius:8px}
.ov-tick{display:inline-block;padding-left:100%;animation:ovTick 14s linear infinite}
@keyframes ovTick{to{transform:translateX(-100%)}}
@keyframes ovBreath{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes ovFade{0%,100%{opacity:0}15%,85%{opacity:1}}
.ov-eff-breathing{animation:ovBreath 2.4s ease-in-out infinite}
.ov-eff-fade{animation:ovFade 4s ease-in-out infinite}
.ntu-seg{display:flex;background:rgba(0,0,0,.25);border-radius:7px;padding:3px;margin:2px 0 6px}
.ntu-seg button{flex:1;border:none;background:none;color:var(--text-muted);font:inherit;font-size:.7rem;font-weight:600;padding:.35rem .3rem;border-radius:5px;cursor:pointer}
.ntu-seg button.on{background:#2563eb;color:#fff}
.ntu-hd{font-size:.68rem;font-weight:800;text-transform:uppercase;color:var(--text-muted);padding:.2rem .6rem}
`;
LTT_CSS += OV_CSS;
var ovCh = {
    nt: { mode: 'overlay', scene: false, t: { projector: false, slots: {}, obs: false, obsOnly: false } },
    ann: { mode: 'overlay', scene: false, applied: false, t: { projector: false, slots: {}, obs: false, obsOnly: false } }
};
var ovLastObs = '';
function ovOn(ch, key) { return key.startsWith('s:') ? !!ch.t.slots[key.slice(2)] : !!ch.t[key]; }
function ovSet(ch, key, v) { if (key.startsWith('s:')) { if (v) ch.t.slots[key.slice(2)] = true; else delete ch.t.slots[key.slice(2)]; } else ch.t[key] = !!v; }
function ovAnyTarget(ch) { return ch.t.projector || ch.t.obs || ch.t.obsOnly || Object.keys(ch.t.slots).length > 0; }
function ovHasTag() { return !!(previewState.lowerThirdRole || previewState.lowerThirdName); }
function ovAnnData() {
    const g = id => document.getElementById(id);
    return { text: ((g('announcementInput') || {}).value || '').trim(), eff: (g('announcementEffectSelector') || {}).value || 'none', pos: (g('announcementPositionSelector') || {}).value || 'bottom', color: (g('announcementColorPicker') || {}).value || '#b45309' };
}
function ovTagPart() {
    return `<div class="ntl-pos ntl-${ntState.pos}">${ntTagHtml(ntState.tpl, ntStyle(), previewState.lowerThirdRole, previewState.lowerThirdName)}</div>`;
}
function ovAnnPart() {
    const a = ovAnnData(); if (!a.text) return '';
    const esc = a.text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const inner = a.eff === 'scroll' ? `<span class="ov-tick">${esc}</span>` : esc;
    const eff = (a.eff === 'breathing' || a.eff === 'fade') ? ' ov-eff-' + a.eff : '';
    return `<div class="ov-ann ov-ann-${a.pos}${eff}" style="background:${a.color}">${inner}</div>`;
}
function ovWrap(parts, cls, solid) {
    return parts ? `<div class="ntl ntw ${cls || ''}${solid ? ' ntl-solid' : ''}" ${cls ? '' : 'id="ebpNtLayer"'}><div class="ntl-frame" style="--nt-s:${ntState.scale / 100}">${parts}</div></div>` : '';
}
function ovAnnActive() { return ovCh.ann.mode === 'scene' ? ovCh.ann.scene : ovAnyTarget(ovCh.ann); }
function ovAloneFor(key) {
    return !!((ovCh.nt.mode === 'overlay' && ovOn(ovCh.nt, key) && ovHasTag()) || (ovCh.ann.mode === 'overlay' && ovOn(ovCh.ann, key) && ovAnnData().text));
}
function ovHtmlFor(key) {
    let parts = '';
    if (ovCh.nt.mode !== 'scene' && ovOn(ovCh.nt, key) && ovHasTag()) parts += ovTagPart();
    if (ovCh.ann.mode !== 'scene' && ovOn(ovCh.ann, key)) parts += ovAnnPart();
    return ovWrap(parts, '', false);
}
function ovApplyToWindow(win, key) {
    try {
        if (!win || win.closed) return;
        const doc = win.document; const html = ovHtmlFor(key);
        const old = doc.getElementById('ebpNtLayer'); if (old) old.remove();
        lttEnsureStyle(doc);
        doc.documentElement.classList.toggle('ov-alone', !!html && ovAloneFor(key));
        if (!html) return;
        doc.body.insertAdjacentHTML('beforeend', html);
    } catch (e) {}
}
// OBS pages: called from the OBS sync handler
function ovObsApply(data) {
    try {
        if (!data || !data.overlay) return;
        const html = data.overlay.obs || '', alone = !!(html && data.overlay.alone);
        lttEnsureStyle(document);
        document.documentElement.classList.toggle('ov-alone', alone);
        const sig = html + '|' + alone;
        if (sig === ovLastObs) return; ovLastObs = sig;
        const old = document.getElementById('ebpNtLayer'); if (old) old.remove();
        if (!html) return;
        document.body.insertAdjacentHTML('beforeend', html);
    } catch (e) {}
}
// "With the scene" name tag: lives inside the scene state, so every canvas that draws the scene gets it
function ovSceneApply(canvas, state) {
    try {
        if (!canvas) return;
        const old = canvas.querySelector(':scope > .ov-scene'); if (old) old.remove();
        if (!state || !state.ovScene) return;
        const t = document.createElement('div'); t.innerHTML = state.ovScene;
        const el = t.firstElementChild; if (el) canvas.appendChild(el);
    } catch (e) {}
}
function ovPayload() { return { obs: ovHtmlFor('obs'), alone: ovAloneFor('obs') }; }
function ntAnyActive() { return ovCh.nt.mode === 'scene' ? ovCh.nt.scene : ovAnyTarget(ovCh.nt); }
function ovRefreshAll() {
    try { ovApplyToWindow(projectorWindowRef, 'projector'); } catch (e) {}
    outputSlots.forEach(sl => ovApplyToWindow(sl.windowRef, 's:' + sl.id));
    const scene = (ovCh.nt.mode === 'scene' && ovCh.nt.scene && ovHasTag()) ? ovWrap(ovTagPart(), 'ov-scene') : '';
    if (previewState.ovScene !== scene) {
        previewState.ovScene = scene;
        try { renderPreview(); } catch (e) {}
    }
    try { ovAnnSceneSync(); } catch (e) {}
    try { transmitStatePacketToRemoteClients(); } catch (e) {}
    ntSyncUI();
}
function ovAnnSceneSync() {
    const c = ovCh.ann, a = ovAnnData(), eye = document.getElementById('announcementEyeToggleBtn');
    if (c.mode === 'scene' && c.scene && a.text) {
        const sig = [a.text, a.eff, a.pos, a.color].join('|');
        if (c.applied !== sig) {
            c.applied = sig;
            previewState.announcementText = a.text; previewState.announcementVisible = true; previewState.announcementEffect = a.eff;
            previewState.announcementPosition = a.pos; previewState.announcementBgColor = a.color;
            if (eye) eye.classList.add('toggle-active');
            renderPreview();
        }
    } else if (c.applied) {
        c.applied = false; previewState.announcementVisible = false;
        if (eye) eye.classList.remove('toggle-active');
        renderPreview();
    }
}
function ntRefreshAll() { ovRefreshAll(); }
function ovTurnOn(ch, key, name) {
    if (name === 'nt' && !ovHasTag()) { ntNote('Type a role or name first.'); return false; }
    if (name === 'ann' && !ovAnnData().text) { ovAnnNote('Type the announcement text first.'); return false; }
    ovSet(ch, key, true);
    if (key === 'projector') { if (!projectorWindowRef || projectorWindowRef.closed) sendToProjectorAutoDetect(); }
    else if (key.startsWith('s:')) { const id = key.slice(2), sl = outputSlots.find(s => s.id === id); if (sl && (!sl.windowRef || sl.windowRef.closed)) openOutputSlotWindow(id); }
    return true;
}
function ovDefaultSend(name) {
    const ch = ovCh[name], note = name === 'nt' ? ntNote : ovAnnNote;
    if (name === 'nt' && !ovHasTag()) { ntNote('Type a role or name first.'); return; }
    if (name === 'ann' && !ovAnnData().text) { ovAnnNote('Type the announcement text first.'); return; }
    if (ch.mode === 'scene') { ch.scene = true; note(''); ovRefreshAll(); return; }
    ch.t.obs = true;
    // send to every screen that is currently open (Projector + any output feed window); open the Projector if none is
    const names = [];
    if (projectorWindowRef && !projectorWindowRef.closed) { ch.t.projector = true; names.push('Projector'); }
    outputSlots.forEach(sl => { if (sl.windowRef && !sl.windowRef.closed) { ch.t.slots[sl.id] = true; names.push(sl.name || 'Output'); } });
    if (!names.length && !Object.keys(ch.t.slots).length && !ch.t.projector) { ovTurnOn(ch, 'projector', name); names.push('Projector (opening…)'); }
    names.push('OBS');
    note('Sent to: ' + names.join(', ') + '. Use ▾ to change.');
    ovRefreshAll();
}
function ovHide(name) { const ch = ovCh[name]; ch.t = { projector: false, slots: {}, obs: false, obsOnly: false }; ch.scene = false; ovRefreshAll(); }
function ntHideAll() { ovHide('nt'); }
function ovAnnNote(t) { const e = document.getElementById('annStatus'); if (e) e.innerText = t || ''; }
function ovSyncBtn(btnId, on, label) {
    const s = document.getElementById(btnId); if (!s) return;
    s.innerText = on ? '⏹ Hide ' + label : '▶ Send ' + label;
    s.style.background = on ? '#b91c1c' : '#1d4ed8'; s.style.borderColor = on ? '#dc2626' : '#2563eb';
}
function ntSyncUI() {
    ovSyncBtn('ntSendBtn', ntAnyActive(), 'Name Tag');
    ovSyncBtn('annSendBtn', ovAnnActive(), 'Banner');
    const sb = document.getElementById('ntStyleBtn'); if (sb) sb.innerText = 'NAME TAG: ' + LTT[ntState.tpl].name.toUpperCase() + ' ▾';
    const pos = document.getElementById('ntPosition'); if (pos) pos.value = ntState.pos;
    const sv = document.getElementById('ntSizeVal'); if (sv) sv.innerText = ntState.scale + '%';
    const prev = document.getElementById('ntPrev'); if (prev) prev.innerHTML = ntTagHtml(ntState.tpl, ntStyle(), previewState.lowerThirdRole || 'Ministering', previewState.lowerThirdName || 'Pastor Ade');
}
function ovBuildMenu(name) {
    const m = document.getElementById(name + 'SendMenu'); if (!m) return;
    const ch = ovCh[name], what = name === 'nt' ? 'name tag' : 'banner', thing = what;
    const sub = ch.mode === 'ontop' ? 'on top of that screen\'s feed' : thing + ' alone';
    const row = (label, key, s2) => { const a = ovOn(ch, key); return `<button type="button" class="ntu-item" data-k="${key}">${a ? '✓ ' : '○ '}${label}<small>${a ? 'showing — click to remove' : s2}</small></button>`; };
    const sceneMode = ch.mode === 'scene';
    let h = `<div class="ntu-seg"><button type="button" data-mode="overlay" class="${ch.mode === 'overlay' ? 'on' : ''}">Overlay only</button><button type="button" data-mode="ontop" class="${ch.mode === 'ontop' ? 'on' : ''}">On top of feed</button><button type="button" data-mode="scene" class="${sceneMode ? 'on' : ''}">With the scene</button></div>`;
    if (sceneMode) h += `<div class="ntu-hd" style="text-transform:none;font-weight:500;white-space:normal">The ${thing} is drawn inside the verse scene, so it goes to every screen the scene goes to (Projector, OBS, extra outputs). Use the main button to send / hide.</div>`;
    else {
        h += `<div class="ntu-hd" style="text-transform:none;font-weight:500;white-space:normal">${ch.mode === 'overlay' ? 'Only the ' + thing + ' is sent — no verse or background.' : 'Shown over whatever the screen is already displaying.'}</div>`;
        h += row('Projector', 'projector', sub) + outputSlots.map(sl => row(sl.name || 'Output', 's:' + sl.id, sub)).join('');
        h += row('OBS Browser Source', 'obs', ch.mode === 'ontop' ? 'on top of the verse scene' : 'transparent, ' + thing + ' alone');
    }
    h += `<div class="ntu-sep"></div><button type="button" class="ntu-item" data-k="hide" style="color:#fca5a5">⏹ Hide ${what} from all screens</button>`;
    m.innerHTML = h;
    m.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation(); const nm = b.dataset.mode; if (ch.mode === nm) return;
        if (ch.mode === 'scene') ch.scene = false; ch.mode = nm; ovRefreshAll(); ovBuildMenu(name);
    }));
    m.querySelectorAll('.ntu-item').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation(); const k = b.dataset.k;
        if (k === 'hide') ovHide(name);
        else if (ovOn(ch, k)) { ovSet(ch, k, false); ovRefreshAll(); }
        else { if (!ovTurnOn(ch, k, name)) return; ovRefreshAll(); }
        m.classList.remove('open');
    }));
}
function ntBuildSendMenu() { ovBuildMenu('nt'); }
function initAnnOverlay() {
    const btn = document.getElementById('annSendBtn'); if (!btn) return;
    const menu = document.getElementById('annSendMenu');
    btn.addEventListener('click', () => { if (ovAnnActive()) ovHide('ann'); else ovDefaultSend('ann'); });
    document.getElementById('annSendCaret').addEventListener('click', (e) => { e.stopPropagation(); const nt = document.getElementById('ntSendMenu'); if (nt) nt.classList.remove('open'); ovBuildMenu('ann'); menu.classList.toggle('open'); });
    menu.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => menu.classList.remove('open'));
    ['announcementInput', 'announcementEffectSelector', 'announcementPositionSelector'].forEach(id => { const el = document.getElementById(id); if (el) { el.addEventListener('input', () => { if (ovAnnActive()) ovRefreshAll(); }); el.addEventListener('change', () => { if (ovAnnActive()) ovRefreshAll(); }); } });
    const col = document.getElementById('announcementColorPicker'); if (col) col.addEventListener('input', () => { if (ovAnnActive()) ovRefreshAll(); });
    const clr = document.getElementById('clearAnnouncementBtn'); if (clr) clr.addEventListener('click', () => { if (ovAnnActive()) ovRefreshAll(); });
}
