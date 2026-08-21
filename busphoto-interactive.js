/* ===== Интерактив: транспортный бизнес ===== */

        /* v17: карточка выезда со сменой, автографиком, несколькими маршрутами и офлайн-прибытиями. */
        const BELARUS_STOP_REGIONS = [
            {id:'by-minsk-city', name:'Минск (город)', areaNames:['Минск'], oblast:'Минск'},
            {id:'by-brest', name:'Брестская область — вся', areaNames:['Брестская область','Брэсцкая вобласць'], oblast:'Брестская область'},
            {id:'by-vitebsk', name:'Витебская область — вся', areaNames:['Витебская область','Віцебская вобласць'], oblast:'Витебская область'},
            {id:'by-gomel', name:'Гомельская область — вся', areaNames:['Гомельская область','Гомельская вобласць'], oblast:'Гомельская область'},
            {id:'by-grodno', name:'Гродненская область — вся', areaNames:['Гродненская область','Гродзенская вобласць'], oblast:'Гродненская область'},
            {id:'by-minsk-oblast', name:'Минская область — вся', areaNames:['Минская область','Мінская вобласць'], oblast:'Минская область'},
            {id:'by-mogilev', name:'Могилёвская область — вся', areaNames:['Могилёвская область','Магілёўская вобласць'], oblast:'Могилёвская область'},
            {id:'ru-smolensk', name:'Смоленская область (Россия) — вся', areaNames:['Смоленская область','Смоленская обласць'], oblast:'Россия — Смоленская область'},
            {id:'ru-moscow-oblast', name:'Московская область (Россия) — вся', areaNames:['Московская область','Московская обл.'], oblast:'Россия — Московская область'},
            {id:'ru-moscow-city', name:'Москва (город, Россия)', areaNames:['Москва','город Москва'], oblast:'Россия — Москва'},
            {id:'ru-spb', name:'Санкт-Петербург (город, Россия)', areaNames:['Санкт-Петербург','город Санкт-Петербург'], oblast:'Россия — Санкт-Петербург'},
            ...Object.entries({
                'Брестская область':['Барановичский','Берёзовский','Ганцевичский','Дрогичинский','Жабинковский','Ивановский','Ивацевичский','Каменецкий','Кобринский','Лунинецкий','Ляховичский','Малоритский','Пинский','Пружанский','Столинский','Брестский'],
                'Витебская область':['Бешенковичский','Браславский','Верхнедвинский','Витебский','Глубокский','Городокский','Докшицкий','Дубровенский','Лепельский','Лиозненский','Миорский','Оршанский','Полоцкий','Поставский','Россонский','Сенненский','Шарковщинский','Чашникский','Шумилинский','Ушачский','Толочинский'],
                'Гомельская область':['Брагинский','Буда-Кошелёвский','Ветковский','Гомельский','Добрушский','Ельский','Житковичский','Жлобинский','Калинковичский','Кормянский','Лельчицкий','Лоевский','Мозырский','Наровлянский','Октябрьский','Петриковский','Речицкий','Рогачёвский','Светлогорский','Чечерский','Хойникский'],
                'Гродненская область':['Берестовицкий','Волковысский','Вороновский','Гродненский','Дятловский','Зельвенский','Ивьевский','Кореличский','Лидский','Мостовский','Новогрудский','Островецкий','Ошмянский','Свислочский','Слонимский','Сморгонский','Щучинский'],
                'Минская область':['Березинский','Борисовский','Вилейский','Воложинский','Дзержинский','Клецкий','Копыльский','Крупский','Логойский','Любанский','Минский','Молодечненский','Мядельский','Несвижский','Пуховичский','Слуцкий','Смолевичский','Солигорский','Стародорожский','Столбцовский','Узденский','Червенский'],
                'Могилёвская область':['Белыничский','Бобруйский','Быховский','Горецкий','Глусский','Дрибинский','Кировский','Климовичский','Кличевский','Костюковичский','Краснопольский','Кричевский','Круглянский','Могилёвский','Мстиславский','Осиповичский','Славгородский','Хотимский','Чаусский','Чериковский','Шкловский']
            }).flatMap(([oblast, districts]) => districts.map(name => ({
                id:'by-'+name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi,'-'),
                name:name+' район',
                areaNames:[name+' район', name+' раён'],
                oblast
            })))
        ];

        const STOP_REGION_CACHE_KEY = 'busphoto_stop_regions_loaded_v1';
        const STOP_DATA_KEY = 'minsk_custom_osm_stops_v1';
        let stopRegionCache = {};
        try { stopRegionCache = JSON.parse(localStorage.getItem(STOP_REGION_CACHE_KEY) || '{}') || {}; } catch(e) { stopRegionCache = {}; }

        // v19: классификация автобусов и их подмоделей для интерактива.
        // serviceType: городские / пригородные / межгородние.
        const GAME_SERVICE_TYPES = {
            city: {label:'🏙️ Городские', short:'Городской'},
            suburban: {label:'🏘️ Пригородные', short:'Пригородный'},
            intercity: {label:'🛣️ Межгородние', short:'Межгородний'}
        };
        const GAME_BUS_CLASSES = {
            'МАЗ-101':['city'],
            'МАЗ-103':['city','suburban'],
            'МАЗ-104':['city','suburban'],
            'МАЗ-105':['city'],
            'МАЗ-107':['city','suburban'],
            'МАЗ-152':['suburban','intercity'],
            'МАЗ-203':['city','suburban'],
            'МАЗ-205':['city'],
            'МАЗ-206':['city','suburban'],
            'МАЗ-215':['city'],
            'МАЗ-216':['city'],
            'МАЗ-226':['city','suburban'],
            'МАЗ-231':['suburban'],
            'МАЗ-232':['suburban'],
            'МАЗ-241':['suburban'],
            'МАЗ-251':['suburban','intercity'],
            'МАЗ-256':['suburban'],
            'МАЗ-257':['suburban'],
            'МАЗ-303':['city','suburban']
        };
        // Подмодели строго по предоставленному пользователем PDF.
        // Если одна и та же подмодель указана в нескольких назначениях,
        // она доступна в соответствующих категориях.
        const GAME_BUS_SUBMODELS = {
            'МАЗ-101':['101'],
            'МАЗ-103':['103.065','103.465','103.565','103С65'],
            'МАЗ-104':['104.021','104С21'],
            'МАЗ-105':['105.041','105.065','105.465'],
            'МАЗ-107':['107.065','107.465','107.485','107.569'],
            'МАЗ-152':['152.062'],
            'МАЗ-203':['203.015','203.016','203.047','203.115','203.147'],
            'МАЗ-205':['205'],
            'МАЗ-206':['206.047','206.068'],
            'МАЗ-215':['215.069','215.169'],
            'МАЗ-216':['216.047','216.066'],
            'МАЗ-226':['226.047','226.068'],
            'МАЗ-231':['231'],
            'МАЗ-232':['232'],
            'МАЗ-241':['241'],
            'МАЗ-251':['251.062'],
            'МАЗ-256':['256'],
            'МАЗ-257':['257'],
            'МАЗ-303':['303.047','303.065','303.226','303.147','303е10','303е20','303е22']
        };
        function gameServiceLabel(value){ return GAME_SERVICE_TYPES[value]?.label || value || '—'; }
        function gameModelClasses(model){ return GAME_BUS_CLASSES[model] || ['city']; }
        function gameModelSupportsType(model, type){ return type === 'all' || gameModelClasses(model).includes(type); }
        function getGameSubmodels(category, model){
            if (category !== 'bus') return [];
            return GAME_BUS_SUBMODELS[model] || [];
        }

        const gameCatalog = {
            bus: {
                "МАЗ-101": { price: 50000, salary: [7500, 12500] },
                "МАЗ-103": { price: 65000, salary: [7500, 12500] },
                "МАЗ-104": { price: 65000, salary: [7500, 12500] },
                "МАЗ-105": { price: 70000, salary: [15000, 20000] },
                "МАЗ-107": { price: 70000, salary: [15000, 20000] },
                "МАЗ-152": { price: 135000, salary: [15000, 20000] },
                "МАЗ-203": { price: 100000, salary: [7500, 12500] },
                "МАЗ-205": { price: 110000, salary: [15000, 20000] },
                "МАЗ-206": { price: 80000, salary: [7000, 10000] },
                "МАЗ-215": { price: 125000, salary: [15000, 20000] },
                "МАЗ-216": { price: 125000, salary: [15000, 20000] },
                "МАЗ-226": { price: 80000, salary: [7000, 10000] },
                "МАЗ-231": { price: 85000, salary: [5000, 7500] },
                "МАЗ-232": { price: 85000, salary: [5000, 7500] },
                "МАЗ-241": { price: 60000, salary: [7000, 10000] },
                "МАЗ-251": { price: 150000, salary: [15000, 20000] },
                "МАЗ-256": { price: 60000, salary: [7000, 10000] },
                "МАЗ-257": { price: 75000, salary: [7000, 10000] },
                "МАЗ-303": { price: 130000, salary: [7500, 12500] }
            },
            trolleybus: {
                "МАЗ-103Т": { price: 55000, salary: [7500, 10000] },
                "МАЗ-203Т": { price: 65000, salary: [7500, 10000] },
                "МАЗ-303Т": { price: 80000, salary: [7500, 10000] },
                "АКСМ-101": { price: 50000, salary: [6000, 7500] },
                "БКМ-201": { price: 60000, salary: [6000, 7500] },
                "БКМ-321": { price: 60000, salary: [6000, 7500] },
                "БКМ-420": { price: 62500, salary: [6000, 7500] },
                "БКМ-213": { price: 65000, salary: [12500, 15000] },
                "БКМ-333": { price: 70000, salary: [12500, 15000] },
                "БКМ-433": { price: 80000, salary: [12500, 15000] }
            },
            electrobus: {
                "МАЗ-303Е": { price: 75000, salary: [7500, 12500] },
                "МАЗ-305Е": { price: 130000, salary: [12500, 15000] },
                "БКМ-Е321": { price: 55000, salary: [7500, 10000] },
                "БКМ-Е433": { price: 75000, salary: [12000, 15000] }
            }
        };

        let mapState = {
            map: null,
            mode: 'select',
            selectedRouteId: null,
            draftStopIds: [],
            draftPath: [],
            creatingNewRoute: false,
            stopMarkers: new Map(),
            routeLayers: new Map(),
            busMarkers: new Map(),
            initialized: false,
            osmStopsLoaded: false,
            busAnimationTimer: null,
            busAnimationFrame: null,
            stopRenderTimer: null,
            busListSignature: '',
            lastBusUpdate: 0,
            routeTypeFilter: 'all',
            stopRenderZoom: 13,
            vehicleRenderSignature: '',
            depotMarkers: new Map(),
            controlMarkers: new Map(),
            trackingVehicleId: null,
            lastTrackPanAt: 0
        };

        let trackerState = { map:null, marker:null, routeLayer:null, initialized:false, vehicleId:null, lastPoint:null, lastPanAt:0 };

        const DEPOTS = {
            bus: { id:'ap5', name:'Автобусный парк №5', address:'ул. Гурского, 15/6', lat:53.882619, lon:27.484127, icon:'🚌' },
            electrobus: { id:'ap5', name:'Автобусный парк №5', address:'ул. Гурского, 15/6', lat:53.882619, lon:27.484127, icon:'⚡' },
            trolleybus: { id:'tp4', name:'Транспортный парк №4', address:'ул. Харьковская, 16', lat:53.9025, lon:27.5186, icon:'🚎' },
        };

        let gameState = {
            balance: 50000,
            lastPayoutDate: null,
            owned: [],
            routes: [],
            log: []
        };

        function money(v) {
            return Math.round(v).toLocaleString('ru-RU') + ' р.';
        }

        function loadGameState() {
            const CARDS_KEY = 'busphoto_service_cards_v1';
            try {
                const saved = localStorage.getItem('busphoto_interactive_game');
                if (saved) gameState = Object.assign(gameState, JSON.parse(saved));
            } catch (e) {
                console.warn('Не удалось загрузить игру', e);
            }
            if (!Array.isArray(gameState.owned)) gameState.owned = [];
            if (!Array.isArray(gameState.routes)) gameState.routes = [];
            // Интерактив больше не использует трамваи. Старые игровые трамвайные маршруты удаляются.
            gameState.routes = gameState.routes.filter(r => r.routeType !== 'tram');
            gameState.owned = gameState.owned.filter(v => v.category !== 'tram');
            gameState.owned.forEach(v => {
                if (!v.depot) v.depot = DEPOTS[v.category] ? DEPOTS[v.category].id : 'ap5';
                if (!v.plate) v.plate = generateRandomPlate();
                if (v.category === 'trolleybus' && !/^\d{4}$/.test(String(v.num || ''))) v.num = generateTrolleybusBoardNumber();
                if (v.category === 'bus') {
                    if (!v.serviceType || !GAME_SERVICE_TYPES[v.serviceType]) v.serviceType = gameModelClasses(v.model)[0] || 'city';
                    const subs = getGameSubmodels(v.category, v.model);
                    if (!v.submodel) v.submodel = subs[0] || 'Базовая модификация';
                } else {
                    if (!v.serviceType || !GAME_SERVICE_TYPES[v.serviceType]) v.serviceType = 'city';
                    if (!v.submodel) v.submodel = 'Базовая модификация';
                }
            });
            gameState.routes.forEach(r => {
                if (!Array.isArray(r.vehicleIds)) {
                    r.vehicleIds = r.vehicleId ? [r.vehicleId] : [];
                }
                if (!Object.prototype.hasOwnProperty.call(r, 'geometry')) r.geometry = null;
                if (!Object.prototype.hasOwnProperty.call(r, 'calculatedDistance')) r.calculatedDistance = null;
                if (!Object.prototype.hasOwnProperty.call(r, 'calculatedDuration')) r.calculatedDuration = null;
                if (!r.routeType) r.routeType = 'bus';
                if (!Object.prototype.hasOwnProperty.call(r, 'outboundGeometry')) r.outboundGeometry = null;
                if (!Object.prototype.hasOwnProperty.call(r, 'returnGeometry')) r.returnGeometry = null;
                if (!Object.prototype.hasOwnProperty.call(r, 'outboundDuration')) r.outboundDuration = null;
                if (!Object.prototype.hasOwnProperty.call(r, 'returnDuration')) r.returnDuration = null;
                if (!Object.prototype.hasOwnProperty.call(r, 'terminalStopIds')) r.terminalStopIds = Array.isArray(r.stopIds) ? r.stopIds.slice() : [];
                if (!Object.prototype.hasOwnProperty.call(r, 'turnbackStopIds')) r.turnbackStopIds = [];
                if (!Object.prototype.hasOwnProperty.call(r, 'turnaroundMinutes')) r.turnaroundMinutes = 2;
            });
            if (!Array.isArray(gameState.log)) gameState.log = [];
            if (!Array.isArray(gameState.serviceCards)) gameState.serviceCards = [];
            // Карточки имеют отдельное постоянное хранилище. Если оно есть,
            // оно является источником истины для карточек, чтобы переходы
            // между creating_card.html и interactive.html не теряли их.
            try {
                const savedCards = JSON.parse(localStorage.getItem(CARDS_KEY) || 'null');
                if (Array.isArray(savedCards)) gameState.serviceCards = savedCards;
            } catch (e) {}
            if (!gameState.emailNotifications || typeof gameState.emailNotifications !== 'object') {
                gameState.emailNotifications = {enabled:false, email:'', notifiedVehicleIds:[], lastCheckAt:null};
            } else {
                gameState.emailNotifications.enabled = gameState.emailNotifications.enabled === true;
                gameState.emailNotifications.email = String(gameState.emailNotifications.email || '');
                if (!Array.isArray(gameState.emailNotifications.notifiedVehicleIds)) gameState.emailNotifications.notifiedVehicleIds = [];
            }
            gameState.serviceCards = gameState.serviceCards.filter(card => card && card.vehicleId != null && (card.routeId != null || Array.isArray(card.schedules)));
            gameState.serviceCards.forEach(card => {
                if (!card.createdAt) card.createdAt = new Date().toISOString();
                if (!Number.isFinite(Number(card.lastArrivalCount))) card.lastArrivalCount = 0;
                card.active = card.active !== false;
                if (!Array.isArray(card.schedules) || !card.schedules.length) {
                    card.schedules = [{routeId:card.routeId, days:[0,1,2,3,4,5,6], startStopId:null, endStopId:null, depotTime:card.depotTime || '07:00', startTime:card.startTime || '07:30', endTime:card.endTime || '08:30', returnTime:card.returnTime || '09:00'}];
                }
                card.schedules = card.schedules.map(s => ({
                    routeId: s.routeId != null ? s.routeId : card.routeId,
                    days: Array.isArray(s.days) ? s.days.map(Number).filter(n => n >= 0 && n <= 6) : [0,1,2,3,4,5,6],
                    startStopId: s.startStopId ?? null,
                    endStopId: s.endStopId ?? null,
                    depotTime: s.depotTime || card.depotTime || '05:00',
                    startTime: s.startTime || card.startTime || '05:30',
                    workUntil: s.workUntil || s.endTime || card.endTime || '22:00',
                    endTime: s.endTime || card.endTime || '22:00',
                    lastArrivalTime: s.lastArrivalTime || s.endTime || card.endTime || '22:00',
                    returnTime: s.returnTime || card.returnTime || '22:20',
                    turnaroundMinutes: Number.isFinite(Number(s.turnaroundMinutes)) ? Number(s.turnaroundMinutes) : 2
                }));
                // Последнее время обработки нужно для офлайн-прибытия на конечные.
                if (!card.lastSimulationAt) card.lastSimulationAt = card.createdAt;
                card.routeId = card.routeId ?? card.schedules[0]?.routeId ?? null;
            });
            saveGameState();
            try { localStorage.setItem(CARDS_KEY, JSON.stringify(gameState.serviceCards || [])); } catch (e) {}
            if (typeof gameState.balance !== 'number' || Number.isNaN(gameState.balance)) {
                gameState.balance = 50000;
            }
            if (!gameState.log.length && !gameState.owned.length && gameState.balance === 0) {
                gameState.balance = 50000;
            }
        }

        function saveGameState() {
            localStorage.setItem('busphoto_interactive_game', JSON.stringify(gameState));
            try { localStorage.setItem('busphoto_service_cards_v1', JSON.stringify(gameState.serviceCards || [])); } catch (e) {}
        }

        window.addEventListener('storage', function(e) {
            if (e.key !== 'busphoto_service_cards_v1') return;
            try {
                const cards = JSON.parse(e.newValue || '[]');
                if (Array.isArray(cards)) {
                    gameState.serviceCards = cards;
                    if (typeof renderDepartureCards === 'function') renderDepartureCards();
                    if (typeof updateMapBusMarkers === 'function') updateMapBusMarkers(true);
                }
            } catch (err) {}
        });

        function startNewGame() {
            const confirmed = confirm(
                'Начать новую игру?\n\n' +
                'Баланс будет установлен на 50 000 р.\n' +
                'Гараж, маршруты и история будут очищены.\n' +
                'Это действие нельзя отменить.'
            );
            if (!confirmed) return;

            localStorage.removeItem('busphoto_interactive_game');
            localStorage.removeItem(STOP_DATA_KEY);
            localStorage.removeItem(STOP_REGION_CACHE_KEY);
            stopRegionCache = {};

            gameState = {
                balance: 50000,
                    lastPayoutDate: null,
                owned: [],
                routes: [],
                serviceCards: [],
                log: []
            };

            // Полностью сбрасываем состояние карты перед перезапуском.
            if (typeof mapState !== 'undefined') {
                mapState.selectedRouteId = null;
                mapState.draftStopIds = [];
            }

            saveGameState();
            location.reload();
        }

        function randomSalary(range) {
            return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
        }

        // Единое игровое время: Беларусь (Europe/Minsk).
        // Никаких запросов к внешним сервисам для определения времени нет.
        // Поэтому страница не зависает на «Определение времени…», а выплаты
        // всегда считаются по белорусскому времени, даже если пользователь
        // находится в другой стране.
        const GAME_TIME_ZONE = 'Europe/Minsk';

        function getGameClock(nowMs = Date.now()) {
            const parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: GAME_TIME_ZONE,
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hourCycle: 'h23'
            }).formatToParts(new Date(nowMs));
            const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
            return {
                year: Number(p.year), month: Number(p.month), day: Number(p.day),
                hour: Number(p.hour), minute: Number(p.minute), second: Number(p.second)
            };
        }

        function localDateKey(d = new Date()) {
            const c = getGameClock(d instanceof Date ? d.getTime() : Number(d));
            return `${c.year}-${String(c.month).padStart(2,'0')}-${String(c.day).padStart(2,'0')}`;
        }

        function timeUntilNoonMs() {
            const nowMs = Date.now();
            const c = getGameClock(nowMs);
            if (c.hour >= 12) return 0;
            // Полностью локально рассчитываем задержку до 12:00 по Минску.
            const mins = (12 * 60) - (c.hour * 60 + c.minute);
            return Math.max(1000, mins * 60000 - c.second * 1000);
        }

        function dateKeyFromDate(d) {
            return localDateKey(d);
        }

        function payoutEligibleDateKey(now = new Date()) {
            const c = getGameClock(now instanceof Date ? now.getTime() : Number(now));
            // До 12:00 по Минску выплата относится к предыдущему белорусскому дню.
            if (c.hour >= 12) return `${c.year}-${String(c.month).padStart(2,'0')}-${String(c.day).padStart(2,'0')}`;
            const prev = new Date(Date.UTC(c.year, c.month - 1, c.day - 1, 12, 0, 0));
            return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth()+1).padStart(2,'0')}-${String(prev.getUTCDate()).padStart(2,'0')}`;
        }

        function dateKeysAfter(lastKey, throughKey) {
            const result = [];
            if (!throughKey) return result;
            const end = new Date(`${throughKey}T12:00:00`);
            let cur = lastKey ? new Date(`${lastKey}T12:00:00`) : null;
            if (!cur || Number.isNaN(cur.getTime())) {
                result.push(throughKey);
                return result;
            }
            cur.setDate(cur.getDate() + 1);
            while (cur <= end) {
                result.push(localDateKey(cur));
                cur.setDate(cur.getDate() + 1);
                if (result.length > 3660) break; // защита от повреждённого сохранения
            }
            return result;
        }

        function processGamePayout(force = false) {
            /*
             * Оффлайн-начисления:
             * - зарплата ТС продолжает начисляться, даже если вкладка/сайт были закрыты;
             * - при следующем открытии мы считаем все пропущенные дни после последнего
             *   начисления;
             * - выплата за конечную тоже считается отдельно по реальному времени.
             */
            const now = new Date();
            const eligibleKey = payoutEligibleDateKey(now);

            if (!Array.isArray(gameState.owned) || !gameState.owned.length) {
                if (!gameState.lastPayoutDate) gameState.lastPayoutDate = eligibleKey;
                else if (gameState.lastPayoutDate < eligibleKey) gameState.lastPayoutDate = eligibleKey;
                saveGameState();
                return 0;
            }

            let total = 0;
            const details = [];
            const missedDates = dateKeysAfter(gameState.lastPayoutDate, eligibleKey);

            if (force && !missedDates.length && gameState.lastPayoutDate === eligibleKey) {
                return 0;
            }

            if (missedDates.length) {
                gameState.owned.forEach(vehicle => {
                    const catalogItem = gameCatalog[vehicle.category]?.[vehicle.model];
                    const range = catalogItem?.salary || [0, 0];
                    if (!Number(vehicle.currentSalary) || Number(vehicle.currentSalary) < range[0] || Number(vehicle.currentSalary) > range[1]) {
                        vehicle.currentSalary = randomSalary(range);
                    }

                    const daily = Math.max(0, Math.round(Number(vehicle.currentSalary) || 0));
                    const vehicleTotal = daily * missedDates.length;
                    total += vehicleTotal;

                    details.push(`${vehicle.model}: ${money(daily)} × ${missedDates.length} дн. = ${money(vehicleTotal)}`);
                    vehicle.lastPaidDate = missedDates[missedDates.length - 1];
                });

                if (total > 0) {
                    gameState.balance += total;
                    gameState.log.unshift({
                        date: missedDates[missedDates.length - 1],
                        total,
                        details: [
                            missedDates.length === 1
                                ? `Ежедневная выплата в 12:00`
                                : `Оффлайн-выплата: ${missedDates.length} пропущенных дней`,
                            ...details
                        ],
                        offline: missedDates.length > 1
                    });
                    gameState.log = gameState.log.slice(0, 60);
                }

                gameState.lastPayoutDate = eligibleKey;
                saveGameState();
                checkAffordableVehicleNotifications();
            }

            return total;
        }

        function processAllOfflineEarnings() {
            return processGamePayout();
        }

        function scheduleNoonPayout() {
            clearTimeout(window.gameNoonTimer);
            const delay = timeUntilNoonMs();
            if (delay === 0) {
                processGamePayout();
                window.gameNoonTimer = setTimeout(scheduleNoonPayout, 24 * 60 * 60 * 1000);
            } else {
                window.gameNoonTimer = setTimeout(() => {
                    processGamePayout();
                    scheduleNoonPayout();
                }, delay);
            }
        }

        function selectGameServiceType(type, btn) {
            const hidden = document.getElementById('gameServiceType');
            if (hidden) hidden.value = type;
            document.querySelectorAll('#gameServiceTypePicker .game-service-btn').forEach(b => b.classList.toggle('active', b.dataset.service === type));
            updateGameModelSelect();
            if (btn) btn.focus();
        }

        function updateGameModelSelect() {
            const category = document.getElementById('gameCategory').value;
            const serviceType = document.getElementById('gameServiceType')?.value || 'all';
            document.querySelectorAll('#gameCategoryPicker .game-category-btn').forEach(b => b.classList.toggle('active', b.dataset.category === category));
            document.querySelectorAll('#gameServiceTypePicker .game-service-btn').forEach(b => b.classList.toggle('active', b.dataset.service === serviceType));
            const select = document.getElementById('gameModel');
            const previous = select.value;
            select.innerHTML = '';
            Object.keys(gameCatalog[category] || {}).filter(model => gameModelSupportsType(model, serviceType)).forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                select.appendChild(option);
            });
            if (previous && [...select.options].some(o => o.value === previous)) select.value = previous;
            updateGameSubmodelSelect();
            updateGamePurchaseInfo();
        }

        function updateGameSubmodelSelect() {
            const category = document.getElementById('gameCategory')?.value || 'bus';
            const model = document.getElementById('gameModel')?.value || '';
            const select = document.getElementById('gameSubmodel');
            if (!select) return;
            const subs = getGameSubmodels(category, model);
            select.innerHTML = '';
            if (category !== 'bus') {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Базовая модификация';
                select.appendChild(option);
                return;
            }
            if (!subs.length) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Без отдельной подмодели';
                select.appendChild(option);
                return;
            }
            subs.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                // Показываем именно код подмодели, чтобы список оставался компактным.
                option.textContent = sub;
                select.appendChild(option);
            });
        }

        function selectGameCategory(category, btn) {
            const select = document.getElementById('gameCategory');
            if (!select || !gameCatalog[category]) return;
            select.value = category;
            document.querySelectorAll('#gameCategoryPicker .game-category-btn').forEach(b => b.classList.toggle('active', b.dataset.category === category));
            updateGameModelSelect();
            if (btn) btn.focus();
        }

        function updateGamePurchaseInfo() {
            const category = document.getElementById('gameCategory').value;
            const model = document.getElementById('gameModel').value;
            const item = gameCatalog[category]?.[model];
            if (!item) return;
            document.getElementById('gamePrice').textContent = money(item.price);
            document.getElementById('gameSalaryRange').textContent = `${money(item.salary[0])} — ${money(item.salary[1])}`;
            const classEl = document.getElementById('gameModelClassInfo');
            if (classEl) classEl.textContent = category === 'bus' ? gameModelClasses(model).map(gameServiceLabel).join(' · ') : gameServiceLabel(document.getElementById('gameServiceType')?.value === 'all' ? 'city' : document.getElementById('gameServiceType')?.value);
            updateGameSubmodelSelect();
        }

        const PLATE_SECOND_LETTERS = ['І','Е','К','Р','О','С','Н','Т','Х'];
        function generateTrolleybusBoardNumber() {
            const used = new Set(gameState.owned.filter(v => v.category === 'trolleybus').map(v => String(v.num || '')).filter(Boolean));
            let n = 1000 + Math.floor(Math.random() * 9000);
            for (let i = 0; i < 10000; i++) {
                const value = String(n).padStart(4, '0');
                if (!used.has(value)) return value;
                n = 1000 + Math.floor(Math.random() * 9000);
            }
            return String(1000 + gameState.owned.filter(v => v.category === 'trolleybus').length).padStart(4, '0').slice(-4);
        }
        function generateRandomPlate() {
            const second = PLATE_SECOND_LETTERS[Math.floor(Math.random() * PLATE_SECOND_LETTERS.length)];
            const digits = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
            const region = 7;
            return `А${second} ${digits}-${region}`;
        }
        function changeVehiclePlate(vehicleId) {
            const vehicle = gameState.owned.find(v => String(v.id) === String(vehicleId));
            if (!vehicle) return;
            if (gameState.balance < 5000) return alert('Для выбора собственного госномера нужно 5 000 р.');
            const raw = prompt('Введи госномер в формате АС 6421-7.\nПервая буква всегда А, вторая: І Е К Р О С Н Т Х, регион: строго 7.', vehicle.plate || generateRandomPlate());
            if (raw === null) return;
            const value = raw.trim().toUpperCase().replace(/\s+/g,' ');
            const m = value.match(/^А([ІЕКРОСНТХ])\s(\d{4})-7$/u);
            if (!m) return alert('Неверный формат. Пример: АС 6421-7.');
            gameState.balance -= 5000;
            vehicle.plate = `А${m[1]} ${m[2]}-7`;
            gameState.log.unshift({date:localDateKey(), total:-5000, details:[`Изготовление госномера для ${vehicle.model}: ${vehicle.plate}`]});
            gameState.log = gameState.log.slice(0,60);
            saveGameState();
            renderInteractive();
        }

        function buyGameVehicle() {
            const category = document.getElementById('gameCategory').value;
            const model = document.getElementById('gameModel').value;
            const item = gameCatalog[category]?.[model];
            if (!item) return;
            let serviceType = document.getElementById('gameServiceType')?.value || 'all';
            if (serviceType === 'all') serviceType = category === 'bus' ? (gameModelClasses(model)[0] || 'city') : 'city';
            const submodel = document.getElementById('gameSubmodel')?.value || (getGameSubmodels(category, model)[0] || 'Базовая модификация');

            if (gameState.balance < item.price) {
                alert(`Недостаточно денег. Нужно ${money(item.price)}, а на балансе ${money(gameState.balance)}.`);
                return;
            }

            gameState.balance -= item.price;
            gameState.owned.push({
                id: Date.now() + Math.random(),
                category,
                model,
                submodel,
                serviceType,
                price: item.price,
                currentSalary: randomSalary(item.salary),
                lastPaidDate: null,
                plate: generateRandomPlate(),
                num: category === 'trolleybus' ? generateTrolleybusBoardNumber() : '',
                depot: DEPOTS[category]?.id || 'ap5'
            });
            gameState.log.unshift({
                date: localDateKey(),
                total: -item.price,
                details: [`Покупка: ${model}`]
            });
            gameState.log = gameState.log.slice(0, 30);

            const bought = gameState.owned[gameState.owned.length - 1];
            saveGameState();
            renderInteractive();
            if (bought && confirm(`ТС куплено. ${bought.model}${bought.submodel ? ' · подмодель ' + bought.submodel : ''}.\nНазначение: ${gameServiceLabel(bought.serviceType)}\nГосномер: ${bought.plate}.\n${bought.category === 'trolleybus' ? `Бортовой номер: ${bought.num}\n` : ''}
Хочешь сразу выбрать свой номер за 5 000 р.?`)) {
                changeVehiclePlate(bought.id);
            }
        }

        function sellGameVehicle(id) {
            const index = gameState.owned.findIndex(v => String(v.id) === String(id));
            if (index < 0) return;
            const vehicle = gameState.owned[index];

            // Удаляем автобус с маршрута перед продажей.
            gameState.routes.forEach(r => {
                if (Array.isArray(r.vehicleIds)) {
                    r.vehicleIds = r.vehicleIds.filter(id => String(id) !== String(vehicle.id));
                }
                if (String(r.vehicleId) === String(vehicle.id)) r.vehicleId = r.vehicleIds?.[0] || null;
            });

            // Реализуем продажу по полной стоимости, чтобы тестировать механику без блокировки прогресса.
            gameState.balance += vehicle.price;
            gameState.owned.splice(index, 1);
            gameState.log.unshift({
                date: localDateKey(),
                total: vehicle.price,
                details: [`Продажа: ${vehicle.model}`]
            });
            gameState.log = gameState.log.slice(0, 30);
            saveGameState();
            renderInteractive();
            updateMapBusMarkers();
        }

        function getRouteDirectionOptions(route){
            return gameState.routes.filter(r => String(r.id)!==String(route.id) && r.routeType===route.routeType)
                .sort((a,b)=>String(a.number).localeCompare(String(b.number),undefined,{numeric:true}));
        }

        function pairGameRoutes(routeId, otherId){
            const a=gameState.routes.find(r=>String(r.id)===String(routeId));
            const b=gameState.routes.find(r=>String(r.id)===String(otherId));
            if(!a || !b || a.id===b.id) return;
            if(a.routeType!==b.routeType){ alert('Связать можно только маршруты одного типа.'); return; }
            const group=a.directionGroupId || b.directionGroupId || ('dirgrp-'+Date.now()+'-'+Math.random().toString(36).slice(2,7));
            a.directionGroupId=group; b.directionGroupId=group;
            a.pairedRouteId=b.id; b.pairedRouteId=a.id;
            a.direction='outbound'; b.direction='return';
            saveGameState(); renderInteractive(); renderMapRouteControls(); renderMapRouteLayers(); updateMapBusMarkers(true);
        }

        function unpairGameRoute(routeId){
            const a=gameState.routes.find(r=>String(r.id)===String(routeId));
            if(!a) return;
            const b=a.pairedRouteId ? gameState.routes.find(r=>String(r.id)===String(a.pairedRouteId)) : null;
            a.pairedRouteId=null; a.directionGroupId=null; a.direction='outbound';
            if(b){ b.pairedRouteId=null; b.directionGroupId=null; b.direction='outbound'; }
            saveGameState(); renderInteractive(); renderMapRouteControls(); updateMapBusMarkers(true);
        }

        function routePairLabel(route){
            if(!route?.pairedRouteId) return 'не связано';
            const p=gameState.routes.find(r=>String(r.id)===String(route.pairedRouteId));
            return p ? `🔗 №${p.number} — ${p.start} → ${p.end}` : 'связь потеряна';
        }

        function routeTypeLabel(type) {
            return type === 'trolleybus' ? 'троллейбусный маршрут' : type === 'electrobus' ? 'электробусный маршрут' : 'автобусный маршрут';
        }
        function vehicleCompatibleWithRoute(vehicle, route) {
            if (!vehicle || !route) return false;
            if (route.routeType === 'trolleybus') return vehicle.category === 'trolleybus';
            if (route.routeType === 'electrobus') return vehicle.category === 'electrobus';
            return vehicle.category === 'bus';
        }
        function setGameRouteTypeFilter(type) {
            mapState.routeTypeFilter = type;
            ['All','Bus','Electrobus','Trolleybus'].forEach(x => { const b=document.getElementById('gameRouteFilter'+x); if(b)b.classList.toggle('active', (x==='All'?'all':x.toLowerCase())===type); });
            renderRoutes();
        }
        function setMapRouteTypeFilter(type) {
            mapState.routeTypeFilter = type;
            ['All','Bus','Trolleybus'].forEach(x => { const b=document.getElementById('routeFilter'+x); if(b)b.classList.toggle('active', (x==='All'?'all':x.toLowerCase())===type); });
            renderMapRouteControls();
            renderMapRouteLayers();
            renderMapRouteList();
            if (mapState.mode === 'vehicles') updateMapBusMarkers(true);
        }

        async function createRouteFromMapDraft() {
            const ids = mapState.draftStopIds.slice();
            const stops = getMapStops().filter(s => ids.some(id => String(id)===String(s.id)));
            if (stops.length < 2) return alert('Выбери минимум 2 остановки на карте.');
            const number = document.getElementById('mapNewRouteNumber')?.value.trim();
            if (!number) return alert('Укажи номер нового маршрута.');
            const type = document.getElementById('mapRouteType')?.value || 'bus';
            const name = document.getElementById('mapNewRouteName')?.value.trim() || `${stops[0].name} — ${stops[stops.length-1].name}`;
            const classicStops = stops.filter(s => s.stopType !== 'turnback');
            const route = { id:Date.now()+Math.random(), number, name, start:(classicStops[0]||stops[0]).name, end:(classicStops[classicStops.length-1]||stops[stops.length-1]).name, distance:0, stopCount:stops.length, stops:stops.map(s=>s.name), stopIds:ids, terminalStopIds:classicStops.map(s=>s.id), turnbackStopIds:stops.filter(s=>s.stopType==='turnback').map(s=>s.id), turnaroundMinutes:2, color:type==='trolleybus'?'#1565c0':(type==='electrobus'?'#00897b':'#1e88e5'), note:'Создано через карту', routeType:type, vehicleId:null, vehicleIds:[], geometry:null, outboundGeometry:null, returnGeometry:null, reverseStopIds:ids.slice().reverse(), calculatedDistance:null, calculatedDuration:null, createdAt:localDateKey(), source:'map', controlPoints:mapState.draftPath.filter(x=>x.kind==='control').map(x=>x.point), pathNodes:mapState.draftPath.map(x=>x.kind==='control'?{kind:'control',point:x.point}:{kind:'stop',stopId:x.stopId}) };
            gameState.routes.push(route);
            mapState.selectedRouteId = route.id;
            mapState.creatingNewRoute = false;
            saveGameState();
            document.getElementById('mapNewRouteNumber').value=''; document.getElementById('mapNewRouteName').value='';
            renderInteractive(); renderMapRouteControls(); renderMapRouteLayers();
            mapSetStatus(`Создан ${routeTypeLabel(type)} №${number}. Строю линию…`);
            // Сразу строим дорожную геометрию для маршрута, созданного из карты.
            // Раньше такой маршрут сохранялся без distance/geometry, из-за чего в списке
            // появлялось «нет расчёта», хотя остановки уже были выбраны.
            try {
                await buildSelectedRoute();
            } catch (e) {
                console.warn('Автоматическая постройка маршрута не удалась', e);
            } finally {
                // После создания маршрута черновик очищаем.
                // Иначе при создании второго направления (например, №23 обратно)
                // уже выбранные остановки первого направления считались бы выбранными
                // и повторно нажать на них было невозможно.
                mapState.draftStopIds = [];
                mapState.draftPath = [];
                renderMapDraftInfo(); renderControlPoints();
                renderMapStops();
            }
        }

        // Карточка ТС — основной источник расписания, если она создана для машины.
        function getVehicleServiceCards(vehicleId) {
            const cards = Array.isArray(gameState.serviceCards) ? gameState.serviceCards : [];
            return cards
                .filter(card => card && card.active !== false && String(card.vehicleId) === String(vehicleId))
                .sort((a,b) => String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
        }
        function getVehicleServiceCard(vehicleId) {
            // Совместимость со старым кодом: возвращаем последнюю активную карточку,
            // но вся логика движения ниже учитывает ВСЕ карточки одного ТС.
            const cards = getVehicleServiceCards(vehicleId);
            return cards.length ? cards[cards.length-1] : null;
        }
        function getActiveServiceRouteAndSchedule(vehicleId, now = new Date()) {
            const cards = getVehicleServiceCards(vehicleId);
            if (!cards.length) return {card:null, schedule:null, route:getVehicleRoute(vehicleId)};
            const candidates=[];
            cards.forEach(card => {
                const schedules = Array.isArray(card.schedules) ? card.schedules : [];
                schedules.forEach((s,i)=>{
                    const route=getScheduleRoute(s);
                    if (!route) return;
                    const order=Number(s.sequenceOrder ?? i);
                    for(let offset=0; offset<=1; offset++) {
                        const base=new Date(now.getFullYear(),now.getMonth(),now.getDate()-offset);
                        if(!Array.isArray(s.days) || !s.days.includes(base.getDay())) continue;
                        const abs=getScheduleAbsoluteTimes(s,base,route,null);
                        if(now.getTime()>=abs.depot.getTime() && now.getTime()<=abs.return.getTime())
                            candidates.push({card,schedule:s,route,index:i,order,abs});
                    }
                });
            });
            candidates.sort((a,b)=>{
                const ao=Number(a.order||0), bo=Number(b.order||0);
                if(ao!==bo) return bo-ao;
                return String(b.card.createdAt||'').localeCompare(String(a.card.createdAt||''));
            });
            if(candidates.length) return candidates[0];
            return {card:cards[cards.length-1], schedule:null, route:null};
        }
        function getCardDrivenPoint(vehicle, card, now = new Date()) {
            // card может быть одной карточкой или массивом карточек одного ТС.
            const cards = Array.isArray(card) ? card : getVehicleServiceCards(vehicle.id);
            const candidates=[];
            cards.filter(c=>c && c.active!==false).forEach(cardItem=>{
                const schedules=(cardItem.schedules||[]).filter(s=>Array.isArray(s.days) && s.days.includes(now.getDay()));
                schedules.forEach((s,i)=>{
                    const route=getScheduleRoute(s);
                    if(!route?.geometry) return;
                    const abs=getScheduleAbsoluteTimes(s,new Date(now.getFullYear(),now.getMonth(),now.getDate()),route,vehicle);
                    candidates.push({card:cardItem,item:{s,i},route,abs,order:Number(s.sequenceOrder??i)});
                });
            });
            if(!candidates.length) return {point:null,phase:'в парке',activeRoute:null};
            candidates.sort((a,b)=>{
                const ao=Number(a.order||0),bo=Number(b.order||0);
                if(ao!==bo) return bo-ao;
                return String(b.card.createdAt||'').localeCompare(String(a.card.createdAt||''));
            });
            const nowMs=now.getTime();
            let chosen=null;
            for(const c of candidates){
                if(nowMs>=c.abs.depot.getTime() && nowMs<=c.abs.return.getTime()){ chosen=c; break; }
            }
            if(!chosen){
                const upcoming=candidates.filter(c=>nowMs<c.abs.depot.getTime()).sort((a,b)=>a.abs.depot-b.abs.depot)[0];
                if(upcoming) return {point:pathPointFromGeometry(upcoming.route.geometry,0),phase:`в парке · следующий этап №${upcoming.route.number}`,activeRoute:upcoming.route};
                return {point:null,phase:'в парке',activeRoute:null};
            }
            const {item,route,abs}=chosen;
            const schedule=item.s;
            const direction=getScheduleDirectionalRoutes(route,schedule.startStopId);
            const forwardFirst=!schedule.startStopId || String(schedule.startStopId)===String((route.terminalStopIds||route.stopIds||[])[0]);
            const forwardGeometry=direction.outboundGeometry || (forwardFirst?route.geometry:reverseGeometry(route.geometry));
            const returnGeometry=direction.returnGeometry || (forwardFirst?reverseGeometry(route.geometry):route.geometry);
            const paired=direction.reverse || findReverseRoute(route);
            const startMs=abs.start.getTime(), lastMs=abs.lastArrival.getTime();
            if(nowMs<startMs){
                const depot=depotForVehicle(vehicle);
                const progress=Math.max(0,Math.min(1,(nowMs-abs.depot.getTime())/Math.max(1,startMs-abs.depot.getTime())));
                const point=forwardGeometry?pathPointFromGeometry(forwardGeometry,progress):[depot.lat,depot.lon];
                return {point,phase:`🚍 парк → ${schedule.startStopName || route.start || 'первая конечная'}`,activeRoute:route};
            }
            if(nowMs<=lastMs){
                const elapsedMin=(nowMs-startMs)/60000;
                const duration=Math.max(1,Number(abs.duration||getRouteTerminalDurationMinutes(route,schedule.startStopId)));
                const turnaround=Math.max(0,Number(abs.turnaround||route.turnaroundMinutes||2));
                const span=duration+turnaround;
                const leg=Math.floor(elapsedMin/Math.max(1,span));
                const inLeg=elapsedMin-leg*span;
                const isForward=(leg%2===0)===forwardFirst;
                const activeRoute=isForward?route:(paired||route);
                const activeGeometry=isForward?forwardGeometry:(paired?.geometry||returnGeometry);
                if(inLeg>duration) return {point:pathPointFromGeometry(activeGeometry,1),phase:`⏸️ конечная · №${activeRoute.number}`,activeRoute};
                const progress=Math.max(0,Math.min(1,inLeg/duration));
                return {point:pathPointFromGeometry(activeGeometry,progress),phase:`на маршруте №${activeRoute.number} ${isForward?'→':'←'}`,activeRoute};
            }
            if(nowMs<=abs.return.getTime()){
                const endPoint=endIdPoint(route,schedule.endStopId)||pathPointFromGeometry(returnGeometry,1);
                const depot=depotForVehicle(vehicle), parkPoint=[depot.lat,depot.lon];
                const progress=Math.max(0,Math.min(1,(nowMs-lastMs)/Math.max(1,abs.return.getTime()-lastMs)));
                const point=[endPoint[0]+(parkPoint[0]-endPoint[0])*progress,endPoint[1]+(parkPoint[1]-endPoint[1])*progress];
                return {point,phase:`🏠 заезд в парк → ${depot.name||depot.id||'парк'}`,activeRoute:route};
            }
            return {point:null,phase:'в парке — этап завершён',activeRoute:null};
        }

        function getVehicleRoute(vehicleId) {
            return gameState.routes.find(r => {
                const ids = Array.isArray(r.vehicleIds) ? r.vehicleIds : (r.vehicleId ? [r.vehicleId] : []);
                return ids.some(id => String(id) === String(vehicleId));
            }) || null;
        }

        function toggleVehicleOnRoute(routeId, vehicleId, checked) {
            const route = gameState.routes.find(r => String(r.id) === String(routeId));
            if (!route) return;

            if (!Array.isArray(route.vehicleIds)) {
                route.vehicleIds = route.vehicleId ? [route.vehicleId] : [];
            }

            gameState.routes.forEach(r => {
                if (String(r.id) !== String(routeId) && Array.isArray(r.vehicleIds)) {
                    r.vehicleIds = r.vehicleIds.filter(id => String(id) !== String(vehicleId));
                    r.vehicleId = r.vehicleIds[0] || null;
                }
            });

            const vehicle = gameState.owned.find(v => String(v.id) === String(vehicleId));
            if (checked && vehicle && !vehicleCompatibleWithRoute(vehicle, route)) {
                alert(`Это ТС нельзя назначить на ${routeTypeLabel(route.routeType)}.`);
                return;
            }

            if (checked) {
                if (!route.vehicleIds.some(id => String(id) === String(vehicleId))) {
                    route.vehicleIds.push(vehicleId);
                }
            } else {
                route.vehicleIds = route.vehicleIds.filter(id => String(id) !== String(vehicleId));
            }

            route.vehicleId = route.vehicleIds[0] || null;
            saveGameState();
            renderInteractive();
            updateMapBusMarkers();
        }

        function changeRouteColor(routeId, color) {
            const route = gameState.routes.find(r => String(r.id) === String(routeId));
            if (!route) return;
            route.color = color;
            saveGameState();
            renderRoutes();
            renderMapRouteLayers();
            renderMapRouteList();
        }

        function deleteGameRoute(routeId) {
            const route = gameState.routes.find(r => String(r.id) === String(routeId));
            if (!route) return;
            if (!confirm(`Удалить маршрут №${route.number}?`)) return;

            gameState.routes = gameState.routes.filter(r => String(r.id) !== String(routeId));
            saveGameState();
            renderInteractive();
            updateMapBusMarkers();
        }

        function showRouteVehicles(routeId) {
            const route = gameState.routes.find(r => String(r.id) === String(routeId));
            if (!route) return;
            const vehicles = getAssignedVehiclesForRoute(route).filter(v => vehicleCompatibleWithRoute(v, route));
            if (!vehicles.length) {
                alert(`На маршруте №${route.number} сейчас нет назначенного транспорта.`);
                return;
            }
            const text = vehicles.map((v,i) => `${i+1}. ${vehicleCategoryIcon(v.category)} ${v.model} · борт. №${v.num || '—'}`).join('\n');
            alert(`ТС на маршруте №${route.number}\n${route.start} → ${route.end}\n\n${text}`);
        }

        function syncRouteStopMetadata(route) {
            if (!route) return route;
            const stops = getMapStops();
            if (Array.isArray(route.stopIds) && route.stopIds.length >= 2) {
                const ordered = route.stopIds.map(id => stops.find(s => String(s.id) === String(id))).filter(Boolean);
                if (ordered.length >= 2) {
                    route.stops = ordered.map(s => s.name);
                    route.start = ordered[0].name;
                    route.end = ordered[ordered.length - 1].name;
                    route.stopCount = ordered.length;
                }
            }
            return route;
        }

        function syncAllRouteMetadata() {
            let changed = false;
            gameState.routes.forEach(route => {
                const before = JSON.stringify([route.start, route.end, route.stopCount, route.stops]);
                syncRouteStopMetadata(route);
                const after = JSON.stringify([route.start, route.end, route.stopCount, route.stops]);
                if (before !== after) changed = true;
            });
            if (changed) saveGameState();
        }

        function renderRoutes() {
            const list = document.getElementById('routesList');
            const summary = document.getElementById('routeAssignmentSummary');
            if (!list || !summary) return;
            // Не подгружаем список остановок при открытии маршрутов: это тяжёлая операция.
            // Для списка маршрутов достаточно сохранённых данных «откуда → куда».

            const assigned = gameState.routes.reduce((sum, r) => {
                const ids = Array.isArray(r.vehicleIds) ? r.vehicleIds : (r.vehicleId ? [r.vehicleId] : []);
                return sum + ids.length;
            }, 0);
            const free = gameState.owned.filter(v => !getVehicleRoute(v.id)).length;

            summary.innerHTML = `
                <div class="interactive-stats" style="margin:0;">
                    <div class="interactive-stat">
                        <div class="interactive-stat-label">Маршрутов</div>
                        <div class="interactive-stat-value">${gameState.routes.length}</div>
                    </div>
                    <div class="interactive-stat">
                        <div class="interactive-stat-label">На линии</div>
                        <div class="interactive-stat-value">${assigned}</div>
                    </div>
                    <div class="interactive-stat">
                        <div class="interactive-stat-label">Свободно</div>
                        <div class="interactive-stat-value">${free}</div>
                    </div>
                </div>
                <div class="interactive-muted" style="margin-top:8px;">
                    Один маршрут может иметь несколько автобусов. Финансовая механика от назначения не меняется.
                </div>
            `;

            if (!gameState.routes.length) {
                list.innerHTML = `<div class="interactive-muted">Маршрутов пока нет. Открой «Карту» и создай маршрут там.</div>`;
                return;
            }

            const visibleRoutes = gameState.routes.filter(route => (mapState.routeTypeFilter === 'all' || route.routeType === mapState.routeTypeFilter));
            list.innerHTML = visibleRoutes.map(route => {
                const ids = Array.isArray(route.vehicleIds) ? route.vehicleIds : (route.vehicleId ? [route.vehicleId] : []);
                const assignedVehicles = gameState.owned.filter(v => ids.some(id => String(id) === String(v.id)));

                return `
                    <div class="route-card">
                        <div class="route-card-title">
                            <span>🛣️ №${route.number} — ${escapeHtml(route.start || "—")} → ${escapeHtml(route.end || "—")} <span class="route-type-badge">${routeTypeLabel(route.routeType)}</span></span>
                            <span class="route-badge ${assignedVehicles.length ? 'route-running' : 'route-idle'}">
                                ${assignedVehicles.length ? `${assignedVehicles.map(v=>vehicleCategoryIcon(v.category)).join('')} ${assignedVehicles.length} ТС на линии` : '⏸ Без ТС'}
                            </span>
                        </div>
                        <div class="route-meta">
                            <span>📍 ${escapeHtml(route.start || '—')} → ${escapeHtml(route.end || '—')}</span>
                            <span>🚍 ${routeTypeLabel(route.routeType)}</span>
                            ${route.calculatedDistance ? `<span>📏 ${(route.calculatedDistance / 1000).toFixed(2)} км</span>` : ''}
                            ${route.calculatedDuration ? `<span>⏱️ ${formatDuration(route.calculatedDuration)}</span>` : ''}
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;font-size:10px;">
                            <span>🎨 Цвет:</span>
                            <input type="color" value="${routeColor(route)}" onchange="changeRouteColor('${route.id}', this.value)" style="width:42px;height:24px;padding:1px;">
                            <button class="btn-secondary" onclick="openRouteOnMap('${route.id}')">🗺️ Открыть на карте</button> <button class="btn-secondary" onclick="showRouteVehicles('${route.id}')">🚍 ТС на маршруте</button> <button class="btn-secondary" onclick="showRouteDetails('${route.id}')">ℹ️ Подробнее</button>
                        </div>
                        <div class="route-direction-panel">
                            <div>
                                <div style="font-size:10px;font-weight:bold;">🔄 Обратное направление ${route.pairedRouteId ? `<span class="route-direction-badge">связано</span>` : ''}</div>
                                <div class="interactive-muted">${escapeHtml(route.start)} → ${escapeHtml(route.end)} ${route.pairedRouteId ? '↔ ' + escapeHtml(routePairLabel(route)) : ''}</div>
                                ${!route.pairedRouteId ? `<select onchange="if(this.value) pairGameRoutes('${route.id}',this.value)"><option value="">— Связать с маршрутом —</option>${getRouteDirectionOptions(route).map(r=>`<option value="${r.id}">№${escapeHtml(r.number)} — ${escapeHtml(r.start)} → ${escapeHtml(r.end)}</option>`).join('')}</select>` : `<button class="btn-secondary" onclick="unpairGameRoute('${route.id}')">🔓 Разорвать связь</button>`}
                            </div>
                            <div class="interactive-muted" style="font-size:10px;">${route.pairedRouteId ? 'ТС после конечной автоматически переходит на связанный маршрут.' : 'Свяжи две стороны, чтобы ТС переключалось на конечной.'}</div>
                        </div>
                        ${route.note ? `<div class="interactive-muted" style="margin-bottom:7px;">${escapeHtml(route.note)}</div>` : ''}
                        <div style="border:1px solid var(--bp-border);padding:7px;border-radius:3px;margin-bottom:7px;">
                            <div style="font-size:10px;font-weight:bold;margin-bottom:5px;">🚍 ТС на маршруте — ${assignedVehicles.length ? `назначено: ${assignedVehicles.length}` : 'пока нет'}:</div>
                            ${assignedVehicles.length ? `<div class="interactive-muted" style="margin-bottom:5px;">${assignedVehicles.map(v=>`${vehicleCategoryIcon(v.category)} ${escapeHtml(v.model)} · ${escapeHtml(v.plate || v.num || '—')}`).join('<br>')}</div>` : ''}
                            ${gameState.owned.length ? gameState.owned.map(v => {
                                const other = getVehicleRoute(v.id);
                                const checked = ids.some(id => String(id) === String(v.id));
                                const note = other && String(other.id) !== String(route.id) ? ` — сейчас №${other.number}` : '';
                                return `
                                    <label style="display:block;font-size:10px;padding:3px 0;">
                                        <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleVehicleOnRoute('${route.id}', '${v.id}', this.checked)">
                                        ${escapeHtml(v.model)}${note ? `<span class="interactive-muted">${escapeHtml(note)}</span>` : ''}
                                    </label>
                                `;
                            }).join('') : '<div class="interactive-muted">Сначала купи транспорт в магазине.</div>'}
                        </div>
                        <div class="route-assignment">
                            <span class="interactive-muted">Выбрано: ${assignedVehicles.length} ТС</span>
                            <button class="btn-secondary" onclick="deleteGameRoute('${route.id}')">Удалить маршрут</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function openRouteOnMap(routeId) {
            mapState.selectedRouteId = routeId;
            showGameSection('map', document.querySelector('.game-menu-btn[onclick*="map"]'));
            setTimeout(() => {
                selectRouteForMap(routeId);
                const route = gameState.routes.find(r => String(r.id) === String(routeId));
                if (route?.geometry && mapState.map) {
                    const layer = mapState.routeLayers.get(String(routeId));
                    if (layer) mapState.map.fitBounds(layer.getBounds(), { padding: [20, 20] });
                }
            }, 120);
        }

        const MINskMapCenter = [53.9023, 27.5619];
        let leafletLoadPromise = null;

        function ensureLeafletLoaded() {
            if (window.L) return Promise.resolve(window.L);
            if (leafletLoadPromise) return leafletLoadPromise;
            leafletLoadPromise = new Promise((resolve, reject) => {
                const css = document.createElement('link');
                css.rel = 'stylesheet';
                css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(css);
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.async = true;
                script.onload = () => resolve(window.L);
                script.onerror = () => { leafletLoadPromise = null; reject(new Error('Leaflet load failed')); };
                document.head.appendChild(script);
            });
            return leafletLoadPromise;
        }

        function mapSetStatus(text) {
            const el = document.getElementById('mapStatus');
            if (el) el.textContent = text;
        }

        async function initRouteMap() {
            if (mapState.initialized) {
                setTimeout(() => mapState.map.invalidateSize(), 80);
                return;
            }
            mapSetStatus('Загрузка карты…');
            try { await ensureLeafletLoaded(); }
            catch (e) { mapSetStatus('Не удалось загрузить карту. Проверь интернет-соединение.'); return; }
            if (mapState.initialized) return;

            mapState.map = L.map('routeMap', { zoomControl: true, scrollWheelZoom: false, preferCanvas: true, renderer: L.canvas({padding:0.25}) }).setView(MINskMapCenter, 11);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
                crossOrigin: true
            }).addTo(mapState.map);

            mapState.map.on('load', () => mapState.map.invalidateSize({pan:false}));

            mapState.map.on('click', onMapClick);
            mapState.map.on('moveend zoomend', () => {
                clearTimeout(mapState.stopRenderTimer);
                mapState.stopRenderTimer = setTimeout(() => {
                    if (mapState.mode !== 'vehicles') renderMapStops();
                }, 180);
            });
            mapState.initialized = true;

            // Автоматически чистим старые дубли, которые могли сохраниться до обновления версии.
            const storedStops = getMapStops();
            const normalizedStops = dedupeMapStops(storedStops);
            if (normalizedStops.length !== storedStops.length) saveMapStops(normalizedStops);
            renderMapStops();
            renderMapRouteLayers();
            renderMapRouteControls();
            initStopRegionSelect();

            setTimeout(() => mapState.map.invalidateSize({pan:false}), 100);
            startMapBusAnimation();
        }

        function setMapMode(mode) {
            mapState.mode = mode;
            document.querySelectorAll('.map-mode button').forEach(b => b.classList.remove('active'));
            const btn = document.getElementById(
                mode === 'select' ? 'mapModeSelect' :
                mode === 'add' ? 'mapModeAdd' :
                mode === 'route' ? 'mapModeRoute' : mode === 'control' ? 'mapModeControl' : 'mapModeVehicles'
            );
            if (btn) btn.classList.add('active');

            const note = document.getElementById('mapVehicleModeNote');
            if (note) note.classList.toggle('active', mode === 'vehicles');

            if (mode === 'route') {
                renderMapStops();
                renderMapDraftInfo();
                mapSetStatus('Режим сборки: нажимай остановки по порядку — каждая точка добавляется сразу.');
                return;
            }
            if (mode === 'control') { renderMapStops(); renderControlPoints(); mapSetStatus('Контрольные точки: кликай по карте в нужном порядке.'); return; }
            if (mode === 'vehicles') {
                mapState.stopMarkers.forEach(m => m.remove());
                mapState.stopMarkers.clear();
                mapState.routeLayers.forEach(l => l.remove());
                mapState.routeLayers.clear();
                updateMapBusMarkers(true);
                mapSetStatus('Режим местоположения ТС');
            } else {
                renderMapStops();
                renderMapRouteLayers();
                updateMapBusMarkers();
                mapSetStatus(
                    mode === 'select' ? 'Режим выбора остановок' :
                    mode === 'add' ? 'Кликни по карте, чтобы создать свою остановку' :
                    'Кликай по остановкам в нужном порядке'
                );
            }
        }

        function getMapStops() {
            let raw = [];
            try { raw = JSON.parse(localStorage.getItem(STOP_DATA_KEY) || '[]'); } catch(e) { raw = []; }
            return Array.isArray(raw) ? raw : [];
        }

        function saveMapStops(stops) {
            localStorage.setItem(STOP_DATA_KEY, JSON.stringify(stops));
        }

        function addMapStop(stop) {
            const stops = getMapStops();
            const existing = stops.find(s => String(s.id) === String(stop.id));
            if (!existing) {
                stops.push(stop);
                saveMapStops(stops);
            }
        }

        function onMapClick(e) {
            if (mapState.mode === 'control') {
                const cp = {id:'cp-'+Date.now()+'-'+Math.random().toString(36).slice(2,7), lat:e.latlng.lat, lon:e.latlng.lng, name:'Контрольная точка'};
                mapState.draftPath.push({kind:'control', point:cp});
                renderMapDraftInfo();
                mapSetStatus(`Добавлена контрольная точка №${mapState.draftPath.filter(x=>x.kind==='control').length}.`);
                renderControlPoints();
                return;
            }
            if (mapState.mode !== 'add') return;

            const name = prompt('Название новой остановки:', 'Новая остановка');
            if (!name) return;

            const stop = {
                id: 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
                name: name.trim(),
                lat: e.latlng.lat,
                lon: e.latlng.lng,
                source: 'custom',
                stopType: document.getElementById('mapCustomStopType')?.value || 'classic',
                dwellMinutes: Math.max(0, Math.min(15, Number(document.getElementById('mapCustomStopDwell')?.value || 2))),
                tags: { highway: 'bus_stop', stop_type: document.getElementById('mapCustomStopType')?.value || 'classic' }
            };

            addMapStop(stop);
            renderMapStops();

            if (mapState.mode === 'add') {
                mapState.mode = 'select';
                setMapMode('select');
            }
            mapSelectStop(stop.id);
        }

        function createStopIcon(color, text) {
            return L.divIcon({
                className: '',
                html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:bold;">${text}</div>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            });
        }

        function scheduleMapStopRender() {
            clearTimeout(mapState.stopRenderTimer);
            mapState.stopRenderTimer = setTimeout(renderMapStops, 80);
        }

        function getVisibleStopsForMap(stops) {
            if (!mapState.map) return [];
            const zoom = mapState.map.getZoom();
            const bounds = mapState.map.getBounds().pad(0.25);
            const visible = stops.filter(s => bounds.contains([Number(s.lat), Number(s.lon)]));

            // На малом масштабе не создаём тысячи DOM-маркеров: используем сетку-кластеры.
            if (zoom < 14) return visible;
            return visible.slice(0, 900);
        }

        function renderStopCluster(lat, lon, count) {
            return L.marker([lat, lon], {
                icon: L.divIcon({
                    className: 'map-stop-cluster',
                    html: `<div style="width:30px;height:30px;border-radius:50%;background:#1769aa;border:3px solid rgba(255,255,255,.9);box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;">${count}</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                }),
                interactive: false
            }).addTo(mapState.map);
        }

        function renderMapStops() {
            if (!mapState.map) return;
            if (mapState.mode === 'vehicles') {
                mapState.stopMarkers.forEach(m => m.remove());
                mapState.stopMarkers.clear();
                return;
            }
            mapState.stopMarkers.forEach(m => m.remove());
            mapState.stopMarkers.clear();

            const stops = getMapStops();
            const zoom = mapState.map.getZoom();
            const bounds = mapState.map.getBounds().pad(0.12);
            const visible = stops.filter(s => bounds.contains([Number(s.lat), Number(s.lon)]));

            // Экранная сетка: один круг = одна группа точек в ячейке.
            // Чем меньше масштаб, тем крупнее ячейка — поэтому кругов на карте значительно меньше.
            const clusterAtZoom = zoom < 16 && mapState.mode !== 'route';
            if (clusterAtZoom) {
                const cellPx = zoom <= 11 ? 150 : zoom <= 13 ? 130 : zoom <= 15 ? 105 : 90;
                const cells = new Map();
                visible.forEach(stop => {
                    const p = mapState.map.project([Number(stop.lat), Number(stop.lon)], zoom);
                    const key = `${Math.floor(p.x / cellPx)}:${Math.floor(p.y / cellPx)}`;
                    let c = cells.get(key);
                    if (!c) c = {x:0,y:0,count:0,ids:[],types:new Set()};
                    c.x += p.x; c.y += p.y; c.count++;
                    if (c.ids.length < 12) c.ids.push(stop.id);
                    c.types.add('stop');
                    cells.set(key,c);
                });
                cells.forEach((c,key) => {
                    const p = mapState.map.unproject([c.x/c.count,c.y/c.count], zoom);
                    const size = Math.min(50, 28 + Math.log2(Math.max(1,c.count))*5);
                    const icon = L.divIcon({className:'',html:`<div class="map-stop-cluster" style="width:${size}px;height:${size}px">${c.count}</div>`,iconSize:[size,size],iconAnchor:[size/2,size/2]});
                    const m = L.marker(p,{icon, keyboard:false, zIndexOffset:500}).addTo(mapState.map);
                    m.bindPopup(`<b>🚏 ${c.count} остановок</b><br><small>Приблизь карту, чтобы увидеть отдельные точки.</small>`);
                    m.on('click', (ev) => {
                        if (ev && ev.originalEvent) L.DomEvent.stopPropagation(ev.originalEvent);
                        const nextZoom = Math.min(mapState.map.getMaxZoom ? mapState.map.getMaxZoom() : 19, mapState.map.getZoom() + 2);
                        mapState.map.setView(p, nextZoom, {animate:true});
                    });
                    mapState.stopMarkers.set('cluster-'+key,m);
                });
                renderMapStopList();
                return;
            }

            // На очень большом масштабе показываем реальные точки, но только в видимой области.
            const limit = zoom >= 17 ? 1800 : 1100;
            const draw = visible.slice(0, limit);
            for (const stop of draw) {
                const color = stop.stopType === 'turnback' ? '#f39c12' : (stop.source === 'custom' ? '#8e44ad' : '#1769aa');
                const marker = L.circleMarker([stop.lat, stop.lon], {radius:11, weight:4, color:'#fff', fillColor:color, fillOpacity:.95, bubblingMouseEvents:false, className:'map-stop-hit'}).addTo(mapState.map);
                const stopKind = stop.stopType === 'turnback' ? '🔄 Пункт разворота · не конечная' : '🚏 Остановочный пункт';
                marker.bindPopup(`<b>${escapeHtml(stop.name)}</b><br>${stopKind}<br><small>${Number(stop.lat).toFixed(6)}, ${Number(stop.lon).toFixed(6)}</small><br><button class="map-select-stop-btn" onclick="mapSelectStop('${String(stop.id).replace(/'/g,"\'")}')">➕ Выбрать для маршрута</button>`);
                marker.on('click',()=>{
                    if(mapState.mode==='route') {
                        mapSelectStop(stop.id);
                    } else {
                        marker.openPopup();
                    }
                });
                mapState.stopMarkers.set(String(stop.id),marker);
            }
            if (visible.length > draw.length) mapSetStatus(`Показано ${draw.length} из ${visible.length} видимых остановок — приблизь карту.`);
            renderMapStopList();
        }

        function renderMapStopList() {
            const el = document.getElementById('mapStopList');
            if (!el) return;

            // Список остановок больше не фильтруется по названию: поле поиска убрано,
            // чтобы не создавать лишний DOM и не перегружать интерфейс на ТВ/ПК.
            const stops = getMapStops().slice(0, 150);

            el.innerHTML = stops.length ? stops.map((s, i) => `
                <div class="map-stop-item" onclick="focusMapStop('${String(s.id).replace(/'/g, "\\'")}')">
                    <span class="map-stop-num">${i + 1}</span>
                    <span>${escapeHtml(s.name)}${s.source === 'custom' ? (s.stopType === 'turnback' ? ' 🔄' : ' 📍') : ''}</span>
                </div>
            `).join('') : `<div class="map-help" style="padding:8px;">Остановки не найдены. Нажми «Загрузить остановки OSM» или создай свою.</div>`;
        }

        function focusMapStop(id) {
            const stop = getMapStops().find(s => String(s.id) === String(id));
            if (!stop || !mapState.map) return;
            mapState.map.setView([stop.lat, stop.lon], Math.max(mapState.map.getZoom(), 15));
            const marker = mapState.stopMarkers.get(String(id));
            if (marker) marker.openPopup();
        }

        function mapSelectStop(id) {
            const stop = getMapStops().find(s => String(s.id) === String(id));
            if (!stop) return;

            if (mapState.mode !== 'route') setMapMode('route');

            // ID OSM могут приходить как number или string. Сравниваем их одинаково,
            // иначе одна и та же остановка могла считаться уже выбранной или наоборот.
            const sid = String(stop.id);
            if (!mapState.draftStopIds.some(x => String(x) === sid)) {
                mapState.draftStopIds.push(stop.id);
                mapState.draftPath.push({kind:'stop', stopId:stop.id});
            }
            renderMapDraftInfo();
            mapSetStatus(`Добавлена остановка №${mapState.draftStopIds.length}: ${stop.name}`);
        }

        function removeDraftStop(index) {
            const ids=mapState.draftStopIds.slice(); const id=ids[index];
            mapState.draftStopIds.splice(index,1);
            const pos=mapState.draftPath.findIndex(x=>x.kind==='stop' && String(x.stopId)===String(id));
            if(pos>=0) mapState.draftPath.splice(pos,1);
            renderMapDraftInfo(); renderControlPoints();
        }
        function renderControlPoints(){
            const el=document.getElementById('mapControlPointList');
            const cps=mapState.draftPath.filter(x=>x.kind==='control');
            // Сначала убираем старые маркеры, чтобы на карте не оставались удалённые точки.
            if (mapState.controlMarkers) {
                mapState.controlMarkers.forEach(m=>{ try{m.remove();}catch(e){} });
                mapState.controlMarkers.clear();
            }
            if (mapState.map && window.L) {
                cps.forEach((x,i)=>{
                    const p=x.point;
                    const icon=L.divIcon({className:'control-point-icon',html:`<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#111;color:#fff;border:3px solid #fff;box-shadow:0 2px 7px rgba(0,0,0,.45);font-size:12px;font-weight:800;">${i+1}</span>`,iconSize:[28,28],iconAnchor:[14,14]});
                    const marker=L.marker([Number(p.lat),Number(p.lon)],{icon,zIndexOffset:900}).addTo(mapState.map);
                    marker.bindPopup(`<b>🎯 Контрольная точка №${i+1}</b><br>${Number(p.lat).toFixed(5)}, ${Number(p.lon).toFixed(5)}`);
                    mapState.controlMarkers.set(String(p.id),marker);
                });
            }
            if(!el)return;
            el.innerHTML=cps.length?cps.map((x,i)=>`<div class="map-stop-item" style="display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:center;"><span class="map-stop-num">${i+1}</span><span><b>🎯 Точка ${i+1}</b><br><small>${Number(x.point.lat).toFixed(5)}, ${Number(x.point.lon).toFixed(5)}</small></span><button type="button" class="btn-secondary" style="padding:4px 7px;font-size:11px;" onclick="removeControlPoint('${String(x.point.id).replaceAll("\'", "\\\'")}')">🗑️ Удалить</button></div>`).join(''):'<div class="map-help">Контрольных точек пока нет. На карте они отмечаются чёрными кружками с номерами.</div>';
        }
        function removeControlPoint(id){
            const before=mapState.draftPath.length;
            mapState.draftPath=mapState.draftPath.filter(x=>!(x.kind==='control' && String(x.point?.id)===String(id)));
            if(mapState.draftPath.length===before){ mapSetStatus('Контрольная точка не найдена'); return; }
            renderMapDraftInfo();
            renderControlPoints();
            mapSetStatus('Контрольная точка удалена. Остальные точки сохранены.');
        }
        function clearControlPoints(){
            mapState.draftPath=mapState.draftPath.filter(x=>x.kind!=='control');
            renderMapDraftInfo();
            renderControlPoints();
            mapSetStatus('Контрольные точки очищены');
        }

        function clearRouteDraft() {
            mapState.draftStopIds = [];
            mapState.draftPath = [];
            renderMapDraftInfo(); renderControlPoints();
            mapSetStatus('Точки маршрута очищены');
        }

        function renderMapDraftInfo() {
            const el = document.getElementById('mapDraftInfo');
            if (!el) return;
            const stops = getMapStops();
            const nodes = (mapState.draftPath && mapState.draftPath.length) ? mapState.draftPath : mapState.draftStopIds.map(id=>({kind:'stop',stopId:id}));
            const names = nodes.map((n,i)=>{ const s=n.kind==='control'?null:stops.find(x=>String(x.id)===String(n.stopId)); return `${i+1}. ${n.kind==='control' ? '🎯 Контрольная точка' : escapeHtml(s?.name||'Остановка')}`; });

            const mobileBar = document.getElementById('mobileDraftBar');
            if (mobileBar) {
                mobileBar.style.display = names.length ? 'block' : 'none';
                mobileBar.innerHTML = `<b>🛣️ Маршрут: ${names.length} остановок</b><div style="margin-top:4px;font-size:11px;line-height:1.35;">${names.map((n,i)=>`<span style="display:inline-block;margin:2px 3px 2px 0;padding:3px 6px;border-radius:10px;background:rgba(30,63,102,.12);">${i+1}. ${n}</span>`).join('')}</div>`;
            }
            el.innerHTML = `
                <b>Точек маршрута: ${names.length}</b>
                ${names.length ? `<div style="margin-top:5px;">${names.map((n, i) => `${n} <button class="btn-secondary" style="padding:1px 5px;font-size:9px;" onclick="removeDraftStop(${i})">×</button>`).join('<br>')}</div>` : ''}
            `;
        }

        function distanceMeters(aLat, aLon, bLat, bLon) {
            const R = 6371000;
            const p1 = Number(aLat) * Math.PI / 180, p2 = Number(bLat) * Math.PI / 180;
            const dp = (Number(bLat)-Number(aLat)) * Math.PI / 180;
            const dl = (Number(bLon)-Number(aLon)) * Math.PI / 180;
            const x = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
            return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
        }

        function normalizeStopName(name) {
            return String(name || '').toLowerCase().replace(/[«»"'`]/g,'').replace(/\s+/g,' ').trim();
        }
        function dedupeMapStops(stops) {
            const result = [];
            const exact = new Map();
            // Пространственный индекс: раньше поиск дубля смотрел только последние 120
            // элементов, поэтому при большой загрузке Минска одинаковые остановки могли
            // снова появляться по 2–3 раза.
            const grid = new Map();
            const CELL = 0.00012; // ~13 м по широте
            const cellKey = (lat, lon) => `${Math.floor(lat / CELL)}:${Math.floor(lon / CELL)}`;
            const mergeInto = (old, s) => {
                old.tags = Object.assign({}, old.tags || {}, s.tags || {});
                if (s.source === 'custom') old.source = 'custom';
                if ((!old.name || normalizeStopName(old.name) === 'остановка без названия') && s.name) old.name = s.name;
            };

            for (const raw of (stops || [])) {
                const s = Object.assign({}, raw);
                const lat = Number(s.lat), lon = Number(s.lon);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
                s.lat = lat; s.lon = lon;
                s.name = String(s.name || 'Остановка без названия').trim();

                const coordKey = `${lat.toFixed(5)}|${lon.toFixed(5)}`;
                if (exact.has(coordKey)) {
                    mergeInto(exact.get(coordKey), s);
                    continue;
                }

                const nm = normalizeStopName(s.name);
                const cx = Math.floor(lat / CELL), cy = Math.floor(lon / CELL);
                let duplicate = null;

                // Проверяем соседние ячейки, поэтому порядок ответа Overpass больше не влияет.
                for (let dx = -1; dx <= 1 && !duplicate; dx++) {
                    for (let dy = -1; dy <= 1 && !duplicate; dy++) {
                        const bucket = grid.get(`${cx + dx}:${cy + dy}`) || [];
                        for (const old of bucket) {
                            const dist = distanceMeters(lat, lon, old.lat, old.lon);
                            if (dist > 16) continue;
                            const oldNm = normalizeStopName(old.name);
                            const sameName = nm && oldNm && nm === oldNm;
                            const unnamed = !nm || !oldNm || oldNm === 'остановка без названия' || nm === 'остановка без названия';
                            // Одинаковая физическая точка или одинаковое имя очень близко — один объект.
                            if (dist <= 3 || (sameName && dist <= 6) || (dist <= 4 && unnamed)) {
                                duplicate = old;
                                break;
                            }
                        }
                    }
                }

                if (duplicate) {
                    mergeInto(duplicate, s);
                    exact.set(coordKey, duplicate);
                    continue;
                }

                exact.set(coordKey, s);
                result.push(s);
                const key = cellKey(lat, lon);
                if (!grid.has(key)) grid.set(key, []);
                grid.get(key).push(s);
            }
            return result;
        }

        function persistStopRegionCache() {
            localStorage.setItem(STOP_REGION_CACHE_KEY, JSON.stringify(stopRegionCache));
        }

        function initStopRegionSelect() {
            const select = document.getElementById('stopRegionSelect');
            if (!select) return;
            const current = select.value;
            const grouped = {};
            BELARUS_STOP_REGIONS.forEach(r => {
                if (!grouped[r.oblast]) grouped[r.oblast] = [];
                grouped[r.oblast].push(r);
            });
            const oblastOrder = ['Минск','Брестская область','Витебская область','Гомельская область','Гродненская область','Минская область','Могилёвская область','Россия — Смоленская область','Россия — Московская область','Россия — Москва','Россия — Санкт-Петербург'];
            select.innerHTML = '<option value="">— Выбери область или район —</option>' + oblastOrder.map(ob => {
                const list = grouped[ob] || [];
                return `<optgroup label="${escapeHtml(ob)}">${list.map(r => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.name)}${stopRegionCache[r.id] ? ' ✓' : ''}</option>`).join('')}</optgroup>`;
            }).join('');
            if (current && BELARUS_STOP_REGIONS.some(r => r.id === current)) select.value = current;
            showSelectedStopRegionInfo();
        }

        function getSelectedStopRegion() {
            const id = document.getElementById('stopRegionSelect')?.value;
            return BELARUS_STOP_REGIONS.find(r => r.id === id) || null;
        }

        function showSelectedStopRegionInfo() {
            const el = document.getElementById('stopRegionInfo');
            const region = getSelectedStopRegion();
            if (!el) return;
            if (!region) { el.textContent = 'Выбирай область или район. Загруженные регионы сохраняются в браузере, поэтому повторно скачивать их не нужно.'; return; }
            const count = Number(stopRegionCache[region.id]?.count || 0);
            const when = stopRegionCache[region.id]?.loadedAt ? new Date(stopRegionCache[region.id].loadedAt).toLocaleString('ru-RU') : '';
            el.textContent = count ? `✓ Загружено: ${count.toLocaleString('ru-RU')} остановок${when ? ' · '+when : ''}. Повторная загрузка не нужна.` : `${region.name}: остановки будут загружены одним запросом и сохранены локально.`;
        }

        function regionAreaQuery(region) {
            const areaParts = region.areaNames.map(name => `area["boundary"="administrative"]["name"="${name}"]; area["boundary"="administrative"]["name:ru"="${name}"];`).join('\n');
            return `[out:json][timeout:180];\n(\n${areaParts}\n)->.regionAreas;\n(\n  nwr["highway"="bus_stop"](area.regionAreas);\n  nwr["public_transport"="platform"](area.regionAreas);\n  nwr["public_transport"="stop_position"](area.regionAreas);\n);\nout center tags qt;`;
        }

        async function loadSelectedStopRegion(force = false) {
            const region = getSelectedStopRegion();
            if (!region) { alert('Сначала выбери область или район.'); return; }
            if (!force && stopRegionCache[region.id]?.count) {
                mapSetStatus(`${region.name}: уже загружен. Использую сохранённые данные.`);
                showSelectedStopRegionInfo();
                renderMapStops();
                return;
            }
            mapSetStatus(`Загружаю остановки: ${region.name}…`);
            const endpoints = ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
            let lastError = null;
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'text/plain;charset=UTF-8'}, body:regionAreaQuery(region)});
                    if (!response.ok) throw new Error('HTTP '+response.status);
                    const data = await response.json();
                    const existing = getMapStops();
                    const incoming = [];
                    for (const e of (data.elements || [])) {
                        const tags = e.tags || {};
                        if (tags.railway || tags.station === 'subway' || tags.subway === 'yes' || tags.public_transport === 'station' || tags.amenity === 'ferry_terminal') continue;
                        const lat = Number(e.lat ?? e.center?.lat), lon = Number(e.lon ?? e.center?.lon);
                        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
                        incoming.push({id:`osm-${e.type}-${e.id}`, name:tags.name || tags['name:ru'] || tags['name:be'] || 'Остановка без названия', lat, lon, source:'osm', regionId:region.id, regionName:region.name, tags});
                    }
                    const custom = existing.filter(s => s.source === 'custom');
                    // Уже загруженные регионы сохраняем; объекты нового региона заменяются свежими данными.
                    const kept = existing.filter(s => s.source !== 'osm' || s.regionId !== region.id);
                    const cleaned = dedupeMapStops(kept.concat(incoming));
                    saveMapStops(cleaned);
                    stopRegionCache[region.id] = {count:incoming.length, loadedAt:new Date().toISOString(), name:region.name};
                    persistStopRegionCache();
                    initStopRegionSelect();
                    renderMapStops();
                    mapSetStatus(`Готово: ${region.name} · ${incoming.length.toLocaleString('ru-RU')} объектов, сохранено ${cleaned.length.toLocaleString('ru-RU')} остановок.`);
                    return;
                } catch (err) {
                    console.warn('Overpass region endpoint failed', endpoint, err);
                    lastError = err;
                }
            }
            console.error(lastError);
            mapSetStatus(`Не удалось загрузить ${region.name}.`);
            alert(`Не удалось загрузить остановки региона «${region.name}». Сервер OSM может быть временно перегружен — повтори попытку позже.`);
        }

        function clearSelectedStopRegion() {
            const region = getSelectedStopRegion();
            if (!region) { alert('Сначала выбери область или район.'); return; }
            const current = getMapStops();
            const remaining = current.filter(s => !(s.source === 'osm' && s.regionId === region.id));
            saveMapStops(remaining);
            delete stopRegionCache[region.id];
            persistStopRegionCache();
            initStopRegionSelect();
            renderMapStops();
            mapSetStatus(`Остановки региона «${region.name}» удалены из локального кэша.`);
        }

        async function loadAllMinskStops() {
            // Старый вызов оставлен для совместимости: теперь Минск загружается через общий региональный механизм.
            const select = document.getElementById('stopRegionSelect');
            if (select) {
                select.value = 'by-minsk-city';
                await loadSelectedStopRegion();
            }
        }

        function clearAllMapStops() {
            const count = getMapStops().length;
            if (!count) { mapSetStatus('Остановок для удаления нет.'); return; }
            if (!confirm(`Удалить ВСЕ ${count} остановок с карты?\n\nЭто удалит и остановки OSM, и созданные вручную. Маршруты не удаляются автоматически.`)) return;
            localStorage.removeItem(STOP_DATA_KEY);
            localStorage.removeItem(STOP_REGION_CACHE_KEY);
            stopRegionCache = {};
            mapState.stopMarkers.forEach(m => m.remove());
            mapState.stopMarkers.clear();
            mapState.draftStopIds = [];
            mapState.osmStopsLoaded = false;
            renderMapStops();
            renderMapDraftInfo();
            renderMapStopList();
            mapSetStatus('Все остановки удалены. Теперь можно загрузить их заново.');
        }

        async function loadOsmStopsInView() {
            if (!mapState.map) return;

            const b = mapState.map.getBounds();
            const south = b.getSouth().toFixed(5);
            const west = b.getWest().toFixed(5);
            const north = b.getNorth().toFixed(5);
            const east = b.getEast().toFixed(5);

            mapSetStatus('Загружаю остановки OSM…');

            // Query only the current map view. This avoids bulk downloading the whole area.
            const query = `
[out:json][timeout:25];
(
  nwr["highway"="bus_stop"](${south},${west},${north},${east});
  nwr["public_transport"="platform"](${south},${west},${north},${east});
  nwr["public_transport"="stop_position"](${south},${west},${north},${east});
);
out body;
`;
            try {
                const response = await fetch('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                    body: query
                });
                if (!response.ok) throw new Error('HTTP ' + response.status);
                const data = await response.json();

                const stops = getMapStops();
                const byId = new Map(stops.map(s => [String(s.id), s]));

                data.elements.forEach(e => {
                    const tags = e.tags || {};
                    if (tags.railway || tags.station === 'subway' || tags.subway === 'yes' || tags.public_transport === 'station' || tags.amenity === 'ferry_terminal' || tags.route === 'tram') return;
                    const name = tags.name || tags['name:ru'] || tags['name:be'] || 'Остановка без названия';
                    byId.set('osm-' + e.id, {
                        id: 'osm-' + e.id,
                        name,
                        lat: e.lat,
                        lon: e.lon,
                        source: 'osm',
                        tags
                    });
                });

                saveMapStops(Array.from(byId.values()));
                renderMapStops();
                mapSetStatus(`Загружено/обновлено остановок: ${data.elements.length}`);
            } catch (err) {
                console.error(err);
                mapSetStatus('Не удалось загрузить OSM остановки. Попробуй ещё раз.');
                alert('OSM остановки не загрузились. Проверь интернет-соединение или повтори попытку позже.');
            }
        }

        function renderMapRouteControls() {
            const select = document.getElementById('mapRouteSelect');
            if (!select) return;

            const current = mapState.selectedRouteId;
            const visibleRoutes = gameState.routes.filter(r => (mapState.routeTypeFilter === 'all' || r.routeType === mapState.routeTypeFilter));
            if (current && !visibleRoutes.some(r => String(r.id)===String(current))) mapState.selectedRouteId = null;
            select.innerHTML = '<option value="">— Выбери маршрут —</option>' +
                visibleRoutes.map(r => `<option value="${r.id}" ${String(current) === String(r.id) ? 'selected' : ''}>№${escapeHtml(r.number)} — ${escapeHtml(r.name)}</option>`).join('');

            renderMapRouteList();
        }

        function selectRouteForMap(routeId) {
            mapState.selectedRouteId = routeId || null;
            mapState.creatingNewRoute = false;
            clearRouteDraft();
            if (routeId) {
                const route = gameState.routes.find(r => String(r.id) === String(routeId));
                if (route && Array.isArray(route.stopIds)) {
                    mapState.draftStopIds = route.stopIds.slice();
                    mapState.draftPath = Array.isArray(route.pathNodes) && route.pathNodes.length ? route.pathNodes.map(x=>x.kind==='control'?{kind:'control',point:x.point}:{kind:'stop',stopId:x.stopId}) : mapState.draftStopIds.map(id=>({kind:'stop',stopId:id}));
                    renderMapDraftInfo(); renderControlPoints();
                }
            }
            renderMapRouteLayers();
            renderMapRouteList();
        }

        function startNewMapRoute() {
            // Полностью отделяем создание нового маршрута от редактирования уже существующего.
            // Это позволяет сразу после №23 создать, например, обратное направление №23,
            // не наследуя остановки первого маршрута.
            mapState.selectedRouteId = null;
            mapState.creatingNewRoute = true;
            mapState.draftStopIds = [];
            mapState.draftPath = [];
            const num = document.getElementById('mapNewRouteNumber');
            const name = document.getElementById('mapNewRouteName');
            if (num) { num.value = ''; num.focus(); }
            if (name) name.value = '';
            const select = document.getElementById('mapRouteSelect');
            if (select) select.value = '';
            renderMapDraftInfo();
            renderMapRouteLayers();
            renderMapRouteList();
            if (mapState.mode !== 'route') setMapMode('route');
            else renderMapStops();
            mapSetStatus('Новый маршрут: выбери остановки по порядку. Старый маршрут не блокирует выбор.');
        }

        async function buildSelectedRoute() {
            const route = gameState.routes.find(r => String(r.id) === String(mapState.selectedRouteId));
            if (!route) {
                alert('Сначала выбери маршрут.');
                return;
            }

            const stops = getMapStops();
            const path = (mapState.draftPath && mapState.draftPath.length) ? mapState.draftPath : mapState.draftStopIds.map(id=>({kind:'stop',stopId:id}));
            const points = path.map(x=> x.kind==='control' ? ({id:x.point.id, name:x.point.name||'Контрольная точка', lat:x.point.lat, lon:x.point.lon, stopType:'control'}) : stops.find(s=>String(s.id)===String(x.stopId))).filter(Boolean);
            const routeStops = points.filter(p=>p.stopType!=='control');

            if (routeStops.length < 2) {
                alert('Для построения маршрута нужно минимум 2 остановки.');
                return;
            }

            mapSetStatus('Строю маршрут по дорожной сети…');

            const coordinates = points.map(s => `${s.lon},${s.lat}`).join(';');
            const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('HTTP ' + response.status);
                const data = await response.json();

                if (data.code !== 'Ok' || !data.routes?.length) {
                    throw new Error(data.message || data.code || 'Маршрут не найден');
                }

                const result = data.routes[0];
                route.geometry = result.geometry;
                route.outboundGeometry = null;
                route.returnGeometry = null;
                route.reverseStopIds = points.map(s => s.id).reverse();
                const classicStops = routeStops.filter(s => s.stopType !== 'turnback');
                const terminalStops = classicStops.length >= 2 ? classicStops : points;
                route.terminalStopIds = terminalStops.map(s => s.id);
                route.turnbackStopIds = points.filter(s => s.stopType === 'turnback').map(s => s.id);
                route.start = terminalStops[0].name;
                route.end = terminalStops[terminalStops.length - 1].name;
                route.stops = points.map(s => s.name);
                route.calculatedDistance = result.distance;

                // Если последняя выбранная точка — пункт разворота, он не является конечной.
                // Строим дополнительный путь от конечной до кольца и обратно к конечной,
                // чтобы ТС физически «заезжало на разворот» и возвращалось к конечной.
                const lastPoint = points[points.length - 1];
                const terminalPoint = terminalStops[terminalStops.length - 1];
                if (lastPoint?.stopType === 'turnback' && terminalPoint && String(lastPoint.id) !== String(terminalPoint.id)) {
                    try {
                        const loopUrl = `https://router.project-osrm.org/route/v1/driving/${terminalPoint.lon},${terminalPoint.lat};${lastPoint.lon},${lastPoint.lat};${terminalPoint.lon},${terminalPoint.lat}?overview=full&geometries=geojson&steps=false`;
                        const loopR = await fetch(loopUrl);
                        if (loopR.ok) {
                            const loopD = await loopR.json();
                            const loop = loopD.routes?.[0];
                            if (loop?.geometry?.coordinates?.length > 1) {
                                const base = route.geometry.coordinates || [];
                                const loopCoords = loop.geometry.coordinates;
                                route.geometry = {type:'LineString', coordinates: base.concat(loopCoords.slice(1))};
                                route.calculatedDistance = Number(result.distance) + Number(loop.distance || 0);
                                route.calculatedDuration = Number(result.duration) + Number(loop.duration || 0);
                            }
                        }
                    } catch(loopErr) { console.warn('Не удалось построить разворотное кольцо', loopErr); }
                }
                const depot = DEPOTS[route.routeType === 'trolleybus' ? 'trolleybus' : 'bus'];
                const first = points[0], last = points[points.length-1];
                try {
                    const outUrl = `https://router.project-osrm.org/route/v1/driving/${depot.lon},${depot.lat};${first.lon},${first.lat}?overview=full&geometries=geojson`;
                    const retUrl = `https://router.project-osrm.org/route/v1/driving/${last.lon},${last.lat};${depot.lon},${depot.lat}?overview=full&geometries=geojson`;
                    const [outR, retR] = await Promise.all([fetch(outUrl), fetch(retUrl)]);
                    if (outR.ok) { const od=await outR.json(); route.outboundGeometry=od.routes?.[0]?.geometry||null; route.outboundDuration=Number(od.routes?.[0]?.duration||0); }
                    if (retR.ok) { const rd=await retR.json(); route.returnGeometry=rd.routes?.[0]?.geometry||null; route.returnDuration=Number(rd.routes?.[0]?.duration||0); }
                } catch(e) { console.warn('Не удалось построить подъезд к парку',e); }
                route.routeType = route.routeType || 'bus';
                if (!route.calculatedDuration) route.calculatedDuration = result.duration;
                route.stopIds = routeStops.map(s => s.id);
                route.controlPoints = points.filter(s=>s.stopType==='control').map(s=>({id:s.id,name:s.name,lat:s.lat,lon:s.lon}));
                route.pathNodes = path.map(x=>x.kind==='control'?{kind:'control',point:x.point}:{kind:'stop',stopId:x.stopId});
                route.stopCount = points.length;
                route.start = terminalStops[0].name;
                route.end = terminalStops[terminalStops.length - 1].name;

                // Save immediately so a reload does not lose the calculated geometry.
                saveGameState();
                renderMapRouteLayers();
                renderMapRouteList();
                renderRoutes();

                mapSetStatus(`Готово: ${(result.distance / 1000).toFixed(2)} км · ${formatDuration(result.duration)}`);
            } catch (err) {
                console.error(err);
                mapSetStatus('Не удалось построить маршрут.');
                alert('Маршрут не построился. Проверь порядок остановок и попробуй снова.');
            }
        }

        function saveMapRouteGeometry() {
            const route = gameState.routes.find(r => String(r.id) === String(mapState.selectedRouteId));
            if (!route) {
                alert('Сначала выбери маршрут.');
                return;
            }
            saveGameState();
            renderMapRouteList();
            mapSetStatus('Маршрут сохранён.');
        }

        function formatDuration(seconds) {
            const min = Math.round(Number(seconds) / 60);
            const h = Math.floor(min / 60);
            const m = min % 60;
            return h ? `${h} ч ${m} мин` : `${m} мин`;
        }

        function routeColor(route) {
            return route.color || '#1e88e5';
        }

        function getAssignedVehiclesForRoute(route) {
            const ids = Array.isArray(route.vehicleIds)
                ? route.vehicleIds
                : (route.vehicleId ? [route.vehicleId] : []);
            return gameState.owned.filter(v => ids.some(id => String(id) === String(v.id)));
        }

        function vehicleCategoryIcon(category) {
            return category === 'trolleybus' ? '🚎' : category === 'electrobus' ? '⚡' : '🚌';
        }

        function createBusIcon(label, routeColorValue, category = 'bus') {
            const safeLabel = escapeHtml(label || 'ТС');
            const color = routeColorValue || '#e53935';
            const icon = category === 'trolleybus' ? '🚎' : category === 'electrobus' ? '⚡' : '🚌';
            return L.divIcon({
                className: 'map-bus-icon',
                html: `<div class="map-bus-marker" style="background:${color}"><span class="map-bus-label">${safeLabel}</span>${icon}</div>`,
                iconSize: [34, 24],
                iconAnchor: [17, 12],
                popupAnchor: [0, -15]
            });
        }

        const geometryMetricsCache = new WeakMap();
        function interpolateRoutePoint(geometry, progress) {
            const coords = geometry?.coordinates;
            if (!Array.isArray(coords) || coords.length < 2) return null;
            let metrics = geometryMetricsCache.get(geometry);
            if (!metrics) {
                const pts = coords.map(c => [Number(c[1]), Number(c[0])])
                    .filter(c => Number.isFinite(c[0]) && Number.isFinite(c[1]));
                if (pts.length < 2) return null;
                const distances = [0];
                let total = 0;
                for (let i = 1; i < pts.length; i++) {
                    const a = pts[i - 1], b = pts[i];
                    const dx = (b[1] - a[1]) * Math.cos(((a[0] + b[0]) / 2) * Math.PI / 180);
                    const dy = b[0] - a[0];
                    total += Math.sqrt(dx * dx + dy * dy);
                    distances.push(total);
                }
                metrics = {pts, distances, total};
                geometryMetricsCache.set(geometry, metrics);
            }
            if (!metrics.total) return metrics.pts[0];
            const target = Math.max(0, Math.min(1, progress)) * metrics.total;
            // Бинарный поиск вместо прохода по всем точкам на каждом кадре.
            let lo = 1, hi = metrics.distances.length - 1;
            while (lo < hi) {
                const mid = (lo + hi) >> 1;
                if (metrics.distances[mid] < target) lo = mid + 1; else hi = mid;
            }
            const idx = lo;
            const prev = metrics.distances[idx - 1];
            const span = metrics.distances[idx] - prev || 1;
            const t = (target - prev) / span;
            const a = metrics.pts[idx - 1], b = metrics.pts[Math.min(idx, metrics.pts.length - 1)];
            return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        }

        function depotForVehicle(vehicle) {
            return DEPOTS[vehicle?.category] || DEPOTS.bus;
        }
        function pathPointFromGeometry(geometry, progress) { return interpolateRoutePoint(geometry, progress); }
        function getCurrentMinutesOfDay() {
            const c = getGameClock();
            return c.hour * 60 + c.minute + c.second / 60;
        }


        function getGameTimeLabel() {
            const c = getGameClock();
            return `${String(c.hour).padStart(2,'0')}:${String(c.minute).padStart(2,'0')}:${String(c.second).padStart(2,'0')} (Беларусь)`;
        }

        function hashString(value) {
            let h = 2166136261;
            const text = String(value || '');
            for (let i=0;i<text.length;i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
            return h >>> 0;
        }
        function getVehiclePhaseOffset(vehicleId, routeId, cycleDuration) {
            const routeVehicles = gameState.owned.filter(v => String(getVehicleRoute(v.id)?.id || '') === String(routeId));
            const ids = routeVehicles.map(v => String(v.id)).sort();
            const idx = Math.max(0, ids.indexOf(String(vehicleId)));
            const count = Math.max(1, ids.length);
            const deterministic = (hashString(`${vehicleId}:${routeId}`) % 2000) / 2000;
            // Сначала равномерно разводим ТС на одном маршруте, затем добавляем небольшой стабильный сдвиг.
            return (cycleDuration * (idx / count) + cycleDuration * deterministic * 0.08) % cycleDuration;
        }

        function reverseGeometry(geometry) {
            if (!geometry?.coordinates?.length) return geometry;
            return {type:'LineString', coordinates:geometry.coordinates.slice().reverse()};
        }

        function timeToMinutes(value) {
            const [h,m] = String(value || '00:00').split(':').map(Number);
            return (Number(h)||0)*60 + (Number(m)||0);
        }
        function minutesToTime(total) {
            total = ((Math.round(total) % 1440) + 1440) % 1440;
            return String(Math.floor(total/60)).padStart(2,'0') + ':' + String(total%60).padStart(2,'0');
        }
        function addMinutesToTime(value, minutes) { return minutesToTime(timeToMinutes(value) + Number(minutes || 0)); }

        function getScheduleRoute(schedule) {
            return gameState.routes.find(r => String(r.id) === String(schedule?.routeId));
        }

        function getScheduleDurationMinutes(schedule) {
            const route = getScheduleRoute(schedule);
            return Math.max(1, Math.round(Number(route?.calculatedDuration || 900) / 60));
        }

        function getScheduleStartDateForDay(date, schedule) {
            const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            return d;
        }
        function getScheduleAbsoluteTimes(schedule, baseDate, route, vehicle) {
            const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
            const depotMin = timeToMinutes(schedule.depotTime || '05:00');
            const configuredStart = timeToMinutes(schedule.startTime || '05:30');
            let untilMin = timeToMinutes(schedule.workUntil || schedule.endTime || schedule.startTime || '22:00');
            if (untilMin < configuredStart) untilMin += 1440;
            const duration = getScheduleDurationMinutes(schedule);
            const turnaround = Math.max(0, Number(schedule.turnaroundMinutes ?? route?.turnaroundMinutes ?? 2));
            const firstArrival = configuredStart + duration;
            let lastArrival = firstArrival;
            for (let dep = configuredStart; dep + duration <= untilMin; dep += duration + turnaround) lastArrival = dep + duration;

            // Если включён автоматический конец смены, последнее прибытие — последний полный рейс,
            // который помещается до выбранного «Работать до». Если выключен — используется ручное время.
            if (schedule.autoFinish === false && schedule.lastArrivalTime) {
                let manual = timeToMinutes(schedule.lastArrivalTime);
                if (manual < configuredStart) manual += 1440;
                lastArrival = Math.max(firstArrival, manual);
            }

            const endId = schedule?.endStopId;
            const firstId = (route?.terminalStopIds || route?.stopIds || [])[0];
            const endIsFirst = endId && firstId && String(endId) === String(firstId);
            const returnSec = endIsFirst ? Number(route?.outboundDuration || 0) : Number(route?.returnDuration || 0);
            const returnMin = Math.max(lastArrival, untilMin) + Math.max(1, Math.round((returnSec || 900) / 60));
            let finalReturnMin = returnMin;
            if (schedule.autoFinish === false && schedule.returnTime) {
                let manualReturn = timeToMinutes(schedule.returnTime);
                if (manualReturn < configuredStart) manualReturn += 1440;
                finalReturnMin = Math.max(lastArrival, manualReturn);
            }
            return {
                depot: new Date(start.getTime() + depotMin*60000),
                start: new Date(start.getTime() + configuredStart*60000),
                workUntil: new Date(start.getTime() + untilMin*60000),
                lastArrival: new Date(start.getTime() + lastArrival*60000),
                return: new Date(start.getTime() + finalReturnMin*60000),
                duration, turnaround,
                untilMin, startMin: configuredStart, depotMin,
                autoFinish: schedule.autoFinish !== false
            };
        }
        function getGeneratedArrivalTimes(schedule, baseDate) {
            const route = getScheduleRoute(schedule);
            if (!route) return [];
            const abs = getScheduleAbsoluteTimes(schedule, baseDate, route, null);
            const out = [];
            for (let dep = abs.startMin; dep + abs.duration <= abs.untilMin; dep += abs.duration + abs.turnaround) {
                out.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0).getTime() + (dep + abs.duration)*60000);
                if (out.length > 200) break;
            }
            return out;
        }
        function getAffordableVehicleOptions() {
            const balance = Number(gameState.balance) || 0;
            const result = [];
            Object.entries(gameCatalog || {}).forEach(([category, models]) => {
                Object.entries(models || {}).forEach(([model, item]) => {
                    if (item && Number(item.price) <= balance) result.push({category, model, price:Number(item.price)});
                });
            });
            return result.sort((a,b)=>a.price-b.price || a.model.localeCompare(b.model,'ru'));
        }

        function renderAffordableVehicleNotice() {
            const el = document.getElementById('affordableVehicleNotice');
            if (!el) return;
            const options = getAffordableVehicleOptions();
            el.innerHTML = options.length
                ? `<b>🚍 Уже доступно для покупки:</b> ${options.slice(0,12).map(x=>`${vehicleCategoryIcon(x.category)} ${escapeHtml(x.model)} — ${money(x.price)}`).join(' · ')}${options.length>12?' · …':''}`
                : '<span class="interactive-muted">Пока не хватает средств ни на одно новое ТС.</span>';
        }

        function saveEmailNotificationSettings() {
            const email = String(document.getElementById('notifyEmail')?.value || '').trim();
            const enabled = !!document.getElementById('notifyEmailEnabled')?.checked;
            if (enabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('Укажи корректный email.');
            gameState.emailNotifications = gameState.emailNotifications || {enabled:false,email:'',notifiedVehicleIds:[],lastCheckAt:null};
            gameState.emailNotifications.enabled = enabled;
            gameState.emailNotifications.email = email;
            gameState.emailNotifications.notifiedVehicleIds = [];
            saveGameState();
            alert(enabled ? 'Уведомления сохранены. Когда появится возможность купить новое ТС, сайт подготовит письмо.' : 'Email-уведомления отключены.');
        }

        function prepareAffordableVehicleEmail() {
            const email = String(gameState.emailNotifications?.email || '').trim();
            const options = getAffordableVehicleOptions();
            if (!email) return alert('Сначала укажи email в разделе «Финансы».');
            if (!options.length) return alert('Пока денег не хватает ни на одно новое ТС.');
            const subject = encodeURIComponent('BUSPHOTO — доступна покупка нового ТС');
            const body = encodeURIComponent(`На балансе ${money(gameState.balance)}.\n\nСейчас доступны для покупки:\n${options.map(x=>`• ${x.model} — ${money(x.price)}`).join('\n')}\n\nBUSPHOTO Interactive`);
            window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
        }

        function checkAffordableVehicleNotifications() {
            renderAffordableVehicleNotice();
            const cfg = gameState.emailNotifications;
            if (!cfg?.enabled || !cfg.email) return;
            const options = getAffordableVehicleOptions();
            if (!options.length) return;
            const ids = options.map(x=>`${x.category}:${x.model}`).filter(id=>!cfg.notifiedVehicleIds.includes(id));
            if (!ids.length) return;
            cfg.notifiedVehicleIds.push(...ids);
            cfg.lastCheckAt = new Date().toISOString();
            saveGameState();
            // GitHub Pages не может безопасно отправлять почту без внешнего почтового сервиса.
            // Поэтому при доступности покупки автоматически создаём письмо через почтовый клиент.
            const subject = encodeURIComponent('BUSPHOTO — доступна покупка нового ТС');
            const body = encodeURIComponent(`На балансе ${money(gameState.balance)}.\n\nМожно купить:\n${options.map(x=>`• ${x.model} — ${money(x.price)}`).join('\n')}\n\nBUSPHOTO Interactive`);
            try { window.location.href = `mailto:${encodeURIComponent(cfg.email)}?subject=${subject}&body=${body}`; } catch(e) { console.warn('Не удалось открыть почтовый клиент', e); }
        }

        function getContinuousRoutePair(route) {
            const paired = findReverseRoute(route);
            return {
                outbound: route,
                inbound: paired || route,
                outboundGeometry: route?.geometry || null,
                inboundGeometry: paired?.geometry || reverseGeometry(route?.geometry),
                outboundDuration: Math.max(1, Number(route?.calculatedDuration || 900)),
                inboundDuration: Math.max(1, Number(paired?.calculatedDuration || route?.calculatedDuration || 900))
            };
        }

        function getContinuousRoutePoint(vehicle, route, now = new Date()) {
            if (!route?.geometry) return {point:null, phase:'в парке'};
            const pair = getContinuousRoutePair(route);
            const d1 = pair.outboundDuration;
            const d2 = pair.inboundDuration;
            const turn = Math.max(0, Number(route.turnaroundMinutes ?? 2)) * 60;
            const turn2 = Math.max(0, Number(pair.inbound?.turnaroundMinutes ?? route.turnaroundMinutes ?? 2)) * 60;
            const cycle = d1 + turn + d2 + turn2;
            if (!Number.isFinite(cycle) || cycle <= 0) return {point:pathPointFromGeometry(route.geometry,0),phase:`на маршруте №${route.number}`};

            const ids = gameState.owned.filter(v => String(getVehicleRoute(v.id)?.id || '') === String(route.id)).map(v => String(v.id)).sort();
            const idx = Math.max(0, ids.indexOf(String(vehicle.id)));
            const count = Math.max(1, ids.length);
            const offset = cycle * (idx / count);
            const elapsed = ((Date.now() - 0) / 1000 + offset) % cycle;
            if (elapsed < d1) {
                return {point:pathPointFromGeometry(pair.outboundGeometry, elapsed/d1),phase:`на маршруте №${pair.outbound.number} →` , activeRoute:pair.outbound};
            }
            if (elapsed < d1 + turn) {
                return {point:pathPointFromGeometry(pair.outboundGeometry,1),phase:`стоянка на конечной №${pair.outbound.number}`,activeRoute:pair.outbound};
            }
            const backElapsed = elapsed - d1 - turn;
            if (backElapsed < d2) {
                return {point:pathPointFromGeometry(pair.inboundGeometry, backElapsed/d2),phase:`на маршруте №${pair.inbound.number} ←`,activeRoute:pair.inbound};
            }
            return {point:pathPointFromGeometry(pair.inboundGeometry,1),phase:`стоянка на конечной №${pair.inbound.number}`,activeRoute:pair.inbound};
        }

        function processServiceCardPayouts(now = new Date()) {
            let total=0, changed=false;
            const cards=Array.isArray(gameState.serviceCards)?gameState.serviceCards:[];
            const maxLookback=1000*60*60*24*31;
            cards.forEach(card=>{
                if(!card || card.active===false) return;
                const vehicle=gameState.owned.find(v=>String(v.id)===String(card.vehicleId));
                if(!vehicle) return;
                const schedules=Array.isArray(card.schedules)?card.schedules:[];
                let cursor=Number(card.lastPayoutAt||card.createdAt?new Date(card.lastPayoutAt||card.createdAt).getTime():now.getTime());
                if(!Number.isFinite(cursor)) cursor=now.getTime();
                // При первом запуске новой карточки не начисляем прошлые рейсы.
                if(!card.lastPayoutAt) { card.lastPayoutAt=now.getTime(); return; }
                const from=Math.max(cursor,now.getTime()-maxLookback);
                const arrivals=[];
                const firstDay=new Date(from); firstDay.setHours(0,0,0,0);
                for(let d=0; d<=31; d++){
                    const base=new Date(firstDay); base.setDate(firstDay.getDate()+d);
                    if(base.getTime()>now.getTime()) break;
                    schedules.forEach((s,idx)=>{
                        if(!Array.isArray(s.days)||!s.days.includes(base.getDay())) return;
                        const route=getScheduleRoute(s); if(!route) return;
                        getGeneratedArrivalTimes(s,base).forEach((ts,j)=>{
                            if(ts>from && ts<=now.getTime()) arrivals.push({ts,route,s,idx,j});
                        });
                    });
                }
                arrivals.sort((a,b)=>a.ts-b.ts);
                if(arrivals.length){
                    arrivals.forEach(a=>{
                        // Ремонт: ТС не выполняет рейсы и не получает выплаты до окончания ремонта.
                        const repairUntil = Number(vehicle.repairUntil || 0);
                        if (repairUntil > a.ts) return;
                        if (repairUntil && repairUntil <= a.ts) {
                            vehicle.repairUntil = 0;
                            vehicle.repairStartedAt = 0;
                            vehicle.repairCost = 0;
                            vehicle.repairDurationMs = 0;
                            vehicle.health = 100;
                            vehicle.maintenanceDue = false;
                        }
                        total+=100;
                        // v43: статистика и состояние ТС обновляются при каждом прибытии.
                        vehicle.stats = vehicle.stats || {trips:0, arrivals:0, distanceKm:0, workMinutes:0, earned:0};
                        vehicle.stats.trips = Number(vehicle.stats.trips||0) + 1;
                        vehicle.stats.arrivals = Number(vehicle.stats.arrivals||0) + 1;
                        vehicle.stats.distanceKm = Number(vehicle.stats.distanceKm||0) + Number(a.route.calculatedDistance||0)/1000;
                        vehicle.stats.earned = Number(vehicle.stats.earned||0) + 100;
                        vehicle.health = Math.max(0, Number(vehicle.health ?? 100) - 0.10);
                        if (vehicle.health <= 20 && !vehicle.maintenanceDue) vehicle.maintenanceDue = true;
                        const t=new Date(a.ts).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
                        const detail=`🕐 ${t} · ТС ${vehicle.model||'—'} · маршрут №${a.route.number||'—'} · прибытие на конечную · +100 р.`;
                        gameState.log=gameState.log||[];
                        gameState.log.unshift({date:localDateKey(new Date(a.ts)),time:t,type:'route-arrival',routeNumber:a.route.number||'—',arrivalTime:t,vehicleModel:vehicle.model||'—',total:100,details:[detail]});
                    });
                    changed=true;
                }
                card.lastPayoutAt=now.getTime();
                card.lastSimulationAt=now.toISOString();
            });
            if(changed){
                gameState.balance+=total;
                gameState.log=(gameState.log||[]).slice(0,200);
                saveGameState();
                renderInteractiveHeaderAndLightViews();
                checkAffordableVehicleNotifications();
            } else if(cards.some(c=>c&&c.lastPayoutAt)){ saveGameState(); }
            return total;
        }

        function updateMapBusMarkers(forceVehicleMode = false) {
            if (!mapState.map) return;
            processServiceCardPayouts(new Date());
            const activeKeys=new Set();
            gameState.owned.forEach(vehicle=>{
                const cards=getVehicleServiceCards(vehicle.id);
                const card=cards.length?cards[cards.length-1]:null;
                const directRoute=getVehicleRoute(vehicle.id);
                const activeCardInfo=card ? getActiveServiceRouteAndSchedule(vehicle.id,new Date()) : null;
                const route=(activeCardInfo?.route || directRoute);
                if(!route || !route.geometry) return;
                if(mapState.mode==='vehicles' && mapState.routeTypeFilter!=='all' && route.routeType!==mapState.routeTypeFilter) return;
                const sim=cards.length ? getCardDrivenPoint(vehicle,cards,new Date()) : getContinuousRoutePoint(vehicle,route,new Date());
                if(!sim.point) return;
                const activeRoute=sim.activeRoute||route;
                const key=`vehicle:${vehicle.id}`; activeKeys.add(key);
                const marker=mapState.busMarkers.get(key)||L.marker(sim.point,{icon:createBusIcon(`№${activeRoute.number}`,routeColor(activeRoute),vehicle.category),zIndexOffset:1000}).addTo(mapState.map);
                marker.setLatLng(sim.point);
                if(mapState.trackingVehicleId && String(mapState.trackingVehicleId)===String(vehicle.id) && mapState.map && Date.now()-mapState.lastTrackPanAt>350){
                    mapState.map.panTo(sim.point,{animate:false}); mapState.lastTrackPanAt=Date.now(); mapState._lastTrackPoint=sim.point;
                }
                const popupHtml=`<b>${escapeHtml(vehicle.model)}</b><br>Госномер: <b>${escapeHtml(vehicle.plate||vehicle.num||'—')}</b><br>Маршрут: <b>№${escapeHtml(activeRoute.number)}</b><br><span style="font-weight:bold;">● ${escapeHtml(sim.phase)}</span>`;
                if(marker._popupHtml!==popupHtml){marker.setPopupContent(popupHtml);marker._popupHtml=popupHtml;}
                mapState.busMarkers.set(key,marker);
            });
            mapState.busMarkers.forEach((marker,key)=>{if(!activeKeys.has(key)){marker.remove();mapState.busMarkers.delete(key);}});
            renderMapTrackerSelect();
            const tracked=mapState.trackingVehicleId ? gameState.owned.find(v=>String(v.id)===String(mapState.trackingVehicleId)) : null;
            if(tracked){
                const sim=getVehicleSimulationPoint(tracked); const status=document.getElementById('mapTrackerStatus');
                if(status && sim.route) status.textContent=`${vehicleCategoryIcon(tracked.category)} ${tracked.model} · №${tracked.plate||tracked.num||'—'} · маршрут №${sim.route.number} · ${sim.phase}`;
            }
            if(!forceVehicleMode) renderMapBusList();
        }

        function renderMapBusList() {
            const el = document.getElementById('mapBusList');
            if (!el) return;
            const rows = [];
            gameState.routes.forEach(route => {
                const vehicles = getAssignedVehiclesForRoute(route);
                vehicles.forEach(vehicle => {
                    rows.push(`${route.id}|${vehicle.id}|${vehicle.model}|${vehicle.num || ''}|${route.number}|${route.start || '—'} → ${route.end || '—'}|${vehicle.category}`);
                });
            });
            (gameState.serviceCards || []).filter(c=>c.active!==false).forEach(card=>{
                const vehicle=gameState.owned.find(v=>String(v.id)===String(card.vehicleId));
                const active=getActiveServiceRouteAndSchedule(card.vehicleId,new Date());
                if(vehicle && active.route && !rows.some(x=>x.split('|')[1]===String(vehicle.id))){
                    rows.push(`card|${vehicle.id}|${vehicle.model}|${vehicle.num || ''}|${active.route.number}|${active.route.start || '—'} → ${active.route.end || '—'}|${vehicle.category}`);
                }
            });
            const signature = rows.join('\\n');
            if (signature === mapState.busListSignature) return;
            mapState.busListSignature = signature;
            el.innerHTML = rows.length ? rows.map(row => {
                const [routeId, vehicleId, model, num, number, name, category] = row.split('|');
                return `<div class="map-route-item" onclick="focusMapBus('${routeId}','${vehicleId}')">
                    <div><b>${vehicleCategoryIcon(category)} ${escapeHtml(model)}</b> · борт. ${escapeHtml(num || '—')}</div>
                    <div class="map-help">Маршрут №${escapeHtml(number)} · ${escapeHtml(name)} · <span style="color:#28a745">● на линии</span></div>
                </div>`;
            }).join('') : '<div class="map-bus-panel-empty">Пока нет ТС на линии. Назначь транспорт на маршрут в разделе «Маршруты».</div>';
        }

        function focusMapBus(routeId, vehicleId) {
            const marker = mapState.busMarkers.get(`vehicle:${vehicleId}`);
            if (!marker || !mapState.map) return;
            mapState.map.setView(marker.getLatLng(), Math.max(mapState.map.getZoom(), 14));
            marker.openPopup();
        }

        function startMapBusAnimation() {
            if (mapState.busAnimationFrame) return;
            const loop = () => {
                const section = document.getElementById('game-section-map');
                if (!section || !section.classList.contains('active') || document.hidden) {
                    mapState.busAnimationFrame = null;
                    return;
                }
                // 8–10 обновлений/с достаточно для игровой карты и в разы дешевле
                // постоянного пересчёта всех маркеров на каждом кадре 60 FPS.
                updateMapBusMarkers(true);
                mapState.busAnimationFrame = setTimeout(loop, 120);
            };
            mapState.busAnimationFrame = setTimeout(loop, 0);
        }
        function stopMapBusAnimation() {
            if (mapState.busAnimationFrame) clearTimeout(mapState.busAnimationFrame);
            mapState.busAnimationFrame = null;
        }

        function renderMapRouteLayers() {
            if (!mapState.map) return;
            if (mapState.mode === 'vehicles') {
                mapState.routeLayers.forEach(layer => layer.remove());
                mapState.routeLayers.clear();
                return;
            }

            mapState.routeLayers.forEach(layer => layer.remove());
            mapState.routeLayers.clear();

            gameState.routes.forEach(route => {
                if (!route.geometry) return;
                if (mapState.routeTypeFilter !== 'all' && route.routeType !== mapState.routeTypeFilter) return;
                const layer = L.geoJSON(route.geometry, {
                    style: {
                        color: routeColor(route),
                        weight: String(route.id) === String(mapState.selectedRouteId) ? 7 : 4,
                        opacity: String(route.id) === String(mapState.selectedRouteId) ? 0.95 : 0.55,
                        renderer: L.canvas({ padding: 0.2 })
                    }
                }).addTo(mapState.map);

                layer.bindPopup(`<b>№${escapeHtml(route.number)} · ${escapeHtml(route.start || "—")} → ${escapeHtml(route.end || "—")}</b><br>${route.calculatedDistance ? (route.calculatedDistance / 1000).toFixed(2) + ' км' : 'Расстояние не рассчитано'}`);
                mapState.routeLayers.set(String(route.id), layer);
            });
            updateMapBusMarkers();
        }

        function renderMapRouteList() {
            const el = document.getElementById('mapRouteList');
            if (!el) return;

            const visibleRoutes = gameState.routes.filter(r => (mapState.routeTypeFilter === 'all' || r.routeType === mapState.routeTypeFilter));
            el.innerHTML = visibleRoutes.length ? visibleRoutes.map(route => `
                <div class="map-route-item" onclick="selectRouteForMap('${route.id}')">
                    <div>
                        <span class="map-route-line" style="background:${routeColor(route)}"></span>
                        <b>№${escapeHtml(route.number)}</b> — ${escapeHtml(route.start || "—")} → ${escapeHtml(route.end || "—")} <span class="route-type-badge">${routeTypeLabel(route.routeType)}</span>
                    </div>
                    <div class="map-help">
                        ${routeTypeLabel(route.routeType)}
                        · ${escapeHtml(route.start || '—')} → ${escapeHtml(route.end || '—')}
                        · ${(Array.isArray(route.vehicleIds) ? route.vehicleIds.length : (route.vehicleId ? 1 : 0))} ТС
                    </div>
                </div>
            `).join('') : '<div class="map-help">Маршрутов пока нет. Создай первый маршрут на карте.</div>';
        }


        async function initTrackerMap() {
            if (trackerState.initialized) {
                setTimeout(() => trackerState.map.invalidateSize({pan:false}), 80);
                renderTrackerVehicleSelect();
                updateTrackerMap(true);
                return;
            }
            try { await ensureLeafletLoaded(); } catch(e) {
                const status = document.getElementById('trackerStatus'); if (status) status.textContent = 'Не удалось загрузить карту.';
                return;
            }
            trackerState.map = L.map('trackerMap', {zoomControl:true, scrollWheelZoom:false, preferCanvas:true, renderer:L.canvas({padding:0.25})}).setView(MINskMapCenter, 11);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors', crossOrigin:true}).addTo(trackerState.map);
            trackerState.initialized = true;
            renderTrackerVehicleSelect();
            updateTrackerMap(true);
            setTimeout(() => trackerState.map.invalidateSize({pan:false}), 100);
            startTrackerAnimation();
        }

        function renderTrackerVehicleSelect() {
            const select = document.getElementById('trackerVehicleSelect');
            if (!select) return;
            const prev = trackerState.vehicleId || mapState.trackingVehicleId || '';
            const activeVehicles = gameState.owned.filter(v => getVehicleServiceCards(v.id).length || getVehicleRoute(v.id));
            select.innerHTML = '<option value="">— Выбери ТС на линии —</option>' + activeVehicles.map(v => {
                const route = getActiveServiceRouteAndSchedule(v.id,new Date()).route || getVehicleRoute(v.id);
                return `<option value="${escapeHtml(v.id)}">${vehicleCategoryIcon(v.category)} ${escapeHtml(v.model)} · ${escapeHtml(v.plate || v.num || 'без номера')} · №${escapeHtml(route?.number || '—')}</option>`;
            }).join('');
            if (prev && activeVehicles.some(v => String(v.id) === String(prev))) select.value = prev;
            else if (!select.value) trackerState.vehicleId = null;
        }

        function selectTrackedVehicle(vehicleId) {
            trackerState.vehicleId = vehicleId || null;
            mapState.trackingVehicleId = trackerState.vehicleId;
            trackerState.lastPoint = null;
            const vehicle = gameState.owned.find(v => String(v.id) === String(vehicleId));
            const status = document.getElementById('trackerStatus');
            if (!vehicle) { if (status) status.textContent = 'Выбери ТС на линии.'; updateTrackerMap(true); return; }
            const route = getActiveServiceRouteAndSchedule(vehicle.id,new Date()).route || getVehicleRoute(vehicle.id);
            if (status) status.textContent = route ? `${vehicleCategoryIcon(vehicle.category)} ${vehicle.model} · маршрут №${route.number}. Камера следует за ТС.` : `${vehicle.model}: ТС сейчас в парке.`;
            updateTrackerMap(true);
        }

        function stopTrackingVehicle() {
            trackerState.vehicleId = null;
            mapState.trackingVehicleId = null;
            trackerState.lastPoint = null;
            const select = document.getElementById('trackerVehicleSelect'); if (select) select.value = '';
            const status = document.getElementById('trackerStatus'); if (status) status.textContent = 'Слежение снято.';
        }

        function centerTrackedVehicle() {
            if (!trackerState.map || !trackerState.vehicleId) return;
            updateTrackerMap(true);
        }

        
        // На карте один маршрут может быть сохранён двумя отдельными направлениями
        // (например, №23: Малиновка-4 → Городской Вал и №23: Городской Вал → Малиновка-4).
        // Карточка должна использовать геометрию второго направления, а не просто
        // разворачивать первую линию назад. Поэтому ищем связанную обратную запись.
        function findReverseRoute(route) {
            if (!route) return null;
            // Главный источник обратного направления — явная привязка маршрутов.
            // Номер может отличаться: например №562 → №270S → №562.
            if (route.pairedRouteId) {
                const paired = gameState.routes.find(r =>
                    String(r.id) === String(route.pairedRouteId) &&
                    r.routeType === route.routeType &&
                    r.geometry
                );
                if (paired) return paired;
            }
            const same = gameState.routes.filter(r =>
                String(r.id) !== String(route.id) &&
                r.routeType === route.routeType &&
                r.geometry &&
                String(r.start || '').trim() === String(route.end || '').trim() &&
                String(r.end || '').trim() === String(route.start || '').trim()
            );
            if (!same.length) return null;
            return same.sort((a,b) => {
                const pairedScoreA = a.pairedRouteId && String(a.pairedRouteId) === String(route.id) ? 0 : 1;
                const pairedScoreB = b.pairedRouteId && String(b.pairedRouteId) === String(route.id) ? 0 : 1;
                if (pairedScoreA !== pairedScoreB) return pairedScoreA - pairedScoreB;
                const da = Math.abs(Number(a.calculatedDistance || 0) - Number(route.calculatedDistance || 0));
                const db = Math.abs(Number(b.calculatedDistance || 0) - Number(route.calculatedDistance || 0));
                return da - db;
            })[0];
        }

        function getScheduleDirectionalRoutes(route, startStopId) {
            if (!route) return {outbound: null, returnRoute: null, reverse: null};
            const terminals = route.terminalStopIds || route.stopIds || [];
            const firstId = terminals[0];
            const startsForward = !startStopId || String(startStopId) === String(firstId);
            const reverse = findReverseRoute(route);

            // Если есть отдельный маршрут обратного направления — используем его.
            // Если его нет, сохраняем старое поведение с разворотом геометрии.
            if (startsForward) {
                return {
                    outbound: route,
                    returnRoute: reverse || route,
                    reverse,
                    outboundGeometry: route.geometry,
                    returnGeometry: reverse?.geometry || reverseGeometry(route.geometry)
                };
            }
            return {
                outbound: reverse || route,
                returnRoute: route,
                reverse,
                outboundGeometry: reverse?.geometry || reverseGeometry(route.geometry),
                returnGeometry: route.geometry
            };
        }

        function endIdPoint(route, stopId) {
            if (!route || !stopId) return null;
            const stops = Array.isArray(route.stops) ? route.stops : [];
            const hit = stops.find(st => String(st.id ?? st.stopId) === String(stopId));
            if (!hit) return null;
            const lat = Number(hit.lat ?? hit.latitude), lon = Number(hit.lon ?? hit.lng ?? hit.longitude);
            return Number.isFinite(lat) && Number.isFinite(lon) ? [lat,lon] : null;
        }

        function getScheduleVehiclePoint(schedule, route, vehicle, now = new Date()) {
            const depot = depotForVehicle(vehicle);
            const day = now.getDay();
            const candidates = [];
            for (let offset=0; offset<=1; offset++) {
                const base = new Date(now.getFullYear(), now.getMonth(), now.getDate()-offset);
                if (!Array.isArray(schedule.days) || !schedule.days.includes(base.getDay())) continue;
                const abs = getScheduleAbsoluteTimes(schedule, base, route, vehicle);
                candidates.push({base,abs});
            }
            const currentMs = now.getTime();
            const chosen = candidates.find(x => currentMs >= x.abs.depot.getTime() && currentMs <= x.abs.return.getTime());
            if (!chosen) return {route,point:null,phase:'в парке — по расписанию сейчас нет выезда'};
            const abs = chosen.abs;
            const startMs = abs.start.getTime();
            const workUntilMs = abs.workUntil.getTime();
            const lastArrivalMs = abs.lastArrival.getTime();
            const returnMs = abs.return.getTime();
            const direction = getScheduleDirectionalRoutes(route, schedule.startStopId);
            const forwardFirst = !schedule.startStopId || String(schedule.startStopId) === String((route.terminalStopIds || route.stopIds || [])[0]);
            const forwardGeometry = direction.outboundGeometry || (forwardFirst ? route.geometry : reverseGeometry(route.geometry));
            const reverseRouteGeometry = direction.returnGeometry || (forwardFirst ? reverseGeometry(route.geometry) : route.geometry);
            const outboundGeometry = direction.outboundGeometry;
            const returnGeometry = direction.returnGeometry;
            if (currentMs < startMs) {
                const progress = Math.max(0, Math.min(1, (currentMs-abs.depot.getTime()) / Math.max(1,startMs-abs.depot.getTime())));
                return {route,point:outboundGeometry?pathPointFromGeometry(outboundGeometry,progress):[depot.lat,depot.lon],phase:`выезд из парка → ${schedule.startStopName || route.start}`};
            }
            if (currentMs <= lastArrivalMs) {
                const elapsedMin = (currentMs-startMs)/60000;
                const cycle = Math.max(1, abs.duration + abs.turnaround);
                let leg = Math.floor(elapsedMin/cycle);
                let inLeg = elapsedMin - leg*cycle;
                if (inLeg > abs.duration) {
                    const atEndForward = (leg % 2 === 0) === forwardFirst;
                    const terminalPoint = atEndForward ? pathPointFromGeometry(forwardGeometry,1) : pathPointFromGeometry(reverseRouteGeometry,1);
                    return {route,point:terminalPoint,phase:`стоянка на конечной · №${route.number}`};
                }
                const progress = Math.max(0, Math.min(1, inLeg/Math.max(1,abs.duration)));
                const isForward = (leg % 2 === 0) === forwardFirst;
                const paired = findReverseRoute(route);
                const activeRoute = isForward ? route : (paired || route);
                const activeGeometry = isForward ? forwardGeometry : (paired?.geometry || reverseRouteGeometry);
                return {
                    route: activeRoute,
                    point: activeGeometry ? pathPointFromGeometry(activeGeometry, progress) : [depot.lat,depot.lon],
                    phase: `на маршруте №${activeRoute.number} ${isForward?'→':'←'}`
                };
            }
            if (currentMs <= returnMs) {
                // После последнего прибытия ТС физически едет в парк. Здесь не разворачиваем
                // пассажирскую геометрию: путь «конечная → парк» — отдельный служебный участок.
                const progress = Math.max(0, Math.min(1,(currentMs-lastArrivalMs)/Math.max(1,returnMs-lastArrivalMs)));
                const terminalPoint = endIdPoint(route, schedule.endStopId) || (returnGeometry ? pathPointFromGeometry(returnGeometry,1) : [depot.lat,depot.lon]);
                const parkPoint = [depot.lat,depot.lon];
                const point = [
                    terminalPoint[0] + (parkPoint[0]-terminalPoint[0])*progress,
                    terminalPoint[1] + (parkPoint[1]-terminalPoint[1])*progress
                ];
                return {route,point,phase:`заезд в парк → ${depot.name || depot.id}`};
            }
            return {route,point:null,phase:'в парке — рейс завершён'};
        }

        function getVehicleSimulationPoint(vehicle) {
            const route=getVehicleRoute(vehicle.id);
            if(!route || !route.geometry) return {route,point:null,phase:'в парке'};
            const sim=getContinuousRoutePoint(vehicle,route,new Date());
            return {route:sim.activeRoute||route,point:sim.point,phase:sim.phase};
        }

        function updateTrackerMap(force=false) {
            if (!trackerState.map) return;
            const vehicle = gameState.owned.find(v => String(v.id) === String(trackerState.vehicleId));
            if (!vehicle) { if (trackerState.marker) { trackerState.marker.remove(); trackerState.marker=null; } if (trackerState.routeLayer) { trackerState.routeLayer.remove(); trackerState.routeLayer=null; } return; }
            const sim = getVehicleSimulationPoint(vehicle);
            const status = document.getElementById('trackerStatus');
            if (!sim.route || !sim.point) {
                if (status) status.textContent = `${vehicleCategoryIcon(vehicle.category)} ${vehicle.model}: ТС находится в парке — у него нет активного маршрута с построенной геометрией.`;
                if (trackerState.marker) { trackerState.marker.remove(); trackerState.marker=null; }
                return;
            }
            if (status) status.textContent = `${vehicleCategoryIcon(vehicle.category)} ${vehicle.model} · №${vehicle.plate || vehicle.num || '—'} · ${sim.phase}`;
            if (!trackerState.marker) trackerState.marker = L.marker(sim.point,{icon:createBusIcon(`№${sim.route.number}`,routeColor(sim.route),vehicle.category),zIndexOffset:2000}).addTo(trackerState.map);
            else trackerState.marker.setLatLng(sim.point);
            trackerState.marker.bindPopup(`<b>${escapeHtml(vehicle.model)}</b><br>Госномер: <b>${escapeHtml(vehicle.plate || vehicle.num || '—')}</b><br>Маршрут: <b>№${escapeHtml(sim.route.number)}</b><br>${escapeHtml(sim.phase)}`);
            if (!trackerState.routeLayer || trackerState.routeLayer._routeId !== String(sim.route.id)) {
                if (trackerState.routeLayer) trackerState.routeLayer.remove();
                trackerState.routeLayer = sim.route.geometry ? L.geoJSON(sim.route.geometry,{style:{color:routeColor(sim.route),weight:5,opacity:.65}}).addTo(trackerState.map) : null;
                if (trackerState.routeLayer) trackerState.routeLayer._routeId = String(sim.route.id);
            }
            const shouldPan = force || !trackerState.lastPoint || Date.now()-trackerState.lastPanAt > 350;
            if (shouldPan) {
                const old = trackerState.lastPoint;
                const moved = !old || Math.abs(old[0]-sim.point[0]) + Math.abs(old[1]-sim.point[1]) > 0.00008;
                if (force || moved) { trackerState.map.setView(sim.point, Math.max(trackerState.map.getZoom(),14), {animate:false}); trackerState.lastPanAt=Date.now(); }
            }
            trackerState.lastPoint = sim.point;
        }

        function startTrackerAnimation() {
            if (window.trackerTimer) return;
            const loop = () => {
                const section = document.getElementById('game-section-tracker');
                if (!section || !section.classList.contains('active') || document.hidden) { window.trackerTimer=null; return; }
                updateTrackerMap(false);
                window.trackerTimer=setTimeout(loop,250);
            };
            window.trackerTimer=setTimeout(loop,0);
        }

        function renderMapTrackerSelect() {
            const select=document.getElementById('mapTrackerVehicleSelect');
            if(!select) return;
            const activeVehicles=gameState.owned.filter(v=>getVehicleServiceCards(v.id).length || getVehicleRoute(v.id));
            const prev=mapState.trackingVehicleId || '';
            select.innerHTML='<option value="">— Выбери ТС на линии —</option>'+activeVehicles.map(v=>{
                const active=getActiveServiceRouteAndSchedule(v.id,new Date());
                const route=active?.route||getVehicleRoute(v.id);
                return `<option value="${escapeHtml(v.id)}">${vehicleCategoryIcon(v.category)} ${escapeHtml(v.model)} · ${escapeHtml(v.plate||v.num||'без номера')} · №${escapeHtml(route?.number||'—')}</option>`;
            }).join('');
            if(prev && activeVehicles.some(v=>String(v.id)===String(prev))) select.value=prev;
        }

        window.selectMapTrackedVehicle=function(vehicleId){
            mapState.trackingVehicleId=vehicleId||null;
            mapState.lastTrackPanAt=0;
            const status=document.getElementById('mapTrackerStatus');
            const v=gameState.owned.find(x=>String(x.id)===String(vehicleId));
            if(!v){ if(status) status.textContent='Выбери ТС для слежения.'; return; }
            const sim=getVehicleSimulationPoint(v);
            const active=getActiveServiceRouteAndSchedule(v.id,new Date());
            const route=active?.route||sim.route||getVehicleRoute(v.id);
            if(status) status.textContent=route ? `${vehicleCategoryIcon(v.category)} ${v.model} · №${v.plate||v.num||'—'} · маршрут №${route.number} · ${sim.phase}` : `${vehicleCategoryIcon(v.category)} ${v.model}: сейчас в парке.`;
            if(mapState.map){ updateMapBusMarkers(true); if(sim.point) mapState.map.setView(sim.point,Math.max(mapState.map.getZoom(),14),{animate:false}); }
        };

        window.centerMapTrackedVehicle=function(){
            if(!mapState.trackingVehicleId || !mapState.map) return;
            const v=gameState.owned.find(x=>String(x.id)===String(mapState.trackingVehicleId));
            if(!v) return;
            const sim=getVehicleSimulationPoint(v);
            if(sim.point) mapState.map.setView(sim.point,Math.max(mapState.map.getZoom(),14),{animate:false});
            const status=document.getElementById('mapTrackerStatus');
            if(status && sim.route) status.textContent=`${vehicleCategoryIcon(v.category)} ${v.model} · маршрут №${sim.route.number} · ${sim.phase}`;
        };

        window.stopMapTrackingVehicle=function(){
            mapState.trackingVehicleId=null; mapState.lastTrackPanAt=0;
            const select=document.getElementById('mapTrackerVehicleSelect'); if(select) select.value='';
            const status=document.getElementById('mapTrackerStatus'); if(status) status.textContent='Слежение снято.';
        };

        async function renderMapIfReady() {
            if (!document.getElementById('routeMap')) return;
            await initRouteMap();
            if (!mapState.map) return;
            renderMapRouteControls();
            renderMapTrackerSelect();
            renderMapStops();
            renderMapRouteLayers();
            renderMapDraftInfo();
            renderMapBusList();
            startMapBusAnimation();
        }

        function showGameSection(section, btn) {
            document.querySelectorAll('.game-section').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.game-menu-btn').forEach(el => el.classList.remove('active'));
            const target = document.getElementById('game-section-' + section);
            if (target) target.classList.add('active');
            if (btn) btn.classList.add('active');

            // Не перерисовываем весь интерактив при каждом переключении раздела.
            // Это было одной из главных причин задержек на телефонах и ПК.
            if (section === 'map') {
                setTimeout(renderMapIfReady, 60);
            } else {
                stopMapBusAnimation();
                if (section === 'routes') renderRoutes();
                else renderInteractiveHeaderAndLightViews();
            }
        }

        function renderInteractiveHeaderAndLightViews() {
            const balance = document.getElementById('gameBalance');
            if (!balance) return;
            balance.textContent = money(gameState.balance);
            document.getElementById('ownedCount').textContent = gameState.owned.length;
            const badge = document.getElementById('gameClockBadge');
            if (badge) {
                const now = new Date();
                badge.textContent = now.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'}) +
                    (now.getHours() >= 12 ? ' • начисление сегодня выполнено/ожидается' : ' • следующее начисление в 12:00');
            }
        }

        const DAY_NAMES_RU = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
        const DAY_FULL_RU = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];

        function formatMinutesToDuration(seconds) {
            const min = Math.max(1, Math.round(Number(seconds || 0) / 60));
            if (min < 60) return `${min} мин.`;
            const h = Math.floor(min / 60), m = min % 60;
            return m ? `${h} ч ${m} мин.` : `${h} ч`;
        }

        function getRouteTerminals(route) {
            if (!route) return [];
            const ids = Array.isArray(route.terminalStopIds) && route.terminalStopIds.length >= 2 ? route.terminalStopIds : (Array.isArray(route.stopIds) ? [route.stopIds[0], route.stopIds[route.stopIds.length-1]] : []);
            const allStops = getMapStops();
            const found = ids.map(id => allStops.find(s => String(s.id) === String(id))).filter(Boolean);
            if (found.length >= 2) return found;
            // Даже если данные остановок ещё не загружены в localStorage, карточка всё равно должна работать.
            return [
                {id:ids[0] || 'route-start', name:route.start || 'Первая конечная'},
                {id:ids[ids.length-1] || 'route-end', name:route.end || 'Конечная'}
            ];
        }

        function getRouteTerminalName(route, id) {
            const terms = getRouteTerminals(route);
            return terms.find(t => String(t.id) === String(id))?.name || 'Конечная';
        }
        function getRouteTerminalDurationMinutes(route, startStopId) {
            const firstId = (route.terminalStopIds || route.stopIds || [])[0];
            const forward = !startStopId || String(startStopId) === String(firstId);
            const sec = forward ? Number(route.outboundDuration || 0) : Number(route.returnDuration || 0);
            return Math.max(1, Math.round((sec || Number(route.calculatedDuration || 900)) / 60));
        }
        function getDepotTransferMinutes(route, startStopId) {
            const firstId = (route.terminalStopIds || route.stopIds || [])[0];
            const forward = !startStopId || String(startStopId) === String(firstId);
            const sec = forward ? Number(route.outboundDuration || 0) : Number(route.returnDuration || 0);
            return Math.max(1, Math.round((sec || 15*60) / 60));
        }
        function getReturnTransferMinutes(route, endStopId) {
            const firstId = (route.terminalStopIds || route.stopIds || [])[0];
            const endIsFirst = endStopId && firstId && String(endStopId) === String(firstId);
            const sec = endIsFirst ? Number(route.outboundDuration || 0) : Number(route.returnDuration || 0);
            return Math.max(1, Math.round((sec || 15*60) / 60));
        }
        function updateDepartureRouteInfo() {
            const el = document.getElementById('departureRouteInfo');
            if (!el) return;
            const rows = document.querySelectorAll('#departureScheduleRows .departure-schedule-row');
            if (!rows.length) { el.textContent = 'Добавь выезд и выбери маршрут.'; return; }
            let html = 'ℹ️ Время выезда из парка → первой конечной и время возврата рассчитываются автоматически по сохранённой геометрии маршрута.';
            el.innerHTML = html;
            rows.forEach(row => { const route = getRouteTerminalsRoute(row); if (route) { populateDepartureTerminals(row, route); autoCalculateDepartureRow(row); } });
        }
        function updateDepartureRouteOptions() {
            const vehicleSelect = document.getElementById('departureVehicle');
            if (!vehicleSelect) return;
            const prevV = vehicleSelect.value;
            vehicleSelect.innerHTML = gameState.owned.length ? gameState.owned.map(v => `<option value="${escapeHtml(v.id)}">${vehicleCategoryIcon(v.category)} ${escapeHtml(v.model)} · ${escapeHtml(v.category === 'trolleybus' ? ('борт. №' + v.num) : (v.plate || v.num || 'без номера'))}</option>`).join('') : '<option value="">Нет ТС в гараже</option>';
            if (gameState.owned.some(v => String(v.id) === String(prevV))) vehicleSelect.value = prevV;
            updateDepartureRouteForRows();
        }
        function updateDepartureRouteForRows() {
            const vehicle = gameState.owned.find(v => String(v.id) === String(document.getElementById('departureVehicle')?.value));
            document.querySelectorAll('#departureScheduleRows .departure-schedule-row').forEach(row => {
                const select = row.querySelector('.departure-route');
                if (!select) return;
                const current = select.value;
                const routes = gameState.routes.filter(r => !vehicle || vehicle.category === r.routeType || (vehicle.category === 'bus' && r.routeType === 'bus'));
                select.innerHTML = routes.length ? routes.map(r => `<option value="${escapeHtml(r.id)}">№${escapeHtml(r.number)} — ${escapeHtml(r.start)} → ${escapeHtml(r.end)}</option>`).join('') : '<option value="">Нет подходящих маршрутов</option>';
                if (routes.some(r => String(r.id) === String(current))) select.value = current;
                populateDepartureTerminals(row, getRouteTerminalsRoute(row));
                autoCalculateDepartureRow(row);
            });
            updateDepartureRouteInfo();
        }
        function populateDepartureTerminals(row, route) {
            const startSel = row.querySelector('.departure-start-stop');
            const endSel = row.querySelector('.departure-end-stop');
            if (!startSel || !endSel) return;
            const terms = getRouteTerminals(route);
            const currentStart = row.dataset.startStopId || startSel.value;
            const currentEnd = row.dataset.endStopId || endSel.value;
            const opts = terms.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join('');
            startSel.innerHTML = opts || '<option value="">— нет конечных —</option>';
            endSel.innerHTML = opts || '<option value="">— нет конечных —</option>';
            if (terms.some(t => String(t.id) === String(currentStart))) startSel.value = currentStart;
            else if (terms[0]) startSel.value = terms[0].id;
            const startId = startSel.value;
            if (terms.some(t => String(t.id) === String(currentEnd)) && String(currentEnd) !== String(startId)) endSel.value = currentEnd;
            else if (terms.find(t => String(t.id) !== String(startId))) endSel.value = terms.find(t => String(t.id) !== String(startId)).id;
            row.dataset.startStopId = startSel.value || '';
            row.dataset.endStopId = endSel.value || '';
        }
        function isMultiRouteCardMode() {
            return !!document.getElementById('departureMultiRouteMode')?.checked;
        }
        function getRouteTravelMinutesForDirection(route, startStopId) {
            return getRouteTerminalDurationMinutes(route, startStopId);
        }
        function recalcMultiRouteSequence() {
            const rows = [...document.querySelectorAll('#departureScheduleRows .departure-schedule-row')];
            if (!rows.length || !isMultiRouteCardMode()) return;
            let previousEnd = null;
            rows.forEach((row, idx) => {
                const route = getRouteTerminalsRoute(row);
                if (!route) return;
                const depot = row.querySelector('.departure-depot');
                const start = row.querySelector('.departure-start');
                const until = row.querySelector('.departure-until');
                const end = row.querySelector('.departure-end');
                const ret = row.querySelector('.departure-return');
                const autoFinish = row.querySelector('.departure-auto-finish')?.checked !== false;
                const startId = row.querySelector('.departure-start-stop')?.value || route.terminalStopIds?.[0];
                const duration = getRouteTravelMinutesForDirection(route, startId);
                const turnaround = Math.max(1, Number(route.turnaroundMinutes || 2));
                if (idx === 0) {
                    if (depot) depot.readOnly = false;
                    if (start && row.dataset.manualStart !== '1') start.value = addMinutesToTime(depot.value || '05:00', Math.max(1, getDepotTransferMinutes(route,startId)));
                } else {
                    if (depot) { depot.readOnly = true; depot.value = previousEnd ? minutesToTime(previousEnd) : depot.value; }
                    if (start && row.dataset.manualStart !== '1') start.value = previousEnd ? minutesToTime(previousEnd + Math.max(1,turnaround)) : start.value;
                }
                const startMin = timeToMinutes(start?.value || '05:30');
                let untilMin = timeToMinutes(until?.value || '22:00');
                if (untilMin < startMin) untilMin += 1440;
                const endMin = startMin + duration;
                if (autoFinish && end && row.dataset.manualEnd !== '1') {
                    let lastArrival = endMin;
                    for (let dep=startMin; dep+duration<=untilMin; dep+=duration+turnaround) lastArrival=dep+duration;
                    end.value = minutesToTime(lastArrival);
                }
                const effectiveEnd = timeToMinutes(end?.value || minutesToTime(endMin));
                const returnTransfer = getReturnTransferMinutes(route,row.querySelector('.departure-end-stop')?.value);
                if (autoFinish && ret && row.dataset.manualReturn !== '1') ret.value = minutesToTime(effectiveEnd + Math.max(1, returnTransfer));
                if (end) end.readOnly = autoFinish;
                if (ret) ret.readOnly = autoFinish;
                row.dataset.sequenceOrder = idx;
                row.dataset.autoSequence = '1';
                previousEnd = effectiveEnd + Math.max(1, returnTransfer);
                const count = row.querySelector('.departure-trip-count'); if (count) count.value = String(getDepartureRowTripCount(row));
                const preview = row.querySelector('.departure-auto-preview');
                if (preview) preview.innerHTML = `<b>🔗 Этап ${idx+1}:</b> ${escapeHtml(route.start || '—')} → ${escapeHtml(route.end || '—')} · ⏱️ ${formatMinutesToDuration(duration*60)} · прибытие ${escapeHtml(end?.value || '—')} · ${autoFinish ? 'заезд в парк рассчитан автоматически' : 'заезд в парк задан вручную'}`;
            });
            updateDepartureCardBuilderSummary();
        }

        function isMultiRouteCardMode() {
            const radio = document.querySelector('input[name="departureRouteMode"]:checked');
            return radio ? radio.value === 'multi' : false;
        }
        function setDepartureRouteMode(mode) {
            const multi = mode === 'multi';
            const btn = document.getElementById('departureAddRouteBtn');
            const hint = document.getElementById('departureMultiRouteHint');
            if (btn) btn.style.display = multi ? 'inline-flex' : 'none';
            if (hint) hint.innerHTML = multi
                ? 'Теперь каждая строка — отдельный этап дня. Например: <b>№562 → №270S → №562</b>. Нажми «Добавить дополнительный маршрут», чтобы добавить следующий номер маршрута.'
                : 'Для одного маршрута достаточно одной строки.';
            const rows = document.querySelectorAll('#departureScheduleRows .departure-schedule-row');
            rows.forEach((row,i) => {
                const label = row.querySelector('.departure-stage-label');
                if (label) label.textContent = multi ? `Этап ${i+1}` : 'Маршрут';
            });
            recalcMultiRouteSequence();
            updateDepartureCardBuilderSummary();
        }

        function addDepartureScheduleRow(s = {}) {
            const wrap = document.getElementById('departureScheduleRows'); if (!wrap) return;
            const row = document.createElement('div');
            row.className = 'departure-schedule-row departure-schedule-row-v3';
            row.innerHTML = `<div class="departure-stage-label" style="font-weight:800;min-width:68px;">${isMultiRouteCardMode() ? 'Этап 1' : 'Маршрут'}</div><select class="departure-day" aria-label="Дни недели"><option value="weekdays">Будни</option><option value="weekends">Выходные</option><option value="all">Все дни</option><option value="1">Понедельник</option><option value="2">Вторник</option><option value="3">Среда</option><option value="4">Четверг</option><option value="5">Пятница</option><option value="6">Суббота</option><option value="0">Воскресенье</option></select>
                <select class="departure-route" aria-label="Маршрут"></select>
                <select class="departure-start-stop" aria-label="Отправление с конечной"></select>
                <select class="departure-end-stop" aria-label="Конечная рейса"></select>
                <label class="departure-time-field"><span>Выезд из парка</span><input class="departure-depot" type="time" value="${escapeHtml(s.depotTime || '05:00')}" required></label>
                <label class="departure-time-field"><span>Авто: отправление с конечной</span><input class="departure-start" type="time" value="${escapeHtml(s.startTime || '05:30')}" readonly></label>
                <label class="departure-time-field"><span>Реальное время до конечной</span><input class="departure-duration" type="text" value="—" readonly></label>
                <label class="departure-time-field"><span>Работать до</span><input class="departure-until" type="time" value="${escapeHtml(s.workUntil || s.endTime || '22:00')}" required></label>
                <label class="departure-auto-finish-field" style="display:flex;align-items:center;gap:8px;padding:8px 0;grid-column:1/-1;"><input class="departure-auto-finish" type="checkbox" ${s.autoFinish === false ? '' : 'checked'}><span>🤖 Автоматически закончить по «Работать до» — рассчитать последнее прибытие и заезд в парк</span></label>
                <label class="departure-time-field"><span>Последнее прибытие</span><input class="departure-end" type="time" value="${escapeHtml(s.lastArrivalTime || s.endTime || '22:00')}" ${s.autoFinish === false ? '' : 'readonly'}></label>
                <label class="departure-time-field"><span>Заезд в парк</span><input class="departure-return" type="time" value="${escapeHtml(s.returnTime || '22:20')}" ${s.autoFinish === false ? '' : 'readonly'}></label>
                <label class="departure-time-field"><span>≈ Рейсов за смену</span><input class="departure-trip-count" type="number" value="0" readonly></label>
                <label class="departure-time-field"><span>Этап</span><input class="departure-sequence-order" type="number" min="1" value="1" readonly></label>
                <button type="button" class="btn-secondary departure-remove-row" onclick="this.closest('.departure-schedule-row').remove(); setDepartureRouteMode(isMultiRouteCardMode()?'multi':'single'); recalcMultiRouteSequence(); updateDepartureCardBuilderSummary();" title="Удалить этот выезд">🗑️</button>
                <div class="departure-auto-preview"></div>`;
            wrap.appendChild(row);
            row.dataset.manualStart = '0';
            row.dataset.manualEnd = s.autoFinish === false && (s.lastArrivalTime || s.endTime) ? '1' : '0';
            row.dataset.manualReturn = s.autoFinish === false && s.returnTime ? '1' : '0';
            row.querySelector('.departure-day').value = String(s.dayGroup || (Array.isArray(s.days) && s.days.length === 7 ? 'all' : 'weekdays'));
            row.querySelector('.departure-day').addEventListener('change', () => updateDepartureCardBuilderSummary());
            row.querySelector('.departure-route').addEventListener('change', () => { row.dataset.manualStart='0'; row.dataset.manualEnd='0'; row.dataset.manualReturn='0'; populateDepartureTerminals(row, getRouteTerminalsRoute(row)); autoCalculateDepartureRow(row); recalcMultiRouteSequence(); });
            row.querySelector('.departure-start-stop').addEventListener('change', () => { row.dataset.startStopId=row.querySelector('.departure-start-stop').value; row.dataset.manualStart='0'; row.dataset.manualEnd='0'; row.dataset.manualReturn='0'; autoCalculateDepartureRow(row); recalcMultiRouteSequence(); });
            row.querySelector('.departure-end-stop').addEventListener('change', () => { row.dataset.endStopId=row.querySelector('.departure-end-stop').value; row.dataset.manualEnd='0'; row.dataset.manualReturn='0'; autoCalculateDepartureRow(row); recalcMultiRouteSequence(); });
            row.querySelector('.departure-depot').addEventListener('change', () => { row.dataset.manualStart='0'; row.dataset.manualEnd='0'; row.dataset.manualReturn='0'; autoCalculateDepartureRow(row); recalcMultiRouteSequence(); });
            row.querySelector('.departure-until').addEventListener('change', () => { row.dataset.manualEnd='0'; row.dataset.manualReturn='0'; autoCalculateDepartureRow(row); recalcMultiRouteSequence(); });
            row.querySelector('.departure-auto-finish').addEventListener('change', (e) => {
                const auto = !!e.target.checked;
                const end = row.querySelector('.departure-end');
                const ret = row.querySelector('.departure-return');
                if (end) end.readOnly = auto;
                if (ret) ret.readOnly = auto;
                row.dataset.manualEnd = auto ? '0' : '1';
                row.dataset.manualReturn = auto ? '0' : '1';
                autoCalculateDepartureRow(row); recalcMultiRouteSequence();
            });
            row.querySelector('.departure-start').addEventListener('change', () => { row.dataset.manualStart='1'; });
            row.querySelector('.departure-end').addEventListener('change', () => { if (!row.querySelector('.departure-auto-finish')?.checked) row.dataset.manualEnd='1'; });
            row.querySelector('.departure-return').addEventListener('change', () => { if (!row.querySelector('.departure-auto-finish')?.checked) row.dataset.manualReturn='1'; });
            updateDepartureRouteForRows();
            recalcMultiRouteSequence();
            const route = getRouteTerminalsRoute(row);
            if (route) {
                if (s.startStopId) row.dataset.startStopId=s.startStopId;
                if (s.endStopId) row.dataset.endStopId=s.endStopId;
                populateDepartureTerminals(row, route);
                autoCalculateDepartureRow(row);
            }
        }
        function getRouteTerminalsRoute(row) { return gameState.routes.find(r => String(r.id) === String(row?.querySelector('.departure-route')?.value)); }
        function expandDepartureDay(value) {
            if (value === 'weekdays') return [1,2,3,4,5];
            if (value === 'weekends') return [0,6];
            if (value === 'all') return [0,1,2,3,4,5,6];
            return [Number(value)];
        }
        function collectDepartureSchedules() {
            const result = [];
            document.querySelectorAll('#departureScheduleRows .departure-schedule-row').forEach(row => {
                const route = getRouteTerminalsRoute(row);
                const dayGroup = row.querySelector('.departure-day')?.value || '1';
                const days = expandDepartureDay(dayGroup);
                if (!route) return;
                const startId = row.querySelector('.departure-start-stop')?.value || route.terminalStopIds?.[0] || null;
                const endId = row.querySelector('.departure-end-stop')?.value || route.terminalStopIds?.[route.terminalStopIds.length-1] || null;
                if (startId && endId && String(startId) === String(endId)) return;
                const schedule = {
                    routeId: route.id,
                    startStopId: startId,
                    endStopId: endId,
                    depotTime: row.querySelector('.departure-depot')?.value || '05:00',
                    startTime: row.querySelector('.departure-start')?.value || '05:30',
                    autoFinish: row.querySelector('.departure-auto-finish')?.checked !== false,
                    workUntil: row.querySelector('.departure-until')?.value || '22:00',
                    endTime: row.querySelector('.departure-end')?.value || '22:00',
                    lastArrivalTime: row.querySelector('.departure-end')?.value || '22:00',
                    returnTime: row.querySelector('.departure-return')?.value || '22:20',
                    estimatedTrips: isMultiRouteCardMode() ? 1 : getDepartureRowTripCount(row),
                    sequenceMode: isMultiRouteCardMode(),
                    sequenceOrder: Number(row.dataset.sequenceOrder || 0),
                    turnaroundMinutes: Number(route.turnaroundMinutes || 2),
                    dayGroup,
                    startStopName: getRouteTerminalName(route, row.querySelector('.departure-start-stop')?.value),
                    endStopName: getRouteTerminalName(route, row.querySelector('.departure-end-stop')?.value)
                };
                days.forEach(day => result.push({...schedule, days:[day]}));
            });
            return result;
        }
        function getDepartureRowTripCount(row) {
            const route = getRouteTerminalsRoute(row);
            if (!route) return 0;
            const depotMin = timeToMinutes(row.querySelector('.departure-depot')?.value || '05:00');
            const startMin = timeToMinutes(row.querySelector('.departure-start')?.value || '05:30');
            let untilMin = timeToMinutes(row.querySelector('.departure-until')?.value || '22:00');
            if (untilMin < startMin) untilMin += 1440;
            const duration = getRouteTerminalDurationMinutes(route, row.querySelector('.departure-start-stop')?.value);
            const turnaround = Math.max(0, Number(route.turnaroundMinutes || 2));
            if (!duration || startMin + duration > untilMin) return 0;
            return Math.max(0, Math.floor((untilMin - (startMin + duration)) / Math.max(1, duration + turnaround)) + 1);
        }
        function updateDepartureCardBuilderSummary() {
            const el = document.getElementById('departureCardDailySummary');
            if (!el) return;
            const rows = [...document.querySelectorAll('#departureScheduleRows .departure-schedule-row')];
            let weekdays=0, weekends=0, all=0, totalRows=0;
            rows.forEach(row => {
                const route = getRouteTerminalsRoute(row);
                if (!route) return;
                const trips = getDepartureRowTripCount(row);
                totalRows++;
                const group = row.querySelector('.departure-day')?.value || '1';
                if (group === 'weekdays') weekdays += trips;
                else if (group === 'weekends') weekends += trips;
                else if (group === 'all') { weekdays += trips; weekends += trips; all += trips; }
                else if ([1,2,3,4,5].includes(Number(group))) weekdays += trips;
                else weekends += trips;
            });
            const average = rows.length ? ((weekdays * 5 + weekends * 2) / 7) : 0;
            el.innerHTML = `<b>📊 Примерная нагрузка:</b> ${totalRows} маршрут(а) в карточке · <b>${weekdays}</b> рейсов в обычный будний день · <b>${weekends}</b> рейсов в обычный выходной день · среднее <b>≈${average.toFixed(1)}</b> рейса/день`;
        }
        function autoCalculateDepartureRow(row) {
            const route = getRouteTerminalsRoute(row);
            if (!route) return;
            const depot = row.querySelector('.departure-depot');
            const start = row.querySelector('.departure-start');
            const until = row.querySelector('.departure-until');
            const end = row.querySelector('.departure-end');
            const ret = row.querySelector('.departure-return');
            const durationField = row.querySelector('.departure-duration');
            const autoFinish = row.querySelector('.departure-auto-finish')?.checked !== false;
            const startStopId = row.querySelector('.departure-start-stop')?.value;
            const endStopId = row.querySelector('.departure-end-stop')?.value;
            const durationMin = getRouteTerminalDurationMinutes(route, startStopId);
            const transferMin = getDepotTransferMinutes(route, startStopId);
            const depotMin = timeToMinutes(depot?.value || '05:00');
            const startMin = depotMin + transferMin;
            if (durationField) durationField.value = formatMinutesToDuration(durationMin * 60);
            if (start && row.dataset.manualStart !== '1') start.value = minutesToTime(startMin);
            let untilMin = timeToMinutes(until?.value || '22:00');
            if (untilMin < (startMin % 1440)) untilMin += 1440;
            if (untilMin < startMin + durationMin) untilMin = startMin + durationMin;
            const turnaround = Math.max(0, Number(route.turnaroundMinutes || 2));
            let lastArrival = startMin + durationMin;
            let trips = 1;
            for (let dep = startMin; dep + durationMin <= untilMin; dep += durationMin + turnaround) {
                lastArrival = dep + durationMin; trips++; if (trips > 200) break;
            }
            const returnTransfer = getReturnTransferMinutes(route, endStopId);
            if (autoFinish || row.dataset.manualEnd !== '1') end.value = minutesToTime(lastArrival);
            if (autoFinish || row.dataset.manualReturn !== '1') ret.value = minutesToTime(lastArrival + returnTransfer);
            if (end) end.readOnly = autoFinish;
            if (ret) ret.readOnly = autoFinish;
            row.dataset.startStopId = startStopId || '';
            row.dataset.endStopId = endStopId || '';
            const preview = row.querySelector('.departure-auto-preview');
            if (preview) {
                const startName = getRouteTerminalName(route,startStopId), endName = getRouteTerminalName(route,endStopId);
                const modeText = autoFinish ? '🤖 конец смены рассчитывается автоматически' : '✋ последнее прибытие и парк задаются вручную';
                const parts = [];
                parts.push(`<b>Маршрут:</b> ${escapeHtml(startName || route.start || '—')} → ${escapeHtml(endName || route.end || '—')}`);
                parts.push(`<b>🏠 Парк ${escapeHtml(depot?.value || '')} → 🚏 отправление ${escapeHtml(start?.value || '')} → 🏁 прибытие ${escapeHtml(end?.value || '')} → 🏠 парк ${escapeHtml(ret?.value || '')}</b>`);
                parts.push(`<span>⏱️ В пути до конечной: ${formatMinutesToDuration(durationMin*60)} · заезд в парк: ${returnTransfer} мин · ${modeText}</span>`);
                const previewTimes=[];
                for(let i=0,dep=startMin;i<200 && dep+durationMin<=untilMin;i++,dep+=durationMin+turnaround) previewTimes.push(`${minutesToTime(dep)}→${minutesToTime(dep+durationMin)}`);
                if(previewTimes.length) parts.push(`<span>Рейсов: ${previewTimes.length} · ${previewTimes.slice(0,8).join(' · ')}${previewTimes.length>8?' · …':''}</span>`);
                preview.innerHTML=parts.join('<br>');
            }
            const countInput = row.querySelector('.departure-trip-count');
            if (countInput) countInput.value = String(getDepartureRowTripCount(row));
            updateDepartureCardBuilderSummary();
        }
        function renderDepartureCards() {
            const el = document.getElementById('departureCardsList'); if (!el) return;
            const cards = Array.isArray(gameState.serviceCards) ? gameState.serviceCards : [];
            if (!cards.length) { el.innerHTML = '<div class="interactive-muted">Карточек выезда пока нет.</div>'; return; }
            el.innerHTML = cards.map(card => {
                const v = gameState.owned.find(x => String(x.id) === String(card.vehicleId));
                if (!v) return '';
                const schedules = Array.isArray(card.schedules) ? card.schedules : [];
                const uniqueSchedules = schedules.filter((s,i,a)=>a.findIndex(x=>String(x.routeId)===String(s.routeId) && String(x.depotTime)===String(s.depotTime) && String(x.startStopId)===String(s.startStopId) && String(x.endStopId)===String(s.endStopId) && String(x.workUntil)===String(s.workUntil))===i);
                const dailyCounts = {weekdays:0, weekends:0};
                uniqueSchedules.forEach(s=>{ const trips=Number(s.estimatedTrips||0); const d=Array.isArray(s.days)?s.days:[]; if(d.some(x=>[1,2,3,4,5].includes(Number(x)))) dailyCounts.weekdays+=trips; if(d.some(x=>[0,6].includes(Number(x)))) dailyCounts.weekends+=trips; });
                const avgTrips = ((dailyCounts.weekdays*5 + dailyCounts.weekends*2)/7);
                const rows = schedules.map(s => {
                    const r = getScheduleRoute(s);
                    return (s.days || []).map(day => `<div class="departure-schedule-view"><b>${DAY_FULL_RU[Number(day)] || 'День'}</b><span>🛣️ №${escapeHtml(r?.number || '—')}</span><span>🚏 ${escapeHtml(s.startStopName || getRouteTerminalName(r,s.startStopId))} → ${escapeHtml(s.endStopName || getRouteTerminalName(r,s.endStopId))}</span><span>🏠 ${escapeHtml(s.depotTime)}</span><span>🚏 ${escapeHtml(s.startTime)}</span><span>⏳ до ${escapeHtml(s.workUntil || s.endTime)}</span><span>🏁 ${escapeHtml(s.lastArrivalTime || s.endTime)}</span><span>🏠 ${escapeHtml(s.returnTime)}</span></div>`).join('');
                }).join('');
                return `<div class="departure-card"><div class="departure-card-head"><div><b>🗓️ Карточка выезда · ${vehicleCategoryIcon(v.category)} ${escapeHtml(v.model)}</b><div class="interactive-muted">${escapeHtml(v.category === 'trolleybus' ? ('борт. №' + v.num) : (v.plate || v.num || 'без номера'))} · ${uniqueSchedules.length} маршрута/этапа${card.multiRouteMode ? ' · 🔗 последовательная смена' : ''} · ≈${avgTrips.toFixed(1)} рейса/день</div></div><button class="btn-secondary" onclick="toggleDepartureCard('${escapeHtml(card.id)}')">${card.active !== false ? '⏸ Остановить' : '▶ Запустить'}</button><button class="btn-secondary" onclick="deleteDepartureCard('${escapeHtml(card.id)}')">Удалить</button></div><div class="departure-schedule-list">${rows || '<div class="interactive-muted">Расписание не задано.</div>'}</div></div>`;
            }).join('') || '<div class="interactive-muted">Карточек выезда пока нет.</div>';
        }

        function saveDepartureCard(event) {
            event.preventDefault();
            const vehicle = gameState.owned.find(v => String(v.id) === String(document.getElementById('departureVehicle').value));
            const schedules = collectDepartureSchedules();
            if (!vehicle) return alert('Выбери ТС.');
            if (!schedules.length) return alert('Добавь хотя бы один выезд с маршрутом и днём недели.');
            const bad = schedules.find(s => { const r=getScheduleRoute(s); return !r || !(vehicle.category === r.routeType || (vehicle.category === 'bus' && r.routeType === 'bus')); });
            if (bad) return alert('Один из выбранных маршрутов несовместим с ТС.');
            // Несколько строк одной карточки могут быть разными маршрутами в один день.
            // Проверяем только пересечение временных интервалов, чтобы автобус не оказался одновременно в двух местах.
            const expanded = schedules.map(s => { const r=getScheduleRoute(s); const abs=getScheduleAbsoluteTimes(s,new Date(),r,vehicle); return {s,days:s.days||[],start:abs.depot.getTime(),end:abs.return.getTime()}; });
            for (let i=0;i<expanded.length;i++) for (let j=i+1;j<expanded.length;j++) {
                if (!expanded[i].days.some(d=>expanded[j].days.includes(d))) continue;
                if (expanded[i].start < expanded[j].end && expanded[j].start < expanded[i].end) {
                    const a=expanded[i].s.routeId, b=expanded[j].s.routeId;
                    if (String(a)!==String(b) || expanded[i].s.depotTime!==expanded[j].s.depotTime) return alert('Два выезда пересекаются по времени. Разнеси их по времени, чтобы одно ТС не выполняло два маршрута одновременно.');
                }
            }
            const id = 'dep-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
            const firstRoute = getScheduleRoute(schedules[0]);
            gameState.serviceCards.unshift({id,vehicleId:vehicle.id,routeId:firstRoute?.id || null,multiRouteMode:isMultiRouteCardMode(),schedules,createdAt:new Date().toISOString(),lastArrivalCount:0,lastArrivalStamp:'',lastSimulationAt:new Date().toISOString(),active:true});
            saveGameState(); processServiceCardPayouts(new Date()); renderDepartureCards(); document.getElementById('departureCardForm').reset();
            const singleMode = document.getElementById('departureSingleRouteMode');
            if (singleMode) singleMode.checked = true;
            setDepartureRouteMode('single');
            const rows = document.getElementById('departureScheduleRows'); if (rows) rows.innerHTML = '';
            addDepartureScheduleRow(); updateDepartureRouteOptions(); recalcMultiRouteSequence(); updateMapBusMarkers(true);
        }

        function getActiveDepartureSchedule(card, now = new Date()) {
            if (!card || card.active === false) return null;
            const schedules = Array.isArray(card.schedules) ? card.schedules : [];
            const nowMs = now.getTime();
            // В режиме нескольких маршрутов этапы идут последовательно и не конкурируют друг с другом.
            const ordered = schedules.map((s,i)=>({s,i})).sort((a,b)=>Number(a.s.sequenceOrder||a.i)-Number(b.s.sequenceOrder||b.i));
            for (const item of ordered) {
                const s=item.s;
                for (let offset=0;offset<=1;offset++) {
                    const base=new Date(now.getFullYear(),now.getMonth(),now.getDate()-offset);
                    if (!Array.isArray(s.days) || !s.days.includes(base.getDay())) continue;
                    const route=getScheduleRoute(s); if(!route) continue;
                    const abs=getScheduleAbsoluteTimes(s,base,route,null);
                    if(nowMs>=abs.depot.getTime() && nowMs<=abs.return.getTime()) return {schedule:s,index:item.i,startMinutes:abs.startMin,nowMinutes:nowMs/60000,absolute:abs,baseDate:base};
                }
            }
            return null;
        }

        function toggleDepartureCard(id) { const card = gameState.serviceCards.find(c => String(c.id) === String(id)); if (!card) return; card.active = card.active === false; if (card.active) { card.createdAt = new Date().toISOString(); card.lastSimulationAt = new Date().toISOString(); } saveGameState(); renderDepartureCards(); updateMapBusMarkers(true); }
        function deleteDepartureCard(id) { gameState.serviceCards = gameState.serviceCards.filter(card => String(card.id) !== String(id)); saveGameState(); renderDepartureCards(); updateMapBusMarkers(true); }
        function renderDepartureSection() { updateDepartureRouteOptions(); renderDepartureCards(); const rows=document.getElementById('departureScheduleRows'); if(rows && !rows.children.length) addDepartureScheduleRow(); updateDepartureCardBuilderSummary(); }

        function renderGarageVehicleRouteStatus(v){
            const active=getActiveServiceRouteAndSchedule(v.id,new Date());
            const cards=getVehicleServiceCards(v.id);
            if(active && active.route){
                const phase=getCardDrivenPoint(v,cards,new Date());
                const dir=phase?.activeRoute||active.route;
                const phaseText=phase?.phase||'по карточке';
                return `<b>🚌 №${escapeHtml(dir.number||'—')}</b><br><span class=\"interactive-muted\">${escapeHtml(phaseText)}</span>`;
            }
            const direct=getVehicleRoute(v.id);
            return direct ? '🛣️ №'+escapeHtml(direct.number||'—') : '<span class=\"interactive-muted\">В парке</span>';
        }

        function renderInteractive() {
            const balance = document.getElementById('gameBalance');
            if (!balance) return;

            document.getElementById('gameBalance').textContent = money(gameState.balance);
            document.getElementById('ownedCount').textContent = gameState.owned.length;

            const now = new Date();
            const badge = document.getElementById('gameClockBadge');
            badge.textContent = now.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'}) +
                (now.getHours() >= 12 ? ' • начисление сегодня выполнено/ожидается' : ' • следующее начисление в 12:00');

            updateGameModelSelect();
            initStopRegionSelect();
            renderTrackerVehicleSelect();

            // На главном экране интерактива всегда показываем купленные ТС,
            // чтобы игрок не должен был каждый раз открывать гараж.
            const shopOwned = document.getElementById('shopOwnedVehicles');
            if (shopOwned) {
                shopOwned.innerHTML = gameState.owned.length
                    ? gameState.owned.map((v, i) => `<div class="owned-mini-card"><div><b>${vehicleCategoryIcon(v.category)} ${escapeHtml(v.model)}</b><div class="interactive-muted">${escapeHtml(v.submodel || 'Базовая модификация')} · ${escapeHtml(gameServiceLabel(v.serviceType))} · ${escapeHtml(v.category === 'trolleybus' ? ('борт. №' + v.num) : (v.plate || v.num || 'Без номера'))} · ${getVehicleRoute(v.id) ? 'маршрут №' + escapeHtml(getVehicleRoute(v.id).number) : 'не назначен'}</div></div><button class="btn-secondary" onclick="showGameSection('garage', document.querySelector('.game-menu-btn[onclick*=&quot;garage&quot;]'))">Гараж</button></div>`).join('')
                    : '<div class="interactive-muted">Купленных ТС пока нет.</div>';
            }

            const body = document.getElementById('ownedVehiclesBody');
            if (!gameState.owned.length) {
                body.innerHTML = `<tr><td colspan="4" class="interactive-muted">Пока нет купленного транспорта.</td></tr>`;
            } else {
                body.innerHTML = gameState.owned.map(v => `
                    <tr>
                        <td><b>${escapeHtml(v.model)}</b><br><span class="interactive-muted">${escapeHtml(v.submodel || 'Базовая модификация')} · ${escapeHtml(gameServiceLabel(v.serviceType))}</span></td>
                        <td>${money(v.price)}</td>
                        <td>${v.currentSalary ? money(v.currentSalary) : '—'}</td>
                        <td><button class="btn-secondary" onclick="sellGameVehicle('${v.id}')">Продать</button></td>
                    </tr>
                `).join('');
            }

            const garage = document.getElementById('garageBody');
            if (garage) {
                if (!gameState.owned.length) {
                    garage.innerHTML = `<tr><td colspan="8" class="interactive-muted">Гараж пуст. Откройте «Магазин» и купите первое ТС.</td></tr>`;
                } else {
                    garage.innerHTML = gameState.owned.map((v, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${({bus:'🚌 Автобус', trolleybus:'🚎 Троллейбус', electrobus:'⚡ Электробус'})[v.category] || v.category}</td>
                            <td><b>${escapeHtml(v.model)}</b><br><span class="interactive-muted">${escapeHtml(v.submodel || 'Базовая модификация')} · ${escapeHtml(gameServiceLabel(v.serviceType))}</span></td>
                            <td>${money(v.price)}</td>
                            <td><b>${escapeHtml(v.category === 'trolleybus' ? ('борт. №' + v.num) : (v.plate || (v.plate = generateRandomPlate())))}</b>${v.category !== 'trolleybus' ? `<br><button class="btn-secondary" onclick="changeVehiclePlate('${v.id}')" style="margin-top:3px;">№ изменить · 5 000 р.</button>` : ''}</td>
                            <td>${v.currentSalary ? money(v.currentSalary) : '—'}</td>
                            <td>${renderGarageVehicleRouteStatus(v)}</td>
                            <td><button class="btn-secondary" onclick="sellGameVehicle('${v.id}')">Продать</button></td>
                        </tr>
                    `).join('');
                }
            }

            const financeBalance = document.getElementById('financeBalance');
            if (financeBalance) financeBalance.textContent = money(gameState.balance);
            const financeOwned = document.getElementById('financeOwned');
            if (financeOwned) financeOwned.textContent = gameState.owned.length;
            const financeLast = document.getElementById('financeLastPayout');
            if (financeLast) financeLast.textContent = gameState.lastPayoutDate || 'ещё не было';
            const notifyEmail = document.getElementById('notifyEmail');
            if (notifyEmail) notifyEmail.value = gameState.emailNotifications?.email || '';
            const notifyEnabled = document.getElementById('notifyEmailEnabled');
            if (notifyEnabled) notifyEnabled.checked = gameState.emailNotifications?.enabled === true;
            renderAffordableVehicleNotice();

            const history = document.getElementById('historyLog');
            if (history) {
                history.innerHTML = gameState.log.length
                    ? gameState.log.map(item => {
                        const detail = Array.isArray(item.details) ? item.details.join(' • ') : '';
                        const extra = item.type === 'route-arrival' ? `<div class="interactive-muted">🕐 Время прибытия: <b>${escapeHtml(item.arrivalTime || item.time || '—')}</b> · маршрут №${escapeHtml(item.routeNumber || '—')} · оплата <b>+100 р.</b></div>` : (item.offline ? `<div class="interactive-muted">Оффлайн: сумма за период отсутствия включена в эту операцию.</div>` : '');
                        return `<div class="interactive-log-row"><div><b>${escapeHtml(item.date || '')}${item.time ? ' · ' + escapeHtml(item.time) : ''}</b><br><span class="interactive-muted">${escapeHtml(detail)}</span>${extra}</div><div class="${item.total >= 0 ? 'interactive-positive' : 'interactive-negative'}">${item.total >= 0 ? '+' : ''}${money(item.total)}</div></div>`;
                    }).join('')
                    : `<div class="interactive-muted">История пока пуста.</div>`;
            }

            const log = document.getElementById('gameLog');
            if (!gameState.log.length) {
                log.innerHTML = `<div class="interactive-muted">История пока пуста.</div>`;
            } else {
                log.innerHTML = gameState.log.map(item => {
                    const detail = Array.isArray(item.details) ? item.details.join(' • ') : '';
                    return `<div class="interactive-log-row"><div><b>${escapeHtml(item.date || '')}${item.time ? ' · ' + escapeHtml(item.time) : ''}</b><br><span class="interactive-muted">${escapeHtml(detail)}</span></div><div class="${item.total >= 0 ? 'interactive-positive' : 'interactive-negative'}">${item.total >= 0 ? '+' : ''}${money(item.total)}</div></div>`;
                }).join('');
            }

            renderRoutes();
        }

        function initInteractiveGame() {
            loadGameState();
            updateGameModelSelect();
            initStopRegionSelect();
            renderTrackerVehicleSelect();
            processAllOfflineEarnings();
            processServiceCardPayouts(new Date());
            renderInteractive();
            checkAffordableVehicleNotifications();
            scheduleNoonPayout();

            // Карту и её анимацию инициализируем лениво — только когда пользователь её открыл.

            // Если вкладка была открыта всю ночь, обновляем часы/состояние каждую минуту.
            if (!window.gameMinuteTimer) {
                window.gameMinuteTimer = setInterval(() => {
                    // 5 секунд достаточно для онлайн-начисления и в 5 раз снижает
                    // постоянную нагрузку на мобильные устройства.
                    processAllOfflineEarnings();
                    processServiceCardPayouts(new Date());
                    renderInteractiveHeaderAndLightViews();
                }, 5000);
            }
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stopMapBusAnimation();
            else {
                processAllOfflineEarnings();
                processServiceCardPayouts(new Date());
                const section = document.getElementById('game-section-map');
                const tracker = document.getElementById('game-section-tracker');
                if (section?.classList.contains('active')) startMapBusAnimation();
                if (tracker?.classList.contains('active')) startTrackerAnimation();
            }
        });

        window.onclick = function(event) {
            let vehicleModal = document.getElementById('vehicleModal');
            let deleteModal = document.getElementById('deleteModal');
            let editSelectionModal = document.getElementById('editSelectionModal');
            let editModal = document.getElementById('editVehicleModal');
            let modelModal = document.getElementById('modelDetailsModal');
            let addModal = document.getElementById('addVehicleModal');
            if (event.target === vehicleModal) vehicleModal.style.display = "none";
            if (event.target === deleteModal) deleteModal.style.display = "none";
            if (event.target === editSelectionModal) editSelectionModal.style.display = "none";
            if (event.target === editModal) editModal.style.display = "none";
            if (event.target === modelModal) modelModal.style.display = "none";
            if (event.target === addModal) addModal.style.display = "none";
        }

        if (document.getElementById('gameModel')) {
            initInteractiveGame();
        }


/* v35: single-route daily shift runtime */
(function(){
  const KEY='busphoto_single_route_shifts_v35';
  function load(){
    try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}
  }
  function save(v){localStorage.setItem(KEY,JSON.stringify(v))}
  window.createSingleRouteShiftV35=function(data){
    const list=load();
    const shift={
      id:'shift_'+Date.now(),
      vehicleId:String(data.vehicleId||''),
      routeId:String(data.routeId||''),
      days:Array.isArray(data.days)?data.days:['all'],
      parkDeparture:data.parkDeparture||'05:00',
      workUntil:data.workUntil||'23:00',
      mode:'single-route',
      status:'active'
    };
    list.push(shift); save(list); return shift;
  };
  window.getSingleRouteShiftsV35=load;
})();


/* v36: multiple cards per vehicle — cards are unique by cardId, not vehicleId */
(function(){
  const KEY='busphoto_departure_cards_v36';
  function load(){
    try { return JSON.parse(localStorage.getItem(KEY)||'[]'); }
    catch(e){ return []; }
  }
  function save(v){ localStorage.setItem(KEY, JSON.stringify(v)); }

  window.createDepartureCardV36=function(data){
    const cards=load();
    const card={
      cardId:'card_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),
      vehicleId:String(data.vehicleId||''),
      days:Array.isArray(data.days)?data.days:['all'],
      routeId:String(data.routeId||''),
      routes:Array.isArray(data.routes)?data.routes:[],
      parkDeparture:data.parkDeparture||'05:00',
      workUntil:data.workUntil||'23:00',
      createdAt:Date.now(),
      active:true
    };
    cards.push(card);
    save(cards);
    return card;
  };

  window.getDepartureCardsV36=load;

  window.deleteDepartureCardV36=function(cardId){
    save(load().filter(c=>c.cardId!==cardId));
  };

  window.getCardsForVehicleV36=function(vehicleId){
    return load().filter(c=>String(c.vehicleId)===String(vehicleId));
  };
})();

/* v38 route-link/card persistence: one vehicle may have many cards */
(function(){
 const K='busphoto_route_cards_v38';
 const load=()=>{try{return JSON.parse(localStorage.getItem(K)||'[]')}catch(e){return[]}};
 window.saveRouteAwareCard=function(d){
   const a=load(); const c={cardId:'card_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),vehicleId:String(d.vehicleId||''),days:d.days||['all'],mode:d.mode||'single',routeId:d.routeId||'',routeStages:d.routeStages||[],endTerminal:d.endTerminal||'',parkDeparture:d.parkDeparture||'05:00',workUntil:d.workUntil||'23:00',createdAt:Date.now()};
   a.push(c);localStorage.setItem(K,JSON.stringify(a));return c;
 };
})();


/* ==================== v43: диспетчерская, статистика, обслуживание ==================== */
(function(){
  const MAINT_KEY='busphoto_maintenance_v43';
  function maintenance(){
    try{return JSON.parse(localStorage.getItem(MAINT_KEY)||'{}')}catch(e){return{}}
  }
  function saveMaint(x){localStorage.setItem(MAINT_KEY,JSON.stringify(x))}
  function ensureVehicleStats(v){
    v.stats=v.stats||{trips:0,arrivals:0,distanceKm:0,workMinutes:0,earned:0};
    if(!Number.isFinite(Number(v.health))) v.health=100;
    if(v.maintenanceDue==null) v.maintenanceDue=false;
    if(!Number.isFinite(Number(v.repairUntil))) v.repairUntil=0;
    if(!Number.isFinite(Number(v.repairStartedAt))) v.repairStartedAt=0;
    if(!Number.isFinite(Number(v.repairCost))) v.repairCost=0;
    if(!Number.isFinite(Number(v.repairDurationMs))) v.repairDurationMs=0;
    // Завершение ремонта происходит по реальному времени, даже если сайт был закрыт.
    if(v.repairUntil && Date.now()>=Number(v.repairUntil)){
      v.repairUntil=0; v.repairStartedAt=0; v.repairCost=0; v.repairDurationMs=0;
      v.health=100; v.maintenanceDue=false;
    }
    return v;
  }
  window.ensureVehicleStatsV43=ensureVehicleStats;

  window.renderDispatcherV43=function(){
    const el=document.getElementById('dispatcherPanel'); if(!el)return;
    const now=new Date();
    const rows=gameState.owned.map(v=>{
      ensureVehicleStats(v);
      const sim=getVehicleSimulationPoint(v);
      const active=getActiveServiceRouteAndSchedule(v.id,now);
      const route=active?.route||sim.route||getVehicleRoute(v.id);
      let status='🏠 В парке';
      if(Number(v.repairUntil)>Date.now()) status='⏳ На ремонте';
      else if(v.maintenanceDue) status='🔧 Требуется обслуживание';
      else if(sim.point||active?.route) status='🟢 В рейсе';
      const next=active?.absolute?.return ? new Date(active.absolute.return).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}) : '—';
      return `<div class="interactive-log-row">
        <div><b>${vehicleCategoryIcon(v.category)} ${escapeHtml(v.model)}</b>
        <br><span class="interactive-muted">${escapeHtml(v.plate||v.num||'без номера')} · ${route?'№'+escapeHtml(route.number):'маршрут не назначен'}</span>
        <br><span>${status}${sim.phase?' · '+escapeHtml(sim.phase):''}</span></div>
        <div><b>Следующий:</b> ${next}<br><button class="btn-secondary" onclick="focusVehicleV43('${v.id}')">🛰️ Следить</button></div>
      </div>`;
    }).join('');
    el.innerHTML=rows||'<div class="interactive-muted">ТС нет.</div>';
  };

  window.focusVehicleV43=function(id){
    const btn=[...document.querySelectorAll('.game-menu-btn')].find(x=String(x.getAttribute('onclick')||'').includes("'map'"));
    showGameSection('tracker',btn);
    const sel=document.getElementById('trackerVehicle');
    if(sel){sel.value=id;sel.dispatchEvent(new Event('change'));}
  };

  window.renderVehicleStatsV43=function(){
    const el=document.getElementById('vehicleStatsPanel'); if(!el)return;
    const total=gameState.owned.reduce((a,v)=>a+Number(v.stats?.earned||0),0);
    el.innerHTML=`<div class="interactive-stats" style="margin:0 0 10px">
      <div class="interactive-stat"><div class="interactive-stat-label">ТС</div><div class="interactive-stat-value">${gameState.owned.length}</div></div>
      <div class="interactive-stat"><div class="interactive-stat-label">Заработано ТС</div><div class="interactive-stat-value">${money(total)}</div></div>
    </div>`+
    gameState.owned.map(v=>{
      ensureVehicleStats(v); const st=v.stats;
      return `<div class="interactive-log-row"><div><b>${vehicleCategoryIcon(v.category)} ${escapeHtml(v.model)}</b><br><span class="interactive-muted">${escapeHtml(v.plate||v.num||'—')}</span></div>
      <div style="text-align:right">Рейсов: <b>${st.trips}</b><br>Конечных: <b>${st.arrivals}</b><br>Пробег: <b>${st.distanceKm.toFixed(1)} км</b><br>Заработано: <b>${money(st.earned)}</b></div></div>`;
    }).join('')||'<div class="interactive-muted">Нет ТС.</div>';
  };

  window.renderMaintenanceV43=function(){
    const el=document.getElementById('maintenancePanel'); if(!el)return;
    el.innerHTML=gameState.owned.map(v=>{
      ensureVehicleStats(v);
      const health=Number(v.health).toFixed(0);
      const due=v.maintenanceDue;
      const repairing=Number(v.repairUntil)>Date.now();
      const remaining=repairing ? Math.max(0,Number(v.repairUntil)-Date.now()) : 0;
      const repairText=repairing
        ? `⏳ Ремонт: <b>${formatRepairDuration(remaining)}</b><br><span class="interactive-muted">ТС временно не работает</span><br>Оплачено: <b>${money(v.repairCost||0)}</b>`
        : (v.repairStartedAt && Number(v.repairUntil)<=Date.now()
          ? `✅ Ремонт завершён · состояние <b>100%</b>` : '');
      const button=repairing
        ? `<button class="btn-secondary" disabled>🔧 Ремонтируется</button>`
        : `<button class="btn-primary" onclick="serviceVehicleV43('${v.id}')">${health>=100?'🔧 Обслужить':'🔧 Отправить на ремонт'}</button>`;
      return `<div class="interactive-log-row">
        <div><b>${vehicleCategoryIcon(v.category)} ${escapeHtml(v.model)}</b><br>
          <span class="interactive-muted">${escapeHtml(v.plate||v.num||'—')}</span><br>
          Состояние: <b>${health}%</b> ${due?'⚠️ Требуется обслуживание':''}
          ${repairText?'<br>'+repairText:''}
        </div>
        <div>${button}</div>
      </div>`;
    }).join('')||'<div class="interactive-muted">Нет ТС.</div>';
  };


  window.serviceVehicleV43=function(id){
    const v=gameState.owned.find(x=>String(x.id)===String(id)); if(!v)return;
    ensureVehicleStats(v);
    const now=Date.now();

    // Если ТС уже ремонтируется — ничего повторно не списываем.
    if(Number(v.repairUntil)>now){
      renderMaintenanceV43();
      return;
    }

    // Стоимость и длительность зависят от степени износа.
    const health=Math.max(0,Math.min(100,Number(v.health)));
    const wear=100-health;
    if(wear<=0){
      v.maintenanceDue=false;
      saveGameState(); renderMaintenanceV43(); renderVehicleStatsV43(); renderDispatcherV43();
      return;
    }

    // Не слишком быстрый износ: ремонт становится заметным только после накопления износа.
    const basePrice=Math.max(150, Number(v.price||0)*0.0009);
    const cost=Math.max(150, Math.round(basePrice*wear/10/50)*50);
    const durationMs=Math.max(5*60*1000, Math.round((wear/100)*90*60*1000));

    if(Number(gameState.balance||0)<cost){
      alert(`Недостаточно денег для ремонта.\n\nСтоимость ремонта: ${money(cost)}\nВаш баланс: ${money(gameState.balance||0)}`);
      return;
    }

    gameState.balance-=cost;
    v.repairStartedAt=now;
    v.repairDurationMs=durationMs;
    v.repairUntil=now+durationMs;
    v.repairCost=cost;
    v.maintenanceDue=false;

    gameState.log=gameState.log||[];
    gameState.log.unshift({
      date:localDateKey(new Date(now)),
      time:new Date(now).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}),
      type:'maintenance',
      total:-cost,
      details:[`🔧 ${v.model||'ТС'} · отправлен на ремонт · состояние ${health.toFixed(0)}% · списано ${money(cost)} · срок ${formatRepairDuration(durationMs)}`]
    });

    saveGameState();
    renderMaintenanceV43(); renderVehicleStatsV43(); renderDispatcherV43();
  };

  function formatRepairDuration(ms){
    const min=Math.max(1,Math.ceil(Number(ms||0)/60000));
    if(min<60) return `${min} мин.`;
    const h=Math.floor(min/60), m=min%60;
    return m ? `${h} ч ${m} мин.` : `${h} ч`;
  }

  window.finishRepairV43=function(id){
    const v=gameState.owned.find(x=>String(x.id)===String(id)); if(!v)return;
    ensureVehicleStats(v);
    if(Number(v.repairUntil)>Date.now()) return;
    if(v.repairStartedAt || v.repairUntil){
      v.repairUntil=0; v.repairStartedAt=0; v.repairCost=0; v.repairDurationMs=0;
      v.health=100; v.maintenanceDue=false;
      saveGameState();
    }
    renderMaintenanceV43(); renderVehicleStatsV43(); renderDispatcherV43();
  };

  window.updateRepairTimersV43=function(){
    let changed=false;
    gameState.owned.forEach(v=>{
      ensureVehicleStats(v);
      if(Number(v.repairUntil)>0 && Date.now()>=Number(v.repairUntil)){
        v.repairUntil=0; v.repairStartedAt=0; v.repairCost=0; v.repairDurationMs=0;
        v.health=100; v.maintenanceDue=false; changed=true;
      }
    });
    if(changed) saveGameState();
    if(document.getElementById('maintenancePanel')) renderMaintenanceV43();
    if(document.getElementById('dispatcherPanel')) renderDispatcherV43();
  };
  setInterval(window.updateRepairTimersV43,1000);

  window.showRouteDetails=function(id){
    const r=gameState.routes.find(x=>String(x.id)===String(id));if(!r)return;
    const ids=Array.isArray(r.vehicleIds)?r.vehicleIds:[];
    const vehicles=gameState.owned.filter(v=>ids.some(x=>String(x)===String(v.id)));
    alert(`Маршрут №${r.number}\\n\\n${r.start||'—'} → ${r.end||'—'}\\nРасстояние: ${r.calculatedDistance?((r.calculatedDistance/1000).toFixed(2)+' км'):'не рассчитано'}\\nВремя: ${r.calculatedDuration?formatDuration(r.calculatedDuration):'не рассчитано'}\\n\\nТС на маршруте: ${vehicles.length?vehicles.map(v=>v.model+' '+(v.plate||v.num||'')).join(', '):'нет'}\\n\\nОбратное направление: ${r.pairedRouteId?'связано':'не связано'}`);
  };

  // More detailed stop/region loading remains lazy: existing region selector is reused.
  window.renderV43Panels=function(){
    renderDispatcherV43();renderVehicleStatsV43();renderMaintenanceV43();
  };

  // Hook into section switching without replacing the existing function.
  const oldShow=window.showGameSection;
  window.showGameSection=function(section,btn){
    oldShow(section,btn);
    if(section==='dispatch'||section==='stats'||section==='maintenance') setTimeout(renderV43Panels,30);
  };

  // Keep state fields initialized.
  const oldLoad=window.loadGameState;
  if(typeof oldLoad==='function'){
    window.loadGameState=function(){oldLoad();gameState.owned.forEach(ensureVehicleStats);saveGameState();}
  }

  setInterval(()=>{ if(typeof gameState!=='undefined' && Array.isArray(gameState.owned)){gameState.owned.forEach(ensureVehicleStats); if(document.getElementById('game-section-dispatch')?.classList.contains('active'))renderDispatcherV43();}},5000);
})();
