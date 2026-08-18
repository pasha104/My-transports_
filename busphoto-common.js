const defaultVehicleDB = [
            { park: "ТП 2", modelPrefix: "МАЗ-216", model: "МАЗ 216.047", gov: "????", num: "????", purposeKey: "service", factory: "125", vin: "—", build: "03.12.2025", arrive: "15.12.2025", start: "—", out: "—", decomm: "—", util: "—", statusCls: "st-unknown", statusKey: "txtUnk", note: "Новогодний 2026" },
            { park: "ТП 2", modelPrefix: "МАЗ-203", model: "МАЗ 203.047", gov: "АА 0001-7", num: "23145", purposeKey: "linear", factory: "36", vin: "—", build: "02.12.2025", arrive: "15.12.2025", start: "12.2025", out: "—", decomm: "—", util: "—", statusCls: "st-active", statusKey: "txtAct", note: "—" },
            { park: "ТП 2", modelPrefix: "МАЗ-103Т", model: "МАЗ 103Т", gov: "—", num: "1002", purposeKey: "—", factory: "102", vin: "—", build: "—", arrive: "—", start: "—", out: "—", decomm: "—", util: "—", statusCls: "st-not-operated", statusKey: "txtNotOp", note: "—" },
            { park: "ТП 2", modelPrefix: "МАЗ-203Т", model: "МАЗ 203Т20", gov: "—", num: "1001", purposeKey: "—", factory: "101", vin: "—", build: "—", arrive: "—", start: "—", out: "—", decomm: "—", util: "—", statusCls: "st-not-operated", statusKey: "txtNotOp", note: "—" },
            { park: "АП 1", modelPrefix: "МАЗ-203", model: "МАЗ 203.147", gov: "АН 0031-5", num: "20003", purposeKey: "linear", factory: "203", vin: "—", build: "15.12.2025", arrive: "15.12.2025", start: "2026", out: "08.2026", decomm: "04.08.2026", util: "2026", statusCls: "st-decomm", statusKey: "txtDecomm", note: "—" },
            { park: "АП 1", modelPrefix: "МАЗ-206", model: "МАЗ 206.047", gov: "АН 0351-5", num: "20035", purposeKey: "linear", factory: "917", vin: "—", build: "16.12.2025", arrive: "16.12.2025", start: "2026", out: "—", decomm: "—", util: "—", statusCls: "st-inactive", statusKey: "txtNotWrk", note: "—" },
            { park: "АП 1", modelPrefix: "МАЗ-103", model: "МАЗ 103С65", gov: "АН 0032-5", num: "20005", purposeKey: "linear", factory: "405", vin: "—", build: "01.12.2025", arrive: "15.12.2025", start: "2026", out: "—", decomm: "—", util: "—", statusCls: "st-active", statusKey: "txtAct", note: "—" },
            { park: "АП 1", modelPrefix: "МАЗ-107", model: "МАЗ 107.569", gov: "АН 0453-5", num: "20015", purposeKey: "linear", factory: "569", vin: "—", build: "25.01.2026", arrive: "25.01.2026", start: "2026", out: "—", decomm: "—", util: "—", statusCls: "st-inactive", statusKey: "txtNotWrk", note: "—" },
            { park: "АП 1", modelPrefix: "МАЗ-103", model: "МАЗ 103.065", gov: "АЕ 3592", num: "20145", purposeKey: "linear", factory: "145", vin: "—", build: "12.02.2026", arrive: "14.02.2026", start: "—", out: "08.2026", decomm: "03.08.2026", util: "2026", statusCls: "st-decomm", statusKey: "txtDecomm", note: "—" },
            { park: "АП 1", modelPrefix: "МАЗ-206", model: "МАЗ 206.047", gov: "АВ 7425-5", num: "20042", purposeKey: "linear", factory: "242", vin: "—", build: "12.04.2026", arrive: "04.2026", start: "2026", out: "—", decomm: "—", util: "—", statusCls: "st-mod", statusKey: "txtMod", note: "КВР/Модернизирован (смена модели)" }
        ];

        let vehicleDB = [];
        let currentViewingIndex = null;

        function loadDatabase() {
            let saved = localStorage.getItem('busphoto_custom_db');
            if (saved) {
                try {
                    vehicleDB = JSON.parse(saved);
                } catch(e) {
                    vehicleDB = [...defaultVehicleDB];
                }
            } else {
                vehicleDB = [...defaultVehicleDB];
            }
        }

        function exportDatabase() {
            let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vehicleDB, null, 2));
            let downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "busphoto_db.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        }

        function importDatabase(event) {
            let file = event.target.files[0];
            if (!file) return;
            let reader = new FileReader();
            reader.onload = function(e) {
                try {
                    let imported = JSON.parse(e.target.result);
                    if (Array.isArray(imported)) {
                        vehicleDB = imported;
                        localStorage.setItem('busphoto_custom_db', JSON.stringify(vehicleDB));
                        renderTable();
                        alert('База данных успешно импортирована!');
                    } else {
                        alert('Ошибка: неверный формат файла.');
                    }
                } catch(err) {
                    alert('Ошибка при чтении JSON файла.');
                }
            };
            reader.readAsText(file);
        }

        const modelsData = {
            bus: {
                "МАЗ-101": ["101"],
                "МАЗ-103": ["103.000", "103.002", "103.003", "103.005", "103.040", "103.041", "103.060", "103.061", "103.062", "103.067", "103.068", "103.070", "103.075", "103.076", "103.464", "103.465", "103.468", "103.469", "103.476", "103.485", "103.486", "103.562", "103.564", "103.569", "103.585", "103.586", "103.587", "103.965", "103.966", "103С00", "103С02", "103С03", "103С05", "103С40", "103С60", "103С61", "103С62", "103С67", "103С70", "103С76"],
                "МАЗ-104": ["104.000", "104.021", "104.025", "104.031", "104С00", "104С21", "104С25", "104Х25"],
                "МАЗ-105": ["105.000", "105.030", "105.041", "105.042", "105.060", "105.065", "105.465"],
                "МАЗ-107": ["107.040", "107.041", "107.060", "107.065", "107.066", "107.068", "107.464", "107.465", "107.466", "107.468", "107.469", "107.485", "107.569", "107.585"],
                "МАЗ-152": ["152.060", "152.062"],
                "МАЗ-203": ["203.015", "203.016", "203.045", "203.047", "203.057", "203.058", "203.067", "203.068", "203.076", "203.085", "203.088", "203.115", "203.116", "203.145", "203.147", "203.167", "203.176", "203.445", "203.865", "203.945", "203.948", "203.C45", "203.C46"],
                "МАЗ-205": ["205.069"],
                "МАЗ-206": ["206.000", "206.015", "206.045", "206.047", "206.060", "206.063", "206.067", "206.068", "206.069", "206.085", "206.086", "206.486", "206.945"],
                "МАЗ-215": ["215.067", "215.069"],
                "МАЗ-216": ["216.047", "216.066"],
                "МАЗ-226": ["226.100"],
                "МАЗ-231": ["231.062", "231.064"],
                "МАЗ-232": ["232.062"],
                "МАЗ-241": ["241.030", "241.S30"],
                "МАЗ-251": ["251.050", "251.062"],
                "МАЗ-256": ["256.000", "256.070", "256.100", "256.170", "256.200", "256.270"],
                "МАЗ-257": ["257.030", "257.S30", "257.A30"],
                "МАЗ-281": ["281.040"],
                "МАЗ-303": ["303.047", "303.065", "303.066", "303.266", "303.147"]
            },
            trolleybus: {
                "МАЗ-103Т": ["103Т"],
                "МАЗ-203Т": ["203Т20", "203Т21", "203Т70"],
                "МАЗ-206Т": ["206Т", "206Т47"],
                "МАЗ-303Т": ["303Т20", "303Т21", "303Т22"],
                "АКСМ-101": ["101"],
                "АКСМ-201": ["201"],
                "АКСМ-213": ["213"],
                "АКСМ-215": ["215"],
                "АКСМ-321": ["321"],
                "АКСМ-333": ["333"],
                "АКСМ-420": ["420"],
                "АКСМ-433": ["433"]
            },
            electrobus: {
                "МАЗ-305Е": [],
                "МАЗ-303Э": ["303Э10", "303Э20", "303Э22"],
                "АКСМ-Е321": ["Е321"],
                "АКСМ-Е433": ["Е433"]
            },
            tram: {
                "БКМ 60102": [],
                "БКМ 62103": [],
                "БКМ 743": [],
                "БКМ Т811": ["Т811", "Т811 МиНиН"],
                "БКМ Т856": ["Т856", "Т856 МиНиН"]
            }
        };

        const translations = {
            ru: {
                sub: "База данных ПС — Беларусь (Минск)", inBase: "ТС в базе",
                dbTitle: "Минск — Подвижной состав", modelsTitle: "🚍 Список моделей подвижного состава",
                searchTitle: "🔍 Расширенный поиск по базе",
                tabDB: "📋 База данных", tabModels: "🚍 Список моделей", tabSearch: "🔍 Поиск",
                thPark: "Парк", thModel: "Модель", thGov: "Гос. номер", thNum: "Борт. / Гар. №",
                thPurpose: "Назначение", thFactory: "Заводской №", thVIN: "VIN", thBuild: "Построен",
                thArrive: "Поступил", thStart: "Начал работу", thOut: "Отставлен", thDecomm: "Списан",
                thUtil: "Утилизирован", thNote: "Примечание",
                linear: "Линейный", service: "Служебный",
                txtAct: "Эксплуатируется", txtDecomm: "Списан", txtNotOp: "Не был в эксплуатации",
                txtNotWrk: "Не эксплуатируется", txtUnk: "Судьба неизвестна", txtMod: "КВР/Модернизация",
                txtOut: "Выведен из эксплуатации", txtTransCity: "Передан в городе", txtTransOther: "Передан в другой город", txtPlateChange: "Смена госномера",
                catBus: "🚌 Автобусы", catTroll: "🚎 Троллейбусы", catElectro: "⚡ Электробусы", catTram: "🚊 Трамваи",
                clickModel: "(Нажмите на модель для открытия списка подмоделей в отдельном окне)",
                modSub: "📌 Список подмоделей:",
                lblCountry: "Страна", lblCity: "Город", lblModel: "Модель", lblNum: "Гос. или бортовой номер",
                btnFind: "Найти в базе", allParks: "Все предприятия", filterPlace: "Фильтр по модели, номеру...",
                modTitle: "Подмодификации и транспортные средства в базе данных"
            },
            en: {
                sub: "Rolling Stock Database — Belarus (Minsk)", inBase: "Vehicles in db",
                dbTitle: "Minsk — Rolling Stock", modelsTitle: "🚍 List of rolling stock models",
                searchTitle: "🔍 Advanced Database Search",
                tabDB: "📋 Database", tabModels: "🚍 Models List", tabSearch: "🔍 Search",
                thPark: "Depot", thModel: "Model", thGov: "License Plate", thNum: "Fleet No.",
                thPurpose: "Purpose", thFactory: "Factory No.", thVIN: "VIN", thBuild: "Built",
                thArrive: "Arrived", thStart: "Started", thOut: "Withdrawn", thDecomm: "Decommissioned",
                thUtil: "Scrapped", thNote: "Note",
                linear: "Line", service: "Service",
                txtAct: "Operating", txtDecomm: "Decommissioned", txtNotOp: "Never Operated",
                txtNotWrk: "Out of Service", txtUnk: "Unknown Fate", txtMod: "Overhauled",
                txtOut: "Withdrawn from service", txtTransCity: "Transferred in city", txtTransOther: "Transferred to another city", txtPlateChange: "Plate change",
                catBus: "🚌 Buses", catTroll: "🚎 Trolleybuses", catElectro: "⚡ Electric Buses", catTram: "🚊 Trams",
                clickModel: "(Click on a model to open submodels in a new window)",
                modSub: "📌 Submodels List:",
                lblCountry: "Land", lblCity: "City", lblModel: "Model", lblNum: "License / Fleet No.",
                btnFind: "Search Database", allParks: "All depots", filterPlace: "Filter by model, number...",
                modTitle: "Submodifications and vehicles in database"
            },
            be: {
                sub: "База даных РС — Беларусь (Мінск)", inBase: "ТС у базе",
                dbTitle: "Мінск — Рухомы склад", modelsTitle: "🚍 Спіс мадэляў рухомага складу",
                searchTitle: "🔍 Пашыраны пошук па базе",
                tabDB: "📋 База даных", tabModels: "🚍 Спіс мадэляў", tabSearch: "🔍 Пошук",
                thPark: "Парк", thModel: "Мадэль", thGov: "Дзярж. нумар", thNum: "Борт. / Гар. №",
                thPurpose: "Прызначэнне", thFactory: "Заводскі №", thVIN: "VIN", thBuild: "Пабудаваны",
                thArrive: "Паступіў", thStart: "Пачаў працу", thOut: "Адстаўлены", thDecomm: "Спісаны",
                thUtil: "Утылізаваны", thNote: "Заўвага",
                linear: "Лінейны", service: "Службовы",
                txtAct: "Эксплуатуецца", txtDecomm: "Спісаны", txtNotOp: "Не быў у эксплуатацыі",
                txtNotWrk: "Не эксплуатуецца", txtUnk: "Лёс невядомы", txtMod: "КВР/Мадэрнізацыя",
                txtOut: "Выведзены з эксплуатацыі", txtTransCity: "Перададзены ў горадзе", txtTransOther: "Перададзены ў іншы горад", txtPlateChange: "Змена дзяржнумара",
                catBus: "🚌 Аўтобусы", catTroll: "🚎 Тралейбусы", catElectro: "⚡ Электробусы", catTram: "🚊 Трамваі",
                clickModel: "(Націсніце на мадэль для адкрыцця спісу падмадэляў у асобным акне)",
                modSub: "📌 Спіс падмадэляў:",
                lblCountry: "Краіна", lblCity: "Горад", lblModel: "Мадэль", lblNum: "Дзярж. ці бартавы нумар",
                btnFind: "Знайсці ў базе", allParks: "Усе прадпрыемствы", filterPlace: "Фільтр па мадэлі, нумары...",
                modTitle: "Падмадыфікацыі і машыны ў базе даных"
            },
            uk: {
                sub: "База даних ПС — Білорусь (Мінськ)", inBase: "ТЗ в базі",
                dbTitle: "Мінськ — Рухомий склад", modelsTitle: "🚍 Список моделей рухомого складу",
                searchTitle: "🔍 Розширений пошук по базі",
                tabDB: "📋 База даних", tabModels: "🚍 Список моделей", tabSearch: "🔍 Пошук",
                thPark: "Парк", thModel: "Модель", thGov: "Держ. номер", thNum: "Борт. / Гар. №",
                thPurpose: "Призначення", thFactory: "Заводський №", thVIN: "VIN", thBuild: "Побудований",
                thArrive: "Надійшов", thStart: "Почав роботу", thOut: "Відставлений", thDecomm: "Списаний",
                thUtil: "Утилізований", thNote: "Примітка",
                linear: "Лінійний", service: "Службовий",
                txtAct: "Експлуатується", txtDecomm: "Списаний", txtNotOp: "Не був в експлуатації",
                txtNotWrk: "Не експлуатується", txtUnk: "Доля невідома", txtMod: "КВР/Модернізація",
                txtOut: "Виведений з експлуатації", txtTransCity: "Переданий в місті", txtTransOther: "Переданий в інше місто", txtPlateChange: "Зміна держномера",
                catBus: "🚌 Автобуси", catTroll: "🚎 Тролейбуси", catElectro: "⚡ Електробуси", catTram: "🚊 Трамваї",
                clickModel: "(Натисніть на модель для відкриття списку підмоделей в окремому вікні)",
                modSub: "📌 Список підмоделей:",
                lblCountry: "Країна", lblCity: "Місто", lblModel: "Модель", lblNum: "Держ. чи бортовий номер",
                btnFind: "Знайти в базі", allParks: "Всі підприємства", filterPlace: "Фільтр за моделлю, номером...",
                modTitle: "Підмодифікації та машини у базі даних"
            },
            de: {
                sub: "Fahrzeugdatenbank — Belarus (Minsk)", inBase: "Fahrzeuge im DB",
                dbTitle: "Minsk — Fahrzeugpark", modelsTitle: "🚍 Liste der Fahrzeugmodelle",
                searchTitle: "🔍 Erweiterte Datenbanksuche",
                tabDB: "📋 Datenbank", tabModels: "🚍 Modelliste", tabSearch: "🔍 Suchen",
                thPark: "Depot", thModel: "Modell", thGov: "Kennzeichen", thNum: "Betriebsnummer",
                thPurpose: "Einsatz", thFactory: "Fabriknummer", thVIN: "VIN", thBuild: "Gebaut",
                thArrive: "Eingetroffen", thStart: "In Betrieb", thOut: "Abgestellt", thDecomm: "Ausgemustert",
                thUtil: "Verschrottet", thNote: "Hinweis",
                linear: "Linie", service: "Dienst",
                txtAct: "In Betrieb", txtDecomm: "Ausgemustert", txtNotOp: "Nicht in Betrieb",
                txtNotWrk: "Außer Betrieb", txtUnk: "Unbekannt", txtMod: "Modernisiert",
                txtOut: "Abgestellt", txtTransCity: "Stadtintern übertragen", txtTransOther: "In andere Stadt übertragen", txtPlateChange: "Kennzeichenwechsel",
                catBus: "🚌 Busse", catTroll: "🚎 Oberleitungsbusse", catElectro: "⚡ Elektrobusse", catTram: "🚊 Straßenbahnen",
                clickModel: "(Klicken Sie auf ein Modell, um Untermodelle in einem neuen Fenster zu öffnen)",
                modSub: "📌 Untermodelle:",
                lblCountry: "Land", lblCity: "Stadt", lblModel: "Modell", lblNum: "Kennzeichen / Nummer",
                btnFind: "In DB suchen", allParks: "Alle Depots", filterPlace: "Nach Modell, Nummer filtern...",
                modTitle: "Untermodelle und Fahrzeuge in der DB"
            },
            zh: {
                sub: "车辆数据库 — 白俄罗斯 (明斯克)", inBase: "库内车辆",
                dbTitle: "明斯克 — 车辆保有量", modelsTitle: "🚍 车辆型号列表",
                searchTitle: "🔍 高级数据库搜索",
                tabDB: "📋 数据库", tabModels: "🚍 车型列表", tabSearch: "🔍 搜索",
                thPark: "车队", thModel: "车型", thGov: "车牌号", thNum: "自编号",
                thPurpose: "用途", thFactory: "出厂编号", thVIN: "VIN", thBuild: "制造",
                thArrive: "抵达", thStart: "投入运营", thOut: "封存", thDecomm: "报废",
                thUtil: "拆解", thNote: "备注",
                linear: "常规路线", service: "内部勤务",
                txtAct: "运营中", txtDecomm: "已报废", txtNotOp: "未投入运营",
                txtNotWrk: "停运", txtUnk: "下落不明", txtMod: "大修/现代化",
                txtOut: "停运/封存", txtTransCity: "市内调拨", txtTransOther: "调往其他城市", txtPlateChange: "变更车牌",
                clickModel: "(点击车型可在单独的新窗口中打开子型号列表)",
                modSub: "📌 子型号列表:",
                lblCountry: "国家", lblCity: "城市", lblModel: "车型", lblNum: "车牌号或自编号",
                btnFind: "搜索", allParks: "所有车队", filterPlace: "按车型、编号过滤...",
                modTitle: "数据库中的子型号和车辆"
            }
        };

        let currentLang = 'ru';

        function updateEnterpriseFilter() {
            const select = document.getElementById('parkSelect');
            if (!select) return;
            const current = select.value;
            const parks = [...new Set(vehicleDB.map(v => String(v.park || '').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
            select.innerHTML = '<option value="" id="opt-all-parks">Все предприятия</option>' +
                parks.map(park => `<option value="${escapeHtml(park)}">${escapeHtml(park)}</option>`).join('');
            if (parks.includes(current)) select.value = current;
        }

        function renderTable() {
            let t = translations[currentLang];
            let tbody = document.getElementById('tableBody');
            if (!tbody) return;
            tbody.innerHTML = '';
            
            document.getElementById('dbCount').innerText = vehicleDB.length;
            updateEnterpriseFilter();

            vehicleDB.forEach((v, index) => {
                let tr = document.createElement('tr');
                tr.className = v.statusCls;
                tr.setAttribute('data-park', v.park);
                
                tr.onclick = () => {
                    openVehicleModal(index);
                };
                
                let purposeLabel = t[v.purposeKey] ? t[v.purposeKey] : (v.purposeKey === '—' ? '—' : v.purposeKey);
                
                tr.innerHTML = `
                    <td><b>${v.park}</b></td>
                    <td><b>${v.model}</b></td>
                    <td>${v.gov}</td>
                    <td>${v.num}</td>
                    <td>${purposeLabel}</td>
                    <td class="f-num">${v.factory}</td>
                    <td class="vin-cell">${v.vin || '—'}</td>
                    <td>${v.build}</td>
                    <td>${v.arrive}</td>
                    <td>${v.start}</td>
                    <td>${v.out || '—'}</td>
                    <td>${v.decomm || '—'}</td>
                    <td>${v.util || '—'}</td>
                    <td>${v.note}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        function openDeleteModal() {
            document.getElementById('deleteSearchInput').value = '';
            renderDeleteList();
            document.getElementById('deleteModal').style.display = 'flex';
        }

        function closeDeleteModal() {
            document.getElementById('deleteModal').style.display = 'none';
        }

        function renderDeleteList(filterQuery = '') {
            let container = document.getElementById('deleteListContainer');
            container.innerHTML = '';

            let query = filterQuery.toUpperCase().trim();
            let filtered = vehicleDB.map((v, index) => ({v, index})).filter(item => {
                if (!query) return true;
                let text = `${item.v.model} ${item.v.gov} ${item.v.num} ${item.v.park}`.toUpperCase();
                return text.indexOf(query) > -1;
            });

            if (filtered.length === 0) {
                container.innerHTML = `<div style="padding: 10px; text-align: center; color: #888;">Ничего не найдено</div>`;
                return;
            }

            filtered.forEach(item => {
                let v = item.v;
                let index = item.index;
                let row = document.createElement('div');
                row.className = 'submodel-row';
                
                let dispGov = v.gov !== '—' && v.gov !== '????' ? v.gov : `Борт. ${v.num}`;
                row.innerHTML = `
                    <span><b>${v.park}</b> | ${v.model} — ${dispGov}</span>
                    <button class="btn-primary" style="background: #8b0000; padding: 4px 8px; font-size: 10px;" onclick="confirmDeleteVehicle(${index})">Удалить</button>
                `;
                container.appendChild(row);
            });
        }

        function filterDeleteList() {
            let query = document.getElementById('deleteSearchInput').value;
            renderDeleteList(query);
        }

        function confirmDeleteVehicle(index) {
            let v = vehicleDB[index];
            if (!v) return;
            let dispGov = v.gov !== '—' && v.gov !== '????' ? v.gov : `Борт. ${v.num}`;
            if (confirm(`Удалить транспортное средство ${v.model} (${dispGov}) из базы?`)) {
                vehicleDB.splice(index, 1);
                localStorage.setItem('busphoto_custom_db', JSON.stringify(vehicleDB));
                renderTable();
                renderDeleteList(document.getElementById('deleteSearchInput').value);
                alert('Транспортное средство успешно удалено!');
            }
        }

        function openEditSelectionModal() {
            document.getElementById('editSearchInput').value = '';
            renderEditList();
            document.getElementById('editSelectionModal').style.display = 'flex';
        }

        function closeEditSelectionModal() {
            document.getElementById('editSelectionModal').style.display = 'none';
        }

        function renderEditList(filterQuery = '') {
            let container = document.getElementById('editListContainer');
            container.innerHTML = '';

            let query = filterQuery.toUpperCase().trim();
            let filtered = vehicleDB.map((v, index) => ({v, index})).filter(item => {
                if (!query) return true;
                let text = `${item.v.model} ${item.v.gov} ${item.v.num} ${item.v.park}`.toUpperCase();
                return text.indexOf(query) > -1;
            });

            if (filtered.length === 0) {
                container.innerHTML = `<div style="padding: 10px; text-align: center; color: #888;">Ничего не найдено</div>`;
                return;
            }

            filtered.forEach(item => {
                let v = item.v;
                let index = item.index;
                let row = document.createElement('div');
                row.className = 'submodel-row';
                
                let dispGov = v.gov !== '—' && v.gov !== '????' ? v.gov : `Борт. ${v.num}`;
                row.innerHTML = `
                    <span><b>${v.park}</b> | ${v.model} — ${dispGov}</span>
                    <button class="btn-primary" style="background: #1e3f66; padding: 4px 8px; font-size: 10px;" onclick="selectVehicleForEdit(${index})">Править</button>
                `;
                container.appendChild(row);
            });
        }

        function filterEditList() {
            let query = document.getElementById('editSearchInput').value;
            renderEditList(query);
        }

        function selectVehicleForEdit(index) {
            closeEditSelectionModal();
            openEditModal(index);
        }

        function openEditModal(index) {
            currentViewingIndex = index;
            let v = vehicleDB[index];
            if (!v) return;
            document.getElementById('editIndex').value = index;
            document.getElementById('editPark').value = v.park || '';
            document.getElementById('editModel').value = v.model || '';
            document.getElementById('editModelPrefix').value = v.modelPrefix || '';
            document.getElementById('editGov').value = v.gov || '';
            document.getElementById('editNum').value = v.num || '';
            document.getElementById('editFactory').value = v.factory || '';
            document.getElementById('editVin').value = v.vin || '';
            document.getElementById('editBuild').value = v.build || '';
            document.getElementById('editArrive').value = v.arrive || '';
            document.getElementById('editOut').value = v.out || '—';
            document.getElementById('editDecomm').value = v.decomm || '—';
            document.getElementById('editUtil').value = v.util || '—';
            document.getElementById('editStatus').value = v.statusCls || 'st-active';
            document.getElementById('editPurpose').value = v.purposeKey || '—';
            document.getElementById('editNote').value = v.note || '';
            document.getElementById('editVehicleModal').style.display = 'flex';
        }

        function closeEditModal() {
            document.getElementById('editVehicleModal').style.display = 'none';
        }

        function saveEditedVehicle(event) {
            event.preventDefault();
            let index = parseInt(document.getElementById('editIndex').value);
            if (isNaN(index) || !vehicleDB[index]) return;

            let statusVal = document.getElementById('editStatus').value;
            let statusKeyMap = {
                'st-active': 'txtAct',
                'st-inactive': 'txtNotWrk',
                'st-not-operated': 'txtNotOp',
                'st-out': 'txtOut',
                'st-mod': 'txtMod',
                'st-decomm': 'txtDecomm',
                'st-unknown': 'txtUnk',
                'st-trans-city': 'txtTransCity',
                'st-trans-other': 'txtTransOther',
                'st-plate-change': 'txtPlateChange'
            };

            vehicleDB[index] = {
                ...vehicleDB[index],
                park: document.getElementById('editPark').value,
                modelPrefix: document.getElementById('editModelPrefix').value,
                model: document.getElementById('editModel').value,
                gov: document.getElementById('editGov').value,
                num: document.getElementById('editNum').value,
                purposeKey: document.getElementById('editPurpose').value,
                factory: document.getElementById('editFactory').value,
                vin: document.getElementById('editVin').value,
                build: document.getElementById('editBuild').value,
                arrive: document.getElementById('editArrive').value,
                out: document.getElementById('editOut').value,
                decomm: document.getElementById('editDecomm').value,
                util: document.getElementById('editUtil').value,
                statusCls: statusVal,
                statusKey: statusKeyMap[statusVal] || 'txtAct',
                note: document.getElementById('editNote').value
            };

            localStorage.setItem('busphoto_custom_db', JSON.stringify(vehicleDB));
            renderTable();
            closeEditModal();
            alert('Транспортное средство успешно обновлено в базе!');
        }

        function renderModels() {
            let t = translations[currentLang];
            const pageTitle = document.getElementById('page-title-models');
            if (!pageTitle) return;
            pageTitle.innerText = t.modelsTitle + " " + t.clickModel;
            
            let buildGrid = (gridId, typeKey) => {
                let grid = document.getElementById(gridId);
                if (!grid) return;
                grid.innerHTML = '';
                let data = modelsData[typeKey];
                for (let mainModel in data) {
                    let div = document.createElement('div');
                    div.className = 'model-item';
                    div.innerHTML = `<b>${mainModel}</b>`;
                    div.onclick = () => openModelSubmodels(mainModel, typeKey);
                    grid.appendChild(div);
                }
            };
            buildGrid('models-grid-bus', 'bus');
            buildGrid('models-grid-troll', 'trolleybus');
            buildGrid('models-grid-electro', 'electrobus');
            buildGrid('models-grid-tram', 'tram');
        }

        function renderApp() {
            let t = translations[currentLang];
            if (!t) return;
            
            const elementMap = {
                'header-subtitle': 'sub',
                'txt-in-base': 'inBase',
                'page-title-db': 'dbTitle',
                'page-title-search': 'searchTitle',
                'btn-db': 'tabDB',
                'btn-models': 'tabModels',
                'btn-search': 'tabSearch',
                'th-park': 'thPark',
                'th-model': 'thModel',
                'th-gov': 'thGov',
                'th-num': 'thNum',
                'th-purpose': 'thPurpose',
                'th-factory': 'thFactory',
                'th-vin': 'thVIN',
                'th-build': 'thBuild',
                'th-arrive': 'thArrive',
                'th-start': 'thStart',
                'th-out': 'thOut',
                'th-decomm': 'thDecomm',
                'th-util': 'thUtil',
                'th-note': 'thNote',
                'leg-title': 'legTitle',
                'leg-act': 'legAct',
                'leg-1': 'leg1',
                'leg-2': 'leg2',
                'leg-3': 'leg3',
                'leg-4': 'leg4',
                'leg-5': 'leg5',
                'leg-6': 'leg6',
                'leg-7': 'leg7',
                'leg-8': 'leg8',
                'leg-9': 'leg9',
                'cat-bus': 'catBus',
                'cat-troll': 'catTroll',
                'cat-electro': 'catElectro',
                'cat-tram': 'catTram',
                'lbl-country': 'lblCountry',
                'lbl-city': 'lblCity',
                'lbl-model': 'lblModel',
                'lbl-num': 'lblNum',
                'btn-find': 'btnFind',
                'opt-all-parks': 'allParks',
                'mdSubTitleText': 'modSub'
            };
            
            for (let id in elementMap) {
                let el = document.getElementById(id);
                let dictKey = elementMap[id];
                if (el && t[dictKey]) {
                    el.innerText = t[dictKey];
                }
            }
            
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.placeholder = t.filterPlace;

            renderTable();
            renderModels();
        }

        function applyDeviceMode() {
            const mode = localStorage.getItem('busphoto_device_mode') || 'auto';
            document.body.classList.remove('device-pc','device-mobile');
            let effective = mode;
            if (mode === 'auto') effective = window.matchMedia('(max-width: 700px)').matches ? 'mobile' : 'pc';
            document.body.classList.add('device-' + effective);
            const label = document.getElementById('deviceModeLabel');
            if (label) label.textContent = mode === 'auto' ? 'Авто' : (mode === 'mobile' ? 'Мобильный' : 'ПК');
            setTimeout(() => { if (typeof mapState !== 'undefined' && mapState?.map) mapState.map.invalidateSize(); }, 120);
        }
        function toggleDeviceMode() {
            const current = localStorage.getItem('busphoto_device_mode') || 'auto';
            const next = current === 'auto' ? 'mobile' : current === 'mobile' ? 'pc' : 'auto';
            localStorage.setItem('busphoto_device_mode', next);
            applyDeviceMode();
        }

        window.addEventListener('DOMContentLoaded', () => {
            loadDatabase();
            
            let savedTheme = localStorage.getItem('busphoto_theme');
            if (savedTheme === 'dark') {
                document.body.classList.remove('light-theme');
            } else {
                document.body.classList.add('light-theme');
            }

            let select = document.getElementById('headerLangSelect');
            if (select) {
                currentLang = select.value;
            }
            renderApp();
            applyDeviceMode();
        });

        function changeLanguage(lang) {
            currentLang = lang;
            let select = document.getElementById('headerLangSelect');
            if (select && select.value !== lang) {
                select.value = lang;
            }
            renderApp();
        }

        function openAddModal() {
            document.getElementById('addVehicleModal').style.display = 'flex';
        }
        function closeAddModal() {
            document.getElementById('addVehicleModal').style.display = 'none';
        }

        function openVehicleModal(index) {
            currentViewingIndex = index;
            let v = vehicleDB[index];
            if (!v) return;
            let t = translations[currentLang];
            document.getElementById('vmTitle').innerText = `${v.model} (${v.park})`;
            document.getElementById('vmSubtitle').innerText = `${t.thGov}: ${v.gov} | ${t.thNum}: ${v.num}`;
            
            let content = document.getElementById('vmContent');
            content.innerHTML = `
                <div class="model-item"><p><b>${t.thPark}:</b> ${v.park}</p></div>
                <div class="model-item"><p><b>${t.thModel}:</b> ${v.model}</p></div>
                <div class="model-item"><p><b>${t.thGov}:</b> ${v.gov}</p></div>
                <div class="model-item"><p><b>${t.thNum}:</b> ${v.num}</p></div>
                <div class="model-item"><p><b>${t.thPurpose}:</b> ${t[v.purposeKey] || v.purposeKey}</p></div>
                <div class="model-item"><p><b>${t.thFactory}:</b> ${v.factory}</p></div>
                <div class="model-item"><p><b>VIN:</b> ${v.vin || '—'}</p></div>
                <div class="model-item"><p><b>${t.thBuild}:</b> ${v.build}</p></div>
                <div class="model-item"><p><b>${t.thArrive}:</b> ${v.arrive}</p></div>
                <div class="model-item"><p><b>${t.thStart}:</b> ${v.start}</p></div>
                <div class="model-item"><p><b>${t.thOut}:</b> ${v.out || '—'}</p></div>
                <div class="model-item"><p><b>${t.thDecomm}:</b> ${v.decomm || '—'}</p></div>
                <div class="model-item"><p><b>${t.thUtil}:</b> ${v.util || '—'}</p></div>
                <div class="model-item"><p><b>${t.thNote}:</b> ${v.note}</p></div>
                <div class="model-item" style="grid-column: span 2;"><p><b>Статус:</b> ${t[v.statusKey] || v.statusKey}</p></div>
            `;
            document.getElementById('vehicleModal').style.display = 'flex';
        }

        function closeVehicleModal() {
            document.getElementById('vehicleModal').style.display = 'none';
        }

        function saveNewVehicle(event) {
            event.preventDefault();
            
            let statusVal = document.getElementById('newStatus').value;
            let statusKeyMap = {
                'st-active': 'txtAct',
                'st-inactive': 'txtNotWrk',
                'st-not-operated': 'txtNotOp',
                'st-out': 'txtOut',
                'st-mod': 'txtMod',
                'st-decomm': 'txtDecomm',
                'st-unknown': 'txtUnk',
                'st-trans-city': 'txtTransCity',
                'st-trans-other': 'txtTransOther',
                'st-plate-change': 'txtPlateChange'
            };

            let newBus = {
                park: document.getElementById('newPark').value,
                modelPrefix: document.getElementById('newModelPrefix').value,
                model: document.getElementById('newModel').value,
                gov: document.getElementById('newGov').value,
                num: document.getElementById('newNum').value,
                purposeKey: document.getElementById('newPurpose').value,
                factory: document.getElementById('newFactory').value,
                vin: document.getElementById('newVin').value,
                build: document.getElementById('newBuild').value,
                arrive: document.getElementById('newArrive').value,
                start: "2026",
                out: document.getElementById('newOut').value,
                decomm: document.getElementById('newDecomm').value,
                util: document.getElementById('newUtil').value,
                statusCls: statusVal,
                statusKey: statusKeyMap[statusVal] || 'txtAct',
                note: document.getElementById('newNote').value
            };

            vehicleDB.unshift(newBus); 
            localStorage.setItem('busphoto_custom_db', JSON.stringify(vehicleDB));
            
            renderTable();
            closeAddModal();
            document.getElementById('addVehicleForm').reset();
            alert('Новое транспортное средство успешно добавлено в базу!');
        }

        function executeGlobalSearch() {
            let modelQ = document.getElementById('searchModelQuery').value.toUpperCase().trim();
            let numQ = document.getElementById('searchNumQuery').value.toUpperCase().trim();
            
            switchTab('database', document.getElementById('btn-db'));
            
            let mainInput = document.getElementById('searchInput');
            if (modelQ && numQ) {
                mainInput.value = modelQ + " " + numQ;
            } else {
                mainInput.value = modelQ || numQ;
            }
            
            filterDB();
            
            let matchedRows = Array.from(document.querySelectorAll("#dbTable tbody tr")).filter(row => row.style.display !== "none").length;
            alert(`Поиск выполнен! Найдено соответствующих ТС в базе: ${matchedRows}`);
        }

        function openModelSubmodels(modelName, typeKey) {
            let t = translations[currentLang];
            document.getElementById('mdTitle').innerText = modelName;
            document.getElementById('mdSubtitle').innerText = t.modTitle;
            
            let listContainer = document.getElementById('mdSubmodelsList');
            listContainer.innerHTML = '';
            
            let subs = modelsData[typeKey][modelName];
            if (subs && subs.length > 0) {
                subs.forEach(sub => {
                    let div = document.createElement('div');
                    div.className = 'submodel-row';
                    div.innerHTML = `<span>🔹 ${sub}</span>`;
                    listContainer.appendChild(div);
                });
            } else {
                let div = document.createElement('div');
                div.className = 'submodel-row';
                div.innerHTML = `<span>(Нет подмодификаций)</span>`;
                listContainer.appendChild(div);
            }

            let dbMatches = vehicleDB.filter(v => v.modelPrefix === modelName || v.model.startsWith(modelName));
            if (dbMatches.length > 0) {
                let title = document.createElement('div');
                title.style.marginTop = "15px";
                title.style.fontWeight = "bold";
                title.innerText = `📋 ${t.inBase} (${dbMatches.length}):`;
                listContainer.appendChild(title);
                
                dbMatches.forEach(v => {
                    let div = document.createElement('div');
                    div.className = 'submodel-row';
                    div.style.color = 'var(--bp-link)';
                    div.style.cursor = 'pointer';
                    
                    let globalIdx = vehicleDB.indexOf(v);
                    div.onclick = () => { closeModelModal(); openVehicleModal(globalIdx); };
                    
                    let dispName = v.gov !== '—' && v.gov !== '????' ? v.gov : `Борт. ${v.num}`;
                    let icon = typeKey === 'bus' ? '🚌' : (typeKey === 'trolleybus' ? '🚎' : (typeKey === 'electrobus' ? '⚡' : '🚊'));
                    div.innerHTML = `<span>${icon} ${v.model} — ${dispName}</span> <span>[${t[v.statusKey]}]</span>`;
                    listContainer.appendChild(div);
                });
            }

            document.getElementById('modelDetailsModal').style.display = 'flex';
        }

        function closeModelModal() { document.getElementById('modelDetailsModal').style.display = 'none'; }

        function switchTab(tabId, btnElement) {
            const wasInteractive = document.getElementById('interactive-tab')?.classList.contains('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
            const target = document.getElementById(tabId);
            if (target) target.classList.add('active');
            if (btnElement) btnElement.classList.add('active');

            // Критично для производительности: анимация транспорта не должна работать
            // в фоне, когда пользователь находится в другой вкладке сайта.
            if (typeof stopMapBusAnimation === 'function' && tabId !== 'interactive-tab') {
                stopMapBusAnimation();
            }
            if (tabId === 'interactive-tab') {
                if (typeof renderInteractive === 'function') renderInteractive();
                const activeGameSection = document.querySelector('#interactive-tab .game-section.active');
                if (activeGameSection?.id === 'game-section-map') {
                    setTimeout(() => { if (typeof renderMapIfReady === 'function') renderMapIfReady(); }, 60);
                }
            }
        }

        function toggleTheme() { 
            document.body.classList.toggle('light-theme');
            let isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('busphoto_theme', isLight ? 'light' : 'dark');
        }

        function filterDB() {
            let input = document.getElementById("searchInput").value.toUpperCase();
            let parkFilter = document.getElementById("parkSelect").value;
            let rows = document.querySelectorAll("#dbTable tbody tr");

            rows.forEach(row => {
                let text = row.innerText.toUpperCase();
                let park = row.getAttribute("data-park");
                let matchesSearch = text.indexOf(input) > -1;
                let matchesPark = parkFilter === "" || park === parkFilter;
                row.style.display = (matchesSearch && matchesPark) ? "" : "none";
            });
        }
