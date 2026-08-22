/* ===== Интерактив: транспортный бизнес ===== */
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
            },
            tram: {
                "БКМ 60102": { price: 60000, salary: [7500, 12500] },
                "БКМ 62103": { price: 60000, salary: [7500, 12500] },
                "БКМ 743": { price: 125000, salary: [12500, 17000] },
                "БКМ Т811": { price: 120000, salary: [7500, 12500] },
                "БКМ Т856": { price: 135000, salary: [12500, 17000] }
            }
        };

        let mapState = {
            map: null,
            mode: 'select',
            selectedRouteId: null,
            draftStopIds: [],
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
            depotMarkers: new Map()
        };

        const DEPOTS = {
            bus: { id:'ap5', name:'Автобусный парк №5', address:'ул. Гурского, 15/6', lat:53.882619, lon:27.484127, icon:'🚌' },
            electrobus: { id:'ap5', name:'Автобусный парк №5', address:'ул. Гурского, 15/6', lat:53.882619, lon:27.484127, icon:'⚡' },
            trolleybus: { id:'tp4', name:'Транспортный парк №4', address:'ул. Харьковская, 16', lat:53.9025, lon:27.5186, icon:'🚎' },
            tram: { id:'tram', name:'Трамвайный парк', address:'ул. Ботаническая, 4/2', lat:53.914, lon:27.599, icon:'🚊' }
        };

        let gameState = {
            balance: 50000,
            month: 1,
            lastPayoutDate: null,
            owned: [],
            routes: [],
            log: [],
            serviceCards: []
        };

        function money(v) {
            return Math.round(v).toLocaleString('ru-RU') + ' р.';
        }

        function loadGameState() {
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
            gameState.owned.forEach(v => { if (!v.depot) v.depot = DEPOTS[v.category] ? DEPOTS[v.category].id : 'ap5'; if (!v.plate) v.plate = generateRandomPlate(); });
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
                if (!Object.prototype.hasOwnProperty.call(r, 'terminalStopIds')) r.terminalStopIds = Array.isArray(r.stopIds) ? r.stopIds.slice() : [];
                if (!Object.prototype.hasOwnProperty.call(r, 'turnbackStopIds')) r.turnbackStopIds = [];
                if (!Object.prototype.hasOwnProperty.call(r, 'turnaroundMinutes')) r.turnaroundMinutes = 2;
                if (!Array.isArray(r.stopLegDurations)) r.stopLegDurations = [];
                if (!Array.isArray(r.stopCumulativeDurations)) r.stopCumulativeDurations = [];
            });
            // Исправляем старые сохранения: если время маршрута отсутствует
            // или явно нереалистично относительно расстояния, не используем
            // старый 10–20-минутный fallback. Расчёт будет восстановлен из
            // расстояния до следующего построения маршрута.
            gameState.routes.forEach(r => {
                const sec = Number(r.calculatedDuration);
                const distance = Number(r.calculatedDistance || r.distance * 1000);
                if (Number.isFinite(distance) && distance > 0 && (!Number.isFinite(sec) || sec < 60 || distance / (sec / 3600) > 120)) {
                    r.calculatedDuration = null;
                }
            });
            if (!Array.isArray(gameState.log)) gameState.log = [];
            if (!Array.isArray(gameState.serviceCards)) gameState.serviceCards = [];
            gameState.serviceCards.forEach(c => {
                if (!c.id) c.id = 'card-' + Date.now() + '-' + Math.random().toString(36).slice(2,7);
                c.direction = 'duty';
                if (!Object.prototype.hasOwnProperty.call(c, 'directionGroupId')) c.directionGroupId = null;
                if (!Object.prototype.hasOwnProperty.call(c, 'pairedRouteId')) c.pairedRouteId = null;
                if (!Object.prototype.hasOwnProperty.call(c, 'vehicleId')) c.vehicleId = null;
                if (!Object.prototype.hasOwnProperty.call(c, 'departurePark')) c.departurePark = '';
                if (!Object.prototype.hasOwnProperty.call(c, 'departureStart')) c.departureStart = '';
                if (!Object.prototype.hasOwnProperty.call(c, 'arrivalEnd')) c.arrivalEnd = '';
                if (!Object.prototype.hasOwnProperty.call(c, 'returnPark')) c.returnPark = '';
                if (!Object.prototype.hasOwnProperty.call(c, 'terminalPayouts')) c.terminalPayouts = 0;
                if (!Object.prototype.hasOwnProperty.call(c, 'terminalPayoutLastProcessedAt')) c.terminalPayoutLastProcessedAt = null;
            });
            if (typeof gameState.balance !== 'number' || Number.isNaN(gameState.balance)) {
                gameState.balance = 50000;
            }
            if (!gameState.log.length && !gameState.owned.length && gameState.balance === 0) {
                gameState.balance = 50000;
            }
        }

        function saveGameState() {
            localStorage.setItem('busphoto_interactive_game', JSON.stringify(gameState));
        }

        function startNewGame() {
            const confirmed = confirm(
                'Начать новую игру?\n\n' +
                'Баланс будет установлен на 50 000 р.\n' +
                'Гараж, маршруты и история будут очищены.\n' +
                'Это действие нельзя отменить.'
            );
            if (!confirmed) return;

            localStorage.removeItem('busphoto_interactive_game');
            localStorage.removeItem('minsk_custom_osm_stops_v1');

            gameState = {
                balance: 50000,
                month: 1,
                lastPayoutDate: null,
                owned: [],
                routes: [],
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

        function localDateKey(d = new Date()) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }

        function timeUntilNoonMs() {
            const now = new Date();
            const noon = new Date(now);
            noon.setHours(12, 0, 0, 0);
            if (now >= noon) return 0;
            return noon.getTime() - now.getTime();
        }


        function dateKeyFromDate(d) {
            return localDateKey(d);
        }

        function payoutEligibleDateKey(now = new Date()) {
            const d = new Date(now);
            if (d.getHours() < 12) d.setDate(d.getDate() - 1);
            return localDateKey(d);
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

                    const daily = Math.round(Number(vehicle.currentSalary) / 30);
                    const vehicleTotal = daily * missedDates.length;
                    total += vehicleTotal;

                    details.push(`${vehicle.model}: ${money(daily)} × ${missedDates.length} дн. = ${money(vehicleTotal)}`);
                    vehicle.lastPaidDate = missedDates[missedDates.length - 1];
                });

                if (total > 0) {
                    gameState.balance += total;
                    gameState.log.unshift({
                        date: missedDates[missedDates.length - 1],
                        month: gameState.month,
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
            }

            return total;
        }

        function countTerminalArrivalsBetween(card, route, pair, fromMs, toMs) {
            if (!card || !route || !Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) return 0;

            const win = cardTimeWindow(card);
            if (!win) return 0;

            const dwell1 = Math.max(0, Number(route.turnaroundMinutes || 2));
            const dwell2 = Math.max(0, Number(pair?.turnaroundMinutes || route.turnaroundMinutes || 2));
            const firstDrive = Math.max(1, getRouteDurationMinutes(route));
            const secondDrive = Math.max(1, getRouteDurationMinutes(pair || route));
            const firstDuration = firstDrive + dwell1;
            const secondDuration = secondDrive + dwell2;
            const cycle = firstDuration + secondDuration;

            const from = new Date(fromMs);
            const to = new Date(toMs);
            let totalArrivals = 0;

            // Считаем только те реальные дни, в которые выпуск уже существовал.
            const day = new Date(from);
            day.setHours(0, 0, 0, 0);
            const lastDay = new Date(to);
            lastDay.setHours(0, 0, 0, 0);

            for (let cursor = day; cursor <= lastDay; cursor.setDate(cursor.getDate() + 1)) {
                const dayStart = new Date(cursor);
                dayStart.setHours(0, 0, 0, 0);

                let startMs = dayStart.getTime() + win.start * 60000;
                let endMs = dayStart.getTime() + win.end * 60000;
                if (win.end < win.start) endMs += 24 * 60 * 60 * 1000;

                const intervalStart = Math.max(fromMs, startMs);
                const intervalEnd = Math.min(toMs, endMs);
                if (intervalEnd <= intervalStart) continue;

                const elapsedStart = Math.max(0, (intervalStart - startMs) / 60000);
                const elapsedEnd = Math.max(0, (intervalEnd - startMs) / 60000);

                if (pair) {
                    const countAt = elapsed => {
                        const full = Math.floor(elapsed / cycle);
                        const rem = elapsed - full * cycle;
                        // За полный цикл ТС прибывает на две конечные:
                        // сначала на первую, затем на вторую.
                        return full * 2 + (rem >= firstDuration ? 1 : 0);
                    };
                    totalArrivals += Math.max(0, countAt(elapsedEnd) - countAt(elapsedStart));
                } else {
                    totalArrivals += Math.max(0,
                        Math.floor(elapsedEnd / firstDuration) -
                        Math.floor(elapsedStart / firstDuration)
                    );
                }
            }

            return totalArrivals;
        }

        function processOfflineTerminalPayouts() {
            if (!Array.isArray(gameState.serviceCards) || !gameState.serviceCards.length) return 0;

            const nowMs = Date.now();
            let total = 0;
            let changed = false;

            gameState.serviceCards.forEach(card => {
                if (!card || !card.vehicleId) return;

                const route = getServiceCardRoute(card);
                if (!route) return;

                const pair = route.pairedRouteId
                    ? gameState.routes.find(r => String(r.id) === String(route.pairedRouteId))
                    : null;

                let fromMs = Number(card.terminalPayoutLastProcessedAt);
                if (!Number.isFinite(fromMs) || fromMs <= 0) {
                    // Старые карточки не получают задним числом деньги.
                    // С этого момента они уже работают в оффлайн-режиме.
                    card.terminalPayoutLastProcessedAt = nowMs;
                    if (!Number.isFinite(card.terminalPayouts)) card.terminalPayouts = 0;
                    changed = true;
                    return;
                }

                const arrivals = countTerminalArrivalsBetween(card, route, pair, fromMs, nowMs);
                if (arrivals > 0) {
                    const add = arrivals * 100;
                    total += add;
                    card.terminalPayouts = Number(card.terminalPayouts || 0) + arrivals;
                    gameState.log.unshift({
                        date: localDateKey(),
                        month: gameState.month,
                        total: add,
                        details: [
                            `Карточка №${card.number}: ${arrivals} прибытие(й) на конечную × 100 р.`,
                            `Оффлайн-начисление`
                        ],
                        terminal: true,
                        offline: true
                    });
                    gameState.log = gameState.log.slice(0, 60);
                    changed = true;
                }

                card.terminalPayoutLastProcessedAt = nowMs;
                changed = true;
            });

            if (total > 0) gameState.balance += total;
            if (changed) saveGameState();
            return total;
        }

        function processAllOfflineEarnings() {
            // Сначала фиксируем зарплату, затем отдельный доход за конечные.
            const salary = processGamePayout();
            const terminal = processOfflineTerminalPayouts();
            if (salary || terminal) {
                saveGameState();
                renderInteractive();
            }
            return salary + terminal;
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

        function updateGameModelSelect() {
            const category = document.getElementById('gameCategory').value;
            const select = document.getElementById('gameModel');
            select.innerHTML = '';
            Object.keys(gameCatalog[category]).forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                select.appendChild(option);
            });
            updateGamePurchaseInfo();
        }

        function updateGamePurchaseInfo() {
            const category = document.getElementById('gameCategory').value;
            const model = document.getElementById('gameModel').value;
            const item = gameCatalog[category]?.[model];
            if (!item) return;
            document.getElementById('gamePrice').textContent = money(item.price);
            document.getElementById('gameSalaryRange').textContent =
                `${money(item.salary[0])} — ${money(item.salary[1])}`;
        }

        const PLATE_SECOND_LETTERS = ['І','Е','К','Р','О','С','Н','Т','Х'];
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
            gameState.log.unshift({date:localDateKey(), month:gameState.month, total:-5000, details:[`Изготовление госномера для ${vehicle.model}: ${vehicle.plate}`]});
            gameState.log = gameState.log.slice(0,60);
            saveGameState();
            renderInteractive();
        }

        function buyGameVehicle() {
            const category = document.getElementById('gameCategory').value;
            const model = document.getElementById('gameModel').value;
            const item = gameCatalog[category]?.[model];
            if (!item) return;

            if (gameState.balance < item.price) {
                alert(`Недостаточно денег. Нужно ${money(item.price)}, а на балансе ${money(gameState.balance)}.`);
                return;
            }

            gameState.balance -= item.price;
            gameState.owned.push({
                id: Date.now() + Math.random(),
                category,
                model,
                price: item.price,
                currentSalary: randomSalary(item.salary),
                lastPaidDate: null,
                plate: generateRandomPlate(),
                depot: DEPOTS[category]?.id || 'ap5'
            });
            gameState.log.unshift({
                date: localDateKey(),
                month: gameState.month,
                total: -item.price,
                details: [`Покупка: ${model}`]
            });
            gameState.log = gameState.log.slice(0, 30);

            const bought = gameState.owned[gameState.owned.length - 1];
            saveGameState();
            renderInteractive();
            if (bought && confirm(`ТС куплено. Госномер: ${bought.plate}.\n\nХочешь сразу выбрать свой номер за 5 000 р.?`)) {
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
                month: gameState.month,
                total: vehicle.price,
                details: [`Продажа: ${vehicle.model}`]
            });
            gameState.log = gameState.log.slice(0, 30);
            saveGameState();
            renderInteractive();
            updateMapBusMarkers();
        }

        async function createGameRoute(event) {
            event.preventDefault();
            const number = document.getElementById('routeNumber').value.trim();
            const nameInput = document.getElementById('routeName').value.trim();
            const startInput = document.getElementById('routeStart').value.trim();
            const endInput = document.getElementById('routeEnd').value.trim();
            const type = document.getElementById('routeType')?.value || 'bus';
            const mapStops = getMapStops();
            const draft = Array.isArray(mapState.draftStopIds) ? mapState.draftStopIds.slice() : [];
            const selectedStops = draft.map(id => mapStops.find(s => String(s.id) === String(id))).filter(Boolean);
            let start = startInput, end = endInput;
            let stops = [];
            let stopIds = [];
            if (selectedStops.length >= 2) {
                stops = selectedStops;
                start = selectedStops[0].name;
                end = selectedStops[selectedStops.length - 1].name;
                document.getElementById('routeStart').value = start;
                document.getElementById('routeEnd').value = end;
                document.getElementById('routeStopCount').value = selectedStops.length;
                document.getElementById('routeStops').value = selectedStops.map(s=>s.name).join(', ');
                stopIds = selectedStops.map(s=>s.id);
            } else {
                const startStop = mapStops.find(s => normalizeStopName(s.name) === normalizeStopName(startInput));
                const endStop = mapStops.find(s => normalizeStopName(s.name) === normalizeStopName(endInput));
                if (startStop && endStop) {
                    stops = [startStop, endStop];
                    stopIds = [startStop.id, endStop.id];
                }
            }
            let distance = Number(document.getElementById('routeDistance').value);
            let stopCount = Number(document.getElementById('routeStopCount').value);
            if (!number || !start || !end) { alert('Укажи номер и две конечные остановки.'); return; }
            if (!Number.isFinite(distance)) distance = 0;
            if (!Number.isFinite(stopCount)) stopCount = stops.length || 2;
            const stopsText = stops.length ? stops.map(s=>s.name) : document.getElementById('routeStops').value.split(',').map(s=>s.trim()).filter(Boolean);
            const note = document.getElementById('routeNote').value.trim();
            const route = {
                id: Date.now()+Math.random(), number,
                name: nameInput || `${start} — ${end}`,
                start, end, distance, stopCount,
                stops: stopsText, stopIds, reverseStopIds: stopIds.slice().reverse(),
                color: type==='trolleybus'?'#1565c0':(type==='electrobus'?'#00897b':'#1e88e5'), note,
                routeType: type === 'trolleybus' ? 'trolleybus' : (type === 'electrobus' ? 'electrobus' : 'bus'),
                vehicleId:null, vehicleIds:[], geometry:null, outboundGeometry:null, returnGeometry:null,
                calculatedDistance:null, calculatedDuration:null, createdAt:localDateKey(), source:'manual'
            };
            gameState.routes.push(route);
            mapState.selectedRouteId = route.id;
            if (stopIds.length >= 2) mapState.draftStopIds = stopIds.slice();
            saveGameState();
            renderInteractive(); renderMapRouteControls();
            if (stopIds.length >= 2 && mapState.map) {
                await buildSelectedRoute();
            } else {
                mapSetStatus(`Маршрут №${number} создан. Выбери остановки на карте для построения линии.`);
            }
            event.target.reset();
        }

        function getRouteDirectionOptions(route){
            return gameState.routes.filter(r => r.routeType !== 'tram' && String(r.id)!==String(route.id) && r.routeType===route.routeType)
                .sort((a,b)=>String(a.number).localeCompare(String(b.number),undefined,{numeric:true}));
        }

        function pairGameRoutes(routeId, otherId){
            const a=gameState.routes.find(r=>String(r.id)===String(routeId));
            const b=gameState.routes.find(r=>String(r.id)===String(otherId));
            if(!a || !b || a.id===b.id) return;
            if(a.routeType==='tram' || b.routeType==='tram' || a.routeType!==b.routeType){ alert('Связать можно только автобусные/электробусные или троллейбусные маршруты одного типа.'); return; }
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
            if (route.routeType === 'tram') return false;
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
            ['All','Bus','Trolleybus','Tram'].forEach(x => { const b=document.getElementById('routeFilter'+x); if(b)b.classList.toggle('active', (x==='All'?'all':x.toLowerCase())===type); });
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
            const route = { id:Date.now()+Math.random(), number, name, start:(classicStops[0]||stops[0]).name, end:(classicStops[classicStops.length-1]||stops[stops.length-1]).name, distance:0, stopCount:stops.length, stops:stops.map(s=>s.name), stopIds:ids, terminalStopIds:classicStops.map(s=>s.id), turnbackStopIds:stops.filter(s=>s.stopType==='turnback').map(s=>s.id), turnaroundMinutes:2, color:type==='trolleybus'?'#1565c0':(type==='electrobus'?'#00897b':'#1e88e5'), note:'Создано через карту', routeType:type, busRouteClass:document.getElementById('mapBusRouteClass')?.value||'city', vehicleId:null, vehicleIds:[], geometry:null, outboundGeometry:null, returnGeometry:null, reverseStopIds:ids.slice().reverse(), calculatedDistance:null, calculatedDuration:null, createdAt:localDateKey(), source:'map' };
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
                renderMapDraftInfo();
                renderMapStops();
            }
        }

        function getVehicleRoute(vehicleId) {
            return gameState.routes.find(r => {
                const ids = Array.isArray(r.vehicleIds) ? r.vehicleIds : (r.vehicleId ? [r.vehicleId] : []);
                return ids.some(id => String(id) === String(vehicleId));
            });
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
            gameState.serviceCards = gameState.serviceCards.filter(c => String(c.routeId) !== String(routeId));
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

        function getServiceCardRoute(card) {
            return gameState.routes.find(r => String(r.id) === String(card.routeId)) || null;
        }

        function getServiceCardVehicle(card) {
            return gameState.owned.find(v => String(v.id) === String(card.vehicleId)) || null;
        }

        function createServiceCard(event) {
            event.preventDefault();
            const routeId = document.getElementById('serviceCardRoute')?.value;
            const route = gameState.routes.find(r => String(r.id) === String(routeId));
            if (!route) { alert('Сначала выбери маршрут.'); return; }
            const dep = document.getElementById('serviceCardDeparturePark')?.value;
            const startTime = document.getElementById('serviceCardDepartureStart')?.value;
            const endTime = document.getElementById('serviceCardArrivalEnd')?.value;
            const parkTime = document.getElementById('serviceCardReturnPark')?.value;
            if ([dep,startTime,endTime,parkTime].some(v => parseTimeMinutes(v) == null)) { alert('Заполни все четыре времени.'); return; }
            const tempCard = {departurePark:dep, departureStart:startTime, arrivalEnd:endTime, returnPark:parkTime};
            if (!cardTimeWindow(tempCard)) { alert('Проверь время выезда из парка, отправления, прибытия на конечную и возвращения в парк.'); return; }

            // Нельзя создать карточку с прибытием раньше фактического времени
            // движения по построенному маршруту. Раньше здесь можно было
            // указать условные 10 минут для маршрута на 2 часа и затем ТС
            // визуально «телепортировалось» к конечной.
            const routeMinutes = getRouteDurationMinutes(route);
            const cardStart = parseTimeMinutes(startTime);
            const cardEnd = parseTimeMinutes(endTime);
            if (routeMinutes > 0 && cardStart != null && cardEnd != null) {
                let endAbs = cardEnd;
                if (endAbs <= cardStart) endAbs += 1440;
                const minimumEnd = cardStart + routeMinutes;
                if (endAbs < minimumEnd) {
                    const suggested = addMinutesToClock(startTime, routeMinutes);
                    alert(`Для маршрута №${route.number} расчётное время движения — ${formatDuration(getRouteDurationSeconds(route))}.\n\nПрибытие на конечную не может быть раньше ${suggested}.`);
                    return;
                }
            }

            const vehicleId = document.getElementById('serviceCardVehicle')?.value || null;
            const vehicle = vehicleId ? gameState.owned.find(v => String(v.id) === String(vehicleId)) : null;
            if (vehicle && !vehicleCompatibleWithRoute(vehicle, route)) {
                alert('Выбранное ТС не подходит для этого маршрута.');
                return;
            }
            const card = {
                id:'card-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
                number:document.getElementById('serviceCardNumber').value.trim(),
                routeId:route.id,
                direction:'duty',
                directionGroupId:route.directionGroupId || null,
                pairedRouteId:route.pairedRouteId || null,
                vehicleId:vehicleId,
                departurePark:document.getElementById('serviceCardDeparturePark').value,
                departureStart:document.getElementById('serviceCardDepartureStart').value,
                arrivalEnd:document.getElementById('serviceCardArrivalEnd').value,
                returnPark:document.getElementById('serviceCardReturnPark').value,
                note:document.getElementById('serviceCardNote').value.trim(),
                createdAt:localDateKey(),
                terminalPayouts:0,
                terminalPayoutLastProcessedAt:Date.now()
            };
            gameState.serviceCards.push(card);
            saveGameState();
            event.target.reset();
            renderInteractive();
            mapSetStatus(`Карточка №${card.number} создана.`);
        }

        function deleteServiceCard(cardId) {
            const card = gameState.serviceCards.find(c => String(c.id) === String(cardId));
            if (!card) return;
            if (!confirm(`Удалить карточку №${card.number}?`)) return;
            gameState.serviceCards = gameState.serviceCards.filter(c => String(c.id) !== String(cardId));
            saveGameState();
            renderInteractive();
        }

        function assignVehicleToServiceCard(cardId, vehicleId) {
            const card = gameState.serviceCards.find(c => String(c.id) === String(cardId));
            if (!card) return;
            const route = getServiceCardRoute(card);
            const vehicle = gameState.owned.find(v => String(v.id) === String(vehicleId));
            if (vehicle && route && !vehicleCompatibleWithRoute(vehicle, route)) {
                alert('Это ТС нельзя назначить на выбранный маршрут.');
                renderServiceCards();
                return;
            }
            if (vehicleId) {
                gameState.routes.forEach(r => {
                    if (Array.isArray(r.vehicleIds)) {
                        r.vehicleIds = r.vehicleIds.filter(id => String(id) !== String(vehicleId));
                        r.vehicleId = r.vehicleIds[0] || null;
                    } else if (String(r.vehicleId || '') === String(vehicleId)) {
                        r.vehicleId = null;
                        r.vehicleIds = [];
                    }
                });
            }
            card.vehicleId = vehicleId || null;
            saveGameState();
            renderServiceCards();
            renderRoutes();
            updateMapBusMarkers(true);
        }

        function updateServiceCardDirectionOptions() {
            const routeId = document.getElementById('serviceCardRoute')?.value;
            const route = gameState.routes.find(r => String(r.id) === String(routeId));
            const hint = document.getElementById('serviceCardRouteHint');
            if (hint) {
                if (!route) hint.textContent = 'Выбери маршрут. Если направления связаны, ТС будет работать по обоим автоматически.';
                else if (route.pairedRouteId) {
                    const pair = gameState.routes.find(r => String(r.id) === String(route.pairedRouteId));
                    hint.textContent = pair ? `🔄 Суточный выпуск: №${route.number} ${route.start} → ${route.end} ↔ №${pair.number} ${pair.start} → ${pair.end}` : 'Маршрут связан с обратным направлением.';
                } else {
                    hint.textContent = '⚠️ Обратное направление не связано: ТС будет работать туда/обратно по одной геометрии.';
                }
            }
        }

        function parseTimeMinutes(value) {
            if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
            const [h,m] = value.split(':').map(Number);
            if (h > 23 || m > 59) return null;
            return h * 60 + m;
        }

        function cardTimeWindow(card) {
            let parkDepart = parseTimeMinutes(card.departurePark);
            let start = parseTimeMinutes(card.departureStart);
            let end = parseTimeMinutes(card.arrivalEnd);
            let park = parseTimeMinutes(card.returnPark);
            if (parkDepart == null || start == null || end == null || park == null) return null;
            if (start < parkDepart) start += 1440;
            if (end <= start) end += 1440;
            if (park <= end) park += 1440;
            return { parkDepart, start, end, park };
        }

        function renderServiceCardControls() {
            const routeSelect = document.getElementById('serviceCardRoute');
            const vehicleSelect = document.getElementById('serviceCardVehicle');
            if (!routeSelect || !vehicleSelect) return;
            const routes = gameState.routes.filter(r => r.routeType !== 'tram');
            routeSelect.innerHTML = '<option value="">— Выбери маршрут —</option>' + routes.map(r => {
                const pair = r.pairedRouteId ? gameState.routes.find(p => String(p.id) === String(r.pairedRouteId)) : null;
                const suffix = pair ? ` ↔ №${escapeHtml(pair.number)}` : '';
                return `<option value="${r.id}">№${escapeHtml(r.number)} — ${escapeHtml(r.start)} → ${escapeHtml(r.end)}${suffix}</option>`;
            }).join('');
            vehicleSelect.innerHTML = '<option value="">— Пока не назначать —</option>' + gameState.owned.filter(v => v.category !== 'tram').map(v => `<option value="${v.id}">${vehicleCategoryIcon(v.category)} ${escapeHtml(v.model)} · ${escapeHtml(v.plate || v.num || '—')}</option>`).join('');
            updateServiceCardDirectionOptions();
        }

        function renderServiceCards() {
            const el = document.getElementById('serviceCardsList');
            if (!el) return;
            renderServiceCardControls();
            if (!gameState.serviceCards.length) {
                el.innerHTML = '<div class="interactive-muted">Карточек выезда пока нет. Создай карточку выше.</div>';
                return;
            }
            const sorted = gameState.serviceCards.slice().sort((a,b)=>String(a.number).localeCompare(String(b.number),undefined,{numeric:true}));
            el.innerHTML = sorted.map(card => {
                const route = getServiceCardRoute(card);
                const vehicle = getServiceCardVehicle(card);
                const pair = route?.pairedRouteId ? gameState.routes.find(r=>String(r.id)===String(route.pairedRouteId)) : null;
                const vehicleOptions = gameState.owned.filter(v => v.category !== 'tram' && (!route || vehicleCompatibleWithRoute(v,route))).map(v=>`<option value="${v.id}" ${vehicle && String(vehicle.id)===String(v.id)?'selected':''}>${vehicleCategoryIcon(v.category)} ${escapeHtml(v.model)} · борт. №${escapeHtml(v.num||'—')}</option>`).join('');
                const status = vehicle ? (cardTimeWindow(card) ? '🟢 Суточный выпуск' : '⚠️ Проверь время') : '⏸ ТС не назначено';
                return `<div class="route-card" style="margin-bottom:8px;">
                    <div class="route-card-title"><span>🪪 Карточка №${escapeHtml(card.number)} ${route ? `— №${escapeHtml(route.number)}` : ''}</span><span class="route-badge ${vehicle?'route-running':'route-idle'}">${vehicle ? `${vehicleCategoryIcon(vehicle.category)} ${status}` : status}</span></div>
                    <div class="route-meta">
                        <span>🛣️ ${route ? `№${escapeHtml(route.number)} · ${escapeHtml(route.start)} → ${escapeHtml(route.end)}${pair ? ` ↔ №${escapeHtml(pair.number)} · ${escapeHtml(pair.start)} → ${escapeHtml(pair.end)}` : ''}` : 'Маршрут удалён'}</span>
                        <span>🏢 Выезд из парка: ${escapeHtml(card.departurePark || '—')}</span>
                        <span>🚏 Отправление с начальной: ${escapeHtml(card.departureStart || '—')}</span>
                        <span>🏁 Прибытие на конечную: ${escapeHtml(card.arrivalEnd || '—')}</span>
                        <span>🏢 Прибытие в парк: ${escapeHtml(card.returnPark || '—')}</span>
                    </div>
                    <div class="interactive-muted" style="margin-top:6px;">${pair ? '🔄 ТС автоматически переключается на обратный маршрут на каждой конечной.' : '↔️ Связанного обратного маршрута нет — используется одна линия в двух направлениях.'}</div>
                    <div style="display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;margin-top:7px;">
                        <select class="map-mini-input" onchange="assignVehicleToServiceCard('${card.id}',this.value)"><option value="">— Без ТС —</option>${vehicleOptions}</select>
                        <button class="btn-secondary" onclick="deleteServiceCard('${card.id}')">🗑️ Удалить карточку</button>
                    </div>
                    ${card.note ? `<div class="interactive-muted" style="margin-top:6px;">${escapeHtml(card.note)}</div>` : ''}
                </div>`;
            }).join('');
        }

        function renderServiceCardsForVehicle(vehicleId) {
            return gameState.serviceCards.filter(c => String(c.vehicleId) === String(vehicleId));
        }

        function showVehicleServiceCards(vehicleId) {
            const v=gameState.owned.find(x=>String(x.id)===String(vehicleId));
            if(!v) return;
            const cards=renderServiceCardsForVehicle(vehicleId);
            alert(cards.length ? `Карточки ТС ${v.model} · ${v.num || '—'}\n\n`+cards.map(c=>`№${c.number}: ${c.departurePark} → ${c.departureStart} → ${c.arrivalEnd} → ${c.returnPark}`).join('\n') : `У ТС ${v.model} пока нет назначенных карточек.`);
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
            syncAllRouteMetadata();
            renderServiceCards();

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
                list.innerHTML = `<div class="interactive-muted">Маршрутов пока нет. Создай первый маршрут выше.</div>`;
                return;
            }

            const visibleRoutes = gameState.routes.filter(route => route.routeType !== 'tram' && (mapState.routeTypeFilter === 'all' || route.routeType === mapState.routeTypeFilter));
            list.innerHTML = visibleRoutes.map(route => {
                const ids = Array.isArray(route.vehicleIds) ? route.vehicleIds : (route.vehicleId ? [route.vehicleId] : []);
                const assignedVehicles = gameState.owned.filter(v => ids.some(id => String(id) === String(v.id)));

                return `
                    <div class="route-card">
                        <div class="route-card-title">
                            <span>🛣️ №${route.number} — ${escapeHtml(route.name)} <span class="route-type-badge">${routeTypeLabel(route.routeType)}</span></span>
                            <span class="route-badge ${assignedVehicles.length ? 'route-running' : 'route-idle'}">
                                ${assignedVehicles.length ? `${assignedVehicles.map(v=>vehicleCategoryIcon(v.category)).join('')} ${assignedVehicles.length} ТС на линии` : '⏸ Без ТС'}
                            </span>
                        </div>
                        <div class="route-meta">
                            <span>${escapeHtml(route.start)} → ${escapeHtml(route.end)}</span><span>🏢 ${escapeHtml(DEPOTS[route.routeType==='trolleybus'?'trolleybus':'bus'].name)}</span>
                            <span>📏 ${route.calculatedDistance ? (route.calculatedDistance / 1000).toFixed(2) : route.distance} км</span>
                            <span>🚏 ${route.stopIds?.length || route.stopCount} остановок</span>
                            ${route.calculatedDuration ? `<span>⏱️ ${formatDuration(route.calculatedDuration)}</span>` : ''}
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;font-size:10px;">
                            <span>🎨 Цвет:</span>
                            <input type="color" value="${routeColor(route)}" onchange="changeRouteColor('${route.id}', this.value)" style="width:42px;height:24px;padding:1px;">
                            <button class="btn-secondary" onclick="openRouteOnMap('${route.id}')">🗺️ Открыть на карте</button> <button class="btn-secondary" onclick="showRouteVehicles('${route.id}')">🚍 ТС на маршруте</button>
                        </div>
                        <div class="route-stops">
                            <b>Остановочные пункты:</b> ${Array.isArray(route.stops) && route.stops.length ? route.stopIds.map((id,i)=>{ const st=getMapStops().find(x=>String(x.id)===String(id)); return `${escapeHtml(route.stops[i] || '')}${st?.stopType==='turnback'?' 🔄':''}`; }).join(' → ') : 'не указаны'}
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
                            <span class="interactive-muted">Выбрано: ${assignedVehicles.length} ТС · 🪪 Карточек: ${gameState.serviceCards.filter(c=>String(c.routeId)===String(route.id)).length}</span>
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

        function mapSetStatus(text) {
            const el = document.getElementById('mapStatus');
            if (el) el.textContent = text;
        }

        function initRouteMap() {
            if (mapState.initialized) {
                setTimeout(() => mapState.map.invalidateSize(), 80);
                return;
            }
            if (typeof L === 'undefined') {
                mapSetStatus('Не удалось загрузить Leaflet.');
                return;
            }

            mapState.map = L.map('routeMap', { zoomControl: true, preferCanvas: true }).setView(MINskMapCenter, 11);

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

            setTimeout(() => mapState.map.invalidateSize({pan:false}), 100);
            startMapBusAnimation();
        }

        function setMapMode(mode) {
            mapState.mode = mode;
            document.querySelectorAll('.map-mode button').forEach(b => b.classList.remove('active'));
            const btn = document.getElementById(
                mode === 'select' ? 'mapModeSelect' :
                mode === 'add' ? 'mapModeAdd' :
                mode === 'route' ? 'mapModeRoute' : 'mapModeVehicles'
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

        let mapStopsCache = null;
let mapStopsCacheKey = '';
function getMapStops() {
            const key = localStorage.getItem('minsk_custom_osm_stops_v1') || '[]';
            if (mapStopsCache && mapStopsCacheKey === key) return mapStopsCache;
            let raw = [];
            try { raw = JSON.parse(key); } catch(e) { raw = []; }
            // Дедупликация выполняется только при чтении нового содержимого.
            // Раньше она запускалась при каждом перерисовывании карты и сильно
            // тормозила карту при сотнях/тысячах остановок.
            const cleaned = dedupeMapStops(raw);
            if (cleaned.length !== raw.length) {
                localStorage.setItem('minsk_custom_osm_stops_v1', JSON.stringify(cleaned));
            }
            mapStopsCache = cleaned;
            mapStopsCacheKey = JSON.stringify(cleaned);
            return mapStopsCache;
        }

        function saveMapStops(stops) {
            const payload = JSON.stringify(stops);
            localStorage.setItem('minsk_custom_osm_stops_v1', payload);
            mapStopsCache = Array.isArray(stops) ? stops : [];
            mapStopsCacheKey = payload;
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
            return visible.slice(0, 600);
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
            const clusterAtZoom = zoom < 16;
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

            // На большом масштабе показываем реальные точки, но только в видимой области.
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

            const q = (document.getElementById('mapStopSearch')?.value || '').toLowerCase().trim();
            const stops = getMapStops()
                .filter(s => !q || s.name.toLowerCase().includes(q))
                .slice(0, 150);

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
            }
            renderMapDraftInfo();
            mapSetStatus(`Добавлена остановка №${mapState.draftStopIds.length}: ${stop.name}`);
        }

        function removeDraftStop(index) {
            mapState.draftStopIds.splice(index, 1);
            renderMapDraftInfo();
        }

        function clearRouteDraft() {
            mapState.draftStopIds = [];
            renderMapDraftInfo();
            mapSetStatus('Точки маршрута очищены');
        }

        function renderMapDraftInfo() {
            const el = document.getElementById('mapDraftInfo');
            if (!el) return;
            const stops = getMapStops();
            const names = mapState.draftStopIds
                .map(id => stops.find(s => String(s.id) === String(id)))
                .filter(Boolean)
                .map((s, i) => `${i + 1}. ${escapeHtml(s.name)}`);

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

        async function loadAllMinskStops() {
            if (!mapState.map) return;
            mapSetStatus('Загружаю остановки Минска и Минского района…');
            const endpoints = [
                'https://overpass-api.de/api/interpreter',
                'https://overpass.kumi.systems/api/interpreter'
            ];
            const areaQuery = `
[out:json][timeout:120];
(
  area["boundary"="administrative"]["name"="Минск"];
  area["boundary"="administrative"]["name:ru"="Минск"];
)->.minskAreas;
(
  area["boundary"="administrative"]["name"="Минский район"];
  area["boundary"="administrative"]["name:ru"="Минский район"];
)->.districtAreas;
(
  nwr["highway"="bus_stop"](area.minskAreas);
  nwr["public_transport"="platform"](area.minskAreas);
  nwr["public_transport"="stop_position"](area.minskAreas);
  nwr["highway"="bus_stop"](area.districtAreas);
  nwr["public_transport"="platform"](area.districtAreas);
  nwr["public_transport"="stop_position"](area.districtAreas);
);
out center tags;`;
            let lastError = null;
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:areaQuery});
                    if (!response.ok) throw new Error('HTTP '+response.status);
                    const data = await response.json();
                    const existing = getMapStops();
                    const incoming = [];
                    for (const e of data.elements || []) {
                        const tags = e.tags || {};
                        if (tags.railway || tags.station === 'subway' || tags.subway === 'yes' || tags.public_transport === 'station' || tags.amenity === 'ferry_terminal' || tags.route === 'tram') continue;
                        const lat = Number(e.lat ?? e.center?.lat), lon = Number(e.lon ?? e.center?.lon);
                        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
                        incoming.push({id:`osm-${e.type}-${e.id}`,name:tags.name || tags['name:ru'] || tags['name:be'] || 'Остановка без названия',lat,lon,source:'osm',tags});
                    }
                    // Полностью пересобираем OSM-слой, сохраняя пользовательские остановки.
                    const custom = existing.filter(s => s.source === 'custom');
                    const cleaned = dedupeMapStops(custom.concat(incoming));
                    saveMapStops(cleaned);
                    mapState.osmStopsLoaded = true;
                    renderMapStops();
                    mapSetStatus(`Готово: ${incoming.length} объектов OSM → ${cleaned.length} уникальных остановок.`);
                    return;
                } catch (err) {
                    console.warn('Overpass endpoint failed', endpoint, err);
                    lastError = err;
                }
            }
            console.error(lastError);
            mapSetStatus('Не удалось загрузить остановки OSM.');
            alert('Не удалось загрузить остановки. Попробуй ещё раз: сервер Overpass может быть временно перегружен.');
        }

        function clearAllMapStops() {
            const count = getMapStops().length;
            if (!count) { mapSetStatus('Остановок для удаления нет.'); return; }
            if (!confirm(`Удалить ВСЕ ${count} остановок с карты?\n\nЭто удалит и остановки OSM, и созданные вручную. Маршруты не удаляются автоматически.`)) return;
            localStorage.removeItem('minsk_custom_osm_stops_v1');
            mapStopsCache = [];
            mapStopsCacheKey = '[]';
            mapState.stopMarkers.forEach(m => m.remove());
            mapState.stopMarkers.clear();
            mapState.draftStopIds = [];
            mapState.osmStopsLoaded = false;
            renderMapStops();
            renderMapDraftInfo();
            renderMapStopList();
            mapSetStatus('Все остановки удалены. Теперь можно загрузить их заново.');
        }

        async function loadOsmTramRoutes() {
            mapSetStatus('Загружаю трамвайные маршруты OSM…');
            const query=`[out:json][timeout:90];area["name"="Минск"]["boundary"="administrative"]->.minsk;relation["type"="route"]["route"="tram"](area.minsk);out tags geom;`;
            try{ const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:query}); if(!r.ok)throw new Error('HTTP '+r.status); const d=await r.json(); let added=0;
                const allStops=getMapStops(); const byName=new Map(allStops.map(x=>[String(x.name).toLowerCase(),x]));
                for(const rel of d.elements||[]){ const ref=rel.tags?.ref||rel.tags?.name?.match(/\d+/)?.[0]; if(!ref)continue; const name=rel.tags?.name||`Трамвай №${ref}`; let coords=[]; const routeStops=[]; for(const m of rel.members||[]){ if(Array.isArray(m.geometry)) coords.push(...m.geometry.map(p=>[p.lon,p.lat])); if(m.type==='node' && (m.role==='stop' || m.role==='platform' || m.tags?.public_transport==='platform' || m.tags?.railway==='tram_stop')){ const lat=Number(m.lat),lon=Number(m.lon),nm=m.tags?.name||m.tags?.['name:ru']||m.tags?.['name:be']; if(Number.isFinite(lat)&&Number.isFinite(lon)){ let st=nm?byName.get(nm.toLowerCase()):null; if(!st){st={id:'osm-tram-stop-'+m.id,name:nm||'Трамвайная остановка',lat,lon,source:'osm',tags:m.tags||{railway:'tram_stop'}}; byName.set(st.name.toLowerCase(),st); allStops.push(st);} routeStops.push(st); } } } if(coords.length<2)continue; const existing=gameState.routes.find(x=>x.source==='osm-tram'&&String(x.number)===String(ref)); const obj=existing||{id:'osm-tram-'+ref+'-'+Date.now(),number:String(ref),name,start:'',end:'',distance:0,stopCount:0,stops:[],stopIds:[],color:'#8e44ad',note:'Загружено из OpenStreetMap',routeType:'tram',vehicleId:null,vehicleIds:[],geometry:null,outboundGeometry:null,returnGeometry:null,calculatedDistance:null,calculatedDuration:null,createdAt:localDateKey(),source:'osm-tram'}; obj.name=name; obj.routeType='tram'; obj.geometry={type:'LineString',coordinates:coords}; obj.stopIds=routeStops.map(x=>x.id); obj.stops=routeStops.map(x=>x.name); obj.stopCount=routeStops.length; obj.start=routeStops[0]?.name||''; obj.end=routeStops[routeStops.length-1]?.name||''; if(!existing){gameState.routes.push(obj);added++;} }
                saveMapStops(allStops);
                saveGameState(); renderInteractive(); renderMapRouteControls(); renderMapRouteLayers(); mapSetStatus(`Трамвайных маршрутов добавлено: ${added}`);
            }catch(e){console.error(e);mapSetStatus('Не удалось загрузить трамвайные маршруты OSM.');}
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
            const visibleRoutes = gameState.routes.filter(r => r.routeType !== 'tram' && (mapState.routeTypeFilter === 'all' || r.routeType === mapState.routeTypeFilter));
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
                    renderMapDraftInfo();
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
            const points = mapState.draftStopIds
                .map(id => stops.find(s => String(s.id) === String(id)))
                .filter(Boolean);

            if (points.length < 2) {
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
                const classicStops = points.filter(s => s.stopType !== 'turnback');
                const terminalStops = classicStops.length >= 2 ? classicStops : points;
                route.terminalStopIds = terminalStops.map(s => s.id);
                route.turnbackStopIds = points.filter(s => s.stopType === 'turnback').map(s => s.id);
                route.start = terminalStops[0].name;
                route.end = terminalStops[terminalStops.length - 1].name;
                route.stops = points.map(s => s.name);
                route.calculatedDistance = result.distance;
                // OSRM возвращает отдельный leg для каждой пары соседних остановок.
                // Сохраняем эти времена, чтобы карточка могла мгновенно вычислять
                // поездку не только до конечной, но и до любой остановки маршрута.
                const legs = Array.isArray(result.legs) ? result.legs : [];
                route.stopLegDurations = legs.map(l => Math.max(0, Number(l.duration) || 0));
                route.stopLegDistances = legs.map(l => Math.max(0, Number(l.distance) || 0));
                route.stopCumulativeDurations = [0];
                route.stopCumulativeDistances = [0];
                for (let li = 0; li < legs.length; li++) {
                    route.stopCumulativeDurations.push(route.stopCumulativeDurations[li] + route.stopLegDurations[li]);
                    route.stopCumulativeDistances.push(route.stopCumulativeDistances[li] + route.stopLegDistances[li]);
                }

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
                const depot = DEPOTS[route.routeType === 'tram' ? 'tram' : route.routeType === 'trolleybus' ? 'trolleybus' : 'bus'];
                const first = points[0], last = points[points.length-1];
                try {
                    const outUrl = `https://router.project-osrm.org/route/v1/driving/${depot.lon},${depot.lat};${first.lon},${first.lat}?overview=full&geometries=geojson`;
                    const retUrl = `https://router.project-osrm.org/route/v1/driving/${last.lon},${last.lat};${depot.lon},${depot.lat}?overview=full&geometries=geojson`;
                    const [outR, retR] = await Promise.all([fetch(outUrl), fetch(retUrl)]);
                    if (outR.ok) { const od=await outR.json(); route.outboundGeometry=od.routes?.[0]?.geometry||null; }
                    if (retR.ok) { const rd=await retR.json(); route.returnGeometry=rd.routes?.[0]?.geometry||null; }
                } catch(e) { console.warn('Не удалось построить подъезд к парку',e); }
                route.routeType = route.routeType || 'bus';
                // Всегда сохраняем реальное время OSRM. Оно является источником
                // истины для движения ТС, расписания и офлайн-начислений.
                if (Number.isFinite(Number(result.duration)) && Number(result.duration) > 0) {
                    if (!route.calculatedDuration || Number(route.calculatedDuration) < Number(result.duration) * 0.25) {
                        route.calculatedDuration = Number(result.duration);
                    }
                }
                route.stopIds = points.map(s => s.id);
                route.stopCount = points.length;
                route.start = terminalStops[0].name;
                route.end = terminalStops[terminalStops.length - 1].name;

                // Save immediately so a reload does not lose the calculated geometry.
                saveGameState();
                renderMapRouteLayers();
                renderMapRouteList();
                renderRoutes();

                mapSetStatus(`Готово: ${(route.calculatedDistance / 1000).toFixed(2)} км · ${formatDuration(getRouteDurationSeconds(route))}`);
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
            return category === 'tram' ? '🚊' : category === 'trolleybus' ? '🚎' : category === 'electrobus' ? '⚡' : '🚌';
        }

        function createBusIcon(label, routeColorValue, category = 'bus') {
            const safeLabel = escapeHtml(label || 'ТС');
            const color = routeColorValue || '#e53935';
            const icon = category === 'tram' ? '🚊' : category === 'trolleybus' ? '🚎' : category === 'electrobus' ? '⚡' : '🚌';
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
            const d = new Date();
            return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
        }

        function getActiveServiceCardForVehicle(vehicleId) {
            const cards = gameState.serviceCards.filter(c => String(c.vehicleId) === String(vehicleId));
            if (!cards.length) return null;
            const now = getCurrentMinutesOfDay();
            let active = null;
            let bestStart = -Infinity;
            cards.forEach(card => {
                const win = cardTimeWindow(card);
                if (!win) return;
                let cur = now;
                if (cur < win.parkDepart) cur += 1440;
                if (cur >= win.parkDepart && cur <= win.park && win.parkDepart >= bestStart) {
                    active = { card, win, now: cur };
                    bestStart = win.parkDepart;
                }
            });
            return active;
        }

        function terminalPayoutKey(card) { return String(card.id || card.number || 'card'); }
        function processTerminalArrivals(card, route, pair, win, nowAbs) {
            if (!card || !route) return;

            // Начисление идёт по фактическим моментам прибытия и использует
            // один общий timestamp с офлайн-начислением. Поэтому:
            // 1) одно прибытие = ровно +100 ₽;
            // 2) повторные кадры карты не дают дубль;
            // 3) закрытие страницы не теряет начисления.
            const nowMs = Date.now();
            let fromMs = Number(card.terminalPayoutLastProcessedAt);

            if (!Number.isFinite(fromMs) || fromMs <= 0) {
                card.terminalPayoutLastProcessedAt = nowMs;
                if (!Number.isFinite(card.terminalPayouts)) card.terminalPayouts = 0;
                saveGameState();
                return;
            }

            if (nowMs <= fromMs) return;

            const arrivals = countTerminalArrivalsBetween(card, route, pair, fromMs, nowMs);
            if (arrivals > 0) {
                const add = arrivals * 100;
                card.terminalPayouts = Number(card.terminalPayouts || 0) + arrivals;
                gameState.balance += add;
                gameState.log.unshift({
                    date: localDateKey(),
                    month: gameState.month,
                    total: add,
                    details: [`Карточка №${card.number}: ${arrivals} прибытие(й) на конечную × 100 р.`],
                    terminal: true
                });
                gameState.log = gameState.log.slice(0, 60);
            }

            card.terminalPayoutLastProcessedAt = nowMs;
            if (arrivals > 0) {
                saveGameState();
                renderInteractive();
            }
        }

        // Единый расчёт времени движения по маршруту.
        // Старые маршруты могли иметь distance, но не иметь calculatedDuration,
        // из-за чего старый код подставлял 1200 секунд (20 минут) даже для
        // междугороднего маршрута на сотни километров. Это и давало движение
        // «за 10–20 минут» вместо реального времени.
        function getRouteDurationSeconds(route) {
            if (!route) return 0;
            const raw = Number(route.calculatedDuration);
            const distance = Number(route.calculatedDistance || route.distance * 1000);

            // Нормальный результат роутера используем как есть.
            if (Number.isFinite(raw) && raw >= 60) {
                if (!Number.isFinite(distance) || distance <= 0) return raw;
                const km = distance / 1000;
                const speedKmh = km / (raw / 3600);
                // Если сохранённое время физически невозможно для автобуса,
                // считаем его повреждённым и используем безопасную оценку.
                if (speedKmh <= 120) return raw;
            }

            if (!Number.isFinite(distance) || distance <= 0) return 0;

            // Запасной расчёт для старых маршрутов без времени: городской
            // транспорт 35 км/ч, пригородный 55 км/ч, междугородний 70 км/ч.
            // Это только fallback — после нового построения используется OSRM.
            const typeText = String(route.routeType || '').toLowerCase();
            const nameText = `${route.name || ''} ${route.note || ''}`.toLowerCase();
            let speed = 35;
            if (nameText.includes('межгород') || nameText.includes('междугород') || nameText.includes('intercity')) speed = 70;
            else if (nameText.includes('пригород') || nameText.includes('suburban')) speed = 55;
            return Math.max(60, distance / (speed / 3.6));
        }

        function getRouteDurationMinutes(route) {
            const sec = getRouteDurationSeconds(route);
            return sec > 0 ? Math.ceil(sec / 60) : 0;
        }

        function addMinutesToClock(time, minutes) {
            const base = parseTimeMinutes(time);
            if (base == null || !Number.isFinite(minutes)) return time || '';
            const total = (base + Math.round(minutes)) % 1440;
            const h = Math.floor(total / 60);
            const m = total % 60;
            return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        }

        function getServiceCardPosition(card, route, pair, win, nowAbs) {
            const vehicle = getServiceCardVehicle(card);
            const depot = depotForVehicle(vehicle);

            if (nowAbs < win.parkDepart) {
                return { point:[depot.lat,depot.lon], phase:'в парке, ожидает выезд' };
            }

            // Выезд из парка -> начальная остановка.
            if (nowAbs < win.start) {
                const span = Math.max(1, win.start - win.parkDepart);
                const q = Math.max(0, Math.min(1, (nowAbs - win.parkDepart) / span));
                if (route.outboundGeometry) {
                    return { point:pathPointFromGeometry(route.outboundGeometry,q), phase:`едет из парка к начальной №${route.number}` };
                }
                return { point:[depot.lat,depot.lon], phase:'выезжает из парка' };
            }

            // Работа на линии целый день. Движение непрерывное, а на конечной есть
            // короткая стоянка/разворот. Пункт разворота не считается конечной.
            if (nowAbs < win.end) {
                const firstGeom = route.geometry;
                if (!firstGeom) return { point:[depot.lat,depot.lon], phase:'ожидает построения маршрута' };
                const firstDrive = Math.max(1, getRouteDurationMinutes(route));
                const secondDrive = Math.max(1, getRouteDurationMinutes(pair || route));
                const dwell1 = Math.max(0, Number(route.turnaroundMinutes || 2));
                const dwell2 = Math.max(0, Number(pair?.turnaroundMinutes || route.turnaroundMinutes || 2));
                const a = firstDrive + dwell1;
                const b = secondDrive + dwell2;
                const cycle = Math.max(0.1, a + b);
                const elapsed = Math.max(0, nowAbs - win.start);
                const phase = elapsed % cycle;
                if (phase < firstDrive) {
                    return { point:pathPointFromGeometry(firstGeom, Math.max(0, Math.min(1, phase / firstDrive))), phase:`на маршруте №${route.number} →` };
                }
                if (phase < a) {
                    return { point:pathPointFromGeometry(firstGeom, 1), phase:`⏸ стоянка на конечной №${route.number}` };
                }
                const secondGeom = pair?.geometry || route.geometry;
                const secondPhase = phase - a;
                if (secondPhase < secondDrive) {
                    return { point:pathPointFromGeometry(secondGeom, Math.max(0, Math.min(1, secondPhase / secondDrive))), phase:pair ? `на маршруте №${pair.number} ←` : `на маршруте №${route.number} ←` };
                }
                return { point:pathPointFromGeometry(secondGeom, 1), phase:`⏸ стоянка на конечной ${pair ? '№'+pair.number : '№'+route.number}` };
            }

            // После последнего прибытия на конечную ТС возвращается в парк.
            if (nowAbs <= win.park) {
                const span = Math.max(1, win.park - win.end);
                const q = Math.max(0, Math.min(1, (nowAbs - win.end) / span));
                const returnGeom = pair?.returnGeometry || route.returnGeometry;
                if (returnGeom) return { point:pathPointFromGeometry(returnGeom,q), phase:'возвращается в парк' };
                return { point:[depot.lat,depot.lon], phase:'возвращается в парк' };
            }
            return { point:[depot.lat,depot.lon], phase:'в парке' };
        }

        function updateMapBusMarkers(forceVehicleMode = false) {
            if (!mapState.map) return;
            const activeKeys = new Set();
            const vehicles = gameState.owned.filter(v => v.category !== 'tram');
            const assignedByCard = new Set(gameState.serviceCards.filter(c => c.vehicleId).map(c => String(c.vehicleId)));

            vehicles.forEach(vehicle => {
                const active = getActiveServiceCardForVehicle(vehicle.id);
                let route = null;
                let pair = null;
                let position = null;
                let cardLabel = '';

                if (active) {
                    route = getServiceCardRoute(active.card);
                    if (route) {
                        pair = route.pairedRouteId ? gameState.routes.find(r => String(r.id) === String(route.pairedRouteId)) : null;
                        processTerminalArrivals(active.card, route, pair, active.win, active.now);
                        position = getServiceCardPosition(active.card, route, pair, active.win, active.now);
                        cardLabel = `<br>🪪 Карточка №${escapeHtml(active.card.number)}`;
                    }
                } else if (assignedByCard.has(String(vehicle.id))) {
                    // ТС с карточкой, но вне её рабочего окна — находится в парке.
                    const cards = gameState.serviceCards.filter(c => String(c.vehicleId) === String(vehicle.id));
                    const card = cards[0];
                    const route0 = getServiceCardRoute(card);
                    const depot = depotForVehicle(vehicle);
                    if (route0) {
                        route = route0;
                        pair = route.pairedRouteId ? gameState.routes.find(r => String(r.id) === String(route.pairedRouteId)) : null;
                        position = { point:[depot.lat,depot.lon], phase:'в парке / вне времени карточки' };
                        cardLabel = `<br>🪪 Карточка №${escapeHtml(card.number)}`;
                    }
                } else {
                    // Старый режим оставляем как резервный: ТС без карточки может быть
                    // назначено непосредственно на маршрут.
                    const fallbackRoute = getVehicleRoute(vehicle.id);
                    if (fallbackRoute && fallbackRoute.geometry) {
                        route = fallbackRoute;
                        pair = route.pairedRouteId ? gameState.routes.find(r => String(r.id) === String(route.pairedRouteId)) : null;
                        const now = Date.now();
                        const depot = depotForVehicle(vehicle);
                        const durationSeconds = getRouteDurationSeconds(route);
                         const duration = Math.max(60000, (durationSeconds || 60) * 1000);
                        const t = (now % (duration * 2)) / (duration * 2);
                        const p = t < 0.5 ? pathPointFromGeometry(route.geometry,t*2) : pathPointFromGeometry(pair?.geometry || route.geometry, (t-0.5)*2);
                        position = { point:p || [depot.lat,depot.lon], phase: t < 0.5 ? `на маршруте №${route.number} →` : `на маршруте №${pair?.number || route.number} ←` };
                    }
                }

                if (!route || !position) return;
                if (mapState.mode === 'vehicles' && mapState.routeTypeFilter !== 'all' && route.routeType !== mapState.routeTypeFilter) return;

                const key = `vehicle:${vehicle.id}`;
                activeKeys.add(key);
                const marker = mapState.busMarkers.get(key) || L.marker(position.point,{icon:createBusIcon(`№${route.number}`,routeColor(route),vehicle.category),zIndexOffset:1000}).addTo(mapState.map);
                marker.setLatLng(position.point);
                const depot = depotForVehicle(vehicle);
                // Popup обновляем только при изменении текста, а не создаём заново каждый кадр.
                const pairText = pair ? `<br>Обратное направление: <b>№${escapeHtml(pair.number)}</b>` : '';
                const popupHtml = `<b>${escapeHtml(depot.icon)} ${escapeHtml(vehicle.model)}</b><br>Госномер: <b>${escapeHtml(vehicle.plate || vehicle.num || '—')}</b><br>Маршрут: <b>№${escapeHtml(route.number)}</b>${pairText}${cardLabel}<br>Парк: ${escapeHtml(depot.name)}<br><span style="font-weight:bold;">● ${escapeHtml(position.phase)}</span>`;
                if (forceVehicleMode !== true && marker._popupHtml !== popupHtml) { marker.setPopupContent(popupHtml); marker._popupHtml = popupHtml; }
                else if (!marker._popupHtml) { marker.setPopupContent(popupHtml); marker._popupHtml = popupHtml; }
                mapState.busMarkers.set(key, marker);
            });

            mapState.busMarkers.forEach((marker,key)=>{if(!activeKeys.has(key)){marker.remove();mapState.busMarkers.delete(key);}});
            if (!forceVehicleMode) renderMapBusList();
        }

        function renderMapBusList() {
            const el = document.getElementById('mapBusList');
            if (!el) return;
            const rows = [];
            gameState.routes.forEach(route => {
                const vehicles = getAssignedVehiclesForRoute(route);
                vehicles.forEach(vehicle => {
                    rows.push(`${route.id}|${vehicle.id}|${vehicle.model}|${vehicle.num || ''}|${route.number}|${route.name}|${vehicle.category}`);
                });
            });
            const signature = rows.join('\\n');
            if (signature === mapState.busListSignature) return;
            mapState.busListSignature = signature;
            el.innerHTML = rows.length ? rows.map(row => {
                const [routeId, vehicleId, model, num, number, name, category] = row.split('|');
                return `<div class="map-route-item" onclick="focusMapBus('${routeId}','${vehicleId}')">
                    <div><b>${vehicleCategoryIcon(category)} ${escapeHtml(model)}</b> · борт. ${escapeHtml(num || '—')}</div>
                    <div class="map-help">Маршрут №${escapeHtml(number)} — ${escapeHtml(name)} · <span style="color:#28a745">● на линии</span></div>
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
                // На каждом кадре двигаем только существующие маркеры.
                // Списки, popup и DOM-панели не перерисовываются.
                updateMapBusMarkers(true);
                mapState.busAnimationFrame = requestAnimationFrame(loop);
            };
            mapState.busAnimationFrame = requestAnimationFrame(loop);
        }
        function stopMapBusAnimation() {
            if (mapState.busAnimationFrame) cancelAnimationFrame(mapState.busAnimationFrame);
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

                layer.bindPopup(`<b>№${escapeHtml(route.number)} — ${escapeHtml(route.name)}</b><br>${route.calculatedDistance ? (route.calculatedDistance / 1000).toFixed(2) + ' км' : 'Расстояние не рассчитано'}`);
                mapState.routeLayers.set(String(route.id), layer);
            });
            updateMapBusMarkers();
        }

        function renderMapRouteList() {
            const el = document.getElementById('mapRouteList');
            if (!el) return;

            const visibleRoutes = gameState.routes.filter(r => r.routeType !== 'tram' && (mapState.routeTypeFilter === 'all' || r.routeType === mapState.routeTypeFilter));
            el.innerHTML = visibleRoutes.length ? visibleRoutes.map(route => `
                <div class="map-route-item" onclick="selectRouteForMap('${route.id}')">
                    <div>
                        <span class="map-route-line" style="background:${routeColor(route)}"></span>
                        <b>№${escapeHtml(route.number)}</b> — ${escapeHtml(route.name)} <span class="route-type-badge">${routeTypeLabel(route.routeType)}</span>
                    </div>
                    <div class="map-help">
                        ${route.calculatedDistance ? (route.calculatedDistance / 1000).toFixed(2) + ' км' : 'нет расчёта'}
                        · ${route.stopIds?.length || 0} остановок
                        · ${(Array.isArray(route.vehicleIds) ? route.vehicleIds.length : (route.vehicleId ? 1 : 0))} ТС
                    </div>
                </div>
            `).join('') : '<div class="map-help">Маршрутов пока нет. Создай их в разделе «Маршруты».</div>';
        }

        function escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function renderMapIfReady() {
            if (!document.getElementById('routeMap')) return;
            initRouteMap();
            renderMapRouteControls();
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
                else if (section === 'cards') renderServiceCards();
                else renderInteractiveHeaderAndLightViews();
            }
        }

        function renderInteractiveHeaderAndLightViews() {
            const balance = document.getElementById('gameBalance');
            if (!balance) return;
            balance.textContent = money(gameState.balance);
            document.getElementById('gameMonth').textContent = gameState.month;
            document.getElementById('ownedCount').textContent = gameState.owned.length;
            const badge = document.getElementById('gameClockBadge');
            if (badge) {
                const now = new Date();
                badge.textContent = now.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'}) +
                    (now.getHours() >= 12 ? ' • начисление сегодня выполнено/ожидается' : ' • следующее начисление в 12:00');
            }
        }

        function renderInteractive() {
            const balance = document.getElementById('gameBalance');
            if (!balance) return;

            document.getElementById('gameBalance').textContent = money(gameState.balance);
            document.getElementById('gameMonth').textContent = gameState.month;
            document.getElementById('ownedCount').textContent = gameState.owned.length;

            const now = new Date();
            const badge = document.getElementById('gameClockBadge');
            badge.textContent = now.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'}) +
                (now.getHours() >= 12 ? ' • начисление сегодня выполнено/ожидается' : ' • следующее начисление в 12:00');

            updateGameModelSelect();

            const body = document.getElementById('ownedVehiclesBody');
            if (!gameState.owned.length) {
                body.innerHTML = `<tr><td colspan="4" class="interactive-muted">Пока нет купленного транспорта.</td></tr>`;
            } else {
                body.innerHTML = gameState.owned.map(v => `
                    <tr>
                        <td>${v.model}</td>
                        <td>${money(v.price)}</td>
                        <td>${v.currentSalary ? money(v.currentSalary) : '—'}</td>
                        <td><button class="btn-secondary" onclick="showVehicleServiceCards('${v.id}')">🪪 Карточки</button> <button class="btn-secondary" onclick="sellGameVehicle('${v.id}')">Продать</button></td>
                    </tr>
                `).join('');
            }

            const garage = document.getElementById('garageBody');
            if (garage) {
                if (!gameState.owned.length) {
                    garage.innerHTML = `<tr><td colspan="7" class="interactive-muted">Гараж пуст. Откройте «Магазин» и купите первое ТС.</td></tr>`;
                } else {
                    garage.innerHTML = gameState.owned.map((v, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${({bus:'🚌 Автобус', trolleybus:'🚎 Троллейбус', electrobus:'⚡ Электробус', tram:'🚊 Трамвай'})[v.category] || v.category}</td>
                            <td><b>${v.model}</b></td>
                            <td>${money(v.price)}</td>
                            <td><b>${escapeHtml(v.plate || (v.plate = generateRandomPlate()))}</b><br><button class="btn-secondary" onclick="changeVehiclePlate('${v.id}')" style="margin-top:3px;">№ изменить · 5 000 р.</button></td>
                            <td>${v.currentSalary ? money(v.currentSalary) : '—'}</td>
                            <td>${getVehicleRoute(v.id) ? '🛣️ №' + getVehicleRoute(v.id).number : '<span class="interactive-muted">Не назначен</span>'}</td>
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

            const history = document.getElementById('historyLog');
            if (history) {
                history.innerHTML = gameState.log.length
                    ? gameState.log.map(item => `
                        <div class="interactive-log-row">
                            <div>
                                <b>Месяц ${item.month}</b> · ${item.date}<br>
                                <span class="interactive-muted">${item.details.join(' • ')}</span>
                            </div>
                            <div class="${item.total >= 0 ? 'interactive-positive' : 'interactive-negative'}">
                                ${item.total >= 0 ? '+' : ''}${money(item.total)}
                            </div>
                        </div>
                    `).join('')
                    : `<div class="interactive-muted">История пока пуста.</div>`;
            }

            const log = document.getElementById('gameLog');
            if (!gameState.log.length) {
                log.innerHTML = `<div class="interactive-muted">История пока пуста.</div>`;
            } else {
                log.innerHTML = gameState.log.map(item => `
                    <div class="interactive-log-row">
                        <div>
                            <b>Месяц ${item.month}</b> · ${item.date}<br>
                            <span class="interactive-muted">${item.details.join(' • ')}</span>
                        </div>
                        <div class="${item.total >= 0 ? 'interactive-positive' : 'interactive-negative'}">
                            ${item.total >= 0 ? '+' : ''}${money(item.total)}
                        </div>
                    </div>
                `).join('');
            }

            renderRoutes();
        }

        function initInteractiveGame() {
            loadGameState();
            updateGameModelSelect();
            processAllOfflineEarnings();
            renderInteractive();
            scheduleNoonPayout();

            // Карту и её анимацию инициализируем лениво — только когда пользователь её открыл.

            // Если вкладка была открыта всю ночь, обновляем часы/состояние каждую минуту.
            if (!window.gameMinuteTimer) {
                window.gameMinuteTimer = setInterval(() => {
                    processAllOfflineEarnings();
                    renderInteractiveHeaderAndLightViews();
                }, 1000);
            }
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stopMapBusAnimation();
            else {
                processAllOfflineEarnings();
                const section = document.getElementById('game-section-map');
                if (section?.classList.contains('active')) startMapBusAnimation();
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
