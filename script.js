// ======================== البيانات والتخزين المحلي ========================
let appData = {
    users: [{ username: 'admin', password: 'admin' }],
    vehicles: []
};

let currentUser = null;
let currentVehicleId = null;

// تحميل البيانات
function loadData() {
    const saved = localStorage.getItem('carAppData');
    if (saved) {
        try {
            appData = JSON.parse(saved);
        } catch (e) {}
    }
    // التأكد من وجود مصفوفات لكل مركبة
    appData.vehicles.forEach(v => {
        v.spareParts = v.spareParts || [];
        v.oilChanges = v.oilChanges || [];
        v.fuelLogs = v.fuelLogs || [];
        v.insurance = Array.isArray(v.insurance) ? v.insurance : (v.insurance ? [v.insurance] : []);
        v.technical = Array.isArray(v.technical) ? v.technical : (v.technical ? [v.technical] : []);
        v.license = Array.isArray(v.license) ? v.license : (v.license ? [v.license] : []);
    });
    const session = localStorage.getItem('currentUser');
    if (session) {
        try {
            currentUser = JSON.parse(session);
            if (appData.users.find(u => u.username === currentUser.username && u.password === currentUser.password)) {
                showPage('vehicles');
                renderVehicles();
                document.getElementById('logoutBtn').style.display = 'inline-block';
            } else {
                localStorage.removeItem('currentUser');
            }
        } catch (e) {}
    } else {
        showPage('login');
    }
}

function saveData() {
    localStorage.setItem('carAppData', JSON.stringify(appData));
}

// الإشعارات
function showNotification(msg, isError = false) {
    const n = document.getElementById('notification');
    n.style.background = isError ? 'linear-gradient(145deg, #dc3545, #c82333)' : 'linear-gradient(145deg, #28a745, #218838)';
    n.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${msg}`;
    n.style.display = 'block';
    setTimeout(() => n.style.display = 'none', 3000);
}

// إظهار صفحة
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
}

// تحديث قائمة الموديلات حسب النوع
function updateModels() {
    const make = document.getElementById('vehicleMake').value;
    const modelSelect = document.getElementById('vehicleModel');
    modelSelect.innerHTML = '<option value="">اختر الاسم</option>';
    const models = {
        'كيا': ['ريو', 'بيكانتو', 'سبورتاج', 'سيراتو'],
        'رونو': ['لوغان', 'ميجان', 'كابتور', 'داستر'],
        'بيجو': ['207', '208', '301', 'بارتنر'],
        'سيات': ['إبيزا', 'ليون'],
        'هونداي': ['إلنترا', 'أكسنت', 'i10', 'i20', 'توسان'],
        'تويوتا': ['كورولا', 'ياريس', 'كامري', 'هايلكس'],
        'نيسان': ['تيدا', 'سنترا', 'باترول'],
        'شيفرولي': ['أفيو', 'سايل', 'سبارك'],
        'مرسيدس': ['C-Class', 'E-Class'],
        'فولزفاغن': ['باسات', 'غولف'],
        'سيتروان': ['سي-إليزيه', 'بيرلينغو'],
        'داسيا': ['لوجان', 'سانديرو', 'داستر']
    };
    if (models[make]) {
        models[make].forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            modelSelect.appendChild(opt);
        });
    }
}

// عرض قائمة المركبات
function renderVehicles() {
    const container = document.getElementById('vehiclesList');
    container.innerHTML = '';
    if (appData.vehicles.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 30px;">لا توجد مركبات مسجلة. أضف مركبة جديدة.</p>';
        return;
    }
    appData.vehicles.forEach((v, i) => {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.innerHTML = `
            <h3>${v.make} ${v.model}</h3>
            <p><i class="fas fa-hashtag"></i> رقم: ${v.regNumber} | <i class="fas fa-tachometer-alt"></i> عداد: ${v.odometer || 0} كم</p>
            <div class="actions">
                <button class="btn btn-warning btn-sm" onclick="editVehicle(${i})"><i class="fas fa-edit"></i> تعديل</button>
                <button class="btn btn-danger btn-sm" onclick="deleteVehicle(${i})"><i class="fas fa-trash"></i> حذف</button>
            </div>
        `;
        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            const newOdo = prompt(`أدخل العداد الجديد (يجب أن يكون ≥ ${v.odometer}):`, v.odometer);
            if (newOdo !== null) {
                const num = parseInt(newOdo);
                if (isNaN(num) || num < v.odometer) {
                    showNotification('العداد غير صالح', true);
                    return;
                }
                appData.vehicles[i].odometer = num;
                saveData();
                showVehicleServiceWithAlerts(i);
            }
        });
        container.appendChild(card);
    });
}

// تعديل مركبة
window.editVehicle = function(index) {
    const v = appData.vehicles[index];
    document.getElementById('vehicleDate').value = v.date || '';
    document.getElementById('vehicleReg').value = v.regNumber;
    document.getElementById('vehicleMake').value = v.make;
    updateModels();
    setTimeout(() => document.getElementById('vehicleModel').value = v.model, 100);
    document.getElementById('vehicleFuel').value = v.fuel;
    document.getElementById('vehicleOdometer').value = v.odometer;
    document.getElementById('saveVehicleBtn').dataset.editIndex = index;
    document.getElementById('vehicleFormTitle').innerText = 'تعديل المركبة';
    showPage('add-vehicle');
};

// حذف مركبة
window.deleteVehicle = function(index) {
    if (confirm('هل أنت متأكد من حذف هذه المركبة؟')) {
        appData.vehicles.splice(index, 1);
        saveData();
        renderVehicles();
        showNotification('تم حذف المركبة بنجاح');
    }
};

// عرض صفحة الخدمات لمركبة
function showVehicleService(index) {
    const v = appData.vehicles[index];
    document.getElementById('serviceVehicleTitle').innerHTML = `<i class="fas fa-car"></i> ${v.make} ${v.model}`;
    document.getElementById('vehicleInfoDisplay').innerHTML = `
        <i class="fas fa-id-card"></i> <strong>${v.make} ${v.model}</strong> | 
        <i class="fas fa-hashtag"></i> رقم: ${v.regNumber} | 
        <i class="fas fa-tachometer-alt"></i> آخر عداد: ${v.odometer} كم
    `;
    currentVehicleId = index;
    showPage('service');
}

// عرض التنبيهات بعد تحديث العداد
function showVehicleServiceWithAlerts(index) {
    const vehicle = appData.vehicles[index];
    let alerts = generateAlerts(vehicle);
    
    if (alerts.length > 0) {
        let alertMessage = '⚠️ التنبيهات الحالية:\n' + alerts.map(a => a.text).join('\n');
        alert(alertMessage);
    } else {
        alert('✅ لا توجد تنبيهات حالياً.');
    }
    
    showVehicleService(index);
}

// توليد التنبيهات بناءً على آخر سجل لكل عنصر
function generateAlerts(vehicle) {
    let alerts = [];

    // قطع الغيار: نأخذ آخر سجل لكل قطعة (بناءً على التاريخ)
    const sparePartsMap = new Map();
    vehicle.spareParts.forEach(p => {
        if (!sparePartsMap.has(p.name) || new Date(p.date) > new Date(sparePartsMap.get(p.name).date)) {
            sparePartsMap.set(p.name, p);
        }
    });
    const latestSpareParts = Array.from(sparePartsMap.values());
    
    latestSpareParts.forEach(p => {
        const used = vehicle.odometer - p.odo;
        const left = p.defaultKm - used;
        if (left < 50000 && left > 0) {
            alerts.push({ 
                text: `⚠️ قطعة ${p.name} تبقى لها ${left} كم (أقل من 50000 كم)`,
                type: 'spare',
                key: `spare-${p.name}`
            });
        } else if (left <= 0) {
            alerts.push({ 
                text: `🔴 قطعة ${p.name} انتهت صلاحيتها (تجاوزت ${p.defaultKm} كم)`,
                type: 'spare',
                key: `spare-${p.name}`
            });
        }
    });

    // التأمين: آخر سجل
    if (vehicle.insurance.length > 0) {
        const lastInsurance = vehicle.insurance.sort((a, b) => new Date(b.start) - new Date(a.start))[0];
        if (lastInsurance.end) {
            const today = new Date();
            const end = new Date(lastInsurance.end);
            const diff = Math.ceil((end - today) / (1000*60*60*24));
            if (diff < 5 && diff >= 0) {
                alerts.push({ text: `⚠️ التأمين سينتهي بعد ${diff} أيام`, type: 'insurance', key: 'insurance' });
            } else if (diff < 0) {
                alerts.push({ text: `🔴 التأمين منتهي الصلاحية`, type: 'insurance', key: 'insurance' });
            }
        }
    }

    // الفحص الفني: آخر سجل
    if (vehicle.technical.length > 0) {
        const lastTech = vehicle.technical.sort((a, b) => new Date(b.start) - new Date(a.start))[0];
        if (lastTech.end) {
            const today = new Date();
            const end = new Date(lastTech.end);
            const diff = Math.ceil((end - today) / (1000*60*60*24));
            if (diff < 5 && diff >= 0) {
                alerts.push({ text: `⚠️ الفحص الفني سينتهي بعد ${diff} أيام`, type: 'technical', key: 'technical' });
            } else if (diff < 0) {
                alerts.push({ text: `🔴 الفحص الفني منتهي الصلاحية`, type: 'technical', key: 'technical' });
            }
        }
    }

    // رخصة السياقة: آخر سجل
    if (vehicle.license.length > 0) {
        const lastLicense = vehicle.license.sort((a, b) => new Date(b.issue) - new Date(a.issue))[0];
        if (lastLicense.expiry) {
            const today = new Date();
            const end = new Date(lastLicense.expiry);
            const diff = Math.ceil((end - today) / (1000*60*60*24));
            if (diff < 5 && diff >= 0) {
                alerts.push({ text: `⚠️ رخصة السياقة ستنتهي بعد ${diff} أيام`, type: 'license', key: 'license' });
            } else if (diff < 0) {
                alerts.push({ text: `🔴 رخصة السياقة منتهية الصلاحية`, type: 'license', key: 'license' });
            }
        }
    }

    return alerts;
}

// دوال النافذة المنبثقة للصور
function openModal(imgSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = 'block';
    modalImg.src = imgSrc;
}

function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
}

// ================================ أحداث ================================
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // إغلاق النافذة المنبثقة عند النقر خارجها
    window.onclick = function(event) {
        const modal = document.getElementById('imageModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // تسجيل الدخول
    document.getElementById('loginBtn').addEventListener('click', () => {
        const user = document.getElementById('loginUsername').value.trim();
        const pass = document.getElementById('loginPassword').value;
        const found = appData.users.find(u => u.username === user && u.password === pass);
        if (found) {
            currentUser = { username: user, password: pass };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.getElementById('logoutBtn').style.display = 'inline-block';
            showPage('vehicles');
            renderVehicles();
            showNotification(`مرحباً ${user} 👋`);
        } else {
            showNotification('اسم المستخدم أو كلمة المرور غير صحيحة', true);
        }
    });

    // خروج
    document.getElementById('logoutBtn').addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('logoutBtn').style.display = 'none';
        showPage('login');
        showNotification('تم تسجيل الخروج');
    });

    // رابط تغيير كلمة المرور
    document.getElementById('forgotLink').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('change-password');
    });

    // إلغاء تغيير كلمة المرور
    document.getElementById('cancelPasswordBtn').addEventListener('click', () => {
        showPage('login');
    });

    // حفظ تغيير كلمة المرور
    document.getElementById('savePasswordBtn').addEventListener('click', () => {
        const oldU = document.getElementById('oldUsername').value.trim();
        const oldP = document.getElementById('oldPassword').value;
        const newU = document.getElementById('newUsername').value.trim();
        const newP = document.getElementById('newPassword').value;
        const conf = document.getElementById('confirmPassword').value;

        if (!oldU || !oldP || !newU || !newP || !conf) {
            showNotification('املأ جميع الحقول', true);
            return;
        }
        if (newP !== conf) {
            showNotification('كلمة المرور غير متطابقة', true);
            return;
        }
        const idx = appData.users.findIndex(u => u.username === oldU && u.password === oldP);
        if (idx === -1) {
            showNotification('البيانات القديمة غير صحيحة', true);
            return;
        }
        appData.users[idx] = { username: newU, password: newP };
        saveData();
        showNotification('تم تغيير بيانات الدخول بنجاح');
        showPage('login');
    });

    // رجوع من المركبات إلى تسجيل الدخول
    document.getElementById('backFromVehiclesToLogin').addEventListener('click', () => {
        showPage('login');
    });

    // إضافة مركبة جديدة
    document.getElementById('addVehicleBtn').addEventListener('click', () => {
        document.getElementById('vehicleDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('vehicleReg').value = '';
        document.getElementById('vehicleMake').value = '';
        document.getElementById('vehicleModel').innerHTML = '<option value="">اختر الاسم</option>';
        document.getElementById('vehicleFuel').value = 'بنزين';
        document.getElementById('vehicleOdometer').value = '0';
        delete document.getElementById('saveVehicleBtn').dataset.editIndex;
        document.getElementById('vehicleFormTitle').innerText = 'إضافة مركبة جديدة';
        showPage('add-vehicle');
    });

    // تغيير النوع -> تحديث الموديلات
    document.getElementById('vehicleMake').addEventListener('change', updateModels);

    // إلغاء إضافة مركبة
    document.getElementById('cancelAddVehicle').addEventListener('click', () => {
        showPage('vehicles');
        renderVehicles();
    });

    // حفظ المركبة
    document.getElementById('saveVehicleBtn').addEventListener('click', () => {
        const date = document.getElementById('vehicleDate').value;
        const reg = document.getElementById('vehicleReg').value.trim();
        const make = document.getElementById('vehicleMake').value;
        const model = document.getElementById('vehicleModel').value;
        const fuel = document.getElementById('vehicleFuel').value;
        const odo = parseInt(document.getElementById('vehicleOdometer').value) || 0;

        if (!reg || !make || !model) {
            showNotification('يرجى ملء البيانات الأساسية', true);
            return;
        }

        const vehicle = {
            date, regNumber: reg, make, model, fuel, odometer: odo,
            spareParts: [], oilChanges: [], fuelLogs: [],
            insurance: [], technical: [], license: []
        };

        const editIndex = document.getElementById('saveVehicleBtn').dataset.editIndex;
        if (editIndex !== undefined) {
            const old = appData.vehicles[editIndex];
            vehicle.spareParts = old.spareParts || [];
            vehicle.oilChanges = old.oilChanges || [];
            vehicle.fuelLogs = old.fuelLogs || [];
            vehicle.insurance = old.insurance || [];
            vehicle.technical = old.technical || [];
            vehicle.license = old.license || [];
            appData.vehicles[editIndex] = vehicle;
        } else {
            appData.vehicles.push(vehicle);
        }
        saveData();
        showNotification('تم حفظ المركبة بنجاح');
        showPage('vehicles');
        renderVehicles();
    });

    // رجوع من صفحة الخدمات إلى قائمة المركبات
    document.getElementById('backFromServiceToVehicles').addEventListener('click', () => {
        showPage('vehicles');
        renderVehicles();
    });

    // أزرار الخدمات
    document.getElementById('btnSpareParts').addEventListener('click', () => {
        if (currentVehicleId === null) return;
        showPage('spare-parts');
        renderSpareParts();
    });
    document.getElementById('btnOilChange').addEventListener('click', () => {
        if (currentVehicleId === null) return;
        showPage('oil-change');
        renderOilChanges();
    });
    document.getElementById('btnInsurance').addEventListener('click', () => {
        if (currentVehicleId === null) return;
        showPage('insurance');
        renderInsurance();
    });
    document.getElementById('btnTechnical').addEventListener('click', () => {
        if (currentVehicleId === null) return;
        showPage('technical');
        renderTechnical();
    });
    document.getElementById('btnFuel').addEventListener('click', () => {
        if (currentVehicleId === null) return;
        showPage('fuel');
        renderFuelLogs();
    });
    document.getElementById('btnLicense').addEventListener('click', () => {
        if (currentVehicleId === null) return;
        showPage('license');
        renderLicense();
    });
    document.getElementById('btnNotifications').addEventListener('click', () => {
        if (currentVehicleId === null) return;
        showPage('notifications');
        loadNotifications();
    });
    document.getElementById('btnReports').addEventListener('click', () => {
        if (currentVehicleId === null) return;
        showPage('reports');
    });

    // أزرار الرجوع من الصفحات الفرعية
    document.getElementById('backFromSpare').addEventListener('click', () => showPage('service'));
    document.getElementById('backFromOil').addEventListener('click', () => showPage('service'));
    document.getElementById('backFromInsurance').addEventListener('click', () => showPage('service'));
    document.getElementById('backFromTech').addEventListener('click', () => showPage('service'));
    document.getElementById('backFromFuel').addEventListener('click', () => showPage('service'));
    document.getElementById('backFromLicense').addEventListener('click', () => showPage('service'));
    document.getElementById('backFromNotifications').addEventListener('click', () => showPage('service'));
    document.getElementById('backFromReports').addEventListener('click', () => showPage('service'));

    // ================== قطع الغيار ==================
    function renderSpareParts() {
        const vehicle = appData.vehicles[currentVehicleId];
        const list = document.getElementById('sparePartsList');
        const names = new Set();
        appData.vehicles.forEach(v => v.spareParts.forEach(p => names.add(p.name)));
        list.innerHTML = '';
        names.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n;
            list.appendChild(opt);
        });

        const container = document.getElementById('sparePartsTableContainer');
        if (!vehicle.spareParts || vehicle.spareParts.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">لا توجد قطع مسجلة.</p>';
            return;
        }
        // ترتيب تنازلي حسب التاريخ
        const sorted = [...vehicle.spareParts].sort((a, b) => new Date(b.date) - new Date(a.date));
        let html = '<div class="table-responsive"><table><tr><th>التاريخ</th><th>القطعة</th><th>العداد</th><th>الصلاحية</th><th>الصورة</th><th>حذف</th></tr>';
        sorted.forEach((p, idx) => {
            html += `<tr>
                <td>${p.date}</td>
                <td>${p.name}</td>
                <td>${p.odo}</td>
                <td>${p.defaultKm}</td>
                <td>${p.image ? `<img src="${p.image}" class="image-preview" onclick="openModal(this.src)">` : '-'}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteSparePart('${idx}')"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        });
        html += '</table></div>';
        container.innerHTML = html;
    }

    window.deleteSparePart = (idx) => {
        if (confirm('حذف هذا التسجيل؟')) {
            appData.vehicles[currentVehicleId].spareParts.splice(idx, 1);
            saveData();
            renderSpareParts();
            showNotification('تم الحذف');
        }
    };

    // معاينة صورة قطعة الغيار
    document.getElementById('spareImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const preview = document.getElementById('spareImagePreview');
                preview.src = ev.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById('spareImagePreview').style.display = 'none';
        }
    });

    document.getElementById('saveSpareBtn').addEventListener('click', () => {
        const date = document.getElementById('spareDate').value;
        const name = document.getElementById('spareName').value.trim();
        const odo = parseInt(document.getElementById('spareOdometer').value);
        const defaultKm = parseInt(document.getElementById('spareDefaultKm').value);
        const file = document.getElementById('spareImage').files[0];
        if (!date || !name || isNaN(odo) || isNaN(defaultKm)) {
            showNotification('املأ جميع البيانات', true);
            return;
        }
        const vehicle = appData.vehicles[currentVehicleId];
        const newPart = { date, name, odo, defaultKm, image: null };
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                newPart.image = e.target.result;
                vehicle.spareParts.push(newPart);
                saveData();
                showNotification('تم حفظ القطعة');
                document.getElementById('spareDate').value = '';
                document.getElementById('spareName').value = '';
                document.getElementById('spareOdometer').value = '';
                document.getElementById('spareDefaultKm').value = '';
                document.getElementById('spareImage').value = '';
                document.getElementById('spareImagePreview').style.display = 'none';
                renderSpareParts();
            };
            reader.readAsDataURL(file);
        } else {
            vehicle.spareParts.push(newPart);
            saveData();
            showNotification('تم حفظ القطعة');
            document.getElementById('spareDate').value = '';
            document.getElementById('spareName').value = '';
            document.getElementById('spareOdometer').value = '';
            document.getElementById('spareDefaultKm').value = '';
            document.getElementById('spareImagePreview').style.display = 'none';
            renderSpareParts();
        }
    });

    // ================== الزيوت ==================
    function renderOilChanges() {
        const vehicle = appData.vehicles[currentVehicleId];
        const container = document.getElementById('oilTableContainer');
        if (!vehicle.oilChanges || vehicle.oilChanges.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">لا توجد تغييرات زيت.</p>';
            return;
        }
        const sorted = [...vehicle.oilChanges].sort((a, b) => new Date(b.date) - new Date(a.date));
        let html = '<div class="table-responsive"><table><tr><th>التاريخ</th><th>النوع</th><th>العلامة</th><th>العداد</th><th>الصلاحية</th><th>فلتر</th><th>اللزوجة</th><th>حذف</th></tr>';
        sorted.forEach((o, idx) => {
            html += `<tr>
                <td>${o.date}</td>
                <td>${o.type}</td>
                <td>${o.brand}</td>
                <td>${o.odo}</td>
                <td>${o.defaultKm}</td>
                <td>${o.filter}</td>
                <td>${o.viscosity}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteOilChange('${idx}')"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        });
        html += '</table></div>';
        container.innerHTML = html;
    }

    window.deleteOilChange = (idx) => {
        if (confirm('حذف هذا التسجيل؟')) {
            appData.vehicles[currentVehicleId].oilChanges.splice(idx, 1);
            saveData();
            renderOilChanges();
            showNotification('تم الحذف');
        }
    };

    document.getElementById('saveOilBtn').addEventListener('click', () => {
        const date = document.getElementById('oilDate').value;
        const type = document.getElementById('oilType').value;
        const brand = document.getElementById('oilBrand').value;
        const odo = parseInt(document.getElementById('oilOdometer').value);
        const defaultKm = parseInt(document.getElementById('oilDefaultKm').value);
        const filter = document.getElementById('oilFilter').value;
        const viscosity = document.getElementById('oilViscosity').value;
        if (!date || isNaN(odo) || isNaN(defaultKm)) {
            showNotification('املأ جميع البيانات', true);
            return;
        }
        const vehicle = appData.vehicles[currentVehicleId];
        vehicle.oilChanges.push({ date, type, brand, odo, defaultKm, filter, viscosity });
        saveData();
        showNotification('تم حفظ تغيير الزيت');
        document.getElementById('oilDate').value = '';
        document.getElementById('oilOdometer').value = '';
        document.getElementById('oilDefaultKm').value = '';
        renderOilChanges();
    });

    // ================== التأمين ==================
    function renderInsurance() {
        const vehicle = appData.vehicles[currentVehicleId];
        const container = document.getElementById('insuranceTableContainer');
        if (!vehicle.insurance || vehicle.insurance.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">لا توجد سجلات تأمين.</p>';
            return;
        }
        const sorted = [...vehicle.insurance].sort((a, b) => new Date(b.start) - new Date(a.start));
        let html = '<div class="table-responsive"><table><tr><th>الشركة</th><th>النوع</th><th>تاريخ البداية</th><th>تاريخ النهاية</th><th>الصورة</th><th>حذف</th></tr>';
        sorted.forEach((ins, idx) => {
            html += `<tr>
                <td>${ins.company}</td>
                <td>${ins.type}</td>
                <td>${ins.start}</td>
                <td>${ins.end}</td>
                <td>${ins.image ? `<img src="${ins.image}" class="image-preview" onclick="openModal(this.src)">` : '-'}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteInsurance('${idx}')"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        });
        html += '</table></div>';
        container.innerHTML = html;
    }

    window.deleteInsurance = (idx) => {
        if (confirm('حذف هذا السجل؟')) {
            appData.vehicles[currentVehicleId].insurance.splice(idx, 1);
            saveData();
            renderInsurance();
            showNotification('تم الحذف');
        }
    };

    // معاينة صورة التأمين
    document.getElementById('insuranceImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const preview = document.getElementById('insuranceImagePreview');
                preview.src = ev.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById('insuranceImagePreview').style.display = 'none';
        }
    });

    document.getElementById('saveInsuranceBtn').addEventListener('click', () => {
        const company = document.getElementById('insuranceCompany').value;
        const type = document.getElementById('insuranceType').value;
        const start = document.getElementById('insuranceStart').value;
        const end = document.getElementById('insuranceEnd').value;
        const file = document.getElementById('insuranceImage').files[0];

        if (!company || !type || !start || !end) {
            showNotification('املأ جميع الحقول', true);
            return;
        }

        const vehicle = appData.vehicles[currentVehicleId];
        const insuranceData = { company, type, start, end, image: null };

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                insuranceData.image = e.target.result;
                vehicle.insurance.push(insuranceData);
                saveData();
                showNotification('تم حفظ التأمين مع الصورة');
                document.getElementById('insuranceImage').value = '';
                document.getElementById('insuranceImagePreview').style.display = 'none';
                clearInsuranceForm();
                renderInsurance();
            };
            reader.readAsDataURL(file);
        } else {
            vehicle.insurance.push(insuranceData);
            saveData();
            showNotification('تم حفظ التأمين');
            clearInsuranceForm();
            renderInsurance();
        }
    });

    function clearInsuranceForm() {
        document.getElementById('insuranceCompany').value = 'الخليجية';
        document.getElementById('insuranceType').value = 'شامل';
        document.getElementById('insuranceStart').value = '';
        document.getElementById('insuranceEnd').value = '';
    }

    // ================== الحالة التقنية ==================
    function renderTechnical() {
        const vehicle = appData.vehicles[currentVehicleId];
        const container = document.getElementById('techTableContainer');
        if (!vehicle.technical || vehicle.technical.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">لا توجد سجلات فحص فني.</p>';
            return;
        }
        const sorted = [...vehicle.technical].sort((a, b) => new Date(b.start) - new Date(a.start));
        let html = '<div class="table-responsive"><table><tr><th>تاريخ البداية</th><th>تاريخ النهاية</th><th>الصورة</th><th>حذف</th></tr>';
        sorted.forEach((tech, idx) => {
            html += `<tr>
                <td>${tech.start}</td>
                <td>${tech.end}</td>
                <td>${tech.image ? `<img src="${tech.image}" class="image-preview" onclick="openModal(this.src)">` : '-'}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteTechnical('${idx}')"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        });
        html += '</table></div>';
        container.innerHTML = html;
    }

    window.deleteTechnical = (idx) => {
        if (confirm('حذف هذا السجل؟')) {
            appData.vehicles[currentVehicleId].technical.splice(idx, 1);
            saveData();
            renderTechnical();
            showNotification('تم الحذف');
        }
    };

    // معاينة صورة الفحص
    document.getElementById('techImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const preview = document.getElementById('techImagePreview');
                preview.src = ev.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById('techImagePreview').style.display = 'none';
        }
    });

    document.getElementById('saveTechBtn').addEventListener('click', () => {
        const start = document.getElementById('techStart').value;
        const end = document.getElementById('techEnd').value;
        const file = document.getElementById('techImage').files[0];

        if (!start || !end) {
            showNotification('املأ التاريخ', true);
            return;
        }

        const vehicle = appData.vehicles[currentVehicleId];
        const techData = { start, end, image: null };

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                techData.image = e.target.result;
                vehicle.technical.push(techData);
                saveData();
                showNotification('تم الحفظ مع الصورة');
                document.getElementById('techImage').value = '';
                document.getElementById('techImagePreview').style.display = 'none';
                clearTechForm();
                renderTechnical();
            };
            reader.readAsDataURL(file);
        } else {
            vehicle.technical.push(techData);
            saveData();
            showNotification('تم الحفظ');
            clearTechForm();
            renderTechnical();
        }
    });

    function clearTechForm() {
        document.getElementById('techStart').value = '';
        document.getElementById('techEnd').value = '';
    }

    // ================== الوقود مع حساب الاستهلاك ==================
    function renderFuelLogs() {
        const vehicle = appData.vehicles[currentVehicleId];
        document.getElementById('fuelType').value = vehicle.fuel;
        const container = document.getElementById('fuelTableContainer');
        
        if (!vehicle.fuelLogs || vehicle.fuelLogs.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">لا توجد تسجيلات وقود.</p>';
            return;
        }

        let totalDistance = 0;
        let totalLiters = 0;
        let lastOdometer = null;
        
        const sortedLogs = [...vehicle.fuelLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let html = '<div class="table-responsive"><table><tr><th>التاريخ</th><th>العداد</th><th>التكلفة</th><th>السعر</th><th>اللترات</th><th>المسافة</th><th>كم/لتر</th><th>المحطة</th><th>حذف</th></tr>';
        
        sortedLogs.forEach((f, idx) => {
            const liters = (f.cost / f.price).toFixed(2);
            let distance = '-';
            let consumption = '-';
            
            if (lastOdometer !== null) {
                distance = f.odo - lastOdometer;
                if (distance > 0 && liters > 0) {
                    consumption = (distance / liters).toFixed(2);
                    totalDistance += distance;
                    totalLiters += parseFloat(liters);
                }
            }
            
            html += `<tr>
                <td>${f.date}</td>
                <td>${f.odo}</td>
                <td>${f.cost}</td>
                <td>${f.price}</td>
                <td>${liters}</td>
                <td>${distance !== '-' ? distance : '-'}</td>
                <td>${consumption !== '-' ? consumption : '-'}</td>
                <td>${f.station}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteFuelLog('${idx}')"><i class="fas fa-trash"></i></button></td>
            </tr>`;
            
            lastOdometer = f.odo;
        });
        
        html += '</table></div>';
        
        if (totalDistance > 0 && totalLiters > 0) {
            const avgConsumption = (totalDistance / totalLiters).toFixed(2);
            html = `<div class="average-consumption"><strong>⛽ متوسط الاستهلاك الكلي: ${avgConsumption} كم/لتر</strong></div>` + html;
        }
        
        container.innerHTML = html;
    }

    window.deleteFuelLog = (idx) => {
        if (confirm('حذف هذا التسجيل؟')) {
            appData.vehicles[currentVehicleId].fuelLogs.splice(idx, 1);
            saveData();
            renderFuelLogs();
            showNotification('تم الحذف');
        }
    };

    document.getElementById('saveFuelBtn').addEventListener('click', () => {
        const date = document.getElementById('fuelDate').value;
        const odo = parseInt(document.getElementById('fuelOdometer').value);
        const cost = parseFloat(document.getElementById('fuelCost').value);
        const price = parseFloat(document.getElementById('fuelPricePerLiter').value);
        const station = document.getElementById('fuelStation').value.trim();
        if (!date || isNaN(odo) || isNaN(cost) || isNaN(price) || !station) {
            showNotification('املأ جميع البيانات', true);
            return;
        }
        const vehicle = appData.vehicles[currentVehicleId];
        vehicle.fuelLogs.push({ date, odo, cost, price, station });
        saveData();
        showNotification('تم تسجيل التزود');
        document.getElementById('fuelDate').value = '';
        document.getElementById('fuelOdometer').value = '';
        document.getElementById('fuelCost').value = '';
        document.getElementById('fuelStation').value = '';
        renderFuelLogs();
    });

    // ================== رخصة السياقة ==================
    function renderLicense() {
        const vehicle = appData.vehicles[currentVehicleId];
        const container = document.getElementById('licenseTableContainer');
        if (!vehicle.license || vehicle.license.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">لا توجد سجلات رخصة.</p>';
            return;
        }
        const sorted = [...vehicle.license].sort((a, b) => new Date(b.issue) - new Date(a.issue));
        let html = '<div class="table-responsive"><table><tr><th>تاريخ الإصدار</th><th>تاريخ الانتهاء</th><th>الصورة</th><th>حذف</th></tr>';
        sorted.forEach((lic, idx) => {
            html += `<tr>
                <td>${lic.issue}</td>
                <td>${lic.expiry}</td>
                <td>${lic.image ? `<img src="${lic.image}" class="image-preview" onclick="openModal(this.src)">` : '-'}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteLicense('${idx}')"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        });
        html += '</table></div>';
        container.innerHTML = html;
    }

    window.deleteLicense = (idx) => {
        if (confirm('حذف هذا السجل؟')) {
            appData.vehicles[currentVehicleId].license.splice(idx, 1);
            saveData();
            renderLicense();
            showNotification('تم الحذف');
        }
    };

    // معاينة صورة الرخصة
    document.getElementById('licenseImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const preview = document.getElementById('licenseImagePreview');
                preview.src = ev.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById('licenseImagePreview').style.display = 'none';
        }
    });

    document.getElementById('saveLicenseBtn').addEventListener('click', () => {
        const issue = document.getElementById('licenseIssue').value;
        const expiry = document.getElementById('licenseExpiry').value;
        const file = document.getElementById('licenseImage').files[0];

        if (!issue || !expiry) {
            showNotification('املأ التاريخ', true);
            return;
        }

        const vehicle = appData.vehicles[currentVehicleId];
        const licenseData = { issue, expiry, image: null };

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                licenseData.image = e.target.result;
                vehicle.license.push(licenseData);
                saveData();
                showNotification('تم الحفظ مع الصورة');
                document.getElementById('licenseImage').value = '';
                document.getElementById('licenseImagePreview').style.display = 'none';
                clearLicenseForm();
                renderLicense();
            };
            reader.readAsDataURL(file);
        } else {
            vehicle.license.push(licenseData);
            saveData();
            showNotification('تم الحفظ');
            clearLicenseForm();
            renderLicense();
        }
    });

    function clearLicenseForm() {
        document.getElementById('licenseIssue').value = '';
        document.getElementById('licenseExpiry').value = '';
    }

    // ================== التنبيهات الذكية ==================
    function loadNotifications() {
        const vehicle = appData.vehicles[currentVehicleId];
        const container = document.getElementById('notificationsList');
        const alerts = generateAlerts(vehicle);

        if (alerts.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 30px;">✅ لا توجد تنبيهات حالياً. كل شيء على ما يرام.</p>';
        } else {
            let html = '';
            alerts.forEach((a, idx) => {
                html += `
                    <div class="notification-item">
                        <span>${a.text}</span>
                        <button class="btn btn-warning btn-sm" onclick="dismissAlert('${a.key}')"><i class="fas fa-check"></i> تم</button>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    }

    window.dismissAlert = (key) => {
        // في التنبيهات الذكية، الضغط على "تم" يعني أن المستخدم أصلح المشكلة
        // لذلك لا نحتاج لتخزينها، فقط نحدث التنبيهات بناءً على آخر البيانات
        loadNotifications();
        showNotification('تم تحديث التنبيهات');
    };

    // ================== تقرير PDF مع دعم العربية ==================
    document.getElementById('generateReportBtn').addEventListener('click', () => {
        try {
            const vehicle = appData.vehicles[currentVehicleId];
            
            if (!vehicle) {
                showNotification('لا توجد مركبة محددة', true);
                return;
            }
            
            const { jsPDF } = window.jspdf;
            
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                putOnlyUsedFonts: true,
                floatPrecision: 16
            });
            
            doc.setRTL(true);
            doc.setFont('Arial', 'normal');
            
            // العنوان
            doc.setFontSize(20);
            doc.setTextColor(0, 123, 255);
            doc.text(`تقرير صيانة المركبة`, 10, 15);
            
            // معلومات السيارة
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`المركبة: ${vehicle.make} ${vehicle.model}`, 10, 25);
            doc.text(`رقم التسجيل: ${vehicle.regNumber}`, 10, 32);
            doc.text(`آخر عداد: ${vehicle.odometer} كم`, 10, 39);
            doc.text(`نوع الوقود: ${vehicle.fuel}`, 10, 46);
            
            let y = 55;
            
            // قطع الغيار
            if (vehicle.spareParts && vehicle.spareParts.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(0, 123, 255);
                doc.text('قطع الغيار المستبدلة:', 10, y);
                y += 7;
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                
                const latestSpares = vehicle.spareParts.slice(-5); // آخر 5 قطع
                latestSpares.forEach(p => {
                    doc.text(`• ${p.name} - التاريخ: ${p.date} - العداد: ${p.odo} كم - الصلاحية: ${p.defaultKm} كم`, 15, y);
                    y += 6;
                    if (y > 280) { doc.addPage(); y = 20; }
                });
                y += 5;
            }
            
            // آخر تغيير زيت
            if (vehicle.oilChanges && vehicle.oilChanges.length > 0) {
                const lastOil = vehicle.oilChanges.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
                if (y > 260) { doc.addPage(); y = 20; }
                doc.setFontSize(14);
                doc.setTextColor(0, 123, 255);
                doc.text('آخر تغيير زيت:', 10, y);
                y += 7;
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text(`• ${lastOil.type} - ${lastOil.brand} - التاريخ: ${lastOil.date} - العداد: ${lastOil.odo} كم`, 15, y);
                y += 7;
            }
            
            // التأمين الحالي
            if (vehicle.insurance && vehicle.insurance.length > 0) {
                const lastIns = vehicle.insurance.sort((a,b) => new Date(b.start) - new Date(a.start))[0];
                if (y > 260) { doc.addPage(); y = 20; }
                doc.setFontSize(14);
                doc.setTextColor(0, 123, 255);
                doc.text('التأمين الحالي:', 10, y);
                y += 7;
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text(`الشركة: ${lastIns.company} - النوع: ${lastIns.type}`, 15, y);
                y += 5;
                doc.text(`من: ${lastIns.start} إلى: ${lastIns.end}`, 15, y);
                y += 7;
            }
            
            // الفحص الفني
            if (vehicle.technical && vehicle.technical.length > 0) {
                const lastTech = vehicle.technical.sort((a,b) => new Date(b.start) - new Date(a.start))[0];
                if (y > 260) { doc.addPage(); y = 20; }
                doc.setFontSize(14);
                doc.setTextColor(0, 123, 255);
                doc.text('آخر فحص فني:', 10, y);
                y += 7;
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text(`من: ${lastTech.start} إلى: ${lastTech.end}`, 15, y);
                y += 7;
            }
            
            // رخصة السياقة
            if (vehicle.license && vehicle.license.length > 0) {
                const lastLic = vehicle.license.sort((a,b) => new Date(b.issue) - new Date(a.issue))[0];
                if (y > 260) { doc.addPage(); y = 20; }
                doc.setFontSize(14);
                doc.setTextColor(0, 123, 255);
                doc.text('رخصة السياقة:', 10, y);
                y += 7;
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text(`تاريخ الإصدار: ${lastLic.issue}`, 15, y);
                y += 5;
                doc.text(`تاريخ الانتهاء: ${lastLic.expiry}`, 15, y);
                y += 7;
            }
            
            doc.save(`تقرير_${vehicle.make}_${vehicle.model}.pdf`);
            showNotification('✅ تم إنشاء التقرير بنجاح');
            
        } catch (error) {
            console.error('PDF Error:', error);
            showNotification('حدث خطأ في إنشاء التقرير', true);
        }
    });
});